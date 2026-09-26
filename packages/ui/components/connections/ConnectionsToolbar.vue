<script setup lang="ts">
import type { ConnectionColumn } from './ConnectionsTable.vue'
import {
  IconArrowsSort,
  IconDeviceDesktop,
  IconFilter,
  IconPlayerPause,
  IconPlayerPlay,
  IconSearch,
  IconSettings,
  IconSortAscending,
  IconSortDescending,
  IconStack2,
  IconX,
} from '@tabler/icons-vue'

const props = defineProps<{
  tabs: Array<{
    type: 'active' | 'closed'
    name: string
    count: number
  }>
  activeTab: 'active' | 'closed'
  enableQuickFilter: boolean
  sourceIPFilter: string
  uniqueSourceIPs: string[]
  sortColumn: string
  sortDesc: boolean
  sortableColumns: ConnectionColumn[]
  globalFilter: string
  paused: boolean
  isClosingConnections: boolean
  // Card-mode controls
  displayMode: 'auto' | 'table' | 'card'
  groupableColumns: ConnectionColumn[]
  groupingColumn: string | null
}>()

const emit = defineEmits<{
  'update:activeTab': [tab: 'active' | 'closed']
  'update:enableQuickFilter': [enabled: boolean]
  'update:sourceIPFilter': [ip: string]
  'update:sortColumn': [column: string]
  'update:globalFilter': [filter: string]
  'update:groupingColumn': [columnId: string | null]
  toggleSortOrder: []
  togglePaused: []
  closeConnections: []
  openSettings: []
}>()

const { t } = useI18n()

const sourceIPOptions = computed(() => [
  { value: '', label: t('all') },
  ...props.uniqueSourceIPs.map((ip) => ({ value: ip, label: ip })),
])

const sortOptions = computed(() =>
  props.sortableColumns.flatMap((col) =>
    col.sortId ? [{ value: col.sortId, label: t(col.key) }] : [],
  ),
)

const groupOptions = computed(() => [
  { value: '', label: t('none') },
  ...props.groupableColumns.map((col) => ({
    value: col.id,
    label: t(col.key),
  })),
])
</script>

<template>
  <div class="flex flex-col gap-3">
    <!-- Toolbar Row 1: Tabs + Quick filter + Source IP filter -->
    <div class="flex flex-wrap items-center gap-2">
      <div
        class="flex gap-1 rounded-lg border border-base-content/12 bg-base-200/60 p-1"
      >
        <button
          v-for="tab in tabs"
          :key="tab.type"
          class="flex cursor-pointer items-center gap-2 rounded-md border-none bg-transparent px-3 py-1.5 text-[0.8125rem] font-medium text-base-content/60 transition-all duration-200 hover:bg-base-content/5 hover:text-base-content"
          :class="{
            'bg-primary! text-primary-content! shadow-[0_2px_8px_var(--color-primary)/30]':
              activeTab === tab.type,
          }"
          @click="emit('update:activeTab', tab.type)"
        >
          <span>{{ tab.name }}</span>
          <span
            class="inline-flex h-[1.125rem] min-w-5 items-center justify-center rounded-full bg-current/20 px-1.5 text-[0.6875rem] font-semibold"
          >
            {{ tab.count }}
          </span>
        </button>
      </div>

      <IconButton
        size="lg"
        variant="outline"
        :icon="IconFilter"
        :label="t('quickFilter')"
        :active="enableQuickFilter"
        :aria-pressed="enableQuickFilter"
        @click="emit('update:enableQuickFilter', !enableQuickFilter)"
      />

      <IconMenuSelect
        :icon="IconDeviceDesktop"
        :title="t('sourceIP')"
        :options="sourceIPOptions"
        :model-value="sourceIPFilter"
        @update:model-value="(v: string) => emit('update:sourceIPFilter', v)"
      />

      <div class="flex shrink-0 items-center gap-1.5">
        <IconMenuSelect
          :icon="IconArrowsSort"
          :title="t('sortBy')"
          :options="sortOptions"
          :model-value="sortColumn"
          @update:model-value="(v: string) => emit('update:sortColumn', v)"
        />
        <IconButton
          size="lg"
          variant="outline"
          :icon="IconSortDescending"
          :label="t('sortBy')"
          @click="emit('toggleSortOrder')"
        >
          <IconSortDescending v-if="sortDesc" :size="18" />
          <IconSortAscending v-else :size="18" />
        </IconButton>
      </div>

      <div class="flex min-w-56 flex-1 items-center gap-1">
        <div
          class="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-base-content/12 bg-base-200/60 px-3 py-2 transition-all duration-200 focus-within:border-primary focus-within:bg-base-100 focus-within:shadow-[0_0_0_2px_var(--color-primary)/20]"
        >
          <IconSearch :size="16" class="shrink-0 opacity-50" />
          <input
            type="search"
            class="min-w-0 flex-1 bg-transparent text-[0.8125rem] text-base-content outline-none placeholder:text-base-content/40"
            :placeholder="t('search')"
            :value="globalFilter"
            @input="
              emit(
                'update:globalFilter',
                ($event.target as HTMLInputElement).value,
              )
            "
          />
        </div>

        <IconButton
          size="md"
          variant="outline"
          :icon="IconPlayerPause"
          :class="{
            'border-warning/30! bg-warning/15! text-warning! hover:bg-warning/25!':
              paused,
          }"
          @click="emit('togglePaused')"
        >
          <IconPlayerPlay v-if="paused" :size="18" />
          <IconPlayerPause v-else :size="18" />
        </IconButton>

        <IconButton
          size="md"
          variant="danger"
          :icon="IconX"
          :disabled="isClosingConnections"
          :loading="isClosingConnections"
          @click="emit('closeConnections')"
        />

        <IconButton
          size="md"
          variant="outline"
          :icon="IconSettings"
          :label="t('settings')"
          @click="emit('openSettings')"
        />
      </div>
    </div>

    <!-- Card-mode-only controls: group dropdown
         (Sort UI is already provided in Row 1 above and works for both modes.) -->
    <div
      v-if="displayMode === 'card'"
      class="flex flex-wrap items-center gap-2"
    >
      <IconMenuSelect
        :icon="IconStack2"
        :title="t('groupBy')"
        :options="groupOptions"
        :model-value="groupingColumn ?? ''"
        @update:model-value="
          (v: string) => emit('update:groupingColumn', v || null)
        "
      />
    </div>
  </div>
</template>
