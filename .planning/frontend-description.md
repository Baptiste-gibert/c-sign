# C-SIGN Frontend Description

> For UX designer onboarding. Describes the application purpose, personas, and every view with its current behavior and user flow.

---

## What C-SIGN Does

C-SIGN is a digital attendance sheet application for **Ceva Sante Animale** (veterinary pharmaceutical company). It replaces paper sign-in sheets used at professional events — meetings, training sessions, and meals with veterinarians, pharmacists, and other health professionals.

**The core interaction:** An organizer creates an event, generates a QR code, and prints/displays it at the venue. Attendees scan the QR code on their phone, fill in their details, draw a handwritten signature, and submit. The organizer monitors signatures in real-time and later exports an XLSX compliance report with embedded signature images.

**Key constraint:** Attendees are external professionals — they have no account, no login, and no app to install. The signing experience must work instantly on any smartphone browser (iOS Safari, Android Chrome) without friction.

---

## Personas

### 1. Organizer (Authenticated)

**Who:** Internal Ceva employee from the Transparency & Market Intelligence department.
**Goal:** Create events, manage participant lists, monitor attendance in real-time, and export compliance reports.
**Device:** Desktop or tablet (occasionally mobile).
**Access:** Authenticated via email/password login.

### 2. Attendee (Anonymous)

**Who:** External professional — veterinarian, pharmacist, student, farmer, or technician.
**Goal:** Sign the attendance sheet as fast as possible so they can get back to the event.
**Device:** Personal smartphone (90%+ of the time). Scans a QR code at the venue.
**Access:** No login, no account. Arrives via QR code URL. Single-use interaction.

---

## Language

The app is fully bilingual French/English. French is the default and fallback language (Ceva is a French company, most events are in France). Every view has a language switcher. User preference is persisted in localStorage.

---

## Attendee Views (Public, No Login)

These views use a dark-mode themed design with per-event color customization. The theme (accent color, gradients, surface tones) is configured by the organizer and applied automatically when the attendee opens the link.

### View A1: Sign Page (`/sign/:dayId`)

**Entry point:** Attendee scans QR code → arrives here directly.

**Layout:**
- Dark background, max 640px content width, centered
- **Header:** Generative gradient background with "C-SIGN" branding in accent color, event title (large, 30px), event date (muted), thin accent line separator, language switcher (FR/EN toggle)
- **Content area:** Below header

**Behavior:**
1. Page loads attendance day data from backend (day + event info + sessions)
2. If event status is not "open" or "reopened": shows a status message instead of the form ("Cet evenement est finalise" / "Cet evenement n'est pas encore ouvert")
3. If multiple sessions exist for this day: shows radio button session selector (styled as dark cards)
4. If single session: auto-selects it silently
5. Renders the participant form (see View A2 below)

**Error states:**
- Loading: centered muted text on dark background
- API error: dark card with error-colored message
- No sessions configured: error message

**What's missing / UX opportunities:**
- No back button or navigation — attendee is "trapped" on this single page (by design, but could have a home link)
- No progress indicator showing form completeness
- No offline/connectivity handling — if submission fails, the error is generic
- Session selection is basic radio buttons — could benefit from better visual differentiation if events have many sessions

---

### View A2: Participant Form (Component inside Sign Page)

**Layout:** Single dark card with lighter surface background, within the 640px container.

**Fields (top to bottom):**
1. **Nom / Prenom** — side by side on desktop (2-col grid), stacked on mobile
2. **Email** — full width, email keyboard on mobile
3. **Ville / Numero professionnel** — side by side on desktop, stacked on mobile. Professional number is optional with helper text explaining it's for veterinarians/pharmacists
4. **Type de beneficiaire** — dropdown select (7 options: ASV, Autre, Eleveur, Etudiant, Pharmacien, Technicien, Veterinaire). If "Autre" selected, a text input appears below to specify
5. **Signature** — canvas area (see View A3 below)
6. **Separator line**
7. **Droit a l'image consent** — checkbox ("J'autorise l'utilisation de mon image...")
8. **Submit button** — full-width, accent-colored, shows loading state (opacity + cursor-wait)

**Typography:** Labels are 10px uppercase muted, inputs are 13px on dark background with accent focus ring, card title is 20px bold.

**Validation:** All required fields validated via Zod schema. Error messages appear below each field in error color. A global error box appears above submit if the API call fails.

**What's missing / UX opportunities:**
- No field-level success indicators (green checkmarks)
- No "save draft" — if the user accidentally navigates away, all data is lost
- No auto-fill from browser — fields don't use autocomplete attributes beyond email
- The beneficiary type dropdown requires scrolling on mobile — could benefit from a better mobile-friendly picker
- No indication of which fields are already filled when scrolling on mobile (form is long)
- Error messages appear in French or English but are not particularly user-friendly
- The form does not adapt to landscape orientation on mobile

---

### View A3: Signature Canvas (Component inside Participant Form)

**Layout:** White rectangle with 2px accent-colored border, responsive height (160px mobile, 192px tablet, 224px desktop).

**Behavior:**
- Empty state: faint "Signez ici" / "Sign here" placeholder text
- Drawing: crosshair cursor, dark stroke (#1a1a2e), consistent 2.5px width
- Clear button: small outline button below canvas ("Effacer" / "Clear")
- Canvas locks dimensions on mount to prevent iOS Safari blur/resize bugs
- Signature is captured as PNG blob on submit

**What's missing / UX opportunities:**
- No undo (only full clear)
- No visual feedback that the signature is "valid" (e.g., minimum stroke coverage)
- Canvas is relatively small on mobile — some users may struggle with detailed signatures on a 320px-wide screen
- No landscape mode prompt (landscape would give more space for signing)
- The white canvas on dark background creates a jarring contrast — intentional for readability but worth evaluating

---

### View A4: Success Page (`/success`)

**Entry point:** Automatic redirect after successful form submission.

**Layout:** Dark background, centered content, no card wrapper.

**Content:**
- Animated checkmark icon (green circle with check, scale+opacity animation ~500ms)
- "Merci, {prenom} !" or "Merci !" heading (30px bold)
- Confirmation message in muted text
- "Nouvelle signature" button (outline style, accent border) — links to home page

**What's missing / UX opportunities:**
- The "Nouvelle signature" button goes to "/" (home page), not back to the same sign page — if multiple attendees are using the same device sequentially, they'd have to re-scan the QR code
- No receipt/confirmation number displayed
- No email confirmation option
- No indication of what happens next (e.g., "Your organizer will receive your signature")
- The animation is subtle — could be more celebratory given the user just completed a compliance task

---

## Organizer Views (Authenticated, Dashboard)

These views use a standard light theme (white background, neutral tones) with shadcn/ui components. The organizer layout has a fixed header with navigation.

### View O0: Login Page (`/login`)

**Layout:** Centered card on light gray background, max 400px width.

**Content:**
- "c-sign" logo text (large, bold)
- Subtitle text
- Card with: email input, password input, error message area, submit button with loading spinner
- Auto-redirects to dashboard if already authenticated

**What's missing / UX opportunities:**
- No "forgot password" flow
- No visual branding beyond "c-sign" text — no logo, no company reference
- No "remember me" option
- Error message is generic ("Identifiants invalides") — doesn't distinguish between wrong email and wrong password
- No password visibility toggle

---

### View O1: Organizer Layout (Shared Shell)

**Layout:** Full-width header + content area.

**Header:**
- Left: "c-sign" logo link, nav links ("Evenements", "Nouvel evenement")
- Right: User name display, language switcher, logout button
- Max 1280px content width, light gray background

**What's missing / UX opportunities:**
- No breadcrumb navigation
- No notification indicator (e.g., new signatures received)
- No user avatar/initials
- Navigation is flat — only 2 links. As the app grows, this will need restructuring
- No mobile hamburger menu — links wrap on small screens but could overflow

---

### View O2: Dashboard Page (`/dashboard`)

**Entry point:** After login, or via "Evenements" nav link.

**Layout:** Header with "Mes evenements" title + "Nouvel evenement" button. Below: events table.

**Table columns:** Title (link to detail), Location (hidden on mobile), Dates, Expense Type (hidden on mobile), Status (badge), Actions ("Voir" button).

**Empty state:** Centered message with "Creer votre premier evenement" button.

**Status badges:** draft (gray), open (green), finalized (blue outline), reopened (amber).

**What's missing / UX opportunities:**
- No search or filter — with 800+ events/year, this will become unusable quickly
- No pagination — all events load at once
- No sorting by column (clicking headers does nothing)
- No date range filter (e.g., "this month", "this year")
- No quick-action buttons (e.g., quick-open, quick-finalize from the list)
- No event count or summary stats
- No visual distinction between recent and old events
- No "last activity" or "signatures count" column
- Table is the only view — no card/grid view option for quick scanning

---

### View O3: Event Create Page (`/events/new`)

**Entry point:** "Nouvel evenement" button from dashboard.

**Layout:** Back arrow + "Nouvel evenement" title. Below: form (max 672px width).

**Form fields (top to bottom):**
1. **Titre** — text input
2. **Lieu** — text input
3. **Nom de l'organisateur** — pre-filled from logged-in user's name
4. **Email de l'organisateur** — pre-filled from logged-in user's email
5. **Type de depense** — dropdown (6 options: Hospitalite-collation, Hospitalite-restauration, Hospitalite-hebergement, Frais d'inscription, Frais de reunion/organisation, Frais de transport)
6. **Numero de declaration CNOV** — optional text input with placeholder "Ex: 2024-12345"
7. **Theme de la page publique** — theme selector (see View O3a below)
8. **Dates de l'evenement** — calendar date picker (click to select multiple dates)
9. **Submit button** — full width, shows loading state

**After creation:** Redirects to event detail page.

**What's missing / UX opportunities:**
- No event template/duplication feature (organizers often create similar events)
- No preview of how the public signing page will look with the selected theme
- Date selector has no visual feedback for date range vs. individual dates — the current design is "click individual dates" which is tedious for multi-day events
- No "draft and continue later" — form must be completed in one session
- Form validation only shows on submit attempt, not inline as user types
- Organizer name/email pre-fill is helpful but not visually distinguished from editable fields
- No indication of which fields are required vs. optional

---

### View O3a: Theme Selector (Component inside Event Form and Event Detail)

**Layout:** Embedded in the form, not a separate page.

**Content:**
- **2x2 grid of built-in palettes:** 4 cards, each with accent color swatch (h-8) + theme name below. Click to select. Selected state: ring highlight + slight scale. Cards: Tech Modern (cyan), Vibrant Purple, Nature Teal, Energy Orange.
- **Custom color section** (below, separated by line): native color picker (40x40) + hex text input side by side. Active state shows "Personnalise" label.
- **Contrast warning:** appears in amber when custom color fails WCAG AA validation
- **Preview strip:** 4-color bar showing bg/surface/accent/text-sec derived from custom color

**Default:** Tech Modern is visually indicated as default (slight opacity) when no theme is explicitly selected.

**What's missing / UX opportunities:**
- No live preview of the full signing page with selected theme
- The 4 built-in themes have generic names — could benefit from contextual names (e.g., "Corporate Blue", "Warm Reception")
- No way to preview how the theme looks on mobile vs. desktop
- The custom color picker is basic — no opacity, no gradient, just a single hex
- Contrast validation only triggers for custom colors, not for edge cases in built-in themes
- The preview strip is very small and abstract — hard to judge the overall feel

---

### View O4: Event Detail Page (`/events/:id`)

**Entry point:** Click event title from dashboard, or redirect after creation.

**Layout:** Back button + event header + vertical stack of card sections.

**Header section:**
- Event title (large, bold)
- Metadata row: location, organizer name, expense type badge, CNOV number (with inline edit pencil icon), dates
- Status badge (colored: gray/green/blue/amber)
- CNOV inline edit: click pencil → input + save/cancel buttons appear inline

**Card sections (top to bottom):**

1. **Status Controls Card**
   - Shows contextual action buttons based on current status:
     - Draft → "Ouvrir l'evenement" button
     - Open → "Finaliser l'evenement" button
     - Finalized → "Rouvrir" button + "Telecharger XLSX" button + "Evenement finalise" message
     - Reopened → "Re-finaliser" button + "Evenement rouvert" message
   - Status change shows loading spinner
   - Error messages appear with dismiss button
   - Finalize requires browser confirm() dialog

2. **Theme Card**
   - Shows current theme name (e.g., "Vibrant Purple" or "Custom: #e91e8c")
   - Edit button → expands ThemeSelector + save/cancel buttons
   - Hidden when event is finalized (locked)

3. **QR Codes Card**
   - One QR code button per attendance day
   - Click opens modal dialog with large QR code (256px), scan prompt text, and raw URL
   - Date label on each button

4. **Participants Card**
   - **SIMV search:** Popover with command palette — type to search mock registry by name or registration number. Results show name + number + city. Click to add.
   - **Walk-in button:** Expands inline form with all participant fields (name, email, city, professional number, beneficiary type) + add/cancel buttons
   - **Participant table:** Sortable columns (name, email, city, beneficiary type, professional number, remove action). Remove shows confirm dialog. Email and professional number hidden on mobile.
   - Participant count displayed above table
   - Search and walk-in disabled when event is finalized (locked)

5. **Attendance Dashboard Card**
   - Draft events: shows "Ouvrez l'evenement pour voir les presences" message
   - Open/reopened events: shows real-time attendance with auto-refresh indicator (green pulsing dot)
   - Grouped by attendance day → sessions
   - Per session: progress bar (green fill), count (X/Y present), list of signed participants with checkmark + name + "Signe" label + timestamp
   - Empty sessions show clock icon + "Aucune signature" message

**What's missing / UX opportunities:**
- The page is very long — 5 card sections stacked vertically. No tab navigation or collapsible sections
- QR codes are behind click → modal. For a time-pressured organizer at a venue, this adds friction. Could have a "print all QR codes" one-click action
- No way to download QR code as image (only shown in modal)
- Attendance dashboard has no export/print option independent of finalization
- Walk-in form is hidden behind a button expansion — could be a separate flow
- SIMV search doesn't show if a participant is already added
- No bulk participant import (CSV)
- Status transitions use browser confirm() — feels outdated compared to the rest of the UI
- No activity log (who changed what, when)
- The download button only appears when finalized — no preview export
- No participant detail view — can only see table columns
- No way to edit a participant after adding them (only remove + re-add)
- Attendance data doesn't show participant email or beneficiary type — organizer can't verify at a glance
- The page doesn't remember scroll position when returning from navigation

---

## Navigation Flow Summary

```
                    ATTENDEE FLOW
                    =============

    QR Code Scan
        |
        v
    /sign/:dayId  ──── Submit ────>  /success
    (Sign Page)                      (Success Page)
                                         |
                                         v
                                      / (Home)


                    ORGANIZER FLOW
                    ==============

    /login ────> /dashboard ────> /events/new ────> /events/:id
                     |                                   |
                     |                                   |
                     +--- /events/:id <──────────────────+
                           (Event Detail)
                              |
                              |── Status controls (open/finalize/reopen)
                              |── Theme configuration
                              |── QR code generation
                              |── Participant management
                              |── Real-time attendance
                              |── XLSX download
```

---

## Technical Context for the Designer

- **Framework:** React 19 with Vite, deployed as SPA
- **Component library:** shadcn/ui (Radix primitives + Tailwind CSS v4) — organizer views use these components directly
- **Public pages:** Custom dark-mode design system with CSS custom properties. NOT using shadcn components for styling — uses inline styles with `var(--token)` references
- **Responsive:** Tailwind breakpoints (sm: 640px, md: 768px, lg: 1024px). Mobile-first. Min supported width: 320px
- **Theming:** 10-token CSS custom property system (`--bg`, `--surface`, `--accent`, `--accent-hover`, `--text`, `--text-sec`, `--border-c`, `--success`, `--error`, `--warning`). Theme derived from a single accent hex
- **i18n:** react-i18next with 3 namespaces (common, public, organizer). All user-facing strings are translated
- **Font:** Inter (400/500/600/700) on public pages, system font stack on organizer pages
- **State:** TanStack Query for server state, React Hook Form + Zod for forms

---

## Global UX Considerations

1. **Two completely different visual identities:** Public pages are dark-mode themed, organizer pages are light/neutral. This is intentional (the public experience is branded per-event, the organizer experience is a standard dashboard) but the transition between them is abrupt if an organizer previews a signing page.

2. **No onboarding:** First-time organizers see an empty dashboard with no guidance. There's no tutorial, no sample event, no hints.

3. **No real-time feedback loop:** The organizer must manually navigate to the attendance card to see new signatures. No push notifications, no sound, no badge count.

4. **Mobile organizer experience is secondary:** The dashboard works on mobile but the table/form layouts are optimized for desktop. Organizers in the field (at the event venue) may struggle with participant management on phone.

5. **Accessibility:** WCAG AA contrast is validated for the theme system. Focus states exist on inputs. However, there's no skip-to-content link, no ARIA landmarks, no screen reader announcements for dynamic content.

6. **Performance:** Signature canvas is the heaviest component. The SIMV search uses debounced requests. No lazy loading of routes or components.

7. **Error handling:** Mostly generic error messages. No retry mechanisms. No offline support.
