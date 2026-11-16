import { beforeAll, describe, expect, it, vi } from "vitest";


beforeAll(() => {
  (globalThis as { window?: unknown }).window ??= {};
  (globalThis as { document?: unknown }).document ??= { documentElement: { dataset: {} } };
});

// Pinned to Advanced: these cover the Advanced rail; Simple has its own suite.
vi.mock("@/lib/interface-mode", () => ({ useAdvancedMode: () => true, setAdvancedMode: () => {} }));
vi.mock("@/lib/analytics", () => ({
  analyticsEnabled: () => false,
  setAnalyticsEnabled: () => {},
}));

describe("Settings › AI › Routing and extraction", () => {
  it("redirects old links to Overview", async () => {
    const { fullContext, resolveSettingsTarget } = await import("./settings/settings-index");
    expect(resolveSettingsTarget("decisionModel", fullContext())).toEqual({ page: "overview" });
  });

  it("does not offer specialized inference in search", async () => {
    const { fullContext, searchSettings } = await import("./settings/settings-index");
    const { t } = await import("@/lib/i18n");
    const find = (query: string) => searchSettings(query, fullContext({ advanced: true }), (entry) => t(entry.labelKey), (page) => t(page.labelKey));
    for (const query of ["decision", "extraction", "jev", "typesafe", "cloudflare", "workers ai", "routing"]) {
      expect(find(query).some((hit) => hit.entry.anchor === "routing"), query).toBe(false);
    }
    expect(find("backups").some((hit) => hit.entry.anchor === "routing")).toBe(false);
  });
});
