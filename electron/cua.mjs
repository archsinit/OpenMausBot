import { ipcMain } from "electron";
import localOriginModule from "./local-origin.cjs";
import { unavailableConnection, unavailableStatus, registerUnsupportedCuaIpc } from "./retired-automation.mjs";

export async function startCua() { return unavailableConnection; }
export async function stopCua() {}
export function grantLocalComputer() {}
export function setCuaStateListener() {}
export function resolveWindowsDriver() { return null; }
export function resolveDriverBinary() { return null; }
export function resolveEmbeddedDriverBinary() { return null; }
export async function cuaPermissionsStatus() { return unavailableStatus; }
export async function requestComputerUse() { return unavailableStatus; }
export function registerCuaIpc() { registerUnsupportedCuaIpc(ipcMain, localOriginModule.localOnly); }
