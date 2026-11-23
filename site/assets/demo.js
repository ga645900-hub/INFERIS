// INFERIS: funil "Agendar simulação" (modelo Hyros).
// Todo link [data-demo] abre um pop-up sobre a pagina com o formulario em etapas:
// e-mail -> area -> perfil (regime/faturamento ou n. de clientes) -> rota.
// Rota (decisao do cliente, 17/11/2026): Simples Nacional ou escritorio com ate 10 clientes -> teste gratuito;
// os demais -> contato -> agenda (seg a sex, 14h-19h, 30 min, horario de Brasilia) -> /obrigado/.
// Sem API (abrindo local), o fluxo roda em modo de teste: horarios simulados e nada e enviado.
(function () {
  'use strict';
  const ROOT = document.body.dataset.root || '';
  const PAGE = document.body.dataset.page || '';
  const TRIAL_URL = 'https://inferis.com.br/cadastro';
  const WA = 'https://wa.me/5519998155239';
  const TZ = 'America/Sao_Paulo';
  const qs = new URLSearchParams(location.search);
  const LOCAL = !/^https?:$/.test(location.protocol) || /^(localhost|127\.|192\.168\.)/.test(location.hostname);
  const MOCK = LOCAL || qs.has('mock');

  const ev = (event, data) => { try { (window.dataLayer = window.dataLayer || []).push(Object.assign({event}, data || {})); } catch (e) {} };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const ss = {
    get(k) { try { return JSON.parse(sessionStorage.getItem(k) || 'null'); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };

  // ---------- origem do lead (primeira pagina, UTMs, gclid/fbclid) ----------
  const attr = ss.get('inf_attr') || {};
  if (!attr.landing) {
    attr.landing = location.pathname; attr.ref = document.referrer.slice(0, 200); attr.ts = Date.now();
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'].forEach(k => { if (qs.get(k)) attr[k] = qs.get(k).slice(0, 120); });
    ss.set('inf_attr', attr);
  }

  // ---------- barra de prazo: dias ate 1/1/2027 ----------
  document.querySelectorAll('[data-dias]').forEach(el => {
    const d = Math.ceil((Date.parse('2027-01-01T00:00:00-03:00') - Date.now()) / 864e5);
    if (d > 1) el.textContent = `Faltam ${d} dias: em 1º de janeiro de 2027`;
  });

  // ---------- Meta: Pixel (so quando o ID existir) + dados para a Conversions API ----------
  // O mesmo evento sai do navegador (Pixel) e do servidor (/api) com o mesmo eventID: o Meta conta uma vez so.
  const PIXEL = document.body.dataset.pixel || '';
  if (PIXEL && !MOCK) {
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
    s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    fbq('init', PIXEL); fbq('track', 'PageView');
  }
  const cookie = k => (document.cookie.match('(?:^|; )' + k + '=([^;]*)') || [])[1] || '';
  const metaIds = () => {
    const fbc = cookie('_fbc') || (attr.fbclid ? `fb.1.${attr.ts || Date.now()}.${attr.fbclid}` : '');
    return {fbp: cookie('_fbp'), fbc, url: location.origin + location.pathname, eid: Math.random().toString(36).slice(2, 10) + Date.now().toString(36)};
  };
  const pixel = (name, eid, custom) => { try { if (window.fbq && PIXEL) fbq(['Lead', 'Schedule'].includes(name) ? 'track' : 'trackCustom', name, custom || {}, {eventID: `${name}-${eid}`}); } catch (e) {} };

  // ---------- perguntas ----------
  const AREAS = [['compras', 'Compras e Suprimentos'], ['financeiro', 'Financeiro e Pricing'], ['fiscal', 'Fiscal e Contábil'],
    ['diretoria', 'Diretoria ou sócio'], ['contabilidade', 'Escritório de contabilidade'], ['advocacia', 'Escritório de advocacia'], ['outra', 'Outra área']];
  const REGIMES = ['Lucro Real', 'Lucro Presumido', 'Simples Nacional', 'Não sei'];
  const FATS = ['Até R$ 4,8 milhões', 'R$ 4,8 a 50 milhões', 'R$ 50 a 300 milhões', 'Acima de R$ 300 milhões'];
  const CLIENTES = ['1 a 10', '11 a 30', '31 a 100', 'Mais de 100'];
  const PAGE_AREA = {compras: 'compras', 'financeiro-pricing': 'financeiro', 'fiscal-contabil': 'fiscal', contadores: 'contabilidade', advogados: 'advocacia'};
  const escritorio = a => a === 'contabilidade' || a === 'advocacia';
  const isTrial = s => s.regime === 'Simples Nacional' || s.clientes === '1 a 10';

  // ---------- API (com modo de teste) ----------
  async function api(path, body) {
    if (MOCK) return mockApi(path, body);
    const r = await fetch('/api/' + path, body ? {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body), keepalive: path === 'lead'} : {});
    const j = await r.json().catch(() => ({}));
    if (!r.ok && !j.error) throw new Error('api ' + r.status);
    return j;
  }
  function mockSlots() {  // mesmas regras do servidor: seg a sex, 14h-18h30, 3h de antecedencia, 14 dias
    const days = [], now = Date.now();
    for (let i = 0; i < 15 && days.length < 10; i++) {
      const d = new Date(now - 3 * 3600e3 + i * 864e5), y = d.getUTCFullYear(), m = d.getUTCMonth(), dd = d.getUTCDate();
      const wd = new Date(Date.UTC(y, m, dd)).getUTCDay(); if (wd === 0 || wd === 6) continue;
      const slots = [];
      for (let min = 14 * 60; min + 30 <= 19 * 60; min += 30) {
        const t = Date.UTC(y, m, dd, Math.floor(min / 60) + 3, min % 60);
        if (t > now + 3 * 3600e3 && Math.random() > .25) slots.push(new Date(t).toISOString());
      }
      if (slots.length) days.push({date: `${y}-${String(m + 1).padStart(2, '0')}-${String(dd).padStart(2, '0')}`, slots});
    }
    return days;
  }
  async function mockApi(path, body) {
    await new Promise(r => setTimeout(r, 450));
    if (path === 'slots') return {days: mockSlots(), mock: true};
    if (path === 'book') return {ok: true, start: body.start, mock: true};
    return {ok: true, mock: true};
  }

  // ---------- formatos ----------
  const fDay = new Intl.DateTimeFormat('pt-BR', {timeZone: TZ, weekday: 'short'});
  const fDM = new Intl.DateTimeFormat('pt-BR', {timeZone: TZ, day: '2-digit', month: '2-digit'});
  const fHM = new Intl.DateTimeFormat('pt-BR', {timeZone: TZ, hour: '2-digit', minute: '2-digit'});
  const fLong = new Intl.DateTimeFormat('pt-BR', {timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long'});
  const dayLabel = iso => { const d = new Date(iso); return [fDay.format(d).replace('.', ''), fDM.format(d)]; };
  const maskWa = v => {
    let d = v.replace(/\D/g, ''); if (d.startsWith('55') && d.length > 11) d = d.slice(2); d = d.slice(0, 11);
    if (d.length <= 2) return d.length ? `(${d}` : '';
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };

  // ---------- o formulario (serve ao pop-up e a pagina /agendar/) ----------
  function Flow(host, opts) {
    const st = Object.assign({area: PAGE_AREA[PAGE] || ''}, ss.get('inf_lead') || {}, opts.prefill || {});
    let days = null, day = 0, slot = null;
    if (qs.has('forcar')) st.forcar = true;  // vindo de /teste-gratis/: quer a simulação mesmo assim
    const save = () => ss.set('inf_lead', {email: st.email, area: st.area, regime: st.regime, fat: st.fat, clientes: st.clientes, nome: st.nome, empresa: st.empresa, whats: st.whats, abandon: st.abandon, trialSent: st.trialSent, forcar: st.forcar});
    const total = 4;
    const head = (n, q, sub) => `<p class="dm-step">Passo ${n} de ${total}</p><h3 class="dm-q">${q}</h3>${sub ? `<p class="dm-sub">${sub}</p>` : ''}`;
    const opts2 = (name, list, cur) => `<div class="dm-opts" role="radiogroup">${list.map(o => {
      const [v, t] = Array.isArray(o) ? o : [o, o];
      return `<button type="button" role="radio" aria-checked="${v === cur}" data-${name}="${esc(v)}">${esc(t)}</button>`;
    }).join('')}</div>`;

    const screens = {
      email() {
        return `<form class="dm-f" data-f="email" novalidate>${head(1, 'Qual é o seu e-mail profissional?', 'É para onde mandamos o convite da simulação.')}
          <input class="dm-in" type="email" name="email" autocomplete="email" inputmode="email" placeholder="voce@empresa.com.br" value="${esc(st.email || '')}" required maxlength="120" aria-label="E-mail profissional">
          <p class="dm-err" hidden>Confira o e-mail.</p>
          <button class="btn dm-go" type="submit">Continuar <span aria-hidden="true">→</span></button></form>`;
      },
      area() {
        return `<div class="dm-f">${head(2, 'Qual é a sua área?')}${opts2('area', AREAS, st.area)}${back()}</div>`;
      },
      perfil() {
        if (escritorio(st.area)) return `<div class="dm-f">${head(3, 'Quantas empresas o escritório atende?')}${opts2('clientes', CLIENTES, st.clientes)}${back()}</div>`;
        const fat = st.regime && st.regime !== 'Simples Nacional'
          ? `<p class="dm-lab">Faturamento anual da empresa</p>${opts2('fat', FATS, st.fat)}<button class="btn dm-go" type="button" data-go="perfil"${st.fat ? '' : ' disabled'}>Continuar <span aria-hidden="true">→</span></button>` : '';
        return `<div class="dm-f">${head(3, 'Sobre a empresa')}<p class="dm-lab">Regime tributário</p>${opts2('regime', REGIMES, st.regime)}${fat}${back()}</div>`;
      },
      trial() {  // tela de passagem: o lead vai para a pagina /teste-gratis/
        return `<div class="dm-f dm-trial"><p class="dm-step">Para o seu perfil</p><h3 class="dm-q">Comece pelo <strong>teste gratuito.</strong></h3>
          <p class="dm-load">Abrindo o teste gratuito…</p></div>`;
      },
      contato() {
        return `<form class="dm-f" data-f="contato" novalidate>${head(4, 'Para quem é a simulação?', 'A equipe da Inferis confirma pelo WhatsApp.')}
          <input class="dm-in" name="nome" autocomplete="name" placeholder="Seu nome" value="${esc(st.nome || '')}" required maxlength="80" aria-label="Seu nome">
          <input class="dm-in" name="empresa" autocomplete="organization" placeholder="${escritorio(st.area) ? 'Escritório' : 'Empresa'}" value="${esc(st.empresa || '')}" required maxlength="100" aria-label="Empresa">
          <input class="dm-in" name="whats" type="tel" autocomplete="tel" inputmode="tel" placeholder="WhatsApp com DDD" value="${esc(st.whats || '')}" required maxlength="16" aria-label="WhatsApp com DDD">
          <input class="dm-hp" name="site" tabindex="-1" autocomplete="off" aria-hidden="true">
          <p class="dm-err" hidden>Preencha nome, empresa e WhatsApp com DDD.</p>
          <button class="btn dm-go" type="submit">Escolher o horário <span aria-hidden="true">→</span></button>${back()}</form>`;
      },
      agenda() {
        if (!days) return `<div class="dm-f">${head(4, 'Escolha o horário', 'Horário de Brasília · 30 minutos pelo Google Meet')}<p class="dm-load">Consultando a agenda…</p></div>`;
        if (!days.length) return `<div class="dm-f">${head(4, 'Escolha o horário')}<p class="dm-sub">A agenda das próximas duas semanas está cheia. Chame a equipe da Inferis no WhatsApp e a gente encaixa a sua simulação.</p><a class="btn dm-go" href="${waLink()}" target="_blank" rel="noopener">Falar no WhatsApp</a>${back()}</div>`;
        const tabs = days.map((d, i) => { const [w, dm] = dayLabel(d.slots[0]); return `<button type="button" class="dm-day" aria-pressed="${i === day}" data-day="${i}"><small>${w}</small><b>${dm}</b></button>`; }).join('');
        const times = days[day].slots.map(s => `<button type="button" class="dm-slot" aria-pressed="${s === slot}" data-slot="${s}">${fHM.format(new Date(s))}</button>`).join('');
        return `<div class="dm-f">${head(4, 'Escolha o horário', 'Horário de Brasília · 30 minutos pelo Google Meet')}
          <div class="dm-days">${tabs}</div><div class="dm-slots">${times}</div>
          <p class="dm-err" hidden></p>
          <button class="btn dm-go" type="button" data-book${slot ? '' : ' disabled'}>${slot ? 'Confirmar: ' + dayLabel(slot).join(' ') + ', ' + fHM.format(new Date(slot)) : 'Confirmar minha simulação'}</button>${back()}</div>`;
      },
      erro() {
        return `<div class="dm-f">${head(4, 'A agenda não respondeu')}<p class="dm-sub">Chame a equipe da Inferis no WhatsApp e a gente marca a simulação com você.</p><a class="btn dm-go" href="${waLink()}" target="_blank" rel="noopener">Falar no WhatsApp</a>${back()}</div>`;
      },
    };
    let cur = st.email && opts.skipEmail ? 'area' : 'email', hist = [];
    function back() { return `<button type="button" class="dm-back" data-back>← Voltar</button>`; }
    function waLink() { return `${WA}?text=${encodeURIComponent(`Olá, equipe Inferis! Sou ${st.nome || ''} (${st.empresa || ''}) e quero agendar uma simulação da Inferis.`)}`; }

    function go(name, push = true) {
      if (push && cur !== name) hist.push(cur);
      cur = name; save(); render();
      if (name === 'agenda' && !days) loadSlots();
    }
    function render() {
      host.innerHTML = `<div class="dm-pane" data-s="${cur}">${screens[cur]()}</div>`;
      const first = host.querySelector('input:not(.dm-hp), [aria-checked="true"], .dm-opts button, .btn');
      if (first && opts.focus !== false) setTimeout(() => first.focus({preventScroll: true}), 30);
      opts.focus = true;
    }
    async function loadSlots() {
      try { const j = await api('slots'); days = (j.days || []).filter(d => d.slots && d.slots.length); day = 0; slot = null; render(); }
      catch (e) { cur = 'erro'; render(); }
    }
    function lead(stage) {
      const m = metaIds();
      if (stage === 'qualificado') pixel('Lead', m.eid);
      if (stage === 'trial') pixel('TesteGratis', m.eid);
      const body = Object.assign({stage, page: PAGE, attr}, st, m);
      return api('lead', body).then(j => { if (j && j.abandon) { st.abandon = j.abandon; save(); } }).catch(() => {});
    }
    function route() {
      if (isTrial(st) && !st.forcar) {
        ev('demo_trial', {area: st.area}); go('trial');
        const p = st.regime === 'Simples Nacional' ? 'simples' : 'escritorio';
        const ir = () => location.assign(`${ROOT}teste-gratis/index.html?p=${p}`);
        if (st.trialSent) { ir(); return; }  // a sequencia de e-mails do teste sai uma vez so
        st.trialSent = true;
        Promise.race([lead('trial'), new Promise(r => setTimeout(r, 4000))]).then(ir);
      }
      else { ev('demo_qualified', {area: st.area}); lead('qualificado'); go('contato'); }
    }

    host.addEventListener('submit', e => {
      e.preventDefault();
      const f = e.target, err = f.querySelector('.dm-err');
      if (f.dataset.f === 'email') {
        const v = f.email.value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { err.hidden = false; f.email.focus(); return; }
        st.email = v; ev('demo_email'); lead('email'); go('area');
      } else if (f.dataset.f === 'contato') {
        const n = f.nome.value.trim(), em = f.empresa.value.trim(), w = f.whats.value.replace(/\D/g, '');
        if (n.length < 2 || em.length < 2 || w.length < 10) { err.hidden = false; return; }
        if (f.site.value) return;  // robo
        Object.assign(st, {nome: n, empresa: em, whats: f.whats.value}); lead('contato'); go('agenda');
      }
    });
    host.addEventListener('input', e => { if (e.target.name === 'whats') e.target.value = maskWa(e.target.value); });
    host.addEventListener('click', async e => {
      const b = e.target.closest('button, a'); if (!b) return;
      if (b.dataset.back !== undefined) { const p = hist.pop(); if (p) go(p, false); return; }
      if (b.dataset.area) { st.area = b.dataset.area; st.regime = st.fat = st.clientes = undefined; go('perfil'); return; }
      if (b.dataset.clientes) { st.clientes = b.dataset.clientes; route(); return; }
      if (b.dataset.regime) { st.regime = b.dataset.regime; if (st.regime === 'Simples Nacional') { st.fat = undefined; route(); } else render(); return; }
      if (b.dataset.fat) { st.fat = b.dataset.fat; render(); return; }
      if (b.dataset.go === 'perfil') { route(); return; }
      if (b.dataset.force !== undefined) { ev('demo_trial_to_demo'); go('contato'); return; }
      if (b.dataset.trial !== undefined) { ev('demo_trial_click'); return; }
      if (b.dataset.day) { day = +b.dataset.day; slot = null; render(); return; }
      if (b.dataset.slot) { slot = b.dataset.slot; render(); host.querySelector('[data-book]').focus(); return; }
      if (b.dataset.book !== undefined && slot) {
        b.disabled = true; b.textContent = 'Agendando…';
        try {
          const m = metaIds();
          const j = await api('book', Object.assign({start: slot, page: PAGE, attr}, st, m));
          if (j.error === 'slot') { days = null; slot = null; go('agenda', false); setTimeout(() => { const e2 = host.querySelector('.dm-err'); if (e2) { e2.hidden = false; e2.textContent = 'Esse horário acabou de ser ocupado. Escolha outro.'; } }, 600); return; }
          if (!j.ok) throw new Error(j.error || 'book');
          ev('demo_booked', {area: st.area, value: 1}); pixel('Schedule', m.eid);
          const q = new URLSearchParams({start: j.start || slot, n: (st.nome || '').split(' ')[0], q: '1'});
          if (j.meet) q.set('meet', j.meet);
          ss.set('inf_lead', {email: st.email, nome: st.nome, empresa: st.empresa, whats: st.whats});
          location.assign(`${ROOT}obrigado/index.html?${q}`);
        } catch (err) { cur = 'erro'; render(); }
      }
    });

    if (opts.prefill && opts.prefill.email && opts.skipEmail) hist = ['email'];
    render();
    return {reset() { if (cur === 'trial' || cur === 'erro') { hist = []; cur = 'area'; } render(); }};
  }

  // ---------- pop-up ----------
  let box = null, flow = null, lastFocus = null;
  function open(via) {
    lastFocus = document.activeElement;
    if (!box) {
      box = document.createElement('div');
      box.className = 'dm'; box.setAttribute('data-lenis-prevent', '');
      box.innerHTML = `<div class="dm-scrim" data-x></div><div class="dm-card" role="dialog" aria-modal="true" aria-labelledby="dm-t">
        <header class="dm-h"><img src="${ROOT}assets/img/inferis-landing-mark.png" alt=""><div><b id="dm-t">Agende a sua simulação</b><small>30 minutos com a equipe da Inferis · uma nota sua · sem compromisso</small></div>
        <button type="button" class="dm-x" data-x aria-label="Fechar"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M3 3l10 10M13 3L3 13"/></svg></button></header>
        <div class="dm-body"></div>${MOCK ? '<p class="dm-mock">Modo de teste: horários simulados, nada é enviado.</p>' : ''}</div>`;
      document.body.appendChild(box);
      box.addEventListener('click', e => { if (e.target.closest('[data-x]')) close(); });
      box.addEventListener('keydown', e => {
        if (e.key === 'Escape') close();
        if (e.key === 'Tab') {  // foco preso no pop-up
          const f = [...box.querySelectorAll('button:not([disabled]), a[href], input:not(.dm-hp)')].filter(x => x.offsetParent);
          if (!f.length) return;
          if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
          else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
        }
      });
      flow = Flow(box.querySelector('.dm-body'), {});
    } else flow.reset();
    document.documentElement.classList.add('dm-open');
    box.hidden = false; requestAnimationFrame(() => box.classList.add('on'));
    ev('demo_open', {via: via || PAGE});
  }
  function close() {
    if (!box) return;
    box.classList.remove('on'); document.documentElement.classList.remove('dm-open');
    setTimeout(() => { if (!box.classList.contains('on')) box.hidden = true; }, 300);
    if (lastFocus) lastFocus.focus({preventScroll: true});
  }
  window.InferisDemo = {open, close};

  document.addEventListener('click', e => {
    const a = e.target.closest('a[data-demo]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1 || document.querySelector('[data-demo-inline]')) return;
    e.preventDefault(); open(a.closest('section, header, footer')?.className.split(' ')[0] || 'link');
  });

  // ---------- pagina /agendar/: o formulario no corpo da pagina ----------
  const inline = document.querySelector('[data-demo-inline]');
  if (inline) {
    const pf = {}; if (qs.get('email')) pf.email = qs.get('email').slice(0, 120);
    inline.classList.add('dm-inline');
    Flow(inline, {prefill: pf, skipEmail: !!pf.email, focus: false});
    if (pf.email) ev('demo_return', {via: 'email'});
  }

  // ---------- submenus do topo: estado anunciado ao leitor de tela ----------
  document.querySelectorAll('.nav .dd').forEach(li => {
    const b = li.querySelector('button'), set = v => b.setAttribute('aria-expanded', v);
    li.addEventListener('mouseenter', () => set(true)); li.addEventListener('mouseleave', () => set(false));
    li.addEventListener('focusin', () => set(true)); li.addEventListener('focusout', e => { if (!li.contains(e.relatedTarget)) set(false); });
    li.addEventListener('keydown', e => { if (e.key === 'Escape') { set(false); b.focus(); li.querySelector('ul').style.visibility = 'hidden'; setTimeout(() => li.querySelector('ul').style.visibility = '', 400); } });
  });

  // ---------- pilula flutuante: aparece depois da primeira dobra ----------
  const pill = document.querySelector('.dfloat');
  if (pill) {
    let on = false;
    const tick = () => { const v = scrollY > innerHeight * .8; if (v !== on) { on = v; pill.classList.toggle('on', v); } };
    addEventListener('scroll', tick, {passive: true}); tick();
  }

  // ---------- paginas de obrigado e preparo ----------
  const when = document.querySelector('[data-when]');
  if (when) {
    const start = qs.get('start'), t = Date.parse(start || '');
    if (t) {
      const d = new Date(t), end = new Date(t + 30 * 60e3);
      const txt = `${fLong.format(d)}, às ${fHM.format(d)}`;
      when.querySelector('b').textContent = txt.charAt(0).toUpperCase() + txt.slice(1);
      when.hidden = false;
      const z = x => x.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      const meet = qs.get('meet') || '';
      const det = `Simulação da Inferis (30 minutos).${meet ? '\nGoogle Meet: ' + meet : ''}\nTraga as notas de um fornecedor: XML de NF-e, NFS-e ou CT-e, ou planilha.`;
      const cal = document.querySelector('[data-cal]');
      if (cal) {
        cal.querySelector('[data-gcal]').href = 'https://calendar.google.com/calendar/render?' + new URLSearchParams({action: 'TEMPLATE', text: 'Simulação da Inferis', dates: `${z(d)}/${z(end)}`, details: det, location: meet || 'Google Meet'});
        const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Inferis//Demo//PT', 'BEGIN:VEVENT', `UID:${z(d)}-demo@inferis.com.br`, `DTSTAMP:${z(new Date())}`,
          `DTSTART:${z(d)}`, `DTEND:${z(end)}`, 'SUMMARY:Simulação da Inferis', `DESCRIPTION:${det.replace(/\n/g, '\\n')}`, `LOCATION:${meet || 'Google Meet'}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
        cal.querySelector('[data-ics]').href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
        cal.hidden = false;
      }
      if (PAGE === 'obrigado' && qs.get('q') === '1' && !ss.get('inf_conv_' + t)) { ss.set('inf_conv_' + t, 1); ev('demo_booked_page', {value: 1}); }
    }
  }
  const vsl = document.querySelector('.vsl[data-video]');
  if (vsl && vsl.dataset.video) {
    const u = vsl.dataset.video;
    vsl.innerHTML = /\.mp4($|\?)/.test(u) ? `<video src="${esc(u)}" controls playsinline preload="metadata"></video>` : `<iframe src="${esc(u)}" title="Como funciona a simulação da Inferis" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  }

  // ---------- pagina /teste-gratis/: lead fora do perfil da simulação ----------
  const lead0 = ss.get('inf_lead') || {};
  document.querySelectorAll('a[data-cad]').forEach(a => {
    if (lead0.email) a.href = `${TRIAL_URL}?email=${encodeURIComponent(lead0.email)}`;
    a.addEventListener('click', () => ev('trial_signup_click', {area: lead0.area || ''}));
  });
  const perfil = document.querySelector('[data-perfil]');
  if (perfil && qs.get('p') === 'escritorio') perfil.textContent = 'Para escritórios com até 10 clientes';
  else if (perfil && qs.get('p') === 'simples') perfil.textContent = 'Para empresas do Simples Nacional';

  // ---------- pagina /sua-opiniao/: resposta ao 3o e-mail do teste ----------
  const op = document.querySelector('[data-op]');
  if (op) {
    const okMail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    const email = (qs.get('e') || lead0.email || '').slice(0, 120).trim();
    let r = qs.get('r') || '', enviado = '';
    const em = op.querySelector('[name=email]');
    if (okMail(email)) { em.value = email; em.closest('.op-em').hidden = true; }
    const marca = () => op.querySelectorAll('[data-r]').forEach(b => b.setAttribute('aria-checked', b.dataset.r === r));
    const post = comentario => api('lead', {stage: 'opiniao', email: em.value.trim(), opiniao: r, comentario: comentario || '', page: PAGE, attr});
    if (op.querySelector(`[data-r="${CSS.escape(r)}"]`)) {  // clique no e-mail: a resposta ja conta, mesmo sem comentario
      marca();
      if (okMail(em.value.trim())) { enviado = r; post('').catch(() => {}); ev('trial_opinion', {r, via: 'email'}); }
    } else r = '';
    op.addEventListener('click', e => { const b = e.target.closest('[data-r]'); if (b) { r = b.dataset.r; marca(); } });
    op.addEventListener('submit', async e => {
      e.preventDefault();
      const err = op.querySelector('.dm-err'), c = op.comentario.value.trim();
      if (!r || !okMail(em.value.trim())) { err.hidden = false; err.textContent = !r ? 'Escolha uma resposta.' : 'Confira o e-mail.'; return; }
      const btn = op.querySelector('button[type=submit]'); btn.disabled = true;
      try { if (c || enviado !== r) await post(c); ev('trial_opinion', {r, via: 'pagina', comentario: !!c}); } catch (x) {}
      op.hidden = true;
      const ok = document.querySelector('[data-op-ok]'), msg = ok.querySelector(`[data-msg="${r}"]`);
      if (msg) msg.hidden = false;
      ok.hidden = false; ok.focus();
    });
  }
})();
