import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const validStatuses = new Set(['verified', 'online', 'sample']);
const verifiedSources = new Set([
  'site visit',
  'phone call',
  'confirmed by organisation',
  'commuter reports',
]);
const weekdays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const today = new Date().toISOString().slice(0, 10);
const errors = [];
const warnings = [];
const statusCounts = { verified: 0, online: 0, sample: 0 };
const records = [];
const args = new Set(process.argv.slice(2));

for (const arg of args) {
  if (arg !== '--strict' && arg !== '--verified-only') {
    errors.push(`Unknown option "${arg}". Use --strict or --verified-only.`);
  }
}

const strict = args.has('--strict');
const verifiedOnly = args.has('--verified-only');

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function addError(message) {
  errors.push(message);
}

function requireString(record, key, label, { allowEmpty = false } = {}) {
  const value = record?.[key];
  if (typeof value !== 'string' || (!allowEmpty && value.trim() === '')) {
    addError(`${label}.${key} must be ${allowEmpty ? 'a string' : 'a non-empty string'}.`);
    return false;
  }
  return true;
}

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value &&
    value <= today;
}

function requireDate(value, label) {
  if (!isValidDate(value)) {
    addError(`${label} must be a valid YYYY-MM-DD date no later than ${today}.`);
  }
}

function isValidCoordinate(record) {
  return typeof record?.lat === 'number' &&
    Number.isFinite(record.lat) &&
    record.lat >= 8.7 &&
    record.lat <= 9.3 &&
    typeof record.lng === 'number' &&
    Number.isFinite(record.lng) &&
    record.lng >= 7.0 &&
    record.lng <= 7.7;
}

function requireCoordinate(record, label) {
  if (!isValidCoordinate(record)) {
    addError(`${label} lat/lng must be numbers within the Abuja bounds (8.7-9.3, 7.0-7.7).`);
  }
}

function validateUniqueIds(items, label) {
  const seen = new Set();
  for (const item of items) {
    if (!isObject(item) || typeof item.id !== 'string' || item.id.trim() === '') {
      addError(`${label} contains a record with a missing or invalid id.`);
      continue;
    }
    if (seen.has(item.id)) addError(`${label} contains duplicate id "${item.id}".`);
    seen.add(item.id);
  }
}

function validateStatus(record, label) {
  if (!validStatuses.has(record?.status)) {
    addError(`${label}.status must be "verified", "online", or "sample".`);
    return;
  }

  statusCounts[record.status] += 1;
  records.push({ label, status: record.status });
  requireString(record, 'source', label);
  requireString(record, 'sourceUrl', label, { allowEmpty: true });
  requireDate(record.statusDate, `${label}.statusDate`);

  if (record.status === 'verified' && !verifiedSources.has(record.source)) {
    addError(`${label}.source must identify an approved verification method.`);
  }

  if (record.status === 'online') {
    if (typeof record.sourceUrl !== 'string' || record.sourceUrl.trim() === '') {
      addError(`${label}.sourceUrl is required when status is "online".`);
    } else {
      try {
        if (new URL(record.sourceUrl).protocol !== 'https:') {
          addError(`${label}.sourceUrl must use HTTPS.`);
        }
      } catch {
        addError(`${label}.sourceUrl must be a valid HTTPS URL.`);
      }
    }
  }

  if (record.status === 'sample' && record.source !== 'placeholder') {
    addError(`${label}.source must be "placeholder" when status is "sample".`);
  }

  if (record.status !== 'verified') {
    warnings.push(`${label} has status "${record.status}".`);
  }
}

async function loadJson(relativePath) {
  const filePath = path.join(root, relativePath);
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    addError(`Could not read valid JSON from ${relativePath}: ${error.message}`);
    return null;
  }
}

function arrayOrError(value, label) {
  if (!Array.isArray(value)) {
    addError(`${label} must be an array.`);
    return [];
  }
  return value;
}

function validateStop(stop, index) {
  const label = `routes.json stops[${index}]`;
  if (!isObject(stop)) {
    addError(`${label} must be an object.`);
    return;
  }
  requireString(stop, 'id', label);
  requireString(stop, 'name', label);
  requireString(stop, 'landmark', label);
  requireCoordinate(stop, label);
  validateStatus(stop, label);
}

function validateRoute(route, index, stopIds) {
  const label = `routes.json routes[${index}]`;
  if (!isObject(route)) {
    addError(`${label} must be an object.`);
    return;
  }
  requireString(route, 'id', label);
  requireString(route, 'from', label);
  requireString(route, 'to', label);
  if (!stopIds.has(route.from)) addError(`${label}.from references unknown stop "${route.from}".`);
  if (!stopIds.has(route.to)) addError(`${label}.to references unknown stop "${route.to}".`);
  if (!['bus', 'shared-taxi', 'keke'].includes(route.mode)) {
    addError(`${label}.mode must be "bus", "shared-taxi", or "keke".`);
  }
  if (
    !isObject(route.fare) ||
    typeof route.fare.min !== 'number' ||
    !Number.isFinite(route.fare.min) ||
    typeof route.fare.max !== 'number' ||
    !Number.isFinite(route.fare.max) ||
    route.fare.min <= 0 ||
    route.fare.max <= 0 ||
    route.fare.min > route.fare.max
  ) {
    addError(`${label}.fare must have positive numeric min/max values with min <= max.`);
  }
  requireDate(route.lastUpdated, `${label}.lastUpdated`);
  if (!Number.isInteger(route.reports) || route.reports < 0) {
    addError(`${label}.reports must be a non-negative integer.`);
  }
  requireString(route, 'notes', label, { allowEmpty: true });
  validateStatus(route, label);
}

function validateBranch(branch, label, stopIds) {
  if (!isObject(branch)) {
    addError(`${label} must be an object.`);
    return;
  }
  for (const key of ['id', 'label', 'address', 'walkNote', 'phone']) {
    requireString(branch, key, label, { allowEmpty: key === 'phone' });
  }
  requireCoordinate(branch, label);
  requireDate(branch.lastVerified, `${label}.lastVerified`);

  if (!Array.isArray(branch.nearestStopIds)) {
    addError(`${label}.nearestStopIds must be an array.`);
  } else {
    for (const stopId of branch.nearestStopIds) {
      if (!stopIds.has(stopId)) {
        addError(`${label}.nearestStopIds references unknown stop "${stopId}".`);
      }
    }
  }

  if (!isObject(branch.hours)) {
    addError(`${label}.hours must be an object.`);
    return;
  }
  for (const day of weekdays) {
    const hours = branch.hours[day];
    if (hours !== null && (
      typeof hours !== 'string' ||
      !/^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/.test(hours)
    )) {
      addError(`${label}.hours.${day} must be HH:MM-HH:MM or null.`);
    }
  }
}

function validatePlace(place, index, stopIds) {
  const label = `places.json places[${index}]`;
  if (!isObject(place)) {
    addError(`${label} must be an object.`);
    return [];
  }
  requireString(place, 'id', label);
  requireString(place, 'name', label);
  requireString(place, 'category', label);
  requireString(place, 'website', label, { allowEmpty: true });
  if (!Array.isArray(place.aliases) || !place.aliases.every((alias) => typeof alias === 'string')) {
    addError(`${label}.aliases must be an array of strings.`);
  }
  validateStatus(place, label);

  const branches = arrayOrError(place.branches, `${label}.branches`);
  branches.forEach((branch, branchIndex) => {
    validateBranch(branch, `${label}.branches[${branchIndex}]`, stopIds);
  });
  return branches;
}

const routesData = await loadJson('src/data/routes.json');
const placesData = await loadJson('src/data/places.json');

if (!isObject(routesData)) addError('routes.json must contain a JSON object.');
if (!isObject(placesData)) addError('places.json must contain a JSON object.');

const stops = arrayOrError(routesData?.stops, 'routes.json stops');
const routes = arrayOrError(routesData?.routes, 'routes.json routes');
const places = arrayOrError(placesData?.places, 'places.json places');
const branches = [];

validateUniqueIds(stops, 'routes.json stops');
validateUniqueIds(routes, 'routes.json routes');
const placeAndBranchRecords = places.flatMap((place) =>
  isObject(place)
    ? [place, ...(Array.isArray(place.branches) ? place.branches : [])]
    : [place],
);
validateUniqueIds(placeAndBranchRecords, 'places.json place and branch records');

stops.forEach(validateStop);
const stopIds = new Set(stops.filter(isObject).map((stop) => stop.id));
routes.forEach((route, index) => validateRoute(route, index, stopIds));
places.forEach((place, index) => {
  branches.push(...validatePlace(place, index, stopIds));
});

if (strict && statusCounts.sample > 0) {
  addError(`--strict does not allow ${statusCounts.sample} sample record(s).`);
}

const nonVerifiedCount = statusCounts.online + statusCounts.sample;
if (verifiedOnly && nonVerifiedCount > 0) {
  addError(`--verified-only does not allow ${nonVerifiedCount} non-verified record(s).`);
}

console.log(`Status counts (${records.length} stops/routes/places):`);
for (const status of validStatuses) {
  console.log(`  ${status}: ${statusCounts[status]}`);
}
console.log(`Branches checked: ${branches.length}`);

if (warnings.length > 0) {
  console.warn(`Warnings (${warnings.length}):`);
  for (const warning of warnings) console.warn(`  - ${warning}`);
}

if (errors.length > 0) {
  console.error(`Validation failed (${errors.length} error(s)):`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exitCode = 1;
} else {
  console.log('Data validation passed.');
}
