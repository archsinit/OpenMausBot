// The Data section of a bot's system prompt. The Data server is mounted on every turn its engine supports, so its tools
// are always there; its 1.2 KB guide is sent where Data is in use and a one-line pointer elsewhere. Once a conversation
// has had the guide it keeps it, so the cached prefix changes at most once.
import { existsSync } from "node:fs";
import { join } from "node:path";

import { botFolder } from "./bot-folder.ts";
import { BUILT_IN_DATA_SYSTEM_PROMPT } from "./data/instructions.ts";
import { DATA_DB_FILE } from "./data/engine.ts";
import { SHEET_FILE } from "./data/sheet.ts";

/** Where the guide is not sent: enough for the bot to know the tools are there. */
export const DATA_TOOLS_POINTER =
  " You have Data tools for tables, spreadsheets and charts (data_load, data_describe, data_sql, data_show, data_export); load them with tool search when needed.";

/** Words that ask for work the Data tools do: loading, querying or charting a file, a sheet or a database. */
export const DATA_WORK_TERMS = [
  "data", "csv", "tsv", "xlsx", "xls", "parquet", "ndjson", "json", "spreadsheet", "sheet", "excel", "sql", "duckdb",
  "database", "table", "query", "chart", "graph", "plot", "pivot", "analy", "dashboard",
] as const;

/** Whether the person's words, with any Data context they attached, ask for Data work. */
export function mentionsDataWork(text: string): boolean {
  const lower = text.toLowerCase();
  return DATA_WORK_TERMS.some((term) => lower.includes(term));
}

/** Whether the bot has used Data: its database or its Data sheet exists. Nothing is opened or created. */
export function botHasData(botId: string, folder: (botId: string) => string = botFolder): boolean {
  const dir = folder(botId);
  return existsSync(join(dir, DATA_DB_FILE)) || existsSync(join(dir, SHEET_FILE));
}

/** Conversations that have had the guide, newest last, capped so the set cannot grow with every thread. */
export class GuidedThreads {
  private readonly threads = new Set<string>();
  private readonly max: number;
  constructor(max = 5_000) {
    this.max = max;
  }
  has(threadId: string): boolean {
    return this.threads.has(threadId);
  }
  add(threadId: string): void {
    this.threads.delete(threadId);
    this.threads.add(threadId);
    if (this.threads.size > this.max) this.threads.delete(this.threads.values().next().value!);
  }
}

/** The server's one decision for a turn whose Data server is mounted: the guide or the pointer. */
export function dataPrompts(deps: { hasData?: (botId: string) => boolean; threads?: GuidedThreads } = {}) {
  const hasData = deps.hasData ?? ((botId: string) => botHasData(botId));
  const threads = deps.threads ?? new GuidedThreads();
  return (botId: string, threadId: string, text: string): string => {
    if (!threads.has(threadId) && !hasData(botId) && !mentionsDataWork(text)) return DATA_TOOLS_POINTER;
    threads.add(threadId);
    return BUILT_IN_DATA_SYSTEM_PROMPT;
  };
}
