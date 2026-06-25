<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Check, RotateCcw, Send } from 'lucide-vue-next'
import { api } from '@/api'
import EmptyState from '@/components/EmptyState.vue'
import QuestionCard from '@/components/QuestionCard.vue'
import type { Question, SubmitAnswerResult } from '@/types/api'
import { formatLocalDateTime, formatMs } from '@/utils/time'

type Mode = 'random' | 'order' | 'wrong'
type RandomScope = 'all' | 'done' | 'undone'

const mode = ref<Mode>('random')
const randomScope = ref<RandomScope>('all')
const filters = reactive({
  questionType: '',
  questionYear: '',
  questionSource: '',
  size: 10,
  pageNum: 1,
  pageSize: 10,
})
const questions = ref<Question[]>([])
const currentIndex = ref(0)
const selected = ref<string[]>([])
const startTime = ref(formatLocalDateTime())
const result = ref<SubmitAnswerResult | null>(null)
const loading = ref(false)
const submitting = ref(false)
const questionTypes = ref<string[]>([])
const error = ref('')

const current = computed(() => questions.value[currentIndex.value])
const progress = computed(() => questions.value.length ? `${currentIndex.value + 1} / ${questions.value.length}` : '0 / 0')

function resetAnswerState() {
  selected.value = []
  result.value = null
  startTime.value = formatLocalDateTime()
}

async function loadQuestions() {
  loading.value = true
  error.value = ''
  resetAnswerState()
  try {
    if (mode.value === 'random') questions.value = await api.randomList({ ...filters, randomScope: randomScope.value })
    if (mode.value === 'wrong') questions.value = await api.wrongList(filters)
    if (mode.value === 'order') {
      const page = await api.orderList(filters)
      questions.value = page.list
    }
    currentIndex.value = 0
  } catch (e) {
    error.value = e instanceof Error ? e.message : '取题失败'
  } finally {
    loading.value = false
  }
}

function toggleOption(option: string) {
  if (result.value) return
  if (current.value?.questionType === 1) {
    selected.value = selected.value.includes(option) ? [] : [option]
    return
  }
  if (selected.value.includes(option)) {
    selected.value = selected.value.filter((item) => item !== option)
  } else {
    selected.value = [...selected.value, option].sort()
  }
}

async function submit() {
  if (!current.value || !selected.value.length) return
  submitting.value = true
  error.value = ''
  try {
    result.value = await api.submitAnswer({
      questionId: current.value.questionId,
      selectedAnswer: selected.value,
      startTime: startTime.value,
      endTime: formatLocalDateTime(),
    })
  } catch (e) {
    error.value = e instanceof Error ? e.message : '提交失败'
  } finally {
    submitting.value = false
  }
}

function nextQuestion(step: number) {
  const next = currentIndex.value + step
  if (next < 0 || next >= questions.value.length) return
  currentIndex.value = next
  resetAnswerState()
}

async function loadQuestionTypes() {
  try {
    questionTypes.value = await api.questionTypes()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '题型加载失败'
  }
}

onMounted(loadQuestionTypes)
</script>

<template>
  <section class="page-stack">
    <div class="page-heading">
      <div>
        <p>刷题</p>
        <h1>随机、顺序或错题训练</h1>
      </div>
      <button class="primary-button" type="button" @click="loadQuestions">
        <RotateCcw :size="17" />
        {{ loading ? '加载中...' : '取题' }}
      </button>
    </div>

    <div class="practice-controls glass-card">
      <div class="segmented">
        <button type="button" :class="{ active: mode === 'random' }" @click="mode = 'random'">随机</button>
        <button type="button" :class="{ active: mode === 'order' }" @click="mode = 'order'">顺序</button>
        <button type="button" :class="{ active: mode === 'wrong' }" @click="mode = 'wrong'">错题</button>
      </div>
      <select v-model="filters.questionType" aria-label="科目分类">
        <option value="">全部分类</option>
        <option v-for="type in questionTypes" :key="type" :value="type">{{ type }}</option>
      </select>
      <input v-model.trim="filters.questionYear" placeholder="年份" />
      <input v-model.trim="filters.questionSource" placeholder="来源" />
      <input v-if="mode !== 'order'" v-model.number="filters.size" min="1" max="50" type="number" placeholder="数量" />
      <input v-if="mode === 'order'" v-model.number="filters.pageNum" min="1" type="number" placeholder="页码" />
    </div>

    <div v-if="mode === 'random'" class="random-scope-panel glass-card">
      <div class="segmented random-scope">
        <button type="button" :class="{ active: randomScope === 'all' }" @click="randomScope = 'all'">全部</button>
        <button type="button" :class="{ active: randomScope === 'done' }" @click="randomScope = 'done'">已做</button>
        <button type="button" :class="{ active: randomScope === 'undone' }" @click="randomScope = 'undone'">未做</button>
      </div>
    </div>

    <div v-if="error" class="notice error">{{ error }}</div>

    <div class="practice-layout">
      <div class="practice-main">
        <EmptyState v-if="!current" title="还没有题目" description="选择模式后点击取题。" />
        <QuestionCard v-else :question="current" :selected="selected" :readonly="Boolean(result)" @select="toggleOption" />
      </div>

      <aside class="practice-side glass-card">
        <span class="soft-label">进度</span>
        <strong>{{ progress }}</strong>
        <div v-if="result" class="result-box" :class="{ ok: result.isCorrect }">
          <Check :size="18" />
          <span>{{ result.isCorrect ? '回答正确' : '回答错误' }}</span>
          <small>正确答案：{{ result.correctAnswer.join('、') }}</small>
          <small>耗时：{{ formatMs(result.durationMs) }}</small>
        </div>
        <button class="primary-button wide" type="button" :disabled="!selected.length || submitting || Boolean(result)" @click="submit">
          <Send :size="17" />
          {{ submitting ? '提交中...' : '提交答案' }}
        </button>
        <div class="pager">
          <button class="ghost-button" type="button" :disabled="currentIndex <= 0" @click="nextQuestion(-1)">上一题</button>
          <button class="ghost-button" type="button" :disabled="currentIndex >= questions.length - 1" @click="nextQuestion(1)">下一题</button>
        </div>
      </aside>
    </div>
  </section>
</template>
