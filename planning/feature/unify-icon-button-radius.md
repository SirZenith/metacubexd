# 统一图标按钮圆角

## 目标

项目中的方形图标按钮（仅图标、`items-center justify-center` 的按钮/按钮组件）统一使用
`DESIGN.md` 的按钮圆角令牌 field radius `rounded-lg`（`0.5rem` / 8px），消除 `rounded-md`
与其它值混杂的漂移。

引用 TARGETS.md 相关准则：

- 「圆角」「整个项目的圆角要风格统一」——同类控件（图标按钮）应共享同一个圆角令牌。
- 「样式也要尽量写成可以复用的形式」——图标按钮组件 `IconButton` 的多个变体必须共用同一
  圆角，否则复用会带来外观分叉。
- 「单个界面内……相近、相似、相关的功能应该在空间上接近彼此，样式上也可以相似」
  ——工具栏里并排的图标按钮若圆角不一致会显出拼凑感。

## 现状

`DESIGN.md` §6 Buttons：按钮形状为 field radius（`0.5rem` / 8px，`rounded-lg` 是
workhorse；pills 用 `rounded-full`）。

当前方形图标按钮的圆角并不统一：

- `packages/ui/components/IconButton.vue`（项目图标按钮组件）三个变体：
  - `outline`: `rounded-lg`（第 36 行）
  - **`ghost`: `rounded-md`（第 38 行）** ← 同一组件内不一致
  - `danger`: `rounded-lg`（第 40 行）
- 原生/`Button` 方形图标按钮仍为 `rounded-md`：
  - `packages/ui/pages/rules.vue` 第 777、785、793 行（h-7 w-7：上移/下移/删除）
  - `packages/ui/components/NetworkConfigPanel.vue` 第 199 行（h-7 w-7：删除隧道）
  - `packages/ui/components/ProxiesDisplayModeSwitcher.vue` 第 46 行（h-7 w-7：显示模式）
  - `packages/ui/pages/proxies.vue` 第 999 行（h-5 w-5：清除节点筛选）

不入本次范围的相关元素（非「方形图标按钮」，保留原样）：

- 圆形 pill 按钮（`rounded-full`）：回到顶部 FAB、移动端导航中央按钮、全局流量浮窗等，
  属 `DESIGN.md` 允许的 pill 形状。
- `DESIGN.md` §6 明确规定的 Latency pill：`Latency.vue` 第 61 行固定 `rounded-md`。
- 非按钮的图标容器/徽标：`setup.vue` 第 120 行（端点图标底衬）、
  `ConnectionsTable.vue` 第 336 行（连接分组展开图标）。
- badge / chip / tab / select 等带文字的控件，其 `rounded-md` 不属于图标按钮。

## 方案

把方形图标按钮统一到 `rounded-lg`：

1. `IconButton.vue` 的 `ghost` 变体 `rounded-md` → `rounded-lg`，使组件三变体一致；
   使用该变体的 `ConnectionsToolbar` 等调用点随之统一。
2. `rules.vue`（3 处）、`NetworkConfigPanel.vue`（1 处）、`proxies.vue`（1 处）的
   `h-7 w-7` / `h-5 w-5` 图标按钮 `rounded-md` → `rounded-lg`。
3. `ProxiesDisplayModeSwitcher.vue` 内部图标按钮 `rounded-md` → `rounded-lg`，
   与项目图标按钮一致。
4. 新增单元测试 `packages/ui/__tests__/icon-button-radius.spec.ts`：读取
   `IconButton.vue` 源码，断言三个变体都用 `rounded-lg`、不含 `rounded-md`，防止组件级
   圆角再次分叉。

取舍：

- 备选方案 A：保留 `ghost` 用 `rounded-md`，理由是低强调变体更紧凑。但同一组件三个变体
  圆角不同会让复用外观不可预期，正是本次要消除的漂移；且 `rounded-md` 不是按钮令牌。
- 备选方案 B：把圆形 pill 按钮也改成 `rounded-lg`。会破坏刻意设计的圆形 FAB 形状，
  超出「图标按钮圆角统一」的范围，且违反 `DESIGN.md` 的 pill 约定，故不做。
- 备选方案 C：为 h-7/h-5 小图标按钮保留更小圆角。会让「图标按钮」再次出现按尺寸分叉的
  圆角，背离统一目标；`rounded-lg` 在这些尺寸上仍属可接受范围。故全部统一。
- 选择上述方案：范围清晰、全部落在既有令牌内，且组件级不变量可由单测守护。

## 验收标准

- `IconButton.vue` 三个变体（outline/ghost/danger）均为 `rounded-lg`；新增单测通过，
  且把任一变体改回 `rounded-md` 会让该测试失败。
- `rules.vue`、`NetworkConfigPanel.vue`、`ProxiesDisplayModeSwitcher.vue`、`proxies.vue`
  中的方形图标按钮均为 `rounded-lg`。
- 圆形 pill 按钮与 Latency pill 圆角不变（`rounded-full` / `rounded-md`）。
- `pnpm --filter @metacubexd/ui typecheck` 通过；`test:unit` 通过；e2e 通过。
- 不修改 `DESIGN.md`（其按钮令牌定义与本次实现一致）。

## 关联文档

- `packages/ui/DESIGN.md`（§6 Components：Buttons；§2 Sources of Truth）
- `planning/TARGETS.md`（视觉目标：圆角、样式可复用）
- 前序 TODO「清理无令牌值 rounded-[0.625rem]」
- 后续 TODO「卡片面板 rounded-xl→rounded-2xl 并逐屏视觉验收」
