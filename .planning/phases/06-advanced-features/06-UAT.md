---
status: complete
phase: 06-advanced-features
source: 06-01-SUMMARY.md, 06-02-SUMMARY.md
started: 2026-02-14T11:10:00Z
updated: 2026-02-14T11:25:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Reopen a Finalized Event
expected: On the event detail page of a finalized event, a "Rouvrir l'evenement"/"Reopen event" button appears alongside the XLSX download button. Clicking it shows a confirmation dialog. After confirming, status changes to "Rouvert"/"Reopened" with an amber badge.
result: pass

### 2. Participant Management Re-enabled After Reopen
expected: After reopening the event, the SIMV participant search field becomes active, the "Ajouter un participant" walk-in button is clickable, and the remove buttons appear on existing participants. These controls were disabled when the event was finalized.
result: pass

### 3. Re-finalize a Reopened Event
expected: On a reopened event, a "Finaliser a nouveau"/"Finalize again" button appears. Clicking it changes the status back to "Finalise"/"Finalized" with the blue badge. Participant management controls become disabled again.
result: pass

### 4. Public Signing on Reopened Event
expected: Opening the QR code signing link for a reopened event shows the full participant form and signature canvas — identical to when the event status was "open". No blocking message appears.
result: pass

### 5. CNOV Display in Event Header
expected: If an event has a CNOV declaration number set (via Payload admin), the event detail page header shows "CNOV: {number}" after the expense type badge. If no CNOV is set, nothing extra appears.
result: issue
reported: "on the frontend for organiser i can't create an event with CNOV number"
severity: major

### 6. Walk-in Participant Instant Feedback
expected: On a reopened (or open) event, clicking the walk-in button, filling the form, and submitting shows the new participant immediately in the participant list — before the server fully responds. If the server fails, the participant disappears (rollback).
result: pass

### 7. CNOV in XLSX Export
expected: Downloading the XLSX export for an event with a CNOV number shows the CNOV value in the metadata row (row 2) alongside location, organizer, and expense type. Format: "Lieu: X | Organisateur: Y | Type: Z | CNOV: {number}".
result: skipped
reason: Blocked by Test 5 — cannot set CNOV number from frontend

### 8. Bilingual Reopen Labels
expected: Switching language between FR and EN updates all reopen-related labels: status badge ("Rouvert"/"Reopened"), reopen button, confirmation dialog text, re-finalize button, and the reopened status message.
result: pass

### 9. Dashboard Status Badge for Reopened
expected: The organizer dashboard event list shows reopened events with a distinct "Rouvert"/"Reopened" badge (not "Ouvert" or "Finalise").
result: pass

## Summary

total: 9
passed: 7
issues: 1
pending: 0
skipped: 1

## Gaps

- truth: "Organizer can set CNOV declaration number on event from the frontend"
  status: failed
  reason: "User reported: on the frontend for organiser i can't create an event with CNOV number"
  severity: major
  test: 5
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
