import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const v05Tasks = [
  {
    title: 'Access logs con registro de visitas y acciones',
    description:
      'Sistema de logging que registra page views y acciones de API (CREATE, UPDATE, DELETE, LOGIN, etc). Incluye IP, user agent y metadata.',
    type: 'feature',
    status: 'completado',
    priority: 'alta',
  },
  {
    title: 'Panel admin de logs con filtros y limpieza',
    description:
      'Página /admin/logs con tabla paginada, filtros por acción y rango de fechas, y botón para limpiar logs de más de 90 días.',
    type: 'feature',
    status: 'completado',
    priority: 'media',
  },
  {
    title: 'Banner de privacidad',
    description:
      'Banner informativo al pie de la página en la primera visita, avisando sobre el registro de acceso. Se oculta con localStorage al aceptar.',
    type: 'feature',
    status: 'completado',
    priority: 'media',
  },
  {
    title: 'Sistema de ban de usuarios y bloqueo por IP',
    description:
      'Los admins pueden banear usuarios y bloquear IPs desde /admin/usuarios. El proxy bloquea el acceso a usuarios baneados e IPs bloqueadas.',
    type: 'feature',
    status: 'completado',
    priority: 'alta',
  },
  {
    title: 'Mejora de la gestión de usuarios',
    description:
      'Página de usuarios integrada al layout admin con AdminNav. Soporte para cambiar roles (VISITOR/MODERATOR) y toggle de ban con confirmación.',
    type: 'feature',
    status: 'completado',
    priority: 'media',
  },
];

async function main() {
  console.log('Insertando tareas v0.5 como completadas...');

  for (const task of v05Tasks) {
    const created = await prisma.featureRequest.create({
      data: task,
    });
    console.log(`  OK ${created.title} (id: ${created.id})`);
  }

  console.log(`\nListo! ${v05Tasks.length} tareas insertadas en el Changelog.`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
