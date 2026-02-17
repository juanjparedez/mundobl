/**
 * Script de migración one-time: asigna datos existentes (ViewStatus, Comments)
 * al usuario admin (Flor) después de su primer login.
 *
 * Uso: npx tsx scripts/assign-existing-data.ts
 */
import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
  const adminEmail = adminEmails[0];
  if (!adminEmail) {
    console.error('ADMIN_EMAILS no configurado en .env');
    process.exit(1);
  }

  const admin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!admin) {
    console.error(
      `Usuario admin (${adminEmail}) no encontrado. Debe iniciar sesión primero.`
    );
    process.exit(1);
  }

  console.log(`Admin encontrado: ${admin.name} (${admin.id})`);

  // Asignar ViewStatus existentes (sin usuario) al admin
  const viewStatusResult = await prisma.viewStatus.updateMany({
    where: { userId: null },
    data: { userId: admin.id },
  });
  console.log(`ViewStatus asignados: ${viewStatusResult.count}`);

  // Asignar Comments existentes (sin usuario) al admin
  const commentsResult = await prisma.comment.updateMany({
    where: { userId: null },
    data: { userId: admin.id },
  });
  console.log(`Comments asignados: ${commentsResult.count}`);

  console.log('Migración completada.');

  await prisma.$disconnect();
  await pool.end();
}

migrate().catch((error) => {
  console.error('Error en migración:', error);
  process.exit(1);
});
