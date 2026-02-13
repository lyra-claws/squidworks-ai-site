/**
 * Cloudflare Pages Function: POST /api/intake
 * Store-first into D1, then sync to GoHighLevel.
 */

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    headers: { 'content-type': 'application/json', ...(init.headers || {}) },
    status: init.status || 200,
  });
}

function nowIso() {
  return new Date().toISOString();
}

function uuid() {
  // crypto.randomUUID is supported in Workers
  return crypto.randomUUID();
}

function clean(s) {
  if (s == null) return '';
  return String(s).trim();
}

function redactForLog(payload) {
  // Keep minimal PII in logs; raw_json is stored in D1.
  const out = { ...payload };
  return out;
}

async function ghlUpsertContact(env, { first_name, last_name, email, phone, business_name, goal, other_info, preferred_followup }) {
  // NOTE: GHL upsert semantics vary; simplest: create contact.
  // Later: search by email/phone then update.
  const url = 'https://services.leadconnectorhq.com/contacts/';

  const body = {
    locationId: env.GHL_LOCATION_ID,
    firstName: first_name || undefined,
    lastName: last_name || undefined,
    email: email || undefined,
    phone: phone || undefined,
    companyName: business_name || undefined,
    customFields: [
      { id: 't5zu8K2eLte2H0pIJPwe', value: business_name },        // What's your business name?
      { id: '47n5yCoTNXaSJkmJUOIp', value: goal },                 // What are you hoping your voice agent can do?
      { id: 'Kk3EP7hOQ9KEYOVWDz2P', value: 'Yes' },               // Consent to receive texts (implied by form submit)
    ].filter(f => f.value),
    tags: ['intake:voice-agent', 'source:squidworks-site'],
    source: 'squidworks.ai:intake',
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GHL_API_KEY}`,
      Version: '2021-07-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(`ghl_contact_error:${resp.status}:${JSON.stringify(data).slice(0, 500)}`);
  }

  const contactId = data?.contact?.id || data?.id;
  return { contactId, raw: data };
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.DB) return json({ ok: false, error: 'missing_d1_binding' }, { status: 500 });
  if (!env.GHL_API_KEY || !env.GHL_LOCATION_ID) return json({ ok: false, error: 'missing_ghl_env' }, { status: 500 });

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  // Honeypot
  if (payload?.website_hp) {
    return json({ ok: true });
  }

  // Accept both snake_case and camelCase field names (for variant landing pages)
  const first_name = clean(payload.first_name ?? payload.firstName);
  const last_name = clean(payload.last_name ?? payload.lastName);
  const email = clean(payload.email);
  const phone = clean(payload.phone);
  let business_name = clean(payload.business_name ?? payload.businessName);
  let goal = clean(payload.goal);
  const other_info = clean(payload.other_info ?? payload.otherInfo);
  const preferred_followup = clean(payload.preferred_followup ?? payload.preferredFollowup) || 'text';

  // Minimal required fields for contact capture.
  // (Some landing pages intentionally omit business name.)
  if (!first_name || !email) {
    return json({ ok: false, error: 'missing_required_fields' }, { status: 400 });
  }

  if (!business_name) business_name = '(personal)';
  if (!goal) goal = 'Inbound interest';

  const id = uuid();
  const created_at = nowIso();

  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
  const user_agent = request.headers.get('user-agent') || '';

  const raw_json = JSON.stringify({ ...payload, _meta: { created_at, ip, user_agent } });

  // Store-first
  const source = clean(payload.source) || 'web:intake';

  await env.DB.prepare(
    `INSERT INTO intake_submissions (id, created_at, source, ip, user_agent, raw_json, first_name, last_name, email, phone, business_name, goal, other_info, preferred_followup)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    created_at,
    source,
    ip,
    user_agent,
    raw_json,
    first_name,
    last_name,
    email,
    phone,
    business_name,
    goal,
    other_info,
    preferred_followup
  ).run();

  // Sync to GHL
  try {
    const { contactId } = await ghlUpsertContact(env, { first_name, last_name, email, phone, business_name, goal, other_info, preferred_followup });

    await env.DB.prepare(
      `UPDATE intake_submissions
       SET ghl_sync_status='ok', ghl_contact_id=?, sync_attempts=sync_attempts+1, last_sync_at=?
       WHERE id=?`
    ).bind(contactId, nowIso(), id).run();

    return json({ ok: true, id, contactId });
  } catch (e) {
    const msg = String(e?.message || e);
    await env.DB.prepare(
      `UPDATE intake_submissions
       SET ghl_sync_status='error', ghl_error=?, sync_attempts=sync_attempts+1, last_sync_at=?
       WHERE id=?`
    ).bind(msg.slice(0, 1000), nowIso(), id).run();

    // Still return ok=false so UI can show error; data is not lost.
    return json({ ok: false, error: 'ghl_sync_failed', id }, { status: 502 });
  }
}
