import { PASS, type RouteHandler } from "./table.ts";

export const RETIRED_AUTOMATION_ERROR = { error: "Desktop and browser automation has been retired.", code: "automation_retired" } as const;

/** Match automation transports only, not model OAuth, connected apps, chat or workspace files. */
export function isRetiredAutomationPath(path: string): boolean {
  return /^\/api\/(?:computers|team-computers|local-computer|shared-computers|desktop-viewer|browser-sites|browser-engine)(?:\/|$)/.test(path)
    || /^\/api\/bots\/[^/]+\/(?:computer|browser|saved-steps)(?:\/|$)/.test(path)
    || /^\/api\/internal\/(?:computer|computer-control|browser|shared-computers|saved-steps|lent)(?:\/|$)/.test(path)
    || /^\/api\/internal\/mcp-http\/(?:browser|computer)(?:\/|$)/.test(path)
    || path === "/api/internal/vm-exec"
    || path === "/api/internal/fill-login"
    || path === "/api/desktop/shared-computer-control";
}

export const retiredAutomationRoutes: RouteHandler = async ({ res, path, json }) => {
  if (!isRetiredAutomationPath(path)) return PASS;
  res.setHeader("cache-control", "no-store");
  return json(res, 410, RETIRED_AUTOMATION_ERROR);
};

export function withoutRetiredAutomation(route: RouteHandler): RouteHandler {
  return async (context) => {
    if (await retiredAutomationRoutes(context) !== PASS) return;
    return route(context);
  };
}

const object = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;

/** Inspect product-operation envelopes, never arbitrary webhook filters or connector configuration. */
export function hasRetiredAutomationOperation(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasRetiredAutomationOperation);
  const body = object(value);
  if (!body) return false;
  if (hasRetiredAutomationSettings(body)) return true;
  if (["cloudBackend", "autoStartVps", "vpsConfig", "teamComputer", "surface", "surfaceSource"].some(key => Object.hasOwn(body, key))) return true;
  if ([body.runOn, body.run_on].some(place => place !== undefined && place !== "maus")) return true;
  return ["settings", "profile", "newBotDefaults", "plan", "operation", "operations", "fields", "bots", "teams", "sections", "routine", "routines", "webhook", "trigger", "changes", "definition"]
    .some(key => Object.hasOwn(body, key) && hasRetiredAutomationOperation(body[key]));
}

/** Reject explicit automation settings before parsing or applying any part of a request. */
export function hasRetiredAutomationSettings(value: unknown): boolean {
  const body = object(value);
  if (!body) return false;
  if (["computer", "cloudBackend", "autoStartVps", "recordBrowserSteps", "browser", "browserProfile", "vpsAlias", "browserEngine", "browserProfiles", "expectedBrowserProfiles", "localVm", "box", "vps"].some(key => Object.hasOwn(body, key))) return true;
  const features = object(body.features);
  if (features && ["browser", "sharedComputers", "savedSteps", "cloudComputerAutoReplace"].some(key => Object.hasOwn(features, key))) return true;
  return [body.settings, object(body.newBotDefaults)?.profile, body.profile].some(nested => nested !== undefined && hasRetiredAutomationSettings(nested));
}
