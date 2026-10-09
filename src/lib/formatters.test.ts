import { describe, expect, it } from 'vitest'
import { calculateInvoiceTotal, formatCurrency, formatProjectStatus } from './formatters'

describe('formatProjectStatus', () => {
  it('formats underscore and lowercase values into readable labels', () => {
    expect(formatProjectStatus('lead')).toBe('Lead')
    expect(formatProjectStatus('client_review')).toBe('Client review')
  })
})
describe('formatCurrency', () => {
  it('formats INR values from a number', () => {
    expect(formatCurrency(25000)).toBe('₹25,000.00')
  })
})

describe('calculateInvoiceTotal', () => {
  it('applies discount before GST', () => {
    expect(calculateInvoiceTotal(100000, 10000, 18)).toBe(106200)
  })
})
