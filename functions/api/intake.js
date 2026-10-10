/**
 * Retired intake endpoint. All methods return 410 without reading submissions,
 * accessing bindings, writing to D1, or calling GoHighLevel.
 * Existing records and deployment bindings are intentionally preserved.
 */
export function onRequest() {
  return new Response(JSON.stringify({
    ok: false,
    error: 'intake_retired',
    message: 'This form is no longer available. Please email lyra@squidworksai.com.',
    contact: 'mailto:lyra@squidworksai.com',
  }), {
    status: 410,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
