import { useEffect, useRef, useState } from "react";
import { RdAsciiMark } from "./rd-ascii-mark";
import { ANOTHER_PUNK_PRODUCTS } from "../../lib/another-punk-products";

/** A short start-up, not a manifesto.
 *
 * The earlier version spelled the brand's inventory position out as a list
 * of NONEs. That read as an argument about stock rather than a shop that is
 * open, so it's gone. What's left is the mark resolving out of its own ASCII
 * and four lines that say the storefront is ready — about five seconds,
 * skippable by any input, once per session, never on cart or checkout.
 */

// Counted from the catalogue, never typed by hand: it said 12 STYLES while
// the shop sold 14, because a hard-coded number does not notice when a
// product is added.
const LINES: [string, string][] = [
  ["STOREFRONT", "READY"],
  ["CATALOGUE", `${ANOTHER_PUNK_PRODUCTS.length} STYLES`],
  ["PRESS", "READY"],
  ["SHIPPING", "WORLDWIDE"],
];

const KEY = "ap-rd-booted";

/** About 2.6s end to end: four lines at STEP_MS apart, then TAIL_MS holding
 * the completed list before it clears. It ran at five seconds, which was long
 * enough to read as a wait rather than a start-up — the lines still land one
 * at a time, they just do not linger. Still skippable by any input. */
const STEP_MS = 560;
const TAIL_MS = 360;

export function RdBoot({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(0);
  const done = useRef(false);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    try {
      window.sessionStorage.setItem(KEY, "1");
    } catch {
      // Private mode. It simply runs again next time; nothing breaks.
    }
    onDone();
  };

  useEffect(() => {
    const skip = () => finish();
    window.addEventListener("pointerdown", skip);
    window.addEventListener("keydown", skip);
    window.addEventListener("wheel", skip, { passive: true });

    const id = window.setInterval(() => {
      setN((v) => {
        if (v >= LINES.length) {
          window.clearInterval(id);
          window.setTimeout(finish, TAIL_MS);
          return v;
        }
        return v + 1;
      });
    }, STEP_MS);

    return () => {
      window.clearInterval(id);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("wheel", skip);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rd-boot" role="status" aria-live="polite" aria-label="Another Punk">
      <RdAsciiMark className="rd-boot-mark" />

      <div className="mt-8 flex flex-col gap-[3px]">
        {LINES.slice(0, n).map(([k, v]) => (
          <span key={k} className="rd-bootline">
            {k}
            <span aria-hidden="true"> {".".repeat(Math.max(2, 22 - k.length))} </span>
            <span className="rd-ok">{v}</span>
          </span>
        ))}
        <span className="rd-bootline rd-caret" />
      </div>

      <button type="button" onClick={finish} className="rd-label mt-8 self-start underline underline-offset-4">
        Skip
      </button>
    </div>
  );
}

/** True when this session has already started up. */
export function hasBooted(): boolean {
  try {
    return window.sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}
