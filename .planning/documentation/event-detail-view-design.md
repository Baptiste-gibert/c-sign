# Plan d'implémentation — Vue Détail d'Événement

> **Contexte :** Refonte UX de la page `/events/:id` (vue O4) de C-SIGN.
> **Référence design :** Maquette `c-sign-maquette.jsx` → onglet "Détail événement" dans le Studio.
> **Stack :** React 19 + Vite + ShadCN/UI + Tailwind CSS v4 + TanStack Query + react-i18next

---

## Problèmes identifiés et approche

### Les problèmes

L'audit UX de la vue détail a identifié 8 problèmes concrets :

1. **Redondance QR** — Un tableau récapitulatif des QR codes duplique les informations déjà présentes dans les cartes jour. L'organisateur a deux endroits pour la même action, ce qui crée du bruit visuel.
2. **Métriques globales confuses** — La barre de progression affichait un ratio brut "signatures / slots" qui additionne des émargements multi-sessions sans distinguer les participants uniques. L'organisateur ne sait pas si 3 personnes ont signé ou si 1 personne a signé 3 fois.
3. **Absents invisibles** — Les sessions montrent qui a signé mais pas qui manque. L'organisateur pendant un événement a besoin de savoir immédiatement qui relancer.
4. **Pas de contexte sur le statut** — Le badge "Réouvert" dans le header ne dit pas concrètement ce que ça implique (les participants peuvent-ils émarger ? que se passe-t-il ensuite ?).
5. **Bouton "Finaliser" sans garde-fou** — Une action lourde (fermeture de l'émargement) présentée comme un simple bouton noir, sans distinction visuelle ni confirmation.
6. **Onglet Paramètres vide** — Trois cartes d'une ligne chacune avec un bouton "Modifier" sans fonctionnalité inline.
7. **Pas de priorisation temporelle** — Toutes les journées affichées avec la même importance, sans distinction entre le jour en cours et les jours passés. L'organisateur doit scroller pour trouver "aujourd'hui".
8. **Pas de lien Participants ↔ Présences** — Impossible de savoir depuis le tableau des participants si quelqu'un a signé sans naviguer vers l'autre onglet.

### La solution

On applique 8 corrections qui restructurent la vue sans changer l'architecture de navigation (on garde les 3 onglets : Présences & QR, Participants, Paramètres). Les changements touchent principalement le rendering et l'état local du composant.

---

## Structure finale de la page

```
┌─ Header (sticky) ─────────────────────────────────────────────┐
│  c-sign    Événements / Détail                    Admin  FR   │
└───────────────────────────────────────────────────────────────┘

← Mes événements

Convention Cirbloc  [● Réouvert]
📅 5, 6, 13 fév. 2026 · 📍 Paris · Hospitalité - Restauration · Org. Baptiste Gibert    [⬇ Export XLSX]

┌─ Status banner (amber) ──────────────────────────────────────────────────────────┐
│  Événement réouvert — les participants peuvent à nouveau émarger.    [Finaliser] │
│                                                         → Êtes-vous sûr ?  [Oui, finaliser] [Annuler] │
└──────────────────────────────────────────────────────────────────────────────────┘

┌─ Global progress ────────────────────────────────────────────┐
│  👥 3/4 participants ont signé  |  ✏️ 9/16 émargements       56% │
│  ████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│  3 journées · 4 sessions · 3 QR codes (par journée)          │
└──────────────────────────────────────────────────────────────┘

[ Présences & QR ]  [ Participants (4) ]  [ Paramètres ]

🟢 Présences en direct                          [⬇ Télécharger tous les QR]

┌─ 📅 Jeudi 13 février 2026  AUJOURD'HUI  2 sessions ─── 5/8 ── [QR] ─┐  ← blue ring
│  ▶ Matin  09:00 → 12:00                                    3/4      │
│    ████████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░          │
│    ✓ GIBERT Baptiste                                      09:12      │
│    ✓ LEROUX Astrée                                        09:18      │
│    ✓ MOREAU Épiphane                                      09:31      │
│    ○ FERNANDEZ Ansberte                               En attente     │
│  ──────────────────────────────────────────────────────────────      │
│  ▶ Après-midi  14:00 → 17:00                                2/4      │
│    ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░          │
│    ✓ GIBERT Baptiste                                      14:05      │
│    ✓ FERNANDEZ Ansberte                                   14:22      │
│    ○ LEROUX Astrée                                    En attente     │
│    ○ MOREAU Épiphane                                  En attente     │
└──────────────────────────────────────────────────────────────────────┘

┌─ 📅 Vendredi 6 fév. 2026  Journée entière ──── 0/4 ──── [QR] ──────┐
│  Journée entière  09:00 → 17:00                             0/4     │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░        │
│  ○ GIBERT Baptiste                                    En attente     │
│  ○ LEROUX Astrée                                      En attente     │
│  ○ MOREAU Épiphane                                    En attente     │
│  ○ FERNANDEZ Ansberte                                 En attente     │
└──────────────────────────────────────────────────────────────────────┘

▶ 📅 Mercredi 5 fév. 2026  Journée entière  ✓ Complet ── 4/4  [QR]    ← collapsed by default
```

---

## Changement 1 — Supprimer le tableau récapitulatif QR

### Ce qui change

Le tableau QR (5 colonnes : Journée, Sessions, Progression, URL, Actions) est supprimé de l'onglet "Présences & QR". L'accès aux QR codes se fait uniquement via :

- Le **bouton QR contextuel** dans le header de chaque carte jour
- Le **bouton global "Télécharger tous les QR"** en haut de l'onglet, à côté de l'indicateur live

### Implémentation

Supprimer entièrement le bloc `<Card>` "Récapitulatif QR Codes" dans le TabsContent "overview".

Ajouter le bouton global dans la barre supérieure du tab :

```tsx
<div className="flex items-center justify-between mb-4">
  <div className="flex items-center gap-1.5">
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
    </span>
    <span className="text-[10px] text-emerald-600 font-medium">
      {t("organizer.eventDetail.liveUpdates", "Présences en direct")}
    </span>
  </div>
  <Button
    variant="outline"
    size="sm"
    className="h-7 text-[10px] gap-1"
    onClick={handleDownloadAllQr}
  >
    <Download className="w-3 h-3" />
    {t("organizer.eventDetail.downloadAllQr", "Télécharger tous les QR")}
  </Button>
</div>
```

### Fichiers impactés

- `src/pages/EventDetailPage.tsx`

---

## Changement 2 — Barre de progression globale avec double métrique

### Ce qui change

L'ancienne barre affichait un seul ratio brut. La nouvelle affiche deux métriques distinctes : **participants uniques ayant signé** et **nombre total d'émargements collectés**.

### Calcul côté frontend

```typescript
// Participants uniques ayant signé au moins 1 session
const uniqueSigners = new Set<string>();
event.days.forEach((d) =>
  d.sessions.forEach((s) =>
    s.signatures.forEach((sig) => uniqueSigners.add(`${sig.participantId}`)),
  ),
);

// Total brut des émargements
const totalSigned = event.days.reduce(
  (a, d) => a + d.sessions.reduce((b, s) => b + s.signatureCount, 0),
  0,
);

// Total de slots possibles (participants × sessions)
const totalSlots = event.days.reduce(
  (a, d) => a + d.sessions.reduce((b, s) => b + s.participantCount, 0),
  0,
);

const globalPct =
  totalSlots > 0 ? Math.round((totalSigned / totalSlots) * 100) : 0;
```

### Implémentation

```tsx
<Card className="border border-gray-200 bg-white mb-5">
  <CardContent className="px-5 py-4">
    {/* Dual metrics row */}
    <div className="flex items-center justify-between mb-2.5">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-xs text-gray-700">
            <span className="font-semibold">{uniqueSigners.size}</span>/
            {event.participantCount}{" "}
            {t(
              "organizer.eventDetail.participantsSigned",
              "participants ont signé",
            )}
          </span>
        </div>
        <Separator orientation="vertical" className="h-3.5" />
        <div className="flex items-center gap-1.5">
          <Pen className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-xs text-gray-700">
            <span className="font-semibold">{totalSigned}</span>/{totalSlots}{" "}
            {t(
              "organizer.eventDetail.signaturesCollected",
              "émargements collectés",
            )}
          </span>
        </div>
      </div>
      <Badge
        variant="secondary"
        className={`text-[10px] font-semibold px-2 py-0.5 ${
          globalPct === 100
            ? "bg-emerald-100 text-emerald-700"
            : "bg-blue-50 text-blue-600"
        }`}
      >
        {globalPct}%
      </Badge>
    </div>

    {/* Progress bar */}
    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${globalPct}%`,
          background: globalPct === 100 ? "#22c55e" : "#3b82f6",
        }}
      />
    </div>

    {/* Context line */}
    <p className="text-[10px] text-gray-400 mt-2">
      {event.days.length} {t("common.days", "journées")} · {totalSessions}{" "}
      sessions · {qrCount} QR codes ({qrGranularityLabel})
    </p>
  </CardContent>
</Card>
```

### Style de la progress bar

```
Container : w-full h-2 rounded-full bg-gray-100 overflow-hidden
Fill <100% : bg-[#3b82f6] (blue-500)
Fill =100% : bg-[#22c55e] (green-500)
Transition : transition-all duration-500
```

### Fichiers impactés

- `src/pages/EventDetailPage.tsx`

---

## Changement 3 — Afficher les participants absents par session

### Ce qui change

Sous la liste des signataires de chaque session, on ajoute les **participants qui n'ont pas encore signé** avec une icône ○ grise et le label "En attente".

### Calcul

```typescript
// Pour chaque session, déterminer qui manque
const signedSet = new Set(session.signatures.map((s) => s.participantId));
const missingParticipants = event.participants.filter(
  (p) => !signedSet.has(p.id),
);
```

### Implémentation

```tsx
<div className="space-y-1">
  {/* Signed participants */}
  {session.signatures.map((sig) => (
    <div key={sig.id} className="flex items-center justify-between py-0.5">
      <div className="flex items-center gap-2">
        <Check className="w-3.5 h-3.5 text-emerald-500" />
        <span className="text-[11px] font-medium text-gray-700">
          {sig.lastName} {sig.firstName}
        </span>
      </div>
      <span className="text-[10px] text-gray-400 tabular-nums">
        {sig.signedAt}
      </span>
    </div>
  ))}

  {/* Missing participants */}
  {missingParticipants.map((p) => (
    <div key={p.id} className="flex items-center justify-between py-0.5">
      <div className="flex items-center gap-2">
        <Circle className="w-3.5 h-3.5 text-gray-300" />
        <span className="text-[11px] text-gray-400">
          {p.lastName} {p.firstName}
        </span>
      </div>
      <span className="text-[10px] text-gray-300">
        {t("organizer.eventDetail.pending", "En attente")}
      </span>
    </div>
  ))}
</div>
```

### Style

```
Signé     : Check (emerald-500) + text-[11px] font-medium text-gray-700 + time en text-gray-400
En attente : Circle (text-gray-300 stroke only) + text-[11px] text-gray-400 + "En attente" en text-gray-300
```

### Icône ○ (cercle vide)

```tsx
// Utiliser lucide-react Circle, ou SVG inline :
<svg
  width="14"
  height="14"
  viewBox="0 0 24 24"
  fill="none"
  stroke="#d1d5db"
  strokeWidth="2"
>
  <circle cx="12" cy="12" r="10" />
</svg>
```

### Fichiers impactés

- `src/pages/EventDetailPage.tsx`

---

## Changement 4 — Bannière contextuelle de statut

### Ce qui change

On ajoute un **bandeau coloré** entre le header et la barre de progression. Il affiche un message en langage clair sur l'état actuel de l'événement et l'action principale associée.

### Configuration par statut

```typescript
// src/config/status.ts — ajouter

interface StatusContext {
  message: string;
  messageEn: string;
  action: string;
  actionEn: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  buttonClass: string;
}

export const statusContext: Record<EventStatus, StatusContext> = {
  draft: {
    message:
      "Cet événement est en brouillon. Ouvrez-le pour activer l'émargement.",
    messageEn: "This event is a draft. Open it to enable attendance signing.",
    action: "Ouvrir l'événement",
    actionEn: "Open event",
    bgClass: "bg-gray-50",
    borderClass: "border-gray-200",
    textClass: "text-gray-600",
    buttonClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
  open: {
    message:
      "Événement ouvert — les participants peuvent émarger via les QR codes.",
    messageEn: "Event open — participants can sign via QR codes.",
    action: "Finaliser",
    actionEn: "Finalize",
    bgClass: "bg-blue-50",
    borderClass: "border-blue-200",
    textClass: "text-blue-800",
    buttonClass: "bg-amber-500 hover:bg-amber-600 text-white",
  },
  reopened: {
    message: "Événement réouvert — les participants peuvent à nouveau émarger.",
    messageEn: "Event reopened — participants can sign again.",
    action: "Finaliser",
    actionEn: "Finalize",
    bgClass: "bg-amber-50",
    borderClass: "border-amber-200",
    textClass: "text-amber-800",
    buttonClass: "bg-amber-500 hover:bg-amber-600 text-white",
  },
  finalized: {
    message:
      "Événement finalisé — émargement fermé. Le rapport XLSX est disponible.",
    messageEn: "Event finalized — signing closed. XLSX report is available.",
    action: "Rouvrir",
    actionEn: "Reopen",
    bgClass: "bg-emerald-50",
    borderClass: "border-emerald-200",
    textClass: "text-emerald-800",
    buttonClass:
      "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
  },
};
```

### Implémentation

```tsx
const ctx = statusContext[event.status];

<div
  className={`flex items-center justify-between ${ctx.bgClass} border ${ctx.borderClass} rounded-lg px-4 py-2.5 mb-5`}
>
  <p className={`text-xs ${ctx.textClass}`}>
    {i18n.language === "fr" ? ctx.message : ctx.messageEn}
  </p>
  {/* Action button — see Changement 5 for confirmation logic */}
  <StatusActionButton event={event} ctx={ctx} />
</div>;
```

### Fichiers impactés

- `src/config/status.ts` — ajouter `statusContext`
- `src/pages/EventDetailPage.tsx` — ajouter le bandeau
- `src/components/StatusActionButton.tsx` — nouveau composant (voir changement 5)

---

## Changement 5 — Bouton Finaliser avec style distinct et confirmation inline

### Ce qui change

Le bouton "Finaliser" est déplacé du header vers la bannière de statut. Il a un style amber (différent du noir primary) et implémente une confirmation en 2 étapes directement inline — pas de modale.

### États du bouton

```
État 1 (défaut)  : Bouton avec label de l'action (ex: "Finaliser")
                   Style : amber-500 text-white (pour open/reopened)
                           ou bg-emerald-600 (pour draft → "Ouvrir")
                           ou outline gris (pour finalized → "Rouvrir")

État 2 (confirm) : Le bouton est remplacé par :
                   "Êtes-vous sûr ?"  [Oui, finaliser] (rouge)  [Annuler] (ghost)
```

### Implémentation

```tsx
// src/components/StatusActionButton.tsx

function StatusActionButton({
  event,
  ctx,
}: {
  event: Event;
  ctx: StatusContext;
}) {
  const [confirming, setConfirming] = useState(false);
  const { mutate, isPending } = useUpdateEventStatus();

  const actionLabel = i18n.language === "fr" ? ctx.action : ctx.actionEn;
  const nextStatus =
    event.status === "draft"
      ? "open"
      : event.status === "finalized"
        ? "reopened"
        : "finalized";

  if (!confirming) {
    return (
      <Button
        size="sm"
        className={`h-7 text-[11px] font-semibold px-3 ${ctx.buttonClass}`}
        onClick={() => setConfirming(true)}
      >
        {actionLabel}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-amber-700 font-medium">
        {t("organizer.eventDetail.confirmAction", "Êtes-vous sûr ?")}
      </span>
      <Button
        size="sm"
        className="h-7 text-[11px] font-semibold px-3 bg-red-600 hover:bg-red-700 text-white"
        disabled={isPending}
        onClick={() => {
          mutate({ eventId: event.id, status: nextStatus });
          setConfirming(false);
        }}
      >
        {t("organizer.eventDetail.confirmYes", "Oui,") +
          " " +
          actionLabel.toLowerCase()}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-[11px] text-gray-500 px-2"
        onClick={() => setConfirming(false)}
      >
        {t("common.cancel", "Annuler")}
      </Button>
    </div>
  );
}
```

### Style du bouton de confirmation

```
Bouton "Oui, finaliser" : bg-red-600 hover:bg-red-700 text-white h-7 text-[11px] font-semibold
Bouton "Annuler"        : variant="ghost" text-gray-500 h-7 text-[11px]
Label "Êtes-vous sûr ?" : text-[10px] text-amber-700 font-medium
```

### Fichiers impactés

- Créer `src/components/StatusActionButton.tsx`
- `src/pages/EventDetailPage.tsx` — retirer le bouton "Finaliser" du header, utiliser `<StatusActionButton>` dans le bandeau

---

## Changement 6 — Paramètres avec édition inline

### Ce qui change

Les cartes de l'onglet Paramètres passent d'un simple texte + bouton "Modifier" à un **mode lecture / mode édition inline** avec un toggle.

### Carte Thème

```tsx
const [editTheme, setEditTheme] = useState(false);

<Card className="border border-gray-200 bg-white">
  <CardHeader className="px-5 pt-4 pb-2 flex-row items-center justify-between">
    <CardTitle className="text-sm font-semibold">
      {t("organizer.eventDetail.theme", "Thème de la page publique")}
    </CardTitle>
    <Button
      variant="ghost"
      size="sm"
      className="h-7 text-[10px] text-gray-500 gap-1"
      onClick={() => setEditTheme(!editTheme)}
    >
      <Pen className="w-3 h-3" />
      {editTheme ? t("common.close", "Fermer") : t("common.edit", "Modifier")}
    </Button>
  </CardHeader>
  <CardContent className="px-5 pb-5">
    {!editTheme ? (
      /* Mode lecture */
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-5 rounded"
          style={{ background: activeTheme.color }}
        />
        <span className="text-xs text-gray-700 font-medium">
          {activeTheme.name}
        </span>
        <span className="text-[10px] text-gray-400">(actif)</span>
      </div>
    ) : (
      /* Mode édition — même composant que la vue création */
      <div>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {themeCards.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTheme(t.id)}
              className={`rounded-lg border-2 transition-all overflow-hidden ${
                selectedTheme === t.id
                  ? "ring-2 ring-offset-2 ring-gray-900 border-transparent"
                  : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <div className="h-6 w-full" style={{ background: t.color }} />
              <div className="py-1 text-center">
                <span className="text-[9px] font-medium text-gray-700">
                  {t.name}
                </span>
              </div>
            </button>
          ))}
        </div>
        <Button
          size="sm"
          className="h-7 text-[10px] bg-gray-900 hover:bg-gray-800"
          onClick={() => {
            saveTheme(selectedTheme);
            setEditTheme(false);
          }}
        >
          {t("common.save", "Enregistrer")}
        </Button>
      </div>
    )}
  </CardContent>
</Card>;
```

### Carte Granularité QR

Même pattern lecture/édition, avec le sélecteur 3 colonnes identique à la vue création :

```tsx
const [editQr, setEditQr] = useState(false);

{/* Mode lecture */}
<p className="text-xs text-gray-700 font-medium">
  {qrMode === "event" ? "Événement — 1 QR global"
    : qrMode === "day" ? `Par journée — ${event.days.length} QR codes`
    : `Par session — ${totalSessions} QR codes`}
</p>

{/* Mode édition */}
<div className="grid grid-cols-3 gap-2 mb-3">
  {qrOptions.map(opt => (
    <button key={opt.key}
      className={`text-left rounded-lg border-2 p-3 transition-all ${
        qrMode === opt.key ? "border-gray-900 bg-gray-50" : "border-gray-100 hover:border-gray-200"
      }`}
      onClick={() => setQrMode(opt.key)}>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[11px] font-semibold text-gray-800">{opt.label}</span>
        <Badge variant={qrMode === opt.key ? "default" : "secondary"}
          className={`text-[8px] px-1.5 ${qrMode === opt.key ? "bg-gray-900" : ""}`}>
          {opt.count}
        </Badge>
      </div>
      <p className="text-[9px] text-gray-400">{opt.desc}</p>
    </button>
  ))}
</div>
<Button size="sm" className="h-7 text-[10px] bg-gray-900 hover:bg-gray-800"
  onClick={() => { saveQrGranularity(qrMode); setEditQr(false); }}>
  {t("common.save", "Enregistrer")}
</Button>
```

### Carte Export (inchangée fonctionnellement)

```tsx
<Card className="border border-gray-200 bg-white">
  <CardHeader className="px-5 pt-4 pb-2">
    <CardTitle className="text-sm font-semibold">Export</CardTitle>
  </CardHeader>
  <CardContent className="px-5 pb-5">
    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
      <Download className="w-3.5 h-3.5" />
      {t("organizer.eventDetail.downloadXlsx", "Télécharger le rapport XLSX")}
    </Button>
    <p className="text-[10px] text-gray-400 mt-2">
      {t(
        "organizer.eventDetail.xlsxDesc",
        "Contient les signatures embarquées en images. Disponible même avant la finalisation.",
      )}
    </p>
  </CardContent>
</Card>
```

### Fichiers impactés

- `src/pages/EventDetailPage.tsx` — onglet Paramètres

---

## Changement 7 — Journée d'aujourd'hui en priorité + cartes collapsibles

### Ce qui change

Les cartes jour sont triées pour afficher **aujourd'hui en premier**, puis les jours les plus récents. Les jours passés à 100% sont **collapsés par défaut**. Chaque header de carte jour est cliquable pour toggle le collapse.

### Tri des journées

```typescript
const today = new Date().toISOString().split("T")[0]; // "2026-02-14"

const sortedDays = [...event.days]
  .map((d) => ({ ...d, isToday: d.date === today }))
  .sort((a, b) => {
    if (a.isToday && !b.isToday) return -1;
    if (!a.isToday && b.isToday) return 1;
    return b.date.localeCompare(a.date); // plus récent d'abord
  });
```

### État collapsed

```typescript
// Auto-collapse les jours passés à 100%
const initialCollapsed: Record<string, boolean> = {};
sortedDays.forEach(day => {
  const dayPct = /* calculate */;
  const isPast = day.date < today;
  if (isPast && dayPct === 100) initialCollapsed[day.date] = true;
});

const [collapsedDays, setCollapsedDays] = useState(initialCollapsed);
const toggleCollapse = (date: string) =>
  setCollapsedDays(prev => ({ ...prev, [date]: !prev[date] }));
```

### Implémentation du header cliquable

```tsx
<div
  className={`px-4 py-2.5 flex items-center justify-between cursor-pointer select-none ${
    day.isToday ? "bg-blue-50/60" : "bg-gray-50"
  }`}
  onClick={() => toggleCollapse(day.date)}
>
  <div className="flex items-center gap-2">
    {/* Chevron animé */}
    <ChevronDown
      className={`w-2.5 h-2.5 text-gray-400 transition-transform duration-200 ${
        isCollapsed ? "-rotate-90" : "rotate-0"
      }`}
    />
    <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
    <span className="text-xs font-semibold text-gray-800">{day.label}</span>

    {/* Badge AUJOURD'HUI */}
    {day.isToday && (
      <Badge className="text-[8px] font-bold px-1.5 py-0 bg-blue-600 text-white">
        {t("organizer.eventDetail.today", "AUJOURD'HUI")}
      </Badge>
    )}

    {/* Badge sessions ou journée entière */}
    {day.fullDay ? (
      <Badge
        variant="secondary"
        className="text-[9px] bg-gray-200/60 text-gray-500"
      >
        Journée entière
      </Badge>
    ) : (
      <Badge
        variant="secondary"
        className="text-[9px] bg-gray-200/60 text-gray-500"
      >
        {day.sessions.length} sessions
      </Badge>
    )}

    {/* Badge complet */}
    {isDone && (
      <Badge
        variant="secondary"
        className="text-[8px] bg-emerald-100 text-emerald-700 font-semibold"
      >
        ✓ {t("organizer.eventDetail.complete", "Complet")}
      </Badge>
    )}
  </div>
  {/* ... progress bar + QR button ... */}
</div>;

{
  /* Sessions — conditionally rendered */
}
{
  !isCollapsed && (
    <div className="divide-y divide-gray-100">
      {/* ... session content ... */}
    </div>
  );
}
```

### Style de la carte jour "Aujourd'hui"

```
Container  : border-blue-200 ring-1 ring-blue-100 (au lieu de border-gray-200)
Header bg  : bg-blue-50/60 (au lieu de bg-gray-50)
Badge      : bg-blue-600 text-white text-[8px] font-bold px-1.5 py-0
```

### Fichiers impactés

- `src/pages/EventDetailPage.tsx`

---

## Changement 8 — Colonne Présence dans le tableau Participants

### Ce qui change

Le tableau des participants (onglet "Participants") gagne une nouvelle colonne **"Présence"** qui montre combien de sessions chaque participant a signées, avec une mini progress bar et un badge coloré.

### Calcul côté frontend

```typescript
const participantPresence = event.participants.map((p) => {
  let sessionsSigned = 0;
  event.days.forEach((d) =>
    d.sessions.forEach((s) => {
      if (s.signatures.some((sig) => sig.participantId === p.id)) {
        sessionsSigned++;
      }
    }),
  );
  return { ...p, sessionsSigned };
});
```

### Colonne dans le `<thead>`

```tsx
<th className="text-left font-medium text-gray-500 py-2">
  {t("organizer.eventDetail.presence", "Présence")}
</th>
```

### Cellule dans le `<tbody>`

```tsx
<td className="py-2.5">
  <div className="flex items-center gap-1.5">
    <div className="w-10 h-1.5 rounded-full bg-gray-100 overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{
          width: `${pPct}%`,
          background: allDone ? "#22c55e" : "#3b82f6",
        }}
      />
    </div>
    <Badge
      variant="secondary"
      className={`text-[8px] font-semibold px-1 ${
        allDone
          ? "bg-emerald-100 text-emerald-700"
          : p.sessionsSigned > 0
            ? "bg-blue-50 text-blue-600"
            : "bg-gray-100 text-gray-400"
      }`}
    >
      {p.sessionsSigned}/{totalSessions}
    </Badge>
  </div>
</td>
```

### Logique des couleurs

```
0 sessions signées    : bg-gray-100 text-gray-400, progress bar vide
1+ sessions signées   : bg-blue-50 text-blue-600, progress bar blue
Toutes signées        : bg-emerald-100 text-emerald-700, progress bar green
```

### Fichiers impactés

- `src/pages/EventDetailPage.tsx` — onglet Participants

---

## Résumé des fichiers à modifier / créer

| Fichier                                 | Action                 | Description                                                                                           |
| --------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------- |
| `src/pages/EventDetailPage.tsx`         | **Modifier (refonte)** | 8 changements : suppression tableau QR, double métrique, absents, bannière statut, collapse, présence |
| `src/config/status.ts`                  | **Modifier**           | Ajouter `statusContext` avec messages, couleurs et actions par statut                                 |
| `src/components/StatusActionButton.tsx` | **Créer**              | Bouton d'action contextuel avec confirmation inline                                                   |

---

## Clés i18n à ajouter

```json
{
  "organizer.eventDetail.liveUpdates": "Présences en direct",
  "organizer.eventDetail.downloadAllQr": "Télécharger tous les QR",
  "organizer.eventDetail.participantsSigned": "participants ont signé",
  "organizer.eventDetail.signaturesCollected": "émargements collectés",
  "organizer.eventDetail.pending": "En attente",
  "organizer.eventDetail.confirmAction": "Êtes-vous sûr ?",
  "organizer.eventDetail.confirmYes": "Oui,",
  "organizer.eventDetail.today": "AUJOURD'HUI",
  "organizer.eventDetail.complete": "Complet",
  "organizer.eventDetail.theme": "Thème de la page publique",
  "organizer.eventDetail.qrGranularity": "Granularité des QR codes",
  "organizer.eventDetail.downloadXlsx": "Télécharger le rapport XLSX",
  "organizer.eventDetail.xlsxDesc": "Contient les signatures embarquées en images. Disponible même avant la finalisation.",
  "organizer.eventDetail.presence": "Présence"
}
```

---

## Ordre d'implémentation recommandé

1. **Changement 4** — Bannière statut + config (fondation visuelle, indépendant)
2. **Changement 5** — Bouton confirmation (dépend de #4)
3. **Changement 2** — Double métrique global (calculs, indépendant)
4. **Changement 7** — Tri today + collapsible (restructure le rendu des cartes jour)
5. **Changement 3** — Afficher les absents (dans les cartes jour restructurées)
6. **Changement 1** — Supprimer le tableau QR (simple suppression)
7. **Changement 8** — Colonne Présence dans Participants (indépendant)
8. **Changement 6** — Paramètres inline (indépendant, dernière priorité)

---

## Tests à valider

### Bannière de statut (#4 + #5)

- [ ] Le bandeau affiche le bon message selon le statut (draft, open, reopened, finalized)
- [ ] Les couleurs (bg, border, text) changent selon le statut
- [ ] Le bouton d'action affiche le bon label ("Ouvrir", "Finaliser", "Rouvrir")
- [ ] Cliquer le bouton affiche "Êtes-vous sûr ?" + "Oui, ..." (rouge) + "Annuler"
- [ ] "Annuler" revient à l'état 1
- [ ] "Oui, finaliser" déclenche la mutation et met à jour le statut
- [ ] Le bouton "Finaliser" n'existe plus dans le header

### Double métrique (#2)

- [ ] "X/Y participants ont signé" compte les personnes uniques ayant signé au moins 1 session
- [ ] "X/Y émargements collectés" compte le total brut des signatures
- [ ] Le pourcentage est basé sur les émargements (total brut), pas les participants uniques
- [ ] La barre est verte à 100%, bleue sinon
- [ ] La ligne de contexte affiche "N journées · M sessions · K QR codes (par journée)"

### Absents (#3)

- [ ] Chaque session liste les signataires (✓ vert) ET les absents (○ gris)
- [ ] Les absents sont listés après les signataires
- [ ] Le label "En attente" est affiché à droite
- [ ] Quand une session a 0 signatures, tous les participants apparaissent comme absents

### Tri et collapse (#7)

- [ ] La journée d'aujourd'hui est en première position
- [ ] Le badge "AUJOURD'HUI" (bleu) est affiché
- [ ] La carte d'aujourd'hui a une bordure bleue et un fond bleu léger
- [ ] Les journées passées à 100% sont collapsées par défaut
- [ ] Cliquer sur le header toggle le collapse
- [ ] Le chevron tourne (animé) selon l'état collapsed/expanded
- [ ] Le bouton QR dans le header ne déclenche PAS le collapse (stopPropagation)

### Participants (#8)

- [ ] La colonne "Présence" existe dans le tableau
- [ ] La mini progress bar est verte si toutes sessions signées, bleue sinon, grise si 0
- [ ] Le badge affiche "X/Y" (sessions signées / total sessions)
- [ ] Les couleurs du badge correspondent : emerald (complet), blue (partiel), gray (aucune)

### Paramètres (#6)

- [ ] Le bouton "Modifier" toggle le mode édition inline
- [ ] En mode lecture, le thème actif est affiché (swatch + nom)
- [ ] En mode édition, les 4 thèmes sont affichés en grid cliquable
- [ ] "Enregistrer" sauvegarde et ferme le mode édition
- [ ] La granularité QR fonctionne de la même manière
- [ ] La carte Export reste inchangée

### QR supprimé (#1)

- [ ] Le tableau "Récapitulatif QR Codes" n'existe plus dans l'onglet Présences & QR
- [ ] Le bouton QR contextuel est présent dans chaque header de carte jour
- [ ] Le bouton "Télécharger tous les QR" est en haut de l'onglet
