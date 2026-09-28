import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// The square icon buttons in proxies.vue (group/provider header actions and the
// page toolbar) share long utility strings. They must live in shared constants
// instead of being copy-pasted per button, so this guard fails when a
// >60-character class string that carries icon-button sizing appears more than
// once.
const source = readFileSync(resolve(process.cwd(), 'pages/proxies.vue'), 'utf8')

const CLASS_VALUE = /\bclass(?:\s*:\s*'([^']*)'|\s*=\s*"([^"]*)")/g

function iconButtonClasses(): string[] {
  return [...source.matchAll(CLASS_VALUE)]
    .map((match) => match[1] ?? match[2] ?? '')
    .filter((value) => value.length > 60 && /w-8 h-8|h-9 w-9/.test(value))
}

describe('proxies icon button classes', () => {
  it('finds the icon button class strings', () => {
    expect(iconButtonClasses().length).toBeGreaterThan(0)
  })

  it('defines each long icon-button class string once', () => {
    const values = iconButtonClasses()
    const duplicates = values.filter(
      (value, index) => values.indexOf(value) !== index,
    )
    expect(duplicates).toEqual([])
  })
})
