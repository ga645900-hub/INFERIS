'use client';
// Rede de dados 3D (three.js) do fundo. Carrega SÓ no cliente e DEPOIS do conteúdo, para não pesar no LCP/TBT:
//  - desktop: quando o navegador fica ocioso após o load;
//  - celular: no primeiro toque/rolagem (ou 6 s), pois ali ela é decorativa.
// Código da rede: components/flow.js (importa three; o bundler do Next faz o tree-shaking).
import { useEffect } from 'react';

export function RedeDeDados() {
  useEffect(() => {
    let done = false;
    const go = () => { if (done) return; done = true; import('./flow').catch(() => {}); };
    const coarse = matchMedia('(pointer: coarse)').matches;
    if (coarse) {
      ['scroll', 'touchstart', 'pointerdown'].forEach((e) => addEventListener(e, go, { once: true, passive: true }));
      const t = setTimeout(go, 6000);
      return () => clearTimeout(t);
    }
    const start = () => ('requestIdleCallback' in window ? requestIdleCallback(go) : setTimeout(go, 1));
    if (document.readyState === 'complete') start(); else addEventListener('load', start, { once: true });
  }, []);
  return null;
}
