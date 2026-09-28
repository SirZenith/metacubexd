# 拆分 config.vue 超大页面

## 目标

把 `packages/ui/pages/config.vue` 中最独立的两个设置区块（Appearance、Recommendation）
提取为子组件，降低 1570 行单文件的修改与复用成本，同时保持 DOM、class 与行为不变。

引用 TARGETS.md 相关准则：

- 视觉目标「样式也要尽量写成可以复用的形式」——成段的设置 UI 应成为可独立复用的组件。
- 用户体验「单个界面内，不同的功能、信息应该要有明确的亲疏关系」——把
  Appearance / Recommendation 这类自成一组的功能收敛为独立组件，边界更清晰。

`planning/workflow/refill.md` 也明确要求对超长文件评估拆分。

## 现状

`packages/ui/pages/config.vue`（1570 行）的 XD Config 卡片（第 667–1193 行）内包含：

- 基础 XD 设置（twemoji、data usage、default page、主题自动切换等）。
- **Appearance**（第 813–992 行）：字体、背景类型/上传/URL、模糊与遮罩、自定义主题色、
  自定义 CSS。
- `ShortcutsSettings`（第 994–998 行）。
- **Recommendation**（第 1000–1143 行）：自动切换、三项权重、最小测试间隔、排除节点、
  清除历史。
- Settings Backup（第 1145–1171 行）与 Endpoint 按钮（第 1173–1191 行）。

相关 script 局部状态（第 47–97、36 行）：

- `useAppearance()`、`backgroundFileInput`、`themeColorTokens`（= `CUSTOM_THEME_TOKENS`）、
  `fontOptions`、`onUploadBackground`、`onClearBackground`、`onThemeColorInput`。
- `nodeRecommendationStore`（Pinia 全局 store，Recommendation 区块使用）。

既有可复用外壳：`PanelCard` / `PanelHeader` / `ConfigSettingRow` / `ThemeSelector`。

## 方案

1. 新建 `packages/ui/components/ConfigAppearanceSection.vue`：
   - 渲染 Appearance 的 divider 与其内容（原 813–992 行），根为多元素（divider + 内容
     `div`），保证插入父级 `flex flex-col gap-3` 后 DOM 与原来一致。
   - script 内自带 `useAppearance()`、`backgroundFileInput`、`fontOptions`、
     `CUSTOM_THEME_TOKENS` 与三个 handler（这些原本只服务该区块）。
2. 新建 `packages/ui/components/ConfigRecommendationSection.vue`：
   - 渲染 Recommendation 的 divider 与其内容（原 1000–1143 行），使用全局
     `nodeRecommendationStore`；`IconTrash` 由组件自行引入。
3. `config.vue`：用 `<ConfigAppearanceSection />` 与 `<ConfigRecommendationSection />`
   替换对应区间；删除已移走的 script 状态、`fontOptions`、handler 与
   `nodeRecommendationStore`，并清理不再使用的图标 import。

取舍：

- 备选 A：整体提取 XD Config 卡片为 `ConfigXdCard.vue`。该卡片头部绑定页面
  `activeSection`（移动端 tab 显示）与动画 class，尾部 Settings Backup、Endpoint 按钮
  依赖页面的 `switchEndpoint` / `endpointStore`（也被页面其它区块复用），整体提取需要
  emit/透传，边界反而更脏。
- 备选 B：拆出基础 XD 设置（twemoji 等）。这些行只是 `configStore` 双向绑定，数量少、
  关联弱，拆出收益低。
- 选择「拆 Appearance 与 Recommendation 两个最独立区块」：边界清晰、依赖可自洽，
  一次去掉约 400 行，风险可控。

## 验收标准

- 新增 `ConfigAppearanceSection.vue`、`ConfigRecommendationSection.vue`，
  `config.vue` 对应区间替换为两个组件引用。
- `config.vue` 不再声明 Appearance 相关状态/handler 与 `nodeRecommendationStore`，
  无未使用的图标 import。
- DOM 与 class 结构不变（组件多根，无额外包裹元素）。
- `pnpm --filter @metacubexd/ui test:unit` 全绿。
- `pnpm --filter @metacubexd/ui typecheck` 通过。

## 关联文档

- `planning/TARGETS.md`（可复用、信息亲疏关系）
- `planning/workflow/refill.md`（大文件拆分要求）
- `packages/ui/pages/config.vue`（受影响文件）
- `packages/ui/composables/useAppearance.ts`（Appearance 状态来源）
- `packages/ui/components/ConfigSettingRow.vue`（复用外壳）
