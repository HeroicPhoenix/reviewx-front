export interface ApiResponse<T> {
  code: number
  status: boolean
  message: string
  data: T
  timestamp: number
}

export interface PageResult<T> {
  total: number
  pageNum: number
  pageSize: number
  list: T[]
}

export interface LoginResult {
  accessToken: string
  tokenType: string
  expireIn: number
}

export interface Me {
  userId: number
  username: string
  nickName?: string
  roles: string[]
  permissions: string[]
}

export interface Question {
  questionId: string
  questionType?: number
  questionCategory?: string
  questionContent?: string
  questionImageBase64?: string
  option1?: string
  option2?: string
  option3?: string
  option4?: string
  option5?: string
  option6?: string
  option7?: string
  option8?: string
  answerContent?: string[]
  answerSource?: string
  questionYear?: string
  questionSource?: string
  correctRate?: string
}

export interface SubmitAnswerResult {
  answerRecordId: number
  questionId: string
  isCorrect: boolean
  selectedAnswer: string[]
  correctAnswer: string[]
  answerSource?: string
  durationMs: number
}

export interface AnswerRecord {
  answerRecordId: number
  questionId: string
  selectedAnswer: string[]
  correctAnswer: string[]
  isCorrect: boolean
  startTime?: string
  endTime?: string
  durationMs: number
}

export interface AnswerRecordStat {
  totalCount: number
  correctCount: number
  wrongCount: number
  correctRate: number
  averageDurationMs: number
}

export interface UserAccount {
  userId: number
  username: string
  nickName?: string
  userStatus: number
  createTime?: string
}

export interface ApiKeyItem {
  apiKeyId: number
  apiKeyName: string
  apiKeyPrefix: string
  apiKeyStatus: number
  expireTime?: string
  lastUsedTime?: string
  createTime?: string
}

export interface ApiKeyCreateResult extends ApiKeyItem {
  apiKey: string
}

export interface QuestionImportResult {
  totalFileCount?: number
  totalQuestionCount?: number
  successQuestionCount?: number
  failedQuestionCount?: number
  missingIdQuestionCount?: number
  totalCount?: number
  successCount?: number
  failureCount?: number
  failures?: unknown[]
  missingIdQuestions?: unknown[]
}
