import type { Surface } from "./surface.ts";

const REVIEWED_SELECTION_RULES_0166 = " For a screen task, use select_computer with no arguments when you need to see the actual available targets, and pick the requested place from its result; if the user left the place open, use a suitable available target or surface auto instead of asking them to operate the menu. Browser-only work can stay in Browser; when it needs desktop apps or capabilities the current Browser lacks, select an available Local VM without asking the user to switch it manually. Choose before acting, and do not repeat completed actions if the task continues elsewhere. OpenMausBot can start an existing configured computer and highlight the selected target; if the right tools are already mounted, use them directly. On a pending switch, end this turn: the original request resumes automatically with the new tools, and then you must carry out the task. Ask for input only for a genuine blocker (missing setup, a required sign-in, an approval). Never silently replace an explicitly requested VM with the host desktop. If no suitable computer is running but its provider is configured, select_computer can provision one for this computer task; reuse existing resources first, and never provision just for ordinary chat or inspection.";
const SELECT = " For a screen task, use select_computer with no arguments when you need to inspect the actual available targets. Choose the requested place from its result; if the user left the place open, use a suitable available target or surface auto instead of asking them to operate the menu. Browser-only work can stay in Browser; when it needs desktop apps or capabilities the current Browser lacks, select an available Local VM without asking the user to switch it manually. Choose before taking actions, and do not repeat actions already completed if the task must continue elsewhere. OpenMausBot can start an existing configured computer and highlight the selected target. If the right tools are already mounted, use them directly. On a pending switch, end this turn: the original request resumes automatically with the new tools, and then you must carry out the task. Only ask for input for a genuine blocker, such as missing setup, required sign-in or an approval. Never silently replace an explicitly requested VM with the host desktop.";
const PROVISION = " If no suitable computer is running but its provider is configured, select_computer can provision one for this computer task; reuse existing resources first. Do not provision merely for ordinary chat or inspection.";
const EMPTY = " No computer or browser tools are mounted yet; select_computer is the way to connect them before screen work, not a reason to claim you already performed it.";
const LABELS: Record<Surface, string> = { local: "this computer", browser: "the built-in browser", vm: "the Local VM", cloud: "the cloud computer" };
const PLACES: Record<Surface, string> = { local: "This computer", browser: "the built-in Browser", vm: "its Private desktop", cloud: "its Cloud desktop" };
const EXAMPLES: Partial<Record<NodeJS.Platform, string>> = { win32: "C:\\Users\\…", darwin: "/Users/…", linux: "/home/…" };
type OwnComputer = { bot: string; botId?: string; platform: NodeJS.Platform };

function ownFiles(own: OwnComputer, place: Surface | null, canSelect: boolean): string {
  const example = EXAMPLES[own.platform];
  const where = place && place !== "local" ? `This bot works on ${PLACES[place]}, not on this computer.` : "This bot does not work on this computer this turn.";
  const menu = `open Bot's screen in this chat and choose This computer under “Where ${own.bot} works”`;
  const how = canSelect ? `say so in one line, call select_computer with surface "local", then end your turn; the request continues on this computer by itself, and the person allows it with one tap unless they gave you Full access. If select_computer refuses, ask the person to ${menu}` : `ask the person to ${menu}`;
  const keep = canSelect && own.botId ? ` When the person asks you to keep using this computer, also keep it there: app_settings set, id "bots.settings", value {"botId":"${own.botId}","computer":"local"}; it applies at once with Undo.` : "";
  return ` A file or folder on the person's own computer (${example ? `a path such as ${example}, ` : ""}their Desktop, Documents, Downloads or OneDrive, or "my PC") is on this computer${place ? `, which ${LABELS[place]} cannot reach` : ""}, and it is never one of the shared computers. ${where} To use files on this computer, switch it to This computer: ${how}.${keep} No other setting or menu does this, so never name one.`;
}

export function compactSurfaceContext(text: string, mounted: { computer: Surface | null; browser: boolean }, opts: { cloudHome?: boolean; canSelect?: boolean; botOpened?: boolean; thisComputer?: OwnComputer }): string {
  let compact = text;
  if (opts.canSelect) {
    const selection = opts.cloudHome ? SELECT.replace("select an available Local VM without asking", "select an available cloud computer without asking").replace(" Never silently replace an explicitly requested VM with the host desktop.", "") : SELECT;
    const currentSelection = selection.replace("For a screen task", "For OpenMausBot screen tools");
    const selectionSummary = " For app screen tools: discover/select the requested target with select_computer; never substitute another place. Pending switches end the turn and automatically resume the task. Read surface.md before using these tools.";
    const reviewedSelection = opts.cloudHome ? REVIEWED_SELECTION_RULES_0166.replace("select an available Local VM without asking", "select an available cloud computer without asking").replace(" Never silently replace an explicitly requested VM with the host desktop.", "") : REVIEWED_SELECTION_RULES_0166;
    compact = compact.replace(reviewedSelection, selectionSummary + " Reuse configured resources; provision only for an actual screen task, never ordinary chat/inspection.").replace(currentSelection, selectionSummary).replace(selection, selectionSummary)
      .replace(PROVISION, " Reuse configured resources; provision only for an actual screen task, never ordinary chat/inspection.")
      .replace(EMPTY.replace("select_computer is the way to connect them before screen work, not a reason to claim you already performed it.", "select_computer connects these built-in tools before using them, not a reason to claim you already performed work."), " No app screen tools are mounted; select a target before using them or claiming their results.")
      .replace(EMPTY, " No app screen tools are mounted; select a target before using them or claiming their results.");
  }
  if (opts.thisComputer && !opts.cloudHome && !(opts.botOpened && !opts.canSelect) && mounted.computer !== "local") {
    const own = opts.thisComputer;
    const facts = { bot: own.bot, ...(own.botId ? { botId: own.botId } : {}), platform: own.platform, canSelect: Boolean(opts.canSelect) };
    const original = ownFiles(own, mounted.computer, Boolean(opts.canSelect));
    const updated = original.replace(`which ${mounted.computer ? LABELS[mounted.computer] : ""} cannot reach`, `which ${mounted.computer ? LABELS[mounted.computer] : ""} cannot directly reach`).replace("To use files on this computer", "For mounted access to files on this computer") + " Alternatively, use an available authorized remote connection, including SSH, to this same computer; do not bypass refusals or permissions.";
    const summary = " Own-computer files are not on remote/shared targets. This computer is not mounted; authorized remote access, including SSH, is also allowed. Local target: " + JSON.stringify(facts) + ". Read surface.md before switching or changing the persistent target.";
    compact = compact.replace(updated, summary).replace(original, summary);
  }
  return compact;
}
