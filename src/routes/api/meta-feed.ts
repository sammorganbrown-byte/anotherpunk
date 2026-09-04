import { createFileRoute } from "@tanstack/react-router";
import { ANOTHER_PUNK_PRODUCTS, isFulfillable } from "../../lib/another-punk-products";
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
 * ── TWO DELIBERATE OMISSIONS ──────────────────────────────────────────────
 * Products that cannot be fulfilled are left out entirely rather than listed
 * as out of stock. A tag is a buy button; offering one for something with no
 * Tapstitch route behind it takes money for a garment nobody can make.
 *
 * Sizes are not published as variants. Meta wants one row per purchasable
 * variant, which would mean 81 rows and a size selector Meta owns rather
 * than the product page. The tag should land on the page where the size
 * chart, the fit note and the delivery terms are — so one row per product,
 * and the choosing happens here.
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
        const items = ANOTHER_PUNK_PRODUCTS.filter(isFulfillable).map((p) => {
          const description = p.description ?? p.eyebrow;
          return [
            "    <item>",
            `      <g:id>${xml(p.slug)}</g:id>`,
            `      <g:title>${xml(p.title)}</g:title>`,
            `      <g:description>${xml(description)}</g:description>`,
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
          ].join("\n");
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
