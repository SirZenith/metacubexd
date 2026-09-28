<script setup lang="ts">
// Appearance section of the XD config card. Self-contained: it owns the
// background upload/clear handlers and the font/theme-color option lists, and
// binds directly to the shared config store.
const { t } = useI18n()
const configStore = useConfigStore()
const appearance = useAppearance()

const backgroundFileInput = ref<HTMLInputElement>()

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
</script>

<template>
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
      <Button class="btn-outline btn-error btn-sm" @click="onClearBackground">
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
          class="h-7 w-9 cursor-pointer rounded-md border border-base-content/10 bg-base-100"
          @input="onThemeColorInput(token, $event)"
        />
        <span class="truncate opacity-70">{{ token }}</span>
      </label>
    </div>

    <!-- Custom CSS (advanced) -->
    <div class="flex flex-col gap-1.5 px-2">
      <div class="flex flex-col gap-0.5">
        <span class="text-sm">{{ t('customCss') }}</span>
        <span class="text-xs opacity-50">{{ t('customCssDesc') }}</span>
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
</template>
