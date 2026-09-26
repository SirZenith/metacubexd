# 去除代理自动定位

## 目标

主从模式（master-detail）显示代理列表时，用户每次打开列表都不再被自动滚动到
「当前使用中的代理条目」所在位置；列表以自然打开时的滚动位置（顶部）呈现。

引用 TARGETS.md 相关准则：

- 「在单个界面上不要呈现过多的内容，要让用户能够一眼就看出界面上最重要的信息是
  什么」——自动定位把视口强行移到列表中部，用户失去对列表起点的空间感知，反而
  干扰了「一眼看清」。
- 「触屏设备与电脑的键鼠操作习惯不同，做适配时要考虑好不同设备上功能的使用方式
  是否合适」——移动端列表打开即跳转，与用户「从头浏览」的预期不符。
- 「单个界面内，不同的功能、信息应该要有明确的亲疏关系」——「跳转到当前节点」
  是一个显式动作，应由用户主动触发，而不是每次打开都隐式执行。

## 现状

相关代码：

- `packages/ui/components/ProxyMasterDetail.vue`
  - `scrollSelectedIntoView(behavior)`（第 168–172 行）：通过
    `nodeListEl.value?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: 'center', behavior })`
    把选中行滚到视口中央。
  - `watch(activeName, ...)`（第 181–185 行）：切换分组时 `clearFilters()`、
    重置 `filterRailOpen`，并在 `nextTick` 后调用
    `scrollSelectedIntoView('auto')`。
  - `onMounted(() => nextTick(() => scrollSelectedIntoView('auto')))`（第 190 行）：
    首次挂载（master 模式刚打开）时把选中行滚到视口中央。
  - 该函数同时被「跳转到当前节点」按钮复用（第 279–288 行，
    `t('jumpToCurrent')`，`IconTarget`），此按钮是用户显式动作，必须保留。
- `packages/ui/pages/proxies.vue`
  - `proxyMasterDetail` ref 仅暴露 `scrollToTop`（第 71–73、111 行），与本次无关。
  - `scrollToSelectedProxy()`（第 114–133 行）服务于卡片/列表模式的
    `jump-to-current` 按钮，与 master-detail 无关。

现状行为：master 模式首次打开、以及每次切换左侧分组时，右侧节点列表都会自动
滚动，使选中行居中。当分组节点较多时，用户看到的是列表中部而非顶部。

## 方案

只移除「隐式自动定位」，保留「显式跳转」：

1. 删除 `onMounted` 中的 `scrollSelectedIntoView('auto')` 调用。
2. 在 `watch(activeName, ...)` 中删除 `nextTick(() => scrollSelectedIntoView('auto'))`，
   仅保留 `clearFilters()` 与 `filterRailOpen.value = false`。
3. 保留 `scrollSelectedIntoView` 函数本身及其在「跳转到当前节点」按钮上的绑定，
   用户仍可一键定位到当前节点。
4. 保留 `scrollToTop`（`defineExpose`）与 `nodeListEl`，供页面级「回到顶部」使用。

取舍：

- 备选方案 A：保留自动定位但改为 `block: 'nearest'`（仅在选中行不可见时才滚动）。
  仍属隐式滚动，且当选中行在视口外时依旧会跳转，未满足「自然打开位置」的要求。
- 备选方案 B：把自动定位做成用户偏好开关。TARGETS.md 允许持久化偏好，但本需求
  明确要求「去掉这一功能」，引入开关属于扩大范围；且新增偏好需要额外的设置项与
  持久化，收益不明确。
- 选择直接移除隐式调用：改动最小、语义最清晰，显式跳转入口仍在，不损失能力。

## 验收标准

- 进入 master 模式后，`master-detail-scroll-container` 的 `scrollTop` 为 0，
  选中行不因自动定位而居中。
- 切换左侧分组后，右侧列表 `scrollTop` 为 0（自然打开位置）。
- 「跳转到当前节点」按钮仍能把选中行滚入视口（既有能力不回归）。
- 新增 e2e 回归测试覆盖「打开 master 模式不自动定位」。
- `pnpm --filter @metacubexd/ui typecheck` 通过；`pnpm --filter @metacubexd/ui test:unit`
  通过；e2e 在可运行环境下通过。

## 关联文档

- `planning/TARGETS.md`（用户体验准则）
- `CONTEXT.md`（Selected Node 术语）
