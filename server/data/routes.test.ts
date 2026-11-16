import { describe, expect, it, vi } from "vitest";
import { createDataRoutes, type DataRouteDeps } from "./routes.ts";
import { RETIRED_AUTOMATION_ERROR } from "../routes/retired-automation.ts";
import { PASS, type RouteContext } from "../routes/table.ts";

describe("retired transport factory", () => {
  const deps = new Proxy({}, { get() { throw new Error("Retired transport must not touch dependencies"); } });
  const route = createDataRoutes(deps as unknown as DataRouteDeps);

  it.each(["/api/bots/bot-1/data","/api/bots/bot-1/data/run","/api/bots/bot-1/data/page","/api/bots/bot-1/data/export","/api/bots/bot-1/data/cards/c_1/image","/api/internal/data/mcp","/api/internal/mcp-http/data"])("rejects %s before touching dependencies or request bodies", async path => {
    for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
      const json = vi.fn();
      const readBody = vi.fn();
      const res = { setHeader: vi.fn() };
      await route({ path, method, json, readBody, res } as unknown as RouteContext);
      expect(json).toHaveBeenCalledWith(res, 410, RETIRED_AUTOMATION_ERROR);
      expect(readBody).not.toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith("cache-control", "no-store");
    }
  });

  it.each(["/api/threads/old/messages/m/file","/api/internal/pages/publish","/api/internal/apps/publish"])("preserves %s", async path => {
    expect(await route({ path } as RouteContext)).toBe(PASS);
  });
});
