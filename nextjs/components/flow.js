// Massa de dados conectados que acompanha a rolagem do topo ao rodape (base: a primeira versao, net.js).
// Sem formato de orb: a massa passa continuamente por formas amorfas (nuvem irregular, campo de dados,
// fios entrelacados, fluxo convergindo), ligada ao progresso da rolagem, com inercia e parallax.
import * as THREE from 'three';  // npm i three

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = matchMedia('(max-width: 980px)').matches;
const canvas = document.createElement('canvas');
canvas.id = 'net'; canvas.setAttribute('aria-hidden', 'true');
document.body.prepend(canvas);
// desempenho (2026-11-07): antialias desligado e resolucao limitada (~2,3 MP); a rede e um fundo de pontos
// difusos, nao precisa de retina cheia. Fora do topo, quando vira fundo discreto, desenha a ~30 fps.
const renderer = new THREE.WebGLRenderer({canvas, antialias: false, alpha: true, powerPreference: 'low-power'});
const dpr = () => Math.min(devicePixelRatio, mobile ? 1 : 1.5, Math.sqrt(2.3e6 / Math.max(1, innerWidth * innerHeight)));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 1, .1, 200);
camera.position.set(0, 0, 22);
const group = new THREE.Group(); scene.add(group);

let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
// ruido de valor 3D (para deformar as formas e tirar qualquer cara de esfera)
const perm = Array.from({length: 512}, () => rnd());
const hsh = (x, y, z) => perm[((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) & 511];
function noise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf), L = (a, b, t) => a + (b - a) * t;
  return L(L(L(hsh(xi, yi, zi), hsh(xi + 1, yi, zi), u), L(hsh(xi, yi + 1, zi), hsh(xi + 1, yi + 1, zi), u), v),
           L(L(hsh(xi, yi, zi + 1), hsh(xi + 1, yi, zi + 1), u), L(hsh(xi, yi + 1, zi + 1), hsh(xi + 1, yi + 1, zi + 1), u), v), w) * 2 - 1;
}
const fbm = (x, y, z) => noise(x, y, z) * .6 + noise(x * 2.1, y * 2.1, z * 2.1) * .3 + noise(x * 4.3, y * 4.3, z * 4.3) * .1;

// grade de parametros (u,v): vizinhos na grade continuam vizinhos em todas as formas -> conexoes coerentes
const C = mobile ? 34 : 70, R = mobile ? 16 : 28, N = C * R;
const U = new Float32Array(N), V = new Float32Array(N), J = new Float32Array(N * 3);
for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
  const i = r * C + c; U[i] = (c + rnd() * .6) / C; V[i] = (r + rnd() * .6) / R;
  J.set([rnd() - .5, rnd() - .5, rnd() - .5], i * 3);
}
function shape(fn) { const a = new Float32Array(N * 3); for (let i = 0; i < N; i++) a.set(fn(U[i], V[i], i), i * 3); return a; }
const TAU = Math.PI * 2;
const SHAPES = [
  // 1. nuvem amorfa a direita do titulo: massa irregular, nada de esfera
  shape((u, v, i) => { const th = u * TAU, ph = v * Math.PI, d = 1.2 + 1.5 * fbm(Math.cos(th) * 1.3, Math.sin(th) * 1.3, ph * 1.1);
    const k = 2.6 + 2.3 * d * (.4 + .6 * rnd());
    return [7.6 + Math.sin(ph) * Math.cos(th) * k * .82 + J[i * 3] * 1.6, Math.cos(ph) * k * .78 + fbm(u * 3, v * 3, 4) * 2.4 + J[i * 3 + 1] * 1.2, Math.sin(ph) * Math.sin(th) * k * .7]; }),
  // 2. campo de dados: superficie ondulada atravessando a tela
  shape((u, v, i) => [(u - .5) * 34, (v - .5) * 13 + Math.sin(u * 7) * 1.2, Math.sin(u * 9 + v * 4) * 1.6 + fbm(u * 4, v * 4, 1) * 3 + J[i * 3 + 2]]),
  // 3. fios entrelacados: dados correndo em feixes
  shape((u, v, i) => { const s = Math.floor(v * 9), a = u * TAU * 1.4 + s * .7, x = (u - .5) * 36;
    const cy = Math.sin(u * 5 + s) * 3.2, rr = .7 + .4 * Math.sin(s * 2.3);
    return [x, (s - 4) * .9 + cy + Math.cos(a * 3) * rr + J[i * 3 + 1] * .5, Math.sin(a * 3) * rr * 2 + fbm(u * 3, s, 2) * 2]; }),
  // 4. fluxo convergindo: as notas entrando no calculo
  shape((u, v, i) => { const t = Math.pow(u, 1.6), a = v * TAU + u * 5, spread = 9 * (1 - t) + .8;
    return [-14 + u * 24 + J[i * 3], Math.cos(a) * spread * .55 + fbm(u * 2, v * 2, 7) * 2 * (1 - t), Math.sin(a) * spread * .5]; }),
  // 5. rede espalhada em profundidade (as telas do sistema ficam na frente)
  shape((u, v, i) => [(u - .5) * 30 + fbm(u * 2, v * 2, 9) * 6, (v - .5) * 18 + fbm(v * 2, u * 2, 3) * 4, -6 + fbm(u * 3, v * 3, 5) * 8 + J[i * 3 + 2] * 2]),
  // 6. no fim, um halo aberto em volta do fechamento: o centro fica livre para o logo e o CTA
  shape((u, v, i) => { const th = u * TAU, rr = 9.5 + v * 4.5 + fbm(Math.cos(th) * 1.5, Math.sin(th) * 1.5, v * 2) * 3;
    return [Math.cos(th) * rr * 1.25, Math.sin(th) * rr * .62, (v - .5) * 5 + fbm(u * 4, v * 4, 11) * 2]; }),
];

// ---------- pontos, conexoes e pulsos ----------
const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), base = new Float32Array(N * 3);
for (let i = 0; i < N; i++) pos.set(reduce ? SHAPES[0].slice(i * 3, i * 3 + 3) : [(rnd() - .5) * 60, (rnd() - .5) * 36, (rnd() - .5) * 30 - 10], i * 3);
// continuidade entre paginas: a rede parte de onde estava na pagina anterior
try {
  const m = JSON.parse(sessionStorage.getItem('inferis-net') || 'null');
  if (m && Date.now() - m.t < 20000 && m.n === N && !reduce) for (let i = 0; i < N * 3; i++) pos[i] = m.p[i] / 100;
} catch (e) {}
addEventListener('pagehide', () => { try { sessionStorage.setItem('inferis-net', JSON.stringify({t: Date.now(), n: N, p: Array.from(pos, v => Math.round(v * 100))})); } catch (e) {} });
const cA = new THREE.Color(0x7C5CFF), cB = new THREE.Color(0xE4DCFF), cC = new THREE.Color(0xA98BFF);
const cD = new THREE.Color(0x8FB4FF);
for (let i = 0; i < N; i++) { const c = (rnd() < .16 ? cB : rnd() < .5 ? cC : cA).clone().lerp(cD, Math.max(0, U[i] - .55) * .55); base.set([c.r, c.g, c.b], i * 3); }
// flutuacao organica: cada ponto com fases e frequencias proprias nos tres eixos
const PH = new Float32Array(N * 3), FQ = new Float32Array(N);
for (let i = 0; i < N; i++) { PH.set([rnd() * 6.283, rnd() * 6.283, rnd() * 6.283], i * 3); FQ[i] = .25 + rnd() * .45; }
// afastamento do cursor (com mola de volta)
const DX = new Float32Array(N * 2), VX = new Float32Array(N * 2);
const sprite = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.75)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const pg = new THREE.BufferGeometry();
pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('color', new THREE.BufferAttribute(col, 3));
const pMat = new THREE.PointsMaterial({size: .12, map: sprite, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .9});
group.add(new THREE.Points(pg, pMat));
const pairs = [];
for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
  const i = r * C + c;
  if (c + 1 < C && rnd() < .8) pairs.push(i, i + 1);
  if (r + 1 < R && rnd() < .5) pairs.push(i, i + C);
}
const lpos = new Float32Array(pairs.length * 3), lcol = new Float32Array(pairs.length * 3);
const lg = new THREE.BufferGeometry();
lg.setAttribute('position', new THREE.BufferAttribute(lpos, 3)); lg.setAttribute('color', new THREE.BufferAttribute(lcol, 3));
const lMat = new THREE.LineBasicMaterial({vertexColors: true, transparent: true, opacity: .9, depthWrite: false, blending: THREE.AdditiveBlending});
group.add(new THREE.LineSegments(lg, lMat));
const Q = mobile ? 40 : 100, qpos = new Float32Array(Q * 3), qi = [];
for (let k = 0; k < Q; k++) qi.push({e: Math.floor(rnd() * pairs.length / 2) * 2, s: .3 + rnd() * .7, o: rnd()});
const qg = new THREE.BufferGeometry(); qg.setAttribute('position', new THREE.BufferAttribute(qpos, 3));
const qMat = new THREE.PointsMaterial({size: .3, map: sprite, color: 0xF1ECFF, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending});
group.add(new THREE.Points(qg, qMat));

// ---------- rolagem, inercia e mouse ----------
let mx = 0, my = 0, px = -9999, py = -9999, vel = 0, lastS = scrollY, lift = 0, liftV = 0;
const fine = matchMedia('(pointer: fine)').matches, tmp = new THREE.Vector3();
const hero = document.querySelector('.hero');
const target = new Float32Array(N * 3);
addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; px = e.clientX; py = e.clientY; }, {passive: true});
document.addEventListener('pointerleave', () => { px = py = -9999; });
// medidas de layout em cache: ler scrollHeight/getBoundingClientRect a cada quadro forcava o navegador a
// recalcular o layout no meio das animacoes do GSAP (causa principal da lentidao ao rolar)
let maxS = 1, heroEnd = 0;
function measure() {
  maxS = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  heroEnd = hero ? hero.getBoundingClientRect().bottom + scrollY : 0;
}
function size() { renderer.setPixelRatio(dpr()); renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); measure(); }
addEventListener('resize', size); size();
addEventListener('load', measure);
if (window.ResizeObserver) new ResizeObserver(measure).observe(document.body);
let visible = true;
document.addEventListener('visibilitychange', () => { const was = visible; visible = !document.hidden; if (visible && !was) requestAnimationFrame(tick); });
const sm = x => x * x * (3 - 2 * x);
const clock = new THREE.Clock(); let tPrev = 0, skip = false, quiet = false;
function tick() {
  if (!visible) return;
  requestAnimationFrame(tick);
  if (quiet && (skip = !skip)) return;            // fundo discreto: um quadro sim, um nao
  const t = reduce ? 0 : clock.getElapsedTime(), F = Math.min(4, Math.max(.25, (t - tPrev) * 60)); tPrev = t;
  const p = Math.min(1, scrollY / maxS);
  // forma alvo: mistura continua entre as formas, conforme o progresso da rolagem
  const f = p * (SHAPES.length - 1), k = Math.min(SHAPES.length - 2, Math.floor(f)), w = sm(f - k), A = SHAPES[k], B = SHAPES[k + 1];
  for (let i = 0; i < N * 3; i++) target[i] = A[i] + (B[i] - A[i]) * w;
  // inercia: cada ponto chega a forma com atraso proprio (a massa escorre em vez de saltar)
  vel += ((scrollY - lastS) - vel) * .2; lastS = scrollY;
  liftV = (liftV + (-vel * .012 - lift) * .08) * .82; lift += liftV;     // a massa sobe/desce junto e volta com mola
  group.updateMatrixWorld(); camera.updateMatrixWorld();
  const hw = innerWidth / 2, hh = innerHeight / 2, RAD = 150, mv = Math.min(1, Math.abs(vel) * .02);
  for (let i = 0; i < N; i++) {
    const a = i * 3, kk = reduce ? 1 : 1 - Math.pow(1 - (.03 + (i % 7) * .006), F), fq = FQ[i] * t;
    // flutuacao organica (mais ampla quando a pagina corre) + gotejamento vertical com a velocidade da rolagem
    const amp = reduce ? 0 : .22 + mv * .35;
    const ox = Math.sin(fq + PH[a]) * amp, oy = Math.sin(fq * 1.3 + PH[a + 1]) * amp + lift * (.6 + V[i]), oz = Math.sin(fq * .8 + PH[a + 2]) * amp;
    pos[a] += (target[a] + ox + DX[i * 2] - pos[a]) * kk;
    pos[a + 1] += (target[a + 1] + oy + DX[i * 2 + 1] - pos[a + 1]) * kk;
    pos[a + 2] += (target[a + 2] + oz - pos[a + 2]) * kk;
    // projeta na tela (so com mouse): cursor afasta os pontos; profundidade define o brilho
    if (!fine) { const lum = Math.min(1.2, Math.max(.35, .8 + pos[a + 2] * .05)); col[a] = base[a] * lum; col[a + 1] = base[a + 1] * lum; col[a + 2] = base[a + 2] * lum; continue; }
    tmp.set(pos[a], pos[a + 1], pos[a + 2]).applyMatrix4(group.matrixWorld);
    const dc = tmp.distanceTo(camera.position);
    tmp.project(camera);
    const sx = (tmp.x + 1) * hw, sy = (1 - tmp.y) * hh;
    let fx = 0, fy = 0;
    if (fine && !reduce) { const ddx = sx - px, ddy = sy - py, d2 = ddx * ddx + ddy * ddy;
      if (d2 < RAD * RAD) { const d = Math.sqrt(d2) + .001, f = (1 - d / RAD) * (1 - d / RAD) * 1.6; fx = ddx / d * f; fy = -ddy / d * f; } }
    VX[i * 2] = (VX[i * 2] + (fx - DX[i * 2]) * .08) * .82; DX[i * 2] += VX[i * 2];
    VX[i * 2 + 1] = (VX[i * 2 + 1] + (fy - DX[i * 2 + 1]) * .08) * .82; DX[i * 2 + 1] += VX[i * 2 + 1];
    const lum = Math.min(1.25, Math.max(.25, 1.6 - (dc - 14) / 14));
    col[a] = base[a] * lum; col[a + 1] = base[a + 1] * lum; col[a + 2] = base[a + 2] * lum;
  }
  pg.attributes.position.needsUpdate = true; pg.attributes.color.needsUpdate = true;
  for (let j = 0; j < pairs.length; j += 2) {
    const a = pairs[j] * 3, b = pairs[j + 1] * 3, dx = pos[a] - pos[b], dy = pos[a + 1] - pos[b + 1], dz = pos[a + 2] - pos[b + 2];
    const L = Math.sqrt(dx * dx + dy * dy + dz * dz), al = Math.max(0, 1 - L / 2.4) * .2;   // conexao some quando estica demais
    lpos.set([pos[a], pos[a + 1], pos[a + 2], pos[b], pos[b + 1], pos[b + 2]], j * 3);
    const la = al * (col[a] + col[b] + col[a + 2] + col[b + 2]) * .6;
    lcol.set([.56 * la, .45 * la, la, .56 * la, .45 * la, la], j * 3);
  }
  lg.attributes.position.needsUpdate = true; lg.attributes.color.needsUpdate = true;
  for (let q = 0; q < Q; q++) {
    const d = qi[q], u = (t * d.s * (1 + Math.min(Math.abs(vel) * .02, 2)) + d.o) % 1, a = pairs[d.e] * 3, b = pairs[d.e + 1] * 3;
    qpos.set([pos[a] + (pos[b] - pos[a]) * u, pos[a + 1] + (pos[b + 1] - pos[a + 1]) * u, pos[a + 2] + (pos[b + 2] - pos[a + 2]) * u], q * 3);
    if (u < .02) d.e = Math.floor(rnd() * pairs.length / 2) * 2;
  }
  qg.attributes.position.needsUpdate = true;
  // camera e giro tambem ligados a rolagem; mais discreta fora do topo e do fim, para nao competir com o texto
  // intensa so enquanto o topo esta na tela; depois vira um fundo discreto que nao disputa com a leitura
  const hb = hero ? (heroEnd - scrollY) / innerHeight : 0;
  const spot = Math.min(1, Math.max(0, (hb - .45) / .4)), op = .2 + .8 * spot * spot;
  quiet = spot < .05 && Math.abs(vel) < 40 && !reduce;
  const e = 1 - Math.pow(1 - .12, F);
  pMat.opacity += (op * .9 - pMat.opacity) * e; lMat.opacity += (op - lMat.opacity) * e; qMat.opacity += (op * .8 - qMat.opacity) * e;
  group.position.z += ((spot - 1) * 5 - group.position.z) * e;                 // fora do topo, a massa recua em profundidade
  const g = 1 - Math.pow(1 - .04, F);
  group.rotation.y += ((reduce ? 0 : Math.sin(t * .12) * .12) + Math.sin(p * Math.PI) * 1.1 + mx * .2 - group.rotation.y) * g;
  group.rotation.x += (Math.sin(p * Math.PI * 2) * .25 + my * .14 - group.rotation.x) * g;
  camera.position.z += (22 - Math.sin(p * Math.PI) * 4 - camera.position.z) * g;
  renderer.render(scene, camera);
}
tick();
