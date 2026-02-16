import { NextResponse } from 'next/server';
import { getAllActors } from '@/lib/database';

export async function GET() {
  try {
    const actors = await getAllActors();
    return NextResponse.json(actors);
  } catch (error) {
    console.error('Error fetching actors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch actors' },
      { status: 500 }
    );
  }
}
