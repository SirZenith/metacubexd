<script setup lang="ts">
import type { Component } from 'vue'

// Shared panel head: a left-aligned title with an optional leading 18px icon
// and a right-aligned `actions` slot.
defineProps<{
  title: string
  icon?: Component
}>()
</script>

<template>
  <div class="mb-3 flex items-center justify-between gap-2">
    <span class="flex items-center gap-2 font-semibold text-base-content">
      <component :is="icon" v-if="icon" :size="18" />
      {{ title }}
    </span>
    <slot name="actions" />
  </div>
</template>
