// Reports must never spin forever: a failed request shows an error with a retry.
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App as AntApp } from 'antd';

const apiMock = vi.fn();
vi.mock('../api.js', async (orig) => ({ ...(await orig()), api: (...a) => apiMock(...a) }));
vi.mock('../main.jsx', () => ({ useApp: () => ({ storeId: 's1' }) }));
const { default: Reports } = await import('./Reports.jsx');

beforeAll(() => {
  window.matchMedia ||= () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
});

describe('Reports', () => {
  it('shows an error with Try again instead of an endless spinner, then loads', async () => {
    apiMock.mockRejectedValueOnce(Object.assign(new Error('Server error. Please try again.'), { status: 500 }));
    apiMock.mockResolvedValueOnce({
      range: {}, conversations: { total: 0, byStatus: {}, offline: 0, missed: 0, answered: 0, perDay: [] },
      messages: {}, agents: [], triggers: [], usage: { widgetLoads: 0, pageViews: 0, activeVisitors: 0 },
    });
    render(<AntApp><Reports /></AntApp>);
    expect(await screen.findByText('Reports could not be loaded')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Try again/ }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Reports & Analytics')).toBeTruthy();
  });
});
