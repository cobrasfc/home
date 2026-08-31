// Member clubs of Hunter Valley Football and Macquarie Football (Northern NSW Football zones),
// sourced from northernnswfootball.com.au in August 2026. Update here if zone membership changes.

export type GalaDayClub = {
	name: string;
	association: 'Hunter Valley Football' | 'Macquarie Football';
};

export const HOST_CLUB_NAME = 'Metford Cobras FC';

export const GALA_DAY_CLUBS: GalaDayClub[] = [
	{ name: 'Abermain Rams Football Club', association: 'Hunter Valley Football' },
	{ name: 'Bellbird Junior Football Club', association: 'Hunter Valley Football' },
	{ name: 'Bolwarra Lorn Junior Soccer Club', association: 'Hunter Valley Football' },
	{ name: 'Cessnock City Hornets Football Club', association: 'Hunter Valley Football' },
	{ name: 'Cessnock United Football Club', association: 'Hunter Valley Football' },
	{ name: 'Clarence Town Kookaburras Football Club', association: 'Hunter Valley Football' },
	{ name: 'Dungog Soccer Club', association: 'Hunter Valley Football' },
	{ name: 'Gresford Vacy Football Club', association: 'Hunter Valley Football' },
	{ name: 'Greta Branxton Football Club', association: 'Hunter Valley Football' },
	{ name: 'Hunter Valley Grammar School', association: 'Hunter Valley Football' },
	{ name: 'Kurri Kurri Football Club', association: 'Hunter Valley Football' },
	{ name: 'Kurri Kurri Womens Football Club', association: 'Hunter Valley Football' },
	{ name: 'Largs Football Club', association: 'Hunter Valley Football' },
	{ name: 'Lochinvar Rovers Football Club', association: 'Hunter Valley Football' },
	{ name: 'Maitland Junior Football Club', association: 'Hunter Valley Football' },
	{ name: HOST_CLUB_NAME, association: 'Hunter Valley Football' },
	{ name: 'Muswellbrook Eagles Football Club', association: 'Hunter Valley Football' },
	{ name: 'North United Wolves Football Club', association: 'Hunter Valley Football' },
	{ name: 'Rutherford Football Club', association: 'Hunter Valley Football' },
	{ name: 'Scone Mustangs Football Club', association: 'Hunter Valley Football' },
	{ name: 'Singleton Strikers Football Club', association: 'Hunter Valley Football' },
	{ name: 'South Maitland Football Club', association: 'Hunter Valley Football' },
	{ name: 'Tenambit Sharks Football Club', association: 'Hunter Valley Football' },
	{ name: 'Thornton Junior Football Club', association: 'Hunter Valley Football' },
	{ name: 'Weston Junior Football Club', association: 'Hunter Valley Football' },
	{ name: 'Argenton United Junior Soccer Club', association: 'Macquarie Football' },
	{ name: 'Barnsley Football Club', association: 'Macquarie Football' },
	{ name: 'Belmont Football Club', association: 'Macquarie Football' },
	{ name: 'Belswans Junior Soccer Club', association: 'Macquarie Football' },
	{ name: 'Cardiff City Football Club', association: 'Macquarie Football' },
	{ name: 'Charlestown Junior Football Club', association: 'Macquarie Football' },
	{ name: 'Dudley Redhead United Football Club', association: 'Macquarie Football' },
	{ name: 'Dudley Redhead United Senior Football Club', association: 'Macquarie Football' },
	{ name: 'Edgeworth Junior Soccer Club', association: 'Macquarie Football' },
	{ name: 'Garden Suburb Soccer Club', association: 'Macquarie Football' },
	{ name: 'Kahibah Football Club', association: 'Macquarie Football' },
	{ name: 'Lake Macquarie City Football Club', association: 'Macquarie Football' },
	{ name: 'Morisset United Football Club', association: 'Macquarie Football' },
	{ name: 'South Cardiff Community Football Club', association: 'Macquarie Football' },
	{ name: 'Southern Lakes United Football Club', association: 'Macquarie Football' },
	{ name: 'Swansea Football Club', association: 'Macquarie Football' },
	{ name: 'Toronto Awaba Junior Football Club', association: 'Macquarie Football' },
	{ name: 'Valentine Football Club', association: 'Macquarie Football' },
	{ name: 'Warners Bay Football Club', association: 'Macquarie Football' },
	{ name: 'West Wallsend Junior Soccer Club', association: 'Macquarie Football' },
	{ name: 'Westlakes Wildcats Football Club', association: 'Macquarie Football' }
].sort((a, b) => a.name.localeCompare(b.name));
