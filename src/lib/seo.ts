import { ANOTHER_PUNK_PRODUCTS } from "./another-punk-products";

/** Everything a link unfurl needs, in one place.
 *
 * ── WHY THIS EXISTS ───────────────────────────────────────────────────────
 * The site-wide Open Graph tags lived on the _shell layout route, and NO
 * child route defined a head of its own. Because a child inherits its
 * parent's meta, every page on the site unfurled as the same photograph —
 * paste a link to the Crop Tank into Instagram and it arrived showing the
 * Westwood 69 jersey. For a shop whose reach comes from shared links, the
 * unfurl IS the shopfront, and it was advertising the wrong garment on every
 * page but one.
 *
 * The fix is per-page meta, and the reason it lives in a helper rather than
 * being written out five times is that the tags come in matched sets: the
 * Open Graph image and the Twitter image are separate properties that must
 * carry the same URL, and three of the fields are repeated between the two
 * vocabularies. Written by hand per route they drift, and the drift is
 * invisible — nothing renders wrong on the site itself, it only shows up in
 * somebody else's chat window.
 */

/** Absolute, because Open Graph will not accept a relative image URL — the
 * exact rule that made six products unbuyable through Stripe. Same mistake,
 * different protocol. */
export const SITE = "https://www.anotherpunk.com";

/** Derived rather than written, because it used to say "Fourteen pieces" and
 * there are seventeen. A hand-typed count is wrong the moment a product is
 * added, and this is the one sentence that shows up in search results and in
 * every link anybody shares. */
export const DESCRIPTION = `${ANOTHER_PUNK_PRODUCTS.length} pieces. Printed to order, shipped worldwide. No warehouse, no dead stock, no sale rail.`;

/** Product images are a mix of local files and Higgsfield CDN URLs, and the
 * local ones are stored site-relative. Unfurl crawlers are on another machine
 * with no notion of our origin, so a relative path silently yields no image
 * at all. */
export const absoluteUrl = (src: string): string =>
  /^https?:\/\//.test(src) ? src : `${SITE}${src.startsWith("/") ? "" : "/"}${src}`;

export type PageMeta = {
  title: string;
  description?: string;
  /** Site-relative or absolute; made absolute here. */
  image: string;
  imageAlt: string;
  /** Site-relative path, e.g. "/product/the-jesus". */
  path: string;
  /** Open Graph type. "website" for listings, "article" is wrong for a shop. */
  type?: string;
};

/** Build the full matched set. Returns exactly the keys _shell also sets, so
 * a child's values replace the parent's rather than sitting alongside them —
 * a page that overrode og:image but not twitter:image would unfurl correctly
 * in WhatsApp and wrongly on X, which is worse than being uniformly wrong
 * because nobody would think to check. */
export function pageMeta({ title, description, image, imageAlt, path, type = "website" }: PageMeta) {
  const url = `${SITE}${path}`;
  const img = absoluteUrl(image);
  const desc = description ?? DESCRIPTION;
  return [
    { title },
    { name: "description", content: desc },
    { property: "og:type", content: type },
    { property: "og:site_name", content: "Another Punk" },
    { property: "og:title", content: title },
    { property: "og:description", content: desc },
    { property: "og:url", content: url },
    { property: "og:image", content: img },
    { property: "og:image:alt", content: imageAlt },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: desc },
    { name: "twitter:image", content: img },
    { name: "twitter:image:alt", content: imageAlt },
  ];
}
