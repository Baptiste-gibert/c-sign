# Plan d'implémentation — Vue Dashboard (Liste des événements)

> **Contexte :** Refonte UX de la page `/dashboard` (vue O2) de C-SIGN.
> **Référence design :** Maquette `c-sign-maquette.jsx` → onglet "Dashboard" dans le Studio.
> **Stack :** React 19 + Vite + ShadCN/UI + Tailwind CSS v4 + TanStack Query

---

## Résumé des changements

La vue actuelle est un tableau simple sans recherche, sans filtre, sans tri, et sans indicateur de progression des signatures. La refonte ajoute une barre d'outils (recherche + filtres statut), une colonne signatures avec progress bar, des badges colorés sémantiques, un compteur d'événements actifs, et un hover row amélioré.

---

## Changement 1 — Compteur d'événements dans le header de page

### Ce qui change

Le header affiche actuellement "Mes événements" + bouton "+ Nouvel événement". On ajoute un sous-titre avec le décompte total et le nombre d'événements actifs.

### Implémentation

```tsx
// Sous le <h1>Mes événements</h1>, ajouter :
<p className="text-xs text-gray-400 mt-0.5">
  {events.length} événements ·{" "}
  {events.filter((e) => e.status === "open" || e.status === "reopened").length}{" "}
  actifs
</p>
```

### Données nécessaires

- `events` : array déjà disponible via TanStack Query (`useEvents()` ou équivalent)
- Filtrer par `status === "open" || status === "reopened"` pour le compteur actifs

### Fichiers impactés

- `src/pages/DashboardPage.tsx` (ou équivalent)

---

## Changement 2 — Barre de recherche

### Ce qui change

Aucune recherche n'existe actuellement. On ajoute un champ de recherche texte qui filtre les événements par titre côté client.

### Implémentation

```tsx
// État local
const [search, setSearch] = useState("");

// Filtrage
const filtered = events.filter(
  (e) => !search || e.title.toLowerCase().includes(search.toLowerCase()),
);

// UI — Input avec icône Search à gauche
<div className="relative flex-1 max-w-xs">
  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
  <Input
    placeholder="Rechercher un événement..."
    className="h-8 text-xs pl-8 bg-white border-gray-200"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />
</div>;
```

### Composants ShadCN utilisés

- `Input` depuis `@/components/ui/input`
- Icône `Search` depuis `lucide-react`

### Comportement

- Filtrage instantané côté client (pas de debounce nécessaire pour < 100 events)
- Vider le champ restaure la liste complète
- Le filtre s'applique **en combinaison** avec le filtre statut (changement 3)

### Fichiers impactés

- `src/pages/DashboardPage.tsx`

---

## Changement 3 — Filtres par statut

### Ce qui change

Aucun filtre statut n'existe. On ajoute une rangée de boutons pilules : "Tous", "Brouillons", "Ouverts", "Finalisés", "Réouverts".

### Implémentation

```tsx
// État local
const [filter, setFilter] = useState<"all" | EventStatus>("all");

// Filtrage (combiné avec la recherche)
const filtered = events.filter((e) => {
  if (filter !== "all" && e.status !== filter) return false;
  if (search && !e.title.toLowerCase().includes(search.toLowerCase()))
    return false;
  return true;
});

// UI — Rangée de boutons à droite de la recherche
const filters = [
  { key: "all", label: t("common.all", "Tous") },
  { key: "draft", label: t("organizer.status.draft", "Brouillons") },
  { key: "open", label: t("organizer.status.open", "Ouverts") },
  { key: "finalized", label: t("organizer.status.finalized", "Finalisés") },
  { key: "reopened", label: t("organizer.status.reopened", "Réouverts") },
];

<div className="flex gap-1">
  {filters.map((f) => (
    <Button
      key={f.key}
      variant={filter === f.key ? "default" : "ghost"}
      size="sm"
      className={`h-7 text-[10px] px-2.5 ${
        filter === f.key ? "bg-gray-900 text-white" : "text-gray-500"
      }`}
      onClick={() => setFilter(f.key)}
    >
      {f.label}
    </Button>
  ))}
</div>;
```

### Composants ShadCN utilisés

- `Button` depuis `@/components/ui/button`

### Comportement

- "Tous" est sélectionné par défaut
- Un seul filtre actif à la fois (single select)
- Se combine avec la recherche texte
- Les compteurs par statut ne sont PAS affichés sur les boutons (pour rester simple)

### Fichiers impactés

- `src/pages/DashboardPage.tsx`
- `src/types/event.ts` — vérifier que `EventStatus` est un type exporté (`"draft" | "open" | "finalized" | "reopened"`)

---

## Changement 4 — Badges de statut colorés

### Ce qui change

Les badges actuels affichent le texte du statut mais sans différenciation colorée forte. On remplace par des badges avec pastille colorée + couleur de fond sémantique.

### Implémentation

```tsx
// Configuration des statuts — à extraire dans un fichier utilitaire
// src/config/status.ts (nouveau fichier ou ajout dans un existant)

export const statusConfig: Record<
  EventStatus,
  {
    label: string;
    labelEn: string;
    bg: string;
    text: string;
    dot: string;
  }
> = {
  draft: {
    label: "Brouillon",
    labelEn: "Draft",
    bg: "#f3f4f6", // gray-100
    text: "#6b7280", // gray-500
    dot: "#9ca3af", // gray-400
  },
  open: {
    label: "Ouvert",
    labelEn: "Open",
    bg: "#dcfce7", // green-100
    text: "#16a34a", // green-600
    dot: "#22c55e", // green-500
  },
  finalized: {
    label: "Finalisé",
    labelEn: "Finalized",
    bg: "#dbeafe", // blue-100
    text: "#2563eb", // blue-600
    dot: "#3b82f6", // blue-500
  },
  reopened: {
    label: "Réouvert",
    labelEn: "Reopened",
    bg: "#fef3c7", // amber-100
    text: "#d97706", // amber-600
    dot: "#f59e0b", // amber-500
  },
};
```

```tsx
// Dans la cellule Status du tableau :
const st = statusConfig[event.status];

<Badge
  variant="secondary"
  className="text-[10px] font-medium gap-1.5 px-2 py-0.5"
  style={{ background: st.bg, color: st.text }}
>
  <span
    className="inline-block w-1.5 h-1.5 rounded-full"
    style={{ background: st.dot }}
  />
  {i18n.language === "fr" ? st.label : st.labelEn}
</Badge>;
```

### Composants ShadCN utilisés

- `Badge` depuis `@/components/ui/badge` (variante `secondary` avec style override)

### Notes i18n

- Les labels sont dans la config pour simplifier. Alternativement, utiliser les clés i18n existantes : `t(\`organizer.status.${event.status}\`)`

### Fichiers impactés

- Créer `src/config/status.ts` (ou ajouter dans un fichier config existant)
- `src/pages/DashboardPage.tsx` — modifier le rendu de la colonne Status

---

## Changement 5 — Colonne "Signatures" avec progress bar

### Ce qui change

Aucune colonne de progression n'existe. On ajoute une colonne entre "Type de dépense" et "Statut" qui affiche une mini barre de progression + compteur "X / Y".

### Données nécessaires

L'API doit fournir, pour chaque événement, le nombre de signatures collectées et le nombre total attendu (nombre de participants). Si ces données ne sont pas actuellement disponibles dans l'endpoint `/events`, il y a deux options :

**Option A (préférée) :** Ajouter `signatureCount` et `participantCount` à la réponse de l'API `GET /events`.

**Option B (fallback) :** Calculer côté client si les données de participants et d'attendance sont déjà chargées ailleurs. Moins optimal car nécessite des requêtes supplémentaires.

```tsx
// Type attendu sur chaque event :
type EventWithProgress = Event & {
  signatureCount: number; // nombre de signatures reçues (toutes journées confondues)
  participantCount: number; // nombre de participants inscrits
};
```

### Implémentation

```tsx
// Calcul du pourcentage
const total = event.participantCount || 0;
const done = event.signatureCount || 0;
const pct = total > 0 ? Math.round((done / total) * 100) : 0;

// UI dans la cellule
<td className="px-4 py-3">
  <div className="flex items-center gap-2">
    <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{
          width: `${pct}%`,
          background: pct === 100 ? "#22c55e" : "#3b82f6",
        }}
      />
    </div>
    <span className="text-xs text-gray-500 tabular-nums">
      {done}/{total}
    </span>
  </div>
</td>;
```

### Logique de couleur

- `0%` : barre vide (gris)
- `1-99%` : bleu (`#3b82f6`)
- `100%` : vert (`#22c55e`)

### Header de colonne

```tsx
<th className="text-left font-medium text-gray-500 px-4 py-2.5 text-xs">
  Signatures
</th>
```

### Fichiers impactés

- `src/pages/DashboardPage.tsx` — ajouter la colonne
- `src/types/event.ts` — ajouter `signatureCount` et `participantCount` au type
- Backend : modifier le endpoint `GET /events` pour inclure ces compteurs (si pas déjà fait)

---

## Changement 6 — Hover sur les lignes du tableau

### Ce qui change

Le hover actuel est minimal. On améliore l'interactivité visuelle et on rend toute la ligne cliquable (navigation vers `/events/:id`).

### Implémentation

```tsx
<tr
  key={event.id}
  className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors"
  onClick={() => navigate(`/events/${event.id}`)}
>
  {/* ... cells ... */}
</tr>
```

### Comportement

- Toute la ligne est cliquable (pas seulement le bouton "Voir")
- Le bouton "Voir →" reste affiché en dernière colonne comme affordance visuelle
- `cursor-pointer` sur le `<tr>`
- Transition de fond au hover : `hover:bg-gray-50/50`

### Fichiers impactés

- `src/pages/DashboardPage.tsx`

---

## Changement 7 — Bouton "Nouvel événement" plus proéminent

### Ce qui change

Le bouton actuel est un texte "+ New event" discret. On le remplace par un bouton primary avec icône.

### Implémentation

```tsx
<Button
  size="sm"
  className="h-8 gap-1.5 text-xs bg-gray-900 hover:bg-gray-800"
  onClick={() => navigate("/events/new")}
>
  <Plus className="w-3.5 h-3.5" />
  {t("organizer.newEvent", "Nouvel événement")}
</Button>
```

### Composants ShadCN utilisés

- `Button` (variante default, couleur override `bg-gray-900`)
- Icône `Plus` depuis `lucide-react`

### Fichiers impactés

- `src/pages/DashboardPage.tsx`

---

## Changement 8 — Style du tableau (affinements)

### Ce qui change

Améliorations visuelles mineures au tableau existant pour correspondre à la maquette.

### Détails

| Élément            | Avant                | Après                                                                   |
| ------------------ | -------------------- | ----------------------------------------------------------------------- |
| Conteneur tableau  | pas de Card          | Wrappé dans `<Card>` ShadCN                                             |
| Header row bg      | transparent          | `bg-gray-50/60`                                                         |
| Header font        | normal               | `text-xs font-medium text-gray-500`                                     |
| Cell padding       | variable             | `px-4 py-3` uniforme                                                    |
| Row border         | `border-b` classique | `border-b border-gray-50` (plus subtil)                                 |
| Titre event (cell) | texte simple         | `font-medium text-gray-900`                                             |
| Colonne "Actions"  | Bouton "View"        | Bouton ghost "Voir →"                                                   |
| Responsive         | colonnes cachées     | Garder le masquage existant des colonnes Location et Expense sur mobile |

### Implémentation

```tsx
<Card className="border border-gray-200 bg-white overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-gray-100 bg-gray-50/60">
          <th className="text-left font-medium text-gray-500 px-4 py-2.5">
            Événement
          </th>
          {/* ... autres colonnes ... */}
        </tr>
      </thead>
      <tbody>{/* ... rows ... */}</tbody>
    </table>
  </div>
</Card>
```

### Fichiers impactés

- `src/pages/DashboardPage.tsx`

---

## Résumé des fichiers à modifier / créer

| Fichier                        | Action       | Description                                                                                 |
| ------------------------------ | ------------ | ------------------------------------------------------------------------------------------- |
| `src/pages/DashboardPage.tsx`  | **Modifier** | Changements 1-8 : search, filtres, colonne signatures, badges, hover, bouton, style tableau |
| `src/config/status.ts`         | **Créer**    | Configuration des badges de statut (couleurs + labels) — Changement 4                       |
| `src/types/event.ts`           | **Modifier** | Ajouter `signatureCount` et `participantCount` au type Event — Changement 5                 |
| Backend endpoint `GET /events` | **Modifier** | Inclure les compteurs de signatures dans la réponse — Changement 5                          |

---

## Ordre d'implémentation recommandé

1. **Changement 4** (badges statut) — pas de dépendance, amélioration visuelle immédiate
2. **Changement 8** (style tableau) — fondation visuelle pour les autres changements
3. **Changement 7** (bouton proéminent) — rapide, pas de dépendance
4. **Changement 1** (compteur header) — rapide, données déjà disponibles
5. **Changement 6** (hover + click row) — rapide, améliore l'interactivité
6. **Changement 2** (recherche) — ajoute l'état local, pose la base du filtrage
7. **Changement 3** (filtres statut) — s'appuie sur le même pattern de filtrage
8. **Changement 5** (colonne signatures) — dépend potentiellement d'un changement backend

---

## Clés i18n à ajouter

Si les traductions n'existent pas déjà, ajouter dans les fichiers de namespace `organizer` :

```json
{
  "dashboard.title": "Mes événements",
  "dashboard.subtitle": "{{total}} événements · {{active}} actifs",
  "dashboard.search": "Rechercher un événement...",
  "dashboard.filter.all": "Tous",
  "dashboard.newEvent": "Nouvel événement",
  "dashboard.columns.event": "Événement",
  "dashboard.columns.location": "Lieu",
  "dashboard.columns.dates": "Dates",
  "dashboard.columns.type": "Type",
  "dashboard.columns.signatures": "Signatures",
  "dashboard.columns.status": "Statut",
  "dashboard.viewEvent": "Voir"
}
```

---

## Tests à valider

- [ ] La recherche filtre les événements par titre (insensible à la casse)
- [ ] Les filtres de statut fonctionnent seuls et en combinaison avec la recherche
- [ ] "Tous" est le filtre par défaut
- [ ] Les badges affichent la bonne couleur pour chaque statut
- [ ] La colonne signatures affiche la barre de progression correcte
- [ ] La barre est verte quand 100%, bleue sinon
- [ ] Cliquer sur une ligne navigue vers `/events/:id`
- [ ] Le bouton "Nouvel événement" navigue vers `/events/new`
- [ ] La vue fonctionne en français et en anglais
- [ ] Le tableau est responsive : colonnes Lieu et Type masquées sur mobile
- [ ] Pas de régression sur les données affichées
