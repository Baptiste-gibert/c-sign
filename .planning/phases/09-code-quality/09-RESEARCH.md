# Phase 9: Code Quality - Research

**Researched:** 2026-02-15
**Domain:** ESLint 9 flat config, Prettier, TypeScript strict mode, automated code quality tooling
**Confidence:** HIGH

## Summary

Phase 9 focuses on establishing automated code quality tooling with strict enforcement. The project currently has minimal linting setup — ESLint 9.39.2 and TypeScript 5.9.3 are installed but there's no ESLint configuration file, no Prettier setup, and no pre-commit hooks. The codebase is relatively clean (100 TypeScript files, ~9,700 lines, zero suppression comments) with only 26 instances of explicit `any` types — a good foundation for strict enforcement.

The modern JavaScript tooling landscape (as of 2026) has shifted to ESLint 9's flat config format (.eslintrc is deprecated, will be removed in ESLint v10). Next.js 15 fully supports this via `eslint-config-next`, and TypeScript-ESLint provides stable strict presets. The standard stack is well-defined: ESLint 9 + typescript-eslint + Prettier + depcheck for dependency auditing, with optional husky/lint-staged for pre-commit enforcement.

**Primary recommendation:** Use Next.js official ESLint flat config (`eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`) combined with TypeScript-ESLint strict mode. Add Prettier with Tailwind CSS plugin and eslint-config-prettier integration. Run depcheck for dependency audit. Implement import ordering and pre-commit hooks (husky + lint-staged) for continuous enforcement.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Focus is on **automated checks**, not manual tech debt cleanup
- Strict enforcement — errors fail the build (no warning-only mode)
- Fix all existing violations so the codebase is clean from day one (no disable comments or overrides)
- **Automated fixes only** — only fix what ESLint/TypeScript/Prettier flag
- No discretionary refactoring, no structural changes, no pattern consolidation
- Zero risk of behavior changes — if the tool doesn't catch it, don't touch it
- Audit and remove unused dependencies from package.json
- ESLint: strict recommended config (eslint:recommended + typescript-eslint/strict + react hooks rules)
- Prettier: standard defaults (no customization)
- Formatting and linting must produce zero errors on the entire codebase after setup

### Claude's Discretion
- Whether to enforce import ordering (auto-sort imports by group)
- Whether to add pre-commit hooks (husky + lint-staged)
- TypeScript strictness tightening (no-explicit-any, no-unsafe rules) — assess volume of 'any' usage and decide

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| eslint | 9.x | Linting engine | ESLint 9 is current major version, flat config is default |
| typescript-eslint | 8.x | TypeScript-aware linting | Official TypeScript ESLint tooling, provides type-checked rules |
| eslint-config-next | latest | Next.js linting preset | Official Next.js ESLint config, includes React/React Hooks/Next.js rules |
| prettier | 3.x | Code formatting | Industry standard formatter, required for prettier-plugin-tailwindcss |
| prettier-plugin-tailwindcss | latest | Tailwind class sorting | Official Tailwind plugin, auto-sorts classes per recommended order |
| eslint-config-prettier | latest | Prettier/ESLint integration | Disables conflicting ESLint formatting rules |

**Current state:** Project has eslint@9.39.2 and typescript@5.9.3 installed but no configuration files.

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| eslint-plugin-simple-import-sort | latest | Import statement ordering | If choosing to enforce import sorting (Claude's discretion) |
| husky | latest | Git hooks manager | If choosing pre-commit enforcement (Claude's discretion) |
| lint-staged | latest | Run linters on staged files | Use with husky for pre-commit hooks |
| depcheck | latest | Unused dependency detection | One-time audit for Phase 9, not a runtime dependency |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| eslint-plugin-simple-import-sort | Built-in ESLint sort-imports | Built-in rule is less flexible, harder to auto-fix correctly |
| depcheck | npm-check, knip | depcheck is most widely used, knip is newer/faster but less mature |
| prettier-plugin-tailwindcss | eslint-plugin-tailwindcss | Prettier plugin is official Tailwind recommendation |

**Installation:**
```bash
cd /workspace/backend
npm install --save-dev \
  @eslint/js \
  typescript-eslint \
  eslint-config-next \
  prettier \
  prettier-plugin-tailwindcss \
  eslint-config-prettier \
  eslint-plugin-simple-import-sort \
  husky \
  lint-staged \
  depcheck
```

## Architecture Patterns

### Recommended ESLint Flat Config Structure (eslint.config.mjs)
```javascript
// Source: https://nextjs.org/docs/app/api-reference/config/eslint
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier/flat'
import simpleImportSort from 'eslint-plugin-simple-import-sort'

const eslintConfig = defineConfig([
  // ESLint base recommended rules
  ...tseslint.configs.eslintRecommended,

  // Next.js recommended rules (includes React + React Hooks)
  ...nextVitals,

  // TypeScript recommended rules
  ...nextTs,

  // TypeScript strict rules
  ...tseslint.configs.strict,

  // Import sorting (if enabled)
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },

  // Prettier integration (disables conflicting ESLint formatting rules)
  prettier,

  // Global ignores
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'node_modules/**',
  ]),
])

export default eslintConfig
```

### Prettier Configuration (.prettierrc)
```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "plugins": ["prettier-plugin-tailwindcss"],
  "tailwindStylesheet": "./src/app/globals.css"
}
```

**Note:** Tailwind CSS v4 requires specifying the CSS entry point via `tailwindStylesheet` option.

### Package.json Scripts
```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,css}\"",
    "type-check": "tsc --noEmit",
    "quality": "npm run type-check && npm run lint && npm run format:check",
    "depcheck": "depcheck"
  }
}
```

### Husky + Lint-Staged Setup (if pre-commit hooks enabled)
```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
npx lint-staged
```

**Initialization:**
```bash
npx husky init
# Edit .husky/pre-commit to add lint-staged command
```

### Anti-Patterns to Avoid
- **Mixing .eslintrc and flat config:** ESLint 9 deprecates .eslintrc — use only flat config (eslint.config.mjs)
- **Custom Prettier overrides:** User requested standard defaults, avoid customization
- **Disabling rules with comments:** User wants zero suppression comments, all violations must be fixed
- **Warning-only mode:** All rules must be 'error' level to fail the build
- **Manual dependency cleanup:** Use depcheck for automated detection

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Import ordering | Custom regex-based import sorter | eslint-plugin-simple-import-sort | Handles TypeScript path aliases (@/*), side-effects, type imports correctly |
| Dependency detection | Manual package.json audit | depcheck | Detects dynamic imports, special config files, framework-specific patterns |
| Pre-commit enforcement | Custom git hooks scripts | husky + lint-staged | Battle-tested, handles staging, partial commits, cross-platform correctly |
| Prettier/ESLint integration | Manual rule disabling | eslint-config-prettier | Maintains comprehensive list of conflicting rules |
| Tailwind class sorting | Custom Tailwind class regex | prettier-plugin-tailwindcss | Official plugin, uses Tailwind's recommended order |

**Key insight:** Code quality tooling is deceptively complex. ESLint rule interactions, TypeScript type-checking edge cases, git hook staging semantics, and Prettier parser plugins all have subtle gotchas. Established plugins have solved these problems over years of production use.

## Common Pitfalls

### Pitfall 1: ESLint 9 Flat Config Migration Errors
**What goes wrong:** Plugin redefinition errors, configuration not applying, rules not found
**Why it happens:** Mixing old .eslintrc syntax with flat config, incorrect spreading of preset arrays, plugin namespace mismatches
**How to avoid:**
- Delete any .eslintrc* files before creating eslint.config.mjs
- Spread preset arrays with `...` (e.g., `...nextVitals`, not `nextVitals`)
- Import flat config versions explicitly (e.g., `eslint-config-prettier/flat`)
**Warning signs:** ESLint errors mentioning "plugin not found", "configs must be array", rules not triggering

### Pitfall 2: TypeScript-ESLint Type-Checked Rules Breaking Build
**What goes wrong:** Linting becomes extremely slow (10-60 seconds), type errors treated as lint errors
**Why it happens:** Type-checked rules (`strict-type-checked`, `recommended-type-checked`) require TypeScript compiler integration
**How to avoid:** Use `strict` (non-type-checked) preset initially, assess performance before enabling type-checked rules
**Warning signs:** Lint time increases 10x, errors referencing tsconfig.json, "parserOptions.project" warnings

**User constraint applied:** User requested "strict recommended config" which maps to `typescript-eslint/strict`, NOT `strict-type-checked`. This avoids type-checking performance overhead.

### Pitfall 3: Depcheck False Positives
**What goes wrong:** depcheck flags actually-used dependencies as unused (common: Payload plugins, build tools, type packages)
**Why it happens:** Static analysis can't detect dynamic imports, config file references, framework injection patterns
**How to avoid:**
- Review flagged dependencies manually, don't auto-delete
- Use `--ignores` flag for known false positives (example: `--ignores="@payloadcms/*,@types/*"`)
- Check if "unused" package appears in docker-compose, Next.js config, Payload config
**Warning signs:** Depcheck flags @types/* packages, framework plugins, Vercel/deployment dependencies

**Known false positives for this project:**
- `@payloadcms/*` packages (used via Payload config, not direct imports)
- `@types/*` packages (used by TypeScript compiler, not runtime)
- `sharp` (Next.js image optimization, auto-detected)
- `cross-env` (used in package.json scripts)

### Pitfall 4: Prettier Plugin Ordering
**What goes wrong:** Prettier plugins don't apply, classes not sorted, errors about missing plugins
**Why it happens:** Prettier 3.x requires explicit plugin listing, plugin order matters, ESM-only plugins need correct imports
**How to avoid:**
- Always list prettier-plugin-tailwindcss in `plugins` array
- Ensure Prettier 3.x is installed (plugin requires it)
- Add `tailwindStylesheet` for Tailwind CSS v4 projects
**Warning signs:** Tailwind classes not sorted after formatting, "Cannot find module" errors

### Pitfall 5: Auto-fix Breaking Code (Unsafe Fixes)
**What goes wrong:** Auto-fix changes behavior (e.g., `prefer-optional-chain` changing return types, `no-unsafe-negation` changing logic)
**Why it happens:** Not all ESLint fixes are guaranteed safe; some change semantics, not just style
**How to avoid:**
- Review diffs carefully after first `--fix` run
- Test thoroughly after batch fixes
- Some typescript-eslint rules have `allowFix: false` by default for unsafe transforms
**Warning signs:** Tests failing after auto-fix, type errors appearing, runtime behavior changes

**User constraint applied:** "Zero risk of behavior changes — if the tool doesn't catch it, don't touch it." This means:
- Run fixes in isolation, review diffs
- Re-run QA tests after fixes
- If a fix looks semantically suspicious, investigate before committing

### Pitfall 6: Explicit `any` Type Proliferation
**What goes wrong:** TypeScript strict mode flags hundreds of `any` usages, overwhelming to fix
**Why it happens:** Rapid prototyping phases use `any` for speed; strict mode surfaces all at once
**How to avoid:**
- Assess volume first (run `grep -r ": any" src | wc -l`)
- If <30 instances, fix manually; if >100, consider gradual migration
- Use `@typescript-eslint/no-explicit-any` only if volume is manageable
**Warning signs:** Hundreds of lint errors on first run, impossible to reach zero errors

**Current state:** Codebase has 26 instances of `any` (mostly in hooks, event handlers, Payload callbacks). Manageable volume for strict enforcement.

### Pitfall 7: React Hooks Exhaustive Deps Auto-fix Volatility
**What goes wrong:** `exhaustive-deps` auto-fix adds dependencies, causing infinite re-render loops or unexpected re-executions
**Why it happens:** Auto-fix adds all referenced values, but some shouldn't be dependencies (refs, setState functions, stable callbacks)
**How to avoid:**
- Review `exhaustive-deps` fixes carefully
- Understand why dependency was missing (intentional vs oversight)
- Test affected components thoroughly
**Warning signs:** Infinite loops after fix, unexpected component re-renders, performance degradation

**Current state:** Codebase has 32 instances of useEffect/useMemo/useCallback. Moderate risk; requires careful review.

## Code Examples

Verified patterns from official sources:

### TypeScript Strict Mode with Explicit Types (avoid `any`)
```typescript
// Source: https://typescript-eslint.io/users/configs/
// BAD: Explicit any
interface EventFormProps {
  onSubmit: (data: any) => void  // ❌ Auto-flagged by no-explicit-any
}

// GOOD: Explicit type
import { EventFormData } from '@/lib/schemas'

interface EventFormProps {
  onSubmit: (data: EventFormData) => void  // ✅ Type-safe
}
```

### Safe Exhaustive Deps Fix Pattern
```typescript
// Source: https://react.dev/reference/eslint-plugin-react-hooks/lints/exhaustive-deps
// Original code (missing dependency)
useEffect(() => {
  fetchData(eventId)
}, []) // ❌ ESLint warning: missing eventId

// Safe fix (add dependency)
useEffect(() => {
  fetchData(eventId)
}, [eventId]) // ✅ Correct dependencies

// Exception (stable ref, no dependency needed)
const fetchRef = useRef(fetchData)
useEffect(() => {
  fetchRef.current(eventId)
}, [eventId]) // ✅ Ref is stable, not needed in deps
```

### Import Ordering Example
```typescript
// Source: https://github.com/lydell/eslint-plugin-simple-import-sort
// Auto-sorted by eslint-plugin-simple-import-sort
import { useState, useEffect } from 'react'              // 1. External (react)
import { useForm } from 'react-hook-form'                // 2. External (other)

import { Button } from '@/components/ui/button'          // 3. Internal (@/components)
import { useAuth } from '@/hooks/use-auth'               // 4. Internal (@/hooks)
import { createEventSchema } from '@/lib/schemas'        // 5. Internal (@/lib)

import type { EventFormData } from '@/lib/schemas'       // 6. Type imports (last)
```

### Depcheck Ignore Configuration
```json
// .depcheckrc
{
  "ignores": [
    "@payloadcms/*",
    "@types/*",
    "sharp",
    "cross-env",
    "tsx"
  ],
  "ignore-patterns": [
    "dist",
    "build",
    ".next",
    "node_modules"
  ]
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| .eslintrc.json config | eslint.config.mjs flat config | ESLint 9 (2024) | .eslintrc deprecated, removed in v10 |
| @typescript-eslint/parser + plugin separately | typescript-eslint unified package | typescript-eslint 8 (2024) | Simpler imports, better type inference |
| Manual plugin installation for Next.js | eslint-config-next all-in-one | Next.js 15 (2024) | Includes React, React Hooks, Next.js rules |
| Prettier 2.x (CommonJS) | Prettier 3.x (ESM-only) | Prettier 3.0 (2023) | Plugins must be ESM, breaking change |
| Tailwind class sorting via ESLint | prettier-plugin-tailwindcss | Tailwind CSS v3+ (2022) | Official recommendation, better integration |

**Deprecated/outdated:**
- `.eslintrc.json` — deprecated in ESLint 9, will be removed in ESLint v10
- `@typescript-eslint/parser` + `@typescript-eslint/eslint-plugin` separately — replaced by unified `typescript-eslint` package
- `next lint` command — removed in Next.js 16, use ESLint CLI directly
- Prettier 2.x — Prettier 3.x is current, some plugins require v3

**Current best practices (2026):**
- ESLint 9 flat config with typescript-eslint 8
- Next.js official presets via eslint-config-next
- Prettier 3.x with ESM plugins
- Pre-commit hooks via husky 9.x + lint-staged

## Open Questions

### 1. Import Sorting Enforcement (Claude's Discretion)
**What we know:**
- eslint-plugin-simple-import-sort is widely adopted, auto-fixable
- Current codebase has ~100 files, likely inconsistent import ordering
- Adds ~10-30 lines of diff per file initially, then auto-maintained

**What's unclear:**
- User priority — is import consistency worth the diff noise?
- Impact on merge conflicts during active development

**Recommendation:**
- **ENABLE** import sorting — low risk, high consistency benefit
- Auto-fix all files in Phase 9, then enforced via pre-commit
- Rationale: Automated fix means zero ongoing effort, improves readability

### 2. Pre-commit Hooks (Claude's Discretion)
**What we know:**
- husky + lint-staged is standard for enforcing quality checks
- Prevents committing code that fails linting/formatting
- Adds 1-3 seconds to commit time (only runs on staged files)

**What's unclear:**
- User workflow preference — some developers dislike pre-commit delays
- CI/CD pipeline — if CI already checks, pre-commit is redundant safety

**Recommendation:**
- **ENABLE** pre-commit hooks — enforces "zero errors" goal continuously
- Configure for fast feedback (lint + format staged files only)
- Rationale: Matches user requirement "strict enforcement, zero errors"

### 3. TypeScript Strictness Tightening (Claude's Discretion)
**What we know:**
- Current codebase has 26 instances of `any` type
- @typescript-eslint/no-explicit-any rule would flag all of them
- Volume is manageable (~0.27 per file average)

**What's unclear:**
- Are the `any` usages legitimate (Payload callbacks, untyped 3rd-party APIs) or lazy shortcuts?
- User tolerance for initial fix effort (likely 1-2 hours to type 26 instances)

**Recommendation:**
- **ENABLE** @typescript-eslint/no-explicit-any rule with 'error' severity
- Fix all 26 instances as part of Phase 9 (small scope, high value)
- Rationale: Aligns with "strict enforcement" goal, low volume means low effort

**Sample locations to fix:**
- `src/app/(payload)/api/events/[id]/export-debug/route.ts` — 3 instances
- `src/components/EventForm.tsx` — 1 instance (onSubmit prop)
- `src/hooks/use-attendance.ts`, `use-events.ts`, `use-participants.ts` — query/mutation data types
- `src/hooks/events/afterChange.ts`, `afterRead.ts` — Payload hook callback types

## Sources

### Primary (HIGH confidence)
- [typescript-eslint Shared Configs](https://typescript-eslint.io/users/configs/) — strict vs strict-type-checked presets
- [Next.js ESLint Configuration](https://nextjs.org/docs/app/api-reference/config/eslint) — official flat config setup, core-web-vitals preset
- [depcheck GitHub Repository](https://github.com/depcheck/depcheck) — usage patterns, configuration, false positives
- [Prettier Plugin Tailwind CSS](https://github.com/tailwindlabs/prettier-plugin-tailwindcss) — official Tailwind class sorting plugin

### Secondary (MEDIUM confidence)
- [ESLint 9 Flat Config Next.js Setup](https://chris.lu/web_development/tutorials/next-js-16-linting-setup-eslint-9-flat-config) — migration examples
- [typescript-eslint strict config setup](https://advancedfrontends.com/eslint-flat-config-typescript-javascript/) — modern linting guide
- [React Hooks ESLint Plugin exhaustive-deps](https://react.dev/reference/eslint-plugin-react-hooks/lints/exhaustive-deps) — official React docs
- [eslint-plugin-simple-import-sort](https://github.com/lydell/eslint-plugin-simple-import-sort) — auto-sorting patterns
- [Setting Up Husky and lint-staged in Next.js](https://www.ducxinh.com/en/techblog/setting-up-husky-and-lint-staged-in-your-nextreact-project) — pre-commit setup

### Tertiary (LOW confidence)
- [ESLint autofix safety discussions](https://github.com/eslint/eslint/issues/7873) — marked for validation, community discussion not official docs
- [TypeScript strict mode pitfalls](https://betterstack.com/community/guides/scaling-nodejs/typescript-strict-option/) — general guidance, needs project-specific verification

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Next.js and typescript-eslint official docs, Prettier is industry standard
- Architecture: HIGH — Flat config is documented, examples verified with official Next.js docs
- Pitfalls: MEDIUM-HIGH — Based on verified sources + codebase analysis, some inferred from community discussions
- Open questions: MEDIUM — Recommendations based on user constraints + best practices, final choice is Claude's discretion

**Research date:** 2026-02-15
**Valid until:** 2026-03-15 (30 days — stable domain, tooling updates are infrequent)

**Project-specific context:**
- Codebase size: 100 TypeScript files, ~9,700 lines
- Current violations: 26 explicit `any` types, 0 suppression comments, no ESLint config
- Complexity: 32 React Hooks usages (moderate exhaustive-deps risk)
- Tech stack: Next.js 15, Payload CMS 3.x, TypeScript 5.9.3, Tailwind CSS v4
