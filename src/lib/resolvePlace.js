import { findRoutes } from './findRoutes.js';

export function resolvePlace(place, stops, branchId) {
  if (!place || typeof place !== 'object') return null;

  const branches = Array.isArray(place.branches) ? place.branches : [];
  const branch =
    branches.find((item) => item?.id === branchId) ??
    branches.find((item) => item && typeof item === 'object') ??
    null;
  const stopsById = new Map(
    (Array.isArray(stops) ? stops : [])
      .filter((stop) => stop && typeof stop.id === 'string')
      .map((stop) => [stop.id, stop]),
  );
  const seenStops = new Set();
  const nearestStops = Array.isArray(branch?.nearestStopIds)
    ? branch.nearestStopIds.reduce((matches, stopId) => {
        const stop = stopsById.get(stopId);
        if (stop && !seenStops.has(stopId)) {
          matches.push(stop);
          seenStops.add(stopId);
        }
        return matches;
      }, [])
    : [];

  return { place, branch, nearestStops };
}

export function findRoutesBetweenStops(routes, fromStops, toStops) {
  if (!Array.isArray(fromStops) || !Array.isArray(toStops)) return [];

  const matches = [];
  const seenRoutes = new Set();
  for (const fromStop of fromStops) {
    for (const toStop of toStops) {
      for (const route of findRoutes(routes, fromStop?.id, toStop?.id)) {
        const key = `${route.id}:${route.from}:${route.to}`;
        if (!seenRoutes.has(key)) {
          matches.push(route);
          seenRoutes.add(key);
        }
      }
    }
  }
  return matches;
}
