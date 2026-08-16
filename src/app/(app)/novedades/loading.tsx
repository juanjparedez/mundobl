export default function NovedadesLoading() {
  return (
    <div
      style={{ maxWidth: 1000, margin: '0 auto', padding: 'var(--spacing-lg)' }}
    >
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div
          style={{
            width: 220,
            height: 36,
            borderRadius: 6,
            background: 'var(--bg-spotlight, #2e283b)',
            margin: '0 auto 12px',
          }}
        />
        <div
          style={{
            width: 320,
            height: 16,
            borderRadius: 4,
            background: 'var(--bg-spotlight, #2e283b)',
            margin: '0 auto',
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            style={{
              padding: 24,
              borderRadius: 12,
              background: 'var(--bg-elevated, #201c29)',
              border: '1px solid var(--border-color, #332b40)',
            }}
          >
            <div
              style={{
                width: '40%',
                height: 20,
                borderRadius: 4,
                background: 'var(--bg-spotlight, #2e283b)',
                marginBottom: 12,
              }}
            />
            <div
              style={{
                width: '100%',
                height: 14,
                borderRadius: 4,
                background: 'var(--bg-spotlight, #2e283b)',
                marginBottom: 8,
              }}
            />
            <div
              style={{
                width: '80%',
                height: 14,
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
