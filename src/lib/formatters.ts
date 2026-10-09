export function formatProjectStatus(value: string | null | undefined): string {
  const rawValue = String(value ?? '').trim()

  if (!rawValue) {
    return 'Unknown'
  }

  const cleaned = rawValue.replace(/_/g, ' ')

  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((part, index) => {
      const normalized = part.toLowerCase()
      if (index === 0) {
        return normalized.charAt(0).toUpperCase() + normalized.slice(1)
      }
      return normalized
    })
    .join(' ')
}

export function formatCurrency(value: number | string | null | undefined): string {
  const numericValue = typeof value === 'number' ? value : Number(value ?? 0)

  if (!Number.isFinite(numericValue)) {
    return '₹0.00'
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue)
}

export function calculateInvoiceTotal(subtotal: number, discount: number, gstRate: number): number {
  const taxableAmount = Math.max(0, subtotal - discount)
  const gstAmount = taxableAmount * (gstRate / 100)
  return Math.round((taxableAmount + gstAmount) * 100) / 100
}
