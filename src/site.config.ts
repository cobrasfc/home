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
	// Team links that changed when a team was renamed or merged: old ?teams= id -> current id.
	// Keeps links already shared with families working.
	teamIdAliases: {
		// Grass Goblins (U12–13s) and Rutherford Greens merged, 7 Oct 2026; named Grass Goblins (U12–15s), 8 Oct 2026
		'u12-13s-grass-goblins': 'u12-15s-grass-goblins',
		'u12-15s-rutherford-greens': 'u12-15s-grass-goblins',
		'u12-15s-grass-goblins-rutherford-greens': 'u12-15s-grass-goblins',
		// Cobras Blue renamed Sssstrikers, 8 Oct 2026
		'u6-7s-cobras-blue': 'u6-7s-sssstrikers'
	},
	// Shown under "Your next game" when it's the last game of the night on its field. {field} = e.g. "Field 2".
	packDown: {
		heading: 'Last game on {field} — please help pack down',
		intro: "Your team is the last game of the night on {field}. After your game, could you please:",
		steps: [
			'Carry the goals back to the storage shed (leave them assembled).',
			'Bring the {field} sign, the match ball and the benches back to the shed too.'
		],
		// Added when the game has bibs (a colour-clash note on the fixture)
		bibsStep: 'Return the bibs to the shed as well.',
		thanks: 'Thanks for helping us pack down!'
	},
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

// Annual General Meeting — /agm (setup: google-apps-script/agm-nominations.gs + README "AGM nominations and RSVPs").
// Nominations and RSVPs are emailed to `notifyEmail` in the Apps Script and logged in a Google Sheet the club owns.
// Fill in the empty fields when they're confirmed; until then the page shows "TBA".
export const AGM = {
	// Committee review: while true the page shows a draft banner, is hidden from search engines and isn't linked
	draft: true,
	year: 2026,
	// e.g. 'Wednesday 9 December 2026'
	dateLabel: 'Thursday 3 December 2026',
	monthLabel: 'December 2026',
	// e.g. '6:30pm'
	timeLabel: '6:30pm',
	venueName: 'Easts Bowling Club',
	venueAddress: '',
	// Last day to nominate, e.g. 'Wednesday 2 December 2026'. Empty = "before the meeting".
	nominationsClose: 'Thursday 26 November 2026',
	// Google Apps Script web app /exec URL. While empty, the form opens a pre-filled email to the club instead.
	submissionApiUrl: '',
	agenda: [
		{ title: "President's report", detail: 'A look back at the year and the plans for next season.' },
		{ title: "Secretary's report", detail: 'Club administration, membership and correspondence.' },
		{ title: 'Financial report', detail: "The year's income, spending and the club's financial position." },
		{ title: 'Voting', detail: 'All committee positions are declared vacant and the new committee is elected from the written nominations received.' },
		{ title: 'Open floor', detail: 'Questions and comments from members.' }
	],
	// Each role's card shows `summary` + `duties`. Add `description: { objectives, responsibilities }` to give it a
	// full position description page at /agm/roles/<id> (linked from the card).
	roleGroups: [
		{
			id: 'executive',
			label: 'Executive',
			intro: 'Leads the club and is responsible for its governance, direction and official business.',
			roles: [
				{
					id: 'president',
					title: 'President',
					summary: 'Provides overall leadership and direction for the club.',
					duties: [
						'Chairs committee meetings and the AGM',
						'Sets club priorities with the committee and keeps them on track',
						'Represents the club with the football association, council and sponsors',
						'Supports committee members and volunteers in their roles'
					]
				},
				{
					id: 'vice-president',
					title: 'Vice President',
					summary: 'Supports the President and helps oversee club operations, projects and volunteers.',
					duties: [
						'Chairs meetings and acts for the President when they are unavailable',
						'Leads club projects and events as agreed by the committee',
						'Supports volunteers and committee members',
						'Helps with game day coordination'
					]
				},
				{
					id: 'secretary',
					title: 'Secretary',
					summary: "Handles the club's administration, communications and official correspondence.",
					duties: [
						'Prepares meeting agendas, notices and minutes',
						'Manages club correspondence and the club inbox',
						'Keeps club records and the members register up to date',
						'Coordinates club communications and announcements'
					]
				},
				{
					id: 'treasurer',
					title: 'Treasurer',
					summary: "Manages the club's finances, payments and budgeting.",
					duties: [
						'Keeps the club accounts and bank records up to date',
						'Pays invoices and tracks registration and canteen income',
						'Prepares the budget and regular financial reports for the committee',
						'Presents the financial report at the AGM'
					]
				}
			]
		},
		{
			id: 'office-holders',
			label: 'Office holders',
			intro: 'Look after a specific area of the club and report on it at committee meetings.',
			roles: [
				{
					id: 'canteen-officer',
					title: 'Canteen Officer',
					summary: 'Runs the canteen so game days and events are fed and funded.',
					duties: [
						'Manages canteen stock, ordering and pricing',
						'Rosters canteen volunteers for game days and events',
						'Keeps food handling and hygiene up to standard',
						'Handles canteen takings and reports them to the committee'
					]
				},
				{
					id: 'gear-steward',
					title: 'Gear Steward',
					summary: 'Keeps track of club equipment and makes sure teams have what they need.',
					duties: [
						'Manages jerseys, balls, bibs, cones and first aid kits',
						'Hands out and collects team kits each season',
						'Tracks stock, damage and replacements',
						'Keeps the equipment stores organised'
					]
				},
				{
					id: 'grounds-officer',
					title: 'Grounds Officer',
					summary: 'Keeps our grounds match-ready, safe and organised.',
					duties: [
						'Coordinates field set up and pack down',
						'Organises line marking, goals and nets',
						'Looks after storage sheds, keys and ground access',
						'Reports maintenance and safety issues to council'
					]
				},
				{
					id: 'registrar',
					title: 'Registrar',
					summary: 'Looks after player registrations from sign-up to team allocation.',
					duties: [
						'Manages registrations and payments in PlayFootball',
						'Allocates players to teams with the coaches',
						'Handles transfers, clearances and registration questions',
						'Keeps registration numbers and records up to date'
					]
				},
				{
					id: 'coach-ref-coordinator',
					title: 'Coach and Ref Co-Ordinator',
					summary: 'Supports the people who support our players: coaches, managers, referees and game leaders.',
					duties: [
						'Recruits and supports coaches and team managers',
						'Makes sure team officials have their accreditations and Working with Children Checks',
						'Coordinates club referees and game leaders each week',
						'Is the link between team officials and the committee'
					]
				}
			]
		},
		{
			id: 'general',
			label: 'General Committee',
			intro: 'No set portfolio. A great way to get involved and see how the club runs.',
			roles: [
				{
					id: 'general-committee',
					title: 'General Committee member',
					summary: 'Provides support to ensure the efficient operation of the club.',
					duties: [
						'Attends committee meetings and votes on club decisions',
						'Takes on projects such as fundraising, sponsorship or events',
						'Helps out on game days and at club events',
						'Brings ideas and feedback from players and families'
					],
					// Club-approved position description, shown at /agm/roles/general-committee
					description: {
						objectives: ['Provide support to ensure the efficient operation of the club.'],
						responsibilities: [
							'Attend meetings and take part in discussions and decisions that help run the club.',
							'Help on game days — for example, setting up nets, helping in the canteen or BBQ, or assisting with setup and pack-up.',
							'Support fundraising and sponsorship by helping with events, grant applications, or finding local business partners.',
							"Take part in planning for the club's future — helping shape goals and how the club can grow or improve.",
							'Promote a positive club culture that values fair play, teamwork, respect and inclusivity.',
							'Help with volunteers — encouraging people to get involved, supporting them in their roles, and thanking them for their efforts.',
							'Join small working groups when needed (e.g. helping with social events, uniforms, or equipment).',
							'Listen to members (players, parents, coaches) and share their feedback or concerns with the committee.',
							'Represent the club when talking with the local council, football association, sponsors, or community groups.',
							'Look after club property and records — helping keep things organised and making sure information is passed on to new committee members.',
							'Communicate with members through newsletters, social media or notices, so everyone stays informed.',
							'Help with special projects like tournaments, facility improvements, or other club initiatives.',
							'Support future leaders by encouraging others to get involved and sharing your experience with them.'
						]
					}
				}
			]
		}
	]
} as const;
