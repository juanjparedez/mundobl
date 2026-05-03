import './SerieCardSkeleton.css';

interface SerieCardSkeletonProps {
  count?: number;
}

export function SerieCardSkeleton({ count = 1 }: SerieCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="serie-card-skeleton" aria-hidden="true">
          <div className="serie-card-skeleton__cover" />
          <div className="serie-card-skeleton__body">
            <div className="serie-card-skeleton__line serie-card-skeleton__line--title" />
            <div className="serie-card-skeleton__line serie-card-skeleton__line--meta" />
          </div>
        </div>
      ))}
    </>
  );
}
