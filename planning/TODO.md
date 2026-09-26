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
- [x] (P1) 展开后的全局流量浮窗（GlobalTrafficIndicator，fixed bottom-16px）与移动端底部导航
      （MobileBottomNav，fixed bottom-0，约 74px 高）重叠，遮挡导航右侧项与中央 FAB。实测
      390×844：浮窗 bottom=828、导航 top=770，垂直重叠 58px。移动端应让开导航高度或调整
      默认位置。→ 紧凑视口且启用底导时浮窗默认上移至导航上方（含 safe-area），新增 e2e；实测重叠 58px→0 (packages/ui) @529268d5
- [x] (P2) MobileBottomNav 未处理底部安全区，home indicator 机型上导航落入系统手势区。
      应加 `env(safe-area-inset-bottom)`（对照 pages/proxies.vue:1233 的回到顶部按钮已用
      `max(...env(...))`），并同步 Sidebar 为该导航预留的 spacer 高度。
      → 底导条 `mb=max(0.5rem,env(safe-area-inset-bottom))`，Sidebar spacer 同步 `calc(5rem+env)`；CDP 模拟 inset=34 实测生效、零 inset 无回归 (packages/ui) @17126243

# 视觉目标

- [x] (P1) 延迟分级仍使用 raw Tailwind 色（text-red-500/yellow-500/green-600），DESIGN.md
      §7 已将其列为债务，且违反 PRODUCT.md「不得仅用颜色编码延迟/健康状态」。应迁移到语义色
      error/warning/success，并补充形状/图标/数字等非颜色区分。→ 迁移 daisyUI 语义色（utils、ProxyPreviewBar/Dots），Latency pill 数值即非颜色区分；同步 DESIGN.md 与断言 (packages/ui) @dcd1a68b
- [x] (P1) config.vue 有 29 处重复的设置行骨架，提取 SettingRow 组件对其进行替换 → 新增 ConfigSettingRow（label/默认 slot）替换 29 处骨架，保留 v-if 与 lg:hidden；构建与浏览器渲染验证 (packages/ui) @9e9cabe8
- [x] (P2) config.vue 有 28 处手写内联 SVG，将它们迁移 @tabler/icons-vue → 28 处迁移为 21 个 tabler 图标，保留 size/opacity/shrink class；构建与渲染验证 (packages/ui) @fccbb11a
- [!] (P1) 圆角体系不统一，违反 TARGETS「整个项目的圆角要风格统一」。同类元素半径分裂：
  卡片在 rounded-2xl / rounded-xl / 1rem 间混用（rounded-xl 约 88 处多为卡片面板）；
  分段控件/工具条在 rounded-lg / rounded-xl / rounded-[0.625rem] 间；方形图标按钮在
  rounded-lg / rounded-[0.625rem] / rounded-md 间；输入框在 rounded-lg / rounded-md 间。
  应按 DESIGN §6 收敛（控件=field、卡片=box、pill=full）并清理无令牌值。→ blocked: 收敛涉及 100+ 处且 `rounded-xl` 有 28 种 class 形态（卡片/浮层/图标容器/按钮内高亮等），DESIGN §6 明确保留 `rounded-xl` 给「紧凑面板」，机械替换违背设计意图；视觉回归无法自动化验证，需人工界定规则。建议拆为可验收子任务：① 清理无令牌值 `rounded-[0.625rem]`（20 处）；② 统一图标按钮圆角；③ 卡片面板 `rounded-xl`→`rounded-2xl` 并逐屏视觉验收。未改动代码 (packages/ui)
- [x] (P2) 清理失效/硬编码颜色（不随主题切换）：assets/css/main.css:85 的 `hsl(var(--p))`
      与 components/ThemeSwitcher.vue:55 的 `oklch(var(--p)/0.4)` 引用了 daisyUI v5 未定义的
      `--p`（应已失效），components/TrafficDetailsTable.vue:234 的
      `rgba(var(--color-base-content),0.08)` 为非法色值，components/IconMenuSelect.vue:84
      硬编码纯黑阴影。应改用 `--color-*` 与 color-mix。
      → 滚动条改 `var(--color-primary)`；ThemeSwitcher/TrafficDetailsTable/IconMenuSelect 阴影改用 `color-mix(--color-*)`；构建产物旧失效写法清零 (packages/ui) @809ff885

# 代码健康

- [x] (P2) control 类 composable 中「异步动作 + loading 标志 + toast 成功/失败」模板与
      `instanceof Error ? e.message : String(e)` 描述重复 25 处（12 文件）。应提取
      useAsyncAction 与 errorDescription 收敛。→ 新增 useAsyncAction 收敛 busy+toast 模板，25 处错误描述改用既有 controlErrorMessage；新增单测 (packages/ui) @f35f419d
- [x] (P2) ProxyNodeCard 与 ProxyNodeListItem 各自实现同一套 tooltip 生命周期（open/close
      定时器、触摸判断、测速处理）大段重复。应提取 useProxyTooltip composable。
      → 新增 useProxyTooltip（open/close 延迟、触摸守卫、单例 popover、外部点击关闭、长按），两组件复用；新增 5 项单测 (packages/ui) @f73f7d94
- [x] (P1) 控制/配置面板的重复外壳（`rounded-xl border border-base-content/10 bg-base-200 p-4`）
      与重复头部（图标 + 标题 + 右侧操作）散落在 11 个组件与 3 处页面卡片中。应提取
      PanelCard（外壳 + 可选 visible）与 PanelHeader（props icon/title、slot #actions）。
      → 新增 PanelCard（外壳 + visible）与 PanelHeader（icon/title + #actions），替换 8 面板 + DesktopSettingsPanel/KernelLogView + profiles/overview 卡片共 14 处外壳与 6 处头部；构建与渲染验证 (packages/ui) @c54b5b5d
- [x] (P2) 方形图标按钮 class（`h-9 w-9` / `h-7 w-7` / `h-8 w-8` + `rounded-*` + hover）
      在 15+ 处逐字复制。应提取 IconButton（props icon/size/variant/label），并让
      IconMenuSelect、ProxiesDisplayModeSwitcher 复用（注意 $attrs 与 aria 状态透传）。
      → 新增 IconButton（icon/label/size/variant/active/loading + attrs 透传），替换 ConnectionsToolbar 5 处与 LatencyCard/IPInfoCard 各 1 处「逐字复制」的原生图标按钮；proxies/rules 的同类按钮是项目 `<Button>`（btn 基础）、ProxiesDisplayModeSwitcher 为分段控件、另有特殊底色变体，样式各异故未纳入 (packages/ui) @8e8b7cf5
- [!] (P2) 按 key 追踪「进行中」状态存在三套不一致实现：useBusyKeys（重入保护、异常上抛）、
  utils 的 useStringBooleanMap（无重入、静默吞异常）、stores/proxies.ts 的手写 map
  （各自异常处理，两处含失败历史副作用）。应统一为一个 keyed-busy 抽象，显式区分
  是否重入保护、是否吞异常。
  → 部分完成：已扩展 useBusyKeys 支持显式 guardReentry/swallow，rules.vue 迁移并删除 utils.useStringBooleanMap，新增 2 项单测 (packages/ui) @9e80d8ca。blocked: stores/proxies.ts 的 4 个手写 map 是 store 公开 API，被 pages/proxies.vue、components/ProxyMasterDetail.vue 与 stores/**tests**/proxies.spec.ts 多处引用，迁移会改动 store API 与既有测试断言，属独立较大变更，本轮未纳入；建议为它另开一条。
- [x] (P2) 空状态（约 9 处 `t('noData')`，内边距与透明度在 /40~/60、py-6/8/12 间漂移）
      与页面级 loading（约 5 处 `loading loading-lg loading-ring text-primary`）重复。
      应提取 EmptyState（icon/message/size）与 LoadingState（label/min-height）组件。
      → 新增 EmptyState（icon/message/size/italic，默认 t('noData')）与 LoadingState（label/min-height/ring），替换 9 处空状态 + 6 处页面 loading，并删除 ConnectionsTable 的 `.conn-empty` (packages/ui) @e355843d
