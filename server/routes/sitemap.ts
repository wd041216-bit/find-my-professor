import { Router } from 'express';

const router = Router();

/**
 * Generate sitemap.xml for SEO
 * Lists all public pages for search engine crawlers
 */
router.get('/sitemap.xml', (_req, res) => {
  const baseUrl = 'https://findmyprofessor.xyz';
  const currentDate = new Date().toISOString().split('T')[0];

  const urls = [
    { loc: '/', changefreq: 'daily', priority: '1.0' },
    { loc: '/about', changefreq: 'monthly', priority: '0.8' },
    { loc: '/privacy', changefreq: 'yearly', priority: '0.5' },
    { loc: '/terms', changefreq: 'yearly', priority: '0.5' },
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${baseUrl}${url.loc}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  res.header('Content-Type', 'application/xml');
  res.send(sitemap);
});

/**
 * Generate robots.txt for SEO
 * Instructs search engine crawlers which pages to index
 */
router.get('/robots.txt', (_req, res) => {
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard/
Disallow: /profile/
Disallow: /history/

Sitemap: https://findmyprofessor.xyz/sitemap.xml`;

  res.header('Content-Type', 'text/plain');
  res.send(robotsTxt);
});

export default router;
