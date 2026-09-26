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
- [ ] master-detail 显示模式在手机小屏下 header（分组导航条 + 标题 + 快捷筛选三行）
      占用过多不可滚动高度，需要收敛。
