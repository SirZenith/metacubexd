import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Corner radii must come from the design-token set documented in DESIGN.md
// (`rounded-lg` for fields, `rounded-xl`/`rounded-2xl` for panels). Arbitrary
// values like `rounded-[0.625rem]` drift from that system, so this guard fails
// when one is reintroduced.
const root = process.cwd()

const SCAN_DIRS = ['components', 'pages', 'layouts']
const SCAN_FILES = ['app.vue', 'error.vue']

function collectVueFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return collectVueFiles(full)
    return entry.isFile() && entry.name.endsWith('.vue') ? [full] : []
  })
}

const vueFiles = [
  ...SCAN_DIRS.flatMap((dir) => collectVueFiles(resolve(root, dir))),
  ...SCAN_FILES.map((file) => resolve(root, file)).filter((file) =>
    existsSync(file),
  ),
]

describe('rounded corner tokens', () => {
  it('scans the dashboard vue sources', () => {
    expect(vueFiles.length).toBeGreaterThan(0)
  })

  it('has no arbitrary rounded-[…] values', () => {
    const offenders = vueFiles.filter((file) =>
      readFileSync(file, 'utf8').includes('rounded-['),
    )
    expect(offenders).toEqual([])
  })
})
