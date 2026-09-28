import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// `formatBytes` must have a single implementation in utils/index.ts. Pages and
// components used to redeclare it locally and reach for `byte-size` directly,
// which let byte formatting drift per surface. SubscriptionInfo is the one
// legitimate exception: it needs `byte-size`'s IEC units.
const root = process.cwd()
const SCAN_DIRS = ['pages', 'components', 'composables']
const BYTE_SIZE_ALLOWED = ['components/SubscriptionInfo.vue']

function collectSourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return collectSourceFiles(full)
    return entry.isFile() && /\.(?:vue|ts)$/.test(entry.name) ? [full] : []
  })
}

const files = SCAN_DIRS.flatMap((dir) => collectSourceFiles(resolve(root, dir)))

describe('formatBytes single source', () => {
  it('scans the ui sources', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it('does not redeclare formatBytes outside utils', () => {
    const offenders = files.filter((file) =>
      /\bconst formatBytes\s*=/.test(readFileSync(file, 'utf8')),
    )
    expect(offenders).toEqual([])
  })

  it('imports byte-size only where IEC units are required', () => {
    const offenders = files.filter(
      (file) =>
        !BYTE_SIZE_ALLOWED.some((allowed) => file.endsWith(allowed)) &&
        readFileSync(file, 'utf8').includes("from 'byte-size'"),
    )
    expect(offenders).toEqual([])
  })
})
