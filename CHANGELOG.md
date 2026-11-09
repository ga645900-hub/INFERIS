# Histórico de versões

Cada versão é um commit com tag no repositório. Para ver tudo o que mudou entre duas versões: `git diff v1 v2 --stat` e `git diff v1 v2 -- prototipo/`.

## v1 — 09/11/2026

Primeira entrega completa do novo site, aprovada pela Inferis e idêntica à prévia https://inferis-site.vercel.app.

- 10 rotas indexáveis: hub (`/`), seis páginas por público (compras, vendas, financeiro, contadores, advogados, como calcular) e três simuladores (NF-e, NFS-e, CT-e), com metadados, JSON-LD, sitemap, robots, imagens de compartilhamento e `llms.txt`.
- Barra fixa de simuladores e documentos aceitos abaixo do menu; seção "Simuladores e documentos aceitos" em todas as páginas.
- Bloco didático dos números (R$ 100,00 → R$ 64,95 → R$ 90,45): título e conta de cada número, barras hoje x 2027 com cores validadas para daltonismo, extrato em três passos.
- Simulador ao vivo em cada página, com a mesma conta de `referencia/calc_inferis.py`.
- Botão flutuante do WhatsApp com mensagem pronta indicando a página de origem.
- Seção da home renomeada de "O produto, por dentro" para **"Por dentro da nossa solução"**.
- Fluidez: nenhuma cena fixa a tela na rolagem; números, extrato e telas do sistema tocam sozinhos ao aparecer; rede 3D mais leve. Regras na seção 5 do `README.md`.
