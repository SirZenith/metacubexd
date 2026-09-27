# 圆角体系审计与收编

## 目标

确认项目圆角是否已统一，并把审计发现的偏离收编到设计令牌体系，使「实现」与
`DESIGN.md` 的令牌定义一致。

引用 TARGETS.md 相关准则：

- 「圆角」「整个项目的圆角要风格统一」——需要一个覆盖全部用例、可枚举的圆角梯度。
- 「颜色配置要考虑好是否随用户的主题切换而切换」「样式也要尽量写成可以复用的形式」
  ——令牌化、可复用的圆角档位优于零散的工具类。

## 现状

前序三次圆角任务已完成：清理 `rounded-[0.625rem]`、统一图标按钮、卡片面板升到
`rounded-2xl`。本次全量审计（`packages/ui` 的 components/pages/layouts/app.vue）：

| 档位                 | 处数   | 用途                                        |
| -------------------- | ------ | ------------------------------------------- |
| `rounded-lg`         | 146    | 字段、按钮、图标按钮（field 令牌）          |
| `rounded-full`       | 58     | 胶囊、圆形 FAB、头像（pill 令牌）           |
| `rounded-2xl`        | 53     | 卡片与页面面板（box 令牌）                  |
| `rounded-xl`         | 42     | 刻意紧凑的面板：菜单、tooltip、内嵌表单区块 |
| `rounded-md`         | 30     | 徽标、chip、延迟 pill、小控件               |
| **裸 `rounded`**     | **10** | **未纳入令牌的第四档（0.25rem）**           |
| `rounded-none`       | 2      | 表格行、模态内直角 tab（合理例外）          |
| `rounded-sm`         | 1      | 滚动条 thumb（合理例外）                    |
| 任意值 `rounded-[…]` | 0      | 已被防回归测试锁死                          |

裸 `rounded` 位置：`ThemeList.vue:96,100,104`、`ProxyNodeTableRow.vue:57`、
`ShortcutsHelpModal.vue:75`、`config-editor/SchemaValueEditor.vue:144`、
`config.vue:966`、`ProxyNodeListItem.vue:96,167`、`ConnectionsTable.vue:309`。

同时 `DESIGN.md` 的 `rounded` front matter 只声明 `field/box/pill` 三档，未覆盖实现中
已稳定使用的紧凑面板（`xl`）与徽标（`md`）两档，导致「文档说三档、实现有八档」。

## 方案

1. 把 10 处裸 `rounded` 统一到徽标令牌 `rounded-md`（`0.375rem`），消除未收编档位；
   视觉差异 4px → 6px，属徽标/小色块级别，可接受。
2. 扩充 `DESIGN.md`：front matter 的 `rounded` 增加 `chip: 0.375rem` 与
   `compact: 0.75rem`，并在 §6 前新增 **Border Radius Tokens** 小节，明确梯度：
   `rounded-md`（chip/badge）→ `rounded-lg`（field/button）→ `rounded-xl`（紧凑面板）
   → `rounded-2xl`（card/panel）→ `rounded-full`（pill）；并说明
   `rounded-none`（表格行/直角 tab）与 `rounded-sm`（滚动条 thumb）是明确例外。
3. 扩充防回归测试 `packages/ui/__tests__/rounded-tokens.spec.ts`：新增断言，源码中
   不得出现裸 `rounded`（无后缀）工具类。

取舍：

- 备选方案 A：把裸 `rounded` 改成 `rounded-lg`。会让小徽标/色块圆角偏大（8px），与
  已有的 `rounded-md` 徽标不一致。选 `rounded-md` 更贴合 chip 用例。
- 备选方案 B：不更新 `DESIGN.md`，只在代码里收编。文档与实现仍不一致（三档 vs 五档），
  违背 `DESIGN.md` §2「文档与实现冲突时以实现为准并更新文档」。
- 选择「收编 + 文档化 + 测试守护」：实现、文档、测试三者一致，且新增档位有据可查。

## 验收标准

- 全项目不再出现裸 `rounded`（无后缀）工具类；`rounded-sm`/`rounded-none` 仅出现在
  已声明的例外位置。
- `DESIGN.md` 的 `rounded` front matter 含 `chip` 与 `compact`，并新增
  Border Radius Tokens 小节。
- 扩充后的 `rounded-tokens.spec.ts` 通过；删除任一收编改动会让它失败。
- `pnpm --filter @metacubexd/ui typecheck` 通过；`test:unit` 通过；e2e 通过。
- 结论：项目圆角体系在审计后统一为五档令牌梯度 + 两处书面例外。

## 关联文档

- `packages/ui/DESIGN.md`（§2 Sources of Truth；§6 Components）
- `planning/TARGETS.md`（视觉目标：圆角、样式可复用）
- 前序 TODO「清理无令牌值 rounded-[0.625rem]」「统一图标按钮圆角」
  「卡片面板 rounded-xl→rounded-2xl」
