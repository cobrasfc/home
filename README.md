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
