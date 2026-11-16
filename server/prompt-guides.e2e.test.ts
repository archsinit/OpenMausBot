import { spawn, type ChildProcess } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { removeTempDir, waitForExit } from "./testing/cleanup.ts";
import { freePortBlock } from "./testing/ports.ts";
import { CREDENTIAL_PROMPT, TRIGGER_PROMPT } from "./system-prompt.ts";

const serverDir = dirname(fileURLToPath(import.meta.url));
const botId = "guide-fixture", threadId = "guide-thread";
let home = "", base = "", dump = "", log = "";
let child: ChildProcess | undefined;
const api = async (method: string, path: string, body?: unknown) => {
  const response = await fetch(base + path, { method, headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, body: await response.json() as any };
};
const readDump = () => JSON.parse(readFileSync(dump, "utf8"));

describe.skipIf(process.platform === "win32")("indexed guides in actual direct/room dispatch", () => {
  beforeAll(async () => {
    home = mkdtempSync(join(tmpdir(), "omb-context-guides-"));
    const data = join(home, ".openmausbot"); mkdirSync(data);
    const memory = join(data, "workspaces", botId); mkdirSync(memory, { recursive: true });
    writeFileSync(join(memory, "MEMORY.md"), "# Memory\n- The person wants email drafts only, never automatic sends.\n");
    dump = join(home, "turn.json");
    const cli = join(home, "fake-claude.mjs");
    writeFileSync(cli, `#!${process.execPath}\nawait import(${JSON.stringify(pathToFileURL(join(serverDir, "testing/fake-claude-cli.ts")).href)});\n`); chmodSync(cli, 0o755);
    writeFileSync(join(data, "config.json"), JSON.stringify({ everyBotRules: "Keep the authored global rule verbatim.", profile: { aboutMe: "The person's preferred output is CSV." }, instances: { claude: { driver: "claudeAgent", config: { cli }, environment: { FAKE_CLAUDE_DUMP: dump, FAKE_CLAUDE_TOOL_CALLS: "[]" } } } }));
    const now = Date.now();
    writeFileSync(join(data, "bots.json"), JSON.stringify([{ id: botId, threadId, name: "Guide", title: "Tester", description: "An existing configured bot", soul: "Keep the authored standing constraint verbatim.", color: "#123456", createdAt: now, chiefOfStaff: true, modelSelection: { instanceId: "claude", model: "claude-fake" }, resumeCursors: {}, tasks: [{ threadId, title: "Guide test", createdAt: now, updatedAt: now, resumeCursors: {} }] }]));
    const port = await freePortBlock([0, 1]); base = `http://127.0.0.1:${port}`;
    child = spawn(process.execPath, [join(serverDir, "index.ts")], { cwd: join(serverDir, ".."), env: { PATH: process.env.PATH, HOME: home, USERPROFILE: home, OMB_PORT: String(port), OMB_WEBHOOK_PORT: String(port + 1), OMB_DISABLE_MODEL_MANIFEST_FETCH: "1", OMB_DISABLE_ANNOUNCEMENTS: "1" }, stdio: ["ignore", "pipe", "pipe"] });
    child.stdout!.on("data", data => { log += data; }); child.stderr!.on("data", data => { log += data; });
    const deadline = Date.now() + 40_000;
    for (;;) {
      if (child.exitCode !== null) throw new Error(log);
      try { if ((await fetch(base + "/api/health")).ok) break; } catch {}
      if (Date.now() > deadline) throw new Error(log);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }, 50_000);
  afterAll(async () => { await waitForExit(child, { signal: "SIGTERM" }); if (home) await removeTempDir(home); });

  it("keeps authored content and safety, while indexing readable optional manuals", async () => {
    const preview = await api("GET", `/api/bots/${botId}/system-prompt`);
    expect(preview.status).toBe(200);
    const text = preview.body.sections.map((part: { text: string }) => part.text).join("");
    for (const value of ["Keep the authored global rule verbatim.", "Keep the authored standing constraint verbatim.", "The person's preferred output is CSV.", "email drafts only, never automatic sends", "never ask the user to paste credentials into chat", "Full Access does not grant another bot broader permissions"]) expect(text).toContain(value);
    expect(text).not.toContain(TRIGGER_PROMPT.trim());
    expect(text).not.toContain(CREDENTIAL_PROMPT.trim());
    const part = preview.body.sections.find((one: { id: string }) => one.id === "prompt-guides");
    const path = JSON.parse(part.text.match(/Task guides: read (".*?") and/)[1]);
    expect(existsSync(path)).toBe(true);
    for (const file of ["coordination-chief.md", "coordination-peers.md", "coordination-room.md", "automations.md", "credentials.md", "threads.md", "widgets.md", "skills.md", "profile.md", "team-memory.md", "shell.md", "shell-vm.md"]) expect(existsSync(join(dirname(path), file))).toBe(true);
    expect((await api("POST", `/api/bots/${botId}/messages`, { text: "Hi", threadId })).status).toBe(202);
    await expect.poll(() => existsSync(dump), { timeout: 25_000 }).toBe(true);
    const sent = readDump();
    expect(sent.systemPrompt).toContain(path);
    expect(sent.cwd).not.toBe(dirname(path));
    expect(sent.systemPrompt.length).toBeLessThan(24_000);
  }, 35_000);

  it("provides inline workflow instructions when scope excludes every native reader", async () => {
    await expect.poll(async () => (await api("GET", "/api/bots?messages=0")).body.bots.find((bot: { id: string }) => bot.id === botId)?.busy === true, { timeout: 20_000 }).toBe(false);
    expect((await api("PATCH", `/api/bots/${botId}`, { toolScope: { allow: ["mcp:agents:*"] } })).status).toBe(200);
    const preview = await api("GET", `/api/bots/${botId}/system-prompt`);
    expect(preview.body.sections.some((part: { id: string }) => part.id === "prompt-guides")).toBe(false);
    expect(preview.body.sections.map((part: { text: string }) => part.text).join("")).toContain(TRIGGER_PROMPT.trim());
    expect((await api("PATCH", `/api/bots/${botId}`, { toolScope: null })).status).toBe(200);
  });

  it("uses the same static catalog from rooms without losing their shared bulletin", async () => {
    const created = await api("POST", "/api/groups", { name: "Guide room", memberIds: [botId] }); expect(created.status).toBe(201);
    const group = created.body.group;
    expect((await api("PATCH", `/api/groups/${group.id}/setup`, { action: "complete", cwd: null, defaultResponder: { kind: "mentions" }, bulletin: "Keep the room-authored constraint verbatim." })).status).toBe(200);
    const sent = await api("POST", `/api/groups/${group.id}/messages`, { text: "@Guide guide-room-marker: hello", threadId: group.threadId }); expect(sent.status).toBe(202);
    await expect.poll(() => JSON.stringify(readDump().prompt).includes("guide-room-marker"), { timeout: 25_000 }).toBe(true);
    const prompt = readDump().systemPrompt;
    expect(prompt).toContain("prompt-guides"); expect(prompt).toContain("Guide room");
    expect(prompt).toContain("Keep the room-authored constraint verbatim.");
    expect(prompt).not.toContain(TRIGGER_PROMPT.trim());
    expect(prompt).toContain("Keep the authored standing constraint verbatim.");
  }, 35_000);
});
