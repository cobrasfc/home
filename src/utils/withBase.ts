export function withBase(path: string): string {
	let base = import.meta.env.BASE_URL || '/';

	if (!base.startsWith('/')) base = `/${base}`;
	if (!base.endsWith('/')) base = `${base}/`;

	if (!path || path === '/') return base;

	if (path.startsWith('/')) return base + path.slice(1);

	return base + path;
}
