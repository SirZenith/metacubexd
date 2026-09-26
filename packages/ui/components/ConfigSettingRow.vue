<script setup lang="ts">
// Shared shell for a config setting row: the left-hand label and the
// right-hand control. It only owns the repeated row chrome (alignment, radius,
// padding, hover wash); each row keeps its own label/control markup via the
// `label` and default slots, since those vary (inline icon, indented child
// label, two-line label block).
</script>

<template>
  <div
    class="flex items-center justify-between gap-4 rounded-lg px-2 py-1.5 transition-colors hover:bg-base-content/5"
  >
    <slot name="label" />
    <slot />
  </div>
</template>
