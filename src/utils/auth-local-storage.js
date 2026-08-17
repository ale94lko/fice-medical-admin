import { authStorageKeys as keys } from 'components/constants.js'

export function readStoredToken() {
  return localStorage.getItem(keys.token)
}

export function writeStoredToken(value) {
  localStorage.setItem(keys.token, value ?? '')
}

export function readStoredExpireAt() {
  return localStorage.getItem(keys.expireAt)
    || localStorage.getItem(keys.expireAtLegacy)
}

function decodeJwtPayload(token) {
  const parts = String(token || '').split('.')
  if (parts.length < 2) {
    return null
  }
  const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
  try {
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

function expireAtIsoFromAccessToken(token) {
  const exp = Number(decodeJwtPayload(token)?.exp)
  if (!Number.isFinite(exp) || exp <= 0) {
    return ''
  }

  return new Date(exp * 1000).toISOString()
}

export function writeStoredExpireAt() {
  const iso = expireAtIsoFromAccessToken(readStoredToken())
  if (!iso) {
    localStorage.removeItem(keys.expireAt)
    localStorage.removeItem(keys.expireAtLegacy)

    return
  }
  localStorage.setItem(keys.expireAt, iso)
  localStorage.setItem(keys.expireAtLegacy, iso)
}

export function readStoredRefreshToken() {
  return localStorage.getItem(keys.refresh)
    || localStorage.getItem(keys.refreshLegacy)
}

export function writeStoredRefreshToken(value) {
  if (!value) {
    return
  }
  localStorage.setItem(keys.refresh, value)
  localStorage.setItem(keys.refreshLegacy, value)
}

export function clearAuthLocalStorage() {
  [
    keys.token,
    keys.expireAt,
    keys.expireAtLegacy,
    keys.refresh,
    keys.refreshLegacy,
    keys.mustEnrollMfa,
  ].forEach(k => localStorage.removeItem(k))
}

export function readStoredMustEnrollMfa() {
  return localStorage.getItem(keys.mustEnrollMfa) === 'true'
}

export function writeStoredMustEnrollMfa(value) {
  if (value) {
    localStorage.setItem(keys.mustEnrollMfa, 'true')

    return
  }
  localStorage.removeItem(keys.mustEnrollMfa)
}
