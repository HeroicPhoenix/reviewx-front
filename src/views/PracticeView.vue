<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Check, ImagePlus, Pencil, RotateCcw, Send, Trash2 } from 'lucide-vue-next'
import { api } from '@/api'
import EmptyState from '@/components/EmptyState.vue'
import QuestionCard from '@/components/QuestionCard.vue'
import { usePracticeStore } from '@/stores/practice'
import type { Question } from '@/types/api'
import { formatLocalDateTime, formatMs } from '@/utils/time'

const practice = usePracticeStore()
const {
  mode,
  randomScope,
  analysisScope,
  filters,
  questions,
  currentIndex,
  selected,
  startTime,
  result,
  analysisOpen,
  analysisMessage,
  analysisForm,
} = storeToRefs(practice)
const loading = ref(false)
const submitting = ref(false)
const analysisSaving = ref(false)
const analysisImageInput = ref<HTMLInputElement | null>(null)
const questionTypes = ref<string[]>([])
const questionYears = ref<string[]>([])
const questionSources = ref<string[]>([])
const questionJoinDates = ref<string[]>([])
const error = ref('')

const current = computed(() => questions.value[currentIndex.value])
const progress = computed(() => questions.value.length ? `${currentIndex.value + 1} / ${questions.value.length}` : '0 / 0')
const analysisImageSrc = computed(() => imageSrc(analysisForm.value.imageBase64))

async function loadQuestions() {
  loading.value = true
  error.value = ''
  practice.resetPracticeRun()
  try {
    if (mode.value === 'random') {
      questions.value = await api.randomList({
        ...filters.value,
        randomScope: randomScope.value,
        analysisScope: analysisScope.value,
      })
    }
    if (mode.value === 'wrong') questions.value = await api.wrongList(filters.value)
    if (mode.value === 'order') {
      const page = await api.orderList(filters.value)
      questions.value = page.list
    }
    practice.setCurrentQuestion(0, questions.value[0])
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
    practice.saveAnswerState(current.value)
    return
  }
  if (selected.value.includes(option)) {
    selected.value = selected.value.filter((item) => item !== option)
  } else {
    selected.value = [...selected.value, option].sort()
  }
  practice.saveAnswerState(current.value)
}

async function submit(editAnalysis = false) {
  if (!current.value || !selected.value.length) return
  submitting.value = true
  error.value = ''
  analysisMessage.value = ''
  const endTime = formatLocalDateTime()
  try {
    result.value = await api.submitAnswer({
      questionId: current.value.questionId,
      selectedAnswer: selected.value,
      startTime: startTime.value,
      endTime,
    })
    practice.saveAnswerState(current.value)
    if (editAnalysis) {
      openAnalysisEditor()
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '提交失败'
  } finally {
    submitting.value = false
  }
}

async function submitAndEditAnalysis() {
  await submit(true)
}

function nextQuestion(step: number) {
  const next = currentIndex.value + step
  if (next < 0 || next >= questions.value.length) return
  practice.saveAnswerState(current.value)
  practice.setCurrentQuestion(next, questions.value[next])
}

function imageSrc(base64?: string) {
  const value = base64?.trim()
  if (!value) return ''
  return value.startsWith('data:') ? value : `data:image/png;base64,${value}`
}

function fillAnalysisForm(question?: Question) {
  practice.fillAnalysisForm(question)
}

function openAnalysisEditor() {
  fillAnalysisForm(current.value)
  analysisOpen.value = true
}

function openAnalysisImagePicker() {
  analysisImageInput.value?.click()
}

async function handleAnalysisImageSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''

  await setAnalysisImageFromFile(file)
}

async function setAnalysisImageFromFile(file?: File) {
  if (!file) return
  if (!file.type.startsWith('image/')) {
    error.value = '请选择图片文件'
    return
  }
  try {
    analysisForm.value.imageBase64 = await readFileAsDataUrl(file)
    error.value = ''
  } catch (e) {
    error.value = e instanceof Error ? e.message : '图片读取失败'
  }
}

async function handleAnalysisImagePaste(event: ClipboardEvent) {
  const file = imageFileFromItems(event.clipboardData?.items)
  if (!file) return
  event.preventDefault()
  await setAnalysisImageFromFile(file)
}

async function handleAnalysisImageDrop(event: DragEvent) {
  const file = event.dataTransfer?.files?.[0]
  await setAnalysisImageFromFile(file)
}

function imageFileFromItems(items?: DataTransferItemList) {
  if (!items) return undefined
  for (const item of Array.from(items)) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      return item.getAsFile() ?? undefined
    }
  }
  return undefined
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('图片读取失败'))
    reader.readAsDataURL(file)
  })
}

function clearAnalysisImage() {
  analysisForm.value.imageBase64 = ''
}

async function saveAnalysis() {
  if (!current.value) return
  analysisSaving.value = true
  error.value = ''
  analysisMessage.value = ''
  try {
    const saved = await api.updateQuestionAnalysis({
      questionId: current.value.questionId,
      analysisContent: analysisForm.value.content.trim(),
      analysisImageBase64: analysisForm.value.imageBase64.trim(),
    })
    questions.value[currentIndex.value] = {
      ...current.value,
      analysisContent: saved.analysisContent,
      analysisImageBase64: saved.analysisImageBase64,
    }
    fillAnalysisForm(questions.value[currentIndex.value])
    analysisMessage.value = '解析已保存'
  } catch (e) {
    error.value = e instanceof Error ? e.message : '解析保存失败'
  } finally {
    analysisSaving.value = false
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

async function loadQuestionJoinDates() {
  try {
    questionJoinDates.value = await api.questionJoinDates()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加入日期加载失败'
  }
}

onMounted(async () => {
  await Promise.all([loadQuestionTypes(), loadQuestionYears(), loadQuestionSources(), loadQuestionJoinDates()])
})
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
      <select v-model="filters.questionYear" aria-label="年份">
        <option value="">全部年份</option>
        <option v-for="year in questionYears" :key="year" :value="year">{{ year }}</option>
      </select>
      <select v-model="filters.questionSource" aria-label="来源">
        <option value="">全部来源</option>
        <option v-for="source in questionSources" :key="source" :value="source">{{ source }}</option>
      </select>
      <select v-model="filters.questionJoinDate" aria-label="题目加入日期">
        <option value="">全部加入日期</option>
        <option v-for="joinDate in questionJoinDates" :key="joinDate" :value="joinDate">{{ joinDate }}</option>
      </select>
      <input v-if="mode !== 'order'" v-model.number="filters.size" min="1" max="50" type="number" placeholder="数量" />
      <input v-if="mode === 'order'" v-model.number="filters.pageNum" min="1" type="number" placeholder="页码" />
    </div>

    <div v-if="mode === 'random'" class="random-scope-panel glass-card">
      <div class="segmented random-scope" aria-label="作答范围">
        <button type="button" :class="{ active: randomScope === 'all' }" @click="randomScope = 'all'">作答全部</button>
        <button type="button" :class="{ active: randomScope === 'done' }" @click="randomScope = 'done'">已做</button>
        <button type="button" :class="{ active: randomScope === 'undone' }" @click="randomScope = 'undone'">未做</button>
      </div>
      <div class="segmented random-scope" aria-label="解析范围">
        <button type="button" :class="{ active: analysisScope === 'all' }" @click="analysisScope = 'all'">解析全部</button>
        <button type="button" :class="{ active: analysisScope === 'analyzed' }" @click="analysisScope = 'analyzed'">已解析</button>
        <button type="button" :class="{ active: analysisScope === 'unanalyzed' }" @click="analysisScope = 'unanalyzed'">未解析</button>
      </div>
    </div>

    <div v-if="error" class="notice error">{{ error }}</div>

    <div class="practice-layout">
      <div class="practice-main">
        <EmptyState v-if="!current" title="还没有题目" description="选择模式后点击取题。" />
        <QuestionCard v-else :question="current" :selected="selected" :readonly="Boolean(result)" :reveal="Boolean(result)" @select="toggleOption" />
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
        <button class="primary-button wide" type="button" :disabled="!selected.length || submitting || Boolean(result)" @click="submit()">
          <Send :size="17" />
          {{ submitting ? '提交中...' : '提交答案' }}
        </button>
        <button class="ghost-button wide" type="button" :disabled="!selected.length || submitting" @click="result ? openAnalysisEditor() : submitAndEditAnalysis()">
          <Pencil :size="17" />
          {{ result ? '编辑解析' : '提交答案并编辑解析' }}
        </button>
        <div v-if="analysisOpen" class="practice-analysis-editor">
          <label>
            <span>解析文本</span>
            <textarea v-model="analysisForm.content" rows="5" placeholder="填写这道题的解析" />
          </label>
          <div class="question-image-editor">
            <div class="question-image-editor-head">
              <span>解析图片</span>
              <div class="option-editor-buttons">
                <button class="ghost-button option-count-button" type="button" @click="openAnalysisImagePicker">
                  <ImagePlus :size="16" />
                  {{ analysisImageSrc ? '替换图片' : '上传图片' }}
                </button>
                <button class="ghost-button option-count-button danger-button" type="button" :disabled="!analysisImageSrc" @click="clearAnalysisImage">
                  <Trash2 :size="16" />
                  清除图片
                </button>
              </div>
            </div>
            <div
              class="question-image-preview image-drop-target"
              tabindex="0"
              @paste="handleAnalysisImagePaste"
              @dragover.prevent
              @drop.prevent="handleAnalysisImageDrop"
            >
              <img v-if="analysisImageSrc" :src="analysisImageSrc" alt="解析图片预览" />
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
          <button class="primary-button wide" type="button" :disabled="analysisSaving" @click="saveAnalysis">
            {{ analysisSaving ? '保存中...' : '提交解析' }}
          </button>
          <p v-if="analysisMessage" class="notice">{{ analysisMessage }}</p>
        </div>
        <div class="pager">
          <button class="ghost-button" type="button" :disabled="currentIndex <= 0" @click="nextQuestion(-1)">上一题</button>
          <button class="ghost-button" type="button" :disabled="currentIndex >= questions.length - 1" @click="nextQuestion(1)">下一题</button>
        </div>
      </aside>
    </div>
  </section>
</template>
