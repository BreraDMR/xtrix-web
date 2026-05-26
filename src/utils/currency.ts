
export type Currency = 'EUR' | 'USD' | 'CZK' | 'RUB' | 'UAH'

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: '€',
  USD: '$',
  CZK: 'Kč',
  RUB: '₽',
  UAH: '₴',
}

export const CURRENCIES: Currency[] = ['EUR', 'USD', 'CZK', 'RUB', 'UAH']


export function formatCurrency(amount: number | null | undefined, currency: Currency = 'EUR'): string {
  if (amount === null || amount === undefined) {
    return `0.00 ${CURRENCY_SYMBOLS[currency]}`
  }
  return `${amount.toFixed(2)} ${CURRENCY_SYMBOLS[currency]}`
}


export function getCurrencySymbol(currency: Currency = 'EUR'): string {
  return CURRENCY_SYMBOLS[currency]
}
