# 提取代理节点增量渲染逻辑

## 目标

把 `packages/ui/pages/proxies.vue` 中两个内联组件各自实现的「renderCount + loadMoreSentinel +
useIntersectionObserver 增量渲染」收敛为一个 composable，消除重复、便于后续维护，且行为
与渲染结果零变化。

引用 TARGETS.md 相关准则：

- 视觉目标「样式也要尽量写成可以复用的形式」——同一套渐进渲染逻辑不应在两处各写一遍。
- 用户体验「在单个界面上不要呈现过多的内容」——增量渲染保证大分组首帧只挂载窗口内的
  节点，是当前性能策略的基石；提取后必须保持其行为不退化。
- `planning/TODO.md` 该条目同时指出 `proxies.vue` 已达约 1583 行，可在本次一并减少文件体积。

## 现状

`packages/ui/pages/proxies.vue`：

- 常量 `PROXIES_INITIAL_RENDER_COUNT = 50`、`PROXIES_RENDER_STEP = 50`（第 91–92 行）。
- `ProxyNodes`（第 580–661 行）与 `ProviderProxyNodes`（第 789–852 行）各自重复：

  - `const renderCount = ref(PROXIES_INITIAL_RENDER_COUNT)`
  - `const loadMoreSentinel = ref<HTMLElement | null>(null)`
  - 结构相同的 `useIntersectionObserver(loadMoreSentinel, …)`：
    `entries[0]?.isIntersecting && renderCount.value < names.length` 时
    `renderCount.value = Math.min(renderCount.value + PROXIES_RENDER_STEP, names.length)`。
  - 结构完全相同的 sentinel vnode：

    ```ts
    h('div', {
      ref: loadMoreSentinel,
      key: '__load_more__',
      'aria-hidden': 'true',
      class: 'h-px w-full',
      style: { gridColumn: '1 / -1' },
    })
    ```

- 两者的差异（不可共享的部分）：

  - 滚动 root 不同：`proxiesScrollEl` vs `providersScrollEl`。
  - `ProxyNodes` 额外 `watch` 把「当前选中节点」纳入窗口（`index + PROXIES_RENDER_STEP`）。
  - 节点组件与 props 不同：`ProxyNodes` 有 `isCard` 分支、`proxyGroup` 数据与选中态；
    `ProviderProxyNodes` 传 `providerName`，且 master 模式降级为 list。

- `pages/proxies.vue` 与 composables 均依赖 Nuxt / `@vueuse/nuxt` 的全局 auto-import
  （`ref`/`computed`/`h`/`useIntersectionObserver` 无需显式 import），`nuxt.config.ts`
  的 `imports.dirs` 已包含 `composables`。

## 方案

新建 `packages/ui/composables/useIncrementalRender.ts`：

- 导出纯函数 `nextRenderCount(current, total, step)`（`Math.min(current + step, total)`），
  单独单测边界。
- 导出 `useIncrementalRender({ root, total, initial, step, rootMargin })`，返回：

  - `renderCount`：当前渲染窗口大小；
  - `hasMore`：`renderCount < total` 的计算属性，替代两处 `renderCount.value < names.length`；
  - `loadMoreSentinelNode()`：构造共享的 sentinel vnode。

- `root` 传 `Ref<HTMLElement | null>`，`total` 传 `() => number`（保证读取 props 时仍是
  响应式）；`initial`/`step` 默认 50，`rootMargin` 默认 `'600px'`。

页面两处改为：

```ts
const { renderCount, hasMore, loadMoreSentinelNode } = useIncrementalRender({
  root: proxiesScrollEl, // 或 providersScrollEl
  total: () => props.sortedProxyNames.length,
  initial: PROXIES_INITIAL_RENDER_COUNT,
  step: PROXIES_RENDER_STEP,
})
```

`ProxyNodes` 的选中节点 `watch` 与各自的节点 props/`Comp` 逻辑保留在组件内。

取舍：

- 备选 A：抽成共享渲染组件。两处的节点 props、选中态、`onClick`、root 均不同，抽组件会
  需要大量 props 与条件分支，复杂度高于收益。
- 备选 B：只抽 sentinel vnode 的小 helper。收益有限，`observer` 与增长逻辑仍然重复。
- 备选 C：把两个 `defineComponent` 合并为一个。`proxyGroup` 与 `provider` 的数据形状与
  渲染 props 不同，合并会引入 `if` 分支，破坏可读性。
- 选择「composable 收敛窗口状态 + observer + sentinel」：保留两处真正的差异（数据与
  渲染），只消除结构重复，改动面可控。

## 验收标准

- 新增 `composables/useIncrementalRender.ts` 与 `composables/__tests__/useIncrementalRender.spec.ts`。
- `nextRenderCount` 单测覆盖：按 step 增长、clamp 到 total、已满不再增长、空列表。
- `proxies.vue` 两处不再各自声明 `renderCount`/`loadMoreSentinel`/`useIntersectionObserver`/sentinel vnode。
- 行为等价：初始窗口 50、每次进入 sentinel 追加 50、最大不超过 `names.length`、无更多时
  不渲染 sentinel。
- `pnpm --filter @metacubexd/ui test:unit` 全绿。
- `pnpm --filter @metacubexd/ui typecheck` 通过。

## 关联文档

- `planning/TARGETS.md`（可复用、渐进呈现）
- `packages/ui/pages/proxies.vue`（受影响文件）
- `packages/ui/composables/useBusyKeys.ts`（framework-free composable 风格）
- `packages/ui/composables/__tests__/useBusyKeys.spec.ts`（composable 测试风格）
