import { Prisma } from '@/generated/prisma';

/**
 * Busca un tag existente de forma insensible a mayúsculas y espacios, y solo
 * crea uno nuevo si no hay match. Reemplaza al `upsert({ where: { name } })`
 * que matcheaba por `name` exacto (case/whitespace-sensitive) y generaba
 * duplicados: "Enemy to Lovers" vs "enemy to lovers" vs "Enemy to Lovers ".
 *
 * Acepta el cliente Prisma o un cliente de transacción (`Prisma.TransactionClient`).
 * Devuelve `null` si el nombre queda vacío tras el trim.
 */
export async function findOrCreateTag(
  client: Prisma.TransactionClient,
  rawName: string,
  category = 'trope'
): Promise<{ id: number; name: string } | null> {
  const name = rawName.trim();
  if (!name) return null;

  const existing = await client.tag.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
    select: { id: true, name: true },
  });
  if (existing) return existing;

  try {
    return await client.tag.create({
      data: { name, category },
      select: { id: true, name: true },
    });
  } catch (error) {
    // Carrera: otra request creó el mismo tag entre el findFirst y el create.
    // El @unique de Postgres es case-sensitive, así que este catch cubre el
    // caso de colisión exacta; reintentamos la búsqueda insensible.
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      return client.tag.findFirst({
        where: { name: { equals: name, mode: 'insensitive' } },
        select: { id: true, name: true },
      });
    }
    throw error;
  }
}

/**
 * Igual que {@link findOrCreateTag} pero para `Genre` (que no tiene `category`).
 * Evita duplicados por diferencia de mayúsculas/espacios en el mismo flujo de
 * guardado de series.
 */
export async function findOrCreateGenre(
  client: Prisma.TransactionClient,
  rawName: string
): Promise<{ id: number; name: string } | null> {
  const name = rawName.trim();
  if (!name) return null;

  const existing = await client.genre.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
    select: { id: true, name: true },
  });
  if (existing) return existing;

  try {
    return await client.genre.create({
      data: { name },
      select: { id: true, name: true },
    });
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      return client.genre.findFirst({
        where: { name: { equals: name, mode: 'insensitive' } },
        select: { id: true, name: true },
      });
    }
    throw error;
  }
}
