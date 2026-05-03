/**
 * Tipos para el sistema de temas y preferencias de usuario.
 */

export type ThemeMode = 'light' | 'dark';

export type ToneKey = 'default' | 'warm' | 'cool' | 'contrast';
export type FontKey = 'system' | 'serif' | 'mono' | 'dyslexic';
export type ScaleKey = 'sm' | 'md' | 'lg' | 'xl';
export type DensityKey = 'compact' | 'comfortable' | 'spacious';
export type MotionKey = 'auto' | 'reduce';
export type SaverKey = 'off' | 'on';

export type { AccentPresetKey } from '@/lib/theme.config';

export interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  accent: import('@/lib/theme.config').AccentPresetKey;
  setAccent: (accent: import('@/lib/theme.config').AccentPresetKey) => void;
  tone: ToneKey;
  setTone: (tone: ToneKey) => void;
  font: FontKey;
  setFont: (font: FontKey) => void;
  scale: ScaleKey;
  setScale: (scale: ScaleKey) => void;
  density: DensityKey;
  setDensity: (density: DensityKey) => void;
  motion: MotionKey;
  setMotion: (motion: MotionKey) => void;
  saver: SaverKey;
  setSaver: (saver: SaverKey) => void;
  resetPreferences: () => void;
}
