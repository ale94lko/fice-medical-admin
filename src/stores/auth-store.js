import { defineStore } from 'pinia'
import { apiInstance } from 'boot/axios'
import { apiPaths, typeNames } from 'components/constants.js'
import {
  extractLoginUserInfo,
  extractMfaChallenge,
  extractOAuthTokenPayload,
} from 'components/helpers.js'
import {
  clearAuthLocalStorage,
  readStoredExpireAt,
  readStoredMustEnrollMfa,
  readStoredRefreshToken,
  readStoredToken,
  writeStoredExpireAt,
  writeStoredMustEnrollMfa,
  writeStoredRefreshToken,
  writeStoredToken,
} from '../utils/auth-local-storage.js'
import { dismissSessionExpiredNotify } from '../utils/api-session-error.js'
import { completeMfaChallenge as postMfaChallenge } from
  '../utils/mfa-api.js'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    expireAt: null,
    refreshToken: null,
    mustEnrollMfa: false,
    _initialized: false,
  }),
  getters: {
    isAuthenticated: state => !!state.token,
    needsPostLoginSetup: state => state.mustEnrollMfa,
  },
  actions: {
    applyTokensFromApi(td) {
      if (!td) {
        return
      }
      this.token = td.token || td.access_token || ''
      this.expireAt = td.expiration || td.expires_at || td.expiresAt || ''
      const nextRefresh = td.refreshToken || td.refresh_token
      if (nextRefresh) {
        this.refreshToken = nextRefresh
        writeStoredRefreshToken(nextRefresh)
      }
      writeStoredToken(this.token)
      writeStoredExpireAt(this.expireAt)
    },
    applyMfaFlagsFromLogin(body) {
      const userInfo = extractLoginUserInfo(body)
      this.mustEnrollMfa = Boolean(userInfo?.mfaEnrollmentRequired)
        && !userInfo?.mfaEnabled
      writeStoredMustEnrollMfa(this.mustEnrollMfa)
    },
    completeMfaEnrollment() {
      this.mustEnrollMfa = false
      writeStoredMustEnrollMfa(false)
      void this.enterAppIfReady()
    },
    requireMfaEnrollment() {
      this.mustEnrollMfa = true
      writeStoredMustEnrollMfa(true)
      void this.holdOnLoginIfNeeded()
    },
    async enterAppIfReady() {
      if (this.mustEnrollMfa) {
        return false
      }
      const path = String(this.router?.currentRoute?.value?.path ?? '')
      if (path === '/login' || path === '/reset-password') {
        await this.router.replace('/dashboard').catch(() => {})
      }

      return true
    },
    holdOnLoginIfNeeded() {
      if (!this.mustEnrollMfa || !this.router) {
        return
      }
      const path = String(this.router.currentRoute?.value?.path ?? '')
      if (path !== '/login' && path !== '/reset-password') {
        void this.router.replace('/login').catch(() => {})
      }
    },
    async login(email, pass, t) {
      try {
        const response = await apiInstance.post(apiPaths.oauthLogin, {
          email: email,
          password: pass,
        })

        const challenge = extractMfaChallenge(response.data)
        if (challenge) {
          return {
            mfaRequired: true,
            token: challenge.token,
            expires: challenge.expires,
          }
        }

        const td = extractOAuthTokenPayload(response.data)
        this.applyTokensFromApi(td)
        this.applyMfaFlagsFromLogin(response.data)
        dismissSessionExpiredNotify()

        return { mfaRequired: false }
      } catch (error) {
        const st = error.response?.status ?? error.status
        switch (st) {
          case 401:
            throw new Error(t('invalidCredentials'))
          case 423:
            throw new Error(t('loginAccountLocked'))
          case 429:
            throw new Error(t('loginTooManyRequests'))
        }

        throw error
      }
    },
    async completeMfaLogin(challengeToken, code, t) {
      try {
        const response = await postMfaChallenge({
          mfaChallengeToken: challengeToken,
          code,
        })
        const td = extractOAuthTokenPayload(response)
        this.applyTokensFromApi(td)
        this.applyMfaFlagsFromLogin(response)
        dismissSessionExpiredNotify()

        return true
      } catch (error) {
        const st = error.response?.status ?? error.status
        switch (st) {
          case 401:
            throw new Error(t('loginMfaInvalidCode'))
          case 423:
            throw new Error(t('loginAccountLocked'))
          case 429:
            throw new Error(t('loginTooManyRequests'))
        }

        throw error
      }
    },
    async logout(router, t) {
      try {
        await apiInstance.post(apiPaths.logout)
      } catch (error) {
        const st = error.response?.status ?? error.status
        switch (st) {
          case 401:
            throw new Error(t('alreadySignOut'))
        }

        throw error
      } finally {
        this.clearSession()
        await router.push('/login')
      }
    },
    restoreSession() {
      const token = readStoredToken()
      const expireAt = readStoredExpireAt()
      const refreshToken = readStoredRefreshToken()
      if (token) {
        this.token = token
        this.expireAt = expireAt
        this.refreshToken = refreshToken
        this.mustEnrollMfa = readStoredMustEnrollMfa()
      }
    },
    clearSession() {
      this.token = null
      this.expireAt = null
      this.refreshToken = null
      this.mustEnrollMfa = false
      clearAuthLocalStorage()
    },
    init() {
      if (this._initialized) {
        return
      }
      this._initialized = true
      if (typeof window !== typeNames.undefined) {
        window.addEventListener('storage', event => {
          if (event.key === 'token' && event.newValue === null) {
            this.token = null
            this.expireAt = null
            this.refreshToken = null
            this.mustEnrollMfa = false
            if (this.router) {
              this.router.push('/login')
            }
          }
        })
      }
    },
  },
})
