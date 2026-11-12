// Tickets page + ticket form: list/filters, thread with email status, validation, retry-safe create.
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { App as AntApp } from 'antd';

const apiMock = vi.fn();
const appCtx = { current: {} };
vi.mock('../api.js', async (orig) => ({ ...(await orig()), api: (...a) => apiMock(...a) }));
vi.mock('../main.jsx', () => ({ useApp: () => appCtx.current }));
vi.mock('../socket.js', () => ({ onSocket: () => () => {}, sendSocket: () => {} }));

const { default: Tickets } = await import('./Tickets.jsx');
const { default: TicketForm } = await import('../components/TicketForm.jsx');

beforeAll(() => {
  window.matchMedia ||= () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  Element.prototype.scrollIntoView ||= () => {};
});
beforeEach(() => {
  apiMock.mockReset();
  appCtx.current = { me: { id: 'u1', name: 'Ann', memberships: [] }, storeId: 's1', can: () => true };
});
afterEach(() => { cleanup(); history.replaceState(null, '', '/'); });

const now = new Date().toISOString();
const ticket = { id: 't1', number: 7, subject: 'Refund for ring', contactName: 'Pat', contactEmail: 'pat@x.test', cc: [], status: 'OPEN', priority: 'HIGH', assigneeId: null, tags: [], conversationId: null, lastMessageAt: now, lastMessagePreview: 'We are on it', createdAt: now };

function routes(over = {}) {
  apiMock.mockImplementation(async (path, opts = {}) => {
    if (over[path]) return over[path](opts);
    if (path.startsWith('/stores/s1/tickets?')) return { items: [ticket], counts: { OPEN: 1 }, nextCursor: null, emailReady: true };
    if (path === '/stores/s1/members') return [{ userId: 'u1', name: 'Ann' }, { userId: 'u2', name: 'Bob' }];
    if (path === '/stores/s1/tickets/t1') return {
      ticket, emailReady: true, attachments: [],
      messages: [
        { id: 'm0', senderType: 'SYSTEM', body: 'Ticket created from a chat by Ann.\n\nOriginal conversation:\n[2026-10-19 10:00] Visitor: hi', createdAt: now, emailStatus: 'NONE' },
        { id: 'm1', senderType: 'AGENT', senderName: 'Ann', body: 'We are on it', createdAt: now, emailStatus: 'SENT' },
        { id: 'm2', senderType: 'AGENT', senderName: 'Ann', body: 'Second try', createdAt: now, emailStatus: 'FAILED', emailError: '550 no such user' },
      ],
    };
    throw new Error(`unexpected ${path}`);
  });
}

describe('Tickets page', () => {
  it('lists tickets with counts and opens a thread showing delivery status', async () => {
    routes();
    render(<AntApp><Tickets /></AntApp>);
    expect(await screen.findByText(/#7 Refund for ring/)).toBeTruthy();
    expect(apiMock).toHaveBeenCalledWith('/stores/s1/tickets?status=OPEN&assignee=any');
    fireEvent.click(screen.getByRole('button', { name: /Open ticket 7/ }));
    expect(await screen.findByText('Emailed')).toBeTruthy();
    expect(screen.getByText('Not delivered')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Retry/ })).toBeTruthy();
    expect(screen.getByText('Original conversation')).toBeTruthy();
  });

  it('search and status tabs change the query', async () => {
    routes();
    render(<AntApp><Tickets /></AntApp>);
    await screen.findByText(/#7 Refund/);
    fireEvent.click(screen.getByRole('tab', { name: /Closed/ }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith('/stores/s1/tickets?status=CLOSED&assignee=any'));
    fireEvent.change(screen.getByLabelText('Search tickets'), { target: { value: '#7' } });
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith('/stores/s1/tickets?status=CLOSED&assignee=any&q=%237'));
  });

  it('notes are sent without email and replies reuse their id when retried', async () => {
    const posts = [];
    let fail = true;
    routes({
      '/stores/s1/tickets/t1/messages': async (opts) => {
        posts.push(opts.body);
        if (fail) { fail = false; throw Object.assign(new Error('Server is not reachable'), { status: 502 }); }
        return { message: {}, ticket };
      },
    });
    render(<AntApp><Tickets /></AntApp>);
    fireEvent.click(await screen.findByRole('button', { name: /Open ticket 7/ }));
    await screen.findByText('Emailed');
    fireEvent.change(screen.getByLabelText('Reply'), { target: { value: 'Refund sent' } });
    fireEvent.click(screen.getByRole('button', { name: /Send/ }));
    await waitFor(() => expect(posts.length).toBe(1));
    fireEvent.click(screen.getByRole('button', { name: /Send/ }));
    await waitFor(() => expect(posts.length).toBe(2));
    expect(posts[1].clientMsgId).toBe(posts[0].clientMsgId);
    expect(posts[0].note).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'Internal note' }));
    fireEvent.change(screen.getByLabelText('Internal note'), { target: { value: 'check stock' } });
    fireEvent.click(screen.getByRole('button', { name: /Add note/ }));
    await waitFor(() => expect(posts.length).toBe(3));
    expect(posts[2]).toMatchObject({ body: 'check stock', note: true });
    expect(posts[2].clientMsgId).not.toBe(posts[0].clientMsgId);
  });
});

describe('TicketForm', () => {
  const props = { storeId: 's1', me: { id: 'u1', name: 'Ann' }, members: [], supervisor: false, onClose: () => {} };

  it('blocks invalid email and missing fields before calling the API', async () => {
    render(<AntApp><TicketForm {...props} initial={{ contactEmail: 'nope' }} /></AntApp>);
    fireEvent.click(screen.getByRole('button', { name: /Create and send/ }));
    expect(await screen.findByText('Enter a valid email address')).toBeTruthy();
    expect(screen.getByText('Enter a subject')).toBeTruthy();
    expect(screen.getByText('Write a message')).toBeTruthy();
    expect(apiMock).not.toHaveBeenCalled();
  }, 20_000); // many form interactions: slow under a full parallel run

  it('without SMTP: explains the exact setup, keeps the button usable and shows the server refusal', async () => {
    apiMock.mockRejectedValue(Object.assign(new Error('Email is not set up. Add SMTP in Store settings → Notifications & SMTP'), { status: 409 }));
    render(<AntApp><TicketForm {...props} emailReady={false} initial={{ contactEmail: 'a@x.test', subject: 'Hi' }} /></AntApp>);
    expect(screen.getByText(/Email isn't set up for this store/)).toBeTruthy();
    expect(screen.getByText(/SMTP_HOST, SMTP_PORT/)).toBeTruthy();
    const btn = screen.getByRole('button', { name: /Create and send/ });
    expect(btn.disabled).toBe(false);
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Hello' } });
    fireEvent.click(btn);
    await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/Notifications & SMTP/, { selector: '.ant-message-notice-content *' })).toBeTruthy();
  });

  it('prefills from a conversation and resubmits with the same requestId after an error', async () => {
    const bodies = [];
    apiMock.mockImplementation(async (path, opts) => {
      bodies.push(opts.body);
      if (bodies.length === 1) throw new Error('Server is not reachable');
      return { ticket: { id: 't9', number: 9 } };
    });
    const onCreated = vi.fn();
    render(<AntApp><TicketForm {...props} onCreated={onCreated}
      initial={{ conversationId: 'c1', contactName: 'Olive', contactEmail: 'olive@x.test', subject: 'RE: Your message with Olive', tags: ['vip'] }} /></AntApp>);
    expect(screen.getByText('Create ticket from conversation')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'We will call you today.' } });
    fireEvent.click(screen.getByRole('button', { name: /Create and send/ }));
    await waitFor(() => expect(bodies.length).toBe(1));
    fireEvent.click(screen.getByRole('button', { name: /Create and send/ }));
    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    expect(bodies[1].requestId).toBe(bodies[0].requestId);
    expect(bodies[0]).toMatchObject({ conversationId: 'c1', contactEmail: 'olive@x.test', contactName: 'Olive', subject: 'RE: Your message with Olive', tags: ['vip'], body: 'We will call you today.' });
  });
});
