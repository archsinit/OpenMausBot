import { readPromptBaseline } from "./prompt-baselines.ts";
import type { PromptPart } from "./system-prompt.ts";

const COMPUTER_FACTS = {
  local: " You can act on the user's computer. Inspect the target app/window first; prefer window-targeted accessibility and background delivery. Do not activate apps just to inspect them. Browser work may use dedicated browser tools, Playwright, SSH or other available automation appropriate to the task, preserving the selected target and intended profile/account; supported OpenMausBot setup uses authorized configuration/proposal tools, not UI clicks. Full-desktop input, activation and foreground delivery require the user's request or agreement after background refusal; never bypass that refusal through another tool or script. If background input changes focus, report it and stop that route. Never promise arbitrary background control.",
  "vm-private": " You have your own isolated Cua Linux sandbox reserved for this bot.",
  "vm-shared": " You have a shared, isolated Cua Linux sandbox on this machine.",
  box: " You control the assigned cloud computer. Screenshot coordinates refer to the full image; use its advertised tools for desktop actions and commands.",
  vps: " You have the user's own self-hosted remote Linux VPS through Cua, without a Boat API key. Its filesystem is wiped when its container is recreated: keep long-lived work somewhere durable or return it in chat.",
} as const;
const VM_FACTS = " Only /home/cua/workspace is durable. Their own computer's folders are not mounted: use This computer or another authorized connection to that computer. vm_exec runs commands and creates files inside the VM; other available authorized remote connections, including SSH, are allowed for that same VM. Host file tools do not directly access VM paths. Return VM files with attach_file, not VM-path links.";
const SANDBOX_FACTS = " Read a window with get_window_state before acting; use coordinates from its own screenshot. Keys, typing, scrolling and pixel clicks require delivery_mode foreground here: it changes focus only inside this desktop, never on the user's screen.";

const computerManuals = Object.entries(COMPUTER_FACTS).map(([kind, facts]) => ({
  text: readPromptBaseline(`computer-${kind}.md`),
  currentText: kind === "local" ? readPromptBaseline("computer-local.md").replace(
    "Use the dedicated browser tools for browser work when available, keeping the user's intended browser profile/account, and OpenMausBot's configuration/proposal tools for supported bot setup rather than clicking through this app.",
    "Use dedicated browser tools, Playwright, SSH or other available automation as appropriate to the task, keeping the user's intended browser profile/account and selected target. Use OpenMausBot's configuration/proposal tools for supported bot setup rather than clicking through this app.",
  ) : readPromptBaseline(`computer-${kind}.md`).replace(
    "Run every command with vm_exec, which returns the exit code and the output as text; do not type commands into a terminal window and read screenshots. Create files there with vm_exec too (a shell heredoc or a script it runs); your host file tools cannot reach the VM.",
    "vm_exec runs commands and creates files inside the VM, returning exit codes and text output. Other available authorized remote connections, including SSH, are allowed for that same VM. Host file tools do not directly access VM paths. Verify command results from actual output.",
  ).replace("are reached only on This computer.", "are reached through This computer or another authorized connection to that same computer."),
  facts: facts + (kind.startsWith("vm-") ? VM_FACTS : "") + (kind.startsWith("vm-") || kind === "vps" ? SANDBOX_FACTS : ""),
}));
const browserManuals = ["browser.md", "browser-chrome.md"].map(file => ({
  text: readPromptBaseline(file),
  facts: ` You have ${file === "browser-chrome.md" ? "a real Chrome browser" : "a web browser"} through agent_browser tools; read ${file} before using them. Preserve the selected profile/account and current routing.`,
}));
const EMPTY_MAILBOX = " No mailbox is connected. For mail on a normal host (not Gmail), call request_credential with credential_id email and the address if you know it: one card asks the person for it, then end the turn. Never ask for the password in chat or write your own mail client.";
const MEETINGS_UNAVAILABLE = " You can't join meetings to take notes here, so you have no meeting tools. When the person asks you to join a meeting or sends a meeting link, tell them in one line: Meeting notes run on a cloud computer, and none is set up here. Add a Boat key in Settings → Desktops & browser, or use MausBot Cloud.";
const dataManual = readPromptBaseline("data.md");
const appManual = readPromptBaseline("app-connections.md");
const replyManual = readPromptBaseline("replies.md");
const fullAccessManual = readPromptBaseline("full-access.md");
const provenanceManual = readPromptBaseline("provenance.md");
const recallManual = readPromptBaseline("memory.md").split("\n\n")[0]!;

export function indexedReplyHabits(text: string): string {
  if (text !== replyManual) return text;
  return "\nAnswer first, briefly, in the person's language. Honor preferences; state assumptions/sources. No routine recaps or offers. Ask one missing thing at a time.\n";
}

const APP_ROUTE = " are reachable through the composio tools — find the right one with COMPOSIO_SEARCH_TOOLS, read its arguments with COMPOSIO_GET_TOOL_SCHEMAS, then run it with COMPOSIO_MULTI_EXECUTE_TOOL.";
const APP_FILE = " A file argument such as file_to_upload takes the full path of a file in your working folder or attached here; OpenMausBot uploads it.";
const GRANTS_POLICY = " Only the tools this bot was granted will run; when a needed tool is refused, tell the user and ask them to grant it in OpenMausBot. Reach for the granted services before telling the user you have no access.";

/** Offload only recognized application prose; authored sections and unknown upstream text are never candidates. */
export function indexedContextParts(parts: readonly PromptPart[]): PromptPart[] {
  const retained = parts.map(part => {
    if (part.id === "just-do-it" && part.text === fullAccessManual) return { ...part, text: "" };
    if (part.id === "recall" && part.text === recallManual) return { ...part, text: "" };
    if (part.id === "coordination" && part.text.startsWith(provenanceManual)) return { ...part, text: part.text.slice(provenanceManual.length) };
    if (part.id === "computer") {
      const manual = computerManuals.find(candidate => candidate.text === part.text || candidate.currentText === part.text);
      if (manual) {
        return { ...part, text: manual.facts };
      }
    }
    if (part.id === "browser") {
      const manual = browserManuals.find(candidate => part.text.startsWith(candidate.text));
      if (manual) {
        return { ...part, text: manual.facts + part.text.slice(manual.text.length) };
      }
    }
    if (part.id === "email" && part.text === EMPTY_MAILBOX) return { ...part, text: " No mailbox connected. Read app-connections.md; never write your own mail client." };
    if (part.id === "meetings" && part.text === MEETINGS_UNAVAILABLE) return { ...part, text: " No meeting tools/cloud computer here. Setup: app-connections.md." };
    if (part.id === "data" && part.text === dataManual) {
      return { ...part, text: " DuckDB Data tools available; use them, not UI automation. Read data.md." };
    }
    if (part.id === "composio") {
      if (part.text.startsWith(appManual)) return { ...part, text: " Connected apps are available through composio tools; use them before claiming no access." + part.text.slice(appManual.length) };
      const prefix = " The user's connected apps assigned to this bot (";
      const end = part.text.indexOf(")" + APP_ROUTE, prefix.length);
      if (part.text.startsWith(prefix) && end >= 0 && /^[\p{L}\p{N} ,]+$/u.test(part.text.slice(prefix.length, end))) {
        const routeEnd = end + 1 + APP_ROUTE.length;
        const tail = part.text.slice(routeEnd);
        if (tail.startsWith(GRANTS_POLICY + APP_FILE)) {
          return { ...part, text: part.text.slice(0, end + 1) + " are reachable through composio tools." + GRANTS_POLICY + tail.slice(GRANTS_POLICY.length + APP_FILE.length) };
        }
      }
    }
    return part;
  });
  return retained;
}
