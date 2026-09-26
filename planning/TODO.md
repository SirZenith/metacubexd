<!--
TODO 循环用法（详细流程见 planning/WORKFLOW.md）：

- 每个功能组块用一个一级标题，其下用 `- [ ]` 列出开发目标
- 循环逐条处理；完成后条目自动变为 `- [x]`，同行追加摘要：→ <文件/要点> @<短hash>
- 实现受阻时条目变为 `- [!]`，同行追加：→ blocked: <原因>
- 需求准则见 planning/TARGETS.md；术语标准见项目根 CONTEXT.md
- 循环读写的文件：本文件（planning/TODO.md）
-->

<!-- 示例：在此功能组块下按需添加条目
- [ ] (P1) 为设置页新增主题切换项
- [ ] (P2) 收敛大屏下侧栏的间距
-->

# 项目管理

- [x] 初始化项目 AGENTS.md → 根 AGENTS.md 路由到 CONTEXT/copilot-instructions/CONTRIBUTING/planning @d49b1318

# 功能目标

- [x] 选择代理连接的界面在手机上不论哪种代理列表样式都会使用次要信息占据大量屏幕
      空间。需要调整UI 进行优化。→ 小屏收敛共用 Collapse 分组容器与 ProxyGroupTitle 的次要 badge/按钮 (packages/ui) @ca5d828b

# 代理列表

- [x] master-detail 显示模式在手机小屏下 header（分组导航条 + 标题 + 快捷筛选三行）
      占用过多不可滚动高度，需要收敛。→ 小屏默认折叠 quick-filter rail（带激活计数），收紧标题/导航条/内边距 (packages/ui) @19352d53
- [x] master-detail 模式为列表中各个代理条添加单独的测速按钮。→ ProxyNodeListItem 新增可选测速按钮（show-latency-test）并由 ProxyMasterDetail 启用，e2e 覆盖 (packages/ui) @ac9a9c36
- [x] master-detail 模式去除单个代理条目的测试按钮改为给整个代理组进行测速的按钮。→ 移除逐条测速按钮，改由 ProxyMasterDetail 组 header 调用 proxyGroupLatencyTest，e2e 更新 (packages/ui) @64a69c50

# 用户体验

- [x] (P1) traffic 页在小屏下选择「自定义时间范围」时，header 容器缺少 flex-wrap，两个
      datetime-local 输入并排撑破 overflow-hidden 的页面容器，右侧输入与时间范围选择器
      被裁掉、无法完成自定义区间操作。窄屏应纵向堆叠该时间范围区。→ 窄屏纵向堆叠 custom range、header 换行，新增 e2e 覆盖 (packages/ui) @bb1db749
- [x] (P1) control 页 NetworkConfigPanel 的 Tunnels 行使用固定 `grid-cols-[7rem_1fr_1fr_auto]`，
      输入框无 min-w-0，窄屏横向溢出被 overflow-x-hidden 裁掉，删除按钮不可达。应改为
      响应式列并允许收缩。→ 窄屏改单列堆叠（输入框由 ~72px 增至整行）；实测旧布局未硬性溢出，属可用性改善 (packages/ui) @b0536171
- [x] (P2) logs 页工具栏不换行且搜索框缺 min-w-0；日志表格移动端无替代布局，长 payload
      把表格撑到只能横向拖拽。应对齐 ConnectionsTable 的移动端处理并截断 payload。
      → 窄屏 payload 换行（max-md）消除表格横向滚动并加 e2e；实测工具栏本就不溢出 (packages/ui) @53393c7b
- [x] (P2) overview 页 endpoint 信息条中的长 URL 无 min-w-0/truncate，被 overflow-x-hidden
      裁掉；与 config.vue 对同一 URL 的处理不一致，应统一。→ 长 URL 单行 truncate（带 title），消除 3 行换行致条高 106px；实测未横向溢出 (packages/ui) @99eebb1e
- [x] (P2) rules 页规则卡片在窄屏把命中/未命中计数挤出 overflow-hidden 容器；应收敛 proxy
      宽度或允许换行，保证计数可见。→ proxy chip 改为可收缩（min-w-0 shrink），长 proxy 名时命中/未命中计数保持可见 (packages/ui) @01c9c976

# 视觉目标

- [x] (P1) 延迟分级仍使用 raw Tailwind 色（text-red-500/yellow-500/green-600），DESIGN.md
      §7 已将其列为债务，且违反 PRODUCT.md「不得仅用颜色编码延迟/健康状态」。应迁移到语义色
      error/warning/success，并补充形状/图标/数字等非颜色区分。→ 迁移 daisyUI 语义色（utils、ProxyPreviewBar/Dots），Latency pill 数值即非颜色区分；同步 DESIGN.md 与断言 (packages/ui) @dcd1a68b
- [ ] (P1) config.vue 有 29 处重复的设置行骨架，提取 SettingRow 组件对其进行替换
- [ ] (P2) config.vue 有 28 处手写内联 SVG，将它们迁移 @tabler/icons-vue

# 代码健康

- [x] (P2) control 类 composable 中「异步动作 + loading 标志 + toast 成功/失败」模板与
      `instanceof Error ? e.message : String(e)` 描述重复 25 处（12 文件）。应提取
      useAsyncAction 与 errorDescription 收敛。→ 新增 useAsyncAction 收敛 busy+toast 模板，25 处错误描述改用既有 controlErrorMessage；新增单测 (packages/ui) @f35f419d
- [ ] (P2) ProxyNodeCard 与 ProxyNodeListItem 各自实现同一套 tooltip 生命周期（open/close
      定时器、触摸判断、测速处理）大段重复。应提取 useProxyTooltip composable。
      → components/ProxyNodeListItem.vue:41-112、components/ProxyNodeCard.vue:93-232
