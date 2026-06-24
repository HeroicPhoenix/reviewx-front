<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Copy, KeyRound, Plus, Trash2 } from 'lucide-vue-next'
import { api } from '@/api'
import { useAuthStore } from '@/stores/auth'
import type { ApiKeyCreateResult, ApiKeyItem } from '@/types/api'

const auth = useAuthStore()
const form = reactive({ oldPassword: '', newPassword: '' })
const apiKeyForm = reactive({ apiKeyName: '', expireTime: '' })
const apiKeys = ref<ApiKeyItem[]>([])
const createdApiKey = ref<ApiKeyCreateResult | null>(null)
const loading = ref(false)
const apiKeyLoading = ref(false)
const apiKeySaving = ref(false)
const message = ref('')
const error = ref('')
const apiKeyMessage = ref('')
const apiKeyError = ref('')

function dateParam(value: string) {
  return value ? `${value}:00`.replace('T', ' ') : undefined
}

function statusText(status: number) {
  return status === 1 ? '启用' : '禁用'
}

async function loadApiKeys() {
  apiKeyLoading.value = true
  apiKeyError.value = ''
  try {
    apiKeys.value = await api.apiKeys()
  } catch (e) {
    apiKeyError.value = e instanceof Error ? e.message : 'API Key 加载失败'
  } finally {
    apiKeyLoading.value = false
  }
}

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

async function createApiKey() {
  apiKeySaving.value = true
  apiKeyMessage.value = ''
  apiKeyError.value = ''
  createdApiKey.value = null
  try {
    createdApiKey.value = await api.createApiKey({
      apiKeyName: apiKeyForm.apiKeyName,
      expireTime: dateParam(apiKeyForm.expireTime),
    })
    apiKeyForm.apiKeyName = ''
    apiKeyForm.expireTime = ''
    apiKeyMessage.value = 'API Key 已创建，请立即保存。'
    await loadApiKeys()
  } catch (e) {
    apiKeyError.value = e instanceof Error ? e.message : '创建 API Key 失败'
  } finally {
    apiKeySaving.value = false
  }
}

async function copyApiKey() {
  if (!createdApiKey.value?.apiKey) return
  try {
    await navigator.clipboard.writeText(createdApiKey.value.apiKey)
    apiKeyMessage.value = 'API Key 已复制'
  } catch {
    apiKeyError.value = '复制失败，请手动选择复制'
  }
}

async function disableApiKey(item: ApiKeyItem) {
  if (item.apiKeyStatus !== 1) return
  apiKeyError.value = ''
  try {
    await api.disableApiKey(item.apiKeyId)
    apiKeyMessage.value = 'API Key 已禁用'
    await loadApiKeys()
  } catch (e) {
    apiKeyError.value = e instanceof Error ? e.message : '禁用失败'
  }
}

async function deleteApiKey(item: ApiKeyItem) {
  if (!window.confirm(`确认删除 API Key「${item.apiKeyName}」？`)) return
  apiKeyError.value = ''
  try {
    await api.deleteApiKey(item.apiKeyId)
    apiKeyMessage.value = 'API Key 已删除'
    await loadApiKeys()
  } catch (e) {
    apiKeyError.value = e instanceof Error ? e.message : '删除失败'
  }
}

onMounted(loadApiKeys)
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

    <div class="api-key-layout">
      <form class="glass-card profile-form" @submit.prevent="createApiKey">
        <Plus :size="24" />
        <h2>创建 API Key</h2>
        <input v-model.trim="apiKeyForm.apiKeyName" maxlength="100" autocomplete="off" placeholder="API Key 名称" required />
        <input v-model="apiKeyForm.expireTime" type="datetime-local" />
        <p v-if="apiKeyMessage" class="notice">{{ apiKeyMessage }}</p>
        <p v-if="apiKeyError" class="notice error">{{ apiKeyError }}</p>
        <div v-if="createdApiKey" class="api-key-secret">
          <span>仅显示一次</span>
          <code>{{ createdApiKey.apiKey }}</code>
          <button class="ghost-button" type="button" @click="copyApiKey">
            <Copy :size="16" />
            复制
          </button>
        </div>
        <button class="primary-button wide" type="submit" :disabled="apiKeySaving">
          {{ apiKeySaving ? '创建中...' : '创建 API Key' }}
        </button>
      </form>

      <div class="table-card glass-card">
        <div class="table-head">
          <h2>API Key 列表</h2>
          <button class="ghost-button" type="button" :disabled="apiKeyLoading" @click="loadApiKeys">刷新</button>
        </div>
        <div v-if="!apiKeyLoading && !apiKeys.length" class="empty-state">
          <strong>暂无 API Key</strong>
        </div>
        <div v-else class="responsive-table">
          <table>
            <thead>
              <tr>
                <th>名称</th>
                <th>前缀</th>
                <th>状态</th>
                <th>过期时间</th>
                <th>最后使用</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in apiKeys" :key="item.apiKeyId">
                <td>{{ item.apiKeyName }}</td>
                <td>{{ item.apiKeyPrefix }}</td>
                <td><span class="status-pill" :class="{ ok: item.apiKeyStatus === 1 }">{{ statusText(item.apiKeyStatus) }}</span></td>
                <td>{{ item.expireTime || '永不过期' }}</td>
                <td>{{ item.lastUsedTime || '-' }}</td>
                <td class="action-cell">
                  <button class="ghost-button" type="button" :disabled="item.apiKeyStatus !== 1" @click="disableApiKey(item)">禁用</button>
                  <button class="icon-button danger-button" type="button" @click="deleteApiKey(item)">
                    <Trash2 :size="16" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
</template>
