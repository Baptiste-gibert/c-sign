---
phase: 06-advanced-features
plan: 02
subsystem: frontend-event-lifecycle
tags: [event-reopen, ui, i18n, ux]
dependency_graph:
  requires:
    - 06-01-event-reopen-backend
    - 05-03-mobile-responsive-bilingual
  provides:
    - frontend-reopen-ui
    - cnov-display
    - optimistic-walk-in-updates
  affects:
    - EventDetailPage
    - SignPage
    - DashboardPage
    - All i18n files
tech_stack:
  added: []
  patterns:
    - Optimistic updates with rollback for walk-in participants
    - Status-based UI locking (isLocked vs isFinalized distinction)
    - Bilingual reopen flow with confirmation dialogs
key_files:
  created: []
  modified:
    - frontend/src/pages/EventDetailPage.tsx
    - frontend/src/pages/SignPage.tsx
    - frontend/src/pages/DashboardPage.tsx
    - frontend/src/hooks/use-events.ts
    - frontend/src/hooks/use-participants.ts
    - frontend/src/i18n/locales/fr/common.json
    - frontend/src/i18n/locales/en/common.json
    - frontend/src/i18n/locales/fr/organizer.json
    - frontend/src/i18n/locales/en/organizer.json
    - frontend/src/i18n/locales/fr/public.json
    - frontend/src/i18n/locales/en/public.json
decisions:
  - "isLocked variable distinguishes truly locked (finalized only) from reopened state — enables participant management when reopened"
  - "Reopened events use amber badge color to visually distinguish from finalized (blue) and open (green)"
  - "Optimistic updates for walk-in participant addition provide instant visual feedback before server response"
  - "SignPage treats reopened same as open for signing form visibility — no special messaging needed"
  - "DashboardPage StatusBadge has fallback to draft variant for unknown statuses — defensive coding"
metrics:
  duration_minutes: 3
  tasks_completed: 2
  files_modified: 11
  commits: 2
  completed_at: "2026-02-14T10:59:01Z"
---

# Phase 06 Plan 02: Frontend Reopen Flow + CNOV Display Summary

**One-liner:** Complete frontend support for event reopen lifecycle with CNOV display, optimistic walk-in UX, and bilingual translations across all user-facing components.

## Overview

Extended all frontend pages and components to support the "reopened" event status introduced in 06-01. Added UI controls for reopening finalized events, displayed CNOV declaration numbers in event headers, implemented optimistic updates for walk-in participant additions, and provided complete bilingual translations for all new strings.

## Implementation Summary

### Task 1: EventDetailPage, use-events, use-participants Updates

**Commit:** `fe1e6c1`

**PayloadEvent Type Extensions:**
- Added "reopened" to status union type (`'draft' | 'open' | 'finalized' | 'reopened'`)
- Added `cnovDeclarationNumber?: string` field for compliance metadata display

**EventDetailPage Enhancements:**
- Added "reopened" status to `statusColors` map with amber styling (`bg-amber-100 text-amber-800`)
- Implemented `handleReopen` function with bilingual confirmation dialog
- Updated `handleStatusChange` type signature to accept "reopened" status
- Added `isLocked` variable to distinguish finalized (truly locked) from reopened (participant management enabled)
- Replaced `isFinalized` with `isLocked` in:
  - ParticipantSearch `disabled` prop (line 342)
  - Walk-in button `disabled` prop (line 351)
  - ParticipantTable `isLoading` prop (line 461)
- Added CNOV number display in event header (appears after expense type badge when populated)
- Added Reopen button in finalized status block (alongside download button)
- Added reopened status block with "Re-finalize" button and status message

**Optimistic Updates for Walk-in Participants:**
- Implemented `onMutate` in `useAddWalkIn` to instantly add temporary participant to cache
- Implemented `onError` to rollback cache to previous state if mutation fails
- Implemented `onSettled` to refetch event data for consistency
- Provides instant visual feedback when organizer adds walk-in participant

### Task 2: SignPage, DashboardPage, i18n Translations

**Commit:** `afd662d`

**SignPage Changes:**
- Updated "event not open" block condition from `eventStatus !== 'open'` to `eventStatus !== 'open' && eventStatus !== 'reopened'`
- Updated session selection visibility to `(eventStatus === 'open' || eventStatus === 'reopened')`
- Updated participant form visibility to `(eventStatus === 'open' || eventStatus === 'reopened')`
- Result: Reopened events show signing form exactly like open events (no blocking message)

**DashboardPage Changes:**
- Updated `StatusBadge` component type signature to accept "reopened" status
- Added "reopened" variant to `variants` map (default variant, same as "open")
- Added fallback `|| variants.draft` for unknown status values (defensive coding)

**i18n Translation Additions:**

**French (FR):**
- `common.json`: `"reopened": "Rouvert"`
- `organizer.json`:
  - `"reopenEvent": "Rouvrir l'événement"`
  - `"reopenConfirm": "Rouvrir cet événement ? Les participants pourront à nouveau signer."`
  - `"eventReopened": "Événement rouvert - les participants peuvent signer"`
  - `"refinalizeEvent": "Finaliser à nouveau"`
  - `"cnov": "CNOV:"`
  - `"walkInSuccess": "Participant ajouté avec succès"`
- `public.json`: `"eventReopened": "Cet événement a été rouvert. Vous pouvez signer."`

**English (EN):**
- `common.json`: `"reopened": "Reopened"`
- `organizer.json`:
  - `"reopenEvent": "Reopen event"`
  - `"reopenConfirm": "Reopen this event? Participants will be able to sign again."`
  - `"eventReopened": "Event reopened - participants can sign"`
  - `"refinalizeEvent": "Finalize again"`
  - `"cnov": "CNOV:"`
  - `"walkInSuccess": "Participant added successfully"`
- `public.json`: `"eventReopened": "This event has been reopened. You can sign."`

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

### TypeScript Compilation
```
cd /workspace/frontend && npx tsc --noEmit
✓ No errors (both tasks)
```

### JSON Syntax Validation
```
All 6 i18n files validated:
✓ frontend/src/i18n/locales/fr/common.json
✓ frontend/src/i18n/locales/en/common.json
✓ frontend/src/i18n/locales/fr/organizer.json
✓ frontend/src/i18n/locales/en/organizer.json
✓ frontend/src/i18n/locales/fr/public.json
✓ frontend/src/i18n/locales/en/public.json
```

### Code Verification

**EventDetailPage.tsx:**
- ✓ statusColors includes "reopened" with amber styling
- ✓ Reopen button appears in finalized status block with confirmation
- ✓ Reopened status block shows "Re-finalize" button with status message
- ✓ CNOV number displays in header when `event.cnovDeclarationNumber` populated
- ✓ ParticipantSearch disabled when `isLocked` (not when reopened)
- ✓ Walk-in button disabled when `isLocked` (not when reopened)
- ✓ ParticipantTable isLoading when `isLocked` (not when reopened)

**use-events.ts:**
- ✓ PayloadEvent.status includes "reopened"
- ✓ PayloadEvent has `cnovDeclarationNumber?: string` field

**use-participants.ts:**
- ✓ useAddWalkIn has `onMutate` for optimistic cache update
- ✓ useAddWalkIn has `onError` for rollback to previous state
- ✓ useAddWalkIn has `onSettled` for refetch after mutation

**SignPage.tsx:**
- ✓ "reopened" status shows signing form (not blocked)
- ✓ Session selection visible for both "open" and "reopened"
- ✓ Participant form visible for both "open" and "reopened"

**DashboardPage.tsx:**
- ✓ StatusBadge type accepts "reopened"
- ✓ StatusBadge renders correct label via `t('common:status.reopened')`
- ✓ StatusBadge has fallback variant for unknown statuses

**i18n Files:**
- ✓ "reopened" key exists in both common.json files
- ✓ All 6 organizer.json keys added (FR/EN)
- ✓ eventReopened key added to both public.json files

### Must-Haves Validation

All 9 truths verified:
1. Organizer sees Reopen button when event status is finalized ✓
2. Organizer can click Reopen button to change event status from finalized to reopened ✓
3. After reopening, organizer can add walk-in participants and manage participant list ✓
4. After reopening, organizer can re-finalize event ✓
5. Reopened event status badge shows correct label (Rouvert/Reopened) with distinct color ✓
6. Public signing page allows signatures on reopened events (form visible) ✓
7. CNOV declaration number is visible on event detail page ✓
8. Walk-in participant form resets and closes dialog on success (existing behavior preserved) ✓
9. All status labels, buttons, and messages are bilingual (FR/EN) ✓

All 6 artifacts verified:
1. EventDetailPage.tsx contains "reopened" in statusColors, handleReopen, reopened block ✓
2. SignPage.tsx allows reopened for form visibility ✓
3. DashboardPage.tsx StatusBadge handles "reopened" ✓
4. use-events.ts PayloadEvent has "reopened" status and cnovDeclarationNumber ✓
5. common.json files have "Rouvert"/"Reopened" translations ✓
6. organizer/public.json files have all reopen flow translations ✓

All 3 key_links verified:
1. EventDetailPage uses `useUpdateEvent` with `status: 'reopened'` ✓
2. SignPage checks `eventStatus === 'reopened'` for form visibility ✓
3. DashboardPage StatusBadge renders `t('common:status.reopened')` ✓

## Impact Analysis

**User Experience:**
- Organizers can now reopen finalized events for late arrivals without losing existing signatures
- Walk-in participant addition provides instant visual feedback (optimistic updates)
- CNOV declaration numbers visible in event headers for compliance tracking
- All reopen flows fully bilingual with clear confirmation dialogs
- Reopened events visually distinguished with amber badge color

**UI/UX Improvements:**
- Optimistic updates reduce perceived latency for walk-in additions
- isLocked vs isFinalized distinction ensures participant management is re-enabled when event reopened
- Reopened events functionally identical to open events for signing (no friction)
- CNOV display integrates seamlessly into existing event header layout

**Data Consistency:**
- Optimistic updates include rollback on error (no stale cache state)
- onSettled ensures event cache refreshed after walk-in addition completes
- PayloadEvent type now includes all 4 statuses and CNOV field (type safety)

## Testing Recommendations

1. **Reopen Flow:**
   - Finalize event → verify Reopen button appears
   - Click Reopen → verify confirmation dialog in correct language
   - Confirm → verify status changes to "Rouvert"/"Reopened" with amber badge
   - Verify participant management re-enabled (SIMV search, walk-in button, remove buttons)

2. **Re-finalization:**
   - After reopening → verify "Finaliser à nouveau"/"Finalize again" button appears
   - Click Re-finalize → verify status changes to "Finalisé"/"Finalized"
   - Verify participant management disabled again

3. **Walk-in Optimistic Updates:**
   - Add walk-in participant → verify immediate appearance in table
   - If server fails → verify participant removed from list (rollback)
   - If server succeeds → verify participant persists with correct data

4. **CNOV Display:**
   - Event with CNOV number → verify displays in header after expense type
   - Event without CNOV → verify header shows normally (no error)

5. **Public Signing:**
   - Reopened event → scan QR code → verify signing form visible
   - Verify session selection works (if multi-session)
   - Submit signature → verify success (no blocking message)

6. **Bilingual Translations:**
   - Switch language to French → verify all labels render in French
   - Switch language to English → verify all labels render in English
   - Test: status badges, buttons, confirmation dialogs, CNOV label

7. **StatusBadge Fallback:**
   - Mock unknown status value → verify falls back to draft variant (no crash)

## Self-Check: PASSED

**Created files:** None (modifications only)

**Modified files:**
- `/workspace/frontend/src/pages/EventDetailPage.tsx` ✓ EXISTS
- `/workspace/frontend/src/pages/SignPage.tsx` ✓ EXISTS
- `/workspace/frontend/src/pages/DashboardPage.tsx` ✓ EXISTS
- `/workspace/frontend/src/hooks/use-events.ts` ✓ EXISTS
- `/workspace/frontend/src/hooks/use-participants.ts` ✓ EXISTS
- `/workspace/frontend/src/i18n/locales/fr/common.json` ✓ EXISTS
- `/workspace/frontend/src/i18n/locales/en/common.json` ✓ EXISTS
- `/workspace/frontend/src/i18n/locales/fr/organizer.json` ✓ EXISTS
- `/workspace/frontend/src/i18n/locales/en/organizer.json` ✓ EXISTS
- `/workspace/frontend/src/i18n/locales/fr/public.json` ✓ EXISTS
- `/workspace/frontend/src/i18n/locales/en/public.json` ✓ EXISTS

**Commits:**
- `fe1e6c1` ✓ FOUND
- `afd662d` ✓ FOUND

**TypeScript compilation:** ✓ PASSED (no errors)

**JSON validation:** ✓ PASSED (all 6 files valid)

**Must-haves validation:** ✓ ALL VERIFIED (9 truths, 6 artifacts, 3 key_links)
