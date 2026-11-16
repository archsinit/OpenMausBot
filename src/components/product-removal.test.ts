import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { initialState, reducer, type Message } from "@/state/store";
import { KEY_CATALOG } from "./keys/key-catalog";
import { fullContext, resolveSettingsTarget, SETTINGS_INDEX } from "./settings/settings-index";
import { richRowKind, RichMessageRow, UserLineNote } from "./RichMessageRow";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = (path: string) => readFileSync(resolve(root, path), "utf8");

function reachableRendererFiles(): string[] {
  const visited = new Set<string>();
  const visit = (file: string) => {
    if (visited.has(file)) return;
    visited.add(file);
    const text = readFileSync(file, "utf8").replace(/import\s+type\b[^;]+;/g, "");
    const imports = /(?:\bfrom\s*|\bimport\s*\(\s*)["']([^"']+)["']/g;
    for (const match of text.matchAll(imports)) {
      const specifier = match[1]!;
      const target = specifier.startsWith("@/") ? resolve(root, specifier.slice(2)) : specifier.startsWith(".") ? resolve(dirname(file), specifier) : null;
      if (!target || !target.startsWith(root)) continue;
      const dependency = [target, `${target}.ts`, `${target}.tsx`, `${target}/index.ts`, `${target}/index.tsx`].find((path) => /\.tsx?$/.test(path) && existsSync(path));
      if (dependency) visit(dependency);
    }
  };
  visit(resolve(root, "main.tsx"));
  return [...visited].map((path) => path.slice(root.length));
}

describe("retired product surfaces", () => {
  it("does not load phone automation, Data, helper configuration or bug report components", () => {
    const files = reachableRendererFiles();
    expect(files.some((file) => /(?:DataWorkspacePanel|DataResultChip|components\/data\/|AndroidDevicePanel|ComputerPanel\.tsx|UsbPhoneTakeoverSettings|DecisionModelSettings|HelperKeySuggestion|BugReportNote)/.test(file))).toBe(false);
    expect(files).toContain("components/FilesPanel.tsx");
    for (const retained of ["components/widget/WidgetMessage.tsx", "components/HtmlFilePreview.tsx", "components/PublishedPageCard.tsx", "components/ModelPicker.tsx", "components/InspectorPanel.tsx"]) {
      expect(files, retained).toContain(retained);
    }
  });

  it("ignores legacy Data opens even with saved open-panel state", () => {
    const saved = { ...initialState, computerOpen: true };
    expect(reducer(saved, { type: "openDataResult", botId: "old", cardId: "old" })).toBe(saved);
    expect(reducer(initialState, { type: "toggleDataPanel", open: true })).toBe(initialState);
    expect(reducer(initialState, { type: "toggleFilesPanel", open: true }).computerOpen).toBe(true);
    expect(source("components/FilesPanel.tsx")).not.toMatch(/DataPanel|dataResultFocus|localStorage/);
    expect(source("App.tsx")).not.toContain("DataWorkspacePanel");
  });

  it("has no specialized inference keys, search result or legacy settings destination", () => {
    expect(KEY_CATALOG.some((key) => ["jev", "openrouterHelper", "workersAi", "customDecider"].includes(key.id))).toBe(false);
    expect(SETTINGS_INDEX.some((entry) => entry.anchor === "routing")).toBe(false);
    for (const advanced of [false, true]) expect(resolveSettingsTarget("decisionModel", fullContext({ advanced }))).toEqual({ page: "overview" });
    expect(source("components/Composer.tsx")).not.toContain("DEVS_CHOICE");
    expect(source("components/MentionMenu.tsx")).not.toContain("devs");
    expect(source("components/DiagnosticsRow.tsx")).not.toContain("exportDiagnostics");
  });

  it("does not render helper setup or bug report sharing while retaining rich message types", () => {
    const suggestion = { id: "old", kind: "widget", setupSuggestion: { kind: "helpers" } } as unknown as Message;
    expect(renderToStaticMarkup(createElement(RichMessageRow, { botId: "b", botName: "B", message: suggestion }))).toBe("");
    const report = { id: "old", bugReport: { id: "r", status: "received" } } as Message;
    expect(renderToStaticMarkup(createElement(UserLineNote, { message: report }))).toBe("");
    expect(richRowKind({ kind: "widget", widget: {} } as Message)).toBe("widget");
    expect(richRowKind({ kind: "app", app: {} } as Message)).toBe("app");
  });
});
