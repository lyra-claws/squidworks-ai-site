# Squidworks AI

Single-page, email-only teaser hosted on the existing Cloudflare Pages project `squidworks-ai-site`. Contact: **lyra@squidworksai.com**, no CC.

## Structure
- `public/`: approved page, local styles/assets, real 404, current privacy notice and SMS retirement page, safe retired-offer notices
- `functions/_middleware.js`: exact former-offer routes return HTTP 410; no data, body, binding, or provider access
- `functions/api/intake.js`: existing retired endpoint behavior; every method returns 410 without reading context
- `public/_routes.json`: restrict Function invocation to the retired offers and intake endpoint
- `tests/contact.test.mjs`: isolated safety, route, policy and content tests
- `tests/static.test.mjs`: layout/content/asset/contrast checks

## Routes
`/` is the current teaser. `/voice`, `/pricing`, `/intake`, `/vets`, `/battle-buddy`, their `.html` variants and trailing-slash variants return an informative 410 notice. Static notices contain no obsolete offers even if Functions fail open. `/api/intake` and `/api/intake/` remain 410 with no submission processing. Unknown pages use `public/404.html` with a real 404 from Pages.

The brief Privacy notice describes hosting/technical data, enabled Cloudflare traffic/performance measurement, email and AI-assisted correspondence, earlier records and continuing privacy commitments. The old SMS URL remains as a noindex retirement notice; SMS navigation was removed. Both use local assets and the current visual identity. Original policy wording remains in Git history; the earlier privacy commitments and SMS consent-data restrictions continue to apply. No analytics settings, records, database/provider configuration, bindings or DNS changed.

## Checks
Run `node --test tests/*.test.mjs` (Node.js 20+). A plain static server does not test Pages routing. Test API methods only in isolation with context/bindings/network blocked. Public checks must use harmless GET/HEAD only. Never submit a production form or test message.

## Deployment and rollback
The existing Pages project auto-deploys `main` using `public/` as output. Preview branches share production D1; no data testing is permitted. Keep existing database, provider configuration, bindings, secrets and DNS unchanged.

Release reference: approved private preview source `dab85d40a6cf62525d91dda5d0538eb5909e8c4f`. Public changes remove preview-only labeling/index blocking, protect both visible email and mailto from edge obfuscation, add existing policy links and retire former offer URLs.

Original pre-cutover source: `d884cf8380f4a59bd5cf23ac250493df4e13d2b9`. Verified successful production deployment: `2a7dd6ea-1007-409e-9a28-df72ee10c5c6` (9 October 2026, 17:14 UTC). It contains the intake 410 guard, but restores old sales pages if rolled back. Do not roll back to any pre-guard source. Prefer correcting a narrowly scoped release regression forward; if using a known-good production rollback, reconcile `main` with a reviewed revert to prevent a later automatic redeploy from undoing it. Never force-push or modify database/provider state for website rollback.

## Policy cleanup rollback anchor
Before the approved 10 October 2026 privacy/SMS cleanup, main was `f6cd9ad659cfe97dc5e812db45e12f58ab66626f`, tree `0fcb7d6f79910720193627dd5a5f19f252a9510f`, successful production deployment `4eb587c0-6329-407d-bdcb-cd5768eaddf7`. That source retains the exact previous legal wording (except the earlier obsolete Pricing footer-link removal) with the new teaser and intake guard. The still-earlier `d884cf8` commit retains the original full policy HTML.
