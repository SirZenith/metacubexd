// packages/ui/composables/useBusyKeys.ts

// Tracks WHICH keyed actions are currently in flight, so each row/button can
// reflect only its OWN loading state instead of sharing one global `busy` ref
// that greys every control on the page. Keys are caller-defined strings, e.g.
// `activate:${id}` or `create`.
//
// This is the single keyed-busy abstraction for the dashboard. The two
// behaviours callers used to reimplement are explicit per-call options:
// `guardReentry` (ignore a re-fire while the key is in flight — a cheap
// double-submit guard) and `swallow` (swallow the rejection instead of
// rethrowing it).
//
// Framework-free (no component instance needed) so it is unit-testable in
// isolation. A reactive Set drives the reactivity: `.has()` in a template or
// computed tracks reads; `.add()`/`.delete()` trigger updates.
export interface UseBusyKeysRunOptions {
  // Ignore a re-fire while `key` is already in flight. Defaults to true.
  guardReentry?: boolean
  // Swallow the rejection instead of rethrowing it. Defaults to false so
  // callers can surface their own errors.
  swallow?: boolean
}

export function useBusyKeys() {
  const keys = reactive(new Set<string>())

  const isBusy = (key: string) => keys.has(key)
  const anyBusy = computed(() => keys.size > 0)

  // Run `fn` while `key` is marked busy; always clears the key, even on reject.
  // The rejection propagates unless `swallow` is set.
  const run = async (
    key: string,
    fn: () => Promise<unknown>,
    options: UseBusyKeysRunOptions = {},
  ) => {
    const { guardReentry = true, swallow = false } = options
    if (guardReentry && keys.has(key)) return
    keys.add(key)
    try {
      return await fn()
    } catch (e) {
      if (!swallow) throw e
    } finally {
      keys.delete(key)
    }
  }

  return { isBusy, anyBusy, run }
}
