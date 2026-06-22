<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { DownloadCloud, Search } from 'lucide-vue-next'
import { api } from '@/api'
import EmptyState from '@/components/EmptyState.vue'
import QuestionCard from '@/components/QuestionCard.vue'
import type { PageResult, Question } from '@/types/api'

const filters = reactive({
  keyword: '',
  questionType: '',
  questionYear: '',
  questionSource: '',
  pageNum: 1,
  pageSize: 10,
})
const page = ref<PageResult<Question> | null>(null)
const detail = ref<Question | null>(null)
const loading = ref(false)
const detailLoading = ref(false)
const importing = ref(false)
const zipInput = ref<HTMLInputElement | null>(null)
const questionTypes = ref<string[]>([])
const error = ref('')
const importMessage = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    page.value = await api.searchQuestions(filters)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '题库加载失败'
  } finally {
    loading.value = false
  }
}

async function search() {
  filters.pageNum = 1
  await load()
}

async function openDetail(questionId: string) {
  detailLoading.value = true
  try {
    detail.value = await api.questionDetail(questionId)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '详情加载失败'
  } finally {
    detailLoading.value = false
  }
}

function openZipPicker() {
  if (importing.value) return
  zipInput.value?.click()
}

async function handleZipSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''

  if (!file) return
  if (!file.name.toLowerCase().endsWith('.zip')) {
    importMessage.value = ''
    error.value = '请选择 zip 文件'
    return
  }

  await importZip(file)
}

async function importZip(file: File) {
  if (importing.value) return
  importMessage.value = ''
  error.value = ''
  importing.value = true
  try {
    const result = await api.importFromDocsZip(file)
    importMessage.value = `导入完成：${result.successQuestionCount ?? 0}/${result.totalQuestionCount ?? 0} 道题成功，失败 ${result.failedQuestionCount ?? 0} 道`
    await loadQuestionTypes()
    await load()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '导入失败'
  } finally {
    importing.value = false
  }
}

async function loadQuestionTypes() {
  try {
    questionTypes.value = await api.questionTypes()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '题型加载失败'
  }
}

onMounted(async () => {
  await Promise.all([loadQuestionTypes(), load()])
})
</script>

<template>
  <section class="page-stack">
    <div class="page-heading">
      <div>
        <p>题库</p>
        <h1>搜索、查看答案和导入题目</h1>
      </div>
      <button class="ghost-button" type="button" :disabled="importing" @click="openZipPicker">
        <DownloadCloud :size="17" />
        {{ importing ? '导入中...' : '上传 zip 导入' }}
      </button>
      <input
        ref="zipInput"
        class="file-input"
        type="file"
        accept=".zip,application/zip,application/x-zip-compressed"
        @change="handleZipSelected"
      />
    </div>

    <form class="filter-bar glass-card" @submit.prevent="search">
      <input v-model.trim="filters.keyword" placeholder="关键词" />
      <select v-model="filters.questionType" aria-label="科目分类">
        <option value="">全部分类</option>
        <option v-for="type in questionTypes" :key="type" :value="type">{{ type }}</option>
      </select>
      <input v-model.trim="filters.questionYear" placeholder="年份" />
      <input v-model.trim="filters.questionSource" placeholder="来源" />
      <button class="primary-button" type="submit"><Search :size="17" />搜索</button>
    </form>

    <div v-if="error" class="notice error">{{ error }}</div>
    <div v-if="importMessage" class="notice">{{ importMessage }}</div>

    <div class="split-grid">
      <div class="list-stack">
        <EmptyState v-if="!loading && !page?.list?.length" title="暂无题目" description="调整筛选条件或先导入题库。" />
        <article v-for="item in page?.list" :key="item.questionId" class="question-row glass-card">
          <div>
            <div class="question-meta">
              <span>{{ item.questionCategory || '题目' }}</span>
              <span>{{ item.questionType === 2 ? '多选' : '单选' }}</span>
              <span>{{ item.questionYear || '未知年份' }}</span>
              <span>{{ item.questionSource || '未知来源' }}</span>
            </div>
            <strong>{{ item.questionContent || item.questionId }}</strong>
          </div>
          <button class="ghost-button" type="button" @click="openDetail(item.questionId)">查看</button>
        </article>

        <div v-if="page" class="pager">
          <button class="ghost-button" type="button" :disabled="filters.pageNum <= 1" @click="filters.pageNum--; load()">上一页</button>
          <span>{{ page.pageNum }} / {{ Math.max(1, Math.ceil(page.total / page.pageSize)) }}</span>
          <button class="ghost-button" type="button" :disabled="page.pageNum >= Math.ceil(page.total / page.pageSize)" @click="filters.pageNum++; load()">下一页</button>
        </div>
      </div>

      <div class="detail-pane">
        <EmptyState v-if="!detail" :title="detailLoading ? '加载中...' : '选择一道题查看详情'" />
        <QuestionCard v-else :question="detail" readonly reveal />
      </div>
    </div>
  </section>
</template>
