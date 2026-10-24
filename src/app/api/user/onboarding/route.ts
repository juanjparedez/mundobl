import { NextRequest, NextResponse } from 'next/server';
import { getOnboardingSeries } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';
import {
  completeOnboarding,
  OnboardingInputError,
  parseOnboardingPicks,
} from '@/lib/onboarding';

// GET - Series al aire para elegir en el "que estas viendo?" del primer ingreso.
export async function GET() {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const series = await getOnboardingSeries();
    return NextResponse.json({ series });
  } catch (error) {
    console.error('Error fetching onboarding series:', error);
    return NextResponse.json(
      { error: 'Error al obtener las series' },
      { status: 500 }
    );
  }
}

// POST - Guarda lo elegido (o nada, si salteo) y no vuelve a mostrar el modal.
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const body = (await request.json()) as { picks?: unknown };
    const picks = parseOnboardingPicks(body.picks ?? []);
    const result = await completeOnboarding(authResult.userId, picks);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof OnboardingInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Error saving onboarding:', error);
    return NextResponse.json(
      { error: 'Error al guardar las series' },
      { status: 500 }
    );
  }
}
