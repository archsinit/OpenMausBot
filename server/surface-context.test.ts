import { describe, expect, it } from "vitest";
import { computerSelectionPrompt, surfacePrompt, type Surface } from "./surface.ts";
import { compactSurfaceContext } from "./surface-context.ts";
import { readPromptGuide } from "./prompt-guides.ts";

const own = { bot: 'Case "A"', botId: "bot-42", platform: "linux" as const };
describe("brief screen context", () => {
  it("keeps public selection defaults and briefs the stable rules independently", () => {
    for (const cloudHome of [false, true]) {
      const full = computerSelectionPrompt({ cloudHome });
      expect(computerSelectionPrompt({ cloudHome, guides: false })).toBe(full);
      const brief = computerSelectionPrompt({ cloudHome, guides: true });
      expect(brief.length).toBeLessThan(full.length);
      expect(brief.length).toBeLessThan(100);
      for (const guard of ["surface.md", "Honor turn permissions", "end on pending switches"]) expect(brief).toContain(guard);
      const guide = readPromptGuide("surface.md");
      for (const rule of ["no arguments", "available target or auto", "never silently replace a VM", "automatic resumption", "provision only for a real screen task"]) expect(guide).toContain(rule);
      const turn = surfacePrompt({ computer: null, browser: false }, { canSelect: true, selectionRules: false, guides: true, cloudHome });
      expect(turn).toContain("select_computer allowed this turn.");
      expect(surfacePrompt({ computer: null, browser: false }, { canSelect: false, selectionRules: false, guides: true, cloudHome })).not.toContain("select_computer allowed this turn.");
      expect(surfacePrompt({ computer: null, browser: false }, { canSelect: true, selectionRules: false, cloudHome })).toContain("by your rules for choosing a computer");
      expect(turn).not.toContain("If no suitable computer is running");
      const changed = full.replace("need to see the actual available targets", "need a new approval before selecting");
      expect(compactSurfaceContext(changed, { computer: null, browser: false }, { canSelect: true, cloudHome })).toBe(changed);
    }
  });
  it("offloads recognized selection workflows but preserves selected-target facts and unknown notes", () => {
    for (const computer of [null, "vm", "cloud", "browser"] as Array<Surface | null>) for (const canSelect of [true, false]) {
      const mounted = { computer, browser: false };
      const opts = { canSelect, thisComputer: own, note: " New upstream restriction: project Alpha only." };
      const full = surfacePrompt(mounted, opts), compact = surfacePrompt(mounted, { ...opts, guides: true });
      expect(compact).toContain(opts.note);
      expect(compact.length).toBeLessThan(full.length);
      expect(compact).toContain(JSON.stringify(own.bot)); expect(compact).toContain(own.botId);
      expect(compact).toContain("Own-computer files are not on remote/shared targets");
      expect(compact).toContain("authorized remote access, including SSH, is also allowed");
      if (canSelect) for (const text of ["Honor turn permissions", "end on pending switches", "surface.md"]) expect(compact).toContain(text);
    }
  });
  it("preserves defaults, pins, cloud/lent-computer semantics and delegated restrictions", () => {
    const mounted = { computer: "vm" as const, browser: true };
    const opts = { pinned: "vm" as const, cloudHome: true, canSelect: true, ownComputer: [{ name: "Personal computer", platform: "win32" as const }] };
    const full = surfacePrompt(mounted, opts), compact = surfacePrompt(mounted, { ...opts, guides: true });
    expect(surfacePrompt(mounted, { ...opts, guides: undefined })).toBe(full);
    for (const text of ["pinned", "shared_computer", "Personal computer", "never select_computer"]) expect(compact).toContain(text);
    const delegated = surfacePrompt(mounted, { botOpened: true, thisComputer: own, guides: true });
    expect(delegated).toContain("tell the bot that gave you this job");
    expect(delegated).not.toContain("Local target:");
  });
  it("does not discard unfamiliar or changed upstream context", () => {
    const text = "New surface permissions and owner facts.";
    expect(compactSurfaceContext(text, { computer: null, browser: false }, { canSelect: true, thisComputer: own })).toBe(text);
    const full = surfacePrompt({ computer: null, browser: false }, { canSelect: true });
    const changed = full.replace("For a screen task, use select_computer", "New guard: choose via select_computer");
    const compact = compactSurfaceContext(changed, { computer: null, browser: false }, { canSelect: true });
    expect(compact).toContain("New guard: choose via select_computer");
  });
});
