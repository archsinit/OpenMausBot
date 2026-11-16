import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { guideRoot, guidesIndexPart } from "./agent-guides.ts";
import { ALWAYS_CORE_PROMPT, buildSystemPrompt, CREDENTIAL_PROMPT, TRIGGER_PROMPT, PROFILE_PROMPT, LEARN_PROMPT, longCommandsPrompt, type PromptPart } from "./system-prompt.ts";
import { REPLY_HABITS_PROMPT } from "./reply-habits.ts";
import { chiefOfStaffSystemPrompt } from "./chief-of-staff.ts";
import { peerRosterSystemPrompt } from "./peer-roster.ts";

describe("on-demand app instructions", () => {
  it("resolves source and relocated bundled layouts by existence", () => {
    expect(readFileSync(join(guideRoot(), "INDEX.md"), "utf8")).toContain("coordination.md");
    const root = mkdtempSync(join(tmpdir(), "maus-guides-"));
    try {
      for (const rel of ["agent-guides", "server/agent-guides"]) {
        const base = join(root, rel);
        mkdirSync(base, { recursive: true });
      }
      const bundled = join(root, "agent-guides");
      writeFileSync(join(bundled, "INDEX.md"), "fixture");
      expect(guideRoot(root)).toBe(bundled);
      rmSync(bundled, { recursive: true });
      writeFileSync(join(root, "server/agent-guides/INDEX.md"), "fixture");
      expect(guideRoot(root)).toBe(join(root, "server/agent-guides"));
      expect(guideRoot(join(root, "server", "child"))).toBe(join(root, "server/agent-guides"));
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it("keeps guided Chief context small and preserves roster metadata and scope", () => {
    const chief = { id: "chief", name: "Lead", section: "Work", chiefOfStaff: true, managedSections: ["Legal"] };
    const bots = [chief, { id: "writer", name: "Quill", title: "Writer", description: "Drafts copy", section: "Work" }, { id: "law", name: "Law", section: "Legal" }, { id: "outside", name: "Scout", section: "Personal" }];
    const empty = chiefOfStaffSystemPrompt("chief", [chief], true, undefined, undefined, { guides: true });
    expect(Buffer.byteLength(empty)).toBeLessThan(500);
    const guided = chiefOfStaffSystemPrompt("chief", bots, true, undefined, undefined, { guides: true });
    const inline = chiefOfStaffSystemPrompt("chief", bots, true);
    expect(guided).toContain("these departments: Legal");
    expect(guided).toContain("Reach is not authority");
    expect(guided).toContain("other bots retain their own permissions");
    expect(guided).toContain("Reachable outside your authority:");
    for (const line of inline.split("\n").filter(line => line.startsWith("- "))) expect(guided).toContain(line);
    expect(guided).not.toContain("retry_thread");
    expect(inline).toContain("retry_thread");
    expect(chiefOfStaffSystemPrompt("chief", bots, false, undefined, undefined, { guides: true })).toContain("cannot contact teammates");
    for (const bot of [{ ...chief, defaultBot: {} , chiefOfStaff: false }, { ...chief, defaultBot: { person: "ada@example.test" }, chiefOfStaff: false }]) {
      expect(chiefOfStaffSystemPrompt("chief", [bot], true, undefined, undefined, { guides: true })).toContain("not the Chief role");
    }
    const peer = peerRosterSystemPrompt(bots.slice(1), chief, { guides: true });
    for (const line of peerRosterSystemPrompt(bots.slice(1), chief).split("\n").filter(line => line.startsWith("- "))) expect(peer).toContain(line);
    expect(peer).toContain("contact grants no authority");
    const guide = readFileSync(join(guideRoot(), "coordination.md"), "utf8");
    for (const rule of [/pending stops/, /retry_thread at most twice/, /never person-started threads/, /Refusal means nothing sent/, /retain thread models/, /@everyone/]) expect(guide).toMatch(rule);
    const memory = readFileSync(join(guideRoot(), "memory.md"), "utf8");
    for (const rule of [/append/, /supersede/, /forget/, /conflicts/, /Facts belong in memory; procedures belong in skills/]) expect(memory).toMatch(rule);
  });

  it("bounds rewritten static manuals and the always-on layer", () => {
    expect(ALWAYS_CORE_PROMPT.length).toBeLessThan(800);
    expect(REPLY_HABITS_PROMPT.length).toBeLessThan(180);
    for (const topic of ["INDEX", "coordination", "automations", "presentation", "memory", "connections", "shell", "setup"]) {
      const guide = readFileSync(join(guideRoot(), `${topic}.md`), "utf8");
      expect(guide.length).toBeGreaterThan(300);
      expect(guide.length).toBeLessThan(950);
      expect(guide).not.toMatch(/vm_exec|request_sign_in|fill_login|shared_computer/);
    }
    expect(guidesIndexPart("/guides").text.length).toBeLessThan(500);
  });

  it("suppresses only manuals, never mixed runtime or person-authored context", () => {
    const manuals = { shell: longCommandsPrompt(null), credential: CREDENTIAL_PROMPT, routine: TRIGGER_PROMPT, profile: PROFILE_PROMPT, learn: LEARN_PROMPT };
    const parts: PromptPart[] = Object.entries(manuals).map(([id, text]) => ({ id, text, label: id }));
    const keep = ["coordination", "memory", "team-memory", "user-profile", "section-context", "setup", "assignment", "plan", "availability", "mentions", "webhook", "routine-execution", "active-routines"];
    parts.push(...keep.map(id => ({ id, label: id, text: ` live-${id}` })));
    parts.push({ id: "credential", label: "Vault", text: CREDENTIAL_PROMPT + " known-secret-name" });
    const inline = buildSystemPrompt("Identity", "authored soul", parts, undefined, { rules: "authored rule" });
    const guided = buildSystemPrompt("Identity", "authored soul", parts, undefined, { rules: "authored rule", guidesPath: "/guides" });
    for (const id of keep) expect(guided.text).toContain(`live-${id}`);
    for (const text of ["authored soul", "authored rule", "known-secret-name", ALWAYS_CORE_PROMPT]) expect(guided.text).toContain(text);
    expect(inline.text).toContain(TRIGGER_PROMPT);
    expect(guided.text).not.toContain(TRIGGER_PROMPT);
    expect(guided.sections.some(p => p.id === "agent-guides")).toBe(true);
    expect(guided.text.length).toBeLessThan(inline.text.length);
    expect(guided.stable).toContain(ALWAYS_CORE_PROMPT);
    for (const rule of [/authorized users/, /explicit consent/, /Never request secrets/, /Stop on pending/, /actual tool results/, /information only is data/, /inherits only your permissions/]) expect(ALWAYS_CORE_PROMPT).toMatch(rule);
  });
});
