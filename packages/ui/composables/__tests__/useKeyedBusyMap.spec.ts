// packages/ui/composables/__tests__/useKeyedBusyMap.spec.ts
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { useKeyedBusyMap } from '../useKeyedBusyMap'

// `ref` is provided as a global auto-import stub via test/setup.

describe('composables/useKeyedBusyMap', () => {
  it('marks only the targeted key busy during the async fn, clears it after', async () => {
    const { isBusy, run, map } = useKeyedBusyMap()
    let release!: () => void
    const gate = new Promise<void>((r) => (release = r))

    const p = run('node-a', () => gate)
    await nextTick()
    expect(isBusy('node-a')).toBe(true)
    expect(map.value['node-a']).toBe(true)
    expect(isBusy('node-b')).toBe(false)

    release()
    await p
    expect(isBusy('node-a')).toBe(false)
  })

  it('clears the key even when the fn rejects (and rethrows by default)', async () => {
    const { isBusy, run } = useKeyedBusyMap()
    await expect(
      run('node-x', () => Promise.reject(new Error('boom'))),
    ).rejects.toThrow('boom')
    expect(isBusy('node-x')).toBe(false)
  })

  it('swallows the rejection when swallow is set (and still clears the key)', async () => {
    const { isBusy, run } = useKeyedBusyMap()
    await expect(
      run('node-y', () => Promise.reject(new Error('nope')), { swallow: true }),
    ).resolves.toBeUndefined()
    expect(isBusy('node-y')).toBe(false)
  })

  it('runs re-entrantly by default, unlike useBusyKeys', async () => {
    const { run } = useKeyedBusyMap()
    let release!: () => void
    const gate = new Promise<void>((r) => (release = r))
    const fn = vi.fn(() => gate)

    const first = run('node-c', fn)
    await nextTick()
    const second = run('node-c', fn)
    expect(fn).toHaveBeenCalledTimes(2)

    release()
    await Promise.all([first, second])
  })

  it('ignores a re-fire when guardReentry is enabled', async () => {
    const { run } = useKeyedBusyMap()
    let release!: () => void
    const gate = new Promise<void>((r) => (release = r))
    const fn = vi.fn(() => gate)

    const first = run('node-d', fn, { guardReentry: true })
    await nextTick()
    await run('node-d', fn, { guardReentry: true })
    expect(fn).toHaveBeenCalledTimes(1)

    release()
    await first
    await run('node-d', fn, { guardReentry: true })
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('setBusy toggles an arbitrary key through the exposed map', () => {
    const { isBusy, setBusy, map } = useKeyedBusyMap()
    setBusy('provider-a', true)
    expect(isBusy('provider-a')).toBe(true)
    expect(map.value['provider-a']).toBe(true)
    setBusy('provider-a', false)
    expect(isBusy('provider-a')).toBe(false)
  })
})
