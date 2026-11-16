import { resolveAgentsCall } from "../shared/agents-tool-names.ts";

const REMOVED_TOOLS = new Set([
  "decide", "extract", "report_bug",
  "data_load", "data_describe", "data_sql", "data_show", "data_export",
  "batch", "open_app", "tap_text", "tap", "swipe", "press", "read_screen",
  "join_meeting", "leave_meeting", "post_in_meeting_chat", "meeting_status", "post_meeting_notes",
  "select_computer", "reset_cloud_computer", "list_shared_computers", "shared_computer",
  "ask_for_computer", "request_sign_in", "fill_login", "vm_exec",
  "get_window_state", "get_desktop_state", "list_windows", "list_apps", "launch_app",
  "click", "double_click", "right_click", "type_text", "set_value", "press_key",
  "key_press", "hotkey", "scroll", "drag", "move_mouse", "screenshot",
]);

/** Permanent product boundary: remembered names and engine/server prefixes cannot restore automation. */
export function isRemovedAutomationTool(called: string): boolean {
  const lower = called.toLowerCase();
  if (/^mcp__(?:phone|device|android|data)__/.test(lower)) return true;
  const bare = lower.replace(/^mcp__.+?__/, "").replace(/^(?:agents__|agents_)/, "");
  const name = resolveAgentsCall(bare, {}).name;
  return REMOVED_TOOLS.has(name) || /^(?:agent_browser|browser|computer|desktop|saved_steps?|cua|phone|android|device|data)[_.]/.test(name)
    || /^(?:save|list|run|delete|update|record)_steps$/.test(name);
}
