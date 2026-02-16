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
    colorPrimary: '#1668dc',
    colorBgBase: '#141414',
    colorBgContainer: '#1f1f1f',
    colorBgElevated: '#1f1f1f',
    colorBorder: '#424242',
    colorText: 'rgba(255, 255, 255, 0.85)',
    colorTextSecondary: 'rgba(255, 255, 255, 0.65)',
    fontSize: 14,
    borderRadius: 6,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  components: {
    Layout: {
      headerBg: '#1f1f1f',
      headerHeight: 64,
      headerPadding: '0 24px',
      siderBg: '#141414',
      bodyBg: '#1f1f1f',
    },
    Menu: {
      darkItemBg: '#141414',
      darkSubMenuItemBg: '#0a0a0a',
      darkItemSelectedBg: '#1668dc',
    },
    Button: {
      controlHeight: 32,
      controlHeightLG: 40,
      controlHeightSM: 24,
      defaultBg: 'rgba(255, 255, 255, 0.08)',
      defaultBorderColor: '#424242',
      defaultColor: 'rgba(255, 255, 255, 0.85)',
    },
    Table: {
      headerBg: '#2a2a2a',
      rowHoverBg: '#262626',
    },
    Alert: {
      colorInfoBg: 'rgba(22, 104, 220, 0.15)',
      colorInfoBorder: 'rgba(22, 104, 220, 0.3)',
    },
    Modal: {
      contentBg: '#1f1f1f',
      headerBg: '#1f1f1f',
    },
  },
};
