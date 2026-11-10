import Script from 'next/script';

/** Token del sitio en Cloudflare → Web Analytics. No es secreto: va en el HTML. */
const TOKEN = process.env.NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN;

/**
 * Cloudflare Web Analytics: gratis, sin cookies y sin datos personales.
 * Solo cuenta navegadores que ejecutan JavaScript, asi que los bots que
 * piden HTML no inflan las visitas (los logs del Worker si los cuentan).
 * `spa: true` mide tambien la navegacion del lado del cliente de Next.
 * Sin token (desarrollo, previews) no carga nada.
 */
export function CloudflareWebAnalytics() {
  if (!TOKEN) return null;
  return (
    <Script
      src="https://static.cloudflareinsights.com/beacon.min.js"
      strategy="afterInteractive"
      data-cf-beacon={JSON.stringify({ token: TOKEN, spa: true })}
    />
  );
}
