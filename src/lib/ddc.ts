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
  supported: boolean;
  features: Feature[];
}

interface State {
  status: "idle" | "loading" | "ready" | "error";
  displays: DdcDisplay[];
  selected: string | null;
  /** Values read when NitPick first saw each display, so changes can be undone. */
  original: Record<string, Record<number, number>>;
  /** A write failed; the monitor may have stopped answering. */
  writeError: boolean;
}

let state: State = { status: "idle", displays: [], selected: null, original: {}, writeError: false };
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

/** Reads all displays and their values. Safe to call repeatedly; does nothing in the web version. */
export async function refreshDdc(): Promise<void> {
  if (!isTauri() || state.status === "loading") return;
  update({ status: "loading" });
  try {
    const displays = await invoke<DdcDisplay[]>("ddc_list");
    const original = { ...state.original };
    for (const d of displays) {
      if (d.supported && !original[d.key]) {
        original[d.key] = Object.fromEntries(d.features.map((f) => [f.code, f.value]));
      }
    }
    const stillThere = displays.some((d) => d.key === state.selected && d.supported);
    const selected = stillThere ? state.selected : (displays.find((d) => d.supported)?.key ?? null);
    update({ status: "ready", displays, selected, original, writeError: false });
  } catch {
    update({ status: "error" });
  }
}

export function selectDisplay(key: string) {
  update({ selected: key });
}

export function selectedDisplay(s: State): DdcDisplay | null {
  return s.displays.find((d) => d.key === s.selected && d.supported) ?? null;
}

function setLocal(key: string, code: number, value: number) {
  update({
    displays: state.displays.map((d) =>
      d.key !== key ? d : { ...d, features: d.features.map((f) => (f.code === code ? { ...f, value } : f)) },
    ),
  });
}

// Monitors handle only a few DDC writes per second. Keep the newest value per feature and
// send writes one after another, so dragging a slider never floods the monitor.
const pending = new Map<string, { key: string; code: number; value: number }>();
let writing = false;

async function flush() {
  if (writing) return;
  writing = true;
  try {
    while (pending.size > 0) {
      const [id, job] = pending.entries().next().value!;
      pending.delete(id);
      try {
        await invoke("ddc_set", { key: job.key, code: job.code, value: job.value });
      } catch {
        update({ writeError: true });
      }
    }
  } finally {
    writing = false;
  }
}

export function setFeature(key: string, code: number, value: number) {
  setLocal(key, code, value);
  pending.set(`${key}/${code}`, { key, code, value });
  void flush();
}

export function hasChanges(s: State, key: string): boolean {
  const d = s.displays.find((x) => x.key === key);
  const orig = s.original[key];
  return !!d && !!orig && d.features.some((f) => orig[f.code] !== undefined && orig[f.code] !== f.value);
}

/** Puts every feature back to the value it had when NitPick first read it. */
export function restoreOriginal(key: string) {
  const d = state.displays.find((x) => x.key === key);
  const orig = state.original[key];
  if (!d || !orig) return;
  for (const f of d.features) {
    if (orig[f.code] !== undefined && orig[f.code] !== f.value) setFeature(key, f.code, orig[f.code]);
  }
}

export function featureValue(d: DdcDisplay | null, code: number): Feature | undefined {
  return d?.features.find((f) => f.code === code);
}
