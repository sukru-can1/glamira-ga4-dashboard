/**
 * Multi-currency normalization stub.
 * Placeholder for future implementation — 70 Glamira domains use multiple currencies.
 * Will eventually fetch exchange rates and normalize to a base currency.
 */

export interface CurrencyAmount {
  value: number;
  currency: string;
}

/** Formats an amount with its currency symbol */
export function formatCurrency(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}
