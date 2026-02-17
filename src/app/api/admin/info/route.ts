import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';

// GET /api/admin/info — admin only, returns project links from env vars
export async function GET() {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const links = {
      github: process.env.PROJECT_GITHUB_URL || null,
      vercel: process.env.PROJECT_VERCEL_URL || null,
      supabase: process.env.PROJECT_SUPABASE_URL || null,
    };

    return NextResponse.json({ links });
  } catch (error) {
    console.error('Error fetching admin info:', error);
    return NextResponse.json(
      { error: 'Error al obtener info del proyecto' },
      { status: 500 }
    );
  }
}
