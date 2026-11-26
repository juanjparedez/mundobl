/**
 * The D1 schema is migrated from migrations/*.sql (wrangler's format), not by
 * Prisma: `prisma migrate dev/reset/deploy` and `db push` would write a
 * second, diverging history (and miss sqlite-extras). Only `migrate diff`,
 * which writes nothing, stays allowed.
 */
export function assertSafePrismaCommand(args: string[]) {
  const writesSchema =
    (args.includes('migrate') &&
      ['dev', 'reset', 'deploy', 'resolve'].some((cmd) =>
        args.includes(cmd)
      )) ||
    (args.includes('db') && args.includes('push'));
  if (writesSchema) {
    throw new Error(
      'Comando bloqueado: la base es D1 y se migra con migrations/. ' +
        'Nueva migracion: npm run db:migration -- nombre. ' +
        'Aplicar: npm run local:db (local) o npm run migrate:d1 (produccion).'
    );
  }
}
