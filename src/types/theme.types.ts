/**
 * Tipos para el sistema de temas
 */

export type ThemeMode = 'light' | 'dark';

export type { AccentPresetKey } from '@/lib/theme.config';

export interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  accent: import('@/lib/theme.config').AccentPresetKey;
  setAccent: (accent: import('@/lib/theme.config').AccentPresetKey) => void;
}
