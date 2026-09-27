# 为代理显示模式切换添加过渡动画

## 目标

`proxies` 页在「卡片 / 列表 / 表格 / 主从」四种显示模式之间切换时，内容区不再瞬间硬切，
而是有一段自然的淡入淡出过渡；其中切到主从（master-detail）模式时，内容以轻微上浮 +
淡入的方式入场，让「列表 → 主从」这一变化显得连贯。

引用 TARGETS.md 相关准则：

- 「单个界面内，不同的功能、信息应该要有明确的亲疏关系」——显示模式切换是同一内容
  的不同呈现，过渡应表达「同一内容换了一种排布」，而不是「跳到了另一个界面」。
- 视觉目标「扁平化」——过渡只用透明度与轻微位移/缩放，不引入阴影或 3D 效果。
- `packages/ui/DESIGN.md` 的 Motion 约定：动效只服务于状态与动作（hover lift、tactile
  press、latency flip、page cross-fade），且每个动画都要有 `prefers-reduced-motion`
  回退（项目已在 `main.css` 全局处理）。

## 现状

- `packages/ui/pages/proxies.vue`
  - 第 1083–1174 行是 `proxies` tab 的内容分支：
    - `<ProxyMasterDetail v-if="isMasterMode" ... />`（第 1084–1090 行）
    - `<ProxiesRenderWrapper v-else ...>`（第 1091–1173 行）
    - 两者是**同级 `v-if` / `v-else`，没有任何 `<Transition>` 包裹**，切换时 DOM 直接
      替换，观感生硬。
  - 卡片/列表/表格模式内部的分组卡片已有入场动画 `animate-fade-slide-in`
    （scoped keyframe，第 1494–1509 行，`0.4s ease-out backwards`），但**仅在首次挂载
    时播放**；模式切换时 `ProxiesRenderWrapper` 本身不重新挂载（同一组件、仅 slot 内容
    变化），因此切换过程没有过渡。
  - 第 1284–1300 行的「返回顶部」按钮已用 `<Transition>`（Tailwind class 形式），是本页
    既有的过渡写法。
- `packages/ui/assets/css/main.css` 提供 Motion Design System：缓动令牌
  `--ease-spring` / `--ease-spring-soft` / `--ease-snappy` / `--ease-soft` / `--ease-press`，
  时长令牌 `--dur-instant/fast/base/slow/page`，以及 `spring-up`、`pop-in`、`page`
  等可复用动画；第 275–284 行有全局 `prefers-reduced-motion` 降级。
- 既有 `<Transition>` 命名约定：`MobileBottomNav.vue` 的 `slide-up`/`fade`/`icon-spin`、
  `GlobalTrafficIndicator.vue` 的 `traffic-expand`、`Latency.vue` 的 `latency-flip`
  （`mode="out-in"`）、`Modal.vue` 的 `.modal-shell`（注释明确只用 transform + opacity，
  避免 `filter: blur()` 掉帧）。

现状行为：点击显示模式切换器，内容区在一帧内从一种排布跳到另一种，没有任何过渡。

## 方案

在 `proxies` tab 的内容分支外层加一个 `<Transition>`，用项目既有令牌定义过渡：

1. 用 `<Transition name="proxies-mode" mode="out-in">` 包裹 `ProxyMasterDetail` /
   `ProxiesRenderWrapper` 的 `v-if` / `v-else` 分支。
   - `mode="out-in"` 让旧内容先淡出、新内容再淡入，避免两套布局同时存在导致的高度
     塌陷与滚动位置跳动（主从模式在 `sm` 断点下是 `h-full` 布局，交叉淡入会互相挤压）。
2. 在 `proxies.vue` 的 scoped style 中定义过渡类，复用 `main.css` 令牌：
   - `enter-active`：`opacity var(--dur-base) var(--ease-soft)` +
     `transform var(--dur-base) var(--ease-spring-soft)`；
   - `leave-active`：`opacity var(--dur-fast) var(--ease-soft)`（退出更快，符合
     「进入慢、退出快」的既有节奏，如 `scroll-to-top` 的 200ms/150ms）；
   - `enter-from`：`opacity: 0; transform: translateY(8px) scale(0.99)`；
   - `leave-to`：`opacity: 0; transform: translateY(-4px) scale(0.99)`。
   - 只用 `opacity` + `transform`（GPU 合成），遵循 `Modal.vue` 的性能约定。
3. `prefers-reduced-motion` 由 `main.css` 的全局规则把 `transition-duration` 压到
   `0.001ms`，无需额外处理；e2e 会断言该降级生效。
4. 给过渡容器加 `data-testid="proxies-mode-transition"`，便于 e2e 断言过渡类与时长。

取舍：

- 备选 A：给 `ProxiesRenderWrapper` 与 `ProxyMasterDetail` 各自加 `animate-fade-slide-in`
  入场动画。两者是 `v-if`/`v-else`，切换时确实会重新挂载，但**没有退出动画**，旧内容
  仍会瞬间消失，只解决一半；且 `animate-*` 是 `backwards` 填充的一次性动画，无法表达
  「退出」。
- 备选 B：用 `mode="default"`（交叉淡入）。两套布局同时存在，主从的 `h-full` 与列表的
  自然高度会互相挤压，且滚动容器高度抖动，观感更差。
- 备选 C：引入 `@vueuse/motion` 或 CSS `@starting-style`。前者新增依赖，后者浏览器
  支持面与项目既有令牌体系不契合；项目已有成熟的 `<Transition>` + 令牌模式，直接复用。
- 选择 `<Transition mode="out-in">` + 令牌化过渡类：改动集中在一处，复用既有动效语言，
  退出/进入都有表达，且天然获得 reduced-motion 降级。

## 验收标准

- 在 `proxies` 页切换显示模式（如 卡片 → 主从）时，内容区外层容器
  （`data-testid="proxies-mode-transition"`）在过渡期间存在非零的
  `transition-duration`，且过渡结束后新内容可见（e2e 断言）。
- 过渡只使用 `opacity` 与 `transform`（代码审查确认，无 `filter`/`box-shadow` 动画）。
- `prefers-reduced-motion: reduce` 下过渡时长被压到近零，切换即时完成（e2e 断言）。
- 切换后主从模式的既有行为不回归：面板限宽、居中、chrome 对齐、列表不自动定位等既有
  e2e 全部通过。
- 小屏（< 640px）与 `proxyProviders` tab 行为不变。
- `pnpm --filter @metacubexd/ui typecheck` 通过；`test:unit` 通过；e2e 通过。

## 关联文档

- `packages/ui/DESIGN.md`（Motion 约定与 reduced-motion 要求）
- `packages/ui/assets/css/main.css`（Motion Design System 令牌）
- `planning/feature/optimize-master-detail-large-screen.md`、
  `planning/feature/center-master-detail-wide-layout.md`（主从模式布局的前序实现）
- `packages/ui/pages/proxies.vue`
