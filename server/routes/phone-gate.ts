import type { ServerResponse } from "node:http";
import type { json } from "../harness/http.ts";
import type { PhoneHold } from "../phone-screen/hold.ts";
import type { TurnOwner, TurnResources } from "../turn-resources.ts";
import { RETIRED_AUTOMATION_ERROR } from "./retired-automation.ts";
import { PASS } from "./table.ts";

export interface PhoneGateContext {
  method: string;
  path: string;
  res: ServerResponse;
  json: typeof json;
  turn: TurnOwner;
  requireActive: () => void;
  /** The claim's JSON body. `{ "wait": false }` comes from the middle of a tool call, which cannot wait for a person. */
  readBody: () => Promise<unknown>;
  /** Aborts when the bot's request is gone. */
  signal: AbortSignal;
}

export function createPhoneGate(_deps: {
  enabled: () => boolean;
  hold: Pick<PhoneHold, "held" | "wait">;
  resources: Pick<TurnResources, "holder">;
  claim: (owner: TurnOwner, resource: string) => boolean;
}) {
  return {
    holdChanged(_held: boolean): void {},
    async internal(ctx: PhoneGateContext): Promise<typeof PASS | void> {
      if (!/^\/api\/internal\/phone(?:\/|$)/.test(ctx.path)) return PASS;
      return ctx.json(ctx.res, 410, RETIRED_AUTOMATION_ERROR);
    },
  };
}
