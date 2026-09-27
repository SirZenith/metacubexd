# 让页面 chrome 响应主从列表的限宽

## 目标

`proxies` 页在主从（master-detail）模式下，页面顶部工具栏（Node Name Filter、
Connectivity Board Button、Settings）与「返回列表顶部」浮动按钮，与已限宽的详情面板
**右缘对齐**，不再飘在页面右侧的留白区上方。

引用 TARGETS.md 相关准则：

- 「单个界面内，不同的功能、信息应该要有明确的亲疏关系……相近、相似、相关的功能应该
  在空间上接近彼此」——过滤/连通性/设置与返回顶部都是围绕列表的操作，应与列表处于
  同一内容列。
- 「不允许元素因为屏幕大小不够就超出界面」的反面：元素也不该在宽屏下脱离内容无限
  靠右（Material 桌面指南：给内容设 max width，避免元素被拉伸/漂移）。

调研结论见 `planning/knowledge/list-detail-large-screen-layout.md`：详情面板限宽、
保持左对齐，让右侧留白自然增长。

## 现状

- `packages/ui/components/ProxyMasterDetail.vue`：详情面板（第 230 行附近）已
  `sm:max-w-4xl 2xl:max-w-5xl`，左对齐；其左侧是 `sm:w-48`（12rem）分组导航，根容器
  `flex ... sm:flex-row` 的 `gap-3` 为 0.75rem。
- `packages/ui/pages/proxies.vue`：
  - 页面根容器（第 826 行附近）`relative flex h-full min-h-0 min-w-0 flex-col gap-3`
    未限宽。
  - header（第 833 行附近）全宽；Node Name Filter（第 983 行，`ml-auto ... sm:max-w-64`）、
    Connectivity（第 1007 行）、Settings（第 1022 行）都靠页面右缘。
  - 「返回列表顶部」按钮（`absolute right-[…] bottom-[…]`）定位在页面根容器右下角，
    因此在宽屏落于页面右缘，远离靠左的详情面板。

结果：主从模式下详情面板止于 ~896/1024px + 左导航，而 header 右侧控件与浮动按钮
贴在 1920px 视口的右缘，彼此脱节。

## 方案

在「主从模式 + `proxies` tab」时，把页面根容器限宽为**左导航 + 限宽面板**的总宽，
并保持左对齐：

- 常规断点：`sm:max-w-[68.75rem]` = 12rem(nav) + 0.75rem(gap) + 56rem(`max-w-4xl`)
- 超宽断点：`2xl:max-w-[76.75rem]` = 12rem + 0.75rem + 64rem(`max-w-5xl`)

这样：

- header 与滚动区共用同一限宽容器 → header 右缘 = 面板右缘，`ml-auto` 的 Node Name
  Filter、Connectivity、Settings 自动与面板右缘对齐。
- 浮动「返回顶部」按钮的 `absolute right` 相对该容器 → 落在面板右缘附近。
- 小屏（`< sm`）不加约束，行为不变；非主从模式、`proxyProviders` tab 也不加约束。

新增 computed：

```ts
const masterPanelConstrained = computed(
  () => isMasterMode.value && activeTab.value === 'proxies',
)
```

并给 header 加 `data-testid="proxies-header"` 以便 e2e 断言对齐。

取舍：

- 备选方案 A：逐个把 Node Name Filter / Connectivity / Settings / FAB 定位到面板右缘。
  需要每个元素都感知面板实际宽度（随断点变化），重复且脆弱。
- 备选方案 B：把内容整体居中。会移动左导航位置，与既有左对齐结论相悖（见 knowledge）。
- 选择统一约束页面根容器：一处改动同时覆盖 header 与 FAB，宽度常量集中在两处并注释
  其来源；非主从路径零影响。
- 注意：限宽常量与 `ProxyMasterDetail` 的 `sm:w-48`、`gap-3`、`sm:max-w-4xl 2xl:max-w-5xl`
  绑定，若后者调整需同步（在两处加注释互相指向）。

## 验收标准

- 在 1920px 视口进入 `proxies` 主从模式：header 右缘与 `master-detail-detail`
  右缘之差 ≤ 2px（e2e 断言）。
- 页面根容器宽度约为 76.75rem（2xl 断点下），明显小于视口；`< sm` 与非 master 模式
  下根容器仍为全宽（不回归）。
- 既有 master-detail e2e（进入/滚动/分组测速/不自动定位）全部通过。
- `pnpm --filter @metacubexd/ui typecheck` 通过；`test:unit` 通过；e2e 通过。

## 关联文档

- `planning/knowledge/list-detail-large-screen-layout.md`（大屏列表-详情宽度约束调研）
- `planning/feature/optimize-master-detail-large-screen.md`（面板限宽的前序实现）
- `packages/ui/pages/proxies.vue`、`packages/ui/components/ProxyMasterDetail.vue`
