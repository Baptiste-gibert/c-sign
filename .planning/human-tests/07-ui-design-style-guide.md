# Phase 7: UI Design & Style Guide Application — Human Verification

**Backend URL:** http://localhost:3000
**Frontend URL:** http://localhost:5173

## Prerequisites

- Backend running on port 3000 (`cd /workspace/backend && npm run dev`)
- Frontend running on port 5173 (`cd /workspace/frontend && npm run dev`)
- Seed data loaded (`curl http://localhost:3000/api/seed`)
- At least one event exists with status "open" and at least one attendance day

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@ceva.com | Test1234! | Admin |

---

## Test 1: Organizer Theme Selection — Event Creation

- [ ] Visit http://localhost:5173/login and log in as organizer
- [ ] Click "New Event" to open the event creation form
- [ ] Scroll to the "Theme de la page publique" / "Public page theme" section
- [ ] Verify 4 palette cards are displayed in a 2x2 grid:
  - [ ] **Tech Modern** — cyan/blue swatch
  - [ ] **Vibrant Purple** — purple swatch
  - [ ] **Nature Teal** — teal/green swatch
  - [ ] **Energy Orange** — orange swatch
- [ ] Click "Vibrant Purple" — verify it highlights with a ring/border
- [ ] Below the palette grid, verify "Custom accent color" section with color picker + hex input
- [ ] Create the event — verify no errors

## Test 2: Organizer Theme Selection — Event Edit

- [ ] Navigate to an existing event's detail page
- [ ] Find the "Theme de la page publique" card section
- [ ] Click "Modifier" / "Edit" button
- [ ] Verify the ThemeSelector appears with 4 palette cards
- [ ] Select "Energy Orange"
- [ ] Click "Enregistrer" / "Save"
- [ ] Reload the page — verify "Energy Orange" is still selected (persists)

## Test 3: Public Signing Page — Dark Theme Display

- [ ] Note the dayId for an attendance day of the event with Vibrant Purple theme
- [ ] Visit http://localhost:5173/sign/{dayId}
- [ ] Verify the page has a **dark background** (not white)
- [ ] Verify the **header** has:
  - [ ] "C-SIGN" text in accent color (purple)
  - [ ] A generative gradient background (subtle color shifts)
  - [ ] Event title in white/light text
  - [ ] Event date below the title in secondary (muted) color
  - [ ] A thin accent-colored line below the header
- [ ] Verify the **form card** has:
  - [ ] Slightly lighter surface background than the page background
  - [ ] Visible border in a dark tone
- [ ] Verify the **footer** shows "C-Sign v1.0" in small muted text

## Test 4: Form Styling & Typography

- [ ] On the signing page, verify **Inter font** is used (DevTools > Elements > Computed > font-family should show "Inter")
- [ ] Verify **labels** are small uppercase (10px-ish), muted secondary color
- [ ] Verify **inputs** have:
  - [ ] Dark background (matches page bg)
  - [ ] Light text color
  - [ ] Dark border
  - [ ] Accent-colored focus ring when clicked
- [ ] Verify **2-column grid** on desktop:
  - [ ] Nom / Prenom side by side
  - [ ] Ville / Numero professionnel side by side
- [ ] Verify **beneficiary type select** dropdown has dark styling
- [ ] Verify **consent checkbox** area has a separator line above it
- [ ] Verify **submit button** uses the accent color (purple for Vibrant Purple theme)

## Test 5: Form Responsive Layout

- [ ] Open browser DevTools, toggle device toolbar (Ctrl+Shift+M)
- [ ] Set width to 320px (minimum mobile)
- [ ] Verify the form switches to **1-column layout** (fields stacked vertically)
- [ ] Verify all content fits within the viewport (no horizontal scroll)
- [ ] Verify inputs are still tappable and readable
- [ ] Set width to 768px+ — verify 2-column layout returns

## Test 6: Signature Canvas

- [ ] Verify the signature canvas has:
  - [ ] **White background** (contrast against dark page)
  - [ ] **Accent-colored border** (2px, matches theme color)
  - [ ] **Crosshair cursor** when hovering over the canvas
- [ ] Draw a signature — verify the stroke is **dark colored** (#1a1a2e), consistent width
- [ ] Click "Clear" / "Effacer" button — verify canvas clears
- [ ] Verify responsive height: canvas is shorter on mobile, taller on desktop

## Test 7: Submit & Success Page

- [ ] Fill out the form completely (all required fields + signature)
- [ ] Click submit button — verify:
  - [ ] Button shows **loading state** (reduced opacity / cursor-wait)
- [ ] After successful submission, verify the **success page**:
  - [ ] **Animated checkmark** appears (scale + opacity animation, ~500ms)
  - [ ] Checkmark uses green/success color with a circle around it
  - [ ] "Merci !" text in large bold font (30px heading scale)
  - [ ] Confirmation message in secondary text color
  - [ ] "Nouvelle signature" / "New signature" button in outline/accent style
  - [ ] **No white card wrapper** — open layout on dark background

## Test 8: Theme Switching — All 4 Palettes

- [ ] **Tech Modern** (default cyan):
  - [ ] Edit event, select Tech Modern, save
  - [ ] Open signing page — verify cyan/blue accent tones, dark blue-tinted background
- [ ] **Vibrant Purple**:
  - [ ] Edit event, select Vibrant Purple, save
  - [ ] Open signing page — verify purple accent tones, dark purple-tinted background
- [ ] **Nature Teal**:
  - [ ] Edit event, select Nature Teal, save
  - [ ] Open signing page — verify teal/green accent tones, dark teal-tinted background
- [ ] **Energy Orange**:
  - [ ] Edit event, select Energy Orange, save
  - [ ] Open signing page — verify warm orange accent tones, dark orange-tinted background
- [ ] Each theme should produce **visually distinct** colors while maintaining the same dark layout structure

## Test 9: Custom Accent Color

- [ ] Edit an event, scroll to theme section
- [ ] Click the color picker or type a custom hex (e.g. `#e91e8c` bright pink)
- [ ] Verify the built-in palette cards are **deselected** when custom is active
- [ ] Verify a **preview strip** shows the derived bg/surface/accent colors
- [ ] Save and open the signing page — verify pink-toned dark theme
- [ ] Go back and try a very light color (`#ffff00` yellow):
  - [ ] Verify a **contrast warning** appears ("This color may not meet accessibility contrast requirements")
- [ ] Go back and try a dark color (`#1a1a2e`):
  - [ ] Verify the signing page still renders readably (dark-on-dark should still have contrast for text)

## Test 10: Accessibility & Contrast

- [ ] On any themed signing page, verify:
  - [ ] White text is **clearly readable** against the dark background
  - [ ] Secondary text (dates, labels) is readable against surface/background
  - [ ] Accent-colored elements (buttons, links) are visible against dark background
  - [ ] Focus rings are visible when tabbing through form inputs
- [ ] Test with all 4 built-in themes — none should have illegible text

## Test 11: Language Switching on Themed Page

- [ ] On the signing page, find the language switcher in the header
- [ ] Switch between FR and EN — verify:
  - [ ] All labels, placeholders, and messages update
  - [ ] Theme styling is **not affected** by language switch
  - [ ] Layout does not break when text length changes

---

## Summary

| # | Test | Result |
|---|------|--------|
| 1 | Theme selection — creation | |
| 2 | Theme selection — edit | |
| 3 | Dark theme display | |
| 4 | Form styling & typography | |
| 5 | Form responsive layout | |
| 6 | Signature canvas | |
| 7 | Submit & success page | |
| 8 | All 4 palettes | |
| 9 | Custom accent color | |
| 10 | Accessibility & contrast | |
| 11 | Language switching | |
