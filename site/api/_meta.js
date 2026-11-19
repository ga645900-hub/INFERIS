// INFERIS LP · Meta Conversions API (eventos enviados pelo servidor). Desligado ate existirem META_PIXEL_ID e META_CAPI_TOKEN.
// Eventos do site: Lead (so lead qualificado), Schedule (simulação agendada), TesteGratis (fora do perfil; so medir).
// Eventos do CRM (api/cron-hubspot.js): SimulacaoRealizada e Purchase (contrato, com valor em BRL).
// Dados pessoais vao com hash SHA-256, como o Meta exige. META_TEST_CODE manda tudo para a aba "Testar eventos".
import {createHash} from 'node:crypto';
import {SITE} from './_lib.js';

const E = process.env;
export const hasMeta = () => !!(E.META_PIXEL_ID && E.META_CAPI_TOKEN);
const sha = v => v ? createHash('sha256').update(String(v).trim().toLowerCase()).digest('hex') : undefined;
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/gi, '').toLowerCase();
const fone = w => { const d = String(w || '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, ''); return d ? '55' + d : ''; };

/** userData a partir do lead (L de readLead) ou de um contato do HubSpot ({email, phone, firstname, lastname, inf_fbc, inf_fbp}). */
export function userData({email, whats, phone, nome, firstname, lastname, fbc, fbp}, req) {
  const [fn, ...ln] = nome ? String(nome).trim().split(/\s+/) : [firstname, lastname];
  const u = {em: [sha(email)], ph: [sha(fone(whats || phone))], fn: [sha(norm(fn))], ln: [sha(norm(Array.isArray(ln) ? ln.join('') : ln))],
    external_id: [sha(email)], fbc: fbc || undefined, fbp: fbp || undefined, country: [sha('br')]};
  if (req) {
    u.client_ip_address = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || undefined;
    u.client_user_agent = req.headers['user-agent'] || undefined;
  }
  for (const k of Object.keys(u)) if (u[k] === undefined || (Array.isArray(u[k]) && !u[k][0])) delete u[k];
  return u;
}

/** Envia eventos. ev: {name, id, time (ms), source: 'website'|'system_generated', url, user, custom}. */
export async function capi(evs) {
  if (!hasMeta()) return null;
  const data = (Array.isArray(evs) ? evs : [evs]).map(e => ({
    event_name: e.name, event_time: Math.floor((e.time || Date.now()) / 1000), event_id: e.id,
    action_source: e.source || 'website', event_source_url: e.source === 'system_generated' ? undefined : (e.url || SITE + '/'),
    user_data: e.user, custom_data: e.custom}));
  const body = {data};
  if (E.META_TEST_CODE) body.test_event_code = E.META_TEST_CODE;
  const v = E.META_API_VERSION || 'v23.0';
  const r = await fetch(`https://graph.facebook.com/${v}/${E.META_PIXEL_ID}/events?access_token=${encodeURIComponent(E.META_CAPI_TOKEN)}`,
    {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { console.error('meta', r.status, JSON.stringify(j.error || j).slice(0, 300)); return null; }
  return j;
}

/** Evento do site a partir de um lead. */
export const siteEvent = (name, L, req, custom) => capi({name, id: L.eid ? `${name}-${L.eid}` : undefined, url: L.url, user: userData(L, req), custom});
