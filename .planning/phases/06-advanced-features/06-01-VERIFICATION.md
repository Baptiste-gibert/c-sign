---
phase: 06-advanced-features
verified: 2026-02-14T11:15:00Z
status: passed
score: 8/8 must-haves verified
re_verification: false
---

# Phase 6: Advanced Features Verification Report

**Phase Goal:** Organizers can reopen finalized events, add CNOV numbers, and manage walk-in participants on-site.
**Verified:** 2026-02-14T11:15:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Backend accepts status transition from finalized to reopened | ✓ VERIFIED | Events.ts lines 163-166: explicit allow with comment "controlled reopen" |
| 2 | Backend accepts status transition from reopened to finalized (re-finalization) | ✓ VERIFIED | Events.ts lines 173-176: explicit allow with comment "re-finalization" |
| 3 | Backend blocks transition from reopened to draft | ✓ VERIFIED | Events.ts lines 178-181: throws error "Un evenement rouvert ne peut pas revenir en brouillon" |
| 4 | Signatures are accepted on events with status reopened | ✓ VERIFIED | Signatures.ts lines 70-75: only blocks 'finalized' and 'draft', 'reopened' falls through as allowed |
| 5 | Signatures are still blocked on events with status finalized or draft | ✓ VERIFIED | Signatures.ts lines 70-75: explicit checks throw errors for both statuses |
| 6 | Existing signatures are preserved when event is reopened (no deletion) | ✓ VERIFIED | No deletion logic in Events.ts hooks, signatures are independent documents linked by relationships |
| 7 | CNOV declaration number appears in XLSX export header section | ✓ VERIFIED | generateXLSX.ts lines 44-47: conditional append to metadata line "| CNOV: {number}" |
| 8 | Re-finalization email sends with updated subject line when event was previously finalized | ✓ VERIFIED | afterFinalize.ts lines 15-16, 56-62: detects previousDoc.status === 'reopened', adds "[Mise a jour]" prefix |

**Score:** 8/8 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| backend/src/collections/Events.ts | Extended status options with reopened + updated transition validation | ✓ VERIFIED | Line 59: "reopened" status option; lines 150-189: comprehensive transition validation with 4 allowed, 5 blocked transitions |
| backend/src/collections/Signatures.ts | Updated signature validation allowing reopened events | ✓ VERIFIED | Lines 70-75: negative validation pattern (only blocks finalized/draft), reopened implicitly allowed |
| backend/src/hooks/events/afterFinalize.ts | Re-finalization detection and differentiated email handling | ✓ VERIFIED | Line 16: isRefinalization = previousDoc?.status === 'reopened'; line 57: subject prefix conditional logic |
| backend/src/lib/export/generateXLSX.ts | CNOV number in XLSX export metadata | ✓ VERIFIED | Lines 44-47: conditional metadataLine append when event.cnovDeclarationNumber exists |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| Events.ts status field | Signatures.ts validation hook | "reopened" value consistency | ✓ WIRED | Both files use identical string "reopened" - grep found in both files, no typos |
| afterFinalize.ts hook | Events.ts status field | previousDoc.status comparison for re-finalization detection | ✓ WIRED | Line 16 in afterFinalize.ts: `previousDoc?.status === 'reopened'` matches Events.ts status enum value |

### Requirements Coverage

Phase 6 requirements from ROADMAP.md:

| Requirement | Status | Evidence |
|-------------|--------|----------|
| EVNT-02 (CNOV number) | ✓ SATISFIED | Events.ts line 82-85: cnovDeclarationNumber field; generateXLSX.ts lines 44-47: CNOV in export |
| EVNT-05 (reopen event) | ✓ SATISFIED | Events.ts lines 163-166: finalized->reopened transition; lines 173-176: reopened->finalized transition |
| PART-04 (walk-in participants) | ⚠️ DEFERRED | Plan 06-02 scope (frontend UI for walk-in addition) |

**Note:** Walk-in participant functionality is deferred to plan 06-02 (frontend implementation). Backend infrastructure (reopened status allowing new signatures) is in place.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | — | — | — |

**No anti-patterns detected.** All files:
- No TODO/FIXME/PLACEHOLDER comments
- No empty implementations (return null/{}/)
- No stub functions
- TypeScript compiles without errors

### Human Verification Required

#### 1. Status Transition Flow (Admin UI)

**Test:** Navigate to Payload admin UI, create an event, and test all 9 status transitions:

**Allowed (should succeed):**
1. draft → open (initial publishing)
2. open → finalized (first finalization)
3. finalized → reopened (controlled reopen)
4. reopened → finalized (re-finalization)

**Blocked (should show error message):**
1. open → draft (error: "Un evenement ouvert ne peut pas revenir en brouillon")
2. finalized → open (error: "Un evenement finalise ne peut etre que rouvert")
3. finalized → draft (error: "Un evenement finalise ne peut etre que rouvert")
4. reopened → draft (error: "Un evenement rouvert ne peut pas revenir en brouillon")
5. reopened → open (error: "Un evenement rouvert est deja ouvert aux signatures")

**Expected:** Allowed transitions succeed with status change persisted, blocked transitions show French error message and prevent status change.

**Why human:** UI interactions and error message display require visual verification. State persistence needs manual confirmation in admin panel.

#### 2. Signature Validation on Reopened Events

**Test:** 
1. Create event, add participant, publish (draft → open)
2. Have participant sign (should succeed)
3. Finalize event (open → finalized)
4. Attempt signature on finalized event (should fail with error)
5. Reopen event (finalized → reopened)
6. Attempt signature on reopened event (should succeed)
7. Verify both signatures exist (original + new one)

**Expected:** 
- Signatures succeed on open and reopened statuses
- Signatures fail on finalized and draft statuses with French error message
- Original signature from step 2 still exists after reopening (no deletion)
- Re-finalization preserves both signatures

**Why human:** Multi-step user flow requiring signature creation via public signing page, status changes via admin UI, and verification across multiple database queries.

#### 3. CNOV Number in XLSX Export

**Test:**
1. Create two events:
   - Event A: populate CNOV declaration number field
   - Event B: leave CNOV field empty
2. Finalize both events (triggers XLSX generation)
3. Download XLSX attachments from emails
4. Open both XLSX files and check row 2 metadata line

**Expected:**
- Event A row 2: `Lieu: X | Organisateur: Y | Type: Z | CNOV: {number}`
- Event B row 2: `Lieu: X | Organisateur: Y | Type: Z` (no CNOV mention)

**Why human:** Requires email delivery, XLSX file download, and visual inspection of spreadsheet cell content.

#### 4. Re-finalization Email Differentiation

**Test:**
1. Create event, publish, add participant signature, finalize (first finalization)
2. Check email received (should be sent to organizer + transparence@ceva.com)
3. Verify email subject: "Feuille de presence - {title}" (no prefix)
4. Reopen event (finalized → reopened)
5. Add another participant signature
6. Re-finalize event (reopened → finalized)
7. Check second email received
8. Verify email subject: "[Mise a jour] Feuille de presence - {title}"

**Expected:**
- First finalization email has standard subject
- Re-finalization email has "[Mise a jour]" prefix
- Both emails have XLSX attachment
- Second XLSX includes both signatures (original + new)

**Why human:** Email delivery requires SMTP configuration, subject line comparison across two emails, and attachment verification.

---

## Summary

**All 8 must-have truths verified.** Phase 06 plan 01 successfully implements:

1. **Controlled event reopen lifecycle:** finalized → reopened → finalized with comprehensive transition validation
2. **Signature validation on reopened events:** reopened status functionally equivalent to open for signature acceptance
3. **Signature preservation:** no deletion logic when events are reopened (immutable audit trail maintained)
4. **CNOV compliance metadata:** declaration number conditionally added to XLSX export headers
5. **Re-finalization email differentiation:** "[Mise a jour]" subject prefix when event transitions from reopened to finalized

**Code quality:**
- TypeScript compiles without errors
- No anti-patterns detected
- All key links wired correctly
- Status value consistency across collections

**Human verification needed for:**
- Admin UI status transition flows (9 transitions)
- Multi-step signature validation workflow
- XLSX export content inspection (CNOV presence/absence)
- Email subject differentiation (first finalization vs re-finalization)

**Deferred to 06-02:**
- Walk-in participant addition UI (frontend)
- Bilingual translations for new status labels
- SignPage/DashboardPage updates for reopened state

---

_Verified: 2026-02-14T11:15:00Z_
_Verifier: Claude (gsd-verifier)_
