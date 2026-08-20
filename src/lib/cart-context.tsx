import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { computeDiscount, findPromoCode, normalizePromoCode } from "./promo-codes";

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
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty">, qty: number) => void;
  updateQty: (slug: string, productType: CartProductType, sizeLabel: string, qty: number) => void;
  removeItem: (slug: string, productType: CartProductType, sizeLabel: string) => void;
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
  /** subtotal - discount, floored at 0. */
  total: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "another-punk-cart";
const PROMO_STORAGE_KEY = "another-punk-promo";

// Same poster + size can now be ordered as different physical products
// (unframed / framed / hanger), so the line key has to include productType
// too, otherwise a framed 16×20 and an unframed 16×20 of the same poster
// would collapse into one cart line.
function lineKey(slug: string, productType: CartProductType, sizeLabel: string) {
  return `${slug}__${productType}__${sizeLabel}`;
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
    return Array.isArray(parsed) ? parsed.filter(isValidCartItem) : [];
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
      const key = lineKey(item.slug, item.productType, item.sizeLabel);
      const existing = prev.find(
        (line) => lineKey(line.slug, line.productType, line.sizeLabel) === key,
      );
      if (existing) {
        return prev.map((line) =>
          lineKey(line.slug, line.productType, line.sizeLabel) === key
            ? { ...line, qty: line.qty + qty }
            : line,
        );
      }
      return [...prev, { ...item, qty }];
    });
  };

  const updateQty: CartContextValue["updateQty"] = (slug, productType, sizeLabel, qty) => {
    setItems((prev) => {
      const key = lineKey(slug, productType, sizeLabel);
      if (qty <= 0) {
        return prev.filter((line) => lineKey(line.slug, line.productType, line.sizeLabel) !== key);
      }
      return prev.map((line) =>
        lineKey(line.slug, line.productType, line.sizeLabel) === key ? { ...line, qty } : line,
      );
    });
  };

  const removeItem: CartContextValue["removeItem"] = (slug, productType, sizeLabel) => {
    const key = lineKey(slug, productType, sizeLabel);
    setItems((prev) =>
      prev.filter((line) => lineKey(line.slug, line.productType, line.sizeLabel) !== key),
    );
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

  const discount = useMemo(() => computeDiscount(promoCode, items), [promoCode, items]);
  const total = Math.max(0, subtotal - discount);

  const value: CartContextValue = {
    items,
    addItem,
    updateQty,
    removeItem,
    clear,
    subtotal,
    count,
    promoCode,
    applyPromoCode,
    removePromoCode,
    discount,
    total,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
