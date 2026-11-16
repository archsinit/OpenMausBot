import { botOwner, nameFromEmail } from "../shared/bot-owner.ts";
import { canManage, hasAuthority, inChargeOfEvery, peerName, renderRoster, reachablePeers, type RosterMember } from "./peer-roster.ts"; import { chiefLevel } from "./chief-level.ts";
import type { TaskRecord } from "./store.ts";

export type ChiefTeamMember = RosterMember;

/** A thread one teammate opened on another: a Chief may fold it only when it manages both. */
export function chiefTidies(
  from: RosterMember,
  task: Pick<TaskRecord, "openedBy" | "routineRunId">,
  opener: RosterMember | null | undefined,
  owner: RosterMember,
): boolean {
  return chiefLevel(from) && Boolean(task.openedBy) && !task.routineRunId &&
    opener != null && canManage(from, opener) && canManage(from, owner);
}

const ROSTER_MAX_BOTS = 40;
const OTHERS_MIN_BOTS = 8;

const SPECIALISTS = "Create a specialist with create_bot only for a genuine skill/parallel-work gap, not duplicates; tell the person, who can undo it. list_team_library offers ready roles.";

const sectionKey = (section?: string): string => section?.trim() || "";

/** Names the team every turn; who is busy changes turn to turn, so it rides the volatile half instead. */
/** The Team map sends an @everyone line to the Chief alone (src/lib/map-composer.ts): every bot taking a turn of its own cost
 * a fan-out of 13 bots about 13 model turns, most of them from bots the line did not concern. */
export const EVERYONE_ON_THE_MAP = "When the person writes to @everyone on the Team map, it comes to you alone, so you decide who it concerns: hand it with coordinate_bots to the teammates whose work it touches, never to all of them by default, and do the part that is yours. If it concerns nobody else, answer it yourself.";

export function chiefOfStaffSystemPrompt(
  chiefId: string,
  bots: ChiefTeamMember[],
  canDelegate: boolean,
  also?: (bot: ChiefTeamMember) => boolean,
  departments?: readonly string[],
  opts?: { guides?: boolean },
): string {
  const chief = bots.find((bot) => bot.id === chiefId);
  const chiefSection = sectionKey(chief?.section);
  const sectionName = peerName(chiefSection) || "General";
  const owner = chief ? botOwner(chief) : null;
  const person = owner ? peerName(nameFromEmail(owner)) || "your person" : null;
  const reachable = reachablePeers(bots, chief ?? { id: chiefId, name: "" }, also);
  const team = chief ? reachable.filter((bot) => hasAuthority(chief, bot)) : reachable;
  const others = chief ? reachable.filter((bot) => !hasAuthority(chief, bot)) : [];
  const roster = renderRoster(team, {
    max: ROSTER_MAX_BOTS,
    empty: "- No other visible bots are available yet.",
    about: true,
    department: chiefSection,
  });
  const othersRoster = others.length ? renderRoster(others, {
    max: Math.max(ROSTER_MAX_BOTS - team.length, OTHERS_MIN_BOTS),
    empty: "",
    about: false,
    department: chiefSection,
  }) : "";

  const delegation = canDelegate
    ? "coordinate_bots assigns bounded work (consult:true for advice); list_bots/list_room_targets give live IDs. Brief clearly, end the turn; accepted results resume you. Never poll or substitute native helpers for named bots. Refusal means nothing sent; fix and retry. Verify outcomes, rework:true for corrections, then consolidate. Advice is not execution evidence."
    : "This engine cannot contact teammates; ask for a delegation-compatible engine before promising a handoff.";

  const isChief = !chief?.defaultBot || chief.chiefOfStaff === true;
  const everywhere = Boolean(chief && departments && inChargeOfEvery(chief, departments));
  const responsibleFor = everywhere ? "every department, and each new department becomes yours as it is added"
    : chief?.managedSections?.length ? `these departments: ${chief.managedSections.map(s => peerName(s) || "General").join(", ")}` : "";
  if (opts?.guides) return [
    isChief
      ? person ? `You are ${person}'s assistant and Chief of Staff; their bots in every department are your team.` : `You are the person's assistant and Chief of Staff for ${sectionName}.`
      : `You have Chief tools for ${sectionName}, not the Chief role. Team incidents stay with the Chief; ${chief?.defaultBot?.person ? "their daily brief does too" : "the person's day and daily brief remain yours"}.`,
    responsibleFor && `Also responsible for ${responsibleFor}.`,
    "Reach is not authority; other bots retain their own permissions. Outside-team setup, threads and incidents stay with their Chief.",
    canDelegate ? "Read coordination.md for team workflows." : "This engine cannot contact teammates.",
    person ? `Your team (reports to ${person}):` : `Your team (${everywhere ? "all departments" : chief?.managedSections?.length ? "managed departments" : sectionName}):`,
    roster,
    othersRoster && "Reachable outside your authority:",
    othersRoster,
  ].filter(Boolean).join("\n");
  return [
    isChief
      ? person
        ? `You are ${person}'s assistant and Chief of Staff: their one point of contact. The bots that report to ${person}, in every department, are your team: you direct their work, and their incidents come to you.`
        : `You are the person's assistant and the Chief of Staff for the ${sectionName} department: their one point of contact.`
      : chief?.defaultBot?.person
        ? `You hold a Chief of Staff's tools for the ${sectionName} department, but you are not the Chief: the daily brief and team incidents stay with the Chief.`
        : `You hold a Chief of Staff's tools for the ${sectionName} department, but you are not the Chief: team incidents stay with the Chief. Keeping an eye on the person's day and their daily brief are yours.`,
    responsibleFor
      ? `The owner also made you responsible for ${responsibleFor}. You supervise their bots and may propose setup changes there. You remain the user's single point of contact. This does not grant other bots your access, change their tool permissions, or expose unrelated conversation history.`
      : "",
    canDelegate && `Every other bot on this team, in any department, is reachable too: consult it or hand it work with coordinate_bots whenever a job needs it, without asking anyone to set anything up. Reaching a bot${responsibleFor || person ? " outside your team" : ""} gives you no authority over it: its setup, its threads and its incidents stay with its own Chief, so ask rather than direct.`,
    "Do your part; delegate useful independent work, never invent progress. Read coordination.md for workflows when available. Normal permissions and consent apply.",
    canDelegate ? "Save all-bot preferences once with memory_update action prefer, not mass delegation. For team configuration use list_team_setup then propose_team_setup; explicit deletion uses propose_bot_deletion. Applied continues without another yes; pending ends the turn. Report failure/cancellation honestly." : "",
    canDelegate ? SPECIALISTS : "",
    canDelegate && isChief ? EVERYONE_ON_THE_MAP : "",
    canDelegate && isChief ? "Incidents arrive in Problems to look at. retry_thread at most twice; correct briefs with coordinate_bots, or report human-only blockers and stop. Close only completed idle teammate-opened threads you manage, never person-started threads." : "",
    delegation,
    person ? `Bots that report to ${person} (your team):` : everywhere ? "Your team, in every department:" : chief?.managedSections?.length ? "Your team, in the departments you are responsible for:" : `Current ${sectionName} department (your team):`,
    roster,
    othersRoster && (person ? "Other bots you can reach (they report to someone else):" : "Other bots you can reach, in other departments:"),
    othersRoster,
  ].filter(Boolean).join("\n");
}
