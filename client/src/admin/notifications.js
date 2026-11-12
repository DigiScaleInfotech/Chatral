// Decides which alert / sound (if any) a socket event should raise for the signed-in user.
// Kept pure so the rules can be unit-tested; the shell only renders/plays the result.

const KIND_TITLE = { trigger: 'Trigger alert' };

/**
 * @returns {null | { title: string, body: string, conversationId?: string, toast: boolean }}
 *   toast=false means "browser notification only" (the inbox already shows the message).
 */
export function alertFor(type, d, { meId, storeId, onInbox }) {
  if (!d || (d.storeId && storeId && d.storeId !== storeId)) return null;
  if (type === 'message' && d.conversation?.folder === 'SPAM') return null;
  if (type === 'message' && d.message?.senderType === 'VISITOR') {
    const who = d.conversation?.visitor?.name || 'Visitor';
    const title = d.isNewConversation ? `${d.isOffline ? 'Offline message' : 'New chat'} - ${who}` : `New message - ${who}`;
    return { title, body: d.message.body || 'Attachment', conversationId: d.conversation?.id, toast: !onInbox || !!d.isNewConversation };
  }
  if (type === 'notification') {
    // New chats / offline messages are announced by their 'message' event (isNewConversation);
    // the parallel notification event would only duplicate it.
    if (d.kind === 'new_chat' || d.kind === 'offline_message') return null;
    // Targeted alerts (e.g. "assignee only") carry their recipients.
    if (d.userIds && !d.userIds.includes(meId)) return null;
    return { title: KIND_TITLE[d.kind] || 'Alert', body: d.text || '', conversationId: d.conversationId, toast: true };
  }
  return null;
}

/**
 * 'newConversation' | 'message' | null. Only visitor messages make a sound; agent replies, notes,
 * typing, receipts and other stores' events never do. De-duplication by message id is the caller's job.
 */
export function soundFor(type, d, { storeIds = [] }) {
  if (type !== 'message' || !d?.message) return null;
  // Every store this user can open sounds, not just the one on screen (no storeId on the event = no sound).
  if (!d.storeId || !storeIds.includes(d.storeId)) return null;
  if (d.message.senderType !== 'VISITOR') return null;
  if (d.conversation?.folder === 'SPAM') return null; // spam is stored silently
  return d.isNewConversation ? 'newConversation' : 'message';
}
