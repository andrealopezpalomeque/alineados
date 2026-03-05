<script setup lang="ts">
import { URGENCY_CONFIG } from '~/types/article'

const props = defineProps<{
  urgency: 'breaking' | 'important' | 'routine'
}>()

const config = computed(() => URGENCY_CONFIG[props.urgency])
</script>

<template>
  <span
    v-if="props.urgency !== 'routine'"
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide"
    :style="{
      color: config.color,
      backgroundColor: config.bg,
      border: `1px solid ${config.border}`,
    }"
  >
    {{ config.label }}
  </span>
</template>
