import { apiPaths } from 'components/constants.js'

let sessionExpiredUiSuppressionUntil = 0

export function beginSessionExpiredUiSuppression(windowMs = 3500) {
  sessionExpiredUiSuppressionUntil = Date.now() + windowMs
}

export function clearSessionExpiredUiSuppression() {
  sessionExpiredUiSuppressionUntil = 0
}

function isUnauthorizedApiError(error) {
  const st = error?.response?.status

  return st === 401 || st === '401'
}

export function isInvalidRefreshTokenError(error) {
  const cfg = error?.config
  if (!cfg) {
    return false
  }
  const isRefreshRequest =
    cfg.__refreshCall === true
    || String(cfg.url ?? '').includes(apiPaths.oauthRefresh)
  if (!isRefreshRequest) {
    return false
  }
  const st = error.response?.status
  if (st === 401 || st === '401') {
    return true
  }
  if (st === 400 || st === '400') {
    const data = error.response?.data
    const code = data?.error_code
    if (code === 1001) {
      return true
    }
    const msg = String(
      data?.message ?? data?.error_description ?? '',
    ).toLowerCase()

    return msg.includes('invalid refresh')
      || msg.includes('invalid token')
  }

  return false
}

export function markErrorAsSessionLogoutHandled(error) {
  if (error?.config) {
    error.config.__sessionExpiredLogout = true
  }
}

export function isAuthSessionEndUIError(error) {
  if (error?.config?.__sessionExpiredLogout) {
    return true
  }
  if (
    Date.now() < sessionExpiredUiSuppressionUntil
    && isUnauthorizedApiError(error)
  ) {
    return true
  }

  return false
}
