import type { ServerResponse } from "node:http";
import type { Decider } from "../decider/index.ts";
import type { Extractor } from "../extractor/index.ts";
import type { json as sendJson } from "../harness/http.ts";
import type { BotFolders } from "../pages/bundle.ts";
import { RETIRED_AUTOMATION_ERROR } from "./retired-automation.ts";
import { PASS } from "./table.ts";

export interface HelperToolDeps {
  decider: Pick<Decider, "ask">;
  extractor: Pick<Extractor, "extract">;
}

export interface HelperToolContext {
  method: string;
  path: string;
  res: ServerResponse;
  json: typeof sendJson;
  botId: string;
  readBody: () => Promise<unknown>;
  folders: BotFolders;
}

export function createHelperToolRoutes(_deps: HelperToolDeps) {
  return async (ctx: HelperToolContext): Promise<typeof PASS | void> => {
    if (!/^\/api\/internal\/helpers(?:\/|$)/.test(ctx.path)) return PASS;
    return ctx.json(ctx.res, 410, RETIRED_AUTOMATION_ERROR);
  };
}
