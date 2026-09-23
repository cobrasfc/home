// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: process.env.ASTRO_SITE,
  base: process.env.ASTRO_BASE ?? '/',
  // Old "Summer 6's update" page — keep shared links working now registrations are open
  redirects: {
    '/play-football/summer-eoi': '/play-football/summer'
  },
  vite: {
    plugins: [tailwindcss()]
  }
});