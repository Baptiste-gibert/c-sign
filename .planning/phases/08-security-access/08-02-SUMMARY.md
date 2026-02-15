---
phase: 08-security-access
plan: 02
subsystem: security
tags: [xss, sanitization, file-upload, dompurify, sharp, magic-bytes]

# Dependency graph
requires:
  - phase: 02-public-signing
    provides: Participants collection with public create access, Media collection for signature uploads
provides:
  - Server-side HTML sanitization for all participant text inputs
  - Magic byte validation for uploaded images (not just MIME type)
  - 2MB file size limit enforcement
  - Image re-encoding through Sharp to strip metadata and destroy polyglot payloads
  - PNG/JPEG-only upload policy (webp removed)
affects: [09-production-hardening, security-audits]

# Tech tracking
tech-stack:
  added: [isomorphic-dompurify, file-type (magic byte detection)]
  patterns: [beforeChange hooks for security, defense-in-depth input validation]

key-files:
  created:
    - backend/src/lib/security/sanitize.ts
  modified:
    - backend/src/collections/Participants.ts
    - backend/src/collections/Media.ts

key-decisions:
  - "DOMPurify with ALLOWED_TAGS: [] strips all HTML while preserving text content"
  - "Magic byte validation using file-type package prevents MIME type spoofing"
  - "Sharp re-encoding to PNG with compressionLevel 9 destroys polyglot payloads"
  - "Removed webp from allowed MIME types - PNG/JPEG only per security requirements"

patterns-established:
  - "beforeChange hooks on collections for server-side security validation"
  - "File upload security: magic bytes → size check → re-encoding pipeline"

# Metrics
duration: 5min
completed: 2026-02-15
---

# Phase 08 Plan 02: Input Sanitization & Upload Safety Summary

**Server-side XSS defense via DOMPurify HTML stripping and polyglot attack prevention via Sharp image re-encoding**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-15T13:44:37Z
- **Completed:** 2026-02-15T13:49:45Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- All participant text inputs (firstName, lastName, city, professionalNumber, beneficiaryTypeOther) sanitized server-side to prevent stored XSS
- Uploaded images validated by magic bytes (not just MIME type claim) to prevent file type spoofing
- 2MB file size limit enforced to prevent DoS via large uploads
- All uploaded images re-encoded through Sharp to strip EXIF metadata and destroy polyglot file attacks
- Upload policy restricted to PNG/JPEG only (webp removed)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install security packages and create sanitization utilities** - `07b2419` (chore)
2. **Task 2: Harden Participants and Media collections with security hooks** - `e5c5a22` (feat)

## Files Created/Modified
- `backend/src/lib/security/sanitize.ts` - DOMPurify-based HTML sanitization utility and Participants beforeChange hook
- `backend/src/collections/Participants.ts` - Added sanitizeParticipantInput hook to strip HTML from all text fields
- `backend/src/collections/Media.ts` - Added validateAndSanitizeUpload hook for magic byte validation, size check, and Sharp re-encoding
- `backend/package.json` - Added isomorphic-dompurify dependency (file-type already available from Payload)

## Decisions Made
- **DOMPurify configuration:** `ALLOWED_TAGS: []` with `KEEP_CONTENT: true` strips all HTML tags while preserving text content - appropriate for participant names/addresses where no formatting is needed
- **Magic byte validation:** Using `fileTypeFromBuffer` from file-type package to validate actual file content, not just MIME type claim from client
- **Sharp re-encoding strategy:** Convert all uploads to PNG with compressionLevel 9 - destroys polyglot payloads and strips EXIF/metadata while maintaining image quality
- **MIME type restriction:** Removed webp from allowed types - PNG/JPEG only per security requirements (browser support for webp not critical for signature images)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**1. isomorphic-dompurify installation issue**
- **Problem:** First `npm install isomorphic-dompurify file-type` appeared to succeed but didn't actually add isomorphic-dompurify to package.json (file-type was already present as Payload dependency)
- **Resolution:** Ran explicit `npm install --save isomorphic-dompurify` to ensure proper addition to dependencies
- **Verification:** Package now in package.json and TypeScript compilation passes

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Server-side input sanitization complete and active on all participant text fields
- Upload security pipeline (magic bytes → size → re-encoding) active on Media collection
- Ready for CSRF protection (Phase 08 Plan 03)
- Ready for rate limiting implementation (Phase 08 Plan 04)

## Self-Check: PASSED

All claims verified:
- Created file exists: backend/src/lib/security/sanitize.ts
- Task 1 commit exists: 07b2419
- Task 2 commit exists: e5c5a22

---
*Phase: 08-security-access*
*Completed: 2026-02-15*
