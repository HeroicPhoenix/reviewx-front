import { defineStore } from 'pinia'
import type { Question, SubmitAnswerResult } from '@/types/api'
import { formatLocalDateTime } from '@/utils/time'

export type PracticeMode = 'random' | 'order' | 'wrong'
export type RandomScope = 'all' | 'done' | 'undone'
export type AnalysisScope = 'all' | 'analyzed' | 'unanalyzed'

export interface PracticeFilters {
  questionType: string
  questionYear: string
  questionSource: string
  size: number
  pageNum: number
  pageSize: number
}

export interface AnalysisForm {
  content: string
  imageBase64: string
}

interface PracticeState {
  mode: PracticeMode
  randomScope: RandomScope
  analysisScope: AnalysisScope
  filters: PracticeFilters
  questions: Question[]
  currentIndex: number
  selected: string[]
  startTime: string
  result: SubmitAnswerResult | null
  analysisOpen: boolean
  analysisMessage: string
  analysisForm: AnalysisForm
}

export const usePracticeStore = defineStore('practice', {
  state: (): PracticeState => ({
    mode: 'random',
    randomScope: 'all',
    analysisScope: 'all',
    filters: {
      questionType: '',
      questionYear: '',
      questionSource: '',
      size: 10,
      pageNum: 1,
      pageSize: 10,
    },
    questions: [],
    currentIndex: 0,
    selected: [],
    startTime: formatLocalDateTime(),
    result: null,
    analysisOpen: false,
    analysisMessage: '',
    analysisForm: {
      content: '',
      imageBase64: '',
    },
  }),
  actions: {
    resetAnswerState() {
      this.selected = []
      this.result = null
      this.analysisOpen = false
      this.analysisMessage = ''
      this.startTime = formatLocalDateTime()
      this.analysisForm.content = ''
      this.analysisForm.imageBase64 = ''
    },
    setCurrentIndex(index: number) {
      this.currentIndex = index
    },
    fillAnalysisForm(question?: Question) {
      this.analysisForm.content = question?.analysisContent ?? ''
      this.analysisForm.imageBase64 = question?.analysisImageBase64 ?? ''
    },
    clearSession() {
      this.mode = 'random'
      this.randomScope = 'all'
      this.analysisScope = 'all'
      this.filters = {
        questionType: '',
        questionYear: '',
        questionSource: '',
        size: 10,
        pageNum: 1,
        pageSize: 10,
      }
      this.questions = []
      this.currentIndex = 0
      this.resetAnswerState()
    },
  },
})
