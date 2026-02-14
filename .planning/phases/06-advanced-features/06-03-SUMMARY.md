---
phase: 06-advanced-features
plan: 03
subsystem: frontend
tags:
  - cnov-input
  - event-form
  - inline-edit
  - event-detail
dependency_graph:
  requires:
    - 06-01-SUMMARY.md  # Backend CNOV support
  provides:
    - Frontend CNOV input on event creation
    - Frontend inline CNOV edit on event detail
  affects:
    - Event creation flow
    - Event detail page UX
tech_stack:
  added:
    - Zod optional string validation for cnovDeclarationNumber
  patterns:
    - Inline editing with state management
    - Conditional UI based on event lock status
    - Translation-driven placeholders
key_files:
  created: []
  modified:
    - frontend/src/lib/schemas.ts
    - frontend/src/components/EventForm.tsx
    - frontend/src/pages/EventDetailPage.tsx
    - frontend/src/i18n/locales/fr/organizer.json
    - frontend/src/i18n/locales/en/organizer.json
decisions:
  - CNOV field is optional (no validation rules beyond being a string)
  - CNOV edit controls hidden when event is finalized (isLocked)
  - Inline edit form uses compact layout with Save/Cancel buttons
  - "Add CNOV" button appears when field is empty and event not locked
metrics:
  duration: 2m
  completed: 2026-02-14
---

# Phase 06 Plan 03: CNOV Frontend Input Summary

**One-liner:** Organizers can now enter and edit CNOV declaration numbers at event creation and from the event detail page.

## Objective

Close the UAT gap where organizers had no way to set the CNOV declaration number from the frontend. The backend already supported CNOV storage and XLSX export, but the frontend had no input fields.

## What Was Built

### Task 1: Event Creation Form CNOV Input
- **Schema:** Added `cnovDeclarationNumber: z.string().optional()` to `createEventSchema()` in `frontend/src/lib/schemas.ts`
- **Form:** Added CNOV text input field in `EventForm.tsx` between expense type selector and date selector
- **Registration:** Used standard `{...register('cnovDeclarationNumber')}` pattern (not Controller — plain text input)
- **Default value:** Added `cnovDeclarationNumber: ''` to form defaultValues
- **Translations:** Added French and English labels and placeholders:
  - FR: "Numero de declaration CNOV" with placeholder "Ex: 2024-12345 (optionnel)"
  - EN: "CNOV declaration number" with placeholder "E.g.: 2024-12345 (optional)"

### Task 2: Event Detail Inline Edit
- **State management:**
  - Added `editingCnov` state (boolean) to toggle edit mode
  - Added `cnovValue` state (string) to track input value
  - Added `useEffect` to sync `cnovValue` when event data changes
- **Visual display:**
  - When CNOV exists and event not locked: displays value with small pencil edit icon
  - When CNOV empty and event not locked: displays "Add CNOV" link/button
  - When event is locked (finalized): no edit controls shown
- **Edit mode:**
  - Clicking edit/add toggles inline form with Input component (200px width)
  - Save button calls `updateEvent({ cnovDeclarationNumber: cnovValue })`
  - Cancel button resets value and exits edit mode
- **Translations:** Added FR/EN translations for addCnov, editCnov, saveCnov, cancelCnov

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

All verification criteria passed:

1. ✅ TypeScript compiles without errors (`npx tsc --noEmit`)
2. ✅ All i18n JSON files valid JSON
3. ✅ EventForm.tsx includes cnovDeclarationNumber input with register()
4. ✅ schemas.ts createEventSchema includes cnovDeclarationNumber as optional string
5. ✅ EventDetailPage.tsx has inline CNOV editing with save/cancel
6. ✅ CNOV edit controls hidden when event is locked (finalized)

## Success Criteria Met

- ✅ Organizer can enter CNOV declaration number when creating a new event (optional field)
- ✅ Organizer can add/edit CNOV on event detail page via inline edit
- ✅ CNOV flows through to display and XLSX export (existing backend support from 06-01)
- ✅ All strings bilingual (FR/EN)
- ✅ No TypeScript errors

## Integration Points

**Backend:** Uses existing `cnovDeclarationNumber` field on Events collection (added in 06-01). No backend changes needed.

**API Flow:**
- Event creation: `POST /api/events` with `cnovDeclarationNumber` in request body
- Event update: `PATCH /api/events/:id` with `cnovDeclarationNumber` in request body
- Both handled by existing `useCreateEvent` and `useUpdateEvent` hooks

**Display:** Existing EventDetailPage already showed CNOV when populated (line 196-201). This plan made that display editable.

**Export:** Existing XLSX export (04-01) already includes CNOV metadata when populated. No changes needed.

## UAT Impact

Unblocks UAT Tests 5 and 7:
- **Test 5:** Organizers can now set CNOV, making it visible on event detail page
- **Test 7:** CNOV set via frontend now flows through to XLSX export metadata

## Files Changed

| File | Lines Changed | Type |
|------|---------------|------|
| frontend/src/lib/schemas.ts | +1 | Schema field added |
| frontend/src/components/EventForm.tsx | +17 | Form input + defaultValue |
| frontend/src/pages/EventDetailPage.tsx | +58 | Inline edit UI + state |
| frontend/src/i18n/locales/fr/organizer.json | +6 | Translations |
| frontend/src/i18n/locales/en/organizer.json | +6 | Translations |

**Total:** 88 lines added across 5 files

## Commits

1. **9194b8b** - feat(06-03): add CNOV input to event creation form
2. **a2d59c1** - feat(06-03): add inline CNOV edit on event detail page

## Self-Check: PASSED

**Created files:** None expected, none created ✅

**Modified files:**
```bash
[ -f "/workspace/frontend/src/lib/schemas.ts" ] && echo "FOUND: schemas.ts" || echo "MISSING: schemas.ts"
[ -f "/workspace/frontend/src/components/EventForm.tsx" ] && echo "FOUND: EventForm.tsx" || echo "MISSING: EventForm.tsx"
[ -f "/workspace/frontend/src/pages/EventDetailPage.tsx" ] && echo "FOUND: EventDetailPage.tsx" || echo "MISSING: EventDetailPage.tsx"
[ -f "/workspace/frontend/src/i18n/locales/fr/organizer.json" ] && echo "FOUND: fr/organizer.json" || echo "MISSING: fr/organizer.json"
[ -f "/workspace/frontend/src/i18n/locales/en/organizer.json" ] && echo "FOUND: en/organizer.json" || echo "MISSING: en/organizer.json"
```

All files: FOUND ✅

**Commits:**
```bash
git log --oneline --all | grep -q "9194b8b" && echo "FOUND: 9194b8b" || echo "MISSING: 9194b8b"
git log --oneline --all | grep -q "a2d59c1" && echo "FOUND: a2d59c1" || echo "MISSING: a2d59c1"
```

All commits: FOUND ✅
