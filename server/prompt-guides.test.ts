import { createHash } from "node:crypto";
import { join } from "node:path";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { SERVER_ROOT } from "./proxy-paths.ts";
import { guideRoot, PROMPT_GUIDE_FILES, readPromptGuide } from "./prompt-guides.ts";
import * as prompts from "./system-prompt.ts";

const sha256 = (text: string): string => createHash("sha256").update(text, "utf8").digest("hex");
const UPSTREAM_49968D7F1 = [
  ["CREDENTIAL_PROMPT", "credentials.md", "3538a4c425464d73e988572bcc39e3f41beb215982c1aa1ae8c757ec5fa01cc6", "3538a4c425464d73e988572bcc39e3f41beb215982c1aa1ae8c757ec5fa01cc6"],
  ["THREADS_PROMPT", "threads.md", "21ec030cf0cdfe6f8fc5a8f7be2427aaab1e87166cb48b8f041bab565a2c1ff6", "21ec030cf0cdfe6f8fc5a8f7be2427aaab1e87166cb48b8f041bab565a2c1ff6"],
  ["WIDGET_PROMPT", "widgets.md", "c7f99c423b23f00b304e32dcd9bc4649fb163cb625bfeaef61f3719b477602ad", "c7f99c423b23f00b304e32dcd9bc4649fb163cb625bfeaef61f3719b477602ad"],
  ["TRIGGER_PROMPT", "automations.md", "4554a786fbbe4926df5f6ac08d01020f13648169e127ea6ffc7326e3b7ac7069", "ec2c3df8e635dbcda567f9d7c29295359504d2564f2fad99a228247b39b4b700"],
  ["LEARN_PROMPT", "skills.md", "e5e6a26861709d5ad64b569e47f8d61af306692ee4ac1a7822a590a5e0319e31", "fc720305796600820c5711c0f16160559cfbeff52a2a351faa0b8c5bd5b14e16"],
  ["PROFILE_PROMPT", "profile.md", "948c33a200bfc01604c6a0d2ea859f009e73ad89ef6e9d371783d4b9d1b4b9d1", "0a731ff36de24c2b48924d4721f48f81d85caf32d07afc4d484ba5376f4deef8"],
  ["TEAM_MEMORY_PROMPT", "team-memory.md", "2a2f3d9a5d049743bc81a5b8987be07caa5eef487a42a46c557195a34534821d", "2a2f3d9a5d049743bc81a5b8987be07caa5eef487a42a46c557195a34534821d"],
] as const;
const UPSTREAM_49968D7F1_SHELL = "a89766c229f5d63d4e1a297c28edf7e78d1acac1ccf9712290a0536421134861";
const UPSTREAM_49968D7F1_VM = "0631e7de2a384abbb24368557689827dc3ab4bc4749dbd103f3b838222b8fbaf";
const UPSTREAM_49968D7F1_SHELL_VM = "a5f0dc1948bc01f7a18aaee532e51775bd80c2b767259625a93dbd0d8c9e320e";

describe("static prompt guides", () => {
  it("loads from the server root and rejects unlisted paths", () => {
    expect(guideRoot()).toBe(join(SERVER_ROOT, "prompt-guides"));
    for (const file of ["../system-prompt.ts", "/etc/passwd", "unknown.md"]) {
      expect(() => readPromptGuide(file)).toThrow("Unknown prompt guide");
    }
  });

  it("finds known bundled entrypoints without an unbounded ancestor search", () => {
    const root = mkdtempSync(join(tmpdir(), "omb-guides-"));
    try {
      const guides = join(root, "prompt-guides");
      mkdirSync(guides);
      writeFileSync(join(guides, "INDEX.md"), "# Test guides");
      expect(guideRoot(join(root, "enterprise", "server"))).toBe(guides);
      expect(guideRoot(join(root, "server", "drivers", "nested", "entry"))).not.toBe(guides);
      expect(guideRoot(join(root, "hooks"))).toBe(guides);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("indexes every resource without embedding their manuals", () => {
    const index = readPromptGuide("INDEX.md");
    for (const file of PROMPT_GUIDE_FILES.filter((file) => file !== "INDEX.md")) {
      expect(index).toContain(file);
      expect(readPromptGuide(file).length).toBeGreaterThan(0);
    }
    expect(index).not.toContain(prompts.CREDENTIAL_PROMPT);
  });

  it.each(UPSTREAM_49968D7F1)("preserves upstream 49968d7f1 %s byte for byte", (name, filename, exportHash, resourceHash) => {
    expect(sha256(prompts[name])).toBe(exportHash);
    expect(sha256(readPromptGuide(filename))).toBe(resourceHash);
  });

  it("preserves shell outputs for every computer and the actual timeout constant", () => {
    const base = readPromptGuide("shell.md");
    const vm = readPromptGuide("shell-vm.md");
    expect(sha256(base)).toBe(UPSTREAM_49968D7F1_SHELL);
    expect(sha256(vm)).toBe(UPSTREAM_49968D7F1_VM);
    expect(base).toContain(`${prompts.BASH_MAX_TIMEOUT_MS}, which is ${prompts.BASH_MAX_TIMEOUT_MS / 60_000} minutes`);
    for (const kind of [null, "local", "box", "vps", "vm-private", "vm-shared"] as const) {
      const isVm = kind === "vm-private" || kind === "vm-shared";
      expect(prompts.longCommandsPrompt(kind)).toBe(base + (isVm ? vm : ""));
      expect(sha256(prompts.longCommandsPrompt(kind))).toBe(isVm ? UPSTREAM_49968D7F1_SHELL_VM : UPSTREAM_49968D7F1_SHELL);
    }
    expect(sha256(prompts.ROUTINE_EXECUTION_PROMPT)).toBe("8e0875662073028aa13be96f3929348fa5b79a9dddde052644c3d97932092821");
  });
});
