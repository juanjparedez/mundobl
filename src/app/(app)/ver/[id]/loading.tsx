export default function VerSerieLoading() {
  return (
    <div
      style={{ maxWidth: 1200, margin: '0 auto', padding: 'var(--spacing-md)' }}
    >
      <div
        style={{
          width: 120,
          height: 32,
          borderRadius: 6,
          background: 'var(--bg-spotlight, #2e283b)',
          marginBottom: 16,
        }}
      />

      <div
        style={{
          width: '100%',
          aspectRatio: '16 / 9',
          maxHeight: '65vh',
          borderRadius: 12,
          background: 'var(--bg-spotlight, #2e283b)',
          marginBottom: 20,
        }}
      />

      <div
        style={{
          padding: 20,
          borderRadius: 12,
          background: 'var(--bg-elevated, #201c29)',
          border: '1px solid var(--border-color, #332b40)',
        }}
      >
        <div
          style={{
            width: '50%',
            height: 24,
            borderRadius: 4,
            background: 'var(--bg-spotlight, #2e283b)',
            marginBottom: 12,
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
    </div>
  );
}
