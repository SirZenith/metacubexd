<!-- packages/ui/components/RuntimeConfigPanel.vue -->
<script setup lang="ts">
import { IconFileCode, IconRefresh } from '@tabler/icons-vue'

const { t } = useI18n()
const viewer = useRuntimeConfigViewer()
const { available, content, loading, refresh } = viewer

// Load the runtime config once the panel mounts (only when the feature is
// present — the whole card is v-if'd off otherwise).
onMounted(() => {
  if (available.value) refresh()
})
</script>

<template>
  <PanelCard :visible="available">
    <PanelHeader :title="t('runtimeConfig')" :icon="IconFileCode">
      <template #actions>
        <Button
          class="btn-outline btn-secondary btn-sm"
          :loading="loading"
          @click="refresh()"
        >
          <IconRefresh :size="16" />
          {{ t('refresh') }}
        </Button>
      </template>
    </PanelHeader>

    <p class="mb-3 text-sm text-base-content/60">
      {{ t('runtimeConfigDescription') }}
    </p>

    <pre
      class="max-h-96 overflow-auto rounded-lg border border-base-content/10 bg-base-300/40 p-3 font-mono text-xs whitespace-pre text-base-content"
    ><code>{{ content || t('runtimeConfigEmpty') }}</code></pre>
  </PanelCard>
</template>
