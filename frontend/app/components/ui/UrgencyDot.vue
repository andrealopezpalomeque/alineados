<script setup lang="ts">
const props = defineProps<{
  urgency: 'breaking' | 'important' | 'routine'
}>()

const colorMap: Record<string, string> = {
  breaking: 'bg-red-500',
  important: 'bg-amber-500',
  routine: 'bg-green-500',
}
</script>

<template>
  <span
    class="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
    :class="colorMap[props.urgency] || 'bg-green-500'"
  />
</template>
