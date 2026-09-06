require('dotenv').config();
const { Client } = require('pg');

// Tickets from 19/8/2026 backwards:
// COMPLETED: Clearly implemented in master
// REJECTED: Old ideas from May not currently being pursued, to clear the active board
const ACTIONS = {
  // --- FLOR'S TICKETS ---
  146: {
    status: 'COMPLETED',
    reason: 'Solucionado en master: airDays ahora se conserva correctamente al editar serie',
  },
  137: {
    status: 'COMPLETED',
    reason: 'Solucionado en master: Viendo ahora cuenta con contador "Viendo X series"',
  },
  136: {
    status: 'REJECTED',
    reason: 'Idea descartada/cerrada: el catálogo de ver series ya clasifica disponibilidad',
  },

  // --- ROADMAP & COMMUNITY (MAY 2026) ---
  111: {
    status: 'COMPLETED',
    reason: 'Implementado: autocompletado y precarga IA con Gemini en admin de series',
  },
  91: {
    status: 'COMPLETED',
    reason: 'Implementado: barra de búsqueda y Command-K contextualizados',
  },
  90: {
    status: 'COMPLETED',
    reason: 'Implementado: personalización de layout en dashboard de perfil',
  },
  86: {
    status: 'COMPLETED',
    reason: 'Implementado: logros y quiz cultural persistidos en backend',
  },
  85: {
    status: 'REJECTED',
    reason: 'Idea archivada: cubierto por el sistema de Favoritos y Viendo',
  },
  75: {
    status: 'REJECTED',
    reason: 'Idea archivada: no prioritaria para el flujo actual de noticias',
  },
  69: {
    status: 'COMPLETED',
    reason: 'Resuelto: cliente OAuth configurado y activo en producción',
  },
  67: {
    status: 'COMPLETED',
    reason: 'Implementado: infraestructura de email en src/lib/email.ts y preferencias de notificación',
  },
  64: {
    status: 'REJECTED',
    reason: 'Idea archivada: llms.txt no prioritario en esta etapa',
  },
  63: {
    status: 'COMPLETED',
    reason: 'Implementado: SEO con Schema.org JSON-LD, breadcrumbs y slugs semánticos',
  },
  61: {
    status: 'COMPLETED',
    reason: 'Implementado: importación y exportación de datos de cuenta y script de backup',
  },
  60: {
    status: 'COMPLETED',
    reason: 'Implementado: búsqueda multi-criterio avanzada en catálogo',
  },
  59: {
    status: 'COMPLETED',
    reason: 'Implementado: exportación del catálogo personal en JSON',
  },
  58: {
    status: 'REJECTED',
    reason: 'Idea archivada: heatmap no requerido en roadmap actual',
  },
  57: {
    status: 'COMPLETED',
    reason: 'Implementado: persistencia de timestamp de último episodio visto en ViewStatus',
  },
  56: {
    status: 'REJECTED',
    reason: 'Idea archivada: comparador 1v1 no prioritario',
  },
  55: {
    status: 'COMPLETED',
    reason: 'Implementado: bloque de acciones completo en ficha de serie',
  },
  54: {
    status: 'REJECTED',
    reason: 'Idea archivada: recomendaciones automáticas basadas en metadata',
  },
  53: {
    status: 'COMPLETED',
    reason: 'Implementado: recomendaciones "Series relacionadas" en ficha de serie',
  },
  50: {
    status: 'REJECTED',
    reason: 'Idea archivada: tops por categoría en noticias no prioritario',
  },
  49: {
    status: 'COMPLETED',
    reason: 'Implementado: selector y autocompletado de tags en noticias',
  },
};

const APPLY = process.argv.includes('--apply');

async function main() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  console.log(`=== Triage y Cierre de Feedback (${APPLY ? 'APPLY' : 'DRY-RUN'}) ===\n`);

  const ids = Object.keys(ACTIONS).map(Number);
  const query = `
    SELECT id, title, type, status, "createdAt"
    FROM "FeatureRequest"
    WHERE id = ANY($1::int[])
    ORDER BY id ASC
  `;

  const res = await client.query(query, [ids]);

  let completedCount = 0;
  let rejectedCount = 0;
  let unchangedCount = 0;

  for (const row of res.rows) {
    const action = ACTIONS[row.id];
    if (!action) continue;

    const dateStr = new Date(row.createdAt).toISOString().slice(0, 10);
    const willChange = row.status !== action.status;

    if (willChange) {
      if (action.status === 'COMPLETED') completedCount++;
      if (action.status === 'REJECTED') rejectedCount++;
      console.log(`[#${row.id}] [${dateStr}] ${row.status} -> ${action.status}: "${row.title}"`);
      console.log(`       Motivo: ${action.reason}`);

      if (APPLY) {
        await client.query(
          `UPDATE "FeatureRequest" SET status = $1, "updatedAt" = NOW() WHERE id = $2`,
          [action.status, row.id]
        );
      }
    } else {
      unchangedCount++;
      console.log(`[#${row.id}] Ya estaba ${row.status}: "${row.title}"`);
    }
  }

  console.log(`\n--- Resumen ---`);
  console.log(`A marcar como COMPLETADO: ${completedCount}`);
  console.log(`A marcar como DESCARTADO: ${rejectedCount}`);
  console.log(`Sin cambios (ya cerrados): ${unchangedCount}`);
  console.log(`Modo: ${APPLY ? 'APLICADO EN BASE DE DATOS' : 'DRY-RUN (usar --apply para ejecutar)'}`);

  await client.end();
}

main().catch(console.error);
