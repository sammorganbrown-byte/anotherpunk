import { CURRENCIES, useCurrency, type CurrencyCode } from "../../lib/currency-context";

/** Currency switcher.
 *
 * Lives in the footer rather than the top bar: it is a reading aid, not
 * navigation, and the bar is already carrying the shop, the bag, the player
 * and the clock. It also says what it is — a conversion, at a dated rate —
 * because the charge itself is always in euros.
 */
export function RdCurrency() {
  const { currency, setCurrency, converted, ratesDate } = useCurrency();

  return (
    <span className="flex flex-wrap items-center gap-2">
      <label htmlFor="rd-cur" className="rd-log">
        CURRENCY
      </label>
      <select
        id="rd-cur"
        className="rd-select"
        value={currency}
        onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
      >
        {Object.entries(CURRENCIES).map(([code, { label }]) => (
          <option key={code} value={code}>
            {code} — {label}
          </option>
        ))}
      </select>
      {converted ? (
        <span className="rd-log opacity-70">
          ECB rate{ratesDate ? ` ${ratesDate}` : ""} · charged in EUR
        </span>
      ) : null}
    </span>
  );
}
