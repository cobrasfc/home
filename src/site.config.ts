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

// MiniRoos Gala Day — 19 September 2026.
// TODO before launch: replace `registrationApiUrl` with the deployed Power Automate flow's HTTP trigger URL.
// Setup: see the README section "MiniRoos Gala Day registration".
// Registrations are stored in an Excel table in the club's own OneDrive — no third-party service, no account signup.
// The committee views them at /gala-day/dashboard (password-gated, not linked in the site nav).
export const GALA_DAY = {
	name: 'MiniRoos Gala Day',
	dateLabel: 'Saturday 19 September 2026',
	isoDate: '2026-09-19',
	groundName: 'Metford Recreation Reserve No. 1',
	addressLine: 'Schanck Drive, Metford, New South Wales',
	minGames: 3,
	hostClubName: 'Metford Cobras FC',
	registrationApiUrl: 'https://script.google.com/macros/s/REPLACE_WITH_DEPLOYMENT_ID/exec',
	ageGroups: [
		{ id: 'u6-7', label: 'Under 6s & 7s', shortLabel: 'U6/U7', fee: 150, maxPlayers: 6 },
		{ id: 'u8-9', label: 'Under 8s & 9s', shortLabel: 'U8/U9', fee: 250, maxPlayers: 9 },
		{ id: 'u10-11', label: 'Under 10s & 11s', shortLabel: 'U10/U11', fee: 300, maxPlayers: 11 },
		{ id: 'u12', label: 'Under 12s', shortLabel: 'U12', fee: 350, maxPlayers: 16 }
	]
} as const;

export type GalaDayAgeGroup = (typeof GALA_DAY.ageGroups)[number];
