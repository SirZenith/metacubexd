<script setup lang="ts">
import type { Component } from 'vue'

type IconButtonSize = 'sm' | 'md' | 'lg'
type IconButtonVariant = 'outline' | 'ghost' | 'danger'

const props = withDefaults(
  defineProps<{
    icon: Component
    // Used for both `title` and `aria-label` when provided.
    label?: string
    size?: IconButtonSize
    variant?: IconButtonVariant
    // Marks the button as toggled-on (outline lifts to the primary tint).
    active?: boolean
    disabled?: boolean
    loading?: boolean
  }>(),
  {
    size: 'md',
    variant: 'outline',
    active: false,
    disabled: false,
    loading: false,
  },
)

const SIZE_CLASS: Record<IconButtonSize, string> = {
  sm: 'h-7 w-7',
  md: 'h-8 w-8',
  lg: 'h-9 w-9',
}

const VARIANT_CLASS: Record<IconButtonVariant, string> = {
  outline:
    'rounded-lg border border-base-content/12 bg-base-200/60 text-base-content hover:border-base-content/20 hover:bg-base-300',
  ghost:
    'rounded-md border border-base-content/10 bg-transparent text-base-content/60 hover:bg-base-300 hover:text-base-content',
  danger:
    'rounded-lg border border-base-content/12 bg-base-200/60 text-base-content hover:border-error/30 hover:bg-error/15 hover:text-error',
}

const iconSize = computed(() => (props.size === 'sm' ? 16 : 18))
</script>

<template>
  <button
    type="button"
    class="flex shrink-0 cursor-pointer items-center justify-center transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
    :class="[
      SIZE_CLASS[size],
      VARIANT_CLASS[variant],
      active ? 'border-primary/40! bg-primary/15! text-primary!' : '',
    ]"
    :title="label"
    :aria-label="label"
    :disabled="disabled"
  >
    <span
      v-if="loading"
      class="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current"
      aria-hidden="true"
    />
    <slot v-else>
      <component :is="icon" :size="iconSize" />
    </slot>
  </button>
</template>
