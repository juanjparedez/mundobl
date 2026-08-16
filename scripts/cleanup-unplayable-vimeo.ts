import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

async function main() {
  const { prisma } = await import('../src/lib/database');
  const res = await prisma.series.deleteMany({
    where: { id: { in: [570, 571, 572] } },
  });
  console.log(`✅ Eliminadas ${res.count} series no reproducibles de Vimeo.`);
}

main().catch(console.error);
