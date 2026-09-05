import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/database';
import { interpolateMessage } from '@/lib/i18n-format';

/**
 * Primer nombre de pila para un saludo directo ("Hola Juan"). No usa
 * formatPublicName (esa es para mostrarle el nombre de ALGUIEN a otra
 * persona, con apellido truncado por privacidad) — aca es la propia
 * persona viendo un mensaje dirigido a si misma, y `session.user` no
 * expone `nickname` (no viaja en el JWT, ver src/lib/auth.ts).
 */
function firstNameOf(name: string | null | undefined): string {
  const trimmed = name?.trim();
  if (!trimmed) return 'che';
  return trimmed.split(/\s+/)[0];
}

/**
 * GET /api/announcements/active?pageKey=catalogo
 *
 * Publico (funciona para visitantes anonimos). Devuelve como mucho 1
 * anuncio: el banner siempre muestra un solo mensaje a la vez, a proposito,
 * para no sentirse pesado. Si hay mas de un candidato activo para la
 * pagina/audiencia, se prioriza el mas reciente.
 *
 * `title`/`body` soportan `{userName}` (ver interpolateMessage) — se
 * resuelve aca, por-viewer, con el primer nombre de quien esta pidiendo el
 * anuncio. Asi un mismo Announcement con audience=SPECIFIC_USERS sirve
 * para todos sus destinatarios sin reescribir el texto por persona (ver
 * plan "Anuncio de bienvenida para el rol Colaborador").
 */
export async function GET(request: NextRequest) {
  try {
    const pageKey = request.nextUrl.searchParams.get('pageKey') || 'home';
    const session = await auth();
    const userId = session?.user?.id;
    const now = new Date();

    const candidates = await prisma.announcement.findMany({
      where: {
        isActive: true,
        pages: { hasSome: [pageKey, 'global'] },
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (candidates.length === 0) {
      return NextResponse.json([]);
    }

    // Solo se resuelve si hace falta: evita una query extra cuando ningun
    // candidato pide audiencia NOTIFICATIONS_ENABLED.
    let notificationsEnabled = false;
    const needsPrefs = candidates.some(
      (a) => a.audience === 'NOTIFICATIONS_ENABLED'
    );
    if (userId && needsPrefs) {
      const prefs = await prisma.notificationPrefs.findUnique({
        where: { userId },
        select: { pushEnabled: true },
      });
      // Ausencia de fila = todo activo (mismo criterio que src/lib/notifications.ts)
      notificationsEnabled = prefs ? prefs.pushEnabled : true;
    }

    // Idem para SPECIFIC_USERS: solo consulta AnnouncementRecipient si hay
    // algun candidato que lo pida, y solo trae los ids del user actual.
    let recipientAnnouncementIds: Set<number> = new Set();
    const specificUserCandidateIds = candidates
      .filter((a) => a.audience === 'SPECIFIC_USERS')
      .map((a) => a.id);
    if (userId && specificUserCandidateIds.length > 0) {
      const recipientRows = await prisma.announcementRecipient.findMany({
        where: { userId, announcementId: { in: specificUserCandidateIds } },
        select: { announcementId: true },
      });
      recipientAnnouncementIds = new Set(
        recipientRows.map((r) => r.announcementId)
      );
    }

    const visible = candidates.filter((a) => {
      if (a.audience === 'EVERYONE') return true;
      if (!userId) return false;
      if (a.audience === 'MEMBERS') return true;
      if (a.audience === 'SPECIFIC_USERS') {
        return recipientAnnouncementIds.has(a.id);
      }
      return notificationsEnabled;
    });

    const chosen = visible[0];
    if (!chosen) return NextResponse.json([]);

    const userName = firstNameOf(session?.user?.name);
    return NextResponse.json([
      {
        ...chosen,
        title: interpolateMessage(chosen.title, { userName }),
        body: interpolateMessage(chosen.body, { userName }),
      },
    ]);
  } catch (error) {
    console.error('Error fetching active announcements:', error);
    return NextResponse.json([]);
  }
}
