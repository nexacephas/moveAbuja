# Data collection checklist

The current route and organisation records are placeholders. Do not present them as verified commuter information. Collect field information first, then replace values in the JSON files and update each record's provenance fields.

## Stops

- [ ] Assign a stable, unique `id`.
- [ ] Record the stop's public name and a clear boarding/alighting landmark.
- [ ] Record latitude and longitude in decimal degrees at the actual stop location.
- [ ] Check that the point is in the Abuja service area and that it identifies the correct side or direction of the road where relevant.
- [ ] Set `status`, `source`, `sourceUrl`, and `statusDate`.

## Routes and fares

- [ ] Confirm the origin and destination stop IDs and transport mode.
- [ ] Ask for the typical minimum and maximum fare for the stated corridor; record positive numeric values and the date they were checked in `lastUpdated`.
- [ ] Record the boarding landmark, useful route notes, and report count without implying that an estimate is guaranteed.
- [ ] Set `status`, `source`, `sourceUrl`, and `statusDate`.

## Organisations and branches

- [ ] Record the organisation's stable ID, name, aliases, category, and official website where available.
- [ ] For each branch, record its ID, label, address, latitude/longitude, nearest stop IDs, walking note, phone, weekly hours, and `lastVerified` date.
- [ ] Confirm every `nearestStopIds` value refers to a stop in `routes.json`.
- [ ] Set `status`, `source`, `sourceUrl`, and `statusDate` on the organisation record.

## Coordinates and attribution

Collect coordinates at the physical location when possible. In OpenStreetMap, place or inspect a pin at the location and copy its decimal latitude and longitude. Record enough field context to distinguish nearby entrances or opposite sides of a road. Do not fetch or copy stop, route, fare, place, hours, or coordinate data from Google Maps or Google Places.

If OpenStreetMap data is used, retain the required OpenStreetMap attribution in the product and follow the applicable OpenStreetMap data licensing requirements.

## Provenance and dates

- Use `status: "verified"` only after checking the information. Set `source` to one of `site visit`, `phone call`, `confirmed by organisation`, or `commuter reports`, and set `statusDate` to the verification date.
- Use `status: "online"` only for information obtained from a named publisher or site. Put that publisher/site name in `source`, use its HTTPS page in `sourceUrl`, and set `statusDate` to the retrieval date.
- Keep placeholder records at `status: "sample"` with `source: "placeholder"` and the date the placeholder status was recorded. Do not mark a placeholder as verified.
- The JSON schema records the verification method/source and date, but has no dedicated field for the verifier's name. Keep the verifier's identity and supporting details in a field-collection log keyed by the record ID. Do not put personal contact details into public JSON.
- `npm run validate:data` checks structure and provenance. By default, non-verified records are warnings; `--strict` rejects sample records and `--verified-only` rejects every record that is not verified.
