# 概览页统计卡文本出界修复

## 目标

`overview` 页 `.overview-stat-card` 内的文本在内容过长时不再超出卡片可视范围被裁切；
数值完整可读（换行而非截断/裁切）。

引用 TARGETS.md 相关准则：

- 「不允许元素因为屏幕大小不够就超出界面」——当前长数值在窄列中被 `overflow-hidden`
  裁掉，直接违反此条。
- 「UI 必须针对小、中、大屏都做适配」——最窄的 `grid-cols-2`（移动端）列宽最小，是
  溢出最先出现处。
- 「在单个界面上不要呈现过多的内容，要让用户能够一眼就看出界面上最重要的信息是
  什么」——数值被裁切后信息不完整，要求保持易读。

## 现状

`packages/ui/pages/overview.vue`：

- 统计网格（第 388–517 行）：`grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6`，
  共 6 张 `.overview-stat-card`。
- 每张卡片（如第 390–408 行）：

  ```html
  <div
    class="overview-stat-card flex min-w-0 items-center gap-3 overflow-hidden ... ..."
  >
    <div
      class="flex h-10 w-10 shrink-0 rounded-lg bg-success/15 text-success ..."
    >
      …
    </div>
    <div class="flex w-full min-w-0 flex-col gap-0.5 overflow-hidden">
      <span class="text-xs leading-tight break-words text-base-content/60"
        >label</span
      >
      <span
        class="text-base font-semibold whitespace-nowrap text-base-content tabular-nums"
        >value</span
      >
    </div>
  </div>
  ```

- label 已 `break-words` 可换行；**value 使用 `whitespace-nowrap`**，在窄列下长数值
  （如 `1023.99 GB/s`、大流量总量、长连接数）为一整行不可断，被外层
  `overflow-hidden` 裁切。
- 卡片样式（`<style>`，第 651–675 行）只有 hover/active 动效，无高度约束。

## 方案

移除 value 的 `whitespace-nowrap`，改为 `break-words`，让超长内容在卡片内换行：

```html
<span class="text-base font-semibold break-words text-base-content tabular-nums"
  >…</span
>
```

- 父容器已有 `w-full min-w-0 overflow-hidden`，配合 `break-words`（`overflow-wrap:
break-word`）即可在空格处或必要时断行，不再横向溢出。
- 保留 `tabular-nums`：即便换行，数值仍等宽对齐。
- 6 处 value 的 class 串完全相同，用一处批量替换即可。

取舍：

- 备选方案 A：`truncate` + `:title` 显示完整值。单行省略号虽整齐，但移动端无 hover，
  完整信息不可见，违背「保持文本易读性」。
- 备选方案 B：`whitespace-nowrap` 保留 + 缩小字号 `text-sm`。大数值仍可能溢出，
  且不同卡片字号不一，破坏一致性。
- 备选方案 C：给网格改 `grid-cols-1`（小屏单列）。会牺牲信息密度，且非根因。
- 选择「移除 nowrap、允许换行」：完整保留数值、零 JS、与 label 的处理一致，最小改动。

## 验收标准

- 6 处 `.overview-stat-card` 的 value class 均不再含 `whitespace-nowrap`，并含
  `break-words`。
- 在 390px 视口下，向 value 注入超长文本（如 `12345.67 TB/s and more`）后，每个
  value 的 `scrollWidth <= clientWidth`（无横向溢出、无裁切）。
- 既有 overview e2e（`.overview-stat-card` 数量与文案断言）不回归。
- `pnpm --filter @metacubexd/ui typecheck` 通过；`test:unit` 通过；e2e 通过。

## 关联文档

- `planning/TARGETS.md`（用户体验：不允许元素超出界面；小屏适配）
- `packages/ui/pages/overview.vue`（受影响文件）
