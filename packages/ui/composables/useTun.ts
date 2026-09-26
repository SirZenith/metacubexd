// packages/ui/composables/useTun.ts
import type { TunStatus } from '~/types/control'
import { toast } from 'vue-sonner'
import { useAsyncAction } from './useAsyncAction'
import { useControlApi } from './useControlApi'
import { useControlInfo } from './useControlInfo'
import { onControlInvalidate } from './useControlSync'

// `useI18n` is auto-imported by @nuxtjs/i18n (no explicit import). In unit
// tests it is provided as a global stub via test/setup.ts.
declare function useI18n(): { t: (key: string, named?: object) => string }

// TUN-mode control (capability-gated 'tun'). On desktop, flipping TUN cannot go
// through the unprivileged Clash API PATCH — it must route through
// /api/control/tun so the agent can install/elevate the privileged helper and
// privileged-restart mihomo. enable(stack) switches into TUN mode; disable()
// tears TUN down and returns to the in-process sidecar, doubling as the
// "recover network" escape hatch. Every call is slow (install/elevation/
// kernel restart), so `busy` gates the UI. Failures surface via toast — never
// swallowed.
export function useTun() {
  const api = useControlApi()
  const { hasFeature } = useControlInfo()
  const { t } = useI18n()
  const { busy, run } = useAsyncAction()

  // Drives the desktop-only UI — same capability-gating pattern as the other
  // control composables.
  const available = computed(() => hasFeature('tun'))

  // Default to the safe sidecar state until the first GET resolves.
  const status = ref<TunStatus>({ enabled: false, mode: 'sidecar' })

  // Re-sync from the agent when TUN is toggled from outside the SPA (the tray
  // checkbox routes through the Control API, not this composable). (#2148)
  onControlInvalidate(() => {
    void load()
  })

  const load = () =>
    run(
      async () => {
        status.value = await api.getTun()
      },
      { errorKey: 'tunLoadFailed' },
    )

  // Switch into TUN mode. Omit `stack` from the body when none is chosen so the
  // agent falls back to the kernel/profile default.
  const enable = (stack?: string) =>
    run(
      async () => {
        status.value = await api.setTun(
          stack ? { enabled: true, stack } : { enabled: true },
        )
      },
      {
        errorKey: 'tunEnableFailed',
        onSuccess: () => toast.success(t('tunEnableSuccess')),
      },
    )

  // Tear TUN down + return to the sidecar. Also exposed as the recover-network
  // action (forces the kernel back into the unprivileged in-process mode).
  const disable = () =>
    run(
      async () => {
        status.value = await api.setTun({ enabled: false })
      },
      {
        errorKey: 'tunDisableFailed',
        onSuccess: () => toast.success(t('tunDisableSuccess')),
      },
    )

  // Remove the privileged helper service entirely. The agent tears TUN down to
  // the sidecar first, then unregisters the OS service — useful to revoke the
  // elevation grant or recover from a wedged/stale install. Echoes the
  // post-uninstall status (sidecar).
  const uninstall = () =>
    run(
      async () => {
        status.value = await api.uninstallTun()
      },
      {
        errorKey: 'tunUninstallFailed',
        onSuccess: () => toast.success(t('tunUninstallSuccess')),
      },
    )

  return { available, status, busy, load, enable, disable, uninstall }
}
