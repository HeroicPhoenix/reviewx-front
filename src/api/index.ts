import { http, request } from './http'
import type {
  AnswerRecord,
  AnswerRecordStat,
  LoginResult,
  Me,
  PageResult,
  Question,
  QuestionImportResult,
  SubmitAnswerResult,
} from '@/types/api'

export interface QuestionFilters {
  keyword?: string
  questionType?: string
  questionYear?: string
  questionSource?: string
  pageNum?: number
  pageSize?: number
  size?: number
}

export interface RecordFilters {
  questionId?: string
  isCorrect?: number | ''
  startTime?: string
  endTime?: string
  pageNum?: number
  pageSize?: number
}

export const api = {
  login: (username: string, password: string) =>
    request<LoginResult>(http.post('/api/auth/login', { username, password })),
  me: () => request<Me>(http.get('/api/auth/me')),
  logout: () => request<void>(http.post('/api/auth/logout')),
  changePassword: (oldPassword: string, newPassword: string) =>
    request<void>(http.post('/api/auth/changePassword', { oldPassword, newPassword })),
  searchQuestions: (params: QuestionFilters) =>
    request<PageResult<Question>>(http.get('/api/question/search', { params })),
  questionTypes: () => request<string[]>(http.get('/api/question/typeList')),
  questionDetail: (questionId: string) =>
    request<Question>(http.get('/api/question/detail', { params: { questionId } })),
  importFromDocsZip: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return request<QuestionImportResult>(
      http.post('/api/question/importFromDocsZip', formData, { timeout: 120000 }),
    )
  },
  randomList: (params: QuestionFilters) =>
    request<Question[]>(http.get('/api/practice/randomList', { params })),
  orderList: (params: QuestionFilters) =>
    request<PageResult<Question>>(http.get('/api/practice/orderList', { params })),
  wrongList: (params: QuestionFilters) =>
    request<Question[]>(http.get('/api/practice/wrongList', { params })),
  submitAnswer: (payload: {
    questionId: string
    selectedAnswer: string[]
    startTime: string
    endTime: string
  }) => request<SubmitAnswerResult>(http.post('/api/practice/submitAnswer', payload)),
  answerRecords: (params: RecordFilters) =>
    request<PageResult<AnswerRecord>>(http.get('/api/answerRecord/listPage', { params })),
  answerRecordStat: () => request<AnswerRecordStat>(http.get('/api/answerRecord/stat')),
}
