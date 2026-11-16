import { createServer, type Server } from "node:http";
import { afterEach, expect, it } from "vitest";
import { DeviceRegistry } from "../src/devices.ts";
import { createProxyHandler } from "../src/proxy.ts";
import { denyReason } from "../src/routes.ts";

const retired = [
  "/api/phones", "/api/phones/self", "/api/phones/self/jobs",
  "/api/phones/self/jobs/job-1/lease", "/api/phones/self/jobs/job-1/result",
  "/api/phones/companion:old/control", "/api/bots/b1/phone/screenshot",
];
const servers: Server[] = [];
afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
    server.closeAllConnections();
  })));
});
async function listen(server: Server) {
  servers.push(server);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  return (server.address() as { port: number }).port;
}

it("refuses all paired phone automation methods and keeps authentication required", () => {
  for (const path of retired) {
    for (const method of ["GET", "PUT", "POST", "PATCH", "DELETE"]) {
      expect(denyReason({ path, method, authenticated: true })).toEqual({
        status: 410, error: "Phone automation is unsupported",
      });
      expect(denyReason({ path, method, authenticated: false })?.status).toBe(401);
    }
  }
});

it("pairs normally and proxies chat, attachments, files and push, never phone control", async () => {
  const forwarded: string[] = [];
  const upstreamPort = await listen(createServer((req, res) => {
    forwarded.push(`${req.method} ${req.url}`);
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ ok: true }));
  }));
  const registry = new DeviceRegistry();
  const pairing = registry.openPairing();
  const handler = createProxyHandler({
    harnessPort: upstreamPort,
    authenticate: token => registry.authenticate(token),
    redeem: (...args) => registry.redeem(...args),
    serverName: () => "Isolated fixture",
  });
  const port = await listen(createServer(handler));
  const origin = `http://127.0.0.1:${port}`;
  const pair = await fetch(origin + "/api/pair", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ code: pairing.code, deviceName: "Chat phone" }),
  });
  expect(pair.status).toBe(201);
  const { token } = await pair.json() as { token: string };
  expect(registry.authenticate(token)).not.toBeNull();
  for (const path of retired) {
    const response = await fetch(origin + path, {
      method: "POST", headers: { authorization: `Bearer ${token}` },
    });
    expect(response.status, path).toBe(410);
    expect(await response.json()).toEqual({ error: "Phone automation is unsupported" });
  }
  expect(forwarded).toEqual([]);
  const preserved = [
    ["GET", "/api/bots"], ["GET", "/api/threads/t1/messages"],
    ["POST", "/api/bots/b1/messages"], ["POST", "/api/attachments"], ["POST", "/api/files"],
    ["POST", "/api/threads/t1/messages/m1/file"], ["PUT", "/api/push/device"],
    ["PUT", "/api/push/activity"],
  ];
  for (const [method, path] of preserved) {
    const response = await fetch(origin + path, {
      method, headers: { authorization: `Bearer ${token}` },
    });
    expect(response.status, path).toBe(200);
    await response.text();
  }
  expect(forwarded).toEqual(preserved.map(([method, path]) => `${method} ${path}`));
  handler.closeViewers();
});
