export function formatCurrency(amount, currency = 'VND', locale = 'vi-VN') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'VND' ? 0 : 2,
  }).format(amount)
}

export function formatCompactCurrency(amount, currency = 'VND', locale = 'vi-VN') {
  return formatCurrency(amount, currency, locale).replace(/\s/g, '')
}

export function parseCurrencyInput(value) {
  const digits = String(value ?? '').replace(/\D/g, '')

  return digits ? Number(digits) : 0
}

export function formatCurrencyInput(value, locale = 'vi-VN') {
  const amount = parseCurrencyInput(value)

  return amount ? new Intl.NumberFormat(locale).format(amount) : ''
}
