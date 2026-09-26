<script setup lang="ts">
// Shared page-level loading placeholder: a centered ring with an optional
// label. `minHeight` accepts a Tailwind height class so callers keep their
// existing layout height.
withDefaults(
  defineProps<{
    label?: string
    minHeight?: string
    ring?: 'md' | 'lg'
  }>(),
  { minHeight: 'min-h-64', ring: 'lg' },
)
</script>

<template>
  <div class="flex items-center justify-center" :class="minHeight">
    <div class="flex flex-col items-center gap-4">
      <span
        class="loading loading-ring text-primary"
        :class="ring === 'lg' ? 'loading-lg' : ''"
      />
      <span v-if="label" class="text-sm opacity-60">{{ label }}</span>
    </div>
  </div>
</template>
