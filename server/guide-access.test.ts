import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { agentGuidePath } from "./guide-access.ts";
import { guideRoot } from "./agent-guides.ts";

describe("task guide access", () => {
  it("works independently of cwd for known file engines", () => {
    for (const driverKind of ["piAgent", "claudeAgent", "codex"]) expect(agentGuidePath({ driverKind })).toBe(guideRoot());
  });
  it("retains inline instructions for guest, fileless, unknown or unreadable catalogs", () => {
    expect(agentGuidePath({ driverKind: "piAgent", confined: true })).toBeUndefined();
    expect(agentGuidePath({ driverKind: "openai-compat" })).toBeUndefined();
    expect(agentGuidePath({ driverKind: "customAcp" })).toBeUndefined();
    expect(agentGuidePath({ driverKind: "museCode" })).toBeUndefined();
    expect(agentGuidePath({ driverKind: "piAgent", root: "/no-such-omb-guide-root" })).toBeUndefined();
    const root = mkdtempSync(join(tmpdir(), "omb-partial-guides-"));
    try {
      writeFileSync(join(root, "INDEX.md"), "Partial catalog");
      expect(agentGuidePath({ driverKind: "piAgent", root })).toBeUndefined();
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
  it("does not treat MCP-only access or malformed tool scopes as a file reader", () => {
    expect(agentGuidePath({ driverKind: "piAgent", toolScope: { allow: ["mcp:agents:*"] } })).toBeUndefined();
    expect(agentGuidePath({ driverKind: "piAgent", toolScope: { deny: ["native:read", "native:bash"] } })).toBeUndefined();
    expect(agentGuidePath({ driverKind: "piAgent", toolScope: "invalid" })).toBeUndefined();
    expect(agentGuidePath({ driverKind: "piAgent", toolScope: { allow: ["native:read"] } })).toBe(guideRoot());
    expect(agentGuidePath({ driverKind: "piAgent", toolScope: { allow: ["native:bash"] } })).toBe(guideRoot());
  });
});
