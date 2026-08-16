/**
 * US Employer Identification Number (Tax ID / EIN).
 * Stored as 9 digits; shown as 12-3456789.
 */

export function normalizeEinDigits(value) {
  return String(value ?? '').replace(/\D/g, '').slice(0, 9)
}

export function formatEinDisplay(value) {
  const digits = normalizeEinDigits(value)
  if (!digits) {
    return ''
  }
  if (digits.length <= 2) {
    return digits
  }

  return `${digits.slice(0, 2)}-${digits.slice(2)}`
}

export function isValidEin(value) {
  return normalizeEinDigits(value).length === 9
}

export function sanitizeEinInput(value) {
  return formatEinDisplay(value)
}
