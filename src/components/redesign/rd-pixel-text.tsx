import { useEffect, useRef, useState } from "react";

/** Headings rendered as block-character bitmaps.
 *
 * The same idea as the ASCII wordmark, turned into the site's display voice
 * rather than a one-off on the start-up screen. Text is drawn to an
 * offscreen canvas in a heavy condensed face, sampled on a character grid,
 * and re-emitted as block glyphs — so every heading is the type degraded
 * through the same process as the logo.
 *
 * This is also the answer to the font question. Swapping one grotesque for
 * another was never going to read as a change; making the display face a
 * bitmap of itself does.
 *
 * `scramble` runs a short resolve: random glyphs settling into the real
 * shape, cell by cell. Off under reduced motion, where it renders solved.
 *
 * Accessibility: the <pre> is aria-hidden and the real string is carried by
 * a visually-hidden element, so screen readers get "BAT COUNTRY" and not
 * four hundred block characters.
 */

const RAMP = "█▓▒░ ";
const NOISE = "█▓▒░#%@*+=-·";

export function RdPixelText({
  text,
  cols = 46,
  scramble = true,
  className,
  as: Tag = "div",
}: {
  text: string;
  /** Character columns. Higher = finer and more DOM text. */
  cols?: number;
  scramble?: boolean;
  className?: string;
  as?: "div" | "h1" | "h2";
}) {
  const [rows, setRows] = useState<string[]>([]);
  const target = useRef<string[]>([]);
  const raf = useRef(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // --- render the string, then read it back as coverage ---------------
    const probe = document.createElement("canvas");
    const ctx = probe.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const FS = 100;
    ctx.font = `${FS}px Anton, "Arial Narrow", Impact, sans-serif`;
    const wpx = Math.max(1, ctx.measureText(text).width);
    const ratio = FS / wpx;
    // Characters are about twice as tall as they are wide.
    const r = Math.max(3, Math.round(cols * ratio * 1.25 * 0.5));

    probe.width = cols;
    probe.height = r;
    ctx.font = `${FS}px Anton, "Arial Narrow", Impact, sans-serif`;
    ctx.fillStyle = "#fff";
    ctx.textBaseline = "middle";
    const scale = cols / wpx;
    ctx.setTransform(scale, 0, 0, (r / (FS * 1.0)) * 1.0, 0, 0);
    ctx.fillText(text, 0, FS * 0.5);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    let data: Uint8ClampedArray;
    try {
      data = ctx.getImageData(0, 0, cols, r).data;
    } catch {
      return;
    }

    const solved: string[] = [];
    for (let y = 0; y < r; y++) {
      let line = "";
      for (let x = 0; x < cols; x++) {
        const a = data[(y * cols + x) * 4 + 3] / 255;
        line += RAMP[Math.min(RAMP.length - 1, Math.floor((1 - a) * RAMP.length))];
      }
      solved.push(line);
    }
    target.current = solved;

    if (!scramble || reduced) {
      setRows(solved);
      return;
    }

    // --- resolve: noise settling into the shape, left to right ----------
    const total = solved.length * cols;
    let done = 0;
    const start = performance.now();
    const DUR = 620;

    const step = () => {
      const p = Math.min(1, (performance.now() - start) / DUR);
      done = Math.floor(p * total);
      const out = solved.map((line, y) =>
        line
          .split("")
          .map((ch, x) => {
            const idx = y * cols + x;
            if (idx < done) return ch;
            return ch === " " ? " " : NOISE[(Math.random() * NOISE.length) | 0];
          })
          .join(""),
      );
      setRows(out);
      if (p < 1) raf.current = requestAnimationFrame(step);
      else setRows(solved);
    };
    raf.current = requestAnimationFrame(step);

    return () => cancelAnimationFrame(raf.current);
  }, [text, cols, scramble]);

  return (
    <Tag className={`rd-pixtext ${className ?? ""}`}>
      <span className="rd-sr">{text}</span>
      <pre aria-hidden="true">{rows.join("\n")}</pre>
    </Tag>
  );
}
