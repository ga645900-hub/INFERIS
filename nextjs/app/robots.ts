// /robots.txt gerado pelo Next.js (substitui o 404 atual).
// Um grupo só para todos os robôs: cada robô obedece apenas ao grupo que o cita, então separar grupos
// faria os bots de IA ignorarem as restrições. Buscadores e assistentes de IA ficam liberados nas páginas públicas.
import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: ['*', 'Googlebot', 'Bingbot', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'ClaudeBot', 'Google-Extended'],
      allow: '/',
      disallow: ['/entrar', '/cadastro', '/recuperar-senha', '/contratar'],
    }],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
