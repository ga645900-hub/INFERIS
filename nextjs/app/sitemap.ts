// /sitemap.xml gerado pelo Next.js (substitui o 404 atual). Atualize lastModified quando o conteúdo mudar.
import type { MetadataRoute } from 'next';
import { PUBLICOS, SITE } from '@/lib/seo';

const UPDATED = new Date('2026-11-07');

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE}/`, lastModified: UPDATED, images: [`${SITE}/og/home.jpg`] },
    ...PUBLICOS.map((p) => ({ url: `${SITE}/reforma-tributaria/${p}/`, lastModified: UPDATED, images: [`${SITE}/og/${p}.jpg`] })),
  ];
}
