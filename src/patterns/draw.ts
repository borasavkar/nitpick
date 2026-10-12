// Pure drawing routines for the test patterns. All sizes are in physical pixels.

type Ctx = CanvasRenderingContext2D;

const gray = (v: number) => `rgb(${v},${v},${v})`;

function label(ctx: Ctx, text: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = "center") {
  ctx.font = `600 ${Math.round(size)}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "top";
  ctx.fillText(text, x, y);
}

/** Lays out `count` squares in rows, centered. Returns the square rects. */
function squareGrid(w: number, h: number, dpr: number, count: number, perRow: number) {
  const rows = Math.ceil(count / perRow);
  const gapRatio = 0.18;
  const labelSpace = Math.ceil(30 * dpr);
  const size = Math.floor(Math.min((w * 0.86) / (perRow + (perRow - 1) * gapRatio), (h * 0.62) / rows - labelSpace));
  const gap = Math.floor(size * gapRatio);
  const rowH = size + labelSpace;
  const totalW = perRow * size + (perRow - 1) * gap;
  const x0 = Math.floor((w - totalW) / 2);
  const y0 = Math.floor((h - rows * rowH) / 2);
  return Array.from({ length: count }, (_, i) => ({
    x: x0 + (i % perRow) * (size + gap),
    y: y0 + Math.floor(i / perRow) * rowH,
    size,
  }));
}

/** Near-black squares 1..20 on pure black: reveals crushed shadows. */
export function drawBlackLevel(ctx: Ctx, w: number, h: number, dpr: number) {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  squareGrid(w, h, dpr, 20, 10).forEach((r, i) => {
    const v = i + 1;
    ctx.fillStyle = gray(v);
    ctx.fillRect(r.x, r.y, r.size, r.size);
    label(ctx, String(v), r.x + r.size / 2, r.y + r.size + 6 * dpr, 13 * dpr, "#5a5a5a");
  });
}

/** Near-white squares 235..254 on pure white: reveals clipped highlights. */
export function drawWhiteLevel(ctx: Ctx, w: number, h: number, dpr: number) {
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  squareGrid(w, h, dpr, 20, 10).forEach((r, i) => {
    const v = 235 + i;
    ctx.fillStyle = gray(v);
    ctx.fillRect(r.x, r.y, r.size, r.size);
    label(ctx, String(v), r.x + r.size / 2, r.y + r.size + 6 * dpr, 13 * dpr, "#9a9a9a");
  });
}

export const GAMMA_CHANNELS = ["Gray", "Red", "Green", "Blue"] as const;

/**
 * Gamma bars: each bar is 1px alternating full/zero lines (50% light on average)
 * with a solid patch in the middle. The bar whose patch blends in shows the gamma.
 */
export function drawGamma(ctx: Ctx, w: number, h: number, dpr: number, channel = 0) {
  const gammas = [1.8, 2.0, 2.2, 2.4, 2.6];
  const color = (v: number) =>
    channel === 1 ? `rgb(${v},0,0)` : channel === 2 ? `rgb(0,${v},0)` : channel === 3 ? `rgb(0,0,${v})` : gray(v);

  ctx.fillStyle = "#181818";
  ctx.fillRect(0, 0, w, h);

  const n = gammas.length;
  const gap = Math.floor(w * 0.015);
  const barW = Math.floor((w * 0.86 - gap * (n - 1)) / n);
  const barH = Math.floor(h * 0.6);
  const x0 = Math.floor((w - (barW * n + gap * (n - 1))) / 2);
  const top = Math.floor((h - barH) / 2) - Math.floor(16 * dpr);

  gammas.forEach((g, i) => {
    const x = x0 + i * (barW + gap);
    ctx.fillStyle = color(0);
    ctx.fillRect(x, top, barW, barH);
    ctx.fillStyle = color(255);
    for (let y = 0; y < barH; y += 2) ctx.fillRect(x, top + y, barW, 1);

    const patchW = Math.floor(barW * 0.5);
    const patchH = Math.floor(barH * 0.34);
    ctx.fillStyle = color(Math.round(255 * Math.pow(0.5, 1 / g)));
    ctx.fillRect(x + Math.floor((barW - patchW) / 2), top + Math.floor((barH - patchH) / 2), patchW, patchH);

    label(ctx, g.toFixed(1), x + barW / 2, top + barH + 14 * dpr, 22 * dpr, g === 2.2 ? "#e6e6e6" : "#8a8a8a");
  });
}

/** 17 gray steps from black to white plus a smooth ramp: grays should look neutral. */
export function drawGrayscale(ctx: Ctx, w: number, h: number, dpr: number) {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  const steps = 17;
  const stepH = Math.floor(h * 0.62);
  for (let i = 0; i < steps; i++) {
    const x = Math.floor((i * w) / steps);
    const x2 = Math.floor(((i + 1) * w) / steps);
    ctx.fillStyle = gray(Math.min(255, i * 16));
    ctx.fillRect(x, 0, x2 - x, stepH);
    label(ctx, String(Math.min(255, i * 16)), (x + x2) / 2, stepH - 26 * dpr, 12 * dpr, i < 9 ? "#888" : "#555");
  }
  for (let x = 0; x < w; x++) {
    ctx.fillStyle = gray(Math.round((x / (w - 1)) * 255));
    ctx.fillRect(x, stepH, 1, h - stepH);
  }
}

/** Smooth gray/red/green/blue ramps: steps or stripes mean banding. */
export function drawGradients(ctx: Ctx, w: number, h: number) {
  const bands: ((v: number) => string)[] = [gray, (v) => `rgb(${v},0,0)`, (v) => `rgb(0,${v},0)`, (v) => `rgb(0,0,${v})`];
  bands.forEach((fn, b) => {
    const y = Math.floor((b * h) / bands.length);
    const y2 = Math.floor(((b + 1) * h) / bands.length);
    for (let x = 0; x < w; x++) {
      ctx.fillStyle = fn(Math.round((x / (w - 1)) * 255));
      ctx.fillRect(x, y, 1, y2 - y);
    }
  });
}

/** Fine line gratings, checkerboard, edges and text on mid gray: reveals over-sharpening halos and blur. */
export function drawSharpness(ctx: Ctx, w: number, h: number, dpr: number) {
  ctx.fillStyle = gray(128);
  ctx.fillRect(0, 0, w, h);

  const cols = 3;
  const rows = 2;
  const size = Math.floor(Math.min((w * 0.84) / cols, (h * 0.74) / rows) * 0.82);
  const gapX = Math.floor((w - cols * size) / (cols + 1));
  const gapY = Math.floor((h - rows * size) / (rows + 1));
  const cell = (i: number) => ({ x: gapX + (i % cols) * (size + gapX), y: gapY + Math.floor(i / cols) * (size + gapY) });

  // 1: 1px vertical lines
  let c = cell(0);
  ctx.fillStyle = "#000";
  ctx.fillRect(c.x, c.y, size, size);
  ctx.fillStyle = "#fff";
  for (let x = 0; x < size; x += 2) ctx.fillRect(c.x + x, c.y, 1, size);

  // 2: 1px horizontal lines
  c = cell(1);
  ctx.fillStyle = "#000";
  ctx.fillRect(c.x, c.y, size, size);
  ctx.fillStyle = "#fff";
  for (let y = 0; y < size; y += 2) ctx.fillRect(c.x, c.y + y, size, 1);

  // 3: 1px checkerboard
  c = cell(2);
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const v = (x + y) % 2 ? 255 : 0;
      const p = (y * size + x) * 4;
      img.data[p] = img.data[p + 1] = img.data[p + 2] = v;
      img.data[p + 3] = 255;
    }
  }
  ctx.putImageData(img, c.x, c.y);

  // 4: solid black and white blocks: halos appear as bright/dark outlines around edges
  c = cell(3);
  const half = Math.floor(size / 2);
  ctx.fillStyle = "#000";
  ctx.fillRect(c.x + Math.floor(size * 0.1), c.y + Math.floor(size * 0.1), half - Math.floor(size * 0.15), size - Math.floor(size * 0.2));
  ctx.fillStyle = "#fff";
  ctx.fillRect(c.x + half + Math.floor(size * 0.05), c.y + Math.floor(size * 0.1), half - Math.floor(size * 0.15), size - Math.floor(size * 0.2));

  // 5: thin 1px outlines
  c = cell(4);
  ctx.fillStyle = "#000";
  for (let k = 0; k < 6; k++) {
    const inset = Math.floor(k * size * 0.08);
    const s = size - inset * 2;
    ctx.fillStyle = k % 2 ? "#fff" : "#000";
    ctx.fillRect(c.x + inset, c.y + inset, s, 1);
    ctx.fillRect(c.x + inset, c.y + inset + s - 1, s, 1);
    ctx.fillRect(c.x + inset, c.y + inset, 1, s);
    ctx.fillRect(c.x + inset + s - 1, c.y + inset, 1, s);
  }

  // 6: text at small sizes
  c = cell(5);
  const sizes = [10, 11, 12, 13, 14, 16, 18];
  let y = c.y;
  ctx.save();
  ctx.beginPath();
  ctx.rect(c.x, c.y, size, size);
  ctx.clip();
  sizes.forEach((s, i) => {
    ctx.font = `${Math.round(s * dpr)}px system-ui, -apple-system, "Segoe UI", sans-serif`;
    ctx.fillStyle = i % 2 ? "#fff" : "#000";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`${s}px Sharp text Aa 0123`, c.x, y);
    y += Math.round(s * dpr * 1.6);
  });
  ctx.restore();
}

export const SOLID_COLORS: { name: string; color: string }[] = [
  { name: "Black", color: "#000000" },
  { name: "White", color: "#ffffff" },
  { name: "Red", color: "#ff0000" },
  { name: "Green", color: "#00ff00" },
  { name: "Blue", color: "#0000ff" },
  { name: "Cyan", color: "#00ffff" },
  { name: "Magenta", color: "#ff00ff" },
  { name: "Yellow", color: "#ffff00" },
];

export function drawSolid(ctx: Ctx, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
}

export const UNIFORMITY_LEVELS: { name: string; value: number }[] = [
  { name: "Black (backlight bleed)", value: 0 },
  { name: "Dark gray 10%", value: 26 },
  { name: "Gray 25%", value: 64 },
  { name: "Gray 50%", value: 128 },
  { name: "Gray 75%", value: 191 },
  { name: "White 100%", value: 255 },
];

export function drawUniformity(ctx: Ctx, w: number, h: number, value: number) {
  drawSolid(ctx, w, h, gray(value));
}

/** Full color bars on top, saturation steps below: every step should be distinguishable. */
export function drawColors(ctx: Ctx, w: number, h: number, dpr: number) {
  const bars = ["#ffffff", "#ffff00", "#00ffff", "#00ff00", "#ff00ff", "#ff0000", "#0000ff", "#000000"];
  const barH = Math.floor(h * 0.38);
  bars.forEach((c, i) => {
    const x = Math.floor((i * w) / bars.length);
    const x2 = Math.floor(((i + 1) * w) / bars.length);
    ctx.fillStyle = c;
    ctx.fillRect(x, 0, x2 - x, barH);
  });

  const hues: [number, number, number][] = [
    [255, 0, 0],
    [0, 255, 0],
    [0, 0, 255],
    [0, 255, 255],
    [255, 0, 255],
    [255, 255, 0],
  ];
  const steps = 10;
  ctx.fillStyle = "#111";
  ctx.fillRect(0, barH, w, h - barH);
  const rowH = Math.floor((h - barH) / hues.length);
  hues.forEach((rgb, r) => {
    for (let s = 0; s < steps; s++) {
      const t = (s + 1) / steps;
      // Mix from white toward the full hue: 10% ... 100% saturation.
      const [cr, cg, cb] = rgb.map((v) => Math.round(255 - t * (255 - v)));
      const x = Math.floor((s * w) / steps);
      const x2 = Math.floor(((s + 1) * w) / steps);
      ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
      ctx.fillRect(x, barH + r * rowH, x2 - x, rowH);
    }
  });
  for (let s = 0; s < steps; s++) {
    label(ctx, `${(s + 1) * 10}%`, ((s + 0.5) * w) / steps, barH + 6 * dpr, 12 * dpr, "#555");
  }
}

export const MOTION_SPEEDS = [480, 960, 1440] as const;

/** Three lanes with a moving object at different speeds (in CSS px per second). */
export function drawMotion(ctx: Ctx, w: number, h: number, dpr: number, t: number, speedSet: number) {
  const lanes = [
    { bg: 32, speed: MOTION_SPEEDS[0] },
    { bg: 128, speed: MOTION_SPEEDS[1] },
    { bg: 224, speed: MOTION_SPEEDS[2] },
  ];
  const factor = [0.5, 1, 1.5][speedSet] ?? 1;
  const laneH = Math.floor(h / lanes.length);
  lanes.forEach((lane, i) => {
    const y = i * laneH;
    ctx.fillStyle = gray(lane.bg);
    ctx.fillRect(0, y, w, laneH);

    const size = Math.min(laneH * 0.5, 140 * dpr);
    const speed = lane.speed * factor * dpr;
    const travel = w + size * 2;
    const x = ((t / 1000) * speed) % travel - size;
    const cy = y + laneH / 2;

    // Saucer body
    ctx.fillStyle = "#3a3a3a";
    ctx.beginPath();
    ctx.ellipse(x + size / 2, cy + size * 0.08, size / 2, size * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    // Dome
    ctx.fillStyle = "#42c8f5";
    ctx.beginPath();
    ctx.ellipse(x + size / 2, cy - size * 0.05, size * 0.24, size * 0.22, 0, Math.PI, 0);
    ctx.fill();
    // Eyes: high-contrast details make trails easy to spot
    ctx.fillStyle = "#fff";
    ctx.fillRect(x + size * 0.38, cy - size * 0.15, size * 0.08, size * 0.08);
    ctx.fillRect(x + size * 0.54, cy - size * 0.15, size * 0.08, size * 0.08);
    ctx.fillStyle = "#000";
    ctx.fillRect(x + size * 0.4, cy - size * 0.13, size * 0.04, size * 0.04);
    ctx.fillRect(x + size * 0.56, cy - size * 0.13, size * 0.04, size * 0.04);
    // Lights
    ctx.fillStyle = "#ffd84a";
    for (let k = 0; k < 4; k++) ctx.fillRect(x + size * (0.18 + k * 0.18), cy + size * 0.05, size * 0.08, size * 0.06);

    label(ctx, `${Math.round(lane.speed * factor)} px/s`, 16 * dpr, y + 12 * dpr, 14 * dpr, lane.bg > 150 ? "#333" : "#bbb", "left");
  });
}
