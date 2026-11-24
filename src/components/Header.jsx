export default function Header() {
  return (
    <header className="app-header">
      <a className="brand" href="/" aria-label="MoveAbuja home">
        <span className="brand-mark" aria-hidden="true">M</span>
        <span>
          <span className="brand-name">MoveAbuja</span>
          <span className="brand-tagline">Know your route. Know your fare.</span>
        </span>
      </a>
    </header>
  );
}
