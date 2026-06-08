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
