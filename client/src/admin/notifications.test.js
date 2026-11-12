import { describe, it, expect } from 'vitest';
import { alertFor } from './notifications.js';

const ctx = { meId: 'u1', storeId: 's1', onInbox: false };
const visitorMsg = { storeId: 's1', conversation: { id: 'c1', visitor: { name: 'Sam' } }, message: { senderType: 'VISITOR', body: 'hi' } };

describe('alertFor', () => {
  it('raises one alert per visitor message, browser-only while on the inbox', () => {
    expect(alertFor('message', visitorMsg, ctx)).toEqual({ title: 'New message - Sam', body: 'hi', conversationId: 'c1', toast: true });
    expect(alertFor('message', visitorMsg, { ...ctx, onInbox: true }).toast).toBe(false);
  });

  it('ignores agent/bot messages and events from other stores', () => {
    expect(alertFor('message', { ...visitorMsg, message: { senderType: 'AGENT', body: 'x' } }, ctx)).toBeNull();
    expect(alertFor('message', { ...visitorMsg, storeId: 's2' }, ctx)).toBeNull();
  });

  it('respects targeted recipients on trigger notifications', () => {
    const n = { storeId: 's1', kind: 'trigger', text: 'Waiting', userIds: ['u2'] };
    expect(alertFor('notification', n, ctx)).toBeNull();
    expect(alertFor('notification', { ...n, userIds: ['u1', 'u2'] }, ctx).title).toBe('Trigger alert');
    // New chats / offline messages are announced by their message event, not a second notification.
    expect(alertFor('notification', { storeId: 's1', kind: 'offline_message', text: 'x' }, ctx)).toBeNull();
    expect(alertFor('notification', { storeId: 's1', kind: 'new_chat', text: 'x' }, ctx)).toBeNull();
  });
});

describe('new-conversation alerts', () => {
  it('titles the first message as a new chat / offline message and always toasts it', () => {
    const first = { ...visitorMsg, isNewConversation: true };
    expect(alertFor('message', first, { ...ctx, onInbox: true })).toMatchObject({ title: 'New chat - Sam', toast: true });
    expect(alertFor('message', { ...first, isOffline: true }, ctx).title).toBe('Offline message - Sam');
    expect(alertFor('message', visitorMsg, ctx).title).toBe('New message - Sam');
  });
});
