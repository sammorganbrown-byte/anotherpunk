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

import appCss from "../styles.css?url";
import { CartProvider, useCart } from "../lib/cart-context";
import { ApPlayer } from "../components/another-punk/ap-player";
import { CurrencyProvider } from "../lib/currency-context";

const LOGO_URL =
  "https://d2ol7oe51mr4n9.cloudfront.net/user_3HRrQejbudj6pI84kgTHMOExU4K/00048e3d-cede-4c1a-a65e-222abb97d9a9.png";

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
    links: [{ rel: "stylesheet", href: appCss }],
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
        <Scripts />
      </body>
    </html>
  );
}

function BagLink() {
  const { count } = useCart();
  return (
    <Link
      to="/cart"
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
          <Link to="/shop" className="ap-mobile-link">
            Shop
          </Link>
          <Link to="/" hash="story" className="ap-mobile-link">
            Story
          </Link>
          <Link to="/cart" className="ap-mobile-link">
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

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <CurrencyProvider>
        <CartProvider>
          <div className="flex min-h-dvh flex-col">
            <header className="sticky top-0 z-30 border-b border-border bg-paper/95 backdrop-blur">
              <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-4 sm:px-10">
                <Link to="/" className="block">
                  <img src={LOGO_URL} alt="Another Punk" className="h-8 w-auto sm:h-9" />
                </Link>
                <nav className="flex items-center gap-5 sm:gap-8">
                  <Link
                    to="/shop"
                    className="ap-eyebrow hidden text-ink transition-opacity hover:opacity-60 sm:inline"
                  >
                    Shop
                  </Link>
                  <BagLink />
                  <MobileMenu />
                </nav>
              </div>
            </header>

            <main className="flex-1">
              {/* Required: nested routes render here. */}
              <Outlet />
            </main>

            <ApPlayer />

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
          </div>
        </CartProvider>
      </CurrencyProvider>
    </QueryClientProvider>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="ap-statement text-pink">Gone.</h1>
      <p className="max-w-sm text-sm text-ink-2">
        Not here. The rest of it still is.
      </p>
      <Link
        to="/shop"
        className="font-label mt-2 bg-pink px-8 py-4 text-xs font-medium tracking-[0.14em] text-paper uppercase transition-opacity hover:opacity-90"
      >
        Everything else
      </Link>
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
