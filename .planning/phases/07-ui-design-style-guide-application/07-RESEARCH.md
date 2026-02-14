# Phase 7: UI Design & Style Guide Application - Research

**Researched:** 2026-02-14
**Domain:** Frontend theming with CSS custom properties, React Context API, Tailwind CSS v4
**Confidence:** HIGH

## Summary

This phase implements a dark-mode themed design system with per-event color customization on public-facing pages (signing page and success page). The technical foundation is already 90% in place: Tailwind CSS v4 with CSS variables, shadcn/ui components, React 19, and react-signature-canvas. The work primarily involves CSS variable definition, React Context for theme injection, a theme generation algorithm, and backend schema changes to store per-event theme selections.

The design system specification (`.claude/documentation/design-sytem-description.md`) is comprehensive and prescriptive, eliminating research uncertainty. All typography scales, spacing tokens, component specs, color formulas, and microinteraction timings are defined.

**Primary recommendation:** Implement theme system with React Context + CSS custom properties injection, add `theme` field to Events collection (JSONB for flexibility), build theme selector UI in organizer dashboard, apply theming exclusively to public pages.

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Design system reference:**
- The complete design system is defined in `.claude/documentation/design-sytem-description.md`
- Apply it exactly as specified: dark backgrounds, CSS custom properties for theming, Inter font stack, spacing tokens, component styles, microinteractions
- WCAG AA contrast ratios must be maintained across all generated themes

**Scope: public pages only:**
- **In scope:** Public signing page (`/sign/:dayId`), success/confirmation page
- **Out of scope:** Organizer dashboard, login page, event management pages — these remain unchanged
- The header with generative gradient background, the form card, and the success screen all follow the design system layouts

**Theme system: full with per-event selection:**
- Implement all 4 built-in palettes: Tech Modern (cyan), Vibrant Purple, Nature Teal, Energy Orange
- Implement the `generateTheme()` algorithm so organizers can create custom themes from any accent color
- Theme selection is **per-event**: organizer picks a theme (or custom accent color) when creating/editing an event
- The public signing page renders using the event's chosen theme
- A `theme` field (or similar) must be added to the Events collection to store the selected theme/accent per event
- Default theme (when none selected): Tech Modern (cyan)

### Claude's Discretion

- How to implement the ThemeProvider (React context, CSS variable injection)
- Organizer UI for theme selection (palette grid, color picker, preview — as long as it allows selecting built-in + custom accent)
- How the theme field is stored on the Event model (enum for built-in themes + optional accent hex, or single accent color field)
- Component refactoring approach (incremental vs rewrite of public page components)
- Whether to add the theme selector to the event creation form, event detail page, or both

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React Context API | React 19.0 (built-in) | Theme state management and provider | Native React pattern for global state, zero dependencies, universal in React theming |
| CSS Custom Properties | Native CSS | Dynamic theme token storage | Browser-native, runtime-changeable, Tailwind v4 first-class support |
| Tailwind CSS v4 | 4.0 (already installed) | CSS framework with @theme directive | Installed, CSS-first config via @theme, native CSS variable support |
| shadcn/ui | Current (already installed) | Component library | Already in use, designed for CSS variable theming |
| @fontsource/inter | Latest | Inter font self-hosting | Best practice for self-hosted Google Fonts, no external requests, versioned |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| color-contrast-checker | ^2.1.0 | WCAG contrast validation | Required: validate generated themes meet AA standards |
| react-signature-canvas | 1.0.6 (installed) | Signature capture | Already in use, no changes needed (just styling) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| React Context | Zustand (installed) | Zustand is overkill for simple theme state; Context is sufficient and has zero learning curve |
| CSS Custom Properties | Styled-components/Emotion | CSS variables are faster, smaller, native, and Tailwind v4's preferred approach |
| @fontsource/inter | Google Fonts CDN | CDN introduces external dependency, privacy concerns, no version control |
| color-contrast-checker | Manual WCAG algorithm | Contrast checking has edge cases (relative luminance formula); use battle-tested library |

**Installation:**

```bash
cd /workspace/frontend
npm install @fontsource/inter color-contrast-checker
```

## Architecture Patterns

### Recommended Project Structure

```
frontend/src/
├── config/
│   └── themes.ts              # Theme definitions + generateTheme() algorithm
├── contexts/
│   └── ThemeContext.tsx       # ThemeProvider + useTheme hook
├── components/
│   ├── ui/                    # shadcn/ui (already exists, styled via CSS vars)
│   ├── SignatureCanvas.tsx    # Update styling only (white bg, accent border)
│   ├── ThemeSelector.tsx      # Organizer UI: palette grid + color picker
│   └── PublicPageLayout.tsx   # Wrapper for public pages (header + theme injection)
├── pages/
│   ├── SignPage.tsx           # Wrap in PublicPageLayout, apply theme from event
│   └── SuccessPage.tsx        # Wrap in PublicPageLayout, apply theme from event
└── index.css                  # Update with @theme inline for custom variables
```

### Pattern 1: Theme Definition with Built-in Palettes + Generator

**What:** Define 4 built-in themes as const objects, plus `generateTheme()` function for custom accent colors.

**When to use:** This is the core of the theme system — used on both frontend (rendering) and backend (storage validation).

**Example:**

```typescript
// Source: Design system spec + Tailwind v4 patterns
// frontend/src/config/themes.ts

export interface ThemeDefinition {
  id: string
  name: string
  emoji: string
  accentHex: string  // Store original hex for re-generation
  vars: {
    '--bg': string
    '--surface': string
    '--accent': string
    '--accent-hover': string
    '--text': string
    '--text-sec': string
    '--border-c': string
    '--success': string
    '--error': string
    '--warning': string
  }
  headerBg: string  // CSS gradient string
}

function hexToHSL(hex: string): { h: number; s: number; l: number } {
  let r = parseInt(hex.slice(1, 3), 16) / 255
  let g = parseInt(hex.slice(3, 5), 16) / 255
  let b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function generateTheme(
  accentHex: string,
  name: string,
  id: string,
  emoji: string
): ThemeDefinition {
  const { h, s, l } = hexToHSL(accentHex)

  const accent = accentHex
  const accentHover = hslToHex(h, s, Math.max(l - 8, 20))
  const bg = hslToHex(h, clamp(s * 0.35, 20, 45), 6)
  const surface = hslToHex(h, clamp(s * 0.40, 20, 50), 14)
  const textSec = hslToHex(h, clamp(s * 0.50, 25, 60), 80)
  const borderC = hslToHex(h, clamp(s * 0.35, 15, 40), 24)

  const headerBg = `
    radial-gradient(ellipse 75% 55% at 35% 45%, ${accent}20, transparent 55%),
    radial-gradient(ellipse 55% 50% at 70% 30%, ${hslToHex((h + 30) % 360, s * 0.3, l * 0.3)}18, transparent 50%),
    linear-gradient(145deg, ${bg}, ${hslToHex(h, s * 0.5, 12)}, ${bg})
  `

  return {
    id,
    name,
    emoji,
    accentHex: accent,
    vars: {
      '--bg': bg,
      '--surface': surface,
      '--accent': accent,
      '--accent-hover': accentHover,
      '--text': '#ffffff',
      '--text-sec': textSec,
      '--border-c': borderC,
      '--success': '#10b981',
      '--error': '#ef4444',
      '--warning': '#f59e0b',
    },
    headerBg,
  }
}

export const BUILT_IN_THEMES: Record<string, ThemeDefinition> = {
  default: generateTheme('#00d9ff', 'Tech Modern', 'default', '⚡'),
  purple: generateTheme('#c084fc', 'Vibrant Purple', 'purple', '💜'),
  teal: generateTheme('#14b8a6', 'Nature Teal', 'teal', '🌿'),
  orange: generateTheme('#f97316', 'Energy Orange', 'orange', '🔥'),
}
```

### Pattern 2: ThemeProvider with CSS Variable Injection

**What:** React Context provider that injects theme CSS variables into a wrapper element's style attribute.

**When to use:** Wrap public pages (SignPage, SuccessPage) only — organizer dashboard stays unthemed.

**Example:**

```typescript
// Source: React Context API + Tailwind v4 CSS variable pattern
// frontend/src/contexts/ThemeContext.tsx

import { createContext, useContext, ReactNode, CSSProperties } from 'react'
import { ThemeDefinition, BUILT_IN_THEMES } from '@/config/themes'

interface ThemeContextValue {
  theme: ThemeDefinition
  setTheme: (theme: ThemeDefinition) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: ReactNode
  theme: ThemeDefinition
}

export function ThemeProvider({ children, theme }: ThemeProviderProps) {
  // Convert theme.vars to CSSProperties for inline style injection
  const cssVars = Object.entries(theme.vars).reduce((acc, [key, value]) => {
    acc[key as any] = value
    return acc
  }, {} as CSSProperties)

  return (
    <ThemeContext.Provider value={{ theme, setTheme: () => {} }}>
      <div style={cssVars} className="min-h-screen" data-theme={theme.id}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}
```

### Pattern 3: Tailwind v4 @theme inline for Custom Variables

**What:** Use `@theme inline` directive to reference custom CSS variables in Tailwind utilities.

**When to use:** Update `frontend/src/index.css` to allow utilities like `bg-[var(--accent)]`, `text-[var(--text-sec)]`.

**Example:**

```css
/* Source: Tailwind v4 official docs + shadcn/ui Tailwind v4 migration guide */
/* frontend/src/index.css */

@import "tailwindcss";
@import "@fontsource/inter/400.css";
@import "@fontsource/inter/500.css";
@import "@fontsource/inter/600.css";
@import "@fontsource/inter/700.css";

/* shadcn/ui existing variables (keep for organizer dashboard) */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    /* ... existing shadcn variables ... */
  }

  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    /* ... existing shadcn dark variables ... */
  }
}

/* Theme inline directive for custom design system variables */
@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-accent: var(--accent);
  --color-accent-hover: var(--accent-hover);
  --color-text: var(--text);
  --color-text-sec: var(--text-sec);
  --color-border-c: var(--border-c);
  --color-success: var(--success);
  --color-error: var(--error);
  --color-warning: var(--warning);
}

@layer base {
  body {
    font-family: Inter, Geist, system-ui, -apple-system, sans-serif;
  }
}
```

### Pattern 4: Backend Theme Storage (JSONB for Flexibility)

**What:** Add `theme` field to Events collection as JSONB to store either built-in theme ID or custom accent hex.

**When to use:** Event creation/edit — organizer selects theme, backend stores it, public page queries it.

**Example:**

```typescript
// Source: Payload CMS 3.x field types + design system requirements
// backend/src/collections/Events.ts

{
  name: 'theme',
  type: 'json',
  required: false,
  defaultValue: { type: 'built-in', id: 'default' },
  label: 'Theme couleur',
  admin: {
    description: 'Theme visuel pour la page publique d\'emargement',
  },
}

// Frontend usage:
// 1. Built-in theme: { type: 'built-in', id: 'purple' }
// 2. Custom theme:   { type: 'custom', accentHex: '#e63946', name: 'Rouge Corail' }
```

### Anti-Patterns to Avoid

- **Applying theme to organizer dashboard:** Scope creep — organizer pages stay with default shadcn/ui light theme
- **Hardcoding colors in components:** Always use CSS variables (`var(--accent)`) not raw hex values
- **Skipping contrast validation:** Every generated theme MUST pass WCAG AA (4.5:1 text, 3:1 UI elements)
- **Global theme state:** Theme is per-event, loaded per page-render from event data — not global Zustand store
- **Modifying existing shadcn/ui components:** Keep them generic; theming is applied via CSS variables at page level

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Color space conversion (hex → HSL) | Custom math from first principles | Implement hexToHSL/hslToHex from design system spec (verified algorithm) | Color conversion has edge cases (hue calculation, saturation at lightness extremes); use tested formulas |
| WCAG contrast validation | Manual relative luminance formula | `color-contrast-checker` npm library | WCAG formula is complex (gamma correction, relative luminance weights 0.2126/0.7152/0.0722); library handles it |
| Font loading strategy | Manual @font-face definitions | `@fontsource/inter` package | Self-hosted fonts need correct WOFF2 subsets, unicode-range, font-display; Fontsource handles it |
| Theme state management | Custom EventEmitter/pub-sub | React Context API (built-in) | Context is battle-tested, idiomatic React, zero dependencies |
| Gradient background generation | SVG patterns or external images | CSS-only gradients (radial-gradient + linear-gradient) | Design system specifies CSS-only approach; no HTTP requests, no dependencies |

**Key insight:** Theming systems have hidden complexity (color math, contrast validation, font loading). Use proven libraries for color/contrast/fonts; hand-roll only the theme definition and injection logic (where design system spec is prescriptive).

## Common Pitfalls

### Pitfall 1: CSS Variable Naming Conflicts

**What goes wrong:** Custom variables (`--accent`, `--bg`) conflict with shadcn/ui variables (`--background`, `--accent` in shadcn).

**Why it happens:** shadcn/ui uses `--accent` for its own purposes; design system also uses `--accent`.

**How to avoid:** Design system variables are scoped to public pages via ThemeProvider wrapper. Organizer dashboard uses shadcn/ui variables, public pages use design system variables. No conflict because they're on different DOM branches.

**Warning signs:** Button in organizer dashboard suddenly using wrong accent color, or public page components not picking up theme.

### Pitfall 2: Forgetting WCAG Validation on Custom Themes

**What goes wrong:** Organizer picks a pastel accent color, generated theme fails contrast ratios, text is unreadable.

**Why it happens:** `generateTheme()` algorithm doesn't automatically guarantee WCAG AA — very light or very dark accent colors can produce invalid combinations.

**How to avoid:** After calling `generateTheme()`, validate contrast ratios using `color-contrast-checker`. If validation fails, either reject the color (show error to organizer) or adjust lightness/saturation until valid.

**Warning signs:** Generated `--text-sec` on `--surface` contrast ratio < 4.5:1.

### Pitfall 3: Not Handling Missing Theme Data on Public Page

**What goes wrong:** Event created before theme field existed, public page crashes trying to read `event.theme`.

**Why it happens:** Existing events don't have `theme` field (migration issue).

**How to avoid:** Default to Tech Modern theme if `event.theme` is null/undefined. Always treat theme as optional and fallback gracefully.

**Warning signs:** TypeError: Cannot read property 'id' of undefined on SignPage.

### Pitfall 4: Applying Typography Scale Incorrectly

**What goes wrong:** H1 uses `text-2xl` (shadcn default) instead of design system's 30px/700/-0.5px letter-spacing.

**Why it happens:** Design system has specific typography tokens that don't map 1:1 to Tailwind defaults.

**How to avoid:** Create custom Tailwind utilities for design system typography (h1, h2, body, label, caption) or use inline styles with CSS variables. Document the mapping.

**Warning signs:** Event title looks too small or too light, labels compete visually with input values.

### Pitfall 5: Signature Canvas Not Updating Border Color

**What goes wrong:** Theme switches but signature canvas border stays the same color.

**Why it happens:** SignatureCanvas component has hardcoded `border-border` class instead of `border-[var(--accent)]`.

**How to avoid:** Update SignatureCanvas styling to use `border-[var(--accent)]` and `border-2` (per design system spec: 2px accent border).

**Warning signs:** All other elements respond to theme change but canvas border doesn't.

## Code Examples

Verified patterns from design system specification and Tailwind v4/shadcn/ui documentation.

### Theme Selector UI (Organizer Dashboard)

```typescript
// frontend/src/components/ThemeSelector.tsx
import { useState } from 'react'
import { BUILT_IN_THEMES, generateTheme } from '@/config/themes'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ThemeData {
  type: 'built-in' | 'custom'
  id?: string
  accentHex?: string
  name?: string
}

export function ThemeSelector({
  value,
  onChange,
}: {
  value: ThemeData
  onChange: (theme: ThemeData) => void
}) {
  const [customHex, setCustomHex] = useState('#00d9ff')

  return (
    <div className="space-y-4">
      <Label>Theme de couleur</Label>

      {/* Built-in palette grid */}
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(BUILT_IN_THEMES).map(([id, theme]) => (
          <Card
            key={id}
            className={`p-4 cursor-pointer transition-all ${
              value.type === 'built-in' && value.id === id
                ? 'ring-2 ring-primary'
                : ''
            }`}
            onClick={() => onChange({ type: 'built-in', id })}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full border-2"
                style={{ backgroundColor: theme.accentHex }}
              />
              <div>
                <div className="font-medium text-sm">
                  {theme.emoji} {theme.name}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Custom color picker */}
      <div className="pt-2 border-t">
        <Label htmlFor="custom-color">Couleur personnalisee</Label>
        <div className="flex gap-2 mt-2">
          <Input
            id="custom-color"
            type="color"
            value={customHex}
            onChange={(e) => setCustomHex(e.target.value)}
            className="w-20 h-10"
          />
          <Input
            type="text"
            value={customHex}
            onChange={(e) => setCustomHex(e.target.value)}
            placeholder="#00d9ff"
            className="flex-1"
          />
          <button
            type="button"
            onClick={() =>
              onChange({
                type: 'custom',
                accentHex: customHex,
                name: 'Personnalise',
              })
            }
            className="px-4 py-2 bg-primary text-white rounded-md"
          >
            Appliquer
          </button>
        </div>
      </div>
    </div>
  )
}
```

### Public Page Layout with Theme Injection

```typescript
// frontend/src/components/PublicPageLayout.tsx
import { ReactNode } from 'react'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ThemeDefinition, BUILT_IN_THEMES, generateTheme } from '@/config/themes'

interface PublicPageLayoutProps {
  children: ReactNode
  eventTheme?: { type: 'built-in'; id: string } | { type: 'custom'; accentHex: string; name: string }
}

export function PublicPageLayout({ children, eventTheme }: PublicPageLayoutProps) {
  // Resolve theme from event data or default
  let theme: ThemeDefinition

  if (!eventTheme || eventTheme.type === 'built-in') {
    const themeId = eventTheme?.id || 'default'
    theme = BUILT_IN_THEMES[themeId] || BUILT_IN_THEMES.default
  } else {
    // Generate custom theme on-the-fly
    theme = generateTheme(
      eventTheme.accentHex,
      eventTheme.name || 'Custom',
      'custom',
      '🎨'
    )
  }

  return (
    <ThemeProvider theme={theme}>
      {/* Header with generative gradient */}
      <header
        className="relative py-6 px-4 border-b-[1.5px]"
        style={{
          background: theme.headerBg,
          borderImage: `linear-gradient(90deg, transparent, ${theme.vars['--accent']}, transparent) 1`,
        }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[var(--surface)] border border-[var(--border-c)] flex items-center justify-center text-lg">
              🖊️
            </div>
            <h2 className="text-lg font-bold text-[var(--text)]">C-SIGN</h2>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="bg-[var(--bg)] min-h-screen text-[var(--text)]">
        {children}
      </main>
    </ThemeProvider>
  )
}
```

### Updated SignatureCanvas with Theme-Aware Styling

```typescript
// frontend/src/components/SignatureCanvas.tsx (updated lines 61-74)

return (
  <div className="space-y-2">
    <div
      className="relative w-full h-40 sm:h-48 md:h-56 rounded-md overflow-hidden"
      style={{
        border: '2px solid var(--accent)',  // Design system: 2px accent border
        backgroundColor: '#ffffff',          // Design system: white canvas background
      }}
    >
      {!hasDrawn && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-400 text-sm">
          {t('signHere')}
        </div>
      )}
      <SignatureCanvasLib
        ref={canvasRef}
        canvasProps={{
          className: 'w-full h-full touch-none cursor-crosshair',  // Design system: crosshair cursor
        }}
        backgroundColor="rgb(255, 255, 255)"
        penColor="#1a1a2e"  // Design system: stroke color
        minWidth={2.5}       // Design system: 2.5px stroke width
        maxWidth={2.5}
        onBegin={handleBegin}
      />
    </div>
    {/* Clear button styling already uses shadcn/ui Button with theme variables */}
  </div>
)
```

### WCAG Contrast Validation

```typescript
// frontend/src/lib/validateTheme.ts
import ColorContrastChecker from 'color-contrast-checker'
import { ThemeDefinition } from '@/config/themes'

const checker = new ColorContrastChecker()

export function validateThemeContrast(theme: ThemeDefinition): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // WCAG AA: Text on background (4.5:1 minimum)
  if (!checker.isLevelAA(theme.vars['--text'], theme.vars['--bg'], 14)) {
    errors.push('Text color on background fails WCAG AA (need 4.5:1)')
  }

  // WCAG AA: Text on surface (4.5:1 minimum)
  if (!checker.isLevelAA(theme.vars['--text'], theme.vars['--surface'], 14)) {
    errors.push('Text color on surface fails WCAG AA (need 4.5:1)')
  }

  // WCAG AA: Secondary text on surface (4.5:1 minimum)
  if (!checker.isLevelAA(theme.vars['--text-sec'], theme.vars['--surface'], 14)) {
    errors.push('Secondary text on surface fails WCAG AA (need 4.5:1)')
  }

  // WCAG AA: Accent on background (3:1 minimum for UI elements)
  if (!checker.isLevelAA(theme.vars['--accent'], theme.vars['--bg'], 18)) {
    errors.push('Accent color on background fails WCAG AA (need 3:1)')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind config.js | @theme directive in CSS | Tailwind v4 (Dec 2024) | Simpler setup, CSS-first config, native CSS variable exposure |
| styled-components ThemeProvider | React Context + CSS variables | 2023-2024 shift | Smaller bundle, faster runtime, no JS-in-CSS parsing |
| Manual @font-face | @fontsource packages | 2021+ | Self-hosted fonts with correct subsets, no GDPR issues |
| RGB color space | OKLCH (in Tailwind v4) | Tailwind v4 (Dec 2024) | Perceptually uniform colors, better gradient interpolation |
| Multiple @tailwind directives | Single @import "tailwindcss" | Tailwind v4 (Dec 2024) | One-line setup, no base/components/utilities separation |

**Deprecated/outdated:**
- **Tailwind config.js for theme tokens:** Replaced by `@theme` directive in CSS (v4 migration required)
- **forwardRef in React 19:** No longer needed for ref forwarding (but SignatureCanvas still uses it — refactor safe but not required)
- **RGB/HSL for color mixing:** Tailwind v4 prefers OKLCH, but design system uses HSL (acceptable, not deprecated — just not cutting-edge)

## Open Questions

1. **Should theme validation happen server-side or client-side?**
   - What we know: `color-contrast-checker` is a JS library (can run in both environments)
   - What's unclear: Where is the right place to validate (event creation form vs backend hook)?
   - Recommendation: Validate on organizer UI (immediate feedback) + backend hook (enforcement). Don't allow invalid themes to save.

2. **Do we need theme preview before saving?**
   - What we know: Design system has detailed specs, but organizer can't see final result without navigating to public page
   - What's unclear: Is a preview component in-scope for this phase?
   - Recommendation: Start without preview (organizer can test by opening public link). Add preview in future enhancement if requested.

3. **Should custom themes be saved as reusable presets?**
   - What we know: Current spec stores theme per-event only (no global preset library)
   - What's unclear: If organizer creates 5 events with same custom red theme, do they re-enter hex each time?
   - Recommendation: Store theme per-event only (YAGNI principle). If organizer needs presets, add later based on real usage patterns.

4. **How to handle theme changes on existing events with signatures?**
   - What we know: Theme is display-only, doesn't affect data integrity
   - What's unclear: Should we prevent theme changes once event is opened? Or allow freely?
   - Recommendation: Allow theme changes anytime (it's just CSS, doesn't invalidate signatures). Document this behavior.

## Sources

### Primary (HIGH confidence)

- [C-SIGN Design System v2.0](file:///workspace/.claude/documentation/design-sytem-description.md) - Complete specification (typography, spacing, components, theme algorithm, all 4 palettes)
- [Tailwind CSS v4 Official Blog](https://tailwindcss.com/blog/tailwindcss-v4) - @theme directive, CSS-first configuration, automatic CSS variables
- [shadcn/ui Tailwind v4 Migration](https://ui.shadcn.com/docs/tailwind-v4) - @theme inline pattern, CSS variable theming with shadcn/ui
- [React Context API Documentation](https://legacy.reactjs.org/docs/context.html) - createContext, useContext patterns
- [color-contrast-checker npm](https://www.npmjs.com/package/color-contrast-checker) - WCAG validation library (isLevelAA method)
- [react-signature-canvas GitHub](https://github.com/agilgur5/react-signature-canvas) - API methods, ref usage, event handlers

### Secondary (MEDIUM confidence)

- [How to Create a Themes Engine Using CSS Variables and React Context](https://www.freecodecamp.org/news/themes-using-css-variables-and-react-context/) - React Context + CSS variable injection pattern
- [Tailwind CSS v4: The Complete Guide for 2026](https://devtoolbox.dedyn.io/blog/tailwind-css-v4-complete-guide) - @theme directive usage, CSS variable setup
- [Build a Flawless, Multi-Theme System using New Tailwind CSS v4 & React](https://medium.com/render-beyond/build-a-flawless-multi-theme-ui-using-new-tailwind-css-v4-react-dca2b3c95510) - Multi-theme patterns with Tailwind v4
- [@fontsource/inter npm](https://www.npmjs.com/package/@fontsource/inter) - Self-hosted Inter font installation
- [Converting RGB, Hex and HSL Colors with JavaScript & TypeScript](https://www.jameslmilner.com/posts/converting-rgb-hex-hsl-colors/) - Color conversion algorithms
- [Theming Shadcn with Tailwind v4 and CSS Variables](https://medium.com/@joseph.goins/theming-shadcn-with-tailwind-v4-and-css-variables-d602f6b3c258) - shadcn/ui + Tailwind v4 theming pattern

### Tertiary (LOW confidence)

- None — all research verified with official sources or design system spec

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed or battle-tested standards (React Context, CSS variables, Tailwind v4)
- Architecture: HIGH - Design system spec is prescriptive, Tailwind v4 patterns documented, React Context is idiomatic
- Pitfalls: HIGH - Based on real Tailwind v4 migration experience (shadcn/ui docs) and CSS variable theming patterns
- Theme algorithm: HIGH - Exact implementation provided in design system spec with mathematical formulas
- WCAG validation: MEDIUM - Library is established but need to verify AA thresholds match design system requirements (4.5:1 text, 3:1 UI)

**Research date:** 2026-02-14
**Valid until:** 2026-03-14 (30 days - stable technologies, Tailwind v4 just released but patterns established)
