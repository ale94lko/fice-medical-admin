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

export function writeStoredExpireAt(value) {
  const v = value ?? ''
  localStorage.setItem(keys.expireAt, v)
  localStorage.setItem(keys.expireAtLegacy, v)
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
