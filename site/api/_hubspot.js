// INFERIS LP · HubSpot (funil de vendas). Decisao do cliente (17/11/2026): SO leads qualificados para a simulacao entram
// no CRM; quem vai para o teste gratuito fica so na planilha. Desligado ate existir HUBSPOT_TOKEN (app privado do HubSpot).
// Etapas do negocio: criadas por tools/hubspot_setup.mjs no pipeline padrao e achadas aqui pelo nome (rotulo).
import {clean} from './_lib.js';

const E = process.env;
const API = 'https://api.hubapi.com';
export const hasHubspot = () => !!E.HUBSPOT_TOKEN;
const PIPE = () => E.HUBSPOT_PIPELINE || 'default';

// rotulos das etapas (tools/hubspot_setup.mjs cria com estes nomes; ganho/perdido sao as etapas fechadas do HubSpot)
export const ETAPAS = {
  iniciado: 'Agendamento iniciado',
  agendada: 'Simulação agendada',
  realizada: 'Simulação realizada',
  faltou: 'Não compareceu',
  proposta: 'Proposta enviada',
  negociacao: 'Negociação',
};
// ordem do funil: um negocio nunca volta de etapa por causa do site (ex.: quem ja esta em "proposta" e marca outra simulação).
// "faltou" vem antes de "agendada": quem nao compareceu e remarca pela LP volta para "Simulação agendada".
const ORDEM = ['iniciado', 'faltou', 'agendada', 'realizada', 'proposta', 'negociacao'];

export async function hs(path, body, method) {
  const r = await fetch(API + path, {method: method || (body ? 'POST' : 'GET'),
    headers: {Authorization: 'Bearer ' + E.HUBSPOT_TOKEN, 'Content-Type': 'application/json'}, body: body ? JSON.stringify(body) : undefined});
  if (r.status === 204) return {};
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`hubspot ${r.status} ${path}: ${(j.message || JSON.stringify(j)).slice(0, 300)}`);
  return j;
}

let cache = null;
export async function pipeline() {
  if (cache && cache.t > Date.now() - 10 * 60e3) return cache;
  const p = await hs(`/crm/v3/pipelines/deals/${PIPE()}`);
  const byLabel = {}, byId = {};
  for (const s of p.stages || []) { byLabel[s.label.toLowerCase()] = s; byId[s.id] = s; }
  const closed = (p.stages || []).filter(s => String(s.metadata?.isClosed) === 'true');
  const won = closed.find(s => +s.metadata?.probability === 1), lost = closed.find(s => +s.metadata?.probability === 0);
  const id = k => byLabel[ETAPAS[k].toLowerCase()]?.id;
  cache = {t: Date.now(), pipeline: p.id, id, byId, won: won?.id, lost: lost?.id};
  return cache;
}

const split = n => { const p = String(n || '').trim().split(/\s+/); return [p[0] || '', p.slice(1).join(' ')]; };
const phone = w => { const d = String(w || '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, ''); return d ? '+55' + d : ''; };
const origem = a => [a.utm_source, a.utm_medium, a.utm_campaign, a.utm_content].filter(Boolean).map(x => clean(x, 60)).join(' / ') || clean(a.landing || '', 80);

// propriedades personalizadas (criadas pelo setup; o plano gratuito permite 10 no total, usamos 8)
function contactProps(L) {
  const [firstname, lastname] = split(L.nome);
  const a = L.attr || {};
  const p = {email: L.email, firstname, lastname, phone: phone(L.whats), company: L.empresa,
    inf_area: L.areaTxt, inf_regime: L.regime, inf_faturamento: L.fat, inf_clientes: L.clientes,
    inf_origem: origem(a), inf_fbc: L.fbc || (a.fbclid ? `fb.1.${a.ts || Date.now()}.${clean(a.fbclid, 120)}` : ''), inf_fbp: L.fbp};
  for (const k of Object.keys(p)) if (!p[k]) delete p[k];
  return p;
}

// cartao do funil (19/11/2026): o nome do negocio mostra a pessoa e a empresa, e a descricao do negocio
// traz as respostas do formulario da LP (para ler direto no negocio, sem abrir o contato).
const dealName = L => [L.nome, L.empresa].filter(Boolean).join(' · ');
function dealResumo(L) {
  const a = L.attr || {};
  return [
    L.areaTxt && `Área: ${L.areaTxt}`,
    L.regime && `Regime tributário: ${L.regime}`,
    L.fat && `Faturamento anual: ${L.fat}`,
    L.clientes && `Empresas atendidas pelo escritório: ${L.clientes}`,
    L.whats && `WhatsApp: ${L.whats}`,
    L.email && `E-mail: ${L.email}`,
    L.page && `Página do formulário: ${L.page}`,
    `Origem: ${origem(a) || 'direto'}`,
  ].filter(Boolean).join('\n');
}

async function upsertContact(L) {
  const j = await hs('/crm/v3/objects/contacts/batch/upsert', {inputs: [{idProperty: 'email', id: L.email, properties: contactProps(L)}]});
  return j.results[0].id;
}
async function company(nome) {
  if (!nome) return null;
  const s = await hs('/crm/v3/objects/companies/search', {filterGroups: [{filters: [{propertyName: 'name', operator: 'EQ', value: nome}]}], properties: ['name'], limit: 1});
  if (s.results?.length) return s.results[0].id;
  return (await hs('/crm/v3/objects/companies', {properties: {name: nome}})).id;
}
const assoc = (from, fid, to, tid) => hs(`/crm/v4/objects/${from}/${fid}/associations/default/${to}/${tid}`, undefined, 'PUT');

// negocio aberto deste contato no pipeline (se houver)
async function openDeal(contactId, P) {
  const a = await hs(`/crm/v4/objects/contacts/${contactId}/associations/deals`);
  const ids = (a.results || []).map(x => ({id: String(x.toObjectId)}));
  if (!ids.length) return null;
  const d = await hs('/crm/v3/objects/deals/batch/read', {inputs: ids, properties: ['pipeline', 'dealstage', 'dealname']});
  return (d.results || []).find(x => x.properties.pipeline === P.pipeline && !(x.properties.dealstage === P.won || x.properties.dealstage === P.lost)) || null;
}

/** Registra o lead qualificado no HubSpot. etapa: 'iniciado' (deixou nome e WhatsApp) ou 'agendada' (marcou horario). */
export async function crmLead(L, etapa, extra = {}) {
  if (!hasHubspot() || !L.email || !L.empresa) return null;
  const P = await pipeline();
  const stage = P.id(etapa);
  if (!stage) throw new Error(`hubspot: etapa "${ETAPAS[etapa]}" nao existe no pipeline (rode tools/hubspot_setup.mjs)`);
  const contactId = await upsertContact(L);
  const [companyId, deal] = await Promise.all([company(L.empresa), openDeal(contactId, P)]);
  let dealId = deal?.id;
  const info = {dealname: dealName(L), description: dealResumo(L)};
  if (!dealId) {
    dealId = (await hs('/crm/v3/objects/deals', {properties: {...info, pipeline: P.pipeline, dealstage: stage}})).id;
    await assoc('deals', dealId, 'contacts', contactId);
  } else {
    const atual = ORDEM.findIndex(k => P.id(k) === deal.properties.dealstage);
    await hs(`/crm/v3/objects/deals/${dealId}`, {properties: atual < ORDEM.indexOf(etapa) ? {...info, dealstage: stage} : info}, 'PATCH');
  }
  if (companyId) await Promise.allSettled([assoc('contacts', contactId, 'companies', companyId), assoc('deals', dealId, 'companies', companyId)]);
  if (extra.nota) {
    const n = await hs('/crm/v3/objects/notes', {properties: {hs_timestamp: new Date().toISOString(), hs_note_body: extra.nota}});
    await Promise.allSettled([assoc('notes', n.id, 'contacts', contactId), assoc('notes', n.id, 'deals', dealId)]);
  }
  return {contactId, dealId};
}
