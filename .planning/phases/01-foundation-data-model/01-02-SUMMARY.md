---
phase: 01-foundation-data-model
plan: 02
subsystem: domain-collections
tags: [payload-cms, data-model, relationships, hooks]
dependency_graph:
  requires:
    - payload-cms-3x-runtime
    - users-collection-with-auth
    - media-collection-uploads
    - access-control-functions
  provides:
    - events-collection
    - attendance-days-collection
    - sessions-collection
    - participants-collection
    - signatures-collection
    - auto-attendance-day-generation
    - event-date-hierarchy
  affects:
    - phase-02-public-signing-flow
    - phase-03-organizer-dashboard
    - phase-04-xlsx-export
tech_stack:
  added: []
  patterns:
    - payload-collection-relationships
    - after-change-hooks
    - conditional-field-rendering
    - duplicate-prevention-hooks
key_files:
  created:
    - backend/src/collections/Events.ts
    - backend/src/collections/AttendanceDays.ts
    - backend/src/collections/Sessions.ts
    - backend/src/collections/Participants.ts
    - backend/src/collections/Signatures.ts
    - backend/src/hooks/events/afterChange.ts
  modified:
    - backend/src/payload.config.ts
decisions:
  - Event uses selectedDates array (not date range) to support non-consecutive multi-day events
  - AttendanceDays are auto-created via afterChange hook, orphaned days preserved (never auto-deleted)
  - Seven beneficiary types in alphabetical order with French labels per locked specification
  - Conditional beneficiaryTypeOther field at top level to avoid Payload 3.x array rendering bug
  - Signature uniqueness enforced via beforeChange hook (one signature per participant per session)
  - Infinite loop prevention via req.context.preventLoop flag
metrics:
  duration_minutes: 2
  tasks_completed: 2
  files_created: 6
  files_modified: 1
  commits: 2
  completed_at: "2026-02-13T16:25:23Z"
---

# Phase 01 Plan 02: Domain Collections Summary

**One-liner:** Complete Event → AttendanceDay → Session hierarchy with Participants and Signatures collections, featuring auto-generation of AttendanceDays via afterChange hook that preserves orphaned days, alphabetically-ordered French beneficiary taxonomy with conditional "Autre" field, and signature uniqueness enforcement per participant-session pair.

## What Was Built

### Task 1: Event, AttendanceDay, and Session Collections with Auto-Generation Hook

**Collections created:**

1. **Events.ts** - Parent collection for multi-day events
   - Fields: title, location, organizerName, organizerEmail (Informations generales)
   - expenseType select with 6 French options, cnovDeclarationNumber (Classification)
   - selectedDates array field supporting non-consecutive dates (Dates)
   - attendanceDays relationship (auto-populated), createdBy relationship (Relations)
   - beforeChange hook: auto-assigns createdBy on create
   - afterChange hook: triggers auto-generation of AttendanceDays
   - Access control: organizerScoped for read/update/delete

2. **AttendanceDays.ts** - Per-day records auto-generated from Event dates
   - Fields: event relationship, date, sessions relationship
   - Access: create restricted to system (hooks only), read for authenticated users, update/delete admin-only
   - Represents a single day within a multi-day event

3. **Sessions.ts** - Custom named sessions per AttendanceDay
   - Fields: name (e.g., "Conference", "Dejeuner"), attendanceDay relationship, signatures relationship
   - Access: create/read/update for authenticated users, delete admin-only
   - Allows organizers to define time blocks with custom names

**Hook implementation:**

4. **hooks/events/afterChange.ts** - Auto-generates AttendanceDays when Event dates change
   - Infinite loop prevention via `req.context.preventLoop` flag
   - Queries existing AttendanceDays for the event
   - Creates new AttendanceDays for dates not yet tracked
   - **DOES NOT delete orphaned days** (preserved per locked decision)
   - Updates Event's attendanceDays relationship with all IDs (existing + new)

**Commit:** `53e0cc2` - feat(01-foundation-data-model-02): add Event, AttendanceDay, and Session collections with auto-generation hook

### Task 2: Participants and Signatures Collections, Config Registration

**Collections created:**

5. **Participants.ts** - Participant demographics and beneficiary classification
   - Fields: lastName, firstName, email (NOT unique), city, professionalNumber
   - beneficiaryType select with 7 options in alphabetical order:
     - ASV, Autre, Eleveur, Etudiant, Pharmacien, Technicien, Veterinaire
   - beneficiaryTypeOther conditional text field (reveals when "Autre" selected)
   - Conditional field at top level to avoid Payload 3.x rendering bug with conditions inside arrays
   - Access: create/read/update for authenticated users (Phase 2 public form will use this)

6. **Signatures.ts** - Links participant to session with signature image
   - Fields: participant relationship, session relationship, image (upload to Media), rightToImage checkbox
   - beforeChange hook: enforces uniqueness (one signature per participant per session)
   - Throws error if duplicate signature attempt detected
   - Access: create/read for authenticated users, update/delete admin-only

**Config update:**

7. **payload.config.ts** - Registered all 7 collections
   - Order: Users, Events, AttendanceDays, Sessions, Participants, Signatures, Media
   - All imports and registrations verified via TypeScript compilation

**Commit:** `63172c4` - feat(01-foundation-data-model-02): add Participants and Signatures collections, register all in config

## Deviations from Plan

None - plan executed exactly as written. All locked decisions honored:
- selectedDates as array (not range) ✓
- 7 beneficiary types, alphabetical, French ✓
- "Autre" conditional reveal ✓
- Orphaned AttendanceDays preserved ✓
- One signature per participant per session ✓
- preventLoop flag for infinite loop prevention ✓

## Verification Results

All verification checks passed:

1. **File existence:** All 5 domain collection files created + 1 hook file
2. **TypeScript compilation:** `npx tsc --noEmit` passes with no errors
3. **Collections registered:** payload.config.ts imports all 7 collections (Users, Events, AttendanceDays, Sessions, Participants, Signatures, Media)
4. **selectedDates field:** Array type confirmed in Events.ts
5. **Beneficiary types:** 7 options found, alphabetically ordered
6. **Conditional field:** beneficiaryTypeOther at top level with `condition` function
7. **No deletion logic:** afterChange hook has no delete/remove/destroy operations
8. **Infinite loop prevention:** `preventLoop` flag found in hook
9. **Signature uniqueness:** beforeChange hook checks for duplicates

## Data Model Relationships

```
Event (parent)
  ├─ selectedDates[] (array of dates)
  ├─ attendanceDays[] (relationship, auto-generated)
  └─ createdBy (User)

AttendanceDay (per-day)
  ├─ event (Event)
  ├─ date (single date)
  └─ sessions[] (relationship)

Session (time block)
  ├─ attendanceDay (AttendanceDay)
  ├─ name (custom text)
  └─ signatures[] (relationship)

Participant (person)
  ├─ personal info (name, email, city)
  ├─ beneficiaryType (select)
  └─ beneficiaryTypeOther (conditional)

Signature (attendance proof)
  ├─ participant (Participant)
  ├─ session (Session)
  ├─ image (Media upload)
  └─ rightToImage (boolean)
```

## Integration Points

This plan establishes the core data model for all future phases:

**Phase 02 (Public Signing Flow):**
- Public form will create Participant records (email not unique allows duplicates)
- Signing canvas will create Signature records linked to Media uploads
- Session selection will use Sessions collection query

**Phase 03 (Organizer Dashboard):**
- Event CRUD will use Events collection with organizerScoped access
- Session creation will populate Sessions for each AttendanceDay
- Organizer can see all their Events via createdBy relationship

**Phase 04 (XLSX Export):**
- Will query Event → AttendanceDays → Sessions → Signatures chain
- Will embed signature images from Media collection (200x100 thumbnails)
- Beneficiary types will populate taxonomy column

## Known Limitations

1. **Database not seeded:** No sample events/participants yet (will be added when backend starts)
2. **Access control simplified:** Phase 1 uses basic authenticated-user access; Phase 3 will tighten with custom dashboard scope
3. **No cascade deletion:** Deleting an Event does not cascade to AttendanceDays/Sessions (intentional preservation)
4. **Email not unique:** Same person can be created multiple times (by design - public forms create new records per submission)

## Next Steps

**Immediate (Plan 03 - if exists):**
- Start Payload dev server to test collections in admin UI
- Create sample Event with multiple dates
- Verify AttendanceDays auto-generation works
- Test conditional beneficiaryTypeOther field rendering

**Phase 02:**
- Build public signing flow that creates Participants and Signatures
- Test signature uniqueness enforcement
- Validate Media upload integration

**Phase 03:**
- Add organizer dashboard for Event management
- Test organizerScoped access control
- Implement Session creation workflow

## Self-Check: PASSED

**Files created (verified):**
- ✓ backend/src/collections/Events.ts
- ✓ backend/src/collections/AttendanceDays.ts
- ✓ backend/src/collections/Sessions.ts
- ✓ backend/src/collections/Participants.ts
- ✓ backend/src/collections/Signatures.ts
- ✓ backend/src/hooks/events/afterChange.ts

**Files modified (verified):**
- ✓ backend/src/payload.config.ts (added 5 collection imports)

**Commits created (verified):**
- ✓ 53e0cc2: feat(01-foundation-data-model-02): add Event, AttendanceDay, and Session collections with auto-generation hook
- ✓ 63172c4: feat(01-foundation-data-model-02): add Participants and Signatures collections, register all in config

**TypeScript compilation:**
- ✓ No errors reported by `npx tsc --noEmit`

**Key verification points:**
- ✓ selectedDates is array field (not date range)
- ✓ 7 beneficiary types in alphabetical order
- ✓ No deletion logic in afterChange hook
- ✓ preventLoop flag prevents infinite recursion
- ✓ Signature uniqueness enforced via beforeChange hook

**Self-Check Execution Results:**
- All 6 files created successfully
- Both commits (53e0cc2, 63172c4) verified in git log
- TypeScript compilation passes with no errors
- All verification points confirmed

## Self-Check Status: ✓ PASSED
