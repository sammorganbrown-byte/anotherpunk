import { createFileRoute } from "@tanstack/react-router";
import {
  ANOTHER_PUNK_PRODUCTS,
  isFulfillable,
  DEFAULT_DESCRIPTION,
} from "../../lib/another-punk-products";
import { SITE, absoluteUrl } from "../../lib/seo";

/** Product feed for Meta Commerce Manager, which is what makes Instagram
 * product tags possible.
 *
 * ── WHY THIS AND NOT THE SHOPIFY SALES CHANNEL ────────────────────────────
 * The obvious route is Shopify's Meta channel, which syncs a catalogue in a
 * few clicks. It is the wrong answer here, and expensively so.
 *
 * The Shopify store is NOT a shopfront. It is the bridge Tapstitch watches,
 * so its products are named for the blank ("Snow Washed Oversized Cotton
 * T-Shirt"), not for the thing being sold ("Another Punk"), and its links
 * point at a Shopify storefront nobody is meant to see. Syncing it would tag
 * photographs with the wrong names at the wrong prices pointing at the wrong
 * place, and it would look deliberate.
 *
 * This feed comes from the same catalogue the site renders, so a tag can
 * never disagree with the page it links to. One source, as with the shop
 * grid, the size charts and the link previews.
 *
 * ── HOW TO USE IT ─────────────────────────────────────────────────────────
 * Commerce Manager → Catalogue → Data sources → Scheduled feed, and give it
 * https://www.anotherpunk.com/api/meta-feed with a daily fetch. Meta reads
 * it on its own from then on; adding a product here puts it on Instagram
 * without anyone opening Commerce Manager.
 *
 * Fields are Meta's required set for a commerce catalogue: id, title,
 * description, availability, condition, price, link, image_link, brand.
 *
 * ── ONE ROW PER SIZE, AND THAT IS NOT OPTIONAL ────────────────────────────
 * This shipped as one row per product with no size, on the reasoning that a
 * tag should land on the page carrying the size chart and the delivery terms
 * rather than on a size selector Meta owns. That reasoning was fine and the
 * decision was still wrong, because it is not ours to make: Meta requires a
 * size on anything in the Clothing category and simply DOES NOT SHOW products
 * that lack one. Every product was silently excluded from the shop, so there
 * was nothing to tag and no error saying why.
 *
 * So: one row per purchasable size, grouped with `item_group_id` so Meta
 * treats them as one product with a size selector rather than 81 separate
 * shirts. `id` is slug-size and must stay stable, since Meta keys everything
 * off it. Every row links to the same product page, which keeps the original
 * intent intact — the size chart, the fit note and the delivery terms are
 * still what a customer arrives at.
 *
 * Sizes come from `sizes`, which is the same array the product page renders,
 * so a size that cannot be bought can never appear in the shop.
 *
 * ── ONE DELIBERATE OMISSION ───────────────────────────────────────────────
 * Products that cannot be fulfilled are left out entirely rather than listed
 * as out of stock. A tag is a buy button; offering one for something with no
 * Tapstitch route behind it takes money for a garment nobody can make.
 */

const XML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};
/* Product copy contains ampersands and quotes, and one unescaped character
   invalidates the whole document — Meta rejects the feed rather than the
   row, so every product vanishes because of one apostrophe. */
const xml = (s: string) => s.replace(/[&<>"']/g, (c) => XML_ESCAPES[c]);

export const Route = createFileRoute("/api/meta-feed")({
  server: {
    handlers: {
      GET: async () => {
        const items = ANOTHER_PUNK_PRODUCTS.filter(isFulfillable).flatMap((p) => {
          /* Same fallback the product page uses. This read `?? p.eyebrow`,
             which meant the five tees showed Meta "340gsm · washed grey ·
             raw hem" — a spec label, not a description — while the page
             they link to showed the real copy. Two descriptions of one
             product, and the worse one on the surface a stranger sees
             first. */
          const description = p.description ?? DEFAULT_DESCRIPTION;
          /* Only sizes with a real variant behind them. `sizes` is what the
             product page offers, and shopifyVariantIds is what can actually
             be ordered; anything in one but not the other would be a buy
             button with nothing behind it. */
          const sizes = p.sizes.filter((size) => p.shopifyVariantIds[size]);
          return sizes.map((size) =>
            [
              "    <item>",
              `      <g:id>${xml(p.slug)}-${xml(size)}</g:id>`,
              `      <g:item_group_id>${xml(p.slug)}</g:item_group_id>`,
              `      <g:title>${xml(p.title)}</g:title>`,
              `      <g:description>${xml(description)}</g:description>`,
              `      <g:size>${xml(size)}</g:size>`,
              `      <g:availability>in stock</g:availability>`,
              `      <g:condition>new</g:condition>`,
              `      <g:price>${p.price.toFixed(2)} EUR</g:price>`,
              `      <g:link>${SITE}/product/${xml(p.slug)}</g:link>`,
              `      <g:image_link>${xml(absoluteUrl(p.images[0]))}</g:image_link>`,
              ...p.images
                .slice(1, 11)
                .map((img) => `      <g:additional_image_link>${xml(absoluteUrl(img))}</g:additional_image_link>`),
              `      <g:brand>Another Punk</g:brand>`,
              `      <g:google_product_category>Apparel &amp; Accessories &gt; Clothing</g:google_product_category>`,
              "    </item>",
            ].join("\n"),
          );
        });

        const body = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
          "  <channel>",
          "    <title>Another Punk</title>",
          `    <link>${SITE}</link>`,
          "    <description>Printed to order. Shipped worldwide.</description>",
          ...items,
          "  </channel>",
          "</rss>",
        ].join("\n");

        return new Response(body, {
          status: 200,
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            /* Meta fetches on a schedule, so a short edge cache costs nothing
               and stops a crawler hammering the function. */
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
