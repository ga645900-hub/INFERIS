// POST /api/lead -> registra cada etapa do formulario na planilha.
// Etapa "email": agenda 2 e-mails de retomada (+3 h e +2 dias), cancelados quando a simulação e marcada.
// Etapa "trial": o lead foi para o teste gratuito; cancela a retomada e agenda a sequencia do teste
//   (agora: como começar · +2 dias: o que olhar no resultado · +4 dias: o que você achou?).
//   Os ids voltam para o navegador: se a pessoa agendar uma simulação depois, /api/book cancela a sequencia.
// Etapa "qualificado": evento Lead no Meta (so quem e publico da simulação). Etapa "contato": entra no HubSpot
//   (contato + empresa + negocio em "Agendamento iniciado"). Etapa "trial": evento TesteGratis no Meta (so para medir).
// Etapa "opiniao": resposta da pagina /sua-opiniao/ (vinda do 3o e-mail); vai para a planilha e para a equipe.
import {cancelMail, clean, live, mail, notify, okEmail, readLead, row, send, sheetAppend} from './_lib.js';
import {abandono, OPINIOES, opiniaoAviso, teste} from './_emails.js';
import {crmLead} from './_hubspot.js';
import {siteEvent} from './_meta.js';

const safe = (tag, p) => Promise.resolve(p).catch(e => console.error(tag, e.message));

const DIA = 864e5;

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, {error: 'method'});
  const b = req.body || {};
  const L = readLead(b), stage = clean(b.stage, 20);
  if (!okEmail(L.email) || !['email', 'trial', 'qualificado', 'contato', 'opiniao'].includes(stage)) return send(res, 400, {error: 'dados'});
  if (stage === 'opiniao' && !OPINIOES[L.opiniao]) return send(res, 400, {error: 'dados'});
  const out = {ok: true, mock: !live()};
  try {
    if (stage === 'opiniao') {
      await Promise.allSettled([
        sheetAppend(row('opiniao', L, {opiniao: OPINIOES[L.opiniao] + (L.comentario ? ' · ' + L.comentario : '')})),
        notify({...opiniaoAviso(L, L.opiniao, L.comentario), replyTo: L.email}),
      ]);
      return send(res, 200, out);
    }
    const extras = [];
    if (stage === 'qualificado') extras.push(safe('meta', siteEvent('Lead', L, req)));
    if (stage === 'contato') extras.push(safe('hubspot', crmLead(L, 'iniciado')));
    if (stage === 'trial') extras.push(safe('meta', siteEvent('TesteGratis', L, req)));
    await sheetAppend(row(stage, L));
    const now = Date.now();
    if (stage === 'email' && !L.abandon.length) {
      const ids = await Promise.all([[1, now + 3 * 3600e3], [2, now + 2 * DIA]].map(([n, at]) => mail({to: L.email, ...abandono(L.email, n), at})));
      out.abandon = ids.filter(Boolean);
    }
    if (stage === 'trial') {
      await Promise.all(L.abandon.map(cancelMail));
      const ids = await Promise.all([[1, 0], [2, now + 2 * DIA], [3, now + 4 * DIA]].map(([n, at]) => mail({to: L.email, ...teste(L, n), at: at || undefined})));
      out.abandon = ids.filter(Boolean);
    }
    await Promise.all(extras);
  } catch (e) { console.error('lead', e.message); }
  send(res, 200, out);
}
