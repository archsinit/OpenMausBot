import { statSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

export const PI_NATIVE_PROMPT = "Inspect before editing; use suitable command timeouts and verify fresh exit/output. Follow OpenMausBot instructions and tool permissions.";

function mayHavePrompt(file: string): boolean {
  try { statSync(file); return true; }
  catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    return code !== "ENOENT" && code !== "ENOTDIR";
  }
}

/** Explicit operator SYSTEM.md files retain Pi's native precedence; project context, skills and appends remain auto-loaded. */
export function piSystemPromptArgs(cwd: string | undefined, env: Record<string, string | undefined>): string[] {
  const working = cwd ?? process.cwd();
  const home = (process.platform === "win32" ? env.USERPROFILE ?? env.HOME : env.HOME ?? env.USERPROFILE) ?? homedir();
  const configured = env.PI_CODING_AGENT_DIR;
  const agentDir = configured ? (configured.startsWith("~/") ? join(home, configured.slice(2)) : resolve(working, configured)) : join(home, ".pi", "agent");
  if ([join(working, ".pi", "SYSTEM.md"), join(agentDir, "SYSTEM.md")].some(mayHavePrompt)) return [];
  return ["--system-prompt", PI_NATIVE_PROMPT];
}
