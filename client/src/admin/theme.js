// Central design tokens & theme configuration
// Linear / Intercom / Stripe visual tier: refined indigo accent, crisp slate neutrals, high information density.

export const BRAND = {
  primary: '#2563eb', // Electric Indigo
  primaryHover: '#1d4ed8',
  primaryActive: '#1e40af',
  primaryBg: '#eff6ff',
  primaryBorder: '#bfdbfe',
  accent: '#3b82f6',
  bg: '#f8fafc', // Slate 50
  surface: '#ffffff',
  surfaceSubtle: '#f1f5f9', // Slate 100
  border: '#e2e8f0', // Slate 200
  borderSubtle: '#f1f5f9',
  borderStrong: '#cbd5e1', // Slate 300
  text: '#0f172a', // Slate 900
  textSecondary: '#475569', // Slate 600
  textMuted: '#64748b', // Slate 500
  textSubtle: '#94a3b8', // Slate 400
  sider: '#0b0f19', // Deep Slate
  siderBorder: '#1e293b',
  success: '#10b981',
  successBg: '#ecfdf5',
  warning: '#f59e0b',
  warningBg: '#fffbeb',
  danger: '#ef4444',
  dangerBg: '#fef2f2',
  gold: '#2563eb', // Compatibility alias
};

export const theme = {
  token: {
    colorPrimary: BRAND.primary,
    colorPrimaryHover: BRAND.primaryHover,
    colorPrimaryActive: BRAND.primaryActive,
    colorPrimaryBg: BRAND.primaryBg,
    colorLink: BRAND.primary,
    colorLinkHover: BRAND.primaryHover,
    colorBgLayout: BRAND.bg,
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorText: BRAND.text,
    colorTextSecondary: BRAND.textSecondary,
    colorTextTertiary: BRAND.textMuted,
    colorTextQuaternary: BRAND.textSubtle,
    // Default placeholder colour (Quaternary, ~2.6:1 on white) is too faint; Slate 500 is ~4.8:1.
    colorTextPlaceholder: BRAND.textMuted,
    // antd's default error red (#ff4d4f) is ~3:1 on white; Red 600 keeps validation text readable.
    colorError: '#dc2626',
    colorBorder: BRAND.borderStrong,
    colorBorderSecondary: BRAND.border,
    borderRadius: 8,
    borderRadiusSM: 6,
    borderRadiusXS: 4,
    borderRadiusLG: 10,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: 13,
    controlHeight: 36,
    controlHeightSM: 28,
    controlHeightLG: 42,
    lineHeight: 1.5,
  },
  components: {
    Layout: {
      siderBg: BRAND.sider,
      headerBg: '#ffffff',
      headerHeight: 56,
      bodyBg: BRAND.bg,
    },
    Menu: {
      darkItemBg: BRAND.sider,
      darkItemSelectedBg: '#1e293b',
      darkItemSelectedColor: '#ffffff',
      darkItemColor: '#94a3b8',
      darkItemHoverColor: '#ffffff',
      darkItemHoverBg: 'rgba(255, 255, 255, 0.05)',
      itemHeight: 38,
      itemBorderRadius: 6,
      itemMarginInline: 8,
      fontSize: 13,
    },
    Card: {
      borderRadiusLG: 8,
      colorBorderSecondary: BRAND.border,
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      headerHeight: 44,
      headerFontSize: 14,
    },
    Table: {
      headerBg: '#f8fafc',
      headerColor: '#475569',
      headerSplitColor: 'transparent',
      borderColor: BRAND.border,
      rowHoverBg: '#f8fafc',
      cellPaddingBlock: 10,
      cellPaddingInline: 12,
      fontSize: 13,
    },
    Button: {
      fontWeight: 500,
      controlHeight: 36,
      borderRadius: 6,
      defaultBorderColor: BRAND.borderStrong,
      defaultColor: BRAND.text,
      defaultHoverBorderColor: BRAND.primary,
      defaultHoverColor: BRAND.primary,
      primaryShadow: '0 1px 2px 0 rgba(37, 99, 235, 0.2)',
    },
    Input: {
      controlHeight: 36,
      colorBorder: BRAND.borderStrong,
      activeBorderColor: BRAND.primary,
      hoverBorderColor: BRAND.primary,
      activeShadow: '0 0 0 2px rgba(37, 99, 235, 0.15)',
      borderRadius: 6,
    },
    InputNumber: {
      controlHeight: 36,
      colorBorder: BRAND.borderStrong,
      activeBorderColor: BRAND.primary,
      borderRadius: 6,
    },
    Select: {
      controlHeight: 36,
      colorBorder: BRAND.borderStrong,
      optionSelectedBg: '#eff6ff',
      optionSelectedColor: '#1d4ed8',
      optionSelectedFontWeight: 500,
      optionActiveBg: '#f8fafc',
      borderRadius: 6,
    },
    DatePicker: {
      controlHeight: 36,
      colorBorder: BRAND.borderStrong,
      cellActiveWithRangeBg: '#eff6ff',
      borderRadius: 6,
    },
    Segmented: {
      trackBg: '#f1f5f9',
      itemSelectedBg: '#ffffff',
      itemSelectedColor: BRAND.text,
      itemHoverBg: '#e2e8f0',
      borderRadius: 6,
      controlHeight: 32,
    },
    Tabs: {
      cardBg: '#ffffff',
      itemColor: '#64748b',
      itemSelectedColor: BRAND.primary,
      itemHoverColor: BRAND.text,
      titleFontSize: 13,
      horizontalMargin: '0 0 16px 0',
      inkBarColor: BRAND.primary,
    },
    Tag: {
      borderRadiusSM: 4,
      defaultBg: '#f1f5f9',
      defaultColor: '#334155',
    },
    Descriptions: {
      labelStyle: { color: '#64748b', fontSize: '12px' },
      contentStyle: { color: '#0f172a', fontSize: '13px' },
    },
    Statistic: {
      titleFontSize: 12,
      contentFontSize: 22,
    },
  },
};
