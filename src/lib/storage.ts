import type { L } from "../i18n";
import type { Ambient, UseCase } from "./presets";

export interface OsdValues {
  pictureMode: string;
  brightness: string;
  contrast: string;
  colorTemp: string;
  sharpness: string;
  overdrive: string;
}

/** Monitor menu settings the user can note down, in display order. */
export const OSD_FIELDS: { key: keyof OsdValues; label: L; placeholder: L }[] = [
  {
    key: "pictureMode",
    label: { en: "Picture mode", tr: "Görüntü modu" },
    placeholder: { en: "e.g. Standard, sRGB, User", tr: "ör. Standart, sRGB, Kullanıcı" },
  },
  { key: "brightness", label: { en: "Brightness", tr: "Parlaklık" }, placeholder: { en: "e.g. 35", tr: "ör. 35" } },
  { key: "contrast", label: { en: "Contrast", tr: "Kontrast" }, placeholder: { en: "e.g. 70", tr: "ör. 70" } },
  {
    key: "colorTemp",
    label: { en: "Color temperature", tr: "Renk sıcaklığı" },
    placeholder: { en: "e.g. Normal, 6500K, User R/G/B", tr: "ör. Normal, 6500K, Kullanıcı R/G/B" },
  },
  { key: "sharpness", label: { en: "Sharpness", tr: "Keskinlik" }, placeholder: { en: "e.g. 50", tr: "ör. 50" } },
  {
    key: "overdrive",
    label: { en: "Overdrive / Response time", tr: "Overdrive / Tepki süresi" },
    placeholder: { en: "e.g. Normal", tr: "ör. Normal" },
  },
];

export interface SavedResult {
  id: string;
  date: string;
  /** Which display was set up; the label is localized when shown. */
  display: { number: number; width: number; height: number };
  useCase: UseCase;
  ambient: Ambient;
  /** Answer id per wizard step id. */
  answers: Record<string, string>;
  osd: OsdValues;
}

const KEY = "nitpick.results.v2";

export function resultTitle(r: SavedResult, t: (text: L) => string): string {
  const { number, width, height } = r.display;
  const name = number === 0 ? t({ en: "This display", tr: "Bu ekran" }) : t({ en: `Display ${number}`, tr: `Ekran ${number}` });
  return `${name} (${width}×${height})`;
}

export function loadResults(): SavedResult[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedResult[]) : [];
  } catch {
    return [];
  }
}

export function saveResult(result: SavedResult): void {
  const all = [result, ...loadResults().filter((r) => r.id !== result.id)];
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // Storage may be unavailable (private mode); the result still shows on screen.
  }
}

export function deleteResult(id: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(loadResults().filter((r) => r.id !== id)));
  } catch {
    // ignore
  }
}
