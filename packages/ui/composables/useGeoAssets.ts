// packages/ui/composables/useGeoAssets.ts
import { toast } from 'vue-sonner'
import { useAsyncAction } from './useAsyncAction'
import { useControlApi } from './useControlApi'
import { useControlInfo } from './useControlInfo'

// `useI18n` is auto-imported by @nuxtjs/i18n (no explicit import). In unit
// tests it is provided as a global stub via test/setup.ts.
declare function useI18n(): { t: (key: string, named?: object) => string }

// Geo asset updater (capability-gated 'geo-assets'). One button POSTs
// geo/update which downloads the geoip/geosite/mmdb databases into the kernel
// home dir. Success/failure surface via toast — never swallowed.
export function useGeoAssets() {
  const api = useControlApi()
  const { hasFeature } = useControlInfo()
  const { t } = useI18n()

  const available = computed(() => hasFeature('geo-assets'))
  const { busy: updating, run } = useAsyncAction()

  const update = () =>
    run(() => api.updateGeoAssets(), {
      errorKey: 'geoUpdateFailed',
      onSuccess: (res) =>
        toast.success(t('geoUpdateSuccess'), {
          description: res.files.join(', '),
        }),
    })

  return { available, updating, update }
}
