import { describe, expect, it, vi } from "vitest";
import { createPhoneGate, type PhoneGateContext } from "./phone-gate.ts";
import { RETIRED_AUTOMATION_ERROR } from "./retired-automation.ts";
import { PASS } from "./table.ts";

describe("retired phone claims", () => {
  it("refuses claims for every method without taking resources or reading a body", async () => {
    const deps = new Proxy({}, { get() { throw new Error("Must not acquire the phone"); } });
    const gate = createPhoneGate(deps as never);
    gate.holdChanged(true);
    gate.holdChanged(false);
    for (const method of ["GET", "POST", "PUT", "DELETE"]) {
      const json = vi.fn();
      const readBody = vi.fn();
      const requireActive = vi.fn();
      const res = {} as never;
      await gate.internal({ method, path: "/api/internal/phone/claim", json, res, readBody, requireActive } as unknown as PhoneGateContext);
      expect(json).toHaveBeenCalledWith(res, 410, RETIRED_AUTOMATION_ERROR);
      expect(readBody).not.toHaveBeenCalled();
      expect(requireActive).not.toHaveBeenCalled();
    }
  });

  it("passes ordinary chat pairing", async () => {
    const gate = createPhoneGate({} as never);
    expect(await gate.internal({ path: "/api/pair/sessions" } as PhoneGateContext)).toBe(PASS);
  });
});
