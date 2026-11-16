import { spawn, type ChildProcess } from "node:child_process";
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

describe.skipIf(process.platform === "win32")("runtime without built-in automation", () => {
  beforeAll(async () => {
    home = mkdtempSync(join(tmpdir(), "omb-no-automation-"));
    const data = join(home, ".openmausbot");
    mkdirSync(data);
    dump = join(home, "turn.json");
    const cli = join(home, "fake-claude.mjs");
    writeFileSync(cli, `#!${process.execPath}\nawait import(${JSON.stringify(pathToFileURL(join(serverDir, "testing/fake-claude-cli.ts")).href)});\n`);
    chmodSync(cli, 0o755);
    writeFileSync(join(data, "config.json"), JSON.stringify({ browserEngine: { legacy: true }, localVm: { mode: "pool" }, box: { token: "synthetic-old" }, features: { browser: true, sharedComputers: true, savedSteps: true }, instances: { claude: { driver: "claudeAgent", config: { cli }, environment: { FAKE_CLAUDE_DUMP: dump, FAKE_CLAUDE_TOOL_CALLS: "[]" } } } }));
    const now = Date.now();
    writeFileSync(join(data, "bots.json"), JSON.stringify([{ id: botId, threadId, name: "Legacy", title: "", description: "", soul: "", color: "#123456", createdAt: now,
      modelSelection: { instanceId: "claude", model: "claude-fake" }, resumeCursors: {}, computer: "cloud", browser: true, browserProfile: "deleted-profile", cloudBackend: "vps", autoStartVps: true,
      tasks: [{ threadId, title: "Legacy task", createdAt: now, updatedAt: now, resumeCursors: {}, surface: "vm", surfaceSource: "user" }],
    }]));
    const port = await freePortBlock([0, 1]);
    base = `http://127.0.0.1:${port}`;
    child = spawn(process.execPath, [join(serverDir, "index.ts")], { cwd: join(serverDir, ".."), env: {
      PATH: process.env.PATH, HOME: home, USERPROFILE: home, OMB_PORT: String(port), OMB_WEBHOOK_PORT: String(port + 1), DWEB_URL: "http://127.0.0.1:1",
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

  it("refuses retired transports before they can mount or power a computer", async () => {
    for (const path of ["/api/computers", `/api/bots/${botId}/computer/provision`, `/api/bots/${botId}/browser`, "/api/internal/browser/mcp", "/api/internal/computer/select", "/api/internal/vm-exec", "/api/internal/cloud-computer/reset", "/api/desktop/shared-computer-control"]) {
      const result = await api("POST", path, {});
      expect(result.status, path).toBe(410);
      expect(result.body.code).toBe("automation_retired");
    }
  });

  it("does not advertise retired configuration or allow stale settings to restore it", async () => {
    const bots = (await api("GET", "/api/bots?messages=0")).body.bots;
    const bot = bots.find((one: { id: string }) => one.id === botId);
    for (const field of ["computer", "cloudBackend", "autoStartVps", "browser", "browserProfile"]) expect(bot).not.toHaveProperty(field);
    expect(bot.tasks[0]).not.toHaveProperty("surface");
    const result = await api("GET", "/api/config");
    expect(result.status).toBe(200);
    for (const field of ["box", "vps", "localVm", "browserProfiles", "browserEngine"]) expect(result.body).not.toHaveProperty(field);
    for (const field of ["browser", "sharedComputers", "savedSteps", "savedStepsHere"]) expect(result.body.features).not.toHaveProperty(field);
    for (const patch of [{ browserEngine: {} }, { features: { browser: true } }]) expect((await api("PATCH", "/api/config", patch)).status).toBe(410);
  });

  it("rejects automation patches without rejecting ordinary bot edits", async () => {
    for (const patch of [{ computer: "local" }, { browser: true }, { cloudBackend: "vps" }, { autoStartVps: true }, { recordBrowserSteps: true }]) {
      expect((await api("PATCH", `/api/bots/${botId}`, patch)).status).toBe(410);
    }
    expect((await api("PATCH", `/api/bots/${botId}`, { title: "Shell and files" })).status).toBe(200);
    expect((await api("POST", "/api/routines", { name: "Retired", botId, prompt: "test", runOn: "cloud" })).status).toBe(410);
  });

  it("omits automation prompt sections and dispatches a legacy task with ordinary workspace tools", async () => {
    const preview = await api("GET", `/api/bots/${botId}/system-prompt`);
    expect(preview.status).toBe(200);
    for (const section of preview.body.sections) expect(["computer", "team-computer", "plan", "cloud-home", "browser"]).not.toContain(section.id);
    const sent = await api("POST", `/api/bots/${botId}/messages`, { text: "Describe the workspace files briefly.", threadId });
    expect(sent.status, JSON.stringify(sent.body)).toBe(202);
    await expect.poll(() => existsSync(dump), { timeout: 25_000 }).toBe(true);
    const turn = JSON.parse(readFileSync(dump, "utf8"));
    const servers = turn.mcpConfig?.mcpServers ?? {};
    expect(servers).toHaveProperty("agents");
    expect(servers).not.toHaveProperty("browser");
    expect(servers).not.toHaveProperty("computer");
    expect(servers).not.toHaveProperty("dweb");
    expect(turn.cwd).toContain(home);
    expect(log).not.toContain("cloud computer could not");
  }, 35_000);

  it("dispatches a room turn without automation mounts", async () => {
    await expect.poll(async () => {
      const bots = (await api("GET", "/api/bots?messages=0")).body.bots;
      return bots.find((bot: { id: string }) => bot.id === botId)?.busy === true;
    }, { timeout: 20_000 }).toBe(false);
    const created = await api("POST", "/api/groups", { name: "Workspace room", memberIds: [botId] });
    expect(created.status, JSON.stringify(created.body)).toBe(201);
    const group = created.body.group;
    expect((await api("PATCH", `/api/groups/${group.id}/setup`, { action: "skip" })).status).toBe(200);
    const sent = await api("POST", `/api/groups/${group.id}/messages`, { text: "@Legacy room-removal-marker: describe the workspace.", threadId: group.threadId });
    expect(sent.status, JSON.stringify(sent.body)).toBe(202);
    await expect.poll(() => JSON.stringify(JSON.parse(readFileSync(dump, "utf8")).prompt).includes("room-removal-marker"), { timeout: 25_000 }).toBe(true);
    const turn = JSON.parse(readFileSync(dump, "utf8"));
    expect(turn.mcpConfig.mcpServers).toHaveProperty("agents");
    for (const name of ["computer", "browser", "dweb"]) expect(turn.mcpConfig.mcpServers).not.toHaveProperty(name);
  }, 35_000);
});
