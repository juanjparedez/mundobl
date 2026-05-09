/**
 * Tokens compartidos por los chart wrappers de MundoBL.
 *
 * Recharts acepta valores como `stroke="var(--primary-color)"`, lo que nos
 * permite que los charts respondan dinamicamente al accent + skin elegidos
 * por el usuario sin recargar.
 */

export const CHART_TOKENS = {
  primary: 'var(--primary-color)',
  primaryHover: 'var(--primary-color-hover)',
  primarySoft: 'color-mix(in srgb, var(--primary-color) 20%, transparent)',
  text: 'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  textTertiary: 'var(--text-tertiary)',
  bgContainer: 'var(--bg-container)',
  bgElevated: 'var(--bg-elevated)',
  border: 'var(--border-color)',
  borderSecondary: 'var(--border-color-secondary)',
  success: 'var(--success-color)',
  warning: 'var(--warning-color)',
  error: 'var(--error-color)',
  info: 'var(--info-color)',
} as const;

/** Paleta categorial: 8 colores diferenciados, no marca. Para series multiple
 *  donde el accent del usuario no aporta. */
export const CHART_CATEGORICAL_PALETTE = [
  '#7c4dff', // purple
  '#4f8cff', // blue
  '#f6b51e', // gold
  '#48c774', // green
  '#ff5c5c', // red/pink
  '#06b6d4', // cyan
  '#ec4899', // magenta
  '#84cc16', // lime
] as const;
