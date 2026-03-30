import { defineStore } from 'pinia'
import { apiInstance } from 'boot/axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    expireAt: null,
    _initialized: false
  }),
  getters: {
    isAuthenticated: (state) => !!state.token
  },
  actions: {
    async login(email, pass, t) {
      try {
        const response = await apiInstance.post('/oauth/v1/login', {
          email: email,
          password: pass
        })

        this.token = response.data.token
        this.expireAt = response.data.expiration

        localStorage.setItem('token', this.token)
        localStorage.setItem('expireAt', this.expireAt)

        return true
      } catch (error) {
        switch (error.status) {
          case 401:
            throw new Error(t('invalidCredentials'))
        }

        throw error
      }
    },
    async logout(router) {
      await apiInstance.post('/logout')

      this.clearSession()
      await router.push('/login')
    },
    restoreSession() {
      const token = localStorage.getItem('token')
      const expireAt = localStorage.getItem('expireAt')

      if (token && expireAt && new Date() < new Date(expireAt)) {
        this.token = token
        this.expireAt = expireAt
      }
    },
    clearSession() {
      this.token = null
      this.expireAt = null
      localStorage.removeItem('token')
      localStorage.removeItem('expireAt')
    },
    init() {
      if (this._initialized) {
        return
      }
      this._initialized = true
      if (typeof window !== 'undefined') {
        window.addEventListener('storage', (event) => {
          if (event.key === 'token' && event.newValue === null) {
            this.token = null
            this.expireAt = null
            if (this.router) {
              this.router.push('/login')
            }
          }
        })
      }
    }
  }
})
