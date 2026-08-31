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
committee view) are set up for the 19 September 2026 Gala Day. Registrations are stored in an Excel table in the
club's own OneDrive, written and read via a Power Automate flow — no third-party form service, no account signup.
This works on the free tier of a personal Microsoft account (flow.microsoft.com).

### 1. Create the Excel table

In OneDrive, create a new Excel workbook (e.g. `Gala Day Registrations.xlsx`). On the first sheet, add this header
row, then select the header + one blank row below it and **Insert → Table** (this is required — Power Automate's
Excel actions only work against a proper Excel Table, not a plain range):

```
timestamp | registrant_name | club_name | is_host_club | age_group | entry_fee | team_name | team_grade | player_count | players_list | official_name | official_phone | duty_officer_name | canteen_bbq_helpers | game_leaders
```

Name the table (Table Design tab → Table Name) something memorable, e.g. `Registrations`.

### 2. Build the "add a registration" flow

At [make.powerautomate.com](https://make.powerautomate.com), create a new **Instant cloud flow** → trigger
**"When an HTTP request is received"**.

- Method: `POST`
- Request Body JSON Schema — click "Use sample payload to generate schema" and paste:

```json
{
	"website": "",
	"registrant_name": "",
	"club_name": "",
	"is_host_club": "",
	"age_group": "",
	"entry_fee": "",
	"team_name": "",
	"team_grade": "",
	"player_count": 0,
	"players_list": "",
	"official_name": "",
	"official_phone": "",
	"duty_officer_name": "",
	"canteen_bbq_helpers": "",
	"game_leaders": ""
}
```

Then add these actions in order:

1. **Condition**: `website` (from Dynamic content) **is equal to** *(leave the value blank)*.
   - **If yes** (empty — a real visitor): add action **Excel Online (Business) → Add a row into a table**. Pick
     the workbook and table from step 1. Map each column to the matching Dynamic content field from the trigger,
     and set `timestamp` to the expression `utcNow()`.
   - **If no** (filled in — almost certainly a bot): leave empty, or add a "Terminate" action set to Succeeded.
     Either way, don't write it to the table.
2. After the condition, add a **Response** action: Status code `200`, Body `{"ok": true}`.

Save the flow, then copy the URL shown on the trigger step (click into the trigger, the URL appears once saved).

### 3. Build the "list registrations" flow (for the dashboard)

Another **Instant cloud flow** → trigger **"When an HTTP request is received"**, method `GET` (no request body).

1. **Condition**: expression `triggerOutputs()?['queries']?['key']` **is equal to** a password of your choosing
   (this is what the committee types into `/gala-day/dashboard`).
   - **If yes**: add **Excel Online (Business) → List rows present in a table** (same workbook/table). Then add a
     **Response** action: Status `200`, Body set to the expression `body('List_rows_present_in_a_table')?['value']`.
   - **If no**: add a **Response** action: Status `401`, Body `{"error": "unauthorized"}`.

Save, copy this flow's trigger URL too.

### 4. Wire it up

Paste the **first flow's** URL into `registrationApiUrl` in `src/site.config.ts` (`GALA_DAY` block), replacing the
`REPLACE_WITH_DEPLOYMENT_ID` placeholder — the registration form and the dashboard both call the same config value,
so if you'd rather split them, add a second config field and point `dashboard.astro` at the second flow's URL
instead (currently both use `registrationApiUrl`).

Then visit `/gala-day/dashboard` and enter the password from step 3 to confirm it works.

This is a shared-password gate, not a login system — anyone with the dashboard URL and password can see every
registration (including player names and phone numbers), the same way a shared spreadsheet link would work. That's
an acceptable trade-off for a community club with no backend, but don't share the password beyond the committee.

Power Automate's HTTP trigger handles CORS (including the preflight request the registration form's fetch call
triggers) automatically — no extra configuration needed there.

### Alternative: Google Sheets instead

If you'd rather use a Google account than Microsoft, [`google-apps-script/gala-day-registrations.gs`](google-apps-script/gala-day-registrations.gs)
is a ready-to-paste Apps Script that does the same job (bound to a Google Sheet, deployed as a Web App) — see the
comments at the top of that file for setup. If you go this route, change the `fetch` call in
`src/pages/gala-day/register.astro` back to omit the `Content-Type` header (Apps Script doesn't handle the CORS
preflight that header triggers).

Event details, entry fees, and max players per age group are configured in the `GALA_DAY` block of
`src/site.config.ts`. The searchable club list (Hunter Valley Football + Macquarie Football members) lives in
`src/data/gala-day-clubs.ts` — update it if zone membership changes.

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
