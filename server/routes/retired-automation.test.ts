import { createServer, request, type ServerResponse } from "node:http";
import { once } from "node:events";
import { describe, expect, it, vi } from "vitest";
import { createBrowserViewerRoutes, type BrowserViewerRouteDeps } from "./browser-viewers.ts";
import { createComputerRoutes, type ComputerRouteDeps } from "./computers.ts";
import { createDesktopViewer } from "./desktop-viewer.ts";
import { createConfigRoutes, type ConfigRouteDeps } from "./config.ts";
import { hasRetiredAutomationOperation, hasRetiredAutomationSettings, isRetiredAutomationPath, RETIRED_AUTOMATION_ERROR, retiredAutomationRoutes } from "./retired-automation.ts";
import { dispatchRoutes, PASS, type RouteContext, type RouteHandler } from "./table.ts";
import { createUpgrades } from "./upgrades.ts";

const retired = [
  "/api/computers/boxes", "/api/computers/vps/old/remove", "/api/computers/frames", "/api/computers/usage",
  "/api/team-computers/old/provision", "/api/local-computer/run", "/api/local-computer/interrupt",
  "/api/shared-computers/connect", "/api/shared-computers/old/link", "/api/browser-engine/install", "/api/browser-sites/sign-out",
  "/api/desktop-viewer/local/shared", "/api/desktop-viewer/vps/old/websockify",
  "/api/bots/old/computer", "/api/bots/old/computer/control", "/api/bots/old/computer/recovery", "/api/bots/old/computer/exec",
  ...["live", "action", "stream", "upload", "download/old"].map(action => `/api/bots/old/browser/${action}`),
  "/api/bots/old/saved-steps/run", "/api/internal/browser/mcp", "/api/internal/computer/mcp",
  "/api/internal/vm-exec", "/api/internal/fill-login",
  "/api/internal/mcp-http/browser", "/api/internal/mcp-http/computer", "/api/internal/computer/journal",
  "/api/internal/computer-control", "/api/internal/computer/select", "/api/internal/shared-computers", "/api/desktop/shared-computer-control",
];

function context(path: string, method = "GET", body: unknown = {}) {
  const json = vi.fn();
  const readBody = vi.fn(async () => body);
  return { path, method, url: new URL(path, "http://localhost"), req: { headers: {} }, res: { setHeader: vi.fn() }, auth: { kind: "loopback", scopes: ["admin"] }, json, readBody } as unknown as RouteContext & { json: typeof json; readBody: typeof readBody };
}

describe("automation retirement", () => {
  it.each(retired)("rejects %s for every method before reading bodies", async path => {
    for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
      const ctx = context(path, method);
      expect(await retiredAutomationRoutes(ctx)).not.toBe(PASS);
      expect(ctx.json).toHaveBeenCalledWith(ctx.res, 410, RETIRED_AUTOMATION_ERROR);
      expect(ctx.readBody).not.toHaveBeenCalled();
    }
  });

  it.each(["/api/config", "/api/bots/old/messages", "/api/threads/old/messages/m/file", "/api/instances", "/api/sign-in", "/api/mcp-servers", "/api/cloud-connections/connected-apps", "/api/sync/folders", "/api/internal/mcp-http/data", "/api/internal/mcp-http/email", "/api/browser-sites-other"])("preserves %s", async path => {
    expect(isRetiredAutomationPath(path)).toBe(false);
    expect(await retiredAutomationRoutes(context(path))).toBe(PASS);
  });

  it("gates dispatch even if an old handler is registered first", async () => {
    const old = vi.fn<RouteHandler>();
    expect(await dispatchRoutes([old], context("/api/internal/browser/mcp", "POST"))).toBe(true);
    expect(old).not.toHaveBeenCalled();
  });

  it("rejects directly invoked viewer and computer factories with saved settings", async () => {
    const upgrades = createUpgrades();
    const browser = createBrowserViewerRoutes({ upgrades } as BrowserViewerRouteDeps);
    const desktop = createDesktopViewer({ target: () => { throw new Error("must not resolve saved target"); }, live: () => true });
    const computers = createComputerRoutes({ cfg: { box: { token: "saved" }, features: { browser: true } } } as unknown as ComputerRouteDeps);
    for (const [route, path] of [[browser, "/api/bots/old/browser/action"], [desktop.route, "/api/desktop-viewer/local/shared/websockify"], [computers, "/api/local-computer/run"]] as const) {
      const ctx = context(path, "POST");
      await route(ctx);
      expect(ctx.json).toHaveBeenCalledWith(ctx.res, 410, RETIRED_AUTOMATION_ERROR);
      expect(ctx.readBody).not.toHaveBeenCalled();
    }
    desktop.closeAll();
    upgrades.close();
  });

  it.each([{ browserEngine: { engine: "chrome" } }, { features: { browser: true } }, { localVm: { mode: "shared" } }, { newBotDefaults: { profile: { computer: "local" } } }, { settings: { browser: true } }])("rejects automation settings atomically: %j", async body => {
    expect(hasRetiredAutomationSettings(body)).toBe(true);
    const cfg = { features: { browser: true } };
    const route = createConfigRoutes({ cfg } as ConfigRouteDeps);
    const ctx = context("/api/config", "PATCH", body);
    await route(ctx);
    expect(ctx.json).toHaveBeenCalledWith(ctx.res, 410, RETIRED_AUTOMATION_ERROR);
    expect(cfg).toEqual({ features: { browser: true } });
  });

  it("does not confuse arbitrary webhook filters or app configuration with product settings", () => {
    expect(hasRetiredAutomationOperation({ payloadFilter: { browser: "Chrome", computer: "build-host" } })).toBe(false);
    expect(hasRetiredAutomationOperation({ config: { browser: true, computer: "remote" }, filter: { surface: "news" } })).toBe(false);
    expect(hasRetiredAutomationOperation({ changes: { config: { browser: "Chrome" }, runOn: "maus" } })).toBe(false);
    expect(hasRetiredAutomationOperation({ plan: { operations: [{ fields: { browser: true } }] } })).toBe(true);
    expect(hasRetiredAutomationOperation({ changes: { runOn: "cloud" } })).toBe(true);
  });

  it("does not classify ordinary settings as automation", () => {
    expect(hasRetiredAutomationSettings({ instances: {}, profile: { name: "Ada" }, composio: {}, features: { showToolCalls: true } })).toBe(false);
  });

  it("refuses real WebSocket handshakes before any registered upgrade owner", async () => {
    const upgrades = createUpgrades();
    upgrades.route(() => true);
    const handle = vi.fn(async (_req, res: ServerResponse) => { res.writeHead(500).end(); });
    const server = createServer();
    upgrades.attach(server, handle);
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("missing fixture port");
    try {
      for (const path of ["/api/bots/old/browser/stream", "/api/desktop-viewer/local/shared/websockify", "/api/shared-computers/old/link"]) {
        const status = await new Promise<number | undefined>((resolve, reject) => {
          const req = request({ host: "127.0.0.1", port: address.port, path, headers: { Connection: "Upgrade", Upgrade: "websocket", "Sec-WebSocket-Key": "dGhlIHNhbXBsZSBub25jZQ==", "Sec-WebSocket-Version": "13" } });
          req.once("response", res => { res.resume(); resolve(res.statusCode); });
          req.once("upgrade", (_res, socket) => { socket.destroy(); reject(new Error("automation upgraded")); });
          req.once("error", reject);
          req.end();
        });
        expect(status).toBe(410);
      }
      expect(handle).not.toHaveBeenCalled();
    } finally {
      upgrades.close();
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });
});
