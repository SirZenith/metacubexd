// packages/ui/composables/__tests__/useAsyncAction.spec.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAsyncAction } from '../useAsyncAction'

// Failures surface via toast — never swallowed.
const { toast } = vi.hoisted(() => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))
vi.mock('vue-sonner', () => ({ toast }))
// useI18n() is provided as a global stub via test/setup.ts (returns the key).

describe('useAsyncAction', () => {
  beforeEach(() => {
    toast.success.mockClear()
    toast.error.mockClear()
  })

  it('runs the task, exposes busy, and reports the result to onSuccess', async () => {
    const { busy, run } = useAsyncAction()
    const onSuccess = vi.fn()

    const pending = run(async () => 42, { errorKey: 'ok', onSuccess })
    expect(busy.value).toBe(true)

    const result = await pending
    expect(result).toBe(42)
    expect(onSuccess).toHaveBeenCalledWith(42)
    expect(busy.value).toBe(false)
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('surfaces failures via toast.error with the control error message', async () => {
    const { busy, run } = useAsyncAction()

    const result = await run(
      async () => {
        throw new Error('boom')
      },
      { errorKey: 'failed' },
    )

    expect(result).toBeUndefined()
    expect(toast.error).toHaveBeenCalledWith('failed', {
      description: 'boom',
    })
    expect(busy.value).toBe(false)
  })

  it('clears busy even when the task throws', async () => {
    const { busy, run } = useAsyncAction()

    await run(
      async () => {
        throw new Error('x')
      },
      { errorKey: 'e' },
    )

    expect(busy.value).toBe(false)
  })
})
