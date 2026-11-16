import type { JsonObject, JsonValue } from "./schema.ts";

export const AUTOMATION_CONFIG_FIELDS = ["box", "vps", "localVm", "browserProfiles", "browserEngine"] as const;
export const AUTOMATION_FEATURE_FIELDS = ["browser", "sharedComputers", "savedSteps", "cloudComputerAutoReplace"] as const;
export const AUTOMATION_BOT_FIELDS = ["computer", "cloudBackend", "autoStartVps", "browser", "browserProfile"] as const;

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function assertNoAutomationConfig(value: unknown): void {
  if (!object(value)) return;
  const removed = AUTOMATION_CONFIG_FIELDS.find((key) => Object.hasOwn(value, key))
    ?? (object(value.features) && AUTOMATION_FEATURE_FIELDS.find((key) => Object.hasOwn(value.features as object, key)));
  const defaults = object(value.newBotDefaults) ? value.newBotDefaults : undefined;
  const profileField = object(defaults?.profile) && AUTOMATION_BOT_FIELDS.find((key) => Object.hasOwn(defaults.profile as object, key));
  const cloudRoutine = Array.isArray(defaults?.routines) && defaults.routines.some((routine) => object(routine) && routine.runOn === "cloud");
  if (removed || profileField || cloudRoutine) {
    throw Object.assign(new Error("Desktop and browser automation settings have been removed."), { status: 410, code: "automation_removed" });
  }
}

/** Legacy settings must not discard otherwise valid model credentials or restore removed capabilities. */
export function withoutAutomationConfig(value: JsonValue): JsonValue {
  if (!object(value)) return value;
  const clean = structuredClone(value) as JsonObject;
  for (const key of AUTOMATION_CONFIG_FIELDS) delete clean[key];
  if (object(clean.features)) {
    for (const key of AUTOMATION_FEATURE_FIELDS) delete clean.features[key];
  }
  if (object(clean.newBotDefaults)) {
    if (object(clean.newBotDefaults.profile)) {
      for (const key of AUTOMATION_BOT_FIELDS) delete clean.newBotDefaults.profile[key];
    }
    if (Array.isArray(clean.newBotDefaults.routines)) {
      for (const routine of clean.newBotDefaults.routines) {
        if (object(routine) && routine.runOn === "cloud") routine.runOn = "maus";
      }
    }
  }
  return clean;
}
