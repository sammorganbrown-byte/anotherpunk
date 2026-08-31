import { useEffect, useRef } from "react";

/** Live halftone dot field on a canvas, sitting behind every redesign page.
 *
 * The reference for this is the print itself: a screen-printed graphic is a
 * grid of dots, so the site's ambient background is that grid, breathing.
 * It is content and effect at once rather than a texture laid over a hero.
 *
 * Performance is the constraint that shaped it — this has to be fine on a
 * mid-range phone:
 *   - dots are drawn on a coarse grid whose spacing GROWS on small screens,
 *     so a phone draws roughly a quarter of the cells a desktop does
 *   - the canvas is capped at 1x DPR (a retina-sharp dot field is invisible
 *     work — the dots are 2px blobs)
 *   - it pauses entirely when the tab is hidden or the canvas scrolls out
 *   - prefers-reduced-motion: the component never mounts (see the layout),
 *     and the CSS hides the element anyway as a belt-and-braces
 */
export function RdField() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf = 0;
    let running = true;
    let w = 0;
    let h = 0;
    let step = 26;

    const resize = () => {
      // 1x on purpose. These are 2px dots; DPR scaling buys nothing visible
      // and costs 4x the fill on a retina phone.
      w = cv.width = Math.floor(window.innerWidth);
      h = cv.height = Math.floor(window.innerHeight);
      step = window.innerWidth < 700 ? 34 : 24;
    };
    resize();

    let t = 0;
    const draw = () => {
      if (!running) return;
      t += 0.006;
      ctx.clearRect(0, 0, w, h);

      for (let y = 0; y < h + step; y += step) {
        for (let x = 0; x < w + step; x += step) {
          // Two crossed sine waves — a moiré that drifts without ever
          // resolving into a pattern you can name.
          const v =
            Math.sin(x * 0.010 + t * 1.6) * Math.cos(y * 0.013 - t * 1.1) +
            Math.sin((x + y) * 0.006 + t * 0.7);
          const r = (v + 2) * 0.9;
          if (r <= 0.15) continue;
          // The brightest dots go red; the rest stay bone. Keeps the palette
          // to two inks, like the shirts.
          ctx.fillStyle = r > 2.3 ? "rgba(237,28,36,0.5)" : "rgba(236,232,224,0.11)";
          ctx.beginPath();
          ctx.arc(x, y, Math.min(r, 2.4), 0, Math.PI * 2);
          ctx.fill();
        }
      }
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

    // Stop drawing entirely once it scrolls off screen.
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
