# Tickets and email

Code: `server/src/services/tickets.js`, `server/src/routes/tickets.js`, `client/src/admin/pages/Tickets.jsx`, `client/src/admin/components/TicketForm.jsx`.

## Lifecycle

1. **Create** - New ticket (compose), *Create ticket* in a chat's header, or from an offline message. Fields: contact name, email (required, validated), CC, subject, message, assignee, priority, tags, attachments. Numbers are per store (#1, #2, …).
   - From a chat/offline message the transcript (without internal notes) is copied into the ticket's first system entry, so the ticket survives chat retention; the source chat id is kept.
   - Creation is **refused (409) when no SMTP is configured** - a ticket is never created that cannot be emailed.
   - The form sends a client `requestId`; a retried submit returns the same ticket and queues nothing new.
2. **Thread** - agent replies (emailed) and internal notes (never emailed) in order, plus system entries for status/assignment/priority changes.
3. **Status** - Open → Pending (waiting on customer) → Closed, any direction. An email reply to a Closed ticket reopens it.
4. **Visibility** - same as chats: Agents see unassigned + own; Supervisor+ see all and can assign anyone. Changes are audit-logged and pushed live (`ticket_created`, `ticket`, `ticket_message`).

## Outbound email

- SMTP source: the store's own settings (Settings → Notifications, password encrypted with `ENC_KEY`) or the platform `SMTP_*` variables.
- Each reply is one `ticket_email` job with `dedupeKey = ticket_email:<messageId>`, so enqueuing twice is impossible.
- Status shown per reply: **Sending…** (queued) → **Emailed** once the SMTP server accepts it, or **Not delivered** with the server's error.
- Retries: network errors and 4xx replies are retried with backoff (up to 5 attempts). 5xx rejections and authentication failures are permanent → *Not delivered*; an agent can press **Retry**.
- Threading: subject `[#N] Subject` (`Re:` on replies); `Message-ID`, `In-Reply-To` and `References` link replies in the customer's mail client. Attachments are sent with the email.

### Duplicate-delivery risk

Delivery is **at-least-once, not exactly-once**. Retries never resend a message already marked sent, but if the process dies after the SMTP server accepted the email and before the job is marked done, the job runs again and the customer receives a second copy. This is inherent to SMTP without provider-side idempotency.

## Inbound email - not implemented

Customer replies go to the `From` mailbox and are **not** imported into the ticket thread. Adding it needs an inbound-mail service (an inbound-parse webhook from your email provider, or IMAP polling) that maps replies back via `In-Reply-To`/`[#N]`.

## Verification

- Automated (`server/test/tickets.test.js`): validation, refusal without SMTP, real SMTP delivery to an in-test SMTP server, retry-safe create and reply, threading headers, notes never emailed, 451 → retried, 550 → failed + manual retry, attachments, permissions, store isolation, live events. UI: `Tickets.test.jsx`.
- Browser: offline message → ticket → reply → note → status change, with mail caught by a local SMTP catcher.
- **Not verified:** delivery through a real email provider.
