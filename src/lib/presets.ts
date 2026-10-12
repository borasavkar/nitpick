export type UseCase = "general" | "photo" | "movie" | "gaming" | "office";
export type Ambient = "bright" | "dim" | "dark";

export const USE_CASES: { id: UseCase; label: string; hint: string }[] = [
  { id: "general", label: "General", hint: "Web, video, a bit of everything" },
  { id: "photo", label: "Photo & Design", hint: "Accurate color and tone" },
  { id: "movie", label: "Movies & Series", hint: "Cinematic contrast" },
  { id: "gaming", label: "Gaming", hint: "Shadow detail and clear motion" },
  { id: "office", label: "Office & Reading", hint: "Comfortable for long hours" },
];

export const AMBIENTS: { id: Ambient; label: string; hint: string }[] = [
  { id: "bright", label: "Bright room", hint: "Daylight or strong lights" },
  { id: "dim", label: "Dim room", hint: "Soft indoor lighting" },
  { id: "dark", label: "Dark room", hint: "Lights off or nearly off" },
];

export interface Targets {
  /** Recommended white luminance range in cd/m² (nits). */
  luminance: [number, number];
  gamma: number;
  whitePoint: string;
  tips: string[];
}

const BASE_LUMINANCE: Record<Ambient, [number, number]> = {
  bright: [160, 220],
  dim: [110, 150],
  dark: [70, 100],
};

export function getTargets(useCase: UseCase, ambient: Ambient): Targets {
  let [lo, hi] = BASE_LUMINANCE[ambient];
  let gamma = 2.2;
  const tips: string[] = [];

  switch (useCase) {
    case "photo":
      // Editing and print matching work best with a moderate white level.
      lo = Math.min(lo, 100);
      hi = Math.min(hi, 140);
      tips.push("Use the monitor's sRGB mode if it has one; it limits oversaturated colors.");
      tips.push("Keep room lighting consistent while you edit.");
      break;
    case "movie":
      if (ambient === "dark") gamma = 2.4;
      tips.push("Turn off dynamic contrast and noise reduction; they crush shadow detail.");
      break;
    case "gaming":
      tips.push("Set Overdrive / Response Time to a medium level; the highest level often causes bright trails.");
      tips.push("Enable the monitor's low input lag or game mode if available.");
      tips.push("Avoid 'Black Equalizer' / shadow boost for accurate images; use it only for competitive play.");
      break;
    case "office":
      hi = hi + 20;
      tips.push("If your eyes tire in the evening, lower brightness first, then use a warmer night mode.");
      break;
    case "general":
      break;
  }

  return { luminance: [lo, hi], gamma, whitePoint: "6500K (D65)", tips };
}
