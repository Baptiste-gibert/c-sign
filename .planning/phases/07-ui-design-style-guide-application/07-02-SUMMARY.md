---
phase: 07-ui-design-style-guide
plan: 02
subsystem: frontend-public-pages
tags: [dark-mode, themed-ui, responsive-layout, css-custom-properties, microinteractions]

dependency_graph:
  requires:
    - 07-01 (ThemeProvider, generateTheme, BUILT_IN_THEMES)
  provides:
    - PublicPageLayout wrapper with header gradient
    - Fully themed SignPage/SuccessPage/ParticipantForm/SignatureCanvas
  affects:
    - All public-facing signature flow pages

tech_stack:
  added: []
  patterns:
    - CSS custom properties for themeable values
    - Inline styles for CSS vars (avoiding Tailwind @apply)
    - 2-col/1-col responsive grid (md breakpoint)
    - Generative gradient backgrounds
    - CSS animation keyframes

key_files:
  created:
    - frontend/src/components/PublicPageLayout.tsx (117 lines) — Shared layout with header gradient, C-SIGN branding, footer
  modified:
    - frontend/src/pages/SignPage.tsx — ThemeProvider wrapper, PublicPageLayout integration, themed cards/inputs
    - frontend/src/components/ParticipantForm.tsx — Dark card, themed inputs with accent focus, 2-col grid, design system typography
    - frontend/src/components/SignatureCanvas.tsx — White bg, 2px accent border, crosshair cursor, 2.5px stroke
    - frontend/src/pages/SuccessPage.tsx — Animated checkmark, themed layout, no card wrapper
    - frontend/src/index.css — successAppear keyframe animation

decisions: []

metrics:
  duration_seconds: 180
  tasks_completed: 2
  files_created: 1
  files_modified: 4
  lines_added: 284
  lines_removed: 184
  completed_at: "2026-02-14T21:32:00Z"
---

# Phase 07 Plan 02: Public Pages Dark-Mode Restyling Summary

**One-liner:** Dark-mode themed public signing experience with generative gradient header, responsive 2-col grid, accent-colored inputs, and animated success page

## What Was Built

Complete visual transformation of all public-facing pages using C-SIGN Design System v2.0:

1. **PublicPageLayout wrapper** — Shared layout component with:
   - Generative gradient header (from theme.headerBg)
   - C-SIGN branding (accent-colored, uppercase, tracking-widest)
   - Event title/date display (h1: 30px, date: 13px)
   - Accent line separator (horizontal gradient: transparent → accent → transparent)
   - Max-width 640px content area
   - Footer with version caption (8px, tracking-wide)

2. **SignPage theming** — Event-driven theme injection:
   - Wraps in ThemeProvider with event.theme data (themeId or customAccent)
   - Uses PublicPageLayout for header/layout structure
   - Session selection cards use --surface bg, --border-c borders, --text color
   - Loading/error states wrapped in default ThemeProvider

3. **ParticipantForm dark styling** — Complete form restyling:
   - Card: --surface bg, --border-c border (no white bg)
   - Labels: 10px uppercase, tracking 0.2px, --text-sec color
   - Inputs: h-9 (36px), --bg background, --text color, --accent focus ring
   - 2-col grid for nom/prénom and ville/n-pro (1-col mobile)
   - Select dropdown: --surface bg with themed items
   - Separator before consent (--border-c)
   - Checkbox: --accent when checked
   - Submit button: --accent bg, --bg text, h-10, opacity-70 when loading
   - Error messages: --error color (no hardcoded red-600)

4. **SignatureCanvas theming** — White canvas with accent border:
   - 2px solid --accent border (removed default border-border)
   - White background (rgb(255, 255, 255)) per design system
   - Crosshair cursor via canvasProps className
   - 2.5px consistent stroke (penColor #1a1a2e, min/max width 2.5)
   - Placeholder text: 13px, --text-sec, low opacity
   - Clear button: h-7, outline style, --border-c border, --accent text

5. **SuccessPage transformation** — Themed success screen:
   - Wraps in ThemeProvider (default theme, no event context)
   - Uses PublicPageLayout (no eventTitle/eventDate)
   - Success icon: 20x20 circle, --success border, 15% --success bg tint, 10x10 checkmark
   - Title "Merci !": 30px h1 scale, --text color
   - Message: 13px body scale, --text-sec color
   - No Card wrapper (open layout per design system)
   - "Nouvelle signature" button: outline style, --accent border/text
   - Animated entry: successAppear keyframe (500ms, cubic-bezier bounce)

6. **Animation keyframe** — Added to index.css:
   - @keyframes successAppear: opacity 0→1, scale 0.92→1
   - cubic-bezier(0.34, 1.56, 0.64, 1) for subtle bounce
   - Applied via .animate-success-appear utility class

## Architecture

### Theme Resolution Flow
```
SignPage loads event data
  ↓
event.theme: { themeId?: "tech-modern", customAccent?: "#e63946" } | null
  ↓
<ThemeProvider themeId={...} customAccent={...}>
  ↓
ThemeProvider resolves built-in/custom/default theme
  ↓
CSS custom properties injected via inline style on wrapper div
  ↓
PublicPageLayout consumes theme.headerBg for gradient
  ↓
All children use var(--bg), var(--surface), var(--accent), etc.
```

### Layout Structure
```
ThemeProvider (theme resolution + CSS vars injection)
└── PublicPageLayout (header + main + footer)
    ├── Header
    │   ├── Logo area (C-SIGN branding)
    │   ├── headerRight slot (LanguageSwitcher)
    │   ├── Event title (h1, 30px, --text)
    │   ├── Event date (p, 13px, --text-sec)
    │   └── Accent line separator
    ├── Main (max-w-640px, px-4, py-6)
    │   └── {children} (form/success content)
    └── Footer
        └── Version caption (8px, --text-sec)
```

## Implementation Details

### CSS Custom Properties Usage

Per project decision 02-01 (Tailwind v4 @apply incompatible with CSS variables), all themed values use inline `style` prop:

```tsx
// ✅ Correct pattern
<Input
  className="h-9 text-xs rounded-md"
  style={{
    backgroundColor: 'var(--bg)',
    color: 'var(--text)',
    borderColor: 'var(--border-c)'
  }}
/>

// ❌ Avoided pattern (Tailwind @apply with CSS vars)
// Would not work in Tailwind v4
```

### Responsive Grid Layout

ParticipantForm uses 2-col desktop / 1-col mobile grid:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
  <div>Nom field</div>
  <div>Prénom field</div>
</div>
```

Breakpoint: `md:` (768px) per Tailwind defaults.

### Typography Scale

All text follows Inter font scale from design system:

| Element              | Size | Weight | Tracking |
|----------------------|------|--------|----------|
| H1 (event title)     | 30px | bold   | -0.5px   |
| H2 (card title)      | 20px | bold   | -0.25px  |
| Body (inputs, text)  | 13px | normal | 0        |
| Labels               | 10px | medium | 0.2px    |
| Captions (footer)    | 8px  | normal | wide     |

### Animation Timing

successAppear keyframe uses cubic-bezier(0.34, 1.56, 0.64, 1) for subtle bounce effect:
- Duration: 500ms
- Easing: Over-shoot on entry (1.56 on second control point)
- Transform: scale(0.92) → scale(1)
- Opacity: 0 → 1

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

## Verification

### TypeScript Compilation
✅ `cd /workspace/frontend && npx tsc --noEmit` passes with no errors

### Hardcoded Colors Removed
✅ No `text-red-600` or `text-green-600` found in modified files
✅ All colors use `var(--error)`, `var(--success)`, `var(--accent)`, etc.

### Grid Layout
✅ ParticipantForm has 2-col grid at line 75 and 127 (nom/prénom, ville/n-pro)

### SignatureCanvas Styling
✅ Crosshair cursor added via canvasProps className
✅ 2px accent border applied via inline style
✅ White background: rgb(255, 255, 255)
✅ 2.5px stroke via penColor, minWidth, maxWidth props

### SuccessPage Animation
✅ successAppear keyframe in index.css @layer utilities
✅ .animate-success-appear utility class defined
✅ Applied to success content wrapper

### Theme Integration
✅ SignPage reads event.theme and passes to ThemeProvider
✅ PublicPageLayout uses theme.headerBg for gradient background
✅ All components consume CSS custom properties from ThemeProvider

## Next Steps

- **07-03:** Organizer dashboard will use ThemeSelector to configure event.theme
- **07-04:** Admin UI and organizer pages will receive similar theming treatment

## Self-Check: PASSED

### Files Created
```bash
✅ frontend/src/components/PublicPageLayout.tsx exists (117 lines)
```

### Files Modified
```bash
✅ frontend/src/pages/SignPage.tsx modified (ThemeProvider + PublicPageLayout integration)
✅ frontend/src/components/ParticipantForm.tsx modified (dark themed form)
✅ frontend/src/components/SignatureCanvas.tsx modified (accent border + crosshair)
✅ frontend/src/pages/SuccessPage.tsx modified (themed success layout)
✅ frontend/src/index.css modified (successAppear keyframe added)
```

### Commits
```bash
✅ 4060164: feat(07-02): create PublicPageLayout with themed header gradient
✅ 990cb4e: feat(07-02): restyle public pages with dark-mode design system
```

### Key Features Verified
```bash
✅ PublicPageLayout has generative gradient header (theme.headerBg)
✅ SignPage wraps in ThemeProvider with event.theme
✅ ParticipantForm uses 2-col responsive grid
✅ SignatureCanvas has 2px accent border and crosshair cursor
✅ SuccessPage has animated checkmark with --success color
✅ No hardcoded colors (all use CSS custom properties)
✅ Typography follows Inter scale (30px/20px/13px/10px/8px)
✅ Content max-width is 640px
✅ All themed colors use var(--xxx) notation
```
