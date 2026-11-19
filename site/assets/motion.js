// Camada de movimento v2: rolagem suave (Lenis) + cenas ligadas a rolagem (GSAP ScrollTrigger).
// Desktop: cenas com a secao fixa enquanto o conteudo se monta (numeros, extrato, telas do sistema),
// comparativo que se abre, lista que acende item a item. Celular: as mesmas ideias, sem fixar a tela.
// Sem GSAP (CDN fora) ou com movimento reduzido, nada fica escondido. Versao anterior: motion_v1.js
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.gsap || !window.ScrollTrigger || reduce) return;
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('mo');
  const fine = matchMedia('(pointer: fine)').matches;

  // rolagem suave (desliga no toque)
  let lenis = null;
  if (window.Lenis && !matchMedia('(pointer: coarse)').matches) {
    lenis = new Lenis({lerp: .14, smoothWheel: true});
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const el = document.querySelector(a.getAttribute('href')); if (el) { e.preventDefault(); lenis.scrollTo(el, {offset: -140}); }
    }));
    new MutationObserver(() => document.documentElement.classList.contains('menu-open') ? lenis.stop() : lenis.start())
      .observe(document.documentElement, {attributes: true, attributeFilter: ['class']});
  }

  // separa o texto em palavras (preserva <strong>, que leva o degrade por palavra)
  function words(el) {
    const walk = (node) => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(w => {
          if (!w) return;
          if (/^\s+$/.test(w)) { frag.append(w); return; }
          const o = document.createElement('span'); o.className = 'wo';
          const i = document.createElement('span'); i.className = 'wi'; i.textContent = w; o.append(i); frag.append(o);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && !n.matches('[data-g]')) walk(n);
    });
    walk(el); return el.querySelectorAll('.wi');
  }
  const brl = (v) => 'R$ ' + v.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  const num = (txt) => { const m = txt.match(/^([^\d]*)([\d.]+(?:,\d+)?)(.*)$/); if (!m) return null;
    return {pre: m[1], suf: m[3], dec: (m[2].split(',')[1] || '').length, val: parseFloat(m[2].replace(/\./g, '').replace(',', '.')), year: /^\d{4}/.test(m[2])}; };
  const fmt = (n, v) => n.pre + v.toLocaleString('pt-BR', {minimumFractionDigits: n.dec, maximumFractionDigits: n.dec}) + n.suf;

  // ---------------- comum a todas as larguras ----------------
  const small = matchMedia('(max-width: 980px)').matches;
  document.querySelectorAll('h1, .s h2, .close h2').forEach(h => {
    if (small && h.closest('.hero')) return;   // celular: topo estatico (pinta de imediato, LCP rapido)
    const w = words(h);
    gsap.from(w, {yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: .045,
      scrollTrigger: h.closest('.hero') ? undefined : {trigger: h, start: 'top 88%'}});
  });
  if (!small) gsap.utils.toArray('.hero .lead, .hero .rt, .hero .ctas, .hero .note').forEach((el, i) =>
    gsap.from(el, {y: 22, duration: 1, delay: .1 + i * .06, ease: 'power3.out'}));
  gsap.utils.toArray('.s .intro, .s .src, .faq, .plans, .sim, .close .lead, .close .ctas, .others').forEach(el =>
    gsap.from(el, {y: 40, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: {trigger: el, start: 'top 90%'}}));
  gsap.utils.toArray('.cmp li, .pub a, .faq details, .plans li').forEach(el =>
    gsap.from(el, {x: -28, opacity: 0, duration: .8, ease: 'power3.out', scrollTrigger: {trigger: el, start: 'top 92%'}}));
  const hero = document.querySelector('.hero');
  if (hero) gsap.to(hero.querySelector('.txt'), {yPercent: -18, opacity: .15, ease: 'none',
    scrollTrigger: {trigger: hero, start: 'top top', end: 'bottom top', scrub: true}});
  document.querySelectorAll('.stmt .big').forEach(p => {
    const w = words(p);
    gsap.fromTo(w, {opacity: .3}, {opacity: 1, ease: 'none', stagger: .1,
      scrollTrigger: {trigger: p, start: 'top 80%', end: 'bottom 35%', scrub: true}});
  });
  document.querySelectorAll('.nb').forEach(nb =>
    gsap.from(nb.querySelectorAll('.nb-b'), {scaleX: 0, duration: 1.2, ease: 'expo.out', stagger: .25, scrollTrigger: {trigger: nb, start: 'top 82%'}}));
  document.querySelectorAll('.tl').forEach(tl => {
    tl.style.setProperty('--fill', '0');
    gsap.to(tl, {'--fill': 1, ease: 'none', scrollTrigger: {trigger: tl, start: 'top 80%', end: 'bottom 50%', scrub: true}});
  });
  // FAQ abre suave
  document.querySelectorAll('.faq details').forEach(d => d.addEventListener('toggle', () => {
    const p = d.querySelector('p'); if (d.open && p) gsap.from(p, {height: 0, opacity: 0, y: -8, duration: .5, ease: 'power3.out', clearProps: 'height'});
    ScrollTrigger.refresh();
  }));
  // botoes principais: leve atracao pelo cursor
  if (fine) document.querySelectorAll('.btn:not(.sm)').forEach(b => {
    const qx = gsap.quickTo(b, 'x', {duration: .5, ease: 'power3.out'}), qy = gsap.quickTo(b, 'y', {duration: .5, ease: 'power3.out'});
    b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); qx((e.clientX - r.left - r.width / 2) * .22); qy((e.clientY - r.top - r.height / 2) * .3); });
    b.addEventListener('pointerleave', () => { gsap.to(b, {x: 0, y: 0, duration: .9, ease: 'elastic.out(1, .4)'}); });
  });

  // marca a tela que alterna de lado antes de qualquer cena envolver o elemento
  document.querySelectorAll('.shots').forEach(sh => sh.children[1]?.classList.add('flip'));
  const mm = gsap.matchMedia();

  // ---------------- desktop: cenas ----------------
  mm.add('(min-width: 981px)', () => {
    const H = innerHeight;
    // comparativo: as colunas se abrem do centro e o divisor se desenha; as duas colunas ficam visiveis
    document.querySelectorAll('.cmp').forEach(c => {
      const [a, b] = c.children; if (!b) return;
      gsap.timeline({scrollTrigger: {trigger: c, start: 'top 88%', end: 'top 35%', scrub: .8}})
        .fromTo(a, {xPercent: 14, opacity: .15}, {xPercent: 0, opacity: 1, ease: 'none'}, 0)
        .fromTo(b, {xPercent: -14, opacity: .15}, {xPercent: 0, opacity: 1, ease: 'none'}, 0)
        .fromTo(c, {'--div': 0}, {'--div': 1, ease: 'none'}, 0);
    });
    // numeros grandes: entram e contam sozinhos, um apos o outro, assim que a secao aparece (~1,3 s).
    // Antes a secao ficava fixa por ~1,25 tela de rolagem e os numeros so avancavam rolando (usuario: "muito devagar").
    document.querySelectorAll('.figs').forEach(f => {
      const tl = gsap.timeline({paused: true});
      [...f.children].forEach((it, i) => {
        const v = it.querySelector('.v'), n = v && num(v.textContent);
        tl.fromTo(it, {opacity: .1, y: 30}, {opacity: 1, y: 0, duration: .6, ease: 'power3.out'}, i * .18);
        if (n && !n.year) { const o = {v: 0}; tl.to(o, {v: n.val, duration: .9, ease: 'power2.out', onUpdate: () => { v.textContent = fmt(n, o.v); }}, i * .18); }
      });
      ScrollTrigger.create({trigger: f, start: 'top 82%', once: true, onEnter: () => tl.play()});
    });
    // extrato: as linhas entram em sequencia e o total acompanha cada passo, sem fixar a tela (~2 s)
    document.querySelectorAll('.ledger').forEach(l => {
      const rows = [...l.querySelectorAll('.r')], tot = l.querySelector('.tot b'); if (!rows.length || !tot) return;
      const subs = rows.map(r => (r.querySelector('.sub')?.textContent || '').trim()), final = tot.textContent;
      const running = subs.every(s => /^= R\$/.test(s));
      const items = [...l.querySelectorAll('.lg, .r, .res')];
      let last = null; const at = items.map(it => { if (it.classList.contains('r')) last = (it.querySelector('.sub')?.textContent || '').trim().replace('= ', ''); return last; });
      const tl = gsap.timeline({paused: true, onUpdate: () => { if (!running) return; const pr = tl.progress();
        const k = Math.min(Math.floor(pr * (items.length + 1) - .45), items.length - 1);
        tot.textContent = pr > .97 ? final : (k < 0 || !at[k]) ? 'R$ 100,00' : at[k]; }});
      tl.from(items, {opacity: .06, x: -40, stagger: .12, duration: .45, ease: 'power2.out'})
        .from(l.querySelector('.tot'), {opacity: .2, duration: .4, ease: 'none'}, '-=.2');
      ScrollTrigger.create({trigger: l, start: 'top 75%', once: true, onEnter: () => tl.play()});
    });
    // telas do sistema: ao entrar, a tela gira para a frente e a explicacao percorre os pontos sozinha,
    // acendendo cada marcador e depois a lupa (~3,5 s). Nada fica fixo nem preso a rolagem
    // (usuario 2026-11-07: "mais fluido" e depois "ainda esta meio travado").
    document.querySelectorAll('.shot').forEach(s => {
      const lis = [...s.querySelectorAll('figcaption li')], bw = s.querySelector('.bw'), lens = s.querySelector('.lens');
      const pins = [...s.querySelectorAll('.app .pin')].sort((x, y) => parseInt(x.textContent) - parseInt(y.textContent));
      const flip = s.classList.contains('flip') ? 1 : -1;
      const tl = gsap.timeline({paused: true});
      tl.fromTo(bw, {rotateY: 14 * flip, rotateX: 8, y: 50, opacity: .35, transformPerspective: 1800},
        {rotateY: 0, rotateX: 0, y: 0, opacity: 1, duration: 1, ease: 'power3.out'}, 0);
      if (lens) tl.set(lens, {opacity: 0, scale: .75, y: 30}, 0);
      lis.forEach((li, i) => {
        tl.to(lis, {opacity: j => (j === i ? 1 : .3), duration: .35, ease: 'power2.out'}, i ? '+=.4' : .55);
        if (pins.length) tl.to(pins, {scale: j => (j === i ? 1.35 : .82), opacity: j => (j === i ? 1 : .4), duration: .35, ease: 'back.out(2)'}, '<');
      });
      if (lens) tl.to(lens, {opacity: 1, scale: 1, y: 0, duration: .6, ease: 'back.out(1.6)'}, '+=.3');
      tl.to(lis, {opacity: 1, duration: .4}, '+=.35'); if (pins.length) tl.to(pins, {scale: 1, opacity: 1, duration: .4}, '<');
      ScrollTrigger.create({trigger: s, start: 'top 78%', once: true, onEnter: () => tl.play()});
    });
    // lista com titulo fixo: cada item acende quando passa pelo centro
    document.querySelectorAll('.split .lst li').forEach(li =>
      ScrollTrigger.create({trigger: li, start: 'top 62%', end: 'bottom 38%', toggleClass: 'on'}));
    // frases de destaque derivam de leve na horizontal
    document.querySelectorAll('.stmt .big').forEach(p =>
      gsap.fromTo(p, {x: 50}, {x: -50, ease: 'none', scrollTrigger: {trigger: p, start: 'top bottom', end: 'bottom top', scrub: true}}));
  });

  // ---------------- celular: as mesmas ideias, sem fixar a tela ----------------
  mm.add('(max-width: 980px)', () => {
    document.querySelectorAll('.figs .v').forEach(v => {
      const n = num(v.textContent); if (!n || n.year) return; const o = {v: 0};
      gsap.to(o, {v: n.val, duration: 1.4, ease: 'power2.out', scrollTrigger: {trigger: v, start: 'top 88%'}, onUpdate: () => { v.textContent = fmt(n, o.v); }});
    });
    document.querySelectorAll('.ledger').forEach(l =>
      gsap.from(l.querySelectorAll('.r'), {opacity: .08, x: -24, stagger: .12, duration: .6, ease: 'power2.out', scrollTrigger: {trigger: l, start: 'top 80%'}}));
    gsap.utils.toArray('.shot .bw, .lst li').forEach(el =>
      gsap.from(el, {y: 40, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: {trigger: el, start: 'top 90%'}}));
  });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
