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
