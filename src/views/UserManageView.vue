<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { UserPlus } from 'lucide-vue-next'
import { api } from '@/api'
import EmptyState from '@/components/EmptyState.vue'
import type { UserAccount } from '@/types/api'

const users = ref<UserAccount[]>([])
const loading = ref(false)
const saving = ref(false)
const message = ref('')
const error = ref('')
const form = reactive({
  username: '',
  password: '',
  nickName: '',
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    users.value = await api.users()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '用户加载失败'
  } finally {
    loading.value = false
  }
}

async function createUser() {
  saving.value = true
  message.value = ''
  error.value = ''
  try {
    const created = await api.createUser({
      username: form.username,
      password: form.password,
      nickName: form.nickName || undefined,
    })
    message.value = `用户 ${created.username} 已创建`
    form.username = ''
    form.password = ''
    form.nickName = ''
    await load()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '新增用户失败'
  } finally {
    saving.value = false
  }
}

function statusText(status: number) {
  if (status === 1) return '正常'
  if (status === 2) return '禁用'
  return '删除'
}

onMounted(load)
</script>

<template>
  <section class="page-stack">
    <div class="page-heading">
      <div>
        <p>用户管理</p>
        <h1>创建普通用户并查看账号</h1>
      </div>
    </div>

    <div class="profile-grid">
      <form class="glass-card profile-form" @submit.prevent="createUser">
        <UserPlus :size="24" />
        <h2>新增普通用户</h2>
        <input v-model.trim="form.username" minlength="3" maxlength="64" autocomplete="off" placeholder="用户名，3-64 位" required />
        <input v-model="form.password" minlength="6" maxlength="64" type="password" autocomplete="new-password" placeholder="初始密码，6-64 位" required />
        <input v-model.trim="form.nickName" maxlength="100" autocomplete="off" placeholder="昵称，可选" />
        <p v-if="message" class="notice">{{ message }}</p>
        <p v-if="error" class="notice error">{{ error }}</p>
        <button class="primary-button wide" type="submit" :disabled="saving">
          {{ saving ? '创建中...' : '创建用户' }}
        </button>
      </form>

      <div class="table-card glass-card">
        <EmptyState v-if="!loading && !users.length" title="暂无用户" />
        <div v-else class="responsive-table">
          <table>
            <thead>
              <tr>
                <th>用户ID</th>
                <th>用户名</th>
                <th>昵称</th>
                <th>状态</th>
                <th>创建时间</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.userId">
                <td>{{ user.userId }}</td>
                <td>{{ user.username }}</td>
                <td>{{ user.nickName || '-' }}</td>
                <td><span class="status-pill ok">{{ statusText(user.userStatus) }}</span></td>
                <td>{{ user.createTime || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
</template>
