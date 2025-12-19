export function withBase(path: string): string {
	const base = import.meta.env.BASE_URL;

	if (!path || path === '/') return base;

	if (path.startsWith('/')) return base + path.slice(1);

	return base + path;
}
