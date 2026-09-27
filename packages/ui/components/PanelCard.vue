<script setup lang="ts">
// Shared panel chrome for the control/config surfaces: the rounded, bordered
// base-200 card every panel repeats verbatim. Parents keep their capability
// gate colocated via `visible`.
withDefaults(defineProps<{ visible?: boolean }>(), { visible: true })
</script>

<template>
  <div
    v-if="visible"
    class="rounded-2xl border border-base-content/10 bg-base-200 p-4"
  >
    <slot />
  </div>
</template>
