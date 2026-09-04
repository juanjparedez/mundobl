import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';
import { CULTURAL_GLOSSARY } from '../src/data/cultural-glossary';

function makeSlug(value: string, index: number): string {
  const normalized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || `term-${index + 1}`;
}

async function main() {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DIRECT_URL o DATABASE_URL es requerida para ejecutar el seed.'
    );
  }

  const pool = new Pool({ connectionString });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    for (const [index, item] of CULTURAL_GLOSSARY.entries()) {
      const slug = makeSlug(item.transliteration ?? item.term, index);
      await prisma.glossaryTerm.upsert({
        where: { slug },
        create: {
          slug,
          term: item.term,
          transliteration: item.transliteration ?? null,
          country: item.country,
          category: item.category,
          meaning: item.meaning,
          context: item.context,
          commonMistake: item.commonMistake ?? null,
          examples: item.examples ?? null,
          publishedAt: new Date(),
        },
        update: {
          term: item.term,
          transliteration: item.transliteration ?? null,
          country: item.country,
          category: item.category,
          meaning: item.meaning,
          context: item.context,
          commonMistake: item.commonMistake ?? null,
          examples: item.examples ?? null,
          status: 'PUBLISHED',
        },
      });
    }

    process.stdout.write(
      `Seeded ${CULTURAL_GLOSSARY.length} glossary terms.\n`
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

void main();
