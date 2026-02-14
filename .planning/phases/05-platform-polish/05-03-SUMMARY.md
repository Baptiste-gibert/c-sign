---
phase: 05-platform-polish
plan: 03
subsystem: ui
tags: [responsive-design, tailwind, mobile-first, i18n, zod, react-hook-form]

# Dependency graph
requires:
  - phase: 05-02
    provides: "Complete i18n implementation with react-i18next, translation namespaces, and bilingual UI"
  - phase: 02-public-signature-flow
    provides: "SignatureCanvas, ParticipantForm, SignPage for public signing"
  - phase: 03-organizer-dashboard
    provides: "OrganizerLayout, DashboardPage, EventDetailPage, EventForm for organizer features"
provides:
  - "Mobile-first responsive design across all pages and components"
  - "Public signing flow optimized for smartphones (320px minimum width)"
  - "Organizer dashboard responsive on tablets and desktops with mobile fallback"
  - "Responsive signature canvas with adaptive height (h-40 on mobile, h-48 on tablet, h-56 on desktop)"
  - "Factory pattern for Zod schemas supporting reactive i18n validation messages"
affects: [06-export-download, future-mobile-features]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Mobile-first Tailwind responsive classes (unprefixed = mobile, sm: = 640px+, md: = 768px+, lg: = 1024px+)"
    - "Responsive table column hiding with hidden md:table-cell"
    - "Factory functions for Zod schemas to support i18n at validation time"
    - "useMemo for form resolvers to recreate on language change"

key-files:
  created: []
  modified:
    - frontend/src/components/SignatureCanvas.tsx
    - frontend/src/pages/SignPage.tsx
    - frontend/src/pages/SuccessPage.tsx
    - frontend/src/components/OrganizerLayout.tsx
    - frontend/src/pages/DashboardPage.tsx
    - frontend/src/pages/LoginPage.tsx
    - frontend/src/pages/EventCreatePage.tsx
    - frontend/src/pages/EventDetailPage.tsx
    - frontend/src/components/ParticipantSearch.tsx
    - frontend/src/components/ParticipantTable.tsx
    - frontend/src/lib/schemas.ts
    - frontend/src/components/EventForm.tsx
    - frontend/src/components/ParticipantForm.tsx

key-decisions:
  - "Factory pattern for Zod schemas: schemas converted to functions that evaluate i18n.t() at call time, enabling reactive validation messages"
  - "Responsive signature canvas uses h-40 sm:h-48 md:h-56 for adaptive height across devices"
  - "Table columns strategically hidden on mobile (Location, Expense Type in Dashboard; Email, Professional Number in ParticipantTable)"
  - "OrganizerLayout uses flex-wrap instead of hamburger menu for simpler mobile navigation"

patterns-established:
  - "Mobile-first responsive pattern: base styles for mobile, progressive enhancement with sm:/md:/lg: breakpoints"
  - "44px minimum touch target size for mobile interactive elements"
  - "Factory pattern for reactive Zod schemas: createSchema(i18n) called in useMemo with language dependency"

# Metrics
duration: 16min
completed: 2026-02-14
---

# Phase 05 Plan 03: Mobile Responsive + Bilingual Verification Summary

**Mobile-first responsive design across all components with factory-pattern Zod schemas for reactive i18n validation, verified end-to-end on mobile, tablet, and desktop**

## Performance

- **Duration:** 16 min
- **Started:** 2026-02-14T09:31:04Z
- **Completed:** 2026-02-14T09:46:38Z
- **Tasks:** 2 (1 auto, 1 checkpoint:human-verify)
- **Files modified:** 14

## Accomplishments

- Public signing flow fully usable on smartphones (320px minimum width)
- Organizer dashboard responsive on tablets/desktops with graceful mobile fallback
- Signature canvas adapts height based on screen size (160px mobile → 224px desktop)
- Factory pattern for Zod schemas enables reactive i18n validation messages
- All 7 human verification tests passed (language switching, mobile responsive public/organizer, signature canvas, validation messages, end-to-end bilingual flow)

## Task Commits

Each task was committed atomically:

1. **Task 1: Mobile-first responsive audit and updates** - `b4e44fd` (feat)
2. **Task 2: Human verification of bilingual + responsive experience** - checkpoint (no commit, verification only)

**Additional fix:** Zod schema factory pattern - `cb0eb4f` (fix)

_Note: Task 2 was a human verification checkpoint that required no code changes_

## Files Created/Modified

**Public Signing Flow (smartphone-optimized):**
- `frontend/src/components/SignatureCanvas.tsx` - Responsive height (h-40 sm:h-48 md:h-56)
- `frontend/src/pages/SignPage.tsx` - Tighter padding on mobile (px-3 sm:px-4), smaller title (text-xl sm:text-2xl), 44px touch targets
- `frontend/src/pages/SuccessPage.tsx` - Mobile-optimized padding
- `frontend/src/components/ParticipantForm.tsx` - Factory pattern for reactive validation

**Organizer Flow (tablet/desktop with mobile fallback):**
- `frontend/src/components/OrganizerLayout.tsx` - Flex-wrap header, smaller nav links on mobile (text-xs sm:text-sm), reduced main padding (p-3 sm:p-6)
- `frontend/src/pages/DashboardPage.tsx` - Hide Location and Expense Type columns on mobile
- `frontend/src/pages/LoginPage.tsx` - Responsive title sizing (text-3xl sm:text-4xl)
- `frontend/src/pages/EventCreatePage.tsx` - Responsive page title
- `frontend/src/pages/EventDetailPage.tsx` - Stack header vertically on mobile, grid-cols-1 for cards/forms on mobile
- `frontend/src/components/EventForm.tsx` - Factory pattern for reactive validation
- `frontend/src/components/ParticipantSearch.tsx` - Full-width popover on mobile (w-full max-w-[400px])
- `frontend/src/components/ParticipantTable.tsx` - Hide Email and Professional Number columns on mobile

**Shared Infrastructure:**
- `frontend/src/lib/schemas.ts` - Convert all Zod schemas to factory functions for i18n support

## Decisions Made

**1. Factory pattern for Zod schemas to support i18n validation messages**
- **Rationale:** Zod 3.x .min()/.email() don't accept function callbacks for error messages. Schemas must be recreated when language changes.
- **Implementation:** Convert schemas to factory functions (e.g., `createSignatureSchema(i18n)`), call in components with useMemo and language dependency
- **Impact:** Validation messages now switch language reactively without page reload
- **Committed in:** cb0eb4f (additional fix during Task 2 verification)

**2. Responsive signature canvas height using Tailwind breakpoints**
- **Rationale:** Canvas too tall on mobile (wastes vertical space), too short on desktop (poor UX)
- **Implementation:** `h-40 sm:h-48 md:h-56` (160px → 192px → 224px)
- **Impact:** Better space utilization across devices

**3. Strategic column hiding for responsive tables**
- **Rationale:** Tables overflow on mobile; hiding all columns makes them useless
- **Implementation:** Keep critical columns visible (Title, Status, Actions), hide supplementary data (Location, Expense Type)
- **Impact:** Tables remain functional on 375px screens without horizontal scroll

**4. Flex-wrap navigation instead of hamburger menu**
- **Rationale:** MVP simplicity — hamburger adds state management complexity
- **Implementation:** `flex flex-wrap` allows nav items to wrap to second line on narrow screens
- **Impact:** Simpler code, acceptable UX for organizer flow (tablet/desktop primary use case)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Factory pattern for Zod schemas to support reactive i18n validation messages**
- **Found during:** Task 2 (Human verification - testing validation messages in English)
- **Issue:** Validation messages remained in French when language switched to English. Root cause: Zod schemas defined at module load time with i18n.t() evaluated once, before language initialization. Zod 3.x .min()/.email() don't support function callbacks for error messages.
- **Fix:** Convert all Zod schemas (signatureSchema, participantSchema, eventSchema, loginSchema) to factory functions that accept i18n instance. Call factories in components with useMemo and language dependency, recreating schemas on language change. Update zodResolver calls to use memoized schemas.
- **Files modified:**
  - frontend/src/lib/schemas.ts (convert schemas to factory functions)
  - frontend/src/components/ParticipantForm.tsx (call createParticipantSchema in useMemo)
  - frontend/src/components/EventForm.tsx (call createEventSchema in useMemo)
  - frontend/src/pages/LoginPage.tsx (call createLoginSchema in useMemo)
- **Verification:** Changed language to English, triggered validation errors (empty required fields), confirmed messages display in English ("Last name is required", "Email must be valid")
- **Committed in:** cb0eb4f (separate fix commit after Task 1)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential for completing PLAT-03 requirement (bilingual validation messages). Discovered during verification, not during initial Task 1 implementation. No scope creep — validation messages are part of i18n requirement.

## Issues Encountered

None - mobile-first responsive audit executed as planned.

## Human Verification Results

All 7 tests passed:

1. **Language Switching (Desktop)** - PASSED
   - Language toggle switches all text instantly (FR ↔ EN)
   - Language persists across page reload and navigation
   - No hardcoded strings visible

2. **Public Flow Language (Desktop)** - PASSED
   - Form labels, placeholders, signature canvas text all switch language
   - Validation messages display in selected language (after factory pattern fix)

3. **Mobile Responsive - Public Flow (DevTools)** - PASSED
   - No horizontal scroll at 320px width
   - All touch targets meet 44px minimum
   - Signature canvas appropriately sized (h-40 = 160px on mobile)
   - Form fully functional on iPhone SE, iPhone 12, Galaxy S21

4. **Mobile Responsive - Organizer Flow (DevTools)** - PASSED
   - Dashboard table hides supplementary columns on mobile
   - Event detail page stacks cards vertically
   - Walk-in form switches to single column
   - Navigation wraps but remains usable

5. **Signature Canvas Mobile** - PASSED
   - Canvas responsive height works (shorter on mobile)
   - Drawing and clear functionality works in DevTools

6. **Validation Messages Bilingual** - PASSED (after factory pattern fix)
   - Required field errors display in correct language
   - Email validation messages switch with language

7. **End-to-End Bilingual Flow** - PASSED
   - Complete signing flow works in both French and English
   - Organizer dashboard fully navigable in both languages

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Phase 6 (Export/Download):**
- All Phase 5 requirements complete (PLAT-01, PLAT-02, PLAT-03)
- Mobile-first responsive design across all pages
- Complete French/English bilingual support with reactive validation
- Human verification confirms production-ready UX

**No blockers for Phase 6.**

**Pending validation:**
- iOS Safari signature canvas compatibility should be tested on real devices (not just DevTools emulation) before production launch

---
*Phase: 05-platform-polish*
*Completed: 2026-02-14*
