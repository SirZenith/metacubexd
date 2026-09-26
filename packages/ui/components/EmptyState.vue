<script setup lang="ts">
import type { Component } from 'vue'

// Shared empty-state placeholder. `message` defaults to t('noData'); `size`
// controls the vertical padding and `icon` renders an optional leading glyph.
withDefaults(
  defineProps<{
    icon?: Component
    message?: string
    size?: 'sm' | 'md' | 'lg'
    italic?: boolean
  }>(),
  { size: 'md', italic: false },
)

const { t } = useI18n()

const SIZE_CLASS = {
  sm: 'py-4',
  md: 'py-8',
  lg: 'py-12',
} as const
</script>

<template>
  <div
    class="flex flex-col items-center justify-center gap-2 text-center text-base-content/50"
    :class="SIZE_CLASS[size]"
  >
    <component :is="icon" v-if="icon" :size="40" class="opacity-50" />
    <span class="text-sm" :class="{ italic }">{{
      message ?? t('noData')
    }}</span>
  </div>
</template>
