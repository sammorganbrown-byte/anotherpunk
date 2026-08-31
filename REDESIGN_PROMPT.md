# Another Punk — full-send redesign, side-by-side

Paste everything below into Claude Code, run from inside the `another-punk` repo.

---

## The job

Build a completely new visual design for the Another Punk site and stand it up **next to** the current one so I can look at it, live, before anything replaces what's shipping now. Do not modify, restyle, or refactor anything the current site depends on. This is additive only.

Go all the way. Don't self-moderate toward "tasteful." The brief below points at sites that shipped the thing that shouldn't have worked and it worked — match that energy, not a watered-down version of it.

## Where the new design lives

Create a parallel route tree at **`/redesign/*`** inside this same app (TanStack Start, file-based routing under `src/routes/`). One deploy, one Vercel preview URL, current site at `/` completely untouched — no new repo, no new branch, no separate deploy pipeline needed for this stack.

- `src/routes/redesign/index.tsx` → home
- `src/routes/redesign/shop.tsx` → shop grid
- `src/routes/redesign/product/$slug.tsx` → PDP
- `src/routes/redesign/cart.tsx` → cart
- `src/routes/redesign/checkout.tsx` → checkout
- `src/routes/redesign/_layout.tsx` → its own shell (own header/nav/footer, or none at all if the direction calls for that — this does **not** need to reuse `__root.tsx`'s header/footer)

New components live in `src/components/redesign/` (new folder, don't touch `src/components/another-punk/`). New styles live in a new stylesheet scoped so they cannot leak onto or fight the current `[data-brand="another-punk"]` rules in `src/styles.css` — either a separate CSS file imported only by the redesign layout, or a distinct scope selector like `[data-brand="another-punk-redesign"]` on the redesign root. Don't edit the existing `@theme` block or the existing `[data-brand="another-punk"]` block.

## Absolute don't-touch list

- `src/routes/index.tsx`, `shop.tsx`, `cart.tsx`, `checkout.tsx`, `order-confirmed.tsx`, `product/$slug.tsx`, `__root.tsx`
- `src/components/another-punk/*` (existing ones)
- `src/styles.css` — only *add* new rules in a new scope, never edit what's there
- Anything under `src/lib/*.server.ts` (Stripe, Tapstitch, security headers, config) — read from these, never modify

## Reuse, don't reinvent

The commerce logic is real and working — reskin it, don't rebuild it:

- Product data: `src/lib/another-punk-products.ts` — same catalogue, same images, same copy. **Do not generate new photography, new mockups, or new product images.** Every image the redesign uses comes from `product.images[]` or the existing logo/asset URLs already in the codebase (see `LOGO_URL` in `__root.tsx`). If the direction wants imagery treated differently (cropped tighter, duotoned, glitched, placed inside a collage grid à la Cipher) — do that with CSS/canvas/filters on the existing assets, not by generating replacements.
- Cart: `src/lib/cart-context.tsx` — reuse the provider/hook, build new UI around it.
- Currency: `src/lib/currency-context.tsx` — same.
- Checkout: `src/lib/api/checkout.functions.ts` and the real Stripe flow — the redesigned checkout page should still complete a real order through the same backend, just with entirely new UI.
- Copy: pull real product titles, prices, quotes (`quote`/`quoteSource` fields), and the existing footer/brand lines where they still fit. Don't placeholder anything a real value already exists for.

## Creative direction — the anchor references

These are confirmed, not "for mood": **MSCHF** (mschf.com), **Cipher** (Awwwards SOTD, Aug 2026), **Shaky Love** (Awwwards), and **HAN Kjøbenhavn** (hankjobenhavn.com). One line on what to take from each:

- **MSCHF** — the homepage is a raw, numbered terminal log that scrolls like a changelog, not a hero-then-grid template. No polished hero at all. Steal the *nerve* to make the homepage look nothing like a homepage.
- **Cipher** — navigation dissolves into a floating, loosely-scattered constellation of imagery instead of a menu bar. Browsing feels like exploring, not clicking a nav item.
- **Shaky Love** — the entire homepage is one particle system; content and visual effect are the same object, not a hero image with effects layered on top.
- **HAN Kjøbenhavn** — the site literally boots like a mainframe before it lets you in: ASCII-rendered logo, a green-on-grey terminal log ("KERNEL... OK", "STOREFRONT SYNC... OK"), even the cookie-consent request played as a system line ("GDPR CONSENT... AWAITING"). Full commitment to the bit, not a five-second gimmick.

Pull mechanisms from these — terminal/log aesthetics, boot/init sequences, particle or generative systems, navigation-as-exploration, motion as the default state rather than a decoration — and apply them to Another Punk's own material: the screen-print/hand-drawn artwork, the red/black/paper palette, the film-quote origin story (Vivienne Westwood exhibition panel + *Repo Man*), the "no stock, no season, no repeat" positioning.

**One flag, your call to make:** the current live site deliberately kept a light paper ground rather than going dark ("mostly white with red type," per the comment in `styles.css`). Every anchor reference above is dark-terminal-on-black. Going dark for the redesign is very likely correct given the direction — do it if the work calls for it, just say so plainly in your summary rather than quietly reversing a documented decision without a word.

## Guardrails (the only restraint that applies)

- Respect `prefers-reduced-motion` — full effects for people who want them, an honest static fallback for people who don't.
- Ship-fast: heavy animation is the point, but it still has to run on a mid-range phone. If a boot/init sequence gates the page (like HAN's does), that's a fine choice for the homepage — don't gate cart or checkout behind anything that delays a purchase.
- Real accessibility basics still hold: focus states, alt text, semantic landmarks. Weird and inaccessible isn't the goal — weird and still usable by everyone is.

## What "done" looks like

- `/redesign` and its sub-pages run locally (`bun dev`) and build clean (`bun run build`, `bun run typecheck`).
- `/` and every route under it render byte-for-byte identical to before — diff the current site against itself to confirm nothing leaked.
- A short written summary of the direction you took, what you pulled from which reference, and the light/dark call you made — so I can react to it fast without reverse-engineering the CSS.
