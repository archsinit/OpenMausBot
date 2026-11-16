import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import extension, { StdioMcp, toTypebox } from "./pi-mcp-extension.ts";
import { removeTempDir } from "../testing/cleanup.ts";

type Api = Parameters<typeof extension>[0];
type Tool = Parameters<Api["registerTool"]>[0];
const dirs: string[] = [];
const shutdowns: Array<() => unknown> = [];
const originalConfig = process.env.OMB_MCP_CONFIG;
afterEach(async () => {
  for (const shutdown of shutdowns.splice(0)) await shutdown();
  vi.restoreAllMocks();
  for (const dir of dirs.splice(0)) await removeTempDir(dir);
  if (originalConfig === undefined) delete process.env.OMB_MCP_CONFIG;
  else process.env.OMB_MCP_CONFIG = originalConfig;
});

const schema = { type: "object", properties: { id: { type: "string", description: "Exact ID" } }, required: ["id"], additionalProperties: false };
async function fixture(options: { scope?: unknown; legacy?: boolean; directory?: boolean; agents?: boolean; collision?: boolean } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "omb-pi-loading-"));
  dirs.push(dir);
  const tools: Tool[] = [];
  const handlers = new Map<string, Array<Parameters<Api["on"]>[1]>>();
  let active = ["read", "bash", "edit", "write", "another_extension"];
  const call = vi.spyOn(StdioMcp.prototype, "callTool").mockResolvedValue({ content: [{ type: "text", text: "called" }], isError: false });
  vi.spyOn(StdioMcp.prototype, "init").mockResolvedValue();
  vi.spyOn(StdioMcp.prototype, "listTools").mockResolvedValue(options.collision ? [
    { name: "tools", description: "Original custom tool", inputSchema: schema },
  ] : options.agents ? [
    { name: "show_html", description: "Show or update HTML", inputSchema: schema },
    { name: "update_html", description: "Update HTML", inputSchema: schema },
  ] : options.directory ? [
    { name: "search_tools", description: "Search email catalog", inputSchema: schema },
    { name: "describe_tool", description: "Describe email tool", inputSchema: schema },
    { name: "call_tool", description: "Call email tool", inputSchema: schema },
  ] : [
    { name: "publish_html", description: "Publish HTML widgets", inputSchema: schema },
    { name: "send_email", description: "Send email", inputSchema: schema },
    { name: "read_email", description: "Read email", inputSchema: schema },
    { name: "archive_email", description: "Archive email", inputSchema: schema },
    { name: "delete_email", description: "Delete email", inputSchema: schema },
  ]);
  process.env.OMB_MCP_CONFIG = join(dir, "config.json");
  writeFileSync(process.env.OMB_MCP_CONFIG, JSON.stringify({ askUser: true, toolScope: options.scope, mcpServers: {
    [options.collision ? "search" : options.agents ? "agents" : "apps"]: { command: process.execPath, args: ["-e", "process.stdin.resume()"], scope: "custom", directory: options.directory },
  } }));
  const api: Api = {
    registerTool(tool) { tools.push(tool); if (tool.defaultActive !== false) active.push(tool.name); },
    on(event, handler) { const list = handlers.get(event) ?? []; list.push(handler); handlers.set(event, list); },
    ...(!options.legacy ? {
      getAllTools: () => tools.map(({ name }) => ({ name })),
      getActiveTools: () => [...active],
      setActiveTools: (names: string[]) => { active = names; },
    } : {}),
  };
  await extension(api);
  const emit = async (name: string, event?: Record<string, unknown>) => { for (const handler of handlers.get(name) ?? []) await handler(event); };
  shutdowns.push(() => emit("session_shutdown"));
  const run = (name: string, args: unknown, approve = true) => tools.find((tool) => tool.name === name)!.execute("id", args, undefined, undefined, { ui: { confirm: async () => approve } });
  return { tools, api, emit, run, call, active: () => active };
}

it("starts tiny, loads at most three original tools, preserves same-session and external selections", async () => {
  const f = await fixture();
  await f.emit("session_start");
  expect(f.active()).toEqual(["read", "bash", "edit", "write", "another_extension", "search_tools"]);
  expect(f.tools.filter((tool) => tool.name.startsWith("apps_")).every((tool) => tool.defaultActive === false)).toBe(true);
  expect(JSON.stringify(f.tools.filter((tool) => f.active().includes(tool.name))).length).toBeLessThan(1800);
  const original = f.tools.find((tool) => tool.name === "apps_publish_html")!;
  expect(original.parameters).toEqual(toTypebox(schema));
  const execute = original.execute;
  const found = await f.run("search_tools", { query: "publish HTML widgets" });
  expect(found.content).toMatchObject([{ text: expect.stringContaining("apps_publish_html:") }]);
  expect(f.active()).toContain("apps_publish_html");
  expect(original.execute).toBe(execute);
  expect(f.call).not.toHaveBeenCalled();
  await f.emit("before_agent_start");
  expect(f.active()).toContain("apps_publish_html");
  await f.run("search_tools", { query: "email" });
  expect(f.active().filter((name) => name.includes("email"))).toHaveLength(3);
  expect(f.active()).toContain("another_extension");
  await f.run("apps_publish_html", { id: "x" }, false);
  expect(f.call).not.toHaveBeenCalled();
  await f.run("apps_publish_html", { id: "x" });
  expect(f.call).toHaveBeenCalledWith("publish_html", { id: "x" }, undefined);
});

it("loads the original native ask_user on demand without asking during discovery", async () => {
  const f = await fixture();
  expect(f.active()).not.toContain("ask_user");
  expect(f.tools.find((tool) => tool.name === "ask_user")).toMatchObject({ defaultActive: false, exposure: "model-only" });
  await f.run("search_tools", { query: "ask person questions" });
  expect(f.active()).toContain("ask_user");
  expect(f.call).not.toHaveBeenCalled();
  const tool = f.tools.find((tool) => tool.name === "ask_user")!;
  const answer = await tool.execute("ask", { questions: [{ question: "Which?" }] }, undefined, undefined, { ui: { confirm: async () => false, input: async () => "blue" } });
  expect(answer.content).toMatchObject([{ text: expect.stringContaining("blue") }]);
});

it("never registers or activates denied tools or restores inactive native tools", async () => {
  const f = await fixture({ scope: { deny: ["native:bash", "native:ask_user", "mcp:apps:send_email", "mcp:apps:delete_email"] } });
  await f.emit("session_start");
  f.api.setActiveTools!(f.active().filter((name) => name !== "read"));
  await f.run("search_tools", { query: "email bash read" });
  expect(f.active()).not.toContain("bash");
  expect(f.active()).not.toContain("read");
  expect(f.tools.some((tool) => tool.name === "apps_send_email" || tool.name === "apps_delete_email")).toBe(false);
  await f.run("search_tools", { query: "ask person questions" });
  expect(f.tools.some((tool) => tool.name === "ask_user")).toBe(false);
  expect(f.active()).not.toContain("ask_user");
  expect(f.call).not.toHaveBeenCalled();
  await expect(f.run("search_tools", { query: " " })).rejects.toThrow(/capability/);
});

it("eagerly exposes usable original tools when activation APIs are unavailable", async () => {
  const f = await fixture({ legacy: true });
  expect(f.tools.some((tool) => tool.name === "search_tools")).toBe(false);
  expect(f.tools.every((tool) => tool.defaultActive !== false)).toBe(true);
  await f.run("apps_read_email", { id: "x" });
  expect(f.call).toHaveBeenCalledWith("read_email", { id: "x" }, undefined);
});

it("discovers directory wrappers without executing them and retains target scope gates", async () => {
  const f = await fixture({ directory: true, scope: { allow: ["mcp:apps:read_email"] } });
  await f.emit("session_start");
  await f.run("search_tools", { query: "email" });
  expect(f.active()).toEqual(["search_tools", "apps_call_tool", "apps_describe_tool", "apps_search_tools"]);
  expect(f.call).not.toHaveBeenCalled();
  await expect(f.run("apps_call_tool", { name: "send_email", arguments: {} })).rejects.toThrow(/excludes/);
  expect(f.call).not.toHaveBeenCalled();
  await f.run("apps_call_tool", { name: "read_email", arguments: { id: "x" } });
  expect(f.call).toHaveBeenCalledWith("call_tool", { name: "read_email", arguments: { id: "x" } }, undefined);
});

it("preserves original MCP names when the loader name collides", async () => {
  const f = await fixture({ collision: true });
  expect(f.tools.find((tool) => tool.name === "search_tools")?.defaultActive).toBe(false);
  expect(f.active()).toContain("omb_search_tools");
  await f.run("omb_search_tools", { query: "original custom" });
  expect(f.active()).toContain("search_tools");
  expect(f.call).not.toHaveBeenCalled();
});

it("loads action tools and aliases only within their per-call scope", async () => {
  const f = await fixture({ agents: true, scope: { allow: ["mcp:agents:update_html"] } });
  await f.emit("session_start");
  await f.run("search_tools", { query: "HTML" });
  expect(f.active()).toEqual(["search_tools", "agents_show_html", "agents_update_html"]);
  await expect(f.run("agents_show_html", { html: "new" })).rejects.toThrow(/excludes/);
  expect(f.call).not.toHaveBeenCalled();
  await f.run("agents_show_html", { app_id: "existing", html: "updated" });
  await f.run("agents_update_html", { app_id: "existing", html: "updated" });
  expect(f.call.mock.calls.map(([name]) => name)).toEqual(["show_html", "update_html"]);
});

it("filters Codex nested tool declarations and fails closed after API enforcement failure", async () => {
  const f = await fixture({ scope: { allow: ["native:read", "mcp:apps:read_email"] } });
  await f.emit("session_start");
  const payload = { tools: [{ name: "read" }, { name: "bash" }], input: [
    { role: "system", tools: [{ name: "read" }, { name: "bash" }, { name: "apps_read_email" }] },
    { tools: [{ functionDeclarations: [{ name: "read" }, { name: "write" }] }] },
  ] };
  await f.emit("before_provider_request", { payload });
  expect(payload.input[0].tools).toEqual([{ name: "read" }]);
  expect(payload.input[1].tools).toEqual([{ functionDeclarations: [{ name: "read" }] }]);
  f.api.setActiveTools!(["read", "bash"]);
  f.api.setActiveTools = () => {};
  await f.emit("before_provider_request", { payload });
  expect(payload.tools).toEqual([]);
  expect(payload.input.every((item) => item.tools.length === 0)).toBe(true);
  await expect(f.run("search_tools", { query: "email" })).rejects.toThrow(/unavailable/);
});
