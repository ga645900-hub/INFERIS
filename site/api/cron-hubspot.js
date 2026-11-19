// GET /api/cron-hubspot -> roda 1x por dia (vercel.json "crons"). Le no HubSpot os negocios que entraram nas etapas
// "Simulação realizada" e "ganho" nas ultimas 30 h e avisa o Meta (Conversions API, action_source system_generated):
//   SimulacaoRealizada (a pessoa compareceu) e Purchase (contrato, com o valor do negocio em BRL e o plano).
// O Meta aceita eventos de ate 7 dias; o event_id fixo por negocio+etapa evita contar duas vezes.
// Protecao: a Vercel manda "Authorization: Bearer CRON_SECRET" quando a variavel CRON_SECRET existe.
import {send} from './_lib.js';
import {hasHubspot, hs, pipeline} from './_hubspot.js';
import {capi, hasMeta, userData} from './_meta.js';

const JANELA = 30 * 3600e3;

export default async function handler(req, res) {
  if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) return send(res, 401, {error: 'auth'});
  if (!hasHubspot() || !hasMeta()) return send(res, 200, {ok: true, skip: !hasHubspot() ? 'sem HUBSPOT_TOKEN' : 'sem META_PIXEL_ID/META_CAPI_TOKEN'});
  try {
    const P = await pipeline();
    const alvo = [[P.id('realizada'), 'SimulacaoRealizada'], [P.won, 'Purchase']].filter(x => x[0]);
    const desde = Date.now() - JANELA;
    const props = ['dealname', 'amount', 'dealstage', 'inf_plano', ...alvo.map(([s]) => `hs_date_entered_${s}`)];
    const deals = [];
    let after;
    do {
      const r = await hs('/crm/v3/objects/deals/search', {
        filterGroups: alvo.map(([s]) => ({filters: [{propertyName: 'pipeline', operator: 'EQ', value: P.pipeline},
          {propertyName: `hs_date_entered_${s}`, operator: 'GTE', value: String(desde)}]})),
        properties: props, limit: 100, after});
      deals.push(...(r.results || []));
      after = r.paging?.next?.after;
    } while (after && deals.length < 500);

    const evs = [];
    for (const d of deals) {
      const a = await hs(`/crm/v4/objects/deals/${d.id}/associations/contacts`);
      const cid = a.results?.[0]?.toObjectId;
      if (!cid) continue;
      const c = (await hs(`/crm/v3/objects/contacts/${cid}?properties=email,phone,firstname,lastname,inf_fbc,inf_fbp`)).properties || {};
      const user = userData({email: c.email, phone: c.phone, firstname: c.firstname, lastname: c.lastname, fbc: c.inf_fbc, fbp: c.inf_fbp});
      for (const [s, name] of alvo) {
        const t = Date.parse(d.properties[`hs_date_entered_${s}`] || '');
        if (!t || t < desde) continue;
        const custom = name === 'Purchase'
          ? {value: +d.properties.amount || 0, currency: 'BRL', content_name: d.properties.inf_plano || 'contrato'}
          : {content_name: 'simulacao'};
        evs.push({name, id: `deal-${d.id}-${name}`, time: Math.max(t, Date.now() - 6.5 * 864e5), source: 'system_generated', user, custom});
      }
    }
    for (let i = 0; i < evs.length; i += 500) await capi(evs.slice(i, i + 500));
    send(res, 200, {ok: true, negocios: deals.length, eventos: evs.length});
  } catch (e) {
    console.error('cron-hubspot', e.message);
    send(res, 502, {error: 'hubspot'});
  }
}
