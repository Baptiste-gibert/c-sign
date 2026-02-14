# Plan d'implémentation — Vue Création d'Événement

> **Contexte :** Refonte complète de la page `/events/new` (vue O3) de C-SIGN.
> **Référence design :** Maquette `c-sign-maquette.jsx` → onglet "Créer un événement" dans le Studio.
> **Stack :** React 19 + Vite + ShadCN/UI + Tailwind CSS v4 + TanStack Query + React Hook Form + Zod + react-i18next

---

## Problème actuel et changement d'approche

### Le problème

Dans la version actuelle, la création d'un événement sépare deux concepts qui devraient être liés : **les dates** et **les sessions**.

L'organisateur choisit des jours via un calendrier grid (clic sur des cases), puis les sessions sont créées automatiquement côté backend — une "Session principale" par défaut pour chaque date sélectionnée. L'organisateur ne découvre et ne peut configurer ces sessions qu'après coup, dans la vue détail de l'événement. Ce découplage pose plusieurs problèmes concrets :

- **Aucune visibilité à la création** — l'organisateur ne sait pas ce qu'il est en train de créer. Il clique des dates sans comprendre que chaque date génère une session d'émargement avec un QR code.
- **Pas de contrôle sur les sessions** — impossible de nommer les sessions, de définir des créneaux horaires, ou de créer plusieurs sessions par jour (ex : matin + après-midi) lors de la création. Il faut aller dans le détail de l'événement après coup pour ajuster.
- **Le calendrier grid est peu ergonomique** — pour un événement de 3 jours non consécutifs, cliquer sur des cases dans un calendrier mensuel est laborieux. Et pour un événement d'un seul jour, afficher un calendrier entier est disproportionné.
- **Pas de lien entre sessions et QR codes** — l'organisateur ne comprend pas combien de QR codes seront générés, ni à quel niveau de granularité (événement, journée, session).

### La solution proposée

On remplace le calendrier grid par un système de **cartes jour avec sessions imbriquées**, directement dans le formulaire de création :

1. **Ajouter des journées** via un input date + bouton (pas un calendrier grid). Chaque date ajoutée crée une carte visuelle.
2. **Configurer les sessions dans chaque jour** — par défaut une "Session principale" (9h-17h), avec possibilité d'en ajouter, de les nommer, et de définir des horaires via des presets rapides (Matin, Midi, Après-midi) ou manuellement.
3. **Toggle "Journée entière"** — raccourci pour le cas simple : une seule session couvrant toute la journée, avec juste début/fin modifiables.
4. **Choisir la granularité des QR codes** — nouveau sélecteur qui permet de décider si on génère 1 QR pour tout l'événement, 1 par journée, ou 1 par session. Le nombre de QR codes est affiché en temps réel.

Ce modèle rend explicite la relation **événement → journées → sessions → QR codes** dès la création, au lieu de la découvrir après coup.

---

## Vue d'ensemble des changements

La vue actuelle est un formulaire linéaire sans groupement logique : tous les champs sont empilés sur une seule colonne, le date picker est un calendrier grid peu ergonomique, les sessions ne sont pas configurables à la création, et le theme selector est mélangé au milieu du flux.

La refonte restructure le formulaire en **4 sections numérotées** dans des Cards ShadCN, introduit le concept de **Journées & Sessions** (remplaçant le simple calendar picker), ajoute un **sélecteur de granularité QR**, et déplace le **thème en dernière position** avec un badge "Optionnel".

---

## Structure finale de la page

```
┌─ Header (sticky) ─────────────────────────────────────┐
│  c-sign    Événements / Nouvel événement    Admin  FR  │
└────────────────────────────────────────────────────────┘

← Retour

Nouvel événement
Renseignez les informations de l'événement puis créez-le pour générer les QR codes.

┌─ ① Informations ──────────────────────────────────────┐
│  [Titre *]              [Lieu *]                       │
│  [Type de dépense *]    [N° CNOV (optionnel)]          │
└────────────────────────────────────────────────────────┘

┌─ ② Organisateur ─── Pré-rempli ───────────────────────┐  ← bg gris, visuellement atténué
│  [Admin Ceva]           [admin@ceva.com]     readonly  │
└────────────────────────────────────────────────────────┘

┌─ ③ Journées & Sessions ──────────────────────────────┐
│  [📅 Date input]  [+ Ajouter une journée]             │
│                                                        │
│  ┌─ dimanche 15 février 2026 ─ 2 sessions ──────────┐ │
│  │  [Journée entière]                          [🗑]  │ │
│  │  ┌ Matin        09:00 → 12:00  ☀️🍽🌤    ×  ┐    │ │
│  │  ┌ Déjeuner     12:00 → 14:00  ☀️🍽🌤    ×  ┐    │ │
│  │  ┌ - - - + Ajouter une session - - - ┐           │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ┌─ lundi 16 février 2026 ──────────────────────────┐ │
│  │  [■ Journée entière]                       [🗑]  │ │  ← toggle activé
│  │  ⏱ Journée entière     09:00 → 17:00             │ │  ← vue simplifiée
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ┌─ 🔲 Granularité des QR codes ────────────────────┐ │
│  │  [Événement]    [Par journée ✓]    [Par session]  │ │
│  │   1 QR           2 QR               3 QR          │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  2 journées · 3 sessions · QR : 2 (par journée)       │
└────────────────────────────────────────────────────────┘

┌─ ④ Thème de la page publique ── Optionnel ────────────┐
│  [Tech Modern ✓] [Vibrant Purple] [Nature Teal] [Energy Orange] │
│  ─────────────────────────────────────────────         │
│  Couleur personnalisée  [🎨] [#00d9ff]  [■■■■]        │
└────────────────────────────────────────────────────────┘

        [ Créer l'événement ]
```

---

## Changement 1 — Restructuration en 4 sections avec stepper numéroté

### Ce qui change

Le formulaire actuel est une liste plate de champs. On le restructure en 4 Cards ShadCN numérotées avec des indicateurs visuels d'étape.

### Indicateur de section (composant réutilisable)

```tsx
// src/components/ui/section-step.tsx (nouveau)

interface SectionStepProps {
  step: number;
  title: string;
  description?: string;
  badge?: string;
  muted?: boolean; // pour la section Organisateur
  children: React.ReactNode;
}

function SectionStep({
  step,
  title,
  description,
  badge,
  muted,
  children,
}: SectionStepProps) {
  return (
    <Card
      className={`border mb-4 ${muted ? "border-gray-100 bg-gray-50/50" : "border-gray-200 bg-white"}`}
    >
      <CardHeader className={`pb-2 px-5 pt-4 ${description ? "pb-1" : ""}`}>
        <div className="flex items-center gap-2">
          <div
            className={`w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center ${muted ? "bg-gray-300" : "bg-gray-900"}`}
          >
            {step}
          </div>
          <CardTitle
            className={`text-sm font-semibold ${muted ? "text-gray-500" : ""}`}
          >
            {title}
          </CardTitle>
          {badge && (
            <Badge
              variant="outline"
              className="text-[8px] text-gray-400 border-gray-200 ml-1"
            >
              {badge}
            </Badge>
          )}
        </div>
        {description && (
          <CardDescription className="text-[10px] mt-1 ml-7">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className={`px-5 ${muted ? "pb-4" : "pb-5"}`}>
        {children}
      </CardContent>
    </Card>
  );
}
```

### Style des indicateurs

```
Indicateur actif  : w-5 h-5 rounded-full bg-gray-900 text-white text-[10px] font-bold
Indicateur muted  : w-5 h-5 rounded-full bg-gray-300 text-white text-[10px] font-bold
```

### Fichiers impactés

- Créer `src/components/ui/section-step.tsx`
- Modifier `src/pages/EventCreatePage.tsx`

---

## Changement 2 — Section ① Informations (réorganisation)

### Ce qui change

Les champs existants (titre, lieu, type de dépense, CNOV) sont regroupés dans une Card et réorganisés en grille 2 colonnes.

### Layout

```
Ligne 1 : [Titre *]              [Lieu *]
Ligne 2 : [Type de dépense *]    [N° CNOV (optionnel)]
```

### Implémentation

```tsx
<SectionStep
  step={1}
  title={t("organizer.eventCreate.informations", "Informations")}
>
  <div className="space-y-3">
    {/* Ligne 1 */}
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label className="text-[10px] text-gray-500 font-medium">
          {t("organizer.eventCreate.title", "Titre")} *
        </Label>
        <Input
          className="h-8 text-xs"
          placeholder="Convention vétérinaire..."
          {...register("title")}
        />
        {errors.title && (
          <p className="text-[10px] text-red-500">{errors.title.message}</p>
        )}
      </div>
      <div className="space-y-1">
        <Label className="text-[10px] text-gray-500 font-medium">
          {t("organizer.eventCreate.location", "Lieu")} *
        </Label>
        <Input
          className="h-8 text-xs"
          placeholder="Paris, France"
          {...register("location")}
        />
      </div>
    </div>
    {/* Ligne 2 */}
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label className="text-[10px] text-gray-500 font-medium">
          {t("organizer.eventCreate.expenseType", "Type de dépense")} *
        </Label>
        <Select onValueChange={(v) => setValue("expenseType", v)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder={t("common.select", "Sélectionner...")} />
          </SelectTrigger>
          <SelectContent>
            {expenseTypes.map((t) => (
              <SelectItem key={t.value} value={t.value} className="text-xs">
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-[10px] text-gray-500 font-medium">
          {t("organizer.eventCreate.cnov", "N° CNOV")}{" "}
          <span className="text-gray-300">(optionnel)</span>
        </Label>
        <Input
          className="h-8 text-xs"
          placeholder="2024-12345"
          {...register("cnovNumber")}
        />
      </div>
    </div>
  </div>
</SectionStep>
```

### Différences avec l'existant

| Aspect              | Avant                | Après                                   |
| ------------------- | -------------------- | --------------------------------------- |
| Layout              | Champs empilés 1 col | Grid 2 cols                             |
| Labels              | `font-bold` standard | `text-[10px] text-gray-500 font-medium` |
| Input height        | default (~36px)      | `h-8` (32px)                            |
| Conteneur           | pas de Card          | Card ShadCN avec step ①                 |
| Indication required | aucune               | `*` après le label                      |
| Indication optional | aucune               | `(optionnel)` en gris clair             |

### Types de dépense (valeurs Select)

```typescript
const expenseTypes = [
  { value: "hospitality-snack", label: "Hospitalité - Collation" },
  { value: "hospitality-catering", label: "Hospitalité - Restauration" },
  { value: "hospitality-accommodation", label: "Hospitalité - Hébergement" },
  { value: "registration-fees", label: "Frais d'inscription" },
  { value: "meeting-fees", label: "Frais de réunion/organisation" },
  { value: "transport-fees", label: "Frais de transport" },
];
```

### Fichiers impactés

- `src/pages/EventCreatePage.tsx`

---

## Changement 3 — Section ② Organisateur (pré-rempli, visuellement atténué)

### Ce qui change

Les champs nom et email de l'organisateur, déjà pré-remplis, sont visuellement distingués comme non-éditables.

### Implémentation

```tsx
<SectionStep
  step={2}
  title={t("organizer.eventCreate.organizer", "Organisateur")}
  badge={t("organizer.eventCreate.prefilled", "Pré-rempli")}
  muted
>
  <div className="grid grid-cols-2 gap-3">
    <div className="space-y-1">
      <Label className="text-[10px] text-gray-400">
        {t("common.name", "Nom")}
      </Label>
      <Input
        className="h-8 text-xs bg-white text-gray-500"
        value={user.name}
        readOnly
      />
    </div>
    <div className="space-y-1">
      <Label className="text-[10px] text-gray-400">
        {t("common.email", "Email")}
      </Label>
      <Input
        className="h-8 text-xs bg-white text-gray-500"
        value={user.email}
        readOnly
      />
    </div>
  </div>
</SectionStep>
```

### Style spécifique

```
Card container  : border-gray-100 bg-gray-50/50   (plus léger que les autres Cards)
Step indicator  : bg-gray-300                       (gris au lieu de noir)
Title           : text-gray-500                     (atténué)
Labels          : text-gray-400                     (plus léger que text-gray-500)
Inputs          : bg-white text-gray-500 readOnly   (visuellement désactivés)
Badge           : "Pré-rempli" en outline gris
```

### Fichiers impactés

- `src/pages/EventCreatePage.tsx`

---

## Changement 4 — Section ③ Journées & Sessions (NOUVEAU)

### Ce qui change

**C'est le changement majeur.** Le calendrier grid est remplacé par un système de cartes jour avec sessions imbriquées. Ce changement introduit un nouveau modèle de données et une nouvelle UX complète.

### 4.1 — Modèle de données

```typescript
// src/types/event.ts — ajouter ou modifier

interface Session {
  id: string; // UUID ou timestamp
  name: string; // "Matin", "Déjeuner", "Session principale", etc.
  startTime: string; // "09:00" (format HH:mm)
  endTime: string; // "12:00"
}

interface AttendanceDay {
  date: string; // "2026-02-15" (format ISO YYYY-MM-DD)
  fullDay: boolean; // true = journée entière, pas de multi-sessions
  sessions: Session[]; // au moins 1 session
}

interface EventCreatePayload {
  title: string;
  location: string;
  organizerName: string;
  organizerEmail: string;
  expenseType: string;
  cnovNumber?: string;
  theme: string; // theme ID ou custom hex
  customAccentColor?: string;
  qrGranularity: "event" | "day" | "session"; // NOUVEAU
  days: AttendanceDay[]; // NOUVEAU — remplace l'ancien dates: string[]
}
```

### 4.2 — État local du composant

```typescript
const [newDate, setNewDate] = useState("");
const [qrGranularity, setQrGranularity] = useState<"event" | "day" | "session">(
  "day",
);
const [days, setDays] = useState<AttendanceDay[]>([]);
```

### 4.3 — Barre d'ajout de journée

```tsx
<div className="flex items-center gap-2 mb-4">
  <div className="relative flex-1">
    <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
    <Input
      type="date"
      value={newDate}
      onChange={(e) => setNewDate(e.target.value)}
      className="h-8 text-xs pl-8 bg-white border-gray-200"
    />
  </div>
  <Button
    size="sm"
    className="h-8 text-xs gap-1 bg-gray-900 hover:bg-gray-800"
    onClick={() => {
      if (!newDate) return;
      if (days.find((d) => d.date === newDate)) return; // pas de doublon
      setDays((prev) => [
        ...prev,
        {
          date: newDate,
          fullDay: false,
          sessions: [
            {
              id: crypto.randomUUID(),
              name: "Session principale",
              startTime: "09:00",
              endTime: "17:00",
            },
          ],
        },
      ]);
      setNewDate("");
    }}
  >
    <Plus className="w-3.5 h-3.5" />
    {t("organizer.eventCreate.addDay", "Ajouter une journée")}
  </Button>
</div>
```

### Comportement

- L'input `type="date"` ouvre le date picker natif du navigateur
- Un clic sur "Ajouter une journée" crée une carte jour en dessous
- Par défaut, la journée a 1 session "Session principale" de 09:00 à 17:00
- Les doublons de date sont ignorés silencieusement
- Les journées sont toujours triées par date croissante (`days.sort((a,b) => a.date.localeCompare(b.date))`)

### 4.4 — État vide

```tsx
{
  days.length === 0 && (
    <div className="text-center py-8 border border-dashed border-gray-200 rounded-lg">
      <p className="text-xs text-gray-400">
        {t("organizer.eventCreate.noDays", "Aucune journée ajoutée.")}
      </p>
      <p className="text-[10px] text-gray-300 mt-1">
        {t(
          "organizer.eventCreate.noDaysHint",
          "Sélectionnez une date ci-dessus pour commencer.",
        )}
      </p>
    </div>
  );
}
```

### 4.5 — Carte jour : header

```tsx
<div className="border border-gray-200 rounded-lg overflow-hidden">
  <div className="bg-gray-50 px-4 py-2.5 flex items-center justify-between">
    {/* Gauche: icône + date formatée + badge sessions */}
    <div className="flex items-center gap-2">
      <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
      <span className="text-xs font-semibold text-gray-800 capitalize">
        {new Date(day.date + "T12:00:00").toLocaleDateString(
          i18n.language === "fr" ? "fr-FR" : "en-US",
          { weekday: "long", day: "numeric", month: "long", year: "numeric" },
        )}
      </span>
      {!day.fullDay && (
        <Badge
          variant="secondary"
          className="text-[9px] bg-gray-200/60 text-gray-500"
        >
          {day.sessions.length} session{day.sessions.length > 1 ? "s" : ""}
        </Badge>
      )}
    </div>

    {/* Droite: toggle journée entière + supprimer */}
    <div className="flex items-center gap-2">
      <button
        className={`flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[10px] font-medium transition-all ${
          day.fullDay
            ? "bg-gray-900 text-white"
            : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"
        }`}
        onClick={() => toggleFullDay(day.date)}
      >
        <Clock className="w-2.5 h-2.5" />
        {t("organizer.eventCreate.fullDay", "Journée entière")}
      </button>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
        onClick={() => removeDay(day.date)}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  </div>
  {/* ... sessions area below ... */}
</div>
```

### Toggle "Journée entière" — logique

```typescript
function toggleFullDay(date: string) {
  setDays((prev) =>
    prev.map((d) => {
      if (d.date !== date) return d;
      if (!d.fullDay) {
        // Passer en journée entière : remplacer les sessions par une seule
        return {
          ...d,
          fullDay: true,
          sessions: [
            {
              id: crypto.randomUUID(),
              name: "Journée entière",
              startTime: "09:00",
              endTime: "17:00",
            },
          ],
        };
      } else {
        // Désactiver journée entière : garder la session mais permettre d'en ajouter
        return { ...d, fullDay: false };
      }
    }),
  );
}
```

### Style du toggle

```
Activé   : bg-gray-900 text-white rounded-full h-6 px-2.5 text-[10px] font-medium
Désactivé : bg-white border border-gray-200 text-gray-500 rounded-full h-6 px-2.5 text-[10px] font-medium
           hover:border-gray-300
```

### 4.6 — Mode journée entière (vue simplifiée)

Quand `fullDay === true`, le contenu de la carte est une seule ligne :

```tsx
<div className="px-4 py-3">
  <div className="flex items-center gap-3 bg-gray-50/50 border border-gray-100 rounded-md px-3 py-2.5">
    <span className="text-[10px] text-gray-400">⏱</span>
    <span className="text-xs font-medium text-gray-600 flex-1">
      {t("organizer.eventCreate.fullDay", "Journée entière")}
    </span>
    <div className="flex items-center gap-1 shrink-0">
      <Input
        type="time"
        value={day.sessions[0].startTime}
        onChange={(e) =>
          updateSessionTime(
            day.date,
            day.sessions[0].id,
            "startTime",
            e.target.value,
          )
        }
        className="h-7 text-[10px] w-[72px] text-center border-gray-200 tabular-nums"
      />
      <span className="text-[10px] text-gray-300">→</span>
      <Input
        type="time"
        value={day.sessions[0].endTime}
        onChange={(e) =>
          updateSessionTime(
            day.date,
            day.sessions[0].id,
            "endTime",
            e.target.value,
          )
        }
        className="h-7 text-[10px] w-[72px] text-center border-gray-200 tabular-nums"
      />
    </div>
  </div>
</div>
```

### 4.7 — Mode multi-sessions

Quand `fullDay === false`, chaque session est une ligne éditable :

```tsx
{
  day.sessions.map((session) => (
    <div
      key={session.id}
      className="flex items-center gap-2 bg-white border border-gray-100 rounded-md px-3 py-2"
    >
      {/* Nom de session — éditable inline */}
      <Input
        value={session.name}
        onChange={(e) =>
          updateSessionName(day.date, session.id, e.target.value)
        }
        className="h-7 text-xs border-0 bg-transparent p-0 font-medium text-gray-700 flex-1 focus-visible:ring-0 shadow-none"
        placeholder={t(
          "organizer.eventCreate.sessionName",
          "Nom de la session",
        )}
      />

      {/* Horaires */}
      <div className="flex items-center gap-1 shrink-0">
        <Input
          type="time"
          value={session.startTime}
          onChange={(e) =>
            updateSessionTime(day.date, session.id, "startTime", e.target.value)
          }
          className="h-7 text-[10px] w-[72px] text-center border-gray-200 tabular-nums"
        />
        <span className="text-[10px] text-gray-300">→</span>
        <Input
          type="time"
          value={session.endTime}
          onChange={(e) =>
            updateSessionTime(day.date, session.id, "endTime", e.target.value)
          }
          className="h-7 text-[10px] w-[72px] text-center border-gray-200 tabular-nums"
        />
      </div>

      {/* Presets rapides */}
      <div className="flex gap-0.5 shrink-0">
        {sessionPresets.map((preset) => (
          <button
            key={preset.label}
            title={`${preset.label} (${preset.start}–${preset.end})`}
            className="h-6 w-6 rounded text-[10px] bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-center"
            onClick={() => applyPreset(day.date, session.id, preset)}
          >
            {preset.icon}
          </button>
        ))}
      </div>

      {/* Supprimer session (uniquement si >1) */}
      {day.sessions.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-gray-300 hover:text-red-500 shrink-0"
          onClick={() => removeSession(day.date, session.id)}
        >
          ×
        </Button>
      )}
    </div>
  ));
}

{
  /* Bouton ajouter session */
}
<button
  className="w-full border border-dashed border-gray-200 rounded-md py-1.5 text-[10px] text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors flex items-center justify-center gap-1"
  onClick={() => addSession(day.date)}
>
  <Plus className="w-3 h-3" />
  {t("organizer.eventCreate.addSession", "Ajouter une session")}
</button>;
```

### Presets de session

```typescript
const sessionPresets = [
  { label: "Matin", icon: "☀️", start: "09:00", end: "12:00" },
  { label: "Midi", icon: "🍽", start: "12:00", end: "14:00" },
  { label: "Après-midi", icon: "🌤", start: "14:00", end: "17:00" },
];
```

### Logique d'application d'un preset

```typescript
function applyPreset(
  date: string,
  sessionId: string,
  preset: (typeof sessionPresets)[0],
) {
  setDays((prev) =>
    prev.map((d) => {
      if (d.date !== date) return d;
      return {
        ...d,
        sessions: d.sessions.map((s) => {
          if (s.id !== sessionId) return s;
          return {
            ...s,
            startTime: preset.start,
            endTime: preset.end,
            // Auto-renommer seulement si le nom est encore générique
            name:
              s.name === "Session principale" || s.name === "Nouvelle session"
                ? preset.label
                : s.name,
          };
        }),
      };
    }),
  );
}
```

### Fonctions helper pour la mutation d'état

```typescript
function updateSessionName(date: string, sessionId: string, name: string) {
  setDays((prev) =>
    prev.map((d) =>
      d.date === date
        ? {
            ...d,
            sessions: d.sessions.map((s) =>
              s.id === sessionId ? { ...s, name } : s,
            ),
          }
        : d,
    ),
  );
}

function updateSessionTime(
  date: string,
  sessionId: string,
  field: "startTime" | "endTime",
  value: string,
) {
  setDays((prev) =>
    prev.map((d) =>
      d.date === date
        ? {
            ...d,
            sessions: d.sessions.map((s) =>
              s.id === sessionId ? { ...s, [field]: value } : s,
            ),
          }
        : d,
    ),
  );
}

function addSession(date: string) {
  setDays((prev) =>
    prev.map((d) =>
      d.date === date
        ? {
            ...d,
            sessions: [
              ...d.sessions,
              {
                id: crypto.randomUUID(),
                name: "Nouvelle session",
                startTime: "09:00",
                endTime: "17:00",
              },
            ],
          }
        : d,
    ),
  );
}

function removeSession(date: string, sessionId: string) {
  setDays((prev) =>
    prev.map((d) =>
      d.date === date
        ? { ...d, sessions: d.sessions.filter((s) => s.id !== sessionId) }
        : d,
    ),
  );
}

function removeDay(date: string) {
  setDays((prev) => prev.filter((d) => d.date !== date));
}
```

### 4.8 — Sélecteur de granularité QR

Affiché uniquement quand `days.length > 0`. Trois cartes sélectionnables en grid 3 colonnes.

```tsx
{
  days.length > 0 && (
    <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-2.5 flex items-center gap-2">
        <QrCode className="w-4 h-4 text-gray-400" />
        <span className="text-xs font-semibold text-gray-700">
          {t("organizer.eventCreate.qrGranularity", "Granularité des QR codes")}
        </span>
      </div>
      <div className="px-4 py-3">
        <p className="text-[10px] text-gray-400 mb-3">
          {t(
            "organizer.eventCreate.qrGranularityDesc",
            "Choisissez à quel niveau générer les QR codes d'émargement.",
          )}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {qrOptions.map((opt) => (
            <button
              key={opt.key}
              className={`text-left rounded-lg border-2 p-3 transition-all ${
                qrGranularity === opt.key
                  ? "border-gray-900 bg-gray-50 ring-1 ring-gray-900/10"
                  : "border-gray-100 hover:border-gray-200"
              }`}
              onClick={() => setQrGranularity(opt.key)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-gray-800">
                  {opt.label}
                </span>
                <Badge
                  variant={qrGranularity === opt.key ? "default" : "secondary"}
                  className={`text-[8px] px-1.5 ${qrGranularity === opt.key ? "bg-gray-900" : ""}`}
                >
                  {opt.count}
                </Badge>
              </div>
              <p className="text-[9px] text-gray-400 leading-snug">
                {opt.desc}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Options QR (calculées dynamiquement)

```typescript
const totalSessions = days.reduce((acc, d) => acc + d.sessions.length, 0);

const qrOptions = [
  {
    key: "event" as const,
    label: t("organizer.eventCreate.qrEvent", "Événement"),
    desc: t(
      "organizer.eventCreate.qrEventDesc",
      "1 QR code unique pour tout l'événement",
    ),
    count: "1 QR",
  },
  {
    key: "day" as const,
    label: t("organizer.eventCreate.qrDay", "Par journée"),
    desc: t(
      "organizer.eventCreate.qrDayDesc",
      "1 QR code par journée de présence",
    ),
    count: `${days.length} QR`,
  },
  {
    key: "session" as const,
    label: t("organizer.eventCreate.qrSession", "Par session"),
    desc: t(
      "organizer.eventCreate.qrSessionDesc",
      "1 QR code par session individuelle",
    ),
    count: `${totalSessions} QR`,
  },
];
```

### Style de la carte sélectionnée vs non sélectionnée

```
Sélectionnée     : border-2 border-gray-900 bg-gray-50 ring-1 ring-gray-900/10
Non sélectionnée : border-2 border-gray-100 hover:border-gray-200
Badge sélectionné : bg-gray-900 text-white text-[8px]
Badge non sélectionné : bg-gray-100 text-gray-600 text-[8px]
```

### 4.9 — Bandeau récapitulatif

```tsx
{
  days.length > 0 && (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
      <p className="text-[10px] text-gray-500">
        <span className="font-semibold text-gray-700">
          {days.length} journée{days.length > 1 ? "s" : ""}
        </span>
        {" · "}
        {totalSessions} session{totalSessions > 1 ? "s" : ""}
        {" · QR codes : "}
        <span className="font-semibold text-gray-700">
          {qrGranularity === "event"
            ? "1 global"
            : qrGranularity === "day"
              ? `${days.length} (par journée)`
              : `${totalSessions} (par session)`}
        </span>
      </p>
    </div>
  );
}
```

### Fichiers impactés

- `src/pages/EventCreatePage.tsx` — refonte complète de la section dates
- `src/types/event.ts` — nouveaux types `Session`, `AttendanceDay`, mise à jour `EventCreatePayload`

---

## Changement 5 — Section ④ Thème (déplacé en dernier, badge Optionnel)

### Ce qui change

Le theme selector existant est déplacé de la position 3 à la position 4 (dernière section). Un badge "Optionnel" est ajouté et la description est mise à jour.

### Implémentation

```tsx
<SectionStep
  step={4}
  title={t("organizer.eventCreate.theme", "Thème de la page publique")}
  badge={t("common.optional", "Optionnel")}
  description={t(
    "organizer.eventCreate.themeDesc",
    "Personnalisez l'apparence de la page d'émargement. Par défaut : Tech Modern.",
  )}
>
  {/* Grille 4 thèmes */}
  <div className="grid grid-cols-4 gap-2 mb-4">
    {themeCards.map((t) => (
      <button
        key={t.id}
        onClick={() => setTheme(t.id)}
        className={`rounded-lg border-2 transition-all overflow-hidden ${
          theme === t.id
            ? "ring-2 ring-offset-2 ring-gray-900 border-transparent scale-[1.02]"
            : "border-gray-100 hover:border-gray-200"
        }`}
      >
        <div className="h-7 w-full" style={{ background: t.color }} />
        <div className="py-1.5 text-center">
          <span className="text-[10px] font-medium text-gray-700">
            {t.name}
          </span>
        </div>
      </button>
    ))}
  </div>

  <Separator className="my-3" />

  {/* Couleur personnalisée */}
  <div className="flex items-center gap-3">
    <Label className="text-[10px] text-gray-500 whitespace-nowrap">
      {t("organizer.eventCreate.customColor", "Couleur personnalisée")}
    </Label>
    <input
      type="color"
      value={customColor}
      onChange={(e) => {
        setCustomColor(e.target.value);
        setTheme("custom");
      }}
      className="w-7 h-7 rounded border border-gray-200 cursor-pointer p-0"
    />
    <Input
      className="h-7 text-[10px] w-24 font-mono"
      value={customColor}
      onChange={(e) => {
        setCustomColor(e.target.value);
        setTheme("custom");
      }}
    />
    {/* Preview des tokens dérivés */}
    <div className="flex gap-1 ml-2">
      {derivedColors.map((color, i) => (
        <div
          key={i}
          className="w-5 h-5 rounded"
          style={{ background: color, border: "1px solid #e5e7eb" }}
          title={["bg", "surface", "accent", "text-sec"][i]}
        />
      ))}
    </div>
  </div>
</SectionStep>
```

### Style des cartes thème

```
Non sélectionnée : border-2 border-gray-100 hover:border-gray-200 rounded-lg overflow-hidden
Sélectionnée     : ring-2 ring-offset-2 ring-gray-900 border-transparent scale-[1.02]
Barre de couleur : h-7 w-full (couleur accent du thème)
Label            : text-[10px] font-medium text-gray-700, centré, py-1.5
```

### Fichiers impactés

- `src/pages/EventCreatePage.tsx` — déplacement de la section + ajout badge
- `src/components/ThemeSelector.tsx` (si composant séparé) — pas de changement fonctionnel

---

## Changement 6 — Bouton de soumission

### Implémentation

```tsx
<Button
  className="w-full h-9 text-xs font-semibold bg-gray-900 hover:bg-gray-800"
  onClick={handleSubmit}
  disabled={isSubmitting}
>
  {isSubmitting
    ? t("common.creating", "Création en cours...")
    : t("organizer.eventCreate.submit", "Créer l'événement")}
</Button>
```

### Style

```
Height     : h-9 (36px)
Width      : w-full
Background : bg-gray-900 hover:bg-gray-800
Text       : text-xs font-semibold text-white
Disabled   : opacity-70 cursor-not-allowed
Radius     : default ShadCN (~6px)
Margin     : mb-6 en dessous de la dernière Card
```

---

## Changement 7 — Layout et navigation de page

### Header breadcrumb

```tsx
<button
  className="flex items-center gap-1 text-xs text-gray-400 mb-4 hover:text-gray-600"
  onClick={() => navigate("/dashboard")}
>
  <ChevronLeft className="w-4 h-4" /> {t("common.back", "Retour")}
</button>
```

### Titre et description

```tsx
<h1 className="text-xl font-bold text-gray-900 mb-1">
  {t("organizer.eventCreate.title", "Nouvel événement")}
</h1>
<p className="text-xs text-gray-400 mb-6">
  {t("organizer.eventCreate.subtitle", "Renseignez les informations de l'événement puis créez-le pour générer les QR codes.")}
</p>
```

### Container

```
Page background : bg-[#fafafa] min-h-full
Content max-width : max-w-[640px] mx-auto px-5 py-6
```

---

## Changement 8 — Validation Zod (mise à jour du schéma)

### Schéma actuel (à modifier)

```typescript
// src/schemas/event.ts

import { z } from "zod";

const sessionSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Le nom de session est requis"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:mm requis"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:mm requis"),
});

const attendanceDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD requis"),
  fullDay: z.boolean(),
  sessions: z.array(sessionSchema).min(1, "Au moins une session requise"),
});

export const eventCreateSchema = z
  .object({
    title: z.string().min(1, "Le titre est requis"),
    location: z.string().min(1, "Le lieu est requis"),
    organizerName: z.string().min(1),
    organizerEmail: z.string().email(),
    expenseType: z.string().min(1, "Le type de dépense est requis"),
    cnovNumber: z.string().optional(),
    theme: z.string().default("default"),
    customAccentColor: z.string().optional(),
    qrGranularity: z.enum(["event", "day", "session"]).default("day"),
    days: z.array(attendanceDaySchema).min(1, "Au moins une journée requise"),
  })
  .refine(
    (data) => {
      // Valider que endTime > startTime pour chaque session
      for (const day of data.days) {
        for (const session of day.sessions) {
          if (session.endTime <= session.startTime) return false;
        }
      }
      return true;
    },
    { message: "L'heure de fin doit être après l'heure de début" },
  );
```

### Fichiers impactés

- Créer ou modifier `src/schemas/event.ts`

---

## Résumé des fichiers à modifier / créer

| Fichier                              | Action                 | Description                                                                               |
| ------------------------------------ | ---------------------- | ----------------------------------------------------------------------------------------- |
| `src/pages/EventCreatePage.tsx`      | **Modifier (refonte)** | Restructuration complète : 4 sections, journées & sessions, QR granularity, thème déplacé |
| `src/components/ui/section-step.tsx` | **Créer**              | Composant réutilisable pour les sections numérotées                                       |
| `src/types/event.ts`                 | **Modifier**           | Ajouter `Session`, `AttendanceDay`, mettre à jour `EventCreatePayload`                    |
| `src/schemas/event.ts`               | **Modifier**           | Mettre à jour le schéma Zod avec sessions, qrGranularity                                  |
| Backend `POST /events`               | **Modifier**           | Accepter `days[]` avec sessions au lieu de `dates[]`, + `qrGranularity`                   |

---

## Clés i18n à ajouter

```json
{
  "organizer.eventCreate.informations": "Informations",
  "organizer.eventCreate.organizer": "Organisateur",
  "organizer.eventCreate.prefilled": "Pré-rempli",
  "organizer.eventCreate.daysSessions": "Journées & Sessions",
  "organizer.eventCreate.daysSessionsDesc": "Ajoutez des journées puis configurez les sessions d'émargement pour chacune.",
  "organizer.eventCreate.addDay": "Ajouter une journée",
  "organizer.eventCreate.noDays": "Aucune journée ajoutée.",
  "organizer.eventCreate.noDaysHint": "Sélectionnez une date ci-dessus pour commencer.",
  "organizer.eventCreate.fullDay": "Journée entière",
  "organizer.eventCreate.sessionName": "Nom de la session",
  "organizer.eventCreate.addSession": "Ajouter une session",
  "organizer.eventCreate.qrGranularity": "Granularité des QR codes",
  "organizer.eventCreate.qrGranularityDesc": "Choisissez à quel niveau générer les QR codes d'émargement.",
  "organizer.eventCreate.qrEvent": "Événement",
  "organizer.eventCreate.qrEventDesc": "1 QR code unique pour tout l'événement",
  "organizer.eventCreate.qrDay": "Par journée",
  "organizer.eventCreate.qrDayDesc": "1 QR code par journée de présence",
  "organizer.eventCreate.qrSession": "Par session",
  "organizer.eventCreate.qrSessionDesc": "1 QR code par session individuelle",
  "organizer.eventCreate.theme": "Thème de la page publique",
  "organizer.eventCreate.themeDesc": "Personnalisez l'apparence de la page d'émargement. Par défaut : Tech Modern.",
  "organizer.eventCreate.customColor": "Couleur personnalisée",
  "organizer.eventCreate.submit": "Créer l'événement",
  "common.optional": "Optionnel",
  "common.back": "Retour",
  "common.creating": "Création en cours..."
}
```

---

## Ordre d'implémentation recommandé

1. **Types et schéma** — `Session`, `AttendanceDay`, schéma Zod (fondation)
2. **Composant SectionStep** — réutilisable, pas de dépendance
3. **Changement 2** — Section ① Informations (réorganisation simple)
4. **Changement 3** — Section ② Organisateur (style muted)
5. **Changement 4** — Section ③ Journées & Sessions (le plus complexe)
6. **Changement 5** — Section ④ Thème (déplacement)
7. **Changement 6+7** — Bouton submit + navigation
8. **Changement 8** — Validation Zod complète

---

## Tests à valider

### Journées

- [ ] Ajouter une journée via le date picker crée une carte jour
- [ ] Impossible d'ajouter deux fois la même date
- [ ] Les journées sont triées par date croissante
- [ ] Supprimer une journée la retire de la liste
- [ ] État vide affiche le placeholder "Aucune journée ajoutée"

### Sessions

- [ ] Chaque nouvelle journée a 1 "Session principale" par défaut (09:00-17:00)
- [ ] Ajouter une session crée une "Nouvelle session" (09:00-17:00)
- [ ] Le nom de session est éditable inline
- [ ] Les horaires start/end sont éditables via input time
- [ ] Les presets ☀️🍽🌤 appliquent correctement les horaires
- [ ] Les presets renomment la session si elle a un nom générique
- [ ] Supprimer une session fonctionne (bouton × visible seulement si >1 session)
- [ ] Le compteur "N sessions" dans le header se met à jour

### Journée entière

- [ ] Toggle "Journée entière" remplace les sessions par une seule "Journée entière"
- [ ] Le badge "N sessions" disparaît quand le mode est activé
- [ ] La vue simplifiée affiche uniquement début/fin modifiables
- [ ] Désactiver le toggle restaure le mode multi-sessions

### QR Granularité

- [ ] Le sélecteur n'apparaît que si au moins 1 journée existe
- [ ] "Par journée" est sélectionné par défaut
- [ ] Les compteurs QR se mettent à jour dynamiquement
- [ ] Le bandeau récapitulatif reflète le choix

### Thème

- [ ] Le theme selector est en dernière position (section 4)
- [ ] Le badge "Optionnel" est affiché
- [ ] Cliquer un thème le sélectionne (ring visual)
- [ ] Le color picker custom met à jour la preview des tokens

### Soumission

- [ ] Le formulaire ne se soumet pas si aucune journée n'est ajoutée
- [ ] Le formulaire ne se soumet pas sans titre ni lieu
- [ ] Les horaires de session sont validés (fin > début)
- [ ] Après soumission, redirection vers `/events/:id`
- [ ] Le payload inclut `days`, `qrGranularity`, `theme`
