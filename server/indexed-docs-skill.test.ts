import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { indexedDocsSkill } from "./indexed-docs-skill.ts";
import { buildSystemPrompt } from "./system-prompt.ts";
import { loadBundledSkills, renderSkillInstructions, selectBundledSkills } from "./skill-library.ts";

const stock = loadBundledSkills(join(process.cwd(), "skills")).find(skill => skill.manifest.id === "openmausbot-docs")!;
const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
function fixture(instructions = stock.instructions) {
  const directory = mkdtempSync(join(tmpdir(), "omb-docs-prompt-"));
  roots.push(directory);
  writeFileSync(join(directory, "SKILL.md"), instructions);
  return { ...stock, instructions, directory };
}
const render = (skill = stock, includeRoot = true) => renderSkillInstructions([skill], { includeRoot });

describe("indexed app docs routing", () => {
  it.each([
    ["Hi", false],
    ["Where does OpenMausBot keep its bots?", true],
    ["how do I change the approval level for one bot", true],
    ["MausBot 设置里记忆开关是什么意思", true],
    ["where are my bot's routines stored", true],
    ["fix the failing test in src/app.ts", false],
  ])("preserves keyword mounting and indexed rendering for %s", (text, mounted) => {
    const skill = fixture();
    const selected = selectBundledSkills(text, [], [skill]);
    expect(selected.length).toBe(mounted ? 1 : 0);
    const original = renderSkillInstructions(selected, { includeRoot: true });
    const parts = [{ id: "skill-instructions", label: "Skills", text: original }];
    const prompt = buildSystemPrompt("", "", parts, undefined, { guidesPath: "/guides" }).text;
    expect(prompt.includes('id="openmausbot-docs"')).toBe(mounted);
    if (mounted) {
      expect(prompt).toContain("workflow-details.md");
      expect(prompt).toContain("the app wins");
      expect(prompt).toContain("never quote a key back");
      expect(prompt).toContain("change them through the app or its API");
      expect(prompt).not.toContain("| Approval levels,");
    }
    expect(prompt).toContain("Full access never expands permissions by itself.");
  });

  it("offloads only the exact static table, retaining source, surrounding skills and every rule", () => {
    const skill = fixture();
    const original = render(skill);
    const compact = indexedDocsSkill(original);
    expect(compact.length).toBeLessThan(original.length - 1000);
    expect(compact).toContain(JSON.stringify(join(skill.directory, "SKILL.md")));
    expect(compact).toContain("workflow-details.md");
    expect(compact).not.toContain("| Approval levels,");
    expect(compact.split("## Where a question goes")[0]).toBe(original.split("## Where a question goes")[0]);
    expect(compact.split("## Rules that hold everywhere")[1]).toBe(original.split("## Rules that hold everywhere")[1]);
    expect(indexedDocsSkill("Authored prefix" + original + "Unknown tail")).toBe("Authored prefix" + compact + "Unknown tail");
    expect(readFileSync(join(skill.directory, "SKILL.md"), "utf8")).toBe(skill.instructions);
    const parts = [{ id: "skill-instructions", label: "Skills", text: original }];
    expect(buildSystemPrompt("", "", parts).text).toContain(original);
    expect(buildSystemPrompt("", "", parts, undefined, { guidesPath: "/guides" }).text).toContain(compact);
  });

  it("keeps unknown prose and complete fallbacks for missing readers' roots, changed tables and sources", () => {
    const skill = fixture();
    for (const text of [
      render(skill, false),
      render({ ...skill, directory: "relative" }),
      render({ ...skill, directory: join(skill.directory, "missing") }),
      render({ ...skill, manifest: { ...skill.manifest, version: "0.1.1" } }),
      render({ ...skill, instructions: skill.instructions + "\nNew policy." }),
    ]) expect(indexedDocsSkill(text)).toBe(text);
    const changed = fixture(stock.instructions.replace("| Approval levels,", "| New approval policy,"));
    expect(indexedDocsSkill(render(changed))).toBe(render(changed));
    rmSync(join(skill.directory, "SKILL.md"));
    expect(indexedDocsSkill(render(skill))).toBe(render(skill));
  });

  it("preserves appended unknown policy even when the current source contains it", () => {
    const skill = fixture(stock.instructions + "\nUnknown future policy.");
    expect(indexedDocsSkill(render(skill))).toContain("\nUnknown future policy.");
    expect(indexedDocsSkill(render(skill))).not.toContain("| Approval levels,");
  });
});
