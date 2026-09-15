import { NextResponse } from 'next/server';
import { getCatalogBasedOnValues } from '@/lib/database';
import { getBasedOnSuggestions } from '@/lib/based-on';

export async function GET() {
  try {
    return NextResponse.json(
      getBasedOnSuggestions(await getCatalogBasedOnValues())
    );
  } catch (error) {
    console.error('Error fetching basedOn values:', error);
    return NextResponse.json([], { status: 500 });
  }
}
