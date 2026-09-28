# CI 增加非修正式 lint / 格式检查

## 目标

在 CI 中增加**只检查、不修改**的 ESLint 步骤，阻止 lint 规则与格式漂移，同时不改变本地
`pnpm lint`（`--fix`）的既有开发体验。

`.github/copilot-instructions.md` 明确警告：`pnpm lint` 会以 `--fix` 改写文件，不能
在 CI 里直接运行；因此需要一个独立的检查入口。

## 现状

- `.github/workflows/unit-tests.yml` 的 `unit-test` job 已有 **Typecheck** 与单元测试
  （含 coverage），但没有 lint 步骤。
- 根 `package.json` 的 `lint` 是 `pnpm -r lint`；四个 workspace 中只有
  `packages/ui` 定义了 `lint`，其值为 `eslint --fix .`（会改文件，不适合 CI）。
  `packages/ui` 同时有 `format`（`prettier --write --ignore-unknown .`）。
- 本地以只检查方式运行 `eslint .` 现存违规：
  - `utils/index.ts` 第 137、138、423 行 `unicorn/number-literal-case`（error）。
  - `composables/__tests__/useProxyTooltip.spec.ts` 第 9 行 `import/first`（error）——
    该 import 故意放在 `vi.stubGlobal` 之后，属测试所需的加载顺序。
  - `components/TrafficRankings.vue`、`composables/useRuntimeConfigViewer.ts` 的
    未使用变量/导入（warning）。

## 方案

1. `packages/ui/package.json` 新增脚本：

   ```json
   "lint:check": "eslint ."
   ```

2. `.github/workflows/unit-tests.yml` 在 **Typecheck** 之后新增：

   ```yaml
   - name: Lint
     run: pnpm --filter @metacubexd/ui lint:check
   ```

3. 修复上列现存违规，使检查可立即通过：
   - `utils/index.ts`：十六进制字面量按规则大写数字（`0x0F` / `0x3F` / `0x1F1E6`）。
   - `useProxyTooltip.spec.ts`：为刻意延后的 import 增加 `import/first` 豁免注释并说明
     原因（单独提交，见下）。
   - 删除 `TrafficRankings.vue` / `useRuntimeConfigViewer.ts` 中未使用的绑定。

取舍：

- 备选 A：同时引入 `prettier --check`。项目根 `.prettierignore` 未忽略
  `packages/ui/.output`，且全库存在 173 个历史未格式化文件；直接引入会产生大量与本次
  无关的格式化改动。`@antfu/eslint-config` 已通过 `eslint-plugin-format` 覆盖格式规则，
  故只增加 ESLint 检查即可覆盖格式漂移。
- 备选 B：把所有 workspace 都接入 ESLint。agent / server / desktop 目前没有 ESLint
  配置与脚本，属独立工作，超出本需求。
- 选择「UI 的 `lint:check` + CI 接入」：改动最小、可立即变绿，并堵住现有漂移。

## 验收标准

- `pnpm --filter @metacubexd/ui lint:check` 退出码为 0（无 error 与 warning）。
- `.github/workflows/unit-tests.yml` 的 `unit-test` job 含 Lint 步骤。
- 修复仅涉及字面量大小写、未使用绑定与一处带说明的测试文件豁免，不改业务行为。
- `pnpm --filter @metacubexd/ui test:unit` 与 `typecheck` 仍通过。

## 关联文档

- `.github/workflows/unit-tests.yml`（受影响文件）
- `packages/ui/package.json`（新增脚本）
- `.github/copilot-instructions.md`（对 `pnpm lint --fix` 的警告）
- `packages/ui/eslint.config.mjs`（ESLint 规则来源）
