import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";

import appCss from "../styles.css?url";
import rdCss from "../styles/redesign.css?url";
import { CartProvider, useCart } from "../lib/cart-context";
import { ApPlayer } from "../components/another-punk/ap-player";
import { CurrencyProvider } from "../lib/currency-context";
import { RdPixelText } from "../components/redesign/rd-pixel-text";

const LOGO_URL =
  "/img/229-ap-wordmark-logo.png";

const TITLE = "Another Punk";
const DESCRIPTION =
  "Hand-drawn graphics printed in red on heavyweight cotton. Made when you order it.";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "theme-color", content: "#ED1C24" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    /* redesign.css is loaded at the root, not only in _shell, so the 404
       can be styled. Every rule in it is scoped under [data-ap-rd], which
       makes it completely inert on any page that does not set that
       attribute — /classic included. Loading it here costs one cached
       stylesheet and is what lets a page rendered ABOVE the shell still look
       like the site. */
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: rdCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: ErrorView,
});

function RootShell({ children }: { children: ReactNode }) {
  // The brand scope lives on <body> so every page — including error and
  // not-found states — gets Another Punk's tokens without each route
  // remembering to opt in.
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body data-brand="another-punk" className="font-body">
        {children}
        {/* Cookieless. It counts pages, countries and device types and sets
            nothing on the visitor's machine, which is why this site still
            needs no consent banner — the one thing that would have forced
            one is exactly the thing this avoids. Said out loud on /privacy;
            if this is ever swapped for something that tracks people, that
            page has to change in the same commit. */}
        <Analytics />
        <Scripts />
      </body>
    </html>
  );
}

function BagLink() {
  const { count } = useCart();
  return (
    <Link
      to="/classic/cart"
      aria-label={`View bag, ${count} item${count === 1 ? "" : "s"}`}
      className="ap-eyebrow flex items-center gap-2 text-ink transition-opacity hover:opacity-60"
    >
      Bag
      <span className="text-[13px]">({count})</span>
    </Link>
  );
}

/** Mobile navigation.
 *
 * Closes on route change (otherwise the panel stays over the page you just
 * navigated to), on Escape, and locks body scroll while open so the page
 * behind doesn't scroll under the overlay. */
function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { count } = useCart();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="ap-mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] sm:hidden"
      >
        <span
          className={`block h-[2px] w-6 bg-ink transition-transform ${open ? "translate-y-[7px] rotate-45" : ""}`}
        />
        <span className={`block h-[2px] w-6 bg-ink transition-opacity ${open ? "opacity-0" : ""}`} />
        <span
          className={`block h-[2px] w-6 bg-ink transition-transform ${open ? "-translate-y-[7px] -rotate-45" : ""}`}
        />
      </button>

      {open ? (
        <div
          id="ap-mobile-nav"
          className="fixed inset-x-0 top-[69px] z-40 flex h-[calc(100dvh-69px)] flex-col gap-1 overflow-y-auto border-t border-ink bg-paper px-6 py-8 sm:hidden"
        >
          <Link to="/classic/shop" className="ap-mobile-link">
            Shop
          </Link>
          <Link to="/classic" hash="story" className="ap-mobile-link">
            Story
          </Link>
          <Link to="/classic/cart" className="ap-mobile-link">
            Bag <span className="text-pink">({count})</span>
          </Link>
          <p className="ap-eyebrow mt-auto text-ink-2">
            Drawn by hand. Printed to order.
          </p>
        </div>
      ) : null}
    </>
  );
}

/** The shipping chrome's player, scoped to /classic.
 *
 * This used to be hidden with CSS while a redesign page was mounted, which
 * hid the control but not the sound — so the redesign layout also had to hold
 * every <audio> paused for as long as it stayed mounted. Now the current site
 * has a player of its own, that hold would silence it too. Not rendering the
 * old one at all is the honest version of what the CSS was pretending to do.
 */
function ClassicOnlyPlayer() {
  return <ClassicOnlyChrome>{<ApPlayer />}</ClassicOnlyChrome>;
}

/** Renders the old site's chrome only where the old site is.
 *
 * This header, footer and player used to render on every route and be hidden
 * on the current site by a `body:has([data-ap-rd])` rule in redesign.css —
 * chosen back when __root.tsx was off limits. Hiding is not the same as not
 * rendering: the markup is in the HTML either way, so if redesign.css has not
 * applied yet (it is a second stylesheet, and it can lose the race on a cold
 * load) the old design paints for a frame or two before disappearing. That is
 * the flash. There is no rule that can win a race it starts late; the fix is
 * for the markup not to be there at all.
 */
function ClassicOnlyChrome({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (!pathname.startsWith("/classic")) return null;
  return <>{children}</>;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <CurrencyProvider>
        <CartProvider>
          <div className="flex min-h-dvh flex-col">
            <ClassicOnlyChrome>
            <header className="sticky top-0 z-30 border-b border-border bg-paper/95 backdrop-blur">
              <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-4 sm:px-10">
                <Link to="/classic" className="block">
                  <img src={LOGO_URL} alt="Another Punk" className="h-8 w-auto sm:h-9" />
                </Link>
                <nav className="flex items-center gap-5 sm:gap-8">
                  <Link
                    to="/classic/shop"
                    className="ap-eyebrow hidden text-ink transition-opacity hover:opacity-60 sm:inline"
                  >
                    Shop
                  </Link>
                  <BagLink />
                  <MobileMenu />
                </nav>
              </div>
            </header>
            </ClassicOnlyChrome>

            <main className="flex-1">
              {/* Required: nested routes render here. */}
              <Outlet />
            </main>

            {/* The old skin's player, for the old site only. The current
                site renders its own in the top bar (RdPlayer) — mounting both
                would put two <audio> elements on the page, one of them
                invisible and still audible. */}
            <ClassicOnlyPlayer />

            <ClassicOnlyChrome>
            <footer className="border-t border-ink bg-ink px-6 py-14 sm:px-10">
              <img
                src={LOGO_URL}
                alt="Another Punk"
                className="h-10 w-auto brightness-0 invert sm:h-12"
              />
              <div className="mt-10 grid grid-cols-1 gap-8 border-t border-paper/20 pt-8 sm:grid-cols-3">
                <p className="font-label text-[11px] leading-relaxed tracking-[0.1em] text-paper/60 uppercase">
                  Made to order
                  <br />
                  Shipped worldwide
                </p>
                <p className="font-label text-[11px] leading-relaxed tracking-[0.1em] text-paper/60 uppercase">
                  Heavyweight cotton
                  <br />
                  Drawn by hand
                </p>
                <p className="font-label text-[11px] leading-relaxed tracking-[0.1em] text-paper/60 uppercase sm:text-right">
                  © {new Date().getFullYear()} Another Punk
                </p>
              </div>
            </footer>
            </ClassicOnlyChrome>
          </div>
        </CartProvider>
      </CurrencyProvider>
    </QueryClientProvider>
  );
}

/** 404.
 *
 * ── THE BUG THIS FIXES ────────────────────────────────────────────────────
 * This used to send people to /classic/shop — the OLD design's shop. It is
 * the root's notFoundComponent, so it renders for the whole site, which meant
 * every mistyped URL on the live site quietly handed the visitor the legacy
 * version instead: different chrome, different prices in places, and no way
 * back to the current one. A 404 is the one page guaranteed to be seen by
 * somebody already slightly lost, and it was the only thing on the live site
 * pointing out of it.
 *
 * Every route it offers now belongs to the live site. If a second design is
 * ever run again, this component must keep pointing at the live one — it
 * renders above the split and cannot know which it is being shown from.
 *
 * Written in the shop's own register rather than an apology: it is a wrong
 * address, not a failure, and saying so plainly is faster than sorry.
 */
function NotFound() {
  return (
    <div className="rd-notfound" data-ap-rd="">
      <div className="rd-notfound-inner">
      <p className="rd-label mb-4">404 <span className="rd-key">/</span> NO SUCH PAGE</p>
      <RdPixelText as="h1" text="NOTHING HERE" />
      <p className="rd-log mt-6 max-w-[46ch]">
        Wrong address, or a page that never existed. Nothing was lost and nothing sold
        out — everything is printed to order, so it is all still there.
      </p>
      <div className="mt-8 flex flex-wrap gap-5">
        <Link to="/" className="rd-btn" data-primary="true">
          Back to the field
        </Link>
        <Link to="/shop" className="rd-link self-center underline underline-offset-4">
          Shop
        </Link>
      </div>
      </div>
    </div>
  );
}

function ErrorView({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="ap-statement text-pink">Off register.</h1>
      <p className="max-w-sm text-sm text-ink-2">That didn't load. Go again.</p>
      <button
        onClick={() => {
          router.invalidate();
          reset();
        }}
        className="font-label mt-2 bg-ink px-8 py-4 text-xs font-medium tracking-[0.14em] text-paper uppercase transition-opacity hover:opacity-90"
      >
        Go again
      </button>
    </div>
  );
}
