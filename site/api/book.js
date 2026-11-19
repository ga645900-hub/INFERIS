// POST /api/book -> confere o horario, cria o evento com Google Meet na agenda da Inferis (o convite sai para o lead),
// registra na planilha, manda a confirmacao, agenda os lembretes (vespera e 1 h antes), cancela a retomada e avisa o Gabriel.
import {candidates, cancelMail, createEvent, freeBusy, live, mail, notify, okEmail, readLead, row, RULES, send, sheetAppend} from './_lib.js';
import {aviso, confirmacao, lembrete, quando as quandoTxt} from './_emails.js';
import {crmLead} from './_hubspot.js';
import {siteEvent} from './_meta.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, {error: 'method'});
  const b = req.body || {};
  const L = readLead(b), start = Date.parse(b.start || '');
  if (!okEmail(L.email) || L.nome.length < 2 || L.empresa.length < 2 || String(L.whats).replace(/\D/g, '').length < 10) return send(res, 400, {error: 'dados'});
  if (!candidates().includes(start)) return send(res, 409, {error: 'slot'});
  if (!live()) return send(res, 200, {ok: true, start: new Date(start).toISOString(), mock: true});
  try {
    const busy = await freeBusy(new Date(start).toISOString(), new Date(start + RULES.min * 60e3).toISOString());
    if (busy.length) return send(res, 409, {error: 'slot'});
    const ev = await createEvent(L, start);
    if (ev.slot) return send(res, 409, {error: 'slot'});
    const quando = new Date(start).toISOString();
    const tasks = [
      sheetAppend(row('agendado', L, {demo: new Date(start).toLocaleString('pt-BR', {timeZone: 'America/Sao_Paulo'}), meet: ev.meet})),
      mail({to: L.email, ...confirmacao(L, start, ev.meet)}),
      notify({...aviso(L, start, ev.meet), replyTo: L.email}),
      ...L.abandon.map(cancelMail),
      crmLead(L, 'agendada', {nota: `Simulação marcada pela LP para ${quandoTxt(start)} (horário de Brasília).${ev.meet ? `<br>Google Meet: ${ev.meet}` : ''}<br>WhatsApp: ${L.whats}`})
        .catch(e => console.error('hubspot', e.message)),
      siteEvent('Schedule', L, req).catch(e => console.error('meta', e.message)),
    ];
    const now = Date.now();
    if (start - 24 * 3600e3 > now + 2 * 3600e3) tasks.push(mail({to: L.email, ...lembrete(L, start, ev.meet, 24), at: start - 24 * 3600e3}));
    if (start - 3600e3 > now + 15 * 60e3) tasks.push(mail({to: L.email, ...lembrete(L, start, ev.meet, 1), at: start - 3600e3}));
    await Promise.allSettled(tasks);
    send(res, 200, {ok: true, start: quando, meet: ev.meet});
  } catch (e) {
    console.error('book', e.message);
    send(res, 502, {error: 'agenda'});
  }
}
