# 修复 TypeScript 7 工具链不兼容

## 目标

恢复 `pnpm typecheck`、`pnpm lint` 与 pre-commit 钩子的可用性。当前它们全部因
TypeScript 7.0 的破坏性变更而失败，导致 CI 与提交钩子不可用。

引用 TARGETS.md 相关准则：本任务属 `chore`（构建、工具链、测试基础设施），
不直接对应用户体验条目，但它是「功能集完整、用户体验优良」得以持续验证的前提。

## 现状

相关文件：

- `pnpm-workspace.yaml`
  - catalog 第 87 行：`typescript: ^7.0.2`
  - catalog 第 94 行：`vue-tsc: ^3.3.10`
  - catalog 第 45 行：`eslint: ^10.8.1`
  - catalog 第 9 行：`@antfu/eslint-config: ^9.3.0`
- `packages/ui/package.json`
  - `"typecheck": "vue-tsc --noEmit"`（第 23 行）
  - `"lint": "eslint --fix ."`（第 17 行）
  - devDependencies 通过 `catalog:` 引用 `typescript` / `vue-tsc` / `eslint` 等
- `.husky/pre-commit` → `pnpm lint-staged`
- `.lintstagedrc.yml` → `'*.{js,ts,vue,json}': eslint --fix`

失败现象：

1. `pnpm --filter @metacubexd/ui typecheck`：
   `Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './lib/tsc' is not defined
   by "exports" in .../typescript/package.json`
2. `pnpm --filter @metacubexd/ui exec eslint ...`：
   `Error: typescript-eslint does not support TS 7.0.`
3. 因此 `git commit` 的 pre-commit 钩子失败，提交被拒。

根因：TypeScript 7.0 是 Go 原生重写版，**不提供程序化 API**，其 `package.json`
的 `exports` 只暴露 `./package.json`、`.`（`lib/version.cjs`）与 `./unstable/*`，
不再有 `./lib/tsc`。而：

- `vue-tsc@3.3.10` 的 `index.js` 调用
  `require.resolve('typescript/lib/tsc')`（`resolveTscPath`）；
- `@typescript-eslint/eslint-plugin@8.67.0` 的 `dist/index.js` 读取
  `require('typescript').versionMajorMinor`，并在 `versionMajor >= 7` 时直接抛错。

两者都依赖 TS 6 的 API / 文件布局。

## 方案

采用 TypeScript 官方在 7.0 发布公告中给出的「与 TypeScript 6.0 并行运行」方案
（见 https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
「Running Side-by-Side with TypeScript 6.0」）：

1. 把 catalog 中的 `typescript` 改为 npm alias，指向兼容包：
   `typescript: npm:@typescript/typescript6@^6.0.2`
   —— 该包提供 `tsc6` 可执行文件，并 re-export TS 6.0 的 API，使
   `vue-tsc` 与 `typescript-eslint` 通过 `require('typescript')` 拿到 TS 6。
2. 新增 catalog 条目 `@typescript/native: npm:typescript@^7.0.2`，保留 TS 7 的
   `tsc` 可执行文件（供需要原生速度的场景使用）。

调研与验证：

- `@typescript/typescript6@6.0.2` 的 `bin` 为 `{ "tsc6": "./bin/tsc6" }`，
  依赖 `@typescript/old: npm:typescript@^6`（实际解析为 6.0.3）。
- `@typescript/old` 的 `package.json` **没有** `exports` 字段，因此
  `@typescript/old/lib/tsc.js` 可被 `require.resolve` 正常解析 —— 正是
  `vue-tsc` 的 `resolveTscPath` 所检测的路径
  （`if (name === '@typescript/typescript6') return require.resolve('@typescript/old/lib/tsc', ...)`）。
- `typescript-eslint` 通过 `require('typescript')` 读取版本；别名后
  `versionMajorMinor` 为 `6.x`，不再触发 `versionMajor >= 7` 的抛错。

备选方案与取舍：

- 备选 A：把 `typescript` 降级到 `^6.0.2`（不用 alias）。可行，但会丢失 TS 7
  的 `tsc` 原生速度，且与官方推荐的「并行运行」方向相悖。
- 备选 B：升级 `vue-tsc` / `typescript-eslint` 到支持 TS 7 的版本。当前
  `vue-tsc@3.3.10` 已是较新版本，其 TS 7 支持恰恰依赖上述 alias 机制；
  `typescript-eslint` 官方 issue #10940 表明 TS >= 7.1 才可能原生支持。
  故不可行。
- 选择官方 alias 方案：既恢复工具链，又保留 TS 7 的 `tsc`，且是官方推荐路径。

## 验收标准

- `pnpm --filter @metacubexd/ui typecheck` 正常退出（无 `ERR_PACKAGE_PATH_NOT_EXPORTED`）。
- `pnpm --filter @metacubexd/ui exec eslint <file>` 正常退出（无 `does not support TS 7.0`）。
- `pnpm --filter @metacubexd/ui test:unit` 仍全部通过。
- `git commit` 的 pre-commit 钩子不再因工具链报错而失败。
- `pnpm install` 后 lockfile 一致，无未解析的 peer 警告。

## 关联文档

- TypeScript 7.0 发布公告（Running Side-by-Side with TypeScript 6.0）
- `planning/TARGETS.md`（任务分类：chore）
