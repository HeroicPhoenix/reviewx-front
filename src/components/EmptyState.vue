<script setup lang="ts">
defineProps<{ title: string; description?: string }>()
</script>

<template>
  <div class="empty-state glass-card">
    <strong>{{ title }}</strong>
    <span v-if="description">{{ description }}</span>
  </div>
</template>
