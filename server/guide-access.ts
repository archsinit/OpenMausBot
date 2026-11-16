import { accessSync, constants, statSync } from "node:fs";
import { join } from "node:path";
import { allowsTool, parseToolScope } from "../shared/tool-scope.ts";
import { guideRoot } from "./agent-guides.ts";

const READERS: Readonly<Record<string, readonly string[]>> = {
  piAgent: ["read", "bash"], claudeAgent: ["Read", "Bash"], codex: ["exec_command", "shell_command", "shell", "read_file"],
};
const FILES = ["INDEX.md", "coordination.md", "automations.md", "presentation.md", "memory.md", "connections.md", "shell.md", "setup.md"] as const;

/** Use file guides only when this engine/turn has an allowed reader and the complete installed catalog is readable. */
export function agentGuidePath(input: { driverKind: string; toolScope?: unknown; confined?: boolean; root?: string }): string | undefined {
  if (input.confined || !Object.hasOwn(READERS, input.driverKind)) return undefined;
  const parsed = parseToolScope(input.toolScope);
  if (!parsed.ok) return undefined;
  if (parsed.scope !== undefined && !READERS[input.driverKind]!.some(name => allowsTool(parsed.scope, { kind: "native", name }))) return undefined;
  const root = input.root ?? guideRoot();
  try {
    for (const name of FILES) {
      const path = join(root, name);
      if (!statSync(path).isFile()) return undefined;
      accessSync(path, constants.R_OK);
    }
    return root;
  } catch { return undefined; }
}
