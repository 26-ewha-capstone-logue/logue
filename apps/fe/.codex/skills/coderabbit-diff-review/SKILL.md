---
name: coderabbit-diff-review
description: CodeRabbit-style Git diff and PR review workflow for Codex. Use when the user asks Codex to review a branch, pull request, commit range, staged changes, working-tree diff, or patch in CodeRabbit-like format, especially with Korean findings-first output, severity labels, actionable file/line comments, or references to CodeRabbit review conventions. This skill does not call the real CodeRabbit service.
---

# CodeRabbit Diff Review

## Review Target

Resolve the diff before reviewing:

1. Use the explicit target if the user provides a PR number, commit range, branch pair, patch, or file list.
2. If no target is given in a Git repo, review `origin/dev...HEAD`.
3. If that range is empty, check staged changes, then working-tree changes.
4. If a PR target is available through GitHub tools, prefer PR patches and changed-file lists over reconstructing the diff manually.

Read enough surrounding code to verify behavior, but keep findings anchored to changed lines or directly affected code.

## Repository Context

When `.coderabbit.yaml` exists, read it before reviewing and apply its review intent:

- Respect `reviews.path_filters` when deciding which files to ignore.
- Apply matching `reviews.path_instructions` as review priorities for affected paths.
- Treat lockfiles, generated output, build artifacts, coverage, and vendored dependencies as out of scope unless the user explicitly asks.

For this repo, default PR target is `dev`, and reviews should be written in Korean.

## Finding Taxonomy

Use CodeRabbit-style labels:

- `⚠️ Potential issue`: bug, security problem, data-loss risk, broken contract, race, regression, or failing user flow.
- `🛠️ Refactor suggestion`: maintainability, performance, consistency, or design improvement that is useful but not necessarily blocking.
- `🧹 Nitpick`: tiny style, naming, wording, or formatting point. Include only when the user asks for nitpicks or the issue is unusually low-cost and helpful.

Use severity labels:

- `🔴 Critical`: likely outage, security breach, data corruption, or irreversible data loss.
- `🟠 Major`: significant functional, correctness, performance, auth, migration, or compatibility problem.
- `🟡 Minor`: real issue with limited blast radius or clear workaround.
- `🔵 Trivial`: low-impact cleanup.
- `⚪ Info`: context only; avoid as a finding unless it prevents confusion.

## Review Standards

- Lead with findings, ordered by severity and confidence.
- Write every finding in Korean, while keeping the CodeRabbit label text in English.
- Make findings actionable: include file/line, impact, and a concrete recommended fix direction.
- Cite only issues supported by the diff or nearby code. Do not speculate from missing context.
- Avoid restating what the patch changes unless it explains a risk.
- Do not block on pure preference, broad rewrites, or unrelated pre-existing code.
- Keep reviews high-signal. Prefer no finding over a weak finding.
- If tests are missing for changed behavior, mention that as residual risk or a finding only when it materially affects confidence.

## Output Format

Use this Korean structure:

```markdown
**Findings**
- [⚠️ Potential issue][🟠 Major] `path/to/file.ts:42` 짧은 제목
  영향: 무엇이 깨지는지 또는 어떤 위험이 생기는지.
  제안: 어떤 방향으로 고치면 되는지.

**잔여 리스크 / 테스트**
- 필요한 경우만 짧게 작성.
```

If there are no actionable findings:

```markdown
**Findings**
Blocking finding 없음.

**잔여 리스크 / 테스트**
- 확인하지 못한 테스트나 남는 리스크가 있으면 한두 줄로만 작성.
```

When the user asks for an inline-review style response, emit tight `::code-comment{...}` directives for actionable comments and keep the summary brief.
