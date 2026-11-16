import { useState } from "react";

import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";
import { LearnMore, SettingRow } from "./SettingsPrimitives";

export function DiagnosticsRow({ simple: _simple = false }: { simple?: boolean }) {
  const [result, setResult] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [folder, setFolder] = useState<string | null>(null);

  const openLogs = async () => {
    if (!window.ogb?.openLogsFolder) return;
    setResult(null);
    try {
      const opened = await window.ogb.openLogsFolder();
      setFolder(opened.folder);
      if (!opened.opened) setResult({ kind: "error", message: t("settings.diagnostics.openFailed", { folder: opened.folder }) });
    } catch (e) {
      setResult({ kind: "error", message: e instanceof Error ? e.message : String(e) });
    }
  };

  // My Cloud's page in the app, or a browser: this computer's logs are not reachable from here.
  const here = Boolean(window.ogb?.openLogsFolder);
  return (
    <SettingRow
      title={t("settings.diagnostics.openLogs")}
      subtitle={here ? <LearnMore label={t("settings.diagnostics.openLogs")} onClick={() => void openLogs()} /> : undefined}
      message={folder || result || !here ? <>
        {folder && result?.kind !== "error" && <p role="status" data-logs-folder className="break-all text-ink-secondary">{t("settings.diagnostics.logsAt", { folder })}</p>}
        {result && <p role={result.kind === "error" ? "alert" : "status"} className={cn("break-all", result.kind === "error" ? "text-danger" : "text-success")}>
          {result.message}
        </p>}
        {!here && <p data-logs-help className="text-ink-secondary">{t("settings.diagnostics.elsewhere")}</p>}
      </> : undefined}
    >
      {null}
    </SettingRow>
  );
}
