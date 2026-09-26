<script setup lang="ts">
import type { DNSQuery } from '~/types'
import {
  IconArrowsExchange,
  IconBolt,
  IconBox,
  IconClock,
  IconDatabase,
  IconDeviceDesktop,
  IconDeviceFloppy,
  IconDownload,
  IconMoodSmile,
  IconPlayerPlay,
  IconRefresh,
  IconRestore,
  IconSearch,
  IconSettings,
  IconStack2,
  IconTool,
  IconTrash,
  IconUpload,
  IconWifi,
  IconWorld,
  IconX,
} from '@tabler/icons-vue'
import { useMutation } from '@tanstack/vue-query'
import { useConfigActions, useRequest } from '~/composables/useApi'
import { PORT_FIELDS, useGeneralConfig } from '~/composables/useGeneralConfig'
import {
  useConfigQuery,
  useUpdateConfigMutation,
  useVersionQuery,
} from '~/composables/useQueries'

const { t } = useI18n()
const nodeRecommendationStore = useNodeRecommendationStore()

useHead({ title: computed(() => t('config')) })
const router = useRouter()
const configStore = useConfigStore()
const endpointStore = useEndpointStore()
const proxiesStore = useProxiesStore()

const configActions = useConfigActions()
const runtimeConfig = useRuntimeConfig()

// Appearance & settings backup
const appearance = useAppearance()
// Advanced custom CSS injection (managed <style> in <head>); active on this page.
useCustomCss()
const { downloadSettings, importSettings } = useSettingsBackup()

const backgroundFileInput = ref<HTMLInputElement>()
const settingsFileInput = ref<HTMLInputElement>()

const themeColorTokens = CUSTOM_THEME_TOKENS

const fontOptions = [
  { label: 'System Default', value: '' },
  { label: 'MiSans', value: "'MiSans'" },
  { label: 'Sarasa UI SC', value: "'Sarasa UI SC'" },
  { label: 'PingFang SC', value: "'PingFang SC'" },
  { label: 'Fira Sans', value: "'Fira Sans'" },
  { label: 'Noto Sans SC', value: "'Noto Sans SC'" },
]

async function onUploadBackground(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  await appearance.setCustomBackground(file)
  if (backgroundFileInput.value) backgroundFileInput.value.value = ''
}

async function onClearBackground() {
  await appearance.clearCustomBackground()
  configStore.backgroundImageType = 'none'
}

function onThemeColorInput(token: string, event: Event) {
  const value = (event.target as HTMLInputElement).value
  configStore.customThemeColors = {
    ...configStore.customThemeColors,
    [token]: value,
  }
}

async function onImportSettings(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    await importSettings(file)
    window.location.reload()
  } catch {
    input.value = ''
  }
}

const frontendVersion = `v${runtimeConfig.public.appVersion || '0.0.0'}`

// TanStack Query
const {
  data: backendConfig,
  isLoading: isLoadingConfig,
  isError: isErrorConfig,
} = useConfigQuery()
const {
  data: backendVersion,
  isLoading: isLoadingVersion,
  isError: isErrorVersion,
} = useVersionQuery()
const updateConfigMutation = useUpdateConfigMutation()

// TUN PATCH (remote backends only — desktop routes through /api/control/tun).
function saveTun(value: { enable?: boolean; stack?: string; device?: string }) {
  updateConfigMutation.mutate({ key: 'tun', value: value as any })
}

const generalConfig = useGeneralConfig({
  mutation: {
    mutate: (vars, opts) => updateConfigMutation.mutate(vars as any, opts),
  },
  onModeChange: () => proxiesStore.closeAllConnections(),
})

// DNS settings editor (PATCH /configs { dns }) — works against any mihomo
// backend. mutateAsync rejects on failure so save() can surface it via toast.
const dnsSettings = useDnsSettings({
  mutate: (vars) => updateConfigMutation.mutateAsync(vars as any),
})

// Check if sing-box backend
const isSingBox = computed(() => isSingBoxVersion(backendVersion.value))

const enhancedModes = ['fake-ip', 'redir-host']

// TUN stack options
const tunStacks = ['Mixed', 'gVisor', 'System', 'LWIP']

// TUN section wiring. On desktop (capability 'tun') flipping TUN cannot go
// through the unprivileged Clash-API PATCH — it must route through
// /api/control/tun so the agent installs/elevates the privileged helper and
// privileged-restarts mihomo. On a plain remote backend the capability is
// absent and we keep the existing PATCH behaviour (the `patch` callback).
const tunConfig = useTunConfig({
  patch: (value) => saveTun(value),
})
onMounted(() => tunConfig.init())

async function onTunToggle() {
  // In desktop mode onToggle drives the privileged enable/disable and syncs its
  // own status; keep the local checkbox in lock-step with the resolved state so
  // a rejected/cancelled elevation does not leave the toggle stuck "on".
  await tunConfig.onToggle(tunForm.tunEnable, tunForm.tunStack)
  if (tunConfig.desktopMode.value) {
    tunForm.tunEnable = tunConfig.enabled.value
  }
}

function onTunStackChange() {
  void tunConfig.onStackChange(tunForm.tunStack)
}

async function onRecoverNetwork() {
  await tunConfig.onRecoverNetwork()
  tunForm.tunEnable = tunConfig.enabled.value
}

async function onUninstallHelper() {
  // Removing the privileged helper revokes the elevation grant and is
  // irreversible — confirm before the single-click destructive action.
  if (!confirm(t('tunUninstallConfirm'))) return
  await tunConfig.onUninstall()
  // Uninstall tears TUN down to the sidecar, so reflect that in the toggle.
  tunForm.tunEnable = tunConfig.enabled.value
}

// DNS Query
const dnsQuery = reactive({
  name: '',
  type: 'A',
})
const dnsQueryResult = ref<string[]>([])

const dnsQueryMutation = useMutation({
  mutationFn: async ({ name, type }: { name: string; type: string }) => {
    const request = useRequest()
    const result = await request
      .get('dns/query', {
        searchParams: { name: name || 'google.com', type },
      })
      .json<DNSQuery>()
    return result.Answer?.map(({ data }) => data) || []
  },
  onSuccess: (data) => {
    dnsQueryResult.value = data
  },
})

function onDnsQueryInput() {
  if (!dnsQuery.name) dnsQueryResult.value = []
}

function onDnsQuery() {
  dnsQueryMutation.mutate({ name: dnsQuery.name, type: dnsQuery.type })
}

// Remote config URL
const remoteConfigURL = ref('')

async function onFetchRemoteConfig() {
  if (!remoteConfigURL.value) return
  try {
    await configActions.fetchRemoteConfigAPI(remoteConfigURL.value)
  } catch {
    /* error already logged in API */
  }
}

// TUN display adapter — deliberately merges desktop-live tun.status (watch #2)
// with the remote backend config (watch #1) into one bound value. NOT pure
// duplication; consolidating it into useTunConfig is a deferred follow-up.
const tunForm = reactive({
  tunEnable: false,
  tunStack: 'Mixed',
  tunDevice: '',
})

// Hydrate the domain composables + the TUN adapter from the loaded config.
watch(
  backendConfig,
  (config) => {
    if (!config) return
    generalConfig.syncFromConfig(config)
    dnsSettings.syncFromConfig(config)
    // On desktop the live TUN enable is owned by /api/control/tun (watch below);
    // only seed it from the Clash config on a remote backend.
    if (!tunConfig.desktopMode.value) {
      tunForm.tunEnable = config.tun?.enable || false
    }
    tunForm.tunStack = config.tun?.stack || 'Mixed'
    tunForm.tunDevice = config.tun?.device || ''
  },
  { immediate: true },
)

// Desktop: mirror the live /api/control/tun status into the toggle + stack
// select (the GET resolves after init(), and enable/disable update it).
watch(
  () => [tunConfig.enabled.value, tunConfig.stack.value] as const,
  ([enabled, stack]) => {
    if (!tunConfig.desktopMode.value) return
    tunForm.tunEnable = enabled
    if (stack) tunForm.tunStack = stack
  },
)

function getModeLabel(mode: string) {
  const knownModes = ['rule', 'direct', 'global']
  if (knownModes.includes(mode)) {
    return t(mode as any) || mode
  }
  return mode
}

function switchEndpoint() {
  endpointStore.setSelectedEndpoint('')
  router.push('/setup')
}

const isLoading = computed(
  () => isLoadingConfig.value || isLoadingVersion.value,
)

const isError = computed(() => isErrorConfig.value || isErrorVersion.value)

// Active section for mobile tabs
const activeSection = ref<'core' | 'xd' | 'tools'>('core')
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-1">
    <!-- p-1: overflow-y-auto forces overflow-x to compute to auto, which clips
         the config-card box-shadow ring on the left/right edges; padding on all
         sides also gives the first/last card's top/bottom ring room (gap-4 only
         spaces the inner edges). -->
    <!-- Loading State -->
    <div
      v-if="isLoading && !isError"
      class="flex h-64 items-center justify-center"
    >
      <LoadingState :label="t('config')" />
    </div>

    <!-- Error State - Backend Unreachable -->
    <div v-else-if="isError" class="flex h-64 items-center justify-center">
      <div class="flex flex-col items-center gap-4 text-center">
        <div
          class="flex h-16 w-16 items-center justify-center rounded-full bg-error/10 text-error"
        >
          <IconX :size="32" />
        </div>
        <div>
          <h2 class="text-lg font-bold">{{ t('connectionError') }}</h2>
          <p class="mt-1 max-w-sm text-sm opacity-60">
            {{ t('connectionErrorDesc') }}
          </p>
          <p class="mt-1 text-xs opacity-40">
            {{ endpointStore.currentEndpoint?.url }}
          </p>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-primary btn-sm" @click="$router.go(0)">
            {{ t('retry') }}
          </button>
          <button
            class="btn btn-outline btn-info btn-sm"
            @click="switchEndpoint"
          >
            {{ t('switchEndpoint') }}
          </button>
        </div>
      </div>
    </div>

    <template v-else>
      <!-- Header with Version Info -->
      <div
        class="animate-fade-slide-in flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="flex items-center gap-3">
          <div
            class="animate-pulse-subtle flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"
          >
            <IconSettings :size="24" />
          </div>
          <div class="min-w-0">
            <h1 class="text-xl font-bold tracking-tight">{{ t('config') }}</h1>
            <button
              class="flex max-w-full items-center gap-1 text-xs opacity-60 transition-colors hover:opacity-100"
              :title="t('switchEndpoint')"
              @click="switchEndpoint"
            >
              <IconArrowsExchange :size="12" class="shrink-0" />
              <span class="truncate">{{
                endpointStore.currentEndpoint?.url
              }}</span>
            </button>
          </div>
        </div>
        <Versions
          horizontal
          :frontend-version="frontendVersion"
          :backend-version="backendVersion || ''"
        />
      </div>

      <!-- Mobile Section Tabs -->
      <div
        class="flex gap-1 rounded-lg border border-base-content/10 bg-base-200 p-1 sm:hidden"
      >
        <button
          class="press-tactile flex min-w-0 flex-1 cursor-pointer items-center justify-center rounded-md border-none bg-transparent px-1.5 py-1.5 text-xs font-medium text-base-content/70 transition-colors duration-200 hover:text-base-content"
          :class="
            activeSection === 'core'
              ? 'bg-primary/15 text-primary hover:text-primary'
              : ''
          "
          @click="activeSection = 'core'"
        >
          <span class="truncate">{{ t('coreConfig') }}</span>
        </button>
        <button
          class="press-tactile flex min-w-0 flex-1 cursor-pointer items-center justify-center rounded-md border-none bg-transparent px-1.5 py-1.5 text-xs font-medium text-base-content/70 transition-colors duration-200 hover:text-base-content"
          :class="
            activeSection === 'xd'
              ? 'bg-primary/15 text-primary hover:text-primary'
              : ''
          "
          @click="activeSection = 'xd'"
        >
          <span class="truncate">{{ t('xdConfig') }}</span>
        </button>
        <button
          v-if="!isSingBox"
          class="press-tactile flex min-w-0 flex-1 cursor-pointer items-center justify-center rounded-md border-none bg-transparent px-1.5 py-1.5 text-xs font-medium text-base-content/70 transition-colors duration-200 hover:text-base-content"
          :class="
            activeSection === 'tools'
              ? 'bg-primary/15 text-primary hover:text-primary'
              : ''
          "
          @click="activeSection = 'tools'"
        >
          <span class="truncate">{{ t('dnsQuery') }}</span>
        </button>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Core Config Card -->
        <div
          class="config-card animate-fade-slide-in-1 hidden sm:block"
          :class="{ '!block': activeSection === 'core' }"
        >
          <div
            class="flex items-center gap-2 border-b border-base-content/5 bg-base-300/30 px-4 py-3 text-sm font-semibold"
          >
            <IconStack2 :size="20" />
            <span>{{ t('coreConfig') }}</span>
          </div>

          <div class="flex flex-col gap-3 p-4">
            <!-- Basic Settings -->
            <div class="flex flex-col gap-2">
              <ConfigSettingRow>
                <template #label>
                  <div class="flex items-center gap-2 text-sm">
                    <IconWorld :size="16" class="opacity-60" />
                    <span>{{ t('allowLan') }}</span>
                  </div>
                </template>
                <input
                  id="enable-allow-lan"
                  v-model="generalConfig.form.allowLan"
                  type="checkbox"
                  class="toggle toggle-primary"
                  @change="
                    generalConfig.save('allow-lan', generalConfig.form.allowLan)
                  "
                />
              </ConfigSettingRow>

              <ConfigSettingRow>
                <template #label>
                  <div class="flex items-center gap-2 text-sm">
                    <IconBolt :size="16" class="opacity-60" />
                    <span>{{ t('runningMode') }}</span>
                  </div>
                </template>
                <select
                  id="mode"
                  v-model="generalConfig.form.mode"
                  class="select-bordered select w-32 select-sm"
                  @change="generalConfig.saveMode()"
                >
                  <option
                    v-for="mode in generalConfig.modes.value"
                    :key="mode"
                    :value="mode"
                  >
                    {{ getModeLabel(mode) }}
                  </option>
                </select>
              </ConfigSettingRow>

              <ConfigSettingRow v-if="!isSingBox">
                <template #label>
                  <div class="flex items-center gap-2 text-sm">
                    <IconClock :size="16" class="opacity-60" />
                    <span>{{ t('unifiedDelay') }}</span>
                  </div>
                </template>
                <input
                  id="unified-delay"
                  v-model="generalConfig.form.unifiedDelay"
                  type="checkbox"
                  class="toggle toggle-primary"
                  @change="
                    generalConfig.save(
                      'unified-delay',
                      generalConfig.form.unifiedDelay,
                    )
                  "
                />
              </ConfigSettingRow>

              <ConfigSettingRow>
                <template #label>
                  <div class="flex items-center gap-2 text-sm">
                    <IconDeviceDesktop :size="16" class="opacity-60" />
                    <span>{{ t('outboundInterfaceName') }}</span>
                  </div>
                </template>
                <input
                  id="interface-name"
                  v-model="generalConfig.form.interfaceName"
                  type="text"
                  class="input-bordered input w-32 input-sm"
                  @change="
                    generalConfig.save(
                      'interface-name',
                      generalConfig.form.interfaceName,
                    )
                  "
                />
              </ConfigSettingRow>
            </div>

            <!-- TUN Settings (hide for sing-box) -->
            <template v-if="!isSingBox">
              <div class="divider my-2 text-xs opacity-40">TUN</div>
              <div class="flex flex-col gap-2">
                <ConfigSettingRow>
                  <template #label>
                    <div class="flex items-center gap-2 text-sm">
                      <IconWifi :size="16" class="opacity-60" />
                      <span>{{ t('enableTunDevice') }}</span>
                    </div>
                  </template>
                  <div class="flex items-center gap-2">
                    <span
                      v-if="tunConfig.desktopMode.value && tunConfig.busy.value"
                      class="loading loading-xs loading-spinner text-primary"
                      aria-hidden="true"
                    />
                    <input
                      id="enable-tun-device"
                      v-model="tunForm.tunEnable"
                      type="checkbox"
                      class="toggle toggle-primary"
                      :disabled="
                        tunConfig.desktopMode.value &&
                        (tunConfig.busy.value ||
                          (tunConfig.needsProfile.value &&
                            !tunConfig.enabled.value))
                      "
                      @change="onTunToggle"
                    />
                  </div>
                </ConfigSettingRow>

                <!-- Desktop (capability 'tun'): live status + install/elevation
                     note + recover-network escape hatch. -->
                <template v-if="tunConfig.desktopMode.value">
                  <ConfigSettingRow>
                    <template #label>
                      <span class="pl-5 text-sm opacity-70">{{
                        t('tunStatusLabel')
                      }}</span>
                    </template>
                    <span
                      class="badge badge-sm"
                      :class="
                        tunConfig.enabled.value
                          ? 'badge-success'
                          : 'badge-ghost'
                      "
                    >
                      {{
                        tunConfig.enabled.value
                          ? t('tunStatusActive')
                          : t('tunStatusSidecar')
                      }}
                    </span>
                  </ConfigSettingRow>

                  <p
                    v-if="tunConfig.needsProfile.value"
                    class="px-2 text-xs leading-relaxed text-warning"
                  >
                    {{ t('tunNeedsProfile') }}
                  </p>

                  <p
                    v-if="tunConfig.showInstallNote.value"
                    class="px-2 text-xs leading-relaxed opacity-60"
                  >
                    {{ t('tunInstallNote') }}
                  </p>

                  <Button
                    v-if="tunConfig.showRecoverButton.value"
                    class="btn-outline btn-error btn-sm"
                    :loading="tunConfig.busy.value"
                    @click="onRecoverNetwork"
                  >
                    <IconRefresh :size="16" />
                    {{ t('tunRecoverNetwork') }}
                  </Button>

                  <Button
                    v-if="tunConfig.showUninstallButton.value"
                    class="self-start btn-ghost text-error btn-xs"
                    :loading="tunConfig.busy.value"
                    @click="onUninstallHelper"
                  >
                    <IconTrash :size="16" />
                    {{ t('tunUninstallHelper') }}
                  </Button>
                </template>

                <ConfigSettingRow>
                  <template #label>
                    <div class="flex items-center gap-2 text-sm">
                      <span class="pl-5">{{ t('tunModeStack') }}</span>
                    </div>
                  </template>
                  <select
                    id="tun-ip-stack"
                    v-model="tunForm.tunStack"
                    class="select-bordered select w-32 select-sm"
                    :disabled="
                      tunConfig.desktopMode.value && tunConfig.busy.value
                    "
                    @change="onTunStackChange"
                  >
                    <option
                      v-for="stack in tunStacks"
                      :key="stack"
                      :value="stack"
                    >
                      {{ stack }}
                    </option>
                  </select>
                </ConfigSettingRow>

                <!-- TUN device name is agent-managed on desktop; only editable
                     against a plain remote backend (Clash-API PATCH). -->
                <ConfigSettingRow v-if="!tunConfig.desktopMode.value">
                  <template #label>
                    <div class="flex items-center gap-2 text-sm">
                      <span class="pl-5">{{ t('tunDeviceName') }}</span>
                    </div>
                  </template>
                  <input
                    id="device-name"
                    v-model="tunForm.tunDevice"
                    type="text"
                    class="input-bordered input w-32 input-sm"
                    @change="saveTun({ device: tunForm.tunDevice })"
                  />
                </ConfigSettingRow>
              </div>

              <!-- Port Settings -->
              <div class="divider my-2 text-xs opacity-40">PORTS</div>
              <div class="flex flex-col gap-2">
                <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <fieldset
                    v-for="port in PORT_FIELDS"
                    :key="port.key"
                    class="fieldset"
                  >
                    <label class="label text-xs opacity-70" :for="port.key">
                      {{ t('port', { name: port.label }) }}
                    </label>
                    <input
                      :id="port.key"
                      v-model.number="generalConfig.form[port.key]"
                      type="number"
                      class="input-bordered input w-full font-mono input-sm"
                      :placeholder="t('port', { name: port.label })"
                      @change="
                        generalConfig.save(
                          port.configKey,
                          generalConfig.form[port.key],
                        )
                      "
                    />
                  </fieldset>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- XD Config Card -->
        <div
          class="config-card animate-fade-slide-in-2 hidden sm:block"
          :class="{ '!block': activeSection === 'xd' }"
        >
          <div
            class="flex items-center gap-2 border-b border-base-content/5 bg-base-300/30 px-4 py-3 text-sm font-semibold"
          >
            <IconMoodSmile :size="20" />
            <span>{{ t('xdConfig') }}</span>
          </div>

          <div class="flex flex-col gap-3 p-4">
            <div class="flex flex-col gap-2">
              <ConfigSettingRow>
                <template #label>
                  <div class="flex items-center gap-2 text-sm">
                    <span>{{ t('enableTwemoji') }}</span>
                  </div>
                </template>
                <input
                  v-model="configStore.enableTwemoji"
                  type="checkbox"
                  class="toggle toggle-primary"
                />
              </ConfigSettingRow>

              <ConfigSettingRow>
                <template #label>
                  <div class="flex flex-col gap-0.5">
                    <span class="text-sm">{{
                      t('enableDataUsageTracking')
                    }}</span>
                    <span class="text-xs opacity-50">{{
                      t('enableDataUsageTrackingDesc')
                    }}</span>
                  </div>
                </template>
                <input
                  v-model="configStore.enableDataUsageTracking"
                  type="checkbox"
                  class="toggle toggle-primary"
                />
              </ConfigSettingRow>

              <ConfigSettingRow>
                <template #label>
                  <div class="flex flex-col gap-0.5">
                    <span class="text-sm">{{
                      t('resolveClientHostname')
                    }}</span>
                    <span class="text-xs opacity-50">{{
                      t('resolveClientHostnameDesc')
                    }}</span>
                  </div>
                </template>
                <input
                  v-model="configStore.resolveClientHostname"
                  type="checkbox"
                  class="toggle toggle-primary"
                />
              </ConfigSettingRow>

              <!-- Mobile Bottom Nav Toggle - only visible on mobile -->
              <ConfigSettingRow class="lg:hidden">
                <template #label>
                  <div class="flex items-center gap-2 text-sm">
                    <span>{{ t('useMobileBottomNav') }}</span>
                  </div>
                </template>
                <input
                  v-model="configStore.useMobileBottomNav"
                  type="checkbox"
                  class="toggle toggle-primary"
                />
              </ConfigSettingRow>

              <ConfigSettingRow>
                <template #label>
                  <div class="flex items-center gap-2 text-sm">
                    <span>{{ t('defaultPage') }}</span>
                  </div>
                </template>
                <select
                  v-model="configStore.defaultPage"
                  class="select-bordered select select-sm"
                >
                  <option value="overview">{{ t('overview') }}</option>
                  <option value="proxies">{{ t('proxies') }}</option>
                  <option value="connections">{{ t('connections') }}</option>
                  <option value="rules">{{ t('rules') }}</option>
                  <option value="logs">{{ t('logs') }}</option>
                  <option value="config">{{ t('config') }}</option>
                </select>
              </ConfigSettingRow>

              <ConfigSettingRow>
                <template #label>
                  <div class="flex items-center gap-2 text-sm">
                    <span>{{ t('autoSwitchEndpoint') }}</span>
                  </div>
                </template>
                <input
                  v-model="configStore.autoSwitchEndpoint"
                  type="checkbox"
                  class="toggle toggle-primary"
                />
              </ConfigSettingRow>

              <ConfigSettingRow>
                <template #label>
                  <div class="flex items-center gap-2 text-sm">
                    <span>{{ t('autoSwitchTheme') }}</span>
                  </div>
                </template>
                <input
                  v-model="configStore.autoSwitchTheme"
                  type="checkbox"
                  class="toggle toggle-primary"
                />
              </ConfigSettingRow>

              <template v-if="configStore.autoSwitchTheme">
                <ConfigSettingRow>
                  <template #label>
                    <div class="flex items-center gap-2 text-sm">
                      <span class="pl-4 text-sm opacity-70">{{
                        t('favDayTheme')
                      }}</span>
                    </div>
                  </template>
                  <ThemeSelector v-model="configStore.favDayTheme" />
                </ConfigSettingRow>
                <ConfigSettingRow>
                  <template #label>
                    <div class="flex items-center gap-2 text-sm">
                      <span class="pl-4 text-sm opacity-70">{{
                        t('favNightTheme')
                      }}</span>
                    </div>
                  </template>
                  <ThemeSelector v-model="configStore.favNightTheme" />
                </ConfigSettingRow>
              </template>
            </div>

            <div class="divider my-2 text-xs opacity-40">
              {{ t('appearance') }}
            </div>

            <div class="flex flex-col gap-2">
              <!-- Font Family -->
              <ConfigSettingRow>
                <template #label>
                  <div class="flex items-center gap-2 text-sm">
                    <span>{{ t('fontFamily') }}</span>
                  </div>
                </template>
                <select
                  v-model="configStore.fontFamily"
                  class="select-bordered select select-sm"
                >
                  <option
                    v-for="font in fontOptions"
                    :key="font.value"
                    :value="font.value"
                  >
                    {{ font.label }}
                  </option>
                </select>
              </ConfigSettingRow>

              <!-- Background Type -->
              <ConfigSettingRow>
                <template #label>
                  <div class="flex items-center gap-2 text-sm">
                    <span>{{ t('backgroundImage') }}</span>
                  </div>
                </template>
                <select
                  v-model="configStore.backgroundImageType"
                  class="select-bordered select select-sm"
                >
                  <option value="none">{{ t('none') }}</option>
                  <option value="custom">
                    {{ t('backgroundCustomImage') }}
                  </option>
                  <option value="url">
                    {{ t('backgroundImageUrlOption') }}
                  </option>
                </select>
              </ConfigSettingRow>

              <!-- Custom Upload -->
              <div
                v-if="configStore.backgroundImageType === 'custom'"
                class="flex items-center gap-2 px-2"
              >
                <input
                  ref="backgroundFileInput"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="onUploadBackground"
                />
                <Button
                  class="flex-1 btn-outline btn-primary btn-sm"
                  @click="backgroundFileInput?.click()"
                >
                  {{ t('uploadImage') }}
                </Button>
                <Button
                  class="btn-outline btn-error btn-sm"
                  @click="onClearBackground"
                >
                  {{ t('clearAll') }}
                </Button>
              </div>

              <!-- Remote URL -->
              <input
                v-if="configStore.backgroundImageType === 'url'"
                v-model="configStore.backgroundImageUrl"
                type="text"
                inputmode="url"
                class="input-bordered input mx-2 input-sm"
                :placeholder="t('backgroundImageUrlPlaceholder')"
              />

              <!-- Blur + Overlay Opacity -->
              <template v-if="configStore.backgroundImageType !== 'none'">
                <ConfigSettingRow>
                  <template #label>
                    <div class="flex items-center gap-2 text-sm">
                      <span>{{ t('backgroundBlur') }}</span>
                    </div>
                  </template>
                  <div class="flex items-center gap-2">
                    <input
                      v-model.number="configStore.backgroundBlur"
                      type="range"
                      min="0"
                      max="30"
                      class="range w-24 range-primary range-xs"
                    />
                    <span class="w-10 text-right font-mono text-xs"
                      >{{ configStore.backgroundBlur }}px</span
                    >
                  </div>
                </ConfigSettingRow>
                <ConfigSettingRow>
                  <template #label>
                    <div class="flex items-center gap-2 text-sm">
                      <span>{{ t('backgroundOverlayOpacity') }}</span>
                    </div>
                  </template>
                  <div class="flex items-center gap-2">
                    <input
                      v-model.number="configStore.backgroundOverlayOpacity"
                      type="range"
                      min="0"
                      max="100"
                      class="range w-24 range-primary range-xs"
                    />
                    <span class="w-10 text-right font-mono text-xs"
                      >{{ configStore.backgroundOverlayOpacity }}%</span
                    >
                  </div>
                </ConfigSettingRow>
              </template>

              <!-- Custom Theme Colors -->
              <ConfigSettingRow>
                <template #label>
                  <div class="flex flex-col gap-0.5">
                    <span class="text-sm">{{ t('customThemeColors') }}</span>
                    <span class="text-xs opacity-50">{{
                      t('customThemeColorsDesc')
                    }}</span>
                  </div>
                </template>
                <input
                  v-model="configStore.enableCustomThemeColors"
                  type="checkbox"
                  class="toggle toggle-primary"
                />
              </ConfigSettingRow>
              <div
                v-if="configStore.enableCustomThemeColors"
                class="grid grid-cols-2 gap-2 px-2 sm:grid-cols-3"
              >
                <label
                  v-for="token in themeColorTokens"
                  :key="token"
                  class="flex items-center gap-2 text-xs"
                >
                  <input
                    type="color"
                    :value="configStore.customThemeColors[token] || '#888888'"
                    class="h-7 w-9 cursor-pointer rounded border border-base-content/10 bg-base-100"
                    @input="onThemeColorInput(token, $event)"
                  />
                  <span class="truncate opacity-70">{{ token }}</span>
                </label>
              </div>

              <!-- Custom CSS (advanced) -->
              <div class="flex flex-col gap-1.5 px-2">
                <div class="flex flex-col gap-0.5">
                  <span class="text-sm">{{ t('customCss') }}</span>
                  <span class="text-xs opacity-50">{{
                    t('customCssDesc')
                  }}</span>
                </div>
                <textarea
                  v-model="configStore.customCss"
                  rows="6"
                  spellcheck="false"
                  autocapitalize="off"
                  autocomplete="off"
                  autocorrect="off"
                  class="textarea-bordered textarea w-full font-mono text-xs leading-relaxed"
                  :placeholder="t('customCssPlaceholder')"
                />
              </div>
            </div>

            <div class="divider my-2 text-xs opacity-40">
              {{ t('shortcuts.title', 'Keyboard Shortcuts') }}
            </div>

            <ShortcutsSettings />

            <div class="divider my-2 text-xs opacity-40">
              {{ t('recommendation.title', 'Smart Recommendation') }}
            </div>

            <!-- Recommendation Settings -->
            <div class="flex flex-col gap-2">
              <!-- Auto Switch Toggle -->
              <ConfigSettingRow>
                <template #label>
                  <div class="flex flex-col gap-0.5">
                    <span class="text-sm">{{
                      t('recommendation.autoSwitch')
                    }}</span>
                    <span class="text-xs opacity-50">{{
                      t('recommendation.autoSwitchDesc')
                    }}</span>
                  </div>
                </template>
                <input
                  v-model="nodeRecommendationStore.autoSwitchEnabled"
                  type="checkbox"
                  class="toggle toggle-primary"
                />
              </ConfigSettingRow>

              <!-- Latency Weight -->
              <ConfigSettingRow>
                <template #label>
                  <div class="flex items-center gap-2 text-sm">
                    <span>{{ t('recommendation.latencyWeight') }}</span>
                  </div>
                </template>
                <div class="flex items-center gap-2">
                  <input
                    v-model.number="
                      nodeRecommendationStore.scoringWeights.latency
                    "
                    type="range"
                    min="0"
                    max="100"
                    class="range w-24 range-primary range-xs"
                  />
                  <span class="w-8 text-right font-mono text-xs"
                    >{{ nodeRecommendationStore.scoringWeights.latency }}%</span
                  >
                </div>
              </ConfigSettingRow>

              <!-- Stability Weight -->
              <ConfigSettingRow>
                <template #label>
                  <div class="flex items-center gap-2 text-sm">
                    <span>{{ t('recommendation.stabilityWeight') }}</span>
                  </div>
                </template>
                <div class="flex items-center gap-2">
                  <input
                    v-model.number="
                      nodeRecommendationStore.scoringWeights.stability
                    "
                    type="range"
                    min="0"
                    max="100"
                    class="range w-24 range-secondary range-xs"
                  />
                  <span class="w-8 text-right font-mono text-xs"
                    >{{
                      nodeRecommendationStore.scoringWeights.stability
                    }}%</span
                  >
                </div>
              </ConfigSettingRow>

              <!-- Success Rate Weight -->
              <ConfigSettingRow>
                <template #label>
                  <div class="flex items-center gap-2 text-sm">
                    <span>{{ t('recommendation.successRateWeight') }}</span>
                  </div>
                </template>
                <div class="flex items-center gap-2">
                  <input
                    v-model.number="
                      nodeRecommendationStore.scoringWeights.successRate
                    "
                    type="range"
                    min="0"
                    max="100"
                    class="range w-24 range-accent range-xs"
                  />
                  <span class="w-8 text-right font-mono text-xs"
                    >{{
                      nodeRecommendationStore.scoringWeights.successRate
                    }}%</span
                  >
                </div>
              </ConfigSettingRow>

              <!-- Min Test Interval -->
              <ConfigSettingRow>
                <template #label>
                  <div class="flex items-center gap-2 text-sm">
                    <span>{{ t('recommendation.minTestInterval') }}</span>
                  </div>
                </template>
                <input
                  v-model.number="nodeRecommendationStore.minTestInterval"
                  type="number"
                  min="1"
                  max="60"
                  class="input-bordered input w-20 text-center input-sm"
                />
              </ConfigSettingRow>

              <!-- Excluded Nodes Count -->
              <ConfigSettingRow>
                <template #label>
                  <div class="flex items-center gap-2 text-sm">
                    <span>{{ t('recommendation.excludedNodes') }}</span>
                  </div>
                </template>
                <div class="flex items-center gap-2">
                  <span class="badge badge-neutral">{{
                    nodeRecommendationStore.excludedNodes.length
                  }}</span>
                  <button
                    v-if="nodeRecommendationStore.excludedNodes.length > 0"
                    class="btn btn-ghost btn-xs"
                    @click="nodeRecommendationStore.excludedNodes = []"
                  >
                    {{ t('clearAll') }}
                  </button>
                </div>
              </ConfigSettingRow>

              <!-- Clear History Button -->
              <Button
                class="mt-2 w-full btn-outline btn-warning"
                @click="nodeRecommendationStore.clearAllData()"
              >
                <IconTrash :size="16" />
                {{ t('recommendation.clearHistory') }}
              </Button>
            </div>

            <div class="divider my-2 text-xs opacity-40">
              {{ t('settingsBackup') }}
            </div>

            <input
              ref="settingsFileInput"
              type="file"
              accept="application/json,.json"
              class="hidden"
              @change="onImportSettings"
            />
            <div class="grid grid-cols-2 gap-2">
              <Button
                class="btn-outline btn-secondary"
                @click="downloadSettings"
              >
                <IconDownload :size="16" />
                {{ t('exportSettings') }}
              </Button>
              <Button
                class="btn-outline btn-secondary"
                @click="settingsFileInput?.click()"
              >
                <IconUpload :size="16" />
                {{ t('importSettings') }}
              </Button>
            </div>

            <div class="divider my-2 text-xs opacity-40">ENDPOINT</div>

            <div class="flex flex-col gap-2">
              <Button
                class="w-full btn-outline btn-info"
                @click="switchEndpoint"
              >
                <IconArrowsExchange :size="16" />
                {{ t('switchEndpoint') }}
              </Button>

              <Button
                class="w-full btn-outline btn-error"
                @click="configStore.resetXdConfig()"
              >
                <IconRestore :size="16" />
                {{ t('resetSettings') }}
              </Button>
            </div>
          </div>
        </div>

        <!-- Actions Card (Full Width) -->
        <div
          class="config-card animate-fade-slide-in-3 col-span-1 lg:col-span-2"
        >
          <div
            class="flex items-center gap-2 border-b border-base-content/5 bg-base-300/30 px-4 py-3 text-sm font-semibold"
          >
            <IconTool :size="20" />
            <span>{{ t('coreConfig') }} - Actions</span>
          </div>

          <div class="flex flex-col gap-3 p-4">
            <!-- Remote Config URL -->
            <form
              class="flex flex-col gap-2 sm:flex-row"
              @submit.prevent="onFetchRemoteConfig"
            >
              <input
                v-model="remoteConfigURL"
                type="text"
                inputmode="url"
                class="input-bordered input h-10 min-h-10 flex-1 appearance-none px-3"
                :placeholder="t('remoteConfigURLPlaceholder')"
              />
              <Button
                type="submit"
                class="btn-secondary"
                :loading="configActions.fetchingRemoteConfig.value"
                :disabled="!remoteConfigURL"
              >
                <IconDownload :size="16" />
                {{ t('fetchRemoteConfig') }}
              </Button>
            </form>

            <div class="divider my-3" />

            <!-- Action Buttons Grid -->
            <div class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              <Button
                class="btn-primary"
                :loading="configActions.reloadingConfigFile.value"
                @click="configActions.reloadConfigFileAPI"
              >
                <IconRefresh :size="16" />
                <Marquee class="w-full flex-1">
                  {{ t('reloadConfig') }}
                </Marquee>
              </Button>

              <Button
                class="btn-warning"
                :loading="configActions.restartingBackend.value"
                @click="configActions.restartBackendAPI"
              >
                <IconPlayerPlay :size="16" />
                <Marquee class="w-full flex-1">
                  {{ t('restartCore') }}
                </Marquee>
              </Button>

              <Button
                class="btn-accent"
                :loading="configActions.flushingFakeIPData.value"
                @click="configActions.flushFakeIPDataAPI"
              >
                <IconBox :size="16" />
                <Marquee class="w-full flex-1">
                  {{ t('flushFakeIP') }}
                </Marquee>
              </Button>

              <Button
                class="btn-info"
                :loading="configActions.flushingDNSCache.value"
                @click="configActions.flushDNSCacheAPI"
              >
                <IconDatabase :size="16" />
                <Marquee class="w-full flex-1">
                  {{ t('flushDNSCache') }}
                </Marquee>
              </Button>

              <Button
                v-if="!isSingBox"
                class="btn-secondary"
                :loading="configActions.updatingGEODatabases.value"
                @click="configActions.updateGEODatabasesAPI"
              >
                <IconWorld :size="16" />
                <Marquee class="w-full flex-1">
                  {{ t('updateGEODatabases') }}
                </Marquee>
              </Button>
            </div>
          </div>
        </div>

        <!-- DNS Settings Card (hide for sing-box) -->
        <template v-if="!isSingBox">
          <div
            class="config-card animate-fade-slide-in-4 col-span-1 hidden sm:block lg:col-span-2"
            :class="{ '!block': activeSection === 'tools' }"
          >
            <div
              class="flex items-center gap-2 border-b border-base-content/5 bg-base-300/30 px-4 py-3 text-sm font-semibold"
            >
              <IconDatabase :size="20" />
              <span>{{ t('dnsSettings') }}</span>
            </div>

            <div class="flex flex-col gap-3 p-4">
              <p class="text-xs opacity-60">{{ t('dnsSettingsNote') }}</p>

              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <!-- Enhanced Mode -->
                <fieldset class="fieldset">
                  <label
                    class="label text-xs opacity-70"
                    for="dns-enhanced-mode"
                  >
                    {{ t('dnsEnhancedMode') }}
                  </label>
                  <select
                    id="dns-enhanced-mode"
                    v-model="dnsSettings.form.enhancedMode"
                    class="select-bordered select w-full select-sm"
                  >
                    <option v-for="m in enhancedModes" :key="m" :value="m">
                      {{ m }}
                    </option>
                  </select>
                </fieldset>

                <!-- Fake IP Range -->
                <fieldset class="fieldset">
                  <label
                    class="label text-xs opacity-70"
                    for="dns-fake-ip-range"
                  >
                    {{ t('dnsFakeIpRange') }}
                  </label>
                  <input
                    id="dns-fake-ip-range"
                    v-model="dnsSettings.form.fakeIpRange"
                    type="text"
                    class="input-bordered input w-full font-mono input-sm"
                    placeholder="198.18.0.1/16"
                  />
                </fieldset>
              </div>

              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <!-- Nameserver -->
                <fieldset class="fieldset">
                  <label class="label text-xs opacity-70" for="dns-nameserver">
                    {{ t('dnsNameserver') }}
                  </label>
                  <textarea
                    id="dns-nameserver"
                    v-model="dnsSettings.form.nameserver"
                    rows="4"
                    class="textarea-bordered textarea w-full font-mono text-xs"
                    :placeholder="t('dnsNameserverPlaceholder')"
                  />
                </fieldset>

                <!-- Fallback -->
                <fieldset class="fieldset">
                  <label class="label text-xs opacity-70" for="dns-fallback">
                    {{ t('dnsFallback') }}
                  </label>
                  <textarea
                    id="dns-fallback"
                    v-model="dnsSettings.form.fallback"
                    rows="4"
                    class="textarea-bordered textarea w-full font-mono text-xs"
                    :placeholder="t('dnsFallbackPlaceholder')"
                  />
                </fieldset>
              </div>

              <!-- Use Hosts -->
              <ConfigSettingRow>
                <template #label>
                  <div class="flex items-center gap-2 text-sm">
                    <span>{{ t('dnsUseHosts') }}</span>
                  </div>
                </template>
                <input
                  id="dns-use-hosts"
                  v-model="dnsSettings.form.useHosts"
                  type="checkbox"
                  class="toggle toggle-primary"
                />
              </ConfigSettingRow>

              <Button
                class="btn-primary"
                :loading="dnsSettings.saving.value"
                @click="dnsSettings.save()"
              >
                <IconDeviceFloppy :size="16" />
                {{ t('save') }}
              </Button>
            </div>
          </div>
        </template>

        <!-- DNS Query Card (hide for sing-box) -->
        <template v-if="!isSingBox">
          <div
            class="config-card animate-fade-slide-in-4 col-span-1 hidden sm:block lg:col-span-2"
            :class="{ '!block': activeSection === 'tools' }"
          >
            <div
              class="flex items-center gap-2 border-b border-base-content/5 bg-base-300/30 px-4 py-3 text-sm font-semibold"
            >
              <IconSearch :size="20" />
              <span>{{ t('dnsQuery') }}</span>
            </div>

            <div class="flex flex-col gap-3 p-4">
              <form
                class="flex flex-col gap-3 sm:flex-row"
                @submit.prevent="onDnsQuery"
              >
                <input
                  v-model="dnsQuery.name"
                  type="text"
                  enterkeyhint="search"
                  class="input-bordered input h-10 min-h-10 flex-1 appearance-none px-3 font-mono"
                  placeholder="google.com"
                  @input="onDnsQueryInput"
                />

                <select
                  v-model="dnsQuery.type"
                  class="select-bordered select h-10 min-h-10 w-full appearance-none px-3 sm:w-auto"
                >
                  <option>A</option>
                  <option>AAAA</option>
                  <option>CNAME</option>
                  <option>TXT</option>
                  <option>MX</option>
                  <option>SRV</option>
                  <option>HTTPS</option>
                  <option>NS</option>
                  <option>DNSKEY</option>
                  <option>DS</option>
                  <option>SIG</option>
                  <option>SOA</option>
                  <option>RRSIG</option>
                  <option>RP</option>
                </select>

                <Button
                  type="submit"
                  class="btn-primary"
                  :loading="dnsQueryMutation.isPending.value"
                >
                  <IconSearch :size="16" />
                  {{ t('dnsQuery') }}
                </Button>
              </form>

              <!-- DNS Results -->
              <div
                v-if="dnsQueryResult.length > 0"
                class="mt-4 flex flex-col gap-1 rounded-xl bg-base-300/50 p-3"
              >
                <div
                  v-for="(item, index) in dnsQueryResult"
                  :key="item"
                  class="animate-slide-in rounded-lg bg-base-content/5 px-3 py-2"
                  :style="{ animationDelay: `${index * 50}ms` }"
                >
                  <span class="font-mono text-sm">{{ item }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* Card base styles - using color-mix which isn't available in Tailwind */
.config-card {
  position: relative;
  overflow: hidden;
  border-radius: 1rem;
  border: 1px solid
    color-mix(in oklab, var(--color-base-content) 10%, transparent);
  backdrop-filter: blur(4px);
  transition: all 0.3s;
  background-color: color-mix(in oklab, var(--color-base-200) 50%, transparent);
  box-shadow:
    0 0 0 1px color-mix(in oklab, var(--color-primary) 20%, transparent),
    0 4px 24px -4px color-mix(in oklab, var(--color-primary) 10%, transparent);
}

.config-card:hover {
  border-color: color-mix(in oklab, var(--color-primary) 30%, transparent);
  box-shadow:
    0 0 0 1px color-mix(in oklab, var(--color-primary) 30%, transparent),
    0 8px 32px -4px color-mix(in oklab, var(--color-primary) 10%, transparent);
}

/* Animations */
@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pulseSubtle {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.animate-fade-slide-in {
  animation: fadeSlideIn 0.4s ease-out;
}

.animate-fade-slide-in-1 {
  animation: fadeSlideIn 0.5s ease-out backwards;
  animation-delay: 0.1s;
}

.animate-fade-slide-in-2 {
  animation: fadeSlideIn 0.5s ease-out backwards;
  animation-delay: 0.15s;
}

.animate-fade-slide-in-3 {
  animation: fadeSlideIn 0.5s ease-out backwards;
  animation-delay: 0.2s;
}

.animate-fade-slide-in-4 {
  animation: fadeSlideIn 0.5s ease-out backwards;
  animation-delay: 0.25s;
}

.animate-slide-in {
  animation: slideIn 0.3s ease-out backwards;
}

.animate-pulse-subtle {
  animation: pulseSubtle 3s ease-in-out infinite;
}
</style>
