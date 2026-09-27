# 卡片面板圆角统一到 rounded-2xl

## 目标

把项目中的卡片/面板容器圆角从 `rounded-xl` 提升到 `DESIGN.md` 的 box radius
`rounded-2xl`（`1rem` / 16px）；仅刻意更紧凑的面板与控件保留 `rounded-xl`。

引用 TARGETS.md 相关准则：

- 「圆角」「整个项目的圆角要风格统一」——`DESIGN.md` 早已把面板/卡片圆角定为
  `rounded-2xl`，但实现里大量卡片仍是 `rounded-xl`，文档与实现不一致。
- 「样式也要尽量写成可以复用的形式」——统一后通用面板组件（`PanelCard`）与各页面
  卡片共享同一圆角，复用不再产生外观分叉。

`DESIGN.md` §6 Cards/Panels 原文：「Corner Style: box radius (1rem / 16px;
rounded-2xl). Use rounded-xl only for deliberately more compact panels.」
故本任务是把「默认面板」补齐到 `rounded-2xl`，「刻意紧凑的面板/控件」维持
`rounded-xl`。

## 现状

全项目 `rounded-xl` 共 75 处、`rounded-2xl` 20 处。`rounded-xl` 混用了两类语义：
页面级卡片/面板（应 `rounded-2xl`）与控件/紧凑面板（应保留）。

## 方案

### 提升为 `rounded-2xl`（卡片/面板容器，共 31 处）

- 通用组件：
  - `components/PanelCard.vue:11`（通用面板外壳，被 14 处复用）
  - `components/Collapse.vue:55`（代理组/规则组折叠卡片）
  - `components/ProxyNodeCard.vue:124`（代理节点卡片）
  - `components/ProxyMasterDetail.vue:230`（主从详情面板）
  - `components/connections/ConnectionsTable.vue:268`（连接表容器）
  - `components/OnboardingEmptyState.vue:42`（引导 banner 卡片）
  - `components/OnboardingWizard.vue:284`（向导选项卡片；同一文件 271 的图标底衬保留）
  - `components/ProfileImportHero.vue:150`（导入 hero 卡片）
- 页面级卡片：
  - `pages/overview.vue`：stat cards（391/411/431/455/479/499）与图表卡
    （536/549/558/570/583/592）共 12 处
  - `pages/traffic.vue:485,499`（流量图表卡）
  - `pages/rules.vue:495,609`（规则卡片）
  - `pages/profiles.vue:379,525`（profiles 卡片）
  - `pages/logs.vue:336`、`pages/connections.vue:782`（表格容器卡）
  - `pages/setup.vue:111`（endpoint 卡片）
- 加载骨架（与目标卡片同形，避免加载完成后圆角跳变）：
  - `pages/proxies.vue:1053,1175`、`pages/profiles.vue:366`

### 保留 `rounded-xl`（刻意紧凑的面板/控件）

- 分段控件 / tab 容器：`rules.vue:298,366`、`ConnectivityBoard.vue:119`、
  `proxies.vue:839`
- 图标底衬/徽标：`config.vue:333`、`traffic.vue:397,418,436,454`、
  `OnboardingWizard.vue:271`、`control.vue:60`
- 浮动菜单 / tooltip / 浮动指示器：`ThemeSwitcher.vue:73`、`Versions.vue:367,426`、
  `LangSwitcher.vue:85`、`Sidebar.vue:368`、`ThemeSelector.vue:111`、
  `IconMenuSelect.vue:84`、`ProxyNodeTooltip.vue:96`、`GlobalTrafficIndicator.vue:554,586`、
  `ThemeList.vue:81`
- 导航滑块：`MobileBottomNav.vue:174,257`
- 表单内嵌紧凑区块：`ProxyConfigEditor.vue:400,458,521,539,630,684,741`、
  `profiles/[id]/edit.vue:691,713,735,773,804,845,1021,1157,1204`、`config.vue:1464`
- 表格内小卡：`TrafficDetailsTable.vue:311`（`sm:rounded-xl`，小屏为 `rounded-lg`）

取舍：

- 备选方案 A：全部 `rounded-xl` → `rounded-2xl`（含菜单/图标/内嵌区块）。会让下拉
  菜单、分段控件、表单内区块的圆角过大，破坏层级与控件手感，超出「卡片面板」语义。
- 备选方案 B：不改骨架屏。加载完成的瞬间圆角会从 12px 跳到 16px，产生可见抖动；
  骨架本应与目标卡片同形，故一并统一。
- 选择按「默认面板 → 2xl，紧凑/控件 → 保留」映射：与 `DESIGN.md` 规则一致，范围
  可枚举、可用静态测试守护。

## 验收标准

- 上列「提升」清单中的 31 处均为 `rounded-2xl`。
- 上列「保留」清单中的元素仍为 `rounded-xl`。
- 新增单元测试 `packages/ui/__tests__/card-panel-radius.spec.ts`：断言
  `PanelCard.vue`、`Collapse.vue`、`ProxyNodeCard.vue` 使用 `rounded-2xl` 且不含
  `rounded-xl`，防止通用面板组件回退。
- `pnpm --filter @metacubexd/ui typecheck` 通过；`test:unit` 通过；e2e 通过
  （e2e 断言的 class/结构不受影响）。
- 说明：本任务的「逐屏视觉验收」在自动循环下以「静态清单 + 单测 + e2e 全通过」
  近似；人工逐屏复核可作为后续「检查项目圆角体系是否统一」任务的输入。

## 关联文档

- `packages/ui/DESIGN.md`（§6 Components：Cards/Panels；§2 Sources of Truth）
- `planning/TARGETS.md`（视觉目标：圆角、样式可复用）
- 前序 TODO「清理无令牌值 rounded-[0.625rem]」「统一图标按钮圆角」
- 后续 TODO「检查项目的圆角体系是否已经统一」
