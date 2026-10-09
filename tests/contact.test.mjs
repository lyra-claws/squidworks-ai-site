import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { onRequest } from '../functions/api/intake.js';

for (const method of ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
  test(`${method} returns 410 without body, binding, or network access`, async () => {
    const forbidden = new Proxy({}, { get() { throw new Error('Unexpected context access'); } });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = () => { throw new Error('Unexpected network access'); };
    try {
      // Even malformed/legacy payloads cannot be read: every context access throws.
      const response = await onRequest(new Proxy({ request: { method }, env: forbidden }, {
        get() { throw new Error('Unexpected request or environment access'); },
      }));
      assert.equal(response.status, 410);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      const body = await response.json();
      assert.equal(body.ok, false);
      assert.equal(body.error, 'intake_retired');
      assert.equal(body.contact, 'mailto:lyra@devinharris.me');
    } finally { globalThis.fetch = originalFetch; }
  });
}
for (const page of ['intake', 'vets', 'battle-buddy']) {
  test(`${page} has a visible email link and no submission flow`, async () => {
    const html = await readFile(new URL(`../public/${page}.html`, import.meta.url), 'utf8');
    assert.match(html, /href="mailto:lyra@devinharris\.me">lyra@devinharris\.me<\/a>/);
    assert.doesNotMatch(html, /<(?:form|input|textarea|select|script)\b/i);
    assert.doesNotMatch(html, /\/api\/intake|FormData|hello@squidworks\.ai|[?&]cc=/i);
    assert.match(html, /:focus-visible/);
    assert.match(html, /aria-labelledby="contact-heading"/);
  });
}
