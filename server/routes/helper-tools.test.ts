import { describe, expect, it, vi } from "vitest";
import { createHelperToolRoutes, type HelperToolContext } from "./helper-tools.ts";
import { RETIRED_AUTOMATION_ERROR } from "./retired-automation.ts";
import { PASS } from "./table.ts";

describe("specialized helper retirement", () => {
  it.each(["decide", "extract", "unknown"])("refuses %s before reading input or calling a model", async name => {
    const ask = vi.fn();
    const extract = vi.fn();
    const route = createHelperToolRoutes({ decider: { ask }, extractor: { extract } });
    for (const method of ["GET", "POST", "PUT", "DELETE", "OPTIONS"]) {
      const json = vi.fn();
      const readBody = vi.fn();
      const folders = vi.fn();
      const res = {} as never;
      await route({ method, path: `/api/internal/helpers/${name}`, res, json, readBody, folders } as unknown as HelperToolContext);
      expect(json).toHaveBeenCalledWith(res, 410, RETIRED_AUTOMATION_ERROR);
      expect(readBody).not.toHaveBeenCalled();
      expect(folders).not.toHaveBeenCalled();
    }
    expect(ask).not.toHaveBeenCalled();
    expect(extract).not.toHaveBeenCalled();
  });

  it.each(["/api/internal/research/search", "/api/internal/pages/publish", "/api/internal/helpers-other"])("passes unrelated %s", async path => {
    const route = createHelperToolRoutes({} as never);
    expect(await route({ path } as HelperToolContext)).toBe(PASS);
  });
});
