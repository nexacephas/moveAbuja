import Fuse from 'fuse.js';

export function createSearchIndex(stops = [], places = []) {
  const stopEntries = Array.isArray(stops) ? stops : [];
  const placeEntries = Array.isArray(places) ? places : [];
  const entries = [
    ...stopEntries
      .filter((stop) => stop && stop.id && stop.name)
      .map((stop) => ({
        type: 'stop',
        id: stop.id,
        name: stop.name,
        landmark: stop.landmark ?? '',
        detail: stop.landmark ?? '',
        status: stop.status,
        source: stop.source,
        sourceUrl: stop.sourceUrl,
        statusDate: stop.statusDate,
      })),
    ...placeEntries
      .filter((place) => place && place.id && place.name)
      .map((place) => ({
        type: 'place',
        id: place.id,
        name: place.name,
        aliases: Array.isArray(place.aliases) ? place.aliases : [],
        category: place.category ?? '',
        branchAddresses: Array.isArray(place.branches)
          ? place.branches.map((branch) => branch?.address ?? '')
          : [],
        detail: place.category ?? 'Place',
        status: place.status,
        source: place.source,
        sourceUrl: place.sourceUrl,
        statusDate: place.statusDate,
      })),
  ];

  const fuse = new Fuse(entries, {
    keys: [
      { name: 'name', weight: 0.5 },
      { name: 'aliases', weight: 0.22 },
      { name: 'landmark', weight: 0.12 },
      { name: 'branchAddresses', weight: 0.11 },
      { name: 'category', weight: 0.05 },
    ],
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 1,
  });

  return {
    entries,
    search(query, options) {
      return fuse.search(query, options);
    },
  };
}

export function searchSuggestions(index, query, limit = 8) {
  const emptyResults = { stops: [], places: [] };
  const normalizedQuery = typeof query === 'string' ? query.trim() : '';
  const resultLimit = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 8;

  if (
    !index ||
    typeof index.search !== 'function' ||
    !Array.isArray(index.entries) ||
    resultLimit === 0
  ) {
    return emptyResults;
  }

  if (!normalizedQuery) {
    const stops = index.entries.filter((entry) => entry.type === 'stop');
    const places = index.entries.filter((entry) => entry.type === 'place');
    const suggestions = [];

    for (let position = 0; suggestions.length < resultLimit; position += 1) {
      if (stops[position]) suggestions.push(stops[position]);
      if (suggestions.length < resultLimit && places[position]) {
        suggestions.push(places[position]);
      }
      if (!stops[position] && !places[position]) break;
    }

    return suggestions.reduce(
      (groups, suggestion) => {
        groups[suggestion.type === 'stop' ? 'stops' : 'places'].push(suggestion);
        return groups;
      },
      { stops: [], places: [] },
    );
  }

  return index.search(normalizedQuery, { limit: resultLimit }).reduce(
    (groups, result) => {
      if (result.item.type === 'stop') groups.stops.push(result.item);
      if (result.item.type === 'place') groups.places.push(result.item);
      return groups;
    },
    { stops: [], places: [] },
  );
}
