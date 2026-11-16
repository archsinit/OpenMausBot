import type { PhoneHold } from "../phone-screen/hold.ts";
import type { RequestAuth } from "../request-auth.ts";
import { retiredAutomationRoutes } from "./retired-automation.ts";
import type { RouteHandler } from "./table.ts";
import type { Upgrades } from "./upgrades.ts";

export interface PhoneScreenRouteDeps {
  upgrades: Upgrades;
  /** Read on every request: while false both routes are absent, and nothing runs adb or downloads. */
  enabled(): boolean;
  /** Whether the sign-in a stream was opened with still stands. */
  live(auth: RequestAuth): boolean;
  /** The person's hold on the phone. Every stream may take it and hand it back; its changes come back through `holdChanged`. */
  hold: Pick<PhoneHold, "held" | "take" | "release" | "used" | "watched">;
  /** The scrcpy server file is kept under it. */
  dataDir: string;
  /** A verified scrcpy server file; `ensureScrcpyServer(dataDir)` when unset. */
  serverFile?: () => Promise<string>;
  /** The adb executable; `resolveAdbPath()` when unset. */
  adbPath?: () => string | null;
}


export function createPhoneScreenRoutes(_deps: PhoneScreenRouteDeps): {
  route: RouteHandler;
  holdChanged(held: boolean): void;
  closeForOwner(sessionId: string): void;
  closeAll(): Promise<void>;
} {
  return {
    route: retiredAutomationRoutes,
    holdChanged() {},
    closeForOwner() {},
    async closeAll() {},
  };
}
