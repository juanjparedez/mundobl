import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

/**
 * Plantilla del anuncio por correo.
 *
 * El cuerpo se escribe en Markdown desde /admin/anuncios. No se puede
 * reusar el <ReactMarkdown> de AnnouncementContent porque eso exige
 * react-dom/server, que el App Router prohibe importar. Se usa entonces el
 * mismo pipeline remark/rehype que ese componente corre por dentro, pero
 * emitiendo HTML en vez de JSX — asi el mail y el banner interpretan el
 * Markdown igual.
 *
 * Los cuatro paquetes ya venian instalados como dependencias transitivas de
 * react-markdown; se declararon explicitos en package.json para no depender
 * de un arbol ajeno que un upgrade podria podar.
 *
 * Los estilos van inline y no en una hoja: Gmail descarta buena parte de lo
 * que venga en <style>, y un mail sin estilos aplicados se ve roto.
 */

export interface AnnouncementEmailInput {
  title: string;
  body: string;
  linkUrl?: string | null;
  linkLabel?: string | null;
  unsubscribeUrl: string;
  siteUrl: string;
}

const BG = '#12101a';
const CARD = '#1b1826';
const TEXT = '#ece9f5';
const MUTED = '#b9b3cc';
const ACCENT = '#7c5cff';

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

export function renderAnnouncementEmail(input: AnnouncementEmailInput): {
  html: string;
  text: string;
} {
  const bodyHtml = String(markdownProcessor.processSync(input.body));

  const cta =
    input.linkUrl && input.linkLabel
      ? `<p style="margin:28px 0 0"><a href="${escapeHtml(input.linkUrl)}" style="display:inline-block;padding:12px 22px;border-radius:8px;background:${ACCENT};color:#fff;text-decoration:none;font-weight:600">${escapeHtml(input.linkLabel)}</a></p>`
      : '';

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px;background:${BG};font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto">
    <tr><td style="background:${CARD};border-radius:14px;padding:32px">
      <h1 style="margin:0 0 18px;font-size:22px;line-height:1.3;color:${TEXT}">${escapeHtml(input.title)}</h1>
      <div style="font-size:16px;line-height:1.65;color:${TEXT}">${bodyHtml}</div>
      ${cta}
    </td></tr>
    <tr><td style="padding:22px 8px;text-align:center;font-size:13px;line-height:1.6;color:${MUTED}">
      <p style="margin:0 0 6px">Te llega este correo porque activaste los avisos por mail en MundoBL.</p>
      <p style="margin:0">
        <a href="${escapeHtml(input.unsubscribeUrl)}" style="color:${MUTED}">Darme de baja</a>
        &nbsp;·&nbsp;
        <a href="${escapeHtml(input.siteUrl)}" style="color:${MUTED}">MundoBL</a>
      </p>
    </td></tr>
  </table>
</body></html>`;

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

  return { html, text };
}
