// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	// Enables canonical/og:url and the URL in the .ics file. Served by the Cloudflare Worker (wrangler.jsonc).
	site: 'https://gis20.cz',
	vite: {
		plugins: [tailwindcss()],
		// The RSVP API lives in the Worker; run `npx wrangler dev` next to `npm run dev` to use it locally.
		server: { proxy: { '/api': 'http://localhost:8787' } },
	},
});
