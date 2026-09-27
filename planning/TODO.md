<!--
TODO 条目使用字段结构（字段缩进两空格），条目之间用 `---` 分隔（`---` 前后各留一个空行）：

```markdown
- [ ] <标题：简短说明>
  status: pending|doing|done|blocked
  open-at: Y.M.D HH:MM:SS
  closed-at: Y.M.D HH:MM:SS | -
  hash: <短hash> | -
  tag: feature|bugfix|refactor|ux|visual|docs|chore
  doc: <相对项目根的文档路径> | -
  desc: <较详细的任务描述>
```

- 循环只处理**未被注释的** `status: pending` 条目；完成后写入 `closed-at` 与 `hash` 并置 `done`
- 标题行复选框与 `status` 一致：`done` 用 `- [x]`，其余（含 `blocked`）用 `- [ ]`
- 受阻时置 `blocked`，并在 `desc` 末尾写明原因
- `doc` 为 `-` 表示尚无实现文档，处理时先生成 `planning/feature/<slug>.md` 并回写该字段
- 需求准则与 tag 分类见 planning/TARGETS.md；术语标准见项目根 CONTEXT.md
- 循环读写的文件：本文件（planning/TODO.md）

注：以下历史条目由旧格式迁移，`open-at` 为对应提交的父提交时间，属估算值。
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

- [ ] 统一项目圆角体系
      status: doing
      open-at: 2026.09.26 16:10:00
      closed-at: -
      hash: -
      tag: visual
      doc: planning/feature/unify-rounded-token.md
      desc: 清理无令牌值 rounded-[0.625rem]（20 处）优先级：P1。

---

- [ ] 统一项目圆角体系
      status: pending
      open-at: 2026.09.26 16:10:00
      closed-at: -
      hash: -
      tag: visual
      doc: -
      desc: 统一图标按钮圆角 优先级：P1。

---

- [ ] 统一项目圆角体系
      status: pending
      open-at: 2026.09.26 16:10:00
      closed-at: -
      hash: -
      tag: visual
      doc: -
      desc: 卡片面板 rounded-xl→rounded-2xl 并逐屏视觉验收。优先级：P1。

---

- [ ] 统一项目圆角体系
      status: pending
      open-at: 2026.09.26 16:10:00
      closed-at: -
      hash: -
      tag: visual
      doc: -
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

- [ ] 统一 keyed-busy 抽象
      status: pending
      open-at: 2026.09.26 16:45:04
      closed-at: -
      hash: -
      tag: refactor
      doc: -
      desc: 优化 stores/proxies.ts 的 4 个手写 map 以方便 keyed-busy 抽象的摘取。优先级：P2。

---

- [ ] 统一 keyed-busy 抽象
      status: pending
      open-at: 2026.09.26 16:45:04
      closed-at: 2026.09.26 16:48:37
      hash: 9e80d8ca
      tag: refactor
      doc: -
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

- [ ] CI
      status: pending
      open-at: 2026.09.27 04:57:13
      closed-at: -
      hash: -
      tag: chore
      doc: -
      desc: 在 .github/workflows/ 中新增 typecheck 步骤

---

- [ ] 概览页数据文本出界
      status: pending
      open-at: 2026.09.27 22:10:16
      closed-at: -
      hash: -
      tag: bugfix
      doc: -
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
