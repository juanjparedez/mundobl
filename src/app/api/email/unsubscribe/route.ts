import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { verifyUnsubscribeToken } from '@/lib/email';

/**
 * Baja de correo. A proposito NO pide sesion: quien se quiere ir tiene que
 * poder irse desde el mail, sin loguearse. La autorizacion la da el HMAC
 * del link, que solo permite apagar esta preferencia y nada mas.
 */
async function unsubscribe(userId: string, token: string): Promise<boolean> {
  if (!userId || !token) return false;
  if (!verifyUnsubscribeToken(userId, token)) return false;

  await prisma.notificationPrefs.upsert({
    where: { userId },
    create: { userId, emailEnabled: false },
    update: { emailEnabled: false },
  });
  return true;
}

function page(ok: boolean): NextResponse {
  const title = ok
    ? 'Listo, no te escribimos más'
    : 'No pudimos procesar la baja';
  const body = ok
    ? 'Te sacamos de los correos de MundoBL. Las notificaciones dentro de la app siguen igual — esto solo apaga el mail. Si fue un error, podés volver a activarlo desde tus preferencias.'
    : 'El enlace no es válido o ya venció. Podés desactivar los correos desde tus preferencias en la app.';

  // HTML plano y autocontenido: esto se abre desde un cliente de correo, a
  // veces sin sesion y en un webview. Cargar la app entera para mostrar una
  // frase seria peor experiencia y mas cosas que pueden fallar.
  return new NextResponse(
    `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} | MundoBL</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;
    font:16px/1.6 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
    background:#12101a;color:#ece9f5;padding:24px}
  main{max-width:34rem;text-align:center}
  h1{font-size:1.4rem;margin:0 0 .75rem}
  p{margin:0 0 1.5rem;color:#b9b3cc}
  a{display:inline-block;padding:.6rem 1.2rem;border-radius:8px;
    background:#7c5cff;color:#fff;text-decoration:none;font-weight:600}
</style></head><body><main>
<h1>${title}</h1><p>${body}</p>
<a href="https://mundobl.com.ar">Ir a MundoBL</a>
</main></body></html>`,
    {
      status: ok ? 200 : 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
  );
}

/** Click en el link del cuerpo del mail. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const ok = await unsubscribe(
    params.get('u') ?? '',
    params.get('t') ?? ''
  ).catch(() => false);
  return page(ok);
}

/**
 * One-Click de RFC 8058: Gmail y Yahoo pegan un POST a la URL del header
 * List-Unsubscribe sin abrir nada. Tiene que responder 200 y dar de baja
 * igual, sin pantalla de confirmacion.
 */
export async function POST(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const ok = await unsubscribe(
    params.get('u') ?? '',
    params.get('t') ?? ''
  ).catch(() => false);
  return NextResponse.json({ ok }, { status: ok ? 200 : 400 });
}
