import { describe, expect, it } from "vitest";

import { chiefOfStaffSystemPrompt, chiefTidies, EVERYONE_ON_THE_MAP } from "./chief-of-staff.ts";

describe("chiefTidies", () => {
  const chief = { id: "chief", name: "Chief", section: "Work", chiefOfStaff: true };
  const opener = { id: "opener", name: "Opener", section: "Work" };
  const recipient = { id: "recipient", name: "Recipient", section: "Work" };
  const task = { openedBy: { botId: opener.id, name: opener.name, threadId: "source", at: 1 } };

  it("allows only Chiefs and bot-opened, non-routine threads", () => {
    expect(chiefTidies(chief, task, opener, recipient)).toBe(true);
    expect(chiefTidies({ ...chief, chiefOfStaff: false }, task, opener, recipient)).toBe(false);
    expect(chiefTidies(chief, {}, opener, recipient)).toBe(false);
    expect(chiefTidies(chief, { ...task, routineRunId: "run" }, opener, recipient)).toBe(false);
  });

  it("needs authority over both the opener and the thread's own bot, which reach alone never gives", () => {
    expect(chiefTidies(chief, task, { ...opener, section: "Private" }, recipient)).toBe(false);
    expect(chiefTidies(chief, task, opener, { ...recipient, section: "Private" })).toBe(false);
    expect(chiefTidies(chief, task, { ...opener, hidden: true }, recipient)).toBe(false);
    expect(chiefTidies(chief, task, undefined, recipient)).toBe(false);
    expect(chiefTidies(chief, task, { ...opener, visibility: { people: ["person@example.test"] } }, recipient)).toBe(false);
    expect(chiefTidies({ ...chief, managedSections: ["Private"] }, task, { ...opener, section: "Private" }, { ...recipient, section: "Private" })).toBe(true);
  });
});

describe("chiefOfStaffSystemPrompt roster caps", () => {
  it("clips oversized persona fields instead of interpolating them whole", () => {
    const prompt = chiefOfStaffSystemPrompt(
      "chief",
      [
        { id: "chief", name: "Atlas" },
        {
          id: "big",
          name: "N".repeat(500),
          title: "T".repeat(500),
          description: "D".repeat(10_000),
        },
      ],
      true,
    );
    const rosterLine = prompt.split("\n").find((line) => line.startsWith("- N"))!;
    expect(rosterLine.length).toBeLessThan(500);
    expect(rosterLine).toContain("…");
  });

  it("caps the roster length and says how many were left out", () => {
    const team = Array.from({ length: 60 }, (_, i) => ({ id: `bot${i}`, name: `Bot ${i}` }));
    const prompt = chiefOfStaffSystemPrompt("chief", [{ id: "chief", name: "Atlas" }, ...team], true);
    expect(prompt).toContain("Bot 39");
    expect(prompt).not.toContain("Bot 40 —");
    expect(prompt).toContain("…and 20 more");
  });
});

describe("chiefOfStaffSystemPrompt", () => {
  const bots = [
    { id: "chief", name: "Atlas", title: "Operations", section: "Work" },
    { id: "writer", name: "Quill", title: "Writer", description: "Drafts concise copy", section: "Work" },
    { id: "coder", name: "Patch", title: "Engineer", busy: true, section: "Work" },
    { id: "hidden", name: "Secret", hidden: true, section: "Work" },
    { id: "personal", name: "Scout", title: "Travel planner", section: "Personal" },
  ];

  it("describes visible teammates and roles, but not who is busy", () => {
    const prompt = chiefOfStaffSystemPrompt("chief", bots, true);

    expect(prompt).toContain("Chief of Staff for the Work department");
    expect(prompt).toContain("Quill — Writer: Drafts concise copy [id: writer]");
    expect(prompt).toContain("Patch — Engineer [id: coder]");
    expect(prompt).not.toContain("working right now");
    expect(prompt).not.toContain("(available)");
    expect(prompt).not.toContain("Secret");
    expect(prompt).toContain("Other bots you can reach, in other departments:\n- Scout — Travel planner (Personal) [id: personal]");
    expect(prompt).not.toContain("Travel planner (Personal): ");
    expect(prompt).not.toContain("Atlas —");
    expect(prompt).toContain("coordinate_bots assigns bounded work");
    expect(prompt).toContain("end the turn");
    expect(prompt).toContain("accepted results resume you");
    expect(prompt).toContain("Never poll");
    expect(prompt).toContain("consult:true for advice");
    expect(prompt).toContain("Advice is not execution evidence");
    expect(prompt).not.toMatch(/\b(delegate_bot|ask_bot|send_to_bot|check_delegation|wait_delegation)\b/);
    expect(prompt).toContain("propose_team_setup");
    expect(prompt).toContain("pending ends the turn");
  });

  it("puts every department's bots on the team of a Chief in charge of all of them, and says new ones join", () => {
    const everywhere = bots.map(bot => bot.id === "chief" ? { ...bot, chiefOfStaff: true, managedSections: ["", "Personal"] } : bot);
    const prompt = chiefOfStaffSystemPrompt("chief", everywhere, true, undefined, ["Work", "Personal"]);
    expect(prompt).toContain("The owner also made you responsible for every department, and each new department becomes yours as it is added.");
    expect(prompt).toContain("Reaching a bot outside your team gives you no authority over it");
    expect(prompt).not.toContain("Reaching a bot gives you no authority over it");
    expect(prompt).toMatch(/Your team, in every department:\n(?:- .*\n)*- Scout — Travel planner \(Personal\) \[id: personal\]/);
    expect(prompt).not.toContain("Other bots you can reach, in other departments:");
    // A department it was not ticked for: the list it has, no promise about new ones.
    const some = chiefOfStaffSystemPrompt("chief", everywhere, true, undefined, ["Work", "Personal", "Legal"]);
    expect(some).toContain("The owner also made you responsible for these departments: General, Personal.");
    expect(some).not.toContain("every department");
    expect(chiefOfStaffSystemPrompt("chief", bots, true, undefined, ["Work", "Personal"])).not.toContain("every department");
  });

  it("limits the no-authority line to bots outside the team of a person's Chief", () => {
    const personal = [{ id: "maus", name: "MausBot", chiefOfStaff: true, defaultBot: { person: "ada@example.test" } }, { id: "mail", name: "Mail" }];
    const prompt = chiefOfStaffSystemPrompt("maus", personal, true);
    expect(prompt).toContain("Reaching a bot outside your team gives you no authority over it");
    expect(prompt).not.toContain("Reaching a bot gives you no authority over it");
  });

  it("is the person's assistant, does the work itself and adds a specialist without asking", () => {
    const prompt = chiefOfStaffSystemPrompt("chief", [{ id: "chief", name: "Atlas" }], true);

    expect(prompt).toContain("You are the person's assistant");
    expect(prompt).toContain("Do your part");
    expect(prompt).toContain("Create a specialist with create_bot");
    expect(prompt).toContain("genuine skill/parallel-work gap, not duplicates");
    expect(prompt).toContain("list_team_library offers ready roles");
    expect(prompt, "a suggestion no longer waits on a card").not.toMatch(/suggestion|Not now/);
  });

  it("does not promise delegation when the engine cannot mount agent tools", () => {
    const prompt = chiefOfStaffSystemPrompt("chief", bots, false);

    expect(prompt).toContain("cannot contact teammates");
    expect(prompt).not.toContain("coordinate_bots");
    expect(prompt, "never name a tool the engine cannot call").not.toContain("create_bot");
  });

  it("follows staffing result states", () => {
    const prompt = chiefOfStaffSystemPrompt("chief", bots, true);
    expect(prompt).toContain("Applied continues without another yes");
    expect(prompt).toContain("pending ends the turn");
    expect(prompt).toContain("Report failure/cancellation honestly");
    expect(prompt).toContain("Normal permissions and consent apply");
    expect(prompt).toContain("explicit deletion uses propose_bot_deletion");
    expect(prompt).not.toContain("End your turn after the proposal:");
  });

  it("bounds coordination text while retaining workflow safeguards", () => {
    const prompt = chiefOfStaffSystemPrompt("chief", bots, true);
    expect(prompt.length).toBeLessThan(3600);
    for (const rule of [/Refusal means nothing sent/, /Never poll/, /native helpers/, /retry_thread at most twice/, /never person-started threads/]) expect(prompt).toMatch(rule);
    expect(prompt).toContain(EVERYONE_ON_THE_MAP);
  });
  it("tells a place's MausBot that is not the Chief that the person's day and brief are its own, and a member's that they are not", () => {
    const place = chiefOfStaffSystemPrompt("maus", [{ id: "maus", name: "MausBot", defaultBot: {} }], true);
    expect(place).toContain("but you are not the Chief: team incidents stay with the Chief.");
    expect(place).toContain("Keeping an eye on the person's day and their daily brief are yours.");
    const member = chiefOfStaffSystemPrompt("maus", [{ id: "maus", name: "MausBot", defaultBot: { person: "ada@example.test" } }], true);
    expect(member).toContain("but you are not the Chief: the daily brief and team incidents stay with the Chief.");
    expect(member).not.toContain("daily brief are yours");
  });
});

describe("an @everyone line from the Team map", () => {
  const team = [{ id: "chief", name: "Clive", chiefOfStaff: true }, { id: "mail", name: "Mail" }, { id: "books", name: "Books" }];

  it("tells the Chief it alone gets the line and passes it only to the bots it concerns", () => {
    const prompt = chiefOfStaffSystemPrompt("chief", team, true);
    expect(prompt).toContain(EVERYONE_ON_THE_MAP);
    expect(EVERYONE_ON_THE_MAP).toContain("never to all of them by default");
  });

  it("says nothing of it to a Chief that cannot hand work on, or to a MausBot that only holds the tools", () => {
    expect(chiefOfStaffSystemPrompt("chief", team, false)).not.toContain(EVERYONE_ON_THE_MAP);
    const maus = [{ id: "maus", name: "MausBot", defaultBot: { person: "ada@example.test" } }, ...team.slice(1)];
    expect(chiefOfStaffSystemPrompt("maus", maus, true)).not.toContain(EVERYONE_ON_THE_MAP);
  });
});
