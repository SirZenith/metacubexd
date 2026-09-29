<!--
本文件是循环读写的需求入口。条目格式的默认约定见 /todo-next 命令与各 skill 自带说明；
若本目录下提供 planning/workflow/todo-format.md，则以其为准。

请在下方追加真实条目；不要修改本注释。
-->

- [x] 初始化项目 AGENTS.md
      status: done
      open-at: 2026.09.26 13:53:02
      closed-at: 2026.09.26 14:18:43
      hash: d49b1318
      tag: docs
      doc: -
      desc: 新增根 AGENTS.md，路由到 CONTEXT / copilot-instructions / CONTRIBUTING / planning。

---

- [x] 代理连接界面的小屏适配优化
      status: done
      open-at: 2026.09.26 14:18:58
      closed-at: 2026.09.26 14:24:39
      hash: ca5d828b
      tag: ux
      doc: -
      desc: 选择代理连接的界面在手机上，不论哪种代理列表样式都会用次要信息占据大量屏幕空间，需要调整 UI 优化；小屏收敛共用 Collapse 分组容器与 ProxyGroupTitle 的次要 badge/按钮 (packages/ui)。

---

- [x] master-detail 小屏 header 高度收敛
      status: done
      open-at: 2026.09.26 14:32:00
      closed-at: 2026.09.26 14:35:07
      hash: 19352d53
      tag: ux
      doc: -
      desc: master-detail 显示模式在手机小屏下，header（分组导航条 + 标题 + 快捷筛选三行）占用过多不可滚动高度，需要收敛；小屏默认折叠 quick-filter rail（带激活计数），收紧标题/导航条/内边距 (packages/ui)。

---

- [x] master-detail 列表项增加测速按钮
      status: done
      open-at: 2026.09.26 14:35:22
      closed-at: 2026.09.26 15:04:33
      hash: ac9a9c36
      tag: feature
      doc: -
      desc: master-detail 模式为列表中各个代理条添加单独的测速按钮；ProxyNodeListItem 新增可选测速按钮（show-latency-test）并由 ProxyMasterDetail 启用，e2e 覆盖 (packages/ui)。

---

- [x] master-detail 测速按钮移至分组 header
      status: done
      open-at: 2026.09.26 15:04:33
      closed-at: 2026.09.26 15:07:27
      hash: 64a69c50
      tag: feature
      doc: -
      desc: master-detail 模式去除单个代理条目的测速按钮，改为给整个代理组进行测速；移除逐条测速按钮，改由 ProxyMasterDetail 组 header 调用 proxyGroupLatencyTest，e2e 更新 (packages/ui)。

---

- [x] traffic 自定义时间范围窄屏溢出修复
      status: done
      open-at: 2026.09.26 15:14:20
      closed-at: 2026.09.26 15:38:43
      hash: bb1db749
      tag: ux
      doc: -
      desc: traffic 页小屏下选择「自定义时间范围」时 header 容器缺 flex-wrap，两个 datetime-local 输入并排撑破 overflow-hidden 容器，右侧输入与时间范围选择器被裁掉；窄屏纵向堆叠 custom range、header 换行，新增 e2e 覆盖 (packages/ui)。优先级：P1。

---

- [x] control Tunnels 行窄屏溢出修复
      status: done
      open-at: 2026.09.26 15:38:57
      closed-at: 2026.09.26 15:41:17
      hash: b0536171
      tag: ux
      doc: -
      desc: control 页 NetworkConfigPanel 的 Tunnels 行使用固定 grid-cols-[7rem_1fr_1fr_auto]，输入框无 min-w-0，窄屏横向溢出被裁掉；窄屏改单列堆叠（输入框由 ~72px 增至整行）；实测旧布局未硬性溢出，属可用性改善 (packages/ui)。优先级：P1。

---

- [x] logs 页工具栏与日志表格窄屏适配
      status: done
      open-at: 2026.09.26 15:41:30
      closed-at: 2026.09.26 15:44:10
      hash: 53393c7b
      tag: ux
      doc: -
      desc: logs 页工具栏不换行且搜索框缺 min-w-0；日志表格移动端无替代布局，长 payload 把表格撑到只能横向拖拽；窄屏 payload 换行（max-md）消除表格横向滚动并加 e2e；实测工具栏本就不溢出 (packages/ui)。优先级：P2。

---

- [x] overview endpoint 长 URL 截断
      status: done
      open-at: 2026.09.26 15:44:19
      closed-at: 2026.09.26 15:46:42
      hash: 99eebb1e
      tag: ux
      doc: -
      desc: overview 页 endpoint 信息条中的长 URL 无 min-w-0/truncate，被 overflow-x-hidden 裁掉，与 config.vue 对同一 URL 的处理不一致；长 URL 单行 truncate（带 title），消除 3 行换行致条高 106px；实测未横向溢出 (packages/ui)。优先级：P2。

---

- [x] rules 规则卡片窄屏计数可见
      status: done
      open-at: 2026.09.26 15:46:51
      closed-at: 2026.09.26 15:49:09
      hash: 01c9c976
      tag: ux
      doc: -
      desc: rules 页规则卡片在窄屏把命中/未命中计数挤出 overflow-hidden 容器；proxy chip 改为可收缩（min-w-0 shrink），长 proxy 名时命中/未命中计数保持可见 (packages/ui)。优先级：P2。

---

- [x] 全局流量浮窗与底部导航重叠修复
      status: done
      open-at: 2026.09.26 16:20:59
      closed-at: 2026.09.26 16:25:51
      hash: 529268d5
      tag: ux
      doc: -
      desc: 展开后的全局流量浮窗（GlobalTrafficIndicator，fixed bottom-16px）与移动端底部导航（MobileBottomNav，约 74px 高）重叠，遮挡导航右侧项与中央 FAB；紧凑视口且启用底导时浮窗默认上移至导航上方（含 safe-area），新增 e2e；实测重叠 58px→0 (packages/ui)。优先级：P1。

---

- [x] MobileBottomNav 底部安全区适配
      status: done
      open-at: 2026.09.26 16:26:10
      closed-at: 2026.09.26 16:30:09
      hash: 17126243
      tag: ux
      doc: -
      desc: MobileBottomNav 未处理底部安全区，home indicator 机型上导航落入系统手势区；底导条 mb=max(0.5rem,env(safe-area-inset-bottom))，Sidebar spacer 同步 calc(5rem+env)；CDP 模拟 inset=34 实测生效、零 inset 无回归 (packages/ui)。优先级：P2。

---

- [x] 延迟分级改用语义色
      status: done
      open-at: 2026.09.26 15:49:19
      closed-at: 2026.09.26 15:51:31
      hash: dcd1a68b
      tag: visual
      doc: -
      desc: 延迟分级仍使用 raw Tailwind 色（text-red-500/yellow-500/green-600），DESIGN.md §7 已列为债务且违反 PRODUCT.md「不得仅用颜色编码延迟/健康状态」；迁移 daisyUI 语义色（utils、ProxyPreviewBar/Dots），Latency pill 数值即非颜色区分；同步 DESIGN.md 与断言 (packages/ui)。优先级：P1。

---

- [x] config.vue 提取 SettingRow 组件
      status: done
      open-at: 2026.09.26 16:02:08
      closed-at: 2026.09.26 16:06:10
      hash: 9e9cabe8
      tag: refactor
      doc: -
      desc: config.vue 有 29 处重复的设置行骨架，提取 SettingRow 组件替换；新增 ConfigSettingRow（label/默认 slot）替换 29 处骨架，保留 v-if 与 lg:hidden；构建与浏览器渲染验证 (packages/ui)。优先级：P1。

---

- [x] config.vue 内联 SVG 迁移 tabler 图标
      status: done
      open-at: 2026.09.26 16:06:21
      closed-at: 2026.09.26 16:09:07
      hash: fccbb11a
      tag: refactor
      doc: -
      desc: config.vue 有 28 处手写内联 SVG，迁移到 @tabler/icons-vue；28 处迁移为 21 个 tabler 图标，保留 size/opacity/shrink class；构建与渲染验证 (packages/ui)。优先级：P2。

---

- [x] 统一项目圆角体系
      status: done
      open-at: 2026.09.26 16:10:00
      closed-at: 2026.09.28 00:03:13
      hash: 1322a922
      tag: visual
      doc: planning/feature/unify-rounded-token.md
      desc: 清理无令牌值 rounded-[0.625rem]（20 处）优先级：P1。

---

- [x] 统一项目圆角体系
      status: done
      open-at: 2026.09.26 16:10:00
      closed-at: 2026.09.28 00:09:38
      hash: 4208277b
      tag: visual
      doc: planning/feature/unify-icon-button-radius.md
      desc: 统一图标按钮圆角 优先级：P1。

---

- [x] 统一项目圆角体系
      status: done
      open-at: 2026.09.26 16:10:00
      closed-at: 2026.09.28 00:23:45
      hash: 8c96b146
      tag: visual
      doc: planning/feature/unify-card-panel-radius.md
      desc: 卡片面板 rounded-xl→rounded-2xl 并逐屏视觉验收。优先级：P1。

---

- [x] 统一项目圆角体系
      status: done
      open-at: 2026.09.26 16:10:00
      closed-at: 2026.09.28 00:32:47
      hash: c4cbdeac
      tag: visual
      doc: planning/feature/rounded-token-audit.md
      desc: 检查项目的圆角体系是否已经统一

---

- [x] 清理失效/硬编码颜色
      status: done
      open-at: 2026.09.26 16:31:54
      closed-at: 2026.09.26 16:34:51
      hash: 809ff885
      tag: visual
      doc: -
      desc: 清理失效/硬编码颜色（不随主题切换）：assets/css/main.css 的 hsl(var(--p))、ThemeSwitcher.vue 的 oklch(var(--p)/0.4) 引用 daisyUI v5 未定义的 --p，TrafficDetailsTable.vue 的 rgba(var(--color-base-content),0.08) 为非法色值，IconMenuSelect.vue 硬编码纯黑阴影；滚动条改 var(--color-primary)，各阴影改用 color-mix(--color-*)，构建产物旧失效写法清零 (packages/ui)。优先级：P2。

---

- [x] 提取 useAsyncAction 收敛异步模板
      status: done
      open-at: 2026.09.26 15:55:12
      closed-at: 2026.09.26 16:01:33
      hash: f35f419d
      tag: refactor
      doc: -
      desc: control 类 composable 中「异步动作 + loading 标志 + toast 成功/失败」模板与 instanceof Error 描述重复 25 处（12 文件）；新增 useAsyncAction 收敛 busy+toast 模板，25 处错误描述改用既有 controlErrorMessage；新增单测 (packages/ui)。优先级：P2。

---

- [x] 提取 useProxyTooltip 复用
      status: done
      open-at: 2026.09.26 16:09:20
      closed-at: 2026.09.26 16:12:25
      hash: f73f7d94
      tag: refactor
      doc: -
      desc: ProxyNodeCard 与 ProxyNodeListItem 各自实现同一套 tooltip 生命周期（定时器、触摸判断、测速处理）大段重复；新增 useProxyTooltip（open/close 延迟、触摸守卫、单例 popover、外部点击关闭、长按），两组件复用；新增 5 项单测 (packages/ui)。优先级：P2。

---

- [x] 提取 PanelCard / PanelHeader
      status: done
      open-at: 2026.09.26 16:35:05
      closed-at: 2026.09.26 16:39:52
      hash: c54b5b5d
      tag: refactor
      doc: -
      desc: 控制/配置面板的重复外壳与重复头部散落在 11 个组件与 3 处页面卡片中；新增 PanelCard（外壳 + visible）与 PanelHeader（icon/title + #actions），替换 8 面板 + DesktopSettingsPanel/KernelLogView + profiles/overview 卡片共 14 处外壳与 6 处头部；构建与渲染验证 (packages/ui)。优先级：P1。

---

- [x] 提取 IconButton
      status: done
      open-at: 2026.09.26 16:40:05
      closed-at: 2026.09.26 16:44:49
      hash: 8e8b7cf5
      tag: refactor
      doc: -
      desc: 方形图标按钮 class 在 15+ 处逐字复制；新增 IconButton（icon/label/size/variant/active/loading + attrs 透传），替换 ConnectionsToolbar 5 处与 LatencyCard/IPInfoCard 各 1 处「逐字复制」的原生图标按钮；proxies/rules 的同类按钮是项目 <Button>、ProxiesDisplayModeSwitcher 为分段控件、另有特殊底色变体，样式各异故未纳入 (packages/ui)。优先级：P2。

---

- [x] 统一 keyed-busy 抽象
      status: done
      open-at: 2026.09.26 16:45:04
      closed-at: 2026.09.28 00:41:18
      hash: 5f7a10c3
      tag: refactor
      doc: planning/feature/unify-keyed-busy-map.md
      desc: 优化 stores/proxies.ts 的 4 个手写 map 以方便 keyed-busy 抽象的摘取。优先级：P2。

---

- [x] 统一 keyed-busy 抽象
      status: done
      open-at: 2026.09.26 16:45:04
      closed-at: 2026.09.28 00:43:43
      hash: 5f7a10c3
      tag: refactor
      doc: planning/feature/unify-keyed-busy-map.md
      desc: 按 key 追踪「进行中」状态存在三套不一致实现（useBusyKeys、utils 的 useStringBooleanMap、stores/proxies.ts 的手写 map）；已扩展 useBusyKeys 支持显式 guardReentry/swallow，rules.vue 迁移并删除 utils.useStringBooleanMap，新增 2 项单测 (packages/ui)。blocked: stores/proxies.ts 的 4 个手写 map 是 store 公开 API，被多处引用，迁移会改动 store API 与既有测试断言，属独立较大变更，建议另开一条。优先级：P2。

---

- [x] 提取 EmptyState / LoadingState
      status: done
      open-at: 2026.09.26 16:48:57
      closed-at: 2026.09.26 16:52:28
      hash: e355843d
      tag: refactor
      doc: -
      desc: 空状态（约 9 处 t('noData')，内边距与透明度漂移）与页面级 loading（约 5 处）重复；新增 EmptyState（icon/message/size/italic）与 LoadingState（label/min-height/ring），替换 9 处空状态 + 6 处页面 loading，并删除 ConnectionsTable 的 .conn-empty (packages/ui)。优先级：P2。

---

- [x] 去除代理自动定位
      status: done
      open-at: 2026.09.27 03:52:03
      closed-at: 2026.09.27 04:13:21
      hash: 0ef5cefe
      tag: ux
      doc: planning/feature/remove-proxy-auto-scroll.md
      desc: 当前，在使用主从模式显示代理列表时，用户每次打开列表都会自动把列表滚动到当前使用中的代理条目所在的位置。去掉这一功能，让每次列表打开时，列表都是其自然打开时的滚动位置。

---

- [x] 工具链修复
      status: done
      open-at: 2026.09.27 04:15:29
      closed-at: 2026.09.27 04:21:11
      hash: 2d824930
      tag: chore
      doc: planning/feature/fix-typescript-7-toolchain.md
      desc: vue-tsc@3.3.10 与 typescript@7.0.2 不兼容，导致 typecheck 与 pre-commit 的 ESLint 均失败；typescript-eslint 亦不支持 TS 7.0。这使 CI 与提交钩子不可用。修复：catalog 中 typescript 别名到 @typescript/typescript6（TS 6 API + tsc6），新增 @typescript/native 保留 TS 7 tsc；并补上 typecheck 暴露的 2 处显式导入缺失（profiles.vue 的 formatTimeFromNow、proxies.vue 的 PROXIES_PREVIEW_TYPE）。

---

- [x] CI
      status: done
      open-at: 2026.09.27 04:57:13
      closed-at: 2026.09.28 00:46:30
      hash: cdac5129
      tag: chore
      doc: planning/feature/ci-typecheck-step.md
      desc: 在 .github/workflows/ 中新增 typecheck 步骤

---

- [x] 概览页数据文本出界
      status: done
      open-at: 2026.09.27 22:10:16
      closed-at: 2026.09.28 00:53:40
      hash: c2419c23
      tag: bugfix
      doc: planning/feature/fix-overview-stat-card-overflow.md
      desc: overview 界面的 overview-stat-card 里，各个文本会在文本内容过长时超出卡片提供的可视范围，导致文本被裁切。要砂在保持文本易读性的前提下，让文本不要在长内容时有文本超界。

---

- [x] 调整小屏模式下的代理工具栏
      status: done
      open-at: 2026.09.27 22:28:53
      closed-at: 2026.09.27 23:41:59
      hash: 6c6d8a1b
      tag: ux
      doc: planning/feature/collapse-proxies-toolbar-mobile.md
      desc: 小屏下，代理界面顶部的工具栏（Action Buttons 区域、Node Name Filter 区域、Connectivity Board Button、Settings Button）改为初始隐藏，改为使用一个工具箱图标的按钮切换其显示状态。工具箱按钮显示位置在与 Tabs 同一行的最右侧。界面打开时，工具栏隐藏，点击工具箱按钮后，工具箱按钮切换为 active 样式，并将工具栏显示出来；在工具按钮区域显示时，按下工具箱按钮，能让工具栏隐藏，工具箱按钮回到非 active 样式。

---

- [x] 优化代理主从列表显示
      status: done
      open-at: 2026.09.27 23:47:47
      closed-at: 2026.09.27 23:56:07
      hash: 2bb87ae5
      tag: visual
      doc: planning/feature/optimize-master-detail-large-screen.md
      desc: 当前主从列表在大屏上代理条目列表区域会扩展到占据屏幕靠右侧的大量区域，这让单个条目的信息被拉长放置在了屏幕左侧和右侧，视觉效果很不好。调研一下别的软件中是如何实现该功能还保持该功能在大屏上好看的，将调研得到的最优结果应用到主从模式的大屏显示样式上。

---

- [x] 让其它 UI 元素响应代理主从列表的调整
      status: done
      open-at: 2026.09.28 00:06:12
      closed-at: 2026.09.28 00:59:24
      hash: 45aed7ce
      tag: visual
      doc: planning/feature/align-proxies-chrome-master-detail.md
      desc: 代理界面的主从列表显示模式已经给代理条目列表添加了最大宽度的限制。但是 Node Name Filter、Connectivity Board Button、返回列表顶部按钮都没有响应列表的这种变化，根据你调研的结果进行你认为合适的配套调整

---

- [x] 代理评价列表显示位置优化
      status: done
      open-at: 2026.09.28 01:03:30
      closed-at: 2026.09.28 01:18:30
      hash: a8a01f7e
      tag: visual
      doc: planning/feature/center-master-detail-wide-layout.md
      desc: 当前评价列表在大屏上整体完全显示在左侧，这让画面非常的不平衡。调查应该如何使列表与界面中的其它 UI 元素在整个界面上能够让显示内容更平衡，并将调查到的方案应用于代理界面的主从显示模式。

---

- [x] 代理列表评价模式添加入场动画
      status: done
      open-at: 2026.09.28 01:08:53
      closed-at: 2026.09.28 02:27:30
      hash: 23658809
      tag: feature
      doc: planning/feature/animate-proxies-mode-switch.md
      desc: 代理列表从其它显示方案切换到主从列表模式的过程过于生硬，请为这个变化过程添加合理的动画，让过渡显得自然。实现采用交叉淡入（Transition mode=default + translateY/opacity），并用页面级 isTwoColumns 取代模板 ref 作为 slot 分支依据；连续快速切换不再出现列表空白。

---

- [x] 补齐 ru 语言缺失的 i18n key
      status: done
      open-at: 2026.09.28 01:30:00
      closed-at: 2026.09.28 14:04:57
      hash: 4603f593
      tag: bugfix
      doc: planning/feature/backfill-ru-i18n-keys.md
      desc: packages/ui/i18n/locales/ru.json 比 en.json 少 18 个 key（shortcuts、connectionError、connectionErrorDesc、retry、recommendation、kernelRollback、kernelRecover、kernelRollbackConfirm、kernelRecoverConfirm、kernelRollbackApplied、kernelRecoverApplied、kernelRollbackFailed、kernelRecoverFailed、profilesRefreshAndApply、profilesAutoUpdate、profilesAutoUpdateOff、profilesAutoUpdateMinutes、profilesAutoUpdateHours），运行时只能回退到英文，违反 copilot-instructions.md「Add the same key to every locale」与 PRODUCT.md 的七语言要求。`packages/ui/__tests__/locales.spec.ts` 目前有意把 ru 排除在严格 parity 之外（注释说明为已知技术债），本次补齐后应把 ru 纳入 PARITY_LOCALES，使守卫覆盖全部七种语言。

---

- [x] 修正主从面板 header 的圆角不一致
      status: done
      open-at: 2026.09.28 01:30:00
      closed-at: 2026.09.28 14:08:30
      hash: 625a230c
      tag: visual
      doc: planning/feature/fix-master-detail-header-radius.md
      desc: packages/ui/components/ProxyMasterDetail.vue 第 234 行的 header 使用 rounded-t-xl（0.75rem），而其父容器（第 230 行）是 rounded-2xl（1rem），DESIGN.md §6 规定卡片/面板用 rounded-2xl、rounded-xl 仅用于刻意紧凑的面板，二者不匹配。应改为 rounded-t-2xl；同时 `packages/ui/__tests__/card-panel-radius.spec.ts` 仅用字符串匹配 rounded-xl，无法捕获 rounded-t-xl 这类方向变体，需强化断言（如正则匹配 rounded(-[trbl])?-xl）以免同类漂移再次漏检。

---

- [x] 为显示模式切换器补可访问性语义
      status: done
      open-at: 2026.09.28 01:30:00
      closed-at: 2026.09.28 14:12:23
      hash: ed489a96
      tag: ux
      doc: planning/feature/a11y-display-mode-switcher.md
      desc: packages/ui/components/ProxiesDisplayModeSwitcher.vue 的四个图标按钮只有 :title，没有 aria-label，也没有表达当前选中态的 aria-pressed（或 role=radiogroup + aria-checked），违反 PRODUCT.md「every icon-only control an accessible name」与 DESIGN.md §7。对比 ProxiesSortSelect/ProxiesCardSizeSelect 经 IconMenuSelect 已有 aria-label。需补 aria-label 与选中态语义，并加单测或 e2e 断言。

---

- [x] 提取代理页重复的图标按钮样式
      status: done
      open-at: 2026.09.28 01:30:00
      closed-at: 2026.09.28 14:20:47
      hash: 943b54df
      tag: refactor
      doc: planning/feature/extract-proxies-icon-button-styles.md
      desc: packages/ui/pages/proxies.vue 中方形图标按钮的长 class 串重复 4 处（第 398、456、699、723 行，flex items-center justify-center w-8 h-8 rounded-lg sm:w-9 sm:h-9 bg-base-content/6 ...），另有 6 处 h-9 w-9 ... bg-base-200/80 的工具栏按钮 class 重复。项目已有 IconButton.vue 组件但此处未复用。应评估复用 IconButton 或提取共享 class 常量，消除逐字复制。

---

- [x] 提取代理节点增量渲染逻辑
      status: done
      open-at: 2026.09.28 01:30:00
      closed-at: 2026.09.28 14:26:09
      hash: b064bb71
      tag: refactor
      doc: planning/feature/extract-incremental-render.md
      desc: packages/ui/pages/proxies.vue 内联的 ProxyNodes（第 561 行）与 ProviderProxyNodes（第 772 行）两个 defineComponent 各自实现了同一套「renderCount + loadMoreSentinel + useIntersectionObserver 增量渲染」逻辑，仅 root 元素与节点 props 不同。应提取为共享 composable（如 useIncrementalRender）或共享组件，减少重复并便于后续维护；同时该文件已达 1542 行，可一并评估拆分。

---

- [x] 统一 formatBytes 实现
      status: done
      open-at: 2026.09.28 14:28:52
      closed-at: 2026.09.28 14:35:57
      hash: b8a6137f
      tag: refactor
      doc: planning/feature/unify-format-bytes.md
      desc: packages/ui/pages 下 proxies.vue（第 177 行）、connections.vue（第 68 行）、overview.vue（第 26 行）各自重定义了 `const formatBytes = (bytes) => byteSize(bytes).toString()`，而 packages/ui/utils/index.ts（第 117 行）已导出同名函数，三处还各自 `import byteSize from 'byte-size'`。应删除局部实现与 byte-size 直连 import，统一使用 `~/utils` 的 formatBytes，消除重复。

---

- [x] 拆分 config.vue 超大页面
      status: done
      open-at: 2026.09.28 14:28:52
      closed-at: 2026.09.28 14:42:35
      hash: 604991cf
      tag: refactor
      doc: planning/feature/split-config-vue-sections.md
      desc: packages/ui/pages/config.vue 已达 1570 行，单文件内包含 Core Config、XD Config、Appearance、Recommendation、Actions、DNS、Network 等相互独立的设置区块，修改与复用成本高。应参照已提取的 PanelCard / PanelHeader / ConfigSettingRow，把各区块拆成独立子组件（如 ConfigAppearanceSection、ConfigRecommendationSection 等），保持现有布局与行为不变。

---

- [x] CI 增加非修正式 lint / 格式检查
      status: done
      open-at: 2026.09.28 14:28:52
      closed-at: 2026.09.28 14:50:02
      hash: e91941b9
      tag: chore
      doc: planning/feature/ci-lint-check-step.md
      desc: .github/workflows/unit-tests.yml 已有 Typecheck 与单元测试步骤，但没有非修正式的 ESLint / Prettier 检查；本地 `pnpm lint` 是 `eslint --fix`，会修改文件，不能直接用于 CI。应新增只检查不修改的脚本（如 `lint:check`）并在 unit-test job 中运行，防止格式与规则漂移。
