<script setup lang="ts">
import { ICP_FOOTER_VISIBLE, ICP_TEXT, ICP_URL } from '@/config/runtime'
</script>

<template>
  <footer v-if="ICP_FOOTER_VISIBLE && ICP_TEXT" class="icp-footer">
    <a :href="ICP_URL" target="_blank" rel="noopener noreferrer">
      {{ ICP_TEXT }}
    </a>
  </footer>
</template>
