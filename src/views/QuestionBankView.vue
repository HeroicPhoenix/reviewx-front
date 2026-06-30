<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { DownloadCloud, ImagePlus, Minus, Pencil, Plus, Search, Trash2 } from 'lucide-vue-next'
import { api } from '@/api'
import EmptyState from '@/components/EmptyState.vue'
import QuestionCard from '@/components/QuestionCard.vue'
import type { PageResult, Question, QuestionUpdatePayload } from '@/types/api'
import { normalizeQuestionCorrectRateInput } from '@/utils/time'

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
const questionImageInput = ref<HTMLInputElement | null>(null)
const analysisImageInput = ref<HTMLInputElement | null>(null)
const importDialogOpen = ref(false)
const importDragActive = ref(false)
const importFile = ref<File | null>(null)
const clearBeforeImport = ref(false)
const questionTypes = ref<string[]>([])
const questionYears = ref<string[]>([])
const questionSources = ref<string[]>([])
const error = ref('')
const importMessage = ref('')
const jumpPage = ref(1)
const editDialogOpen = ref(false)
const editLoading = ref(false)
const editSaving = ref(false)
const editError = ref('')
const editOptionCount = ref(4)

const editForm = reactive({
  questionId: '',
  questionCategory: '',
  questionContent: '',
  questionImageBase64: '',
  option1: '',
  option2: '',
  option3: '',
  option4: '',
  option5: '',
  option6: '',
  option7: '',
  option8: '',
  answerContent: [] as string[],
  answerSource: '',
  analysisContent: '',
  analysisImageBase64: '',
  questionYear: '',
  questionSource: '',
  correctRate: '',
})

const optionFields = [
  { key: 'option1', label: 'A' },
  { key: 'option2', label: 'B' },
  { key: 'option3', label: 'C' },
  { key: 'option4', label: 'D' },
  { key: 'option5', label: 'E' },
  { key: 'option6', label: 'F' },
  { key: 'option7', label: 'G' },
  { key: 'option8', label: 'H' },
] as const

type OptionKey = (typeof optionFields)[number]['key']

const visibleOptionFields = computed(() => optionFields.slice(0, editOptionCount.value))

const editQuestionImageSrc = computed(() => imageSrc(editForm.questionImageBase64))
const editAnalysisImageSrc = computed(() => imageSrc(editForm.analysisImageBase64))

const editCategoryOptions = computed(() => {
  const categories = [...questionTypes.value]
  if (editForm.questionCategory && !categories.includes(editForm.questionCategory)) {
    categories.unshift(editForm.questionCategory)
  }
  return categories
})

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

async function openEdit(questionId: string) {
  editDialogOpen.value = true
  editLoading.value = true
  editError.value = ''
  error.value = ''
  try {
    const question = await api.questionDetail(questionId)
    fillEditForm(question)
  } catch (e) {
    editError.value = e instanceof Error ? e.message : '题目加载失败'
  } finally {
    editLoading.value = false
  }
}

function closeEditDialog() {
  if (editSaving.value) return
  editDialogOpen.value = false
  editError.value = ''
}

function fillEditForm(question: Question) {
  editForm.questionId = question.questionId
  editForm.questionCategory = question.questionCategory ?? ''
  editForm.questionContent = question.questionContent ?? ''
  editForm.questionImageBase64 = question.questionImageBase64 ?? ''
  editForm.option1 = question.option1 ?? ''
  editForm.option2 = question.option2 ?? ''
  editForm.option3 = question.option3 ?? ''
  editForm.option4 = question.option4 ?? ''
  editForm.option5 = question.option5 ?? ''
  editForm.option6 = question.option6 ?? ''
  editForm.option7 = question.option7 ?? ''
  editForm.option8 = question.option8 ?? ''
  editForm.answerContent = [...(question.answerContent ?? [])]
  editForm.answerSource = question.answerSource ?? ''
  editForm.analysisContent = question.analysisContent ?? ''
  editForm.analysisImageBase64 = question.analysisImageBase64 ?? ''
  editForm.questionYear = question.questionYear ?? ''
  editForm.questionSource = question.questionSource ?? ''
  editForm.correctRate = normalizeQuestionCorrectRateInput(question.correctRate)
  const lastFilledOption = optionFields.reduce((lastIndex, option, index) => {
    return question[option.key]?.trim() ? index : lastIndex
  }, -1)
  editOptionCount.value = Math.max(4, lastFilledOption + 1)
}

function addOption() {
  editOptionCount.value = Math.min(optionFields.length, editOptionCount.value + 1)
}

function removeOption() {
  if (editOptionCount.value <= 4) return
  const removedOption = optionFields[editOptionCount.value - 1]
  editForm[removedOption.key] = ''
  editForm.answerContent = editForm.answerContent.filter((answer) => answer !== removedOption.label)
  editOptionCount.value -= 1
}

function toggleAnswer(label: string) {
  if (editForm.answerContent.includes(label)) {
    editForm.answerContent = editForm.answerContent.filter((item) => item !== label)
    return
  }
  editForm.answerContent = [...editForm.answerContent, label].sort()
}

function keepDigits(value: string) {
  return value.replace(/\D/g, '')
}

function handleEditYearInput() {
  editForm.questionYear = keepDigits(editForm.questionYear).slice(0, 4)
}

function handleCorrectRateInput() {
  const cleaned = editForm.correctRate.replace(/[^\d.]/g, '')
  const [integerPart, ...decimalParts] = cleaned.split('.')
  editForm.correctRate = decimalParts.length ? `${integerPart}.${decimalParts.join('')}` : integerPart
}

function parsePercentInput(value: string) {
  const raw = value.trim()
  if (!raw) return { valid: true, value: '' }
  if (!/^\d+(\.\d+)?$/.test(raw)) return { valid: false, value: '' }

  const numberValue = Number(raw)
  if (!Number.isFinite(numberValue) || numberValue < 0 || numberValue > 100) {
    return { valid: false, value: '' }
  }

  return { valid: true, value: normalizeQuestionCorrectRateInput(raw) }
}

function imageSrc(base64?: string) {
  const value = base64?.trim()
  if (!value) return ''
  return value.startsWith('data:') ? value : `data:image/png;base64,${value}`
}

function openQuestionImagePicker() {
  questionImageInput.value?.click()
}

function openAnalysisImagePicker() {
  analysisImageInput.value?.click()
}

async function handleQuestionImageSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''

  if (!file) return
  if (!file.type.startsWith('image/')) {
    editError.value = '请选择图片文件'
    return
  }

  try {
    editForm.questionImageBase64 = await readFileAsDataUrl(file)
    editError.value = ''
  } catch (e) {
    editError.value = e instanceof Error ? e.message : '图片读取失败'
  }
}

async function handleAnalysisImageSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''

  if (!file) return
  if (!file.type.startsWith('image/')) {
    editError.value = '请选择图片文件'
    return
  }

  try {
    editForm.analysisImageBase64 = await readFileAsDataUrl(file)
    editError.value = ''
  } catch (e) {
    editError.value = e instanceof Error ? e.message : '图片读取失败'
  }
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('图片读取失败'))
    reader.readAsDataURL(file)
  })
}

function clearQuestionImage() {
  editForm.questionImageBase64 = ''
}

function clearAnalysisImage() {
  editForm.analysisImageBase64 = ''
}

function optionalValue(value: string) {
  const next = value.trim()
  return next || undefined
}

async function saveEdit() {
  editError.value = ''
  const visibleAnswerLabels = visibleOptionFields.value.map((option) => option.label)
  const answers = editForm.answerContent.filter((answer) => visibleAnswerLabels.some((label) => label === answer))
  if (!editForm.questionContent.trim()) {
    editError.value = '题干不能为空'
    return
  }
  if (!answers.length) {
    editError.value = '答案不能为空'
    return
  }
  const correctRate = parsePercentInput(editForm.correctRate)
  if (!correctRate.valid) {
    editError.value = '机构正确率必须是 0 到 100 之间的数字百分比'
    return
  }

  const payload: QuestionUpdatePayload = {
    questionId: editForm.questionId,
    questionCategory: optionalValue(editForm.questionCategory),
    questionContent: editForm.questionContent.trim(),
    option1: editOptionCount.value >= 1 ? editForm.option1.trim() : '',
    option2: editOptionCount.value >= 2 ? editForm.option2.trim() : '',
    option3: editOptionCount.value >= 3 ? editForm.option3.trim() : '',
    option4: editOptionCount.value >= 4 ? editForm.option4.trim() : '',
    option5: editOptionCount.value >= 5 ? editForm.option5.trim() : '',
    option6: editOptionCount.value >= 6 ? editForm.option6.trim() : '',
    option7: editOptionCount.value >= 7 ? editForm.option7.trim() : '',
    option8: editOptionCount.value >= 8 ? editForm.option8.trim() : '',
    answerContent: answers,
    answerSource: optionalValue(editForm.answerSource),
    analysisContent: editForm.analysisContent.trim(),
    analysisImageBase64: editForm.analysisImageBase64.trim(),
    questionImageBase64: editForm.questionImageBase64.trim(),
    questionYear: optionalValue(editForm.questionYear),
    questionSource: optionalValue(editForm.questionSource),
    correctRate: correctRate.value ? `${correctRate.value}%` : undefined,
  }

  editSaving.value = true
  try {
    const saved = await api.updateQuestion(payload)
    importMessage.value = '题目已保存'
    editDialogOpen.value = false
    if (detail.value?.questionId === saved.questionId) {
      detail.value = saved
    }
    await loadFilterOptions()
    await load()
  } catch (e) {
    editError.value = e instanceof Error ? e.message : '保存失败'
  } finally {
    editSaving.value = false
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
    await loadFilterOptions()
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

async function loadQuestionYears() {
  try {
    questionYears.value = await api.questionYears()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '年份加载失败'
  }
}

async function loadQuestionSources() {
  try {
    questionSources.value = await api.questionSources()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '来源加载失败'
  }
}

async function loadFilterOptions() {
  await Promise.all([loadQuestionTypes(), loadQuestionYears(), loadQuestionSources()])
}

onMounted(async () => {
  await Promise.all([loadFilterOptions(), load()])
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

    <div v-if="editDialogOpen" class="modal-backdrop" @click.self="closeEditDialog">
      <form class="edit-dialog glass-card" @submit.prevent="saveEdit">
        <div class="modal-head">
          <div>
            <p>编辑题目</p>
            <h2>{{ editForm.questionId || '题目详情' }}</h2>
          </div>
          <button class="icon-button" type="button" :disabled="editSaving" @click="closeEditDialog">×</button>
        </div>

        <EmptyState v-if="editLoading" title="加载中..." description="正在读取题目详情。" />
        <template v-else>
          <div class="edit-grid">
            <label>
              <span>题目ID</span>
              <input v-model="editForm.questionId" disabled />
            </label>
            <label>
              <span>题目分类</span>
              <select v-model="editForm.questionCategory">
                <option value="">未分类</option>
                <option v-for="type in editCategoryOptions" :key="type" :value="type">{{ type }}</option>
              </select>
            </label>
            <label>
              <span>年份</span>
              <input v-model.trim="editForm.questionYear" inputmode="numeric" maxlength="4" placeholder="例如：2024" @input="handleEditYearInput" />
            </label>
            <label>
              <span>出处</span>
              <input v-model.trim="editForm.questionSource" placeholder="例如：国考 / 北京市考" />
            </label>
            <label>
              <span>机构正确率（%）</span>
              <input
                v-model.trim="editForm.correctRate"
                type="number"
                inputmode="decimal"
                min="0"
                max="100"
                step="0.01"
                placeholder="例如：49"
                @input="handleCorrectRateInput"
              />
            </label>
            <label>
              <span>答案出处</span>
              <input v-model.trim="editForm.answerSource" placeholder="答案来源或解析出处" />
            </label>
            <label class="full">
              <span>题干</span>
              <textarea v-model="editForm.questionContent" rows="6" required />
            </label>
            <label v-for="option in visibleOptionFields" :key="option.key">
              <span>选项 {{ option.label }}</span>
              <textarea v-model="editForm[option.key as OptionKey]" rows="3" />
            </label>
            <div class="option-editor-actions full">
              <div class="option-editor-buttons">
                <button class="ghost-button option-count-button" type="button" :disabled="editOptionCount >= optionFields.length" @click="addOption">
                  <Plus :size="16" />
                  添加选项
                </button>
                <button class="ghost-button option-count-button" type="button" :disabled="editOptionCount <= 4" @click="removeOption">
                  <Minus :size="16" />
                  减少选项
                </button>
              </div>
              <span>{{ editOptionCount }} / {{ optionFields.length }}</span>
            </div>
            <div class="answer-field full">
              <span>答案</span>
              <div class="answer-checkbox-grid">
                <label
                  v-for="option in visibleOptionFields"
                  :key="option.label"
                  class="answer-checkbox"
                  :class="{ active: editForm.answerContent.includes(option.label) }"
                >
                  <input
                    type="checkbox"
                    :checked="editForm.answerContent.includes(option.label)"
                    @change="toggleAnswer(option.label)"
                  />
                  <span>{{ option.label }}</span>
                </label>
              </div>
            </div>
            <div class="question-image-editor full">
              <div class="question-image-editor-head">
                <span>题目图片</span>
                <div class="option-editor-buttons">
                  <button class="ghost-button option-count-button" type="button" @click="openQuestionImagePicker">
                    <ImagePlus :size="16" />
                    {{ editQuestionImageSrc ? '替换图片' : '上传图片' }}
                  </button>
                  <button class="ghost-button option-count-button danger-button" type="button" :disabled="!editQuestionImageSrc" @click="clearQuestionImage">
                    <Trash2 :size="16" />
                    清除图片
                  </button>
                </div>
              </div>

              <div class="question-image-preview">
                <img v-if="editQuestionImageSrc" :src="editQuestionImageSrc" alt="题目图片预览" />
                <span v-else>暂无题目图片</span>
              </div>

              <input
                ref="questionImageInput"
                class="file-input"
                type="file"
                accept="image/*"
                @change="handleQuestionImageSelected"
              />
            </div>
            <label class="full">
              <span>解析文本</span>
              <textarea v-model="editForm.analysisContent" rows="5" placeholder="填写这道题的解析" />
            </label>
            <div class="question-image-editor full">
              <div class="question-image-editor-head">
                <span>解析图片</span>
                <div class="option-editor-buttons">
                  <button class="ghost-button option-count-button" type="button" @click="openAnalysisImagePicker">
                    <ImagePlus :size="16" />
                    {{ editAnalysisImageSrc ? '替换图片' : '上传图片' }}
                  </button>
                  <button class="ghost-button option-count-button danger-button" type="button" :disabled="!editAnalysisImageSrc" @click="clearAnalysisImage">
                    <Trash2 :size="16" />
                    清除图片
                  </button>
                </div>
              </div>

              <div class="question-image-preview">
                <img v-if="editAnalysisImageSrc" :src="editAnalysisImageSrc" alt="解析图片预览" />
                <span v-else>暂无解析图片</span>
              </div>

              <input
                ref="analysisImageInput"
                class="file-input"
                type="file"
                accept="image/*"
                @change="handleAnalysisImageSelected"
              />
            </div>
          </div>

          <p v-if="editError" class="notice error">{{ editError }}</p>

          <div class="modal-actions">
            <button class="ghost-button" type="button" :disabled="editSaving" @click="closeEditDialog">取消</button>
            <button class="primary-button" type="submit" :disabled="editSaving">
              {{ editSaving ? '保存中...' : '保存' }}
            </button>
          </div>
        </template>
      </form>
    </div>

    <form class="filter-bar glass-card" @submit.prevent="search">
      <input v-model.trim="filters.keyword" placeholder="关键词" />
      <select v-model="filters.questionType" aria-label="科目分类">
        <option value="">全部分类</option>
        <option v-for="type in questionTypes" :key="type" :value="type">{{ type }}</option>
      </select>
      <select v-model="filters.questionYear" aria-label="年份">
        <option value="">全部年份</option>
        <option v-for="year in questionYears" :key="year" :value="year">{{ year }}</option>
      </select>
      <select v-model="filters.questionSource" aria-label="来源">
        <option value="">全部来源</option>
        <option v-for="source in questionSources" :key="source" :value="source">{{ source }}</option>
      </select>
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
          <div class="question-actions">
            <button class="ghost-button" type="button" @click="openDetail(item.questionId)">查看</button>
            <button class="ghost-button" type="button" @click="openEdit(item.questionId)">
              <Pencil :size="16" />
              编辑
            </button>
          </div>
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
