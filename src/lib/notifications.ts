import { prisma } from './database';

interface CommentTarget {
  seriesId?: number;
  seasonId?: number;
  episodeId?: number;
}

interface NotifyParticipantsOpts {
  currentCommentId: number;
  currentUserId: string;
  target: CommentTarget;
  seriesIdForLink: number;
  excerpt: string;
}

/**
 * Avisa a todos los usuarios que comentaron antes en el mismo target
 * (serie, temporada o episodio), excluyendo al autor del comentario
 * actual y los comentarios privados. Es no-bloqueante y silencioso:
 * cualquier fallo se ignora para no romper la creación del comment.
 */
export async function notifyParticipantsOfNewComment(
  opts: NotifyParticipantsOpts
): Promise<void> {
  try {
    const where: CommentTarget & { id: { not: number }; isPrivate: false } = {
      ...opts.target,
      id: { not: opts.currentCommentId },
      isPrivate: false,
    };

    const earlier = await prisma.comment.findMany({
      where,
      select: { userId: true },
      distinct: ['userId'],
    });

    const recipients = new Set<string>();
    for (const c of earlier) {
      if (c.userId && c.userId !== opts.currentUserId) {
        recipients.add(c.userId);
      }
    }
    if (recipients.size === 0) return;

    const linkPath = `/series/${opts.seriesIdForLink}`;
    await Promise.all(
      Array.from(recipients).map((userId) =>
        notifyUser({
          userId,
          type: 'comment_thread',
          title: 'Nueva respuesta en una serie que comentaste',
          body: opts.excerpt,
          linkPath,
          refType: 'comment_thread',
          refId: `${opts.target.seriesId ?? ''}:${opts.target.seasonId ?? ''}:${opts.target.episodeId ?? ''}`,
        })
      )
    );
  } catch {
    /* never block the main op */
  }
}

export interface NotificationInput {
  userId: string;
  type: string;
  title: string;
  body?: string;
  linkPath?: string;
  refType?: string;
  refId?: string | number;
}

/**
 * Crea una notificación in-app. Idempotente: si ya existe una con
 * (userId, type, refType, refId) NO LEÍDA, no crea otra duplicada.
 *
 * Esto evita que un mismo evento que se reprocesa varias veces (por
 * retries, jobs desfasados, etc.) genere ruido visual.
 */
export async function notifyUser(input: NotificationInput): Promise<void> {
  const refIdStr = input.refId !== undefined ? String(input.refId) : undefined;

  if (input.refType && refIdStr) {
    const existing = await prisma.notification.findFirst({
      where: {
        userId: input.userId,
        type: input.type,
        refType: input.refType,
        refId: refIdStr,
        readAt: null,
      },
      select: { id: true },
    });
    if (existing) return;
  }

  await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      linkPath: input.linkPath ?? null,
      refType: input.refType ?? null,
      refId: refIdStr ?? null,
    },
  });
}
