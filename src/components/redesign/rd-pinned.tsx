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

/** The wordmark, drawn as rectangles on a canvas.
 *
 * This was built out of block characters (█) in a <pre> for a long time, and
 * it was never going to be solid: that glyph fills neither its line box nor
 * its advance width, so the mark came out ruled with hairlines in both
 * directions, and how bad it looked depended on whichever mono font the
 * browser had. Every fix was a metric hack — negative letter-spacing, a
 * squeezed line-height, a same-colour text-shadow smearing each cell — and
 * the vertical seams survived all of it.
 *
 * So: no font. The logo is sampled to a grid once, then painted as filled
 * rectangles at exactly one canvas pixel per cell and scaled up with
 * `image-rendering: pixelated`. Adjacent cells share an edge by definition,
 * so the ink is solid, and the blocks stay hard-edged at any size.
 */

/** Columns across the mark. High enough that the painted brush edges and the
 * drips read; low enough that it is still obviously built from cells. */
const LOGO_COLS = 260;

export function RdLogoCard() {
  const box = useRef<HTMLDivElement | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const [ready, setReady] = useState(false);

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
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = LOGO_URL;
    img.onload = () => {
      // The source PNG carries transparent padding — noticeably more on the
      // right — so sampling the whole file put the mark off-centre inside its
      // own grid. Find the actual ink first and sample only that box, which
      // makes the centring independent of however the file was exported.
      const probe = document.createElement("canvas");
      const PW = Math.min(900, img.width);
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

      // Canvas pixels are square, so the row count follows the ink box's own
      // aspect directly. (The old half-height factor existed only to undo a
      // mono cell being twice as tall as it is wide.)
      const C = LOGO_COLS;
      const R = Math.max(4, Math.round((bh / bw) * C));

      // Sample at grid resolution, thresholded — solid or empty, never a
      // shade between.
      const samp = document.createElement("canvas");
      samp.width = C;
      samp.height = R;
      const sg = samp.getContext("2d", { willReadFrequently: true });
      if (!sg) return;
      sg.drawImage(probe, x0, y0, bw, bh, 0, 0, C, R);
      let data: Uint8ClampedArray;
      try {
        data = sg.getImageData(0, 0, C, R).data;
      } catch {
        return;
      }

      // Which cells actually get ink. Do this BEFORE sizing the canvas: the
      // bounding box above is found at alpha > 24/255, but a cell is only
      // filled at alpha > 0.45, and the painted logo's drips fade out well
      // below that. So the box ran past the last painted row and left a band
      // of empty cells under the mark — which, with the whole thing centred
      // on its box, read as more padding below the logo than above it.
      // Crop to the cells that are really drawn.
      const on: boolean[] = new Array(C * R);
      let ix0 = C;
      let iy0 = R;
      let ix1 = -1;
      let iy1 = -1;
      for (let y = 0; y < R; y++) {
        for (let x = 0; x < C; x++) {
          const lit = data[(y * C + x) * 4 + 3] / 255 > 0.45;
          on[y * C + x] = lit;
          if (lit) {
            if (x < ix0) ix0 = x;
            if (x > ix1) ix1 = x;
            if (y < iy0) iy0 = y;
            if (y > iy1) iy1 = y;
          }
        }
      }
      if (ix1 < ix0 || iy1 < iy0) return;
      const CW = ix1 - ix0 + 1;
      const CH = iy1 - iy0 + 1;

      const out = canvas.current;
      if (!out) return;
      out.width = CW;
      out.height = CH;
      const g = out.getContext("2d");
      if (!g) return;
      g.clearRect(0, 0, CW, CH);
      // Read the brand red off the cascade so there is one source for it.
      g.fillStyle =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--rd-red")
          .trim() || "#ed1c24";
      for (let y = iy0; y <= iy1; y++) {
        for (let x = ix0; x <= ix1; x++) {
          if (on[y * C + x]) g.fillRect(x - ix0, y - iy0, 1, 1);
        }
      }
      setReady(true);
    };
  }, []);

  return (
    <div className="rd-pin rd-pin-logo" ref={box}>
      <div className="rd-pin-box">
        <canvas ref={canvas} className="rd-logo-canvas" aria-hidden="true" />
        {ready ? null : (
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
