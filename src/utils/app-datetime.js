const DEFAULT_TIMEZONE = 'UTC'
const SESSION_TZ_KEY = 'fice.sessionDisplayTzMode'

export function resolveBrowserTimeZone() {
  try {
    // eslint-disable-next-line new-cap
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

export function resolveClinicTimeZone() {
  return DEFAULT_TIMEZONE
}

function readSessionTzMode() {
  if (typeof sessionStorage === 'undefined') {
    return null
  }
  try {
    const raw = sessionStorage.getItem(SESSION_TZ_KEY)

    return raw === 'browser' || raw === 'dismissed' ? raw : null
  } catch {
    return null
  }
}

export function getSessionDisplayTzMode() {
  return readSessionTzMode()
}

export function setSessionDisplayTzMode(mode) {
  if (typeof sessionStorage === 'undefined') {
    return
  }
  try {
    if (!mode) {
      sessionStorage.removeItem(SESSION_TZ_KEY)

      return
    }
    sessionStorage.setItem(SESSION_TZ_KEY, mode)
  } catch {
    // ignore quota / private mode
  }
}

export function clearSessionDisplayTzMode() {
  setSessionDisplayTzMode(null)
}

export function resolveActiveDisplayTimeZone() {
  if (readSessionTzMode() === 'browser') {
    return resolveBrowserTimeZone()
  }

  return resolveClinicTimeZone()
}

export function clinicBrowserTimezonesDiffer() {
  return resolveClinicTimeZone() !== resolveBrowserTimeZone()
}

function parseUtcInstant(value) {
  const raw = value instanceof Date ? value : String(value ?? '').trim()
  if (!raw) {
    return null
  }
  const date = raw instanceof Date ? raw : new Date(raw)

  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDateTime(
  utcInstant,
  timeZone = resolveActiveDisplayTimeZone(),
) {
  const date = parseUtcInstant(utcInstant)
  if (!date) {
    return ''
  }

  return new Intl.DateTimeFormat(undefined, {
    timeZone,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}
