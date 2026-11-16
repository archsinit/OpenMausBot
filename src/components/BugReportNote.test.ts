import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import { setLocale } from "@/lib/i18n";
import { StoreContext, type Message } from "@/state/store";
import { BugReportNote } from "./BugReportNote";
import { UserLineNote } from "./RichMessageRow";
import { StatusActivityRow } from "./StatusActivityRow";

afterEach(() => { setLocale("en"); });

const text = (html: string) => html.replace(/<[^>]+>/g, "").replace(/&#x27;/g, "'");
const person = (bugReport?: Message["bugReport"]): Message => ({ id: "m1", role: "user", kind: "text", text: "@devs the calendar never syncs", at: 1, ...(bugReport ? { bugReport } : {}) } as Message);

describe("a @devs report's status, under the message that sent it", () => {
  it("does not add report status to historical user messages", () => {
    const shown = (bugReport: Message["bugReport"]) => text(renderToStaticMarkup(createElement(UserLineNote, { message: person(bugReport) })));
    expect(shown({ id: "r1", status: "received" })).toBe("");
    expect(shown({ id: "r1", status: "fixed" })).toBe("");
    expect(shown({ id: "r1", status: "fixed", fixedIn: "0.1.135" })).toBe("");
    expect(shown({ id: "r1", status: "fixed", fixedIn: "0.1.135", running: true })).toBe("");
    // A message that sent no report shows nothing.
    expect(renderToStaticMarkup(createElement(UserLineNote, { message: person() }))).toBe("");
  });

  it("follows the app's language", () => {
    setLocale("de");
    expect(text(renderToStaticMarkup(createElement(BugReportNote, { report: { id: "r1", status: "fixed", fixedIn: "0.1.135", running: true } })))).toBe("Fehlerbericht · Behoben in 0.1.135");
  });
});

describe("the one line that says the fix runs here", () => {
  const line = (bugReport?: Message["bugReport"]): Message => ({ id: "n1", role: "bot", kind: "activity", at: 2, tool: { name: "notice: Fixed in 0.1.135. Want to try again?", ok: true },
    ...(bugReport ? { bugReport } : {}) } as Message);

  const shown = (message: Message) => text(renderToStaticMarkup(createElement(StoreContext.Provider, { value: { state: {}, dispatch: () => {} } as never },
    createElement(StatusActivityRow, { message }))));

  it("asks whether to try again, in the app's language", () => {
    expect(shown(line({ id: "r1", status: "fixed", fixedIn: "0.1.135", running: true }))).toBe("Fixed in 0.1.135. Want to try again?");
    setLocale("de");
    expect(shown(line({ id: "r1", status: "fixed", fixedIn: "0.1.135", running: true }))).toBe("Fixed in 0.1.135. Want to try again?");
    // A client older than the field, or a row without it, reads the server's words.
    expect(shown(line())).toBe("Fixed in 0.1.135. Want to try again?");
  });
});
