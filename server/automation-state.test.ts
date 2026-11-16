import { describe, expect, it } from "vitest";
import { dropAutomationState } from "./automation-state.ts";

describe("legacy automation state migration", () => {
  it("removes bot/task automation pins and cached prompts without removing history or ordinary permissions", () => {
    const bot = { id: "fixture", browser: true, computer: "cloud", cloudBackend: "box", recordBrowserSteps: true,
      resumeCursors: { pi: "old-browser-session" }, approvalMode: "ask", soul: "Synthetic instructions", memory: "Keep this",
      tasks: [{ threadId: "fixture-thread", surface: "vm", surfaceSource: "user", resumeCursors: { pi: "old-computer-session" }, title: "Keep this too" }],
    };
    expect(dropAutomationState(bot)).toBe(true);
    for (const field of ["browser", "computer", "cloudBackend", "recordBrowserSteps"]) expect(bot).not.toHaveProperty(field);
    expect(bot.resumeCursors).toEqual({});
    expect(bot.tasks[0]).toEqual({ threadId: "fixture-thread", resumeCursors: {}, title: "Keep this too" });
    expect(bot.approvalMode).toBe("ask");
    expect(bot.soul).toBe("Synthetic instructions");
    expect(bot.memory).toBe("Keep this");
    expect(dropAutomationState(bot)).toBe(false);
  });

  it("invalidates task sessions that inherited the bot automation setting without their own pin", () => {
    const bot = { browser: true, resumeCursors: { pi: "old-root" }, tasks: [{ resumeCursors: { pi: "old-inherited" }, title: "Unpinned" }] };
    expect(dropAutomationState(bot)).toBe(true);
    expect(bot.resumeCursors).toEqual({});
    expect(bot.tasks[0].resumeCursors).toEqual({});
    expect(bot.tasks[0].title).toBe("Unpinned");
  });

  it("does not invalidate an ordinary shell/file session", () => {
    const bot = { id: "fixture", resumeCursors: { pi: "ordinary" }, cwd: "/synthetic/workspace", tasks: [] };
    expect(dropAutomationState(bot)).toBe(false);
    expect(bot.resumeCursors).toEqual({ pi: "ordinary" });
  });
});
