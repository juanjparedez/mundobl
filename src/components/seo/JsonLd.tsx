import type { WithContext, Thing } from 'schema-dts';

interface JsonLdProps<T extends Thing> {
  data: WithContext<T>;
}

export function JsonLd<T extends Thing>({ data }: JsonLdProps<T>) {
  // Guarda runtime: si un caller construye `data` desde un objeto que termina
  // siendo null/undefined (ej. SSR con relacion vacia), no emitimos script
  // invalido — el bot ignora el page entero.
  if (!data || typeof data !== 'object') {
    console.error('Invalid JSON-LD data provided:', data);
    return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
