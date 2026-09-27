import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Icon buttons must share one corner token — DESIGN.md's field radius
// (`rounded-lg`, 0.5rem). A variant drifting back to `rounded-md` would make
// the same component look different depending on emphasis, which is the drift
// this guard exists to prevent.
const source = readFileSync(
  resolve(process.cwd(), 'components/IconButton.vue'),
  'utf8',
)

describe('iconButton corner radius', () => {
  it('uses the field radius token on every variant', () => {
    expect(source).not.toContain('rounded-md')
    // outline, ghost and danger each carry the token.
    expect(source.match(/rounded-lg/g)?.length ?? 0).toBeGreaterThanOrEqual(3)
  })
})
