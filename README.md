# T.K. Thrive — Enterprise page

A single-page site (`index.html`) plus one Netlify Function that powers the
fit-call form. The form emails you via Resend; the API key lives only in
Netlify's environment variables, never in the page.

## Files
- `index.html` — the page
- `logo-orange.png`, `logo-white.png` — wordmarks
- `favicon-32.png`, `favicon-180.png`, `favicon.ico` — site icons
- `netlify/functions/fit-call.js` — serverless email handler
- `netlify.toml` — Netlify config

## Deploy (drag-and-drop won't run functions — use one of these)

**Option A — Git + Netlify (recommended):**
1. Push this folder to a GitHub repo.
2. In Netlify: "Add new site" → "Import from Git" → pick the repo.
3. Build settings: publish directory `.`, functions directory auto-detected from `netlify.toml`.

**Option B — Netlify CLI:**
```
npm i -g netlify-cli
netlify deploy --prod
```

## Required environment variables (Netlify → Site settings → Environment variables)
- `RESEND_API_KEY` — your Resend API key. **Generate a FRESH one** (see security note).
- `FIT_CALL_TO` — where form submissions are emailed (default: timour@tkthrive.io)
- `FIT_CALL_FROM` — a verified Resend sender, e.g. `T.K. Thrive <noreply@tkthrive.io>`
  (the sending domain must be verified in Resend, or sends will fail)

## SECURITY — rotate the key
The key shared earlier should be considered compromised because it was sent in
plaintext. In the Resend dashboard: revoke it, create a new one, and paste the
new key into Netlify's `RESEND_API_KEY` env var. Never commit the key to the repo
or place it in `index.html`.

## Notes
- The form has a hidden honeypot field (`company_website`) to drop bot spam.
- If the function is unreachable (e.g. opened as a local file), the form shows a
  fallback message pointing to the direct email address.
