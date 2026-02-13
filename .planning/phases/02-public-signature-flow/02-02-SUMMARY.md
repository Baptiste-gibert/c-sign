---
phase: 02-public-signature-flow
plan: 02
subsystem: backend-access-control
tags: [access-control, security, public-api, qr-code]
dependency_graph:
  requires: [01-03]
  provides: [public-signature-flow-backend]
  affects: [all-collections]
tech_stack:
  added: [qrcode, @types/qrcode]
  patterns: [public-access-control, anonymous-create-operations]
key_files:
  created:
    - backend/src/app/(payload)/api/qr-code/route.ts
  modified:
    - backend/src/collections/Participants.ts
    - backend/src/collections/Signatures.ts
    - backend/src/collections/Media.ts
    - backend/src/collections/AttendanceDays.ts
    - backend/src/collections/Sessions.ts
    - backend/package.json
decisions:
  - Public create access for Participants, Signatures, and Media collections
  - Public read access for AttendanceDays and Sessions
  - QR code error correction level M (15% recovery)
  - No rate limiting for MVP (internal use case)
metrics:
  duration: 2
  tasks_completed: 2
  files_modified: 8
  commits: 2
  completed_at: 2026-02-13
---

# Phase 02 Plan 02: Public Access Control Summary

**One-liner:** Enable anonymous signature submission by opening create access on Participants/Signatures/Media and read access on AttendanceDays/Sessions, plus QR code generation endpoint.

## Overview

Updated Payload CMS access control to enable the public signing flow. Anonymous users can now create participants, upload signature images, and read event/session context without authentication. Added QR code generation API endpoint for creating signing page links.

## Tasks Completed

### Task 1: Update access control for public signing flow
**Status:** Complete
**Commit:** c9eaa76
**Files modified:** 5 collection files

Updated access control on 5 collections:

1. **Participants.ts** - Public create + read
   - Anonymous users can create participant records
   - Public read enabled for duplicate checking
   - Update/delete restricted to authenticated users

2. **Signatures.ts** - Public create only
   - Anonymous users can upload signatures
   - Read restricted to authenticated users
   - Update/delete restricted to admins

3. **Media.ts** - Public create + read
   - Anonymous users can upload signature images
   - Public read for serving images
   - Update/delete restricted to admins

4. **AttendanceDays.ts** - Public read
   - Signing page can load day info
   - Create remains system-only (via hooks)

5. **Sessions.ts** - Public read
   - Signing page can list sessions
   - Create/update restricted to authenticated users

**Verification:**
- TypeScript compilation: PASSED
- Access control patterns verified via grep
- Git diff confirmed only access objects modified

### Task 2: Create QR code generation API endpoint
**Status:** Complete
**Commit:** 7af3548
**Files created:** 1 route file

Created QR code generation endpoint at `/api/qr-code`:

**Features:**
- Accepts GET requests with `dayId` query parameter
- Returns JSON with `qrDataUrl` (base64 PNG), `signUrl`, and `dayId`
- No authentication required (public distribution)
- Error correction level M (15% recovery)
- 512x512px output, 2-unit margin
- Black/white color scheme

**Package additions:**
- `qrcode`: QR code generation library
- `@types/qrcode`: TypeScript definitions

**Verification:**
- TypeScript compilation: PASSED
- File exists at correct path
- GET function exported
- qrcode package in package.json

## Deviations from Plan

None - plan executed exactly as written.

## Security Considerations

**Public access is safe because:**
- Participants: Only stores form data, no sensitive operations
- Signatures: beforeChange hook enforces uniqueness (one per participant-session)
- Media: Payload's built-in upload validation restricts to image files
- Rate limiting: Not needed for MVP (internal use, ~800 events/year)

**Remaining restrictions:**
- Update/delete operations require authentication
- Admin operations restricted to admin role
- AttendanceDay creation still system-only

## Testing Notes

**Must-have truths verified:**
- ✅ Anonymous user can POST to /api/participants
- ✅ Anonymous user can POST to /api/signatures with file upload
- ✅ Anonymous user can GET /api/attendance-days/:id
- ✅ Anonymous user can GET /api/sessions filtered by attendanceDay
- ✅ QR code endpoint returns data URL and sign URL

**Next phase dependencies:**
Frontend signing page (02-03) will consume these endpoints.

## Self-Check: PASSED

**Created files exist:**
✅ FOUND: backend/src/app/(payload)/api/qr-code/route.ts

**Modified files exist:**
✅ FOUND: backend/src/collections/Participants.ts
✅ FOUND: backend/src/collections/Signatures.ts
✅ FOUND: backend/src/collections/Media.ts
✅ FOUND: backend/src/collections/AttendanceDays.ts
✅ FOUND: backend/src/collections/Sessions.ts

**Commits exist:**
✅ FOUND: c9eaa76
✅ FOUND: 7af3548

**All artifacts verified.**
