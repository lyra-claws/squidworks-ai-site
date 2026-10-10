import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root = new URL('../public/', import.meta.url);
const html = fs.readFileSync(new URL('index.html', root), 'utf8');
const css = fs.readFileSync(new URL('styles.css', root), 'utf8');
const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map(x => x[1]);
test('Single, explicit email CTA with no CC or query string', () => {
  const mail = hrefs.filter(h => h.startsWith('mailto:'));
  assert.deepEqual(mail, ['mailto:lyra@squidworksai.com']);
  assert.match(html, /Lyra is Devin’s AI assistant/);
  assert.match(html, /class="email-address">lyra@squidworksai\.com<\/span>/);
  assert.doesNotMatch(html, /devinharris\.me/);
  assert.match(html, /<!--email_off-->/);
});
test('No forms, scripts, trackers, external assets, production endpoints, or embeds', () => {
  assert.doesNotMatch(html, /<(?:form|input|textarea|select|script|iframe|object)\b/i);
  assert.doesNotMatch(html + css, /\/api\/|fetch\(|@import|analytics|highlevel|leadconnector/i);
  assert.equal((html.match(/https?:\/\//g)||[]).length,1);
});
test('No made-up offers, prices, testimonials, dates, or signup flows', () => {
  assert.doesNotMatch(html, /\$\d|guarantee|testimonial|book a demo|join the community|launches on|signup|sign up/i);
  assert.match(html, /Navy veteran/);
  assert.match(html, /Wherever you’re starting from, you’re welcome here/);
});
test('Accessible document, landmarks, skip link, image treatment, and heading hierarchy', () => {
  assert.match(html, /<html lang="en">/);
  assert.match(html, /name="viewport"/);
  assert.match(html, /class="skip-link" href="#main"/);
  assert.equal((html.match(/<h1\b/g)||[]).length, 1);
  assert.match(html, /<main id="main">/);
  assert.match(html, /alt="" class="brand-mark"/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
});
test('Local assets and anchor destinations all exist', () => {
  for (const ref of [...hrefs, ...[...html.matchAll(/src="([^"]+)"/g)].map(x => x[1])]) {
    if (ref.startsWith('mailto:') || ref === 'https://squidworksai.com/') continue;
    if (ref.startsWith('#')) assert.ok(html.includes(`id="${ref.slice(1)}"`), ref);
    else { const local=ref.replace(/^\//, ''); assert.ok(fs.existsSync(new URL(local,root)) || (!local.includes('.') && fs.existsSync(new URL(`${local}.html`,root))),ref); }
  }
});
test('Public indexing allowed; real not-found document included', () => {
  assert.doesNotMatch(html, /noindex, nofollow, noarchive/);
  assert.match(fs.readFileSync(new URL('robots.txt', root), 'utf8'), /Allow: \//);
  assert.ok(fs.existsSync(new URL('404.html', root)));
});
test('Text and UI palette meets contrast checks', () => {
  function lum(hex){let v=hex.match(/[a-f0-9]{2}/gi).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return v[0]*.2126+v[1]*.7152+v[2]*.0722}
  function ratio(a,b){let x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
  for(const [fg,bg] of [['172b39','f5f2e9'],['56616a','f5f2e9'],['b94320','f5f2e9'],['172b39','eeebe1'],['fffaf0','172b39'],['d3dce0','172b39'],['b7c2c8','172b39'],['edb18c','172b39'],['dfb595','172b39']]) assert.ok(ratio(fg,bg)>=4.5,`${fg}/${bg}: ${ratio(fg,bg)}`);
});
