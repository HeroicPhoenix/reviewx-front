export function formatLocalDateTime(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function formatMs(value?: number) {
  if (!value && value !== 0) return '-'
  if (value < 1000) return `${value} ms`
  const seconds = Math.round(value / 100) / 10
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`
}

export function formatRate(value?: number | string) {
  const numberValue = Number(value ?? 0)
  if (!Number.isFinite(numberValue)) return '0%'
  return `${Math.round(numberValue * 1000) / 10}%`
}

function trimNumberText(value: number) {
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100)
}

export function normalizeQuestionCorrectRateInput(value?: string) {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  const hasPercentSign = raw.includes('%')
  const numberValue = Number(raw.replace('%', '').trim())
  if (!Number.isFinite(numberValue)) return ''
  const percentValue = !hasPercentSign && numberValue > 0 && numberValue <= 1 ? numberValue * 100 : numberValue
  return trimNumberText(percentValue)
}

export function formatQuestionCorrectRate(value?: string) {
  const percentValue = normalizeQuestionCorrectRateInput(value)
  return percentValue ? `${percentValue}%` : ''
}
