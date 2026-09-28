# 统一 formatBytes 实现

## 目标

让字节格式化只有 `packages/ui/utils/index.ts` 一处实现：删除页面内重复定义的
`formatBytes` 与对 `byte-size` 的直连依赖，统一从 `~/utils` 引入。

引用 TARGETS.md 相关准则：

- 视觉目标「样式也要尽量写成可以复用的形式」——同一段格式化逻辑不应在多处各写一遍，
  否则一处调整（单位精度、locale）会在别处悄悄分叉。

## 现状

- `packages/ui/utils/index.ts` 第 117 行已导出：

  ```ts
  export function formatBytes(bytes: number) {
    return byteSize(bytes).toString()
  }
  ```

- 三处页面各自重定义完全相同的实现，并各自 `import byteSize from 'byte-size'`：

  - `packages/ui/pages/proxies.vue`：import 第 26 行，定义第 177 行。
  - `packages/ui/pages/connections.vue`：import 第 11 行，定义第 68 行。
  - `packages/ui/pages/overview.vue`：import 第 14 行，定义第 26 行。

- `overview.vue` 另有 3 处绕过 `formatBytes` 直接调用 `byteSize(...).toString()`：
  第 99、286、295 行（Highcharts tooltip/label 回调内）。

- 正确用法已存在于 `pages/traffic.vue`、`components/TrafficDetailsTable.vue`
  （从 `~/utils` 引入 `formatBytes`），说明公共实现就是既有约定。

## 方案

1. `proxies.vue`：删除 `import byteSize from 'byte-size'` 与第 177 行局部定义；在既有
   `~/utils` 引入列表中加入 `formatBytes`。
2. `connections.vue`：删除 byte-size import 与第 68 行局部定义；在既有
   `~/utils` 引入 `{ formatIPv6, formatTimeFromNow, gapLeadingFlag }` 中加入
   `formatBytes`。
3. `overview.vue`：删除 byte-size import 与第 26 行局部定义；把第 99、286、295 行的
   `byteSize(x).toString()` 改为 `formatBytes(x)`；在 `~/utils` 引入中加入 `formatBytes`。
4. 新增 source-scan 守卫 `packages/ui/__tests__/format-bytes-single-source.spec.ts`：
   扫描 `pages`/`components`/`composables`，断言没有
   `const formatBytes = …` 重定义，也没有 `from 'byte-size'` 直连（`utils` 为唯一来源，
   不在扫描范围）。

取舍：

- 备选 A：仅删除三处局部定义，保留 `overview.vue` 的 byteSize 直连调用。仍留着对
  `byte-size` 的直接依赖与绕过公共函数的写法，未真正统一。
- 备选 B：把 `formatBytes` 改名为 `formatBytesToString` 等以避免困惑。会波及已有的
  `~/utils` 使用点，超出本次范围。
- 选择「三处全部改用 `~/utils`，并把 overview 的三个直连调用也统一」：改动小、语义
  完全等价（`byteSize(bytes).toString()` 逐字相同），并让 `byte-size` 只被 utils 依赖。

## 验收标准

- `proxies.vue` / `connections.vue` / `overview.vue` 均无本地 `formatBytes` 定义，
  且无 `from 'byte-size'` 引入。
- 新增守卫测试在实现前失败、实现后通过。
- 字节显示行为不变（`formatBytes` 与旧局部实现逐字等价）。
- `pnpm --filter @metacubexd/ui test:unit` 全绿。
- `pnpm --filter @metacubexd/ui typecheck` 通过。

## 关联文档

- `planning/TARGETS.md`（样式/逻辑可复用）
- `packages/ui/utils/index.ts`（唯一实现）
- `packages/ui/pages/{proxies,connections,overview}.vue`（受影响文件）
- `packages/ui/pages/traffic.vue`、`components/TrafficDetailsTable.vue`（既有正确用法）
