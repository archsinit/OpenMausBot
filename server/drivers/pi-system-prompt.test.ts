import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { PI_NATIVE_PROMPT, piSystemPromptArgs } from "./pi-system-prompt.ts";
import { guideRoot, readPromptGuide } from "../prompt-guides.ts";

const roots: string[] = [];
const fixture = () => {
  const root = mkdtempSync(join(tmpdir(), "omb-pi-prompt-")); roots.push(root);
  const cwd = join(root, "project"); mkdirSync(cwd);
  return { root, cwd, env: { HOME: root, USERPROFILE: root } };
};
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

describe("concise Pi native base", () => {
  it("replaces redundant stock documentation, not the task instructions or tool schema", () => {
    const { cwd, env } = fixture();
    expect(piSystemPromptArgs(cwd, env)).toEqual(["--system-prompt", join(guideRoot(), "pi-base.md")]);
    expect(readPromptGuide("pi-base.md")).toBe(PI_NATIVE_PROMPT);
    expect(PI_NATIVE_PROMPT.length).toBeLessThan(350);
    for (const word of ["Inspect", "editing", "timeouts", "fresh exit/output", "permissions"]) expect(PI_NATIVE_PROMPT).toContain(word);
  });
  it.each(["project", "global", "configured"])("honors the operator's %s SYSTEM.md instead of replacing it", kind => {
    const { root, cwd, env } = fixture();
    const dir = kind === "project" ? join(cwd, ".pi") : kind === "global" ? join(root, ".pi", "agent") : join(root, "alternate");
    mkdirSync(dir, { recursive: true }); writeFileSync(join(dir, "SYSTEM.md"), "Private operator policy");
    expect(piSystemPromptArgs(cwd, { ...env, ...(kind === "configured" ? { PI_CODING_AGENT_DIR: dir } : {}) })).toEqual([]);
  });
  it("uses only the known app-owned asset and falls back on missing or altered assets", () => {
    const { root, cwd, env } = fixture();
    expect(piSystemPromptArgs(cwd, env, root)).toEqual([]);
    writeFileSync(join(root, "pi-base.md"), "Unexpected replacement policy");
    expect(piSystemPromptArgs(cwd, env, root)).toEqual([]);
    writeFileSync(join(root, "pi-base.md"), PI_NATIVE_PROMPT);
    expect(piSystemPromptArgs(cwd, env, root)).toEqual(["--system-prompt", join(root, "pi-base.md")]);
    expect(piSystemPromptArgs(cwd, env)[1]).not.toBe(PI_NATIVE_PROMPT);
  });
  it("does not disable project instructions, skills, extensions or appended policies", () => {
    const { cwd, env } = fixture();
    mkdirSync(join(cwd, ".pi")); writeFileSync(join(cwd, "AGENTS.md"), "Project policy"); writeFileSync(join(cwd, ".pi", "APPEND_SYSTEM.md"), "Additional policy");
    const args = piSystemPromptArgs(cwd, env);
    expect(args).toEqual(["--system-prompt", join(guideRoot(), "pi-base.md")]);
    expect(args).not.toContain("--no-extensions");
    expect(args).not.toContain("--no-skills");
  });
});
