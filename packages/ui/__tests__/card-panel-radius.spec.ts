import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Card/panel containers must use DESIGN.md's box radius (`rounded-2xl`,
// 1rem). These shared components define the look of every panel, so a drift
// back to `rounded-xl` would silently re-introduce the inconsistency this
// guard exists to prevent.
const PANEL_COMPONENTS = [
  'components/PanelCard.vue',
  'components/Collapse.vue',
  'components/ProxyNodeCard.vue',
  'components/ProxyMasterDetail.vue',
]

const readComponent = (file: string) =>
  readFileSync(resolve(process.cwd(), file), 'utf8')

// Matches bare `rounded-xl` plus every directional/logical variant
// (`rounded-t-xl`, `rounded-tl-xl`, `rounded-s-xl`, `rounded-ss-xl`, …) while
// leaving `rounded-2xl` / `rounded-3xl` alone, so a component cannot drift back
// to the compact-panel radius on one edge only.
const ROUNDED_XL = /rounded(?:-[a-z]{1,2})?-xl\b/

describe('card panel corner radius', () => {
  it.each(PANEL_COMPONENTS)('%s uses rounded-2xl', (file) => {
    const source = readComponent(file)
    expect(source).toContain('rounded-2xl')
    expect(source).not.toMatch(ROUNDED_XL)
  })
})
