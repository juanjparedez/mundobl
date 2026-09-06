import type { ThemeConfig } from 'antd';

// ─── Accent presets ─────────────────────────────────────────────────────────

export interface AccentColors {
  primary: string;
  hover: string;
  active: string;
  outline: string;
}

export interface AccentPreset {
  name: string;
  swatch: string;
  light: AccentColors;
  dark: AccentColors;
}

export const ACCENT_PRESETS = {
  mauve: {
    name: 'Mauve',
    swatch: '#c57bb7',
    light: {
      primary: '#c57bb7',
      hover: '#d591c7',
      active: '#ad5f9f',
      outline: 'rgba(197, 123, 183, 0.26)',
    },
    dark: {
      primary: '#c98ac0',
      hover: '#dca0d4',
      active: '#b575ac',
      outline: 'rgba(201, 138, 192, 0.26)',
    },
  },
  violet: {
    name: 'Violet',
    swatch: '#7c3aed',
    light: {
      primary: '#7c3aed',
      hover: '#8b5cf6',
      active: '#6d28d9',
      outline: 'rgba(124, 58, 237, 0.18)',
    },
    dark: {
      primary: '#a78bfa',
      hover: '#c4b5fd',
      active: '#8b5cf6',
      outline: 'rgba(167, 139, 250, 0.22)',
    },
  },
  rose: {
    name: 'Rose',
    swatch: '#e11d48',
    light: {
      primary: '#e11d48',
      hover: '#f43f5e',
      active: '#be123c',
      outline: 'rgba(225, 29, 72, 0.18)',
    },
    dark: {
      primary: '#fb7185',
      hover: '#fda4af',
      active: '#f43f5e',
      outline: 'rgba(251, 113, 133, 0.22)',
    },
  },
  teal: {
    name: 'Teal',
    swatch: '#0d9488',
    light: {
      primary: '#0d9488',
      hover: '#14b8a6',
      active: '#0f766e',
      outline: 'rgba(13, 148, 136, 0.18)',
    },
    dark: {
      primary: '#2dd4bf',
      hover: '#5eead4',
      active: '#14b8a6',
      outline: 'rgba(45, 212, 191, 0.22)',
    },
  },
  gold: {
    name: 'Gold',
    swatch: '#f6b51e',
    light: {
      primary: '#d99a13',
      hover: '#f6b51e',
      active: '#b07d0a',
      outline: 'rgba(246, 181, 30, 0.22)',
    },
    dark: {
      primary: '#f6b51e',
      hover: '#ffc83d',
      active: '#d99a13',
      outline: 'rgba(246, 181, 30, 0.28)',
    },
  },
  amber: {
    name: 'Amber',
    swatch: '#d97706',
    light: {
      primary: '#d97706',
      hover: '#f59e0b',
      active: '#b45309',
      outline: 'rgba(217, 119, 6, 0.18)',
    },
    dark: {
      primary: '#fbbf24',
      hover: '#fcd34d',
      active: '#f59e0b',
      outline: 'rgba(251, 191, 36, 0.22)',
    },
  },
  sky: {
    name: 'Sky',
    swatch: '#0284c7',
    light: {
      primary: '#0284c7',
      hover: '#0ea5e9',
      active: '#0369a1',
      outline: 'rgba(2, 132, 199, 0.18)',
    },
    dark: {
      primary: '#38bdf8',
      hover: '#7dd3fc',
      active: '#0ea5e9',
      outline: 'rgba(56, 189, 248, 0.22)',
    },
  },
  emerald: {
    name: 'Emerald',
    swatch: '#059669',
    light: {
      primary: '#059669',
      hover: '#10b981',
      active: '#047857',
      outline: 'rgba(5, 150, 105, 0.18)',
    },
    dark: {
      primary: '#34d399',
      hover: '#6ee7b7',
      active: '#10b981',
      outline: 'rgba(52, 211, 153, 0.22)',
    },
  },
  coral: {
    name: 'Coral',
    swatch: '#f97316',
    light: {
      primary: '#f97316',
      hover: '#fb923c',
      active: '#ea580c',
      outline: 'rgba(249, 115, 22, 0.18)',
    },
    dark: {
      primary: '#fb923c',
      hover: '#fdba74',
      active: '#f97316',
      outline: 'rgba(251, 146, 60, 0.22)',
    },
  },
  indigo: {
    name: 'Indigo',
    swatch: '#4f46e5',
    light: {
      primary: '#4f46e5',
      hover: '#6366f1',
      active: '#4338ca',
      outline: 'rgba(79, 70, 229, 0.18)',
    },
    dark: {
      primary: '#818cf8',
      hover: '#a5b4fc',
      active: '#6366f1',
      outline: 'rgba(129, 140, 248, 0.22)',
    },
  },
  crimson: {
    name: 'Crimson',
    swatch: '#dc2626',
    light: {
      primary: '#dc2626',
      hover: '#ef4444',
      active: '#b91c1c',
      outline: 'rgba(220, 38, 38, 0.18)',
    },
    dark: {
      primary: '#f87171',
      hover: '#fca5a5',
      active: '#ef4444',
      outline: 'rgba(248, 113, 113, 0.22)',
    },
  },
  slate: {
    name: 'Slate',
    swatch: '#475569',
    light: {
      primary: '#475569',
      hover: '#64748b',
      active: '#334155',
      outline: 'rgba(71, 85, 105, 0.18)',
    },
    dark: {
      primary: '#94a3b8',
      hover: '#cbd5e1',
      active: '#64748b',
      outline: 'rgba(148, 163, 184, 0.22)',
    },
  },
} as const satisfies Record<string, AccentPreset>;

export type AccentPresetKey = keyof typeof ACCENT_PRESETS;
export const DEFAULT_ACCENT: AccentPresetKey = 'gold';

// ─── Derivacion de AccentColors desde hex libre ────────────────────────────
// Cuando el usuario elige un color custom (ColorPicker en SettingsPanel),
// derivamos hover (mas claro), active (mas oscuro) y outline (alpha 22%)
// del primary. Sirve tanto para light como dark, sin paleta dual.

function shiftLightness(hex: string, deltaPct: number): string {
  const m = hex.match(/^#?([0-9a-f]{6})$/i);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  let r = (n >> 16) & 0xff;
  let g = (n >> 8) & 0xff;
  let b = n & 0xff;
  const factor = 1 + deltaPct / 100;
  r = Math.max(0, Math.min(255, Math.round(r * factor)));
  g = Math.max(0, Math.min(255, Math.round(g * factor)));
  b = Math.max(0, Math.min(255, Math.round(b * factor)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export function deriveAccentColorsFromHex(hex: string): AccentColors {
  const normalized = hex.startsWith('#') ? hex : `#${hex}`;
  return {
    primary: normalized,
    hover: shiftLightness(normalized, 15),
    active: shiftLightness(normalized, -15),
    outline: hexToRgba(normalized, 0.24),
  };
}

// ─── Theme builder ───────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

import type { SkinKey } from '@/types/theme.types';
export type { SkinKey };

// Paletas crudas de las skins tematicas. Deben mantenerse sincronizadas con
// sus respectivos archivos CSS en `src/styles/skins/` (--mb-*).
//
// IMPORTANTE — una skin NO es un tema: viste el tema que el usuario ya eligio.
// Por eso cada skin define su variante `light` y su variante `dark`, y elegir
// una skin nunca cambia el modo claro/oscuro ni ninguna otra preferencia.

export interface SkinPaletteDef {
  bg: string;
  bgSoft: string;
  panel: string;
  panel2: string;
  panel3: string;
  text: string;
  textMuted: string;
  textDim: string;
  border: string;
  borderStrong: string;
  /** Acento *sugerido* por la skin. Solo se usa si el usuario no eligio uno
   *  propio: su eleccion explicita siempre gana sobre la sugerencia. */
  primary: string;
  radius: number;
}

interface SkinPalettePair {
  light: SkinPaletteDef;
  dark: SkinPaletteDef;
}

const PREMIUM_PALETTE: SkinPalettePair = {
  dark: {
    bg: '#090911',
    bgSoft: '#11101d',
    panel: '#171423',
    panel2: '#211b32',
    panel3: '#2a2340',
    text: '#f5f1ff',
    textMuted: '#d2cce0',
    textDim: '#a9a1b8',
    border: '#2a2340',
    borderStrong: '#3a3052',
    primary: '#f6b51e',
    radius: 14,
  },
  light: {
    bg: '#faf8f3',
    bgSoft: '#f2ece0',
    panel: '#ffffff',
    panel2: '#faf5ea',
    panel3: '#f1e7d4',
    text: '#1d1a26',
    textMuted: '#55506a',
    textDim: '#86809c',
    border: '#e4dac4',
    borderStrong: '#cdbe9e',
    primary: '#a8760a',
    radius: 14,
  },
};

const SAKURA_PALETTE: SkinPalettePair = {
  light: {
    bg: '#faf6f8',
    bgSoft: '#f5edf2',
    panel: '#ffffff',
    panel2: '#fdf2f7',
    panel3: '#fae6f0',
    text: '#2d1c27',
    textMuted: '#6b5563',
    textDim: '#947c8d',
    border: '#e2b2cb',
    borderStrong: '#d694b6',
    primary: '#d85b98',
    radius: 16,
  },
  dark: {
    bg: '#17101a',
    bgSoft: '#1f1526',
    panel: '#241a2e',
    panel2: '#2f2239',
    panel3: '#3b2b47',
    text: '#fbeef5',
    textMuted: '#d3bccb',
    textDim: '#a68ba0',
    border: '#3b2b47',
    borderStrong: '#4d3a5c',
    primary: '#f48fc0',
    radius: 16,
  },
};

const MIDNIGHT_PALETTE: SkinPalettePair = {
  dark: {
    bg: '#000000',
    bgSoft: '#050508',
    panel: '#0a0a10',
    panel2: '#12121c',
    panel3: '#1a1a28',
    text: '#f3f5f9',
    textMuted: '#a6abb8',
    textDim: '#6d7385',
    border: '#1a1a28',
    borderStrong: '#252538',
    primary: '#00e5ff',
    radius: 10,
  },
  light: {
    bg: '#ffffff',
    bgSoft: '#f4f6f8',
    panel: '#ffffff',
    panel2: '#f0f3f6',
    panel3: '#e5eaef',
    text: '#05070a',
    textMuted: '#3d4653',
    textDim: '#6b7482',
    border: '#dde3e9',
    borderStrong: '#c2cbd4',
    primary: '#0077a3',
    radius: 10,
  },
};

const JOURNAL_PALETTE: SkinPalettePair = {
  light: {
    bg: '#f5f0e6',
    bgSoft: '#eae3d4',
    panel: '#fdfaf3',
    panel2: '#f4ede1',
    panel3: '#eae1d0',
    text: '#2c241b',
    textMuted: '#615545',
    textDim: '#8c7e6c',
    border: 'rgba(140, 126, 108, 0.26)',
    borderStrong: 'rgba(140, 126, 108, 0.42)',
    primary: '#b45309',
    radius: 10,
  },
  dark: {
    bg: '#191410',
    bgSoft: '#211a14',
    panel: '#261f18',
    panel2: '#322920',
    panel3: '#3f342a',
    text: '#f3e9d8',
    textMuted: '#c6b49a',
    textDim: '#98866f',
    border: 'rgba(200, 178, 148, 0.22)',
    borderStrong: 'rgba(200, 178, 148, 0.36)',
    primary: '#d98b3a',
    radius: 10,
  },
};

const NEON_PALETTE: SkinPalettePair = {
  dark: {
    bg: '#070714',
    bgSoft: '#0d0d22',
    panel: '#131330',
    panel2: '#1b1b42',
    panel3: '#242456',
    text: '#f4f5ff',
    textMuted: '#b0b7e2',
    textDim: '#7983be',
    border: '#242456',
    borderStrong: '#3b3b80',
    primary: '#e026b4',
    radius: 14,
  },
  light: {
    bg: '#f7f7fc',
    bgSoft: '#eeeef8',
    panel: '#ffffff',
    panel2: '#f4f4fd',
    panel3: '#e8e8f7',
    text: '#12122b',
    textMuted: '#4a4a70',
    textDim: '#7a7a9c',
    border: '#dcdcf0',
    borderStrong: '#b9b9dd',
    primary: '#b81190',
    radius: 14,
  },
};

/** Skins con paleta propia. La skin 'default' no aparece aca: cae a las
 *  variables base de `variables.css` y al tema generico de Ant Design. */
const SKIN_PALETTES: Partial<Record<SkinKey, SkinPalettePair>> = {
  premium: PREMIUM_PALETTE,
  sakura: SAKURA_PALETTE,
  midnight: MIDNIGHT_PALETTE,
  journal: JOURNAL_PALETTE,
  neon: NEON_PALETTE,
};

/**
 * Acento que la skin *sugiere* para un modo dado. Devuelve `null` para las
 * skins sin paleta propia (se usa el acento por defecto de la app).
 * Solo se consulta cuando el usuario no eligio un acento explicito.
 */
/** Muestras de color para previsualizar una skin en el panel de ajustes:
 *  [fondo, panel, acento sugerido]. Se leen de la misma paleta que aplica
 *  la skin, asi la vista previa nunca se desincroniza del resultado real. */
const DEFAULT_SKIN_SWATCHES: Record<'light' | 'dark', SkinSwatches> = {
  light: ['#f5f5f5', '#ffffff', '#c57bb7'],
  dark: ['#17151c', '#201c29', '#c98ac0'],
};

export type SkinSwatches = [string, string, string];

export function getSkinSwatches(
  skin: SkinKey,
  mode: 'light' | 'dark'
): SkinSwatches {
  const pair = SKIN_PALETTES[skin];
  if (!pair) return DEFAULT_SKIN_SWATCHES[mode];
  const p = pair[mode];
  return [p.bg, p.panel2, p.primary];
}

export function getSkinAccentHex(
  skin: SkinKey,
  mode: 'light' | 'dark'
): string | null {
  return SKIN_PALETTES[skin]?.[mode].primary ?? null;
}

function buildCustomSkinTheme(
  p: SkinPaletteDef,
  accent: AccentColors
): ThemeConfig {
  const primaryColor = accent?.primary || p.primary;
  return {
    token: {
      colorPrimary: primaryColor,
      colorInfo: primaryColor,
      colorBgBase: p.bgSoft,
      colorBgContainer: p.panel,
      colorBgElevated: p.panel2,
      colorBorder: p.border,
      colorBorderSecondary: p.border,
      colorText: p.text,
      colorTextSecondary: p.textMuted,
      colorTextTertiary: p.textDim,
      colorTextQuaternary: hexToRgba(p.text, 0.4),
      colorFillSecondary: hexToRgba(primaryColor, 0.14),
      colorFillTertiary: hexToRgba(primaryColor, 0.08),
      fontSize: 14,
      borderRadius: p.radius,
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    },
    components: {
      Layout: {
        headerBg: p.panel,
        headerHeight: 64,
        headerPadding: '0 24px',
        siderBg: p.bgSoft,
        bodyBg: p.bg,
      },
      Menu: {
        darkItemBg: 'transparent',
        darkSubMenuItemBg: 'transparent',
        darkItemSelectedBg: hexToRgba(primaryColor, 0.14),
        darkItemSelectedColor: primaryColor,
        darkItemHoverBg: hexToRgba(p.text, 0.05),
      },
      Button: {
        controlHeight: 36,
        controlHeightLG: 44,
        controlHeightSM: 28,
        defaultBg: hexToRgba(p.text, 0.04),
        defaultBorderColor: p.borderStrong,
        defaultColor: p.text,
      },
      Input: {
        colorBgContainer: p.panel,
        colorBorder: p.borderStrong,
        colorText: p.text,
        colorTextPlaceholder: hexToRgba(p.text, 0.36),
        activeBorderColor: primaryColor,
        hoverBorderColor: accent.hover,
      },
      InputNumber: {
        colorBgContainer: p.panel,
        colorBorder: p.borderStrong,
        colorText: p.text,
        colorTextPlaceholder: hexToRgba(p.text, 0.36),
        activeBorderColor: primaryColor,
        hoverBorderColor: accent.hover,
      },
      Select: {
        colorBgContainer: p.panel,
        colorBorder: p.borderStrong,
        colorText: p.text,
        colorTextPlaceholder: hexToRgba(p.text, 0.36),
        optionSelectedBg: hexToRgba(primaryColor, 0.22),
        colorBgElevated: p.panel2,
      },
      Card: {
        colorBgContainer: p.panel,
        colorBorderSecondary: p.border,
        borderRadiusLG: p.radius + 4,
      },
      Table: {
        headerBg: p.panel2,
        rowHoverBg: p.panel3,
        colorBgContainer: p.panel,
        headerColor: p.textMuted,
      },
      Tabs: {
        itemColor: p.textDim,
        itemHoverColor: p.text,
        itemSelectedColor: primaryColor,
        inkBarColor: primaryColor,
      },
      Alert: {
        colorInfoBg: hexToRgba(primaryColor, 0.14),
        colorInfoBorder: hexToRgba(primaryColor, 0.3),
      },
      Modal: {
        contentBg: p.panel,
        headerBg: p.panel,
      },
      Drawer: {
        colorBgElevated: p.panel,
      },
      Form: {
        labelColor: p.text,
      },
      Tag: {
        defaultBg: hexToRgba(primaryColor, 0.12),
        defaultColor: primaryColor,
      },
      Tooltip: {
        colorBgSpotlight: p.panel2,
      },
      Dropdown: {
        colorBgElevated: p.panel2,
      },
    },
  };
}

export function buildTheme(
  mode: 'light' | 'dark',
  accent: AccentColors,
  skin: SkinKey = 'default'
): ThemeConfig {
  // Una skin viste el modo activo: se elige su variante light o dark segun
  // el tema que el usuario tenga puesto, nunca al reves.
  const skinPalette = SKIN_PALETTES[skin];
  if (skinPalette) {
    return buildCustomSkinTheme(skinPalette[mode], accent);
  }

  if (mode === 'light') {
    return {
      token: {
        colorPrimary: accent.primary,
        colorInfo: accent.primary,
        colorSuccess: '#52c41a',
        colorWarning: '#faad14',
        colorError: '#ff4d4f',
        fontSize: 14,
        borderRadius: 12,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      },
      components: {
        Layout: {
          headerBg: '#ffffff',
          headerHeight: 64,
          headerPadding: '0 24px',
          siderBg: '#001529',
          bodyBg: '#f5f5f5',
        },
        Menu: {
          darkItemBg: '#001529',
          darkSubMenuItemBg: '#000c17',
          darkItemSelectedBg: accent.primary,
        },
        Button: {
          controlHeight: 32,
          controlHeightLG: 40,
          controlHeightSM: 24,
        },
        Table: {
          headerBg: '#fafafa',
          rowHoverBg: '#f5f5f5',
        },
      },
    };
  }

  return {
    token: {
      colorPrimary: accent.primary,
      colorInfo: accent.primary,
      colorBgBase: '#17151c',
      colorBgContainer: '#201c29',
      colorBgElevated: '#262131',
      colorBorder: '#3f3550',
      colorBorderSecondary: '#32293f',
      colorText: 'rgba(255, 246, 252, 0.93)',
      colorTextSecondary: 'rgba(248, 228, 241, 0.72)',
      colorTextTertiary: 'rgba(238, 210, 233, 0.54)',
      colorTextQuaternary: 'rgba(238, 210, 233, 0.4)',
      colorFillSecondary: hexToRgba(accent.primary, 0.14),
      colorFillTertiary: hexToRgba(accent.primary, 0.08),
      fontSize: 14,
      borderRadius: 12,
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    },
    components: {
      Layout: {
        headerBg: '#201c29',
        headerHeight: 64,
        headerPadding: '0 24px',
        siderBg: '#1b1724',
        bodyBg: '#121218',
      },
      Menu: {
        darkItemBg: '#1b1724',
        darkSubMenuItemBg: '#171320',
        darkItemSelectedBg: accent.primary,
      },
      Button: {
        controlHeight: 32,
        controlHeightLG: 40,
        controlHeightSM: 24,
        defaultBg: 'rgba(255, 255, 255, 0.06)',
        defaultBorderColor: '#4b3f5f',
        defaultColor: 'rgba(255, 246, 252, 0.9)',
      },
      Input: {
        colorBgContainer: '#2a2437',
        colorBorder: '#4b3f5f',
        colorText: 'rgba(255, 246, 252, 0.93)',
        colorTextPlaceholder: 'rgba(238, 210, 233, 0.4)',
        activeBorderColor: accent.primary,
        hoverBorderColor: accent.hover,
      },
      InputNumber: {
        colorBgContainer: '#2a2437',
        colorBorder: '#4b3f5f',
        colorText: 'rgba(255, 246, 252, 0.93)',
        colorTextPlaceholder: 'rgba(238, 210, 233, 0.4)',
        activeBorderColor: accent.primary,
        hoverBorderColor: accent.hover,
      },
      Select: {
        colorBgContainer: '#2a2437',
        colorBorder: '#4b3f5f',
        colorText: 'rgba(255, 246, 252, 0.93)',
        colorTextPlaceholder: 'rgba(238, 210, 233, 0.4)',
        optionSelectedBg: hexToRgba(accent.primary, 0.22),
        colorBgElevated: '#2f283d',
      },
      Card: {
        colorBgContainer: '#201c29',
        colorBorderSecondary: '#32293f',
      },
      Table: {
        headerBg: '#2a2437',
        rowHoverBg: '#2f283d',
        colorBgContainer: '#201c29',
      },
      Alert: {
        colorInfoBg: hexToRgba(accent.primary, 0.14),
        colorInfoBorder: hexToRgba(accent.primary, 0.3),
      },
      Modal: {
        contentBg: '#201c29',
        headerBg: '#201c29',
      },
      Form: {
        labelColor: 'rgba(255, 255, 255, 0.88)',
      },
    },
  };
}
