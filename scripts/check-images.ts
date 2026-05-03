import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const db = new PrismaClient({ adapter });
  const all = await db.series.findMany({
    select: { id: true, title: true, imageUrl: true },
  });

  console.log('Total series:', all.length);
  const withImg = all.filter((s) => s.imageUrl);
  const withoutImg = all.length - withImg.length;
  console.log('Con imageUrl:', withImg.length);
  console.log('Sin imageUrl:', withoutImg);

  const supabase = withImg.filter((s) => s.imageUrl?.includes('supabase.co'));
  const externas = withImg.filter((s) => !s.imageUrl?.includes('supabase.co'));
  console.log('Supabase:', supabase.length);
  console.log('Externas (no-Supabase):', externas.length);

  if (externas.length > 0) {
    console.log('\n[Externas] primeras 8:');
    externas.slice(0, 8).forEach((s) => {
      console.log(`  - ${s.title} → ${s.imageUrl?.slice(0, 100)}`);
    });
    const hosts = new Map<string, number>();
    for (const s of externas) {
      try {
        const h = new URL(s.imageUrl!).hostname;
        hosts.set(h, (hosts.get(h) ?? 0) + 1);
      } catch {
        hosts.set('[invalid]', (hosts.get('[invalid]') ?? 0) + 1);
      }
    }
    console.log('\nHosts externos:');
    [...hosts.entries()]
      .sort((a, b) => b[1] - a[1])
      .forEach(([h, n]) => console.log(`  ${h}: ${n}`));
  }

  // Probar HEAD a una muestra de URLs para ver fallos reales
  console.log('\nProbando HEAD a 12 URLs aleatorias…');
  const sample = withImg
    .map((s) => ({ s, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, 12)
    .map((x) => x.s);

  for (const s of sample) {
    try {
      const r = await fetch(s.imageUrl!, { method: 'HEAD' });
      const host = new URL(s.imageUrl!).hostname;
      console.log(`  [${r.status}] ${host} :: ${s.title}`);
    } catch (e) {
      console.log(`  [ERR] ${s.title}: ${(e as Error).message}`);
    }
  }

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
