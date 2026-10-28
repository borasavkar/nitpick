import { invoke } from "@tauri-apps/api/core";
import { useSyncExternalStore } from "react";
import { isTauri } from "./platform";

/** VCP feature codes from the MCCS standard. */
export const VCP = {
  brightness: 0x10,
  contrast: 0x12,
  redGain: 0x16,
  greenGain: 0x18,
  blueGain: 0x1a,
} as const;

export interface Feature {
  code: number;
  value: number;
  max: number;
}

export interface DdcDisplay {
  key: string;
  name: string;
  /** Answers DDC/CI, so the monitor's own settings can be changed. */
  supported: boolean;
  features: Feature[];
  /** OS device name for software adjustment (Windows); null where unavailable. */
  gdiName: string | null;
}

/** Software adjustment through the graphics card, in percent (100 = unchanged). */
export interface SoftValues {
  brightness: number;
  red: number;
  green: number;
  blue: number;
}

export type SoftKey = keyof SoftValues;

export const SOFT_NEUTRAL: SoftValues = { brightness: 100, red: 100, green: 100, blue: 100 };
/** Lowest values Windows accepts for a gamma ramp (see win_display.rs). */
export const SOFT_MIN: SoftValues = { brightness: 50, red: 70, green: 70, blue: 70 };

/** Which software control stands in for a hardware feature on monitors without DDC/CI. */
export const SOFT_FOR_VCP: Partial<Record<number, SoftKey>> = {
  [VCP.brightness]: "brightness",
  [VCP.redGain]: "red",
  [VCP.greenGain]: "green",
  [VCP.blueGain]: "blue",
};

interface State {
  status: "idle" | "loading" | "ready" | "error";
  displays: DdcDisplay[];
  selected: string | null;
  /** Values read when NitPick first saw each display, so changes can be undone. */
  original: Record<string, Record<number, number>>;
  /** Software adjustment per display key. */
  soft: Record<string, SoftValues>;
  /** A write failed; the monitor may have stopped answering. */
  writeError: boolean;
}

let state: State = { status: "idle", displays: [], selected: null, original: {}, soft: {}, writeError: false };
const listeners = new Set<() => void>();

function update(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useDdc(): State {
  return useSyncExternalStore(subscribe, () => state);
}

/** Monitors that can be adjusted at all: over DDC/CI, or in software. */
export const isAdjustable = (d: DdcDisplay) => d.supported || d.gdiName != null;

// Software values are saved per monitor (by name and port) and re-applied when the app opens,
// because Windows resets the graphics card's curve after a restart.
const SOFT_KEY = "nitpick.soft.v1";
const softId = (d: DdcDisplay) => `${d.name}|${d.gdiName}`;

function loadSoft(): Record<string, SoftValues> {
  try {
    return JSON.parse(localStorage.getItem(SOFT_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveSoft(d: DdcDisplay, v: SoftValues) {
  const all = loadSoft();
  if (isNeutral(v)) delete all[softId(d)];
  else all[softId(d)] = v;
  try {
    localStorage.setItem(SOFT_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

export const isNeutral = (v: SoftValues) =>
  v.brightness === 100 && v.red === 100 && v.green === 100 && v.blue === 100;

/** Reads all displays and their values. Safe to call repeatedly; does nothing in the web version. */
export async function refreshDdc(): Promise<void> {
  if (!isTauri() || state.status === "loading") return;
  update({ status: "loading" });
  try {
    const displays = await invoke<DdcDisplay[]>("ddc_list");
    const original = { ...state.original };
    const soft = { ...state.soft };
    const saved = loadSoft();
    for (const d of displays) {
      if (d.supported && !original[d.key]) {
        original[d.key] = Object.fromEntries(d.features.map((f) => [f.code, f.value]));
      }
      if (!d.supported && d.gdiName && !soft[d.key]) {
        soft[d.key] = saved[softId(d)] ?? { ...SOFT_NEUTRAL };
        if (!isNeutral(soft[d.key])) queueWrite({ kind: "soft", display: d, values: soft[d.key] });
      }
    }
    const stillThere = displays.some((d) => d.key === state.selected && isAdjustable(d));
    const selected = stillThere ? state.selected : (displays.find(isAdjustable)?.key ?? null);
    update({ status: "ready", displays, selected, original, soft, writeError: false });
  } catch {
    update({ status: "error" });
  }
}

export function selectDisplay(key: string) {
  update({ selected: key });
}

export function selectedDisplay(s: State): DdcDisplay | null {
  return s.displays.find((d) => d.key === s.selected && isAdjustable(d)) ?? null;
}

// Monitors handle only a few writes per second. Keep the newest value per target and
// send writes one after another, so dragging a slider never floods the monitor.
type Job =
  | { kind: "ddc"; key: string; code: number; value: number }
  | { kind: "soft"; display: DdcDisplay; values: SoftValues };

const pending = new Map<string, Job>();
let writing = false;

function queueWrite(job: Job) {
  const id = job.kind === "ddc" ? `ddc/${job.key}/${job.code}` : `soft/${job.display.key}`;
  pending.set(id, job);
  void flush();
}

async function flush() {
  if (writing) return;
  writing = true;
  try {
    while (pending.size > 0) {
      const [id, job] = pending.entries().next().value!;
      pending.delete(id);
      try {
        if (job.kind === "ddc") {
          await invoke("ddc_set", { key: job.key, code: job.code, value: job.value });
        } else {
          await invoke("sw_set", { gdiName: job.display.gdiName, ...job.values });
        }
      } catch {
        update({ writeError: true });
      }
    }
  } finally {
    writing = false;
  }
}

export function setFeature(key: string, code: number, value: number) {
  update({
    displays: state.displays.map((d) =>
      d.key !== key ? d : { ...d, features: d.features.map((f) => (f.code === code ? { ...f, value } : f)) },
    ),
  });
  queueWrite({ kind: "ddc", key, code, value });
}

export function setSoft(key: string, patch: Partial<SoftValues>) {
  const d = state.displays.find((x) => x.key === key);
  if (!d?.gdiName) return;
  const values = { ...(state.soft[key] ?? SOFT_NEUTRAL), ...patch };
  update({ soft: { ...state.soft, [key]: values } });
  saveSoft(d, values);
  queueWrite({ kind: "soft", display: d, values });
}

export function hasChanges(s: State, key: string): boolean {
  const d = s.displays.find((x) => x.key === key);
  if (!d) return false;
  if (!d.supported) return !!s.soft[key] && !isNeutral(s.soft[key]);
  const orig = s.original[key];
  return !!orig && d.features.some((f) => orig[f.code] !== undefined && orig[f.code] !== f.value);
}

/**
 * Undo: puts a DDC/CI monitor back to the values it had when NitPick first read it,
 * or removes the software adjustment from a monitor without DDC/CI.
 */
export function restoreOriginal(key: string) {
  const d = state.displays.find((x) => x.key === key);
  if (!d) return;
  if (!d.supported) {
    setSoft(key, SOFT_NEUTRAL);
    return;
  }
  const orig = state.original[key];
  if (!orig) return;
  for (const f of d.features) {
    if (orig[f.code] !== undefined && orig[f.code] !== f.value) setFeature(key, f.code, orig[f.code]);
  }
}

export function featureValue(d: DdcDisplay | null, code: number): Feature | undefined {
  return d?.features.find((f) => f.code === code);
}
