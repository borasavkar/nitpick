import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { refreshDdc } from "../lib/ddc";
import { PROFILE_DEFS, applyProfile, isProfileId, useProfiles } from "../lib/profiles";
import { getCloseToTray } from "../lib/settings";
import { isTauri } from "../lib/platform";
import { useI18n } from "../i18n";

/**
 * Runs for the whole app life in the desktop version: reads the monitors at start (which
 * re-applies saved software adjustments, even when started hidden in the tray), keeps the
 * tray menu in the current language, and applies profiles picked from the tray.
 */
export function TrayBridge() {
  const { t } = useI18n();
  const { profiles, lastApplied } = useProfiles();

  useEffect(() => {
    if (!isTauri()) return;
    void refreshDdc();
    void invoke("set_close_to_tray", { enabled: getCloseToTray() }).catch(() => {});
    const unlisten = listen<string>("apply-profile", (e) => {
      if (isProfileId(e.payload)) void applyProfile(e.payload);
    });
    return () => {
      void unlisten.then((off) => off());
    };
  }, []);

  useEffect(() => {
    if (!isTauri()) return;
    const saved = PROFILE_DEFS.filter((p) => profiles[p.id]);
    void invoke("update_tray", {
      menu: {
        open: t({ en: "Open NitPick", tr: "NitPick'i aç" }),
        quit: t({ en: "Quit", tr: "Çıkış" }),
        noProfiles: t({ en: "No profiles saved yet", tr: "Henüz kayıtlı profil yok" }),
        profiles: saved.map((p) => ({ id: p.id, label: t(p.label) })),
        active: lastApplied,
      },
    }).catch(() => {});
  }, [t, profiles, lastApplied]);

  return null;
}
