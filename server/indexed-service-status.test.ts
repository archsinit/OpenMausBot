import { describe, expect, it } from "vitest";
import { indexedContextParts } from "./indexed-context.ts";
import { EMAIL_TO_CONNECT_PROMPT } from "./email/instructions.ts";
import { meetingsUnavailablePrompt } from "./meetings/prompt.ts";
import { readPromptBaseline } from "./prompt-baselines.ts";
import { readPromptGuide } from "./prompt-guides.ts";
import { DATA_TOOLS_POINTER } from "./data-prompt.ts";
import { buildSystemPrompt } from "./system-prompt.ts";

describe("exact known disconnected service status", () => {
  it.each([
    ["email", EMAIL_TO_CONNECT_PROMPT, "No mailbox connected"],
    ["meetings", meetingsUnavailablePrompt({ agentsTools: true, cloudComputer: false }), "No meeting tools/cloud computer"],
    ["data", readPromptBaseline("data.md"), "DuckDB Data tools available"],
    ["data", DATA_TOOLS_POINTER, "Data tools available"],
  ])("compacts only unchanged %s status", (id, text, status) => {
    const original = { id: id!, label: id!, text: text! };
    const compact = indexedContextParts([original])[0]!;
    expect(compact.text).toContain(status);
    expect(compact.text.length).toBeLessThan(100);
    for (const changed of [text + " Account: private@example.test.", "New policy. " + text, text!.replace(" ", " Changed ")]) {
      const part = { ...original, text: changed };
      expect(indexedContextParts([part])[0]).toEqual(part);
    }
    expect(indexedContextParts([{ ...original, id: "user-profile" }])[0]!.text).toBe(text);
  });
  it("offloads only Data procedures while retaining availability and the canonical fallback", () => {
    const part = { id: "data", label: "Data", text: DATA_TOOLS_POINTER };
    expect(buildSystemPrompt("", "", [part]).text).toContain(DATA_TOOLS_POINTER);
    const indexed = buildSystemPrompt("", "", [part], undefined, { guidesPath: "/guides" }).text;
    expect(indexed).toContain("Data tools available; read data.md before use.");
    expect(indexed).not.toContain(DATA_TOOLS_POINTER);
    const guide = readPromptGuide("data.md");
    for (const token of ["tool search", "data_load", "data_describe", "data_sql", "data_show", "data_export"]) expect(guide).toContain(token);
    const changed = { ...part, text: DATA_TOOLS_POINTER + " Account scope: Alpha only." };
    expect(buildSystemPrompt("", "", [changed], undefined, { guidesPath: "/guides" }).text).toContain(changed.text);
  });
  it("keeps secure mail setup and meeting setup on demand", () => {
    const guide = readPromptGuide("app-connections.md");
    for (const phrase of ["non-Gmail", "credential_id=email", "known address", "secure card, then end", "Never request passwords", "build a mail client", "Settings → Desktops & browser", "MausBot Cloud"]) expect(guide).toContain(phrase);
  });
});
