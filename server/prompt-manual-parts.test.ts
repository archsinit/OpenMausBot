import { describe, expect, it } from "vitest";
import { credentialParts, roomManualParts, roomRequesterRule, roomWorkflowInstructions, sharedMemoryParts } from "./prompt-manual-parts.ts";
import { CREDENTIAL_PROMPT, LEARN_PROMPT, PROFILE_PROMPT, TEAM_MEMORY_PROMPT, THREADS_PROMPT, TRIGGER_PROMPT, WIDGET_PROMPT } from "./system-prompt.ts";
import { readPromptGuide } from "./prompt-guides.ts";

describe("manual and runtime fact separation", () => {
  it("keeps the original credential and shared-memory text without mixing live facts into manuals", () => {
    const secret = " Saved secret names: example.", facts = "The project is Juniper.";
    for (const enabled of [true, false]) {
      expect(credentialParts(enabled, secret).map(part => part.text).join("")).toBe(enabled ? CREDENTIAL_PROMPT + secret : "");
      expect(credentialParts(enabled, secret, true).map(part => part.text).join("")).toBe(enabled ? CREDENTIAL_PROMPT + secret + THREADS_PROMPT + WIDGET_PROMPT : "");
      expect(sharedMemoryParts(facts, enabled).map(part => part.text).join("")).toBe(facts + (enabled ? TEAM_MEMORY_PROMPT : ""));
    }
    expect(sharedMemoryParts(facts, true).map(part => part.id)).toEqual(["team-memory", "team-memory-manual"]);
  });
  it("preserves every inline room workflow combination", () => {
    const secrets = " Saved secret names: example.", requester = roomRequesterRule("Juniper");
    for (const agents of [true, false]) for (const threads of [true, false]) for (const coordinate of [true, false]) for (const skills of [true, false]) {
      const actual = roomWorkflowInstructions({ indexed: false, agents, threads, coordinate, skills, secrets, requester }).filter(Boolean).join("\n");
      const expected = [
        agents && (CREDENTIAL_PROMPT + secrets + (threads ? THREADS_PROMPT : "")).trim(),
        agents && coordinate && readPromptGuide("coordination-room.md") + requester,
        agents && TRIGGER_PROMPT.trim(), agents && PROFILE_PROMPT.trim(), agents && skills && LEARN_PROMPT.trim(),
      ].filter(Boolean).join("\n");
      expect(actual).toBe(expected);
      expect(roomManualParts(false, agents, threads, skills).every(part => part.text === "")).toBe(true);
    }
  });
  it("keeps actual room requester and secret-name context while indexing procedural text", () => {
    const requester = roomRequesterRule("Juniper");
    expect(roomRequesterRule(undefined)).toBe("");
    expect(requester).toContain("Don't use coordinate_bots toward @Juniper");
    const actual = roomWorkflowInstructions({ indexed: true, agents: true, threads: true, coordinate: true, skills: true, secrets: " Saved secret names: example.", requester }).filter(Boolean).join("\n");
    expect(actual).toContain("Saved secret names: example.");
    expect(actual).toContain(requester);
    expect(actual).not.toContain(CREDENTIAL_PROMPT);
    expect(actual).not.toContain(TRIGGER_PROMPT.trim());
  });
});
