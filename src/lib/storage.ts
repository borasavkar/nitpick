import type { Ambient, UseCase } from "./presets";

export interface OsdValues {
  pictureMode: string;
  brightness: string;
  contrast: string;
  colorTemp: string;
  sharpness: string;
  overdrive: string;
}

export interface SavedResult {
  id: string;
  date: string;
  display: string;
  useCase: UseCase;
  ambient: Ambient;
  /** Answer id per wizard step id. */
  answers: Record<string, string>;
  osd: OsdValues;
}

const KEY = "nitpick.results.v1";

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
