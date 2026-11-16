import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { ApprovalCard } from "./ApprovalCard";
import { pendingApprovals } from "./PendingApproval";
import { fullContext, resolveSettingsTarget, SETTINGS_INDEX, visiblePages } from "./settings/settings-index";
import { PANEL_TABS, SIMPLE_PAGES } from "./bot-panel/page-registry";
import { linkTarget } from "./bot-panel/panel-link";
import { KEY_CATALOG } from "./keys/key-catalog";
import { initialState, reducer, type Message } from "@/state/store";
import { tourSteps } from "@/lib/guided-tour";

const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("automation UI removal", () => {
  it("has no automation tabs, searchable settings, keys or tour steps in either mode", () => {
    expect(PANEL_TABS).toEqual(["details", "library"]);
    expect(SIMPLE_PAGES).not.toContain("browser");
    expect(SIMPLE_PAGES).not.toContain("where");
    expect(KEY_CATALOG.map((key) => key.id)).not.toEqual(expect.arrayContaining(["box", "vps"]));
    expect(KEY_CATALOG.some((key) => key.id === "box" || key.id === "vps")).toBe(false);
    for (const advanced of [false, true]) {
      const ctx = fullContext({ advanced });
      expect(visiblePages(ctx).some((page) => page.id === "desktops")).toBe(false);
      expect(SETTINGS_INDEX.some((entry) => entry.page === "desktops")).toBe(false);
      expect(resolveSettingsTarget("desktops", ctx)).toEqual({ page: "overview" });
      expect(resolveSettingsTarget("computer", ctx)).toEqual({ page: "overview" });
      expect(tourSteps(advanced).some((step) => step.id.startsWith("tour.computer"))).toBe(false);
    }
    expect(linkTarget("access", { section: "access", page: "browser", nonce: 1 })).toEqual({ tab: "details", page: "apps" });
  });

  it("ignores legacy automation and Data commands while keeping Files", () => {
    expect(reducer(initialState, { type: "toggleComputer", open: true }).computerOpen).toBe(false);
    expect(reducer(initialState, { type: "toggleDataPanel", open: true }).computerOpen).toBe(false);
    expect(reducer(initialState, { type: "toggleFilesPanel", open: true }).computerOpen).toBe(true);
  });

  it("renders no controls for historical computer permission cards and never queues them", () => {
    for (const extra of [{ computerAsk: { state: "asking" } }, { yourComputer: {} }, { approvalScope: "local-computer" }]) {
      const message = { id: "old", kind: "options", card: { requestId: "old", tool: "computer", ...extra } } as Message;
      expect(renderToStaticMarkup(createElement(ApprovalCard, { message }))).toBe("");
      expect(pendingApprovals([message])).toEqual([]);
    }
    const shell = { id: "shell", kind: "options", card: { requestId: "shell", tool: "shell" } } as Message;
    expect(pendingApprovals([shell])).toHaveLength(1);
  });

  it("does not load the dedicated viewer or noVNC from app entry points", () => {
    expect(source("main.tsx")).not.toMatch(/desktop-viewer|DesktopViewer|novnc/);
    expect(source("App.tsx")).not.toMatch(/<ComputerPanel|<RemoteDesktopPanel|<LocalVmWorkspace|desktopViewer/);
    expect(source("components/lazy-screens.tsx")).not.toMatch(/import\("\.\/(ComputerPanel|remote-desktop-panel|LocalVmWorkspace)/);
  });

  it("removes actual header, composer, map, profile and automation settings rendering", () => {
    for (const file of ["ChatView.tsx", "Composer.tsx", "ChatMoreMenu.tsx", "PhonePlus.tsx", "TeamMapPage.tsx"]) {
      expect(source(`components/${file}`), file).not.toMatch(/toggleComputer|<PlaceChip|<WatchScreenButton|usePlaceMenuItem|<CanvasComputers|<SavedStepsChip/);
    }
    expect(source("components/bot-panel/PanelShell.tsx")).not.toContain("ComputerTab");
    expect(source("components/bot-panel/pages.tsx")).not.toMatch(/BrowserLogins|WherePage/);
    expect(source("components/bot-settings/AccessSection.tsx")).not.toMatch(/shows\("(?:worksOn|browser)"\)/);
    expect(source("components/settings/pages/PlacePages.tsx")).not.toMatch(/BrowserProxyRow|BrowserProfilesRow|DesktopKinds|LocalComputerSection|SavedStepsRow/);
    expect(source("components/RoutineCalendarPage.tsx")).not.toMatch(/setRunOn\("cloud"\)|routines\.runsOn\.boat/);
    expect(source("components/WebhookTrigger.tsx")).not.toContain("setRunOn");
    expect(source("components/cloud-buy/ChooseScreen.tsx")).not.toContain("benefit.browser");
    expect(source("components/keys/KeysPage.tsx")).not.toMatch(/BoatOffer|VpsConnection/);
  });
});
