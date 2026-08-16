export default function VerLoading() {
  return (
    <div
      style={{ maxWidth: 1400, margin: '0 auto', padding: 'var(--spacing-md)' }}
    >
      {/* Hero skeleton */}
      <div
        style={{
          padding: 28,
          borderRadius: 12,
          background: 'var(--bg-elevated, #201c29)',
          marginBottom: 24,
          textAlign: 'center',
          border: '1px solid var(--border-color, #332b40)',
        }}
      >
        <div
          style={{
            width: 160,
            height: 28,
            borderRadius: 6,
            background: 'var(--bg-spotlight, #2e283b)',
            margin: '0 auto 12px',
          }}
        />
        <div
          style={{
            width: '60%',
            maxWidth: 400,
            height: 16,
            borderRadius: 4,
            background: 'var(--bg-spotlight, #2e283b)',
            margin: '0 auto',
          }}
        />
      </div>

      {/* Cards grid skeleton */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
        }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            style={{
              borderRadius: 12,
              overflow: 'hidden',
              background: 'var(--bg-elevated, #201c29)',
              border: '1px solid var(--border-color, #332b40)',
            }}
          >
            <div
              style={{
                width: '100%',
                aspectRatio: '2 / 3',
                background: 'var(--bg-spotlight, #2e283b)',
              }}
            />
            <div style={{ padding: 12 }}>
              <div
                style={{
                  width: '80%',
                  height: 16,
                  borderRadius: 4,
                  background: 'var(--bg-spotlight, #2e283b)',
                  marginBottom: 8,
                }}
              />
              <div
                style={{
                  width: '40%',
                  height: 12,
                  borderRadius: 4,
                  background: 'var(--bg-spotlight, #2e283b)',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
