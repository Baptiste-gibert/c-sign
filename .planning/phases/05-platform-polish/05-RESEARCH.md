# Phase 5: Platform Polish - Research

**Researched:** 2026-02-14
**Domain:** Internationalization (i18n) and Mobile-First Responsive Design
**Confidence:** HIGH

## Summary

Phase 5 requires implementing bilingual French/English support and ensuring mobile-first responsive design across all devices. The research identifies **react-i18next** (ecosystem built on i18next) as the industry-standard solution for React internationalization, and confirms **Tailwind CSS v4's mobile-first breakpoint system** is already in place. For signature canvas mobile compatibility, the existing **react-signature-canvas** (wrapper around signature_pad) already handles touch events, but requires proper devicePixelRatio handling and responsive sizing.

The frontend codebase currently has hardcoded French strings throughout (e.g., "Chargement...", "Signez ici", "Effacer") and minimal responsive design implementation (only 1 responsive class found in EventDetailPage). The signature canvas implementation at `/workspace/frontend/src/components/SignatureCanvas.tsx` already includes high-DPI handling but uses fixed height (`h-48`) which may not be optimal for all mobile devices.

**Primary recommendation:** Install react-i18next ecosystem (i18next, react-i18next, i18next-browser-languagedetector), organize translations into namespaces (common, public, organizer), implement language toggle with localStorage persistence, and systematically audit/replace all hardcoded strings. For responsive design, audit all components starting with public signing flow (highest priority) using Tailwind's mobile-first approach with unprefixed classes for mobile and breakpoint prefixes (sm:, md:, lg:) for larger screens.

## Standard Stack

### Core i18n Libraries
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| i18next | ^23.x | Core i18n engine | Most popular JS i18n framework, 2.1M weekly downloads, framework-agnostic |
| react-i18next | ^14.x | React bindings for i18next | Official React integration, 2.1M weekly downloads, provides useTranslation hook |
| i18next-browser-languagedetector | ^8.x | Auto-detect user language | Official browser language detection from localStorage, navigator, etc. |

### Responsive Design (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tailwindcss | ^4.0.0 | Utility-first CSS framework | Industry standard, mobile-first by design |
| @tailwindcss/vite | ^4.0.0 | Vite integration for Tailwind v4 | Official v4 plugin, CSS-first configuration |

### Mobile Signature (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-signature-canvas | ^1.0.6 | React wrapper for signature_pad | Most popular React signature library, handles touch events natively |
| signature_pad | ^5.0.6 | HTML5 canvas signature drawing | Industry standard, works on all modern mobile browsers |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-i18next | react-intl (FormatJS) | FormatJS: smaller bundle (17.8kb vs 22.2kb), strict ICU/CLDR standards. Trade: Less flexible, no server-side support, fewer plugins. Use when: Enterprise strict standards required. |
| i18next namespaces | Single translation file | Simpler initially but becomes unmaintainable at scale, no lazy loading optimization |
| localStorage detection | Browser-only detection | Loses user preference on reload, worse UX |

**Installation:**
```bash
cd /workspace/frontend
npm install i18next react-i18next i18next-browser-languagedetector
```

## Architecture Patterns

### Recommended Project Structure
```
frontend/src/
├── i18n/
│   ├── index.ts              # i18next initialization and config
│   ├── locales/
│   │   ├── en/
│   │   │   ├── common.json   # Shared UI (buttons, labels, errors)
│   │   │   ├── public.json   # Public signing flow
│   │   │   └── organizer.json # Organizer dashboard
│   │   └── fr/
│   │       ├── common.json
│   │       ├── public.json
│   │       └── organizer.json
├── components/
│   └── LanguageSwitcher.tsx  # Language toggle component
```

### Pattern 1: i18next Initialization with Browser Detection
**What:** Configure i18next with localStorage persistence and browser fallback
**When to use:** Application entry point (main.tsx)
**Example:**
```typescript
// Source: https://www.i18next.com/overview/getting-started
// Source: https://github.com/i18next/i18next-browser-languageDetector
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import commonEN from './locales/en/common.json'
import commonFR from './locales/fr/common.json'
import publicEN from './locales/en/public.json'
import publicFR from './locales/fr/public.json'
import organizerEN from './locales/en/organizer.json'
import organizerFR from './locales/fr/organizer.json'

i18n
  .use(LanguageDetector) // Detects language from localStorage, navigator, etc.
  .use(initReactI18next)  // Passes i18n to react-i18next
  .init({
    resources: {
      en: {
        common: commonEN,
        public: publicEN,
        organizer: organizerEN,
      },
      fr: {
        common: commonFR,
        public: publicFR,
        organizer: organizerFR,
      },
    },
    fallbackLng: 'fr',      // Default to French (project requirement)
    defaultNS: 'common',     // Default namespace
    detection: {
      order: ['localStorage', 'navigator'], // Check localStorage first
      caches: ['localStorage'],              // Persist in localStorage
      lookupLocalStorage: 'i18nextLng',
    },
    interpolation: {
      escapeValue: false,    // React already escapes
    },
  })

export default i18n
```

### Pattern 2: useTranslation Hook in Components
**What:** Access translation function and i18n instance in React components
**When to use:** Every component with user-facing text
**Example:**
```typescript
// Source: https://react.i18next.com/latest/using-with-hooks
import { useTranslation } from 'react-i18next'

export function SignatureCanvas() {
  const { t } = useTranslation('public') // Load 'public' namespace

  return (
    <div>
      <div className="placeholder">
        {t('signHere')} {/* Translates to "Signez ici" or "Sign here" */}
      </div>
      <Button onClick={handleClear}>
        {t('clear')} {/* Translates to "Effacer" or "Clear" */}
      </Button>
    </div>
  )
}
```

### Pattern 3: Language Switcher Component
**What:** Toggle button to switch between French and English
**When to use:** OrganizerLayout and public pages
**Example:**
```typescript
// Source: https://react.i18next.com/latest/using-with-hooks
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr'
    i18n.changeLanguage(newLang) // Automatically saves to localStorage
  }

  return (
    <Button variant="outline" size="sm" onClick={toggleLanguage}>
      {i18n.language === 'fr' ? 'EN' : 'FR'}
    </Button>
  )
}
```

### Pattern 4: TypeScript Type-Safe Translations
**What:** Generate TypeScript types from translation JSON files
**When to use:** TypeScript projects (this project uses TypeScript strict mode)
**Example:**
```typescript
// Source: https://www.i18next.com/overview/typescript
// @types/i18next.d.ts
import 'i18next'
import common from './locales/en/common.json'
import publicNS from './locales/en/public.json'
import organizer from './locales/en/organizer.json'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: {
      common: typeof common
      public: typeof publicNS
      organizer: typeof organizer
    }
  }
}
```

### Pattern 5: Mobile-First Responsive with Tailwind v4
**What:** Use unprefixed utilities for mobile, breakpoint prefixes for larger screens
**When to use:** All UI components, especially public signing flow
**Example:**
```tsx
// Source: https://tailwindcss.com/docs/responsive-design
// Mobile-first: unprefixed = mobile, sm: = 640px+, md: = 768px+, lg: = 1024px+

// ❌ WRONG: sm: does NOT mean "small screens"
<div className="sm:text-sm md:text-base">Text</div>

// ✓ CORRECT: unprefixed = mobile (all sizes), sm: = tablet/desktop
<div className="text-sm md:text-base lg:text-lg">
  Text is small on mobile, base on tablet, large on desktop
</div>

// ✓ CORRECT: Signature canvas responsive
<div className="w-full h-40 sm:h-48 md:h-64">
  {/* Height: 160px mobile, 192px tablet, 256px desktop */}
</div>

// ✓ CORRECT: Grid layout responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 1 column mobile, 2 tablet, 3 desktop */}
</div>
```

### Pattern 6: Signature Canvas Responsive Sizing
**What:** Make canvas responsive while maintaining high-DPI support
**When to use:** SignatureCanvas component
**Example:**
```typescript
// Source: https://github.com/szimek/signature_pad
// Current implementation uses fixed height; make responsive

// ❌ Current: Fixed height
<div className="relative w-full h-48 border rounded-md">

// ✓ Better: Responsive height
<div className="relative w-full h-40 sm:h-48 md:h-56 border rounded-md">
  {/* Mobile: 160px, Tablet: 192px, Desktop: 224px */}
</div>

// Note: devicePixelRatio scaling already implemented correctly in existing code
```

### Pattern 7: Translation with Interpolation and Pluralization
**What:** Handle dynamic values and plural forms in translations
**When to use:** Dynamic content like counts, dates, names
**Example:**
```typescript
// Source: https://www.i18next.com/translation-function/interpolation
// Source: https://www.i18next.com/translation-function/plurals

// JSON translation file (fr/common.json)
{
  "welcome": "Bienvenue, {{name}}",
  "participantCount": "{{count}} participant",
  "participantCount_plural": "{{count}} participants"
}

// Component usage
const { t } = useTranslation('common')

<h1>{t('welcome', { name: 'Marie' })}</h1>
// Output: "Bienvenue, Marie"

<p>{t('participantCount', { count: 1 })}</p>
// Output: "1 participant"

<p>{t('participantCount', { count: 5 })}</p>
// Output: "5 participants"
```

### Anti-Patterns to Avoid

- **Hard-coded strings:** Never use literal strings like "Loading..." in JSX. Always use t('loading') even if it seems trivial.
- **String concatenation:** Don't build sentences from pieces like `"Added: " + date`. Different languages have different word orders. Translate entire sentences as units.
- **Misunderstanding sm: prefix:** sm: does NOT mean "mobile" in Tailwind. Unprefixed utilities apply to all screen sizes including mobile. sm: means "at 640px and above."
- **Using useTranslation() outside React components:** The hook only works inside functional components. For utility functions, import i18n directly and use i18n.t().
- **Monolithic translation files:** Don't put all translations in one file. Use namespaces (common, public, organizer) for better organization and lazy loading potential.
- **Ignoring pluralization rules:** Don't use `count === 1 ? 'item' : 'items'`. Languages have different plural rules (Arabic has 6 forms). Use i18next's built-in pluralization.
- **Fixed canvas sizing:** Don't use fixed pixel heights for signature canvas. Use responsive Tailwind classes that adapt to screen size.
- **Missing devicePixelRatio scaling:** Canvas on high-DPI screens (Retina, modern phones) appears blurry without proper scaling. Always multiply canvas dimensions by devicePixelRatio. (Current implementation already handles this correctly.)
- **Forgetting clearOnResize:** When canvas resizes, browser clears it automatically. Either set clearOnResize={false} and handle manually, or expect signatures to be lost on window resize.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Language detection | Custom browser language parser | i18next-browser-languagedetector | Handles 9 detection methods (localStorage, navigator, cookie, querystring, etc.), edge cases, and caching |
| Pluralization rules | if/else based on count | i18next pluralization | Different languages have different plural rules (Arabic: 6 forms, Latvian: 3 forms). i18next handles all Unicode CLDR plural rules automatically |
| Translation management | Custom JSON loader | i18next resource bundles + namespaces | Built-in lazy loading, fallback chains, namespace organization, backend plugins |
| Mobile touch events on canvas | Custom touch handlers | signature_pad library | Handles touch vs mouse, pressure sensitivity, throttling, smoothing, and cross-browser quirks |
| High-DPI canvas scaling | Manual pixel calculations | signature_pad + devicePixelRatio pattern | Edge cases: orientation change, dynamic resize, browser zoom, Retina displays |
| Responsive breakpoints | Custom media queries in CSS | Tailwind CSS v4 breakpoints | Standardized breakpoints, mobile-first methodology, consistent across codebase |

**Key insight:** Internationalization and mobile compatibility have hidden complexity. Language differences (word order, pluralization, RTL) and device variations (DPI, touch vs mouse, orientation) create edge cases that battle-tested libraries have already solved. Hand-rolling these solutions leads to bugs, inconsistent UX, and maintenance burden.

## Common Pitfalls

### Pitfall 1: Misunderstanding Tailwind's Mobile-First System
**What goes wrong:** Developers use `sm:` prefix thinking it targets mobile devices, causing styles to not apply on mobile.
**Why it happens:** Intuition from other frameworks where "small" means mobile. In Tailwind, `sm:` means "640px and above" (small *breakpoint*, not small *devices*).
**How to avoid:** Remember: unprefixed = mobile (all sizes), `sm:` = tablet/desktop (640px+). Always design for smallest screen first with unprefixed utilities.
**Warning signs:** UI looks broken on mobile but fine on desktop. Styles intended for mobile only appear on larger screens.

**Example:**
```tsx
// ❌ WRONG: sm: prefix will NOT apply on mobile phones
<div className="sm:text-sm">Text</div>

// ✓ CORRECT: unprefixed applies everywhere including mobile
<div className="text-sm md:text-base">Text is small on mobile, base on desktop</div>
```

### Pitfall 2: Hard-Coding Language-Specific Logic
**What goes wrong:** Using `count === 1 ? 'item' : 'items'` works in English but breaks in languages with different plural rules (Arabic has 6 plural forms, not 2).
**Why it happens:** English-centric thinking. Developers assume singular/plural binary applies universally.
**How to avoid:** Always use i18next's built-in pluralization: `t('key', { count: n })`. Define `key` and `key_plural` in translation files.
**Warning signs:** QA reports plural errors in non-English languages. Translation keys return wrong forms.

**Example from research:**
```typescript
// ❌ WRONG: English-only logic
const text = count === 1 ? '1 item' : `${count} items`

// ✓ CORRECT: i18next handles all plural rules
const text = t('itemCount', { count })
// Translation file: { "itemCount": "1 item", "itemCount_plural": "{{count}} items" }
```

### Pitfall 3: Using useTranslation() Outside React Components
**What goes wrong:** Error "useTranslation is not a function" or "Invalid hook call" when trying to use `useTranslation()` in utility files, API functions, or Zod schemas.
**Why it happens:** React hooks only work inside functional components during render. Utility functions run outside React's rendering cycle.
**How to avoid:** Import i18n instance directly for non-component code: `import i18n from '@/i18n'` and use `i18n.t('key')`. Ensure i18n is initialized before calling t().
**Warning signs:** Runtime errors when utility functions try to translate strings. Hook call errors in non-React files.

**Example:**
```typescript
// ❌ WRONG: Hook in utility function
// lib/validators.ts
import { useTranslation } from 'react-i18next' // ❌ Error!
export function validate() {
  const { t } = useTranslation() // ❌ Invalid hook call
  return t('error')
}

// ✓ CORRECT: Import i18n instance directly
// lib/validators.ts
import i18n from '@/i18n'
export function validate() {
  return i18n.t('error') // ✓ Works outside components
}
```

### Pitfall 4: Canvas Clearing on Window Resize
**What goes wrong:** User draws signature, rotates device or resizes window, signature disappears.
**Why it happens:** Browsers automatically clear canvas when dimensions change. Libraries don't preserve drawings by default.
**How to avoid:** For signature pads, either (1) set fixed dimensions that don't resize, (2) use `clearOnResize={false}` and manually preserve/restore, or (3) warn users signatures clear on resize. Lock screen orientation for critical signing flows.
**Warning signs:** User complaints about lost signatures on mobile orientation change. Blank canvas after window resize.

**Example:**
```typescript
// Source: https://github.com/szimek/signature_pad

// ❌ WRONG: Responsive canvas without handling resize
<div className="w-full h-full"> {/* Resizes with window */}
  <SignatureCanvas />
</div>

// ✓ OPTION 1: Fixed dimensions (best for signatures)
<div className="w-full h-48"> {/* Fixed height, won't resize */}
  <SignatureCanvas />
</div>

// ✓ OPTION 2: Disable auto-clear (requires manual state management)
<SignatureCanvas clearOnResize={false} />
// Then implement manual preservation/restore on resize event
```

### Pitfall 5: Monolithic Translation Files
**What goes wrong:** Single `translation.json` file grows to 500+ lines, becomes unmaintainable, forces loading all translations even if user only uses public signing form.
**Why it happens:** Starting simple with one file, never refactoring as project grows.
**How to avoid:** Use namespaces from the start: `common.json` (shared UI), `public.json` (public signing), `organizer.json` (dashboard). Organize by feature area, not by language alone.
**Warning signs:** Translation file has 200+ keys. Merge conflicts on every PR touching translations. Slow initial load time.

**Example:**
```typescript
// ❌ WRONG: Single monolithic file
// locales/fr/translation.json (500 lines)
{
  "signHere": "Signez ici",
  "dashboardTitle": "Tableau de bord",
  "eventCreate": "Créer événement",
  // ... 497 more keys
}

// ✓ CORRECT: Namespaced organization
// locales/fr/common.json (shared UI)
{ "loading": "Chargement...", "error": "Erreur", "save": "Enregistrer" }

// locales/fr/public.json (public signing)
{ "signHere": "Signez ici", "clear": "Effacer", "submit": "Soumettre" }

// locales/fr/organizer.json (dashboard)
{ "dashboardTitle": "Tableau de bord", "eventCreate": "Créer événement" }
```

### Pitfall 6: String Concatenation for Sentence Building
**What goes wrong:** Building sentences like `"Added: " + date` or `firstName + " " + lastName` breaks in languages with different word order (e.g., Japanese family name comes first, Dutch date placement differs).
**Why it happens:** Assuming English sentence structure is universal.
**How to avoid:** Translate entire sentences as single units with interpolation: `t('addedDate', { date })`. JSON: `"addedDate": "Added: {{date}}"` (en) vs `"addedDate": "{{date}} toegevoegd"` (nl).
**Warning signs:** Translators report word order issues. Sentences read awkwardly in non-English languages.

**Example:**
```typescript
// ❌ WRONG: String concatenation
const text = "Added: " + formatDate(date)
// In Dutch: "1 januari toegevoegd" (date comes first, not last)

// ✓ CORRECT: Interpolation in full sentence
const text = t('addedDate', { date: formatDate(date) })
// en: "addedDate": "Added: {{date}}"
// nl: "addedDate": "{{date}} toegevoegd"
```

### Pitfall 7: Ignoring High-DPI Screens for Canvas
**What goes wrong:** Signature appears blurry or pixelated on Retina displays, modern smartphones, and high-DPI monitors.
**Why it happens:** Canvas resolution defaults to CSS pixels, not physical device pixels. On 2x displays (Retina), canvas renders at half resolution.
**How to avoid:** Multiply canvas width/height by `window.devicePixelRatio`, then scale 2D context back down. See existing SignatureCanvas.tsx implementation (lines 16-29) as reference.
**Warning signs:** Signatures look sharp on old laptops but blurry on MacBook Retina, iPhones, modern Android devices.

**Example:**
```typescript
// Source: https://github.com/szimek/signature_pad

// ❌ WRONG: No DPI scaling
const canvas = canvasRef.current.getCanvas()
canvas.width = 500
canvas.height = 200

// ✓ CORRECT: Scale by devicePixelRatio (existing implementation)
const canvas = canvasRef.current.getCanvas()
const ratio = window.devicePixelRatio || 1
const rect = canvas.getBoundingClientRect()
canvas.width = rect.width * ratio
canvas.height = rect.height * ratio
const ctx = canvas.getContext('2d')
ctx.scale(ratio, ratio)
```

## Code Examples

Verified patterns from official sources:

### i18next Initialization (Main Entry Point)
```typescript
// Source: https://www.i18next.com/overview/getting-started
// Source: https://github.com/i18next/i18next-browser-languageDetector
// File: frontend/src/i18n/index.ts

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import commonEN from './locales/en/common.json'
import commonFR from './locales/fr/common.json'
import publicEN from './locales/en/public.json'
import publicFR from './locales/fr/public.json'
import organizerEN from './locales/en/organizer.json'
import organizerFR from './locales/fr/organizer.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: commonEN,
        public: publicEN,
        organizer: organizerEN,
      },
      fr: {
        common: commonFR,
        public: publicFR,
        organizer: organizerFR,
      },
    },
    fallbackLng: 'fr',
    defaultNS: 'common',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    interpolation: {
      escapeValue: false, // React already escapes
    },
  })

export default i18n
```

### Import i18n Before React App Renders
```typescript
// Source: https://react.i18next.com/latest/using-with-hooks
// File: frontend/src/main.tsx

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './i18n' // ← Initialize i18n BEFORE App renders
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

### Component Using Translations
```typescript
// Source: https://react.i18next.com/latest/using-with-hooks
// File: frontend/src/components/SignatureCanvas.tsx (excerpt)

import { useTranslation } from 'react-i18next'

export const SignatureCanvas = forwardRef<SignatureCanvasHandle>((_, ref) => {
  const { t } = useTranslation('public') // Load 'public' namespace

  return (
    <div className="space-y-2">
      <div className="relative w-full h-40 sm:h-48 md:h-56 border rounded-md">
        {!hasDrawn && (
          <div className="placeholder">
            {t('signHere')} {/* "Signez ici" or "Sign here" */}
          </div>
        )}
        <SignatureCanvasLib ref={canvasRef} />
      </div>
      <Button onClick={handleClear}>
        {t('clear')} {/* "Effacer" or "Clear" */}
      </Button>
    </div>
  )
})
```

### Language Switcher Component
```typescript
// Source: https://react.i18next.com/latest/using-with-hooks
// File: frontend/src/components/LanguageSwitcher.tsx

import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Languages } from 'lucide-react'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr'
    i18n.changeLanguage(newLang) // Saves to localStorage automatically
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      aria-label="Toggle language"
    >
      <Languages className="mr-2 h-4 w-4" />
      {i18n.language === 'fr' ? 'EN' : 'FR'}
    </Button>
  )
}
```

### Translation JSON Files
```json
// Source: https://www.i18next.com/translation-function/interpolation
// File: frontend/src/i18n/locales/en/common.json
{
  "loading": "Loading...",
  "error": "Error",
  "save": "Save",
  "cancel": "Cancel",
  "delete": "Delete",
  "confirm": "Confirm",
  "back": "Back",
  "welcome": "Welcome, {{name}}",
  "itemCount": "{{count}} item",
  "itemCount_plural": "{{count}} items"
}

// File: frontend/src/i18n/locales/fr/common.json
{
  "loading": "Chargement...",
  "error": "Erreur",
  "save": "Enregistrer",
  "cancel": "Annuler",
  "delete": "Supprimer",
  "confirm": "Confirmer",
  "back": "Retour",
  "welcome": "Bienvenue, {{name}}",
  "itemCount": "{{count}} élément",
  "itemCount_plural": "{{count}} éléments"
}

// File: frontend/src/i18n/locales/en/public.json
{
  "signHere": "Sign here",
  "clear": "Clear",
  "submit": "Submit",
  "firstName": "First name",
  "lastName": "Last name",
  "email": "Email",
  "city": "City",
  "signatureRequired": "Signature required"
}

// File: frontend/src/i18n/locales/fr/public.json
{
  "signHere": "Signez ici",
  "clear": "Effacer",
  "submit": "Soumettre",
  "firstName": "Prénom",
  "lastName": "Nom",
  "email": "Email",
  "city": "Ville",
  "signatureRequired": "Signature requise"
}
```

### TypeScript Type Safety for Translations
```typescript
// Source: https://www.i18next.com/overview/typescript
// File: frontend/src/@types/i18next.d.ts

import 'i18next'
import common from '../i18n/locales/en/common.json'
import publicNS from '../i18n/locales/en/public.json'
import organizer from '../i18n/locales/en/organizer.json'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: {
      common: typeof common
      public: typeof publicNS
      organizer: typeof organizer
    }
  }
}
```

### Mobile-First Responsive Grid
```tsx
// Source: https://tailwindcss.com/docs/responsive-design
// QR code grid from EventDetailPage.tsx (line 307) - make responsive

// ❌ Current: Not mobile-optimized
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

// ✓ Better: Explicit mobile-first
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {/* 1 column mobile, 2 tablet, 3 desktop */}
</div>
```

### Responsive Signature Canvas
```tsx
// Source: https://tailwindcss.com/docs/responsive-design
// Improve SignatureCanvas.tsx height for mobile

// ❌ Current: Fixed height (h-48 = 192px on all devices)
<div className="relative w-full h-48 border rounded-md">

// ✓ Better: Responsive height
<div className="relative w-full h-40 sm:h-48 md:h-56 border rounded-md">
  {/* Mobile: 160px, Tablet: 192px, Desktop: 224px */}
</div>
```

### Responsive Typography
```tsx
// Source: https://tailwindcss.com/docs/responsive-design

// Event title responsive sizing
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
  {event.title}
</h1>

// Descriptive text responsive sizing
<p className="text-sm md:text-base text-muted-foreground">
  {event.description}
</p>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Global locale context | useTranslation hook | react-i18next v9+ (2019) | Simpler component code, better performance, no context provider needed |
| PostCSS for Tailwind | @tailwindcss/vite plugin | Tailwind v4 (2024) | Faster builds, CSS-first config, better DX |
| react-signature-pad (unmaintained) | react-signature-canvas | 2018+ | Active maintenance, TypeScript support, 100% test coverage |
| Mouse events only | Unified touch/mouse handling | signature_pad v2+ (2016) | Mobile compatibility built-in, no custom touch handlers needed |
| Custom pluralization logic | i18next built-in plurals | Always (i18next core feature) | Unicode CLDR support, handles all language plural rules automatically |
| Separate i18n instance per component | Single shared i18n instance | Always (i18next architecture) | Consistent state, language changes propagate immediately |

**Deprecated/outdated:**
- **react-i18next withNamespaces HOC (v9):** Deprecated in favor of useTranslation hook. Old class component pattern, harder to read, worse TypeScript support.
- **Tailwind v3 postcss.config.js:** Tailwind v4 uses @tailwindcss/vite plugin instead. Old approach still works but slower build times.
- **react-signature-pad (last publish 2018):** Unmaintained. Use react-signature-canvas (fork with active maintenance, updated dependencies).
- **Custom language detection cookies/localStorage:** Use i18next-browser-languagedetector instead. Handles edge cases (browser preferences, fallbacks, caching).

## Open Questions

1. **RTL Support for Future Languages**
   - What we know: Phase 5 only requires French/English (both LTR), but project may expand to Arabic/Hebrew later
   - What's unclear: Should we architect i18n setup to support RTL now, or defer until needed?
   - Recommendation: Defer RTL support to Phase 6 or future phase. Add as technical debt item. i18next supports RTL but requires CSS changes (`dir="rtl"` attribute, logical properties).

2. **Date/Time/Number Formatting Strategy**
   - What we know: Code currently uses `date-fns` with French locale (`fr` imported). Dates formatted as `format(date, 'd MMM yyyy', { locale: fr })`.
   - What's unclear: Should we keep date-fns and switch locales based on i18n language, or migrate to i18next plugins like i18next-intl for unified i18n?
   - Recommendation: Keep date-fns for now (already installed, working). Create helper function that switches locale based on `i18n.language`. Migration to i18next-intl is future optimization.

3. **Translation File Management Workflow**
   - What we know: Standard practice is JSON files in source control
   - What's unclear: Who manages translations? Developers write both FR/EN? Use translation management system (TMS) like Locize/Phrase?
   - Recommendation: For Phase 5, developers manage both FR/EN JSON files directly. Document translation key naming conventions. TMS integration is Phase 6+ feature for scalability.

4. **Testing Strategy for i18n**
   - What we know: Need to verify all strings are translated, no hardcoded French
   - What's unclear: Automated linting for untranslated strings? Test coverage for language switching?
   - Recommendation: Manual audit for Phase 5. Create human verification checklist for each page in both languages. Automated tooling (eslint-plugin-i18next, i18next-scanner) is future enhancement.

5. **Signature Canvas Minimum Dimensions**
   - What we know: Success criteria requires 320px width minimum
   - What's unclear: What's the minimum viable *height* for usable signatures on small phones?
   - Recommendation: Test on real devices. Suggest minimum 120px height (current h-40 = 160px is good baseline). Create verification checklist item for manual testing on iPhone SE, small Android devices.

## Sources

### Primary (HIGH confidence)
- i18next official docs - [Getting Started](https://www.i18next.com/overview/getting-started) - Core concepts, initialization, translation functions
- i18next TypeScript docs - [TypeScript Support](https://www.i18next.com/overview/typescript) - Type-safe translations
- react-i18next official docs - [useTranslation Hook](https://react.i18next.com/latest/using-with-hooks) - React integration patterns
- i18next-browser-languagedetector GitHub - [README](https://github.com/i18next/i18next-browser-languageDetector) - Language detection configuration
- Tailwind CSS official docs - [Responsive Design](https://tailwindcss.com/docs/responsive-design) - Mobile-first breakpoints
- signature_pad GitHub - [README](https://github.com/szimek/signature_pad) - Canvas API, mobile handling
- react-signature-canvas GitHub - [README](https://github.com/agilgur5/react-signature-canvas) - React wrapper API

### Secondary (MEDIUM confidence)
- [Phrase: Best React i18n Libraries](https://phrase.com/blog/posts/react-i18n-best-libraries/) - Ecosystem comparison, verified with official docs
- [i18next: Comparison to Others](https://www.i18next.com/overview/comparison-to-others) - Official comparison of i18next vs alternatives
- [Tailwind v4 Complete Guide](https://devtoolbox.dedyn.io/blog/tailwind-css-v4-complete-guide) - v4-specific changes, verified with official docs
- [Locize: Using i18next.t() Outside Components](https://www.locize.com/blog/how-to-use-i18next-t-outside-react-components/) - Non-component usage patterns
- [InfiniteJS: Common i18n Mistakes](https://infinitejs.com/posts/common-mistakes-i18n-react) - Anti-patterns
- [DhiWise: React Signature Canvas Implementation](https://www.dhiwise.com/post/how-to-implement-react-signature-canvas-in-your-applications) - Implementation examples

### Tertiary (LOW confidence - flagged for validation)
- WebSearch findings on FormatJS vs i18next (multiple sources agree, but not verified with FormatJS official docs directly)
- Community blog posts on Tailwind responsive pitfalls (verified pattern with official docs, but specific pitfall examples from community)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official docs, npm downloads, ecosystem consensus
- Architecture: HIGH - Official patterns from i18next/react-i18next docs, Tailwind official docs
- Pitfalls: MEDIUM - Mix of official docs and verified community sources
- Mobile compatibility: HIGH - signature_pad official docs, tested patterns
- Responsive design: HIGH - Tailwind official docs, established patterns

**Research date:** 2026-02-14
**Valid until:** ~2026-03-14 (30 days - i18n ecosystem is mature/stable, Tailwind v4 is current version)
