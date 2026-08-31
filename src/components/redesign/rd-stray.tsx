import { useEffect, useRef } from "react";

/** Red cells flicking on and off across the whole screen.
 *
 * The wordmark used to corrupt itself, and the scattered pixels around it
 * were a side effect of that. Now the mark is left alone and the noise is its
 * own layer, spread over the entire viewport instead of clustering on the
 * logo.
 *
 * Drawn on the same 8px grid the CRT overlay quantises to, so it reads as
 * noise in the signal rather than as confetti sitting on top of the page. The
 * canvas is one intrinsic pixel per cell and scaled up with
 * `image-rendering: pixelated`, which is also what keeps it cheap — the
 * bitmap is ~180x100 whatever the screen size.
 *
 * Driven by setInterval rather than requestAnimationFrame on purpose. rAF is
 * suspended in a hidden tab, which has produced a run of phantom bugs in this
 * build where an effect simply was not running when someone came back to it.
 * This is a slow flicker, not an animation that needs frame timing.
 */

/** Matches the CRT overlay's quantisation. */
const CELL = 8;
/** Roughly one lit cell per 450, so it stays sparse at any screen size. */
const DENSITY = 1 / 450;
const TICK_MS = 110;

export function RdStrayPixels() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cv = ref.current;
    if (!cv) return;
    const g = cv.getContext("2d");
    if (!g) return;

    const red =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--rd-red")
        .trim() || "#ed1c24";

    let cols = 0;
    let rows = 0;
    const size = () => {
      cols = Math.max(1, Math.ceil(window.innerWidth / CELL));
      rows = Math.max(1, Math.ceil(window.innerHeight / CELL));
      cv.width = cols;
      cv.height = rows;
    };
    size();

    const paint = () => {
      g.clearRect(0, 0, cols, rows);
      const n = Math.round(cols * rows * DENSITY);
      for (let i = 0; i < n; i++) {
        const x = (Math.random() * cols) | 0;
        const y = (Math.random() * rows) | 0;
        // Varying alpha so the field has depth rather than reading as one
        // flat scatter of identical dots.
        g.globalAlpha = 0.3 + Math.random() * 0.7;
        g.fillStyle = red;
        // Occasionally a two-cell run, which looks like a dropped sample
        // rather than a speck of dust.
        g.fillRect(x, y, Math.random() < 0.18 ? 2 : 1, 1);
      }
      g.globalAlpha = 1;
    };

    paint();
    const timer = window.setInterval(paint, TICK_MS);
    const onResize = () => {
      size();
      paint();
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={ref} className="rd-stray" aria-hidden="true" />;
}
