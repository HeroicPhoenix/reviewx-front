<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { BookOpenCheck, ChartNoAxesColumn, Dumbbell, LibraryBig, LogOut, Menu, UserRound, X } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const menuOpen = ref(false)

const navItems = [
  { to: '/dashboard', label: '概览', icon: ChartNoAxesColumn },
  { to: '/questions', label: '题库', icon: LibraryBig },
  { to: '/practice', label: '刷题', icon: Dumbbell },
  { to: '/records', label: '记录', icon: BookOpenCheck },
  { to: '/profile', label: '我的', icon: UserRound },
]

const initials = computed(() => auth.displayName.slice(0, 1).toUpperCase())

async function logout() {
  await auth.logout()
  await router.replace('/login')
}
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar glass-card" :class="{ open: menuOpen }">
      <div class="sidebar-head">
        <div class="app-logo">R</div>
        <div>
          <strong>ReviewX</strong>
          <span>学习训练台</span>
        </div>
        <button class="icon-button mobile-only" type="button" @click="menuOpen = false"><X :size="18" /></button>
      </div>

      <nav>
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-link"
          @click="menuOpen = false"
        >
          <component :is="item.icon" :size="19" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>
    </aside>

    <main class="main-area">
      <header class="topbar glass-card">
        <button class="icon-button mobile-only" type="button" @click="menuOpen = true"><Menu :size="20" /></button>
        <div class="topbar-title">
          <strong>{{ auth.displayName }}</strong>
          <span>{{ auth.user?.roles?.join(' / ') || 'ReviewX 用户' }}</span>
        </div>
        <div class="avatar">{{ initials }}</div>
        <button class="ghost-button" type="button" @click="logout">
          <LogOut :size="17" />
          <span>退出</span>
        </button>
      </header>

      <RouterView />
    </main>
  </div>
</template>
