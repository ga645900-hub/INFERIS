// Dados estruturados (schema.org) em um único grafo por página: Organization, WebSite, WebPage, BreadcrumbList, FAQPage
// (+ SoftwareApplication na home). Renderizado no servidor, dentro do <body>.
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // o conteúdo é nosso (seo.json), não vem do usuário
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
