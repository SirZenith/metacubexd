// packages/ui/composables/useKeyedBusyMap.ts

// Record-backed keyed-busy state. `useBusyKeys` (Set-backed) is the preferred
// abstraction when a caller only needs `isBusy`/`run`. Some stores, however,
// expose the busy state as a writable `Record<string, boolean>` that many
// components read as `store.someMap[key]` and specs seed directly, so this
// composable keeps that shape while routing every transition through one place.
//
// It is the single definition of the store's keyed-busy behaviour, and the
// seam to swap for a `useBusyKeys` adapter if the public Record shape is ever
// dropped.
export interface UseKeyedBusyMapRunOptions {
  // Ignore a re-fire while `key` is already in flight. Defaults to false to
  // match the stores' existing hand-written behaviour (no de-duplication).
  guardReentry?: boolean
  // Swallow the rejection instead of rethrowing it. Defaults to false so
  // callers can surface their own errors.
  swallow?: boolean
}

export function useKeyedBusyMap() {
  const map = ref<Record<string, boolean>>({})

  const isBusy = (key: string) => map.value[key] === true

  const setBusy = (key: string, busy: boolean) => {
    map.value[key] = busy
  }

  // Run `fn` while `key` is marked busy; always clears the key, even on reject.
  const run = async (
    key: string,
    fn: () => Promise<unknown>,
    options: UseKeyedBusyMapRunOptions = {},
  ) => {
    const { guardReentry = false, swallow = false } = options
    if (guardReentry && isBusy(key)) return
    setBusy(key, true)
    try {
      return await fn()
    } catch (e) {
      if (!swallow) throw e
    } finally {
      setBusy(key, false)
    }
  }

  return { map, isBusy, setBusy, run }
}
