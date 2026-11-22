// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	// Enables canonical/og:url and the URL in the .ics file. Hosted on GitHub Pages (custom domain via public/CNAME).
	site: 'https://gis20.cz',
	vite: {
		plugins: [tailwindcss()],
	},
});
