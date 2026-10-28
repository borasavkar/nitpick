import { useEffect } from "react";
import { RefreshCw, RotateCcw, SlidersHorizontal } from "lucide-react";
import {
  SOFT_FOR_VCP,
  SOFT_MIN,
  SOFT_NEUTRAL,
  VCP,
  featureValue,
  hasChanges,
  isAdjustable,
  refreshDdc,
  restoreOriginal,
  selectDisplay,
  selectedDisplay,
  setFeature,
  setSoft,
  useDdc,
  type Feature,
  type SoftKey,
} from "../lib/ddc";
import { isTauri } from "../lib/platform";
import { useI18n, type L } from "../i18n";

const LABELS: Record<number, L> = {
  [VCP.brightness]: { en: "Brightness", tr: "Parlaklık" },
  [VCP.contrast]: { en: "Contrast", tr: "Kontrast" },
  [VCP.redGain]: { en: "Red", tr: "Kırmızı" },
  [VCP.greenGain]: { en: "Green", tr: "Yeşil" },
  [VCP.blueGain]: { en: "Blue", tr: "Mavi" },
};

const ALL = [VCP.brightness, VCP.contrast, VCP.redGain, VCP.greenGain, VCP.blueGain];

interface Props {
  /** Which features to show; defaults to all. */
  codes?: number[];
  /** Larger panel with a heading, used on the home page. */
  standalone?: boolean;
}

/**
 * Sliders that adjust the selected monitor: its own settings over DDC/CI when it answers,
 * otherwise a software adjustment through the graphics card. Desktop app only.
 */
export function MonitorControls({ codes = ALL, standalone = false }: Props) {
  const { t, lang } = useI18n();
  const ddc = useDdc();
  const pct = (n: number) => (lang === "tr" ? `%${n}` : `${n}%`);

  useEffect(() => {
    if (ddc.status === "idle") void refreshDdc();
  }, [ddc.status]);

  if (!isTauri()) return null;

  const display = selectedDisplay(ddc);
  const adjustable = ddc.displays.filter(isAdjustable);
  const cls = `monitor-controls ${standalone ? "standalone" : ""}`;

  const heading = (
    <div className="mc-head">
      <div className="mc-title">
        <SlidersHorizontal size={15} />
        {standalone
          ? t({ en: "Monitor control", tr: "Monitör kontrolü" })
          : t({ en: "Adjust from here", tr: "Buradan ayarlayın" })}
      </div>
      <button
        className="icon-btn sm"
        onClick={() => void refreshDdc()}
        title={t({ en: "Read the monitors again", tr: "Monitörleri yeniden oku" })}
        aria-label={t({ en: "Read the monitors again", tr: "Monitörleri yeniden oku" })}
        disabled={ddc.status === "loading"}
      >
        <RefreshCw size={14} className={ddc.status === "loading" ? "spin" : ""} />
      </button>
    </div>
  );

  if (ddc.status === "idle" || (ddc.status === "loading" && ddc.displays.length === 0)) {
    return (
      <div className={cls}>
        {heading}
        <p className="mc-note">{t({ en: "Checking your monitors…", tr: "Monitörleriniz kontrol ediliyor…" })}</p>
      </div>
    );
  }

  if (!display) {
    return (
      <div className={cls}>
        {heading}
        <p className="mc-note">
          {t({
            en: "Your monitor doesn't respond to software control (DDC/CI). Turn on 'DDC/CI' in the monitor's menu if it has that option, then press refresh. Otherwise, use the monitor's own buttons.",
            tr: "Monitörünüz yazılımla kontrole (DDC/CI) yanıt vermiyor. Monitör menüsünde 'DDC/CI' seçeneği varsa açın ve yenile düğmesine basın. Yoksa ayarları monitörün kendi tuşlarıyla yapın.",
          })}
        </p>
      </div>
    );
  }

  const hardware = display.supported;
  const hwFeatures = codes.map((c) => featureValue(display, c)).filter((f): f is Feature => f !== undefined);
  const softKeys = codes.map((c) => SOFT_FOR_VCP[c]).filter((k): k is SoftKey => k !== undefined);
  const soft = ddc.soft[display.key] ?? SOFT_NEUTRAL;
  const nothingHere = hardware ? hwFeatures.length === 0 : softKeys.length === 0;

  const picker =
    adjustable.length > 1 ? (
      <select className="mc-select" value={display.key} onChange={(e) => selectDisplay(e.target.value)}>
        {adjustable.map((d) => (
          <option key={d.key} value={d.key}>
            {d.name}
          </option>
        ))}
      </select>
    ) : (
      <div className="mc-display">{display.name}</div>
    );

  const mode = hardware ? (
    <span className="mc-mode hw">{t({ en: "Monitor settings (DDC/CI)", tr: "Monitör ayarları (DDC/CI)" })}</span>
  ) : (
    <span className="mc-mode sw">{t({ en: "Software adjustment", tr: "Yazılımsal ayar" })}</span>
  );

  return (
    <div className={cls}>
      {heading}
      <div className="mc-which">
        {picker}
        {mode}
      </div>

      {nothingHere ? (
        <p className="mc-note">
          {t({
            en: "This setting can only be changed with this monitor's own buttons.",
            tr: "Bu ayar, bu monitörde yalnızca monitörün kendi tuşlarıyla değiştirilebilir.",
          })}
        </p>
      ) : hardware ? (
        <div className="mc-sliders">
          {hwFeatures.map((f) => (
            <label key={f.code} className={`mc-slider c${f.code}`}>
              <span className="mc-label">{t(LABELS[f.code])}</span>
              <input
                type="range"
                min={0}
                max={f.max}
                value={f.value}
                onChange={(e) => setFeature(display.key, f.code, Number(e.target.value))}
              />
              <span className="mc-value">{f.value}</span>
            </label>
          ))}
        </div>
      ) : (
        <>
          <div className="mc-sliders">
            {softKeys.map((k) => {
              const code = Number(Object.keys(SOFT_FOR_VCP).find((c) => SOFT_FOR_VCP[Number(c)] === k));
              return (
                <label key={k} className={`mc-slider c${code}`}>
                  <span className="mc-label">{t(LABELS[code])}</span>
                  <input
                    type="range"
                    min={SOFT_MIN[k]}
                    max={100}
                    value={soft[k]}
                    onChange={(e) => setSoft(display.key, { [k]: Number(e.target.value) })}
                  />
                  <span className="mc-value">{pct(soft[k])}</span>
                </label>
              );
            })}
          </div>
          <p className="mc-note">
            {t({
              en: "This monitor doesn't answer DDC/CI, so NitPick adjusts the picture through your graphics card instead. It can only make the image darker or shift its colors; it doesn't change the backlight. Use it to match this monitor to your other one. Windows Night light and HDR can override it.",
              tr: "Bu monitör DDC/CI'ya yanıt vermediği için NitPick görüntüyü ekran kartı üzerinden ayarlıyor. Bu yöntem görüntüyü yalnızca koyulaştırabilir ya da renklerini kaydırabilir; monitörün arka ışığını değiştirmez. Bu monitörü diğer monitörünüze benzetmek için kullanın. Windows Gece ışığı ve HDR bu ayarı geçersiz kılabilir.",
            })}
          </p>
        </>
      )}

      {ddc.writeError && (
        <p className="mc-note warn">
          {t({
            en: "The last change didn't go through. Press refresh to read the current values.",
            tr: "Son değişiklik uygulanamadı. Güncel değerleri okumak için yenile düğmesine basın.",
          })}
        </p>
      )}

      <div className="mc-foot">
        <span className="mc-note">
          {t({ en: "Or use your monitor's buttons.", tr: "Dilerseniz monitörün tuşlarını da kullanabilirsiniz." })}
        </span>
        {hasChanges(ddc, display.key) && (
          <button className="link-btn" onClick={() => restoreOriginal(display.key)}>
            <RotateCcw size={14} />{" "}
            {hardware
              ? t({ en: "Undo changes", tr: "Değişiklikleri geri al" })
              : t({ en: "Remove software adjustment", tr: "Yazılımsal ayarı kaldır" })}
          </button>
        )}
      </div>
    </div>
  );
}
