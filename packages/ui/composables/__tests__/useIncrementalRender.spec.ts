// packages/ui/composables/__tests__/useIncrementalRender.spec.ts
import { describe, expect, it } from 'vitest'
import { nextRenderCount } from '../useIncrementalRender'

describe('composables/useIncrementalRender', () => {
  it('grows the window by one step', () => {
    expect(nextRenderCount(50, 500, 50)).toBe(100)
  })

  it('clamps the window to the total', () => {
    expect(nextRenderCount(480, 500, 50)).toBe(500)
  })

  it('stays at the total once fully rendered', () => {
    expect(nextRenderCount(500, 500, 50)).toBe(500)
  })

  it('keeps an empty list empty', () => {
    expect(nextRenderCount(0, 0, 50)).toBe(0)
  })
})
