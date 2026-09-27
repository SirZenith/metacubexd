# 小屏代理工具栏折叠

## 目标

在小屏（`< sm`，宽度 < 640px）下，代理页面顶部的整条工具栏默认收起，由一个工具箱
图标按钮统一控制展开／收起；工具箱按钮固定显示在 Tabs 同一行的最右侧。桌面
（`≥ sm`）保持现状：工具箱按钮不出现，工具栏常驻可见。

工具栏由四块构成：

1. Action Buttons 区（显示模式切换、排序、卡片尺寸、展开/收起全部、编辑、测试全部、
   批量测速进度、健康检查、刷新 Provider）；
2. Node Name Filter 节点名称筛选框；
3. Connectivity Board（连通性面板）按钮；
4. Settings（代理设置）按钮。

引用 TARGETS.md 相关准则：

- 「在小屏上，要减少在不可滚动位置放置尺码过大的元素，要让用户看到尽可能多的有用
  信息」——header 是不可滚动的固定区域，四条工具栏占满了它，收起后纵向空间还给代理
  列表。
- 「在单个界面上不要呈现过多的内容……使用频率低或者相对次要的信息，放到二级界面」
  ——这些控件都是低频操作，收进一层可展开容器即是轻量的「二级界面」。
- 「触屏设备与电脑的键鼠操作习惯不同，做适配时要考虑好不同设备上功能的使用方式
  是否合适」——小屏以减小视觉噪音为先，桌面空间充裕则保持常驻以减少一次点击。
- 「单个界面内……相近、相似、相关的功能应该在空间上接近彼此」——工具箱按钮与其
  展开的整条工具栏相邻聚合。

## 现状

相关代码：`packages/ui/pages/proxies.vue` 的 header（第 833–1024 行）。

- 已实现（提交 `2f20f94f`）：小屏工具箱按钮（`data-testid="proxies-tools-toggle"`，
  第 865–880 行）与 `showMobileTools` 状态（第 68 行），**但只折叠了 Action Buttons
  区**：该 div 有 `id="proxies-actions"`、`data-testid="proxies-actions"`，并以
  `:class="{ 'max-sm:hidden': !showMobileTools }"`（第 883–888 行）在小屏收起。
- 未纳入折叠：
  - Node Name Filter（第 983–1002 行，`<div class="ml-auto flex h-9 min-w-40 flex-1 ...">`）；
  - Connectivity Board Button（第 1004–1013 行，外层 `<div>`）；
  - Settings Button（第 1015–1023 行，外层 `<div>`）。
- `packages/ui/components/Button.vue`：统一按钮外壳（`.btn-press` 触感、焦点环），
  工具箱按钮复用。
- `packages/ui/e2e/pages.spec.ts`（第 602–653 行）已有 e2e 覆盖工具箱按钮的切换，
  但仅针对 `proxies-actions`。

现状行为：小屏打开代理页时，Action Buttons 已可折叠，但搜索框、连通性、设置三个
控件仍常驻 header，需求要求的「整条工具栏」尚未全部收起。

## 方案

把已存在的 `showMobileTools` 开关应用到全部四个工具栏区块，保持「仅小屏生效」。

1. Node Name Filter / Connectivity / Settings 三个根元素各自补上
   `:class="{ 'max-sm:hidden': !showMobileTools }"`。
2. 为三者补充 `data-testid`（`proxies-name-filter`、`proxies-connectivity`、
   `proxies-settings`），便于 e2e 断言整体显隐。
3. 保持 Action Buttons 区现有折叠逻辑不变，形成四块同步显隐。
4. `aria-controls` 的语义从 `proxies-actions` 扩展为整条工具栏：把工具箱按钮的
   `aria-controls` 指向一个新的、包裹四块的容器 `id="proxies-toolbar"`，或保留现状并
   在文档中说明（见取舍）。

取舍：

- 备选方案 A：用一个包裹容器 `<div id="proxies-toolbar">` 包住四块，桌面用
  `sm:contents` 使其子元素继续参与 header 的 flex 布局，小屏用 `flex flex-wrap` 并
  整体 `max-sm:hidden`。语义最贴近「一条工具栏」，但 `display: contents` 会改变
  桌面布局参与方式，风险高于收益；且四块本就在同一 header 内，分散的
  `max-sm:hidden` 条件在效果上等价。
- 备选方案 B：把工具栏收进抽屉 / 弹出层。改动面大，且需求只要求「切换显示状态」，
  就地显隐即可；浮层还会遮挡列表。
- 选择方案：沿用现有 `showMobileTools` 条件，逐块加 `max-sm:hidden`，改动最小、桌面
  零回归，满足需求描述。

## 验收标准

- 小屏（视口宽 390px）打开 `/proxies`：四块工具栏（Action Buttons、Node Name
  Filter、Connectivity、Settings）全部不可见；工具箱按钮可见且位于 Tabs 同一行
  最右侧。
- 点击工具箱按钮：四块工具栏全部可见、按钮呈 active 样式、
  `aria-expanded="true"`。
- 再次点击：四块工具栏全部隐藏、按钮回到非 active、`aria-expanded="false"`。
- 桌面（视口宽 ≥ 640px）：工具箱按钮不显示；四块工具栏全部可见且可正常使用
  （不回归）。
- 切换到 `Proxy Providers` tab 后，折叠/展开行为同样成立（header 为两个 tab 共用）。
- e2e 扩展既有 `should collapse the mobile proxies toolbar behind a tools toggle`，
  断言四块工具栏随切换同步显隐；既有小屏滚动测试（依赖 `Expand All`）保持先展开
  工具箱再操作。
- `pnpm --filter @metacubexd/ui typecheck` 通过；`test:unit` 通过；e2e 在可运行环境
  下通过。

## 关联文档

- `planning/TARGETS.md`（用户体验与视觉目标）
- `packages/ui/PRODUCT.md`（Responsive parity / Accessibility）
- `packages/ui/DESIGN.md`（按钮形态、语义色、焦点环）
- `CONTEXT.md`（Proxy Group / Proxy Provider 术语）
