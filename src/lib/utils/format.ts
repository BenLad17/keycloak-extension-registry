import { marked } from 'marked';
import { emojify } from 'node-emoji';

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

export function formatDate(date: Date | string | null): string {
	if (!date) return '—';
	return new Date(date).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});
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

export function renderNotes(notes: string): string {
	return String(marked(emojify(notes)));
}
