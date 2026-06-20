import { defineStore } from 'pinia'
import { api } from '@/api'
import type { Me } from '@/types/api'

interface AuthState {
  token: string
  user: Me | null
  ready: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: localStorage.getItem('reviewx_token') || '',
    user: null,
    ready: false,
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.token),
    displayName: (state) => state.user?.nickName || state.user?.username || '未登录',
  },
  actions: {
    async login(username: string, password: string) {
      const result = await api.login(username, password)
      this.token = result.accessToken
      localStorage.setItem('reviewx_token', result.accessToken)
      await this.fetchMe()
    },
    async fetchMe() {
      if (!this.token) return
      this.user = await api.me()
      this.ready = true
    },
    async logout() {
      try {
        if (this.token) await api.logout()
      } finally {
        this.clearSession()
      }
    },
    clearSession() {
      this.token = ''
      this.user = null
      this.ready = false
      localStorage.removeItem('reviewx_token')
    },
  },
})
