import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  computeDiscount,
  computeShippingDiscount,
  findPromoCode,
  normalizePromoCode,
} from "./promo-codes";
import { bundleDiscount, shippingAfterBundles } from "./bundles";
import { getAnotherPunkProduct } from "./another-punk-products";

// Another Punk sells one kind of thing: apparel produced by Tapstitch via
// the headless Shopify bridge (see lib/tapstitch-fulfillment.server.ts).
// The union is kept rather than dropped so cart lines stay self-describing
// and a second product line later (accessories, prints) is an additive
// change rather than a refactor of every cart call site.
export type CartProductType = "tapstitch";

export type CartItem = {
  slug: string;
  title: string;
  image: string;
  productType: CartProductType;
  sizeLabel: string;
  price: number;
  qty: number;
  /** Set when this line arrived as part of a package deal. Two fields, not
   * one: the slug says WHICH deal, the id says WHICH INSTANCE of it, so two
   * separate Raw Hem Fours in one basket stay two bundles rather than
   * merging into an eight-garment group that validates as neither.
   *
   * Both are display grouping on this side. The price they imply is worked
   * out again on the server from the catalogue, so nothing here decides what
   * anybody is charged. */
  bundleId?: string;
  bundleSlug?: string;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty">, qty: number) => void;
  updateQty: (
    slug: string,
    productType: CartProductType,
    sizeLabel: string,
    qty: number,
    bundleId?: string,
  ) => void;
  removeItem: (
    slug: string,
    productType: CartProductType,
    sizeLabel: string,
    bundleId?: string,
  ) => void;
  /** Drops every line belonging to one package deal at once. A bundle is
   * bought and removed as a unit — pulling one tee out of a four-pack would
   * leave three garments that are no longer a deal and no longer priced as
   * one, which is a worse outcome than any button should quietly produce. */
  removeBundle: (bundleId: string) => void;
  clear: () => void;
  subtotal: number;
  count: number;
  /** Currently-applied promo code, normalized (uppercase), or null. */
  promoCode: string | null;
  /** Tries to apply a code, returns whether it was recognized. Client-side
   * only, for instant UI feedback; checkout re-validates this server-side
   * before it ever affects a real order. */
  applyPromoCode: (code: string) => boolean;
  removePromoCode: () => void;
  /** Dollar amount taken off by the applied promo code, 0 if none applied. */
  discount: number;
  /** Shipping actually payable: the rate for this bag, less anything a promo
   * code takes off it. Charged on the order, not per garment — see
   * shipping.ts. Zero for an empty bag. */
  shipping: number;
  /** The undiscounted postage, so the saving can be shown rather than the
   * charge simply appearing smaller than the stated rate. */
  shippingBeforeDiscount: number;
  /** subtotal - discount (floored at 0) + shipping. */
  total: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "another-punk-cart";
const PROMO_STORAGE_KEY = "another-punk-promo";

// Same poster + size can now be ordered as different physical products
// (unframed / framed / hanger), so the line key has to include productType
// too, otherwise a framed 16×20 and an unframed 16×20 of the same poster
// would collapse into one cart line.
// The bundle instance is part of the identity too, and this one matters more
// than it looks. Without it, adding a loose Bat Country tee in L to a basket
// that already holds a Raw Hem Four containing Bat Country in L would MERGE
// the two into a single line of qty 2 — and that group then has five garments
// where the bundle wants four, fails validation, and is quietly charged at
// full price. The customer would have watched their package deal evaporate
// with no error and no explanation.
function lineKey(
  slug: string,
  productType: CartProductType,
  sizeLabel: string,
  bundleId?: string,
) {
  return `${slug}__${productType}__${sizeLabel}__${bundleId ?? ""}`;
}

/** Every line's own key, so callers never have to reassemble it. */
export function cartLineKey(line: {
  slug: string;
  productType: CartProductType;
  sizeLabel: string;
  bundleId?: string;
}) {
  return lineKey(line.slug, line.productType, line.sizeLabel, line.bundleId);
}

const VALID_PRODUCT_TYPES: CartProductType[] = ["tapstitch"];

// Carts persist in localStorage indefinitely, so a browser can still be
// holding a line item added before `productType` existed on CartItem (pre
// the Prodigi 3-type migration), it comes back as `undefined`, which fails
// checkout's server-side validation with no client-side error surfaced,
// leaving the live shipping quote stuck on "Calculating…" forever (found by
// hitting this exact case while walkthrough-testing checkout). Rather than
// handle that failure mode everywhere it could bite, drop anything
// malformed right where the cart is loaded, a customer's old cart quietly
// loses only the item that could never have checked out anyway, not the
// whole cart.
function isValidCartItem(item: unknown): item is CartItem {
  if (typeof item !== "object" || item === null) return false;
  const i = item as Record<string, unknown>;
  return (
    typeof i.slug === "string" &&
    i.slug.length > 0 &&
    typeof i.title === "string" &&
    typeof i.image === "string" &&
    typeof i.productType === "string" &&
    VALID_PRODUCT_TYPES.includes(i.productType as CartProductType) &&
    typeof i.sizeLabel === "string" &&
    i.sizeLabel.length > 0 &&
    typeof i.price === "number" &&
    Number.isFinite(i.price) &&
    i.price >= 0 &&
    typeof i.qty === "number" &&
    Number.isInteger(i.qty) &&
    i.qty > 0
  );
}

function readStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidCartItem).flatMap((line: CartItem) => {
      // A bag can outlive a price change, or a product being withdrawn. The
      // stored price is therefore treated as a stale copy, never as the
      // truth: the catalogue is re-read on every hydration and the line is
      // corrected to today's price. Without this the cart would quote what
      // the shirt cost the day it was added while checkout charged the
      // current price, because the server prices from the catalogue too.
      const current = getAnotherPunkProduct(line.slug);
      if (!current) return [];
      if (!current.sizes.includes(line.sizeLabel as never)) return [];
      return [{ ...line, price: current.price, title: current.title }];
    });
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  // Cart starts empty on the server render and hydrates from localStorage in
  // an effect, so the SSR markup and first client render always match.
  const [items, setItems] = useState<CartItem[]>([]);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readStoredCart());
    try {
      setPromoCode(window.localStorage.getItem(PROMO_STORAGE_KEY));
    } catch {
      // localStorage unavailable, no promo code carried over, not fatal.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    if (promoCode) window.localStorage.setItem(PROMO_STORAGE_KEY, promoCode);
    else window.localStorage.removeItem(PROMO_STORAGE_KEY);
  }, [promoCode, hydrated]);

  const addItem: CartContextValue["addItem"] = (item, qty) => {
    setItems((prev) => {
      const key = lineKey(item.slug, item.productType, item.sizeLabel, item.bundleId);
      const existing = prev.find(
        (line) => lineKey(line.slug, line.productType, line.sizeLabel, line.bundleId) === key,
      );
      if (existing) {
        return prev.map((line) =>
          lineKey(line.slug, line.productType, line.sizeLabel, line.bundleId) === key
            ? { ...line, qty: line.qty + qty }
            : line,
        );
      }
      return [...prev, { ...item, qty }];
    });
  };

  const updateQty: CartContextValue["updateQty"] = (
    slug,
    productType,
    sizeLabel,
    qty,
    bundleId,
  ) => {
    setItems((prev) => {
      const key = lineKey(slug, productType, sizeLabel, bundleId);
      if (qty <= 0) {
        return prev.filter((line) => lineKey(line.slug, line.productType, line.sizeLabel, line.bundleId) !== key);
      }
      return prev.map((line) =>
        lineKey(line.slug, line.productType, line.sizeLabel, line.bundleId) === key ? { ...line, qty } : line,
      );
    });
  };

  const removeItem: CartContextValue["removeItem"] = (slug, productType, sizeLabel, bundleId) => {
    const key = lineKey(slug, productType, sizeLabel, bundleId);
    setItems((prev) =>
      prev.filter((line) => lineKey(line.slug, line.productType, line.sizeLabel, line.bundleId) !== key),
    );
  };

  const removeBundle: CartContextValue["removeBundle"] = (bundleId) => {
    setItems((prev) => prev.filter((line) => line.bundleId !== bundleId));
  };

  const clear = () => {
    setItems([]);
    setPromoCode(null);
  };

  const applyPromoCode: CartContextValue["applyPromoCode"] = (code) => {
    if (!findPromoCode(code)) return false;
    setPromoCode(normalizePromoCode(code));
    return true;
  };

  const removePromoCode = () => setPromoCode(null);

  const { subtotal, count } = useMemo(() => {
    return items.reduce(
      (acc, line) => ({
        subtotal: acc.subtotal + line.price * line.qty,
        count: acc.count + line.qty,
      }),
      { subtotal: 0, count: 0 },
    );
  }, [items]);

  const promoDiscount = useMemo(() => computeDiscount(promoCode, items), [promoCode, items]);

  // Mirrors the server exactly — same functions, same catalogue. This figure
  // is only ever shown; checkout recomputes it before charging anything.
  const bundlesOff = useMemo(() => bundleDiscount(items), [items]);
  const discount = Math.min(subtotal, promoDiscount + bundlesOff);
  // A promo code takes money off the clothes and, only if it explicitly says
  // so, off the postage too. Keeping those separate is what stops a
  // percentage meant for the garments from quietly paying the courier.
  // Bundles include their own postage, so they pay for the parcel and only
  // whatever travels alongside them is charged the marginal cost of going in
  // the same box.
  const shippingBeforeDiscount = shippingAfterBundles(items);
  const shipping = Math.max(
    0,
    shippingBeforeDiscount - computeShippingDiscount(promoCode, shippingBeforeDiscount),
  );
  const total = Math.max(0, subtotal - discount) + shipping;

  const value: CartContextValue = {
    items,
    addItem,
    updateQty,
    removeItem,
    removeBundle,
    clear,
    subtotal,
    count,
    promoCode,
    applyPromoCode,
    removePromoCode,
    discount,
    shipping,
    shippingBeforeDiscount,
    total,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
