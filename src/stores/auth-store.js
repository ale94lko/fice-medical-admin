import { defineStore } from 'pinia'
import { apiInstance } from 'boot/axios'
import { apiPaths, typeNames } from 'components/constants.js'
import { extractOAuthTokenPayload } from 'components/helpers.js'
import {
  clearAuthLocalStorage,
  readStoredExpireAt,
  readStoredRefreshToken,
  readStoredToken,
  writeStoredExpireAt,
  writeStoredRefreshToken,
  writeStoredToken,
} from '../utils/auth-local-storage.js'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    expireAt: null,
    refreshToken: null,
    _initialized: false,
  }),
  getters: {
    isAuthenticated: state => !!state.token,
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
    async login(email, pass, t) {
      try {
        const response = await apiInstance.post(apiPaths.oauthLogin, {
          email: email,
          password: pass,
        })

        const td = extractOAuthTokenPayload(response.data)
        this.applyTokensFromApi(td)

        return true
      } catch (error) {
        const st = error.response?.status ?? error.status
        switch (st) {
          case 401:
            throw new Error(t('invalidCredentials'))
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
      }
    },
    clearSession() {
      this.token = null
      this.expireAt = null
      this.refreshToken = null
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
            if (this.router) {
              this.router.push('/login')
            }
          }
        })
      }
    },
  },
})
