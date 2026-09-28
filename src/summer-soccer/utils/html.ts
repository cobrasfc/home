const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escape text for safe insertion into HTML — every sheet value goes through this. */
export function esc(value: string | number | null | undefined): string {
	return String(value ?? '').replace(/[&<>"']/g, (ch) => ESCAPES[ch]);
}
