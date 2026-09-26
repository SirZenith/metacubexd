# AGENTS.md

metacubexd is the official dashboard and managed runtime for the Mihomo proxy
kernel. It is a pnpm 10 workspace with four workspaces: `packages/ui`,
`packages/agent`, `apps/server`, and `apps/desktop`.

## Read First

Each area has one authoritative document. Load the one that owns your change
instead of restating it.

- [.github/copilot-instructions.md](.github/copilot-instructions.md) — the
  repository-wide agent guide: monorepo map, runtime forms, the Clash API vs
  Control API boundary, UI stack, commands, test locations, and editing rules.
  Start here for any code change; it applies to every agent, not only Copilot.
- [CONTEXT.md](CONTEXT.md) — the project's domain language. Use its terms in
  code, UI copy, and docs.
- [CONTRIBUTING.md](CONTRIBUTING.md) — environment setup, build and test
  commands, and the pull-request checklist.
- [packages/ui/PRODUCT.md](packages/ui/PRODUCT.md) and
  [packages/ui/DESIGN.md](packages/ui/DESIGN.md) — product intent and the UI
  design system.
- [packages/agent/MANUAL.md](packages/agent/MANUAL.md) — real-kernel smoke
  tests, run only when deterministic tests cannot cover the change.

## Planning

Development goals, requirements, and conventions live in
[planning/](planning/). Read [planning/PRELUDE.md](planning/PRELUDE.md) for the
map and [planning/WORKFLOW.md](planning/WORKFLOW.md) before starting work.
[planning/TARGETS.md](planning/TARGETS.md) is the decision rule for new
requirements and outranks `PRODUCT.md` and `DESIGN.md` on conflict. Track work
in [planning/TODO.md](planning/TODO.md).

Planning documents are written in Chinese; the rest of the repository is in
English.

## Working agreements

- Commit with English
  [Conventional Commits](https://www.conventionalcommits.org/) scoped to the
  workspace you changed, for example `fix(desktop): quote Windows proxy paths`.
- Keep each change inside its owning workspace; do not move host-specific
  behavior into `packages/ui`.
- Match the surrounding patterns, naming, and test style, and add regression
  coverage in the workspace that owns the behavior.
- Keep tokens, subscription URLs, profile contents, private keys, and other
  credentials out of fixtures, logs, screenshots, and commits.
