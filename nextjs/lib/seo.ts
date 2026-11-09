// Dados de SEO por rota (gerados a partir do protótipo aprovado). Fonte: ./seo.json
import type { Metadata } from 'next';
import data from './seo.json';

export const SITE = 'https://inferis.com.br';
export const PUBLICOS = ['compras', 'vendas', 'financeiro', 'contadores', 'advogados', 'como-calcular', 'simulador-nf-e', 'simulador-nfs-e', 'simulador-ct-e'] as const;
export type Publico = (typeof PUBLICOS)[number];

type Entry = { path: string; title: string; description: string; canonical: string; ogImage: string; h1: string; jsonLd: unknown };
const SEO = data as Record<string, Entry>;

export function seoFor(key: Publico | '/'): Entry {
  return SEO[key];
}

export function metadataFor(key: Publico | '/'): Metadata {
  const e = seoFor(key);
  return {
    title: { absolute: e.title },
    description: e.description,
    alternates: { canonical: e.canonical, languages: { 'pt-BR': e.canonical } },
    robots: { index: true, follow: true, googleBot: { 'max-image-preview': 'large', 'max-snippet': -1 } },
    openGraph: {
      type: 'website', locale: 'pt_BR', siteName: 'Inferis', url: e.canonical, title: e.title, description: e.description,
      images: [{ url: e.ogImage, width: 1200, height: 630, alt: e.title }],
    },
    twitter: { card: 'summary_large_image', title: e.title, description: e.description, images: [e.ogImage] },
    icons: { icon: [{ url: '/favicon-32.png', sizes: '32x32' }], apple: '/apple-touch-icon.png' },
    other: { 'theme-color': '#05040E' },
  };
}
