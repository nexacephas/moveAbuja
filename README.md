# MoveAbuja

MoveAbuja is a mobile-first route and fare finder for public transport in Abuja. Search direct bus, shared-taxi, and keke corridors, explore a sample organisation directory, view estimated fare ranges, and see selected stops or places on an OpenStreetMap map. The production build is installable as a Progressive Web App and precaches its app shell and local JSON data for offline use.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. To create and serve the PWA production build:

```bash
npm test
npm run lint
npm run build
npm run preview
```

PWA service-worker behavior is enabled in the production preview and deployed build. Open the preview URL once while online to install the app shell, route data, and place data; map tiles are cached as they are viewed, up to 100 tiles for 30 days. Install the app from the browser's install option on a supported device.

## Route data

All route, stop, and organisation records currently have `status: "sample"`. **All fares, coordinates, organisation names, addresses, website links, and hours in `src/data/routes.json` and `src/data/places.json` are placeholders, not verified field data.** The place links use the reserved `example.com` domain and phone fields are blank. Replace the sample information with data verified in the field before presenting it as factual. Keep route `from` and `to` values matched to stop IDs and place `nearestStopIds` matched to stop IDs. Record provenance in each record's `status`, `source`, `sourceUrl`, and `statusDate` fields.

The route and place data is loaded locally from JSON; there is no backend. Place searches use the selected branch's nearest stop IDs to find direct routes. Place details and nearest stops remain visible when no direct route is listed.

The unified search supports stop names and landmarks, plus place names, aliases, categories, and branch addresses. Focusing either field shows up to eight grouped stop and place suggestions before typing; typing filters the suggestions after a short debounce. For example, typing `FMT` finds the fictional Sample Civic Services Office.

`npm test` runs the unit tests for Lagos-time opening hours, place resolution, and grouped search.

## Deploy to Vercel

Import the project into Vercel or run `vercel` from the project directory. Vercel detects Vite automatically. Use `npm run build` as the build command and `dist` as the output directory. No environment variables or backend services are required.

`vercel.json` configures security headers and cache rules. The static `404.html` is included, so no SPA rewrite is needed. The Open Graph and Twitter share image uses `/share-image.png`; after choosing a production domain, update those image URLs to absolute URLs for social crawlers.
"# MoveAbuja" 
