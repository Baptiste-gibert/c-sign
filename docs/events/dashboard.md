# Dashboard

The dashboard is your home base in c-sign. It shows every event you have created and lets you quickly find, filter, and open any one of them.

## Opening the Dashboard

After you log in, c-sign takes you straight to the dashboard. You can also return to it at any time by clicking **Evenements** in the top navigation bar.

![Dashboard overview](../images/dashboard/01-dashboard-overview.png)

## What You See

The page is divided into three areas:

**Header** -- Displays the heading "Mes evenements" along with a count of your total events and how many are currently active. The **+ Nouvel evenement** button sits in the top-right corner.

**Toolbar** -- Contains a search bar and a row of status-filter pills.

**Event table** -- Lists your events with the following columns:

| Column | Description |
|--------|-------------|
| Titre | The name you gave the event |
| Lieu | City or venue |
| Dates | A single date, or a count such as "3 jours" for multi-day events |
| Type de depense | Expense category (e.g. Hospitalite-Restauration) |
| Signatures | A progress bar and a counter showing signatures collected vs. total expected |
| Statut | A colored badge -- Draft, Open, Finalized, or Reopened |
| Actions | A "Voir" link that opens the event detail page |

You can also click anywhere on a table row to open that event.

## Searching for an Event

1. Click the search bar labeled **Rechercher un evenement...** in the toolbar.
2. Type part of the event name.

The table updates instantly, showing only events whose title matches your search text. Clear the search bar to see all events again.

## Filtering by Status

Below the search bar you will find five filter pills: **Tous**, **Brouillons**, **Ouverts**, **Finalises**, and **Reouverts**.

1. Click one of the filter pills to narrow the table to events with that status.
2. Click **Tous** to remove the filter and show all events.

![Dashboard with filters and event list](../images/dashboard/01b-dashboard-full.png)

You can combine a status filter with a search query. For example, select **Ouverts** and type "formation" to find only open events that contain "formation" in the title.

## Understanding Event Statuses

Each event goes through a lifecycle reflected by its status badge:

- **Brouillon (Draft)** -- The event has been created but is not yet accepting signatures. You can still edit all details.
- **Ouvert (Open)** -- The event is live. Participants can scan QR codes and sign.
- **Finalise (Finalized)** -- Signature collection is closed. The participant list is locked. You can still export the attendance sheet.
- **Reouvert (Reopened)** -- A finalized event that has been reopened for additional signatures.

## Creating a New Event

1. Click the **+ Nouvel evenement** button in the top-right corner of the dashboard.

You will be taken to the event creation form. See [Create Event](./create-event.md) for step-by-step instructions.

## Opening an Existing Event

1. Find the event in the table (search or scroll).
2. Click the row, or click the **Voir** link in the Actions column.

The event detail page opens, where you can manage participants, view QR codes, track attendance, and export data. See [Manage Event](./manage-event.md) for details.

> **Tip:** If you have many events, combine the status filter with the search bar to locate what you need in seconds.

---

Next: [Create Event](./create-event.md)
