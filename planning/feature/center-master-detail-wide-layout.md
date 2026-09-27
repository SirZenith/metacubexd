# 居中主从模式的大屏内容

## 目标

`proxies` 页在主从（master-detail）显示模式下，超宽屏不再把「左分组导航 + 限宽详情
面板 + 页面工具栏」整体贴在页面左侧、右侧留出大片空白；而是让这块限宽内容在可用宽度
内**水平居中**，左右留白大致相等，画面观感更平衡。

引用 TARGETS.md 相关准则：

- 「单个界面内，不同的功能、信息应该要有明确的亲疏关系」——内容聚拢成一块后，应被均
  匀地放置在界面中，而不是全部挤向一侧、另一侧突兀留白。
- 「UI 必须针对小、中、大屏都做适配」——中等与大屏是主从模式的主要使用场景，需要在
  限宽之后继续处理「限宽内容如何摆放」这一收尾问题。
- 视觉目标「扁平化」「圆角统一」不变；本次只调整摆放位置，不改面板样式。

## 现状

- `packages/ui/pages/proxies.vue`
  - 页面根容器（第 836–841 行）：
    `relative flex h-full min-h-0 min-w-0 flex-col gap-3`，在
    `masterPanelConstrained` 为真时追加 `sm:max-w-[68.75rem] 2xl:max-w-[76.75rem]`。
  - `masterPanelConstrained`（第 553–555 行）= 主从模式 且 `proxies` tab。
  - 由于只有 `max-w-*`、没有居中类，根容器由 flex 交叉轴 `stretch` 撑到宽度上限后
    **左对齐**：在 1920px 视口下内容宽约 76.75rem（1228px），左缘紧贴内容区，右侧
    留白约 450px，画面严重偏左。
  - `proxies-header`（第 848 行）与滚动区（第 1056 行）共用该根容器，因此 header 的
    `ml-auto` 控件（Node Name Filter / Connectivity / Settings）与浮动「返回顶部」
    按钮此前与面板右缘对齐（见 `align-proxies-chrome-master-detail`）。
- `packages/ui/components/ProxyMasterDetail.vue`
  - 根容器（第 197 行）`sm:flex-row`；左导航 `sm:w-48`（12rem）；详情面板
    `sm:max-w-4xl 2xl:max-w-5xl`（第 230 行）。三者共同决定限宽总宽。

现状行为：主从模式在 1280/1920px 视口下，整块内容贴左，右侧大片空白，与界面其它
居中的次要元素（如底部导航）在视觉重心上不一致。

调研结论见 `planning/knowledge/list-detail-large-screen-layout.md`：限宽之后，Material
认可的收尾方式之一是「居中并加宽边距」；把固定宽度内容居中与 macOS 系统设置等成熟界面
一致。

## 方案

在 `masterPanelConstrained` 为真时，给页面根容器追加 **居中** 类，保持既有宽度上限与
断点不变：

- 追加 `w-full sm:mx-auto`：
  - `w-full` 让根容器在交叉轴上先取满可用宽度（否则 flex column 中 `auto` 水平 margin
    会抑制 `stretch`，宽度塌缩到内容宽度）；
  - `sm:mx-auto`（`margin-inline: auto`）把受 `max-w-*` 截断后的内容块水平居中；
  - 小屏（`<sm`）没有 `max-w-*`，`mx-auto` 无剩余空间，行为与现状一致。
- 给根容器加 `data-testid="proxies-layout"` 以便 e2e 断言居中。
- 由于 header、滚动区、浮动按钮都在同一根容器内，三者随容器一并居中，且保持彼此
  「右缘对齐」的既有关系（`align-proxies-chrome-master-detail` 的验收不回归）。

取舍：

- 备选 A：继续左对齐，仅把详情面板在自身剩余空间内居中。会让 header 与面板右缘错位，
  破坏上一条 chrome 对齐的成果，且左侧导航与面板之间仍不均衡。
- 备选 B：在超宽屏把详情面板进一步放宽（如 `3xl:max-w-6xl`）。只增大单行长度，不解决
  「整块内容挤在左侧」的失衡，且超出舒适行宽。
- 备选 C：在超宽屏把节点列表改成多列网格。与项目独立的「卡片」显示模式职责重叠，已在
  `optimize-master-detail-large-screen` 中否决。
- 选择「同容器居中」：一处改动同时覆盖导航、详情面板、header 与浮动按钮；宽度常量与
  断点完全复用既有实现，无新增数值；非主从路径零影响。

## 验收标准

- 在 1920px 视口进入 `proxies` 主从模式：页面根容器（`data-testid="proxies-layout"`）
  在可用内容区内的左右留白之差 ≤ 2px（e2e 断言），即内容水平居中。
- 根容器宽度仍 ≤ 76.75rem + 2px（2xl 上限，不回归）；`master-detail-detail` 宽度
  仍 ≤ 1026px（2xl）/ ≤ 898px（1280px 视口，不回归）。
- header（`proxies-header`）右缘与 `master-detail-detail` 右缘之差 ≤ 2px（既有对齐
  不回归）。
- 小屏（< 640px）根容器仍为全宽、纵向堆叠，无回归。
- 既有 master-detail e2e（限宽、chrome 对齐、滚动到顶部、分组测速等）全部通过。
- `pnpm --filter @metacubexd/ui typecheck` 通过；`test:unit` 通过；e2e 通过。

## 关联文档

- `planning/knowledge/list-detail-large-screen-layout.md`（大屏列表-详情宽度与收尾方式调研）
- `planning/feature/optimize-master-detail-large-screen.md`（面板限宽的前序实现）
- `planning/feature/align-proxies-chrome-master-detail.md`（页面 chrome 对齐的前序实现）
- `packages/ui/pages/proxies.vue`、`packages/ui/components/ProxyMasterDetail.vue`
