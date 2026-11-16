export const AUTOMATION_UNSUPPORTED = "Desktop and browser automation is unsupported";
export const unavailableConnection = Object.freeze({ mode: "unavailable", reason: AUTOMATION_UNSUPPORTED, reasonCode: "unsupported" });
export const unavailableStatus = Object.freeze({ available: false, enabled: false, status: "unavailable", reasonCode: "unsupported", message: AUTOMATION_UNSUPPORTED });
export function unsupportedAutomation() { throw new Error(AUTOMATION_UNSUPPORTED); }

export function createUnsupportedComputerSharing() {
  const noop = () => {};
  const state = () => ({ supported: false, enabled: false, connected: false, paused: true, computer: false, terminal: false, chrome: false, internet: false, folders: [], reason: AUTOMATION_UNSUPPORTED });
  return {
    state, cloudState: state, activity: () => [], ownServer: async () => null, ownOffer: async () => null,
    identity: unsupportedAutomation, observe: unsupportedAutomation, save: unsupportedAutomation,
    lendOwn: unsupportedAutomation, saveCloud: unsupportedAutomation, lendProjects: unsupportedAutomation,
    resume: unsupportedAutomation, lendTerminal: unsupportedAutomation,
    lentToCloud: () => ({ off: true }), lendingToCloud: () => false, busy: () => false, paused: () => true,
    goodbyesDone: async () => {}, revoke: state, forget: noop, decline: noop, declineOwn: noop,
    start: noop, pause: noop, screenChanged: async () => {}, leaveAccount: noop, cloudChanged: noop, close: noop,
  };
}

export function registerUnsupportedAndroidIpc(ipcMain, guard) {
  for (const channel of ["android-device:status", "android-device:frame", "android-device:input"]) {
    ipcMain.handle(channel, guard(channel, async () => { throw new Error("Phone automation is unsupported"); }));
  }
}

export function registerUnsupportedCuaIpc(ipcMain, guard) {
  for (const channel of ["cua:connection", "cua:permissions", "cua:linux-status", "cua:linux-enable", "cua:linux-disable", "cua:linux-retry"]) {
    ipcMain.handle(channel, guard(channel, () => channel === "cua:connection" ? unavailableConnection : unavailableStatus));
  }
}
