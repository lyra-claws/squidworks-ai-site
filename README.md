# Squidworks AI

Single-page, email-only teaser hosted on the existing Cloudflare Pages project `squidworks-ai-site`. Contact: **lyra@squidworksai.com**, no CC.

## Structure
- `public/`: approved page, local styles/assets, real 404, historical policies, safe retired-offer notices
- `functions/_middleware.js`: exact former-offer routes return HTTP 410; no data, body, binding, or provider access
- `functions/api/intake.js`: existing retired endpoint behavior; every method returns 410 without reading context
- `public/_routes.json`: restrict Function invocation to the retired offers and intake endpoint
- `tests/contact.test.mjs`: isolated safety, route, policy and content tests
- `tests/static.test.mjs`: layout/content/asset/contrast checks

## Routes
`/` is the current teaser. `/voice`, `/pricing`, `/intake`, `/vets`, `/battle-buddy`, their `.html` variants and trailing-slash variants return an informative 410 notice. Static notices contain no obsolete offers even if Functions fail open. `/api/intake` and `/api/intake/` remain 410 with no submission processing. Unknown pages use `public/404.html` with a real 404 from Pages.

Privacy Policy and SMS Terms remain at their established URLs and normal Pages aliases. Their wording, dates, and contact records are unchanged. Only obsolete Pricing footer navigation was removed. Their preservation does not establish current provider activity, alter existing consent or obligations, or certify compliance.

## Checks
Run `node --test tests/*.test.mjs` (Node.js 20+). A plain static server does not test Pages routing. Test API methods only in isolation with context/bindings/network blocked. Public checks must use harmless GET/HEAD only. Never submit a production form or test message.

## Deployment and rollback
The existing Pages project auto-deploys `main` using `public/` as output. Preview branches share production D1; no data testing is permitted. Keep existing database, provider configuration, bindings, secrets and DNS unchanged.

Release reference: approved private preview source `dab85d40a6cf62525d91dda5d0538eb5909e8c4f`. Public changes remove preview-only labeling/index blocking, protect both visible email and mailto from edge obfuscation, add existing policy links and retire former offer URLs.

Verified pre-cutover source: `d884cf8380f4a59bd5cf23ac250493df4e13d2b9`. Verified successful production deployment: `2a7dd6ea-1007-409e-9a28-df72ee10c5c6` (9 October 2026, 17:14 UTC). It contains the intake 410 guard, but restores old sales pages if rolled back. Do not roll back to any pre-guard source. Prefer correcting a narrowly scoped release regression forward; if using a known-good production rollback, reconcile `main` with a reviewed revert to prevent a later automatic redeploy from undoing it. Never force-push or modify database/provider state for website rollback.
