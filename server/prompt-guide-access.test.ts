import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { promptGuidePath } from "./prompt-guide-access.ts";
import { guideRoot, PROMPT_GUIDE_FILES } from "./prompt-guides.ts";

describe("prompt guide availability", () => {
  it("uses the installed catalog only for known native file engines", () => {
    for (const driverKind of ["piAgent", "claudeAgent", "codex"]) expect(promptGuidePath({ driverKind })).toBe(guideRoot());
    for (const driverKind of ["openai-compat", "museCode", "customAcp", "unknown"]) expect(promptGuidePath({ driverKind })).toBeUndefined();
  });
  it("resolves the same packaged catalog from nested entry points", () => {
    const root = mkdtempSync(join(tmpdir(), "omb-guide-layout-"));
    try {
      mkdirSync(join(root, "prompt-guides"));
      writeFileSync(join(root, "prompt-guides", "INDEX.md"), "Catalog");
      for (const entry of [root, join(root, "drivers"), join(root, "enterprise", "server")]) expect(guideRoot(entry)).toBe(join(root, "prompt-guides"));
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
  it("retains inline manuals when guest confinement or tool scope excludes readers", () => {
    expect(promptGuidePath({ driverKind: "piAgent", confined: true })).toBeUndefined();
    for (const toolScope of ["invalid", { allow: ["mcp:agents:*"] }, { deny: ["native:read", "native:bash"] }]) expect(promptGuidePath({ driverKind: "piAgent", toolScope })).toBeUndefined();
    for (const name of ["read", "bash"]) expect(promptGuidePath({ driverKind: "piAgent", toolScope: { allow: [`native:${name}`] } })).toBe(guideRoot());
  });
  it("requires the entire catalog, not just INDEX.md", () => {
    const root = mkdtempSync(join(tmpdir(), "omb-guide-availability-"));
    try {
      writeFileSync(join(root, "INDEX.md"), "Partial catalog");
      expect(promptGuidePath({ driverKind: "piAgent", root })).toBeUndefined();
      for (const name of PROMPT_GUIDE_FILES) writeFileSync(join(root, name), "Guide");
      expect(promptGuidePath({ driverKind: "piAgent", root })).toBe(root);
      writeFileSync(join(root, "widgets.md"), "");
      expect(promptGuidePath({ driverKind: "piAgent", root })).toBeUndefined();
      rmSync(join(root, "widgets.md")); mkdirSync(join(root, "widgets.md"));
      expect(promptGuidePath({ driverKind: "piAgent", root })).toBeUndefined();
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
  it.skipIf(process.platform === "win32" || process.getuid?.() === 0)("falls back when the process cannot read a guide", () => {
    const root = mkdtempSync(join(tmpdir(), "omb-guide-permissions-"));
    try {
      for (const name of PROMPT_GUIDE_FILES) writeFileSync(join(root, name), "Guide");
      chmodSync(join(root, "widgets.md"), 0);
      expect(promptGuidePath({ driverKind: "piAgent", root })).toBeUndefined();
    } finally { chmodSync(join(root, "widgets.md"), 0o600); rmSync(root, { recursive: true, force: true }); }
  });
});
