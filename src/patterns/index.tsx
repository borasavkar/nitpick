import { useCallback, type ReactNode } from "react";
import { PixelCanvas, type DrawFn } from "./PixelCanvas";
import {
  GAMMA_CHANNELS,
  MOTION_SPEEDS,
  SOLID_COLORS,
  UNIFORMITY_LEVELS,
  drawBlackLevel,
  drawColors,
  drawGamma,
  drawGradients,
  drawGrayscale,
  drawMotion,
  drawSharpness,
  drawSolid,
  drawUniformity,
  drawWhiteLevel,
} from "./draw";

export interface PatternDef {
  id: string;
  name: string;
  summary: string;
  /** What the user should look for. */
  instructions: string[];
  /** Optional named variants the user can cycle through. */
  variants?: string[];
  /** CSS background used for the preview thumbnail. */
  thumb: string;
  render: (variant: number) => ReactNode;
}

function Static({ draw }: { draw: DrawFn }) {
  return <PixelCanvas draw={draw} />;
}

function Gamma({ channel }: { channel: number }) {
  const draw = useCallback<DrawFn>((c, w, h, d) => drawGamma(c, w, h, d, channel), [channel]);
  return <PixelCanvas draw={draw} />;
}

function Solid({ color }: { color: string }) {
  const draw = useCallback<DrawFn>((c, w, h) => drawSolid(c, w, h, color), [color]);
  return <PixelCanvas draw={draw} />;
}

function Uniformity({ value }: { value: number }) {
  const draw = useCallback<DrawFn>((c, w, h) => drawUniformity(c, w, h, value), [value]);
  return <PixelCanvas draw={draw} />;
}

function Motion({ speedSet }: { speedSet: number }) {
  const draw = useCallback<DrawFn>((c, w, h, d) => drawMotion(c, w, h, d, performance.now(), speedSet), [speedSet]);
  return <PixelCanvas draw={draw} animate />;
}

function TextClarity({ dark }: { dark: boolean }) {
  const sizes = [11, 12, 13, 14, 16, 18, 22];
  return (
    <div className={`text-pattern ${dark ? "dark" : ""}`}>
      {sizes.map((s) => (
        <p key={s} style={{ fontSize: s }}>
          <b>{s}px</b> The quick brown fox jumps over the lazy dog. 0123456789 — Sphinx of black quartz, judge my vow.
        </p>
      ))}
      <div className="text-colors">
        <span style={{ color: "#d32f2f" }}>Red text</span>
        <span style={{ color: "#2e7d32" }}>Green text</span>
        <span style={{ color: "#1565c0" }}>Blue text</span>
        <span style={{ color: "#888" }}>Gray text</span>
      </div>
    </div>
  );
}

export const PATTERNS: PatternDef[] = [
  {
    id: "black-level",
    name: "Black Level",
    summary: "Can you see detail in the shadows?",
    instructions: [
      "Squares 1–20 are slightly brighter than the black background.",
      "Ideally you can just make out square 2 or 3, and square 1 is barely visible.",
      "If you only see squares from 5 or higher, shadows are being crushed.",
      "If the background itself looks gray rather than black, black level is too high.",
    ],
    thumb: "radial-gradient(circle at 50% 50%, #151515 0 30%, #000 31%)",
    render: () => <Static draw={drawBlackLevel} />,
  },
  {
    id: "white-level",
    name: "White Level",
    summary: "Are bright highlights clipped?",
    instructions: [
      "Squares 235–254 are slightly darker than the white background.",
      "Ideally you can see squares up to 252–254.",
      "If the brightest squares disappear into the background, Contrast is set too high.",
    ],
    thumb: "radial-gradient(circle at 50% 50%, #ececec 0 30%, #fff 31%)",
    render: () => <Static draw={drawWhiteLevel} />,
  },
  {
    id: "gamma",
    name: "Gamma",
    summary: "Midtone brightness, the overall 'punch'.",
    instructions: [
      "Sit back or squint slightly so the fine lines blur together.",
      "Find the bar where the center patch blends into the striped area. That number is your gamma.",
      "2.2 is the standard for PCs and the web; 2.4 suits movies in a dark room.",
      "Use the color variants to check whether red, green and blue track the same gamma.",
    ],
    variants: [...GAMMA_CHANNELS],
    thumb: "repeating-linear-gradient(0deg, #fff 0 1px, #000 1px 2px)",
    render: (v) => <Gamma channel={v} />,
  },
  {
    id: "grayscale",
    name: "Gray Balance",
    summary: "Grays should look neutral, without a color tint.",
    instructions: [
      "Every gray step should look neutral, with no pink, green, blue or yellow tint.",
      "The smooth ramp at the bottom should not shift color from dark to light.",
      "A tint usually means the color temperature or RGB gain is off.",
    ],
    thumb: "linear-gradient(90deg, #000, #fff)",
    render: () => <Static draw={drawGrayscale} />,
  },
  {
    id: "gradients",
    name: "Gradients",
    summary: "Smooth transitions, no banding.",
    instructions: [
      "Each ramp should look perfectly smooth from left to right.",
      "Visible steps, stripes or color blotches are called banding.",
      "Banding is often caused by dynamic contrast, picture enhancers or reduced color depth in GPU settings.",
    ],
    thumb: "linear-gradient(180deg, transparent 0 75%, #00f 75%), linear-gradient(90deg, #000, #f00)",
    render: () => <Static draw={drawGradients} />,
  },
  {
    id: "sharpness",
    name: "Sharpness",
    summary: "Crisp lines without halos.",
    instructions: [
      "Fine lines and the checkerboard should look clean and even.",
      "Bright or dark outlines (halos) around the black and white blocks mean Sharpness is too high.",
      "Blurry text usually means you're not at native resolution or scaling is off.",
    ],
    thumb: "repeating-linear-gradient(90deg, #fff 0 1px, #000 1px 2px)",
    render: () => <Static draw={drawSharpness} />,
  },
  {
    id: "colors",
    name: "Color Bars",
    summary: "Saturation steps and color clipping.",
    instructions: [
      "Colors should look rich but natural, not neon.",
      "Every saturation step from 10% to 100% should be distinguishable.",
      "If the last few steps look identical, the monitor is clipping saturated colors (try its sRGB mode).",
    ],
    thumb: "linear-gradient(90deg, #fff 0 12.5%, #ff0 0 25%, #0ff 0 37.5%, #0f0 0 50%, #f0f 0 62.5%, #f00 0 75%, #00f 0 87.5%, #000 0)",
    render: () => <Static draw={drawColors} />,
  },
  {
    id: "uniformity",
    name: "Uniformity",
    summary: "Even brightness, backlight bleed.",
    instructions: [
      "The whole screen should look evenly lit, corners included.",
      "On the black screen, glowing patches near the edges are backlight bleed (best checked in a dark room).",
      "Some variation is normal, especially on IPS and VA panels.",
    ],
    variants: UNIFORMITY_LEVELS.map((l) => l.name),
    thumb: "radial-gradient(circle at 50% 50%, #8a8a8a, #6a6a6a)",
    render: (v) => <Uniformity value={UNIFORMITY_LEVELS[v].value} />,
  },
  {
    id: "dead-pixels",
    name: "Dead Pixels",
    summary: "Find dead or stuck pixels.",
    instructions: [
      "Scan each solid color for tiny dots that don't match.",
      "A dot that stays black is a dead pixel; a dot stuck on one color is a stuck pixel.",
      "Dust on the screen can look similar. Wipe the screen gently and check again.",
    ],
    variants: SOLID_COLORS.map((c) => c.name),
    thumb: "linear-gradient(135deg, #f00 0 33%, #0f0 0 66%, #00f 0)",
    render: (v) => <Solid color={SOLID_COLORS[v].color} />,
  },
  {
    id: "motion",
    name: "Motion Clarity",
    summary: "Ghosting, trails and overdrive.",
    instructions: [
      "Follow the moving object with your eyes.",
      "A dark smear behind it is ghosting; a bright or colored halo is overshoot from too much Overdrive.",
      "Set Overdrive / Response Time to the level with the cleanest edges in all three lanes.",
      "Speeds are relative to your refresh rate; higher refresh rates look clearer.",
    ],
    variants: ["Slow", "Medium", "Fast"].map((n, i) => `${n} (${MOTION_SPEEDS.map((s) => Math.round(s * [0.5, 1, 1.5][i])).join(" / ")} px/s)`),
    thumb: "linear-gradient(180deg, #202020 0 33%, #808080 0 66%, #e0e0e0 0)",
    render: (v) => <Motion speedSet={v} />,
  },
  {
    id: "text",
    name: "Text Clarity",
    summary: "Readable, comfortable text.",
    instructions: [
      "Text should look crisp without color fringes or fuzzy edges.",
      "If text looks blurry, check that the display runs at its native resolution.",
      "On Windows, run the ClearType Text Tuner if small text looks colored at the edges.",
    ],
    variants: ["Dark on light", "Light on dark"],
    thumb: "repeating-linear-gradient(180deg, #fff 0 6px, #999 6px 7px)",
    render: (v) => <TextClarity dark={v === 1} />,
  },
];

export const getPattern = (id: string): PatternDef => PATTERNS.find((p) => p.id === id) ?? PATTERNS[0];
