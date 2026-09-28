# 补齐 ru 语言缺失的 i18n key

## 目标

让俄语（`ru`）界面不再对新增功能回退到英文：把 `packages/ui/i18n/locales/ru.json`
补齐到与 `en.json` 完全一致的 key 集合，并把 `ru` 纳入 i18n 单测的严格 parity 守卫，
使「同一 key 必须存在于每种语言」这一约定有自动化保障。

引用 TARGETS.md 相关准则：

- 功能集需求「提供 mihomo 内核所有 Clash API 的支持，各个 API 在软件中以某种形式将
  功能提升给用户」——语言回退会让俄语用户看到中英混杂的文案，功能虽在但呈现不完整。
- 用户体验「在单个界面上不要呈现过多的内容，要让用户能够一眼就看出界面上最重要的
  信息是什么」——快捷键、推荐、内核回滚/恢复等功能的关键说明若回退为英文，俄语用户
  无法在短时间内理解其含义。

`packages/ui/PRODUCT.md` 要求七种语言（含 Russian）下新工作流均可使用；
`.github/copilot-instructions.md` 的 Internationalization 章节要求
「Add the same key to every locale」。

## 现状

- `packages/ui/i18n/locales/en.json` 扁平后共 648 个 key，`ru.json` 仅 598 个，相差
  50 个（TODO 条目 `desc` 中列举的 18 个只是其中一部分）。
- 缺失分组：
  - `shortcuts.*` 18 个（整个快捷键帮助弹窗文案，含嵌套 `category.navigation/actions`）。
  - `recommendation.*` 16 个（智能推荐面板整组文案）。
  - `kernelRollback` / `kernelRecover` / `kernelRollbackConfirm` / `kernelRecoverConfirm`
    / `kernelRollbackApplied` / `kernelRecoverApplied` / `kernelRollbackFailed` /
    `kernelRecoverFailed` 8 个（内核回滚与最小化恢复）。
  - `profilesRefreshAndApply`、`profilesAutoUpdate`、`profilesAutoUpdateOff`、
    `profilesAutoUpdateMinutes`、`profilesAutoUpdateHours` 5 个（订阅刷新与自动更新）。
  - `connectionError`、`connectionErrorDesc`、`retry` 3 个（后端不可达错误页）。
- `packages/ui/__tests__/locales.spec.ts` 的 `PARITY_LOCALES` 目前为
  `['zh', 'ja', 'ko', 'fr', 'fa']`，注释明确说明 `ru` 因历史技术债被排除在严格 parity
  之外；`ALL_LOCALES` 仍包含 `ru`，只做「合法 JSON」检查。
- `ru.json` 其余 key 的键序与 `en.json` 基本镜像一致，缺失 key 处即断档。

## 方案

1. 在 `ru.json` 缺失 key 在 `en.json` 中对应的位置就地插入翻译，保持键序与 `en.json`
   镜像，而不是统一追加到文件末尾：
   - `remoteConfigURLPlaceholder` 之后插入 `shortcuts.*`、`connectionError`、
     `connectionErrorDesc`、`retry`、`recommendation.*`。
   - `kernelRestart` 之后插入 `kernelRollback` … `kernelRecoverFailed`。
   - `profilesRefresh` 之后插入 `profilesRefreshAndApply`。
   - `profilesRefreshFailed` 之后插入 `profilesAutoUpdate*`。
2. 补齐全部 50 个 key，术语沿用 `ru.json` 既有译法（Отклик、Узел、Профиль、Конфигурация
   等），不引入与现有风格冲突的新词。
3. 更新 `packages/ui/__tests__/locales.spec.ts`：把 `ru` 加入 `PARITY_LOCALES`，并同步
   更新注释（删除「ru 有意排除」的说明）。

取舍：

- 备选方案 A：仅补 `desc` 列举的 18 个 key。parity 仍缺 32 个，无法把 `ru` 纳入守卫，
  与本需求的验收目标（守卫覆盖全部七种语言）不符。
- 备选方案 B：接入机器翻译 API 生成俄语。引入外部依赖与不可控质量，且项目无此先例；
  手工翻译量可控（50 条）。
- 备选方案 C：保留 ru 排除、仅新增针对 ru 的独立断言。治标不治本，技术债继续存在。
- 选择「就地补齐全部 50 个 + 纳入 parity」：一次性消除技术债，并以测试固化。

## 验收标准

- 扁平化并排序后，`ru.json` 与 `en.json` 的 key 集合完全相等（零缺失、零多余）。
- `packages/ui/__tests__/locales.spec.ts` 的 `PARITY_LOCALES` 含 `ru`；`ru.json` 通过
  「exact key parity」断言。
- `ru.json` 仍为合法 JSON，`ru` 的既有翻译未被改动。
- `pnpm --filter @metacubexd/ui test:unit` 通过。
- `pnpm --filter @metacubexd/ui typecheck` 通过。

## 关联文档

- `packages/ui/PRODUCT.md`（七语言要求）
- `.github/copilot-instructions.md`（Internationalization 约定）
- `planning/TARGETS.md`（功能集需求与用户体验准则）
- `packages/ui/i18n/locales/en.json`（key 权威来源）
- `packages/ui/__tests__/locales.spec.ts`（parity 守卫）
