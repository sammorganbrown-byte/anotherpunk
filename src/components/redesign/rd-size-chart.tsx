import { useState } from "react";
import type { AnotherPunkProduct } from "../../lib/another-punk-products";
import { DEFAULT_FIT } from "../../lib/another-punk-products";
import { SIZE_COLUMNS, getSizeChart, toInches } from "../../lib/size-charts";

/** Sizing, on the product page, beside the thing it decides.
 *
 * ── WHY IT SITS HERE AND NOT ON A POLICY PAGE ─────────────────────────────
 * /terms told people "sizes follow the chart on each product page" while no
 * product page had one — a promise the site did not keep, on the page whose
 * whole job is to be accurate. Sizing is also the single largest cause of
 * returns in clothing, and a return here costs the postage plus a garment
 * that was printed to order and cannot go back on a shelf. The cheapest
 * return is the one that never happens because somebody could check.
 *
 * ── IT DEGRADES, IT DOES NOT INVENT ───────────────────────────────────────
 * The fit note always shows. The table shows only when real measurements
 * exist for that blank in size-charts.ts. A blank with no data renders no
 * table at all rather than a placeholder or an estimate — see the reasoning
 * at the top of that file. Today that is every product, so this currently
 * renders as the fit note alone, which is still more than the page said
 * before.
 *
 * Collapsed by default: most people know their size and the table is
 * reference material, not something to read past on the way to buying.
 */
export function RdSizeChart({ product }: { product: AnotherPunkProduct }) {
  const [open, setOpen] = useState(false);
  const chart = getSizeChart(product.shopifyProductId);
  const fit = product.fit ?? DEFAULT_FIT;

  /* Only the columns this chart actually has. A blank that quotes chest and
     length should not render two empty columns because some other blank
     quotes sleeves. */
  const columns = chart
    ? SIZE_COLUMNS.filter(({ key }) => chart.rows.some((r) => r[key] != null))
    : [];

  /* The table describes the blank, which may be sold in sizes this product
     does not carry — the jersey stops at 2XL. Show only what can be bought. */
  const rows = chart ? chart.rows.filter((r) => product.sizes.includes(r.size)) : [];

  return (
    <div className="rd-sizing flex flex-col gap-3">
      <p className="rd-log max-w-[56ch]">{fit}</p>

      {rows.length && columns.length ? (
        <>
          <button
            type="button"
            className="rd-link self-start underline underline-offset-4"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Hide measurements" : "Measurements"}
          </button>

          {open ? (
            <div className="overflow-x-auto">
              <table className="rd-size-table">
                <caption className="rd-label text-left">
                  {chart?.note ?? "Measured flat, in centimetres."}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Size</th>
                    {columns.map((c) => (
                      <th scope="col" key={c.key}>
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.size}>
                      <th scope="row">{r.size}</th>
                      {columns.map((c) => {
                        const cm = r[c.key];
                        return (
                          <td key={c.key}>
                            {cm == null ? "—" : `${cm} cm / ${toInches(cm)}"`}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="rd-log mt-3 max-w-[56ch]">
                Measure a garment you already own flat on a table and compare — it is more
                reliable than a letter on a label. Unsure between two? Ask before you order.
              </p>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
