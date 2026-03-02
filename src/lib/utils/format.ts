import { marked } from 'marked';
import { emojify } from 'node-emoji';

// Returns a plain string during SSR (no locale applied) and a locale-formatted
// string on the client. Use only in contexts where a one-time hydration update
// is acceptable, e.g. stats counters that are not critical content.
export function formatNumber(n: number): string {
	if (typeof window === 'undefined') return n.toString();
	return new Intl.NumberFormat().format(n);
}

export function formatCount(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
	return n.toString();
}

export function formatSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Same SSR/client split as formatNumber - returns ISO date on the server and a
// locale-formatted date on the client. One-time hydration flicker is acceptable.
export function formatDate(date: Date | string | null): string {
	if (!date) return '-';
	const d = new Date(date);
	if (typeof window === 'undefined') return d.toISOString().slice(0, 10);
	return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function timeAgo(date: Date | string | null): string {
	if (!date) return 'never';
	const diff = Date.now() - new Date(date).getTime();
	const days = Math.floor(diff / 86_400_000);
	if (days === 0) return 'today';
	if (days === 1) return 'yesterday';
	if (days < 30) return `${days} days ago`;
	const months = Math.floor(days / 30);
	if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
	const years = Math.floor(months / 12);
	return `${years} year${years > 1 ? 's' : ''} ago`;
}

/**
 * Strip the most dangerous XSS vectors from an HTML string.
 * Used after running markdown through marked(), which does not sanitize by default.
 * Not a full allowlist sanitizer - covers script injection, event handlers, and
 * javascript: URLs which are the primary attack surface for user-supplied READMEs.
 */
function sanitizeHtml(html: string): string {
	return (
		html
			// Remove <script> blocks and their content entirely.
			.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
			// Remove inline event handlers (onclick=, onload=, etc.).
			.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
			// Neutralise javascript: in href / src / action attributes.
			.replace(/(href|src|action)\s*=\s*(['"]?)\s*javascript:[^'">\s]*/gi, '$1=$2#')
	);
}

export function renderMarkdown(markdown: string): string {
	return sanitizeHtml(String(marked(emojify(markdown))));
}

export const renderNotes = renderMarkdown;
