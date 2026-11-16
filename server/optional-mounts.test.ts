import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { createServer, type Server } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { DATA_DB_FILE } from "./data/engine.ts";
import { SHEET_FILE } from "./data/sheet.ts";
import { MountedThreads, asksForPhone, botHasData, mentionsDataWork, optionalMounts, usbPhoneProbe } from "./optional-mounts.ts";
import { loadBundledSkills } from "./skill-library.ts";
import { removeTempDir } from "./testing/cleanup.ts";

const folders: string[] = [];
const folder = () => { const made = mkdtempSync(join(tmpdir(), "omb-optional-mounts-")); folders.push(made); return made; };
afterAll(async () => { for (const made of folders) await removeTempDir(made); });

const SKILLS = loadBundledSkills(join(import.meta.dirname, "..", "skills"));
const USB_PHONE = "List of devices attached\nR58M123ABC device usb:1-1 product:a51 model:SM_A515F device:a51 transport_id:1\n";

describe("the Data server's mount", () => {
  it("is asked for by words about files, sheets, SQL and charts, in any case", () => {
    for (const text of ["Load sales.CSV and chart revenue", "what's in this spreadsheet?", "run this SQL", "Plot it by month", "analyse my orders.xlsx", "Data tab"]) {
      expect(mentionsDataWork(text), text).toBe(true);
    }
    for (const text of ["Say hi.", "Remind me at noon"]) expect(mentionsDataWork(text), text).toBe(false);
  });

  it("is had by a bot whose database or Data sheet exists, without opening either", () => {
    const root = folder();
    const at = (botId: string) => join(root, botId);
    mkdirSync(at("fresh"));
    mkdirSync(at("loaded"));
    writeFileSync(join(at("loaded"), DATA_DB_FILE), "");
    mkdirSync(at("charted"));
    writeFileSync(join(at("charted"), SHEET_FILE), "{}");
    expect(botHasData("fresh", at)).toBe(false);
    expect(botHasData("missing", at)).toBe(false);
    expect(botHasData("loaded", at)).toBe(true);
    expect(botHasData("charted", at)).toBe(true);
  });

  it("stays for the rest of a conversation once it is mounted, so the cached prefix does not flip back", () => {
    const has = new Set(["user-of-data"]);
    const mounts = optionalMounts({ hasData: (botId) => has.has(botId), usbPhoneAttached: async () => false });
    expect(mounts.data("fresh", "t1", "Say hi.")).toBe(false);
    expect(mounts.data("fresh", "t1", "Load q3.csv")).toBe(true);
    expect(mounts.data("fresh", "t1", "Thanks.")).toBe(true);
    expect(mounts.data("fresh", "t2", "Thanks.")).toBe(false);
    expect(mounts.data("user-of-data", "t3", "Say hi.")).toBe(true);
  });
});

describe("the USB phone server's mount", () => {
  it("is asked for by the phone skill's words", () => {
    expect(asksForPhone("Open Uber on my phone", SKILLS)).toBe(true);
    expect(asksForPhone("is the Android app installed?", SKILLS)).toBe(true);
    expect(asksForPhone("Say hi.", SKILLS)).toBe(false);
    expect(asksForPhone("Open Uber on my phone", [])).toBe(false);
  });

  it("follows a plugged-in phone and stays for the rest of the conversation", async () => {
    let plugged = false;
    const mounts = optionalMounts({ usbPhoneAttached: async () => plugged, hasData: () => false });
    expect(await mounts.phone("t1", "Say hi.", SKILLS)).toBe(false);
    expect(await mounts.phone("t1", "Check the Android app", SKILLS)).toBe(true);
    expect(await mounts.phone("t1", "Thanks.", SKILLS)).toBe(true);
    expect(await mounts.phone("t2", "Open Uber.", SKILLS)).toBe(false);
    plugged = true;
    expect(await mounts.phone("t2", "Open Uber.", SKILLS)).toBe(true);
    plugged = false;
    expect(await mounts.phone("t2", "Thanks.", SKILLS)).toBe(true);
  });

  it("finds a phone only where adb's server already runs, never starting it, and reads adb at most every ten seconds", async () => {
    let clock = 0, listed = 0, up = false;
    const probe = usbPhoneProbe({
      adbPath: () => "/fake/adb", serverUp: async () => up, now: () => clock, env: {},
      devices: async () => { listed++; return USB_PHONE; },
    });
    expect(await probe()).toBe(false);
    expect(listed).toBe(0);
    up = true;
    clock += 5_000;
    expect(await probe(), "still the last reading").toBe(false);
    clock += 5_000;
    expect(await probe()).toBe(true);
    expect(await probe()).toBe(true);
    expect(listed).toBe(1);
  });

  it("finds none without adb, with only a network or emulator device, or when adb fails", async () => {
    const reading = (deps: Parameters<typeof usbPhoneProbe>[0]) => usbPhoneProbe({ adbPath: () => "/fake/adb", serverUp: async () => true, env: {}, ...deps })();
    expect(await reading({ adbPath: () => null })).toBe(false);
    expect(await reading({ devices: async () => "List of devices attached\nemulator-5554 device\n192.168.1.9:5555 device\n" })).toBe(false);
    expect(await reading({ devices: async () => { throw new Error("adb failed"); } })).toBe(false);
    expect(await reading({ devices: async () => USB_PHONE })).toBe(true);
  });

  it("knows adb's server by a listener on its port, from ANDROID_ADB_SERVER_PORT when set", async () => {
    const server: Server = createServer();
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const port = (server.address() as { port: number }).port;
    try {
      const seen: number[] = [];
      const probe = (env: NodeJS.ProcessEnv) => usbPhoneProbe({ adbPath: () => "/fake/adb", env, devices: async () => { seen.push(1); return USB_PHONE; } })();
      expect(await probe({ ANDROID_ADB_SERVER_PORT: String(port) })).toBe(true);
      server.close();
      await new Promise((resolve) => server.once("close", resolve));
      expect(await probe({ ANDROID_ADB_SERVER_PORT: String(port) })).toBe(false);
      expect(seen).toHaveLength(1);
    } finally {
      server.close();
    }
  });
});

describe("a conversation's mounts", () => {
  it("are remembered for a bounded number of conversations", () => {
    const threads = new MountedThreads(2);
    expect(threads.keep("a", true)).toBe(true);
    expect(threads.keep("b", false)).toBe(false);
    threads.keep("b", true);
    threads.keep("c", true);
    expect(threads.has("a")).toBe(false);
    expect(threads.has("b")).toBe(true);
    expect(threads.has("c")).toBe(true);
  });
});
