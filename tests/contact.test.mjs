import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { onRequest as intake } from '../functions/api/intake.js';
import { onRequest as middleware } from '../functions/_middleware.js';
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const names = ['voice', 'pricing', 'intake', 'vets', 'battle-buddy'];
const routes = JSON.parse(read('public/_routes.json'));
for (const method of ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
  test(`API ${method}: 410, no request/body/binding/network access`, async () => {
    const forbidden = new Proxy({}, { get() { throw new Error('Unexpected context access'); } });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = () => { throw new Error('Unexpected network access'); };
    try {
      const response = await intake(forbidden);
      assert.equal(response.status, 410);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      const body = await response.json();
      assert.equal(body.ok, false);
      assert.equal(body.error, 'intake_retired');
      assert.equal(body.contact, 'mailto:lyra@squidworksai.com');
    } finally { globalThis.fetch = originalFetch; }
  });
}
for (const name of names) {
  for (const suffix of ['', '/', '.html', '.html/']) {
    test(`Retired /${name}${suffix}: exact route coverage, all methods and query strings`, async () => {
      const path = `/${name}${suffix}`;
      assert.ok(routes.include.includes(path));
      for (const method of ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
        const request = new Proxy({ url: `https://squidworksai.com${path}?old=1`, method }, {get(target, key) {if (key in target) return target[key]; throw Error('Unexpected request access');}});
        const context = new Proxy({request}, {get(target,key) {if (key === 'request') return target.request; throw Error('Unexpected binding/next access');}});
        const originalFetch = globalThis.fetch;
        globalThis.fetch = () => { throw Error('Unexpected fetch'); };
        try {
          const response = await middleware(context);
          assert.equal(response.status, 410);
          assert.equal(response.headers.get('cache-control'), 'no-store');
          const html = await response.text();
          if(method === 'HEAD') assert.equal(html, '');
          else {
            assert.match(html, /This page<br><span class="serif">has been retired/);
            assert.match(html, /href="mailto:lyra@squidworksai\.com">lyra@squidworksai\.com/);
            assert.doesNotMatch(html, /<(?:form|input|textarea|select|script)\b|[?&]cc=|\$\d|\/api\//i);
          }
        } finally {globalThis.fetch = originalFetch;}
      }
    });
  }
  test(`Static /${name}.html has safe retirement fallback`, () => {
    const html = read(`public/${name}.html`);
    assert.match(html, /has been retired/);
    assert.doesNotMatch(html, /<(?:form|input|textarea|select|script)\b|\$\d|book a demo|voice agent|monthly plan/i);
  });
}
test('Other URLs pass through unchanged, including policy, static, unknown and API paths', async () => {
  for (const path of ['/', '/index.html', '/styles.css', '/privacy-policy.html', '/privacy-policy/', '/sms-terms', '/api/intake', '/api/intake/', '/unrelated', '/voice-extra']) {
    const expected = new Response('pass', {status: 202});
    assert.equal(await middleware({request:{url:`https://squidworksai.com${path}`},next:()=>expected}),expected);
  }
  assert.ok(routes.include.includes('/api/intake'));
  assert.ok(routes.include.includes('/api/intake/'));
  assert.deepEqual(routes.exclude, []);
});
test('Policy documents preserve original bytes except obsolete Pricing footer link', () => {
  const original = {'privacy-policy':'d7885c1647057fda1ad01a482bb3cf4271a09d18','sms-terms':'ad49a85f2e6172ad101b9425cda95aa0c24bfa4f'};
  for(const [name,sha] of Object.entries(original)) {
    const html=read(`public/${name}.html`);
    assert.doesNotMatch(html,/href="\/pricing.html"/);
    const restored=html.replace('    <div class="footer">\n','    <div class="footer">\n      <a href="/pricing.html">Pricing</a>\n');
    const bytes=Buffer.from(restored);
    const hash=createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
    assert.equal(hash,sha,`${name}: legal wording must remain unchanged`);
  }
});
test('Public home has only approved business email, no forms/tracking/preview label', () => {
  const html=read('public/index.html');
  assert.deepEqual([...html.matchAll(/href="(mailto:[^"]+)"/g)].map(x=>x[1]),['mailto:lyra@squidworksai.com']);
  assert.match(html,/<!--email_off--><span class="email-address">lyra@squidworksai\.com<\/span><!--\/email_off-->/);
  assert.doesNotMatch(html,/<(?:form|input|textarea|select|script|iframe|object)\b|noindex|private design preview|devinharris\.me|[?&]cc=/i);
  assert.match(html,/<link rel="canonical" href="https:\/\/squidworksai\.com\/">/);
  assert.match(read('public/robots.txt'),/Allow: \//);
  assert.doesNotMatch(read('public/404.html'),/preview/i);
});
