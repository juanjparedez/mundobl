import type { ThemeConfig } from 'antd';

export const lightTheme: ThemeConfig = {
  token: {
    colorPrimary: '#c57bb7',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#c57bb7',
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
    colorPrimary: '#c98ac0',
    colorBgBase: '#17151c',
    colorBgContainer: '#201c29',
    colorBgElevated: '#262131',
    colorBorder: '#3f3550',
    colorBorderSecondary: '#32293f',
    colorText: 'rgba(255, 246, 252, 0.93)',
    colorTextSecondary: 'rgba(248, 228, 241, 0.72)',
    colorTextTertiary: 'rgba(238, 210, 233, 0.54)',
    colorTextQuaternary: 'rgba(238, 210, 233, 0.4)',
    colorFillSecondary: 'rgba(201, 138, 192, 0.14)',
    colorFillTertiary: 'rgba(201, 138, 192, 0.08)',
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
      darkItemSelectedBg: '#c98ac0',
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
      activeBorderColor: '#c98ac0',
      hoverBorderColor: '#dca0d4',
    },
    InputNumber: {
      colorBgContainer: '#2a2437',
      colorBorder: '#4b3f5f',
      colorText: 'rgba(255, 246, 252, 0.93)',
      colorTextPlaceholder: 'rgba(238, 210, 233, 0.4)',
      activeBorderColor: '#c98ac0',
      hoverBorderColor: '#dca0d4',
    },
    Select: {
      colorBgContainer: '#2a2437',
      colorBorder: '#4b3f5f',
      colorText: 'rgba(255, 246, 252, 0.93)',
      colorTextPlaceholder: 'rgba(238, 210, 233, 0.4)',
      optionSelectedBg: 'rgba(201, 138, 192, 0.22)',
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
      colorInfoBg: 'rgba(201, 138, 192, 0.14)',
      colorInfoBorder: 'rgba(201, 138, 192, 0.3)',
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
