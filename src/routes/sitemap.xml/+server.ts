import type { RequestHandler } from '@sveltejs/kit';
import { extension, getDatabase } from '$lib/server/db';
import { eq } from 'drizzle-orm';

const STATIC_PATHS: Array<{ path: string; changefreq: string }> = [
	{ path: '/', changefreq: 'weekly' },
	{ path: '/explore', changefreq: 'daily' },
	{ path: '/publish', changefreq: 'monthly' },
	{ path: '/docs', changefreq: 'monthly' },
	{ path: '/docs/quickstart', changefreq: 'monthly' },
	{ path: '/docs/configuration', changefreq: 'monthly' },
	{ path: '/docs/faq', changefreq: 'monthly' }
];

function urlEntry(loc: string, opts: { lastmod?: string; changefreq: string }): string {
	const lines = [
		'  <url>',
		`    <loc>${loc}</loc>`,
		`    <changefreq>${opts.changefreq}</changefreq>`
	];
	if (opts.lastmod) lines.push(`    <lastmod>${opts.lastmod}</lastmod>`);
	lines.push('  </url>');
	return lines.join('\n');
}

export const GET: RequestHandler = async ({ platform, url }) => {
	const db = getDatabase(platform);
	const origin = url.origin;

	const extensions = await db
		.select({ slug: extension.slug, updatedAt: extension.updatedAt })
		.from(extension)
		.where(eq(extension.status, 'active'));

	const entries = [
		...STATIC_PATHS.map(({ path, changefreq }) => urlEntry(`${origin}${path}`, { changefreq })),
		...extensions.map((ext) =>
			urlEntry(`${origin}/extension/${ext.slug}`, {
				changefreq: 'daily',
				lastmod: ext.updatedAt.toISOString().split('T')[0]
			})
		)
	];

	const body = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		...entries,
		'</urlset>'
	].join('\n');

	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
