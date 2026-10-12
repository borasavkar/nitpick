import type { Targets } from "./presets";

export type Tone = "good" | "warn" | "bad";

export interface Advice {
  tone: Tone;
  text: string;
}

export interface WizardOption {
  id: string;
  label: string;
}

export interface WizardStep {
  id: string;
  title: string;
  /** Pattern shown behind the panel; null shows a neutral backdrop. */
  patternId: string | null;
  variant?: number;
  instructions: (t: Targets) => string[];
  /** Which monitor menu settings this step is about. */
  controls?: string;
  question?: string;
  options?: WizardOption[];
  advise?: (answer: string, t: Targets) => Advice;
  optional?: boolean;
}

const RANGE_TIP =
  "Make sure your PC and monitor use the same RGB range: set the GPU output to Full RGB (NVIDIA: 'Output dynamic range: Full'; AMD: 'Pixel format: RGB 4:4:4 Full') and the monitor's 'HDMI Black Level' / 'RGB Range' to Full or High (or Auto).";

export const WIZARD_STEPS: WizardStep[] = [
  {
    id: "prep",
    title: "Get ready",
    patternId: null,
    instructions: () => [
      "Let the monitor warm up for 15–30 minutes. Colors and brightness drift while it's cold.",
      "Set the lighting in your room the way it usually is when you use the screen.",
      "In the monitor's menu, turn off Dynamic Contrast, ECO / Energy Saving, Auto Brightness and light sensors.",
      "Pick a neutral picture mode such as Standard, Custom, User or sRGB. Avoid Vivid, Dynamic or Game modes for now.",
      "Run the display at its native resolution, and turn HDR off in your OS for this setup.",
    ],
  },
  {
    id: "brightness",
    title: "Brightness",
    patternId: "dead-pixels",
    variant: 1,
    controls: "Brightness / Backlight",
    instructions: (t) => [
      "Hold a sheet of white paper next to the screen, lit by your normal room light.",
      "Adjust the monitor's Brightness until the white screen looks about as bright as the paper, not glowing brighter.",
      `For your setup, the target is roughly ${t.luminance[0]}–${t.luminance[1]} cd/m² (nits). Most monitors reach this between 20% and 50% Brightness.`,
    ],
    question: "How does the screen compare to the paper now?",
    options: [
      { id: "match", label: "About the same" },
      { id: "brighter", label: "Screen is brighter" },
      { id: "dimmer", label: "Screen is dimmer" },
    ],
    advise: (a) =>
      a === "match"
        ? { tone: "good", text: "Comfortable brightness for your room. Good for your eyes over long sessions." }
        : a === "brighter"
          ? { tone: "warn", text: "Lower Brightness until it matches the paper. A screen that's too bright causes eye strain and makes blacks look gray." }
          : { tone: "warn", text: "Raise Brightness a little. If it's already at maximum, your room may be very bright; that's OK, just keep it high." },
  },
  {
    id: "black",
    title: "Black level",
    patternId: "black-level",
    controls: "Brightness, Black Level / Black Equalizer, RGB Range",
    instructions: () => [
      "Squares 1–20 are slightly lighter than the black background.",
      "Count the squares you can see. The darkest ones should be just barely visible.",
    ],
    question: "What's the lowest-numbered square you can see?",
    options: [
      { id: "1-2", label: "1 or 2" },
      { id: "3-4", label: "3 or 4" },
      { id: "5-8", label: "5 to 8" },
      { id: "9+", label: "9 or higher" },
      { id: "gray", label: "Background looks gray" },
    ],
    advise: (a) => {
      switch (a) {
        case "1-2":
          return { tone: "good", text: "Excellent shadow detail." };
        case "3-4":
          return { tone: "good", text: "Good shadow detail. This is normal for most monitors." };
        case "5-8":
          return { tone: "warn", text: `Shadows are slightly crushed. ${RANGE_TIP} Also try a lower Gamma mode, or turn Black Equalizer / Shadow Boost up one step.` };
        case "9+":
          return { tone: "bad", text: `Shadows are clearly crushed. ${RANGE_TIP} Make sure Dynamic Contrast is off, then try a lower Gamma mode.` };
        default:
          return { tone: "bad", text: `Black is too bright. Often the monitor expects Limited range while the PC sends Full (or the other way around). ${RANGE_TIP} Then lower Black Level / Black Equalizer if your monitor has it.` };
      }
    },
  },
  {
    id: "white",
    title: "White level",
    patternId: "white-level",
    controls: "Contrast",
    instructions: () => [
      "Squares 235–254 are slightly darker than the white background.",
      "Lower the monitor's Contrast if the brightest squares disappear into the background.",
    ],
    question: "Up to which square can you still see?",
    options: [
      { id: "253", label: "253 or 254" },
      { id: "250", label: "250 to 252" },
      { id: "245", label: "Around 245" },
      { id: "none", label: "Hardly any" },
    ],
    advise: (a) =>
      a === "253" || a === "250"
        ? { tone: "good", text: "Highlights are preserved. Keep this Contrast setting." }
        : a === "245"
          ? { tone: "warn", text: "Highlights are clipping. Lower Contrast a few steps until 250+ becomes visible." }
          : { tone: "bad", text: "Highlights are heavily clipped. Lower Contrast (often the default of 50–75 is right) and check the RGB range tip from the black level step." },
  },
  {
    id: "gamma",
    title: "Gamma",
    patternId: "gamma",
    variant: 0,
    controls: "Gamma mode",
    instructions: (t) => [
      "Sit back or squint so the fine lines blur together.",
      "Find the bar where the center patch blends best into its striped surroundings.",
      `Your target gamma is ${t.gamma.toFixed(1)}. If it's off, try another Gamma mode in the monitor menu (e.g. 'Gamma 2', 'Mode 2', '2.2').`,
    ],
    question: "Which bar blends best?",
    options: ["1.8", "2.0", "2.2", "2.4", "2.6"].map((g) => ({ id: g, label: g })),
    advise: (a, t) => {
      const diff = parseFloat(a) - t.gamma;
      if (Math.abs(diff) < 0.15) return { tone: "good", text: `Right on target (${t.gamma.toFixed(1)}). Midtones look as intended.` };
      return diff < 0
        ? { tone: "warn", text: `Gamma is low, so the image looks flat or washed out. Choose a higher Gamma mode in the monitor menu, aiming for ${t.gamma.toFixed(1)}.` }
        : { tone: "warn", text: `Gamma is high, so midtones and shadows look too dark. Choose a lower Gamma mode, aiming for ${t.gamma.toFixed(1)}.` };
    },
  },
  {
    id: "gray",
    title: "Color balance",
    patternId: "grayscale",
    controls: "Color Temperature, RGB Gain",
    instructions: (t) => [
      "Look at the gray steps and the ramp at the bottom.",
      `Grays should look neutral. The standard white point is ${t.whitePoint}, often called 'Normal', '6500K' or 'sRGB' in monitor menus.`,
      "Give your eyes a few seconds to adapt before judging.",
    ],
    question: "How do the grays look?",
    options: [
      { id: "neutral", label: "Neutral" },
      { id: "blue", label: "Bluish / cold" },
      { id: "yellow", label: "Yellowish / warm" },
      { id: "green", label: "Greenish" },
      { id: "pink", label: "Pinkish" },
    ],
    advise: (a) => {
      switch (a) {
        case "neutral":
          return { tone: "good", text: "Neutral grays. Your color temperature is well balanced." };
        case "blue":
          return { tone: "warn", text: "Too cool. Pick the 'Warm', 'Normal' or '6500K' color temperature, or lower Blue gain slightly in User mode." };
        case "yellow":
          return { tone: "warn", text: "Too warm. Pick 'Normal' or '6500K', or lower Red gain slightly in User mode. (Night light / blue light filters also do this; turn them off for now.)" };
        case "green":
          return { tone: "warn", text: "Green tint. In User / Custom color mode, lower Green gain a few steps." };
        default:
          return { tone: "warn", text: "Magenta tint. In User / Custom color mode, raise Green gain a little or lower Red and Blue slightly." };
      }
    },
  },
  {
    id: "sharpness",
    title: "Sharpness",
    patternId: "sharpness",
    controls: "Sharpness",
    instructions: () => [
      "Look closely at the edges of the black and white blocks and the fine lines.",
      "Bright or dark outlines around edges (halos) mean the monitor is over-sharpening.",
    ],
    question: "How do the edges look?",
    options: [
      { id: "clean", label: "Clean and crisp" },
      { id: "halo", label: "Halos around edges" },
      { id: "blurry", label: "Soft or blurry" },
    ],
    advise: (a) =>
      a === "clean"
        ? { tone: "good", text: "Sharpness is neutral. Keep it." }
        : a === "halo"
          ? { tone: "warn", text: "Lower Sharpness until the halos disappear. The neutral point is often 0, 50 or the default value." }
          : { tone: "warn", text: "Check that your OS uses the display's native resolution. If it does, raise Sharpness one step at a time but stop before halos appear." },
  },
  {
    id: "gradients",
    title: "Smoothness",
    patternId: "gradients",
    controls: "Picture enhancers, GPU color depth",
    instructions: () => ["Each color ramp should flow smoothly from dark to bright, without steps or stripes."],
    question: "Do you see banding?",
    options: [
      { id: "smooth", label: "Smooth" },
      { id: "slight", label: "Slight steps" },
      { id: "strong", label: "Clear stripes" },
    ],
    advise: (a) =>
      a === "smooth"
        ? { tone: "good", text: "Smooth gradients." }
        : a === "slight"
          ? { tone: "good", text: "Slight banding is common on many monitors and usually not noticeable in real content." }
          : { tone: "warn", text: "Turn off picture enhancers (dynamic contrast, super resolution, noise reduction). In GPU settings, use the highest color depth (8 or 10 bpc) and RGB output." },
  },
  {
    id: "motion",
    title: "Motion",
    patternId: "motion",
    variant: 1,
    optional: true,
    controls: "Overdrive / Response Time",
    instructions: () => [
      "Follow the moving object with your eyes.",
      "Try each Overdrive / Response Time level in the monitor menu and pick the one with the cleanest edges.",
    ],
    question: "What trails behind the object?",
    options: [
      { id: "clean", label: "Clean edges" },
      { id: "dark", label: "Dark smear" },
      { id: "bright", label: "Bright / colored halo" },
      { id: "skip", label: "Skip" },
    ],
    advise: (a) =>
      a === "clean" || a === "skip"
        ? { tone: "good", text: a === "skip" ? "Motion check skipped." : "Overdrive is well tuned." }
        : a === "dark"
          ? { tone: "warn", text: "That's ghosting. Raise Overdrive / Response Time one level." }
          : { tone: "warn", text: "That's overshoot. Lower Overdrive / Response Time one level." },
  },
];
