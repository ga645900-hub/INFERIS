// Rota de cada público: /reforma-tributaria/compras/, /vendas/, /financeiro/, /contadores/, /advogados/, /como-calcular/
// Gerada estaticamente (SSG). O conteúdo (textos, seções, simulador, telas) está no protótipo: prototipo/reforma-tributaria/<publico>/index.html
import { notFound } from 'next/navigation';
import { PUBLICOS, type Publico, metadataFor, seoFor } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';

export const dynamicParams = false;

export function generateStaticParams() {
  return PUBLICOS.map((publico) => ({ publico }));
}

export async function generateMetadata({ params }: { params: Promise<{ publico: string }> }) {
  const { publico } = await params;
  if (!PUBLICOS.includes(publico as Publico)) return {};
  return metadataFor(publico as Publico);
}

export default async function Page({ params }: { params: Promise<{ publico: string }> }) {
  const { publico } = await params;
  if (!PUBLICOS.includes(publico as Publico)) notFound();
  const seo = seoFor(publico as Publico);
  return (
    <>
      <JsonLd data={seo.jsonLd} />
      {/* TODO Yeti: portar as seções do protótipo para componentes. Manter UM <h1> por página: */}
      {/* <h1>{seo.h1}</h1> ... */}
    </>
  );
}
