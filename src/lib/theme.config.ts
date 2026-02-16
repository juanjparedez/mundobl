import type { ThemeConfig } from 'antd';

export const lightTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1677ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1677ff',
    fontSize: 14,
    borderRadius: 6,
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
      darkItemSelectedBg: '#1677ff',
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

export const darkTheme: ThemeConfig = {
  token: {
    colorPrimary: '#3b82f6',
    colorBgBase: '#0f0f0f',
    colorBgContainer: '#1a1a1a',
    colorBgElevated: '#222222',
    colorBorder: '#3a3a3a',
    colorBorderSecondary: '#2a2a2a',
    colorText: 'rgba(255, 255, 255, 0.92)',
    colorTextSecondary: 'rgba(255, 255, 255, 0.68)',
    colorTextTertiary: 'rgba(255, 255, 255, 0.48)',
    colorTextQuaternary: 'rgba(255, 255, 255, 0.35)',
    colorFillSecondary: 'rgba(255, 255, 255, 0.08)',
    colorFillTertiary: 'rgba(255, 255, 255, 0.05)',
    fontSize: 14,
    borderRadius: 8,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  components: {
    Layout: {
      headerBg: '#1a1a1a',
      headerHeight: 64,
      headerPadding: '0 24px',
      siderBg: '#111111',
      bodyBg: '#0f0f0f',
    },
    Menu: {
      darkItemBg: '#111111',
      darkSubMenuItemBg: '#0a0a0a',
      darkItemSelectedBg: '#3b82f6',
    },
    Button: {
      controlHeight: 32,
      controlHeightLG: 40,
      controlHeightSM: 24,
      defaultBg: 'rgba(255, 255, 255, 0.06)',
      defaultBorderColor: '#444444',
      defaultColor: 'rgba(255, 255, 255, 0.88)',
    },
    Input: {
      colorBgContainer: '#252525',
      colorBorder: '#444444',
      colorText: 'rgba(255, 255, 255, 0.92)',
      colorTextPlaceholder: 'rgba(255, 255, 255, 0.38)',
      activeBorderColor: '#3b82f6',
      hoverBorderColor: '#5a9bff',
    },
    InputNumber: {
      colorBgContainer: '#252525',
      colorBorder: '#444444',
      colorText: 'rgba(255, 255, 255, 0.92)',
      colorTextPlaceholder: 'rgba(255, 255, 255, 0.38)',
      activeBorderColor: '#3b82f6',
      hoverBorderColor: '#5a9bff',
    },
    Select: {
      colorBgContainer: '#252525',
      colorBorder: '#444444',
      colorText: 'rgba(255, 255, 255, 0.92)',
      colorTextPlaceholder: 'rgba(255, 255, 255, 0.38)',
      optionSelectedBg: 'rgba(59, 130, 246, 0.2)',
      colorBgElevated: '#2a2a2a',
    },
    Card: {
      colorBgContainer: '#1a1a1a',
      colorBorderSecondary: '#2a2a2a',
    },
    Table: {
      headerBg: '#222222',
      rowHoverBg: '#262626',
      colorBgContainer: '#1a1a1a',
    },
    Alert: {
      colorInfoBg: 'rgba(59, 130, 246, 0.12)',
      colorInfoBorder: 'rgba(59, 130, 246, 0.25)',
    },
    Modal: {
      contentBg: '#1a1a1a',
      headerBg: '#1a1a1a',
    },
    Form: {
      labelColor: 'rgba(255, 255, 255, 0.88)',
    },
  },
};
