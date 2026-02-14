# Digital Attendance Sheet Project

## Project Overview

**Organization:** Ceva Santé Animale – Transparency & Market Intelligence Department  
**Project Owner:** Isabelle Leroy, Head of Transparency & Market Intelligence  
**IT Stakeholders:** Matthieu Brabant, Maxence Mortier, Louis Scarfone, Matthieu Arnoud  
**Target Presentation Date:** April 20, 2026 (Transparency Committee)

---

## Background

Ceva Santé Animale currently relies on **paper-based attendance sheets** for events such as business meetings, training sessions, and meals with veterinary professionals. These paper forms are frequently lost, forgotten, or incorrectly filled out, leading to compliance and traceability issues.

An initial **Proof of Concept using Microsoft PowerApps** was developed internally by Louis Scarfone. While the basic concept worked, the POC revealed significant technical limitations: internal authentication prevented external participants (veterinarians, pharmacists) from accessing the app on their own devices, the app crashed when handling many signatures due to memory constraints, and the environment made it nearly impossible to reload or edit previously submitted sheets.

Following this assessment, the IT team formally recommended **abandoning the in-house PowerApps approach** and moving toward a **market solution** (e.g., Digitevent, Digiforma) or a **custom lightweight web application**. However, **no IT budget is allocated for 2026** — any licensing costs would need to be covered by the Transparency team.

---

## Scope & Volume

| Metric                                        | Value                   |
| --------------------------------------------- | ----------------------- |
| Events per year (BU meetings, conferences)    | ~20+                    |
| Meals per year (delegates with veterinarians) | ~800+                   |
| Participants per event                        | 10 to 50+               |
| Total attendance records per year             | Estimated 5,000–10,000+ |

---

## Functional Requirements

### 1. Event Management

| ID    | Requirement                                                                                                                                                     | Priority    |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| FR-01 | Create an event with: name, date range (from DD/MM/YYYY to DD/MM/YYYY), expense type, Ceva organizer name, location                                             | Must Have   |
| FR-02 | Supported expense types: Hospitality-snack, Hospitality-catering, Hospitality-accommodation, Event registration fees, Meeting/organization fees, Transport fees | Must Have   |
| FR-03 | CNOV declaration number field                                                                                                                                   | Must Have   |
| FR-04 | Event history: ability to view, reopen, and modify previously submitted attendance sheets                                                                       | Should Have |

### 2. Participant Management

| ID    | Requirement                                                                                                                      | Priority    |
| ----- | -------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| FR-05 | Search participants from the SIMV registry (veterinarians/pharmacists), sorted alphabetically by last name                       | Must Have   |
| FR-06 | Search by professional registration number (for common last names)                                                               | Should Have |
| FR-07 | Clear error message when a health professional is not found in the registry                                                      | Must Have   |
| FR-08 | Pre-populate participant list before the event (advance preparation), with the ability to add or remove names                    | Must Have   |
| FR-09 | Beneficiary type selection (mandatory): Veterinarian, Pharmacist, Student, ASV (Veterinary Assistant), Technician, Farmer, Other | Must Have   |

### 3. Participant Data Fields

| ID    | Field                            | Required      |
| ----- | -------------------------------- | ------------- |
| FR-10 | Last name / First name           | Yes           |
| FR-11 | Email address                    | Yes           |
| FR-12 | City                             | Yes           |
| FR-13 | Professional registration number | If applicable |
| FR-14 | Beneficiary type                 | Yes           |

### 4. Signature & Attendance Validation

| ID    | Requirement                                                                                                                                                                              | Priority  |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| FR-15 | Handwritten digital signature (touch-based on screen) — a real signature is required, not just a QR code scan as validation                                                              | Must Have |
| FR-16 | QR code access for large events: participants scan a QR code to open the attendance form on their own phone, fill in their information, and sign — avoids passing a single device around | Must Have |
| FR-17 | Right to image: optional checkbox (YES / NO) allowing the participant to authorize the use of photos taken during the event for internal or external communication                       | Must Have |

### 5. Export & Delivery

| ID    | Requirement                                                                                                                      | Priority  |
| ----- | -------------------------------------------------------------------------------------------------------------------------------- | --------- |
| FR-18 | Automatic delivery of the finalized attendance sheet (Excel/XLSX format) to **transparence@ceva.com** AND to the event organizer | Must Have |
| FR-19 | Input field for the event organizer's email address (recipient of the export file)                                               | Must Have |

---

## Non-Functional Requirements

| ID     | Requirement                     | Details                                                                                                                                                            |
| ------ | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| NFR-01 | **No IT budget**                | Licensing costs must be covered by the Transparency team. The solution must be cost-effective or free.                                                             |
| NFR-02 | **External access**             | Participants are external professionals (veterinarians, pharmacists, etc.) with no Ceva Microsoft account. The solution must work without internal authentication. |
| NFR-03 | **Multi-device support**        | Must work reliably on smartphones, tablets, and desktops. No crashes under load (the PowerApps POC failed with many signatures stored in memory).                  |
| NFR-04 | **Ceva IT/Security compliance** | Any external solution must be validated and approved by the IT department for security and data protection standards.                                              |
| NFR-05 | **Scalability**                 | Must handle 800+ events per year without performance degradation.                                                                                                  |
| NFR-06 | **Data privacy (GDPR)**         | Personal data collection (email, city, signature, image rights) must comply with French and EU data protection regulations.                                        |
| NFR-07 | **Ease of use**                 | Minimal training required. Delegates and organizers should be able to use the tool autonomously in the field.                                                      |

---

## Constraints & Risks

| Risk                            | Impact                                           | Mitigation                                                                            |
| ------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------- |
| No allocated IT budget for 2026 | May delay or block deployment of a paid solution | Evaluate free/open-source options or a lightweight custom PWA                         |
| External participant access     | PowerApps POC failed on this point entirely      | Use a web-based solution (PWA) with no authentication required for signatories        |
| High event volume (800+/year)   | Performance and reliability concerns             | Choose a solution designed for scale, or architect a lightweight backend              |
| Signature storage and memory    | PowerApps POC crashed with many signatures       | Upload signatures individually to the server rather than storing all in client memory |
| IT security approval            | Could reject proposed external tools             | Involve IT early in the evaluation process                                            |

---

## Solution Options Under Consideration

### Option A: Market Solution

**Examples:** Digitevent, Digiforma

- Purpose-built for event management and attendance tracking
- Digiforma already used by another BU (Simon Mouchel, Pork BU) for training attendance
- Potential for cross-BU cost sharing
- Requires license budget from the Transparency team
- IT team has offered to assist with comparative analysis (features, cost, security, integration)

### Option B: Custom Lightweight Web Application (PWA)

- Progressive Web App accessible via QR code, no app store download needed
- Works on all devices (iOS, Android, desktop) without authentication for external participants
- Full control over features and data flow
- Lower recurring cost (hosting only), but requires development effort
- Could be built to match all functional requirements exactly

### Option C: Hybrid Approach

- Use a market solution for the core event/attendance management
- Add a custom QR-code-based PWA layer for the external participant signing experience
- Combines reliability of a proven product with flexibility for the specific Ceva use case

---

## Timeline

| Date               | Milestone                                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| November 2025      | Initial PowerApps POC tested and feedback collected                                                  |
| December 2025      | Requirements refined, POC limitations identified                                                     |
| January 2026       | IT recommends abandoning PowerApps, pivoting to market solution                                      |
| February 2026      | Project forwarded to additional team members for evaluation                                          |
| **April 20, 2026** | **Target: present a draft proposal with Ceva-compatible tool options at the Transparency Committee** |

---

## Next Steps

1. **Benchmark market solutions** (Digiforma, Digitevent, and alternatives) against the requirements listed above
2. **Evaluate a custom PWA approach** as a zero-license-cost alternative
3. **Validate shortlisted options with IT** for security and compliance approval
4. **Estimate costs** (licensing vs. development) and identify budget ownership
5. **Prepare a recommendation document** for the April 20, 2026 Transparency Committee
