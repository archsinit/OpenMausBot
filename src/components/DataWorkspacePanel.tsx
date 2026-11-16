import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useStore, type Bot } from "@/state/store";
import { t } from "@/lib/i18n";
import { sidePanelCls } from "./bot-panel/side-panel";
import { ComputerFilesPane } from "./ComputerFilesPane";

const DataPanel = lazy(() => import("./data/DataPanel").then((module) => ({ default: module.DataPanel })));

export function DataWorkspacePanel({ bot }: { bot: Bot }) {
  const { state, dispatch } = useStore();
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panel.current?.focus();
    return () => opener?.focus();
  }, []);
  const [tab, setTab] = useState<"data" | "files">("data");
  const requested = state.dataResultFocus?.botId === bot.id ? state.dataResultFocus : undefined;
  useEffect(() => { if (requested && !requested.consumed) setTab("data"); }, [requested?.requestId]);
  return <aside ref={panel} tabIndex={-1} className={sidePanelCls(false)} aria-label={t("computer.tab.data")} onKeyDown={(event) => { if (event.key === "Escape" && !event.defaultPrevented) { event.preventDefault(); dispatch({ type: "toggleDataPanel", open: false }); } }}>
    <div className="flex items-center gap-2 p-3">
      {(["data", "files"] as const).map((id) => <button key={id} type="button" className="ui-button" aria-pressed={tab === id} onClick={() => setTab(id)}>{t(id === "data" ? "computer.tab.data" : "computer.tab.files")}</button>)}
      <button type="button" className="ui-icon-button ms-auto" aria-label={t("common.close")} onClick={() => dispatch({ type: "toggleDataPanel", open: false })}><X size={16} aria-hidden="true" /></button>
    </div>
    {tab === "files" ? <ComputerFilesPane bot={bot} /> : <Suspense fallback={<div role="status">{t("data.loading")}</div>}><DataPanel bot={bot} requestedCard={requested} /></Suspense>}
  </aside>;
}
