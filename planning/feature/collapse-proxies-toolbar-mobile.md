# 小屏代理工具栏折叠

## 目标

在小屏（`< sm`，即宽度 < 640px）下，代理页面顶部的工具按钮区（Action Buttons）
默认收起，改由一个工具箱图标按钮控制展开／收起；工具箱按钮固定显示在 Tabs 同一
行的最右侧。桌面（`≥ sm`）保持现状：工具箱按钮不出现，工具按钮区常驻可见。

引用 TARGETS.md 相关准则：

- 「在小屏上，要减少在不可滚动位置放置尺码过大的元素，要让用户看到尽可能多的有
  用信息」——页面 header 是不可滚动的固定区域，工具按钮区占据了其中大量空间，
  收起后把纵向空间让给代理列表。
- 「在单个界面上不要呈现过多的内容……使用频率低或者相对次要的信息，放到二级界
  面」——工具按钮是低频操作，收进一层可展开的容器就是「二级界面」的轻量形式。
- 「触屏设备与电脑的键鼠操作习惯不同，做适配时要考虑好不同设备上功能的使用方式
  是否合适」——小屏以减小视觉噪音、扩大可读内容为优先；桌面空间充裕，保持工具
  常驻以减少一次点击。
- 「单个界面内……相近、相似、相关的功能应该在空间上接近彼此」——工具箱按钮与它
  展开的按钮区相邻，展开后仍聚合在 header 内。

## 现状

相关代码：

- `packages/ui/pages/proxies.vue`
  - header 容器（第 829 行起）为
    `flex shrink-0 flex-wrap items-center gap-3`，依次包含：
    - Tabs（第 833–856 行）：`Proxies` / `Proxy Providers` 两个 tab。
    - **Action Buttons 区**（第 858–952 行，`<div class="flex items-center gap-2">`）：
      `ProxiesDisplayModeSwitcher`、`ProxiesSortSelect`、`ProxiesCardSizeSelect`、
      Collapse/Expand All、Edit、Test All Groups、批量测速进度条、Health-check All
      Providers、Refresh Providers。
    - Node Name Filter 搜索框（第 954–973 行，`ml-auto flex-1`）。
    - Connectivity Board 按钮（第 975–984 行）。
    - Settings 按钮（第 986–994 行）。
  - 这些按钮在 `flex-wrap` 容器内会于小屏折成多行，占用不可滚动的 header 高度。
- `packages/ui/components/ProxiesDisplayModeSwitcher.vue`、`ProxiesSortSelect.vue`、
  `ProxiesCardSizeSelect.vue`：Action Buttons 区内引用的控件组件。
- `packages/ui/components/Button.vue`：项目统一按钮外壳，含 `.btn-press` 触感与
  焦点环；工具箱按钮复用它。

现状行为：小屏打开代理页时，Tabs、全部工具按钮、搜索框、连通性/设置按钮一并
铺开，header 占据多行；其中工具按钮为低频操作，却与高频的 Tabs、搜索框争夺
同一个不可滚动区域。

## 方案

在 header 的 Tabs 与 Action Buttons 之间插入一个仅小屏可见的工具箱按钮，并把
Action Buttons 区改为「仅小屏可折叠」。

1. `scripts` 中新增状态 `const showMobileTools = ref(false)`，页面重新打开时默认
   `false`（初始隐藏），不持久化——需求明确要求「界面打开时，工具栏隐藏」。
2. 工具箱按钮：
   - 类 `ml-auto sm:hidden`：小屏出现在 Tabs 同行最右侧，桌面不渲染。
   - `data-testid="proxies-tools-toggle"`，`aria-label` / `title` 用新增 i18n key
     `proxiesTools`。
   - `aria-expanded="showMobileTools"`、`aria-controls` 指向 Action Buttons 区，
     保证键盘与读屏用户可感知展开状态。
   - active 样式：展开时套用与其它激活工具一致的主色高亮
     （`bg-primary/15 border-primary/40 text-primary`）；收起时为基础样式。
   - 点击切换 `showMobileTools`。图标用 `@tabler/icons-vue` 的 `IconTools`。
3. Action Buttons 区：
   - 加 `data-testid="proxies-actions"`。
   - 加 `:class="{ 'max-sm:hidden': !showMobileTools }"`：仅小屏隐藏，桌面不受
     影响（`max-sm:hidden` 只在 `< sm` 生效）。
   - 小屏加 `max-sm:w-full max-sm:flex-wrap`，使展开时整区换行独占一行，不挤压
     Tabs 与工具箱按钮的同一行关系。
4. 新增 i18n key `proxiesTools`，同步写入 `packages/ui/i18n/locales/` 下 7 个
   JSON（`en/fa/fr/ja/ko/ru/zh`）。英文取 `Tools`，中文取 `工具`。

取舍：

- 备选方案 A：把工具按钮收进 daisyUI `dropdown`／底部抽屉。改动面更大，且需求
  只要求「工具箱按钮切换显示状态」，就地显隐已满足；引入浮层会遮挡列表内容。
- 备选方案 B：持久化展开状态为用户偏好。TARGETS 允许持久化偏好，但需求明确
  「界面打开时，工具栏隐藏」，持久化会与之一致性冲突；且这是可即时切换的临时
  视图状态，收益不明确。
- 备选方案 C：把 Connectivity / Settings 一并纳入折叠区。它们不在代码中的
  「Action Buttons 区」（第 858–952 行）内，且连通性/设置属于全局高频入口，纳入
  会扩大范围；故本次仅折叠该 div。
- 选择就地显隐 + 仅小屏生效：改动最小、桌面零回归，且完全满足需求描述。

## 验收标准

- 小屏（视口宽 390px）打开 `/proxies`：Action Buttons 区不可见，工具箱按钮
  可见且位于 Tabs 同一行最右侧。
- 点击工具箱按钮：Action Buttons 区可见、工具箱按钮呈 active 样式、
  `aria-expanded="true"`。
- 再次点击：Action Buttons 区隐藏、工具箱按钮回到非 active、`aria-expanded="false"`。
- 桌面（视口宽 ≥ 640px）：工具箱按钮不显示；Action Buttons 区始终可见，既有
  「Test All」「Expand All」等按钮可正常点击（不回归）。
- 切换到 `Proxy Providers` tab 后，折叠/展开行为同样成立（header 为两个 tab 共用）。
- e2e 新增用例覆盖上述切换；既有小屏 e2e（`should scroll the active proxy tab to
top on mobile` 依赖 `Expand All`）先展开工具箱再操作。
- `pnpm --filter @metacubexd/ui typecheck` 通过；`test:unit` 通过；e2e 在可运行
  环境下通过。

## 关联文档

- `planning/TARGETS.md`（用户体验与视觉目标）
- `packages/ui/PRODUCT.md`（Responsive parity / Accessibility）
- `packages/ui/DESIGN.md`（按钮形态、语义色、焦点环）
- `CONTEXT.md`（Proxy Group / Proxy Provider 术语）
