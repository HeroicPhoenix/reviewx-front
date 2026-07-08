<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Search } from 'lucide-vue-next'
import { api } from '@/api'
import EmptyState from '@/components/EmptyState.vue'
import QuestionCard from '@/components/QuestionCard.vue'
import type { AnswerRecord, AnswerRecordStat, PageResult, Question } from '@/types/api'
import { formatMs, formatRate } from '@/utils/time'

const filters = reactive({
  questionId: '',
  isCorrect: '' as '' | number,
  startTime: '',
  endTime: '',
  pageNum: 1,
  pageSize: 10,
})
const page = ref<PageResult<AnswerRecord> | null>(null)
const stat = ref<AnswerRecordStat | null>(null)
const loading = ref(false)
const detailLoading = ref(false)
const detailOpen = ref(false)
const detail = ref<Question | null>(null)
const error = ref('')
const jumpPage = ref(1)

const totalPages = computed(() => {
  if (!page.value) return 1
  return Math.max(1, Math.ceil(page.value.total / page.value.pageSize))
})

function dateParam(value: string) {
  return value ? `${value}:00`.replace('T', ' ') : undefined
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [records, statResult] = await Promise.all([
      api.answerRecords({
        ...filters,
        startTime: dateParam(filters.startTime),
        endTime: dateParam(filters.endTime),
      }),
      api.answerRecordStat(),
    ])
    page.value = records
    stat.value = statResult
    jumpPage.value = records.pageNum
  } catch (e) {
    error.value = e instanceof Error ? e.message : '记录加载失败'
  } finally {
    loading.value = false
  }
}

async function search() {
  filters.pageNum = 1
  await load()
}

async function changePageSize() {
  filters.pageNum = 1
  await load()
}

async function goPage(pageNum: number) {
  const next = Math.min(totalPages.value, Math.max(1, pageNum))
  filters.pageNum = next
  jumpPage.value = next
  await load()
}

async function jumpToPage() {
  await goPage(Number(jumpPage.value) || 1)
}

async function openQuestionDetail(questionId: string) {
  detailOpen.value = true
  detailLoading.value = true
  detail.value = null
  error.value = ''
  try {
    detail.value = await api.questionDetail(questionId)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '题目详情加载失败'
    detailOpen.value = false
  } finally {
    detailLoading.value = false
  }
}

function closeQuestionDetail() {
  detailOpen.value = false
  detail.value = null
}

onMounted(load)
</script>

<template>
  <section class="page-stack">
    <div class="page-heading">
      <div>
        <p>答题记录</p>
        <h1>复盘历史作答表现</h1>
      </div>
    </div>

    <div class="metric-grid compact">
      <article class="metric-card glass-card"><span>总次数</span><strong>{{ stat?.totalCount ?? 0 }}</strong></article>
      <article class="metric-card glass-card"><span>正确</span><strong>{{ stat?.correctCount ?? 0 }}</strong></article>
      <article class="metric-card glass-card"><span>错误</span><strong>{{ stat?.wrongCount ?? 0 }}</strong></article>
      <article class="metric-card glass-card"><span>正确率</span><strong>{{ formatRate(stat?.correctRate) }}</strong></article>
    </div>

    <form class="filter-bar glass-card" @submit.prevent="search">
      <input v-model.trim="filters.questionId" placeholder="题目 ID" />
      <select v-model="filters.isCorrect">
        <option value="">全部结果</option>
        <option :value="1">正确</option>
        <option :value="0">错误</option>
      </select>
      <label class="compact-field">
        <span>作答开始时间</span>
        <input v-model="filters.startTime" type="datetime-local" />
      </label>
      <label class="compact-field">
        <span>作答结束时间</span>
        <input v-model="filters.endTime" type="datetime-local" />
      </label>
      <button class="primary-button" type="submit"><Search :size="17" />筛选</button>
    </form>

    <div v-if="error" class="notice error">{{ error }}</div>

    <div class="table-card glass-card">
      <EmptyState v-if="!loading && !page?.list?.length" title="暂无记录" />
      <div v-else class="responsive-table">
        <table class="record-table">
          <thead>
            <tr>
              <th>题目ID</th>
              <th>选择</th>
              <th>正确答案</th>
              <th>结果</th>
              <th>耗时</th>
              <th>作答开始时间</th>
              <th>作答结束时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in page?.list" :key="record.answerRecordId">
              <td>
                <button class="table-link" type="button" @click="openQuestionDetail(record.questionId)">
                  {{ record.questionId }}
                </button>
              </td>
              <td>{{ record.selectedAnswer?.join('、') }}</td>
              <td>{{ record.correctAnswer?.join('、') }}</td>
              <td><span class="status-pill" :class="{ ok: record.isCorrect }">{{ record.isCorrect ? '正确' : '错误' }}</span></td>
              <td>{{ formatMs(record.durationMs) }}</td>
              <td>{{ record.startTime || '-' }}</td>
              <td>{{ record.endTime || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="page" class="pager question-pager">
      <span class="pager-total">共 {{ page.total }} 条</span>
      <label class="pager-control">
        <span>每页</span>
        <select v-model.number="filters.pageSize" @change="changePageSize">
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
      </label>
      <button class="ghost-button" type="button" :disabled="filters.pageNum <= 1" @click="goPage(filters.pageNum - 1)">上一页</button>
      <span>{{ page.pageNum }} / {{ totalPages }}</span>
      <button class="ghost-button" type="button" :disabled="page.pageNum >= totalPages" @click="goPage(filters.pageNum + 1)">下一页</button>
      <form class="pager-control" @submit.prevent="jumpToPage">
        <span>跳至</span>
        <input v-model.number="jumpPage" min="1" :max="totalPages" type="number" />
        <button class="ghost-button" type="submit">跳转</button>
      </form>
    </div>

    <div v-if="detailOpen" class="modal-backdrop" @click.self="closeQuestionDetail">
      <div class="record-detail-dialog">
        <div class="modal-head glass-card">
          <div>
            <p>题目详情</p>
            <h2>{{ detailLoading ? '加载中...' : detail?.questionId }}</h2>
          </div>
          <button class="icon-button" type="button" @click="closeQuestionDetail">×</button>
        </div>
        <QuestionCard v-if="detail" :question="detail" readonly reveal />
        <div v-else class="glass-card empty-state">
          <strong>{{ detailLoading ? '加载中...' : '暂无详情' }}</strong>
        </div>
      </div>
    </div>
  </section>
</template>
