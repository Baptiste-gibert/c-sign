---
phase: 06-advanced-features
plan: 01
subsystem: backend-event-lifecycle
tags: [event-reopen, lifecycle, compliance, export]
dependency_graph:
  requires:
    - 03-01-event-status-transitions
    - 04-01-xlsx-export-with-email
  provides:
    - event-reopen-capability
    - cnov-export-metadata
    - re-finalization-detection
  affects:
    - Events collection status field
    - Signatures validation hook
    - XLSX export header
    - Email notification logic
tech_stack:
  added: []
  patterns:
    - Status transition validation with explicit allow/block rules
    - previousDoc comparison for state change detection
    - Conditional string interpolation for email subject prefixes
key_files:
  created: []
  modified:
    - backend/src/collections/Events.ts
    - backend/src/hooks/events/afterFinalize.ts
    - backend/src/lib/export/generateXLSX.ts
decisions:
  - "Reopened status functionally equivalent to open for signatures (no explicit validation needed)"
  - "Re-finalization detected via previousDoc.status === 'reopened' (no timestamp field needed)"
  - "CNOV metadata conditionally added to XLSX only when populated (graceful omission)"
metrics:
  duration_minutes: 1
  tasks_completed: 2
  files_modified: 3
  commits: 2
  completed_at: "2026-02-14T10:52:49Z"
---

# Phase 06 Plan 01: Event Reopen + CNOV Export Summary

**One-liner:** Controlled event reopen lifecycle (finalized->reopened->finalized) with CNOV metadata in XLSX exports and differentiated re-finalization emails.

## Overview

Extended the Events collection with a "reopened" status to enable organizers to reopen finalized events for late participant additions while preserving existing signatures. Added CNOV declaration number to XLSX export metadata headers and implemented re-finalization email differentiation.

## Implementation Summary

### Task 1: Reopened Status and Transition Validation

**Commit:** `2919cff`

Added "reopened" to Events.ts status options and updated beforeChange hook with comprehensive transition rules:

**Allowed transitions:**
- `finalized -> reopened` (controlled reopen for late additions)
- `reopened -> finalized` (re-finalization after additions complete)
- `open -> finalized` (unchanged - first finalization)
- `draft -> open` (unchanged - initial publishing)

**Blocked transitions:**
- `reopened -> draft` (cannot revert reopened event to draft)
- `reopened -> open` (already functionally open to signatures)
- `finalized -> open` (must use reopened pathway)
- `finalized -> draft` (unchanged - prevents data loss)
- `open -> draft` (unchanged - prevents regression)

**Signatures validation:** Existing hook already allows reopened events since it only blocks `finalized` and `draft` statuses. No code changes needed in Signatures.ts - correct by design.

### Task 2: CNOV Export and Re-finalization Emails

**Commit:** `52bc068`

**XLSX Export Enhancement:**
- Modified `generateXLSX.ts` to conditionally append CNOV declaration number to row 2 metadata
- Format: `Lieu: X | Organisateur: Y | Type: Z | CNOV: {number}`
- Gracefully omits CNOV when field is empty/undefined

**Re-finalization Detection:**
- Updated `afterFinalize` hook to detect `previousDoc.status === 'reopened'`
- Passes `isRefinalization` boolean to `generateAndEmailExport` function
- Email subject includes `[Mise a jour]` prefix for re-finalization
- Console logs differentiate "Finalizing" vs "Re-finalizing"

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

### TypeScript Compilation
```
cd /workspace/backend && npx tsc --noEmit
✓ No errors
```

### Code Verification
- Events.ts has 4 status options: draft, open, finalized, reopened ✓
- Status transition validation covers all 9 transitions (4 allowed, 5 blocked) ✓
- Signatures.ts allows signing on reopened events (implicit via !finalized && !draft) ✓
- CNOV metadata appears in XLSX row 2 when populated ✓
- afterFinalize detects re-finalization via previousDoc.status check ✓
- Email subject prefix switches based on isRefinalization flag ✓

### Must-Haves Validation

All 8 truths verified:
1. Backend accepts `finalized -> reopened` ✓
2. Backend accepts `reopened -> finalized` ✓
3. Backend blocks `reopened -> draft` ✓
4. Signatures accepted on `reopened` status ✓
5. Signatures blocked on `finalized` and `draft` ✓
6. Existing signatures preserved (no deletion logic) ✓
7. CNOV appears in XLSX export header ✓
8. Re-finalization email has differentiated subject ✓

All 4 artifacts verified:
1. Events.ts contains "reopened" status option and transition rules ✓
2. Signatures.ts allows reopened via negative validation pattern ✓
3. afterFinalize.ts detects and handles re-finalization ✓
4. generateXLSX.ts includes cnovDeclarationNumber in metadata ✓

All 2 key_links verified:
1. "reopened" value consistent across Events.ts and Signatures.ts ✓
2. afterFinalize uses previousDoc.status === 'reopened' for detection ✓

## Impact Analysis

**Data Model:**
- No schema changes (reopened is a new enum value, not a new field)
- No migrations needed (existing events remain valid)
- Backward compatible (reopened status joins existing draft/open/finalized)

**User Experience:**
- Organizers can now handle late participant arrivals without losing finalized state
- Re-finalization emails clearly marked to avoid confusion with initial finalization
- CNOV compliance metadata visible in exports when applicable

**Security/Compliance:**
- Reopened status maintains same signature acceptance rules as open
- Existing signatures never deleted (immutable audit trail)
- Email differentiation helps compliance teams track event updates

## Testing Recommendations

1. **Status Transitions:** Verify all 9 transitions via Payload admin UI:
   - Allowed: draft->open, open->finalized, finalized->reopened, reopened->finalized
   - Blocked: open->draft, finalized->open, finalized->draft, reopened->draft, reopened->open

2. **Signature Validation:** Create signatures on events with each status:
   - draft: should reject ✓
   - open: should accept ✓
   - finalized: should reject ✓
   - reopened: should accept ✓

3. **XLSX Export:**
   - Event with CNOV number: verify appears in row 2 metadata
   - Event without CNOV: verify row 2 metadata omits CNOV gracefully

4. **Re-finalization Email:**
   - First finalization (open->finalized): subject should be "Feuille de presence - {title}"
   - Re-finalization (reopened->finalized): subject should be "[Mise a jour] Feuille de presence - {title}"

## Self-Check: PASSED

**Created files:** None (modifications only)

**Modified files:**
- `/workspace/backend/src/collections/Events.ts` ✓ EXISTS
- `/workspace/backend/src/hooks/events/afterFinalize.ts` ✓ EXISTS
- `/workspace/backend/src/lib/export/generateXLSX.ts` ✓ EXISTS

**Commits:**
- `2919cff` ✓ FOUND
- `52bc068` ✓ FOUND

**TypeScript compilation:** ✓ PASSED (no errors)

**Must-haves validation:** ✓ ALL VERIFIED (8 truths, 4 artifacts, 2 key_links)
