import './PageSkeleton.css';

export type PageSkeletonVariant = 'detail' | 'player' | 'hub' | 'list' | 'feed';

function Lines({ count = 2 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="page-skeleton__line" />
      ))}
    </>
  );
}

function Cards({ count, lines }: { count: number; lines: number }) {
  return (
    <div className="page-skeleton__stack">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="page-skeleton__card">
          <Lines count={lines} />
        </div>
      ))}
    </div>
  );
}

/** Esqueleto de carga de pagina: mismo ancho que la pagina real, sin topes fijos. */
export function PageSkeleton({ variant }: { variant: PageSkeletonVariant }) {
  return (
    <div
      className={`page-skeleton page-skeleton--${variant}`}
      aria-hidden="true"
    >
      {variant === 'detail' && (
        <>
          <div className="page-skeleton__hero" />
          <Lines count={3} />
        </>
      )}
      {variant === 'player' && (
        <>
          <div className="page-skeleton__pill" />
          <div className="page-skeleton__player" />
          <Cards count={1} lines={2} />
        </>
      )}
      {variant === 'hub' && (
        <>
          <div className="page-skeleton__card page-skeleton__heading">
            <div className="page-skeleton__pill" />
            <Lines count={1} />
          </div>
          <div className="page-skeleton__grid">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="page-skeleton__card page-skeleton__tile">
                <div className="page-skeleton__poster" />
                <Lines count={2} />
              </div>
            ))}
          </div>
        </>
      )}
      {variant === 'list' && (
        <>
          <div className="page-skeleton__row">
            <div className="page-skeleton__pill" />
            <div className="page-skeleton__pill" />
          </div>
          <div className="page-skeleton__row page-skeleton__row--start">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="page-skeleton__chip" />
            ))}
          </div>
          <Cards count={4} lines={2} />
        </>
      )}
      {variant === 'feed' && (
        <>
          <div className="page-skeleton__heading">
            <div className="page-skeleton__pill" />
            <Lines count={1} />
          </div>
          <Cards count={3} lines={3} />
        </>
      )}
    </div>
  );
}
