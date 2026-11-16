import { spawn } from "node:child_process";
import { mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parseArgs, runBrowser } from "./cli.ts";
import { usage } from "./cli-usage.ts";
import { removeTempDir } from "./testing/cleanup.ts";

vi.mock("node:child_process", async (original) => ({
  ...await original<typeof import("node:child_process")>(),
  spawn: vi.fn(() => { throw new Error("Unexpected child process"); }),
}));
vi.mock("./browser-engine.ts", () => { throw new Error("Unexpected browser engine import"); });

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("retired browser CLI", () => {
  it.each([[], ["install"], ["install", "--with-deps"], ["status"]])("refuses browser %j without installing anything", async (...args) => {
    const home = mkdtempSync(join(tmpdir(), "omb-cli-browser-retired-"));
    const fetch = vi.fn(() => { throw new Error("Unexpected download"); });
    vi.stubGlobal("fetch", fetch);
    const log = vi.fn();
    const error = vi.fn();
    try {
      const options = parseArgs(["browser", ...args, "--data-dir", home], {});
      expect(options).not.toHaveProperty("error");
      if ("error" in options) throw new Error(options.error);
      expect(await runBrowser(options, { log, error, ask: async () => "" })).toBe(1);
      expect(error).toHaveBeenCalledWith(expect.stringMatching(/410 Gone:.*unsupported/));
      expect(log).not.toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
      expect(spawn).not.toHaveBeenCalled();
      expect(readdirSync(home)).toEqual([]);
    } finally {
      await removeTempDir(home);
    }
  });

  it("does not advertise automation in help", () => {
    expect(usage()).not.toMatch(/browser install|agent-browser|Chrome for Testing/);
    expect(usage()).toContain("--no-open");
  });
});
