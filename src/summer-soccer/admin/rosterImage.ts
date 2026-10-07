// Draws one night's games as a PNG for social media: club logo, round, day and date at the top, then each kick-off
// time with its games (field, competition, teams). Plain canvas drawing, so no extra libraries.

export interface RosterGame {
	start: string;
	field: string;
	comp: string;
	colour: string;
	team1: string;
	team2: string;
	/** e.g. "Pitch Please to wear bibs (supplied by Cobras)" */
	note: string;
}

export interface Roster {
	round: number;
	/** "Monday 12 October" */
	dateLabel: string;
	games: RosterGame[];
	byes: { team: string; comp: string }[];
	logoUrl: string;
	siteUrl: string;
}

const W = 1080;
const PAD = 48;
const BLUE = '#253d97';
const YELLOW = '#ecdd14';
const INK = '#14213d';
const MUTED = '#5b6478';
const FONT = 'Poppins, system-ui, sans-serif';

const font = (weight: number, size: number) => `${weight} ${size}px ${FONT}`;

async function loadLogo(url: string): Promise<HTMLImageElement | null> {
	try {
		// The SVG has a viewBox only; give it a size so every browser rasterises it crisply
		const svg = (await (await fetch(url)).text()).replace('<svg ', '<svg width="1210" height="1437" ');
		const img = new Image();
		img.src = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
		await img.decode();
		return img;
	} catch {
		return null;
	}
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
	ctx.beginPath();
	ctx.roundRect(x, y, w, h, r);
}

/** Largest font size (down to `min`) at which `text` fits in `maxWidth` */
function fitSize(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, min: number, maxWidth: number) {
	for (let s = size; s > min; s -= 1) {
		ctx.font = font(weight, s);
		if (ctx.measureText(text).width <= maxWidth) return s;
	}
	return min;
}

/** Truncate with an ellipsis if it still doesn't fit at the smallest size */
function clip(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
	if (ctx.measureText(text).width <= maxWidth) return text;
	let t = text;
	while (t.length > 1 && ctx.measureText(t + '…').width > maxWidth) t = t.slice(0, -1);
	return t.trimEnd() + '…';
}

const HEADER = 280;
const FOOTER = 84;
const GAP = 24;
const CARD = 124;
const NOTE = 30;
const GROUP_HEAD = 64;

const cardHeight = (g: RosterGame) => CARD + (g.note ? NOTE : 0);
const bibNote = (note: string) => 'Bibs: ' + note.replace(/^Colour clash: /, '').replace(/ to wear bibs.*$/, '');

/** Wrap `text` to lines no wider than `maxWidth`, breaking at " · " separators */
function wrap(ctx: CanvasRenderingContext2D, parts: string[], maxWidth: number) {
	const lines: string[] = [];
	let line = '';
	for (const p of parts) {
		const next = line ? `${line}  ·  ${p}` : p;
		if (line && ctx.measureText(next).width > maxWidth) {
			lines.push(line);
			line = p;
		} else line = next;
	}
	if (line) lines.push(line);
	return lines;
}

function drawCard(ctx: CanvasRenderingContext2D, g: RosterGame, x: number, y: number, w: number) {
	ctx.fillStyle = '#fff';
	roundRect(ctx, x, y, w, cardHeight(g) - 12, 18);
	ctx.fill();

	// Field badge
	const num = g.field.replace(/^Field\s*/i, '');
	ctx.fillStyle = BLUE;
	roundRect(ctx, x + 14, y + 14, 78, 84, 12);
	ctx.fill();
	ctx.textAlign = 'center';
	ctx.fillStyle = YELLOW;
	ctx.font = font(500, 15);
	ctx.fillText('FIELD', x + 53, y + 40);
	ctx.fillStyle = '#fff';
	ctx.font = font(700, 40);
	ctx.fillText(num, x + 53, y + 84);

	// Competition chip
	const tx = x + 110;
	const maxW = x + w - 16 - tx;
	ctx.font = font(500, 17);
	const chipW = Math.max(64, ctx.measureText(g.comp).width + 24);
	ctx.fillStyle = g.colour;
	roundRect(ctx, tx, y + 12, chipW, 28, 14);
	ctx.fill();
	ctx.fillStyle = '#fff';
	ctx.fillText(g.comp, tx + chipW / 2, y + 32);
	ctx.textAlign = 'left';

	// Teams, one per line
	ctx.fillStyle = INK;
	let size = fitSize(ctx, g.team1, 500, 28, 19, maxW);
	ctx.font = font(500, size);
	ctx.fillText(clip(ctx, g.team1, maxW), tx, y + 70);
	ctx.fillStyle = MUTED;
	ctx.font = font(400, 22);
	ctx.fillText('v', tx, y + 102);
	const vw = ctx.measureText('v ').width + 4;
	ctx.fillStyle = INK;
	size = fitSize(ctx, g.team2, 500, 28, 19, maxW - vw);
	ctx.font = font(500, size);
	ctx.fillText(clip(ctx, g.team2, maxW - vw), tx + vw, y + 102);

	if (g.note) {
		ctx.fillStyle = MUTED;
		ctx.font = font(400, 19);
		ctx.fillText(clip(ctx, bibNote(g.note), w - 28), x + 14, y + CARD + 8);
	}
}

export async function drawRoster(r: Roster): Promise<HTMLCanvasElement> {
	await Promise.all([document.fonts.load(font(700, 40)), document.fonts.load(font(500, 30)), document.fonts.load(font(400, 24))]);
	const logo = await loadLogo(r.logoUrl);

	// Each kick-off time gets a column when there are two (the usual night); otherwise one column
	const times = [...new Set(r.games.map((g) => g.start))];
	const columns = times.length === 2 ? times.map((t) => [t]) : [times];
	const colW = (W - PAD * 2 - GAP * (columns.length - 1)) / columns.length;
	const colHeight = (ts: string[]) =>
		ts.reduce((h, t) => h + GROUP_HEAD + r.games.filter((g) => g.start === t).reduce((a, g) => a + cardHeight(g), 0), 0);

	const measure = document.createElement('canvas').getContext('2d')!;
	measure.font = font(400, 24);
	const byeLines = r.byes.length ? wrap(measure, r.byes.map((b) => `${b.team} (${b.comp})`), W - PAD * 2) : [];
	const body = Math.max(...columns.map(colHeight)) + (byeLines.length ? 52 + byeLines.length * 34 : 0);
	// At least 4:5 (1080 × 1350), the tallest shape Instagram and Facebook show uncropped in the feed
	const H = Math.max(1350, HEADER + 28 + body + 24 + FOOTER);

	const canvas = document.createElement('canvas');
	canvas.width = W;
	canvas.height = H;
	const ctx = canvas.getContext('2d')!;

	ctx.fillStyle = '#f3f5fb';
	ctx.fillRect(0, 0, W, H);

	// Header band
	ctx.fillStyle = BLUE;
	ctx.fillRect(0, 0, W, HEADER);
	ctx.fillStyle = YELLOW;
	ctx.fillRect(0, HEADER - 12, W, 12);
	const logoH = 196;
	const logoW = logo ? (logo.naturalWidth / logo.naturalHeight) * logoH : 0;
	if (logo) ctx.drawImage(logo, PAD, (HEADER - 12 - logoH) / 2, logoW, logoH);
	const tx = PAD + (logo ? logoW + 40 : 0);
	ctx.fillStyle = YELLOW;
	ctx.font = font(500, 26);
	ctx.fillText('METFORD COBRAS FC · SUMMER SOCCER', tx, 86);
	ctx.fillStyle = '#fff';
	ctx.font = font(700, 88);
	ctx.fillText(`Round ${r.round}`, tx, 172);
	ctx.font = font(500, 38);
	ctx.fillText(r.dateLabel, tx, 226);

	// Games
	const top = HEADER + 28;
	columns.forEach((ts, i) => {
		const x = PAD + i * (colW + GAP);
		let y = top;
		for (const time of ts) {
			ctx.fillStyle = BLUE;
			ctx.font = font(700, 34);
			ctx.fillText(time, x, y + 40);
			const tw = ctx.measureText(time).width;
			ctx.fillStyle = 'rgba(37, 61, 151, 0.2)';
			ctx.fillRect(x + tw + 20, y + 28, colW - tw - 20, 3);
			y += GROUP_HEAD;
			for (const g of r.games.filter((x) => x.start === time)) {
				drawCard(ctx, g, x, y, colW);
				y += cardHeight(g);
			}
		}
	});

	// Byes
	if (byeLines.length) {
		let y = top + Math.max(...columns.map(colHeight)) + 4;
		ctx.fillStyle = BLUE;
		ctx.font = font(700, 26);
		ctx.fillText('Byes this round', PAD, y + 30);
		y += 52;
		ctx.fillStyle = INK;
		ctx.font = font(400, 24);
		for (const line of byeLines) {
			ctx.fillText(line, PAD, y + 24);
			y += 34;
		}
	}

	// Footer
	ctx.fillStyle = BLUE;
	ctx.fillRect(0, H - FOOTER, W, FOOTER);
	ctx.fillStyle = '#fff';
	ctx.font = font(500, 26);
	ctx.textAlign = 'center';
	ctx.fillText(`Find your team's games: ${r.siteUrl}`, W / 2, H - FOOTER / 2 + 9);
	ctx.textAlign = 'left';
	return canvas;
}

/** Share the image where the device can (phones), otherwise download it */
export async function saveRoster(r: Roster, fileName: string) {
	const canvas = await drawRoster(r);
	const blob = await new Promise<Blob>((ok, fail) => canvas.toBlob((b) => (b ? ok(b) : fail(new Error('No image'))), 'image/png'));
	const file = new File([blob], fileName, { type: 'image/png' });
	const touch = matchMedia('(pointer: coarse)').matches;
	if (touch && navigator.canShare?.({ files: [file] })) {
		try {
			await navigator.share({ files: [file] });
			return;
		} catch (e) {
			if ((e as Error).name === 'AbortError') return;
		}
	}
	const a = document.createElement('a');
	a.href = URL.createObjectURL(blob);
	a.download = fileName;
	document.body.append(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
}
