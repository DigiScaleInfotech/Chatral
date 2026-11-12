import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { theme, BRAND } from './theme.js';
import Login from './pages/Login.jsx';
import PageHeader from './components/PageHeader.jsx';
import { alertFor } from './notifications.js';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe('Design System & Tokens Audit', () => {
  it('defines professional SaaS tokens with electric indigo and slate neutrals', () => {
    expect(BRAND.primary).toBe('#2563eb');
    expect(BRAND.bg).toBe('#f8fafc');
    expect(BRAND.text).toBe('#0f172a');
    expect(BRAND.sider).toBe('#0b0f19');
    expect(BRAND.border).toBe('#e2e8f0');

    expect(theme.token.colorPrimary).toBe('#2563eb');
    expect(theme.token.colorBgLayout).toBe('#f8fafc');
    expect(theme.token.borderRadius).toBe(8);
    expect(theme.token.controlHeight).toBe(36);
  });
});

describe('PageHeader Component Audit', () => {
  it('renders title, subtitle and action extra slots cleanly', () => {
    const { container } = render(
      <PageHeader
        title="Store Settings"
        subtitle="Manage storefront configuration"
        extra={<button>Action</button>}
      />
    );
    expect(screen.getByText('Store Settings')).toBeDefined();
    expect(screen.getByText('Manage storefront configuration')).toBeDefined();
    expect(screen.getByText('Action')).toBeDefined();
    expect(container.querySelector('.saas-page-header')).toBeDefined();
  });
});

describe('Login Screen Audit', () => {
  it('renders enterprise sign in form with high contrast inputs and button', () => {
    render(
      <ConfigProvider theme={theme}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </ConfigProvider>
    );

    expect(screen.getByText('Welcome back')).toBeDefined();
    expect(screen.getByPlaceholderText('name@company.com')).toBeDefined();
    expect(screen.getByPlaceholderText('Your password')).toBeDefined();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDefined();
    expect(screen.getByLabelText('Email address')).toBeDefined();
    expect(screen.getByLabelText('Password')).toBeDefined();
  });

  // Regression: the card used inline dark colours while global CSS forces .ant-card white,
  // leaving near-white labels on a white card. The card and its labels must use theme colours.
  it('does not override card, label or input colours inline (they follow the light theme)', () => {
    const { container } = render(
      <ConfigProvider theme={theme}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </ConfigProvider>
    );
    const card = container.querySelector('.login-card');
    expect(card).not.toBeNull();
    expect(card.getAttribute('style') || '').not.toMatch(/background/);
    for (const label of container.querySelectorAll('.ant-form-item-label label')) {
      expect(label.querySelector('[style*="color"]')).toBeNull();
    }
    for (const input of container.querySelectorAll('.login-card .ant-input-affix-wrapper, .login-card input')) {
      expect(input.getAttribute('style') || '').not.toMatch(/background|color/);
    }
  });
});

describe('Theme text contrast on white', () => {
  const lum = (hex) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);

  it('labels, secondary text and placeholders meet WCAG AA (4.5:1) on white', () => {
    for (const key of ['colorText', 'colorTextSecondary', 'colorTextPlaceholder', 'colorError']) {
      expect(ratio(theme.token[key], '#ffffff'), key).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('Notification Routing Audit', () => {
  const ctx = { meId: 'agent_1', storeId: 'store_1', onInbox: false };

  it('routes visitor message alerts correctly', () => {
    const alert = alertFor(
      'message',
      {
        storeId: 'store_1',
        conversation: { id: 'conv_1', visitor: { name: 'Customer' } },
        message: { senderType: 'VISITOR', body: 'Need help' },
      },
      ctx
    );
    expect(alert).toEqual({
      title: 'New message - Customer',
      body: 'Need help',
      conversationId: 'conv_1',
      toast: true,
    });
  });

  it('suppresses toast while viewing active inbox', () => {
    const alert = alertFor(
      'message',
      {
        storeId: 'store_1',
        conversation: { id: 'conv_1', visitor: { name: 'Customer' } },
        message: { senderType: 'VISITOR', body: 'Need help' },
      },
      { ...ctx, onInbox: true }
    );
    expect(alert?.toast).toBe(false);
  });
});
