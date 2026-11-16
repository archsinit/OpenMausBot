const RETIRED_STATE_FIELDS = [
  "computer", "cloudBackend", "autoStartVps", "vpsAlias", "browser", "browserProfile", "recordBrowserSteps", "surface", "surfaceSource",
] as const;

/** Resume cursors can retain old system instructions; preserve history but rebuild retired sessions. */
export function dropAutomationState(value: object): boolean {
  const record = value as Record<string, unknown>;
  let changed = false;
  for (const key of RETIRED_STATE_FIELDS) {
    if (Object.hasOwn(record, key)) {
      delete record[key];
      changed = true;
    }
  }
  const inheritedAutomation = changed;
  if (Array.isArray(record.tasks)) {
    for (const task of record.tasks) {
      if (!task || typeof task !== "object") continue;
      if (dropAutomationState(task)) changed = true;
      if (inheritedAutomation) (task as Record<string, unknown>).resumeCursors = {};
    }
  }
  if (changed) record.resumeCursors = {};
  return changed;
}
