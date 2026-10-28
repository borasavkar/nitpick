import { useEffect, useState } from "react";
import { Check, Moon, Film, Save, Sun, Trash2 } from "lucide-react";
import { PROFILE_DEFS, applyProfile, clearProfile, saveProfile, useProfiles, type ProfileId } from "../lib/profiles";
import { getAutostart, getCloseToTray, setAutostart, setCloseToTray } from "../lib/settings";
import { isAdjustable, useDdc } from "../lib/ddc";
import { isTauri } from "../lib/platform";
import { useI18n } from "../i18n";

const ICONS: Record<ProfileId, typeof Sun> = { day: Sun, movie: Film, night: Moon };

/** Day / Movie / Night profiles plus startup and tray settings. Desktop app only. */
export function ProfilesPanel() {
  const { t, locale } = useI18n();
  const { profiles, lastApplied } = useProfiles();
  const ddc = useDdc();
  const [autostart, setAutostartState] = useState<boolean | null>(null);
  const [closeToTray, setCloseState] = useState(getCloseToTray);

  useEffect(() => {
    if (isTauri()) getAutostart().then(setAutostartState).catch(() => setAutostartState(null));
  }, []);

  if (!isTauri()) return null;

  const canSave = ddc.displays.some(isAdjustable);

  return (
    <div className="profiles">
      <div className="section-title">
        <h2>{t({ en: "Profiles", tr: "Profiller" })}</h2>
        <p>
          {t({
            en: "Set your monitors the way you like, then save them to a profile. Switch profiles here or from the NitPick icon in the taskbar.",
            tr: "Monitörlerinizi istediğiniz gibi ayarlayıp bir profile kaydedin. Profiller arasında buradan ya da görev çubuğundaki NitPick simgesinden geçebilirsiniz.",
          })}
        </p>
      </div>

      <div className="profile-grid">
        {PROFILE_DEFS.map((def) => {
          const p = profiles[def.id];
          const Icon = ICONS[def.id];
          const names = p ? Object.values(p.displays).map((d) => d.name) : [];
          return (
            <div key={def.id} className={`profile-card ${lastApplied === def.id ? "active" : ""}`}>
              <div className="pf-head">
                <Icon size={18} />
                <b>{t(def.label)}</b>
                {lastApplied === def.id && (
                  <span className="pf-badge">{t({ en: "Last applied", tr: "Son uygulanan" })}</span>
                )}
              </div>
              <p className="pf-hint">{t(def.hint)}</p>
              <p className="pf-status">
                {p
                  ? t({
                      en: `Saved ${new Date(p.savedAt).toLocaleDateString(locale)} · ${names.join(", ")}`,
                      tr: `${new Date(p.savedAt).toLocaleDateString(locale)} tarihinde kaydedildi · ${names.join(", ")}`,
                    })
                  : t({ en: "Not saved yet", tr: "Henüz kaydedilmedi" })}
              </p>
              <div className="pf-actions">
                {p && (
                  <button className="btn primary sm" onClick={() => void applyProfile(def.id)}>
                    <Check size={14} /> {t({ en: "Apply", tr: "Uygula" })}
                  </button>
                )}
                <button
                  className="btn ghost sm"
                  disabled={!canSave}
                  onClick={() => saveProfile(def.id)}
                  title={t({ en: "Save the current monitor settings here", tr: "Mevcut monitör ayarlarını buraya kaydet" })}
                >
                  <Save size={14} /> {p ? t({ en: "Update", tr: "Güncelle" }) : t({ en: "Save current", tr: "Mevcut ayarları kaydet" })}
                </button>
                {p && (
                  <button
                    className="icon-btn sm"
                    onClick={() => clearProfile(def.id)}
                    aria-label={t({ en: "Delete profile", tr: "Profili sil" })}
                    title={t({ en: "Delete profile", tr: "Profili sil" })}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="startup">
        <label className="toggle">
          <input
            type="checkbox"
            checked={autostart ?? false}
            disabled={autostart === null}
            onChange={async (e) => {
              const on = e.target.checked;
              await setAutostart(on).catch(() => {});
              setAutostartState(await getAutostart().catch(() => !on));
            }}
          />
          <span>
            <b>{t({ en: "Start when I sign in", tr: "Bilgisayar açılınca başlat" })}</b>
            <small>
              {t({
                en: "NitPick starts quietly in the taskbar and re-applies the software adjustment for monitors without DDC/CI.",
                tr: "NitPick pencere açmadan görev çubuğunda başlar ve DDC/CI'ı olmayan monitörlerin yazılımsal ayarını yeniden uygular.",
              })}
            </small>
          </span>
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={closeToTray}
            onChange={async (e) => {
              const on = e.target.checked;
              setCloseState(on);
              await setCloseToTray(on).catch(() => {});
            }}
          />
          <span>
            <b>{t({ en: "Keep running when I close the window", tr: "Pencere kapatılınca çalışmaya devam et" })}</b>
            <small>
              {t({
                en: "NitPick stays in the taskbar so you can switch profiles. Use Quit in its menu to close it completely.",
                tr: "NitPick, profil değiştirebilmeniz için görev çubuğunda kalır. Tamamen kapatmak için simgenin menüsündeki Çıkış'ı kullanın.",
              })}
            </small>
          </span>
        </label>
      </div>
    </div>
  );
}
