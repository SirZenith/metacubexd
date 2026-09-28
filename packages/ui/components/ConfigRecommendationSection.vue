<script setup lang="ts">
// Recommendation section of the XD config card. Bindings live in the shared
// node-recommendation store, so the section needs no props.
import { IconTrash } from '@tabler/icons-vue'

const { t } = useI18n()
const nodeRecommendationStore = useNodeRecommendationStore()
</script>

<template>
  <div class="divider my-2 text-xs opacity-40">
    {{ t('recommendation.title', 'Smart Recommendation') }}
  </div>

  <!-- Recommendation Settings -->
  <div class="flex flex-col gap-2">
    <!-- Auto Switch Toggle -->
    <ConfigSettingRow>
      <template #label>
        <div class="flex flex-col gap-0.5">
          <span class="text-sm">{{ t('recommendation.autoSwitch') }}</span>
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
          v-model.number="nodeRecommendationStore.scoringWeights.latency"
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
          v-model.number="nodeRecommendationStore.scoringWeights.stability"
          type="range"
          min="0"
          max="100"
          class="range w-24 range-secondary range-xs"
        />
        <span class="w-8 text-right font-mono text-xs"
          >{{ nodeRecommendationStore.scoringWeights.stability }}%</span
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
          v-model.number="nodeRecommendationStore.scoringWeights.successRate"
          type="range"
          min="0"
          max="100"
          class="range w-24 range-accent range-xs"
        />
        <span class="w-8 text-right font-mono text-xs"
          >{{ nodeRecommendationStore.scoringWeights.successRate }}%</span
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
</template>
