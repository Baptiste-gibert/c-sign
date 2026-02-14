# Phase 7: UI Design & Style Guide Application - Context

**Gathered:** 2026-02-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Apply the C-SIGN Design System v2.0 (documented in `.claude/documentation/design-sytem-description.md`) to the public-facing pages of the application. This phase transforms the public signing page and success page into dark-mode themed experiences with per-event color customization. The organizer dashboard is NOT in scope — it stays as-is.

</domain>

<decisions>
## Implementation Decisions

### Design system reference
- The complete design system is defined in `.claude/documentation/design-sytem-description.md`
- Apply it exactly as specified: dark backgrounds, CSS custom properties for theming, Inter font stack, spacing tokens, component styles, microinteractions
- WCAG AA contrast ratios must be maintained across all generated themes

### Scope: public pages only
- **In scope:** Public signing page (`/sign/:dayId`), success/confirmation page
- **Out of scope:** Organizer dashboard, login page, event management pages — these remain unchanged
- The header with generative gradient background, the form card, and the success screen all follow the design system layouts

### Theme system: full with per-event selection
- Implement all 4 built-in palettes: Tech Modern (cyan), Vibrant Purple, Nature Teal, Energy Orange
- Implement the `generateTheme()` algorithm so organizers can create custom themes from any accent color
- Theme selection is **per-event**: organizer picks a theme (or custom accent color) when creating/editing an event
- The public signing page renders using the event's chosen theme
- A `theme` field (or similar) must be added to the Events collection to store the selected theme/accent per event
- Default theme (when none selected): Tech Modern (cyan)

### Claude's Discretion
- How to implement the ThemeProvider (React context, CSS variable injection)
- Organizer UI for theme selection (palette grid, color picker, preview — as long as it allows selecting built-in + custom accent)
- How the theme field is stored on the Event model (enum for built-in themes + optional accent hex, or single accent color field)
- Component refactoring approach (incremental vs rewrite of public page components)
- Whether to add the theme selector to the event creation form, event detail page, or both

</decisions>

<specifics>
## Specific Ideas

- The design system document includes detailed ASCII wireframes for the page layout (header with generative gradient, card-based form, mobile view, success screen) — follow these layouts
- Typography: Inter font with specific scale (h1: 30px/700, body: 13px/400, label: 10px/500, etc.)
- Microinteractions defined: focus input ring glow (200ms), submit loading (opacity 70%), success appear (scale 0.92→1 + opacity, 500ms cubic-bezier), theme switch transition (300ms)
- Signature canvas: white background, 2px accent border, crosshair cursor, stroke #1a1a2e at 2.5px
- All components use shadcn/ui as base, styled via CSS custom properties — no hardcoded colors
- Card padding responsive: px-4 pt-5 pb-5 on mobile, px-6 pt-6 pb-6 on desktop
- Grid: 2 columns on desktop (nom/prenom, ville/n° pro), single column on mobile
- Max content width: 640px

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-ui-design-style-guide-application*
*Context gathered: 2026-02-14*
