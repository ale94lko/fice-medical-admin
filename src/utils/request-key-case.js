import { typeNames } from '../components/constants.js'

export function requestKeyToSnakeCase(key) {
  if (typeof key !== 'string' || key.length === 0) {
    return key
  }
  if (!/[A-Z]/.test(key)) {
    return key
  }

  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .toLowerCase()
}

export function deepMapRequestKeysToSnakeCase(input) {
  if (input == null) {
    return input
  }
  if (Array.isArray(input)) {
    return input.map(deepMapRequestKeysToSnakeCase)
  }
  if (typeof input !== typeNames.object) {
    return input
  }
  if (input instanceof Date) {
    return input
  }
  if (
    input instanceof FormData
    || input instanceof Blob
    || input instanceof ArrayBuffer
  ) {
    return input
  }

  const out = {}
  for (const key of Object.keys(input)) {
    const snakeKey = requestKeyToSnakeCase(key)
    const val = input[key]
    let next
    if (
      val != null
      && typeof val === typeNames.object
      && !Array.isArray(val)
      && !(val instanceof Date)
      && !(val instanceof FormData)
      && !(val instanceof Blob)
      && !(val instanceof ArrayBuffer)
    ) {
      next = deepMapRequestKeysToSnakeCase(val)
    } else if (Array.isArray(val)) {
      next = val.map(deepMapRequestKeysToSnakeCase)
    } else {
      next = val
    }
    out[snakeKey] = next
  }

  return out
}
