import { unsupportedAutomation } from "./retired-automation.mjs";

export function installServerLending({ ipcMain, guard }) {
  for (const action of ["state", "folder", "revoke", "activity", "save", "servers", "allow", "pause", "resume"]) {
    const channel = `sharing:${action}`;
    ipcMain.handle(channel, guard(channel, unsupportedAutomation));
  }
  return { async offer() {} };
}
