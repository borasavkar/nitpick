import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { PATTERNS } from "../patterns";
import { setFullscreen } from "../lib/platform";

/** Full-screen pattern viewer with an auto-hiding help overlay. */
export function PatternViewer({ initialId, onClose }: { initialId: string; onClose: () => void }) {
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

  const poke = useCallback(() => {
    setHudVisible(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setHudVisible(false), 2800);
  }, []);

  useEffect(() => {
    setFullscreen(true);
    poke();
    return () => window.clearTimeout(hideTimer.current);
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

  return (
    <div className={`viewer ${showHud ? "" : "hide-cursor"}`} onMouseMove={poke} onClick={() => goVariant(1)}>
      <div className="viewer-pattern">{pattern.render(variant)}</div>

      <div className={`hud ${showHud ? "show" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="hud-head">
          <div>
            <b>{pattern.name}</b>
            {variants.length > 0 && (
              <span className="hud-variant">
                {variants[variant]} ({variant + 1}/{variants.length})
              </span>
            )}
          </div>
          <button className="icon-btn" onClick={close} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <ul>
          {pattern.instructions.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <div className="hud-nav">
          <button className="btn ghost sm" onClick={() => goPattern(-1)}>
            <ChevronLeft size={16} /> {PATTERNS[(index - 1 + PATTERNS.length) % PATTERNS.length].name}
          </button>
          <button className="btn ghost sm" onClick={() => goPattern(1)}>
            {PATTERNS[(index + 1) % PATTERNS.length].name} <ChevronRight size={16} />
          </button>
        </div>
        <div className="hud-keys">
          <kbd>←</kbd>
          <kbd>→</kbd> {variants.length > 1 ? "variant" : "pattern"} · <kbd>↑</kbd>
          <kbd>↓</kbd> pattern · <kbd>H</kbd> {pinned ? "unpin" : "pin"} help · <kbd>Esc</kbd> exit
        </div>
      </div>
    </div>
  );
}
