# 修正主从面板 header 的圆角不一致

## 目标

代理页「主从（master-detail）」显示模式下，右侧详情面板的 header 顶部圆角与其父容器
圆角一致，不再出现卡片轮廓与内部条带圆角错位的观感。

引用 TARGETS.md 相关准则：

- 视觉目标「整个项目的圆角要风格统一」——父容器 1rem、header 0.75rem 属于同一容器
  内部两套尺度并存，破坏统一性。
- 用户体验「单个界面内，不同的功能、信息应该要有明确的亲疏关系」——header 是详情
  面板的一部分，应与面板共享同一轮廓，而不是呈现为更小圆角的独立块。

`packages/ui/DESIGN.md` §6 的圆角尺度规定：

- Box（`rounded-2xl`，1rem）：卡片与页面面板。
- Compact panel（`rounded-xl`，0.75rem）：刻意紧凑的面板——菜单、tooltip、嵌套表单区。
- master-detail 一节明确「Corner Style: box radius（`rounded-2xl`），仅刻意更紧凑的
  面板才用 `rounded-xl`」。

## 现状

- `packages/ui/components/ProxyMasterDetail.vue`：
  - 第 230 行详情面板容器：`flex min-w-0 flex-col rounded-2xl border …`（1rem）。
  - 第 234 行详情面板 header：`flex shrink-0 flex-col gap-1.5 rounded-t-xl border-b …`（0.75rem）。
  - header 顶部两角比容器小 0.25rem，圆角弧线不重合。
- 该文件其余圆角为 `rounded-lg`（字段/按钮）、`rounded-full`（pill/圆形图标按钮），
  无其它 `rounded-xl` 变体。
- `packages/ui/__tests__/card-panel-radius.spec.ts` 对
  `PanelCard.vue`/`Collapse.vue`/`ProxyNodeCard.vue`/`ProxyMasterDetail.vue` 断言
  `toContain('rounded-2xl')` 且 `not.toContain('rounded-xl')`。字符串匹配不区分
  `rounded-xl` 与 `rounded-t-xl`，因此本次方向变体漂移长期漏检。

## 方案

1. `ProxyMasterDetail.vue` 第 234 行 `rounded-t-xl` → `rounded-t-2xl`。header 仅需
   顶部两角与容器 1rem 对齐，底部由 `border-b` 分隔，沿用 `rounded-t-*` 语义。
2. 强化 `card-panel-radius.spec.ts` 断言：用正则
   `/rounded(?:-[a-z]{1,2})?-xl\b/` 匹配裸 `rounded-xl` 及全部方向/逻辑变体
   （`rounded-t-xl`、`rounded-tl-xl`、`rounded-s-xl`、`rounded-ss-xl` 等），
   同时不误伤 `rounded-2xl`/`rounded-3xl`（可选组只吃字母，不吃数字）。保留
   `toContain('rounded-2xl')` 正向断言。

取舍：

- 备选 A：只改组件、不动测试。同类漂移会再次漏检，与 `desc` 要求不符。
- 备选 B：把 header 改成 `rounded-2xl`（四角）。容器在 `sm` 以上 `overflow-hidden`，
  底部两角本就被裁切；header 与下方内容之间用 `border-b` 分隔，四角圆角无意义。
  `rounded-t-2xl` 更贴合结构。
- 备选 C：测试继续用字符串匹配，仅额外加一条 `not.toContain('rounded-t-xl')`。
  只能覆盖 `t` 一个方向，遗漏 `tl/s/ss` 等变体，不能根治。

## 验收标准

- `ProxyMasterDetail.vue` 不再出现任何 `rounded-xl` 方向变体；第 234 行为
  `rounded-t-2xl`，与第 230 行 `rounded-2xl` 同尺度。
- `card-panel-radius.spec.ts` 的新正则能在修复前捕获 `rounded-t-xl`（红），修复后
  四个 `PANEL_COMPONENTS` 全绿；`rounded-2xl` 不被正则误判。
- `pnpm --filter @metacubexd/ui test:unit` 全绿。
- `pnpm --filter @metacubexd/ui typecheck` 通过。

## 关联文档

- `packages/ui/DESIGN.md` §6（圆角尺度与 master-detail 角样式）
- `planning/TARGETS.md`（视觉目标：圆角风格统一）
- `packages/ui/components/ProxyMasterDetail.vue`（受影响文件）
- `packages/ui/__tests__/card-panel-radius.spec.ts`（守卫）
