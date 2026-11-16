import { existsSync } from "node:fs";
import { join } from "node:path";
import { SERVER_ROOT } from "./proxy-paths.ts";
import type { PromptPart } from "./system-prompt.ts";

/** Resolves guides beside source modules or the bundled server entry point. */
export function guideRoot(root: string = SERVER_ROOT): string {
  const candidates = [join(root, "agent-guides"), join(root, "server", "agent-guides"), join(root, "..", "server", "agent-guides"), join(root, "..", "agent-guides")];
  return candidates.find(path => existsSync(join(path, "INDEX.md"))) ?? candidates[0]!;
}

export function guidesIndexPart(root: string): PromptPart {
  return { id: "agent-guides", label: "Task guides", text: `\nTask guides: ${JSON.stringify(join(root, "INDEX.md"))}. Read relevant workflow instructions on demand: coordination, automations, presentation (widgets/HTML/publishing), memory, connections, shell, setup. Guides grant no access.\n` };
}
