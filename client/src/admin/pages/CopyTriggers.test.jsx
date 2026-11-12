import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { App as AntApp } from 'antd';

const apiMock = vi.fn();
vi.mock('../api.js', async (orig) => ({ ...(await orig()), api: (...a) => apiMock(...a) }));
vi.mock('../main.jsx', () => ({ useApp: () => ({}) }));
const { CopyTriggersModal } = await import('./Triggers.jsx');

beforeAll(() => {
  window.matchMedia ||= () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
});
afterEach(cleanup);

describe('Copy triggers to other stores', () => {
  it('select all stores, copy, then show what was copied and skipped', async () => {
    apiMock.mockResolvedValue({ stores: [
      { storeId: 's2', storeName: 'Lily Ann', copied: ['Welcome message', 'Chat rescue'], skipped: [] },
      { storeId: 's3', storeName: 'Barbara', copied: ['Chat rescue'], skipped: [{ name: 'Welcome message', reason: 'A trigger with this name already exists' }] },
    ] });
    const stores = [{ id: 's1', name: 'Crown' }, { id: 's2', name: 'Lily Ann' }, { id: 's3', name: 'Barbara' }];
    const triggers = [{ id: 't1', name: 'Welcome message' }, { id: 't2', name: 'Chat rescue' }];
    render(<AntApp><CopyTriggersModal open onClose={() => {}} storeId="s1" stores={stores} triggers={triggers} /></AntApp>);
    expect(screen.queryByLabelText('Crown')).toBeNull();
    fireEvent.click(screen.getByText('Select all stores'));
    fireEvent.click(screen.getByRole('button', { name: /Copy 2 triggers to 2 stores/ }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith('/stores/s1/triggers/copy', { method: 'POST', body: { storeIds: ['s2', 's3'], triggerIds: ['t1', 't2'] } }));
    expect(await screen.findByText(/Skipped "Welcome message": A trigger with this name already exists/)).toBeTruthy();
  });
});
