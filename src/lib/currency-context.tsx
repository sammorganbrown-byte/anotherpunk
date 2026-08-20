import { createContext, useContext, type ReactNode } from "react";

// Another Punk is EUR-native end to end: prices in the catalogue are euros,
// the backend Shopify store is EUR, Stripe charges EUR, and Tapstitch bills
// in EUR. So there is no conversion here and no currency switcher.
//
// This deliberately replaced a multi-currency display context carried over
// from the sibling project. That version stored prices in USD and converted
// for display using a hardcoded rate — which drifts out of date, and worse,
// implies a conversion that never actually happens at checkout: the
// customer would see one currency and be charged another.
//
// The provider/hook shape is kept so components call formatPrice() without
// caring, and so genuine multi-currency (Stripe presentment currencies)
// can be added later behind the same API.

type CurrencyContextValue = {
  currency: "EUR";
  formatPrice: (amount: number) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const formatter = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  // Whole euros unless a price genuinely has cents.
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function formatPrice(amount: number): string {
  return formatter.format(amount);
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  return (
    <CurrencyContext.Provider value={{ currency: "EUR", formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within a CurrencyProvider");
  return ctx;
}
