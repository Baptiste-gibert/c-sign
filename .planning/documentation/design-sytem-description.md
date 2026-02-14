# C-SIGN — Charte Design System v2.0

> Système de gestion d'émargement moderne, thématisable et déclinable.
> Stack : Vite + React 18 + TypeScript + ShadCN/UI + Tailwind CSS

---

## Table des matières

1. [Principes de design](#1-principes-de-design)
2. [Typographie](#2-typographie)
3. [Système de spacing](#3-système-de-spacing)
4. [Composants UI](#4-composants-ui)
5. [Système de thèmes](#5-système-de-thèmes)
6. [Les 4 palettes existantes](#6-les-4-palettes-existantes)
7. [Algorithme de génération de palette](#7-algorithme-de-génération-de-palette)
8. [Exemples visuels](#8-exemples-visuels)
9. [Microinteractions](#9-microinteractions)
10. [Structure technique](#10-structure-technique)

---

## 1. Principes de design

Le design system C-SIGN repose sur cinq piliers :

**Rapidité** — L'émargement doit prendre moins de 5 secondes. Chaque décision UI sert cet objectif : formulaire compact, champs visibles sans scroll excessif, bouton de soumission proéminent.

**Lisibilité** — Fond sombre, texte blanc, contraste élevé. Chaque thème garantit un ratio de contraste WCAG AA minimum (4.5:1 pour le texte, 3:1 pour les éléments interactifs).

**Déclinabilité** — Un seul code, N thèmes. Chaque événement peut avoir sa propre identité visuelle en changeant uniquement une couleur accent.

**Modernité** — Esthétique dark-mode, angles arrondis (6px), effets de glow subtils, transitions fluides 200ms.

**Cohérence** — Tous les composants utilisent ShadCN/UI comme base, stylés via CSS custom properties. Aucun style hardcodé.

---

## 2. Typographie

### Police

```
Font Stack : Inter, Geist, system-ui, -apple-system, sans-serif
```

Inter est utilisée en priorité pour sa lisibilité exceptionnelle sur écran et sa large gamme de graisses. En fallback, Geist (la police système de Vercel) puis les polices système.

### Échelle typographique

| Token   | Taille | Line-height | Weight  | Letter-spacing | Usage                     |
|---------|--------|-------------|---------|----------------|---------------------------|
| `h1`    | 30px   | 1.15        | 700     | -0.5px         | Titre événement           |
| `h2`    | 20px   | 1.3         | 700     | -0.25px        | Titre de section (carte)  |
| `h3`    | 16px   | 1.4         | 600     | 0              | Sous-sections              |
| `body`  | 13px   | 1.5         | 400     | 0              | Texte courant              |
| `label` | 10px   | 1.4         | 500     | 0.2px          | Labels de champs           |
| `caption`| 8px   | 1.3         | 400     | 0              | Notes, crédits             |
| `button`| 13px   | 1           | 600     | 0              | Texte de boutons           |
| `badge` | 8px    | 1           | 700     | 2px            | Badges, tags (uppercase)   |

### Règles

- Les titres utilisent `font-bold` (700) et un letter-spacing négatif pour un rendu serré et moderne.
- Les labels de champ sont en `font-medium` (500), taille réduite (10px), pour ne pas rivaliser visuellement avec les valeurs saisies.
- Aucun texte ne descend en dessous de 8px.

---

## 3. Système de spacing

### Tokens

| Token | Valeur | Classe Tailwind | Usage                          |
|-------|--------|-----------------|--------------------------------|
| `xs`  | 4px    | `p-1`, `gap-1`  | Espacement intra-composant     |
| `sm`  | 8px    | `p-2`, `gap-2`  | Gap entre label et input       |
| `md`  | 12px   | `p-3`, `gap-3`  | Gap entre champs du formulaire |
| `lg`  | 16px   | `p-4`, `gap-4`  | Padding de carte (mobile)      |
| `xl`  | 24px   | `p-6`, `gap-6`  | Padding de carte (desktop)     |
| `2xl` | 32px   | `p-8`, `gap-8`  | Marge entre sections           |
| `3xl` | 48px   | `p-12`          | Padding écran succès           |

### Applications concrètes

```
Card padding (mobile)  :  px-4 pt-5 pb-5   (16px h / 20px top / 20px bottom)
Card padding (desktop) :  px-6 pt-6 pb-6   (24px h / 24px v)
Form gap               :  space-y-3.5       (14px entre les champs)
Grid gap               :  gap-2.5           (10px entre colonnes)
Input height           :  h-9               (36px)
Button height          :  h-10              (40px)
Label → Input gap      :  space-y-1.5       (6px)
```

### Grille responsive

```
Desktop  :  grid-cols-2 pour Nom/Prénom et Ville/N°inscription
Mobile   :  grid-cols-1 — empilement vertical
Breakpoint : le device toggle simule le changement ; en production, utiliser md:grid-cols-2
Max-width  : 640px pour le contenu principal
```

---

## 4. Composants UI

Tous les composants sont basés sur **ShadCN/UI** et stylés dynamiquement via les CSS custom properties du thème actif.

### 4.1 Card (conteneur formulaire)

```
Composants : Card, CardHeader, CardTitle, CardDescription, CardContent
Background : var(--surface)
Border     : 1px solid var(--border-c)
Radius     : rounded-lg (ShadCN default, ~10px)
Shadow     : aucune shadow par défaut (le fond sombre suffit)
```

### 4.2 Input

```
Composant  : Input (ShadCN)
Height     : h-9 (36px)
Font size  : text-xs (12px)
Background : var(--bg)
Color      : var(--text)
Border     : 1px solid var(--border-c)
Focus      : ring-1 ring-[var(--accent)], ring-offset-0
Transition : transition-all (border + shadow)
Radius     : rounded-md (6px)
```

### 4.3 Select

```
Composants : Select, SelectTrigger, SelectValue, SelectContent, SelectItem
Mêmes dimensions et styles que Input
Dropdown   : background var(--surface), border var(--border-c)
Items      : text-xs, cursor-pointer
```

### 4.4 Button

```
Composant  : Button (ShadCN)
Variantes  :
  - Primary (submit)  : bg var(--accent), color var(--bg), font-semibold
  - Outline           : border var(--border-c), color var(--accent), bg transparent
  - Ghost             : bg transparent, color var(--text-sec), hover bg white/8%
Height     : h-10 (40px) pour submit, h-7 (28px) pour actions secondaires
Width      : w-full pour submit
Radius     : rounded-lg (7px)
Disabled   : opacity-70
```

### 4.5 Checkbox

```
Composant   : Checkbox (ShadCN / Radix)
Size        : default (16x16)
Border      : var(--border-c)
Checked     : bg var(--accent)
Label       : text-[11px], color var(--text-sec), leading-snug
```

### 4.6 Badge

```
Composant  : Badge (ShadCN)
Variante   : outline
Styling    : text-[8px], font-bold, tracking-[0.15em], uppercase
Border     : var(--accent) à 30% opacité
Background : var(--accent) à 10% opacité
Color      : var(--accent)
```

### 4.7 Tabs (toolbar externe)

```
Composants : Tabs, TabsList, TabsTrigger
Usage      : sélection de thème + toggle device
TabsList   : h-8, bg-[#111114], border-[#1c1c20]
TabsTrigger: h-7, text-[10px], rounded-[5px]
Active     : outline accent à 44% opacité, bg accent à 12% opacité
```

### 4.8 Separator

```
Composant  : Separator (ShadCN)
Color      : var(--border-c)
Usage      : séparation avant checkbox consent, séparation footer
```

### 4.9 Signature Canvas

```
Élément    : <canvas> natif (pas de composant ShadCN)
Dimensions : 600x200 interne, affiché à width:100% height:130px
Background : #ffffff (blanc pur pour contraste maximal de la signature)
Border     : 2px solid var(--accent)
Radius     : rounded-md (6px)
Cursor     : crosshair
Trait       : strokeStyle #1a1a2e, lineWidth 2.5, lineCap round
```

---

## 5. Système de thèmes

### Architecture

Chaque thème est un objet JavaScript qui définit un ensemble de **CSS custom properties**. Ces variables sont appliquées inline au conteneur de l'application et consommées par tous les composants.

```typescript
type ThemeDefinition = {
  id: string;
  name: string;
  emoji: string;
  headerBg: (accent: string) => string;  // CSS gradient pour le header
  vars: {
    "--bg": string;           // Fond principal
    "--surface": string;      // Fond des cartes/surfaces
    "--accent": string;       // Couleur accent principale
    "--accent-hover": string; // Accent au survol
    "--text": string;         // Texte principal (#ffffff)
    "--text-sec": string;     // Texte secondaire
    "--border-c": string;     // Bordures
    "--success": string;      // Vert validation
    "--error": string;        // Rouge erreur
    "--warning": string;      // Jaune avertissement
  };
};
```

### Les 10 tokens de couleur

| Token           | Rôle                                   | Contrainte                        |
|-----------------|----------------------------------------|-----------------------------------|
| `--bg`          | Background global de la page           | Très sombre, presque noir         |
| `--surface`     | Background des cartes et surfaces      | Légèrement plus clair que --bg    |
| `--accent`      | Couleur accent (boutons, focus, liens) | Vive, saturée                     |
| `--accent-hover`| Accent au survol                       | Légèrement plus sombre que accent |
| `--text`        | Texte principal                        | Toujours `#ffffff`                |
| `--text-sec`    | Texte secondaire, labels, descriptions | Teinte accent désaturée + claire  |
| `--border-c`    | Bordures, séparateurs                  | Teinte accent très sombre         |
| `--success`     | Succès, validation                     | Toujours `#10b981`               |
| `--error`       | Erreurs                                | Toujours `#ef4444`               |
| `--warning`     | Avertissements                         | Toujours `#f59e0b`               |

> **Note** : `--success`, `--error` et `--warning` sont identiques dans tous les thèmes pour garantir une signification universelle des couleurs sémantiques.

### Header génératif

Chaque thème génère un background de header unique via des gradients CSS (aucune image externe requise) :

```
Structure :
  1. Radial-gradient principal : halo de couleur accent, ~20% opacité
  2. Radial-gradient secondaire : halo complémentaire, ~10% opacité
  3. Linear-gradient de base : dégradé sombre reprenant la teinte du --bg
  4. SVG grid pattern : grille géométrique à 5% opacité
  5. Ligne accent : 1.5px en bas, gradient horizontal transparent→accent→transparent
```

---

## 6. Les 4 palettes existantes

### 6.1 TECH MODERN ⚡ (default)

```
Teinte accent : Cyan (#00d9ff) — HSL(187, 100%, 50%)
Tonalité      : Tech, modernité, confiance, précision
Usage idéal   : Conférences tech, événements B2B, formations digitales
```

| Token           | Valeur    | Aperçu                                              |
|-----------------|-----------|------------------------------------------------------|
| `--bg`          | `#0f1419` | ████████ Bleu-noir profond                           |
| `--surface`     | `#1a2332` | ████████ Bleu nuit                                   |
| `--accent`      | `#00d9ff` | ████████ Cyan électrique                             |
| `--accent-hover`| `#00b8cc` | ████████ Cyan foncé                                  |
| `--text`        | `#ffffff` | ████████ Blanc pur                                   |
| `--text-sec`    | `#b0b9c1` | ████████ Gris-bleu clair                             |
| `--border-c`    | `#2d3a48` | ████████ Bleu-gris sombre                            |

**Logique de dérivation :**
- `--bg` : HSL(210, 30%, 8%) — la teinte 210 (bleu) donne le fond froid
- `--surface` : HSL(215, 30%, 15%) — même famille, plus clair
- `--text-sec` : Désaturation du cyan → gris-bleu lumineux
- `--border-c` : HSL(210, 25%, 23%) — entre surface et bg en luminosité

---

### 6.2 VIBRANT PURPLE 💜

```
Teinte accent : Purple (#c084fc) — HSL(270, 95%, 74%)
Tonalité      : Premium, luxe, créativité, prestige
Usage idéal   : Galas, événements VIP, conférences design/créa
```

| Token           | Valeur    | Aperçu                                              |
|-----------------|-----------|------------------------------------------------------|
| `--bg`          | `#0f0a1a` | ████████ Violet-noir profond                         |
| `--surface`     | `#1a0f33` | ████████ Violet nuit                                 |
| `--accent`      | `#c084fc` | ████████ Violet lumineux                             |
| `--accent-hover`| `#b370f5` | ████████ Violet saturé                               |
| `--text`        | `#ffffff` | ████████ Blanc pur                                   |
| `--text-sec`    | `#d1b4e8` | ████████ Lavande clair                               |
| `--border-c`    | `#3d2d5c` | ████████ Violet sombre                               |

**Logique de dérivation :**
- `--bg` : HSL(265, 38%, 7%) — teinte violet-bleu très sombre
- `--surface` : HSL(265, 55%, 13%) — plus saturé que bg
- `--text-sec` : Teinte violet clair désaturé (#d1b4e8)
- `--border-c` : HSL(265, 35%, 27%) — violet grisé moyen-sombre

---

### 6.3 NATURE TEAL 🌿

```
Teinte accent : Teal (#14b8a6) — HSL(174, 80%, 40%)
Tonalité      : Nature, sérénité, responsabilité, bien-être
Usage idéal   : Événements santé, éco-conférences, formations bien-être
```

| Token           | Valeur    | Aperçu                                              |
|-----------------|-----------|------------------------------------------------------|
| `--bg`          | `#0d1f1f` | ████████ Vert-noir profond                           |
| `--surface`     | `#1a3a3a` | ████████ Vert nuit                                   |
| `--accent`      | `#14b8a6` | ████████ Teal vif                                    |
| `--accent-hover`| `#0d9488` | ████████ Teal foncé                                  |
| `--text`        | `#ffffff` | ████████ Blanc pur                                   |
| `--text-sec`    | `#99d5cf` | ████████ Vert d'eau clair                            |
| `--border-c`    | `#2d5450` | ████████ Vert sombre                                 |

**Logique de dérivation :**
- `--bg` : HSL(180, 40%, 9%) — teinte cyan-vert très sombre
- `--surface` : HSL(180, 37%, 16%) — même teinte, plus lumineux
- `--text-sec` : Teinte teal très claire et désaturée
- `--border-c` : HSL(174, 30%, 25%) — teal grisé sombre

---

### 6.4 ENERGY ORANGE 🔥

```
Teinte accent : Orange (#f97316) — HSL(25, 95%, 53%)
Tonalité      : Énergie, chaleur, dynamisme, accessibilité
Usage idéal   : Événements startup, networking, hackathons, lancements
```

| Token           | Valeur    | Aperçu                                              |
|-----------------|-----------|------------------------------------------------------|
| `--bg`          | `#1a0f00` | ████████ Brun-noir profond                           |
| `--surface`     | `#3d2415` | ████████ Brun chaud                                  |
| `--accent`      | `#f97316` | ████████ Orange vif                                  |
| `--accent-hover`| `#ea580c` | ████████ Orange foncé                                |
| `--text`        | `#ffffff` | ████████ Blanc pur                                   |
| `--text-sec`    | `#fed7aa` | ████████ Pêche clair                                 |
| `--border-c`    | `#5c3a1f` | ████████ Brun moyen                                  |

**Logique de dérivation :**
- `--bg` : HSL(30, 100%, 5%) — teinte orange très sombre, presque noir
- `--surface` : HSL(25, 48%, 16%) — brun chaud désaturé
- `--text-sec` : HSL(30, 95%, 83%) — orange très clair, quasi pêche
- `--border-c` : HSL(25, 50%, 24%) — brun moyen

---

## 7. Algorithme de génération de palette

### Le principe

À partir d'une **seule couleur accent** (ex: `#e63946` rouge corail), l'algorithme dérive automatiquement les 10 tokens du thème. La couleur accent est convertie en HSL, puis chaque token est calculé par transformation de la teinte (H), saturation (S) et luminosité (L).

### Étape 1 : Extraire les composantes HSL de l'accent

```
Input  : #e63946 (accent choisi par l'utilisateur)
Output : H=355°  S=78%  L=56%
```

### Étape 2 : Appliquer les formules de dérivation

| Token            | Formule                                                  | Explication                                        |
|------------------|----------------------------------------------------------|----------------------------------------------------|
| `--accent`       | `hsl(H, S, L)`                                          | Couleur choisie, telle quelle                      |
| `--accent-hover` | `hsl(H, S, L - 8%)`                                     | Légèrement plus sombre pour le hover               |
| `--bg`           | `hsl(H, clamp(S×0.35, 20%, 45%), 6%)`                   | Teinte accent, très désaturée, quasi-noir           |
| `--surface`      | `hsl(H, clamp(S×0.40, 20%, 50%), 14%)`                  | Même teinte, un cran plus clair                     |
| `--text`         | `#ffffff`                                                | Toujours blanc (invariant)                          |
| `--text-sec`     | `hsl(H, clamp(S×0.50, 25%, 60%), 80%)`                  | Teinte accent claire et douce                       |
| `--border-c`     | `hsl(H, clamp(S×0.35, 15%, 40%), 24%)`                  | Teinte accent sombre et grisée                      |
| `--success`      | `#10b981`                                                | Vert émeraude (invariant)                           |
| `--error`        | `#ef4444`                                                | Rouge (invariant)                                   |
| `--warning`      | `#f59e0b`                                                | Ambre (invariant)                                   |

### Étape 3 : Générer le header background

```
headerBg = `
  radial-gradient(
    ellipse 75% 55% at 35% 45%,
    ${accent}20,                    /* Halo principal, 12% opacité */
    transparent 55%
  ),
  radial-gradient(
    ellipse 55% 50% at 70% 30%,
    hsl(H+30, S×0.3, L×0.3)18,     /* Halo complémentaire décalé +30° */
    transparent 50%
  ),
  linear-gradient(
    145deg,
    ${bg},                           /* Du bg */
    hsl(H, S×0.5, 12%),             /* Via une teinte intermédiaire */
    ${bg}                            /* Retour au bg */
  )
`
```

### Implémentation TypeScript

```typescript
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function generateTheme(accentHex: string, name: string, id: string, emoji: string) {
  const { h, s, l } = hexToHSL(accentHex);

  const accent      = accentHex;
  const accentHover = hslToHex(h, s, Math.max(l - 8, 20));
  const bg          = hslToHex(h, clamp(s * 0.35, 20, 45), 6);
  const surface     = hslToHex(h, clamp(s * 0.40, 20, 50), 14);
  const textSec     = hslToHex(h, clamp(s * 0.50, 25, 60), 80);
  const borderC     = hslToHex(h, clamp(s * 0.35, 15, 40), 24);

  return {
    id,
    name,
    emoji,
    headerBg: (a: string) => `
      radial-gradient(ellipse 75% 55% at 35% 45%, ${a}20, transparent 55%),
      radial-gradient(ellipse 55% 50% at 70% 30%, ${hslToHex((h + 30) % 360, s * 0.3, l * 0.3)}18, transparent 50%),
      linear-gradient(145deg, ${bg}, ${hslToHex(h, s * 0.5, 12)}, ${bg})
    `,
    vars: {
      "--bg": bg,
      "--surface": surface,
      "--accent": accent,
      "--accent-hover": accentHover,
      "--text": "#ffffff",
      "--text-sec": textSec,
      "--border-c": borderC,
      "--success": "#10b981",
      "--error": "#ef4444",
      "--warning": "#f59e0b",
    },
  };
}
```

### Exemple d'utilisation

```typescript
// Générer un thème "Rose Gold" à partir de #e8a0bf
const roseGold = generateTheme("#e8a0bf", "Rose Gold", "rosegold", "🌸");

// Générer un thème "Electric Blue" à partir de #3b82f6
const electricBlue = generateTheme("#3b82f6", "Electric Blue", "blue", "💙");

// Générer un thème "Forest" à partir de #22c55e
const forest = generateTheme("#22c55e", "Forest", "forest", "🌲");

// Ajouter au dictionnaire de thèmes
const themes = {
  default: existingDefault,
  purple: existingPurple,
  teal: existingTeal,
  orange: existingOrange,
  rosegold: roseGold,       // ← nouveau
  blue: electricBlue,        // ← nouveau
  forest: forest,            // ← nouveau
};
```

### Vérification du contraste

Après génération, vérifier que le contraste est suffisant :

```typescript
function luminance(hex: string): number {
  const rgb = [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ].map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Vérifications recommandées :
// contrastRatio("--text", "--bg")       >= 4.5  (AA texte normal)
// contrastRatio("--text", "--surface")  >= 4.5  (AA texte normal)
// contrastRatio("--accent", "--bg")     >= 3.0  (AA éléments UI)
// contrastRatio("--text-sec", "--surface") >= 4.5
```

### Tableau de dérivation visuel

```
Accent choisi par l'utilisateur
        │
        ▼
   ┌─────────┐
   │  H S L  │  ← Extraction HSL
   └────┬────┘
        │
   ┌────┴──────────────────────────────────────────────────┐
   │                                                       │
   │  --accent       = hsl(H, S, L)           ● Identique │
   │  --accent-hover = hsl(H, S, L-8%)        ● Plus dark │
   │  --bg           = hsl(H, S×0.35, 6%)     ■ Très dark │
   │  --surface      = hsl(H, S×0.40, 14%)    ■ Dark      │
   │  --text-sec     = hsl(H, S×0.50, 80%)    ○ Très light│
   │  --border-c     = hsl(H, S×0.35, 24%)    ◆ Mid-dark  │
   │  --text         = #ffffff                 □ Invariant │
   │  --success      = #10b981                 □ Invariant │
   │  --error        = #ef4444                 □ Invariant │
   │  --warning      = #f59e0b                 □ Invariant │
   │                                                       │
   └───────────────────────────────────────────────────────┘
```

---

## 8. Exemples visuels

### Structure de la page

```
┌─────────────────────────────────────────────┐
│  ░░░░░░░░░ HEADER (bg génératif) ░░░░░░░░░ │
│  ┌──────┐                                   │
│  │ LOGO │  C-SIGN                           │
│  └──────┘                                   │
│  Convention Vectra                           │
│  dimanche 15 février 2026                    │
│  ─────────────── accent line ────────────── │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  Card : Feuille de présence         │    │
│  │                                     │    │
│  │  ┌──────────┐  ┌──────────┐         │    │
│  │  │ Nom *    │  │ Prénom * │         │    │
│  │  └──────────┘  └──────────┘         │    │
│  │  ┌──────────────────────────┐       │    │
│  │  │ Email *                  │       │    │
│  │  └──────────────────────────┘       │    │
│  │  ┌──────────┐  ┌──────────┐         │    │
│  │  │ Ville *  │  │ N° pro   │         │    │
│  │  └──────────┘  └──────────┘         │    │
│  │  ┌──────────────────────────┐       │    │
│  │  │ Type de bénéficiaire ▾  │        │    │
│  │  └──────────────────────────┘       │    │
│  │  ┌──────────────────────────┐       │    │
│  │  │                          │       │    │
│  │  │    Signature Canvas      │       │    │
│  │  │    (fond blanc)          │       │    │
│  │  └──────────────────────────┘       │    │
│  │  ───────── Separator ──────────     │    │
│  │  ☑ Autorisation photos              │    │
│  │                                     │    │
│  │  ┌──────────────────────────┐       │    │
│  │  │       ▶ SIGNER           │       │    │
│  │  └──────────────────────────┘       │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  C-Sign v1.0 — Vite + ShadCN/UI + Tailwind │
└─────────────────────────────────────────────┘
```

### Écran de succès

```
┌─────────────────────────────────────────────┐
│                                             │
│                                             │
│               ┌─────────┐                   │
│               │         │                   │
│               │  ✓ (●)  │  cercle --success │
│               │         │                   │
│               └─────────┘                   │
│                                             │
│                Merci !                       │
│     Votre présence a été enregistrée.       │
│                                             │
│          [ Nouvelle signature ]              │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

### Vue Mobile (dans iPhone Frame)

```
┌──────────────────────┐
│     ┌────────────┐   │  ← Dynamic Island
│ 9:41│            │▊▊ │  ← Status bar
│     └────────────┘   │
│ ░░░ HEADER ░░░░░░░░░ │
│ [Logo] C-SIGN        │
│ Convention Vectra     │
│ 15 février 2026      │
│ ──── accent line ─── │
│                      │
│ ┌──────────────────┐ │
│ │ Nom *            │ │  ← grid-cols-1
│ ├──────────────────┤ │
│ │ Prénom *         │ │
│ ├──────────────────┤ │
│ │ Email *          │ │
│ ├──────────────────┤ │
│ │ Ville *          │ │
│ ├──────────────────┤ │
│ │ N° pro           │ │
│ ├──────────────────┤ │
│ │ Bénéficiaire ▾   │ │
│ ├──────────────────┤ │
│ │ ┌──────────────┐ │ │
│ │ │  Signature   │ │ │
│ │ └──────────────┘ │ │
│ │ ☑ Photos         │ │
│ │ [ SIGNER ]       │ │
│ └──────────────────┘ │
│                      │
│    ═══════════       │  ← Home indicator
└──────────────────────┘
```

### Comparaison des 4 thèmes

```
TECH MODERN ⚡          VIBRANT PURPLE 💜
┌─────────────────┐    ┌─────────────────┐
│ ░░ cyan glow ░░ │    │ ░░ purple glow ░│
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │    │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ #0f1419  bg     │    │ #0f0a1a  bg     │
│ #1a2332  surface│    │ #1a0f33  surface│
│ ●#00d9ff accent │    │ ●#c084fc accent │
│ #b0b9c1  text-s │    │ #d1b4e8  text-s │
└─────────────────┘    └─────────────────┘

NATURE TEAL 🌿          ENERGY ORANGE 🔥
┌─────────────────┐    ┌─────────────────┐
│ ░░ teal glow ░░ │    │ ░░ orange glow ░│
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │    │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ #0d1f1f  bg     │    │ #1a0f00  bg     │
│ #1a3a3a  surface│    │ #3d2415  surface│
│ ●#14b8a6 accent │    │ ●#f97316 accent │
│ #99d5cf  text-s │    │ #fed7aa  text-s │
└─────────────────┘    └─────────────────┘
```

---

## 9. Microinteractions

| Événement        | Animation                                     | Durée  | Easing          |
|------------------|-----------------------------------------------|--------|-----------------|
| Focus input      | Border → accent + ring glow (2px, 10% opacité)| 200ms  | ease-out        |
| Hover button     | Opacity → 88%                                 | 200ms  | ease-out        |
| Active button    | Opacity → 75%                                 | 100ms  | ease-out        |
| Submit loading   | Opacity → 70%, cursor wait                    | 200ms  | ease-out        |
| Success appear   | Scale 0.92→1 + opacity 0→1                    | 500ms  | cubic-bezier(0.34, 1.56, 0.64, 1) |
| Theme switch     | Background transition                          | 300ms  | ease             |
| Device switch    | Frame width/height transition                  | 400ms  | cubic-bezier(0.4, 0, 0.2, 1) |
| Header bg        | Gradient transition                            | 500ms  | ease             |
| Disabled state   | Opacity → 50%                                 | —      | —               |

---

## 10. Structure technique

### Arbre de fichiers

```
src/
├── config/
│   └── themes.ts              ← Définitions des thèmes + generateTheme()
├── components/
│   ├── ui/                    ← Composants ShadCN/UI (Button, Input, Card, etc.)
│   ├── ThemeProvider.tsx       ← Context React pour le thème actif
│   ├── SignatureForm.tsx       ← Formulaire + canvas signature
│   ├── EventSignaturePage.tsx  ← Page complète (header + form + palette)
│   └── SuccessScreen.tsx       ← Écran post-soumission
├── App.tsx                    ← <ThemeProvider> + <EventSignaturePage>
├── main.tsx                   ← Point d'entrée React
└── index.css                  ← Tailwind directives + CSS variables ShadCN
```

### Composants ShadCN/UI utilisés

```
@/components/ui/button        → Primary submit, outline actions, ghost clear
@/components/ui/input         → Tous les champs texte
@/components/ui/label         → Labels de champs
@/components/ui/card          → Card, CardHeader, CardTitle, CardDescription, CardContent
@/components/ui/select        → Select, SelectTrigger, SelectValue, SelectContent, SelectItem
@/components/ui/checkbox      → Consentement photo
@/components/ui/separator     → Séparations visuelles
@/components/ui/badge         → Badge C-SIGN, tag Maquette
@/components/ui/tabs          → Sélecteur de thème, toggle device (toolbar studio)
```

### Dépendances

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-signature-canvas": "^1.0.6",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "lucide-react": "^0.263.1",
    "@radix-ui/react-checkbox": "^1.0.0",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.0.0",
    "@radix-ui/react-tabs": "^1.0.0",
    "@radix-ui/react-label": "^2.0.0",
    "@radix-ui/react-slot": "^1.0.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "@types/react-signature-canvas": "^1.0.0"
  }
}
```

---

> **C-SIGN Design System v2.0**
> Conçu pour l'émargement événementiel — Thématisable à l'infini depuis une seule couleur accent.
