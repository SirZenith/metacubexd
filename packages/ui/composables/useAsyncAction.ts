// packages/ui/composables/useAsyncAction.ts
import { toast } from 'vue-sonner'
import { controlErrorMessage } from '~/utils/controlError'

// `useI18n` is auto-imported by @nuxtjs/i18n (no explicit import). In unit
// tests it is provided as a global stub via test/setup.ts.
declare function useI18n(): { t: (key: string, named?: object) => string }

interface AsyncActionOptions<T> {
  // i18n key for the failure toast title.
  errorKey: string
  // Runs after the task resolves, before `busy` clears. Use it for the success
  // toast so each call site can tailor its message/description.
  onSuccess?: (result: T) => void
}

// Collapses the repeated "flip a boolean busy flag, await the agent, toast
// success/failure" shell that every control composable hand-rolled. Failures
// always surface via toast (never swallowed) with the shared
// controlErrorMessage detail. Returns the task result, or `undefined` when it
// threw — boolean callers can coalesce with `?? false`.
export function useAsyncAction() {
  const { t } = useI18n()
  const busy = ref(false)

  const run = async <T>(
    task: () => Promise<T>,
    options: AsyncActionOptions<T>,
  ): Promise<T | undefined> => {
    busy.value = true
    try {
      const result = await task()
      options.onSuccess?.(result)
      return result
    } catch (e) {
      toast.error(t(options.errorKey), {
        description: controlErrorMessage(e),
      })
      return undefined
    } finally {
      busy.value = false
    }
  }

  return { busy, run }
}
