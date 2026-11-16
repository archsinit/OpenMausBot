import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { removeTempDir, waitForExit } from "./testing/cleanup.ts";
import { freePortBlock } from "./testing/ports.ts";

const serverDir = dirname(fileURLToPath(import.meta.url));
let child: ChildProcess | undefined;
let home = "";
let base = "";
let dump = "";
let log = "";
const botId = "legacy-automation";
const threadId = "legacy-thread";
const api = async (method: string, path: string, body?: unknown): Promise<{ status: number; body: any }> => {
  const response = await fetch(base + path, { method, headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, body: await response.json() };
};

describe.skipIf(process.platform === "win32")("lean runtime preserves chat and app tools", () => {
  beforeAll(async () => {
    home = mkdtempSync(join(tmpdir(), "omb-lean-"));
    const data = join(home, ".openmausbot");
    mkdirSync(data);
    dump = join(home, "turn.json");
    const cli = join(home, "fake-claude.mjs");
    writeFileSync(cli, `#!${process.execPath}\nawait import(${JSON.stringify(pathToFileURL(join(serverDir, "testing/fake-claude-cli.ts")).href)});\n`);
    chmodSync(cli, 0o755);
    writeFileSync(join(data, "config.json"), JSON.stringify({ browserEngine: { legacy: true }, localVm: { mode: "pool" }, box: { token: "synthetic-old" }, features: { browser: true, sharedComputers: true, savedSteps: true, usbPhoneTakeover: true }, decider: { provider: "custom", enabled: true, customKey: "synthetic", customBaseUrl: "http://127.0.0.1:1", customModel: "legacy" }, helper: { instanceId: "claude", model: "paid-specialist" }, instances: { claude: { driver: "claudeAgent", config: { cli }, environment: { FAKE_CLAUDE_DUMP: dump, FAKE_CLAUDE_TOOL_CALLS: "[]" } } } }));
    const now = Date.now();
    writeFileSync(join(data, "bots.json"), JSON.stringify([{ id: botId, threadId, name: "Legacy", title: "", description: "", soul: "", color: "#123456", createdAt: now,
      modelSelection: { instanceId: "claude", model: "claude-fake" }, resumeCursors: {}, phoneApps: { notifications: true, messages: true }, computer: "cloud", browser: true, browserProfile: "deleted-profile", cloudBackend: "vps", autoStartVps: true,
      tasks: [{ threadId, title: "Legacy task", createdAt: now, updatedAt: now, resumeCursors: {}, surface: "vm", surfaceSource: "user" }],
    }]));
    const port = await freePortBlock([0, 1]);
    base = `http://127.0.0.1:${port}`;
    child = spawn(process.execPath, [join(serverDir, "index.ts")], { cwd: join(serverDir, ".."), env: {
      PATH: process.env.PATH, HOME: home, USERPROFILE: home, OMB_PORT: String(port), OMB_WEBHOOK_PORT: String(port + 1), DWEB_URL: "http://127.0.0.1:1", OMB_ADB_PATH: "/missing/legacy-adb", PH_ANDROID_SERIAL: "legacy", OMB_HELPER_INSTANCE: "claude", OMB_HELPER_MODEL: "paid-specialist",
    }, stdio: ["ignore", "pipe", "pipe"] });
    child.stdout!.on("data", chunk => { log += chunk; });
    child.stderr!.on("data", chunk => { log += chunk; });
    const deadline = Date.now() + 40_000;
    for (;;) {
      if (child.exitCode !== null) throw new Error(log);
      try { if ((await fetch(base + "/api/health")).ok) break; } catch {}
      if (Date.now() > deadline) throw new Error(log);
      await new Promise(resolve => setTimeout(resolve, 150));
    }
  }, 50_000);

  afterAll(async () => { await waitForExit(child, { signal: "SIGTERM" }); if (home) await removeTempDir(home); });


  it("keeps mobile pairing and push routes separate from phone automation", async () => {
    expect((await api("GET", "/api/auth/pairing")).status).toBe(200);
    expect((await api("GET", "/api/push/device")).status).toBe(403);
    const config = (await api("GET", "/api/config")).body;
    expect(config).not.toHaveProperty("decider");
    expect(config).not.toHaveProperty("helpers");
    expect(config.features).not.toHaveProperty("usbPhoneTakeover");
    expect(config.toolGroups).not.toContain("data");
    const native = (await api("GET", "/api/connectors/tools")).body.services;
    expect(Object.keys(native ?? {}).every(key => key === "email")).toBe(true);
    for (const patch of [{ decider: { enabled: true } }, { features: { usbPhoneTakeover: true } }]) {
      expect((await api("PATCH", "/api/config", patch)).status).toBe(410);
    }
    for (const path of ["/api/phones", "/api/internal/phone/claim", "/api/internal/device/mcp", "/api/internal/data/mcp"]) {
      expect((await api("POST", path, {})).status, path).toBe(410);
    }
  });

  it("mounts neither phone, device nor data on the first turn while keeping app tools", async () => {
    const preview = await api("GET", `/api/bots/${botId}/system-prompt`);
    expect(preview.status).toBe(200);
    for (const section of preview.body.sections) expect(["phone", "phones", "data", "phone-link"]).not.toContain(section.id);
    expect((await api("POST", `/api/bots/${botId}/messages`, { text: "@devs Describe the workspace.", threadId })).status).toBe(202);
    await expect.poll(() => existsSync(dump), { timeout: 25_000 }).toBe(true);
    const turn = JSON.parse(readFileSync(dump, "utf8"));
    const servers = turn.mcpConfig?.mcpServers ?? {};
    expect(servers).toHaveProperty("agents");
    for (const key of ["phone", "device", "data", "computer", "browser", "dweb"]) expect(servers).not.toHaveProperty(key);
    const script = `
      const {spawn} = require("node:child_process");
      const server = JSON.parse(process.argv[1]);
      const child = spawn(server.command, server.args, {env: {...process.env, ...server.env}});
      let buffer = "";
      child.stdout.on("data", chunk => {
        buffer += chunk;
        for (const line of buffer.split("\\n").slice(0, -1)) {
          let reply; try { reply = JSON.parse(line); } catch { continue; }
          if (reply.id === 1) { process.stdout.write(JSON.stringify(reply)); child.kill(); process.exit(0); }
        }
        buffer = buffer.slice(buffer.lastIndexOf("\\n") + 1);
      });
      child.stdin.write(JSON.stringify({jsonrpc: "2.0", id: 1, method: "tools/list", params: {}}) + "\\n");
    `;
    const listed = spawnSync(process.execPath, ["-e", script, JSON.stringify(servers.agents)], { encoding: "utf8", timeout: 15_000 });
    expect(listed.status, listed.stderr).toBe(0);
    const names = JSON.parse(listed.stdout).result.tools.map((tool: { name: string }) => tool.name);
    for (const name of ["show_widget", "show_html", "publish_page"]) expect(names).toContain(name);
    for (const name of ["decide", "extract", "report_bug"]) expect(names).not.toContain(name);
    expect(log).not.toContain("Data tools unavailable");
    expect(existsSync(join(home, ".openmausbot", "devs-reports.json"))).toBe(false);
  }, 45_000);

  it("lets a paired mobile chat session send without restoring automation, retaining cookie origin checks", async () => {
    const opened = await api("POST", "/api/auth/pairing", { label: "Mobile chat", scopes: ["client"] });
    expect(opened.status).toBe(200);
    const paired = await api("POST", "/api/auth/pair", { code: opened.body.code, label: "Mobile chat" });
    expect(paired.status).toBe(200);
    expect(paired.body.token).toMatch(/^omb_sess_/);
    const headers = { "content-type": "application/json", origin: base, authorization: `Bearer ${paired.body.token}` };
    const session = await fetch(base + "/api/auth/session", { headers });
    expect(session.status).toBe(200);
    const path = `/api/bots/${botId}/messages`;
    const body = JSON.stringify({ text: "paired-mobile-chat-marker: describe the workspace", threadId });
    const invalid = await fetch(base + path, { method: "POST", headers: { ...headers, authorization: "Bearer omb_sess_invalid" }, body });
    expect(invalid.status).toBe(401);
    const cookieWindow = await api("POST", "/api/auth/pairing", { label: "Mobile browser", scopes: ["client"] });
    expect(cookieWindow.status).toBe(200);
    const browser = await fetch(base + "/api/auth/pair", { method: "POST", headers: { "content-type": "application/json", origin: base }, body: JSON.stringify({ code: cookieWindow.body.code, cookie: true }) });
    expect(browser.status).toBe(200);
    const cookie = browser.headers.get("set-cookie")!.split(";", 1)[0]!;
    const crossSite = await fetch(base + path, { method: "POST", headers: { "content-type": "application/json", cookie, origin: "https://other.invalid" }, body });
    expect(crossSite.status).toBe(403);
    expect((await fetch(base + "/api/auth/session", { headers: { cookie, origin: base } })).status).toBe(200);
    const sent = await fetch(base + path, { method: "POST", headers, body });
    expect(sent.status, await sent.text()).toBe(202);
    await expect.poll(() => existsSync(dump) && readFileSync(dump, "utf8").includes("paired-mobile-chat-marker"), { timeout: 25_000 }).toBe(true);
    const turn = JSON.parse(readFileSync(dump, "utf8"));
    expect(turn.mcpConfig.mcpServers).toHaveProperty("agents");
    for (const name of ["phone", "device", "data"]) expect(turn.mcpConfig.mcpServers).not.toHaveProperty(name);
    await expect.poll(async () => (await api("GET", "/api/bots?messages=0")).body.bots.find((bot: { id: string }) => bot.id === botId)?.busy === true, { timeout: 15_000 }).toBe(false);
  }, 45_000);

});
