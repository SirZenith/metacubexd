# 列表-详情（list-detail）布局在大屏下的宽度约束

## 问题

master-detail（左导航 + 右详情）在超宽屏下，如果详情面板用 `flex-1` 无限拉伸，
单行列表项的名称与右侧元数据（延迟、类型）会被推到屏幕两端，行内出现大片空白，
视觉上「两端分离」且难以扫读。

## 调研结论（可复用规则）

1. **必须给内容设置最大宽度**，禁止 UI 元素在宽屏下拉伸满宽或变形。
   - Android/Material 官方桌面与响应式指南反复强调：
     "Set a max width on content and components to prevent stretching full width."；
     "UI elements shouldn't stretch to the full width or distort."
   - 来源：developer.android.com《Get started with desktop》《Adapt layouts》
     《Design an Adaptive Layout with Material Design》。
2. **控制文本行长度**：正文舒适阅读长度约 40–60 字符（短文案约 60 字符）。
   超宽行会降低可读性。来源：同上的 Material 桌面指南与 breakpoints 文档。
3. **超宽屏（>1600dp）时布局到达最大宽度后有三种收尾方式**：居中并加宽边距、
   保持左对齐让右边距增长、或继续增长以揭示更多内容（多栏）。
   来源：Material Design 1《Responsive UI》。
4. **垂直列表的详情面板尤其不应过宽**：macOS 系统设置把详情面板宽度固定/受限，
   原因是「在窄栏里读一行文字比在宽栏里更容易」，且列表本身无需更宽。
   来源：Reddit r/MacOS 关于 System Settings 固定宽度的讨论、objc.io
   《Settings Form Layout》示例。
5. **列表-详情是 Material 的 canonical layout**：expanded 宽度并排显示两栏；更大
   宽度可考虑多栏（卡片网格），但多栏会改变列表的语义与扫读方式，是否采用取决于
   内容本身。来源：Material《Canonical layouts》。

## 对本项目的适用结论

- 代理主从模式的右侧节点列表本质是**垂直列表**，应当限制详情面板的最大宽度，而不是
  让它占满剩余宽度；这与 macOS 设置面板的取舍一致。
- 项目已有独立的「卡片」显示模式承担多列网格的角色，主从模式保持单列列表即可，
  不宜改成多栏网格，避免与卡片模式职责重叠。
- 具体数值取行宽舒适区间：常规断点 `max-w-4xl`（56rem / 896px），超宽断点
  `-2xl:` 放宽到 `max-w-5xl`（64rem / 1024px）。
- **限宽后的收尾方式：水平居中。** 最初选择「保持左对齐、让右边距增长」以避免移动左
  导航锚点，但实测在超宽屏上整个主从内容（左导航 + 详情面板）贴左，右侧留下大片空白，
  画面明显失衡（用户反馈）。Material 三种收尾方式中的「居中并加宽边距」在超宽屏观感
  更均衡，也与 macOS 系统设置等成熟界面把固定宽度内容居中的做法一致。因此主从模式在
  `≥sm` 时把「左导航 + 详情面板」整体 `mx-auto` 居中，宽度上限不变。
- 实现注意：在 flex column 容器中给子项设 `auto` 水平 margin 会抑制交叉轴 `stretch`，
  子项宽度会塌缩到内容宽度；必须同时给子项设 `w-full`（宽度先取满、再由 `max-w-*`
  截断），`mx-auto` 才能把它居中。
