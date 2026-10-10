import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequest} from '../functions/_middleware.js';
const read = p => readFileSync(new URL(`../${p}`, import.meta.url),'utf8');
const text = html => html.replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();
const privacy=read('public/privacy-policy.html'),sms=read('public/sms-terms.html');
test('Privacy notice contains the exact reviewed collection and continuing-commitment paragraphs',()=>{
 for(const expected of [
 'This website introduces Squidworks AI’s new direction. It has no contact or sign-up forms, and our former SMS program is no longer operating.',
 'Cloudflare hosts and protects this website and may process technical information such as IP addresses, requested pages, and browser details. Cloudflare traffic and performance measurement is enabled. Its Web Analytics measurement does not use cookies.',
 'If you email lyra@squidworksai.com, we receive your email address, message, and anything else you choose to send. We use that information to respond and manage correspondence. Lyra is our AI assistant, so AI tools may help handle your message. Our service providers support website hosting, email, and these communications.',
 'We may still hold earlier correspondence and records from our former services. The privacy commitments made when that information was collected continue to apply, including restrictions on sharing SMS opt-in and consent data.',
 'For privacy questions or to request access, correction, or deletion of your information, email lyra@squidworksai.com.'
 ]) assert.ok(text(privacy).includes(expected),expected);
});
test('SMS notice contains only retired-program scope and current contact, with noindex canonical',()=>{
 assert.ok(text(sms).includes('Squidworks AI no longer operates its former SMS alerts program or accepts new SMS sign-ups.'));
 assert.ok(text(sms).includes('For questions about a previous message or your information, email lyra@squidworksai.com.'));
 assert.match(sms,/<meta name="robots" content="noindex,follow">/);
 assert.match(sms,/<link rel="canonical" href="https:\/\/squidworksai\.com\/sms-terms">/);
 assert.doesNotMatch(sms,/shortcode|CTIA|TCPA|reply.*STOP|rejoining|we will resume/i);
});
test('Both supporting pages share local brand, responsive styles, dates, and protected email links',()=>{
 for(const [slug,html] of [['privacy-policy',privacy],['sms-terms',sms]]){
  assert.match(html,/<link rel="stylesheet" href="\/styles\.css">/);
  assert.match(html,/<img src="\/assets\/squidworks-mark\.png"/);
  assert.match(html,/<main id="main" class="legal-main wrap">/);
  assert.match(html,/Updated October 10, 2026/);
  assert.match(html,new RegExp(`rel="canonical" href="https://squidworksai.com/${slug}"`));
  assert.match(html,/<!--email_off--><a href="mailto:lyra@squidworksai\.com">lyra@squidworksai\.com<\/a><!--\/email_off-->/);
  assert.doesNotMatch(html,/fonts\.google|support@squidworks|376-6826|backdrop-filter|<(?:form|input|textarea|select|script|iframe)\b|[?&]cc=/i);
 }
 assert.match(read('public/styles.css'),/\.legal-main\{max-width:760px/);
 assert.match(read('public/styles.css'),/\.legal-page \.site-header nav \.legal-home\{display:block\}/);
});
test('All current navigation excludes SMS while retaining Privacy',async()=>{
 for(const name of ['index','voice','pricing','intake','vets','battle-buddy','privacy-policy','sms-terms']) {
  const html=read(`public/${name}.html`);
  assert.doesNotMatch(html,/href="\/sms-terms(?:\.html)?"/);
  assert.match(html,/href="\/privacy-policy">Privacy<\/a>/);
 }
 for(const name of ['voice','pricing','intake','vets','battle-buddy']) {
  const response=await onRequest({request:{url:`https://squidworksai.com/${name}`,method:'GET'}});
  assert.equal(await response.text(),read(`public/${name}.html`));
 }
});
