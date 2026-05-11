import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

// Plataformas soportadas en el JSON User.socials. Para agregar mas
// (Threads, Bluesky, etc) sumar la key aca y al SocialsWidget. Cada
// valor es el handle/username (sin URL completa) — el SocialsWidget
// renderea la URL via su helper buildSocialUrl.
const SOCIAL_KEYS = [
  'twitter',
  'instagram',
  'letterboxd',
  'mal',
  'mdl',
] as const;
type SocialKey = (typeof SOCIAL_KEYS)[number];
type SocialsPayload = Partial<Record<SocialKey, string | null>>;

const HANDLE_REGEX = /^[\p{L}\p{N}_.\-/]{1,60}$/u;

/** Sanitiza el payload de socials desde el body. Solo acepta keys
 *  conocidas; ignora todo lo demas. Cada handle se trim, se valida
 *  con HANDLE_REGEX (chars seguros + max 60). null => limpiar. */
function parseSocials(raw: unknown): SocialsPayload | null | undefined {
  if (raw === null) return null;
  if (typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const out: SocialsPayload = {};
  const input = raw as Record<string, unknown>;
  for (const key of SOCIAL_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(input, key)) continue;
    const value = input[key];
    if (value === null || value === '') {
      out[key] = null;
      continue;
    }
    if (typeof value !== 'string') return undefined; // invalid shape
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      out[key] = null;
      continue;
    }
    if (!HANDLE_REGEX.test(trimmed)) return undefined;
    out[key] = trimmed;
  }
  return out;
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const body = (await request.json()) as {
      nickname?: unknown;
      socials?: unknown;
    };

    // Para `socials` (Json field nullable), Prisma exige Prisma.DbNull
    // para limpiar (no acepta plain null). Para set se pasa el objeto
    // normal. Por eso el tipo de la prop es mas ancho que SocialsPayload.
    const data: {
      nickname?: string | null;
      socials?: SocialsPayload | typeof Prisma.DbNull;
    } = {};

    if (Object.prototype.hasOwnProperty.call(body, 'nickname')) {
      const raw = body.nickname;
      if (raw === null) {
        data.nickname = null;
      } else if (typeof raw === 'string') {
        const trimmed = raw.trim();
        if (trimmed.length === 0) {
          data.nickname = null;
        } else if (trimmed.length > 40) {
          return NextResponse.json(
            { error: 'El nickname no puede tener más de 40 caracteres' },
            { status: 422 }
          );
        } else if (!/^[\p{L}\p{N}_.\- ]+$/u.test(trimmed)) {
          return NextResponse.json(
            {
              error:
                'El nickname solo puede tener letras, numeros, espacios, puntos, guiones y guiones bajos',
            },
            { status: 422 }
          );
        } else {
          data.nickname = trimmed;
        }
      } else {
        return NextResponse.json(
          { error: 'nickname debe ser string o null' },
          { status: 400 }
        );
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, 'socials')) {
      const parsed = parseSocials(body.socials);
      if (parsed === undefined) {
        return NextResponse.json(
          { error: 'socials payload invalido (revisa formato y caracteres)' },
          { status: 422 }
        );
      }
      // Si parsed es null (user mando null explicito) o si es un objeto
      // donde TODOS los handles son null/empty → limpiar a Prisma.DbNull.
      // Sino, set normal.
      if (parsed === null) {
        data.socials = Prisma.DbNull;
      } else {
        const hasAny = Object.values(parsed).some(
          (v) => typeof v === 'string' && v.length > 0
        );
        data.socials = hasAny ? parsed : Prisma.DbNull;
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No hay campos para actualizar' },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: authResult.userId },
      data,
      select: {
        id: true,
        name: true,
        nickname: true,
        image: true,
        socials: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error al actualizar perfil';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
