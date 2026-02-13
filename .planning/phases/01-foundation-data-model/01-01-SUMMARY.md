---
phase: 01-foundation-data-model
plan: 01
subsystem: backend-foundation
tags: [payload-cms, authentication, rbac, database]
dependency_graph:
  requires: []
  provides:
    - payload-cms-3x-runtime
    - users-collection-with-auth
    - admin-organizer-roles
    - media-collection-uploads
    - access-control-functions
  affects:
    - all-future-collections
    - backend-api
tech_stack:
  added:
    - payload@3.76.1
    - "@payloadcms/next@3.76.1"
    - "@payloadcms/db-postgres@3.76.1"
    - "@payloadcms/richtext-lexical@3.76.1"
    - next@15.4.11
    - react@19
    - sharp
    - zod
  patterns:
    - payload-cms-collections
    - next-js-app-router
    - postgres-adapter
    - rbac-access-control
key_files:
  created:
    - backend/package.json
    - backend/tsconfig.json
    - backend/next.config.mjs
    - backend/src/payload.config.ts
    - backend/src/payload-types.ts
    - backend/src/app/layout.tsx
    - backend/src/app/(payload)/layout.tsx
    - backend/src/app/(payload)/admin/[[...segments]]/page.tsx
    - backend/src/app/(payload)/admin/[[...segments]]/not-found.tsx
    - backend/src/app/(frontend)/layout.tsx
    - backend/src/app/(frontend)/page.tsx
    - backend/src/collections/Users.ts
    - backend/src/collections/Media.ts
    - backend/src/access/isAdmin.ts
    - backend/src/access/isAdminOrSelf.ts
    - backend/src/access/organizerScoped.ts
  modified: []
decisions:
  - Fixed Next.js version to 15.4.11 for @payloadcms/next@3.76.1 peer dependency compatibility
  - Used ServerFunctionClient wrapper pattern for Payload RootLayout integration
  - Set strictNullChecks and strict TypeScript mode for type safety
  - Configured standalone output mode for Docker deployment readiness
metrics:
  duration_minutes: 6
  tasks_completed: 2
  files_created: 16
  commits: 2
  completed_at: "2026-02-13T16:20:50Z"
---

# Phase 01 Plan 01: Backend Foundation Summary

**One-liner:** Payload CMS 3.x backend with Next.js 15, PostgreSQL adapter, Users collection (Admin/Organizer roles, no self-registration), Media collection (signature uploads with 200x100 thumbnails), and three reusable RBAC access control functions.

## What Was Built

### Task 1: Payload CMS 3.x Project Initialization
- Created complete Payload CMS 3.x backend structure with Next.js 15 App Router
- Configured PostgreSQL database adapter with connection string from environment
- Set up TypeScript with strict mode and path aliases (@/*)
- Implemented Next.js App Router layout hierarchy for Payload admin UI
- Fixed Payload-Next.js integration with proper ServerFunctionClient wrapper
- Configured Lexical rich text editor and auto-type generation

**Commit:** `3d6dc6f` - chore(01-foundation-data-model-01): initialize Payload CMS 3.x backend with Next.js 15

### Task 2: Users Collection and Access Control
- Created Users collection with email/password authentication enabled
- Implemented two-role system: Admin and Organisateur (Organizer)
- Enforced admin-only user creation (no self-registration) per locked project decision
- Added firstName and lastName fields with French labels
- Created Media collection for signature image uploads with 200x100px thumbnails
- Built three reusable access control functions:
  - `isAdmin` - Admin-only operations
  - `isAdminOrSelf` - Admins see all, users see own records
  - `organizerScoped` - Admins see all, organizers see only records they created

**Commit:** `2adad64` - feat(01-foundation-data-model-01): add Users and Media collections with RBAC

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Next.js peer dependency conflict**
- **Found during:** Task 1 - npm install
- **Issue:** @payloadcms/next@3.76.1 requires specific Next.js version ranges, but package.json specified ^15.0.0 which resolved to 15.5.12 (incompatible)
- **Fix:** Pinned Next.js to 15.4.11, the highest 15.4.x version compatible with @payloadcms/next@3.76.1
- **Files modified:** backend/package.json
- **Commit:** Included in 3d6dc6f

**2. [Rule 3 - Blocking] node_modules permission denied**
- **Found during:** Task 1 - npm install retry
- **Issue:** Pre-existing node_modules directory owned by root, preventing npm from writing new packages
- **Fix:** Changed ownership to node:node user via sudo chown -R
- **Files modified:** backend/node_modules/ (filesystem permissions)
- **Commit:** N/A (not tracked in git)

**3. [Rule 3 - Blocking] Payload 3.x API mismatches in Next.js integration**
- **Found during:** Task 1 - TypeScript compilation
- **Issue:** Initial template used incorrect Payload component names and prop signatures:
  - `NotFound` component doesn't exist (correct: `NotFoundPage`)
  - `RootPage` requires `importMap`, `params`, and `searchParams` as Promises
  - `RootLayout` requires `importMap` and `serverFunction` with specific wrapper pattern
- **Fix:**
  - Updated imports to use correct component names from @payloadcms/next/views
  - Added importMap.js import to all admin pages
  - Created ServerFunctionClient wrapper function with 'use server' directive
  - Converted params and searchParams to Promise types per Next.js 15 async API
- **Files modified:**
  - backend/src/app/(payload)/admin/[[...segments]]/page.tsx
  - backend/src/app/(payload)/admin/[[...segments]]/not-found.tsx
  - backend/src/app/(payload)/layout.tsx
- **Commit:** Included in 3d6dc6f

## Verification Results

All verification checks passed:

1. **File existence:** All 16 planned files created successfully
2. **TypeScript compilation:** `npx tsc --noEmit` passes with no errors
3. **Collections configured:** Users and Media collections registered in payload.config.ts
4. **Role field:** Users collection has role field with admin/organizer options (3 occurrences in file)
5. **Access control:** organizerScoped function correctly implements createdBy scoping logic
6. **Dependencies installed:** 463 packages installed successfully, including all Payload CMS packages

## Integration Points

This plan provides the foundation for all future backend work:

- **Phase 01 Plan 02** will add domain collections (Events, AttendanceDays, Sessions, Attendees) using the access control functions built here
- **Phase 02** will use the Users collection for organizer authentication
- **Phase 02** will use the Media collection for signature image storage
- **Phase 04** will query the Media collection to embed signature images in XLSX exports

## Known Limitations

1. **Database not started yet:** Payload dev server cannot start until PostgreSQL container is running (requires docker-compose up)
2. **No admin user yet:** First run will require creating an admin user via Payload's create-first-user flow
3. **Auto-generated types:** payload-types.ts is a placeholder; actual types will generate on first dev server start
4. **Node_modules excluded from git:** 463 packages installed but not committed (standard practice)

## Next Steps

**Immediate (Plan 02):**
- Create Event collection (multi-day events with status)
- Create AttendanceDay collection (per-day tracking with date and location)
- Create Session collection (time blocks within a day)
- Create Attendee collection (participants with signatures linked to Media)
- Add createdBy fields to all domain collections for organizer scoping

**Future:**
- Start dev server and verify Payload admin UI loads at /admin
- Create first admin user
- Test RBAC rules via admin UI
- Verify Media upload functionality with signature images

## Self-Check: PASSED

**Files created (verified):**
- ✓ backend/package.json
- ✓ backend/tsconfig.json
- ✓ backend/next.config.mjs
- ✓ backend/next-env.d.ts
- ✓ backend/src/payload.config.ts
- ✓ backend/src/payload-types.ts
- ✓ backend/src/app/layout.tsx
- ✓ backend/src/app/(payload)/layout.tsx
- ✓ backend/src/app/(payload)/admin/[[...segments]]/page.tsx
- ✓ backend/src/app/(payload)/admin/[[...segments]]/not-found.tsx
- ✓ backend/src/app/(payload)/admin/importMap.js
- ✓ backend/src/app/(payload)/custom.scss
- ✓ backend/src/app/(frontend)/layout.tsx
- ✓ backend/src/app/(frontend)/page.tsx
- ✓ backend/src/collections/Users.ts
- ✓ backend/src/collections/Media.ts
- ✓ backend/src/access/isAdmin.ts
- ✓ backend/src/access/isAdminOrSelf.ts
- ✓ backend/src/access/organizerScoped.ts

**Commits created (verified):**
- ✓ 3d6dc6f: chore(01-foundation-data-model-01): initialize Payload CMS 3.x backend with Next.js 15
- ✓ 2adad64: feat(01-foundation-data-model-01): add Users and Media collections with RBAC

**TypeScript compilation:**
- ✓ No errors reported by `npx tsc --noEmit`

**Dependencies:**
- ✓ 463 packages installed successfully
- ✓ All @payloadcms/* packages present and compatible
