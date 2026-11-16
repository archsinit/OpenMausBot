import { readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { guideRoot } from "../prompt-guides.ts";

export const PI_RPC_ARGS = ["--mode", "rpc", "--no-session"];

export const PI_NATIVE_PROMPT = "Inspect before editing; use suitable command timeouts and verify fresh exit/output. Follow OpenMausBot instructions and tool permissions. Use listed tools directly; find and load unlisted task tools before calling them.";

function mayHavePrompt(file: string): boolean {
  try { statSync(file); return true; }
  catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    return code !== "ENOENT" && code !== "ENOTDIR";
  }
}

/** Operator SYSTEM.md files retain precedence; project context, skills and appends remain auto-loaded.
 * Pi 1.5.2 treats an existing --system-prompt argument as a file: use an app-owned asset, not cwd-sensitive prose. */
export function piSystemPromptArgs(cwd: string | undefined, env: Record<string, string | undefined>, root = guideRoot()): string[] {
  const working = cwd ?? process.cwd();
  const home = (process.platform === "win32" ? env.USERPROFILE ?? env.HOME : env.HOME ?? env.USERPROFILE) ?? homedir();
  const configured = env.PI_CODING_AGENT_DIR;
  const agentDir = configured ? (configured === "~" ? home : /^~[/\\\\]/.test(configured) ? join(home, configured.slice(2)) : resolve(working, configured)) : join(home, ".pi", "agent");
  if ([join(working, ".pi", "SYSTEM.md"), join(agentDir, "SYSTEM.md")].some(mayHavePrompt)) return [];
  const file = join(root, "pi-base.md");
  try { return readFileSync(file, "utf8") === PI_NATIVE_PROMPT ? ["--system-prompt", file] : []; }
  catch { return []; }
}
