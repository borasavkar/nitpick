import { availableMonitors, currentMonitor, getCurrentWindow } from "@tauri-apps/api/window";
import type { L } from "../i18n";

/** True when running inside the Tauri desktop app, false in the web version. */
export const isTauri = (): boolean => "__TAURI_INTERNALS__" in window;

export interface DisplayInfo {
  id: string;
  /** 1-based display number; 0 in the web version, which only sees its own screen. */
  number: number;
  width: number;
  height: number;
  scale: number;
  current: boolean;
}

export function displayLabel(d: DisplayInfo, t: (text: L) => string): string {
  return d.number === 0
    ? t({ en: "This display", tr: "Bu ekran" })
    : t({ en: `Display ${d.number}`, tr: `Ekran ${d.number}` });
}

/** Lists connected displays. The web version only knows about the screen it runs on. */
export async function getDisplays(): Promise<DisplayInfo[]> {
  if (!isTauri()) {
    const scale = window.devicePixelRatio || 1;
    return [
      {
        id: "web",
        number: 0,
        width: Math.round(screen.width * scale),
        height: Math.round(screen.height * scale),
        scale,
        current: true,
      },
    ];
  }
  const [monitors, current] = await Promise.all([availableMonitors(), currentMonitor()]);
  return monitors.map((m, i) => ({
    id: m.name ?? `display-${i + 1}`,
    number: i + 1,
    width: m.size.width,
    height: m.size.height,
    scale: m.scaleFactor,
    current: current?.name === m.name,
  }));
}

export async function setFullscreen(on: boolean): Promise<void> {
  if (isTauri()) {
    await getCurrentWindow().setFullscreen(on);
    return;
  }
  try {
    if (on && !document.fullscreenElement) await document.documentElement.requestFullscreen();
    if (!on && document.fullscreenElement) await document.exitFullscreen();
  } catch {
    // Fullscreen can be refused (e.g. inside an iframe); patterns still work in the window.
  }
}

export async function isFullscreen(): Promise<boolean> {
  if (isTauri()) return getCurrentWindow().isFullscreen();
  return document.fullscreenElement != null;
}

/**
 * Estimates the display refresh rate by timing animation frames.
 * Returns the nearest common rate (60, 75, 120, 144, ...) or the raw estimate.
 */
export function measureRefreshRate(durationMs = 1000): Promise<number> {
  return new Promise((resolve) => {
    const deltas: number[] = [];
    let last = 0;
    let start = 0;
    const tick = (t: number) => {
      if (!start) start = t;
      if (last) deltas.push(t - last);
      last = t;
      if (t - start < durationMs) {
        requestAnimationFrame(tick);
        return;
      }
      deltas.sort((a, b) => a - b);
      const median = deltas[Math.floor(deltas.length / 2)] || 16.67;
      const hz = 1000 / median;
      const common = [24, 30, 48, 50, 60, 72, 75, 90, 100, 120, 144, 165, 170, 180, 200, 240, 280, 300, 360, 480, 500];
      const nearest = common.reduce((a, b) => (Math.abs(b - hz) < Math.abs(a - hz) ? b : a));
      resolve(Math.abs(nearest - hz) / hz < 0.04 ? nearest : Math.round(hz));
    };
    requestAnimationFrame(tick);
  });
}
