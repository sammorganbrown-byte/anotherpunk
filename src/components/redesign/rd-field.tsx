import { useEffect, useRef } from "react";

/** Ambient texture behind every redesign page.
 *
 * This replaced a halftone dot grid, which read as decorative wallpaper.
 * The material now comes from the photography itself: these are flash-lit
 * 35mm frames with heavy grain, so the site's ground is live grain — plus
 * slow red blooms drifting underneath it, like ink soaking through.
 *
 * Grain is generated on a SMALL offscreen canvas (a 180px tile) and stamped
 * across the viewport scaled up. Chunky by design, and it means the
 * per-frame pixel work is ~32k pixels instead of ~2M — the difference
 * between this being free and this being a phone-killer. It also only
 * regenerates ~12 times a second; grain reads as random, not as smooth.
 *
 * Pauses when hidden or scrolled out. Never mounts under reduced motion.
 */
export function RdField() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d", { alpha: true });
    if (!ctx) return;

    const TILE = 180;
    const noise = document.createElement("canvas");
    noise.width = noise.height = TILE;
    const nctx = noise.getContext("2d", { alpha: true });
    if (!nctx) return;
    const img = nctx.createImageData(TILE, TILE);

    let w = 0;
    let h = 0;
    let raf = 0;
    let running = true;
    let last = 0;
    let t = 0;

    const resize = () => {
      w = cv.width = Math.floor(window.innerWidth);
      h = cv.height = Math.floor(window.innerHeight);
    };
    resize();

    const regrain = () => {
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        // Monochrome speckle, mostly transparent. The alpha spread is what
        // makes it read as film rather than as static.
        const v = 190 + Math.random() * 65;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = Math.random() < 0.34 ? Math.random() * 42 : 0;
      }
      nctx.putImageData(img, 0, 0);
    };
    regrain();

    // Three blooms, each on its own slow orbit. These are the only colour
    // in the texture and they stay well under the content.
    const blooms = [
      { x: 0.22, y: 0.3, r: 0.42, sx: 0.00021, sy: 0.00017, p: 0 },
      { x: 0.78, y: 0.66, r: 0.5, sx: -0.00016, sy: 0.00023, p: 2.1 },
      { x: 0.5, y: 0.88, r: 0.36, sx: 0.00013, sy: -0.00019, p: 4.2 },
    ];

    const draw = (now: number) => {
      if (!running) return;
      t += 0.6;
      ctx.clearRect(0, 0, w, h);

      // --- ink blooms -----------------------------------------------------
      for (const b of blooms) {
        const cx = (b.x + Math.sin(t * b.sx * 60 + b.p) * 0.1) * w;
        const cy = (b.y + Math.cos(t * b.sy * 60 + b.p) * 0.1) * h;
        const rad = b.r * Math.max(w, h) * 0.5;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        g.addColorStop(0, "rgba(237,28,36,0.20)");
        g.addColorStop(0.45, "rgba(237,28,36,0.05)");
        g.addColorStop(1, "rgba(237,28,36,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }

      // --- grain ----------------------------------------------------------
      if (now - last > 80) {
        regrain();
        last = now;
      }
      const scale = 2.2;
      const step = TILE * scale;
      // Jitter the stamp origin so the tile seam never sits still.
      const ox = -((t * 0.7) % step);
      const oy = -((t * 0.45) % step);
      ctx.globalAlpha = 0.5;
      for (let y = oy; y < h; y += step) {
        for (let x = ox; x < w; x += step) {
          ctx.drawImage(noise, x, y, step, step);
        }
      }
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(draw);
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(draw);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const onVis = () => (document.visibilityState === "visible" ? start() : stop());

    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVis);
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), {
      threshold: 0,
    });
    io.observe(cv);

    return () => {
      stop();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
      io.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="rd-field" aria-hidden="true" />;
}
