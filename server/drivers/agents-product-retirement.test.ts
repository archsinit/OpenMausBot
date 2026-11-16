import { describe, expect, it, vi } from "vitest";
import { isRemovedAutomationTool } from "../product-capabilities.ts";
import { availableTools, catalogProfileFromEnv } from "./agents-catalog.ts";
import { callTool, type ToolCallContext } from "./agents-call.ts";
import { createToolBridge } from "./agents-bridge.ts";

const retired = ["decide", "extract", "report_bug", "data_load", "data_describe", "data_sql", "data_show", "data_export", "PHONE_GET_LOCATION", "PHONE_SEND_MESSAGE", "read_screen", "tap", "open_app"];

describe("retired product tools", () => {
  it.each(retired)("rejects %s and prefixed aliases before making any request", async name => {
    const api = vi.fn();
    const context = { client: { api, apiResponse: api } } as unknown as ToolCallContext;
    for (const called of [name, `agents_${name}`, `agents__${name}`, `mcp__agents__${name}`, `mcp__server_with_underscores__${name}`]) {
      expect(isRemovedAutomationTool(called), called).toBe(true);
      expect(await callTool(called, {}, context)).toMatchObject({ isError: true });
    }
    expect(api).not.toHaveBeenCalled();
  });

  it("blocks phone and Data server aliases without treating widgets as Data", () => {
    for (const name of ["mcp__phone__batch", "mcp__device__PHONE_LIST_EVENTS", "mcp__data__data_show", "phone_read_screen", "data_sql"]) {
      expect(isRemovedAutomationTool(name), name).toBe(true);
    }
    for (const name of ["show_widget", "update_widget", "show_html", "update_html", "publish_page", "research_call", "x_search"]) {
      expect(isRemovedAutomationTool(name), name).toBe(false);
    }
  });

  it("exposes widgets, HTML, pages and hosting but never retired helpers", async () => {
    const tools = availableTools(catalogProfileFromEnv({ OMB_CLOUD_HOME: "1", OMB_APP_HOSTING: "1" }));
    const names = tools.map(tool => tool.name);
    expect(names).toEqual(expect.arrayContaining(["show_widget", "show_html", "publish_page", "publish_app", "check_app_hosting"]));
    expect(names.some(isRemovedAutomationTool)).toBe(false);
    const bridge = createToolBridge([...tools, ...retired.map(name => ({ name, description: name, inputSchema: { type: "object" } }))]);
    expect([...bridge.listed, ...bridge.hidden].some(tool => isRemovedAutomationTool(tool.name))).toBe(false);
    for (const name of retired) {
      expect(bridge.use({ name, arguments: {} })).toMatchObject({ answer: { isError: true } });
      const found = JSON.parse((await bridge.find({ query: name })).text);
      expect(found.matches?.some((tool: { name: string }) => isRemovedAutomationTool(tool.name))).not.toBe(true);
    }
  });
});
