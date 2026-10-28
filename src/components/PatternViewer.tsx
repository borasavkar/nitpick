import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { PATTERNS } from "../patterns";
import { setFullscreen } from "../lib/platform";
import { useI18n } from "../i18n";

/** Full-screen pattern viewer with an auto-hiding help overlay. */
export function PatternViewer({ initialId, onClose }: { initialId: string; onClose: () => void }) {
  const { t } = useI18n();
  const [index, setIndex] = useState(() => Math.max(0, PATTERNS.findIndex((p) => p.id === initialId)));
  const [variant, setVariant] = useState(0);
  const [hudVisible, setHudVisible] = useState(true);
  const [pinned, setPinned] = useState(false);
  const hideTimer = useRef<number>(0);

  const pattern = PATTERNS[index];
  const variants = pattern.variants ?? [];

  const close = useCallback(() => {
    setFullscreen(false).finally(onClose);
  }, [onClose]);

  const goPattern = useCallback((delta: number) => {
    setIndex((i) => (i + delta + PATTERNS.length) % PATTERNS.length);
    setVariant(0);
  }, []);

  const goVariant = useCallback(
    (delta: number) => {
      if (variants.length > 1) setVariant((v) => (v + delta + variants.length) % variants.length);
      else goPattern(delta);
    },
    [variants.length, goPattern],
  );

  // Mouse moves arrive hundreds of times a second; only touch React state when the HUD
  // actually changes, and restart the hide timer at most every 200 ms.
  const lastPoke = useRef(0);
  const hudShown = useRef(true);
  const poke = useCallback(() => {
    const now = performance.now();
    if (hudShown.current && hideTimer.current && now - lastPoke.current < 200) return;
    lastPoke.current = now;
    if (!hudShown.current) {
      hudShown.current = true;
      setHudVisible(true);
    }
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      hideTimer.current = 0;
      hudShown.current = false;
      setHudVisible(false);
    }, 2800);
  }, []);

  useEffect(() => {
    setFullscreen(true);
    poke();
    return () => {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = 0;
    };
  }, [poke]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight" || e.key === " ") goVariant(1);
      else if (e.key === "ArrowLeft") goVariant(-1);
      else if (e.key === "ArrowDown" || e.key === "PageDown") goPattern(1);
      else if (e.key === "ArrowUp" || e.key === "PageUp") goPattern(-1);
      else if (e.key.toLowerCase() === "h") setPinned((p) => !p);
      else return;
      e.preventDefault();
      poke();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, goVariant, goPattern, poke]);

  const showHud = hudVisible || pinned;
  const prev = PATTERNS[(index - 1 + PATTERNS.length) % PATTERNS.length];
  const next = PATTERNS[(index + 1) % PATTERNS.length];

  return (
    <div className={`viewer ${showHud ? "" : "hide-cursor"}`} onMouseMove={poke} onClick={() => goVariant(1)}>
      <div className="viewer-pattern">{pattern.render(variant)}</div>

      <div className={`hud ${showHud ? "show" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="hud-head">
          <div>
            <b>{t(pattern.name)}</b>
            {variants.length > 0 && (
              <span className="hud-variant">
                {t(variants[variant])} ({variant + 1}/{variants.length})
              </span>
            )}
          </div>
          <button className="icon-btn" onClick={close} aria-label={t({ en: "Close", tr: "Kapat" })}>
            <X size={18} />
          </button>
        </div>
        <ul>
          {pattern.instructions.map((text) => (
            <li key={text.en}>{t(text)}</li>
          ))}
        </ul>
        <div className="hud-nav">
          <button className="btn ghost sm" onClick={() => goPattern(-1)}>
            <ChevronLeft size={16} /> {t(prev.name)}
          </button>
          <button className="btn ghost sm" onClick={() => goPattern(1)}>
            {t(next.name)} <ChevronRight size={16} />
          </button>
        </div>
        <div className="hud-keys">
          <kbd>←</kbd>
          <kbd>→</kbd>{" "}
          {variants.length > 1 ? t({ en: "variant", tr: "varyant" }) : t({ en: "pattern", tr: "desen" })} · <kbd>↑</kbd>
          <kbd>↓</kbd> {t({ en: "pattern", tr: "desen" })} · <kbd>H</kbd>{" "}
          {pinned ? t({ en: "unpin help", tr: "sabitlemeyi kaldır" }) : t({ en: "pin help", tr: "yardımı sabitle" })} ·{" "}
          <kbd>Esc</kbd> {t({ en: "exit", tr: "çıkış" })}
        </div>
      </div>
    </div>
  );
}
