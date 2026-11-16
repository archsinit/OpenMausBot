import { resolveAgentsCall } from "../shared/agents-tool-names.ts";

const REMOVED_TOOLS = new Set([
  "join_meeting", "leave_meeting", "post_in_meeting_chat", "meeting_status", "post_meeting_notes",
  "select_computer", "reset_cloud_computer", "list_shared_computers", "shared_computer",
  "ask_for_computer", "request_sign_in", "fill_login", "vm_exec",
  "get_window_state", "get_desktop_state", "list_windows", "list_apps", "launch_app",
  "click", "double_click", "right_click", "type_text", "set_value", "press_key",
  "key_press", "hotkey", "scroll", "drag", "move_mouse", "screenshot",
]);

/** Permanent product boundary: remembered names and engine/server prefixes cannot restore automation. */
export function isRemovedAutomationTool(called: string): boolean {
  const bare = called.toLowerCase().replace(/^mcp__[^_]+__/, "").replace(/^(?:agents__|agents_)/, "");
  const name = resolveAgentsCall(bare, {}).name;
  return REMOVED_TOOLS.has(name) || /^(?:agent_browser|browser|computer|desktop|saved_steps?|cua)[_.]/.test(name)
    || /^(?:save|list|run|delete|update|record)_steps$/.test(name);
}
