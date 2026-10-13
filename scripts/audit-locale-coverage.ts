import { SUPPORTED_LOCALES } from '../src/i18n/config';
import { loadLocaleMessages } from '../src/i18n/messages';

function flatten(value: unknown, prefix = ''): Record<string, string> {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, item]) => {
      const name = prefix ? `${prefix}.${key}` : key;
      return typeof item === 'string'
        ? [[name, item]]
        : Object.entries(flatten(item, name));
    })
  );
}

const placeholders = (text: string) =>
  [...new Set(text.match(/\{\w+\}/g) ?? [])].sort().join(',');

async function main() {
  const base = flatten(await loadLocaleMessages('es'));
  let errors = 0;
  for (const locale of SUPPORTED_LOCALES) {
    const messages = flatten(await loadLocaleMessages(locale));
    const missing = Object.keys(base).filter(
      (key) =>
        !(key in messages) || (base[key].trim() !== '' && !messages[key].trim())
    );
    const extra = Object.keys(messages).filter((key) => !(key in base));
    const variables = Object.keys(base).filter(
      (key) =>
        messages[key] && placeholders(messages[key]) !== placeholders(base[key])
    );
    console.log(
      `${locale}: ${Object.keys(messages).length} keys; missing=${missing.length}; extra=${extra.length}; placeholders=${variables.length}`
    );
    if (missing.length || extra.length || variables.length) {
      console.log(JSON.stringify({ missing, extra, variables }));
      errors += missing.length + extra.length + variables.length;
    }
  }
  if (errors) process.exitCode = 1;
}
void main();
