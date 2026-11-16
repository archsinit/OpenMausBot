import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import localOrigin from "./local-origin.cjs";

test("browser grant bridge is local-only and keeps the exact device and boolean", async () => {
  const source = readFileSync(new URL("./main.mjs", import.meta.url), "utf8");
  const start = source.indexOf('ipcMain.handle("companion:browser-control"');
  const end = source.indexOf('ipcMain.handle("companion:revoke"', start);
  assert.ok(start >= 0 && end > start);
  let handle;
  const calls = [];
  localOrigin.setLocalOrigin("http://127.0.0.1:49210");
  vm.runInNewContext(source.slice(start, end), {
    ipcMain: { handle: (_channel, handler) => { handle = handler; } },
    localOnly: localOrigin.localOnly,
    companionBrowserControlAccess: (...args) => { calls.push(args); return Promise.resolve(); },
    desktopCompanionState: () => ({ enabled: true }),
  });
  const local = { senderFrame: { url: "http://127.0.0.1:49210/" } };
  assert.deepEqual(await handle(local, "phone-1", true), { enabled: true });
  await handle(local, "phone-1", false);
  assert.deepEqual(calls, [["phone-1", true], ["phone-1", false]]);
  assert.throws(() => handle({ senderFrame: { url: "https://remote.invalid/" } }, "phone-1", true), /only available/);
  assert.equal(calls.length, 2);
});

test("browser access is unsupported without reaching the sidecar", async () => {
  const source = readFileSync(new URL("./companion.mjs", import.meta.url), "utf8");
  const start = source.indexOf("export async function companionBrowserControlAccess");
  assert.ok(start >= 0);
  const context = vm.createContext({ control: () => assert.fail("must not contact the sidecar") });
  vm.runInContext(source.slice(start).replace("export ", ""), context);
  for (const id of ["phone-1", "../other", undefined]) {
    await assert.rejects(context.companionBrowserControlAccess(id, true), /unsupported/);
  }
});
