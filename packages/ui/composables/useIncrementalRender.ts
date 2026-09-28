// packages/ui/composables/useIncrementalRender.ts
import type { Ref } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'
import { computed, h, ref } from 'vue'

// Progressive rendering for the proxy node lists: mount a window of nodes and
// grow it as a bottom sentinel scrolls into view, instead of mounting hundreds
// of cards in one frame. Shared by ProxyNodes and ProviderProxyNodes, which
// differ only in their scroll root and the props they pass to each node.

// Pure growth step, split out so the clamping rule is unit-testable.
export function nextRenderCount(
  current: number,
  total: number,
  step: number,
): number {
  return Math.min(current + step, total)
}

export interface UseIncrementalRenderOptions {
  // The scroll container that owns the list, e.g. proxiesScrollEl.
  root: Ref<HTMLElement | null>
  // Total item count at any moment; read reactively on each intersection.
  total: () => number
  initial?: number
  step?: number
  rootMargin?: string
}

export function useIncrementalRender({
  root,
  total,
  initial = 50,
  step = 50,
  rootMargin = '600px',
}: UseIncrementalRenderOptions) {
  const renderCount = ref(initial)
  const loadMoreSentinel = ref<HTMLElement | null>(null)

  useIntersectionObserver(
    loadMoreSentinel,
    (entries) => {
      if (entries[0]?.isIntersecting && renderCount.value < total()) {
        renderCount.value = nextRenderCount(renderCount.value, total(), step)
      }
    },
    { root, rootMargin },
  )

  const hasMore = computed(() => renderCount.value < total())

  // The sentinel is the last grid child of the rendered window; `aria-hidden`
  // keeps it out of the accessibility tree and `gridColumn` spans both columns.
  const loadMoreSentinelNode = () =>
    h('div', {
      ref: loadMoreSentinel,
      key: '__load_more__',
      'aria-hidden': 'true',
      class: 'h-px w-full',
      style: { gridColumn: '1 / -1' },
    })

  return { renderCount, hasMore, loadMoreSentinelNode }
}
