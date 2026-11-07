/**
 * CHANGELOG.md parseado. El contenido llega inlineado en el build
 * (MUNDOBL_CHANGELOG_MD, ver next.config.ts) porque en Cloudflare Workers no
 * hay filesystem en runtime.
 */

export interface ChangelogMarkdownItem {
  body: string;
  category: string | null;
}

export interface ChangelogMarkdownEntry {
  version: string;
  items: ChangelogMarkdownItem[];
}

/** `## version`, `### Categoria` y `- item` (con continuaciones de linea). */
export function parseChangelogMarkdown(
  content: string
): ChangelogMarkdownEntry[] {
  const entries: ChangelogMarkdownEntry[] = [];
  let current: ChangelogMarkdownEntry | null = null;
  let currentCategory: string | null = null;

  for (const line of content.split('\n')) {
    const versionMatch = line.match(/^## (.+)$/);
    if (versionMatch) {
      if (current) entries.push(current);
      current = { version: versionMatch[1].trim(), items: [] };
      currentCategory = null;
      continue;
    }

    const categoryMatch = line.match(/^### (.+)$/);
    if (categoryMatch) {
      currentCategory = categoryMatch[1].trim();
      continue;
    }

    if (current && line.startsWith('- ')) {
      current.items.push({
        body: line.slice(2).trim(),
        category: currentCategory,
      });
    } else if (
      current &&
      current.items.length > 0 &&
      line.trim() &&
      !line.startsWith('#')
    ) {
      current.items[current.items.length - 1].body += ' ' + line.trim();
    }
  }

  if (current) entries.push(current);
  return entries;
}

/** CHANGELOG.md del commit deployado. */
export function getBundledChangelog(): ChangelogMarkdownEntry[] {
  return parseChangelogMarkdown(process.env.MUNDOBL_CHANGELOG_MD ?? '');
}
