<script setup lang="ts">
// Column layout is decided by the parent, not by this component's own mount
// state: the parent needs `isTwoColumns` to pick which slots to fill, and it
// must stay correct while this component is unmounted mid-transition (see the
// mode-switch <Transition mode="out-in"> in pages/proxies.vue). Deriving it
// here and exposing it via a template ref made the parent read `null` during
// the out-in gap, which rendered an empty wrapper.
defineProps<{ isTwoColumns: boolean }>()
</script>

<template>
  <!-- min-w-0 lets each column shrink below content intrinsic width so long
       node names truncate instead of forcing page-level horizontal scroll. -->
  <div v-if="isTwoColumns" class="flex min-w-0 gap-2">
    <div class="isolate flex min-w-0 flex-1 flex-col gap-2">
      <slot name="even" />
    </div>
    <div class="isolate flex min-w-0 flex-1 flex-col gap-2">
      <slot name="odd" />
    </div>
  </div>
  <div v-else class="isolate flex min-w-0 flex-col gap-2">
    <slot />
  </div>
</template>
