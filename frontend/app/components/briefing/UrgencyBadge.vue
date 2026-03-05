<script setup lang="ts">
const props = defineProps<{
  urgency: 'breaking' | 'important' | 'routine'
}>()

const badge = computed(() => {
  if (props.urgency === 'breaking') {
    return { label: 'URGENTE', classes: 'bg-red-500 text-white' }
  }
  if (props.urgency === 'important') {
    return { label: 'IMPORTANTE', classes: 'bg-amber-100 text-amber-800' }
  }
  return null
})
</script>

<template>
  <span
    v-if="badge"
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide"
    :class="badge.classes"
  >
    {{ badge.label }}
  </span>
</template>
