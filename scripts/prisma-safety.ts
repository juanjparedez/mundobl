/** Development schema commands must never target the shared/production database. */
export function assertSafePrismaCommand(args: string[], datasourceUrl: string) {
  const unsafe =
    (args.includes('migrate') &&
      (args.includes('dev') || args.includes('reset'))) ||
    (args.includes('db') && args.includes('push'));
  if (!unsafe || !datasourceUrl) return;
  const hostname = new URL(datasourceUrl).hostname;
  if (!['localhost', '127.0.0.1', '[::1]', '::1'].includes(hostname)) {
    throw new Error(
      'Comando bloqueado: migrate dev/reset y db push solo se permiten en PostgreSQL local. ' +
        'Generá y probá migraciones localmente; para producción usá npm run migrate:supabase.'
    );
  }
}
