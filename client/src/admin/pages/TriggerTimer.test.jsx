// "Timer starts from" in the trigger editor: only options valid for the event, persisted on save.
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { App as AntApp } from 'antd';

const apiMock = vi.fn();
vi.mock('../api.js', async (orig) => ({ ...(await orig()), api: (...a) => apiMock(...a) }));
vi.mock('../main.jsx', () => ({ useApp: () => ({ storeId: 's1', can: () => true, me: { id: 'u1' } }) }));
const { default: Triggers } = await import('./Triggers.jsx');

const CAT = {
  events: [
    { key: 'page_view', label: 'Visitor views a page' },
    { key: 'chat_requested', label: 'Visitor requests a chat' },
  ],
  fields: [], operators: {}, templates: [],
  actions: [{ key: 'send_message', label: 'Send automated message' }],
  frequencies: [{ key: 'ONCE_PER_CONVERSATION', label: 'Once per conversation' }, { key: 'EVERY_TIME', label: 'Every time' }],
  timerFrom: [
    { key: 'EVENT', label: 'Trigger event / chat start', help: 'Counted from the event.', events: ['page_view', 'chat_requested'] },
    { key: 'LAST_VISITOR', label: 'Last customer message', help: 'Restarts on every customer message.', events: ['chat_requested'] },
  ],
};
const CFG = {
  colors: { primary: '#2563eb', headerText: '#ffffff', visitorBubble: '#2563eb', visitorText: '#ffffff', agentBubble: '#f1f5f9', agentText: '#0f172a', background: '#ffffff' },
  logoUrl: '', agentName: 'Support', avatarUrl: '',
  launcher: { position: 'right', offsetX: 20, offsetY: 20, size: 60, label: '' },
  size: { width: 370, height: 560 }, font: { family: 'system', size: 14 },
  layout: { mobileFullscreen: true, showOnMobile: true, showOnDesktop: true },
  messages: { title: 'Chat with us', subtitle: '', greeting: '', placeholder: 'Type', offlineTitle: 'Offline', offlineText: '', offlineThanks: '' },
  preChatForm: { enabled: false, fields: [] },
};
const SAVED = { id: 't1', kind: 'ADVANCED', name: 'Chat rescue', description: '', enabled: true, event: 'chat_requested', delaySeconds: 180, timerFrom: 'LAST_VISITOR', match: 'ALL', conditions: [], actions: [{ type: 'send_message', text: 'Sorry for the wait', suggestedReplies: [] }], frequency: 'ONCE_PER_CONVERSATION', cooldownSeconds: 0 };

beforeAll(() => {
  window.matchMedia ||= () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  Element.prototype.scrollIntoView ||= () => {};
});
afterEach(cleanup);

function setup() {
  apiMock.mockReset();
  apiMock.mockImplementation(async (path, opts) => {
    if (path === '/trigger-catalog') return CAT;
    if (path === '/stores/s1/triggers/t1' && !opts) return SAVED;
    if (path === '/stores/s1/webhooks') return { webhooks: [] };
    if (path === '/stores/s1/widget') return { published: CFG };
    if (opts?.method === 'PUT') return { ...SAVED, ...opts.body };
    return [];
  });
  render(<AntApp><MemoryRouter initialEntries={['/t1']}><Routes><Route path="/*" element={<Triggers />} /></Routes></MemoryRouter></AntApp>);
}

describe('Timer starts from', { timeout: 30_000 }, () => {
  it('loads the saved value with its help text and keeps it on save', async () => {
    setup();
    expect(await screen.findByText('Restarts on every customer message.')).toBeTruthy();
    expect(screen.getByText('Time without a new message before the actions run')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Save trigger/ }));
    await waitFor(() => expect(apiMock.mock.calls.find(([, o]) => o?.method === 'PUT')?.[1].body.timerFrom).toBe('LAST_VISITOR'));
  });

  it('switching to an event that does not support it falls back to "Trigger event / chat start"', async () => {
    setup();
    await screen.findByText('Restarts on every customer message.');
    const eventSelect = screen.getAllByRole('combobox')[0];
    fireEvent.mouseDown(eventSelect);
    fireEvent.click(await screen.findByTitle('Visitor views a page'));
    expect(await screen.findByText('Counted from the event.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Save trigger/ }));
    await waitFor(() => {
      const put = apiMock.mock.calls.find(([, o]) => o?.method === 'PUT');
      expect(put?.[1].body).toMatchObject({ event: 'page_view', timerFrom: 'EVENT' });
    });
  });
});
