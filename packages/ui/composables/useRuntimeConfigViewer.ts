// packages/ui/composables/useRuntimeConfigViewer.ts
import { useAsyncAction } from './useAsyncAction'
import { useControlApi } from './useControlApi'
import { useControlInfo } from './useControlInfo'

// `useI18n` is auto-imported by @nuxtjs/i18n (no explicit import). In unit
// tests it is provided as a global stub via test/setup.ts.
declare function useI18n(): { t: (key: string, named?: object) => string }

// Runtime config viewer (capability-gated 'runtime-config'). A read-only view of
// the ACTUAL config file the kernel runs with -f (GET config/runtime). It differs
// from the active profile source: it carries the supervisor-injected
// external-controller/secret/mixed-port. refresh() re-reads it; failures surface
// via toast — never swallowed.
export function useRuntimeConfigViewer() {
  const api = useControlApi()
  const { hasFeature } = useControlInfo()

  const available = computed(() => hasFeature('runtime-config'))
  const content = ref('')
  const { busy: loading, run } = useAsyncAction()

  const refresh = () =>
    run(
      async () => {
        content.value = await api.getRuntimeConfig()
      },
      { errorKey: 'runtimeConfigLoadFailed' },
    )

  return { available, content, loading, refresh }
}
