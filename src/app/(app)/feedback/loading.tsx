export default function FeedbackLoading() {
  return (
    <div
      style={{ maxWidth: 1100, margin: '0 auto', padding: 'var(--spacing-md)' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: 180,
            height: 36,
            borderRadius: 6,
            background: 'var(--bg-spotlight, #2e283b)',
          }}
        />
        <div
          style={{
            width: 140,
            height: 36,
            borderRadius: 6,
            background: 'var(--bg-spotlight, #2e283b)',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 80,
              height: 28,
              borderRadius: 6,
              background: 'var(--bg-spotlight, #2e283b)',
            }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              padding: 16,
              borderRadius: 12,
              background: 'var(--bg-elevated, #201c29)',
              border: '1px solid var(--border-color, #332b40)',
            }}
          >
            <div
              style={{
                width: '60%',
                height: 16,
                borderRadius: 4,
                background: 'var(--bg-spotlight, #2e283b)',
                marginBottom: 8,
              }}
            />
            <div
              style={{
                width: '30%',
                height: 12,
                borderRadius: 4,
                background: 'var(--bg-spotlight, #2e283b)',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
