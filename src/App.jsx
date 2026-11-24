import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import routesDataUrl from './data/routes.json?url&no-inline';
import placesDataUrl from './data/places.json?url&no-inline';
import Header from './components/Header.jsx';
import SearchForm from './components/SearchForm.jsx';
import RouteResults from './components/RouteResults.jsx';
import PlaceCard from './components/PlaceCard.jsx';
import SampleDataBanner from './components/SampleDataBanner.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import NotFound from './components/NotFound.jsx';
import { findRoutesBetweenStops, resolvePlace } from './lib/resolvePlace.js';
import { createSearchIndex } from './lib/search.js';

const RouteMap = lazy(() => import('./components/Map.jsx'));

async function fetchLocalJson(url, label, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`${label} request failed with status ${response.status}.`);
  }
  return response.json();
}

export default function App() {
  const currentPath = typeof window === 'undefined' ? '/' : window.location.pathname;
  const isNotFound = currentPath !== '/' && currentPath !== '/index.html';
  const [fromSelection, setFromSelection] = useState(null);
  const [toSelection, setToSelection] = useState(null);
  const [branchSelections, setBranchSelections] = useState({ from: '', to: '' });
  const [search, setSearch] = useState(null);
  const [mapFocusPoint, setMapFocusPoint] = useState(null);
  const [directoryData, setDirectoryData] = useState({ stops: [], routes: [], places: [] });
  const [dataError, setDataError] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataLoadAttempt, setDataLoadAttempt] = useState(0);
  const [isOffline, setIsOffline] = useState(
    () => typeof navigator !== 'undefined' && !navigator.onLine,
  );

  useEffect(() => {
    if (isNotFound) return undefined;

    const controller = new AbortController();

    async function loadDirectory() {
      try {
        const [routesData, placesData] = await Promise.all([
          fetchLocalJson(routesDataUrl, 'Route data', controller.signal),
          fetchLocalJson(placesDataUrl, 'Place data', controller.signal),
        ]);
        if (
          !routesData ||
          !Array.isArray(routesData.stops) ||
          !Array.isArray(routesData.routes) ||
          !placesData ||
          !Array.isArray(placesData.places)
        ) {
          throw new Error('The local route or place data has an invalid format.');
        }

        setDirectoryData({
          stops: routesData.stops,
          routes: routesData.routes,
          places: placesData.places,
        });
      } catch (error) {
        if (error?.name !== 'AbortError') {
          console.error('Unable to load MoveAbuja route and place data.', error);
          setDataError(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setDataLoading(false);
        }
      }
    }

    loadDirectory();
    return () => controller.abort();
  }, [dataLoadAttempt, isNotFound]);

  useEffect(() => {
    function updateNetworkStatus() {
      setIsOffline(!navigator.onLine);
    }

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, []);

  const stops = directoryData.stops;
  const routes = directoryData.routes;
  const places = directoryData.places;
  const searchIndex = useMemo(() => createSearchIndex(stops, places), [stops, places]);
  const stopsById = useMemo(() => new Map(stops.map((stop) => [stop.id, stop])), [stops]);
  const placesById = useMemo(() => new Map(places.map((place) => [place.id, place])), [places]);
  const fromStop =
    fromSelection?.type === 'stop' ? stopsById.get(fromSelection.id) : null;
  const toStop =
    toSelection?.type === 'stop' ? stopsById.get(toSelection.id) : null;
  const fromPlace =
    fromSelection?.type === 'place' ? placesById.get(fromSelection.id) : null;
  const toPlace =
    toSelection?.type === 'place' ? placesById.get(toSelection.id) : null;
  const fromResolvedPlace = useMemo(
    () => (fromPlace ? resolvePlace(fromPlace, stops, branchSelections.from) : null),
    [fromPlace, stops, branchSelections.from],
  );
  const toResolvedPlace = useMemo(
    () => (toPlace ? resolvePlace(toPlace, stops, branchSelections.to) : null),
    [toPlace, stops, branchSelections.to],
  );
  const displayedPlaces = [fromPlace, toPlace].filter(
    (place, index, list) => place && list.findIndex((item) => item?.id === place.id) === index,
  );
  const isPlaceSearch = Boolean(
    search && (search.from?.type === 'place' || search.to?.type === 'place'),
  );
  const fromCandidateStops = useMemo(
    () => (fromStop ? [fromStop] : fromResolvedPlace?.nearestStops ?? []),
    [fromStop, fromResolvedPlace],
  );
  const toCandidateStops = useMemo(
    () => (toStop ? [toStop] : toResolvedPlace?.nearestStops ?? []),
    [toStop, toResolvedPlace],
  );
  const displayedRoutes = useMemo(
    () =>
      search?.from && search?.to
        ? findRoutesBetweenStops(routes, fromCandidateStops, toCandidateStops)
        : [],
    [search, routes, fromCandidateStops, toCandidateStops],
  );
  const displayedStops = useMemo(() => {
    const candidates = [
      fromStop,
      toStop,
      ...(fromResolvedPlace?.nearestStops ?? []),
      ...(toResolvedPlace?.nearestStops ?? []),
      ...displayedRoutes.flatMap((route) => [
        stopsById.get(route.from),
        stopsById.get(route.to),
      ]),
    ];
    const seen = new Set();
    return candidates.filter((stop) => {
      if (!stop || seen.has(stop.id)) return false;
      seen.add(stop.id);
      return true;
    });
  }, [
    fromStop,
    toStop,
    fromResolvedPlace,
    toResolvedPlace,
    displayedRoutes,
    stopsById,
  ]);
  const firstRoute = displayedRoutes[0];
  const mapFromStop = useMemo(
    () =>
      (firstRoute && stopsById.get(firstRoute.from)) ??
      fromStop ??
      fromResolvedPlace?.nearestStops[0] ??
      null,
    [firstRoute, stopsById, fromStop, fromResolvedPlace],
  );
  const mapToStop = useMemo(
    () =>
      (firstRoute && stopsById.get(firstRoute.to)) ??
      toStop ??
      toResolvedPlace?.nearestStops[0] ??
      null,
    [firstRoute, stopsById, toStop, toResolvedPlace],
  );
  const placeLocations = useMemo(() => {
    const candidates = [
      {
        resolved: fromResolvedPlace,
        stop: mapFromStop ?? fromResolvedPlace?.nearestStops[0],
      },
      {
        resolved: toResolvedPlace,
        stop: mapToStop ?? toResolvedPlace?.nearestStops[0],
      },
    ];
    const seenPlaces = new Set();

    return candidates.flatMap(({ resolved, stop }) => {
      const { place, branch } = resolved ?? {};
      if (
        !place ||
        !branch ||
        !Number.isFinite(branch.lat) ||
        !Number.isFinite(branch.lng)
      ) {
        return [];
      }

      const id = `${place.id}-${branch.id ?? 'branch'}`;
      if (seenPlaces.has(id)) return [];
      seenPlaces.add(id);
      return [{
        id,
        name: place.name,
        lat: branch.lat,
        lng: branch.lng,
        connectionStop: stop ?? null,
      }];
    });
  }, [fromResolvedPlace, toResolvedPlace, mapFromStop, mapToStop]);
  const lastMileNotes = [
    toResolvedPlace?.branch?.walkNote && {
      id: `last-mile-${toResolvedPlace.place.id}`,
      label: 'Last mile',
      text: toResolvedPlace.branch.walkNote,
    },
    fromResolvedPlace?.branch?.walkNote && {
      id: `access-walk-${fromResolvedPlace.place.id}`,
      label: 'Walk to boarding stop',
      text: fromResolvedPlace.branch.walkNote,
    },
  ].filter(Boolean);
  const hasSampleData =
    displayedRoutes.some((route) => route.status === 'sample') ||
    displayedPlaces.some((place) => place.status === 'sample') ||
    displayedStops.some((stop) => stop.status === 'sample');

  function updateSelection(field, selection) {
    if (field === 'from') setFromSelection(selection);
    else setToSelection(selection);
    const place = selection?.type === 'place' ? placesById.get(selection.id) : null;
    const branchId = Array.isArray(place?.branches)
      ? place.branches.find((branch) => branch && typeof branch.id === 'string')?.id ?? ''
      : '';
    setBranchSelections((current) => ({ ...current, [field]: branchId }));
    setSearch(null);
    setMapFocusPoint(null);
  }

  function updatePlaceBranch(placeId, branchId) {
    setBranchSelections((current) => ({
      from:
        fromSelection?.type === 'place' && fromSelection.id === placeId
          ? branchId
          : current.from,
      to:
        toSelection?.type === 'place' && toSelection.id === placeId
          ? branchId
          : current.to,
    }));
    setSearch(null);
    setMapFocusPoint(null);
  }

  function findSelectedRoutes(selections) {
    setSearch(selections);
    setMapFocusPoint(null);
  }

  function retryDataLoading() {
    setDataError(false);
    setDataLoading(true);
    setDataLoadAttempt((attempt) => attempt + 1);
  }

  if (isNotFound) return <NotFound />;

  return (
    <div className="app-shell">
      {isOffline && <div className="offline-indicator" role="status">You&apos;re offline</div>}
      <Header />
      <main className="main-content">
        <section className="intro-section">
          <p className="eyebrow">GETTING AROUND THE CAPITAL</p>
          <h1>Where are you headed?</h1>
          <p className="intro-copy">Search transport stops or look up a place in Abuja.</p>
        </section>
        {dataLoading ? (
          <p className="loading-message" role="status">Loading local routes and places…</p>
        ) : dataError ? (
          <section className="data-error" role="alert">
            <h2>We couldn&apos;t load route and place data.</h2>
            <p>Check your connection, then try again.</p>
            <button className="primary-button" type="button" onClick={retryDataLoading}>
              Try again
            </button>
          </section>
        ) : (
          <>
            <SearchForm
              searchIndex={searchIndex}
              onSelectionChange={updateSelection}
              onFindRoutes={findSelectedRoutes}
            />
            <div className="content-stack">
              {hasSampleData && <SampleDataBanner />}
              {(search || !displayedPlaces.length) && (
                <RouteResults
                  routes={displayedRoutes}
                  stopsById={stopsById}
                  searched={Boolean(search)}
                  emptyMessage={isPlaceSearch ? 'No direct route found yet' : undefined}
                  lastMileNotes={displayedRoutes.length ? lastMileNotes : []}
                />
              )}
              {displayedPlaces.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  selectedBranchId={
                    place.id === fromPlace?.id
                      ? branchSelections.from
                      : branchSelections.to
                  }
                  nearestStops={
                    place.id === fromPlace?.id
                      ? fromResolvedPlace?.nearestStops ?? []
                      : toResolvedPlace?.nearestStops ?? []
                  }
                  onBranchChange={updatePlaceBranch}
                  onViewMap={(branch) => setMapFocusPoint({
                    id: branch.id,
                    lat: branch.lat,
                    lng: branch.lng,
                  })}
                />
              ))}
              <ErrorBoundary
                fallback={
                  <div className="map-error" role="alert">
                    <strong>Map unavailable.</strong>
                    <p>You can still search routes and view place details.</p>
                  </div>
                }
              >
                <Suspense fallback={<div className="map-loading" role="status">Loading map…</div>}>
                  <RouteMap
                    fromStop={mapFromStop}
                    toStop={mapToStop}
                    focusPoint={mapFocusPoint}
                    placeLocations={placeLocations}
                    showRouteLine={!search || displayedRoutes.length > 0}
                  />
                </Suspense>
              </ErrorBoundary>
            </div>
          </>
        )}
      </main>
      <footer className="app-footer">
        Fares are estimates and change with fuel prices. Always confirm with the driver.
      </footer>
    </div>
  );
}
