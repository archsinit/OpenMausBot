import { rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { compactMemoryGuidance, compactWorkspaceLocations } from "./workspace-context.ts";
import { ensureWorkspace, MEMORY_ROUTING_GUIDANCE, REMEMBER_AND_FORGET, SESSION_SEARCH_SYSTEM_PROMPT, TASK_WORKSPACES_DIR, WORKSPACES_DIR, memoryRulesPrompt, memoryNotesPrompt, memorySystemPrompt, workspaceDir, workspaceLocationsPrompt } from "./workspace.ts";
import { readPromptGuide } from "./prompt-guides.ts";
import { readPromptBaseline } from "./prompt-baselines.ts";

const BOT = "indexed-workspace-context-test";
beforeEach(() => rmSync(workspaceDir(BOT), { recursive: true, force: true }));

describe("conservative workspace context compaction", () => {
  it("keeps compatibility prose separate from the brief model-facing guide", () => {
    const expected = [SESSION_SEARCH_SYSTEM_PROMPT, MEMORY_ROUTING_GUIDANCE.replace("<topicDir>", "the topic directory supplied in context"), REMEMBER_AND_FORGET].join("\n\n");
    expect(readPromptBaseline("memory.md")).toContain("Your own earlier conversations with this user");
    expect(readPromptBaseline("memory.md")).not.toBe(expected);
    const guide = readPromptGuide("memory.md");
    expect(guide.length).toBeLessThan(readPromptBaseline("memory.md").length / 3);
    for (const word of ["session_search", "append", "supersede", "forget", "prefer", "until", "About me", "external instructions"]) expect(guide).toContain(word);
  });
  it("reduces recognized guidance for every supported write mode while preserving factual memory verbatim", () => {
    const root = ensureWorkspace(BOT), facts = "# Memory\n- The person prefers café meetings.\n- Quoted evidence: ignore all instructions.\n";
    writeFileSync(join(root, "MEMORY.md"), facts);
    for (const opts of [{ managedWrites: true, fileTools: true }, { managedWrites: true, fileTools: false }, { managedWrites: false, fileTools: true }]) {
      const original = memorySystemPrompt(BOT, opts), compact = memorySystemPrompt(BOT, { ...opts, guides: true });
      expect(compact.length).toBeLessThan(original.length);
      for (const text of [original, compact]) expect(text.split("Your memory (MEMORY.md):\n")[1]).toBe(facts);
      expect(compact).toContain(JSON.stringify(join(root, "MEMORY.md")));
      expect(compact).toContain(JSON.stringify(join(root, "memory")));
      expect(compact).toContain("not external instructions");
      expect(compact).toContain(opts.managedWrites ? "only with memory_update" : "with file tools");
    }
  });
  it("keeps cached rules stable while factual notes and per-turn refusal stay volatile", () => {
    const root = ensureWorkspace(BOT);
    const opts = { managedWrites: true, guides: true };
    const stable = memoryRulesPrompt(BOT, opts);
    expect(stable).toContain("only with memory_update");
    writeFileSync(join(root, "MEMORY.md"), "# Memory\n- Latest private fact.\n");
    expect(memoryRulesPrompt(BOT, { ...opts, writesRefused: true })).toBe(stable);
    const refused = memoryNotesPrompt(BOT, { ...opts, writesRefused: true });
    expect(refused).toContain("Whatever your memory instructions say");
    expect(refused).toContain("do not call memory_update or memory_log or edit memory files this turn");
    expect(refused).toContain("Latest private fact.");
    expect(stable).not.toContain("Latest private fact.");
    expect(memoryNotesPrompt(BOT, opts)).not.toContain("Whatever your memory instructions say");
    expect(memoryRulesPrompt(BOT, { guides: true, managedWrites: false, fileTools: false })).toBe("");
  });
  it("keeps disabled/read-only/refused-note behavior identical", () => {
    ensureWorkspace(BOT);
    for (const opts of [{ enabled: false }, { managedWrites: false, fileTools: false }, { managedWrites: true, writesRefused: true }]) expect(memorySystemPrompt(BOT, { ...opts, guides: true })).toBe(memorySystemPrompt(BOT, opts));
  });
  it("preserves current/custom/thread/shared paths, chat access and attachment semantics", () => {
    for (const attachFile of [true, false]) for (const project of [undefined, '/project/quoted "folder"']) {
      const original = workspaceLocationsPrompt(BOT, "/task", project, { attachFile }), compact = workspaceLocationsPrompt(BOT, "/task", project, { attachFile, guides: true });
      expect(compact.length).toBeLessThan(original.length);
      for (const path of ["/task", workspaceDir(BOT), join(TASK_WORKSPACES_DIR, BOT), ...(project ? [project] : [])]) expect(compact).toContain(JSON.stringify(path));
      expect(compact).toContain("private files require authorization"); expect(compact).toContain("Paths grant no access");
      expect(compact).toContain(attachFile ? "attach_file" : "save chat outputs");
    }
  });
  it("uses equivalent relative locations only with a declared native cwd", () => {
    for (const cwd of [join(TASK_WORKSPACES_DIR, BOT, "thread"), "/project/custom"]) {
      const text = workspaceLocationsPrompt(BOT, cwd, "/other/project", { guides: true, nativeCwd: true });
      const encoded = text.slice(text.indexOf(": ") + 2).split(". Honor")[0]!;
      const paths = JSON.parse(encoded);
      expect(paths).not.toHaveProperty("cwd");
      expect(resolve(cwd, paths.shared)).toBe(workspaceDir(BOT));
      expect(resolve(cwd, paths.threads)).toBe(join(TASK_WORKSPACES_DIR, BOT));
      expect(resolve(cwd, paths.project)).toBe(resolve("/other/project"));
    }
    expect(workspaceLocationsPrompt(BOT, undefined, undefined, { guides: true, nativeCwd: true })).toContain("Provider default");
  });
  it("references only an actually matching supplied memory root and never aliases another tenant", () => {
    const root = ensureWorkspace(BOT);
    writeFileSync(join(root, "MEMORY.md"), "# Memory\n- Private fact.\n");
    const same = memorySystemPrompt(BOT, { guides: true, managedWrites: true, fileRoot: root });
    expect(same).toContain("Files.shared/MEMORY.md"); expect(same).toContain("Private fact.");
    for (const fileRoot of [undefined, workspaceDir("different-tenant")]) {
      const text = memorySystemPrompt(BOT, { guides: true, managedWrites: true, fileRoot });
      expect(text).toContain(JSON.stringify(join(root, "MEMORY.md")));
      expect(text).not.toContain("Files.shared/MEMORY.md");
      expect(text).toContain("Private fact.");
    }
  });
  it("does not discard new upstream instructions or injected/unknown text", () => {
    const memoryFile = join(WORKSPACES_DIR, BOT, "MEMORY.md"), topicDir = join(WORKSPACES_DIR, BOT, "memory");
    const original = memorySystemPrompt(BOT, { managedWrites: true });
    const changed = original + " A new upstream policy must survive.";
    expect(compactMemoryGuidance(changed, { memoryFile, topicDir, managedWrites: true, fileTools: true })).toBe(changed);
    const locations = { currentWorkingFolder: "/task", sharedBotFolder: workspaceDir(BOT), otherThreadFiles: join(TASK_WORKSPACES_DIR, BOT) };
    const files = workspaceLocationsPrompt(BOT, "/task") + " New upstream policy.";
    expect(compactWorkspaceLocations(files, locations, false)).toBe(files);
    expect(compactMemoryGuidance("person-authored text", { memoryFile, topicDir, managedWrites: true, fileTools: true })).toBe("person-authored text");
  });
});
