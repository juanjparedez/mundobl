'use client';

/**
 * Error boundary global de Next.js (catches errors fuera del layout).
 * Renderiza su propio <html><body> y NO puede usar el layout/proveedores
 * de la app (porque estos pueden ser justo lo que rompió). Por eso es
 * más austero que app/error.tsx.
 */

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  background: '#121218',
  color: '#fff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const cardStyle: React.CSSProperties = {
  maxWidth: 540,
  width: '100%',
  padding: '32px',
  background: '#201c29',
  border: '1px solid #3f3550',
  borderRadius: 12,
  textAlign: 'center',
};

const buttonStyle: React.CSSProperties = {
  background: '#c98ac0',
  color: '#fff',
  border: 'none',
  padding: '10px 20px',
  borderRadius: 8,
  fontWeight: 600,
  cursor: 'pointer',
  margin: '4px',
};

const buttonGhostStyle: React.CSSProperties = {
  ...buttonStyle,
  background: 'transparent',
  color: '#fff',
  border: '1px solid #4b3f5f',
};

async function hardReset() {
  if (typeof window === 'undefined') return;
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch {
    /* ignore */
  }
  window.location.assign('/');
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="es">
      <body style={containerStyle}>
        <div style={cardStyle}>
          <h1 style={{ marginTop: 0 }}>Error crítico</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)' }}>
            La aplicación no pudo cargar. Probá las acciones de abajo.
          </p>
          {error.digest && (
            <p
              style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.5)',
                margin: '8px 0',
              }}
            >
              Código: <code>{error.digest}</code>
            </p>
          )}
          <div style={{ marginTop: 16 }}>
            <button type="button" style={buttonStyle} onClick={() => reset()}>
              Reintentar
            </button>
            <button type="button" style={buttonGhostStyle} onClick={hardReset}>
              Borrar cache y recargar
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
