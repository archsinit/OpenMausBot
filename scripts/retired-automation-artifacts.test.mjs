import { mkdtempSync, mkdirSync, existsSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { RETIRED_AUTOMATION_ARTIFACTS, removeAutomationArtifacts } from "./retired-automation-artifacts.mjs";

describe("automation-free packaging", () => {
  it("removes retired executable entry points from old and tsc output layouts without removing chat", () => {
    const directory = mkdtempSync(join(tmpdir(), "omb-no-automation-artifacts-"));
    try {
      for (const prefix of ["", "server"]) {
        for (const name of RETIRED_AUTOMATION_ARTIFACTS) {
          const file = join(directory, prefix, name);
          mkdirSync(dirname(file), { recursive: true });
          writeFileSync(file, "synthetic");
        }
      }
      writeFileSync(join(directory, "index.js"), "chat");
      removeAutomationArtifacts(directory);
      removeAutomationArtifacts(directory);
      for (const prefix of ["", "server"]) {
        for (const name of RETIRED_AUTOMATION_ARTIFACTS) expect(existsSync(join(directory, prefix, name))).toBe(false);
      }
      expect(readFileSync(join(directory, "index.js"), "utf8")).toBe("chat");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("has no build commands or native resources for browser and desktop control", () => {
    const root = new URL("../", import.meta.url);
    const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));
    for (const [name, command] of Object.entries(pkg.scripts)) {
      expect(name).not.toMatch(/^build:(?:cua|browser)(?:$|:)/);
      expect(command).not.toMatch(/pnpm build:(?:cua|browser)(?:$|\s|:)/);
    }
    const packaging = readFileSync(new URL("electron-builder.yml", root), "utf8");
    expect(packaging).not.toMatch(/from: dist-native\/(?:browser|cua|\$\{arch\}\/cua)/);
    expect(packaging).not.toContain("NSAccessibilityUsageDescription");
    expect(packaging).not.toContain("NSScreenCaptureUsageDescription");
  });
});
