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
  questionJoinDate: string
  size: number
  pageNum: number
  pageSize: number
}

export interface AnalysisForm {
  content: string
  imageBase64: string
}

interface PracticeAnswerState {
  selected: string[]
  startTime: string
  result: SubmitAnswerResult | null
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
  answerStates: Record<string, PracticeAnswerState>
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
      questionJoinDate: '',
      size: 10,
      pageNum: 1,
      pageSize: 10,
    },
    questions: [],
    currentIndex: 0,
    selected: [],
    startTime: formatLocalDateTime(),
    result: null,
    answerStates: {},
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
    resetPracticeRun() {
      this.answerStates = {}
      this.currentIndex = 0
      this.resetAnswerState()
    },
    saveAnswerState(question?: Question) {
      if (!question?.questionId || !this.result) return
      this.answerStates[question.questionId] = {
        selected: [...this.selected],
        startTime: this.startTime,
        result: { ...this.result, selectedAnswer: [...this.result.selectedAnswer], correctAnswer: [...this.result.correctAnswer] },
      }
    },
    clearAnswerState(question?: Question) {
      if (!question?.questionId) return
      delete this.answerStates[question.questionId]
    },
    loadAnswerState(question?: Question) {
      this.analysisOpen = false
      this.analysisMessage = ''
      this.analysisForm.content = ''
      this.analysisForm.imageBase64 = ''
      if (!question?.questionId) {
        this.selected = []
        this.result = null
        this.startTime = formatLocalDateTime()
        return
      }
      const state = this.answerStates[question.questionId]
      this.selected = state ? [...state.selected] : []
      this.result = state?.result ? { ...state.result, selectedAnswer: [...state.result.selectedAnswer], correctAnswer: [...state.result.correctAnswer] } : null
      this.startTime = state?.result ? state.startTime : formatLocalDateTime()
    },
    setCurrentQuestion(index: number, question?: Question) {
      this.currentIndex = index
      this.loadAnswerState(question)
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
        questionJoinDate: '',
        size: 10,
        pageNum: 1,
        pageSize: 10,
      }
      this.questions = []
      this.currentIndex = 0
      this.answerStates = {}
      this.resetAnswerState()
    },
  },
})
