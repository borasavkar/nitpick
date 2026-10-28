import { invoke } from "@tauri-apps/api/core";
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";

const CLOSE_KEY = "nitpick.closeToTray";

export function getCloseToTray(): boolean {
  try {
    return localStorage.getItem(CLOSE_KEY) === "1";
  } catch {
    return false;
  }
}

export async function setCloseToTray(enabled: boolean): Promise<void> {
  try {
    localStorage.setItem(CLOSE_KEY, enabled ? "1" : "0");
  } catch {
    // ignore
  }
  await invoke("set_close_to_tray", { enabled });
}

/** Whether NitPick starts (hidden, in the tray) when the user signs in. */
export const getAutostart = (): Promise<boolean> => isEnabled();

export async function setAutostart(enabled: boolean): Promise<void> {
  if (enabled) await enable();
  else await disable();
}
