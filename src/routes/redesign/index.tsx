import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ANOTHER_PUNK_PRODUCTS } from "../../lib/another-punk-products";
import { useCurrency } from "../../lib/currency-context";
import { RdBoot, hasBooted } from "../../components/redesign/rd-boot";
import { useReducedMotion } from "./route";

export const Route = createFileRoute("/redesign/")({ component: RedesignHome });

/** The homepage is a job log, not a homepage.
 *
 * MSCHF's nerve: no hero, no image-then-grid template. The page opens as a
 * numbered terminal dump and just keeps scrolling — system lines, the origin
 * story, and the catalogue all rendered as entries in the same log, in the
 * same monospace, at the same weight. The products are not featured; they
 * are queued.
 *
 * The only imagery on the page appears on hover, following the cursor —
 * browsing as reveal rather than as a wall of tiles.
 */

type Entry =
  | { kind: "sys"; k: string; v: string }
  | { kind: "say"; text: string }
  | { kind: "big"; text: string }
  | { kind: "job"; slug: string; title: string; price: number; image: string; meta: string };

function useEntries(): Entry[] {
  const products = ANOTHER_PUNK_PRODUCTS;
  return [
    { kind: "sys", k: "SESSION", v: "OPEN" },
    { kind: "sys", k: "STOCK", v: "NONE" },
    { kind: "sys", k: "SEASON", v: "NONE" },
    { kind: "sys", k: "REPEAT", v: "NONE" },
    { kind: "big", text: "Nothing here exists yet." },
    { kind: "say", text: "Every shirt is printed after you buy it. Before that, it is a file." },
    { kind: "sys", k: "ORIGIN", v: "TWO INPUTS" },
    {
      kind: "say",
      text: "A Vivienne Westwood exhibition. Then Repo Man. They didn't go together. That was the point.",
    },
    { kind: "say", text: "Paint straight onto a shirt. No plan." },
    { kind: "big", text: "Not a mood board. A compulsion." },
    { kind: "sys", k: "CATALOGUE", v: `${products.length} JOBS` },
    ...products.map(
      (p): Entry => ({
        kind: "job",
        slug: p.slug,
        title: p.title,
        price: p.price,
        image: p.images[0],
        meta: p.eyebrow,
      }),
    ),
    { kind: "sys", k: "PRESS", v: "COLD" },
    { kind: "sys", k: "AWAITING", v: "JOB" },
  ];
}

function Peek({ src, on, x, y }: { src: string | null; on: boolean; x: number; y: number }) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      className="rd-peek"
      data-on={on}
      style={{ left: x, top: y }}
    />
  );
}

function RedesignHome() {
  const { formatPrice } = useCurrency();
  const reduced = useReducedMotion();
  const entries = useEntries();

  const [booting, setBooting] = useState(false);
  const [peek, setPeek] = useState<{ src: string | null; x: number; y: number }>({
    src: null,
    x: 0,
    y: 0,
  });

  useEffect(() => {
    // Boot once per session, and never for reduced-motion visitors.
    if (!reduced && !hasBooted()) setBooting(true);
  }, [reduced]);

  let n = 0;

  return (
    <>
      {booting ? <RdBoot onDone={() => setBooting(false)} /> : null}

      {reduced ? null : <Peek src={peek.src} on={Boolean(peek.src)} x={peek.x} y={peek.y} />}

      <div className="rd-marq" aria-hidden="true">
        <span>
          {"NO STOCK · NO SEASON · NO REPEAT · DRAWN BY HAND · PRINTED TO ORDER · ".repeat(4)}
        </span>
      </div>

      <ol className="mx-auto max-w-[1100px] py-2" aria-label="Another Punk job log">
        {entries.map((e, i) => {
          if (e.kind === "sys") {
            n += 1;
            return (
              <li key={i} className="rd-row" style={{ cursor: "default" }}>
                <span className="rd-row-idx">{String(n).padStart(2, "0")}</span>
                <span className="rd-log">
                  {e.k}
                  <span aria-hidden="true" className="text-[var(--rd-dimmer)]">
                    {" "}
                    {".".repeat(Math.max(2, 28 - e.k.length))}{" "}
                  </span>
                  <span className={e.v === "NONE" ? "rd-key" : "rd-ok"}>{e.v}</span>
                </span>
                <span />
              </li>
            );
          }
          if (e.kind === "say") {
            n += 1;
            return (
              <li key={i} className="rd-row" style={{ cursor: "default" }}>
                <span className="rd-row-idx">{String(n).padStart(2, "0")}</span>
                <p className="max-w-[62ch] text-[var(--rd-paper)]">{e.text}</p>
                <span />
              </li>
            );
          }
          if (e.kind === "big") {
            n += 1;
            return (
              <li key={i} className="border-b border-[var(--rd-rule)] px-3 py-10 sm:py-16">
                <p className="rd-huge">
                  {e.text.split(" ").map((w, j) => (
                    <span key={j} className={j % 3 === 2 ? "text-[var(--rd-red)]" : undefined}>
                      {w}{" "}
                    </span>
                  ))}
                </p>
              </li>
            );
          }
          n += 1;
          return (
            <li key={i}>
              <Link
                to="/redesign/product/$slug"
                params={{ slug: e.slug }}
                className="rd-row"
                onMouseMove={(ev) =>
                  reduced ? null : setPeek({ src: e.image, x: ev.clientX, y: ev.clientY })
                }
                onMouseLeave={() => setPeek((p) => ({ ...p, src: null }))}
              >
                <span className="rd-row-idx">{String(n).padStart(2, "0")}</span>
                <span>
                  <span className="rd-row-name">{e.title}</span>
                  <span className="rd-log ml-3 hidden sm:inline">{e.meta}</span>
                </span>
                <span className="rd-row-meta">
                  {formatPrice(e.price)} <span className="rd-key">READY</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      <div className="px-3 py-14 text-center">
        <Link to="/redesign/shop" className="rd-btn" data-primary="true">
          Open the field →
        </Link>
      </div>
    </>
  );
}
