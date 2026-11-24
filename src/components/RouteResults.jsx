import RouteCard from './RouteCard.jsx';

export default function RouteResults({
  routes,
  stopsById,
  searched,
  emptyMessage = 'No route found yet. Help us add it.',
  lastMileNotes = [],
}) {
  return (
    <section className="results-section" aria-labelledby="results-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">YOUR JOURNEY</p>
          <h2 id="results-heading">Route options</h2>
        </div>
      </div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {searched ? `${routes.length} ${routes.length === 1 ? 'route' : 'routes'} found.` : ''}
      </p>
      {!searched ? (
        <p className="empty-state">Choose your starting point and destination to get started.</p>
      ) : routes.length > 0 ? (
        <>
          <div className="route-list">
            {routes.map((route) => (
              <RouteCard key={`${route.id}-${route.from}-${route.to}`} route={route} stopsById={stopsById} />
            ))}
          </div>
          {lastMileNotes.length > 0 && (
            <div className="last-mile-notes">
              {lastMileNotes.map((note) => (
                <p className="last-mile-note" key={note.id}>
                  <strong>{note.label}:</strong> {note.text}
                </p>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <span className="empty-icon" aria-hidden="true">⌖</span>
          <h3>{emptyMessage}</h3>
          <button className="secondary-button" type="button" disabled>
            Report this route <span>Coming soon</span>
          </button>
        </div>
      )}
    </section>
  );
}
