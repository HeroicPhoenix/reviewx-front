<script setup lang="ts">
import { reactive, ref } from 'vue'
import { KeyRound } from 'lucide-vue-next'
import { api } from '@/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const form = reactive({ oldPassword: '', newPassword: '' })
const loading = ref(false)
const message = ref('')
const error = ref('')

async function changePassword() {
  loading.value = true
  message.value = ''
  error.value = ''
  try {
    await api.changePassword(form.oldPassword, form.newPassword)
    message.value = '密码已修改，请重新登录。'
    auth.clearSession()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '修改失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="page-stack">
    <div class="page-heading">
      <div>
        <p>我的</p>
        <h1>账号信息与安全设置</h1>
      </div>
    </div>

    <div class="profile-grid">
      <article class="glass-card info-card">
        <span class="soft-label">当前用户</span>
        <h2>{{ auth.displayName }}</h2>
        <p>用户名：{{ auth.user?.username }}</p>
        <p>角色：{{ auth.user?.roles?.join('、') || '-' }}</p>
        <p>权限数：{{ auth.user?.permissions?.length ?? 0 }}</p>
      </article>

      <form class="glass-card profile-form" @submit.prevent="changePassword">
        <KeyRound :size="24" />
        <h2>修改密码</h2>
        <input v-model="form.oldPassword" type="password" placeholder="旧密码" required />
        <input v-model="form.newPassword" minlength="6" maxlength="64" type="password" placeholder="新密码，6-64 位" required />
        <p v-if="message" class="notice">{{ message }}</p>
        <p v-if="error" class="notice error">{{ error }}</p>
        <button class="primary-button wide" type="submit" :disabled="loading">
          {{ loading ? '提交中...' : '确认修改' }}
        </button>
      </form>
    </div>
  </section>
</template>
