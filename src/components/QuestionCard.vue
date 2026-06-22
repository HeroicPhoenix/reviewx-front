<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Question } from '@/types/api'

const props = defineProps<{
  question: Question
  selected?: string[]
  readonly?: boolean
  reveal?: boolean
}>()

const emit = defineEmits<{
  select: [value: string]
}>()

const FONT_SIZE_KEY = 'reviewx_question_font_size'
const MIN_FONT_SIZE = 15
const MAX_FONT_SIZE = 24
const DEFAULT_FONT_SIZE = 18

const initialFontSize = Number(localStorage.getItem(FONT_SIZE_KEY))
const questionFontSize = ref(
  Number.isFinite(initialFontSize) && initialFontSize >= MIN_FONT_SIZE && initialFontSize <= MAX_FONT_SIZE
    ? initialFontSize
    : DEFAULT_FONT_SIZE,
)

const options = computed(() =>
  Array.from({ length: 8 }, (_, index) => {
    const key = `option${index + 1}` as keyof Question
    const value = props.question[key]
    return typeof value === 'string' && value.trim()
      ? { label: String.fromCharCode(65 + index), text: value }
      : null
  }).filter(Boolean) as { label: string; text: string }[],
)

const cardStyle = computed(() => ({
  '--question-font-size': `${questionFontSize.value}px`,
}))

watch(questionFontSize, (value) => {
  localStorage.setItem(FONT_SIZE_KEY, String(value))
})

function changeFontSize(delta: number) {
  questionFontSize.value = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, questionFontSize.value + delta))
}

function imageSrc(base64?: string) {
  if (!base64) return ''
  return base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`
}
</script>

<template>
  <article class="glass-card question-card" :style="cardStyle">
    <div class="question-meta">
      <span>{{ question.questionType || '题目' }}</span>
      <span v-if="question.questionYear">{{ question.questionYear }}</span>
      <span v-if="question.questionSource">{{ question.questionSource }}</span>
      <span v-if="question.correctRate">正确率 {{ question.correctRate }}</span>
    </div>

    <div class="font-toolbar" aria-label="题目字号">
      <button class="icon-button font-button" type="button" :disabled="questionFontSize <= MIN_FONT_SIZE" @click="changeFontSize(-1)">A-</button>
      <span>{{ questionFontSize }}px</span>
      <button class="icon-button font-button" type="button" :disabled="questionFontSize >= MAX_FONT_SIZE" @click="changeFontSize(1)">A+</button>
    </div>

    <h2>{{ question.questionContent || '暂无题干' }}</h2>

    <img
      v-if="question.questionImageBase64"
      class="question-image"
      :src="imageSrc(question.questionImageBase64)"
      alt="题目图片"
    />

    <div class="option-list">
      <button
        v-for="option in options"
        :key="option.label"
        class="option-button"
        :class="{
          active: selected?.includes(option.label),
          correct: reveal && question.answerContent?.includes(option.label),
        }"
        type="button"
        :disabled="readonly"
        @click="emit('select', option.label)"
      >
        <strong>{{ option.label }}</strong>
        <span>{{ option.text }}</span>
      </button>
    </div>

    <div v-if="reveal && question.answerContent?.length" class="answer-panel">
      <span>正确答案：{{ question.answerContent.join('、') }}</span>
      <p v-if="question.answerSource">{{ question.answerSource }}</p>
    </div>
  </article>
</template>
