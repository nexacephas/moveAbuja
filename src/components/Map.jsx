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
const placeMarkerIcon = L.divIcon({
  className: 'place-marker-icon',
  html: '<span class="place-marker-dot"></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

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
      .filter((stop) => stop && Number.isFinite(stop.lat) && Number.isFinite(stop.lng))
      .map((stop) => [stop.lat, stop.lng]);

    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [36, 36], maxZoom: 13 });
    } else if (points.length === 1) {
      map.setView(points[0], 13);
    }
  }, [fromStop, toStop, focusPoint, placeLocations, map]);

  return null;
}

export default function Map({
  fromStop,
  toStop,
  focusPoint,
  placeLocations = [],
  showRouteLine = true,
}) {
  const routePoints = [fromStop, toStop]
    .filter((stop) => stop && Number.isFinite(stop.lat) && Number.isFinite(stop.lng))
    .map((stop) => [stop.lat, stop.lng]);
  const focusPointHasMarker =
    focusPoint &&
    placeLocations.some(
      (location) => location.lat === focusPoint.lat && location.lng === focusPoint.lng,
    );

  return (
    <section className="map-section" aria-labelledby="map-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">ON THE MAP</p>
          <h2 id="map-heading">Stops and places</h2>
        </div>
      </div>
      <div className="map-frame">
        <MapContainer center={defaultCenter} zoom={11} scrollWheelZoom={false}>
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
          {fromStop && Number.isFinite(fromStop.lat) && Number.isFinite(fromStop.lng) && (
            <Marker position={[fromStop.lat, fromStop.lng]}>
              <Tooltip>{fromStop.name || 'Starting stop'}</Tooltip>
            </Marker>
          )}
          {toStop && Number.isFinite(toStop.lat) && Number.isFinite(toStop.lng) && (
            <Marker position={[toStop.lat, toStop.lng]}>
              <Tooltip>{toStop.name || 'Alighting stop'}</Tooltip>
            </Marker>
          )}
          {placeLocations.map((location) => (
            <Marker
              key={location.id}
              position={[location.lat, location.lng]}
              icon={placeMarkerIcon}
            >
              <Tooltip>{location.name}</Tooltip>
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
            <Marker position={[focusPoint.lat, focusPoint.lng]} />
          )}
          {showRouteLine && routePoints.length === 2 && (
            <Polyline
              positions={routePoints}
              pathOptions={{ color: '#0B7A3E', weight: 4 }}
            />
          )}
        </MapContainer>
      </div>
      <p className="map-disclaimer">Map points are placeholders and may not show actual boarding locations.</p>
    </section>
  );
}
