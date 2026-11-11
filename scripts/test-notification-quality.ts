import assert from 'node:assert/strict';
import { metaDescription } from '../src/lib/content-metadata';
import { localToUtcHHMM, utcToLocalHHMM } from '../src/lib/quiet-hours';
import { renderAnnouncementEmail } from '../src/lib/email-templates';

// --- metaDescription ---
assert.equal(metaDescription(null), null);
assert.equal(metaDescription('   \n '), null);
assert.equal(metaDescription('Corta.\nDos lineas.'), 'Corta. Dos lineas.');
const long = 'Cher, un estudiante universitario en su último año, '.repeat(6);
const desc = metaDescription(long)!;
assert.ok(desc.length <= 158, `<= 158 chars, got ${desc.length}`);
assert.ok(desc.endsWith('…'));
assert.ok(!/\s…$/.test(desc), 'no space before the ellipsis');
assert.ok(long.startsWith(desc.slice(0, -1)), 'cut at a word boundary');

// --- Horario silencioso: local <-> UTC (Argentina = offset 180) ---
assert.equal(localToUtcHHMM('23:00', 180), '02:00');
assert.equal(localToUtcHHMM('08:30', 180), '11:30');
assert.equal(utcToLocalHHMM('02:00', 180), '23:00');
assert.equal(localToUtcHHMM('01:00', -420), '18:00'); // Bangkok, UTC+7
assert.equal(utcToLocalHHMM(localToUtcHHMM('07:15', -60), -60), '07:15');

// --- Anuncio: el Markdown sale con estilos inline ---
const { html } = renderAnnouncementEmail({
  title: 'Novedades',
  body: '## Titulo\n\nUn [link](https://mundobl.com.ar/x) y texto.\n\n- uno',
  unsubscribeUrl: 'https://mundobl.com.ar/api/email/unsubscribe?u=a&t=b',
  siteUrl: 'https://mundobl.com.ar',
});
assert.match(
  html,
  /<a style="color:#[0-9a-f]{6};[^"]*" href="https:\/\/mundobl\.com\.ar\/x"/
);
assert.match(html, /<h2 style="[^"]+">Titulo<\/h2>/);
assert.match(html, /<li style="[^"]+">uno<\/li>/);

console.log(
  'notification quality: meta description, quiet hours, email markdown ok'
);
