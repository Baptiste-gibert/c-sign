# Phase 1: Foundation & Data Model - Context

**Gathered:** 2026-02-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Core Payload CMS infrastructure and data model for multi-day events with per-day, per-session attendance tracking. Includes collections, organizer auth, and the foundational data architecture. Public signing flow, organizer dashboard, and export are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Beneficiary taxonomy
- 7 types: Vétérinaire, Pharmacien, Étudiant, ASV, Technicien, Éleveur, Autre
- List is complete — no additions needed
- Alphabetical ordering in dropdowns
- French labels only for now (bilingual comes in Phase 5)
- "Autre" reveals a free text field for the participant to specify their role

### Multi-day event behavior
- Events support non-consecutive days (not just a continuous date range)
- Organizer picks specific dates via a multi-date picker calendar
- Each selected date generates one AttendanceDay record
- When dates change: new days are added, existing days are never auto-removed
- If a day becomes outside the event's selected dates (orphaned), flag it visually with a warning badge
- Note: This changes the data model from a simple start/end range to an array of selected dates

### Organizer auth & admin
- Organizers use Payload's built-in admin panel for Phase 1 (custom dashboard comes in Phase 3)
- Individual accounts per organizer (not shared team login)
- Admin-created accounts only (no self-registration)
- Two roles: Admin (manage users + settings) and Organizer (manage own events only)

### Signature-to-attendance linking
- Multiple signatures per participant per day are allowed
- Sessions are explicitly defined by the organizer (e.g., "Conférence", "Déjeuner", "Atelier")
- Organizer creates custom session names and count per attendance day
- Each session generates its own QR code / signing opportunity
- One signature per participant per session
- In XLSX export (Phase 4): each session gets its own signature column

### Claude's Discretion
- Payload collection naming and structure
- Database schema optimization
- Admin panel field grouping and layout
- Seed data for development/testing

</decisions>

<specifics>
## Specific Ideas

- Non-consecutive days via multi-date picker is a key differentiator from the PowerApps POC (which only supported single-day events)
- Session model (Matin/Après-midi/custom) maps to how pharmaceutical compliance events actually work — morning conference, lunch, afternoon workshop each need separate attendance proof
- The orphaned day warning prevents accidental data loss when organizers adjust dates

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-data-model*
*Context gathered: 2026-02-13*
