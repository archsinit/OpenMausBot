import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useStore, type Bot } from "@/state/store";
import { t } from "@/lib/i18n";
import { sidePanelCls } from "./bot-panel/side-panel";
import { ComputerFilesPane } from "./ComputerFilesPane";

export function FilesPanel({ bot }: { bot: Bot }) {
  const { dispatch } = useStore();
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panel.current?.focus();
    return () => opener?.focus();
  }, []);
  const close = () => dispatch({ type: "toggleFilesPanel", open: false });
  return <aside ref={panel} tabIndex={-1} className={sidePanelCls(false)} aria-label={t("computer.tab.files")} onKeyDown={(event) => { if (event.key === "Escape" && !event.defaultPrevented) { event.preventDefault(); close(); } }}>
    <div className="flex items-center gap-2 p-3">
      <h2 className="text-[13px] font-medium">{t("computer.tab.files")}</h2>
      <button type="button" className="ui-icon-button ms-auto" aria-label={t("common.close")} onClick={close}><X size={16} aria-hidden="true" /></button>
    </div>
    <ComputerFilesPane bot={bot} />
  </aside>;
}
