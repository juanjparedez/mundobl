export default function SeriesDetailLoading() {
  return (
    <div style={{ padding: 'var(--spacing-lg)' }}>
      <div
        aria-hidden="true"
        style={{
          width: '100%',
          height: 320,
          borderRadius: 12,
          background: 'var(--bg-secondary, #201c29)',
          marginBottom: 24,
        }}
      />
      <div
        style={{
          width: '70%',
          height: 24,
          borderRadius: 4,
          background: 'var(--bg-spotlight, #2e283b)',
          marginBottom: 16,
        }}
      />
      <div
        style={{
          width: '100%',
          height: 16,
          borderRadius: 4,
          background: 'var(--bg-spotlight, #2e283b)',
          marginBottom: 8,
        }}
      />
      <div
        style={{
          width: '90%',
          height: 16,
          borderRadius: 4,
          background: 'var(--bg-spotlight, #2e283b)',
        }}
      />
    </div>
  );
}
