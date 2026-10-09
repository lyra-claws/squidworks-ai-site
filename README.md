# Squidworks AI

Static marketing site hosted on Cloudflare Pages. Contact on the demo, Veterans Forum, and Battle Buddy pages is email-only: **lyra@devinharris.me**.

## Structure
- `public/`: static pages and assets
- `functions/api/intake.js`: retired intake endpoint; every HTTP method returns `410 Gone` with the email alternative
- `tests/contact.test.mjs`: isolated regression tests

## Contact flow
The three former forms have been replaced by visible, selectable email links. They work without JavaScript and do not send requests to the old API. No CC address is added.

The retired endpoint does not parse request bodies, access environment bindings, write to D1, or call GoHighLevel. Existing records, schema, bindings, and secrets remain unchanged. Do not remove them as part of this fix.

## Local checks
Run `node --test tests/contact.test.mjs` (Node.js 20+). Preview static pages with `python3 -m http.server 8000 --directory public`; this static server does not run Pages Functions.

Check mobile layout, keyboard focus, and the email link on each contact page. Email sending itself is handled by the visitor’s email application.

## Deployment safety
Cloudflare Pages deploys `main` to production. Preview branches currently share the production D1 database; never test form submissions against a deployed environment. Run endpoint tests locally with blocked bindings/network access. After deployment, verify the exact commit in Cloudflare and use only harmless GET checks for the retired endpoint.
