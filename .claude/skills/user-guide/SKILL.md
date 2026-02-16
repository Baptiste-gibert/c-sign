---
name: user-guide
description: >
  Generates complete end-user documentation with automated screenshots
  using the Playwright MCP server. Use when asked to create a user guide,
  help docs, onboarding tutorial, or end-user documentation.
  Requires Playwright MCP to be running and the app to be accessible.
---

# User Guide Generator

You generate production-quality user documentation with real screenshots
captured from the running application via the Playwright MCP server.
Output is GitHub-native markdown — no static site generator required.

## Config

- App URL: http://localhost:3000
- Auth: login/password
- Screenshots dir: docs/images/
- Docs dir: docs/
- Format: GitHub-native markdown (no Docusaurus, no MkDocs)

## Workflow

### Step 1 — Sitemap Discovery

Scan the codebase to build a complete map of user-facing screens:

1. Find the router config (React Router, Next.js pages, Vue Router, etc.)
2. List every route with its purpose
3. Group routes by feature area (auth, dashboard, settings, etc.)
4. Identify the happy path order (the order a new user would discover features)
5. Output a structured list and STOP to ask the user for approval before continuing

If GSD planning files exist, also read:

- .planning/PROJECT.md (project vision)
- .planning/REQUIREMENTS.md (feature list)
- Phase SUMMARY.md files (what was built)

### Step 2 — Auth Setup

Before capturing any screenshots:

1. Use Playwright MCP to navigate to http://localhost:3000/login (or the auth route found in Step 1)
2. Ask the user for test credentials if not already provided
3. Fill in the login form and submit
4. Verify auth succeeded (check redirect or presence of authenticated content)
5. All subsequent screenshots will reuse this authenticated session

### Step 3 — Screenshot Capture

For each screen in the approved sitemap, IN ORDER:

1. Navigate to the page
2. Wait for full page load (network idle, no spinners)
3. Take a full-page screenshot, save to: `docs/images/{section}/{nn}-{slug}.png`
4. For key interactive features, capture multiple states:
   - Empty/default state
   - Filled/active state
   - Success feedback
   - Error state (if relevant for user guidance)

**Naming convention:**

```
docs/images/
├── auth/
│   ├── 01-login-page.png
│   ├── 02-login-filled.png
│   └── 03-login-success.png
├── dashboard/
│   ├── 01-dashboard-overview.png
│   └── 02-dashboard-detail.png
└── settings/
    ├── 01-settings-profile.png
    └── 02-settings-saved.png
```

**Screenshot rules:**

- Viewport: 1280x800 desktop
- Wait for animations to finish before capture
- Hide cookie banners, dev toolbars, or debug overlays if present
- If a page is taller than 2000px, crop to the most relevant section
- Use meaningful alt text when referencing in markdown

### Step 4 — Write the Documentation

For each feature area, create a markdown file in `docs/`.

**Template for each guide:**

```markdown
# Feature Name

Brief intro — what this does and why you need it. 1-2 sentences max.

## How to [primary action]

1. Navigate to **Page Name** using the sidebar (or top menu).

   ![Page overview](./images/section/01-page.png)

2. Click **Button Name** in the [location].

3. Fill in the required fields:
   - **Field 1** — what to enter here
   - **Field 2** — what to enter here

   ![Filled form](./images/section/02-filled.png)

4. Click **Submit**.

   > **💡 Tip:** Use `Ctrl+Enter` to submit quickly.

5. A success confirmation appears.

   ![Success](./images/section/03-success.png)

## Common issues

> **⚠️ Warning:** If you see "[error message]", verify that [concrete fix].

---

**Next:** [Related Feature](./related-feature.md)
```

**Writing rules:**

- Audience: end users, NOT developers
- Voice: "you" + active ("Click Save", not "The Save button should be clicked")
- One action per numbered step
- After each action, describe what the user should SEE
- Short paragraphs (2-3 sentences max)
- Screenshot every 2-3 steps, no more
- Link related guides at the bottom

**GitHub-native formatting only:**

- Headings: `#` `##` `###`
- Tips: `> **💡 Tip:**` (blockquote)
- Warnings: `> **⚠️ Warning:**` (blockquote)
- Danger: `> **🚨 Important:**` (blockquote)
- Info: `> **ℹ️ Note:**` (blockquote)
- Images: relative paths `./images/...` (NEVER absolute paths)
- Links between docs: relative `./other-doc.md` (NEVER absolute)
- Horizontal rules `---` to separate sections
- Tables use standard GitHub markdown syntax
- NO frontmatter (no `---` YAML block at top)
- NO Docusaurus/MkDocs specific syntax
- NO HTML tags unless strictly necessary

### Step 5 — Assemble the Docs Folder

**Required structure:**

```
docs/
├── README.md              ← Entry point: product overview + table of contents
├── getting-started.md     ← First-time onboarding flow
├── auth/
│   └── login.md
├── [feature-area]/
│   └── [guide].md
├── faq.md                 ← Common issues compiled from all guides
└── images/
    ├── auth/
    ├── dashboard/
    ├── [feature-area]/
    └── ...
```

**README.md must include:**

- Product name and one-line description
- Screenshot of the main dashboard/home page
- Table of contents linking to every guide:

  ```markdown
  ## Table of Contents

  | Section                                 | Description                     |
  | --------------------------------------- | ------------------------------- |
  | [Getting Started](./getting-started.md) | First-time setup and onboarding |
  | [Login](./auth/login.md)                | How to sign in to your account  |
  | [Dashboard](./dashboard/overview.md)    | Navigate and use the dashboard  |
  | ...                                     | ...                             |
  ```

- Keep it concise — this is the landing page, not a guide

**getting-started.md must include:**

- Account creation or first login
- Initial setup steps with screenshots
- First meaningful action the user can take
- "You're all set!" confirmation with screenshot

**faq.md:** Compile all "Common issues" sections from every guide into one FAQ page, organized by feature area.

### Step 6 — Summary

After generation, present:

1. Total pages created with word counts
2. Total screenshots captured
3. Any screens that could not be captured (and why)
4. Suggested additional guides
5. Remind user to review docs/ on GitHub to verify rendering
