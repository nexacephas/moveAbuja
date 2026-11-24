import { useEffect } from 'react';
import L from 'leaflet';
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIconRetina,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const defaultCenter = [9.0765, 7.3986];

function createMapMarker(label, variant) {
  return L.divIcon({
    className: `moveabuja-marker moveabuja-marker--${variant}`,
    html: `<span class="moveabuja-marker__body" aria-hidden="true"><span>${label}</span></span>`,
    iconSize: [40, 48],
    iconAnchor: [20, 44],
  });
}

const startMarkerIcon = createMapMarker('A', 'start');
const destinationMarkerIcon = createMapMarker('B', 'destination');
const placeMarkerIcon = createMapMarker('P', 'place');

function hasCoordinates(point) {
  return point && Number.isFinite(point.lat) && Number.isFinite(point.lng);
}

function FitSelectedStops({ fromStop, toStop, focusPoint, placeLocations }) {
  const map = useMap();

  useEffect(() => {
    if (
      focusPoint &&
      Number.isFinite(focusPoint.lat) &&
      Number.isFinite(focusPoint.lng)
    ) {
      map.setView([focusPoint.lat, focusPoint.lng], 14);
      return;
    }

    const points = [fromStop, toStop, ...placeLocations]
      .filter(hasCoordinates)
      .map((stop) => [stop.lat, stop.lng]);

    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 14 });
    } else if (points.length === 1) {
      map.setView(points[0], 13);
    }
  }, [fromStop, toStop, focusPoint, placeLocations, map]);

  return null;
}

function MapFitButton({ points }) {
  const map = useMap();

  if (points.length === 0) return null;

  function fitSelection() {
    if (points.length === 1) {
      map.setView(points[0], 15);
      return;
    }

    map.fitBounds(L.latLngBounds(points), { padding: [52, 52], maxZoom: 14 });
  }

  return (
    <button
      className="map-fit-button"
      type="button"
      onClick={fitSelection}
      aria-label="Fit selected stops and places on the map"
      title="Fit selected stops and places"
    >
      <span aria-hidden="true">⌖</span>
      Fit selection
    </button>
  );
}

export default function Map({
  fromStop,
  toStop,
  focusPoint,
  placeLocations = [],
  showRouteLine = true,
}) {
  const routePoints = [fromStop, toStop]
    .filter(hasCoordinates)
    .map((stop) => [stop.lat, stop.lng]);
  const selectedPoints = [fromStop, toStop, ...placeLocations, focusPoint]
    .filter(hasCoordinates)
    .map((point) => [point.lat, point.lng]);
  const hasWalkConnections = placeLocations.some(
    (location) =>
      hasCoordinates(location) && hasCoordinates(location.connectionStop),
  );
  const focusPointHasMarker =
    hasCoordinates(focusPoint) &&
    placeLocations.some(
      (location) => location.lat === focusPoint.lat && location.lng === focusPoint.lng,
    );
  const legendItems = [
    fromStop && { key: 'start', marker: 'A', label: 'Starting point' },
    toStop && { key: 'destination', marker: 'B', label: 'Destination' },
    placeLocations.length > 0 && { key: 'place', marker: 'P', label: 'Place' },
    hasWalkConnections && { key: 'walk', marker: '', label: 'Last-mile walk' },
  ].filter(Boolean);

  return (
    <section className="map-section" aria-labelledby="map-heading">
      <div className="section-heading map-section-heading">
        <div>
          <p className="eyebrow">YOUR MAP</p>
          <h2 id="map-heading">Stops and places</h2>
        </div>
        <span className="map-source-badge">
          <span className="map-source-dot" aria-hidden="true" />
          OpenStreetMap
        </span>
      </div>
      <div className="map-frame">
        <span className="map-area-badge">
          <span className="map-area-dot" aria-hidden="true" />
          Abuja
        </span>
        <MapContainer
          center={defaultCenter}
          zoom={11}
          scrollWheelZoom={false}
          className="moveabuja-map"
          aria-label="Interactive map showing selected stops and places"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitSelectedStops
            fromStop={fromStop}
            toStop={toStop}
            focusPoint={focusPoint}
            placeLocations={placeLocations}
          />
          <MapFitButton points={selectedPoints} />
          {fromStop && Number.isFinite(fromStop.lat) && Number.isFinite(fromStop.lng) && (
            <Marker
              position={[fromStop.lat, fromStop.lng]}
              icon={startMarkerIcon}
              title={`Starting point: ${fromStop.name || 'selected stop'}`}
            >
              <Tooltip direction="top" offset={[0, -26]}>
                {fromStop.name || 'Starting stop'}
              </Tooltip>
            </Marker>
          )}
          {toStop && Number.isFinite(toStop.lat) && Number.isFinite(toStop.lng) && (
            <Marker
              position={[toStop.lat, toStop.lng]}
              icon={destinationMarkerIcon}
              title={`Destination: ${toStop.name || 'selected stop'}`}
            >
              <Tooltip direction="top" offset={[0, -26]}>
                {toStop.name || 'Alighting stop'}
              </Tooltip>
            </Marker>
          )}
          {placeLocations.map((location) => (
            <Marker
              key={location.id}
              position={[location.lat, location.lng]}
              icon={placeMarkerIcon}
              title={location.name}
            >
              <Tooltip direction="top" offset={[0, -26]}>{location.name}</Tooltip>
            </Marker>
          ))}
          {placeLocations.map((location) => (
            location.connectionStop &&
            Number.isFinite(location.connectionStop.lat) &&
            Number.isFinite(location.connectionStop.lng) && (
              <Polyline
                key={`connection-${location.id}`}
                positions={[
                  [location.connectionStop.lat, location.connectionStop.lng],
                  [location.lat, location.lng],
                ]}
                pathOptions={{ color: '#0B7A3E', weight: 3, dashArray: '7 8' }}
              />
            )
          ))}
          {focusPoint &&
            Number.isFinite(focusPoint.lat) &&
            Number.isFinite(focusPoint.lng) &&
            !focusPointHasMarker && (
              <Marker
                position={[focusPoint.lat, focusPoint.lng]}
                icon={placeMarkerIcon}
                title="Selected place"
              />
            )}
          {showRouteLine && routePoints.length === 2 && (
            <Polyline
              positions={routePoints}
              pathOptions={{ color: '#ffffff', weight: 9, opacity: 0.9 }}
            />
          )}
          {showRouteLine && routePoints.length === 2 && (
            <Polyline
              positions={routePoints}
              pathOptions={{ color: '#0B7A3E', weight: 5, opacity: 1 }}
            />
          )}
        </MapContainer>
      </div>
      {legendItems.length > 0 ? (
        <div className="map-legend" aria-label="Map key">
          {legendItems.map((item) => (
            <span className="map-legend-item" key={item.key}>
              {item.key === 'walk' ? (
                <span className="map-legend-walk" aria-hidden="true" />
              ) : (
                <span
                  className={`map-legend-marker map-legend-marker--${item.key}`}
                  aria-hidden="true"
                >
                  <span>{item.marker}</span>
                </span>
              )}
              {item.label}
            </span>
          ))}
        </div>
      ) : (
        <p className="map-empty-hint">
          <span aria-hidden="true">⌖</span>
          Search a route or place to highlight it here.
        </p>
      )}
      <p className="map-disclaimer">Map points are placeholders and may not show actual boarding locations.</p>
    </section>
  );
}
