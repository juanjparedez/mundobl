import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

/**
 * Plantillas de correo de MundoBL.
 *
 * Todas comparten `renderLayout` para que la marca, el ancho, el preheader
 * y el pie salgan iguales sin copiar HTML. Cada plantilla solo aporta su
 * cuerpo y su pie.
 *
 * Dos decisiones que atraviesan el archivo:
 *
 * 1. Estilos INLINE y tablas. Gmail descarta buena parte de lo que venga en
 *    <style> y Outlook ignora el CSS moderno de layout. Los hex literales
 *    son a proposito: en un mail no existen las variables CSS ni los skins.
 *
 * 2. Dos tipos de correo, con pies distintos:
 *    - MASIVO (anuncios): exige opt-in (`NotificationPrefs.emailEnabled`) y
 *      lleva link de baja + header List-Unsubscribe.
 *    - TRANSACCIONAL (bienvenida, acceso, respuesta de soporte): responde a
 *      algo que la persona hizo recien, asi que no se condiciona al opt-in
 *      y no lleva baja — dar de baja el mail que contesta tu propia consulta
 *      no tiene sentido. Sí dice por que llega.
 *
 * El Markdown de los anuncios se procesa con el mismo pipeline
 * remark/rehype que usa <ReactMarkdown> por dentro; no se puede reusar el
 * componente porque exige react-dom/server, prohibido en el App Router.
 */

// ============================================================
// Base compartida
// ============================================================

const BG = '#12101a';
const CARD = '#1b1826';
const TEXT = '#ece9f5';
const MUTED = '#b9b3cc';
const ACCENT = '#7c5cff';
const BORDER = '#2b2740';

/** Logo servido por el sitio. Publico y estable. */
const LOGO_URL = 'https://mundobl.com.ar/icons/icon-192x192.png';

export const SITE_URL = 'https://mundobl.com.ar';

/** Lo que toda plantilla devuelve: asunto y las dos versiones del cuerpo. */
export interface EmailRender {
  subject: string;
  html: string;
  text: string;
}

const markdownProcessor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeStringify);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Quita marcas de Markdown para el preheader y el texto plano. */
function stripMarkdown(value: string): string {
  return value
    .replace(/[#*_>`[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function ctaHtml(url?: string | null, label?: string | null): string {
  if (!url || !label) return '';
  return `<p style="margin:28px 0 0"><a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 22px;border-radius:8px;background:${ACCENT};color:#fff;text-decoration:none;font-weight:600">${escapeHtml(label)}</a></p>`;
}

interface LayoutInput {
  preheader: string;
  heading: string;
  /** HTML ya renderizado del cuerpo. */
  bodyHtml: string;
  ctaUrl?: string | null;
  ctaLabel?: string | null;
  /** HTML del pie, sin el separador. */
  footerHtml: string;
  siteUrl?: string;
}

function renderLayout(input: LayoutInput): string {
  const siteUrl = input.siteUrl ?? SITE_URL;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"></head>
<body style="margin:0;padding:24px 12px;background:${BG};font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif">

  <!-- Vista previa en la bandeja. Oculto en el cuerpo; los &zwnj; con el
       espaciado evitan que Gmail siga leyendo el texto que viene despues. -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;height:0;width:0">
    ${escapeHtml(input.preheader)}${'&zwnj;&nbsp;'.repeat(60)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin:0 auto">

    <!-- Cabecera: el logo puede venir bloqueado por el cliente, asi que el
         nombre va como TEXTO al lado y la marca se lee igual. -->
    <tr><td style="padding:0 8px 18px">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding-right:12px">
            <a href="${escapeHtml(siteUrl)}" style="text-decoration:none">
              <img src="${LOGO_URL}" width="48" height="48" alt="MundoBL"
                   style="display:block;width:48px;height:48px;border:0;border-radius:10px">
            </a>
          </td>
          <td>
            <a href="${escapeHtml(siteUrl)}" style="text-decoration:none;color:${TEXT};font-size:19px;font-weight:700;letter-spacing:.2px">MundoBL</a>
          </td>
        </tr>
      </table>
    </td></tr>

    <tr><td style="background:${CARD};border-radius:14px;padding:32px;border:1px solid ${BORDER}">
      <h1 style="margin:0 0 18px;font-size:22px;line-height:1.3;color:${TEXT}">${escapeHtml(input.heading)}</h1>
      <div style="font-size:16px;line-height:1.65;color:${TEXT}">${input.bodyHtml}</div>
      ${ctaHtml(input.ctaUrl, input.ctaLabel)}
    </td></tr>

    <tr><td style="padding:22px 8px 0">
      <div style="height:1px;background:${BORDER};line-height:1px;font-size:0">&nbsp;</div>
    </td></tr>

    <tr><td style="padding:18px 8px;text-align:center;font-size:13px;line-height:1.6;color:${MUTED}">
      ${input.footerHtml}
    </td></tr>
  </table>
</body></html>`;
}

/** Pie de correo MASIVO: dice por que llega y como salir. */
function bulkFooter(unsubscribeUrl: string, siteUrl: string): string {
  return `<p style="margin:0 0 8px">Te llega este correo porque activaste los avisos por mail en MundoBL.</p>
      <p style="margin:0">
        <a href="${escapeHtml(unsubscribeUrl)}" style="color:${MUTED};text-decoration:underline">Darme de baja</a>
        &nbsp;·&nbsp;
        <a href="${escapeHtml(siteUrl)}" style="color:${MUTED};text-decoration:underline">Ir al sitio</a>
      </p>`;
}

/** Pie TRANSACCIONAL: sin baja, pero explicando el motivo del envio. */
function transactionalFooter(reason: string, siteUrl: string): string {
  return `<p style="margin:0 0 8px">${escapeHtml(reason)}</p>
      <p style="margin:0">
        <a href="${escapeHtml(siteUrl)}/perfil" style="color:${MUTED};text-decoration:underline">Preferencias de aviso</a>
        &nbsp;·&nbsp;
        <a href="${escapeHtml(siteUrl)}" style="color:${MUTED};text-decoration:underline">Ir al sitio</a>
      </p>`;
}

/** Convierte parrafos de texto plano en HTML, escapando el contenido. */
function paragraphs(...lines: string[]): string {
  return lines
    .filter(Boolean)
    .map(
      (line, index) =>
        `<p style="margin:${index === 0 ? '0' : '14px'} 0 0">${line}</p>`
    )
    .join('\n      ');
}

// ============================================================
// 1. Anuncio (MASIVO)
// ============================================================

export interface AnnouncementEmailInput {
  title: string;
  body: string;
  linkUrl?: string | null;
  linkLabel?: string | null;
  unsubscribeUrl: string;
  siteUrl: string;
  /**
   * Texto de vista previa: lo que el cliente muestra al lado del asunto en
   * la bandeja. Sin esto, Gmail agarra la primera linea del cuerpo, que
   * suele quedar cortada a la mitad. Default: el comienzo del cuerpo.
   */
  preheader?: string;
}

export function renderAnnouncementEmail(
  input: AnnouncementEmailInput
): EmailRender {
  const bodyHtml = String(markdownProcessor.processSync(input.body));
  const preheader = (input.preheader ?? stripMarkdown(input.body)).slice(
    0,
    140
  );

  const html = renderLayout({
    preheader,
    heading: input.title,
    bodyHtml,
    ctaUrl: input.linkUrl,
    ctaLabel: input.linkLabel,
    footerHtml: bulkFooter(input.unsubscribeUrl, input.siteUrl),
    siteUrl: input.siteUrl,
  });

  // El texto plano va con el Markdown crudo: se lee bien tal cual, y es
  // preferible a una conversion propia que rompa el formato.
  const text = [
    input.title,
    '',
    input.body,
    input.linkUrl ? `\n${input.linkLabel ?? 'Ver mas'}: ${input.linkUrl}` : '',
    '',
    '---',
    'Te llega este correo porque activaste los avisos por mail en MundoBL.',
    `Darme de baja: ${input.unsubscribeUrl}`,
  ]
    .filter((line) => line !== '')
    .join('\n');

  return { subject: input.title, html, text };
}

// ============================================================
// 2. Bienvenida (TRANSACCIONAL)
// ============================================================

export interface WelcomeEmailInput {
  /** Nombre o nickname. Si falta, se saluda sin nombre. */
  name?: string | null;
  siteUrl?: string;
}

/**
 * Se dispara al crear la cuenta. Hay un hook listo para engancharlo en
 * `events.createUser` de src/lib/auth.ts.
 *
 * Redaccion sin genero a proposito ("te damos la bienvenida" y no
 * "bienvenido/a"): entran por Google y no sabemos como se identifica nadie.
 */
export function renderWelcomeEmail(input: WelcomeEmailInput = {}): EmailRender {
  const siteUrl = input.siteUrl ?? SITE_URL;
  const saludo = input.name ? `¡Hola, ${escapeHtml(input.name)}!` : '¡Hola!';

  const bodyHtml = paragraphs(
    `${saludo} Te damos la bienvenida a MundoBL, un catálogo de series BL y GL hecho a mano, sin algoritmos y sin pirateria.`,
    'Algunas cosas que podés hacer desde ahora:',
    `<strong style="color:${TEXT}">Seguir lo que mirás</strong> — marcá capítulos vistos y llevá notas privadas de cada serie.`,
    `<strong style="color:${TEXT}">Ver legal</strong> — en la sección Ver enlazamos solo canales oficiales.`,
    `<strong style="color:${TEXT}">Aprender el vocabulario</strong> — el Glosario Cultural explica honoríficos y términos que las traducciones se comen.`,
    'Si en algún momento no querés recibir más correos nuestros, se apaga desde tus preferencias. Por default te mandamos lo mínimo.'
  );

  const text = [
    input.name ? `¡Hola, ${input.name}!` : '¡Hola!',
    '',
    'Te damos la bienvenida a MundoBL, un catálogo de series BL y GL hecho a mano, sin algoritmos y sin pirateria.',
    '',
    'Algunas cosas que podés hacer desde ahora:',
    '- Seguir lo que mirás: capítulos vistos y notas privadas.',
    '- Ver legal: en /ver enlazamos solo canales oficiales.',
    '- El Glosario Cultural, con los honorificos y terminos que las traducciones se comen.',
    '',
    `Empezá por acá: ${siteUrl}/catalogo`,
    '',
    '---',
    'Te llega este correo porque acabás de crear tu cuenta en MundoBL.',
  ].join('\n');

  return {
    subject: 'Te damos la bienvenida a MundoBL',
    html: renderLayout({
      preheader: 'Tu cuenta ya está lista. Esto es lo que podés hacer.',
      heading: 'Bienvenida a MundoBL',
      bodyHtml,
      ctaUrl: `${siteUrl}/catalogo`,
      ctaLabel: 'Explorar el catálogo',
      footerHtml: transactionalFooter(
        'Te llega este correo porque acabás de crear tu cuenta en MundoBL.',
        siteUrl
      ),
      siteUrl,
    }),
    text,
  };
}

// ============================================================
// 3. Enlace de acceso / magic link (TRANSACCIONAL)
// ============================================================

export interface SignInLinkEmailInput {
  url: string;
  /** Minutos de validez del enlace. Debe coincidir con el proveedor. */
  expiresInMinutes: number;
  siteUrl?: string;
}

/**
 * Para cuando se agregue el proveedor de email a NextAuth (login sin
 * contraseña). Hoy no hay flujo que la dispare.
 *
 * El enlace va tambien como texto plano visible: muchos clientes rompen los
 * enlaces largos, y si el boton falla la persona tiene que poder copiarlo.
 */
export function renderSignInLinkEmail(
  input: SignInLinkEmailInput
): EmailRender {
  const siteUrl = input.siteUrl ?? SITE_URL;
  const bodyHtml = paragraphs(
    'Tocá el botón para entrar a tu cuenta. No hace falta contraseña.',
    `El enlace vence en ${input.expiresInMinutes} minutos y sirve una sola vez.`,
    `<span style="color:${MUTED};font-size:14px">Si no pediste entrar, ignorá este correo: sin tocar el enlace no pasa nada.</span>`,
    `<span style="color:${MUTED};font-size:13px;word-break:break-all">Si el botón no funciona, copiá esta dirección:<br>${escapeHtml(input.url)}</span>`
  );

  const text = [
    'Entrá a MundoBL',
    '',
    'Abrí este enlace para entrar a tu cuenta. No hace falta contraseña.',
    '',
    input.url,
    '',
    `Vence en ${input.expiresInMinutes} minutos y sirve una sola vez.`,
    'Si no pediste entrar, ignorá este correo.',
  ].join('\n');

  return {
    subject: 'Tu enlace para entrar a MundoBL',
    html: renderLayout({
      preheader: `Vence en ${input.expiresInMinutes} minutos y sirve una sola vez.`,
      heading: 'Entrá a MundoBL',
      bodyHtml,
      ctaUrl: input.url,
      ctaLabel: 'Entrar a mi cuenta',
      footerHtml: transactionalFooter(
        'Te llega este correo porque alguien pidió entrar con esta dirección.',
        siteUrl
      ),
      siteUrl,
    }),
    text,
  };
}

// ============================================================
// 4. Respuesta de soporte (TRANSACCIONAL)
// ============================================================

export interface SupportReplyEmailInput {
  /** Asunto del hilo, tal como lo escribio el colaborador. */
  threadSubject: string;
  /** Comienzo de la respuesta de curaduria. */
  excerpt: string;
  threadUrl: string;
  siteUrl?: string;
}

/**
 * Espeja la notificacion in-app que ya dispara
 * POST /api/soporte/[id] cuando curaduria responde. El colaborador abrio
 * el hilo: no se condiciona al opt-in.
 */
export function renderSupportReplyEmail(
  input: SupportReplyEmailInput
): EmailRender {
  const siteUrl = input.siteUrl ?? SITE_URL;
  const bodyHtml = paragraphs(
    `Respondimos tu consulta <strong style="color:${TEXT}">«${escapeHtml(input.threadSubject)}»</strong>.`,
    `<span style="color:${MUTED};border-left:3px solid ${BORDER};padding-left:12px;display:inline-block">${escapeHtml(input.excerpt)}</span>`,
    'Podés seguir la conversación desde tu panel.'
  );

  const text = [
    `Respondimos tu consulta: ${input.threadSubject}`,
    '',
    input.excerpt,
    '',
    `Seguir la conversación: ${input.threadUrl}`,
    '',
    '---',
    'Te llega este correo porque abriste una consulta de soporte en MundoBL.',
  ].join('\n');

  return {
    subject: `Respondimos tu consulta: «${input.threadSubject}»`,
    html: renderLayout({
      preheader: input.excerpt.slice(0, 140),
      heading: 'Tenés una respuesta',
      bodyHtml,
      ctaUrl: input.threadUrl,
      ctaLabel: 'Ver la conversación',
      footerHtml: transactionalFooter(
        'Te llega este correo porque abriste una consulta de soporte en MundoBL.',
        siteUrl
      ),
      siteUrl,
    }),
    text,
  };
}

// ============================================================
// 5. Aporte revisado (TRANSACCIONAL)
// ============================================================

export interface ContributionReviewedEmailInput {
  /** Lo aportado: un término del glosario, una serie, etc. */
  itemName: string;
  approved: boolean;
  /** Nota del moderador. Se muestra sobre todo cuando se rechaza. */
  note?: string | null;
  url: string;
  siteUrl?: string;
}

/**
 * Espeja el aviso in-app de PATCH /api/admin/glossary-suggestions/[id] y
 * sirve igual para aportes de colaborador. Un aporte que queda en el limbo
 * es la forma mas rapida de perder a quien colabora.
 */
export function renderContributionReviewedEmail(
  input: ContributionReviewedEmailInput
): EmailRender {
  const siteUrl = input.siteUrl ?? SITE_URL;
  const nota = input.note?.trim();

  const bodyHtml = input.approved
    ? paragraphs(
        `Publicamos tu aporte <strong style="color:${TEXT}">«${escapeHtml(input.itemName)}»</strong>. Ya está en MundoBL para toda la comunidad.`,
        nota
          ? `<span style="color:${MUTED}">${escapeHtml(nota)}</span>`
          : 'Gracias por sumar: el catálogo crece por gente que se toma este trabajo.'
      )
    : paragraphs(
        `Revisamos tu aporte <strong style="color:${TEXT}">«${escapeHtml(input.itemName)}»</strong> y por ahora no lo sumamos.`,
        nota
          ? `<span style="color:${MUTED};border-left:3px solid ${BORDER};padding-left:12px;display:inline-block">${escapeHtml(nota)}</span>`
          : 'Podés volver a proponerlo con más contexto cuando quieras.',
        'No es un portazo: casi siempre es cuestión de precisar la fuente o el contexto.'
      );

  const text = [
    input.approved
      ? `Publicamos tu aporte: ${input.itemName}`
      : `Revisamos tu aporte: ${input.itemName}`,
    '',
    nota ?? '',
    '',
    input.url,
    '',
    '---',
    'Te llega este correo porque propusiste un aporte en MundoBL.',
  ]
    .filter((line, index, all) => !(line === '' && all[index - 1] === ''))
    .join('\n');

  return {
    subject: input.approved
      ? `Publicamos tu aporte: «${input.itemName}»`
      : `Revisamos tu aporte: «${input.itemName}»`,
    html: renderLayout({
      preheader: input.approved
        ? 'Tu aporte ya está publicado en MundoBL.'
        : 'Revisamos tu aporte. Te contamos por qué.',
      heading: input.approved
        ? 'Tu aporte está publicado'
        : 'Revisamos tu aporte',
      bodyHtml,
      ctaUrl: input.url,
      ctaLabel: input.approved ? 'Verlo publicado' : 'Ir a MundoBL',
      footerHtml: transactionalFooter(
        'Te llega este correo porque propusiste un aporte en MundoBL.',
        siteUrl
      ),
      siteUrl,
    }),
    text,
  };
}
