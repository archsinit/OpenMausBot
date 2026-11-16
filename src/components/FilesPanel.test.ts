// @vitest-environment happy-dom
import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import type { Bot } from "@/state/store";

const dispatch = vi.hoisted(() => vi.fn());
vi.mock("@/state/store", () => ({ useStore: () => ({ dispatch }) }));
vi.mock("./ComputerFilesPane", () => ({ ComputerFilesPane: () => createElement("div", { "data-files": "" }, "Recent files") }));
import { FilesPanel } from "./FilesPanel";

it("opens Files directly, closes with Escape and restores the opener's focus", () => {
  const opener = document.createElement("button");
  const host = document.createElement("div");
  document.body.append(opener, host);
  opener.focus();
  const root = createRoot(host);
  try {
    flushSync(() => root.render(createElement(FilesPanel, { bot: { id: "b" } as Bot })));
    const panel = host.querySelector("aside")!;
    expect(panel.getAttribute("aria-label")).toBe("Files");
    expect(document.activeElement).toBe(panel);
    expect(host.querySelector("[data-files]")).not.toBeNull();
    expect(host.textContent).not.toContain("Data");
    expect(host.querySelector("[role=tab]")).toBeNull();
    panel.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(dispatch).toHaveBeenCalledExactlyOnceWith({ type: "toggleFilesPanel", open: false });
    host.querySelector("button")!.click();
    expect(dispatch).toHaveBeenLastCalledWith({ type: "toggleFilesPanel", open: false });
  } finally {
    root.unmount();
    expect(document.activeElement).toBe(opener);
    opener.remove();
    host.remove();
  }
});
