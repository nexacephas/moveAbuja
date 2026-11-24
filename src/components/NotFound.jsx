import Header from './Header.jsx';

export default function NotFound() {
  return (
    <div className="app-shell">
      <Header />
      <main className="not-found-content">
        <p className="eyebrow">404</p>
        <h1>Page not found</h1>
        <p>We couldn&apos;t find that MoveAbuja page. Return home to search routes and places.</p>
        <a className="not-found-link" href="/">Back to MoveAbuja</a>
      </main>
      <footer className="app-footer">
        Fares are estimates and change with fuel prices. Always confirm with the driver.
      </footer>
    </div>
  );
}
