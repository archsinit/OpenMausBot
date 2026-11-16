import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { registerUnsupportedAndroidIpc } from "./retired-automation.mjs";

test("startup has no Android controller or ADB helper", () => {
  const main = readFileSync(new URL("./main.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(main, /createAndroidDeviceController|android-device\.mjs|androidDevice\.registerIpc/);
  assert.equal(existsSync(new URL("./android-device.mjs", import.meta.url)), false);
  assert.match(main, /registerUnsupportedAndroidIpc\(ipcMain, localOnly\)/);
  assert.match(main, /companionE2E\.start\(/);
  assert.match(main, /phonePushAccess/);
  assert.match(main, /talk\.start\(/);
});

test("stale Android IPC calls only reject, with the sender guard intact", async () => {
  const handlers = new Map();
  const guarded = [];
  registerUnsupportedAndroidIpc({ handle: (channel, handler) => handlers.set(channel, handler) },
    (channel, handler) => { guarded.push(channel); return handler; });
  assert.deepEqual(guarded, ["android-device:status", "android-device:frame", "android-device:input"]);
  for (const handler of handlers.values()) {
    await assert.rejects(handler({}, "USB123", { type: "tap", x: 0.5, y: 0.5 }), /Phone automation is unsupported/);
  }
});

test("old preload phone methods reject without invoking main; chat pairing and files remain", async () => {
  const require = createRequire(import.meta.url);
  const calls = [];
  let api;
  const entry = require.resolve("electron");
  require.cache[entry] = { id: entry, filename: entry, loaded: true, exports: {
    ipcRenderer: { on() {}, removeListener() {}, invoke: async (...args) => { calls.push(args); } },
    contextBridge: { exposeInMainWorld: (_name, value) => { api = value; } },
    webUtils: { getPathForFile: () => "/fixture/file.txt" },
  } };
  require("./preload.cjs");
  for (const method of ["status", "frame", "input"]) {
    await assert.rejects(api.androidDevice[method]("USB123", { type: "text", text: "hello" }), /Phone automation is unsupported/);
  }
  assert.deepEqual(calls, []);
  assert.equal(typeof api.onChatLink, "function");
  assert.equal(api.getPathForFile({}), "/fixture/file.txt");
  await api.companion.pairing();
  assert.equal(calls.at(-1)[0], "companion:pairing");
});
