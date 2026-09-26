// packages/ui/composables/useKernelVersions.ts
import { toast } from 'vue-sonner'
import { useAsyncAction } from './useAsyncAction'
import { useControlApi } from './useControlApi'
import { useControlInfo } from './useControlInfo'

// `useI18n` is auto-imported by @nuxtjs/i18n (no explicit import). In unit
// tests it is provided as a global stub via test/setup.ts.
declare function useI18n(): { t: (key: string, named?: object) => string }

// Kernel version manager (capability-gated 'kernel-version'). Lists the
// downloaded + bundled mihomo versions, lets the user pick one and switch to
// it (download + persist + live restart on the agent side). Failures surface
// via toast — never swallowed.
export function useKernelVersions() {
  const api = useControlApi()
  const { hasFeature } = useControlInfo()
  const { t } = useI18n()

  // Drives the panel's v-if — same capability-gating pattern as the other panels.
  const available = computed(() => hasFeature('kernel-version'))

  const versions = ref<string[]>([])
  const current = ref<string | undefined>(undefined)
  const bundled = ref('')
  const selected = ref('')
  const { busy: loading, run: runLoad } = useAsyncAction()
  const { busy: switching, run: runSwitch } = useAsyncAction()

  const load = () =>
    runLoad(
      async () => {
        const res = await api.getKernelVersions()
        versions.value = res.versions
        current.value = res.current
        bundled.value = res.bundled
        // Default the <select> to the currently active version.
        selected.value = res.current ?? res.versions[0] ?? ''
      },
      { errorKey: 'kernelVersionLoadFailed' },
    )

  const switch_ = async () => {
    const version = selected.value
    if (!version) return
    await runSwitch(
      async () => {
        await api.switchKernel(version)
        // The kernel restarts under a new binary — re-read the version list so
        // `current` reflects the switch.
        await load()
      },
      {
        errorKey: 'kernelVersionSwitchFailed',
        onSuccess: () => toast.success(t('kernelVersionSwitched', { version })),
      },
    )
  }

  return {
    available,
    versions,
    current,
    bundled,
    selected,
    loading,
    switching,
    load,
    // `switch` is a reserved word — expose it under the friendly name.
    switch: switch_,
  }
}
