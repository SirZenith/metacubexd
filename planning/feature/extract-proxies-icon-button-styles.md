# 提取代理页重复的图标按钮样式

## 目标

把 `packages/ui/pages/proxies.vue` 中逐字复制的方形图标按钮 class 串收敛到共享常量，
让同一按钮样式只有一处定义、改动一处即全局生效，且视觉与交互零变化。

引用 TARGETS.md 相关准则：

- 视觉目标「样式也要尽量写成可以复用的形式」——当前长 class 串在渲染函数与模板中
  逐字复制 9 处以上，任意一处调整都会造成同类按钮漂移。
- 视觉目标「整个项目的圆角要风格统一」——按钮圆角/尺寸分散复制时容易在单点改动后
  失配。

## 现状

`packages/ui/pages/proxies.vue`（1573 行）中有两类方形图标按钮：

**A. 组 / Provider header 的操作按钮**（`h-8 w-8 sm:h-9 sm:w-9`，hover 抬升 + 阴影），
以 `h('Button', { class: '…' })` 渲染：

- 第 406 行 jump-to-current：neutral 配色 + `hidden sm:flex` + `disabled:opacity-40`（唯一）。
- 第 427、449 行（switch recommended / unfix）：warning 配色的长串，**逐字相同**。
- 第 464、707、731 行（test group / provider refresh / provider latency）：
  neutral 配色 + `disabled:bg-success/15 …`，**逐字相同**。

**B. 页面工具栏按钮**（`h-9 w-9`），在模板中：

- 第 928、953、986、999 行（collapse-all / test-all / health-check / update-all）：
  **逐字相同**。
- 第 1043 行 connectivity：与上面 4 处仅多 `text-base-content/70`。
- 第 896 行 tools toggle（条件三元 + `ml-auto sm:hidden`）、第 943 行 edit（primary）、
  第 1058 行 settings（primary/10）：各自唯一。

**IconButton.vue 复用评估**（`components/IconButton.vue`）：

- 尺寸固定为 `sm: h-7` / `md: h-8` / `lg: h-9`，没有 `h-8 → sm:h-9` 的响应式尺寸。
- `variant`（outline/ghost/danger）的 hover 是 `hover:bg-base-300`，没有
  `hover:-translate-y-px hover:shadow-lg hover:shadow-primary/15` 的抬升光晕，也没有
  warning 与 `disabled:bg-success/15` 变体。
- 直接复用会改变外观（明显视觉回归）；为覆盖这些变体而扩展 `IconButton` 的 props 会
  波及 `ConnectionsToolbar`/`LatencyCard`/`IPInfoCard` 等既有使用点，超出「消除重复」
  的范围。

## 方案

在 `<script setup>` 定义共享常量，替换 A 组 6 处渲染函数与 B 组 5 处模板绑定；唯一变体
（896 tools toggle、943 edit、1058 settings）保留内联：

```ts
// Square icon buttons shared by the group/provider headers and the page toolbar.
// Kept as constants so these long utility strings live in one place without
// changing the rendered classes.
const GROUP_ICON_BUTTON_BASE =
  'items-center justify-center w-8 h-8 rounded-lg sm:w-9 sm:h-9 transition-all duration-200 hover:-translate-y-px hover:shadow-lg active:translate-y-0'
const GROUP_ICON_BUTTON_NEUTRAL =
  'bg-base-content/6 border border-base-content/8 text-base-content/60 hover:bg-primary/15 hover:border-primary/30 hover:text-primary'
const GROUP_ICON_BUTTON_WARNING =
  'bg-warning/10 border border-warning/20 text-warning hover:bg-warning/20 hover:border-warning/40 hover:shadow-warning/15'
const GROUP_ICON_BUTTON_SUCCESS_DISABLED =
  'disabled:bg-success/15 disabled:border-success/30 disabled:cursor-not-allowed disabled:opacity-100'
const TOOLBAR_ICON_BUTTON =
  'flex h-9 w-9 items-center justify-center rounded-lg border border-base-content/10 bg-base-200/80 transition-all duration-200 hover:border-primary/30 hover:bg-primary/15 hover:text-primary'
```

- A 组：`hidden sm:flex ${GROUP_ICON_BUTTON_BASE} ${GROUP_ICON_BUTTON_NEUTRAL} …`、
  `flex ${GROUP_ICON_BUTTON_BASE} ${GROUP_ICON_BUTTON_WARNING}`、
  `flex ${GROUP_ICON_BUTTON_BASE} ${GROUP_ICON_BUTTON_NEUTRAL} ${GROUP_ICON_BUTTON_SUCCESS_DISABLED}`。
  `display`（`flex` / `hidden sm:flex`）不进 `BASE`，避免 `hidden` 与 `flex` 冲突。
- B 组：`928`/`953`/`986`/`999` 改 `:class="TOOLBAR_ICON_BUTTON"`；`1043` 改
  ``:class="`${TOOLBAR_ICON_BUTTON} text-base-content/70`"``。
- 新增 source-scan 守卫 `__tests__/proxies-icon-button-classes.spec.ts`：提取源码中
  含 `w-8 h-8` 或 `h-9 w-9` 且长度 > 60 的 class 串，断言没有重复值。实现前 A、B 两组
  的逐字复制会触发失败，实现后常量定义不在 `class` 位置，只有唯一变体内联，故通过。

取舍：

- 备选 A：扩展并复用 `IconButton.vue`。会引入 warning/lift 变体与响应式尺寸，改动
  `IconButton` 公共 API 并可能回归其它页面，收益小于风险。
- 备选 B：把这些按钮抽成新组件（如 `ProxiesIconButton`）。能进一步收敛表单化配置，但
  6+ 个变体、条件 class、`disabled`/`aria` 透传会增加一层间接，且本次目标只是消除复制。
- 选择「文件内共享 class 常量」：最小改动、零视觉回归，且守卫可防止再次复制。

## 验收标准

- `proxies.vue` 中不再存在逐字重复的方形按钮 class 串（新守卫实现前红、实现后绿）。
- 每个受影响按钮渲染出的 class 集合与改动前完全一致（纯字符串等价重组）。
- `pnpm --filter @metacubexd/ui test:unit` 全绿。
- `pnpm --filter @metacubexd/ui typecheck` 通过。

## 关联文档

- `planning/TARGETS.md`（视觉目标：样式可复用、圆角统一）
- `packages/ui/components/IconButton.vue`（复用评估对象）
- `packages/ui/pages/proxies.vue`（受影响文件）
- `packages/ui/__tests__/icon-button-radius.spec.ts`（同类 source-scan 守卫风格）
