import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { LOGO_URL } from "../../routes/redesign/route";

/** The two things in the field that do NOT drift away: the mark, and the way
 * into the shop.
 *
 * Everything else in the field moves and can be panned off screen. These sit
 * pinned to the viewport, so wherever you have wandered to, the brand is
 * still in the middle and the shop is still one tap away. They are styled as
 * pieces — boxed, same borders, same chrome — so they read as part of the
 * field rather than as an overlay bolted on top.
 */

// Solid block or nothing. Half-tone glyphs (▓▒░) put a grey texture inside
// the letters; the mark should be one flat colour, pixelated only by the
// grid it is drawn on.
const GLITCH_ON = "█";

/** The wordmark sampled to block characters, re-corrupting itself forever.
 *
 * The logo image is read once into a character grid; from then on a handful
 * of cells are randomly replaced each tick and restored on the next, so it
 * sits there permanently misprinting. That is the brand's own idea — a
 * print that drifts out of register — as a loop rather than a still. */
export function RdLogoCard() {
  const [base, setBase] = useState<string[] | null>(null);
  const [frame, setFrame] = useState<string[] | null>(null);
  const timer = useRef(0);
  const box = useRef<HTMLDivElement | null>(null);

  // Drift, like everything else in the field — but anchored. The mark is one
  // of the floating objects rather than a label pasted over them, and it is
  // also the thing you navigate back to, so it never wanders off centre.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let alive = true;
    let t = Math.random() * 10;
    const loop = () => {
      if (!alive) return;
      t += 0.006;
      const el = box.current;
      if (el) {
        const x = Math.sin(t) * 16;
        const y = Math.cos(t * 0.78) * 11;
        const r = Math.sin(t * 0.5) * 0.5;
        el.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0) rotate(${r}deg)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = LOGO_URL;
    img.onload = () => {
      // The source PNG carries transparent padding — noticeably more on the
      // right — so sampling the whole file put the mark off-centre inside its
      // own grid. Find the actual ink first and sample only that box, which
      // makes the centring independent of however the file was exported.
      const probe = document.createElement("canvas");
      const PW = Math.min(600, img.width);
      const PH = Math.max(1, Math.round((img.height / img.width) * PW));
      probe.width = PW;
      probe.height = PH;
      const pg = probe.getContext("2d", { willReadFrequently: true });
      if (!pg) return;
      pg.drawImage(img, 0, 0, PW, PH);

      let x0 = PW;
      let y0 = PH;
      let x1 = -1;
      let y1 = -1;
      try {
        const pd = pg.getImageData(0, 0, PW, PH).data;
        for (let y = 0; y < PH; y++) {
          for (let x = 0; x < PW; x++) {
            if (pd[(y * PW + x) * 4 + 3] > 24) {
              if (x < x0) x0 = x;
              if (x > x1) x1 = x;
              if (y < y0) y0 = y;
              if (y > y1) y1 = y;
            }
          }
        }
      } catch {
        return;
      }
      if (x1 < x0 || y1 < y0) {
        x0 = 0;
        y0 = 0;
        x1 = PW - 1;
        y1 = PH - 1;
      }
      const bw = x1 - x0 + 1;
      const bh = y1 - y0 + 1;

      // Higher resolution than before. At 76 columns the mark was a coarse
      // approximation; this is fine enough that the painted brush edges and
      // the drips read, while still obviously built from cells.
      const C = 168;
      const R = Math.max(4, Math.round((bh / bw) * C * 0.5));
      const cv = document.createElement("canvas");
      cv.width = C;
      cv.height = R;
      const g = cv.getContext("2d", { willReadFrequently: true });
      if (!g) return;
      // Draw ONLY the inked region, scaled to fill the grid exactly.
      g.drawImage(probe, x0, y0, bw, bh, 0, 0, C, R);
      let data: Uint8ClampedArray;
      try {
        data = g.getImageData(0, 0, C, R).data;
      } catch {
        return;
      }
      const rows: string[] = [];
      for (let y = 0; y < R; y++) {
        let line = "";
        for (let x = 0; x < C; x++) {
          const a = data[(y * C + x) * 4 + 3] / 255;
          // Binary threshold — solid or empty, never a shade between.
          line += a > 0.45 ? "█" : " ";
        }
        rows.push(line);
      }
      setBase(rows);
      setFrame(rows);

      if (reduced) return;
      // Corrupt a few cells, then put them back. Never settles.
      timer.current = window.setInterval(() => {
        setFrame(() => {
          const next = rows.slice();
          // The glitch drops cells out of the mark and fills cells just
          // outside it — misregistration, not a change of texture. Every
          // cell is still either solid or empty.
          const hits = 26 + Math.floor(Math.random() * 34);
          for (let i = 0; i < hits; i++) {
            const y = (Math.random() * rows.length) | 0;
            const line = next[y].split("");
            const x = (Math.random() * line.length) | 0;
            line[x] = line[x] === " " ? (Math.random() < 0.35 ? GLITCH_ON : " ") : " ";
            next[y] = line.join("");
          }
          return next;
        });
      }, 110);
    };
    return () => window.clearInterval(timer.current);
  }, []);

  // Size the cells to the box rather than guessing in CSS — the column count
  // can change and the mark must always fill its width exactly.
  useEffect(() => {
    const host = box.current;
    const pre = host?.querySelector("pre") as HTMLPreElement | null;
    if (!host || !pre || !frame) return;
    const fit = () => {
      const avail = host.clientWidth;
      const chars = frame[0]?.length || 1;
      if (!avail || !chars) return;
      pre.style.fontSize = "100px";
      const advance = pre.scrollWidth / chars / 100;
      pre.style.fontSize = `${Math.max(0.8, (avail / chars / advance) * 0.99)}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(host);
    return () => ro.disconnect();
    // Only refit when the grid's dimensions change, not on every glitch tick.
  }, [frame?.[0]?.length, frame?.length]);

  return (
    <div className="rd-pin rd-pin-logo" ref={box}>
      <div className="rd-pin-box">
        {frame ? (
          <pre aria-hidden="true">{frame.join("\n")}</pre>
        ) : (
          <img src={LOGO_URL} alt="" aria-hidden="true" className="w-full" />
        )}
        <span className="rd-sr">Another Punk</span>
      </div>
    </div>
  );
}

/** The way into the plain grid, pinned so it never drifts off. */
export function RdShopCard() {
  return (
    <div className="rd-pin rd-pin-shop">
      <Link to="/redesign/shop" className="rd-pin-box rd-pin-link">
        <span className="rd-pin-kicker">All 12 styles</span>
        <span className="rd-pin-title">SHOP →</span>
      </Link>
    </div>
  );
}
