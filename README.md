# Inferis — novo site com SEO por público (entrega para a Yeti Tecnologia)

Olá, Fábio e equipe Yeti. Este pacote leva para o site em produção (Next.js na Vercel) a nova estrutura do inferis.com.br: uma página por público, com SEO técnico completo. O design, os textos e as interações estão aprovados pela Inferis no protótipo que acompanha esta pasta.

**Protótipo de referência:** a pasta `prototipo/` deste repositório, idêntica à prévia publicada em https://inferis-site.vercel.app (a prévia fica fora do Google). Para abrir localmente: `prototipo/abrir_prototipo.bat`, ou `python -m http.server 8800` dentro de `prototipo/` e depois http://127.0.0.1:8800/. O 3D precisa de http; abrir o arquivo direto não funciona.

> Para portar, usem o HTML de cada página em `prototipo/` como fonte da verdade e a pasta `nextjs/` como ponto de partida do código. A conferência final é página por página contra a prévia: `CONFERENCIA.md`.

**Como este repositório é atualizado:** cada entrega é um commit com tag (`v1`, `v2`…) e uma entrada no `CHANGELOG.md`. Ajustes depois da entrega chegam como nova versão; o `git diff` entre as tags mostra exatamente o que mudou. `MANIFEST.sha256` traz a impressão digital de cada arquivo da versão.

---

## 1. O que muda

Hoje o site é uma página única, com âncoras (`/#problema`, `/#planos`…). `sitemap.xml` e `robots.txt` respondem 404.

O novo site tem 10 rotas indexáveis: o hub, seis páginas por público e três páginas de simulador, uma por documento fiscal.

| Rota | Público | `<title>` |
|---|---|---|
| `/` | todos (hub) | Simulador da Reforma Tributária para compras e vendas \| Inferis |
| `/reforma-tributaria/compras/` | setor de compras | Reforma Tributária nas compras: crédito CBS e IBS \| Inferis |
| `/reforma-tributaria/vendas/` | setor de vendas | Como precificar na Reforma Tributária com CBS e IBS \| Inferis |
| `/reforma-tributaria/financeiro/` | financeiro | Reforma Tributária: capital de giro e split payment \| Inferis |
| `/reforma-tributaria/contadores/` | contadores | Reforma Tributária para contadores: Simples híbrido \| Inferis |
| `/reforma-tributaria/advogados/` | advogados | Reforma Tributária para advogados: contratos e 2027 \| Inferis |
| `/reforma-tributaria/como-calcular/` | calculadora (página pilar) | Calculadora da Reforma Tributária: CBS e IBS 2027 \| Inferis |
| `/reforma-tributaria/simulador-nf-e/` | Simulador de Bens (NF-e) | Simulador da Reforma Tributária para NF-e (bens) \| Inferis |
| `/reforma-tributaria/simulador-nfs-e/` | Simulador de Serviços (NFS-e) | Simulador da Reforma Tributária para NFS-e (serviços) \| Inferis |
| `/reforma-tributaria/simulador-ct-e/` | Simulador de Transportes (CT-e) | Simulador da Reforma Tributária para CT-e (fretes) \| Inferis |

Os títulos e as descrições foram escritos a partir da análise do que o Google mostra hoje para os termos de cada público. Os dados completos por rota estão em `lib/seo.json`: title, description, canonical, og:image, h1 e JSON-LD.

As rotas `/entrar`, `/cadastro`, `/termos` e `/privacidade` continuam como estão. As duas primeiras ficam fora da indexação (`robots`).

## 2. Arquivos deste pacote

```
README.md                          este documento
CONFERENCIA.md                     lista de conferência página por página (gerada do protótipo)
CHANGELOG.md                       o que mudou em cada versão
MANIFEST.sha256                    impressão digital de cada arquivo da versão
prototipo/                         o site aprovado, igual à prévia (HTML, CSS, JS, imagens, fontes)
referencia/calc_inferis.py         módulo de cálculo de onde saem os números de exemplo
nextjs/
  lib/seo.ts, lib/seo.json         metadados por rota + helper metadataFor()
  app/reforma-tributaria/[publico]/page.tsx   rota dinâmica (SSG) com generateMetadata
  app/sitemap.ts, app/robots.ts    substituem os 404 atuais
  components/JsonLd.tsx            grafo schema.org por página
  components/RedeDeDados.tsx       carrega a rede 3D sem pesar no carregamento
  components/flow.js               a rede 3D (three.js)
  components/motion.reference.js   camada de animação (GSAP + ScrollTrigger + Lenis): referência
  components/site.reference.css    CSS do protótipo: referência de tokens e componentes
  public/og/*.jpg                  imagens de compartilhamento 1200x630, uma por página
  public/fonts/Inter-*.woff2       fontes já convertidas e reduzidas (75% menores que os .ttf)
  public/llms.txt                  resumo da Inferis para assistentes de IA
  public/b1909ed3e18581a108acae847d8c7ce3.txt   chave do IndexNow
  public/favicon-32.png, apple-touch-icon.png
```

Supomos o **App Router** (Next 13.4+; os `params` assíncronos seguem o Next 15). Se o projeto usa o Pages Router, a lógica é a mesma: `next/head` com os campos de `seo.json`, `getStaticPaths` e `getStaticProps`.

## 3. Passo a passo

1. **Rotas:** criar `app/reforma-tributaria/[publico]/page.tsx` (modelo incluído) e portar as seções do protótipo para componentes. Um único `<h1>` por página, igual ao do protótipo.
2. **Home:** o hub do protótipo (`prototipo/index.html`) substitui a home atual, com `metadataFor('/')` e o JSON-LD da home, que inclui `SoftwareApplication` com os dois planos.
3. **Metadados:** `export const generateMetadata` (ou `metadata` na home) usando `lib/seo.ts`. Isso gera title, description, canonical, hreflang pt-BR, Open Graph, Twitter e robots com `max-image-preview:large`.
4. **JSON-LD:** `<JsonLd data={seo.jsonLd} />` em cada página. O grafo traz:
   - `Organization` com `sameAs` para o LinkedIn e o Instagram oficiais;
   - `WebSite`;
   - `WebPage`, com `dateModified` e `citation` da LC 214/2025 e do TCU;
   - `BreadcrumbList`;
   - `FAQPage`, com as mesmas perguntas que aparecem visíveis na página (precisam bater).
5. **Sitemap e robots:** copiar `app/sitemap.ts` e `app/robots.ts`. Atualizar `UPDATED` quando o conteúdo mudar.
6. **Arquivos públicos:** copiar `nextjs/public/` (OG, fontes, llms.txt, chave IndexNow e ícones).
7. **Fontes:** usar `next/font/local` com os `.woff2` deste pacote (pesos 300, 400, 500, 600 e 700), com `display: 'swap'` e preload dos pesos 300 e 600, que são os do título.
8. **Animações:** instalar `three`, `gsap` e `lenis` via npm. Não usar o CDN, para evitar uma conexão extra e melhorar o LCP. A rede 3D entra por `<RedeDeDados />`, no layout. As animações seguem `motion.reference.js`, inicializadas num componente cliente depois da hidratação.
9. **Botão flutuante do WhatsApp:** fixo no canto inferior direito de todas as páginas (`.wa` em `site.reference.css`; HTML em qualquer página do protótipo). O link já leva uma mensagem pronta que diz de qual página o contato veio, por exemplo "Vim pelo site da Inferis (Compras)". Ele fica abaixo do menu do celular e some quando o menu abre.
10. **Rodapé:** manter visível "Página atualizada em …", as fontes legais e os links do LinkedIn e do Instagram. São sinais de confiança para o Google e para as IAs.

## 4. Desempenho (Core Web Vitals)

Resultados do Lighthouse no protótipo, num servidor local sem compressão:

| | Desempenho | Acessibilidade | Boas práticas | SEO |
|---|---|---|---|---|
| Celular (home) | 85 | 100 | 100 | 100 |
| Celular (compras) | 81 | 96 | 100 | 100 |
| Desktop (compras) | 90 | 96 | 100 | 100 |

CLS = 0. Itens que já estão no protótipo:
- three.js empacotado, de 2,1 MB para 533 KB sem compressão;
- logos redimensionados;
- vídeo do logo 3D carregado só quando chega perto da tela;
- 3D carregado depois do conteúdo e mais leve no celular;
- topo estático no celular.

Itens que dependem do Next/Vercel e devem levar o celular acima de 90:
- servir `gsap`, `lenis` e `three` pelo bundle, sem CDN;
- usar `next/font` e o CSS crítico, que o Next já inlina;
- compressão Brotli e cache de longo prazo para `/og`, `/fonts` e para o bundle.

**Meta: LCP < 2,5 s, INP < 200 ms e CLS < 0,1 no celular**, conferido no PageSpeed Insights após o deploy.

A camada de animação respeita `prefers-reduced-motion`. Nenhum conteúdo depende de JavaScript para aparecer: o texto está no HTML e o JavaScript só anima.

## 5. Movimento: regras aprovadas (não mudar sem falar com a Inferis)

A fluidez da rolagem foi ajustada com a Inferis em 07/11/2026 ("o site está com lentidão", "tem que rolar um montão", "ainda está meio travado"). O resultado aprovado segue estas regras:

- **Nada fixa a tela na rolagem no desktop.** Os números grandes ("A mesma nota, hoje e em 2027"), o extrato em três passos e as telas do sistema ("Por dentro da nossa solução") tocam sozinhos uma vez, quando aparecem: números em ~1,3 s, extrato em ~2 s, telas em ~3,5 s (a tela gira para a frente, os pontos 01–03 acendem com os marcadores e depois entra a lupa). Não usar `pin` nem `scrub` nessas cenas.
- **Nunca colocar `transition` do CSS numa propriedade que o GSAP anima.** A tela do sistema tinha `transition: transform .7s` e isso deixava a animação arrastada. No protótipo: `.mo .bw { transition: none }`.
- **Evitar `filter: blur()` e `mix-blend-mode` em elementos grandes ou fixos.** O granulado do fundo (`body::after`) fica atrás da rede 3D, sem `mix-blend-mode`.
- **Rede 3D (`components/flow.js`):** sem antialias, resolução limitada (~2,3 milhões de pixels de canvas, DPR até 1,5 no desktop e 1 no celular), ~30 quadros/s quando ela já é só fundo, pausa com a aba oculta, e nenhuma leitura de layout (`getBoundingClientRect`, `scrollHeight`) a cada quadro: medir só no resize. Manter assim.
- **Rolagem suave:** Lenis com `lerp: .14`, desligado em telas de toque.

## 6. Depois do deploy

1. **Google Search Console:** propriedade de domínio via registro TXT no DNS. Enviar `https://inferis.com.br/sitemap.xml` e pedir indexação das 10 URLs.
2. **Bing Webmaster Tools:** importar do Search Console. É o índice usado pelo ChatGPT na busca.
3. **IndexNow:** a cada publicação, avisar Bing e Yandex:
   ```
   curl "https://api.indexnow.org/indexnow?url=https://inferis.com.br/reforma-tributaria/compras/&key=b1909ed3e18581a108acae847d8c7ce3"
   ```
   A chave já está em `public/`. Dá para automatizar no pipeline de deploy, para todas as URLs do sitemap.
4. **Validação:**
   - Rich Results Test e validator.schema.org (dados estruturados);
   - PageSpeed Insights (Core Web Vitals);
   - pré-visualização de links: LinkedIn Post Inspector e debugger do Facebook.
5. **Medição:** GA4 com Consent Mode v2, respeitando o banner de cookies atual (o site já usa o Pixel da Meta com consentimento). Conversão principal: clique em "Criar conta", com a página de origem.

## 7. Observações

- As **perguntas frequentes** não geram mais resultado expandido no Google para a maioria dos sites (mudança de 2023). Elas continuam valendo pelo conteúdo e para as respostas de IA.
- **Menu e simuladores:** abaixo do menu principal há uma barra fixa com os três simuladores (NF-e, NFS-e, CT-e) e os documentos aceitos (NF-e, NFS-e, CT-e, CSV e Excel); no celular ela vira uma linha rolável e o menu em tela cheia lista os simuladores primeiro. Entre 981 e 1240 px o menu principal vai para o menu em tela cheia. Todas as páginas têm a seção "Simuladores e documentos aceitos" antes das perguntas frequentes.
- **Bloco dos números:** cada um dos três números traz um título curto e a conta que o explica. Em seguida, "De onde vêm esses números": barras da nota de hoje e de 2027 (cores por papel: valor líquido, tributos que continuam, que saem e que entram) e o extrato em três passos. As cores foram validadas para daltonismo; manter.
- Os números de exemplo (nota de R$ 100,00 → R$ 90,45 em 2027) vêm do módulo de cálculo aprovado pela Inferis (`referencia/calc_inferis.py`). O simulador da página usa a mesma conta.

Dúvidas sobre o protótipo: falar com a Inferis.
