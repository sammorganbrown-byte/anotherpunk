import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ANOTHER_PUNK_PRODUCTS } from "../../lib/another-punk-products";
import { useCurrency } from "../../lib/currency-context";
import { useReducedMotion } from "./route";

export const Route = createFileRoute("/redesign/shop")({ component: RedesignIndexView });

/** The index: the whole range as a fast, scannable list.
 *
 * The field is for browsing; this is for finding. Names, prices, sizes —
 * nothing else. Imagery appears only under the cursor, so the page stays a
 * list rather than becoming a second grid.
 */
function RedesignIndexView() {
  const { formatPrice } = useCurrency();
  const reduced = useReducedMotion();
  const [peek, setPeek] = useState<{ src: string | null; x: number; y: number }>({
    src: null,
    x: 0,
    y: 0,
  });

  return (
    <>
      {!reduced && peek.src ? (
        <img
          src={peek.src}
          alt=""
          aria-hidden="true"
          className="rd-peek"
          data-on="true"
          style={{ left: peek.x, top: peek.y }}
        />
      ) : null}

      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--rd-rule)] px-4 py-3">
        <h1 className="rd-label">Index</h1>
        <p className="rd-log">{ANOTHER_PUNK_PRODUCTS.length} styles</p>
      </div>

      <ol className="mx-auto max-w-[1100px]">
        {ANOTHER_PUNK_PRODUCTS.map((p, i) => (
          <li key={p.slug}>
            <Link
              to="/redesign/product/$slug"
              params={{ slug: p.slug }}
              className="rd-row"
              onMouseMove={(ev) =>
                reduced ? null : setPeek({ src: p.images[0], x: ev.clientX, y: ev.clientY })
              }
              onMouseLeave={() => setPeek((v) => ({ ...v, src: null }))}
            >
              <span className="rd-row-idx">{String(i + 1).padStart(2, "0")}</span>
              <span>
                <span className="rd-row-name">{p.title}</span>
                <span className="rd-log ml-3 hidden sm:inline">{p.sizes.join(" · ")}</span>
              </span>
              <span className="rd-row-meta">{formatPrice(p.price)}</span>
            </Link>
          </li>
        ))}
      </ol>
    </>
  );
}
