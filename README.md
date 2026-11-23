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
The RSVP slip (`src/components/RsvpSlip.astro`) posts name and phone to a Google Form.
Create a form with two short-answer questions (Jméno, Telefon), open ⋮ → Get pre-filled link,
fill in any values and paste the generated link into `rsvpFormLink`. Answers then show up in the
form's responses (and a linked Google Sheet). Until the link is set, the slip renders only in dev.
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

## Deploy

Every push to `main` builds the site and deploys it to GitHub Pages (`.github/workflows/deploy.yml`).
It is served at https://gis20.cz: the domain is set in the repository's Pages settings and in `public/CNAME`,
and `site` in `astro.config.mjs` must match it.
