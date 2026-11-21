import { readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";

const PAGE_ROUTES = "## Where a question goes\n\n| The person asks about | Page |\n| --- | --- |\n| Approval levels, what a bot may do without asking | `approval-levels.md` |\n| Bots, roles, the review before Create, ready-made templates | `presets.md` |\n| A model or CLI the app does not ship | `custom-engines.md`, `opencode-go.md` |\n| MCP servers of their own, or the app's own MCP server | `custom-mcp-servers.md`, `mcp-server.md` |\n| Connected apps such as Gmail, Calendar, Slack or Notion | `composio.md` |\n| What a bot remembers between tasks | `memory.md` |\n| Timing, cron, time zones, paused and done routines | `routine-schedules.md` |\n| The daily brief, and the checks that run before it | `proactive-routines.md` |\n| Letting an app or a script message one bot | `bot-api.md` |\n| Letting a script drive the whole server | `headless-cli.md` |\n| Which model picks between bots, and whose key decides | `decision-model.md` |\n| How a bot chooses a tool | `tool-selection.md` |\n| Work one bot hands to another, and what wakes it | `runtime-contract.md` |\n| Teams, shared departments, incidents | `team-sharing.md`, `team-cloud.md`, `team-incidents.md` |\n| Self-hosting, a VPS, My Cloud | `self-hosting.md`, `deploy-vps.md`, `byo-vps.md`, `cloud-pro.md` |\n| Where a bot's files go, and how to get them out | `files.md`, `bot-box.md` |\n| Browser and computer control | `computer-use-integration.md`, `browser-packaging.md` |\n| Voice, images, meeting notes | `voice-mode.md`, `image-generation.md`, `meeting-notes.md` |\n\n";

const PAGE_ROUTES_0173 = PAGE_ROUTES.replace(
  "| Where a bot's files go",
  "| The same bots on more than one computer or a phone, an empty Inbox on a new device | `multi-device.md` |\n| Where a bot's files go",
);

export function indexedDocsSkill(text: string): string {
  return text.replace(/(<openmaus-skill id="openmausbot-docs" version="0\.1\.0" root=("(?:[^"\\]|\\.)*")>\n)([\s\S]*?)(\n<\/openmaus-skill>)/gu, (whole, opening: string, encodedRoot: string, instructions: string, closing: string) => {
    try {
      const root: unknown = JSON.parse(encodedRoot);
      if (typeof root !== "string" || !isAbsolute(root)) return whole;
      const source = join(root, "SKILL.md");
      const routes = [PAGE_ROUTES_0173, PAGE_ROUTES].find(table => instructions.split(table).length === 2);
      if (readFileSync(source, "utf8").trim() !== instructions || !routes) return whole;
      return opening + instructions.replace(routes, `## Where a question goes\n\nRead workflow-details.md, then the page-routing table in ${JSON.stringify(source)} before choosing a docs page.\n\n`) + closing;
    } catch {
      return whole;
    }
  });
}
