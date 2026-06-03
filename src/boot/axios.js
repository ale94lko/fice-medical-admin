import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'
import { Notify } from 'quasar'
import {
  apiPaths,
  defaultTenant,
  quasarNotifyTypes,
  typeNames,
} from 'components/constants.js'
import { extractOAuthTokenPayload } from 'components/helpers.js'
import {
  readStoredExpireAt,
  readStoredRefreshToken,
  readStoredToken,
  writeStoredExpireAt,
  writeStoredRefreshToken,
  writeStoredToken,
} from '../utils/auth-local-storage.js'
import {
  beginSessionExpiredUiSuppression,
  isInvalidRefreshTokenError,
  markErrorAsSessionLogoutHandled,
  registerSessionExpiredNotify,
} from '../utils/api-session-error.js'
import { deepMapRequestKeysToSnakeCase } from '../utils/request-key-case.js'
import { i18nGlobalT } from './i18n.js'

let lastSessionExpiredNotifyAt = 0

const api = axios.create({
  baseURL:
    'https://b2dc-79-112-135-22.ngrok-free.app',
})

let refreshInFlight = null

function isUnauthorizedError(error) {
  const status = error.response?.status

  return status === 401 || status === '401'
}

async function getRefreshJwtForRequest() {
  let rt = readStoredRefreshToken()
  if (rt) {
    return rt
  }
  try {
    const { useAuthStore } = await import('stores/auth-store.js')
    rt = useAuthStore().refreshToken
    if (typeof rt === 'string' && rt.length > 0) {
      writeStoredRefreshToken(rt)

      return rt
    }
  } catch {
    // Pinia may be unavailable during very early boot
  }

  return null
}

function isPublicAuthUrl(url) {
  const u = url || ''

  return u.includes(apiPaths.oauthLogin) || u.includes(apiPaths.oauthRefresh)
}

function getRefreshInFlight() {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null
    })
  }

  return refreshInFlight
}

async function persistTokensFromResponse(body) {
  const td = extractOAuthTokenPayload(body)
  if (!td?.token) {
    throw new Error('refresh: missing token')
  }
  writeStoredToken(td.token)
  writeStoredExpireAt(td.expiration ?? '')
  const { useAuthStore } = await import('stores/auth-store.js')
  useAuthStore().applyTokensFromApi(td)
}

function stripAuthorizationHeader(cfg) {
  const h = cfg?.headers
  if (!h) {
    return
  }
  if (typeof h.delete === 'function') {
    h.delete('Authorization')
    h.delete('authorization')
  } else {
    delete h.Authorization
    delete h.authorization
  }
}

async function performRefresh() {
  const refreshJwt = await getRefreshJwtForRequest()
  if (!refreshJwt) {
    throw new Error('no refresh token')
  }
  const body = { refreshToken: refreshJwt }
  const res = await api.post(
    apiPaths.oauthRefresh,
    body,
    { __refreshCall: true }
  )
  await persistTokensFromResponse(res.data)
}

async function maybeRefreshAccessToken() {
  const token = readStoredToken()
  const exp = readStoredExpireAt()
  if (!token || !exp) {
    return
  }
  if (new Date() < new Date(exp)) {
    return
  }
  const rt = await getRefreshJwtForRequest()
  if (!rt) {
    return
  }
  try {
    await getRefreshInFlight()
  } catch {
    // request may 401; response interceptor will refresh or logout
  }
}

async function clearSessionFromApi() {
  const { useAuthStore } = await import('stores/auth-store.js')
  useAuthStore().clearSession()
}

async function clearSessionAndRedirectToLogin() {
  beginSessionExpiredUiSuppression()
  const now = Date.now()
  if (now - lastSessionExpiredNotifyAt > 600) {
    lastSessionExpiredNotifyAt = now
    const dismiss = Notify.create({
      type: quasarNotifyTypes.negative,
      message: i18nGlobalT('sessionExpiredRelogin'),
      position: 'top',
      timeout: 6000,
      group: 'session-expired',
    })
    registerSessionExpiredNotify(dismiss)
  }
  await clearSessionFromApi()
  try {
    const { useAuthStore } = await import('stores/auth-store.js')
    const r = useAuthStore().router
    if (r && typeof r.replace === 'function') {
      await r.replace({ path: '/login' }).catch(() => {})
    }
  } catch {
    // Router may not be mounted yet
  }
}

api.interceptors.request.use(
  async config => {
    config.headers = config.headers || {}
    config.headers['X-Tenant-Key'] = defaultTenant

    const url = config.url || ''
    const publicAuth = isPublicAuthUrl(url) || config.__refreshCall

    if (!publicAuth) {
      await maybeRefreshAccessToken()
      const t2 = readStoredToken()
      if (t2) {
        config.headers.Authorization = `Bearer ${t2}`
      }
    }

    if (
      config.data != null
      && typeof config.data === typeNames.object
      && !(config.data instanceof FormData)
      && !(config.data instanceof URLSearchParams)
      && !(config.data instanceof Blob)
      && !(config.data instanceof ArrayBuffer)
    ) {
      config.data = deepMapRequestKeysToSnakeCase(config.data)
    }

    return config
  },
  error => Promise.reject(error),
)

api.interceptors.response.use(
  r => r,
  async error => {
    const cfg = error.config
    if (cfg?.__refreshCall) {
      if (isInvalidRefreshTokenError(error)) {
        await clearSessionAndRedirectToLogin()
      }

      return Promise.reject(error)
    }
    if (!isUnauthorizedError(error) || !cfg || cfg.__retryAfterRefresh) {
      return Promise.reject(error)
    }
    if (cfg.url?.includes(apiPaths.oauthLogin)) {
      return Promise.reject(error)
    }

    const refreshJwt = await getRefreshJwtForRequest()
    if (!refreshJwt) {
      return Promise.reject(error)
    }

    cfg.__retryAfterRefresh = true
    try {
      await getRefreshInFlight()
      stripAuthorizationHeader(cfg)

      return api(cfg)
    } catch (refreshErr) {
      if (isInvalidRefreshTokenError(refreshErr)) {
        markErrorAsSessionLogoutHandled(error)
      }

      return Promise.reject(error)
    }
  },
)

export default defineBoot(({ app }) => {
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
  app.provide('api', api)
})

export const apiInstance = api
