import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';
import { getCountryCode } from '@/lib/country-codes';

export async function POST() {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const countries = await prisma.country.findMany();
    let updated = 0;

    for (const country of countries) {
      const code = getCountryCode(country.name);
      if (code && country.code !== code) {
        await prisma.country.update({
          where: { id: country.id },
          data: { code },
        });
        updated++;
      }
    }

    return NextResponse.json({
      message: `Updated ${updated} of ${countries.length} countries`,
      updated,
      total: countries.length,
    });
  } catch (error) {
    console.error('Error backfilling country codes:', error);
    return NextResponse.json(
      { error: 'Failed to backfill country codes' },
      { status: 500 }
    );
  }
}
