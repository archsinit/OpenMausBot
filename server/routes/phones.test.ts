import { describe, expect, it, vi } from "vitest";
import { createPhoneRoutes, type PhoneRouteDeps } from "./phones.ts";
import { RETIRED_AUTOMATION_ERROR } from "./retired-automation.ts";
import { PASS, type RouteContext } from "./table.ts";

describe("retired transport factory", () => {
  const deps = new Proxy({}, { get() { throw new Error("Retired transport must not touch dependencies"); } });
  const route = createPhoneRoutes(deps as unknown as PhoneRouteDeps);

  it.each(["/api/phones","/api/phones/self","/api/phones/self/jobs","/api/phones/self/jobs/old/lease","/api/phones/self/jobs/old/result","/api/phones/old"])("rejects %s before touching dependencies or request bodies", async path => {
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

  it.each(["/api/pair","/api/pair/sessions","/api/pair/sessions/push"])("preserves %s", async path => {
    expect(await route({ path } as RouteContext)).toBe(PASS);
  });
});
