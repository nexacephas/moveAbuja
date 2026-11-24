import { formatFareRange, formatUpdatedAt } from '../lib/formatters.js';
import RecordTrust from './RecordTrust.jsx';

const modes = {
  bus: { label: 'Bus', icon: '🚌' },
  'shared-taxi': { label: 'Shared taxi', icon: '🚕' },
  keke: { label: 'Keke', icon: '🛺' },
};

export default function RouteCard({ route, stopsById }) {
  const from = stopsById.get(route.from);
  const to = stopsById.get(route.to);
  const mode = modes[route.mode] ?? { label: 'Public transport', icon: '🚐' };
  const updatedAt = new Date(`${route.lastUpdated}T00:00:00`);
  const isOutdated =
    !Number.isNaN(updatedAt.getTime()) &&
    Date.now() - updatedAt.getTime() > 30 * 24 * 60 * 60 * 1000;

  return (
    <article className="route-card">
      <div className="route-card-top">
        <span className="mode-pill"><span aria-hidden="true">{mode.icon}</span> {mode.label}</span>
        {isOutdated && <span className="outdated-label">May be outdated</span>}
      </div>
      <RecordTrust record={route} />
      <div className="route-places">
        <div>
          <span className="place-caption">From</span>
          <strong>{from?.name ?? 'Unknown stop'}</strong>
          <RecordTrust record={from} className="route-stop-trust" />
        </div>
        <span className="route-arrow" aria-hidden="true">→</span>
        <div>
          <span className="place-caption">To</span>
          <strong>{to?.name ?? 'Unknown stop'}</strong>
          <RecordTrust record={to} className="route-stop-trust" />
        </div>
      </div>
      <div className="fare-row">
        <span>Typical fare</span>
        <strong>{formatFareRange(route.fare)}</strong>
      </div>
      <p className="boarding-point">
        <strong>Board at:</strong> {from?.landmark ?? 'Boarding point not available'}
      </p>
      {route.notes && <p className="route-notes">{route.notes}</p>}
      <p className="freshness">{formatUpdatedAt(route.lastUpdated)}</p>
    </article>
  );
}
