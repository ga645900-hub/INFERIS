// INFERIS LP: e-mails do funil (Resend). Layout escuro do padrao high-ticket, em tabelas para os clientes de e-mail.
import {SITE, TZ} from './_lib.js';

const fLong = new Intl.DateTimeFormat('pt-BR', {timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long'});
const fHM = new Intl.DateTimeFormat('pt-BR', {timeZone: TZ, hour: '2-digit', minute: '2-digit'});
export const quando = t => `${fLong.format(new Date(t))}, às ${fHM.format(new Date(t))}`;
const h = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const first = n => h(String(n || '').split(' ')[0]);

const RODAPE_TESTE = `Inferis · Inteligência para a Reforma Tributária · Você recebeu este e-mail porque escolheu o teste gratuito em ${SITE.replace('https://', '')}. Para não receber mais, responda com "sair".`;
function layout(pre, body, interno) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"></head>
<body style="margin:0;padding:0;background:#05040E;">
<div style="display:none;max-height:0;overflow:hidden;color:#05040E">${h(pre)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#05040E;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0B0920;border:1px solid #2A2350;border-radius:18px;">
<tr><td style="padding:28px 32px 8px;"><img src="${SITE}/assets/img/inferis-landing-wordmark.png" alt="Inferis" height="26" style="display:block;height:26px;border:0;"></td></tr>
<tr><td style="padding:16px 32px 32px;font-family:Inter,Segoe UI,Arial,sans-serif;font-size:16px;line-height:1.6;color:#D9D4F2;">${body}</td></tr>
</table>
<p style="font-family:Arial,sans-serif;font-size:12px;line-height:1.5;color:#8F89B3;max-width:560px;margin:18px auto 0;">${interno === 'teste' ? RODAPE_TESTE : interno
  ? `Aviso interno da LP ${SITE.replace('https://', '')}. Responder este e-mail responde ao lead.`
  : `Inferis · Inteligência para a Reforma Tributária · Você recebeu este e-mail porque pediu uma simulação em ${SITE.replace('https://', '')}. Para não receber mais, responda com "sair".`}</p>
</td></tr></table></body></html>`;
}
const k = t => `<p style="margin:0 0 10px;font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:#C9BBFF;">${t}</p>`;
const h1 = t => `<h1 style="margin:0 0 18px;font-size:28px;line-height:1.15;font-weight:300;color:#F4F2FF;letter-spacing:-.02em;">${t}</h1>`;
const btn = (url, t) => `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;"><tr><td style="border-radius:999px;background:#7C5CFF;"><a href="${url}" style="display:inline-block;padding:14px 26px;font-family:Inter,Arial,sans-serif;font-size:15px;color:#FFFFFF;text-decoration:none;border-radius:999px;">${t}</a></td></tr></table>`;
const box = t => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;"><tr><td style="padding:16px 20px;border:1px solid #3A3170;border-radius:12px;background:#120E2E;color:#F4F2FF;font-size:16px;">${t}</td></tr></table>`;
const LEVAR = `<ol style="margin:8px 0 0;padding-left:20px;color:#D9D4F2;">
<li style="margin-bottom:8px">As notas de um fornecedor: XML de NF-e, NFS-e ou CT-e, ou uma planilha em CSV ou Excel. Processamos o lote em menos de 1 minuto.</li>
<li style="margin-bottom:8px">O regime da empresa (lucro real ou presumido) e, se souber, o do fornecedor.</li>
<li>Quem decide: compras, financeiro ou fiscal.</li></ol>`;

export function confirmacao(L, t, meet) {
  return {subject: `Simulação da Inferis confirmada: ${quando(t)}`, html: layout(`Sua simulação com o Gabriel: ${quando(t)}.`,
    k('Simulação agendada') + h1(`${first(L.nome)}, sua simulação está marcada.`)
    + box(`<b style="font-weight:600">${h(quando(t))}</b><br><span style="color:#B5AFD6">Horário de Brasília · 30 minutos · Google Meet</span>${meet ? `<br><a href="${meet}" style="color:#E4DCFF">${h(meet)}</a>` : ''}`)
    + `<p style="margin:0">O convite já está na sua agenda. O Gabriel vai te chamar no WhatsApp para confirmar: responda por lá.</p>`
    + `<p style="margin:22px 0 0;color:#F4F2FF">Para aproveitar os 30 minutos, leve:</p>${LEVAR}`
    + btn(`${SITE}/preparo-da-simulacao/?start=${encodeURIComponent(new Date(t).toISOString())}`, 'Veja como funciona a simulação')
    + `<p style="margin:16px 0 0;font-size:14px;color:#8F89B3">Precisa remarcar? Responda este e-mail.</p>`)};
}
export function lembrete(L, t, meet, horas) {
  const amanha = horas >= 20;
  return {subject: amanha ? `Amanhã às ${fHM.format(new Date(t))}: sua simulação da Inferis` : `Começamos em 1 hora: simulação da Inferis`,
    html: layout(amanha ? 'Sua simulação é amanhã.' : 'Sua simulação começa em 1 hora.',
      k(amanha ? 'Amanhã' : 'Em 1 hora') + h1(amanha ? `${first(L.nome)}, sua simulação é amanhã.` : `${first(L.nome)}, começamos em 1 hora.`)
      + box(`<b style="font-weight:600">${h(quando(t))}</b><br><span style="color:#B5AFD6">Horário de Brasília · 30 minutos</span>`)
      + (meet ? btn(meet, 'Entrar no Google Meet') : '')
      + `<p style="margin:8px 0 0">Separe as notas de um fornecedor (XML, CSV ou Excel). Na simulação, o lote fica pronto em menos de 1 minuto e você sai com os números de 2027.</p>`
      + `<p style="margin:16px 0 0;font-size:14px;color:#8F89B3">Não vai conseguir? Responda este e-mail e o Gabriel propõe outro horário.</p>`)};
}
export function abandono(email, n) {
  const url = `${SITE}/agendar/?email=${encodeURIComponent(email)}&utm_source=email&utm_medium=abandono&utm_campaign=demo${n}`;
  const dias = Math.ceil((Date.parse('2027-01-01T00:00:00-03:00') - Date.now()) / 864e5);
  if (n === 1) return {subject: 'Falta só escolher o horário da sua simulação', html: layout('Sua simulação da Inferis ficou pela metade.',
    k('Simulação da Inferis') + h1('Falta só escolher o horário.')
    + `<p style="margin:0">Você começou a agendar a simulação da Inferis e não chegou ao fim. São 30 minutos com o Gabriel, com as notas de um fornecedor seu: o custo de cada compra em 2027, o crédito de CBS e IBS e o preço para negociar.</p>`
    + btn(url, 'Escolher o horário'))};
  return {subject: dias > 1 ? `Faltam ${dias} dias para a CBS integral` : 'A CBS integral começa agora', html: layout('O que muda nas suas notas em 2027.',
    k('Reforma Tributária') + h1(dias > 1 ? `Faltam ${dias} dias para 2027.` : 'A CBS integral começa agora.')
    + `<p style="margin:0">Em 1º de janeiro de 2027 a CBS entra integral, o PIS e a COFINS deixam de existir e o IPI é zerado. Quem compra passa a ter crédito amplo, e o preço de cada nota precisa ser recalculado.</p>`
    + `<p style="margin:16px 0 0">Na simulação, processamos o lote de um fornecedor seu em menos de 1 minuto. Você sai com o custo efetivo de 2027 e o preço para negociar.</p>`
    + btn(url, 'Agendar a simulação'))};
}
export function aviso(L, t, meet) {
  const wa = 'https://wa.me/55' + String(L.whats).replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '')
    + '?text=' + encodeURIComponent(`Olá, ${String(L.nome).split(' ')[0]}! Aqui é o Gabriel, da Inferis. Confirmo a nossa simulação de ${quando(t)}. Consegue trazer as notas (XML) de um fornecedor?`);
  const linhas = [['Quando', quando(t)], ['Nome', L.nome], ['Empresa', L.empresa], ['Área', L.areaTxt], ['Regime', L.regime], ['Faturamento', L.fat], ['Clientes', L.clientes],
    ['E-mail', L.email], ['WhatsApp', L.whats], ['Página', L.page], ['Origem', [L.attr?.utm_source, L.attr?.utm_campaign].filter(Boolean).join(' / ') || L.attr?.landing || '']].filter(x => x[1]);
  return {subject: `Nova simulação: ${L.empresa} · ${quando(t)}`, html: layout(`${L.nome} (${L.empresa}) agendou uma simulação.`,
    k('Nova simulação agendada') + h1(h(L.empresa))
    + `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;font-size:15px;">${linhas.map(([a, b]) => `<tr><td style="padding:6px 12px 6px 0;color:#8F89B3;white-space:nowrap;vertical-align:top">${a}</td><td style="padding:6px 0;color:#F4F2FF">${h(b)}</td></tr>`).join('')}</table>`
    + btn(wa, 'Confirmar pelo WhatsApp') + (meet ? `<p style="margin:0;font-size:14px"><a href="${meet}" style="color:#E4DCFF">${h(meet)}</a></p>` : ''), true)};
}

// ---------- teste gratuito: lead fora do perfil da simulação (Simples Nacional ou escritório com até 10 clientes) ----------
// 1 = na hora (como começar) · 2 = +2 dias (como ler o resultado) · 3 = +4 dias (o que você achou?)
const APP = 'https://inferis.com.br';
export const OPINIOES = {gostei: 'Gostei e vou continuar usando', duvidas: 'Gostei, mas fiquei com dúvidas', travou: 'Não consegui usar', nao: 'Não era o que eu procurava'};
const passos = itens => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 4px;">${itens.map(([t, d], i) =>
  `<tr><td style="padding:14px 14px 14px 0;border-top:1px solid #2A2350;vertical-align:top;width:34px;font-size:14px;color:#C9BBFF;letter-spacing:.1em">${String(i + 1).padStart(2, '0')}</td>`
  + `<td style="padding:14px 0;border-top:1px solid #2A2350;"><b style="font-weight:600;color:#F4F2FF">${t}</b><br><span style="color:#B5AFD6">${d}</span></td></tr>`).join('')}</table>`;
export function teste(L, n) {
  const e = encodeURIComponent(L.email), utm = c => `utm_source=email&utm_medium=teste&utm_campaign=${c}`;
  const nome = L.nome ? `${first(L.nome)}, ` : '';
  if (n === 1) return {subject: 'Seu teste grátis da Inferis: por onde começar', html: layout('Três passos para ver as suas notas em 2027.',
    k('Teste gratuito') + h1(`${nome ? nome.replace(/, $/, ', c') : 'C'}omece pelas notas <span style="font-weight:600;color:#E4DCFF">de um fornecedor.</span>`)
    + `<p style="margin:0">O teste gratuito inclui 1 análise no Simulador da Reforma e 10 linhas no módulo Valor Líquido, sem cartão de crédito. Para aproveitar:</p>`
    + passos([['Crie a sua conta', 'Em inferis.com.br, com este e-mail. Leva 2 minutos.'],
      ['Suba as notas de um fornecedor', 'XML de NF-e, NFS-e ou CT-e, ou uma planilha em CSV ou Excel. O conversor valida os dados antes da análise.'],
      ['Veja a mesma compra em 2027', 'O custo efetivo de cada nota e o preço equivalente: até onde o preço do fornecedor pode ir sem o seu custo subir.']])
    + btn(`${APP}/cadastro?email=${e}&${utm('teste1')}`, 'Criar minha conta grátis')
    + `<p style="margin:16px 0 0;font-size:14px;color:#8F89B3">Já criou a conta? <a href="${APP}/entrar?${utm('teste1')}" style="color:#E4DCFF">Entre aqui</a>. Ficou com dúvida? Responda este e-mail.</p>`, 'teste')};
  if (n === 2) return {subject: 'O que olhar primeiro no resultado da Inferis', html: layout('Dois números decidem a negociação de 2027.',
    k('Teste gratuito') + h1('O que olhar primeiro <span style="font-weight:600;color:#E4DCFF">no resultado.</span>')
    + `<p style="margin:0">Depois de subir as notas de um fornecedor, comece por estes dois números:</p>`
    + passos([['Custo efetivo de 2027', 'Quanto a compra custa para a sua empresa em 2027, com CBS, IBS e os tributos que continuam. Compare com o custo de hoje, na mesma tela.'],
      ['Preço equivalente', 'O valor até onde o fornecedor pode ir sem que o seu custo suba. Acima dele, você paga a diferença. É o número para levar à negociação.']])
    + `<p style="margin:18px 0 0">Ainda não subiu nenhuma nota? Separe os XMLs de compras recentes de um fornecedor: o lote fica pronto em menos de 1 minuto.</p>`
    + btn(`${APP}/entrar?${utm('teste2')}`, 'Entrar na Inferis'), 'teste')};
  const op = Object.entries(OPINIOES).map(([r, t]) => `<tr><td style="padding:0 0 10px;"><a href="${SITE}/sua-opiniao/?r=${r}&e=${e}&${utm('opiniao')}" style="display:block;padding:14px 18px;border:1px solid #3A3170;border-radius:12px;background:#120E2E;color:#F4F2FF;text-decoration:none;font-size:15px;">${t}</a></td></tr>`).join('');
  return {subject: 'O que você achou da Inferis?', html: layout('Uma pergunta, 10 segundos.',
    k('Teste gratuito') + h1(`${nome ? nome.replace(/, $/, ', o') : 'O'} que você achou <span style="font-weight:600;color:#E4DCFF">da Inferis?</span>`)
    + `<p style="margin:0 0 20px">Escolha a resposta que mais combina com o seu teste. Ela vai direto para o time e decide o que melhoramos primeiro.</p>`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${op}</table>`
    + `<p style="margin:10px 0 0;font-size:14px;color:#8F89B3">Prefere escrever? Responda este e-mail: quem lê é o Gabriel.</p>`, 'teste')};
}
export function opiniaoAviso(L, r, comentario) {
  return {subject: `Opinião do teste: ${OPINIOES[r] || r} · ${L.email}`, html: layout(`${L.email}: ${OPINIOES[r] || r}`,
    k('Opinião do teste gratuito') + h1(h(OPINIOES[r] || r))
    + box(`<span style="color:#B5AFD6">E-mail</span><br>${h(L.email)}${comentario ? `<br><br><span style="color:#B5AFD6">Comentário</span><br>${h(comentario)}` : ''}`)
    + `<p style="margin:0;font-size:14px;color:#8F89B3">Responder este e-mail responde ao lead.</p>`, true)};
}
