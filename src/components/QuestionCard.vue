<script setup lang="ts">
import { computed } from 'vue'
import { usePreferencesStore } from '@/stores/preferences'
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

const preferences = usePreferencesStore()

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
  '--question-font-size': `${preferences.questionFontSize}px`,
}))

function questionTypeText(type?: number) {
  if (type === 2) return '多选'
  return '单选'
}

function imageSrc(base64?: string) {
  if (!base64) return ''
  return base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`
}
</script>

<template>
  <article class="glass-card question-card" :style="cardStyle">
    <div class="question-card-head">
      <div class="question-meta">
        <span>{{ question.questionCategory || '未分类' }}</span>
        <span>{{ questionTypeText(question.questionType) }}</span>
        <span v-if="question.questionYear">{{ question.questionYear }}</span>
        <span v-if="question.questionSource">{{ question.questionSource }}</span>
        <span v-if="question.correctRate">正确率 {{ question.correctRate }}</span>
      </div>

      <div class="font-toolbar" aria-label="题目字号">
        <button class="icon-button font-button" type="button" :disabled="preferences.questionFontSize <= preferences.minQuestionFontSize" @click="preferences.changeQuestionFontSize(-1)">A-</button>
        <span>{{ preferences.questionFontSize }}px</span>
        <button class="icon-button font-button" type="button" :disabled="preferences.questionFontSize >= preferences.maxQuestionFontSize" @click="preferences.changeQuestionFontSize(1)">A+</button>
      </div>
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
