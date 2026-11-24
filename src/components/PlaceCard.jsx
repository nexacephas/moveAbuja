import { useEffect, useState } from 'react';
import { isOpenNow } from '../lib/openNow.js';
import RecordTrust from './RecordTrust.jsx';

const weekDays = [
  ['mon', 'Monday'],
  ['tue', 'Tuesday'],
  ['wed', 'Wednesday'],
  ['thu', 'Thursday'],
  ['fri', 'Friday'],
  ['sat', 'Saturday'],
  ['sun', 'Sunday'],
];

function getWebsiteUrl(website) {
  if (typeof website !== 'string' || !website.trim()) return '';
  try {
    const url = new URL(website);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
  } catch {
    return '';
  }
}

function formatVerifiedAt(dateValue, now) {
  const verifiedAt = new Date(`${dateValue}T00:00:00Z`);
  if (
    !dateValue ||
    Number.isNaN(verifiedAt.getTime()) ||
    verifiedAt.toISOString().slice(0, 10) !== dateValue
  ) {
    return { label: 'Verification date unavailable', days: null };
  }

  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const days = Math.max(0, Math.floor((today - verifiedAt.getTime()) / 86400000));
  const label =
    days === 0
      ? 'Verified today'
      : `Verified ${days} ${days === 1 ? 'day' : 'days'} ago`;
  return { label, days };
}

function formatHours(hours, day) {
  if (!hours || typeof hours !== 'object' || !(day in hours)) return 'Hours unavailable';
  if (hours[day] === null) return 'Closed';
  return typeof hours[day] === 'string' && hours[day].trim()
    ? hours[day]
    : 'Hours unavailable';
}

export default function PlaceCard({
  place,
  nearestStops = [],
  selectedBranchId,
  onBranchChange,
  onViewMap,
}) {
  const branches = Array.isArray(place.branches) ? place.branches : [];
  const linkedStops = Array.isArray(nearestStops) ? nearestStops : [];
  const firstBranchId = branches[0]?.id ?? '';
  const [internalBranchSelection, setInternalBranchSelection] = useState(() => ({
    placeId: place.id,
    branchId: firstBranchId,
  }));
  const internalBranchId =
    internalBranchSelection.placeId === place.id
      ? internalBranchSelection.branchId
      : firstBranchId;
  const [now, setNow] = useState(() => new Date());
  const branchId = selectedBranchId ?? internalBranchId;
  const branch = branches.find((item) => item?.id === branchId) ?? branches[0] ?? null;
  const websiteUrl = getWebsiteUrl(place.website);
  const verification = formatVerifiedAt(branch?.lastVerified, now);
  const openStatus = isOpenNow(branch?.hours, now);
  const hasCoordinates =
    Number.isFinite(branch?.lat) && Number.isFinite(branch?.lng);
  const phone =
    typeof branch?.phone === 'string' ? branch.phone.trim() : '';

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const statusLabel =
    openStatus === null ? 'Hours unavailable' : openStatus ? 'Open now' : 'Closed now';
  const statusClass =
    openStatus === null ? 'unknown' : openStatus ? 'open' : 'closed';
  const placeHeadingId = `place-heading-${place.id}`;
  const branchSelectId = `branch-select-${place.id}`;

  return (
    <article className="place-card" aria-labelledby={placeHeadingId}>
      <div className="place-card-heading">
        <div>
          <span className="place-category">{place.category || 'Place'}</span>
          <h2 id={placeHeadingId}>{place.name}</h2>
          <RecordTrust record={place} />
        </div>
      </div>

      {websiteUrl && (
        <a className="place-website" href={websiteUrl} target="_blank" rel="noopener noreferrer">
          Visit website <span aria-hidden="true">↗</span>
        </a>
      )}

      {branches.length > 1 && (
        <div className="branch-field">
          <label htmlFor={branchSelectId}>Branch</label>
          <select
            id={branchSelectId}
            value={branch?.id ?? ''}
            onChange={(event) => {
              const nextBranchId = event.target.value;
              setInternalBranchSelection({ placeId: place.id, branchId: nextBranchId });
              onBranchChange?.(place.id, nextBranchId);
            }}
          >
            {branches.map((item) => (
              <option key={item.id} value={item.id}>{item.label || item.address}</option>
            ))}
          </select>
        </div>
      )}

      <div className="place-details">
        <p><strong>Address:</strong> {branch?.address || 'Address unavailable'}</p>
        {phone && <p><strong>Phone:</strong> <a href={`tel:${phone}`}>{phone}</a></p>}
      </div>
      <div className="nearest-stops">
        <strong>Nearest stops</strong>
        {linkedStops.length > 0 ? (
          <ul>
            {linkedStops.map((stop) => <li key={stop.id}>{stop.name}</li>)}
          </ul>
        ) : (
          <p>No linked stops yet.</p>
        )}
      </div>

      <div className="place-hours-heading">
        <h3>Weekly hours</h3>
        <span className={`open-status is-${statusClass}`} role="status">{statusLabel}</span>
      </div>
      <table className="hours-table">
        <caption className="sr-only">Weekly hours for {place.name}</caption>
        <tbody>
          {weekDays.map(([day, label]) => (
            <tr key={day}>
              <th scope="row">{label}</th>
              <td>{formatHours(branch?.hours, day)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="verification-row">
        <span>{verification.label}</span>
        {verification.days !== null && verification.days > 90 && (
          <strong className="outdated-label">Details may be outdated</strong>
        )}
      </div>

      <div className="place-actions">
        <button
          className="primary-button place-action"
          type="button"
          disabled={!hasCoordinates}
          onClick={() => onViewMap?.(branch)}
        >
          View on map
        </button>
        {hasCoordinates && (
          <a
            className="secondary-link place-action"
            href={`https://www.google.com/maps/search/?api=1&query=${branch.lat},${branch.lng}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in Google Maps
          </a>
        )}
      </div>
      <button className="report-button" type="button" disabled>
        Report incorrect info <span>Coming soon</span>
      </button>
    </article>
  );
}
