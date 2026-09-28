import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Icon-only controls need an accessible name, and the selected display mode
// must not be conveyed by the highlight color alone. This guard keeps the
// switcher's group label, per-button names, and aria-pressed state from
// regressing back to color-only selection.
const source = readFileSync(
  resolve(process.cwd(), 'components/ProxiesDisplayModeSwitcher.vue'),
  'utf8',
)

describe('proxies display mode switcher accessibility', () => {
  it('labels the toggle group', () => {
    expect(source).toMatch(/role="group"/)
    expect(source).toMatch(/:aria-label="t\('displayMode'\)"/)
  })

  it('gives every icon-only button an accessible name', () => {
    const buttons = source.match(/<button[\s\S]*?>/g) ?? []
    expect(buttons.length).toBeGreaterThan(0)
    for (const button of buttons) {
      expect(button).toContain(':aria-label=')
    }
  })

  it('exposes the selected mode with aria-pressed', () => {
    const button = source.match(/<button[\s\S]*?>/)![0]
    expect(button).toContain(':aria-pressed=')
    expect(button).toMatch(/configStore\.proxiesDisplayMode === item\.mode/)
  })
})
