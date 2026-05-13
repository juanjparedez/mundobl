/* eslint-disable no-console */
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

interface BacklogItem {
  title: string;
  description: string;
  type: 'bug' | 'feature' | 'idea';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

const ITEMS: BacklogItem[] = [
  {
    title: 'Directores: rediseño UX/UI de la página pública',
    description:
      'La vista actual de directores se percibe mínima/no presentable. Hacer una pasada completa de UX/UI para que se vea editorial y agradable: hero de perfil, jerarquía visual, mejor grilla de filmografía, estados vacíos y responsive.',
    type: 'feature',
    priority: 'HIGH',
  },
  {
    title: 'Directores: ampliar información pública disponible',
    description:
      'Agregar más contexto en perfil de director para evitar ficha vacía. Evaluar campos y fuentes: bio corta, alias/nombre original, país, obras destacadas y enlaces relacionados. Definir qué metadata nueva guardar en DB y fallback cuando falte data.',
    type: 'feature',
    priority: 'MEDIUM',
  },
  {
    title: 'Taxonomía y exposición pública de tags sensibles',
    description:
      'Revisión de criterio editorial para tags sensibles (ejemplo: bisexual) en listados públicos/SEO. Objetivo: mantener utilidad de descubrimiento sin que la presentación se perciba incómoda o estigmatizante. Evaluar naming, contexto explicativo, visibilidad por superficie e indexación.',
    type: 'idea',
    priority: 'MEDIUM',
  },
];

async function main() {
  const { prisma } = await import('../src/lib/database');

  let created = 0;
  let skipped = 0;

  for (const item of ITEMS) {
    const existing = await prisma.featureRequest.findFirst({
      where: { title: item.title },
      select: { id: true },
    });

    if (existing) {
      console.log(`[skip] ${item.title} (id=${existing.id})`);
      skipped++;
      continue;
    }

    const row = await prisma.featureRequest.create({
      data: {
        title: item.title,
        description: item.description,
        type: item.type,
        priority: item.priority,
        status: 'OPEN',
      },
      select: { id: true },
    });

    console.log(`[add] #${row.id} [${item.priority}] [${item.type}] ${item.title}`);
    created++;
  }

  console.log(`\nDone. Created=${created}, Skipped=${skipped}`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
