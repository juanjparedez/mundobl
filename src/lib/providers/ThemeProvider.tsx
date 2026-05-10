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
  deriveAccentColorsFromHex,
  type AccentPresetKey,
  type AccentColors,
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
  SkinKey,
} from '@/types/theme.types';
import { useLocale } from './LocaleProvider';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const { t } = useLocale();
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error(t('themeProvider.useThemeError'));
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

const STORAGE_KEYS = {
  theme: 'theme',
  accent: 'theme-accent',
  customAccent: 'theme-accent-custom',
  tone: 'theme-tone',
  font: 'theme-font',
  scale: 'theme-scale',
  density: 'theme-density',
  motion: 'theme-motion',
  saver: 'theme-saver',
  skin: 'theme-skin',
} as const;

const HEX6_REGEX = /^#?[0-9a-f]{6}$/i;

function normalizeHex(value: string): string | null {
  if (!HEX6_REGEX.test(value)) return null;
  return value.startsWith('#')
    ? value.toLowerCase()
    : `#${value.toLowerCase()}`;
}

const VALID_TONES: ToneKey[] = ['default', 'warm', 'cool', 'contrast'];
const VALID_FONTS: FontKey[] = ['system', 'serif', 'mono', 'dyslexic'];
const VALID_SCALES: ScaleKey[] = ['sm', 'md', 'lg', 'xl'];
const VALID_DENSITIES: DensityKey[] = ['compact', 'comfortable', 'spacious'];
const VALID_MOTIONS: MotionKey[] = ['auto', 'reduce'];
const VALID_SAVERS: SaverKey[] = ['off', 'on'];
const VALID_SKINS: SkinKey[] = ['default', 'premium'];

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
  customAccent: string | null;
  tone: ToneKey;
  font: FontKey;
  scale: ScaleKey;
  density: DensityKey;
  motion: MotionKey;
  saver: SaverKey;
  skin: SkinKey;
  mounted: boolean;
}

function resolveAccentColors(
  accent: AccentPresetKey,
  customAccent: string | null,
  mode: ThemeMode
): AccentColors {
  if (customAccent) return deriveAccentColorsFromHex(customAccent);
  return ACCENT_PRESETS[accent][mode];
}

function applyAccentVars(
  accent: AccentPresetKey,
  customAccent: string | null,
  mode: ThemeMode
): void {
  const colors = resolveAccentColors(accent, customAccent, mode);
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
  customAccent: null,
  tone: 'default',
  font: 'system',
  scale: 'md',
  density: 'comfortable',
  motion: 'auto',
  saver: 'off',
  skin: 'premium',
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
    const customAccent = normalizeHex(get(STORAGE_KEYS.customAccent) ?? '');

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
    const rawSkin = get(STORAGE_KEYS.skin);
    const skin =
      rawSkin === 'default'
        ? DEFAULTS.skin
        : pick(rawSkin, VALID_SKINS, DEFAULTS.skin);

    document.documentElement.setAttribute('data-theme', theme);
    applyAccentVars(accent, customAccent, theme);
    applyDataAttribute('tone', tone, DEFAULTS.tone);
    applyDataAttribute('font', font, DEFAULTS.font);
    applyDataAttribute('scale', scale, DEFAULTS.scale);
    applyDataAttribute('density', density, DEFAULTS.density);
    applyDataAttribute('motion', motion, DEFAULTS.motion);
    applyDataAttribute('saver', saver, DEFAULTS.saver);
    document.documentElement.setAttribute('data-skin', skin);

    // Migra preferencias viejas: si la skin guardada era "default",
    // persistimos premium para que el rediseno se aplique de forma real.
    if (rawSkin === 'default') {
      try {
        localStorage.setItem(STORAGE_KEYS.skin, DEFAULTS.skin);
      } catch {
        /* silent */
      }
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration: read localStorage on mount
    setState({
      theme,
      accent,
      customAccent,
      tone,
      font,
      scale,
      density,
      motion,
      saver,
      skin,
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
    applyAccentVars(state.accent, state.customAccent, newTheme);
  };

  const handleSetTheme = (newTheme: ThemeMode) => {
    // Premium skin solo tiene paleta dark — al pasar a light forzamos
    // 'default' para que la UI no quede con tokens incoherentes.
    const newSkin: SkinKey =
      newTheme === 'light' && state.skin === 'premium' ? 'default' : state.skin;
    setState((prev) => ({ ...prev, theme: newTheme, skin: newSkin }));
    persist(STORAGE_KEYS.theme, newTheme);
    if (newSkin !== state.skin) {
      persist(STORAGE_KEYS.skin, newSkin);
      document.documentElement.setAttribute('data-skin', newSkin);
    }
    document.documentElement.setAttribute('data-theme', newTheme);
    applyAccentVars(state.accent, state.customAccent, newTheme);
  };

  const handleSetAccent = (newAccent: AccentPresetKey) => {
    if (!(newAccent in ACCENT_PRESETS)) return;
    // Elegir un preset desactiva el custom — UI mas predecible.
    setState((prev) => ({ ...prev, accent: newAccent, customAccent: null }));
    persist(STORAGE_KEYS.accent, newAccent);
    try {
      localStorage.removeItem(STORAGE_KEYS.customAccent);
    } catch {
      /* silent */
    }
    applyAccentVars(newAccent, null, state.theme);
  };

  const handleSetCustomAccent = (hex: string | null) => {
    if (hex === null) {
      setState((prev) => ({ ...prev, customAccent: null }));
      try {
        localStorage.removeItem(STORAGE_KEYS.customAccent);
      } catch {
        /* silent */
      }
      applyAccentVars(state.accent, null, state.theme);
      return;
    }
    const normalized = normalizeHex(hex);
    if (!normalized) return;
    setState((prev) => ({ ...prev, customAccent: normalized }));
    persist(STORAGE_KEYS.customAccent, normalized);
    applyAccentVars(state.accent, normalized, state.theme);
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

  const handleSetSkin = (newSkin: SkinKey) => {
    setState((prev) => ({ ...prev, skin: newSkin }));
    persist(STORAGE_KEYS.skin, newSkin);
    document.documentElement.setAttribute('data-skin', newSkin);
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
    applyAccentVars(DEFAULTS.accent, DEFAULTS.customAccent, DEFAULTS.theme);
    (['tone', 'font', 'scale', 'density', 'motion', 'saver'] as const).forEach(
      (k) => document.documentElement.removeAttribute(`data-${k}`)
    );
    document.documentElement.setAttribute('data-skin', DEFAULTS.skin);
  };

  if (!state.mounted) {
    return null;
  }

  const accentColors = resolveAccentColors(
    state.accent,
    state.customAccent,
    state.theme
  );
  const currentTheme = buildTheme(state.theme, accentColors, state.skin);

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
        customAccent: state.customAccent,
        setCustomAccent: handleSetCustomAccent,
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
        skin: state.skin,
        setSkin: handleSetSkin,
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
