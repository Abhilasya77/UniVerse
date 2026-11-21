export const universeTagline = "Every university. One universe.";
export const universeSecondary = "Know what matters on campus.";

export function OrbitMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`universe-mark ${className}`}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <path className="universe-brackets" d="M4 15V4h11m18 0h11v11m0 18v11H33m-18 0H4V33" />
      <circle className="universe-orbit" cx="24" cy="24" r="13" />
      <circle className="universe-star" cx="24" cy="24" r="2.1" />
      <g className="universe-satellite">
        <circle cx="24" cy="11" r="3" />
      </g>
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="universe-wordmark">
      Uni
      <span className="universe-v">
        V
        <svg aria-hidden="true" viewBox="0 0 24 28" preserveAspectRatio="none">
          <path pathLength="1" d="M1 2h8l4 20m10-20h-6l-4 20" />
        </svg>
      </span>
      erse
    </span>
  );
}

export function ConnectionIcon() {
  return (
    <svg viewBox="0 0 24 24" className="universe-connection-icon" aria-hidden="true">
      <path pathLength="1" d="m3 12 6 6L21 6" />
      <circle cx="21" cy="6" r="2" />
    </svg>
  );
}
