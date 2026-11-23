// INFERIS site v1: entradas por secao e o simulador de nota (mesma metodologia de calc_inferis.py).
document.documentElement.classList.remove('no-js');

// ---------- simulador ----------
// Premissas aprovadas: ICMS 18% por dentro (gross-up), PIS 1,65% e COFINS 7,6% sem ICMS na base,
// IPI 10% (fora da base do ICMS proprio, dentro da base do ICMS-ST), MVA 14%, CBS 2027 11,3%, IBS 2027 0,1%.
const ICMS = .18, PIS = .0165, COFINS = .076, IPI = .10, MVA = .14, CBS = .113, IBS = .001;
const r = x => Math.round((x + Math.sign(x) * 1e-9) * 100) / 100;
function hoje(total) {
  const v0 = total / (1 + IPI + ICMS * ((1 + IPI) * (1 + MVA) - 1));
  const icms = r(ICMS * v0), pis = r(PIS * (v0 - ICMS * v0)), cofins = r(COFINS * (v0 - ICMS * v0));
  const ipi = r(IPI * v0), st = r(r(ICMS * v0 * (1 + IPI) * (1 + MVA)) - icms);
  const produto = r(total - ipi - st);
  return {total, produto, icms, pis, cofins, ipi, st, liquido: r(produto - icms - pis - cofins)};
}
function em2027(liq) {
  const cbs = r(CBS * liq), ibs = r(IBS * liq), base = r(liq + cbs + ibs);
  const produto = r(base / (1 - ICMS)), icms = r(produto - base);
  const st = r(r(ICMS * produto * (1 + MVA)) - icms);
  return {liquido: liq, cbs, ibs, base, produto, icms, st, total: r(produto + st)};
}
const brl = v => 'R$ ' + v.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
const parse = s => { const n = parseFloat(String(s).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')); return isFinite(n) ? n : NaN; };

document.querySelectorAll('[data-sim]').forEach(box => {
  const inp = box.querySelector('input'), out = box.querySelector('.out');
  const run = () => {
    const total = parse(inp.value);
    if (!(total > 0)) { out.setAttribute('aria-busy', 'true'); return; }
    out.removeAttribute('aria-busy');
    const h = hoje(total), p = em2027(h.liquido);
    const credH = r(h.icms + h.pis + h.cofins), credP = r(p.cbs + p.ibs + p.icms);
    const set = (k, v) => box.querySelectorAll(`[data-o="${k}"]`).forEach(el => el.textContent = v);
    set('produto', brl(h.produto)); set('icms', brl(h.icms)); set('piscofins', brl(r(h.pis + h.cofins)));
    set('ipi', brl(h.ipi)); set('st', brl(h.st)); set('liq', brl(h.liquido));
    set('cbsibs', brl(r(p.cbs + p.ibs))); set('base', brl(p.base)); set('icms27', brl(p.icms)); set('st27', brl(p.st));
    set('total27', brl(p.total));
    set('ceh', brl(r(h.total - credH))); set('cep', brl(r(p.total - credP)));
    set('credh', brl(credH)); set('credp', brl(credP));
    set('dif', brl(r(p.cbs + p.ibs)));
    // telas da Inferis na pagina acompanham o simulador
    const ceh = r(h.total - credH), cep = r(p.total - credP);
    let lo = h.liquido, hi = h.liquido * 2;
    for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2, q = em2027(r(mid)); if (q.total - q.cbs - q.ibs - q.icms < ceh) lo = mid; else hi = mid; }
    const G = {total: h.total, produto: h.produto, icms: h.icms, pis: h.pis, cofins: h.cofins, ipi: h.ipi, st: h.st, liq: h.liquido, ceh,
      cbs: p.cbs, ibs: p.ibs, icms27: p.icms, produto27: p.produto, st27: p.st, total27: p.total, cep, eqv: em2027(r(hi)).total,
      credh: credH, credp: credP, dce: r(cep - ceh)};
    document.querySelectorAll('[data-g]').forEach(el => {
      const k = el.dataset.g;
      if (k === 'dcep') el.textContent = ((cep - ceh) / ceh * 100).toFixed(2).replace('.', ',') + '%';
      else if (k in G) el.textContent = brl(G[k]);
    });
  };
  inp.addEventListener('input', run);
  box.querySelectorAll('.chips button').forEach(b => b.addEventListener('click', () => { inp.value = b.dataset.v; run(); inp.focus(); }));
  run();
});

// ---------- menu mobile ----------
(function () {
  const btn = document.querySelector('.mb'), nav = document.getElementById('mnav');
  if (!btn || !nav) return;
  const root = document.documentElement;
  const set = (open) => {
    btn.setAttribute('aria-expanded', open); btn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    root.classList.toggle('menu-open', open);
    if (open) { nav.hidden = false; requestAnimationFrame(() => requestAnimationFrame(() => nav.classList.add('on'))); setTimeout(() => nav.querySelector('a')?.focus(), 350); }
    else { nav.classList.remove('on'); setTimeout(() => { if (!nav.classList.contains('on')) nav.hidden = true; }, 700); btn.focus(); }
  };
  btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
  addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('menu-open')) set(false); });
  nav.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
  matchMedia('(min-width: 1241px)').addEventListener('change', e => { if (e.matches && root.classList.contains('menu-open')) set(false); });
})();

// ---------- video do logo 3D: so carrega quando chega perto da tela ----------
(function () {
  const vs = document.querySelectorAll('video[data-src]'); if (!vs.length) return;
  const go = v => { v.src = v.dataset.src; v.removeAttribute('data-src'); v.play().catch(() => {}); };
  if (!('IntersectionObserver' in window)) { vs.forEach(go); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { go(e.target); io.unobserve(e.target); } }), {rootMargin: '400px 0px'});
  vs.forEach(v => io.observe(v));
})();
