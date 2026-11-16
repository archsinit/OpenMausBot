import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { SERVER_ROOT } from "./proxy-paths.ts";

export const PROMPT_GUIDE_FILES = [
  "INDEX.md",
  "credentials.md",
  "threads.md",
  "widgets.md",
  "automations.md",
  "skills.md",
  "profile.md",
  "team-memory.md",
  "shell.md",
  "shell-vm.md",
  "coordination-chief.md",
  "coordination-peers.md",
  "coordination-room.md",
] as const;

export function guideRoot(root = SERVER_ROOT): string {
  const candidates = [join(root, "prompt-guides"), join(root, "..", "prompt-guides"), join(root, "..", "..", "prompt-guides")];
  return candidates.find(path => existsSync(join(path, "INDEX.md"))) ?? candidates[0]!;
}

export function readPromptGuide(filenameWithMd: string): string {
  if (!PROMPT_GUIDE_FILES.some((filename) => filename === filenameWithMd)) {
    throw new Error(`Unknown prompt guide: ${filenameWithMd}`);
  }
  return readFileSync(join(guideRoot(), filenameWithMd), "utf8");
}

export function promptGuidesPointer(guidesPath: string): string {
  return `\n\nTask guides: read ${JSON.stringify(join(guidesPath, "INDEX.md"))} and the matching guide before starting that workflow. Tools remain available as listed.\n`;
}
