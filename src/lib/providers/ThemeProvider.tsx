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
import { lightTheme, darkTheme } from '../theme.config';
import type { ThemeMode, ThemeContextType } from '@/types/theme.types';
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

interface ThemeState {
  theme: ThemeMode;
  mounted: boolean;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { locale } = useLocale();
  const [state, setState] = useState<ThemeState>({
    theme: 'dark',
    mounted: false,
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeMode;
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration: read localStorage on mount
    setState({ theme: savedTheme || 'dark', mounted: true });
  }, []);

  const toggleTheme = () => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    setState((prev) => ({ ...prev, theme: newTheme }));
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleSetTheme = (newTheme: ThemeMode) => {
    setState((prev) => ({ ...prev, theme: newTheme }));
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  if (!state.mounted) {
    return null;
  }

  const currentTheme = state.theme === 'light' ? lightTheme : darkTheme;
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
      value={{ theme: state.theme, toggleTheme, setTheme: handleSetTheme }}
    >
      <ConfigProvider
        theme={currentTheme}
        locale={antdLocaleMap[locale] ?? esES}
        componentSize="middle"
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}
