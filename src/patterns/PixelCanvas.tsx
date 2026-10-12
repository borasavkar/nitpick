import { useEffect, useRef } from "react";

export type DrawFn = (ctx: CanvasRenderingContext2D, w: number, h: number, dpr: number) => void;

/**
 * A canvas whose backing store maps 1:1 to physical screen pixels, so 1px line
 * patterns are drawn exactly as intended regardless of OS display scaling.
 * Pass `animate` to redraw every frame (draw receives elapsed time via closure).
 */
export function PixelCanvas({ draw, animate = false }: { draw: DrawFn; animate?: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    let frame = 0;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(1, Math.round(wrap.clientWidth * dpr));
      const h = Math.max(1, Math.round(wrap.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        canvas.style.width = `${w / dpr}px`;
        canvas.style.height = `${h / dpr}px`;
      }
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;
      drawRef.current(ctx, w, h, dpr);
    };

    const loop = () => {
      render();
      frame = requestAnimationFrame(loop);
    };

    if (animate) loop();
    else render();

    const ro = new ResizeObserver(() => !animate && render());
    ro.observe(wrap);
    // Display scaling can change when the window moves between monitors.
    const mq = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    const onDpr = () => !animate && render();
    mq.addEventListener("change", onDpr);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      mq.removeEventListener("change", onDpr);
    };
  }, [animate]);

  // Static patterns redraw when their draw function changes (e.g. variant switch).
  useEffect(() => {
    if (animate) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: false });
    if (canvas && ctx) draw(ctx, canvas.width, canvas.height, window.devicePixelRatio || 1);
  }, [draw, animate]);

  return (
    <div ref={wrapRef} className="pixel-wrap">
      <canvas ref={canvasRef} />
    </div>
  );
}
