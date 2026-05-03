import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

type CommentsPolicy = 'keep' | 'anonymize' | 'delete';

interface DeleteBody {
  confirmEmail?: string;
  commentsPolicy?: CommentsPolicy;
}

/**
 * DELETE /api/user/account
 *
 * Elimina la cuenta del usuario autenticado. Confirma con el email
 * para evitar accidentes y respeta la política elegida para los
 * comentarios públicos:
 *   - "keep": conserva los comentarios públicos sin borrarlos.
 *   - "anonymize" (default): pone userId=null para que aparezcan
 *     como "Usuario eliminado" preservando el contexto de hilos.
 *   - "delete": borra los comments del usuario.
 *
 * Los comentarios privados siempre se borran junto con el resto de
 * la data personal. NextAuth signOut ocurre del lado del cliente.
 */
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const body = (await request.json().catch(() => ({}))) as DeleteBody;
  const requestedPolicy = body.commentsPolicy;
  const policy: CommentsPolicy =
    requestedPolicy === 'keep' ||
    requestedPolicy === 'anonymize' ||
    requestedPolicy === 'delete'
      ? requestedPolicy
      : 'anonymize';

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { email: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }

  // Confirmación segura: el cliente debe enviar el email exacto.
  if (
    (body.confirmEmail ?? '').trim().toLowerCase() !== user.email.toLowerCase()
  ) {
    return NextResponse.json(
      { error: 'El email de confirmación no coincide.' },
      { status: 400 }
    );
  }

  // Los comentarios privados se eliminan siempre; los públicos siguen la política.
  await prisma.comment.deleteMany({
    where: { userId: auth.userId, isPrivate: true },
  });

  if (policy === 'delete') {
    await prisma.comment.deleteMany({ where: { userId: auth.userId } });
  } else if (policy === 'anonymize') {
    await prisma.comment.updateMany({
      where: { userId: auth.userId },
      data: { userId: null },
    });
  }
  // policy === 'keep': no tocamos los comments restantes (públicos).
  // Nota: por onDelete: SetNull en Comment.user, al borrar el usuario
  // quedarán anonimizados automáticamente.

  // Borramos el resto explicitamente. El schema tiene cascades en la
  // mayoría, pero los hacemos explícitos para no depender del orden.
  await prisma.featureVote.deleteMany({ where: { userId: auth.userId } });
  await prisma.userFavorite.deleteMany({ where: { userId: auth.userId } });
  await prisma.userRating.deleteMany({ where: { userId: auth.userId } });
  await prisma.viewStatus.deleteMany({ where: { userId: auth.userId } });
  await prisma.suggestedSite.deleteMany({ where: { userId: auth.userId } });
  await prisma.featureRequest.deleteMany({ where: { userId: auth.userId } });
  await prisma.notification.deleteMany({ where: { userId: auth.userId } });
  await prisma.commentReport.deleteMany({ where: { userId: auth.userId } });

  // Borrado del User dispara cascades en Account/Session de NextAuth.
  await prisma.user.delete({ where: { id: auth.userId } });

  return NextResponse.json({ ok: true });
}
