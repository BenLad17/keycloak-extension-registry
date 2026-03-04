/** Fetches an anonymous pull token from GHCR for the given image path (owner/repo/...). */
export async function getGhcrToken(imagePath: string): Promise<string> {
	const res = await fetch(
		`https://ghcr.io/token?service=ghcr.io&scope=repository:${imagePath}:pull`
	);
	if (!res.ok) throw new Error(`GHCR token fetch failed: ${res.status}`);
	const { token } = (await res.json()) as { token: string };
	return token;
}
