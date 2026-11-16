import { accessSync, constants, statSync } from "node:fs";
import { join } from "node:path";
import { allowsTool, parseToolScope } from "../shared/tool-scope.ts";
import { guideRoot, PROMPT_GUIDE_FILES } from "./prompt-guides.ts";

const READERS: Readonly<Record<string, readonly string[]>> = {
  piAgent: ["read", "bash"],
  claudeAgent: ["Read", "Bash"],
  codex: ["exec_command", "shell_command", "shell", "read_file"],
};

export function promptGuidePath(input: { driverKind: string; toolScope?: unknown; confined?: boolean; root?: string }): string | undefined {
  if (input.confined || !Object.hasOwn(READERS, input.driverKind)) return undefined;
  const parsed = parseToolScope(input.toolScope);
  if (!parsed.ok || (parsed.scope !== undefined && !READERS[input.driverKind]!.some(name => allowsTool(parsed.scope, { kind: "native", name })))) return undefined;
  const root = input.root ?? guideRoot();
  try {
    for (const name of PROMPT_GUIDE_FILES) {
      const path = join(root, name);
      const stat = statSync(path);
      if (!stat.isFile() || stat.size === 0) return undefined;
      accessSync(path, constants.R_OK);
    }
    return root;
  } catch { return undefined; }
}
