# Phase 6: Advanced Features - Research

**Researched:** 2026-02-14
**Domain:** Event lifecycle management, status workflow extensions, participant management
**Confidence:** HIGH

## Summary

Phase 6 extends the existing event lifecycle with three key features: CNOV declaration numbers (already implemented in schema), controlled reopening of finalized events while preserving signatures, and enhanced walk-in participant workflow. This phase builds on the status transition validation system from Phase 3 (03-01) which currently prevents finalized events from being modified.

The core challenge is selectively relaxing the finalized state immutability constraint while maintaining audit trail integrity and preventing unintended modifications. The research reveals that status workflow extensions should use explicit "reopen" actions rather than direct status field mutations, and that preserving existing signatures requires no additional technical work since they're separate documents linked via relationships.

**Primary recommendation:** Extend the existing beforeChange hook in Events collection with a new "reopened" status value, add an explicit "reopen" action button in the admin UI using Payload's custom Edit View components, and enhance walk-in participant UX with optimistic UI updates and form reset patterns.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Payload CMS 3.x | Latest | Backend with hooks and custom UI | Already in use, provides beforeChange hooks for validation |
| React Hook Form | Latest | Walk-in form management | Already in use, battle-tested form state |
| TanStack Query v5 | Latest | Mutation orchestration | Already in use, handles optimistic updates |
| Zod | Latest | Walk-in form validation | Already in use for schemas |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @payloadcms/ui | 3.x | Custom admin components | For "Reopen Event" button in Edit View |
| date-fns | Latest | Date formatting for audit trails | Already installed, consistent with project |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual status field | XState/TypeState | XState adds ~30KB bundle size, overkill for 4-5 states with simple transitions. Manual validation in beforeChange hook is sufficient and already proven in 03-01. |
| Custom admin button | Native Payload actions | Payload's Edit View `beforeDocumentControls` is native and requires no routing changes. Using separate admin pages would complicate UX. |
| Refetch after mutation | Optimistic updates | Optimistic updates provide instant feedback but require rollback logic. For walk-in participants (low failure rate), optimistic approach improves UX significantly. |

**Installation:**
No new dependencies required — all capabilities exist in current stack.

## Architecture Patterns

### Recommended Status Workflow Extension

**Current implementation (03-01):**
```
Events collection beforeChange hook prevents invalid transitions:
- draft -> open: allowed
- open -> finalized: allowed
- finalized -> *: BLOCKED (throws error)
```

**Phase 6 extension:**
```
Add new "reopened" status to Events.status select field:
- Options: draft, open, finalized, reopened
- Transition logic in beforeChange hook:
  - finalized -> reopened: allowed (only this transition unlocks finalized)
  - reopened -> open: allowed (return to open for new signatures)
  - reopened -> finalized: allowed (re-finalize after adding late participants)
  - reopened -> draft: NOT allowed (prevents accidental data loss)
```

### Pattern 1: Controlled Reopen via Explicit Action

**What:** Use Payload custom Edit View component to add "Reopen Event" button that appears only when status === 'finalized'. Button triggers PATCH with explicit status change to 'reopened'.

**When to use:** When you need to prevent accidental status changes but allow specific controlled transitions. Separates "reopen" intent from general status updates.

**Example:**
```typescript
// Source: Payload CMS Edit View Components Docs
// frontend/src/components/admin/ReopenEventButton.tsx

'use client'
import { useFormFields, useForm } from '@payloadcms/ui'
import { Button } from '@payloadcms/ui'

export const ReopenEventButton: React.FC = () => {
  const { getDataByPath } = useFormFields(([fields]) => ({ status: fields.status }))
  const { submit } = useForm()
  const status = getDataByPath('status')

  if (status !== 'finalized') return null

  const handleReopen = async () => {
    if (!confirm('Rouvrir cet événement ? Les participants pourront à nouveau signer.')) return

    // Update status field value in form state
    // Then submit form to trigger beforeChange hook validation
    await submit({
      method: 'PATCH',
      overrides: {
        status: 'reopened',
      },
    })
  }

  return (
    <Button onClick={handleReopen} variant="secondary">
      Rouvrir l'événement
    </Button>
  )
}

// backend/src/collections/Events.ts
export const Events: CollectionConfig = {
  // ...
  admin: {
    components: {
      edit: {
        beforeDocumentControls: ['/components/admin/ReopenEventButton'],
      },
    },
  },
  fields: [
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Brouillon', value: 'draft' },
        { label: 'Ouvert', value: 'open' },
        { label: 'Finalise', value: 'finalized' },
        { label: 'Rouvert', value: 'reopened' }, // NEW
      ],
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, operation }) => {
        if (operation !== 'update') return data
        if (!data.status || !originalDoc?.status) return data
        if (data.status === originalDoc.status) return data

        const oldStatus = originalDoc.status
        const newStatus = data.status

        // Existing validations from 03-01
        if (oldStatus === 'open' && newStatus === 'draft') {
          throw new Error('Un evenement ouvert ne peut pas revenir en brouillon')
        }

        // NEW: Allow finalized -> reopened
        if (oldStatus === 'finalized' && newStatus === 'reopened') {
          return data // Explicitly allowed
        }

        // Block all other transitions FROM finalized
        if (oldStatus === 'finalized' && newStatus !== 'reopened') {
          throw new Error('Un evenement finalise ne peut pas etre modifie')
        }

        // NEW: Allow reopened -> open or reopened -> finalized
        if (oldStatus === 'reopened' && (newStatus === 'open' || newStatus === 'finalized')) {
          return data
        }

        // Block reopened -> draft
        if (oldStatus === 'reopened' && newStatus === 'draft') {
          throw new Error('Un evenement rouvert ne peut pas revenir en brouillon')
        }

        return data
      },
    ],
  },
}
```

### Pattern 2: CNOV Number Field (Already Implemented)

**What:** Text field for CNOV declaration number is already present in Events schema at line 81-84 of Events.ts. No implementation needed for this requirement.

**Verification needed:** Confirm field appears in admin UI Classification tab and is saved/displayed correctly.

### Pattern 3: Walk-In Participant with Optimistic Updates

**What:** Enhance existing walk-in flow (useAddWalkIn from use-participants.ts) with optimistic UI updates and form reset. Current implementation lacks visual feedback and form doesn't reset on success.

**When to use:** When mutation success rate is high (>95%) and instant feedback improves UX. Walk-in participant addition is low-risk and benefits from immediate table updates.

**Example:**
```typescript
// Source: TanStack Query Optimistic Updates Docs
// frontend/src/hooks/use-participants.ts enhancement

export function useAddWalkIn(eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (participantData) => {
      // Existing implementation from current codebase
      // ... (same as current)
    },

    // NEW: Optimistic update
    onMutate: async (newParticipant) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['events', eventId] })

      // Snapshot current value
      const previousEvent = queryClient.getQueryData(['events', eventId])

      // Optimistically update cache
      queryClient.setQueryData(['events', eventId], (old: any) => {
        if (!old) return old
        return {
          ...old,
          participants: [
            ...(old.participants || []),
            { id: 'temp-' + Date.now(), ...newParticipant }, // Temporary ID
          ],
        }
      })

      return { previousEvent }
    },

    onError: (err, newParticipant, context) => {
      // Rollback on error
      if (context?.previousEvent) {
        queryClient.setQueryData(['events', eventId], context.previousEvent)
      }
    },

    onSettled: () => {
      // Refetch to sync with server truth
      queryClient.invalidateQueries({ queryKey: ['events', eventId] })
    },
  })
}
```

```typescript
// Source: React Hook Form reset docs
// frontend/src/pages/EventDetailPage.tsx enhancement

const { mutate: addWalkIn, isPending: isAddingWalkIn } = useAddWalkIn(id || '')
const [walkInData, setWalkInData] = useState({
  lastName: '',
  firstName: '',
  email: '',
  city: '',
  professionalNumber: '',
  beneficiaryType: '',
})

const handleAddWalkIn = () => {
  addWalkIn(walkInData, {
    onSuccess: () => {
      // NEW: Reset form after success
      setWalkInData({
        lastName: '',
        firstName: '',
        email: '',
        city: '',
        professionalNumber: '',
        beneficiaryType: '',
      })
      setShowWalkInForm(false) // Close dialog

      // Show success toast (if toast library available)
      // toast.success('Participant ajouté')
    },
  })
}
```

### Anti-Patterns to Avoid

- **Allowing finalized -> open directly:** Skips audit trail of reopening. Always use intermediate "reopened" status.
- **Using event sourcing for this use case:** Event sourcing (storing all state changes as events) is overkill. Payload's built-in updatedAt timestamps + status field changes provide sufficient audit trail.
- **Custom state machine library:** Adding XState/TypeState for 4-5 states increases complexity. Explicit beforeChange validation is sufficient and matches existing 03-01 pattern.
- **Deleting signatures on reopen:** Never delete existing signatures when reopening. Signatures collection is independent — reopening just allows NEW signatures.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Status transition validation | Custom validator class with transition maps | Extend existing beforeChange hook from 03-01 | Already proven, keeps all validation in one place, Payload-native |
| Form reset after mutation | Custom reset logic, manual field clearing | React Hook Form's useForm().reset() + onSuccess callback | Handles all edge cases (default values, dirty state, touched fields) |
| Optimistic UI updates | Manual cache manipulation, local state sync | TanStack Query's onMutate/onError/onSettled | Provides snapshot/rollback, prevents race conditions, handles concurrent mutations |
| Admin UI custom buttons | Custom routes, separate pages | Payload Edit View components (`beforeDocumentControls`) | Native integration, no routing changes, appears inline with existing controls |

**Key insight:** Phase 6 requirements map cleanly to existing patterns from Phases 3-5. Resist the temptation to introduce new state management paradigms. The beforeChange hook pattern (03-01) is sufficient for status workflow extensions.

## Common Pitfalls

### Pitfall 1: Forgetting to Update Signature Validation Hook
**What goes wrong:** Signatures collection has a beforeChange hook (lines 46-78 in Signatures.ts) that blocks signatures when event.status === 'finalized'. If you add "reopened" status but forget to update this check, signatures will still be blocked.

**Why it happens:** The validation logic is split across two files (Events.ts and Signatures.ts). Easy to miss when extending status values.

**How to avoid:** When adding "reopened" status, update Signatures beforeChange hook to allow signatures when status === 'open' OR status === 'reopened'.

**Warning signs:** After reopening event, participants can't sign (signature form throws error about finalized event).

### Pitfall 2: Frontend Status Display Not Handling New Status
**What goes wrong:** EventDetailPage.tsx line 40-44 defines statusColors mapping (draft, open, finalized). If you add "reopened" but don't update this map, the status badge will render incorrectly or without styling.

**Why it happens:** Frontend and backend status enums must stay in sync. No TypeScript enforcement between Payload schema and React components.

**How to avoid:**
1. Add "reopened" to statusColors map in EventDetailPage.tsx
2. Update i18n translation files (common.json) with "reopened" label in FR/EN
3. Search codebase for all status-related switches/maps and update them

**Warning signs:** Status badge shows raw value "reopened" instead of styled "Rouvert" label.

### Pitfall 3: CNOV Field Not Visible in UI
**What goes wrong:** CNOV field exists in schema but may not be visible in admin UI or frontend event detail pages.

**Why it happens:** Field exists in backend schema (line 81-84 Events.ts) but frontend components don't fetch or display it.

**How to avoid:**
1. Verify field appears in Payload admin UI (should be in Classification tab)
2. Add CNOV field to EventDetailPage.tsx display
3. Include in i18n translations
4. Ensure XLSX export includes CNOV number (update generateEventXLSX.ts)

**Warning signs:** Organizers complain they can't find where to enter CNOV number.

### Pitfall 4: Optimistic Update Race Conditions
**What goes wrong:** User adds walk-in participant, form resets immediately, but API fails. User sees empty form and empty table (optimistic rollback removes participant, form is cleared).

**Why it happens:** Form reset in onSuccess fires before server response. If server fails, rollback happens but form is already cleared.

**How to avoid:**
1. Only reset form in onSuccess (not onMutate)
2. Keep loading state visible until mutation settles
3. Add error toast/banner with retry option
4. Consider NOT using optimistic updates for walk-in flow — instant feedback is nice but not critical

**Warning signs:** Flicker in participant table, form clears then error appears with no way to recover entered data.

### Pitfall 5: Not Updating Email Export Template
**What goes wrong:** When event is reopened and re-finalized, email might be sent again to organizer and transparence@ceva.com with duplicate XLSX.

**Why it happens:** afterFinalize hook (afterFinalize.ts) triggers on ANY transition to 'finalized', including reopened -> finalized.

**How to avoid:**
1. Track if event was previously finalized (add finalizedAt timestamp field)
2. Check in afterFinalize: if finalizedAt already exists, it's a re-finalization
3. Either skip email on re-finalization, or send different template ("Updated attendance sheet")
4. Consider adding a reopenedAt timestamp for audit trail

**Warning signs:** Organizers receive duplicate emails when re-finalizing events.

## Code Examples

Verified patterns from official sources:

### Custom Admin Button (Payload Edit View)
```typescript
// Source: https://payloadcms.com/docs/custom-components/edit-view
// Location: backend/src/collections/Events.ts

import type { CollectionConfig } from 'payload'

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    components: {
      edit: {
        beforeDocumentControls: [
          {
            path: '/components/ReopenEventButton',
            clientProps: {}, // Pass props if needed
          },
        ],
      },
    },
  },
  // ... rest of config
}
```

### Form Reset After Mutation Success
```typescript
// Source: https://react-hook-form.com/docs/useform/reset
// Pattern: Call reset() in mutation's onSuccess callback

const { mutate, isPending } = useAddWalkIn(eventId)

const handleSubmit = (data) => {
  mutate(data, {
    onSuccess: () => {
      reset() // Reset to defaultValues
      setShowDialog(false)
    },
    onError: (error) => {
      // Keep form data so user can retry
      console.error(error)
    },
  })
}
```

### Extended Status Validation (Building on 03-01)
```typescript
// Source: Current codebase backend/src/collections/Events.ts lines 149-166
// Extension: Add reopened status transitions

hooks: {
  beforeChange: [
    async ({ data, req, operation, originalDoc }) => {
      if (operation === 'update' && data.status && originalDoc?.status && data.status !== originalDoc.status) {
        const oldStatus = originalDoc.status
        const newStatus = data.status

        // EXISTING from 03-01
        if (oldStatus === 'open' && newStatus === 'draft') {
          throw new Error('Un evenement ouvert ne peut pas revenir en brouillon')
        }

        // NEW for Phase 6: Allow finalized -> reopened
        if (oldStatus === 'finalized' && newStatus === 'reopened') {
          return data
        }

        // EXISTING but updated: Block finalized -> anything except reopened
        if (oldStatus === 'finalized' && newStatus !== 'reopened') {
          throw new Error('Un evenement finalise ne peut pas etre modifie')
        }

        // NEW: Allow reopened -> open or finalized
        if (oldStatus === 'reopened' && (newStatus === 'open' || newStatus === 'finalized')) {
          return data
        }

        // NEW: Block reopened -> draft
        if (oldStatus === 'reopened' && newStatus === 'draft') {
          throw new Error('Un evenement rouvert ne peut pas revenir en brouillon')
        }
      }
      return data
    },
    // ... other hooks
  ],
}
```

### Update Signature Validation for Reopened Events
```typescript
// Source: Current codebase backend/src/collections/Signatures.ts lines 70-76
// Update: Allow signatures when status is 'open' OR 'reopened'

if (event?.status === 'finalized') {
  throw new Error('Cet evenement est finalise, les signatures ne sont plus acceptees')
}

// NEW: Also block signatures when status is draft
if (event?.status === 'draft') {
  throw new Error('Cet evenement n\'est pas encore ouvert aux signatures')
}

// Signatures are allowed when status is 'open' or 'reopened'
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct status field editing | Explicit action buttons (Payload Edit View components) | Payload 3.0 (2024) | More controlled transitions, better UX, prevents accidental changes |
| Imperative form reset | React Hook Form reset() with onSuccess | RHF 7.0+ (2023) | Cleaner code, handles edge cases automatically |
| Manual cache updates | TanStack Query optimistic updates | TQ v4/v5 (2023-2024) | Built-in rollback, better error handling |
| Custom state machine libraries | Explicit validation in framework hooks | 2024-2025 trend | Less bundle size, simpler debugging, fewer abstractions |

**Deprecated/outdated:**
- **XState for simple status workflows:** While XState is excellent for complex multi-actor state machines, it's overkill for simple status transitions (draft/open/finalized/reopened). The 2025-2026 trend is toward simpler patterns. Use explicit validation in beforeChange hooks instead.
- **Event sourcing for audit trails:** Full event sourcing (storing every state change as immutable events) is unnecessary. Payload's built-in updatedAt + status field history provides sufficient audit trail for compliance.
- **Separate reopen API endpoints:** Don't create POST /api/events/:id/reopen — just use PATCH with status: 'reopened'. Keeps API surface minimal.

## Open Questions

1. **Re-finalization Email Behavior**
   - What we know: afterFinalize hook sends email when status changes to 'finalized'
   - What's unclear: Should re-finalization (reopened -> finalized) send another email, or skip it?
   - Recommendation: Add finalizedAt timestamp field. If already set, it's a re-finalization. Send different email template or skip. Defer decision to user testing in checkpoint:human-verify.

2. **Reopened Status Display in Public Signing Flow**
   - What we know: SignPage.tsx checks event.status and hides form for non-open events
   - What's unclear: Should "reopened" events show signing form (yes) or same message as finalized (no)?
   - Recommendation: Treat "reopened" same as "open" in frontend validation. Update line 73-76 in Signatures beforeChange to allow reopened, and update SignPage.tsx to check `status === 'open' || status === 'reopened'`.

3. **CNOV Field in XLSX Export**
   - What we know: CNOV field exists in schema but current generateEventXLSX.ts implementation not verified
   - What's unclear: Is CNOV number included in exported XLSX? If not, where should it appear?
   - Recommendation: Verify generateEventXLSX.ts includes CNOV in metadata section. If missing, add row to header area of worksheet.

## Sources

### Primary (HIGH confidence)
- Payload CMS Collection Hooks: https://payloadcms.com/docs/hooks/collections
- Payload CMS Edit View Components: https://payloadcms.com/docs/custom-components/edit-view
- Payload CMS UI Components: https://www.buildwithmatija.com/blog/payload-cms-custom-admin-ui-components-guide
- TanStack Query Optimistic Updates: https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates
- React Hook Form reset: https://react-hook-form.com/docs/useform/reset
- Current codebase: /workspace/backend/src/collections/Events.ts (status validation, lines 149-166)
- Current codebase: /workspace/backend/src/collections/Signatures.ts (signature validation, lines 46-78)
- Current codebase: /workspace/frontend/src/hooks/use-participants.ts (walk-in implementation)

### Secondary (MEDIUM confidence)
- Event check-in UX best practices: https://www.executivevents.com/post/optimizing-onsite-registration-best-practices-for-efficient-event-check-in
- Audit trail best practices: https://signal.opshub.me/audit-trail-best-practices/
- Document version control: https://start.docuware.com/blog/document-management/what-is-version-control-why-is-it-important
- React Query and Forms integration: https://tkdodo.eu/blog/react-query-and-forms

### Tertiary (LOW confidence)
- Event sourcing pattern (not recommended for this use case): https://microservices.io/patterns/data/event-sourcing.html
- XState state machines (overkill for Phase 6): https://stately.ai/docs/xstate
- TypeScript FSM libraries (not needed): https://oneuptime.com/blog/post/2026-01-30-typescript-type-safe-state-machines/view

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use, no new dependencies
- Architecture: HIGH - Extends proven patterns from Phase 3 (03-01), uses Payload-native components
- Pitfalls: HIGH - Derived from actual codebase inspection and official docs, cross-referenced with Phase 3-5 implementations
- Walk-in UX improvements: MEDIUM - Optimistic updates are standard pattern but need testing in checkpoint:human-verify
- Email re-finalization behavior: LOW - Requires user decision on desired UX

**Research date:** 2026-02-14
**Valid until:** 2026-03-15 (30 days — stable domain, Payload 3.x and TanStack Query v5 are mature)
