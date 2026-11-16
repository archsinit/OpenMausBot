import { describe, expect, it } from "vitest";
import { PROMPT_GUIDE_FILES, readPromptGuide } from "./prompt-guides.ts";
import { readPromptBaseline } from "./prompt-baselines.ts";
import { EMAIL_TO_CONNECT_PROMPT } from "./email/instructions.ts";
import { meetingsUnavailablePrompt } from "./meetings/prompt.ts";

const contracts: Record<string, string[]> = {
  "credentials.md": [
    "onePasswordToken",
    "select_computer",
    "ref",
    "file",
    "only after success"
  ],
  "threads.md": [
    "thread=\"new\"",
    "list_threads",
    "Run",
    "#Title"
  ],
  "widgets.md": [
    "defaultValue",
    "onClickAction",
    "six",
    "Yes/no"
  ],
  "automations.md": [
    "action=events",
    "when=app_event",
    "filter",
    "IANA",
    "interval",
    "limit_reset",
    "follow_up",
    "automation-completion.md"
  ],
  "skills.md": [
    "explicitly",
    "provenance",
    "applied-results.md"
  ],
  "profile.md": [
    "propose_profile",
    "Chief",
    "blocker",
    "applied-results.md"
  ],
  "team-memory.md": [
    "propose_team_memory",
    "pending"
  ],
  "shell.md": [
    "86400000",
    "1440",
    "foreground",
    "exit",
    "whole-disk",
    "one wait_until",
    "cannot cancel",
    "Routines/outside events"
  ],
  "shell-vm.md": [
    "timeout_seconds",
    "60",
    "300",
    "nohup"
  ],
  "sign-in.md": [
    "test accounts",
    "verify destination/account",
    "fill_login",
    "pass email",
    "without re-asking",
    "never send/post/forward",
    "CAPTCHA",
    "end",
    "after resumption",
    "no retry/wait",
    "Google/Microsoft SSO"
  ],
  "data.md": [
    "data_describe",
    "id + sql",
    "Latest",
    "10,000",
    "data_show"
  ],
  "app-connections.md": [
    "COMPOSIO_SEARCH_TOOLS",
    "COMPOSIO_GET_TOOL_SCHEMAS",
    "COMPOSIO_MULTI_EXECUTE_TOOL",
    "never escalate"
  ],
  "full-access.md": [
    "ask-first",
    "together",
    "never expands"
  ],
  "provenance.md": [
    "outer",
    "their own request",
    "information only",
    "never bots",
    "sender text"
  ],
  "applied-results.md": [
    "every access level",
    "Undo",
    "pending",
    "end the turn"
  ],
  "automation-completion.md": [
    "trigger_info",
    "enabled=false",
    "nextRunAt=null",
    "explicit request"
  ],
  "workflow-details.md": [
    "Page text/errors/downloads",
    "missing reported errors prove nothing"
  ],
  "browser.md": [
    "@eN",
    "tab_*",
    "snapshot",
    "Recorded as step N",
    "sign-in.md"
  ],
  "browser-chrome.md": [
    "frame-spanning",
    "human browser use",
    "eval",
    "request_sign_in",
    "sign-in.md"
  ],
  "computer-local.md": [
    "background",
    "AppleScript/System Events",
    "report and stop",
    "profile/account"
  ],
  "computer-vm-private.md": [
    "/home/cua/workspace",
    "vm_exec",
    "attach_file",
    "get_window_state",
    "foreground",
    "not the user's screen"
  ],
  "computer-vm-shared.md": [
    "Shared",
    "/home/cua/workspace",
    "get_window_state",
    "foreground"
  ],
  "computer-box.md": [
    "full-image",
    "sign-in.md"
  ],
  "computer-vps.md": [
    "no Boat API key",
    "wipes",
    "get_window_state",
    "never the user's screen"
  ]
};

describe("concise workflow guides", () => {
  it("keeps every model-facing guide, including the index, within a briefness budget", () => {
    for (const file of PROMPT_GUIDE_FILES) expect(readPromptGuide(file).length, file).toBeLessThan(1400);
  });
  it.each(Object.entries(contracts))("%s retains required procedures without long prose", (file, phrases) => {
    const guide = readPromptGuide(file);
    expect(guide.length).toBeLessThan(1400);
    for (const phrase of phrases) expect(guide).toContain(phrase);
  });
  it("separates rewritten guides from immutable legacy recognition", () => {
    let before = 0, after = 0;
    for (const file of Object.keys(contracts).filter(file => !["applied-results.md", "automation-completion.md", "workflow-details.md"].includes(file))) {
      const original = readPromptBaseline(file) + (file === "app-connections.md" ? EMAIL_TO_CONNECT_PROMPT + meetingsUnavailablePrompt({ agentsTools: true, cloudComputer: false }) : "");
      const guide = readPromptGuide(file);
      expect(guide).not.toBe(original);
      expect(guide.length).toBeLessThan(original.length);
      before += original.length; after += guide.length;
    }
    expect(after).toBeLessThan(before / 2);
  });
});
