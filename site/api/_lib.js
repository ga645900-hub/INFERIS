// INFERIS LP: utilitarios das funcoes /api (Vercel, Node 20, sem dependencias).
// Arquivos com "_" na pasta api nao viram rota. Variaveis de ambiente: ver SETUP.md.
const E = process.env;
export const TZ = 'America/Sao_Paulo'; // Brasil sem horario de verao desde 2019: UTC-3 fixo
const OFF = 3 * 3600e3;
export const RULES = {
  days: (E.DEMO_DAYS || '1,2,3,4,5').split(',').map(Number), // 0 = domingo
  start: E.DEMO_START || '14:00', end: E.DEMO_END || '19:00',
  min: +(E.DEMO_MIN || 30), noticeH: +(E.DEMO_NOTICE_H || 3), window: +(E.DEMO_WINDOW_DAYS || 14),
};
export const SITE = (E.SITE_URL || 'https://lp.inferis.com.br').replace(/\/$/, '');
// Dois jeitos de falar com o Google: (1) Apps Script na conta inferisgeral (GAS_URL + GAS_SECRET, ver google/Code.gs),
// sem projeto no Google Cloud; (2) OAuth direto (GOOGLE_CLIENT_ID/SECRET/REFRESH_TOKEN). O Apps Script tem prioridade.
const viaGas = () => !!(E.GAS_URL && E.GAS_SECRET);
const viaOauth = () => !!(E.GOOGLE_CLIENT_ID && E.GOOGLE_CLIENT_SECRET && E.GOOGLE_REFRESH_TOKEN);
export const live = () => viaGas() || viaOauth();
async function gas(action, payload) {
  const r = await fetch(E.GAS_URL, {method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'}, redirect: 'follow',
    body: JSON.stringify(Object.assign({secret: E.GAS_SECRET, action}, payload))});
  const j = await r.json().catch(() => ({error: 'resposta ' + r.status}));
  if (j.error) throw new Error('apps script: ' + j.error);
  return j;
}
export const hasMail = () => !!E.RESEND_API_KEY;

// ---------- respostas ----------
export function send(res, code, obj) { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(obj)); }
export const clean = (v, n = 120) => String(v ?? '').replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, n);
export const okEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

// ---------- horarios (regras + agenda do Google) ----------
const hm = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
export function candidates(now = Date.now()) {
  const out = [], s0 = hm(RULES.start), s1 = hm(RULES.end);
  for (let i = 0; i <= RULES.window; i++) {
    const loc = new Date(now - OFF + i * 864e5), y = loc.getUTCFullYear(), mo = loc.getUTCMonth(), d = loc.getUTCDate();
    if (!RULES.days.includes(new Date(Date.UTC(y, mo, d)).getUTCDay())) continue;
    for (let m = s0; m + RULES.min <= s1; m += RULES.min) {
      const t = Date.UTC(y, mo, d, 0, m) + OFF;
      if (t >= now + RULES.noticeH * 3600e3) out.push(t);
    }
  }
  return out;
}
export async function freeSlots() {
  const c = candidates();
  if (!c.length) return [];
  const busy = live() ? await freeBusy(new Date(c[0]).toISOString(), new Date(c[c.length - 1] + RULES.min * 60e3).toISOString()) : [];
  const free = c.filter(t => !busy.some(b => t < b[1] && t + RULES.min * 60e3 > b[0]));
  const days = new Map();
  for (const t of free) {
    const key = new Date(t - OFF).toISOString().slice(0, 10);
    if (!days.has(key)) days.set(key, []);
    days.get(key).push(new Date(t).toISOString());
  }
  return [...days].map(([date, slots]) => ({date, slots}));
}

// ---------- Google (OAuth da conta inferisgeral@gmail.com) ----------
let tok = null;
async function gtoken() {
  if (tok && tok.exp > Date.now() + 60e3) return tok.v;
  const r = await fetch('https://oauth2.googleapis.com/token', {method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({client_id: E.GOOGLE_CLIENT_ID, client_secret: E.GOOGLE_CLIENT_SECRET, refresh_token: E.GOOGLE_REFRESH_TOKEN, grant_type: 'refresh_token'})});
  const j = await r.json();
  if (!j.access_token) throw new Error('google token: ' + (j.error || r.status));
  tok = {v: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1e3};
  return tok.v;
}
async function g(url, body, method) {
  const r = await fetch(url, {method: method || (body ? 'POST' : 'GET'), headers: {Authorization: 'Bearer ' + await gtoken(), 'Content-Type': 'application/json'}, body: body ? JSON.stringify(body) : undefined});
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`google ${r.status}: ${JSON.stringify(j.error || j).slice(0, 300)}`);
  return j;
}
const CAL = () => encodeURIComponent(E.CALENDAR_ID || 'primary');
export async function freeBusy(timeMin, timeMax) {
  if (viaGas()) return (await gas('busy', {timeMin, timeMax})).busy.map(([s, e]) => [Date.parse(s), Date.parse(e)]);
  const j = await g('https://www.googleapis.com/calendar/v3/freeBusy', {timeMin, timeMax, timeZone: TZ, items: [{id: E.CALENDAR_ID || 'primary'}]});
  const cal = Object.values(j.calendars || {})[0] || {};
  return (cal.busy || []).map(b => [Date.parse(b.start), Date.parse(b.end)]);
}
export async function createEvent(L, start) {
  const end = start + RULES.min * 60e3;
  const desc = [`Simulação da Inferis (30 min) com ${L.nome} (${L.empresa}).`, '', `Área: ${L.areaTxt}`, L.regime ? `Regime: ${L.regime}` : '', L.fat ? `Faturamento: ${L.fat}` : '',
    L.clientes ? `Clientes do escritório: ${L.clientes}` : '', `WhatsApp: ${L.whats}`, `E-mail: ${L.email}`, '',
    'Traga as notas de um fornecedor: XML de NF-e, NFS-e ou CT-e, ou planilha CSV ou Excel.', `Antes da simulação: ${SITE}/preparo-da-simulacao/`].filter(x => x !== '').join('\n');
  const equipe = notifyList().filter(e => e !== L.email).map(email => ({email}));
  const resource = {
    summary: `Simulação Inferis · ${L.empresa}`, description: desc + `\n\nWhatsApp do lead: ${waLead(L)}`,
    start: {dateTime: new Date(start).toISOString(), timeZone: TZ}, end: {dateTime: new Date(end).toISOString(), timeZone: TZ},
    attendees: [{email: L.email, displayName: L.nome}, ...equipe],
    guestsCanSeeOtherGuests: false, guestsCanInviteOthers: false,
    conferenceData: {createRequest: {requestId: 'inf-' + start + '-' + Math.random().toString(36).slice(2, 8), conferenceSolutionKey: {type: 'hangoutsMeet'}}},
    reminders: {useDefault: false, overrides: [{method: 'popup', minutes: 30}]},
  };
  if (viaGas()) return gas('event', {resource}); // {slot:true} se o horario foi ocupado no meio do caminho
  const ev = await g(`https://www.googleapis.com/calendar/v3/calendars/${CAL()}/events?conferenceDataVersion=1&sendUpdates=all`, resource);
  return {id: ev.id, meet: ev.hangoutLink || '', link: ev.htmlLink || ''};
}
export async function sheetAppend(row) {
  if (viaGas()) return gas('row', {row});
  if (!viaOauth() || !E.SHEET_ID) return;
  const tab = encodeURIComponent((E.SHEET_TAB || 'Leads') + '!A1');
  await g(`https://sheets.googleapis.com/v4/spreadsheets/${E.SHEET_ID}/values/${tab}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {values: [row]});
}

// ---------- equipe Inferis: quem recebe o convite de cada simulação e o aviso de novo agendamento ----------
export const notifyList = () => (E.NOTIFY_TO || 'ggh@ghbp.com.br').split(',').map(s => s.trim().toLowerCase()).filter(okEmail);
export const waLead = L => 'https://wa.me/55' + String(L.whats).replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
// Aviso interno: pelo Resend quando estiver configurado; antes disso, pelo Gmail da inferisgeral (Apps Script).
export async function notify({subject, html, replyTo}) {
  const to = notifyList();
  let falhou = to;
  if (hasMail()) { // se o Resend recusar (chave errada, domínio pendente), o aviso cai no Gmail da inferisgeral
    const ids = await Promise.all(to.map(t => mail({to: t, subject, html, replyTo})));
    falhou = to.filter((t, i) => !ids[i]);
  }
  if (falhou.length && viaGas()) return gas('notify', {to: falhou.join(','), subject, html, replyTo}).catch(e => console.error('notify', e.message));
}

// ---------- Resend ----------
export async function mail({to, subject, html, at, replyTo}) {
  if (!hasMail()) return null;
  const body = {from: E.RESEND_FROM || 'Inferis <agenda@inferis.com.br>', to: [to], subject, html, reply_to: replyTo || E.REPLY_TO || 'inferisgeral@gmail.com'};
  if (at) body.scheduled_at = new Date(at).toISOString();
  const r = await fetch('https://api.resend.com/emails', {method: 'POST', headers: {Authorization: 'Bearer ' + E.RESEND_API_KEY, 'Content-Type': 'application/json'}, body: JSON.stringify(body)});
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { console.error('resend', r.status, JSON.stringify(j).slice(0, 300)); return null; }
  return j.id || null;
}
export async function cancelMail(id) {
  if (!hasMail() || !/^[\w-]{8,64}$/.test(String(id))) return;
  await fetch(`https://api.resend.com/emails/${id}/cancel`, {method: 'POST', headers: {Authorization: 'Bearer ' + E.RESEND_API_KEY}}).catch(() => {});
}

// ---------- lead ----------
export const AREA_TXT = {compras: 'Compras e Suprimentos', financeiro: 'Financeiro e Pricing', fiscal: 'Fiscal e Contábil', diretoria: 'Diretoria ou sócio',
  contabilidade: 'Escritório de contabilidade', advocacia: 'Escritório de advocacia', outra: 'Outra área'};
export function readLead(b = {}) {
  const L = {email: clean(b.email, 120).toLowerCase(), area: clean(b.area, 20), regime: clean(b.regime, 30), fat: clean(b.fat, 40), clientes: clean(b.clientes, 20),
    nome: clean(b.nome, 80), empresa: clean(b.empresa, 100), whats: clean(b.whats, 20), page: clean(b.page, 40),
    abandon: Array.isArray(b.abandon) ? b.abandon.slice(0, 6).map(x => clean(x, 64)) : [], attr: b.attr && typeof b.attr === 'object' ? b.attr : {},
    opiniao: clean(b.opiniao, 20), comentario: clean(b.comentario, 600),
    // Meta: cookies do Pixel e id do evento (o mesmo no navegador e no servidor, para o Meta nao contar duas vezes)
    fbp: clean(b.fbp, 120), fbc: clean(b.fbc, 200), eid: clean(b.eid, 64), url: clean(b.url, 300)};
  L.areaTxt = AREA_TXT[L.area] || L.area;
  L.trial = L.regime === 'Simples Nacional' || L.clientes === '1 a 10';
  return L;
}
export function row(stage, L, extra = {}) {
  const a = L.attr || {};
  return [new Date().toLocaleString('pt-BR', {timeZone: TZ}), stage, L.email, L.areaTxt, L.regime, L.fat, L.clientes, L.trial ? 'teste gratuito' : 'simulação',
    L.nome, L.empresa, L.whats, extra.demo || '', extra.meet || '', L.page, clean(a.landing, 80), clean(a.utm_source, 60), clean(a.utm_medium, 60), clean(a.utm_campaign, 80), clean(a.gclid || a.fbclid, 120), extra.opiniao || ''];
}
export const SHEET_HEADER = ['Quando', 'Etapa', 'E-mail', 'Área', 'Regime', 'Faturamento', 'Clientes', 'Rota', 'Nome', 'Empresa', 'WhatsApp', 'Demo', 'Meet', 'Página', 'Entrada', 'utm_source', 'utm_medium', 'utm_campaign', 'Clique (gclid/fbclid)', 'Opinião'];
