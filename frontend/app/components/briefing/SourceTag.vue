<script setup lang="ts">
import { SOURCE_COLORS } from '~/types/article'

const props = defineProps<{
  source: string
}>()

const color = computed(() => SOURCE_COLORS[props.source] || '#64748b')
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap"
    :style="{
      color: color,
      backgroundColor: color + '14',
      border: `1px solid ${color}2E`,
    }"
  >
    {{ props.source }}
  </span>
</template>
