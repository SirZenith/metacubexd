import type { ChildProcess } from 'node:child_process'
import type { BrowserContext, Page } from 'playwright'
// Page-based e2e tests for metacubexd dashboard
// Usage: pnpm test:e2e
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

// Validate PORT is a valid number for security
function validatePort(port: string): string {
  const portNum = Number.parseInt(port, 10)

  if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
    throw new Error(`Invalid port: ${port}`)
  }

  return portNum.toString()
}

const PORT = validatePort(process.env.PORT || '4199')
const BASE_URL = `http://localhost:${PORT}`
const NITRO_CONFIG_PATH = resolve(process.cwd(), '.output/nitro.json')
const NITRO_CHUNK_PATH = resolve(
  process.cwd(),
  '.output/server/chunks/nitro/nitro.mjs',
)
const SERVER_ENTRY_PATH = resolve(process.cwd(), '.output/server/index.mjs')
const PAGE_LOAD_TIMEOUT = 30000
const ELEMENT_TIMEOUT = 10000
const SERVER_READY_TIMEOUT = 30000
const SERVER_STOP_TIMEOUT = 5000

async function runCommand(command: string, args: string[], env = process.env) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      env,
    })

    child.on('error', reject)

    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve()

        return
      }

      reject(
        new Error(
          `${command} ${args.join(' ')} failed with ${signal || `exit code ${code}`}`,
        ),
      )
    })
  })
}

async function ensurePreviewBuild() {
  const hasMockBuild =
    existsSync(NITRO_CONFIG_PATH) &&
    existsSync(SERVER_ENTRY_PATH) &&
    existsSync(NITRO_CHUNK_PATH) &&
    readFileSync(NITRO_CHUNK_PATH, 'utf8').includes('"mockMode": true')

  if (hasMockBuild) {
    return
  }

  console.log('Mock preview build not found. Building Nuxt app for e2e...')
  await runCommand('pnpm', ['exec', 'nuxt', 'build'], {
    ...process.env,
    MOCK_MODE: 'true',
  })
}

async function waitForServer(timeout = SERVER_READY_TIMEOUT): Promise<void> {
  const deadline = Date.now() + timeout

  while (Date.now() < deadline) {
    try {
      const response = await fetch(BASE_URL)

      if (response.ok) {
        console.log(`Server is ready at ${BASE_URL}`)

        return
      }
    } catch {
      // Server not ready yet
    }

    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  throw new Error(`Server failed to start within ${timeout}ms`)
}

function getPage(page: Page | null): Page {
  if (!page) {
    throw new Error('Playwright page was not initialized')
  }

  return page
}

async function gotoAppPath(page: Page | null, path: string): Promise<Page> {
  const currentPage = getPage(page)

  if (currentPage.url().startsWith(BASE_URL)) {
    await currentPage.evaluate((nextPath) => {
      window.location.hash = nextPath
    }, path)
  } else {
    await currentPage.goto(`${BASE_URL}/#${path}`, {
      waitUntil: 'domcontentloaded',
      timeout: PAGE_LOAD_TIMEOUT,
    })
  }

  await expectHashPath(currentPage, path)
  await currentPage.waitForLoadState('networkidle')

  return currentPage
}

async function expectHashPath(page: Page | null, path: string): Promise<void> {
  await expect
    .poll(() => getPage(page).url(), { timeout: ELEMENT_TIMEOUT })
    .toContain(`#${path}`)
}

async function stopServer(server: ChildProcess): Promise<void> {
  if (server.exitCode !== null || server.signalCode !== null) {
    return
  }

  await new Promise<void>((resolve) => {
    const timeout = setTimeout(() => {
      if (server.exitCode === null && server.signalCode === null) {
        server.kill('SIGKILL')
      }
    }, SERVER_STOP_TIMEOUT)

    server.once('exit', () => {
      clearTimeout(timeout)
      resolve()
    })

    server.kill('SIGTERM')
  })
}

describe('e2E Page Tests', () => {
  let server: ChildProcess | null = null
  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null
  let context: BrowserContext | null = null
  let page: Page | null = null

  beforeAll(async () => {
    await ensurePreviewBuild()

    // Start the preview server
    console.log(`Starting preview server on port ${PORT}...`)
    server = spawn(process.execPath, [SERVER_ENTRY_PATH], {
      stdio: 'inherit',
      env: {
        ...process.env,
        PORT,
        MOCK_MODE: 'true',
      },
    })

    server.on('error', (err) => {
      console.error('Server error:', err)
    })

    // Wait for server to be ready
    await waitForServer()

    // Launch browser
    browser = await chromium.launch({ headless: true })
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
      // Pin the browser locale so i18n's detectBrowserLanguage always resolves
      // to English. Without this the context inherits the host locale (e.g.
      // zh-CN on a Chinese machine), the UI renders in that language, and every
      // English-text assertion below fails.
      locale: 'en-US',
    })
    page = await context.newPage()

    // Setup localStorage - must navigate to origin first, then set storage
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
    await page.evaluate(() => {
      localStorage.setItem('curTheme', '"dark"')
      // Note: VueUse's useLocalStorage<string> stores raw strings, not JSON-serialized
      // But useLocalStorage<T[]> expects JSON-serialized arrays
      localStorage.setItem('selectedEndpoint', 'mock-endpoint')
      localStorage.setItem(
        'endpointList',
        JSON.stringify([
          { id: 'mock-endpoint', url: 'http://127.0.0.1:9090', secret: '' },
        ]),
      )
    })
    // Reload to apply localStorage changes to Pinia store
    await page.reload({ waitUntil: 'domcontentloaded' })
  }, 120000)

  afterAll(async () => {
    try {
      if (context) {
        await context.close()
      }

      if (browser) {
        await browser.close()
      }
    } finally {
      if (server) {
        console.log('Stopping preview server...')
        await stopServer(server)
      }
    }
  })

  describe('overview Page', () => {
    it('should display stats container and charts', async () => {
      const currentPage = await gotoAppPath(page, '/overview')

      // Wait for expected element - overview stat cards
      await currentPage.waitForSelector('.overview-stat-card', {
        timeout: ELEMENT_TIMEOUT,
      })

      // Check for stat cards
      const statCards = currentPage.locator('.overview-stat-card')
      await expect(statCards.count()).resolves.toBe(6)
      await expect(
        statCards.filter({ hasText: 'Upload' }).count(),
      ).resolves.toBeGreaterThan(0)
      await expect(
        statCards.filter({ hasText: 'Download' }).count(),
      ).resolves.toBeGreaterThan(0)
      await expect(
        statCards.filter({ hasText: 'Active Connections' }).count(),
      ).resolves.toBe(1)

      await expect(currentPage.getByText('Traffic').count()).resolves.toBe(1)
      await expect(
        currentPage.getByText('Memory').count(),
      ).resolves.toBeGreaterThan(0)
    })
  })

  describe('proxies Page', () => {
    it('should display tabs and proxy cards', async () => {
      const currentPage = await gotoAppPath(page, '/proxies')

      await currentPage.waitForSelector('text=Proxy Providers', {
        timeout: ELEMENT_TIMEOUT,
      })
      await expect(
        currentPage.locator('button').filter({ hasText: 'Proxies' }).count(),
      ).resolves.toBeGreaterThan(0)
      await expect(
        currentPage
          .locator('button')
          .filter({ hasText: 'Proxy Providers' })
          .count(),
      ).resolves.toBeGreaterThan(0)
      await expect(
        currentPage.getByRole('button', { name: 'Test All' }).isVisible(),
      ).resolves.toBe(true)
    })

    it('should jump to the selected proxy on desktop', async () => {
      const currentPage = await gotoAppPath(page, '/proxies')
      const jumpButton = currentPage.locator(
        'button[data-testid="jump-to-current"][data-proxy-group="Auto Select"]',
      )
      const selectedProxy = currentPage.locator(
        '[data-proxy-group="Auto Select"][data-selected="true"]',
      )

      await expect
        .poll(() => jumpButton.isVisible(), { timeout: ELEMENT_TIMEOUT })
        .toBe(true)
      const wasExpanded = (await selectedProxy.count()) > 0

      await currentPage.evaluate(() => {
        const testWindow = window as unknown as Record<string, unknown>
        testWindow.originalScrollIntoView = Element.prototype.scrollIntoView
        Element.prototype.scrollIntoView = function () {
          testWindow.scrolledProxyGroup = (
            this as HTMLElement
          ).dataset.proxyGroup
        }
      })

      try {
        await jumpButton.click()
        await expect
          .poll(() =>
            currentPage.evaluate(
              () =>
                (window as unknown as Record<string, unknown>)
                  .scrolledProxyGroup,
            ),
          )
          .toBe('Auto Select')
        await expect(selectedProxy.isVisible()).resolves.toBe(true)
      } finally {
        await currentPage.evaluate(() => {
          const testWindow = window as unknown as Record<string, unknown>
          Element.prototype.scrollIntoView =
            testWindow.originalScrollIntoView as typeof Element.prototype.scrollIntoView
          delete testWindow.originalScrollIntoView
          delete testWindow.scrolledProxyGroup
        })
        if (!wasExpanded) {
          await jumpButton.evaluate((button) => {
            const groupHeader = button.closest(
              '.cursor-pointer',
            ) as HTMLElement | null
            groupHeader?.click()
          })
        }
      }
    })

    it('should scroll the master-detail pane to top on desktop', async () => {
      const currentPage = await gotoAppPath(page, '/proxies')
      await currentPage.setViewportSize({ width: 1024, height: 600 })

      try {
        await currentPage.getByTitle('Master-detail').click()
        const detailScrollContainer = currentPage.getByTestId(
          'master-detail-scroll-container',
        )
        const detailHeader = currentPage.getByTestId('master-detail-header')
        await expect(
          detailHeader.locator('input[type="search"]').count(),
        ).resolves.toBe(0)
        const headerTopBeforeScroll = await detailHeader.evaluate(
          (element) => element.getBoundingClientRect().top,
        )

        await detailScrollContainer.evaluate((element) => {
          const spacer = document.createElement('div')
          spacer.style.flex = '0 0 600px'
          spacer.setAttribute('aria-hidden', 'true')
          element.append(spacer)
          element.scrollTop = 320
          element.dispatchEvent(new Event('scroll'))
        })
        await expect(
          detailHeader.evaluate(
            (element) => element.getBoundingClientRect().top,
          ),
        ).resolves.toBe(headerTopBeforeScroll)

        const scrollToTopButton = currentPage.getByTestId('scroll-to-top')
        await expect
          .poll(() => scrollToTopButton.isVisible(), {
            timeout: ELEMENT_TIMEOUT,
          })
          .toBe(true)

        await currentPage.emulateMedia({ reducedMotion: 'reduce' })
        await scrollToTopButton.click()
        await expect(
          detailScrollContainer.evaluate((element) => element.scrollTop),
        ).resolves.toBe(0)
      } finally {
        await currentPage.emulateMedia({ reducedMotion: 'no-preference' })
        await currentPage.getByTitle('Card').click()
        await currentPage
          .getByTestId('proxies-scroll-container')
          .evaluate((element) => {
            element.scrollTop = 0
            element.dispatchEvent(new Event('scroll'))
          })
        await currentPage.setViewportSize({ width: 1920, height: 1080 })
      }
    })

    it('should test the whole group instead of per-node probes in master-detail', async () => {
      const currentPage = await gotoAppPath(page, '/proxies')
      await expect
        .poll(
          () =>
            currentPage.getByTestId('display-mode-masterDetailMode').count(),
          { timeout: ELEMENT_TIMEOUT },
        )
        .toBeGreaterThan(0)
      // Switch by test id: the switcher's title is localized.
      await currentPage.getByTestId('display-mode-masterDetailMode').click()

      try {
        const nodeList = currentPage.getByTestId(
          'master-detail-scroll-container',
        )
        const groupTest = currentPage.getByTestId('master-detail-test-group')

        await expect
          .poll(
            () => nodeList.locator('[role="button"][aria-pressed]').count(),
            { timeout: ELEMENT_TIMEOUT },
          )
          .toBeGreaterThan(0)
        // The group header owns the probe; individual rows must not.
        await expect
          .poll(() => groupTest.count(), { timeout: ELEMENT_TIMEOUT })
          .toBe(1)
        await expect
          .poll(() => nodeList.getByTestId('node-latency-test').count(), {
            timeout: ELEMENT_TIMEOUT,
          })
          .toBe(0)

        // Running the probe must leave the control operable again.
        await groupTest.click()
        await expect
          .poll(() => groupTest.isEnabled(), { timeout: ELEMENT_TIMEOUT })
          .toBe(true)
      } finally {
        await currentPage.getByTestId('display-mode-cardMode').click()
      }
    })

    it('should not auto-scroll the master-detail list to the selected node', async () => {
      const currentPage = await gotoAppPath(page, '/proxies')
      await expect
        .poll(
          () =>
            currentPage.getByTestId('display-mode-masterDetailMode').count(),
          { timeout: ELEMENT_TIMEOUT },
        )
        .toBeGreaterThan(0)
      await currentPage.getByTestId('display-mode-masterDetailMode').click()

      try {
        const nodeList = currentPage.getByTestId(
          'master-detail-scroll-container',
        )
        await expect
          .poll(
            () => nodeList.locator('[role="button"][aria-pressed]').count(),
            { timeout: ELEMENT_TIMEOUT },
          )
          .toBeGreaterThan(0)

        // The list must open at its natural position (top), not scrolled to
        // centre the selected row.
        await expect
          .poll(() => nodeList.evaluate((element) => element.scrollTop), {
            timeout: ELEMENT_TIMEOUT,
          })
          .toBe(0)

        // Switching groups must also leave the list at the top.
        const secondGroup = currentPage
          .locator('button')
          .filter({ hasText: 'Streaming' })
          .first()
        await expect
          .poll(() => secondGroup.count(), { timeout: ELEMENT_TIMEOUT })
          .toBeGreaterThan(0)
        await secondGroup.click()
        await expect
          .poll(() => nodeList.evaluate((element) => element.scrollTop), {
            timeout: ELEMENT_TIMEOUT,
          })
          .toBe(0)
      } finally {
        await currentPage.getByTestId('display-mode-cardMode').click()
      }
    })

    it('should scroll the active proxy tab to top on mobile', async () => {
      const currentPage = getPage(page)
      await currentPage.setViewportSize({ width: 390, height: 844 })

      try {
        // On a freshly loaded page the app resolves its empty initial hash to
        // /overview. Wait for that redirect to settle before navigating,
        // otherwise it overwrites the new hash and the page stays on
        // /overview.
        await expect
          .poll(() => new URL(currentPage.url()).hash, {
            timeout: ELEMENT_TIMEOUT,
          })
          .toMatch(/^#\/[a-z]/)
        await gotoAppPath(currentPage, '/proxies')

        const proxyScrollContainer = currentPage.getByTestId(
          'proxies-scroll-container',
        )
        // The mobile toolbar is collapsed by default, so reveal it before
        // using the Expand All action.
        const toolsToggle = currentPage.getByTestId('proxies-tools-toggle')
        await expect
          .poll(() => toolsToggle.isVisible(), { timeout: ELEMENT_TIMEOUT })
          .toBe(true)
        await toolsToggle.click()
        await currentPage.getByTitle('Expand All').click()
        await expect
          .poll(
            () =>
              proxyScrollContainer.evaluate(
                (el) => el.scrollHeight - el.clientHeight,
              ),
            { timeout: ELEMENT_TIMEOUT },
          )
          .toBeGreaterThan(360)

        await proxyScrollContainer.evaluate((el) => {
          el.scrollTop = 0
          el.dispatchEvent(new Event('scroll'))
        })
        await expect
          .poll(() => currentPage.getByTestId('scroll-to-top').count(), {
            timeout: ELEMENT_TIMEOUT,
          })
          .toBe(0)
        await proxyScrollContainer.evaluate((el) => {
          el.scrollTop = 360
          el.dispatchEvent(new Event('scroll'))
        })

        const scrollToTopButton = currentPage.getByTestId('scroll-to-top')
        await expect
          .poll(() => scrollToTopButton.isVisible(), {
            timeout: ELEMENT_TIMEOUT,
          })
          .toBe(true)

        // Reduced-motion users should jump immediately instead of animating.
        await currentPage.emulateMedia({ reducedMotion: 'reduce' })
        await scrollToTopButton.click()
        await expect(
          proxyScrollContainer.evaluate((el) => el.scrollTop),
        ).resolves.toBe(0)
        await currentPage.emulateMedia({ reducedMotion: 'no-preference' })

        // The providers tab owns a separate scroll container. Re-selecting the
        // active Proxies item in the mobile nav should scroll that container.
        await currentPage
          .locator('button')
          .filter({ hasText: 'Proxy Providers' })
          .click()
        await currentPage.getByText('Provider A', { exact: true }).click()
        await currentPage.getByText('Provider B', { exact: true }).click()

        const providerScrollContainer = currentPage.getByTestId(
          'providers-scroll-container',
        )
        await expect
          .poll(
            () =>
              providerScrollContainer.evaluate(
                (el) => el.scrollHeight - el.clientHeight,
              ),
            { timeout: ELEMENT_TIMEOUT },
          )
          .toBeGreaterThan(320)
        await providerScrollContainer.evaluate((el) => {
          el.scrollTop = 320
          el.dispatchEvent(new Event('scroll'))
        })

        const mobileNav = currentPage.getByRole('navigation', {
          name: 'Mobile bottom navigation',
        })
        await mobileNav.locator('a[href="#/proxies"]').click()
        await expect
          .poll(() => providerScrollContainer.evaluate((el) => el.scrollTop), {
            timeout: ELEMENT_TIMEOUT,
          })
          .toBe(0)

        // The floating control remains available after switching to desktop.
        await providerScrollContainer.evaluate((el) => {
          el.scrollTop = 320
          el.dispatchEvent(new Event('scroll'))
        })
        await expect
          .poll(() => scrollToTopButton.isVisible(), {
            timeout: ELEMENT_TIMEOUT,
          })
          .toBe(true)
        await currentPage.setViewportSize({ width: 1024, height: 844 })
        await expect(scrollToTopButton.isVisible()).resolves.toBe(true)
        await scrollToTopButton.click()
        await expect
          .poll(() => providerScrollContainer.evaluate((el) => el.scrollTop), {
            timeout: ELEMENT_TIMEOUT,
          })
          .toBe(0)

        // Inactive bottom-nav items preserve their normal navigation behavior.
        await currentPage.setViewportSize({ width: 390, height: 844 })
        // Restore the collapsed toolbar before leaving /proxies so later tests
        // start from the default (the page may be kept alive).
        await currentPage.getByTestId('proxies-tools-toggle').click()
        await mobileNav.locator('a[href="#/overview"]').click()
        await expectHashPath(currentPage, '/overview')
      } finally {
        await currentPage.emulateMedia({ reducedMotion: 'no-preference' })
        await currentPage.setViewportSize({ width: 1920, height: 1080 })
      }
    })

    it('should collapse the mobile proxies toolbar behind a tools toggle', async () => {
      const currentPage = getPage(page)
      await currentPage.setViewportSize({ width: 390, height: 844 })

      try {
        await gotoAppPath(currentPage, '/proxies')

        const toolsToggle = currentPage.getByTestId('proxies-tools-toggle')
        const actions = currentPage.getByTestId('proxies-actions')
        const tabs = currentPage.getByTestId('proxies-tabs')

        await expect
          .poll(() => toolsToggle.isVisible(), { timeout: ELEMENT_TIMEOUT })
          .toBe(true)
        // Collapsed by default on small screens.
        await expect(actions.isVisible()).resolves.toBe(false)
        await expect(toolsToggle.getAttribute('aria-expanded')).resolves.toBe(
          'false',
        )

        // The toggle sits on the tabs row, at its far right.
        const tabsBox = await tabs.boundingBox()
        const toggleBox = await toolsToggle.boundingBox()
        expect(tabsBox).not.toBeNull()
        expect(toggleBox).not.toBeNull()
        expect(Math.abs(toggleBox!.y - tabsBox!.y)).toBeLessThan(
          tabsBox!.height,
        )
        expect(toggleBox!.x).toBeGreaterThan(tabsBox!.x + tabsBox!.width)

        // Expanding reveals the actions and marks the toggle active.
        await toolsToggle.click()
        await expect(actions.isVisible()).resolves.toBe(true)
        await expect(toolsToggle.getAttribute('aria-expanded')).resolves.toBe(
          'true',
        )

        // Collapsing hides them again.
        await toolsToggle.click()
        await expect(actions.isVisible()).resolves.toBe(false)
        await expect(toolsToggle.getAttribute('aria-expanded')).resolves.toBe(
          'false',
        )

        // Desktop keeps the toolbar always visible and hides the toggle.
        await currentPage.setViewportSize({ width: 1280, height: 800 })
        await expect(toolsToggle.isVisible()).resolves.toBe(false)
        await expect(actions.isVisible()).resolves.toBe(true)
      } finally {
        await currentPage.setViewportSize({ width: 1920, height: 1080 })
      }
    })

    it('should collapse every region of the mobile proxies toolbar', async () => {
      const currentPage = getPage(page)
      await currentPage.setViewportSize({ width: 390, height: 844 })

      try {
        await gotoAppPath(currentPage, '/proxies')

        const toolsToggle = currentPage.getByTestId('proxies-tools-toggle')
        const toolbarParts = [
          currentPage.getByTestId('proxies-actions'),
          currentPage.getByTestId('proxies-name-filter'),
          currentPage.getByTestId('proxies-connectivity'),
          currentPage.getByTestId('proxies-settings'),
        ]

        await expect
          .poll(() => toolsToggle.isVisible(), { timeout: ELEMENT_TIMEOUT })
          .toBe(true)

        // Every toolbar region is hidden while collapsed on small screens.
        await Promise.all(
          toolbarParts.map((part) =>
            expect(part.isVisible()).resolves.toBe(false),
          ),
        )

        // Expanding reveals every region.
        await toolsToggle.click()
        await Promise.all(
          toolbarParts.map((part) =>
            expect(part.isVisible()).resolves.toBe(true),
          ),
        )

        // Collapsing hides them all again.
        await toolsToggle.click()
        await Promise.all(
          toolbarParts.map((part) =>
            expect(part.isVisible()).resolves.toBe(false),
          ),
        )

        // Desktop shows every region and hides the toggle.
        await currentPage.setViewportSize({ width: 1280, height: 800 })
        await expect(toolsToggle.isVisible()).resolves.toBe(false)
        await Promise.all(
          toolbarParts.map((part) =>
            expect(part.isVisible()).resolves.toBe(true),
          ),
        )
      } finally {
        await currentPage.setViewportSize({ width: 1920, height: 1080 })
      }
    })
  })

  describe('connections Page', () => {
    it('should display connections table', async () => {
      const currentPage = await gotoAppPath(page, '/connections')

      // Wait for table
      await currentPage.waitForSelector('table', { timeout: ELEMENT_TIMEOUT })

      // Check for connections table
      const table = currentPage.locator('table').first()
      await expect(table.isVisible()).resolves.toBe(true)

      // Check for table header
      await expect(table.locator('thead').count()).resolves.toBe(1)
      await expect(table.locator('thead').innerText()).resolves.toContain(
        'HOST',
      )
    })
  })

  describe('rules Page', () => {
    it('should display rules tabs', async () => {
      const currentPage = await gotoAppPath(page, '/rules')

      await currentPage.waitForSelector('text=Rule Providers', {
        timeout: ELEMENT_TIMEOUT,
      })
      await expect(
        currentPage.locator('button').filter({ hasText: 'Rules' }).count(),
      ).resolves.toBeGreaterThan(0)
      await expect(
        currentPage
          .locator('button')
          .filter({ hasText: 'Rule Providers' })
          .count(),
      ).resolves.toBeGreaterThan(0)
      await expect(
        currentPage.getByPlaceholder('Search').isVisible(),
      ).resolves.toBe(true)
    })
  })

  describe('logs Page', () => {
    it('should display logs table', async () => {
      const currentPage = await gotoAppPath(page, '/logs')

      // Wait for table
      await currentPage.waitForSelector('table', { timeout: ELEMENT_TIMEOUT })

      // Check for logs table
      const table = currentPage.locator('table').first()
      await expect(table.isVisible()).resolves.toBe(true)
      await expect(table.locator('thead').innerText()).resolves.toContain(
        'Level',
      )
      await expect(table.locator('thead').innerText()).resolves.toContain(
        'Payload',
      )
    })
  })

  describe('config Page', () => {
    it('should display config fieldsets', async () => {
      const currentPage = await gotoAppPath(page, '/config')

      await currentPage.waitForSelector('.config-card', {
        timeout: ELEMENT_TIMEOUT,
      })
      await expect(
        currentPage.locator('.config-card').count(),
      ).resolves.toBeGreaterThan(0)
      await expect(
        currentPage.getByText('Keyboard Shortcuts').first().isVisible(),
      ).resolves.toBe(true)
    })
  })

  describe('setup Page', () => {
    it('should display setup form with inputs', async () => {
      const currentPage = await gotoAppPath(page, '/setup')

      // Wait for setup form
      await currentPage.waitForSelector('#url', {
        state: 'visible',
        timeout: ELEMENT_TIMEOUT,
      })

      // Check for setup form
      const form = currentPage.locator('form').first()
      await expect(form.isVisible()).resolves.toBe(true)

      // Check for input fields
      await expect(currentPage.locator('#url').isVisible()).resolves.toBe(true)
      await expect(currentPage.locator('#secret').isVisible()).resolves.toBe(
        true,
      )

      // Check for submit button
      await expect(
        currentPage.getByRole('button', { name: 'Add' }).isVisible(),
      ).resolves.toBe(true)
    })
  })

  describe('navigation', () => {
    it('should have header/navigation present', async () => {
      const currentPage = await gotoAppPath(page, '/overview')

      await currentPage.waitForSelector('a[href="#/overview"]', {
        state: 'visible',
        timeout: ELEMENT_TIMEOUT,
      })
      await expect(
        currentPage.locator('a[href="#/overview"]').first().isVisible(),
      ).resolves.toBe(true)
      await expect(
        currentPage.locator('a[href="#/proxies"]').first().isVisible(),
      ).resolves.toBe(true)
    })
  })

  describe('keyboard Shortcuts', () => {
    it('should open help modal when pressing ?', async () => {
      const currentPage = await gotoAppPath(page, '/overview')

      // Press ? key (Shift + /)
      await currentPage.keyboard.press('Shift+/')

      // Wait for modal to appear
      await currentPage.waitForSelector('.modal-open', {
        timeout: ELEMENT_TIMEOUT,
      })

      // Check modal is visible
      const modal = currentPage.locator('.modal-open')
      await expect(modal.isVisible()).resolves.toBe(true)

      // Check modal contains shortcuts content
      const modalContent = currentPage.locator('.modal-box')
      await expect(modalContent.isVisible()).resolves.toBe(true)
      await expect(modalContent.innerText()).resolves.toContain(
        'Keyboard Shortcuts',
      )

      // Close with Escape
      await currentPage.keyboard.press('Escape')

      // Modal should be closed
      await currentPage.waitForSelector('.modal-open', {
        state: 'hidden',
        timeout: ELEMENT_TIMEOUT,
      })
    })

    it('should navigate to proxies page with g+p', async () => {
      const currentPage = await gotoAppPath(page, '/overview')

      // Press g then p
      await currentPage.keyboard.press('g')
      await currentPage.keyboard.press('p')

      await expectHashPath(page, '/proxies')
    })

    it('should navigate to connections page with g+c', async () => {
      const currentPage = await gotoAppPath(page, '/overview')

      // Press g then c
      await currentPage.keyboard.press('g')
      await currentPage.keyboard.press('c')

      await expectHashPath(page, '/connections')
    })

    it('should not trigger shortcuts when typing in input', async () => {
      const currentPage = await gotoAppPath(page, '/setup')

      // Find an input field on setup page
      const input = currentPage.locator('#url')
      await input.waitFor({ state: 'visible', timeout: ELEMENT_TIMEOUT })
      await input.click()

      // Type 'g' and 'p' in input - should not navigate
      await input.type('gp')

      await expectHashPath(page, '/setup')
    })
  })

  describe('mobile Viewport', () => {
    async function configureMobileLayout(
      currentPage: Page,
      useMobileBottomNav: boolean,
      height: number,
    ) {
      await currentPage.setViewportSize({ width: 390, height })
      await currentPage.evaluate((enabled) => {
        localStorage.setItem('useMobileBottomNav', String(enabled))
      }, useMobileBottomNav)
      await currentPage.reload({ waitUntil: 'domcontentloaded' })
      await currentPage.waitForLoadState('networkidle')
    }

    async function restoreDesktopLayout(currentPage: Page) {
      await currentPage.evaluate(() => {
        localStorage.setItem('useMobileBottomNav', 'true')
        document.body.style.paddingBottom = ''
      })
      await currentPage.setViewportSize({ width: 1920, height: 1080 })
      await currentPage.reload({ waitUntil: 'domcontentloaded' })
    }

    it('should keep the document viewport locked with either mobile navigation', async () => {
      const currentPage = getPage(page)

      try {
        for (const useMobileBottomNav of [true, false]) {
          await configureMobileLayout(currentPage, useMobileBottomNav, 844)
          await gotoAppPath(currentPage, '/overview')
          await currentPage.waitForSelector('.overview-stat-card', {
            timeout: ELEMENT_TIMEOUT,
          })

          const viewportState = await currentPage.evaluate(() => {
            const nuxtRoot = document.querySelector<HTMLElement>('#__nuxt')
            if (!nuxtRoot) throw new Error('Nuxt root was not rendered')

            const roots = [document.documentElement, document.body, nuxtRoot]
            const overflowY = roots.map(
              (element) => getComputedStyle(element).overflowY,
            )
            const heights = roots.map((element) => element.clientHeight)

            // Recreate the kind of incidental body growth that previously let
            // the mobile document move independently from its page scrollport.
            document.body.style.paddingBottom = '5rem'
            window.scrollTo(0, document.documentElement.scrollHeight)
            const windowScrollY = window.scrollY
            document.body.style.paddingBottom = ''
            window.scrollTo(0, 0)

            return {
              heights,
              overflowY,
              viewportHeight: window.innerHeight,
              windowScrollY,
            }
          })

          expect(viewportState.overflowY).toEqual([
            'hidden',
            'hidden',
            'hidden',
          ])
          expect(viewportState.heights).toEqual([
            viewportState.viewportHeight,
            viewportState.viewportHeight,
            viewportState.viewportHeight,
          ])
          expect(viewportState.windowScrollY).toBe(0)
        }
      } finally {
        await restoreDesktopLayout(currentPage)
      }
    })

    it('should scroll page content without moving the header on a short viewport', async () => {
      const currentPage = getPage(page)

      try {
        for (const useMobileBottomNav of [true, false]) {
          await configureMobileLayout(currentPage, useMobileBottomNav, 500)
          await gotoAppPath(currentPage, '/overview')
          await currentPage.waitForSelector('.overview-stat-card', {
            timeout: ELEMENT_TIMEOUT,
          })

          const scrollState = await currentPage.evaluate(() => {
            const firstCard = document.querySelector('.overview-stat-card')
            const scrollport =
              firstCard?.closest<HTMLElement>('.overflow-y-auto')
            const header = document.querySelector<HTMLElement>('header')
            if (!scrollport || !header) {
              throw new Error(
                'Mobile header or overview scrollport was missing',
              )
            }

            const headerTopBefore = header.getBoundingClientRect().top
            const maxScroll = scrollport.scrollHeight - scrollport.clientHeight
            scrollport.scrollTop = Math.min(200, maxScroll)

            return {
              headerTopAfter: header.getBoundingClientRect().top,
              headerTopBefore,
              maxScroll,
              scrollTop: scrollport.scrollTop,
              windowScrollY: window.scrollY,
            }
          })

          expect(scrollState.maxScroll).toBeGreaterThan(0)
          expect(scrollState.scrollTop).toBeGreaterThan(0)
          expect(scrollState.headerTopAfter).toBe(scrollState.headerTopBefore)
          expect(scrollState.windowScrollY).toBe(0)
        }
      } finally {
        await restoreDesktopLayout(currentPage)
      }
    })

    it('should stack custom time range inputs without horizontal overflow', async () => {
      const currentPage = getPage(page)

      try {
        await configureMobileLayout(currentPage, true, 844)
        await currentPage.evaluate(() => {
          localStorage.setItem('traffic_time_range', '-1')
        })
        await currentPage.reload({ waitUntil: 'domcontentloaded' })

        // pages/index.vue replaces the entry route with defaultPage once on
        // load; a first hash navigation can race with that replace and be
        // overwritten. Retry until the target route sticks.
        for (let attempt = 0; attempt < 3; attempt++) {
          await gotoAppPath(currentPage, '/traffic')
          const hash = await currentPage.evaluate(() => window.location.hash)
          if (hash === '#/traffic') break
          await currentPage.waitForTimeout(300)
        }

        await currentPage.waitForSelector(
          '[data-testid="traffic-time-range"] input[type="datetime-local"]',
          { timeout: ELEMENT_TIMEOUT },
        )

        const layout = await currentPage.evaluate(() => {
          const container = document.querySelector<HTMLElement>(
            '[data-testid="traffic-time-range"]',
          )
          if (!container) throw new Error('Time range container was missing')

          const inputs = Array.from(
            container.querySelectorAll<HTMLInputElement>(
              'input[type="datetime-local"]',
            ),
          )
          const containerRect = container.getBoundingClientRect()

          return {
            containerRect: {
              left: containerRect.left,
              right: containerRect.right,
            },
            inputRects: inputs.map((input) => {
              const rect = input.getBoundingClientRect()

              return {
                bottom: rect.bottom,
                left: rect.left,
                right: rect.right,
                top: rect.top,
              }
            }),
            viewportWidth: window.innerWidth,
          }
        })

        // The custom range shows two inputs at mobile widths.
        expect(layout.inputRects).toHaveLength(2)

        // The whole header row must fit the viewport...
        expect(layout.containerRect.left).toBeGreaterThanOrEqual(0)
        expect(layout.containerRect.right).toBeLessThanOrEqual(
          layout.viewportWidth + 1,
        )

        // ...the individual inputs must stay inside it...
        for (const rect of layout.inputRects) {
          expect(rect.left).toBeGreaterThanOrEqual(0)
          expect(rect.right).toBeLessThanOrEqual(layout.viewportWidth + 1)
        }

        // ...and the two inputs must stack vertically instead of squeezing
        // onto a single row.
        const [start, end] = layout.inputRects as [
          (typeof layout.inputRects)[number],
          (typeof layout.inputRects)[number],
        ]
        expect(end.top).toBeGreaterThan(start.top)
      } finally {
        await currentPage.evaluate(() => {
          localStorage.setItem('traffic_time_range', '3600000')
        })
        await restoreDesktopLayout(currentPage)
      }
    })

    it('should fit the logs table inside the viewport on mobile', async () => {
      const currentPage = getPage(page)

      try {
        await configureMobileLayout(currentPage, true, 844)
        await currentPage.reload({ waitUntil: 'domcontentloaded' })

        // See the traffic test above: the entry redirect can race the first
        // hash navigation, so retry until the target route sticks.
        for (let attempt = 0; attempt < 3; attempt++) {
          await gotoAppPath(currentPage, '/logs')
          const hash = await currentPage.evaluate(() => window.location.hash)
          if (hash === '#/logs') break
          await currentPage.waitForTimeout(300)
        }

        await currentPage.waitForSelector(
          '[data-testid="logs-table-container"] table',
          { timeout: ELEMENT_TIMEOUT },
        )

        const layout = await currentPage.evaluate(() => {
          const container = document.querySelector<HTMLElement>(
            '[data-testid="logs-table-container"]',
          )
          if (!container) throw new Error('Logs table container missing')

          return {
            clientWidth: container.clientWidth,
            scrollWidth: container.scrollWidth,
          }
        })

        // Long payloads must wrap on narrow screens instead of forcing the
        // table into horizontal scroll.
        expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1)
      } finally {
        await restoreDesktopLayout(currentPage)
      }
    })

    it('should truncate a long endpoint url to a single line', async () => {
      const currentPage = getPage(page)
      const longUrl =
        'https://metacubexd-dashboard-endpoint-with-a-very-long-hostname.example.com:8443'

      try {
        await configureMobileLayout(currentPage, true, 844)
        await currentPage.evaluate((url) => {
          localStorage.setItem('selectedEndpoint', 'long-endpoint')
          localStorage.setItem(
            'endpointList',
            JSON.stringify([{ id: 'long-endpoint', url, secret: '' }]),
          )
        }, longUrl)
        await currentPage.reload({ waitUntil: 'domcontentloaded' })

        for (let attempt = 0; attempt < 3; attempt++) {
          await gotoAppPath(currentPage, '/overview')
          const hash = await currentPage.evaluate(() => window.location.hash)
          if (hash === '#/overview') break
          await currentPage.waitForTimeout(300)
        }

        await currentPage.waitForSelector('.overview-stat-card', {
          timeout: ELEMENT_TIMEOUT,
        })

        const layout = await currentPage.evaluate(() => {
          const urlSpan = Array.from(document.querySelectorAll('span')).find(
            (span) =>
              span.textContent?.includes('metacubexd-dashboard-endpoint'),
          )
          if (!urlSpan) throw new Error('Endpoint url span was missing')
          const rect = urlSpan.getBoundingClientRect()

          return {
            clientWidth: urlSpan.clientWidth,
            height: rect.height,
            right: rect.right,
            scrollWidth: urlSpan.scrollWidth,
            viewportWidth: window.innerWidth,
          }
        })

        // The url stays on one line, truncated rather than wrapped or clipped.
        expect(layout.height).toBeLessThan(30)
        expect(layout.right).toBeLessThanOrEqual(layout.viewportWidth + 1)
        expect(layout.scrollWidth).toBeGreaterThan(layout.clientWidth)
      } finally {
        await currentPage.evaluate(() => {
          localStorage.setItem('selectedEndpoint', 'mock-endpoint')
          localStorage.setItem(
            'endpointList',
            JSON.stringify([
              { id: 'mock-endpoint', url: 'http://127.0.0.1:9090', secret: '' },
            ]),
          )
        })
        await restoreDesktopLayout(currentPage)
      }
    })

    it('should keep the expanded traffic popover above the mobile bottom nav', async () => {
      const currentPage = getPage(page)

      try {
        await configureMobileLayout(currentPage, true, 844)
        await currentPage.evaluate(() => {
          localStorage.setItem('globalTrafficIndicatorCollapsed', 'false')
        })
        await currentPage.reload({ waitUntil: 'domcontentloaded' })

        for (let attempt = 0; attempt < 3; attempt++) {
          await gotoAppPath(currentPage, '/overview')
          const hash = await currentPage.evaluate(() => window.location.hash)
          if (hash === '#/overview') break
          await currentPage.waitForTimeout(300)
        }

        await currentPage.waitForSelector(
          '[data-testid="global-traffic-popover"]',
          { timeout: ELEMENT_TIMEOUT },
        )

        const layout = await currentPage.evaluate(() => {
          const popover = document.querySelector<HTMLElement>(
            '[data-testid="global-traffic-popover"]',
          )
          const nav = document.querySelector<HTMLElement>(
            '[data-testid="mobile-bottom-nav"]',
          )
          if (!popover || !nav) throw new Error('popover or nav missing')

          return {
            navTop: nav.getBoundingClientRect().top,
            popoverBottom: popover.getBoundingClientRect().bottom,
          }
        })

        // The expanded popover must clear the bottom nav instead of covering it.
        expect(layout.popoverBottom).toBeLessThanOrEqual(layout.navTop)
      } finally {
        await currentPage.evaluate(() => {
          localStorage.setItem('globalTrafficIndicatorCollapsed', 'true')
        })
        await restoreDesktopLayout(currentPage)
      }
    })
  })
})
