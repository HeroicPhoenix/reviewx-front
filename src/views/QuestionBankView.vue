<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
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
const importDialogOpen = ref(false)
const importDragActive = ref(false)
const importFile = ref<File | null>(null)
const clearBeforeImport = ref(false)
const questionTypes = ref<string[]>([])
const error = ref('')
const importMessage = ref('')
const jumpPage = ref(1)

const totalPages = computed(() => {
  if (!page.value) return 1
  return Math.max(1, Math.ceil(page.value.total / page.value.pageSize))
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    page.value = await api.searchQuestions(filters)
    jumpPage.value = page.value.pageNum
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

function openImportDialog() {
  if (importing.value) return
  importDialogOpen.value = true
  importMessage.value = ''
  error.value = ''
}

function closeImportDialog() {
  if (importing.value) return
  importDialogOpen.value = false
  importDragActive.value = false
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
  selectImportFile(file)
}

function selectImportFile(file: File) {
  if (!file.name.toLowerCase().endsWith('.zip')) {
    importMessage.value = ''
    error.value = '请选择 zip 文件'
    return
  }

  error.value = ''
  importFile.value = file
}

function handleDragEnter() {
  if (importing.value) return
  importDragActive.value = true
}

function handleDragLeave() {
  importDragActive.value = false
}

function handleDrop(event: DragEvent) {
  importDragActive.value = false
  if (importing.value) return
  const file = event.dataTransfer?.files?.[0]
  if (file) selectImportFile(file)
}

async function submitImport() {
  if (!importFile.value) {
    error.value = '请先选择 zip 文件'
    return
  }
  await importZip(importFile.value)
}

async function importZip(file: File) {
  if (importing.value) return
  importMessage.value = ''
  error.value = ''
  importing.value = true
  try {
    const result = await api.importFromDocsZip(file, clearBeforeImport.value)
    importMessage.value = `导入完成：${result.successQuestionCount ?? 0}/${result.totalQuestionCount ?? 0} 道题成功，失败 ${result.failedQuestionCount ?? 0} 道`
    importDialogOpen.value = false
    importFile.value = null
    clearBeforeImport.value = false
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
      <button class="ghost-button" type="button" :disabled="importing" @click="openImportDialog">
        <DownloadCloud :size="17" />
        {{ importing ? '导入中...' : '上传 zip 导入' }}
      </button>
    </div>

    <div v-if="importDialogOpen" class="modal-backdrop" @click.self="closeImportDialog">
      <div class="import-dialog glass-card">
        <div class="modal-head">
          <div>
            <p>导入题库</p>
            <h2>上传 ZIP 文件</h2>
          </div>
          <button class="icon-button" type="button" :disabled="importing" @click="closeImportDialog">×</button>
        </div>

        <button
          class="zip-drop-zone"
          :class="{ active: importDragActive }"
          type="button"
          :disabled="importing"
          @click="openZipPicker"
          @dragover.prevent="handleDragEnter"
          @dragenter.prevent="handleDragEnter"
          @dragleave.prevent="handleDragLeave"
          @drop.prevent="handleDrop"
        >
          <DownloadCloud :size="34" />
          <strong>{{ importFile?.name || '点击选择 ZIP 文件，或拖拽到这里' }}</strong>
          <span>{{ importFile ? `${(importFile.size / 1024 / 1024).toFixed(2)} MB` : '仅支持 .zip 文件' }}</span>
        </button>

        <label class="check-row">
          <input v-model="clearBeforeImport" type="checkbox" :disabled="importing" />
          <span>导入前清除原本题库内容</span>
        </label>

        <input
          ref="zipInput"
          class="file-input"
          type="file"
          accept=".zip,application/zip,application/x-zip-compressed"
          @change="handleZipSelected"
        />

        <div class="modal-actions">
          <button class="ghost-button" type="button" :disabled="importing" @click="closeImportDialog">取消</button>
          <button class="primary-button" type="button" :disabled="!importFile || importing" @click="submitImport">
            {{ importing ? '导入中...' : '导入' }}
          </button>
        </div>
      </div>
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
              <span>{{ item.questionCategory || '未分类' }}</span>
              <span>{{ item.questionType === 2 ? '多选' : '单选' }}</span>
              <span>{{ item.questionYear || '未知年份' }}</span>
              <span>{{ item.questionSource || '未知来源' }}</span>
            </div>
            <strong>{{ item.questionContent || item.questionId }}</strong>
          </div>
          <button class="ghost-button" type="button" @click="openDetail(item.questionId)">查看</button>
        </article>

        <div v-if="page" class="pager question-pager">
          <span class="pager-total">共 {{ page.total }} 题</span>
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
      </div>

      <div class="detail-pane">
        <EmptyState v-if="!detail" :title="detailLoading ? '加载中...' : '选择一道题查看详情'" />
        <QuestionCard v-else :question="detail" readonly reveal />
      </div>
    </div>
  </section>
</template>
