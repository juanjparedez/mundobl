'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { ConfigProvider } from 'antd';
import type { Locale } from 'antd/es/locale';
import esES from 'antd/locale/es_ES';
import enUS from 'antd/locale/en_US';
import itIT from 'antd/locale/it_IT';
import deDE from 'antd/locale/de_DE';
import frFR from 'antd/locale/fr_FR';
import jaJP from 'antd/locale/ja_JP';
import koKR from 'antd/locale/ko_KR';
import zhCN from 'antd/locale/zh_CN';
import zhTW from 'antd/locale/zh_TW';
import thTH from 'antd/locale/th_TH';
import {
  buildTheme,
  ACCENT_PRESETS,
  DEFAULT_ACCENT,
  type AccentPresetKey,
} from '../theme.config';
import type {
  ThemeMode,
  ThemeContextType,
  ToneKey,
  FontKey,
  ScaleKey,
  DensityKey,
  MotionKey,
  SaverKey,
} from '@/types/theme.types';
import { useLocale } from './LocaleProvider';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

const STORAGE_KEYS = {
  theme: 'theme',
  accent: 'theme-accent',
  tone: 'theme-tone',
  font: 'theme-font',
  scale: 'theme-scale',
  density: 'theme-density',
  motion: 'theme-motion',
  saver: 'theme-saver',
} as const;

const VALID_TONES: ToneKey[] = ['default', 'warm', 'cool', 'contrast'];
const VALID_FONTS: FontKey[] = ['system', 'serif', 'mono', 'dyslexic'];
const VALID_SCALES: ScaleKey[] = ['sm', 'md', 'lg', 'xl'];
const VALID_DENSITIES: DensityKey[] = ['compact', 'comfortable', 'spacious'];
const VALID_MOTIONS: MotionKey[] = ['auto', 'reduce'];
const VALID_SAVERS: SaverKey[] = ['off', 'on'];

function pick<T extends string>(
  raw: string | null,
  valid: T[],
  fallback: T
): T {
  return raw && (valid as string[]).includes(raw) ? (raw as T) : fallback;
}

interface ThemeState {
  theme: ThemeMode;
  accent: AccentPresetKey;
  tone: ToneKey;
  font: FontKey;
  scale: ScaleKey;
  density: DensityKey;
  motion: MotionKey;
  saver: SaverKey;
  mounted: boolean;
}

function applyAccentVars(accent: AccentPresetKey, mode: ThemeMode): void {
  const colors = ACCENT_PRESETS[accent][mode];
  const root = document.documentElement;
  root.style.setProperty('--primary-color', colors.primary);
  root.style.setProperty('--primary-color-hover', colors.hover);
  root.style.setProperty('--primary-color-active', colors.active);
  root.style.setProperty('--primary-color-outline', colors.outline);
}

function applyDataAttribute(name: string, value: string, defaultValue: string) {
  const el = document.documentElement;
  if (value === defaultValue) {
    el.removeAttribute(`data-${name}`);
  } else {
    el.setAttribute(`data-${name}`, value);
  }
}

const DEFAULTS: Omit<ThemeState, 'mounted'> = {
  theme: 'dark',
  accent: DEFAULT_ACCENT,
  tone: 'default',
  font: 'system',
  scale: 'md',
  density: 'comfortable',
  motion: 'auto',
  saver: 'off',
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { locale } = useLocale();
  const [state, setState] = useState<ThemeState>({
    ...DEFAULTS,
    mounted: false,
  });

  useEffect(() => {
    const get = (key: string) => localStorage.getItem(key);

    const theme: ThemeMode =
      get(STORAGE_KEYS.theme) === 'light' ? 'light' : 'dark';
    const accentRaw = get(STORAGE_KEYS.accent) as AccentPresetKey | null;
    const accent: AccentPresetKey =
      accentRaw && accentRaw in ACCENT_PRESETS ? accentRaw : DEFAULT_ACCENT;

    const tone = pick(get(STORAGE_KEYS.tone), VALID_TONES, DEFAULTS.tone);
    const font = pick(get(STORAGE_KEYS.font), VALID_FONTS, DEFAULTS.font);
    const scale = pick(get(STORAGE_KEYS.scale), VALID_SCALES, DEFAULTS.scale);
    const density = pick(
      get(STORAGE_KEYS.density),
      VALID_DENSITIES,
      DEFAULTS.density
    );
    const motion = pick(
      get(STORAGE_KEYS.motion),
      VALID_MOTIONS,
      DEFAULTS.motion
    );
    const saver = pick(get(STORAGE_KEYS.saver), VALID_SAVERS, DEFAULTS.saver);

    document.documentElement.setAttribute('data-theme', theme);
    applyAccentVars(accent, theme);
    applyDataAttribute('tone', tone, DEFAULTS.tone);
    applyDataAttribute('font', font, DEFAULTS.font);
    applyDataAttribute('scale', scale, DEFAULTS.scale);
    applyDataAttribute('density', density, DEFAULTS.density);
    applyDataAttribute('motion', motion, DEFAULTS.motion);
    applyDataAttribute('saver', saver, DEFAULTS.saver);

    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration: read localStorage on mount
    setState({
      theme,
      accent,
      tone,
      font,
      scale,
      density,
      motion,
      saver,
      mounted: true,
    });
  }, []);

  const persist = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* quota or private mode: silent */
    }
  };

  const toggleTheme = () => {
    const newTheme: ThemeMode = state.theme === 'light' ? 'dark' : 'light';
    setState((prev) => ({ ...prev, theme: newTheme }));
    persist(STORAGE_KEYS.theme, newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    applyAccentVars(state.accent, newTheme);
  };

  const handleSetTheme = (newTheme: ThemeMode) => {
    setState((prev) => ({ ...prev, theme: newTheme }));
    persist(STORAGE_KEYS.theme, newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    applyAccentVars(state.accent, newTheme);
  };

  const handleSetAccent = (newAccent: AccentPresetKey) => {
    if (!(newAccent in ACCENT_PRESETS)) return;
    setState((prev) => ({ ...prev, accent: newAccent }));
    persist(STORAGE_KEYS.accent, newAccent);
    applyAccentVars(newAccent, state.theme);
  };

  const handleSetTone = (newTone: ToneKey) => {
    setState((prev) => ({ ...prev, tone: newTone }));
    persist(STORAGE_KEYS.tone, newTone);
    applyDataAttribute('tone', newTone, DEFAULTS.tone);
  };

  const handleSetFont = (newFont: FontKey) => {
    setState((prev) => ({ ...prev, font: newFont }));
    persist(STORAGE_KEYS.font, newFont);
    applyDataAttribute('font', newFont, DEFAULTS.font);
  };

  const handleSetScale = (newScale: ScaleKey) => {
    setState((prev) => ({ ...prev, scale: newScale }));
    persist(STORAGE_KEYS.scale, newScale);
    applyDataAttribute('scale', newScale, DEFAULTS.scale);
  };

  const handleSetDensity = (newDensity: DensityKey) => {
    setState((prev) => ({ ...prev, density: newDensity }));
    persist(STORAGE_KEYS.density, newDensity);
    applyDataAttribute('density', newDensity, DEFAULTS.density);
  };

  const handleSetMotion = (newMotion: MotionKey) => {
    setState((prev) => ({ ...prev, motion: newMotion }));
    persist(STORAGE_KEYS.motion, newMotion);
    applyDataAttribute('motion', newMotion, DEFAULTS.motion);
  };

  const handleSetSaver = (newSaver: SaverKey) => {
    setState((prev) => ({ ...prev, saver: newSaver }));
    persist(STORAGE_KEYS.saver, newSaver);
    applyDataAttribute('saver', newSaver, DEFAULTS.saver);
  };

  const resetPreferences = () => {
    Object.values(STORAGE_KEYS).forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {
        /* silent */
      }
    });
    setState({ ...DEFAULTS, mounted: true });
    document.documentElement.setAttribute('data-theme', DEFAULTS.theme);
    applyAccentVars(DEFAULTS.accent, DEFAULTS.theme);
    (['tone', 'font', 'scale', 'density', 'motion', 'saver'] as const).forEach(
      (k) => document.documentElement.removeAttribute(`data-${k}`)
    );
  };

  if (!state.mounted) {
    return null;
  }

  const accentColors = ACCENT_PRESETS[state.accent][state.theme];
  const currentTheme = buildTheme(state.theme, accentColors);

  const antdLocaleMap: Record<string, Locale> = {
    es: esES,
    en: enUS,
    it: itIT,
    de: deDE,
    fr: frFR,
    ja: jaJP,
    ko: koKR,
    'zh-CN': zhCN,
    'zh-TW': zhTW,
    th: thTH,
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: state.theme,
        toggleTheme,
        setTheme: handleSetTheme,
        accent: state.accent,
        setAccent: handleSetAccent,
        tone: state.tone,
        setTone: handleSetTone,
        font: state.font,
        setFont: handleSetFont,
        scale: state.scale,
        setScale: handleSetScale,
        density: state.density,
        setDensity: handleSetDensity,
        motion: state.motion,
        setMotion: handleSetMotion,
        saver: state.saver,
        setSaver: handleSetSaver,
        resetPreferences,
      }}
    >
      <ConfigProvider
        theme={currentTheme}
        locale={antdLocaleMap[locale] ?? esES}
        componentSize={state.density === 'compact' ? 'small' : 'middle'}
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}
