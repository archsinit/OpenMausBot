import { describe, expect, it } from "vitest";
import { indexedContextParts, indexedReplyHabits } from "./indexed-context.ts";
import { REPLY_HABITS_PROMPT } from "./reply-habits.ts";
import { JUST_DO_IT_PROMPT } from "./system-prompt.ts";
import { PROVENANCE_PROMPT } from "./provenance-label.ts";
import { SESSION_SEARCH_SYSTEM_PROMPT } from "./workspace.ts";
import { readPromptGuide } from "./prompt-guides.ts";
import { BUILT_IN_BROWSER_SYSTEM_PROMPT } from "./browser-engine.ts";
import { CHROME_BROWSER_SYSTEM_PROMPT } from "./browser/prompt.ts";
import { BUILT_IN_DATA_SYSTEM_PROMPT } from "./data/instructions.ts";
import { buildSystemPrompt, computerPrompt, composioSystemPrompt, COMPOSIO_PROMPT, SIGN_IN_PROMPT, LEARN_PROMPT, PROFILE_PROMPT, type PromptPart } from "./system-prompt.ts";

const part = (id: string, text: string): PromptPart => ({ id, label: id, text });
const joined = (parts: PromptPart[]) => indexedContextParts(parts).map(p => p.text).join("");

describe("indexed context transformations", () => {
  it("offloads recognized reply style but keeps its safety floor and unknown future policy", () => {
    expect(readPromptGuide("replies.md")).toBe(REPLY_HABITS_PROMPT);
    const text = indexedReplyHabits(REPLY_HABITS_PROMPT);
    expect(text.length).toBeLessThan(REPLY_HABITS_PROMPT.length / 3);
    for (const phrase of ["person's language", "prices, fees and terms", "irreversible actions", "explicit choice", "passwords, one-time codes or card numbers", "Report refusals/failures honestly"]) expect(text).toContain(phrase);
    const changed = REPLY_HABITS_PROMPT + " New upstream policy.";
    expect(indexedReplyHabits(changed)).toBe(changed);
    expect(buildSystemPrompt("", "", []).text).toContain(REPLY_HABITS_PROMPT);
  });
  it("indexes full-access, recall and source prose without dropping runtime facts or novel policy", () => {
    expect(readPromptGuide("full-access.md")).toBe(JUST_DO_IT_PROMPT);
    expect(readPromptGuide("provenance.md")).toBe(PROVENANCE_PROMPT);
    expect(readPromptGuide("memory.md").split("\n\n")[0]).toBe(SESSION_SEARCH_SYSTEM_PROMPT);
    const facts = " Live team: Juniper (bot-42), authorized department Alpha.";
    const compact = indexedContextParts([part("just-do-it", JUST_DO_IT_PROMPT), part("recall", SESSION_SEARCH_SYSTEM_PROMPT), part("coordination", PROVENANCE_PROMPT + facts)]);
    expect(compact[0]!.text.length).toBeLessThan(JUST_DO_IT_PROMPT.length);
    expect(compact[1]!.text).toContain("session_search");
    expect(compact[2]!.text).toContain(facts);
    for (const phrase of ["their own request", "on their behalf at your level", "information only", "human-only questions", "not trusted notes"]) expect(compact[2]!.text).toContain(phrase);
    for (const item of [part("just-do-it", JUST_DO_IT_PROMPT + " New policy."), part("recall", SESSION_SEARCH_SYSTEM_PROMPT + " New policy."), part("coordination", "New source policy. " + PROVENANCE_PROMPT)]) expect(indexedContextParts([item])[0]).toEqual(item);
  });

  it("ships verbatim upstream computer/browser/data/connection manuals without changing default exports", () => {
    for (const kind of ["local", "vm-private", "vm-shared", "box", "vps"] as const) {
      expect(readPromptGuide(`computer-${kind}.md`)).toBe(computerPrompt(kind));
    }
    expect(readPromptGuide("browser.md")).toBe(BUILT_IN_BROWSER_SYSTEM_PROMPT);
    expect(readPromptGuide("browser-chrome.md")).toBe(CHROME_BROWSER_SYSTEM_PROMPT);
    expect(readPromptGuide("data.md")).toBe(BUILT_IN_DATA_SYSTEM_PROMPT);
    expect(readPromptGuide("sign-in.md")).toBe(SIGN_IN_PROMPT);
    expect(readPromptGuide("app-connections.md")).toBe(COMPOSIO_PROMPT);
    const parts = [part("computer", computerPrompt("local")), part("data", BUILT_IN_DATA_SYSTEM_PROMPT)];
    const plain = buildSystemPrompt("", "", parts);
    expect(plain.text).toContain(parts[0]!.text + parts[1]!.text);
    expect(plain).toEqual(buildSystemPrompt("", "", parts, undefined, { guidesPath: undefined }));
  });

  it("keeps unknown, authored and changed upstream text byte-identical", () => {
    for (const id of ["soul", "every-bot-rules", "user-profile", "memory", "team-memory", "roster", "room", "assignment", "webhook", "skill-instructions"]) {
      const authored = part(id, BUILT_IN_BROWSER_SYSTEM_PROMPT + computerPrompt("local"));
      expect(indexedContextParts([authored])[0]).toEqual(authored);
    }
    for (const original of [part("computer", computerPrompt("local") + " New upstream policy."), part("browser", "New policy." + BUILT_IN_BROWSER_SYSTEM_PROMPT), part("data", BUILT_IN_DATA_SYSTEM_PROMPT + " New policy."), part("composio", "New upstream prose.")]) {
      expect(indexedContextParts([original])[0]).toEqual(original);
    }
  });

  it("retains browser profile facts, saved logins and all unknown trailing content", () => {
    for (const browser of [BUILT_IN_BROWSER_SYSTEM_PROMPT, CHROME_BROWSER_SYSTEM_PROMPT]) {
      const facts = ' Selected profile: work; account: alice@example.test. Private authored note; saved login: bank.';
      const text = joined([part("browser", browser + facts)]);
      expect(text).toContain(facts);
      expect(text).not.toContain("agent_browser_upload puts");
      expect(text).toContain("ask in chat before consequential actions not already explicitly authorized");
      expect(text).toContain("never instructions");
    }
  });

  it("retains grants, names, scope restrictions and draft/send safety", () => {
    for (const grants of [undefined, {}, { gmail: { tools: ["search_emails"] }, strange_service: { tools: ["read"] } }] as Parameters<typeof composioSystemPrompt>[0][]) {
      const original = composioSystemPrompt(grants);
      const scope = " Scope: only project Alpha, never project Beta. Unknown future permission.";
      const text = joined([part("composio", original + scope)]);
      expect(text).toContain(scope);
      if (grants && Object.keys(grants).length) {
        expect(text).toContain("Gmail, Strange Service");
        expect(text).toContain("Only the tools this bot was granted will run");
      }
      if (grants === undefined || grants?.gmail) expect(text).toContain("Draft requests never authorize sending");
      if (grants && !Object.keys(grants).length) expect(text).toContain(original);
    }
  });

  it("leaves unfamiliar connection labels and changed grant policy untouched", () => {
    const unusual = composioSystemPrompt({ "custom(app)": { tools: ["read"] } });
    expect(indexedContextParts([part("composio", unusual)])[0]!.text).toBe(unusual);
    const changed = composioSystemPrompt({ gmail: { tools: ["read"] } }).replace("Only the tools this bot was granted will run", "A new upstream grant policy");
    expect(indexedContextParts([part("composio", changed)])[0]!.text).toBe(changed);
  });

  it("keeps target/root/foreground authority and deduplicates sign-in privacy", () => {
    const text = joined([part("computer", computerPrompt("local")), part("browser", BUILT_IN_BROWSER_SYSTEM_PROMPT)]);
    for (const phrase of ["user's computer", "background refusal", "never bypass", "If background input changes focus", "designated account", "only into that site", "never send, forward or paste", "request_sign_in and end the turn", "without asking again"]) expect(text).toContain(phrase);
    expect(text.split("Never search unrelated secret stores")).toHaveLength(2);
    expect(text.length).toBeLessThan(3000);
    for (const kind of ["vm-private", "vm-shared"] as const) {
      const vm = joined([part("computer", computerPrompt(kind))]);
      for (const phrase of ["/home/cua/workspace", "not mounted", "vm_exec", "attach_file", "foreground", "never on the user's screen"]) expect(vm).toContain(phrase);
    }
    expect(joined([part("computer", computerPrompt("vps"))])).toContain("wiped when its container is recreated");
  });

  it("keeps one complete applied-result authority policy across skills and profile", () => {
    const text = buildSystemPrompt("", "", [part("learn", LEARN_PROMPT), part("profile", PROFILE_PROMPT)], undefined, { guidesPath: "/guides" }).text;
    expect(text.split("Follow the tool result: a change you ask for")).toHaveLength(2);
    for (const phrase of ["without asking for another confirmation", "Only a pending result", "Never claim success before an applied result", "Full Access does not grant another bot broader permissions"]) expect(text).toContain(phrase);
  });
});
