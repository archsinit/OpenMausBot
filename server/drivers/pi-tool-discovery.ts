import { Type } from "typebox";
import { terms } from "../mcp-directory.ts";
import type { PiExtensionApi, PiToolDefinition } from "./pi-mcp-extension.ts";

interface CatalogTool { name: string; description: string; server: string }

export function createToolDiscovery(pi: PiExtensionApi, allowed: (name: string) => boolean) {
  const lazy = typeof pi.getAllTools === "function" && typeof pi.getActiveTools === "function" && typeof pi.setActiveTools === "function";
  const catalog: CatalogTool[] = [];
  let loaderName: string | undefined;
  return {
    isLoader: (name: string) => name === loaderName,
    register(tool: PiToolDefinition, server: string) {
      pi.registerTool(lazy ? { ...tool, defaultActive: false } : tool);
      catalog.push({ name: tool.name, description: tool.description, server });
    },
    finish(name: string) {
      if (!lazy || !catalog.length) return;
      loaderName = name;
      pi.registerTool({
        name,
        label: "Search tools",
        description: "Find and load up to 3 permitted tools by capability or server (questions, email, browser, computer, data, phone, apps). Returns exact names for the next tool call; repeat a broad query to load more matches. Never runs them.",
        parameters: Type.Object({ query: Type.String({ minLength: 1, maxLength: 1000 }) }),
        async execute(_id, params) {
          if (!allowed(name)) throw new Error("Tool selection enforcement is unavailable");
          const query = (params as { query?: unknown })?.query;
          if (typeof query !== "string" || !query.trim() || query.length > 1000) throw new Error("Provide a capability or server name (1–1000 characters)");
          const literal = query.trim().toLowerCase();
          const known = new Set(pi.getAllTools!().map((tool) => tool.name));
          const permitted = catalog.filter((tool) => known.has(tool.name) && allowed(tool.name));
          const exact = permitted.find((tool) => tool.name === query.trim()) ?? permitted.find((tool) => tool.name.toLowerCase() === literal);
          const suffix = permitted.filter((tool) => tool.name.toLowerCase().endsWith(`_${literal}`));
          const active = pi.getActiveTools!().filter(allowed);
          const activeNames = new Set(active);
          const words = terms(query);
          const matches = exact ? [exact] : (suffix.length ? suffix : permitted)
            .map((tool) => {
              const names = terms(`${tool.name} ${tool.server}`);
              const description = terms(tool.description);
              return { tool, score: suffix.length ? 1 : words.reduce((score, word) => score + (names.includes(word) ? 4 : description.includes(word) ? 1 : 0), 0) };
            })
            .filter(({ score }) => score > 0)
            .sort((a, b) => Number(activeNames.has(a.tool.name)) - Number(activeNames.has(b.tool.name))
              || b.score - a.score || a.tool.name.localeCompare(b.tool.name))
            .slice(0, 3).map(({ tool }) => tool);
          // Never restore inactive native tools or tools belonging to other extensions.
          pi.setActiveTools!([...new Set([...active, ...matches.map((tool) => tool.name)])]);
          const selected = new Set(pi.getActiveTools!());
          if (matches.some((tool) => !selected.has(tool.name))) throw new Error("Pi could not activate the matching tools");
          const text = matches.map((tool) => `${tool.name}: ${tool.description.replace(/\s+/g, " ").trim().slice(0, 160)}`).join("\n");
          return { content: [{ type: "text", text: text || "No permitted tools match. Try a capability or server name." }], details: {} };
        },
      });
    },
  };
}

/** Filter only provider declaration positions, including Codex system-message tool deltas. */
export function filterToolDeclarations(payload: unknown, declared: (name: string) => boolean): unknown {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return payload;
  const body = payload as { tools?: unknown[]; input?: unknown[] };
  if (Array.isArray(body.tools)) body.tools = body.tools.flatMap((value) => {
    if (!value || typeof value !== "object") return [];
    const tool = value as { name?: string; function?: { name?: string }; functionDeclarations?: Array<{ name?: string }> };
    if (Array.isArray(tool.functionDeclarations)) {
      const functionDeclarations = tool.functionDeclarations.filter((item) => typeof item?.name === "string" && declared(item.name));
      return functionDeclarations.length ? [{ ...tool, functionDeclarations }] : [];
    }
    const name = tool.function?.name ?? tool.name;
    return typeof name === "string" && declared(name) ? [tool] : [];
  });
  if (Array.isArray(body.input)) for (const item of body.input) filterToolDeclarations(item, declared);
  return payload;
}
