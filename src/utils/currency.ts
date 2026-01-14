// Утилита для работы с валютами

export type Currency = 'EUR' | 'USD' | 'CZK' | 'RUB' | 'UAH'

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: '€',
  USD: '$',
  CZK: 'Kč',
  RUB: '₽',
  UAH: '₴',
}

export const CURRENCIES: Currency[] = ['EUR', 'USD', 'CZK', 'RUB', 'UAH']

/**
 * Форматирует число как валюту
 * @param amount - сумма
 * @param currency - код валюты
 * @returns отформатированная строка (например, "100.00 €")
 */
export function formatCurrency(amount: number | null | undefined, currency: Currency = 'EUR'): string {
  if (amount === null || amount === undefined) {
    return `0.00 ${CURRENCY_SYMBOLS[currency]}`
  }
  return `${amount.toFixed(2)} ${CURRENCY_SYMBOLS[currency]}`
}

/**
 * Получает символ валюты
 * @param currency - код валюты
 * @returns символ валюты
 */
export function getCurrencySymbol(currency: Currency = 'EUR'): string {
  return CURRENCY_SYMBOLS[currency]
}
