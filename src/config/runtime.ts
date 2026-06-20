declare global {
  interface Window {
    __APP_CONFIG__?: {
      API_BASE_URL?: string
      USE_MOCK?: boolean | string
      GATEWAY_UPSTREAM?: string
      ICP_FOOTER_VISIBLE?: boolean | string
      ICP_TEXT?: string
      ICP_URL?: string
    }
  }
}

const config = window.__APP_CONFIG__ || {}

function parseBoolean(value: boolean | string | undefined, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value !== 'string') return fallback
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())
}

export const API_BASE_URL = config.API_BASE_URL ?? '/api'
export const USE_MOCK = parseBoolean(config.USE_MOCK, false)
export const GATEWAY_UPSTREAM = config.GATEWAY_UPSTREAM ?? 'http://host.docker.internal:58080'
export const ICP_FOOTER_VISIBLE = parseBoolean(config.ICP_FOOTER_VISIBLE, true)
export const ICP_TEXT = config.ICP_TEXT ?? ''
export const ICP_URL = config.ICP_URL ?? 'https://beian.miit.gov.cn/'
