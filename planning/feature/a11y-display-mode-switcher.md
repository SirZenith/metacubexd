# 为显示模式切换器补可访问性语义

## 目标

代理页的显示模式切换器（卡片 / 列表 / 表格 / 主从）对辅助技术可用：每个图标按钮有可
访问名称，当前选中模式通过 `aria-pressed` 暴露，而不是只靠高亮颜色。

引用 TARGETS.md 相关准则：

- 用户体验「触屏设备与电脑的键鼠操作习惯不同，做适配时要考虑好不同设备上功能的使用
  方式是否合适」以及「单个界面内，不同的功能、信息应该要有明确的亲疏关系」——切换器
  是页面级的显示控制，必须让所有用户（含屏幕阅读器用户）都能识别其可用选项与当前值。
- 视觉目标「颜色配置要考虑好是否随用户的主题切换而切换」——选中态目前只用
  `bg-primary` 颜色编码，颜色失效或不可感知时状态丢失。

`packages/ui/PRODUCT.md`「Accessibility and Inclusion」要求：

- 「Give every action a keyboard path and every icon-only control an accessible name.」
- 「Never encode latency, health, or success/failure by color alone.」

`packages/ui/DESIGN.md` §7「Don't signal status by hue alone」同旨。

## 现状

`packages/ui/components/ProxiesDisplayModeSwitcher.vue`（共 58 行）：

- 容器 `<div class="flex items-center gap-1 rounded-lg …">` 无 `role`、无组名。
- `v-for` 生成的单个 `<button>` 只有 `:title="item.label"` 与颜色类，没有
  `aria-label`，选中态仅由
  `configStore.proxiesDisplayMode === item.mode ? 'bg-primary text-primary-content …'`
  表达，`aria-pressed` 缺失。
- `META` 已提供 `labelKey`，`items` 已算出 `label`（`t(labelKey)`），取名所需数据现成。

项目既有可访问性模式（均用 `aria-pressed`，无 `role="radiogroup"` 先例）：

- `components/IconMenuSelect.vue` 第 63 行 `:aria-label="props.title"`，被
  `ProxiesSortSelect` / `ProxiesCardSizeSelect` 复用。
- `components/ProxyMasterDetail.vue` 第 329/339/361/371/394/404 行筛选按钮用
  `:aria-pressed`；`ProxyNodeCard`/`ProxyNodeListItem`/`ProxyNodeTableRow` 亦然。

## 方案

1. 容器加 `role="group"` 与 `:aria-label="t('displayMode')"`。i18n key
   `displayMode`（"Display Mode"）已存在于七种语言，无需新增文案。
2. 每个按钮加：
   - `:aria-label="item.label"`（与 `:title` 同源，复用 `items` 的 `label`）；
   - `:aria-pressed="configStore.proxiesDisplayMode === item.mode"`，把当前选中态暴露给
     辅助技术。
3. 新增 source-scan 单测 `packages/ui/__tests__/display-mode-switcher-a11y.spec.ts`，断言：
   - 容器命名（`role="group"` + `:aria-label="t('displayMode')"`）；
   - 每个按钮都有 `:aria-label`；
   - 按钮有 `:aria-pressed`。

取舍：

- 备选 A：`role="radiogroup"` + `role="radio"` + `aria-checked`。语义上互斥单选更精确，
  但引入 radio 后需要按 WAI-ARIA 管理 roving tabindex 与方向键，否则键盘体验反而退化；
  项目零先例，成本超过本次范围。
- 备选 B：仅补 `aria-label`，不做选中态。仍违反「颜色非唯一编码」。
- 备选 C：把选中态写成 `aria-current`。`aria-current` 用于「当前项」（如当前页），
  不适用于模式选择，语义不符。
- 选择 `aria-pressed` + `role="group"`：与既有 toggle-button 模式一致
  （DESIGN.md「The Consistent-Affordance Rule」），原生 button 的 Tab/Enter/Space
  路径已完整，改动最小。

## 验收标准

- 容器含 `role="group"` 与 `:aria-label="t('displayMode')"`。
- `v-for` 按钮同时含 `:aria-label="item.label"` 与
  `:aria-pressed="configStore.proxiesDisplayMode === item.mode"`。
- 新单测 `display-mode-switcher-a11y.spec.ts` 在实现前失败、实现后通过。
- `pnpm --filter @metacubexd/ui test:unit` 全绿。
- `pnpm --filter @metacubexd/ui typecheck` 通过。

## 关联文档

- `packages/ui/PRODUCT.md`（可访问性与图标控件命名）
- `packages/ui/DESIGN.md` §7（不得仅以颜色编码状态）
- `planning/TARGETS.md`（用户体验与视觉目标）
- `packages/ui/components/IconMenuSelect.vue`、`components/ProxyMasterDetail.vue`（既有模式）
- `packages/ui/components/ProxiesDisplayModeSwitcher.vue`（受影响文件）
