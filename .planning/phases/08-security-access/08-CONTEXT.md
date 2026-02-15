# Phase 8: Security & Access - Context

**Gathered:** 2026-02-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Harden authentication, authorization, and data protection so c-sign can be deployed publicly without risk of spam, hacking, or cross-usage by attendees. Covers session management, brute-force protection, public endpoint abuse prevention, input sanitization, upload safety, and production configuration.

</domain>

<decisions>
## Implementation Decisions

### Authentication hardening
- Session expiry: 24 hours — organizers re-login daily
- Password policy: moderate — 8+ characters, mixed case + at least one number
- Brute-force protection: lock account after 5 failed attempts — only an admin can unlock via Payload admin panel (no self-service unlock, no timer)
- No self-service password reset — admins handle resets manually (small user base)
- Registration: admin-only — no public registration endpoint, admins create organizer accounts in Payload admin
- Payload admin panel (/admin): restricted to admin role only — organizers use only the frontend app
- No IP/geographic restrictions on login
- Multiple concurrent sessions allowed (phone + laptop use case)
- Cookie hardening: SameSite=Strict, Secure flag, HttpOnly, 24h expiry

### Public endpoint protection
- **Signing URL tokens**: Random unguessable tokens instead of sequential IDs — prevents brute-force URL enumeration (e.g., `/sign/a7f3b2c9...` not `/sign/5`)
- Token validity: tied to event lifecycle — valid while event is open/reopened, invalid when finalized/draft
- **Token regeneration**: Organizer can regenerate QR token to invalidate old one if link is compromised/shared publicly
- **Spam prevention strategy**: Device fingerprint-based rate limiting (NOT IP-based — attendees share WiFi in event rooms) + dynamic CAPTCHA that triggers only when suspicious volume detected (not on every submission)
- Device-based rate limiting covers both signing submissions and mass participant creation
- Email validation: format check only (no MX record lookup, no disposable email blocking)
- Duplicate signing: keep current behavior — one signature per participant-session pair (enforced via existing beforeChange hook)

### API security
- CSRF token per session for public API endpoints (Claude's discretion on implementation — stronger than static app key)
- CORS: locked to same-origin + production URL only — blocks external scripts from calling API
- Keep detailed error responses (schema info not considered secret for this app)

### Input sanitization & upload safety
- Server-side HTML/script tag stripping on all participant text inputs (names, cities, registration numbers) before storage — defense-in-depth beyond React's JSX escaping
- Signature image uploads re-encoded through Sharp server-side — strips metadata, destroys embedded payloads (polyglot file attacks), validates actual image content
- Strict file validation: PNG/JPEG only, max 2MB, magic byte verification (not just extension check)

### Production configuration
- Disable GraphQL playground in production (Payload config flag)
- Disable Payload API explorer in production
- Security headers middleware (Claude's discretion): CSP, X-Frame-Options, HSTS, X-Content-Type-Options

### Claude's Discretion
- HTTP security headers selection and strictness levels
- CSRF token implementation approach (per-session token mechanism)
- Device fingerprinting library/approach for rate limiting
- Dynamic CAPTCHA threshold and provider choice
- Exact random token format and length for signing URLs
- Sharp re-encoding pipeline configuration

</decisions>

<specifics>
## Specific Ideas

- Rate limiting must NOT be IP-based because attendees are often in the same room on the same WiFi — device fingerprinting is the right approach
- The dynamic CAPTCHA should be invisible/frictionless for normal users and only appear when abuse is detected
- Account lockout is intentionally strict (admin-only unlock) because the user base is small and known
- No self-registration aligns with the enterprise deployment model (Ceva internal tool)

</specifics>

<deferred>
## Deferred Ideas

- Audit logging (auth events, status changes, export downloads) — future phase
- GDPR-specific PII handling and data retention policies — future phase

</deferred>

---

*Phase: 08-security-access*
*Context gathered: 2026-02-15*
