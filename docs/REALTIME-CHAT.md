# Real-time chat

## Connection lifecycle

**Widget** (`client/src/widget/ChatApp.jsx`)
1. Loads from `<script src=".../widget/chat.js" data-store="PUBLIC_KEY">`; the API origin is taken from the script URL (or `data-api`).
2. `POST /api/widget/:key/session` → visitor token (stored in `localStorage`; the server keeps only its SHA-256), published config, availability and the resumable conversation with recent messages.
3. Opens `/ws/visitor` (`wss://` on HTTPS pages). Origin must be on the store's allowlist (or the store has none).

**Dashboard** (`client/src/admin/socket.js`): one `/ws/agent?token=JWT` socket per tab; the server pings to detect dead connections.

## Messaging

- Visitor and agent messages carry a client-generated `clientMsgId`; the server stores it with a unique constraint, so a retried request returns the existing message instead of creating a duplicate.
- Each message has a per-conversation `seq`. Agents' `message` events include `isNewConversation` and `isOffline`.
- Internal notes are never sent to visitors (`visitorView` strips them; visitor history requests exclude `NOTE`).
- Typing: visitor typing (with optional preview) goes to agents; agent typing goes to the visitor only if the store enables it. Receipts: delivered/seen sequence numbers both ways.

## Reconnects and missed messages

- Both clients reconnect with exponential backoff (1 s doubling, capped at 30 s). The widget shows "Reconnecting…" after a few failed attempts.
- On reconnect, missed messages are fetched over REST (`?after=<last seq>`) and merged by id, so nothing is shown twice and nothing replays a sound.
- **Verified in a browser:** after an API restart the widget and dashboard reconnected on their own, the same conversation (same id, status) continued, and every message appeared exactly once.

## Offline messages

Outside business hours (agent online/away status is not used) the widget shows an offline form. `POST /api/widget/:key/offline` saves it as a conversation flagged `isOffline` (verified: listed in the inbox, "Offline message" alert, new-chat sound), triggers `offline_message` triggers/webhooks and, if enabled, email alerts. Agents can turn it into a ticket.

## Sounds (`client/src/admin/sounds.js`)

- **New conversation:** rising three-note chime (C6 → E6 → A6). Played for a visitor `message` event with `isNewConversation: true` (chat or offline form) - once.
- **New message in an existing chat:** two short notes (880 → 1320 Hz). Played for other visitor messages.
- **No sound** for agent replies, notes, system/bot messages, typing, receipts, other stores' events, messages recovered after reconnect, or a message id already played (de-duplicated per page).
- Synthesised with the Web Audio API (no files). Browsers block audio until the user interacts; the first click/keypress unlocks it, and the header sound icon shows the real state (on / off / blocked by browser / unavailable) with an "Enable sound" button.
- Preferences (master on/off, each sound on/off) are stored per browser in `localStorage`. Test buttons are in the header sound menu.
- **Not verified:** actual audibility on speakers and Safari's autoplay policy (tests record which tones start).
