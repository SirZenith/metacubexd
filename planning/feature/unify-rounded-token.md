# 清理无令牌值的任意圆角

## 目标

项目中不再存在无设计令牌的任意值圆角 `rounded-[0.625rem]`；全部替换为
`DESIGN.md` 已定义的圆角令牌，推进「统一项目圆角体系」。

引用 TARGETS.md 相关准则：

- 「圆角」「整个项目的圆角要风格统一」——任意值圆角绕过了设计令牌，是风格漂移的
  来源；统一到 field / 紧凑面板两个令牌后，按钮、输入框、卡片彼此协调。
- 「样式也要尽量写成可以复用的形式」——令牌化圆角可复用、可随主题/设计调整，
  任意值不可。

## 现状

`DESIGN.md` 定义的圆角令牌（front matter `rounded`）：

- `field`: `0.5rem` → Tailwind `rounded-lg`（按钮、输入框的 workhorse）
- `box`: `1rem` → `rounded-2xl`（卡片/面板）
- `pill`: `9999px` → `rounded-full`

现状：全项目共 **21 处** 无令牌的 `rounded-[0.625rem]`（10px），分布：

| 文件                                                    | 处数 | 用途                           |
| ------------------------------------------------------- | ---- | ------------------------------ |
| `packages/ui/pages/proxies.vue`                         | 9    | 工具栏图标按钮、节点名称搜索框 |
| `packages/ui/pages/overview.vue`                        | 6    | 状态图标徽标（h-10 w-10）      |
| `packages/ui/pages/rules.vue`                           | 2    | 规则卡片图标按钮               |
| `packages/ui/components/ProxyNodeCard.vue`              | 1    | 代理节点卡片本体               |
| `packages/ui/components/ProxiesDisplayModeSwitcher.vue` | 1    | 分段控件外壳                   |
| `packages/ui/components/IconMenuSelect.vue`             | 1    | 图标菜单按钮                   |
| `packages/ui/components/ConnectivityBoard.vue`          | 1    | 连通性板入口按钮               |

全项目目前没有其它任意值圆角（不存在其它 `rounded-[…]`），因此替换后可用一条
防回归测试锁死。

## 方案

按用途映射到既有令牌：

1. **field 类**（图标按钮、搜索框、控件外壳、状态图标徽标）共 20 处：
   `rounded-[0.625rem]` → `rounded-lg`（`0.5rem`，`DESIGN.md` 的 field radius，
   与项目其它 `rounded-lg` 控件一致）。
2. **卡片** `ProxyNodeCard.vue` 1 处：`rounded-[0.625rem]` → `rounded-xl`（`0.75rem`），
   对应 `DESIGN.md` §6「Use rounded-xl only for deliberately more compact panels」；
   代理节点卡片正是网格中的紧凑面板。卡片最终是否统一到 `rounded-2xl` 由另一条
   TODO「卡片面板 rounded-xl→rounded-2xl」负责，不在本次范围。
3. **新增防回归单测** `packages/ui/__tests__/rounded-tokens.spec.ts`：递归读取
   `components`、`pages`、`layouts` 及根 `app.vue` 的源码，断言不含任意值圆角
   `rounded-[`，防止将来重新引入无令牌圆角。

取舍：

- 备选方案 A：全部换成 `rounded-lg`（含卡片）。会让卡片从 10px 变 8px，但违反
  `DESIGN.md` 对卡片使用面板令牌的意图。
- 备选方案 B：保留 `rounded-[0.625rem]` 并把 10px 写进设计令牌。
  `DESIGN.md` 的 field radius 已是 8px（`rounded-lg`），为 10px 新增令牌会让体系更
  臃肿；且该值本就与 8px 视觉相近。故不新增令牌，直接并入既有令牌。
- 选择按用途映射：field → `rounded-lg`、紧凑卡片 → `rounded-xl`，改动最小且完全
  落在既有令牌集合内。

## 验收标准

- `rg "rounded-\[" packages/ui`（排除生成目录）无结果，即全项目无任意值圆角。
- `packages/ui/__tests__/rounded-tokens.spec.ts` 通过，且删除任一替换后会失败
  （测试确实在守护该不变量）。
- 图标按钮/搜索框的圆角在视觉上与既有 `rounded-lg` 控件一致；`ProxyNodeCard`
  圆角为 `rounded-xl`。
- `pnpm --filter @metacubexd/ui typecheck` 通过；`test:unit` 通过；e2e 通过
  （`ProxyNodeCard` 有 `proxy-card` 断言相关测试，样式类名替换不影响这些断言）。
- 不修改 `DESIGN.md`（其令牌定义与本次实现一致）。

## 关联文档

- `packages/ui/DESIGN.md`（§6 Components：Buttons / Cards / Fields；§2 Sources of Truth）
- `planning/TARGETS.md`（视觉目标：圆角、样式可复用）
- 后续 TODO「卡片面板 rounded-xl→rounded-2xl 并逐屏视觉验收」
