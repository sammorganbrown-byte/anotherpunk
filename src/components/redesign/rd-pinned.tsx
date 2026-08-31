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

const GLITCH = "█▓▒░#%@*+=×";

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

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = LOGO_URL;
    img.onload = () => {
      const C = 76;
      const R = Math.max(4, Math.round((img.height / img.width) * C * 0.5));
      const cv = document.createElement("canvas");
      cv.width = C;
      cv.height = R;
      const g = cv.getContext("2d", { willReadFrequently: true });
      if (!g) return;
      g.drawImage(img, 0, 0, C, R);
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
          line += a > 0.5 ? "█" : a > 0.2 ? "▓" : " ";
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
          const hits = 6 + Math.floor(Math.random() * 10);
          for (let i = 0; i < hits; i++) {
            const y = (Math.random() * rows.length) | 0;
            const line = next[y].split("");
            const x = (Math.random() * line.length) | 0;
            if (line[x] !== " ") line[x] = GLITCH[(Math.random() * GLITCH.length) | 0];
            next[y] = line.join("");
          }
          return next;
        });
      }, 110);
    };
    return () => window.clearInterval(timer.current);
  }, []);

  return (
    <div className="rd-pin rd-pin-logo">
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
