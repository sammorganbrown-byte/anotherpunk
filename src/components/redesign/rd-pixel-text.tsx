import { useEffect, useRef, useState } from "react";

/** Headings rendered as block-character bitmaps.
 *
 * The first version was unreadable, and the reason was resolution, not
 * taste: at 44 columns a word like BAT COUNTRY got about four columns per
 * letter, which is well below what a letterform needs to survive. Two
 * changes fix it:
 *
 *   1. Columns are derived from the string — ~9 per character — so the grid
 *      grows with the text instead of squeezing it. A short word gets a
 *      small grid, a long one a wide grid, and both stay legible.
 *   2. The ramp is gone. Anti-aliased mid-tones smeared the edges into
 *      mush; coverage is now thresholded to solid block or space, with a
 *      single lighter glyph for the in-between. Crisp beats subtle here.
 *
 * `scramble` resolves the text out of noise on mount. Off under reduced
 * motion. The real string is carried for screen readers; the block art is
 * aria-hidden.
 */

const NOISE = "█▓▒░#%@*+=";

/** Break long headings over several lines.
 *
 * A block-type heading's height is fixed by geometry, not by the grid it is
 * sampled on: the cells are half as wide as they are tall, so the rendered
 * height always works out to the text's own aspect ratio times the column
 * width, whatever the column count. Which means a 25-character title in a
 * 520px column is 29px tall and unreadable — and no amount of resampling
 * changes that. The only lever is the length of the longest LINE. So wrap.
 *
 * All the lines share one bitmap and therefore one scale, rather than each
 * being fitted separately and coming out a different size.
 */
const MAX_LINE = 15;

function wrapText(text: string, max: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [text];
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (!cur) cur = w;
    else if (cur.length + 1 + w.length <= max) cur += " " + w;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

export function RdPixelText({
  text,
  cols,
  scramble = true,
  className,
  as: Tag = "div",
}: {
  text: string;
  /** Override the derived column count. Rarely needed. */
  cols?: number;
  scramble?: boolean;
  className?: string;
  as?: "div" | "h1" | "h2";
}) {
  const [rows, setRows] = useState<string[]>([]);
  const raf = useRef(0);
  const hostRef = useRef<HTMLElement | null>(null);
  const preRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lines = wrapText(text, MAX_LINE);
    // ~14 columns per character of the LONGEST line. Below about 10 the
    // counters inside letters close up and the whole thing turns into a bar
    // code.
    const longest = lines.reduce((a, l) => Math.max(a, l.length), 1);
    const C = cols ?? Math.min(260, Math.max(56, Math.round(longest * 14)));

    const cv = document.createElement("canvas");
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    // Measure at a workable size, then scale the bitmap to exactly C wide.
    const FS = 120;
    const font = `${FS}px Anton, "Arial Narrow", Impact, "Haettenschweiler", sans-serif`;
    ctx.font = font;
    const metrics = lines.map((l) => ctx.measureText(l));
    const wpx = Math.max(1, ...metrics.map((m) => m.width));
    // Cap height from the metrics where available, so descenders and the
    // cap line do not leave a band of empty rows top and bottom.
    const asc = metrics[0].actualBoundingBoxAscent || FS * 0.72;
    const desc =
      metrics[metrics.length - 1].actualBoundingBoxDescent || FS * 0.05;
    const leading = FS * 0.92;
    const hpx = Math.max(1, asc + desc + (lines.length - 1) * leading);

    // A mono cell is about twice as tall as it is wide, so the row count is
    // half what a square-pixel grid would need to keep the proportions.
    const R = Math.max(6, Math.round((hpx / wpx) * C * 0.5));

    cv.width = C;
    cv.height = R;
    const g = cv.getContext("2d", { willReadFrequently: true });
    if (!g) return;
    g.clearRect(0, 0, C, R);
    g.font = font;
    g.fillStyle = "#fff";
    g.textBaseline = "alphabetic";
    g.setTransform(C / wpx, 0, 0, R / hpx, 0, 0);
    lines.forEach((l, i) => g.fillText(l, 0, asc + i * leading));
    g.setTransform(1, 0, 0, 1, 0, 0);

    let data: Uint8ClampedArray;
    try {
      data = g.getImageData(0, 0, C, R).data;
    } catch {
      return;
    }

    const solved: string[] = [];
    for (let y = 0; y < R; y++) {
      let line = "";
      for (let x = 0; x < C; x++) {
        const a = data[(y * C + x) * 4 + 3] / 255;
        // Thresholded, not ramped. Mid-tones were what made it mush.
        line += a > 0.55 ? "█" : a > 0.22 ? "▓" : " ";
      }
      solved.push(line);
    }

    // Trim columns that are blank all the way down. fillText leaves side
    // bearing at both ends, and every one of those empty cells is real width
    // under `white-space: pre` — so the grid was wider than the letters and
    // the fit below sized the type to the padding rather than to the word.
    // That is what pushed the last characters past the right edge.
    let c0 = 0;
    let c1 = C - 1;
    const blankCol = (x: number) => solved.every((l) => l[x] === " ");
    while (c0 < c1 && blankCol(c0)) c0++;
    while (c1 > c0 && blankCol(c1)) c1--;
    if (c0 > 0 || c1 < C - 1) {
      for (let y = 0; y < solved.length; y++) solved[y] = solved[y].slice(c0, c1 + 1);
    }

    // Paint the finished text FIRST, always. The scramble is a flourish on
    // top of a correct heading, never the thing that produces it — if the
    // first animation frame is delayed (background tab, slow boot) the
    // heading must still be there and readable.
    setRows(solved);
    if (!scramble || reduced) return;

    // Width AFTER the trim above, not the grid it was sampled on.
    const W = solved[0]?.length || C;
    const total = solved.length * W;
    const start = performance.now();
    const DUR = 560;
    const step = () => {
      const p = Math.min(1, (performance.now() - start) / DUR);
      const done = Math.floor(p * total);
      setRows(
        solved.map((line, y) =>
          line
            .split("")
            .map((ch, x) =>
              y * W + x < done || ch === " "
                ? ch
                : NOISE[(Math.random() * NOISE.length) | 0],
            )
            .join(""),
        ),
      );
      if (p < 1) raf.current = requestAnimationFrame(step);
      else setRows(solved);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [text, cols, scramble]);

  // Scale the block type to its container instead of letting it overflow.
  // A fixed font-size meant a long title ran past the column and got clipped
  // ("THE JI"), because the grid is not allowed to grow to fit it. Monospace
  // makes this exact: width = columns x advance, so the size that fits is
  // simple arithmetic, redone whenever the column resizes.
  useEffect(() => {
    const host = hostRef.current;
    const pre = preRef.current;
    if (!host || !pre || rows.length === 0) return;

    const fit = () => {
      const avail = host.clientWidth;
      if (!avail) return;
      const chars = rows[0]?.length || 1;
      // Measure this font's real advance once, at a known size.
      pre.style.fontSize = "100px";
      const advance = pre.scrollWidth / chars / 100;
      const size = Math.max(1.4, (avail / chars / advance) * 0.985);
      pre.style.fontSize = `${size}px`;
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(host);
    // The advance is measured from the rendered <pre>, so a fit that runs
    // before the mono webfont arrives is measured against the fallback and
    // the real face then comes in wider — the heading overflows to the right
    // and gets clipped. Re-fit once the fonts are actually in.
    let live = true;
    document.fonts?.ready.then(() => {
      if (live) fit();
    });
    return () => {
      live = false;
      ro.disconnect();
    };
  }, [rows]);

  return (
    <Tag className={`rd-pixtext ${className ?? ""}`} ref={hostRef as never}>
      <span className="rd-sr">{text}</span>
      <pre ref={preRef} aria-hidden="true">
        {rows.join("\n")}
      </pre>
    </Tag>
  );
}
