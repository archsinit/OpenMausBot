import { CREDENTIAL_PROMPT, LEARN_PROMPT, PROFILE_PROMPT, TEAM_MEMORY_PROMPT, THREADS_PROMPT, TRIGGER_PROMPT, WIDGET_PROMPT, type PromptPart } from "./system-prompt.ts";
import { readPromptBaseline } from "./prompt-baselines.ts";

export function credentialParts(enabled: boolean, secrets: string, threadsAndWidgets = false): PromptPart[] {
  return [
    { id: "credential", label: "Credentials", text: enabled ? CREDENTIAL_PROMPT : "" },
    { id: "secret-names", label: "Available secrets", text: enabled ? secrets : "" },
    ...(threadsAndWidgets ? [
      { id: "threads", label: "Thread instructions", text: enabled ? THREADS_PROMPT : "" },
      { id: "widget", label: "Widget instructions", text: enabled ? WIDGET_PROMPT : "" },
    ] : []),
  ];
}

export function sharedMemoryParts(facts: string, agents: boolean): PromptPart[] {
  return [
    { id: "team-memory", label: "Team memory", text: facts },
    { id: "team-memory-manual", label: "Shared memory instructions", text: agents ? TEAM_MEMORY_PROMPT : "" },
  ];
}

export function roomManualParts(indexed: boolean, agents: boolean, threads: boolean, skills: boolean): PromptPart[] {
  return [
    { id: "credential", label: "Credentials", text: indexed && agents ? CREDENTIAL_PROMPT : "" },
    { id: "threads", label: "Thread instructions", text: indexed && agents && threads ? THREADS_PROMPT : "" },
    { id: "routine", label: "Automation instructions", text: indexed && agents ? TRIGGER_PROMPT : "" },
    { id: "profile", label: "Profile instructions", text: indexed && agents ? PROFILE_PROMPT : "" },
    { id: "learn", label: "Skill instructions", text: indexed && agents && skills ? LEARN_PROMPT : "" },
  ];
}

export function roomRequesterRule(name: string | undefined): string {
  return name ? ` Don't use coordinate_bots toward @${name} or whoever assigned its work; to ask @${name} something, end your turn with the question — it is resumed with your reply.` : "";
}

export function roomWorkflowInstructions(input: { indexed: boolean; agents: boolean; secrets: string; threads: boolean; coordinate: boolean; requester: string; skills: boolean }): Array<string | false> {
  return [
    input.agents && ((input.indexed ? "" : CREDENTIAL_PROMPT) + input.secrets + (!input.indexed && input.threads ? THREADS_PROMPT : "")).trim(),
    input.agents && input.coordinate && (input.indexed ? "" : readPromptBaseline("coordination-room.md")) + input.requester,
    !input.indexed && input.agents && TRIGGER_PROMPT.trim(),
    !input.indexed && input.agents && PROFILE_PROMPT.trim(),
    !input.indexed && input.agents && input.skills && LEARN_PROMPT.trim(),
  ];
}
