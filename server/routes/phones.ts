import type { PhoneJobs } from "../phones/jobs.ts";
import type { PhoneRegistry } from "../phones/registry.ts";
import type { RequestAuth } from "../request-auth.ts";
import { retiredAutomationRoutes } from "./retired-automation.ts";
import type { RouteHandler } from "./table.ts";

export const PHONE_ACCESS_CHANGED = "This phone's access changed.";

/** Keyed by what authenticated the request, never by the body or its headers: a Cloud session, or the device the verified companion sidecar vouched for. */
export function phoneKey(auth: RequestAuth): string | null {
  if (auth.kind === "session") return auth.session.cookieOnly ? null : `session:${auth.session.id}`;
  return auth.companionDevice ? `companion:${auth.companionDevice}` : null;
}

/** Long polls are held open on purpose, so the idle-timeout check exempts them. */
export function isLongPollPath(path: string): boolean {
  return path.startsWith("/api/shared-computers/") || path === "/api/phones/self/jobs";
}

export interface PhoneRouteDeps {
  registry: PhoneRegistry;
  jobs: PhoneJobs;
  /** The owner this phone belongs to, or null when phones are not offered here (team Cloud, hosted workspace, guest session). */
  owner: (auth: RequestAuth) => string | null;
  isAdmin: (auth: RequestAuth) => boolean;
  live: (auth: RequestAuth) => boolean;
}

export function createPhoneRoutes(_deps: PhoneRouteDeps): RouteHandler {
  return retiredAutomationRoutes;
}
