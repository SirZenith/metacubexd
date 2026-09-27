# 优化代理主从列表大屏显示

## 目标

master-detail（主从）显示模式在宽屏下不再让右侧节点列表无限拉伸：详情面板设有最大
宽度，单行的节点名称与右侧延迟/类型保持紧凑，不再被推到屏幕两端。小屏与中等屏行为
不变。

引用 TARGETS.md 相关准则：

- 「UI 必须针对小、中、大屏都做适配」——当前只对小屏做了收敛，大屏反而因无限拉伸
  而失衡，本次补齐大屏。
- 「在单个界面上不要呈现过多的内容，要让用户能够一眼就看出界面上最重要的信息是
  什么」——单行信息被拉到屏幕两端后，一眼扫读变成左右找信息；限宽后信息重新聚拢。
- 「单个界面内，不同的功能、信息应该要有明确的亲疏关系」——名称与延迟属于同一条目，
  空间上应彼此靠近。

## 现状

相关代码：

- `packages/ui/components/ProxyMasterDetail.vue`
  - 根容器（第 197 行）：`flex min-h-0 flex-col gap-3 sm:h-full sm:flex-row`。
  - 左侧分组导航（第 199–224 行）：`sm:w-48` 固定宽度。
  - 右侧详情面板（第 227–229 行）：
    `flex min-w-0 flex-col rounded-xl border border-base-content/8 bg-base-200/40 sm:min-h-0 sm:flex-1 sm:overflow-hidden`
    —— `sm:flex-1` 让它在宽屏下占满除左导航外的全部宽度。
  - 节点列表（第 428–433 行）：`flex flex-col gap-2 px-3 ... sm:flex-1 sm:overflow-y-auto`，
    行宽随面板宽度无限增长。
- `packages/ui/components/ProxyNodeListItem.vue`
  - 行内布局（第 71–136 行）：`flex items-center gap-2`，名称为 `flex-1 min-w-0`，
    UDP/类型/延迟为 `shrink-0` 靠右。面板越宽，名称与右侧元数据之间的空隙越大。

现状行为：在 1920px 视口下，左导航约 192px，详情面板铺满其余约 1700px；单行的节点
名称贴左、延迟贴右，中间大片空白，观感差且扫读困难。

调研结论见 `planning/knowledge/list-detail-large-screen-layout.md`：垂直列表的详情
面板应设最大宽度、保持信息聚拢。

## 方案

给详情面板加最大宽度约束，保持左对齐（不整体居中，避免移动左导航）：

1. 详情面板（第 227 行）在现有 class 基础上追加：
   - `sm:max-w-4xl`：常规断点下宽度上限 56rem（896px）。
   - `2xl:max-w-5xl`：超宽断点（≥1536px）放宽到 64rem（1024px），给超宽屏略多空间。
2. 为便于 e2e 断言，给详情面板加 `data-testid="master-detail-detail"`。
3. 左导航保持 `sm:w-48` 贴左；详情面板随内容 grow 到上限即止，右侧留白自然增长。
4. 其余结构、header、筛选栏、列表项均不改动。

取舍：

- 备选方案 A：宽屏把节点列表改为多列网格。Material 在超宽屏确实允许加栏，但项目的
  「卡片」显示模式已承担多列职责；主从模式改成网格会让两种模式功能重叠，且读取延迟
  的扫读路径由横向变多列，收益不明确。故不采用。
- 备选方案 B：给行内名称设 `max-w-*` 而面板仍满宽。行右侧仍有大片空白，且 header 与
  列表宽度不一致，问题只解决一半。
- 备选方案 C：整体（导航 + 详情）居中。会移动左导航位置，改变既有布局锚点，且非必要；
  保持左对齐的「右边距增长」是 Material 认可的收尾方式之一。
- 选择追加 `max-w-*`：改动最小、桌面中屏与大屏均受益，小屏不受影响，且与 macOS
  设置面板「限制详情宽度」的成熟做法一致。

## 验收标准

- 在 1920px 视口进入 master-detail：详情面板（`data-testid="master-detail-detail"`）
  宽度不超过 1024px（`2xl:max-w-5xl` 上限，含边框容差），明显小于视口剩余空间。
- 在 1280px 视口进入 master-detail：详情面板宽度不超过 896px（`sm:max-w-4xl` 上限）。
- 左导航仍贴左、宽度约 192px；节点列表仍可纵向滚动，行内名称与延迟/类型正常显示。
- 小屏（< 640px）行为与现状一致（纵向堆叠、整页滚动），无回归。
- e2e 新增用例覆盖大屏详情面板的宽度上限；既有 master-detail e2e 全部通过。
- `pnpm --filter @metacubexd/ui typecheck` 通过；`test:unit` 通过；e2e 通过。

## 关联文档

- `planning/knowledge/list-detail-large-screen-layout.md`（调研结论）
- `planning/TARGETS.md`（用户体验与视觉目标）
- `packages/ui/DESIGN.md`（卡片面板、圆角、间距）
- `packages/ui/PRODUCT.md`（Responsive parity）
