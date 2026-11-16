// When a turn mounts the USB phone and Data MCP servers. Every request of a turn that has one carries its tool names, and
// Data's instructions and prompt section too (about 3 KB), whether or not the turn uses it. A server that comes and goes
// between turns also changes the cached prefix, which costs more than the bytes it saves. So each is mounted where it
// is in use, and once a conversation has it, it keeps it.
import { existsSync } from "node:fs";
import { connect } from "node:net";
import { join } from "node:path";

import { botFolder } from "./bot-folder.ts";
import { DATA_DB_FILE } from "./data/engine.ts";
import { SHEET_FILE } from "./data/sheet.ts";
import { parseDevices, resolveAdbPath } from "./drivers/phone-proxy.ts";
import { runAdb } from "./phone-screen/session.ts";
import { selectBundledSkills, type BundledSkill } from "./skill-library.ts";

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

/** Conversations that have had a server mounted, newest last, capped so the set cannot grow with every thread. */
export class MountedThreads {
  private readonly threads = new Set<string>();
  private readonly max: number;
  constructor(max = 5_000) {
    this.max = max;
  }
  has(threadId: string): boolean {
    return this.threads.has(threadId);
  }
  /** Records `threadId` when `mounted`, and passes `mounted` back. */
  keep(threadId: string, mounted: boolean): boolean {
    if (!mounted) return false;
    this.threads.delete(threadId);
    this.threads.add(threadId);
    if (this.threads.size > this.max) this.threads.delete(this.threads.values().next().value!);
    return true;
  }
}

/** One turn's decision for an optional server, once the engine can mount it at all: a conversation that had it keeps it. */
export function keepsMount(threads: MountedThreads, threadId: string, wanted: () => boolean): boolean {
  return threads.keep(threadId, threads.has(threadId) || wanted());
}

const ADB_SERVER_PORT = 5037;
const PROBE_FRESH_MS = 10_000;
const PROBE_CONNECT_MS = 300;

/** Whether something listens on the adb server's port. adb itself is never run to find out, since that starts its server. */
function adbServerUp(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = connect({ host: "127.0.0.1", port });
    const done = (up: boolean) => {
      socket.destroy();
      resolve(up);
    };
    socket.setTimeout(PROBE_CONNECT_MS, () => done(false));
    socket.once("connect", () => done(true));
    socket.once("error", () => done(false));
  });
}

export interface UsbPhoneProbeDeps {
  adbPath?: () => string | null;
  serverUp?: (port: number) => Promise<boolean>;
  devices?: (adbPath: string) => Promise<string>;
  now?: () => number;
  env?: NodeJS.ProcessEnv;
}

/** Whether a USB Android phone is plugged in and adb's server already runs, read at most every ten seconds. A server that
 * is not running means no phone work is under way: the turn's words decide then (phone-harness's trigger terms). */
export function usbPhoneProbe(deps: UsbPhoneProbeDeps = {}): () => Promise<boolean> {
  const adbPath = deps.adbPath ?? (() => resolveAdbPath());
  const serverUp = deps.serverUp ?? adbServerUp;
  const devices = deps.devices ?? ((path: string) => runAdb(path, ["devices", "-l"]));
  const now = deps.now ?? Date.now;
  const env = deps.env ?? process.env;
  let last: { at: number; attached: Promise<boolean> } | null = null;
  const read = async (): Promise<boolean> => {
    const path = adbPath();
    if (!path) return false;
    const port = Number(env.ANDROID_ADB_SERVER_PORT) || ADB_SERVER_PORT;
    if (!(await serverUp(port))) return false;
    try {
      return parseDevices(await devices(path)).some((device) => device.connection === "usb");
    } catch {
      return false;
    }
  };
  return () => {
    if (!last || now() - last.at >= PROBE_FRESH_MS) last = { at: now(), attached: read() };
    return last.attached;
  };
}

/** Whether the person's words pick the phone skill (phone-harness's trigger terms: "android", "my phone", "adb"…). */
export function asksForPhone(text: string, skills: readonly BundledSkill[]): boolean {
  return selectBundledSkills(text, ["phoneMcp"], skills).some(({ manifest }) => manifest.requiredCapabilities.includes("phoneMcp"));
}

/** The server's one decision for each optional mount, called only where the engine can mount it at all. */
export function optionalMounts(deps: { usbPhoneAttached?: () => Promise<boolean>; hasData?: (botId: string) => boolean } = {}) {
  const phoneThreads = new MountedThreads(), dataThreads = new MountedThreads();
  const attached = deps.usbPhoneAttached ?? usbPhoneProbe();
  const hasData = deps.hasData ?? ((botId: string) => botHasData(botId));
  return {
    /** The USB phone server: the words ask for the phone, or a phone is plugged in with adb running, or the conversation had it. */
    async phone(threadId: string, text: string, skills: readonly BundledSkill[]): Promise<boolean> {
      return phoneThreads.keep(threadId, phoneThreads.has(threadId) || asksForPhone(text, skills) || await attached());
    },
    /** The Data server: the bot has used Data, or the words ask for Data work, or the conversation had it. */
    data(botId: string, threadId: string, text: string): boolean {
      return keepsMount(dataThreads, threadId, () => hasData(botId) || mentionsDataWork(text));
    },
  };
}
