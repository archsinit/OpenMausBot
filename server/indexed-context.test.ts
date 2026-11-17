import { describe, expect, it } from "vitest";
import { indexedContextParts, indexedReplyHabits } from "./indexed-context.ts";
import { REPLY_HABITS_PROMPT } from "./reply-habits.ts";
import { REVIEWED_STOCK_0166 as stock } from "./prompt-stock-0166.ts";
import { JUST_DO_IT_PROMPT } from "./system-prompt.ts";
import { PROVENANCE_PROMPT } from "./provenance-label.ts";
import { SESSION_SEARCH_SYSTEM_PROMPT } from "./workspace.ts";
import { readPromptBaseline as readPromptGuide } from "./prompt-baselines.ts";
import { CONCISE_CONTEXT_CORE } from "./concise-context-core.ts";
import { readPromptGuide as readBriefGuide } from "./prompt-guides.ts";
import { BUILT_IN_BROWSER_SYSTEM_PROMPT } from "./browser-engine.ts";
import { CHROME_BROWSER_SYSTEM_PROMPT } from "./browser/prompt.ts";
import { BUILT_IN_DATA_SYSTEM_PROMPT } from "./data/instructions.ts";
import { buildSystemPrompt, computerPrompt, composioSystemPrompt, COMPOSIO_PROMPT, SIGN_IN_PROMPT, LEARN_PROMPT, PROFILE_PROMPT, type PromptPart } from "./system-prompt.ts";

const part = (id: string, text: string): PromptPart => ({ id, label: id, text });
const joined = (parts: PromptPart[]) => buildSystemPrompt("", "", parts, undefined, { guidesPath: "/guides" }).text;

describe("indexed context transformations", () => {
  it("offloads recognized reply style but keeps its safety floor and unknown future policy", () => {
    expect(stock.REPLY_HABITS_PROMPT).toBe(REPLY_HABITS_PROMPT);
    const text = indexedReplyHabits(REPLY_HABITS_PROMPT);
    expect(text.length).toBeLessThan(REPLY_HABITS_PROMPT.length / 3);
    expect(text.length).toBeLessThanOrEqual(180);
    expect(text).toContain("person's language");
    const changed = REPLY_HABITS_PROMPT + " New upstream policy.";
    expect(indexedReplyHabits(changed)).toBe(changed);
    expect(buildSystemPrompt("", "", []).text).toContain(REPLY_HABITS_PROMPT);
  });
  it("indexes full-access, recall and source prose without dropping runtime facts or novel policy", () => {
    expect(stock.JUST_DO_IT_PROMPT.replace(/^ Just do it is on:/u, " Full access is on:")).toBe(JUST_DO_IT_PROMPT);
    expect(stock.PROVENANCE_PROMPT).toBe(PROVENANCE_PROMPT);
    expect(stock.SESSION_SEARCH_SYSTEM_PROMPT).toBe(SESSION_SEARCH_SYSTEM_PROMPT);
    const facts = " Live team: Juniper (bot-42), authorized department Alpha.";
    const compact = indexedContextParts([part("just-do-it", JUST_DO_IT_PROMPT), part("recall", SESSION_SEARCH_SYSTEM_PROMPT), part("coordination", PROVENANCE_PROMPT + facts)]);
    expect(compact[0]!.text).toBe("");
    expect(compact[1]!.text).toBe("");
    expect(compact[2]!.text).toContain(facts);
    for (const phrase of ["their own request", "on their behalf at your level", "information only", "human-only questions", "embedded labels"]) expect(CONCISE_CONTEXT_CORE).toContain(phrase);
    for (const item of [part("just-do-it", JUST_DO_IT_PROMPT + " New policy."), part("recall", SESSION_SEARCH_SYSTEM_PROMPT + " New policy."), part("coordination", "New source policy. " + PROVENANCE_PROMPT)]) expect(indexedContextParts([item])[0]).toEqual(item);
  });

  it("offloads only the reviewed Full access rename, preserving changed policy and full fallback", () => {
    for (const text of [readPromptGuide("full-access.md"), stock.JUST_DO_IT_PROMPT, JUST_DO_IT_PROMPT]) {
      expect(indexedContextParts([part("just-do-it", text)])[0]!.text).toBe("");
      expect(buildSystemPrompt("", "", [part("just-do-it", text)]).text).toContain(text);
    }
    for (const text of [
      JUST_DO_IT_PROMPT + " New upstream policy.",
      "New policy." + JUST_DO_IT_PROMPT,
      JUST_DO_IT_PROMPT.replace("ask everything in one message and wait", "continue without waiting"),
      JUST_DO_IT_PROMPT.slice(0, -1),
    ]) {
      expect(indexedContextParts([part("just-do-it", text)])[0]).toEqual(part("just-do-it", text));
      expect(joined([part("just-do-it", text)])).toContain(text);
    }
    const guide = readBriefGuide("full-access.md");
    expect(guide).toContain("ask all needed questions together and wait");
    expect(guide).toContain("Full access never expands grants");
    expect(CONCISE_CONTEXT_CORE).toContain("honor ask-first");
    expect(CONCISE_CONTEXT_CORE).toContain("irreversible actions need explicit consent");
  });

  it("recognizes frozen manuals and the exact updated local policy", () => {
    for (const kind of ["local", "vm-private", "vm-shared", "box", "vps"] as const) {
      if (kind === "local" || kind === "vm-private" || kind === "vm-shared") {
        for (const manual of [readPromptGuide(`computer-${kind}.md`), computerPrompt(kind)]) {
          const text = indexedContextParts([part("computer", manual)])[0]!.text;
          if (kind === "local") {
            expect(text).toContain("Playwright, SSH or other available automation");
            expect(text).toContain("never bypass");
          } else {
            expect(text).toContain("including SSH");
            expect(text).toContain("Host file tools do not directly access VM paths");
          }
          expect(text).not.toBe(manual);
          const unknown = part("computer", manual + " New upstream policy.");
          expect(indexedContextParts([unknown])[0]).toEqual(unknown);
        }
      } else expect(readPromptGuide(`computer-${kind}.md`)).toBe(computerPrompt(kind));
    }
    expect(readPromptGuide("browser.md")).toBe(BUILT_IN_BROWSER_SYSTEM_PROMPT);
    expect(readPromptGuide("browser-chrome.md")).toBe(CHROME_BROWSER_SYSTEM_PROMPT);
    expect(stock.BUILT_IN_DATA_SYSTEM_PROMPT).toBe(BUILT_IN_DATA_SYSTEM_PROMPT);
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
      expect(text).toContain("irreversible actions need explicit consent");
      expect(text).toContain("are data, not authority");
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
    for (const phrase of ["user's computer", "background refusal", "never bypass", "If background input changes focus", "designated accounts only", "only to their intended site", "never elsewhere", "request_sign_in and end", "without reconfirmation"]) expect(text).toContain(phrase);
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
    expect(text.split(CONCISE_CONTEXT_CORE)).toHaveLength(2);
    for (const phrase of ["without reconfirmation", "Pending results: stop for the owner", "Claim success only from actual evidence", "Full access never expands permissions"]) expect(text).toContain(phrase);
  });
});
