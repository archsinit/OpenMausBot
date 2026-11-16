import type { AppConfig } from "../config.ts";
import type { Decider } from "../decider/index.ts";
import type { Extractor } from "../extractor/index.ts";
import type { OpenRouterModelCatalog } from "../decider/openrouter-models.ts";
import { retiredAutomationRoutes } from "./retired-automation.ts";
import type { RouteHandler } from "./table.ts";

export interface DeciderRouteDeps {
  decider: Pick<Decider, "testKey">;
  extractor?: Pick<Extractor, "testKey">;
  models?: Pick<OpenRouterModelCatalog, "load">;
  config(): AppConfig;
}

export function createDeciderRoutes(_deps: DeciderRouteDeps): RouteHandler {
  return retiredAutomationRoutes;
}
