import { useEffect, useRef, useState } from "react";
import { LOGO_URL } from "../../routes/redesign/route";

/** The wordmark, rendered as ASCII from its own pixels — then resolving
 * into the real thing.
 *
 * Not decorative ASCII typed out by hand next to a logo: the logo image is
 * loaded, sampled on a character grid, and each cell replaced by a glyph
 * chosen for its ink coverage. So the ASCII *is* the mark, degraded — and
 * the reveal is the same artwork resolving from low fidelity to high, which
 * is a print idea rather than a computer one.
 *
 * The CDN sends access-control-allow-origin: *, so the canvas stays clean
 * and the pixels are readable. If that ever changes, getImageData throws,
 * and the component quietly renders the real logo alone — the reveal is
 * lost, nothing else is.
 */

// Dense → sparse. Chosen for ink coverage, not for looking like a face.
const RAMP = "█▓▒░·  ";

export function RdAsciiMark({
  cols = 68,
  resolve = true,
  className,
}: {
  /** Character columns. More = finer, and more DOM text. */
  cols?: number;
  /** Cross-fade to the real logo once drawn. Off = permanent ASCII. */
  resolve?: boolean;
  className?: string;
}) {
  const [art, setArt] = useState<string | null>(null);
  const [shown, setShown] = useState(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = LOGO_URL;

    img.onload = () => {
      if (!alive.current) return;
      try {
        // Characters are roughly twice as tall as wide, so the sample grid
        // is squashed vertically to keep the mark's proportions.
        const rows = Math.max(4, Math.round((img.height / img.width) * cols * 0.5));
        const cv = document.createElement("canvas");
        cv.width = cols;
        cv.height = rows;
        const ctx = cv.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, cols, rows);
        const { data } = ctx.getImageData(0, 0, cols, rows);

        let out = "";
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const i = (y * cols + x) * 4;
            const a = data[i + 3] / 255;
            // The mark is red on transparent: coverage is alpha, weighted
            // by how far the pixel is from the background.
            const lum = (data[i] * 0.4 + data[i + 1] * 0.3 + data[i + 2] * 0.3) / 255;
            const ink = a * (1 - lum * 0.35);
            out += RAMP[Math.min(RAMP.length - 1, Math.floor((1 - ink) * RAMP.length))];
          }
          out += "\n";
        }
        setArt(out);
        if (resolve) window.setTimeout(() => alive.current && setShown(true), 900);
      } catch {
        // Tainted canvas — fall straight through to the real logo.
        setShown(true);
      }
    };
    img.onerror = () => alive.current && setShown(true);

    return () => {
      alive.current = false;
    };
  }, [cols, resolve]);

  return (
    <div className={`rd-asciimark ${className ?? ""}`}>
      {art && !shown ? (
        <pre className="rd-ascii" aria-hidden="true">
          {art}
        </pre>
      ) : null}
      <img
        src={LOGO_URL}
        alt="Another Punk"
        className="rd-asciimark-real"
        data-on={shown || !art}
      />
    </div>
  );
}
