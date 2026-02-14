---
phase: 07-ui-design-style-guide
plan: 03
subsystem: frontend-theme-selection
tags: [theme-selector, event-form, event-detail, react-hook-form, i18n]

dependency_graph:
  requires:
    - 07-01 (BUILT_IN_THEMES, ThemeProvider, Events.theme field)
  provides:
    - ThemeSelector component (reusable theme picker)
    - Event creation theme selection
    - Event detail theme editing
    - Bilingual theme UI (FR/EN)
  affects:
    - 07-04 (public pages will consume selected themes)

tech_stack:
  added: []
  patterns:
    - React Hook Form Controller for custom component integration
    - Inline edit pattern for theme modification
    - State synchronization via useEffect
    - Built-in theme name lookup via BUILT_IN_THEMES map

key_files:
  created:
    - frontend/src/components/ThemeSelector.tsx (148 lines) — Theme picker with palette grid and custom color
  modified:
    - frontend/src/components/EventForm.tsx — ThemeSelector integration with Controller
    - frontend/src/pages/EventDetailPage.tsx — Theme card with inline edit UI
    - frontend/src/lib/schemas.ts — theme field in createEventSchema
    - frontend/src/hooks/use-events.ts — theme field in PayloadEvent type
    - frontend/src/i18n/locales/fr/organizer.json — FR translations (theme namespace + eventDetail)
    - frontend/src/i18n/locales/en/organizer.json — EN translations (theme namespace + eventDetail + eventForm)

decisions: []

metrics:
  duration_seconds: 110
  tasks_completed: 2
  files_created: 1
  files_modified: 6
  lines_added: 261
  completed_at: "2026-02-14T13:09:09Z"
---

# Phase 07 Plan 03: Organizer Theme Selection Summary

**One-liner:** Organizers can select built-in or custom themes when creating events and edit themes on existing event detail pages via integrated ThemeSelector component

## What Was Built

Complete organizer-facing theme selection workflow:

1. **ThemeSelector component** — Reusable theme picker displaying 4 built-in palettes as clickable cards + custom color input with hex validation and contrast warnings
2. **EventForm integration** — Theme selector in event creation form (between CNOV and DateSelector) using react-hook-form Controller
3. **EventDetailPage integration** — Theme card with inline edit functionality (similar to CNOV pattern) including save/cancel handlers
4. **Schema updates** — theme field in createEventSchema with optional themeId and customAccent validation
5. **Type updates** — theme field in PayloadEvent interface for proper type safety
6. **Bilingual translations** — Complete FR/EN translations for all theme-related UI text

## Architecture

```
Event Creation Flow:
  EventForm → ThemeSelector (Controller) → theme value
    ↓
  Form submit → POST /api/events → Backend Events.theme JSON

Event Editing Flow:
  EventDetailPage → load event.theme → themeValue state
    ↓
  Edit button → ThemeSelector → setThemeValue
    ↓
  Save → updateEvent({ theme: themeValue }) → PATCH /api/events/:id
```

## Implementation Details

### ThemeSelector Component (148 lines)

**Layout:**
- 2x2 grid of built-in theme cards (Tech Modern, Vibrant Purple, Nature Teal, Energy Orange)
- Each card shows accent color swatch strip + theme name
- Selected state: ring-2 with accent color
- Custom color section: native color picker + hex text input
- Preview strip showing derived colors via generateTheme()
- Contrast validation warning using validateThemeContrast()

**Props:**
```typescript
interface ThemeSelectorProps {
  value: { themeId?: string; customAccent?: string } | null
  onChange: (theme: { themeId?: string; customAccent?: string }) => void
}
```

**Default behavior:** Tech Modern highlighted when value is null (but doesn't call onChange — server handles default)

### EventForm Integration

- Position: After CNOV field, before DateSelector
- Uses react-hook-form `Controller` component (not `register()`) for custom component integration
- Default value: `theme: null`
- Automatically included in form submission payload

### EventDetailPage Integration

**State management:**
```typescript
const [editingTheme, setEditingTheme] = useState(false)
const [themeValue, setThemeValue] = useState(event?.theme || null)
```

**Sync pattern:**
```typescript
useEffect(() => {
  if (event?.theme) setThemeValue(event.theme)
  else setThemeValue(null)
}, [event?.theme])
```

**UI Card:**
- Position: After status controls, before QR codes
- Read mode: displays `currentThemeLabel` (derived from BUILT_IN_THEMES lookup or "Custom: #xxx" or "Tech Modern (default)")
- Edit mode: ThemeSelector + Save/Cancel buttons
- Edit button hidden when `isLocked` (finalized without reopen)

**Handlers:**
- `handleSaveTheme`: calls `updateEvent({ theme: themeValue })` then closes edit mode
- `handleCancelTheme`: resets themeValue from event, closes edit mode

### Schema Validation

```typescript
theme: z.object({
  themeId: z.string().optional(),
  customAccent: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
}).nullable().optional()
```

Accepts either themeId (built-in) OR customAccent (custom hex) OR null (default).

### Translation Coverage

**FR namespace `organizer`:**
- `eventForm.theme`: "Theme de la page publique"
- `eventForm.themePlaceholder`: "Selectionnez un theme"
- `eventDetail.themeTitle`: "Theme de la page publique"
- `eventDetail.editTheme`: "Modifier"
- `eventDetail.saveTheme`: "Enregistrer"
- `eventDetail.cancelTheme`: "Annuler"
- `eventDetail.defaultTheme`: "Tech Modern (par defaut)"
- `eventDetail.customTheme`: "Personnalise"
- `theme.customAccent`: "Couleur d'accent personnalisee"
- `theme.contrastWarning`: "Cette couleur pourrait ne pas respecter les exigences de contraste d'accessibilite"

**EN namespace `organizer`:** (same keys, English translations)

## Deviations from Plan

None — plan executed exactly as written.

## Verification

1. ✅ ThemeSelector component created with 4 palette cards + custom color picker
2. ✅ EventForm includes ThemeSelector controlled via react-hook-form Controller
3. ✅ EventDetailPage shows theme card with edit functionality
4. ✅ createEventSchema accepts theme field
5. ✅ Both FR and EN translations include all theme-related keys
6. ✅ All files compile without TypeScript errors

**Verification commands:**
```bash
# TypeScript compilation
cd /workspace/frontend && npx tsc --noEmit  # ✅ No errors

# Schema includes theme
grep -n "theme" frontend/src/lib/schemas.ts  # ✅ Lines 40-43

# ThemeSelector imported
grep -n "ThemeSelector" frontend/src/components/EventForm.tsx  # ✅ Line 18, 160
grep -n "ThemeSelector" frontend/src/pages/EventDetailPage.tsx  # ✅ Line 19, 435

# Translations exist
node -e "require('./frontend/src/i18n/locales/fr/organizer.json').theme.customAccent"  # ✅ FR string
node -e "require('./frontend/src/i18n/locales/en/organizer.json').theme.customAccent"  # ✅ EN string
```

## Next Steps

- **07-04:** SignPage and SuccessPage will wrap in `<ThemeProvider>` with event.theme props to apply selected themes

## Self-Check: PASSED

### Files Created
```bash
✅ frontend/src/components/ThemeSelector.tsx exists
```

### Files Modified
```bash
✅ frontend/src/components/EventForm.tsx contains ThemeSelector integration
✅ frontend/src/pages/EventDetailPage.tsx contains theme card with edit UI
✅ frontend/src/lib/schemas.ts contains theme field
✅ frontend/src/hooks/use-events.ts contains theme in PayloadEvent type
✅ frontend/src/i18n/locales/fr/organizer.json contains theme translations
✅ frontend/src/i18n/locales/en/organizer.json contains theme translations
```

### Commits
```bash
✅ 51ebb57: feat(07-03): create ThemeSelector component with palette grid and custom color picker
✅ d10de98: feat(07-03): integrate ThemeSelector in EventForm and EventDetailPage
```
