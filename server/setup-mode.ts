// /setup coaching rewrites only this turn's text and adds a prompt block; it grants no authority (the services still check the caller).

const SETUP_COMMAND = /^\/setup(?:\s+|$)([\s\S]*)$/i;

export function parseSetupCommand(text: string): { request: string } | null {
  const match = text.trim().match(SETUP_COMMAND);
  if (!match) return null;
  return { request: match[1]!.trim() };
}

export function expandSetupTurnText(userText: string): string {
  const setup = parseSetupCommand(userText);
  if (!setup) return userText;
  return setup.request
    ? `Set yourself up for this job: ${setup.request}`
    : "Set yourself up. Ask me what you need to know, then propose your configuration.";
}

export function setupModeActive(input: { soul?: string; description?: string; text: string }): boolean {
  return parseSetupCommand(input.text) !== null;
}

// skill_manage is mounted only with skill authoring on: never name a tool the model cannot call.
const SKILL_MANAGE_ASIDE = "(keep SOUL.md short; put step-by-step procedure into a skill with skill_manage)";
const NO_SKILL_MANAGE_ASIDE = "(keep SOUL.md short; describe procedures plainly in your standing instructions for now)";

function folderClause(cwd: string | undefined): string {
  return cwd
    ? `which folder on this computer it should work in (today that is ${cwd}; offer to keep it)`
    : "which folder on this computer it should work in (today it has none and works in a private workspace; offer to keep that, or ask for a path)";
}

export type SetupConnectedApps =
  | { state: "available" }
  | { state: "off"; noTools: boolean }
  | { state: "not-configured"; host: "server" | "desktop" | "cloud" }
  | { state: "unsupported" };

export function connectedAppsForSetup(input: {
  mounted: boolean;
  engine: boolean;
  configured: boolean;
  enabled: boolean;
  grants: Record<string, unknown> | undefined;
  host: "server" | "desktop" | "cloud";
}): SetupConnectedApps {
  const noTools = input.grants !== undefined && Object.keys(input.grants).length === 0;
  if (input.mounted && !noTools) return { state: "available" };
  if (!input.engine) return { state: "unsupported" };
  if (!input.configured) return { state: "not-configured", host: input.host };
  if (!input.enabled || noTools) return { state: "off", noTools };
  return { state: "not-configured", host: input.host };
}

const NO_APP = "so you cannot connect an app such as Gmail yourself. If the job needs one,";
const KEY_PLACE = "Composio project key in Settings → API keys, under Self-host connected apps";

function connectedAppsClause(apps: SetupConnectedApps): string {
  switch (apps.state) {
    case "available":
      return " Connect each app or account the job needs, such as Gmail, Slack or Notion, yourself rather than sending the user to settings: in this same turn, even with questions still open, make COMPOSIO_MANAGE_CONNECTIONS for its toolkit (for example gmail) your last tool call. The user gets a Connect card in this chat; end the turn there, and you continue automatically once it is connected.";
    case "off":
      return apps.noTools
        ? ` You have no connected-app tools, ${NO_APP} ask the user to open your settings → Access → Connected apps, turn it on, connect the app with Connect an app…, and give you its tools.`
        : ` Connected apps are switched off for you, ${NO_APP} ask the user to turn on Connected apps in your settings under Access, then tell you to go on; you can start the connection after that.`;
    case "not-configured":
      if (apps.host === "cloud") return ` Connected apps come with their MausBot Cloud plan but are not answering right now, ${NO_APP} say so in one sentence and suggest trying again in a few minutes.`;
      if (apps.host === "desktop") return ` Connected apps are not answering right now, ${NO_APP} say so in one sentence: restarting OpenMausBot usually brings them back, or they can add their own ${KEY_PLACE}.`;
      return ` Connected apps are not set up here, ${NO_APP} say so in one sentence: they are set up by adding a ${KEY_PLACE}.`;
    case "unsupported":
      return ` Your current model cannot use connected apps, ${NO_APP} say so in one sentence.`;
  }
}

// The Chief role is a flag propose_profile cannot touch, but a soul saying "your only job is X" would still narrow it.
const CHIEF_CLAUSE =
  " You are also the Chief of Staff, and setting yourself up does not change that: keep your Chief duties, add this job to your standing instructions instead of replacing them, and never write that this job is all you do.";

function buildSetupPrompt(profileAside: string, apps: SetupConnectedApps, cwd?: string, chief?: boolean): string {
  return (
    "\n\nExplicit setup request: configure this job, preserving existing person-authored instructions." +
    (chief ? CHIEF_CLAUSE : "") +
    ` Clarify only missing job, timing, apps/accounts and ${folderClause(cwd)}. Explain scope, changes and exclusions before tools, not an extra yes for already-requested actions.` +
    ` Use propose_profile for identity, rules ${profileAside} and cwd; trigger for requested schedules/events; request_credential for tokens.` +
    " Follow results: applied continues with Undo; pending ends the turn for the in-app decision. Never infer success from Full Access or expand another bot's permissions. Report failure/cancellation and remaining manual steps." +
    connectedAppsClause(apps)
  );
}

export interface SetupPromptOptions {
  skills?: boolean;
  cwd?: string;
  connectedApps: SetupConnectedApps;
  /** The bot is its scope's Chief of Staff. */
  chief?: boolean;
}

export function setupSystemPrompt(active: boolean, options: SetupPromptOptions): string {
  if (!active) return "";
  return buildSetupPrompt(options.skills ? SKILL_MANAGE_ASIDE : NO_SKILL_MANAGE_ASIDE, options.connectedApps, options.cwd, options.chief);
}
