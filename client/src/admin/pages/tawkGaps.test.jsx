// Visitors monitoring page, inbox table view, shortcut access controls.
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { App as AntApp } from 'antd';

const apiMock = vi.fn();
const appCtx = { current: {} };
vi.mock('../api.js', async (orig) => ({ ...(await orig()), api: (...a) => apiMock(...a) }));
vi.mock('../main.jsx', () => ({ useApp: () => appCtx.current }));
vi.mock('../socket.js', () => ({ onSocket: () => () => {}, sendSocket: () => {} }));

const { default: Visitors, formatDuration } = await import('./Visitors.jsx');
const { default: Inbox } = await import('./Inbox.jsx');
const { default: SavedReplies } = await import('./SavedReplies.jsx');

beforeAll(() => {
  window.matchMedia ||= () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  window.Notification ||= { permission: 'denied', requestPermission: () => Promise.resolve('denied') };
  Element.prototype.scrollIntoView ||= () => {};
});
beforeEach(() => apiMock.mockReset());
afterEach(() => { cleanup(); try { localStorage.clear(); } catch { /* ignore */ } });

function Where() { return <div data-testid="where">{useLocation().pathname + useLocation().search}</div>; }
const inRouter = (ui, path = '/x') => render(
  <AntApp>
    <MemoryRouter initialEntries={[path]}>
      <Routes><Route path="*" element={<>{ui}<Where /></>} /></Routes>
    </MemoryRouter>
  </AntApp>,
);

describe('Visitors (live monitoring)', () => {
  it('formats time on site', () => {
    expect(formatDuration(65_000)).toBe('1:05');
    expect(formatDuration(3_725_000)).toBe('1h 02m');
    expect(formatDuration(-5)).toBe('0:00');
  });

  it('lists online and recently-seen visitors, and links to their chat', async () => {
    appCtx.current = { storeId: 's1' };
    const now = new Date().toISOString();
    apiMock.mockResolvedValue([
      { id: 'v1', name: 'Priya', email: 'p@x.test', online: true, currentUrl: 'https://shop.test/rings', currentTitle: 'Rings', referrer: 'https://google.com/', device: 'mobile', visits: 2, sessionPageViews: 4, chats: 1, sessionStartedAt: now, lastSeenAt: now, conversation: { id: 'c1', status: 'OPEN', unreadForAgent: 2 } },
      { id: 'v2', name: null, email: null, online: false, currentUrl: null, referrer: null, device: 'desktop', visits: 1, sessionPageViews: 1, chats: 0, sessionStartedAt: now, lastSeenAt: now, conversation: null },
    ]);
    inRouter(<Visitors />);
    expect(await screen.findByText('Priya')).toBeTruthy();
    expect(apiMock).toHaveBeenCalledWith('/stores/s1/visitors/live?minutes=10');
    expect(screen.getByText(/1 with an open chat · 2 filled the form in the last 10 min/)).toBeTruthy();
    expect(screen.queryByText(/online/i)).toBeNull();
    expect(screen.getByText('Rings')).toBeTruthy();
    expect(screen.getByText('google.com')).toBeTruthy();
    expect(screen.getByText('Browsing')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /open chat/i }));
    expect(screen.getByTestId('where').textContent).toBe('/inbox?c=c1');
  });
});

describe('Visitors: delete with two confirmations', () => {
  const now = new Date().toISOString();
  const row = { id: 'v1', name: 'Priya', email: null, country: 'IN', city: 'Surat', currentUrl: null, referrer: null, device: 'desktop', visits: 1, sessionPageViews: 1, chats: 0, sessionStartedAt: now, lastSeenAt: now, conversation: null };

  it('agents see no delete button; location is shown', async () => {
    appCtx.current = { storeId: 's1', can: (r) => r === 'AGENT' };
    apiMock.mockResolvedValue([row]);
    inRouter(<Visitors />);
    expect(await screen.findByText('Priya')).toBeTruthy();
    expect(screen.getByText('Surat, India')).toBeTruthy();
    expect(screen.queryByLabelText('Delete visitor')).toBeNull();
  });

  it('admins must confirm twice and type DELETE before anything is deleted', async () => {
    appCtx.current = { storeId: 's1', can: () => true };
    apiMock.mockImplementation(async (path, opts) => (opts?.method === 'DELETE' ? { ok: true } : [row]));
    inRouter(<Visitors />);
    fireEvent.click(await screen.findByLabelText('Delete visitor'));
    fireEvent.click(await screen.findByRole('button', { name: 'Continue' }));
    const del = await screen.findByRole('button', { name: 'Delete permanently' });
    fireEvent.click(del); // nothing typed yet
    await waitFor(() => expect(screen.getByText('Type DELETE to confirm.')).toBeTruthy());
    expect(apiMock.mock.calls.some((c) => c[1]?.method === 'DELETE')).toBe(false);
    fireEvent.change(screen.getByLabelText('Type DELETE to confirm'), { target: { value: 'DELETE' } });
    fireEvent.click(del);
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith('/stores/s1/visitors/v1', { method: 'DELETE' }));
    await waitFor(() => expect(screen.queryByText('Priya')).toBeNull());
  });
});

describe('Visitors: delete several at once', () => {
  it('select visitors, confirm twice, one bulk request', async () => {
    const now = new Date().toISOString();
    const v = (id, name) => ({ id, name, email: null, currentUrl: null, referrer: null, device: 'desktop', visits: 1, sessionPageViews: 1, chats: 0, sessionStartedAt: now, lastSeenAt: now, conversation: null });
    appCtx.current = { storeId: 's1', can: () => true };
    apiMock.mockImplementation(async (path, opts) => (opts?.method ? { deleted: 2 } : [v('v1', 'Ann'), v('v2', 'Bob'), v('v3', 'Cy')]));
    inRouter(<Visitors />);
    await screen.findByText('Ann');
    const box = (name) => within(screen.getByText(name).closest('tr')).getByRole('checkbox');
    fireEvent.click(box('Ann'));
    fireEvent.click(box('Bob'));
    fireEvent.click(screen.getByRole('button', { name: /Delete selected \(2\)/ }));
    expect((await screen.findAllByText('Delete 2 visitors?')).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.change(await screen.findByLabelText('Type DELETE to confirm'), { target: { value: 'DELETE' } });
    fireEvent.click(screen.getByRole('button', { name: 'Delete permanently' }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith('/stores/s1/visitors/bulk-delete', { method: 'POST', body: { ids: ['v1', 'v2'] } }));
    await waitFor(() => expect(screen.queryByText('Ann')).toBeNull());
    expect(screen.getByText('Cy')).toBeTruthy();
  });
});

describe('Inbox table view', () => {
  const conv = (id, extra = {}) => ({ id, storeId: 's1', visitorId: `vis-${id}`, status: 'OPEN', priority: 'NORMAL', assigneeId: null, tags: [], isOffline: false, lastSeq: 1, lastMessageAt: new Date().toISOString(), lastMessagePreview: `preview ${id}`, unreadForAgent: 0, visitor: { name: `Visitor ${id}` }, ...extra });

  beforeEach(() => {
    appCtx.current = { me: { id: 'me', name: 'Me', memberships: [{ storeId: 's1', presence: 'ONLINE' }] }, storeId: 's1', role: 'OWNER', can: () => true, setUnread: () => {} };
    apiMock.mockImplementation(async (rawPath) => {
      const path = String(rawPath);
      if (path.startsWith('/stores/s1/conversations?')) {
        return { items: [conv('a', { priority: 'HIGH', unreadForAgent: 3 }), conv('b', { isOffline: true, assigneeId: 'u2' })], nextCursor: null, counts: { OPEN: 2 }, unreadConversations: 1 };
      }
      if (path === '/stores/s1/members') return [{ userId: 'u2', name: 'Sam Agent' }];
      if (path === '/stores/s1/saved-replies') return [];
      if (path.startsWith('/stores/s1/conversations/a')) return { conversation: conv('a'), visitor: { id: 'vis-a', name: 'Visitor a', lastSeenAt: new Date().toISOString() }, messages: [], attachments: [] };
      return {};
    });
  });

  it('switches to a full-width table with readable columns, remembers the choice, and a row opens the conversation', async () => {
    inRouter(<Inbox />);
    await screen.findByText('Visitor a');
    expect(document.querySelector('.inbox-table-mode')).toBeNull();
    fireEvent.click(screen.getByTitle('Table'));
    const table = await waitFor(() => { const t = document.querySelector('.inbox-table-mode table'); expect(t).not.toBeNull(); return t; });
    expect(localStorage.getItem('inboxView')).toBe('table');
    const rows = within(table).getAllByRole('row');
    const header = rows[0].textContent;
    for (const h of ['Contact', 'Channel', 'Preview', 'Assignee', 'Status', 'Last activity']) expect(header).toContain(h);
    expect(header).not.toContain('Priority');
    expect(table.textContent).toContain('Offline msg');
    expect(table.textContent).toContain('Sam Agent');
    expect(table.textContent).toContain('Unassigned');
    expect(table.textContent).not.toContain('HIGH'); // priority is no longer shown
    fireEvent.click(within(table).getByText('Visitor a'));
    await waitFor(() => expect(document.querySelector('.inbox-table-mode')).toBeNull());
    expect(localStorage.getItem('inboxView')).toBe('list');
    await waitFor(() => expect(apiMock.mock.calls.some(([p]) => String(p).startsWith('/stores/s1/conversations/a'))).toBe(true));
  });
});

describe('Shortcut access levels', () => {
  const rows = [
    { id: 'r1', shortcut: 'returns', title: 'Returns', body: 'Team text', access: 'PUBLIC', canEdit: false },
    { id: 'r2', shortcut: 'mine', title: 'Mine', body: 'Private text', access: 'PRIVATE', canEdit: true },
  ];

  it('agents see team shortcuts read-only, their private ones editable, and can only create private ones', async () => {
    appCtx.current = { storeId: 's1', can: (min) => min === 'AGENT' };
    apiMock.mockResolvedValue(rows);
    inRouter(<SavedReplies />);
    expect(await screen.findByText('/returns')).toBeTruthy();
    expect(screen.getByText('Team')).toBeTruthy();
    expect(screen.getByText('Private')).toBeTruthy();
    expect(screen.getByText('View only')).toBeTruthy();
    expect(screen.getAllByLabelText('Edit reply')).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: /new reply/i }));
    const dialog = await screen.findByRole('dialog');
    const team = within(dialog).getByLabelText(/Team \(everyone in this store\)/);
    const only = within(dialog).getByLabelText('Only me');
    expect(team.disabled).toBe(true);
    expect(only.checked).toBe(true);
  });

  it('supervisors can choose team access and edit team shortcuts', async () => {
    appCtx.current = { storeId: 's1', can: () => true };
    apiMock.mockResolvedValue(rows.map((r) => ({ ...r, canEdit: true })));
    inRouter(<SavedReplies />);
    await screen.findByText('/returns');
    expect(screen.getAllByLabelText('Edit reply')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: /new reply/i }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByLabelText(/Team \(everyone in this store\)/).disabled).toBe(false);
  });
});
