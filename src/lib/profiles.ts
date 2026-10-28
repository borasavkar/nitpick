import { useSyncExternalStore } from "react";
import type { L } from "../i18n";
import {
  SOFT_NEUTRAL,
  displayId,
  getDdcState,
  isAdjustable,
  refreshDdc,
  setFeature,
  setSoft,
  type SoftValues,
} from "./ddc";

export type ProfileId = "day" | "movie" | "night";

export const PROFILE_DEFS: { id: ProfileId; label: L; hint: L }[] = [
  { id: "day", label: { en: "Day", tr: "Gündüz" }, hint: { en: "Everyday use in daylight", tr: "Gün ışığında günlük kullanım" } },
  { id: "movie", label: { en: "Movie", tr: "Film" }, hint: { en: "Films and series", tr: "Film ve dizi izlerken" } },
  { id: "night", label: { en: "Night", tr: "Gece" }, hint: { en: "Evenings and dark rooms", tr: "Akşamları ve karanlık odada" } },
];

/** What a profile remembers for one monitor. */
interface DisplaySnapshot {
  name: string;
  /** DDC/CI feature values by VCP code, for monitors that answer DDC/CI. */
  hw?: Record<number, number>;
  /** Software adjustment, for monitors without DDC/CI. */
  soft?: SoftValues;
}

export interface Profile {
  savedAt: string;
  /** Keyed by `displayId`. */
  displays: Record<string, DisplaySnapshot>;
}

interface State {
  profiles: Partial<Record<ProfileId, Profile>>;
  /** The profile applied most recently. */
  lastApplied: ProfileId | null;
}

const KEY = "nitpick.profiles.v1";

function load(): State {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return { profiles: raw.profiles ?? {}, lastApplied: raw.lastApplied ?? null };
  } catch {
    return { profiles: {}, lastApplied: null };
  }
}

let state: State = load();
const listeners = new Set<() => void>();

function update(patch: Partial<State>) {
  state = { ...state, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
  listeners.forEach((l) => l());
}

export function useProfiles(): State {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

/** Stores the current values of every adjustable monitor in a profile. */
export function saveProfile(id: ProfileId) {
  const ddc = getDdcState();
  const displays: Record<string, DisplaySnapshot> = {};
  for (const d of ddc.displays.filter(isAdjustable)) {
    displays[displayId(d)] = d.supported
      ? { name: d.name, hw: Object.fromEntries(d.features.map((f) => [f.code, f.value])) }
      : { name: d.name, soft: { ...(ddc.soft[d.key] ?? SOFT_NEUTRAL) } };
  }
  update({ profiles: { ...state.profiles, [id]: { savedAt: new Date().toISOString(), displays } } });
}

export function clearProfile(id: ProfileId) {
  const profiles = { ...state.profiles };
  delete profiles[id];
  update({ profiles, lastApplied: state.lastApplied === id ? null : state.lastApplied });
}

/** Applies a profile to the monitors that are connected now; others are skipped. */
export async function applyProfile(id: ProfileId) {
  const profile = state.profiles[id];
  if (!profile) return;
  if (getDdcState().status !== "ready") await refreshDdc();
  const ddc = getDdcState();
  for (const d of ddc.displays) {
    const snap = profile.displays[displayId(d)];
    if (!snap) continue;
    if (d.supported && snap.hw) {
      for (const f of d.features) {
        const target = snap.hw[f.code];
        if (target !== undefined && target !== f.value) setFeature(d.key, f.code, target);
      }
    } else if (!d.supported && snap.soft) {
      setSoft(d.key, snap.soft);
    }
  }
  update({ lastApplied: id });
}

export const isProfileId = (v: unknown): v is ProfileId => PROFILE_DEFS.some((p) => p.id === v);
