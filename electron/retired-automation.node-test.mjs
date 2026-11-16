import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import test from "node:test";
import { createUnsupportedComputerSharing, registerUnsupportedCuaIpc } from "./retired-automation.mjs";
import { createChromeDoor } from "./device-chrome.mjs";
import { installServerLending } from "./server-lending.mjs";
import { denyReason } from "../companion/src/routes.ts";
import { createProxyHandler } from "../companion/src/proxy.ts";
import capabilities from "./capabilities.cjs";

test("retired host cannot start drivers, lending or CDP", async () => {
  const fail = () => assert.fail("must not touch the host");
  const sharing = createUnsupportedComputerSharing({ fetch: fail, environments: fail });
  sharing.start(); sharing.cloudChanged(); await sharing.screenChanged();
  assert.equal(sharing.state().enabled, false);
  assert.deepEqual(sharing.lentToCloud(), { off: true });
  for (const method of ["save", "saveCloud", "lendOwn", "lendProjects", "lendTerminal", "resume"]) {
    assert.throws(() => sharing[method](), /unsupported/);
  }
  assert.deepEqual(await createChromeDoor({ readFile: fail, connect: fail }).open(), { refused: "unsupported" });
  const handlers = new Map();
  const ipcMain = { handle: (name, fn) => handlers.set(name, fn) };
  const guard = (_name, fn) => fn;
  registerUnsupportedCuaIpc(ipcMain, guard);
  for (const [name, fn] of handlers) {
    const result = await fn();
    assert.equal(name === "cua:connection" ? result.mode : result.status, "unavailable");
  }
  const lending = installServerLending({ ipcMain, guard, sharing: fail, dialog: fail });
  await lending.offer();
  assert.throws(() => handlers.get("sharing:allow")(), /unsupported/);
  const main = readFileSync(new URL("./main.mjs", import.meta.url), "utf8");
  const cua = readFileSync(new URL("./cua.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(main, /startCua\(|sharingController\(\)\.start\(|desktopCapturer/);
  assert.doesNotMatch(cua, /child_process|@trycua|ensureLinuxRuntime|EmbeddedCuaDriverHost/);
  assert.match(main, /talk\.start\(/);
  assert.match(main, /startUpdater\(/);
  assert.match(main, /shell\.openExternal\(url\)/);
});

test("desktop control capabilities stay off while dictation remains available", () => {
  const result = capabilities.desktopCapabilities({ platform: "darwin", localConnection: { mode: "embedded" } });
  assert.equal(result.localComputer.available, false);
  assert.equal(result.screenPreview.available, false);
  assert.equal(result.dictation.available, true);
});

test("companion denies automation even with old device grants, preserving chat and files", async t => {
  const paths = ["/api/bots/b/browser/live", "/api/bots/b/browser/action", "/api/bots/b/computer/join", "/api/bots/b/local-computer/screenshot", "/api/browser-profiles", "/api/shared-computers", "/vps-viewer/old/session"];
  for (const path of paths) {
    assert.equal(denyReason({ path, method: "POST", authenticated: true }).status, 410);
  }
  for (const [method, path] of [["POST", "/api/pair"], ["GET", "/api/bots"], ["POST", "/api/files"], ["POST", "/api/bots/b/messages"]]) {
    assert.equal(denyReason({ method, path, authenticated: true }), null);
  }
  let upstreamCalls = 0;
  const upstream = createServer((_req, res) => { upstreamCalls++; res.end("{}"); });
  await new Promise(resolve => upstream.listen(0, "127.0.0.1", resolve));
  t.after(() => upstream.close());
  const handler = createProxyHandler({ harnessPort: upstream.address().port, authenticate: () => ({ id: "phone", cloudDesktopAccess: true, browserControlAccess: true }), redeem: () => { throw new Error("unexpected pairing"); }, serverName: () => "fixture" });
  const proxy = createServer(handler);
  t.after(() => { handler.closeViewers(); proxy.close(); });
  await new Promise(resolve => proxy.listen(0, "127.0.0.1", resolve));
  for (const path of paths) {
    const response = await fetch(`http://127.0.0.1:${proxy.address().port}${path}`);
    assert.equal(response.status, 410, path);
    await response.text();
  }
  assert.equal(upstreamCalls, 0);
});
