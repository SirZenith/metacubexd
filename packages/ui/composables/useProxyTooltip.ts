// packages/ui/composables/useProxyTooltip.ts
import {
  acquireSingletonPopover,
  releaseSingletonPopover,
} from './useSingletonPopover'

// Shared tooltip lifecycle for the proxy node card and list item. It owns the
// open/close delays, the touch-primary guard, the single-popover arbitration,
// and (opt-in) outside-pointer dismissal and touch long-press. The host
// component wires the returned handlers into its template.
interface UseProxyTooltipOptions {
  // Latency test fired by the tooltip's own control.
  onTest: () => void
  // Dismiss when the user presses outside the anchor or the tooltip (cards).
  dismissOnOutsidePointer?: boolean
  // Mobile: a long-press opens the tooltip; a tap just selects the node.
  longPressToOpen?: boolean
}

const OPEN_DELAY = 300
const CLOSE_DELAY = 100
const TOUCH_MOVE_THRESHOLD = 10
const LONG_PRESS_DURATION = 500

export function useProxyTooltip(options: UseProxyTooltipOptions) {
  // Anchor element for the lazily-mounted tooltip.
  const reference = ref<HTMLElement | null>(null)
  const isTooltipOpen = ref(false)

  // Touch-primary devices: the floating popover is `strategy: fixed` and
  // re-anchors on scroll, riding along with the list and covering node rows —
  // no way to tap another node. Skip the popover on mobile; taps select the
  // node.
  const isTouchDevice = useMediaQuery('(pointer: coarse)')

  let openTimeout: ReturnType<typeof setTimeout> | null = null
  let closeTimeout: ReturnType<typeof setTimeout> | null = null
  let longPressTimeout: ReturnType<typeof setTimeout> | null = null
  let touchStartX = 0
  let touchStartY = 0
  let longPressFired = false

  function clearTimeouts() {
    if (openTimeout) {
      clearTimeout(openTimeout)
      openTimeout = null
    }
    if (closeTimeout) {
      clearTimeout(closeTimeout)
      closeTimeout = null
    }
  }

  function clearLongPress() {
    if (longPressTimeout) {
      clearTimeout(longPressTimeout)
      longPressTimeout = null
    }
  }

  function onDocumentPointer(e: Event) {
    const target = e.target as Node
    if (reference.value?.contains(target)) return
    if (target instanceof Element && target.closest('[data-proxy-tooltip]'))
      return
    closeTooltip()
  }

  function addOutsidePointerListeners() {
    if (!options.dismissOnOutsidePointer) return
    document.addEventListener('click', onDocumentPointer, true)
    document.addEventListener('touchstart', onDocumentPointer, true)
  }

  function removeOutsidePointerListeners() {
    if (!options.dismissOnOutsidePointer) return
    document.removeEventListener('click', onDocumentPointer, true)
    document.removeEventListener('touchstart', onDocumentPointer, true)
  }

  function openTooltip() {
    if (isTouchDevice.value) return
    acquireSingletonPopover(closeTooltip)
    isTooltipOpen.value = true
    addOutsidePointerListeners()
  }

  function closeTooltip() {
    isTooltipOpen.value = false
    removeOutsidePointerListeners()
    releaseSingletonPopover(closeTooltip)
  }

  function onMouseEnter() {
    clearTimeouts()
    openTimeout = setTimeout(() => {
      openTooltip()
    }, OPEN_DELAY)
  }

  function onMouseLeave() {
    clearTimeouts()
    // Delay closing to allow mouse to move to tooltip
    closeTimeout = setTimeout(() => {
      closeTooltip()
    }, CLOSE_DELAY)
  }

  function onTooltipMouseEnter() {
    clearTimeouts()
  }

  function onTooltipMouseLeave() {
    clearTimeouts()
    closeTooltip()
  }

  // Mobile: a quick tap selects the node; a long-press opens the tooltip.
  // Tap and the synthetic click that follows touchend must NOT both fire —
  // long-press sets longPressFired so the resulting click skips selection.
  function onTouchStart(e: TouchEvent) {
    if (!options.longPressToOpen) return
    if (isTooltipOpen.value) return
    const touch = e.touches[0]
    if (!touch) return
    touchStartX = touch.clientX
    touchStartY = touch.clientY
    longPressFired = false
    clearLongPress()
    longPressTimeout = setTimeout(() => {
      longPressFired = true
      openTooltip()
    }, LONG_PRESS_DURATION)
  }

  function onTouchMove(e: TouchEvent) {
    if (!options.longPressToOpen) return
    const touch = e.touches[0]
    if (!touch) return
    const dx = Math.abs(touch.clientX - touchStartX)
    const dy = Math.abs(touch.clientY - touchStartY)
    // Moved past the threshold — this is a scroll, not a long-press.
    if (dx > TOUCH_MOVE_THRESHOLD || dy > TOUCH_MOVE_THRESHOLD) {
      clearLongPress()
    }
  }

  function onTouchEnd() {
    if (!options.longPressToOpen) return
    // Lifted before the timer fired — a tap; let the click select the node.
    clearLongPress()
  }

  // True when the pending click is the tail of a long-press and must be
  // swallowed instead of selecting the node.
  function shouldSwallowClick(): boolean {
    if (longPressFired) {
      longPressFired = false
      return true
    }
    return false
  }

  function handleLatencyTest() {
    clearTimeouts()
    openTooltip()
    options.onTest()
  }

  onBeforeUnmount(() => {
    clearTimeouts()
    clearLongPress()
    removeOutsidePointerListeners()
    releaseSingletonPopover(closeTooltip)
  })

  return {
    reference,
    isTooltipOpen,
    isTouchDevice,
    openTooltip,
    closeTooltip,
    onMouseEnter,
    onMouseLeave,
    onTooltipMouseEnter,
    onTooltipMouseLeave,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    handleLatencyTest,
    shouldSwallowClick,
  }
}
