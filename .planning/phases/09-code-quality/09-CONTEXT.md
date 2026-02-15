# Phase 9: Code Quality - Context

**Gathered:** 2026-02-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Set up automated code quality tooling (ESLint, Prettier, TypeScript strictness) with strict enforcement, fix all existing violations to reach zero errors, and audit/remove unused dependencies. No structural refactoring or behavior changes — only fix what automated tools catch.

</domain>

<decisions>
## Implementation Decisions

### Scope & priorities
- Focus is on **automated checks**, not manual tech debt cleanup
- Strict enforcement — errors fail the build (no warning-only mode)
- Fix all existing violations so the codebase is clean from day one (no disable comments or overrides)
- No specific pain points identified — general quality tooling setup

### Linting & formatting
- ESLint: strict recommended config (eslint:recommended + typescript-eslint/strict + react hooks rules)
- Prettier: standard defaults (no customization)
- Formatting and linting must produce zero errors on the entire codebase after setup

### Refactoring targets
- **Automated fixes only** — only fix what ESLint/TypeScript/Prettier flag
- No discretionary refactoring, no structural changes, no pattern consolidation
- Zero risk of behavior changes — if the tool doesn't catch it, don't touch it
- Audit and remove unused dependencies from package.json

### Claude's Discretion
- Whether to enforce import ordering (auto-sort imports by group)
- Whether to add pre-commit hooks (husky + lint-staged)
- TypeScript strictness tightening (no-explicit-any, no-unsafe rules) — assess volume of 'any' usage and decide

</decisions>

<specifics>
## Specific Ideas

- User wants confidence that refactoring won't break the app — hence "automated fixes only" constraint
- The app was built across 8 rapid phases, so tooling setup should account for diverse patterns

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-code-quality*
*Context gathered: 2026-02-15*
