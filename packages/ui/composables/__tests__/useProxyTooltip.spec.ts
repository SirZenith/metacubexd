// packages/ui/composables/__tests__/useProxyTooltip.spec.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Ambient Nuxt/VueUse auto-imports used by the composable under test.
vi.stubGlobal('onBeforeUnmount', vi.fn())
let touchPrimary = false
vi.stubGlobal('useMediaQuery', () => ref(touchPrimary))

import { useProxyTooltip } from '../useProxyTooltip'

function touchEvent(x: number, y: number): TouchEvent {
  return {
    touches: [{ clientX: x, clientY: y }],
  } as unknown as TouchEvent
}

describe('composables/useProxyTooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    touchPrimary = false
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('opens after the hover delay and closes after the leave delay', () => {
    const tooltip = useProxyTooltip({ onTest: vi.fn() })

    expect(tooltip.isTooltipOpen.value).toBe(false)
    tooltip.onMouseEnter()
    vi.advanceTimersByTime(299)
    expect(tooltip.isTooltipOpen.value).toBe(false)
    vi.advanceTimersByTime(1)
    expect(tooltip.isTooltipOpen.value).toBe(true)

    tooltip.onMouseLeave()
    vi.advanceTimersByTime(100)
    expect(tooltip.isTooltipOpen.value).toBe(false)
  })

  it('does not open the popover on touch-primary devices', () => {
    touchPrimary = true
    const tooltip = useProxyTooltip({ onTest: vi.fn() })

    tooltip.onMouseEnter()
    vi.advanceTimersByTime(300)
    expect(tooltip.isTooltipOpen.value).toBe(false)
  })

  it('runs the latency test and opens the tooltip', () => {
    const onTest = vi.fn()
    const tooltip = useProxyTooltip({ onTest })

    tooltip.handleLatencyTest()

    expect(onTest).toHaveBeenCalledOnce()
    expect(tooltip.isTooltipOpen.value).toBe(true)
  })

  it('dismisses on an outside pointer when enabled', () => {
    const tooltip = useProxyTooltip({
      onTest: vi.fn(),
      dismissOnOutsidePointer: true,
    })

    tooltip.openTooltip()
    expect(tooltip.isTooltipOpen.value).toBe(true)

    document.dispatchEvent(new Event('click', { bubbles: true }))
    expect(tooltip.isTooltipOpen.value).toBe(false)
  })

  it('swallows the click that follows a long-press exactly once', () => {
    touchPrimary = true
    const tooltip = useProxyTooltip({ onTest: vi.fn(), longPressToOpen: true })

    tooltip.onTouchStart(touchEvent(0, 0))
    vi.advanceTimersByTime(500)

    expect(tooltip.shouldSwallowClick()).toBe(true)
    expect(tooltip.shouldSwallowClick()).toBe(false)
  })
})
