import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import { App as AntApp } from 'antd';

const apiMock = vi.fn();
vi.mock('../api.js', async (orig) => ({ ...(await orig()), api: (...a) => apiMock(...a) }));
vi.mock('../main.jsx', () => ({ useApp: () => ({ me: { id: 'me', name: 'Me' } }) }));

const { Users } = await import('./Platform.jsx');

const USERS = [
  { id: 'me', name: 'Me', email: 'me@x.test', role: 'SUPER_ADMIN', isActive: true, createdAt: '2026-10-01', memberships: [] },
  { id: 'u2', name: 'Sam Agent', email: 'sam@x.test', role: 'USER', isActive: true, createdAt: '2026-10-02', memberships: [{ storeId: 's1', storeName: 'Aurora', role: 'AGENT' }] },
];

beforeAll(() => {
  window.matchMedia ||= () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
});
beforeEach(() => {
  apiMock.mockReset();
  apiMock.mockImplementation(async (path, opts = {}) => (path === '/users' && !opts.method ? USERS : { ok: true }));
});
afterEach(cleanup);

const renderUsers = () => render(<AntApp><Users /></AntApp>);
const deleteButton = async (name) => screen.findByRole('button', { name: `Delete ${name}` });
const calls = (method) => apiMock.mock.calls.filter(([, o]) => o?.method === method);

describe('Platform users: delete', () => {
  it('cannot delete your own account', async () => {
    renderUsers();
    expect((await deleteButton('Me')).disabled).toBe(true);
    expect((await deleteButton('Sam Agent')).disabled).toBe(false);
  });

  it('asks for confirmation that names the user; cancelling deletes nothing', async () => {
    renderUsers();
    fireEvent.click(await deleteButton('Sam Agent'));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Sam Agent')).toBeTruthy();
    expect(dialog.textContent).toContain('sam@x.test');
    expect(dialog.textContent).toContain('Aurora (Agent)');
    expect(dialog.textContent).toMatch(/cannot be undone/);
    fireEvent.click(within(dialog).getByRole('button', { name: /cancel/i }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(calls('DELETE')).toHaveLength(0);
  });

  it('deletes through the API and refreshes the directory', async () => {
    renderUsers();
    fireEvent.click(await deleteButton('Sam Agent'));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /delete user/i }));
    await waitFor(() => expect(calls('DELETE')).toEqual([['/users/u2', { method: 'DELETE' }]]));
    await waitFor(() => expect(apiMock.mock.calls.filter(([p, o]) => p === '/users' && !o).length).toBe(2));
    expect(await screen.findByText('Sam Agent was deleted')).toBeTruthy();
  });

  it('shows the server reason and keeps the dialog open when deletion is refused', async () => {
    apiMock.mockImplementation(async (path, opts = {}) => {
      if (opts.method === 'DELETE') throw Object.assign(new Error('Sam Agent is the only owner of Aurora. Assign another owner first.'), { status: 409 });
      return USERS;
    });
    renderUsers();
    fireEvent.click(await deleteButton('Sam Agent'));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /delete user/i }));
    expect(await screen.findByText(/only owner of Aurora/)).toBeTruthy();
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(apiMock.mock.calls.filter(([p, o]) => p === '/users' && !o).length).toBe(1);
  });
});

describe('Platform users: store access', () => {
  it('editing an agent shows every store as a checkbox and saves the ticked ones', async () => {
    apiMock.mockImplementation(async (path, opts = {}) => {
      if (path === '/users' && !opts.method) return USERS;
      if (path === '/platform/usage') return [{ id: 's1', name: 'Aurora' }, { id: 's2', name: 'Blue Peak' }];
      return { ok: true };
    });
    renderUsers();
    await screen.findByText('Sam Agent');
    const row = screen.getByText('Sam Agent').closest('tr');
    fireEvent.click(within(row).getByRole('button', { name: /Edit/ }));
    const aurora = await screen.findByRole('checkbox', { name: 'Aurora' });
    const blue = screen.getByRole('checkbox', { name: 'Blue Peak' });
    expect(aurora.checked).toBe(true);
    expect(blue.checked).toBe(false);
    fireEvent.click(blue);
    fireEvent.click(screen.getByRole('button', { name: 'Save user' }));
    await waitFor(() => expect(calls('PATCH')[0]).toEqual(['/users/u2', { method: 'PATCH', body: { name: 'Sam Agent', storeIds: ['s1', 's2'] } }]));
  });
});
