import { defineStore } from 'pinia'

const FONT_SIZE_KEY = 'reviewx_question_font_size'
const MIN_FONT_SIZE = 15
const MAX_FONT_SIZE = 24
const DEFAULT_FONT_SIZE = 18

function initialQuestionFontSize() {
  const value = Number(localStorage.getItem(FONT_SIZE_KEY))
  return Number.isFinite(value) && value >= MIN_FONT_SIZE && value <= MAX_FONT_SIZE
    ? value
    : DEFAULT_FONT_SIZE
}

export const usePreferencesStore = defineStore('preferences', {
  state: () => ({
    questionFontSize: initialQuestionFontSize(),
  }),
  getters: {
    minQuestionFontSize: () => MIN_FONT_SIZE,
    maxQuestionFontSize: () => MAX_FONT_SIZE,
  },
  actions: {
    changeQuestionFontSize(delta: number) {
      const next = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, this.questionFontSize + delta))
      this.questionFontSize = next
      localStorage.setItem(FONT_SIZE_KEY, String(next))
    },
  },
})
