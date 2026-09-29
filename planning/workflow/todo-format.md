本文档描述本项目的 TODO 条目格式，供各命令与 skill 参考。
默认约定见命令 `/todo-next`；本文件用于项目自定义（存在时优先于内置默认）。

<!-- 注意：plugins/todo-loop-driver 用代码解析该格式（parseTodos / countPending），代码是
     机器事实标准；修改本文件时必须与代码保持一致。 -->

# 条目结构

字段缩进两空格；条目之间用 `---` 分隔（`---` 前后各留一个空行）：

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

# 规则

- 处理**未被注释的**未完成条目（`status: pending` 或 `status: doing`；`doing` 表示上一轮未做完，
  会被续做）；`done`/`blocked` 不再处理；完成后置 `done`。
- 标题行复选框与 `status` 一致：`status: done` 用 `- [x]`，其余（含 `doing`、`blocked`）用 `- [ ]`。
- 受阻时置 `blocked`，并在 `desc` 末尾写明原因。
- **需要人工 / 真机核对的条目**：置 `status: blocked`，标题行用 `- [!]` 作人工标记，并在 `desc`
  末尾写明「需人工：_哪一项、为什么_」。**是否被循环处理只取决于 `status:` 字段**——`- [!]`
  只是给人看的标记，若 `status` 仍为 `pending`/`doing`，该条目照样会被循环抓取。
- `doc` 为 `-` 表示尚无实现文档：处理时先生成 `planning/feature/<slug>.md` 并回写该字段；
  为路径时表示已有文档，直接使用，跳过生成。
- 时间字段（`open-at` / `closed-at`）格式为 `Y.M.D HH:MM:SS`，月、日、时、分、秒**均两位补零**，
  例如 `2026.09.27 02:56:45`。
- `tag` 取值范围见 `planning/TARGETS.md` 的「任务分类」小节；术语标准见项目根 `CONTEXT.md`（若有）。

# 解析约定（与插件代码一致）

- 解析前先剔除 HTML 注释（`<!-- ... -->`）与围栏代码块——因此本文档中的示例不会被误读；
  但业务上仍应只把真实条目写进需求文件。
- 以整行为 `---` 的标记切分条目块。
- 标题行以 `- [ ]`、`- [x]` 或 `- [!]` 开头；`status:` 取其后第一个非空 token（大小写不敏感）。
- 循环读写的文件：优先 `planning/TODO.md`，否则项目根 `TODO.md`（可用环境变量
  `OPENCODE_LOOP_TODO` 覆盖）。
