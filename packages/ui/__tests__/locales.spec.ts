import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const localesDir = resolve(process.cwd(), 'i18n/locales')

const ALL_LOCALES = ['zh', 'ru', 'ja', 'ko', 'fr', 'fa'] as const

// Locales that must have full key parity with the canonical en.json source.
// en is the source of truth; every shipped locale translates the exact same
// key set (missing keys fall back at runtime, but parity is required here).
// ru used to be excluded while it caught up on newer feature keys; it is now
// covered by the strict-parity guard like the rest.
const PARITY_LOCALES = ALL_LOCALES

type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

const readLocale = (code: string): Record<string, JsonValue> => {
  const raw = readFileSync(resolve(localesDir, `${code}.json`), 'utf8')
  return JSON.parse(raw) as Record<string, JsonValue>
}

const flattenKeys = (obj: Record<string, JsonValue>, prefix = ''): string[] =>
  Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix + key
    return value !== null && typeof value === 'object' && !Array.isArray(value)
      ? flattenKeys(value as Record<string, JsonValue>, `${path}.`)
      : [path]
  })

describe('i18n locales', () => {
  const enKeys = flattenKeys(readLocale('en')).sort()

  it('has a non-empty en source key set', () => {
    expect(enKeys.length).toBeGreaterThan(0)
  })

  // Every shipped locale must at least be valid JSON.
  for (const code of ALL_LOCALES) {
    it(`${code}.json is valid JSON`, () => {
      expect(() => readLocale(code)).not.toThrow()
    })
  }

  // The new desktop locales (and zh) must mirror en.json key-for-key.
  for (const code of PARITY_LOCALES) {
    it(`${code}.json has exact key parity with en.json`, () => {
      const keys = flattenKeys(readLocale(code)).sort()
      expect(keys).toEqual(enKeys)
    })
  }
})
