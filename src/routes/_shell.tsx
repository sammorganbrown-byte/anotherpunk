import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useCart } from "../lib/cart-context";
import { RdField } from "../components/redesign/rd-field";
import { RdPlayer } from "../components/redesign/rd-player";
import { RdCurrency } from "../components/redesign/rd-currency";
import rdCss from "../styles/redesign.css?url";

/** The official hand-painted wordmark — the brand mark, not a typeface.
 * Same asset the live site uses. */
export const LOGO_URL =
  "https://d2ol7oe51mr4n9.cloudfront.net/user_3HRrQejbudj6pI84kgTHMOExU4K/00048e3d-cede-4c1a-a65e-222abb97d9a9.png";

/** Layout route for the whole site.
 *
 * This was built as a parallel direction under /redesign and is now the site
 * itself, so it owns the clean paths: /, /shop, /product/$slug, /cart,
 * /checkout, /order-confirmed. It is a PATHLESS layout (the leading
 * underscore), which is what lets it wrap those routes without adding a
 * segment of its own to any URL.
 *
 * The previous site is kept intact under /classic for rollback, noindexed so
 * only one version is in search. Both trees share the same data layer, cart
 * and Stripe path.
 *
 * The `data-ap-rd` attribute scopes every rule in redesign.css, and is also
 * what the stylesheet's :has() rule keys off to hide the old header, footer
 * and music player — they still render from __root.tsx for /classic, and are
 * simply not shown here.
 */
/** One description, used by the search result and by every link unfurl.
 *
 * Kept in a constant because it appears seven times below and a description
 * that disagrees with itself across Google and WhatsApp is the sort of thing
 * nobody notices until it is embarrassing. */
const DESCRIPTION =
  "Fourteen pieces. Printed to order, shipped worldwide. No warehouse, no dead stock, no sale rail.";

/** Absolute, because Open Graph will not accept a relative image URL — the
 * exact rule that made six products unbuyable through Stripe. Same mistake,
 * different protocol. */
const SITE = "https://www.anotherpunk.com";

export const Route = createFileRoute("/_shell")({
  head: () => ({
    meta: [
      { title: "Another Punk" },
      { name: "description", content: DESCRIPTION },
      // Open Graph and Twitter, so a link pasted into Instagram, WhatsApp or
      // anywhere else arrives as a photograph and a sentence rather than a
      // bare URL. Worth more than it looks: for a shop whose reach is going
      // to come from links being shared, the unfurl IS the shopfront, and
      // until now every share showed nothing at all.
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Another Punk" },
      { property: "og:title", content: "Another Punk" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: SITE },
      { property: "og:image", content: `${SITE}/img/og-another-punk.jpg` },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      {
        property: "og:image:alt",
        content: "Two people at night in the Westwood 69 football jerseys, black and pink.",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Another Punk" },
      { name: "twitter:description", content: DESCRIPTION },
      { name: "twitter:image", content: `${SITE}/img/og-another-punk.jpg` },
      { name: "theme-color", content: "#080807" },
    ],
    links: [{ rel: "stylesheet", href: rdCss }],
  }),
  component: RedesignLayout,
});

/** Reads the OS motion preference and keeps up if it changes mid-session. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

function Clock() {
  const [now, setNow] = useState<string>("--:--:--");
  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleTimeString("en-GB", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span className="rd-log tabular-nums" aria-hidden="true">
      {now}
    </span>
  );
}

function RedesignLayout() {
  const { count } = useCart();
  const reduced = useReducedMotion();
  const path = useRouterState({ select: (s) => s.location.pathname });

  // --rd-foot-h was a hardcoded 34px that eight rules depend on, including
  // the product page's viewport lock and the now-playing panel's offset. It
  // stopped being true the moment the footer could wrap — on a phone it is
  // nearer 100px — so the panel came to rest on top of the footer's own
  // controls. The previous fix padded the footer to make room, which meant
  // the bar visibly grew the moment you pressed play. Measuring it instead
  // fixes the cause: everything positioned against the footer now knows how
  // tall the footer actually is.
  const footRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = footRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    // Written onto the element that declares the token, not the root: the
    // default lives on [data-ap-rd], so a value set higher up is shadowed for
    // everything inside and the panel keeps using the 34px guess.
    const host = el.closest("[data-ap-rd]") as HTMLElement | null;
    if (!host) return;
    let last = -1;
    const apply = () => {
      const h = Math.round(el.getBoundingClientRect().height);
      if (h === last || h === 0) return;
      last = h;
      host.style.setProperty("--rd-foot-h", `${h}px`);
    };

    // Deliberately more than one trigger. A single ResizeObserver measured
    // the footer before the webfont had settled and then stayed quiet, so the
    // token kept a height that was 27px short and the panel sat on the
    // switcher anyway. These are all cheap, they all no-op once the height
    // stops changing, and between them there is no moment where the footer
    // can resize without something noticing.
    apply();
    const raf = requestAnimationFrame(apply);
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    window.addEventListener("resize", apply);
    window.addEventListener("load", apply);
    document.fonts?.ready.then(apply).catch(() => {});
    const settle = window.setTimeout(apply, 1200);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", apply);
      window.removeEventListener("load", apply);
      window.clearTimeout(settle);
    };
  }, []);

  return (
    <div data-ap-rd className="min-h-dvh">
      {reduced ? null : <RdField />}
      <div className="rd-scan" aria-hidden="true" />

      <header className="rd-bar">
        <Link to="/" className="rd-brand">
          Another Punk
        </Link>

        {/* Separated by a single red pixel rather than by space alone, so the
            bar reads as one continuous terminal line. The separators are
            drawn by CSS between items and are decoration only. */}
        <nav className="rd-nav" aria-label="Redesign">
          <Link
            to="/shop"
            className="rd-link"
            data-on={path.startsWith("/shop")}
          >
            Shop
          </Link>
          <Link to="/contact" className="rd-link" data-on={path.startsWith("/contact")}>
            Contact
          </Link>
          {/* Instagram sits in the bar rather than only in the footer. The
              account is where the brand actually lives day to day, and a link
              nobody scrolls to is a link nobody follows — the footer copy was
              below two screens of field on the homepage.
              Labelled with the glyph and the word on wider screens, glyph
              alone on a phone, where the bar has no room to spare. */}
          <a
            href="https://instagram.com/anotherpunk.threads"
            target="_blank"
            rel="noopener noreferrer"
            className="rd-link rd-ig"
            aria-label="Another Punk on Instagram"
          >
            <span aria-hidden="true">◎</span>
            <span className="rd-ig-word">Instagram</span>
          </a>
          <Link to="/cart" className="rd-link" data-on={path.startsWith("/cart")}>
            Bag [{count}]
          </Link>
          <RdPlayer />
          <Clock />
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      <footer ref={footRef} className="border-t border-[var(--rd-rule)] px-4 py-6">
        {/* The policies get their own line above the rest. Folding them into
            the row below would have buried four links people go looking for
            among two they do not — and a shop that hides its returns page
            reads as a shop with something to hide. */}
        <nav className="rd-log mb-3 flex flex-wrap gap-x-4 gap-y-2" aria-label="Policies">
          <Link to="/shipping" className="rd-link">
            SHIPPING
          </Link>
          <Link to="/returns" className="rd-link">
            RETURNS
          </Link>
          <Link to="/privacy" className="rd-link">
            PRIVACY
          </Link>
          <Link to="/terms" className="rd-link">
            TERMS
          </Link>
          <Link to="/contact" className="rd-link">
            CONTACT
          </Link>
        </nav>
        <div className="rd-log flex flex-wrap items-center justify-between gap-3">
          <span className="flex flex-wrap items-center gap-3">
            <span>SHIPPED WORLDWIDE</span>
            <a
              href="https://instagram.com/anotherpunk.threads"
              target="_blank"
              rel="noopener noreferrer"
              className="rd-ig-cta"
            >
              <span aria-hidden="true">◎</span> @anotherpunk.threads
            </a>
          </span>
          <RdCurrency />
        </div>
      </footer>
    </div>
  );
}
