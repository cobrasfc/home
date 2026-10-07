export const SITE = {
	name: 'Metford Cobras FC',
	description:
		'Community football club in Metford — a family-friendly place to play, volunteer, and support local sport.',
	mailchimpSubscribeUrl: 'https://mailchi.mp/795cf90e5c99/metford-cobras-fc-expression-of-interest',
	facebookUrl: 'https://www.facebook.com/metfordcobrasfc/',
	contact: {
		email: 'metfordcobrasfootballclub@gmail.com',
		phone: '0431 586 446'
	},
	location: {
		groundName: 'Metford Recreation Reserve No. 1',
		addressLine: 'Schanck Drive, Metford, New South Wales',
		trainingInfo: 'Training nights and details vary by team — contact us to confirm.'
	}
} as const;

// MiniRoos Gala Day — 26 September 2026.
// Setup: see google-apps-script/gala-day-registrations.gs + the README section "MiniRoos Gala Day registration".
// Registrations are stored in a Google Sheet the club owns — no third-party service, no account signup.
// The committee views them at /gala-day/dashboard (password-gated, not linked in the site nav).
export const GALA_DAY = {
	name: 'MiniRoos Gala Day',
	dateLabel: 'Saturday 26 September 2026, 9am – 4pm',
	isoDate: '2026-09-26',
	groundName: 'Metford Recreation Reserve No. 1',
	addressLine: 'Schanck Drive, Metford, New South Wales',
	minGames: 3,
	hostClubName: 'Metford Cobras FC',
	registrationApiUrl: 'https://script.google.com/macros/s/AKfycbyJYEg-iecZFiZVuJmvvcXNrYxQWp2_SQjQiZuPx2O-78wu4PTXutuTXXWaXZIskYtX_A/exec',
	ageGroups: [
		{ id: 'u6-7', label: 'Under 6s & 7s', shortLabel: 'U6/U7', fee: 150, maxPlayers: 6 },
		{ id: 'u8-9', label: 'Under 8s & 9s', shortLabel: 'U8/U9', fee: 250, maxPlayers: 9 },
		{ id: 'u10-11', label: 'Under 10s & 11s', shortLabel: 'U10/U11', fee: 300, maxPlayers: 11 },
		{ id: 'u12', label: 'Under 12s', shortLabel: 'U12', fee: 350, maxPlayers: 16 }
	]
} as const;

export type GalaDayAgeGroup = (typeof GALA_DAY.ageGroups)[number];

// Summer Comp 2026 — registrations are through PlayFootball (one product per division, separate products for
// players who were / weren't registered in Winter 2026). Each `url` is that division's PlayFootball product page;
// a division with an empty url shows "Link coming shortly" instead of a button.
export const SUMMER_COMP = {
	name: 'Metford Cobras Summer Comp 2026',
	weeks: 10,
	adultsStart: 'Mondays from 12 October',
	juniorsStart: 'Tuesdays from 13 October',
	divisions: [
		{ id: '5-7', label: '5–7 years', fee: 80 },
		{ id: '8-11', label: '8–11 years', fee: 90 },
		{ id: '12-18', label: '12–18 years', fee: 120 },
		{ id: 'seniors', label: 'Seniors 19+', fee: 130 }
	],
	registration: {
		// Played in Winter 2026
		registered: {
			'5-7': { url: 'https://registration.playfootball.com.au/participant/product-details/66200101' },
			'8-11': { url: 'https://registration.playfootball.com.au/participant/product-details/66200103' },
			'12-18': { url: 'https://registration.playfootball.com.au/participant/product-details/66200104' },
			seniors: { url: 'https://registration.playfootball.com.au/participant/product-details/66200047' }
		},
		// Did not play in Winter 2026
		unregistered: {
			'5-7': { url: 'https://registration.playfootball.com.au/participant/product-details/66200100' },
			'8-11': { url: 'https://registration.playfootball.com.au/participant/product-details/66200102' },
			'12-18': { url: 'https://registration.playfootball.com.au/participant/product-details/66200105' },
			seniors: { url: 'https://registration.playfootball.com.au/participant/product-details/66200046' }
		}
	}
} as const;

// Summer 6's dual registration — extra fee for players already registered (via the separate rego service)
// who also want to play in the Mixed comp alongside Men's/Women's. Payment is a Square payment link
// created in Square Dashboard → Payment Links (API-created links are single-use, so don't replace it with one). Square's checkout collects name, email and phone, plus two custom
// fields for the team names. Payments + details appear in Square Dashboard → Transactions / Orders.
export const SUMMER_DUAL_REGISTRATION = {
	name: 'Summer Soccer Dual Registration',
	fee: 30,
	paymentLinkUrl: 'https://square.link/u/HBIuX44e'
} as const;

// Summer Soccer schedule tracker — /summer-soccer/schedule (setup: README "Summer Soccer schedule tracker").
// Fixtures are read at runtime from a Google Sheet the club maintains, so fixture changes never need a rebuild.
export const SUMMER_SCHEDULE = {
	seasonName: 'Summer Soccer 2026',
	// Google Sheet → File → Share → Publish to web → pick the fixtures tab → "Comma-separated values (.csv)" → Publish.
	// Paste that link here. While this is empty the page shows the preview fixtures below, with a banner.
	sheetCsvUrl: '',
	// Preview fixtures (the draft draw from generate_draw.py) + the banner shown above them
	sampleCsvPath: '/summer-soccer/draft-fixtures.csv',
	// Banner shown above the fixtures while they come from sampleCsvPath. Empty = no banner (club, 7 Oct 2026).
	sampleNotice: '',
	// Shown at the bottom of the schedule page
	terms: {
		heading: 'Schedule subject to change',
		text: [
			'Fixtures, kick-off times and fields may change, sometimes at short notice — for example because of the weather, ground closures or team changes. This page always shows the latest schedule.',
			'If a change affects your game, we will make every effort to let your team contact know as soon as possible.'
		]
	},
	timeZone: 'Australia/Sydney',
	// How often an open page re-checks the sheet for changes
	refreshMinutes: 5,
	// A time typed without am/pm (e.g. "6:30") is read as pm — every Summer Soccer game is in the evening.
	// A warning is still logged in the browser console so the sheet can be fixed.
	bareTimesArePm: true,
	venue: {
		// Used in calendar events. Replace if Summer Soccer moves grounds.
		name: SITE.location.groundName,
		address: SITE.location.addressLine
	},
	support: {
		// "Something doesn't look right?" contacts. Swap in dedicated Summer Soccer contacts when supplied.
		email: SITE.contact.email,
		facebookUrl: SITE.facebookUrl
	},
	acknowledgement: {
		text: 'Supported by Northern NSW Football',
		// Optional link/logo for the footer acknowledgement (kept deliberately small). Leave empty for text only.
		url: '',
		logoPath: ''
	}
} as const;
