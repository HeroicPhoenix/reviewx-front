import { http, request } from './http'
import type {
  AnswerRecord,
  AnswerRecordStat,
  ApiKeyCreateResult,
  ApiKeyItem,
  LoginResult,
  Me,
  PageResult,
  Question,
  QuestionImportResult,
  QuestionUpdatePayload,
  SubmitAnswerResult,
  UserAccount,
} from '@/types/api'

export interface QuestionFilters {
  keyword?: string
  questionType?: string
  questionYear?: string
  questionSource?: string
  pageNum?: number
  pageSize?: number
  size?: number
  randomScope?: 'all' | 'done' | 'undone'
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
  apiKeys: () => request<ApiKeyItem[]>(http.get('/api/apiKey/list')),
  createApiKey: (payload: { apiKeyName: string; expireTime?: string }) =>
    request<ApiKeyCreateResult>(http.post('/api/apiKey/create', payload)),
  disableApiKey: (apiKeyId: number) =>
    request<void>(http.post('/api/apiKey/disable', { apiKeyId })),
  deleteApiKey: (apiKeyId: number) =>
    request<void>(http.post('/api/apiKey/delete', { apiKeyId })),
  users: () => request<UserAccount[]>(http.get('/api/user/list')),
  createUser: (payload: { username: string; password: string; nickName?: string }) =>
    request<UserAccount>(http.post('/api/user/create', payload)),
  searchQuestions: (params: QuestionFilters) =>
    request<PageResult<Question>>(http.get('/api/question/search', { params })),
  questionTypes: () => request<string[]>(http.get('/api/question/typeList')),
  questionYears: () => request<string[]>(http.get('/api/question/yearList')),
  questionSources: () => request<string[]>(http.get('/api/question/sourceList')),
  questionDetail: (questionId: string) =>
    request<Question>(http.get('/api/question/detail', { params: { questionId } })),
  updateQuestion: (payload: QuestionUpdatePayload) =>
    request<Question>(http.post('/api/question/update', payload)),
  updateQuestionAnalysis: (payload: {
    questionId: string
    analysisContent?: string
    analysisImageBase64?: string
  }) => request<Question>(http.post('/api/question/updateAnalysis', payload)),
  importFromDocsZip: (file: File, clearBeforeImport = false) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('clearBeforeImport', String(clearBeforeImport))
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
