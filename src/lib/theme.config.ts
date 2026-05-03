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
    light: { primary: '#c57bb7', hover: '#d591c7', active: '#ad5f9f', outline: 'rgba(197, 123, 183, 0.26)' },
    dark:  { primary: '#c98ac0', hover: '#dca0d4', active: '#b575ac', outline: 'rgba(201, 138, 192, 0.26)' },
  },
  violet: {
    name: 'Violet',
    swatch: '#7c3aed',
    light: { primary: '#7c3aed', hover: '#8b5cf6', active: '#6d28d9', outline: 'rgba(124, 58, 237, 0.18)' },
    dark:  { primary: '#a78bfa', hover: '#c4b5fd', active: '#8b5cf6', outline: 'rgba(167, 139, 250, 0.22)' },
  },
  rose: {
    name: 'Rose',
    swatch: '#e11d48',
    light: { primary: '#e11d48', hover: '#f43f5e', active: '#be123c', outline: 'rgba(225, 29, 72, 0.18)' },
    dark:  { primary: '#fb7185', hover: '#fda4af', active: '#f43f5e', outline: 'rgba(251, 113, 133, 0.22)' },
  },
  teal: {
    name: 'Teal',
    swatch: '#0d9488',
    light: { primary: '#0d9488', hover: '#14b8a6', active: '#0f766e', outline: 'rgba(13, 148, 136, 0.18)' },
    dark:  { primary: '#2dd4bf', hover: '#5eead4', active: '#14b8a6', outline: 'rgba(45, 212, 191, 0.22)' },
  },
  amber: {
    name: 'Amber',
    swatch: '#d97706',
    light: { primary: '#d97706', hover: '#f59e0b', active: '#b45309', outline: 'rgba(217, 119, 6, 0.18)' },
    dark:  { primary: '#fbbf24', hover: '#fcd34d', active: '#f59e0b', outline: 'rgba(251, 191, 36, 0.22)' },
  },
  sky: {
    name: 'Sky',
    swatch: '#0284c7',
    light: { primary: '#0284c7', hover: '#0ea5e9', active: '#0369a1', outline: 'rgba(2, 132, 199, 0.18)' },
    dark:  { primary: '#38bdf8', hover: '#7dd3fc', active: '#0ea5e9', outline: 'rgba(56, 189, 248, 0.22)' },
  },
} as const satisfies Record<string, AccentPreset>;

export type AccentPresetKey = keyof typeof ACCENT_PRESETS;
export const DEFAULT_ACCENT: AccentPresetKey = 'mauve';

// ─── Theme builder ───────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function buildTheme(mode: 'light' | 'dark', accent: AccentColors): ThemeConfig {
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
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
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
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
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

// ─── Legacy named exports (kept for any direct import) ───────────────────────
export const lightTheme = buildTheme('light', ACCENT_PRESETS.mauve.light);
export const darkTheme  = buildTheme('dark',  ACCENT_PRESETS.mauve.dark);
