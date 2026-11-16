import { describe, expect, it } from "vitest";
import { assertNoAutomationConfig, AUTOMATION_CONFIG_FIELDS, AUTOMATION_FEATURE_FIELDS, withoutAutomationConfig } from "./automation-config.ts";
import { builtInBrowserEnabled, ownerLendingEnabled, parseConfigPatch, parseStoredConfig, sharedComputersEnabled } from "./config.ts";

describe("removed desktop and browser configuration", () => {
  it("migrates legacy configuration without losing model credentials or preferences", () => {
    const legacy = {
      anthropic: { key: "synthetic-key" }, profile: { name: "Fixture" },
      browserEngine: { invalidOldValue: true }, browserProfiles: [{ arbitrary: "old" }],
      localVm: { mode: "pool" }, box: { token: "old" }, vps: { sshAlias: "old" },
      features: { browser: true, sharedComputers: true, savedSteps: true, cloudComputerAutoReplace: true, autoRecall: false },
      newBotDefaults: { profile: { browser: true, computer: "cloud", cloudBackend: "box", browserProfile: "old", autoStartVps: true }, routines: [] },
    };
    const clean = parseStoredConfig(legacy);
    expect(clean.anthropic?.key).toBe("synthetic-key");
    expect(clean.profile?.name).toBe("Fixture");
    expect(clean.features).toEqual({ autoRecall: false });
    expect(clean.newBotDefaults?.profile).toEqual({});
    for (const field of AUTOMATION_CONFIG_FIELDS) expect(clean).not.toHaveProperty(field);
    expect(legacy.features.browser).toBe(true);
  });

  it("retains old routine instructions but routes legacy cloud templates to ordinary execution", () => {
    expect(withoutAutomationConfig({ newBotDefaults: { routines: [{ name: "Synthetic", runOn: "cloud", prompt: "Keep this" }] } }))
      .toEqual({ newBotDefaults: { routines: [{ name: "Synthetic", runOn: "maus", prompt: "Keep this" }] } });
  });

  for (const field of AUTOMATION_CONFIG_FIELDS) {
    it(`refuses direct configuration writes for ${field}`, () => {
      expect(() => parseConfigPatch({ [field]: {} })).toThrow("settings have been removed");
    });
  }
  for (const field of AUTOMATION_FEATURE_FIELDS) {
    it(`refuses the retired ${field} feature even from stale clients`, () => {
      expect(() => parseConfigPatch({ features: { [field]: true } })).toThrow("settings have been removed");
    });
  }

  it("rejects bot defaults that would restore a removed capability", () => {
    expect(() => assertNoAutomationConfig({ newBotDefaults: { profile: { computer: "local" } } })).toThrow();
    expect(() => assertNoAutomationConfig({ newBotDefaults: { routines: [{ runOn: "cloud" }] } })).toThrow();
    expect(() => parseConfigPatch({ features: { autoRecall: false }, profile: { name: "Fixture" } })).not.toThrow();
  });

  it("cannot be re-enabled through saved values or environment flags", () => {
    const cfg = { features: { browser: true, sharedComputers: true } };
    expect(builtInBrowserEnabled(cfg, { OMB_BUILT_IN_BROWSER: "1" })).toBe(false);
    expect(sharedComputersEnabled(cfg)).toBe(false);
    expect(ownerLendingEnabled(cfg)).toBe(false);
  });
});
