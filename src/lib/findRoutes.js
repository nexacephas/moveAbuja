export function findRoutes(routes, fromId, toId) {
  if (!Array.isArray(routes) || !fromId || !toId || fromId === toId) {
    return [];
  }

  return routes.reduce((matches, route) => {
    if (route.from === fromId && route.to === toId) {
      matches.push({ ...route, reversed: false });
    } else if (route.from === toId && route.to === fromId) {
      matches.push({
        ...route,
        from: route.to,
        to: route.from,
        reversed: true,
      });
    }
    return matches;
  }, []);
}
