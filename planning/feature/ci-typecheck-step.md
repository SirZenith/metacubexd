# CI 新增 typecheck 步骤

## 目标

在 GitHub Actions 中新增 typecheck 步骤，使「类型不通过」在 PR / push 到 `main` 时
被自动拦截——此前工具链修复（`planning/feature/fix-typescript-7-toolchain.md`）已让
`pnpm typecheck` 可用，但 CI 尚未调用它。

引用 TARGETS.md 相关准则：本条目 tag 为 `chore`（构建/工具链/测试基础设施）；
`planning/workflow/refill.md` 允许把「文档、测试、工具链是否留有明确待办」作为目标。

## 现状

`.github/workflows/` 现有四个 workflow：

- `unit-tests.yml`：`push`/`pull_request` 到 `main`；job `unit-test`（ubuntu）在
  `Install dependencies` 后跑各 workspace 单测与覆盖率上传；另有 `desktop-helper-windows`
  job 跑 Windows 辅助程序测试。
- `e2e.yml`：mock 构建后跑 Playwright e2e。
- `release.yml`、`stale.yml`：发布与 stale 管理。

均**未**调用 `pnpm typecheck`。根 `package.json` 已提供
`"typecheck": "pnpm -r typecheck"`，覆盖 `packages/config-editor`、`packages/agent`、
`packages/ui`、`apps/desktop`、`apps/server`。

本地验证：`pnpm typecheck` 在 5 个 workspace 全部通过（`tsc --noEmit` /
`vue-tsc --noEmit` / `nitro prepare && tsc --noEmit`）。

## 方案

在 `unit-tests.yml` 的 `unit-test` job 中，`Install dependencies` 之后、`Run unit
tests` 之前新增一步：

```yaml
- name: Typecheck
  run: pnpm typecheck
```

取舍：

- 备选方案 A：新建独立 workflow `typecheck.yml`。会多起一个 job 重复 checkout/
  install，成本更高；typecheck 与单测同属「静态检查」，并入现有 `unit-tests` job
  最自然，也与其 `paths-ignore`（跳过 docs/markdown）一致。
- 备选方案 B：只跑 `pnpm --filter @metacubexd/ui typecheck`。会漏掉 agent/server/
  desktop/config-editor 的类型错误；根脚本 `pnpm typecheck` 已就绪且全绿，直接用。
- 选择并入 `unit-tests.yml` 的 `unit-test` job：改动最小、复用既有 install 缓存，
  且把所有 workspace 的 typecheck 纳入。
- 放在单测之前：类型错误是最廉价的失败信号，先失败可让后续测试步骤不再执行。

## 验收标准

- `.github/workflows/unit-tests.yml` 的 `unit-test` job 含 `Typecheck` 步骤，
  命令为 `pnpm typecheck`，位于 `Install dependencies` 与 `Run unit tests` 之间。
- `pnpm typecheck` 本地在 5 个 workspace 全部通过（已实测）。
- workflow YAML 合法（用 YAML 解析校验）。
- 不修改其它 workflow，不引入新的 secrets 或权限。

## 关联文档

- `planning/feature/fix-typescript-7-toolchain.md`（令 typecheck 可用的工具链修复）
- `.github/workflows/unit-tests.yml`（承载本次步骤）
- `planning/TARGETS.md`（chore：构建、工具链、测试基础设施）
