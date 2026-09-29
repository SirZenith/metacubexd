本文档描述完成单个 TODO 任务的流程。

若 /todo-next 的调用参数包含 `loop`，则认为当前处于循环状态；否则为非循环状态。

TODO 条目格式：见 `/todo-next` 命令自带的默认约定（字段 `status / open-at / closed-at / hash /
tag / doc / desc`，条目之间用 `---` 分隔）；项目若提供 `workflow/todo-format.md` 则以其为准。
循环只处理未被注释的 `status: pending` 条目。

1. 在 TODO.md 中取实现目标：若 /todo-next 指定了目标关键词，则取标题包含该关键词的第一条未被注释的
   条目（若其不是 `status: pending` 或不存在，则提示并结束）；否则取第一个未被注释的
   `status: pending` 条目。
2. 用 **subagent** 派发 `todo-researcher` 完成实现前的调研与知识固化。

   子会话加载 skill `todo-research`；流程与默认标准见该 skill，项目可在
   `planning/workflow/research.md` 中覆盖调研标准。子会话不共享本会话上下文，**交接靠文档**：
   产物为 `planning/knowledge/<title>.md`。

   要点：非循环状态下主流程可以互动式提问确认实现细节；循环状态下**不得提问**，须由调研
   子会话按标准自行查证市面方案、比较其与本项目架构的契合度并作出判断。

3. 用 **subagent** 派发 `todo-spec-writer` 确定实现方式并固化实现文档（按条目 `doc` 字段分流）。

   子会话加载 skill `todo-spec`；流程与默认标准见该 skill，项目可在 `planning/workflow/spec.md`
   中覆盖文档标准。默认文档为 `planning/feature/<slug>.md`，须含「目标 / 现状 / 方案 / 验收标准 /
   关联文档」五节。若 `doc` 为 `-`：生成文档后把该条目的 `doc` 字段更新为该路径，
   并提交：`docs(planning): add feature spec for <slug>`。若 `doc` 指向已有文档：直接读取，
   跳过生成与提交。

   **缺少功能文档，禁止开始写测试或实现。**

4. 如果目标是对项目较大范围的重构，需要在开始前将对应功能的实现方式与架构精简地
   写成 `planning/report/<title>.md`（实现细节调查报告），方便后续查询。
5. 测试：按 skill `todo-test` 先为新功能添加测试（项目若提供 `planning/workflow/test.md`
   则从其标准，否则用 skill 内置默认）。

   skill 内含测试维护规则：除测试本身有 bug、或新功能使旧测试失去意义外，不得修改或删除
   既有测试，只能新增；在测试步骤之外修改测试的，单独提交并在提交信息中注明原因。

6. 根据已经写好的测试，正式开始由测试驱动的功能开发。完成此步骤后，先不要提交修改。
7. 验收：用 **subagent** 派发 `todo-verifier`（只读；加载 skill `todo-verify`）。

   验收标准由该 skill 确定（项目若提供 `planning/workflow/verify.md` 则从其标准）。

   - 非循环状态：先由验收子会话产出报告，再**停下等待人工验收**；收到通过信号后继续执行第 8、9 步，
     收到需修改信号则修改后重新验收。切勿只提交而遗漏第 9 步的回写。
   - 循环状态：由验收子会话按标准**独立判定**；任一条件不满足即不通过。

   验收不通过时，**不允许提交、不允许进行后续步骤**。

8. 验收通过后：
   - 运行 `git add -A`
   - 运行 `git commit`，提交信息用英文 Conventional Commits（如 `feat: ...`），简明描述本次需求
     （项目若提供 `workflow/commit.md` 则从其规约）
   - 应用 `git log -1 --format=%h` 取得短 hash
9. 回写需求文件（验收通过后执行；**循环与非循环皆然**，区别仅在第 7 步是否需等人工验收）。

   更新该条目：标题行 `- [ ]` → `- [x]`；`status:` → `done`；`closed-at:` → 当前时间
   （`Y.M.D HH:MM:SS`，月、日、时、分、秒均两位补零，例如 `2026.09.27 02:56:45`）；
   `hash:` → 本次实现的短 hash。然后提交修改。

---

附：任务受阻（无法完成或需人工决策）时，项目若提供 `workflow/blocked.md` 则从其规定；否则按
默认处理：把条目置为 `blocked`、在 `desc` 末尾写明原因、不留半成品。
