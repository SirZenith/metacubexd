# 收敛 stores/proxies.ts 的 keyed-busy map

## 目标

把 `stores/proxies.ts` 中 4 个逐行手写的 keyed-busy `Record<string, boolean>`
map 收敛到一个统一的 keyed-busy 抽象，消除「set true / try / finally set false」
样板，并保持 store 公开 API、组件读取方式与既有单测不变，为后续完全摘取到
`useBusyKeys` 铺路。

引用 TARGETS.md 相关准则：

- 本条目 tag 为 `refactor`（提取公共模式）；`planning/workflow/refill.md` 要求
  「检查项目的代码中，代码实现是否出现了明显重复的模式，若有，就将把公共模式提取为
  可复用组件作为新的目标」。
- 提取统一抽象也提升可测试性，服务 TARGETS 的「样式/实现尽量可复用」精神。

## 现状

`stores/proxies.ts`（749 行）中 4 个手写 busy map（第 60–63 行）：

```ts
const proxyLatencyTestingMap = ref<Record<string, boolean>>({})
const proxyGroupLatencyTestingMap = ref<Record<string, boolean>>({})
const proxyProviderLatencyTestingMap = ref<Record<string, boolean>>({})
const updatingMap = ref<Record<string, boolean>>({})
```

每个都被对应方法逐行操作，模式完全相同：方法开头 `map.value[key] = true`，
`finally` 里 `map.value[key] = false`：

- `proxyLatencyTest`（第 538–580 行）：`proxyLatencyTestingMap`
- `proxyGroupLatencyTest`（第 583–620 行）：`proxyGroupLatencyTestingMap`
- `updateProviderByProviderName`（第 623–637 行）：`updatingMap`
- `proxyProviderLatencyTest`（第 658–714 行）：`proxyProviderLatencyTestingMap`

`isTesting`（第 514–525 行）读取前三个 map。

消费方：

- 组件读取：`pages/proxies.vue`（6 处）、`components/ProxyMasterDetail.vue`（1 处），
  形如 `proxiesStore.proxyGroupLatencyTestingMap[name]`。
- store 公开 API：`return` 中导出这 4 个 map（第 720–723 行）。
- 单测：`stores/__tests__/proxies.spec.ts` 既**读取**（断言测试期间为 true/false），
  也**直接写入**（第 670–677 行 `store.proxyLatencyTestingMap.n = true`），因此暴露
  的 map 必须保持可写。

已存在的统一抽象：`composables/useBusyKeys.ts` 用 `reactive(Set<string>)` 追踪
in-flight key，提供 `isBusy/anyBusy/run`（含 `guardReentry`/`swallow` 选项），已被
`rules.vue`、`profiles.vue` 使用。它不适合直接替换 store 的 map：store 需要向外暴露
**可写 `Record`**（组件按 key 读、单测 seed 写），而 Set 与 Record 的访问形态不同。
第 300 行同名 TODO 已记录：直接把 store 迁到 `useBusyKeys` 会改动公开 API 与既有
断言，属独立较大变更，建议另开一条。

## 方案

新增 `composables/useKeyedBusyMap.ts`：Record 形态的统一 keyed-busy 抽象，作为
`useBusyKeys`（Set 形态）之外的兼容视图，集中承载 store 的既有约定。

```ts
export function useKeyedBusyMap() {
  const map = ref<Record<string, boolean>>({})
  const isBusy = (key: string) => map.value[key] === true
  const setBusy = (key: string, busy: boolean) => {
    map.value[key] = busy
  }
  const run = async (
    key,
    fn,
    { guardReentry = false, swallow = false } = {},
  ) => {
    if (guardReentry && isBusy(key)) return
    setBusy(key, true)
    try {
      return await fn()
    } catch (e) {
      if (!swallow) throw e
    } finally {
      setBusy(key, false)
    }
  }
  return { map, isBusy, setBusy, run }
}
```

`guardReentry` 默认 `false`，与 store 现有手写行为一致（重复调用会重复执行，不做
去重）；`run` 的 `finally` 承担原先每个方法的 `finally` 清除职责。

`stores/proxies.ts` 迁移：

1. 删除 4 个 `ref<Record<string, boolean>>({})`，改为 4 个 `useKeyedBusyMap()` 实例
   （`proxyLatencyTesting`、`proxyGroupLatencyTesting`、
   `proxyProviderLatencyTesting`、`providerUpdating`）。
2. 4 个方法用 `instance.run(key, async () => { ...原 try/catch 主体... })` 包裹，
   去掉手写的 `set true` 与 `finally set false`。
3. `isTesting` 改用 `instance.isBusy(key)`。
4. `return` 中仍导出同名 key，值为 `instance.map`（Pinia 解包后仍是可写
   `Record<string, boolean>`），组件与单测零改动。

取舍：

- 备选方案 A：直接把 store 迁到 `useBusyKeys`（Set）。会改变对外形态（组件
  `map[key]`、单测直接赋值都失效），并需同步改 7 处组件与若干断言——正是第 300 行
  条目记录为 blocked 的原因，超出本条目范围。
- 备选方案 B：不新增 composable，仅在 store 内写一个本地 `createBusyMap()` 工厂。
  能去重，但抽象留在 store 内不可复用、不易单测；放 `composables/` 便于后续与
  `useBusyKeys` 合并。
- 选择新增 `useKeyedBusyMap`：对外零破坏，内部消除 4 份样板，并为将来的完全迁移
  提供**单一替换点**（把 `useKeyedBusyMap` 换成 `useBusyKeys` 适配层即可）。

## 验收标准

- `stores/proxies.ts` 不再出现 `ref<Record<string, boolean>>({})` 形式的手写 busy
  map；4 个 busy 状态由 `useKeyedBusyMap` 实例承载，方法内无手写 `set true/false`。
- store 对外仍导出 `proxyLatencyTestingMap`、`proxyGroupLatencyTestingMap`、
  `proxyProviderLatencyTestingMap`、`updatingMap`，均为可写 `Record<string, boolean>`；
  组件（proxies.vue、ProxyMasterDetail.vue）与既有 `stores/__tests__/proxies.spec.ts`
  **零改动**且全部通过。
- 新增 `packages/ui/composables/__tests__/useKeyedBusyMap.spec.ts`，覆盖
  `run` 期间的忙碌标记、结束时清除、异常时清除（并按 `swallow` 处理）、
  `guardReentry` 开关、`setBusy`/`isBusy`。
- `pnpm --filter @metacubexd/ui typecheck` 通过；`test:unit` 通过；e2e 通过。

## 关联文档

- `composables/useBusyKeys.ts`（Set 形态统一抽象）
- 后续 TODO「统一 keyed-busy 抽象（完全迁移 stores/proxies.ts，第 300 行条目）」
- `planning/TARGETS.md`（视觉/实现目标：可复用）
