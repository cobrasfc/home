// Summer Comp rules in plain English, shown at /play-football/summer-regulations. Condensed for players from the
// club's 2026/2027 Summer Football Regulations (NNSWF template) with our local rules folded in. Club-admin clauses
// (registration, fees, host club duties, field and ball sizes, prizes, alcohol) are left out on purpose.

export type Rule = { label: string; text: string };

export type RuleSection = { id: string; title: string; rules: Rule[] };

export const SUMMER_REGULATIONS = {
	season: '2026/2027',
	title: 'Summer Football Regulations',
	// Committee review: while true the page shows a draft banner, is hidden from search engines and isn't linked
	// from the Summer page. Set to false to go live.
	draft: true
} as const;

export const RULE_SECTIONS: RuleSection[] = [
	{
		id: 'competition',
		title: 'The competition',
		rules: [
			{
				label: 'Where and when',
				text: 'All games are at Metford Rec Oval: adults play Monday nights from 6:30pm and juniors play Tuesday nights from 5:30pm, over 10 weeks.'
			},
			{
				label: 'Formats',
				text: '5–7 years play 4v4 Coles MiniRoos on the mini fields; every other competition (U8–11s, U12–13s, U12–15s, Men’s, Women’s and Mixed) plays 6v6, including a goalkeeper.'
			},
			{
				label: 'Purely social',
				text: 'No points, ladders or finals: every team plays one game a week, and the draw starts again from Round 1 once everyone has played each other.'
			},
			{
				label: 'Match length',
				text: 'Two halves with no half-time break: 2 × 15 minutes for all junior games and 2 × 20 minutes for adults.'
			}
		]
	},
	{
		id: 'playing-rules',
		title: 'Playing rules',
		rules: [
			{
				label: 'Laws of the Game',
				text: 'Games follow the FIFA Laws of the Game (and the Coles MiniRoos rules for 5–7 years), with the changes below.'
			},
			{ label: 'No offside', text: 'There is no offside in any Summer Comp game.' },
			{ label: 'No slide tackles', text: 'Slide tackles are not allowed.' },
			{ label: 'Goalkeepers', text: 'Goalkeepers must stay inside the goal area (the “D”).' },
			{
				label: 'Free kicks',
				text: 'Defenders, including any wall, must be at least 5m from the ball at every free kick and penalty.'
			},
			{ label: 'Penalties', text: 'The penalty taker can take no more than 2 steps.' },
			{
				label: 'Rolling subs',
				text: 'Interchange as often as you like, at any time, whether the ball is in play or not.'
			},
			{ label: 'Kit', text: 'Undergarments such as skins don’t need to match your shirt or shorts.' },
			{
				label: 'Mixed teams',
				text: 'At least two female players (not counting the goalkeeper) must be on the field at all times; if one comes off with no female replacement, the team plays a player short, and a team that can’t field two can’t take the field.'
			}
		]
	},
	{
		id: 'referees',
		title: 'Referees',
		rules: [
			{
				label: 'Every game is refereed',
				text: 'A registered referee controls every game, and if one doesn’t turn up the club appoints a substitute with the same authority.'
			},
			{
				label: 'The ref’s call is final',
				text: 'The referee’s decisions on the facts of play, including whether a goal is scored and the result, are final.'
			}
		]
	},
	{
		id: 'cancellations',
		title: 'If a game can’t go ahead',
		rules: [
			{
				label: 'Weather',
				text: 'If games are called off for wet weather, heat or lightning (under the NNSWF Hot Weather and Lightning Policies), we’ll let every team know, including whether a catch-up game is scheduled.'
			},
			{
				label: 'Can’t make it?',
				text: 'If your team can’t play, tell the club at least 24 hours before kick-off; otherwise the game is a forfeit.'
			},
			{ label: 'Two forfeits', text: 'A team that forfeits two games may be removed from the competition.' }
		]
	},
	{
		id: 'behaviour',
		title: 'Behaviour and discipline',
		rules: [
			{
				label: 'Code of conduct',
				text: 'Players, team officials and spectators must follow the Football Australia National Code of Conduct and Spectator Code of Behaviour.'
			},
			{
				label: 'Red cards',
				text: 'Red cards are adjudicated the same way as in any official match.'
			},
			{
				label: 'Suspensions',
				text: 'As host of the Summer Competition, Metford Cobras FC reserves the right to suspend a player for the rest of the competition for failing to follow the disciplinary policy every player agreed to when they registered.'
			}
		]
	}
];
