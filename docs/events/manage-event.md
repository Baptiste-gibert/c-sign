# Managing an Event

Once you have created an event, the event detail page becomes your control center. From here you manage participants, generate QR codes, track who has signed, change the event status, and export the final attendance sheet.

## Opening the Event Detail Page

1. Go to the dashboard.
2. Click the row for the event you want to manage, or click **Voir** in the Actions column.

The page shows the event name, status badge, metadata (dates, location, expense type, organizer), and three tabs: **Attendance**, **Participants**, and **Settings**.

## Changing the Event Status

A banner below the header shows the current status and provides a button to advance to the next state.

The lifecycle follows this path:

```
Draft --> Open --> Finalized
                    |
                    v
                 Reopened --> Finalized
```

1. On a **Draft** event, click the action button to **Open** it. This enables QR code signing.
2. On an **Open** or **Reopened** event, click the action button to **Finalize** it. This locks the participant list and stops new signatures.
3. On a **Finalized** event, click **Reopen** if you need to collect additional signatures.

> **Warning:** Finalizing an event locks the participant list. Make sure all participants have been added and have had the chance to sign before you finalize.

## Attendance Tab

The Attendance tab is the default view for open events. It displays:

- A **global progress card** showing unique signers out of total participants, total signatures collected across all sessions, and a percentage progress bar.
- A **live indicator** (green pulsing dot) confirming that the page auto-refreshes as new signatures arrive.
- A per-day and per-session breakdown of attendance.

![Public signing page with day selection](../images/signing/01b-signing-page-full.png)

### Viewing QR Codes

1. Click the **QR Codes** button in the top-right area of the Attendance tab.
2. A dialog opens with one QR code for each attendance day (or per session, depending on your settings).
3. Click **Print** inside the dialog to print the QR codes directly.

Each QR code links to the public signing page for that specific day. Participants scan it on their phones, select their name, and draw their signature.

### Regenerating the Signing Link

If you suspect the signing link has been shared outside the intended audience, you can invalidate the old link and generate a new one.

1. Click the **Regenerate link** button in the Attendance tab toolbar.
2. Confirm the action in the dialog that appears.

All previously distributed QR codes and links stop working immediately. You will need to share the new QR codes with participants.

> **Warning:** Regenerating the link invalidates every previously shared QR code. Only do this if security is a concern.

## Participants Tab

The Participants tab lets you build and review the attendee list.

### Searching the SIMV Registry

1. Click the **Participants** tab.
2. In the **Search SIMV** section at the top, type a name.
3. Select a result from the dropdown to add that person to your event.

The participant is added to the list immediately.

### Adding a Walk-in Participant

If someone is not in the SIMV registry, you can add them manually.

1. Click **Add without registration** below the SIMV search box.
2. Fill in the required fields: last name, first name, email, city, and beneficiary type.
3. Optionally enter a professional number.
4. Click **Add**.

![Event creation form showing participant fields](../images/events/01b-create-event-full.png)

### Removing a Participant

1. Find the participant in the table.
2. Click the remove button on their row.
3. Confirm the removal in the dialog that appears.

> **Note:** You cannot add or remove participants once the event is finalized. Reopen the event first if you need to make changes.

### Participant Table

The table shows every participant with their name, city, professional number, and beneficiary type. If attendance data is available, you can also see which sessions each participant has signed.

## Settings Tab

The Settings tab gives you control over three areas.

### Changing the Theme

1. Click the **Settings** tab.
2. In the **Theme** card, click **Edit**.
3. Choose a preset theme or enter a custom accent color.
4. Toggle between dark and light mode.
5. Click **Save**.

The change applies to the public signing page that participants see.

### Changing QR Code Granularity

You can control how many QR codes c-sign generates for your event.

1. In the **QR Code Granularity** card, click **Edit**.
2. Choose one of three options:
   - **Event** -- One QR code for the entire event.
   - **Day** -- One QR code per day (recommended for multi-day events).
   - **Session** -- One QR code per session within each day.
3. Click **Save**.

The number of generated QR codes updates immediately.

### Exporting to XLSX

You can download a spreadsheet of the complete attendance record at any time.

1. In the **Export** card, click **Download XLSX**.
2. The file downloads automatically.

The exported file includes participant details and embedded signature images for each day and session. You can also trigger the download from the header area of the event detail page using the **Download XLSX** button next to the event title.

> **Tip:** You do not need to finalize the event to export. You can download a partial report while the event is still open.

## Editing Event Metadata

Some fields can be edited directly from the event detail page without returning to the creation form.

### CNOV Declaration Number

1. If no CNOV number is set, click the **Add CNOV** link in the metadata line below the event title.
2. Enter the declaration number in the inline field that appears.
3. Click **Save**.

To change an existing number, click the pencil icon next to it, update the value, and save.

## Quick Reference: Status and Available Actions

| Status | Signing | Add/Remove Participants | Export | Available Actions |
|--------|---------|------------------------|--------|-------------------|
| Draft | No | Yes | Yes | Open |
| Open | Yes | Yes | Yes | Finalize |
| Finalized | No | No | Yes | Reopen |
| Reopened | Yes | Yes | Yes | Finalize |

---

Next: [Participant Signing](../signing/participant-signing.md)
