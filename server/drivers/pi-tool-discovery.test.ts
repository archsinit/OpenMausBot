import { describe, expect, it, vi } from "vitest";
import { Type } from "typebox";
import { createToolDiscovery, filterToolDeclarations } from "./pi-tool-discovery.ts";
import type { PiExtensionApi, PiToolDefinition } from "./pi-mcp-extension.ts";

function fixture(allowed = (_name: string) => true) {
  const tools: PiToolDefinition[] = [];
  let active = ["read", "bash", "edit", "write"];
  const api: PiExtensionApi = {
    registerTool(tool) { tools.push(tool); if (tool.defaultActive !== false) active.push(tool.name); },
    on() {},
    getAllTools: () => [...tools, { name: "unrelated_inactive" }],
    getActiveTools: () => [...active],
    setActiveTools(names) { active = names; },
  };
  const discovery = createToolDiscovery(api, allowed);
  return { api, discovery, tools, active: () => active };
}
function tool(name: string, description = "Synthetic capability"): PiToolDefinition {
  return { name, description, label: name, parameters: Type.Object({ value: Type.String() }),
    execute: vi.fn(async () => ({ content: [{ type: "text" as const, text: "executed" }], details: {} })) };
}
const ctx = { ui: { confirm: async () => true } };
const search = (loader: PiToolDefinition, query: unknown) => loader.execute("search", { query }, undefined, undefined, ctx);

describe("Pi discovery contract", () => {
  it("keeps all 98 original callbacks and schemas available on demand across arbitrary servers", async () => {
    const f = fixture();
    const originals = Array.from({ length: 98 }, (_, index) => tool(`server${index}_action`, `capability${index}`));
    originals.forEach((original, index) => f.discovery.register(original, `server${index}`));
    f.discovery.finish("search_tools");
    expect(f.active()).toEqual(["read", "bash", "edit", "write", "search_tools"]);
    for (const original of originals) {
      const registered = f.tools.find(({ name }) => name === original.name)!;
      expect(registered.parameters).toBe(original.parameters);
      expect(registered.execute).toBe(original.execute);
      await search(f.tools.at(-1)!, original.name);
      expect(f.active()).toContain(original.name);
      expect(original.execute).not.toHaveBeenCalled();
    }
    expect(f.active()).not.toContain("unrelated_inactive");
  });

  it("loads at most three per query and preserves existing tools without running actions", async () => {
    const f = fixture();
    const originals = ["browser", "computer", "data", "phone", "custom"].map(name => tool(name, "common"));
    originals.forEach(original => f.discovery.register(original, "common"));
    f.discovery.finish("search_tools");
    const result = await search(f.tools.at(-1)!, "common");
    expect(result.content).toHaveLength(1);
    expect(f.active()).toHaveLength(8);
    expect(f.active()).toEqual(expect.arrayContaining(["read", "bash", "edit", "write", "search_tools"]));
    originals.forEach(original => expect(original.execute).not.toHaveBeenCalled());
    await search(f.tools.at(-1)!, "phone");
    expect(f.active()).toContain("phone");
  });

  it("does not activate disallowed tools, reports no matches and checks activation", async () => {
    const f = fixture(name => name !== "denied");
    f.discovery.register(tool("denied"), "mail");
    f.discovery.register(tool("permitted"), "mail");
    f.discovery.finish("search_tools");
    await search(f.tools.at(-1)!, "mail");
    expect(f.active()).not.toContain("denied");
    const result = await search(f.tools.at(-1)!, "nothingmatches");
    expect(result.content[0]).toMatchObject({ text: expect.stringContaining("No permitted tools") });
    f.api.setActiveTools!(["search_tools"]);
    f.api.setActiveTools = () => {};
    await expect(search(f.tools.at(-1)!, "permitted")).rejects.toThrow(/activate/);
    for (const query of [undefined, "", " ", 42, "x".repeat(1001)]) {
      await expect(search(f.tools.at(-1)!, query)).rejects.toThrow(/capability/);
    }
  });

  it("resolves exact digit-bearing allocated names and unique original-name suffixes without extras", async () => {
    for (const query of ["CUSTOM_ACTION_4", "action_4"]) {
      const f = fixture();
      const originals = Array.from({ length: 4 }, (_, index) => tool(`custom_action_${index + 1}`, "Do operation"));
      originals.forEach(original => f.discovery.register(original, "custom"));
      f.discovery.finish("search_tools");
      const loader = f.tools.at(-1)!;
      for (let repeat = 0; repeat < 2; repeat++) {
        const result = await search(loader, query);
        expect(result.content[0]).toMatchObject({ text: "custom_action_4: Do operation" });
        expect(f.active()).toEqual(["read", "bash", "edit", "write", "search_tools", "custom_action_4"]);
      }
      originals.forEach(original => expect(original.execute).not.toHaveBeenCalled());
    }
  });

  it("prioritizes exact spelling when registered names differ only by case", async () => {
    const f = fixture();
    for (const name of ["custom_Action", "custom_aCtion", "custom_acTion", "custom_actIon", "custom_action"]) f.discovery.register(tool(name), "custom");
    f.discovery.finish("search_tools");
    await search(f.tools.at(-1)!, "custom_action");
    expect(f.active()).toEqual(["read", "bash", "edit", "write", "search_tools", "custom_action"]);
  });

  it("advances repeated broad and ambiguous suffix queries through all permitted matches", async () => {
    for (const query of ["operation", "action_4"]) {
      const f = fixture(name => name !== "denied_action_4");
      const originals = Array.from({ length: 8 }, (_, index) => tool(`custom${index}_action_4`, "Do operation"));
      [...originals, tool("denied_action_4", "Do operation")].forEach(original => f.discovery.register(original, "custom"));
      f.discovery.finish("search_tools");
      const loader = f.tools.at(-1)!;
      for (let repeat = 0; repeat < 3; repeat++) {
        const before = new Set(f.active());
        const result = await search(loader, query);
        const added = f.active().filter(name => !before.has(name));
        expect(added.length).toBeLessThanOrEqual(3);
        expect(added.length).toBeGreaterThan(0);
        expect((result.content[0] as { text: string }).text).not.toContain("No permitted tools");
        expect(f.active()).not.toContain("denied_action_4");
        expect(f.active()).not.toContain("unrelated_inactive");
      }
      expect(f.active()).toEqual(expect.arrayContaining(originals.map(original => original.name)));
      const before = [...f.active()];
      const exhausted = await search(loader, query);
      const text = (exhausted.content[0] as { text: string }).text;
      expect(f.active()).toEqual(before);
      expect(text.split("\n")).toHaveLength(3);
      expect(text).not.toContain("No permitted tools");
      for (const line of text.split("\n")) expect(before).toContain(line.split(":")[0]);
      for (const deniedQuery of ["denied_action_4", "DENIED_ACTION_4"]) {
        await search(loader, deniedQuery);
        expect(f.active()).not.toContain("denied_action_4");
      }
      originals.forEach(original => expect(original.execute).not.toHaveBeenCalled());
    }
  });

  it("fails closed after enforcement failure", async () => {
    let allowed = true;
    const f = fixture(() => allowed);
    f.discovery.register(tool("mail_send"), "mail");
    f.discovery.finish("search_tools");
    allowed = false;
    await expect(search(f.tools.at(-1)!, "mail")).rejects.toThrow(/enforcement/);
  });

  it("uses eager original registrations when any lazy API is missing", () => {
    for (const missing of ["getAllTools", "getActiveTools", "setActiveTools"] as const) {
      const f = fixture();
      delete f.api[missing];
      const discovery = createToolDiscovery(f.api, () => true);
      const original = tool("custom");
      discovery.register(original, "server");
      discovery.finish("search_tools");
      expect(f.tools).toEqual([original]);
      expect(f.tools[0]).toBe(original);
      expect(f.tools[0].defaultActive).toBeUndefined();
    }
  });
});

it("filters OpenAI, Anthropic, Google and nested Codex declarations, not message content", () => {
  const payload = { tools: [{ function: { name: "yes" } }, { name: "no" }, { functionDeclarations: [{ name: "yes" }, { name: "no" }] }],
    input: [{ tools: [{ name: "yes" }, { name: "no" }], content: "no" }], metadata: { tools: [{ name: "no" }] } };
  expect(filterToolDeclarations(payload, name => name === "yes")).toBe(payload);
  expect(payload.tools).toEqual([{ function: { name: "yes" } }, { functionDeclarations: [{ name: "yes" }] }]);
  expect(payload.input).toEqual([{ tools: [{ name: "yes" }], content: "no" }]);
  expect(payload.metadata.tools).toEqual([{ name: "no" }]);
  filterToolDeclarations(payload, () => false);
  expect(payload.tools).toEqual([]);
  expect(payload.input[0].tools).toEqual([]);
});
