import { describe, expect, it } from "vitest";
import { surfacePrompt, type Surface } from "./surface.ts";
import { compactSurfaceContext } from "./surface-context.ts";

const own = { bot: 'Case "A"', botId: "bot-42", platform: "linux" as const };
describe("brief screen context", () => {
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
      if (canSelect) for (const text of ["never substitute", "Pending switches end", "never ordinary chat/inspection", "surface.md"]) expect(compact).toContain(text);
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
    const changed = full.replace("For OpenMausBot screen tools, use select_computer", "New guard: choose via select_computer");
    const compact = compactSurfaceContext(changed, { computer: null, browser: false }, { canSelect: true });
    expect(compact).toContain("New guard: choose via select_computer");
  });
});
