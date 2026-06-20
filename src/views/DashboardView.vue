<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight, BookMarked, CircleCheck, Clock3, Target } from 'lucide-vue-next'
import { api } from '@/api'
import type { AnswerRecordStat } from '@/types/api'
import { formatMs, formatRate } from '@/utils/time'

const stat = ref<AnswerRecordStat | null>(null)
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    stat.value = await api.answerRecordStat()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '统计加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="page-stack">
    <div class="page-heading">
      <div>
        <p>学习概览</p>
        <h1>今天从一次高质量练习开始</h1>
      </div>
      <RouterLink class="primary-button" to="/practice">
        开始刷题
        <ArrowRight :size="18" />
      </RouterLink>
    </div>

    <div v-if="error" class="notice error">{{ error }}</div>

    <div class="metric-grid">
      <article class="metric-card glass-card">
        <BookMarked :size="24" />
        <span>总作答</span>
        <strong>{{ loading ? '-' : stat?.totalCount ?? 0 }}</strong>
      </article>
      <article class="metric-card glass-card">
        <CircleCheck :size="24" />
        <span>答对</span>
        <strong>{{ loading ? '-' : stat?.correctCount ?? 0 }}</strong>
      </article>
      <article class="metric-card glass-card">
        <Target :size="24" />
        <span>正确率</span>
        <strong>{{ loading ? '-' : formatRate(stat?.correctRate) }}</strong>
      </article>
      <article class="metric-card glass-card">
        <Clock3 :size="24" />
        <span>平均耗时</span>
        <strong>{{ loading ? '-' : formatMs(stat?.averageDurationMs) }}</strong>
      </article>
    </div>

    <div class="quick-grid">
      <RouterLink class="quick-card glass-card" to="/questions">
        <strong>题库检索</strong>
        <span>按关键词、类型、年份、来源快速筛题。</span>
      </RouterLink>
      <RouterLink class="quick-card glass-card" to="/records">
        <strong>答题记录</strong>
        <span>回看每一次提交和正确答案快照。</span>
      </RouterLink>
      <RouterLink class="quick-card glass-card" to="/profile">
        <strong>账号安全</strong>
        <span>查看当前用户信息并修改密码。</span>
      </RouterLink>
    </div>
  </section>
</template>
