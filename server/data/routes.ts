import type { DataErrorCode } from "../../shared/data-surface.ts";
import { retiredAutomationRoutes } from "../routes/retired-automation.ts";
import type { RouteHandler } from "../routes/table.ts";
import type { DataSheetRegistry } from "./sheet.ts";
import type { ChartCompiler, ChartRenderer, DataEngine, VegaLiteValidator } from "./types.ts";

export interface DataRouteDeps {
  bot(id: string): { id: string; cwd?: string } | null | undefined;
  engine: Pick<DataEngine, "unavailable" | "forBot">;
  sheets: Pick<DataSheetRegistry, "for">;
  compileChart: ChartCompiler;
  validateVegaLite: VegaLiteValidator;
  renderer: ChartRenderer;
  exportRoots(bot: { id: string; cwd?: string }): string[];
}


export function dataErrorStatus(code: DataErrorCode): number {
  switch (code) {
    case "invalid_input": return 400;
    case "card_not_found": case "table_not_found": case "source_not_found": return 404;
    case "write_refused": case "cancelled": return 409;
    case "engine_unavailable": case "timeout": return 503;
    default: return 422;
  }
}

export function createDataRoutes(_deps: DataRouteDeps): RouteHandler {
  return retiredAutomationRoutes;
}
