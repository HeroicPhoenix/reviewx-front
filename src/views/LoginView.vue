<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LockKeyhole, Sparkles, UserRound } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(username.value, password.value)
    await router.replace(String(route.query.redirect || '/dashboard'))
  } catch (e) {
    error.value = e instanceof Error ? e.message : '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="login-shell">
    <section class="login-panel glass-card">
      <div class="brand-mark"><Sparkles :size="28" /></div>
      <h1>ReviewX</h1>
      <p>题库检索、刷题训练与答题统计</p>

      <form class="login-form" autocomplete="off" @submit.prevent="submit">
        <label>
          <span>用户名</span>
          <div class="input-with-icon">
            <UserRound :size="18" />
            <input v-model.trim="username" autocomplete="off" placeholder="请输入用户名" />
          </div>
        </label>
        <label>
          <span>密码</span>
          <div class="input-with-icon">
            <LockKeyhole :size="18" />
            <input v-model="password" autocomplete="new-password" placeholder="请输入密码" type="password" />
          </div>
        </label>
        <p v-if="error" class="form-error">{{ error }}</p>
        <button class="primary-button wide" type="submit" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
    </section>
  </main>
</template>
