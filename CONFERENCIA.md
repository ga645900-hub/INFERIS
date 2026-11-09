# Conferência página por página

Antes de publicar no inferis.com.br, comparar cada página do novo site com a prévia aprovada (https://inferis-site.vercel.app), no desktop (1440 px) e no celular (390 px). Marcar cada item. Gerado automaticamente a partir de `prototipo/`.

## Em todas as páginas

- [ ] Menu principal, barra fixa de simuladores (NF-e, NFS-e, CT-e) e documentos aceitos (NF-e, NFS-e, CT-e, CSV, Excel)
- [ ] Rede 3D do fundo carrega depois do conteúdo e não trava a rolagem
- [ ] Nenhuma seção fixa a tela na rolagem (desktop); números, extrato e telas tocam sozinhos ao aparecer
- [ ] Botão flutuante do WhatsApp com a mensagem pronta citando a página
- [ ] Seção "Simuladores e documentos aceitos" antes das perguntas frequentes
- [ ] Rodapé com "Página atualizada em …", fontes legais, LinkedIn e Instagram
- [ ] Com "reduzir movimento" ligado no sistema, todo o conteúdo aparece sem animação
- [ ] `<title>`, description, canonical, Open Graph e JSON-LD iguais a `nextjs/lib/seo.json`
- [ ] Um único `<h1>`, igual ao do protótipo

## `/`

Prévia: https://inferis-site.vercel.app/

- [ ] Título: Simulador da Reforma Tributária para compras e vendas | Inferis
- [ ] H1: Reforma Tributária, nota a nota.
- [ ] Seções, nesta ordem (10):
  1. Em 2027, o crédito fica amplo.
  2. Para cada setor, a sua conta.
  3. Simuladores e documentos aceitos.
  4. A mesma nota, em 2027.
  5. Simule uma nota de compra.
  6. Por dentro da nossa solução.
  7. Oito anos de transição.
  8. Planos da Inferis.
  9. Perguntas frequentes.
  10. Simule sua reforma na Inferis.
- [ ] Números grandes: R$ 100,00 · R$ 64,95 · R$ 90,45
- [ ] Simulador ao vivo (1): mudar o valor e conferir que recalcula igual à prévia
- [ ] Telas do sistema (2): giro 3D, marcadores 01–03 acendendo e lupa
- [ ] Perguntas frequentes (4), mesmas do JSON-LD `FAQPage`:
  - O que a Inferis faz?
  - Para quem é a Inferis?
  - Como funciona o teste gratuito?
  - Os resultados são definitivos?

## `/reforma-tributaria/compras/`

Prévia: https://inferis-site.vercel.app/reforma-tributaria/compras/

- [ ] Título: Reforma Tributária nas compras: crédito CBS e IBS | Inferis
- [ ] H1: Reforma Tributária para compras.
- [ ] Seções, nesta ordem (7):
  1. O que muda no crédito das compras.
  2. A mesma nota, custo diferente.
  3. Simule uma nota de compra.
  4. O que a Inferis mostra para compras.
  5. Simuladores e documentos aceitos.
  6. Perguntas frequentes.
  7. Simule sua reforma na Inferis.
- [ ] Números grandes: R$ 90,45 · R$ 83,05 · R$ 9,62
- [ ] Simulador ao vivo (1): mudar o valor e conferir que recalcula igual à prévia
- [ ] Telas do sistema (2): giro 3D, marcadores 01–03 acendendo e lupa
- [ ] Perguntas frequentes (5), mesmas do JSON-LD `FAQPage`:
  - O que é o crédito amplo da Reforma Tributária?
  - Quem pode tomar crédito de CBS e IBS a partir de 2027?
  - O que é custo efetivo de uma compra?
  - O que é o preço equivalente de compra 2027?
  - Quais arquivos a Inferis lê?

## `/reforma-tributaria/vendas/`

Prévia: https://inferis-site.vercel.app/reforma-tributaria/vendas/

- [ ] Título: Como precificar na Reforma Tributária com CBS e IBS | Inferis
- [ ] H1: Reforma Tributária para vendas.
- [ ] Seções, nesta ordem (7):
  1. O que muda para quem vende.
  2. Duas referências para o preço de 2027.
  3. Simule uma venda.
  4. O que a Inferis mostra para vendas.
  5. Simuladores e documentos aceitos.
  6. Perguntas frequentes.
  7. Simule sua reforma na Inferis.
- [ ] Números grandes: R$ 64,95 · R$ 90,45 · R$ 104,61
- [ ] Simulador ao vivo (1): mudar o valor e conferir que recalcula igual à prévia
- [ ] Telas do sistema (2): giro 3D, marcadores 01–03 acendendo e lupa
- [ ] Perguntas frequentes (5), mesmas do JSON-LD `FAQPage`:
  - Como precificar com CBS e IBS em 2027?
  - O que é receita líquida antes de IRPJ e CSLL?
  - Por que meu cliente vai olhar o custo efetivo?
  - O que são as duas formas de projetar o preço?
  - A Inferis substitui o ERP?

## `/reforma-tributaria/financeiro/`

Prévia: https://inferis-site.vercel.app/reforma-tributaria/financeiro/

- [ ] Título: Reforma Tributária: capital de giro e split payment | Inferis
- [ ] H1: Reforma Tributária para o financeiro.
- [ ] Seções, nesta ordem (8):
  1. O que muda no caixa.
  2. Mais do que você paga vira crédito.
  3. Oito anos de transição.
  4. Simule o crédito de uma nota.
  5. O que a Inferis projeta para o financeiro.
  6. Simuladores e documentos aceitos.
  7. Perguntas frequentes.
  8. Simule sua reforma na Inferis.
- [ ] Números grandes: 22,33% · 25,74% · R$ 0,17
- [ ] Simulador ao vivo (1): mudar o valor e conferir que recalcula igual à prévia
- [ ] Telas do sistema (2): giro 3D, marcadores 01–03 acendendo e lupa
- [ ] Perguntas frequentes (5), mesmas do JSON-LD `FAQPage`:
  - Como a Reforma Tributária afeta o capital de giro?
  - Quando nasce o crédito de CBS e IBS?
  - A CBS e o IBS vão entrar na base do ICMS?
  - O que muda em 2026?
  - Consigo exportar os resultados?

## `/reforma-tributaria/contadores/`

Prévia: https://inferis-site.vercel.app/reforma-tributaria/contadores/

- [ ] Título: Reforma Tributária para contadores: Simples híbrido | Inferis
- [ ] H1: Reforma Tributária para contadores.
- [ ] Seções, nesta ordem (7):
  1. Quem passa a tomar crédito em 2027.
  2. O cálculo aberto, linha a linha.
  3. O que a Inferis entrega para cada cliente.
  4. Simule uma nota do seu cliente.
  5. Simuladores e documentos aceitos.
  6. Perguntas frequentes.
  7. Simule sua reforma na Inferis.
- [ ] Simulador ao vivo (1): mudar o valor e conferir que recalcula igual à prévia
- [ ] Telas do sistema (2): giro 3D, marcadores 01–03 acendendo e lupa
- [ ] Perguntas frequentes (5), mesmas do JSON-LD `FAQPage`:
  - Como calcular o valor líquido da NT 2026.008?
  - Quais clientes passam a tomar crédito em 2027?
  - A Inferis ajuda na decisão do regime híbrido do Simples?
  - Consigo atender vários clientes?
  - A Inferis faz apuração ou escrituração?

## `/reforma-tributaria/advogados/`

Prévia: https://inferis-site.vercel.app/reforma-tributaria/advogados/

- [ ] Título: Reforma Tributária para advogados: contratos e 2027 | Inferis
- [ ] H1: Reforma Tributária para advogados.
- [ ] Seções, nesta ordem (8):
  1. O que o cliente pergunta, a Inferis responde.
  2. Um diagnóstico em números.
  3. E nos contratos, duas referências.
  4. O que a Inferis entrega ao tributarista.
  5. Simuladores e documentos aceitos.
  6. Simule o preço de um contrato.
  7. Perguntas frequentes.
  8. Simule sua reforma na Inferis.
- [ ] Números grandes: 35,05% · 28,19% · 25,74% · R$ 90,45 · R$ 104,61 · R$ 10,50
- [ ] Simulador ao vivo (1): mudar o valor e conferir que recalcula igual à prévia
- [ ] Telas do sistema (2): giro 3D, marcadores 01–03 acendendo e lupa
- [ ] Perguntas frequentes (6), mesmas do JSON-LD `FAQPage`:
  - Como a Inferis ajuda o advogado tributarista?
  - Que impactos da Reforma a Inferis mostra?
  - Contratos de 2026 precisam ser renegociados para 2027?
  - As premissas do cálculo ficam documentadas?
  - A Inferis substitui o parecer?
  - Consigo atender vários clientes do escritório?

## `/reforma-tributaria/como-calcular/`

Prévia: https://inferis-site.vercel.app/reforma-tributaria/como-calcular/

- [ ] Título: Calculadora da Reforma Tributária: CBS e IBS 2027 | Inferis
- [ ] H1: Reforma Tributária: como calcular.
- [ ] Seções, nesta ordem (6):
  1. Quatro passos, da nota a 2027.
  2. O extrato completo.
  3. Simule a sua nota.
  4. Simuladores e documentos aceitos.
  5. Perguntas frequentes.
  6. Simule sua reforma na Inferis.
- [ ] Simulador ao vivo (1): mudar o valor e conferir que recalcula igual à prévia
- [ ] Telas do sistema (2): giro 3D, marcadores 01–03 acendendo e lupa
- [ ] Perguntas frequentes (5), mesmas do JSON-LD `FAQPage`:
  - Por que o ICMS por dentro tem alíquota efetiva maior que 18%?
  - Por que o ICMS sai da base de PIS e COFINS?
  - Qual alíquota de CBS usar em 2027?
  - Como fica a base do ICMS em 2027?
  - O que é por dentro e por fora?

## `/reforma-tributaria/simulador-nf-e/`

Prévia: https://inferis-site.vercel.app/reforma-tributaria/simulador-nf-e/

- [ ] Título: Simulador da Reforma Tributária para NF-e (bens) | Inferis
- [ ] H1: Simulador de Bens NF-e .
- [ ] Seções, nesta ordem (8):
  1. O que a Inferis lê em cada NF-e .
  2. Um lote real, hoje e em 2027.
  3. O cálculo de cada item.
  4. Simule uma nota de compra.
  5. O que o Simulador de Bens entrega.
  6. Simuladores e documentos aceitos.
  7. Perguntas frequentes.
  8. Simule sua reforma na Inferis.
- [ ] Números grandes: R$ 457.390,12 · R$ 465.453,17 · R$ 493.789,35
- [ ] Simulador ao vivo (1): mudar o valor e conferir que recalcula igual à prévia
- [ ] Telas do sistema (2): giro 3D, marcadores 01–03 acendendo e lupa
- [ ] Perguntas frequentes (5), mesmas do JSON-LD `FAQPage`:
  - O que o Simulador de Bens calcula?
  - Quais tributos da NF-e entram na simulação?
  - Qual alíquota de CBS o simulador usa?
  - E as notas de fornecedores do Simples Nacional?
  - Preciso integrar com o ERP?

## `/reforma-tributaria/simulador-nfs-e/`

Prévia: https://inferis-site.vercel.app/reforma-tributaria/simulador-nfs-e/

- [ ] Título: Simulador da Reforma Tributária para NFS-e (serviços) | Inferis
- [ ] H1: Simulador de Serviços NFS-e .
- [ ] Seções, nesta ordem (6):
  1. O que muda na nota de serviço.
  2. Dois cenários para 2027.
  3. O que o Simulador de Serviços entrega.
  4. Simuladores e documentos aceitos.
  5. Perguntas frequentes.
  6. Simule sua reforma na Inferis.
- [ ] Telas do sistema (1): giro 3D, marcadores 01–03 acendendo e lupa
- [ ] Perguntas frequentes (5), mesmas do JSON-LD `FAQPage`:
  - O que muda na NFS-e com a Reforma Tributária?
  - O ISS acaba em 2027?
  - Quais são os dois cenários do Simulador de Serviços?
  - Quem pode tomar crédito de CBS e IBS sobre serviços?
  - E os serviços prestados por empresas do Simples Nacional?

## `/reforma-tributaria/simulador-ct-e/`

Prévia: https://inferis-site.vercel.app/reforma-tributaria/simulador-ct-e/

- [ ] Título: Simulador da Reforma Tributária para CT-e (fretes) | Inferis
- [ ] H1: Simulador de Transportes CT-e .
- [ ] Seções, nesta ordem (6):
  1. O que muda no frete.
  2. O regime do transportador muda a conta.
  3. O que o Simulador de Transportes entrega.
  4. Simuladores e documentos aceitos.
  5. Perguntas frequentes.
  6. Simule sua reforma na Inferis.
- [ ] Números grandes: 3,65% · 9,25% · 2
- [ ] Telas do sistema (1): giro 3D, marcadores 01–03 acendendo e lupa
- [ ] Perguntas frequentes (5), mesmas do JSON-LD `FAQPage`:
  - O que muda no CT-e com a Reforma Tributária?
  - Por que o regime do transportador importa?
  - E se eu não souber o regime do transportador?
  - O ICMS do frete acaba em 2027?
  - E os transportadores do Simples Nacional?

## Depois de publicar

- [ ] PageSpeed Insights no celular: LCP < 2,5 s, INP < 200 ms, CLS < 0,1
- [ ] Rich Results Test e validator.schema.org sem erros
- [ ] `https://inferis.com.br/sitemap.xml` e `/robots.txt` respondendo (hoje dão 404)
- [ ] Search Console: sitemap enviado e as 10 URLs com indexação pedida
- [ ] Bing Webmaster Tools importado e IndexNow disparado
- [ ] Pré-visualização de links (LinkedIn Post Inspector, debugger do Facebook)
