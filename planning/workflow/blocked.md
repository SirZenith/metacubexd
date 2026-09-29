本文档描述本项目任务受阻时的处理规则。

# 何时置 blocked

- 依赖缺失、外部阻塞、或需要人工决策而无法在当前条件下完成时，把条目的 `status:` 改为
  `blocked`，并在 `desc` 末尾**追加**阻塞原因。

# 不留半成品

- 不提交半成品实现；必要时用 `git reset` 保留工作区，并说明当前状态。
- 把 TODO 清单中相关步骤置为 `cancelled`（附原因）或 `completed`，不要留下 `in_progress`/`pending`。

# 恢复

- 阻塞解除后把 `status:` 改回 `pending`，并在 `desc` 中移除已解决的阻塞说明。
