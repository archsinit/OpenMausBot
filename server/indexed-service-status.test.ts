import { describe, expect, it } from "vitest";
import { indexedContextParts } from "./indexed-context.ts";
import { EMAIL_TO_CONNECT_PROMPT } from "./email/instructions.ts";
import { meetingsUnavailablePrompt } from "./meetings/prompt.ts";
import { readPromptBaseline } from "./prompt-baselines.ts";
import { readPromptGuide } from "./prompt-guides.ts";

describe("exact known disconnected service status", () => {
  it.each([
    ["email", EMAIL_TO_CONNECT_PROMPT, "No mailbox connected"],
    ["meetings", meetingsUnavailablePrompt({ agentsTools: true, cloudComputer: false }), "No meeting tools/cloud computer"],
    ["data", readPromptBaseline("data.md"), "DuckDB Data tools available"],
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
  it("keeps secure mail setup and meeting setup on demand", () => {
    const guide = readPromptGuide("app-connections.md");
    for (const phrase of ["non-Gmail", "credential_id=email", "known address", "secure card, then end", "Never request passwords", "build a mail client", "Settings → Desktops & browser", "MausBot Cloud"]) expect(guide).toContain(phrase);
  });
});
