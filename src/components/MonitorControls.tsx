import { useEffect } from "react";
import { RefreshCw, RotateCcw, SlidersHorizontal } from "lucide-react";
import {
  VCP,
  featureValue,
  hasChanges,
  refreshDdc,
  restoreOriginal,
  selectDisplay,
  selectedDisplay,
  setFeature,
  useDdc,
  type Feature,
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
 * Sliders that change the monitor's own settings over DDC/CI. Only rendered in the
 * desktop app; explains what to do when no monitor answers.
 */
export function MonitorControls({ codes = ALL, standalone = false }: Props) {
  const { t } = useI18n();
  const ddc = useDdc();

  useEffect(() => {
    if (ddc.status === "idle") void refreshDdc();
  }, [ddc.status]);

  if (!isTauri()) return null;

  const display = selectedDisplay(ddc);
  const supported = ddc.displays.filter((d) => d.supported);
  const unsupported = ddc.displays.filter((d) => !d.supported);
  const features = codes.map((c) => featureValue(display, c)).filter((f): f is Feature => f !== undefined);

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
        title={t({ en: "Read the monitor again", tr: "Monitörü yeniden oku" })}
        aria-label={t({ en: "Read the monitor again", tr: "Monitörü yeniden oku" })}
        disabled={ddc.status === "loading"}
      >
        <RefreshCw size={14} className={ddc.status === "loading" ? "spin" : ""} />
      </button>
    </div>
  );

  if (ddc.status === "idle" || (ddc.status === "loading" && ddc.displays.length === 0)) {
    return (
      <div className={`monitor-controls ${standalone ? "standalone" : ""}`}>
        {heading}
        <p className="mc-note">{t({ en: "Checking your monitor…", tr: "Monitörünüz kontrol ediliyor…" })}</p>
      </div>
    );
  }

  if (!display) {
    return (
      <div className={`monitor-controls ${standalone ? "standalone" : ""}`}>
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

  if (features.length === 0 && !standalone) return null;

  return (
    <div className={`monitor-controls ${standalone ? "standalone" : ""}`}>
      {heading}

      {supported.length > 1 ? (
        <select className="mc-select" value={display.key} onChange={(e) => selectDisplay(e.target.value)}>
          {supported.map((d) => (
            <option key={d.key} value={d.key}>
              {d.name}
            </option>
          ))}
        </select>
      ) : (
        <div className="mc-display">{display.name}</div>
      )}

      <div className="mc-sliders">
        {features.map((f) => (
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

      {ddc.writeError && (
        <p className="mc-note warn">
          {t({
            en: "The monitor didn't accept the last change. Press refresh to read its current values.",
            tr: "Monitör son değişikliği kabul etmedi. Güncel değerleri okumak için yenile düğmesine basın.",
          })}
        </p>
      )}

      <div className="mc-foot">
        <span className="mc-note">
          {t({ en: "Or use your monitor's buttons.", tr: "Dilerseniz monitörün tuşlarını da kullanabilirsiniz." })}
        </span>
        {hasChanges(ddc, display.key) && (
          <button className="link-btn" onClick={() => restoreOriginal(display.key)}>
            <RotateCcw size={14} /> {t({ en: "Undo changes", tr: "Değişiklikleri geri al" })}
          </button>
        )}
      </div>

      {standalone && unsupported.length > 0 && (
        <p className="mc-note">
          {t({
            en: `Not responding to DDC/CI: ${unsupported.map((d) => d.name).join(", ")}.`,
            tr: `DDC/CI'ya yanıt vermeyen: ${unsupported.map((d) => d.name).join(", ")}.`,
          })}
        </p>
      )}
    </div>
  );
}
