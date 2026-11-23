# Sraz GIS VŠB-TUO 2027

Static invitation site for the 20-year reunion of GIS graduates from VŠB – Technical University of Ostrava.
Built with Astro and Tailwind CSS v4.

## Commands

| Command           | Action                                       |
| :---------------- | :------------------------------------------- |
| `npm install`     | Install dependencies                         |
| `npm run dev`     | Dev server at `http://localhost:4321`        |
| `npm run build`   | Build the static site into `./dist/`         |
| `npm run preview` | Preview the production build locally         |

## Editing content

All event facts live in `src/data/event.ts`. Optional fields are hidden on the page until filled in.
The RSVP slip (`src/components/RsvpSlip.astro`) talks to the Cloudflare Worker in `worker/` (URL in `rsvpApi`).
Sign-up stores name, e-mail and an optional note in D1 and sends a confirmation e-mail (Resend) with a
personal cancel link `https://gis20.cz/#odhlasit=<token>`; anyone who lost it can request a new one on the slip.
The page only ever shows the head count. Without `rsvpApi` the slip renders only in dev.
`rsvpDeadline`, `contactEmail`, `contactPhone` and `paymentInfo` are shown on the slip when filled.

Coordinates in `venueCoords` are the wine cellar itself; they drive the map pin, the map links and the distance.

## Structure

The whole page is a noticeboard: paper scraps lying on a fictional topographic map.

- `src/pages/index.astro` – the page: newspaper front page, tear-off calendar, sticky note, receipt, route map, archive
- `src/components/Scrap.astro` + `src/lib/scrap.ts` – paper scrap wrapper (tilt, torn/cut/zigzag edges, pin or tape)
- `src/components/Clipping.astro`, `ClippingArt.astro` + `src/data/clippings.ts` – fake newspaper clippings in the archive
- `src/assets/clippings/` – optional photos for clippings (referenced by `image.file` in `clippings.ts`)
- `src/pages/map.svg.ts` + `src/lib/contours.ts` – seamless map tile for the background (marching squares isolines)
- `src/components/RouteMap.astro` – route map VŠB-TUO → Dolní Bojanovice with graticule and scale bar
- `src/components/Countdown.astro` – days-left counter, computed in the browser
- `src/pages/sraz.ics.ts` – calendar file generated at build time (`/sraz.ics`)
- `scripts/og-image.html` – source of the link preview image `public/og.png`; the regenerate command is in the file

## Hosting and RSVP backend

The whole site runs on Cloudflare as one Worker, `gis20` (config in `wrangler.jsonc`, code in `worker/src/index.ts`):
it serves the Astro build from `dist/`, redirects www to the apex, adds an `X-Robots-Tag: noindex` header and
answers the RSVP API under `/api/`. Registrations live in the D1 database `gis20-rsvp` (EU jurisdiction).
DNS for gis20.cz is managed in the same Cloudflare account.

```sh
export CLOUDFLARE_ACCOUNT_ID=<account id>
npm run deploy                                        # astro build + wrangler deploy
npx wrangler dev                                      # local Worker + API on :8787 (npm run dev proxies /api there)
npx wrangler secret put RESEND_API_KEY                # Resend API key for e-mails
npx wrangler d1 execute gis20-rsvp --remote --file worker/schema.sql   # create the table (once)
npx wrangler d1 execute gis20-rsvp --remote --command "SELECT name, email, phone, note, status, updated_at FROM registrations ORDER BY created_at"
```

Registrations can also be browsed in the Cloudflare dashboard (Storage & Databases → D1 → gis20-rsvp).
E-mails are sent from `sraz@gis20.cz` through Resend; the domain is verified there via DNS records.
Mail to `sraz@gis20.cz` goes through Cloudflare Email Routing to the same Worker, which forwards it to every address
in the secret `FORWARD_TO` (comma-separated; each address must be verified under Email Routing → Destination addresses):
`npx wrangler secret put FORWARD_TO`.
