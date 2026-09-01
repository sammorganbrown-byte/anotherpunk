import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

// Another Punk is EUR-native end to end: prices in the catalogue are euros,
// the backend Shopify store is EUR, Stripe charges EUR, and Tapstitch bills
// in EUR.
//
// So this converts for READING ONLY, and never pretends otherwise. An earlier
// version of this file carried a hardcoded USD rate and quietly showed prices
// in a currency the customer would not actually be charged in — the failure
// worth avoiding is not "no converter", it is a converter the checkout does
// not honour. Everything here is therefore built around two rules:
//
//   1. Rates are real and dated. They are the European Central Bank's daily
//      reference rates, served through this site's own /api/rates so an ad
//      blocker cannot quietly remove the feature, and the UI can say when
//      they were published.
//   2. The euro figure is never hidden. Anywhere money is committed — the Pay
//      button, the order total — the euro amount is shown alongside, because
//      that is the number that reaches the card.
//
// If the rates endpoint is unreachable the site simply stays in euros. No
// stale hardcoded fallback, because a wrong rate is worse than no rate.

export const CURRENCIES = {
  EUR: { symbol: "€", label: "Euro" },
  GBP: { symbol: "£", label: "British pound" },
  USD: { symbol: "$", label: "US dollar" },
  CAD: { symbol: "CA$", label: "Canadian dollar" },
  AUD: { symbol: "A$", label: "Australian dollar" },
  NZD: { symbol: "NZ$", label: "New Zealand dollar" },
  SEK: { symbol: "kr", label: "Swedish krona" },
  DKK: { symbol: "kr", label: "Danish krone" },
  PLN: { symbol: "zł", label: "Polish złoty" },
  CZK: { symbol: "Kč", label: "Czech koruna" },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

type Rates = { date: string; rates: Partial<Record<CurrencyCode, number>> };

type CurrencyContextValue = {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  /** The customer's chosen currency, converted. Display only. */
  formatPrice: (amountEur: number) => string;
  /** Always euros — the amount that actually reaches the card. */
  formatEur: (amountEur: number) => string;
  /** True when prices on screen are a conversion rather than the real charge. */
  converted: boolean;
  /** ECB publication date for the rates in use, or null. */
  ratesDate: string | null;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const STORAGE_KEY = "another-punk-currency";
const RATES_KEY = "another-punk-rates";
const RATES_TTL_MS = 12 * 60 * 60 * 1000;

const eurFormatter = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  // Whole euros unless a price genuinely has cents.
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatEur(amount: number): string {
  return eurFormatter.format(amount);
}

function isCurrency(v: unknown): v is CurrencyCode {
  return typeof v === "string" && v in CURRENCIES;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  // Starts in EUR on both sides of hydration; the stored preference and the
  // rates are applied in effects, which only run in the browser. Reading
  // localStorage in the initial state would make the server and the first
  // client render disagree on every price on the page.
  const [currency, setCurrencyState] = useState<CurrencyCode>("EUR");
  const [rates, setRates] = useState<Rates | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (isCurrency(saved)) setCurrencyState(saved);
    } catch {
      // Private mode. Stays in euros, which is correct rather than merely safe.
    }
  }, []);

  useEffect(() => {
    let live = true;
    const cached = (() => {
      try {
        const raw = window.localStorage.getItem(RATES_KEY);
        if (!raw) return null;
        const p = JSON.parse(raw) as { at: number; data: Rates };
        return Date.now() - p.at < RATES_TTL_MS ? p.data : null;
      } catch {
        return null;
      }
    })();
    if (cached) {
      setRates(cached);
      return;
    }
    fetch("/api/rates")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: Rates) => {
        if (!live) return;
        setRates(d);
        try {
          window.localStorage.setItem(RATES_KEY, JSON.stringify({ at: Date.now(), data: d }));
        } catch {
          // Cache is an optimisation, not a requirement.
        }
      })
      .catch(() => {
        // Offline, blocked, or the endpoint is down. Prices stay in euros.
      });
    return () => {
      live = false;
    };
  }, []);

  const setCurrency = (c: CurrencyCode) => {
    setCurrencyState(c);
    try {
      window.localStorage.setItem(STORAGE_KEY, c);
    } catch {
      // Preference simply will not persist.
    }
  };

  const rate = currency === "EUR" ? 1 : rates?.rates?.[currency];
  // A chosen currency with no rate yet falls back to euros rather than
  // showing an unconverted number under the wrong symbol.
  const converted = currency !== "EUR" && typeof rate === "number";

  const value = useMemo<CurrencyContextValue>(() => {
    const formatter = converted
      ? new Intl.NumberFormat("en-IE", {
          style: "currency",
          currency,
          maximumFractionDigits: 0,
        })
      : null;
    return {
      currency: converted ? currency : "EUR",
      setCurrency,
      formatPrice: (amountEur: number) =>
        formatter && typeof rate === "number"
          ? formatter.format(amountEur * rate)
          : formatEur(amountEur),
      formatEur,
      converted,
      ratesDate: rates?.date ?? null,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency, converted, rate, rates?.date]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within a CurrencyProvider");
  return ctx;
}
