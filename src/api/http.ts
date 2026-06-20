import axios, { AxiosError } from 'axios'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'
import type { ApiResponse } from '@/types/api'

export const http = axios.create({
  baseURL: '',
  timeout: 15000,
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('reviewx_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  (response) => {
    const payload = response.data as ApiResponse<unknown>
    if (payload && payload.status === false) {
      throw new Error(payload.message || '请求失败')
    }
    return response
  },
  (error: AxiosError<ApiResponse<unknown>>) => {
    const status = error.response?.status
    const message = error.response?.data?.message || error.message || '网络异常'
    if (status === 401 || status === 403) {
      const auth = useAuthStore()
      auth.clearSession()
      router.replace({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
    }
    return Promise.reject(new Error(message))
  },
)

export async function request<T>(promise: Promise<{ data: ApiResponse<T> }>) {
  const response = await promise
  if (response.data.status === false) throw new Error(response.data.message)
  return response.data.data
}
