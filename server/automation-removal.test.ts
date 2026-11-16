import { describe, expect, it, vi } from "vitest";
import { agentsMcp, agentsToolList } from "./drivers/agents-mcp.ts";
import { callTool, type ToolCallContext } from "./drivers/agents-call.ts";
import { createToolBridge } from "./drivers/agents-bridge.ts";
import { isRemovedAutomationTool } from "./product-capabilities.ts";
import { CHROME_BROWSER_SYSTEM_PROMPT } from "./browser/prompt.ts";
import { BUILT_IN_BROWSER_SYSTEM_PROMPT } from "./browser-engine.ts";
import { PEER_ACCESS_HELP } from "./peer-roster.ts";
import { callTriggerTool } from "./drivers/agents-call-triggers.ts";
import { computerPrompt, TRIGGER_PROMPT, savedLoginsPrompt, SIGN_IN_PROMPT, CREDENTIAL_PROMPT, JUST_DO_IT_PROMPT, cloudHomePrompt } from "./system-prompt.ts";

const removed = ["select_computer", "request_sign_in", "fill_login", "ask_for_computer",
  "list_shared_computers", "shared_computer", "reset_cloud_computer", "vm_exec",
  "agent_browser_open", "browser_click", "computer_screenshot", "saved_steps_run",
  "get_window_state", "join_meeting", "leave_meeting", "meeting_status", "post_in_meeting_chat", "post_meeting_notes"];
const env = { OMB_BOT_ID: "test", OMB_SHARED_COMPUTERS_ENABLED: "1", OMB_COMPUTER_SELECTION: "1",
  OMB_CLOUD_HOME: "1", OMB_CHIEF_OF_STAFF: "1", OMB_MEETINGS: "1" };

describe("permanent automation removal", () => {
  it("never advertises automation even with legacy switches and bridge discovery", async () => {
    for (const bridge of ["0", "1"]) {
      const { available, listed } = agentsToolList({ ...env, OMB_AGENTS_TOOL_BRIDGE: bridge });
      expect(available.some((tool) => isRemovedAutomationTool(tool.name))).toBe(false);
      expect(JSON.stringify(listed)).not.toMatch(/select_computer|fill_login|request_sign_in|ask_for_computer|browserProfile|boxToken|onePasswordToken/);
      expect(available.map((tool) => tool.name)).toContain("request_credential");
      const rpc = agentsMcp({ ...env, OMB_AGENTS_TOOL_BRIDGE: bridge });
      for (const name of removed) {
        const answer = await rpc({ id: 1, method: "tools/call", params: { name, arguments: {} } });
        expect(answer?.error, name).toBeDefined();
      }
    }
  });

  it("rejects direct calls and prefixed aliases without reaching any API", async () => {
    const api = vi.fn();
    const context = { botId: "test", threadId: "test", externalRuntime: false, sharedComputers: true,
      client: { api, apiResponse: api } } as ToolCallContext;
    for (const name of removed) {
      for (const prefix of ["", "mcp__agents__", "agents__", "agents_"]) {
        expect((await callTool(prefix + name, {}, context)).isError, prefix + name).toBe(true);
      }
    }
    for (const credential_id of ["boxToken", "onePasswordToken"]) {
      expect((await callTool("request_credential", { credential_id }, context)).isError).toBe(true);
    }
    expect((await callTool("propose_profile", { reason: "test", browserProfile: "Work" }, context)).isError).toBe(true);
    expect(api).not.toHaveBeenCalled();
  });

  it("advertises only the normal trigger runner and no automation in exposed descriptions", () => {
    const { available } = agentsToolList({ ...env, OMB_IMAGE_GENERATION: "1", OMB_APP_HOSTING: "1", OMB_X_RESEARCH: "1", OMB_RESEARCH: "1", OMB_MAUSBOT: "1" });
    expect(JSON.stringify(available)).not.toMatch(/browser_provider|provider.managed desktop|screenshots?|\/home\/cua|configured computer|cloud computer|computer provider|shared team computers|VM path/i);
    const trigger = available.find((tool) => tool.name === "trigger")!;
    expect(trigger).toHaveProperty("inputSchema.properties.run_on.enum", ["maus"]);
  });

  it("rejects removed trigger runners for every kind and action before any API call", async () => {
    const api = vi.fn();
    const context = { botId: "test", threadId: "test", externalRuntime: false, sharedComputers: false,
      client: { api, apiResponse: api } } as ToolCallContext;
    for (const when of ["schedule", "webhook", "app_event", "limit_reset"]) {
      for (const action of ["create", "update", "pause", "resume", "run_now", "delete"]) {
        for (const field of ["run_on", "runOn"]) for (const runner of ["box", "cloud"]) {
          const args = { action, when, trigger_id: "test", name: "test", instructions: "test", [field]: runner };
          expect((await callTool("trigger", args, context)).isError).toBe(true);
          expect((await callTriggerTool("trigger", args, context)).isError).toBe(true);
          expect((await callTool("manage_trigger", { action, changes: args }, context)).isError).toBe(true);
        }
      }
    }
    expect(api).not.toHaveBeenCalled();
  });

  it("filters stale bridge inputs and rejects use_tool", () => {
    const bridge = createToolBridge(removed.map((name) => ({ name, description: "removed", inputSchema: {} })));
    expect(bridge.hidden).toEqual([]);
    expect(bridge.listed.map((tool) => tool.name)).toEqual(["find_tool", "use_tool"]);
    for (const name of removed) expect(bridge.use({ name })).toHaveProperty("answer.isError", true);
  });

  it("has no automation instructions or saved logins in prompt helpers", () => {
    expect([SIGN_IN_PROMPT, CHROME_BROWSER_SYSTEM_PROMPT, BUILT_IN_BROWSER_SYSTEM_PROMPT,
      ...(["local", "box", "vps", "vm-private", "vm-shared"] as const).map(computerPrompt),
      savedLoginsPrompt([{ url: "https://example.test", username: "secret-user" }] as never)].join("")).toBe("");
    expect(CREDENTIAL_PROMPT + JUST_DO_IT_PROMPT + TRIGGER_PROMPT + PEER_ACCESS_HELP + cloudHomePrompt(true))
      .not.toMatch(/select_computer|request_sign_in|fill_login|ask_for_computer|shared_computer|built-in browser|signed-in browser|configured computer|cloud computer|computer control|browser_provider|provider.managed desktop|screenshots?/);
  });
});
