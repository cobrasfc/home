# Metford Cobras FC Website

Performance-first, responsive static site built with Astro + Tailwind.

## Run locally

```zsh
npm install
npm run dev
```

Build + preview:

```zsh
npm run build
npm run preview
```

## Update key links + contact details

Edit `src/site.config.ts`:

- `mailchimpSubscribeUrl`: set this to your Mailchimp landing page URL
- `facebookUrl`: your Facebook page URL
- `contact.email` / `contact.phone`: club contact details
- `location.*`: ground name/address/training notes

`/subscribe` will automatically redirect to Mailchimp once `mailchimpSubscribeUrl` is set.

## MiniRoos Gala Day registration

`/gala-day` (info), `/gala-day/register` (public registration form), and `/gala-day/dashboard` (password-gated
committee view) are set up for the 26 September 2026 Gala Day. Registrations are stored in a Google Sheet the club
owns — no third-party form service, no account signup (the club's existing Gmail account works fine). Before it
goes live:

1. Create a new Google Sheet (any name, e.g. "Gala Day Registrations") in the club's Google account.
2. In the Sheet, go to **Extensions → Apps Script**. Delete the placeholder code and paste in the contents of
   [`google-apps-script/gala-day-registrations.gs`](google-apps-script/gala-day-registrations.gs) from this repo.
3. In that script, change `API_KEY` from `CHANGE_ME_SHARED_PASSWORD` to a password of your choosing — this is what
   the committee will type into `/gala-day/dashboard` to view registrations.
4. Click **Deploy → New deployment → Web app**. Set "Execute as" to **Me**, and "Who has access" to **Anyone**
   (not "Anyone with a Google account" — the public registration form needs to reach it without logging in).
5. Authorise the script when prompted (it only needs access to this one Sheet), then copy the generated `/exec`
   URL and paste it into `registrationApiUrl` in `src/site.config.ts` (`GALA_DAY` block), replacing the
   `REPLACE_WITH_DEPLOYMENT_ID` placeholder.
6. Visit `/gala-day/dashboard` and enter the password you set in step 3 to confirm it works.

The Sheet gets a header row automatically on the first submission — no need to type it in yourself. If you change
the Apps Script later, redeploy via **Deploy → Manage deployments → Edit → New version** — editing the code alone
doesn't update the live URL.

This is a shared-password gate, not a login system — anyone with the dashboard URL and password can see every
registration (including player names and phone numbers), the same way a shared spreadsheet link would work. That's
an acceptable trade-off for a community club with no backend, but don't share the password beyond the committee.

> **Why not Microsoft/Power Automate?** We tried that first since the club uses Microsoft 365, but Power Automate's
> custom HTTP-trigger flows (needed here) are gated behind an organisational Microsoft account — a personal
> Microsoft/OneDrive account can't create them without a paid upgrade. Google Apps Script has no such restriction.

Event details, entry fees, and max players per age group are configured in the `GALA_DAY` block of
`src/site.config.ts`. The searchable club list (Hunter Valley Football + Macquarie Football members) lives in
`src/data/gala-day-clubs.ts` — update it if zone membership changes.

## Summer Soccer schedule tracker

`/summer-soccer/schedule` shows each player/parent their next game (when, where, who, opponent colour, field map),
then everything coming up. No accounts: chosen teams are remembered on the device and kept in the URL, e.g.
`/summer-soccer/schedule?teams=all-age-mixed-grasshoppers,mens-cobras` — hand these links out per team.

Fixtures are read **in the browser from a Google Sheet** every time the page opens (and every few minutes while
it's open), so editing the sheet updates the site — no rebuild or deploy.

**Set up the sheet (once):**

1. Import the Excel draw into Google Sheets (File → Import). Row 1 must be the headers:
   `Round, Division, Date, Start Time, Finish Time, Field, Team 1, Team 1 Colour, Team 2, Team 2 Colour, Status, Note`
   ([`public/summer-soccer/sample-fixtures.csv`](public/summer-soccer/sample-fixtures.csv) is a working example).
2. File → Share → **Publish to web** → choose the fixtures tab → **Comma-separated values (.csv)** → Publish.
3. Paste the link into `sheetCsvUrl` in the `SUMMER_SCHEDULE` block of `src/site.config.ts`, then deploy once.
   Until this is set, the page shows the preview fixtures in `sampleCsvPath` (currently the draft draw,
   `public/summer-soccer/draft-fixtures.csv`) under the `sampleNotice` banner.

Google caches published sheets for up to ~5 minutes, so edits appear within a few minutes.

**Editing fixtures:** dates are day/month/year. Times like `6:30 PM`, `18:30` or `6.30pm` all work (a bare `6:30`
is read as pm). Fields: `Field 4`, `4`, `Minis 1`. Colours are free text (`Sky Blue`, `navy`); unknown colours
still show as text. **Status** is blank/`Scheduled`, `Cancelled` or `Postponed`; **Note** is shown on the fixture
(e.g. `Postponed — new date to be advised`). To reschedule, change the date/time and clear the status. A team
with no game that round can be listed against `Bye`. Don't rename teams mid-season — the name is part of the saved
link. Add `?debug` to the page URL to see sheet warnings (unreadable dates, unknown fields…) in the browser console.

**Check the page at another moment:** add `&now=2026-10-19T18:50` (Sydney time) to preview game night.

**Field map:** [`src/summer-soccer/fields.ts`](src/summer-soccer/fields.ts) builds the map from geometry: two
equal full-size winter pitches placed between their goal posts (positions from the club's satellite image), each
split into four identical summer fields with an alley between them, plus two identical, slightly smaller minis
beside the right-hand pitch. Adjust `PITCH`, `ALLEY`, `MINIS_SCALE` or the goal-post positions there — every field
is derived from them. Support contacts, venue and the Northern NSW Football acknowledgement (optional logo/link)
are in `SUMMER_SCHEDULE`.

Code layout: `src/summer-soccer/data` (sheet adapter, CSV + fixture parsing), `domain` (team IDs, next-game and
date logic), `utils` (timezone, `.ics`, URL/local storage), `ui` (rendering), `app.ts` (wiring).

## Summer Soccer planning portal

`/summer-soccer/admin` (not linked, not indexed) is the committee's view of the Summer Soccer schedule. It shows the
chosen layout, **Scenario 2: 6 fields + 2 minis** (decided 5 Oct 2026): pitch use by wave, referees, checks
(dual registrations, shared contacts, game leaders) and round-by-round maps showing every game. The **History** tab
keeps the frozen Scenario 1 vs Scenario 2 comparison from the decision (`src/summer-soccer/admin/history-2026-10-05.json`).

The live data is `src/summer-soccer/admin/scenarios.json`, generated on the club computer by `plan_scenarios.py` in
the "Summer Soccer 2026 Draw" folder from the club's allocation workbook (Teams + All Players tabs). Only team-level
data is written — no player names, FFA numbers or phone numbers — so the player list never goes into this repo.
`export_schedule_xlsx.py` in the same folder writes the matching Excel schedule. To update: export the workbook's
tabs, run both scripts, then build and push the site.

## Replace placeholder images

Placeholders live in:

- `public/assets/placeholders/hero.svg`
- `public/assets/placeholders/action.svg`

Replace the logo at `public/assets/logo-shield.svg` with your real club logo SVG (same filename) when ready.

## Pages / routes

- `/` Home
- `/club/history`
- `/club/values`
- `/club/location`
- `/play-football/junior`
- `/play-football/senior`
- `/play-football/summer`
- `/sponsorship`
- `/subscribe`
- `/contact-us`
- `/committee`
