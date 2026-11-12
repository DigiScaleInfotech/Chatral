# Inbox audit vs. tawk.to (2026-10-19)

## What was actually inspected in tawk.to (read-only, nothing created or changed)

Live, via Claude in Chrome on the owner's logged-in dashboard:

- Inbox navigation: Compose, All / Mine, All, Chats, Tickets, Trash, Spam, Connect Channel.
- Inbox table (All): columns Contact, Type, Channel user, Preview, Agents/Assignee, Priority; checkbox column; search; filter button; split-view toggle; pagination "1 - 50 of 210".
- Tickets list: columns Contact, Channel user, Preview, Assignee, Priority, Status; empty state "No items found" (this account has no tickets, so no ticket detail/thread was observable).
- Filter menu: Assignee, Status, Priority, Tags, Contact, Message, Channel User, Ticket ID, Created (list scrolls; items past "Created" not inspected).
- Compose: contact picker (searchable, keyboard navigation) → choose inbox (Tickets / Chats) → New-ticket composer with Email (+CC), Subject, body, tag / assignee / priority icons, shortcut, attachment and emoji tools, ticket switcher dropdown ("No other tickets found"). Not sent.
- Ended chat view: session switcher, tag icon, event-visibility icon, assignee avatar, overflow menu with **Create Ticket, Session Information, Copy, Print, Ban, AI Feedback, Delete, Hide Events**. Composer replaced by a **Create Ticket** button.
- Create Ticket form (from a chat): Contact (locked), Email Address (choose from contact's emails), CC Recipients, Subject (prefilled "RE : Chat with <name>"), Message (with assignee + priority pickers), Attachments (drag/drop), Tags; Cancel / Create. Cancelled.
- Right panel tabs: Details (About, attributes, Organization), knowledge base, shortcuts, history, shopping (Shopify) icons; contact sub-tabs (profile, social, info, notes).

Earlier session (2026-10, same account): Administration → Ticketing settings exist (ticket email address / return address); Reporting has a Tickets section.

**Not verified in tawk.to:** ticket detail/thread, ticket status values and transitions, inbound email reply handling, ticket bulk actions, Session Information panel contents (click did not open a visible panel), Trash/Spam contents, Pop-out, keyboard shortcuts, departments routing.

## Feature matrix

| Feature | Observed in tawk.to | Current implementation (before this work) | Evidence/test | Gap or defect | Priority |
|---|---|---|---|---|---|
| Chats list with status views (Open/Pending/Resolved/All) | Yes (status filter) | Implemented | `routes/inbox.js` list + counts; inbox tests | - | - |
| Table view of inbox | Yes | Implemented | tawkGaps.test.jsx | - | - |
| Search (name, email, message, id) | Yes | Implemented | `q` filter in list route | - | - |
| Filters: assignee, priority, tag | Yes (+contact, created) | Implemented (no date range) | list route | Date-range filter missing | Low |
| Bulk select / bulk actions | Checkbox column | Missing | no rowSelection in Inbox.jsx | Missing | Medium |
| Mine view | Yes | Implemented (assignee=me) | list route | - | - |
| **Tickets inbox** | Yes | **Missing** | no ticket schema/route/UI | Missing | **High** |
| **Create ticket from chat / offline message** | Yes | **Missing** | - | Missing | **High** |
| **Compose new ticket** | Yes | **Missing** | - | Missing | **High** |
| Ticket email delivery | Yes (ticketing email settings) | Missing (SMTP job exists for alerts only) | `notify.js` send_email | Missing | **High** |
| Inbound email replies to ticket | Implied by email channel | Missing | - | Needs inbound mail infrastructure | Medium (documented) |
| Trash / Spam folders | Yes | Missing (hard delete for admins) | `DELETE /conversations/:id` | Missing | Low |
| Reply, internal notes, attachments | Yes | Implemented | messaging tests, live E2E | - | - |
| Saved replies / shortcuts | Yes | Implemented (access levels) | tests | - | - |
| Assignment, status, priority, tags | Yes | Implemented | PATCH route; tests | - | - |
| Copy transcript | Yes | Partial (clipboard use in Inbox.jsx) | code | Not verified end to end | Low |
| Print transcript | Yes | Missing | - | Missing | Low |
| Ban visitor | Yes | Missing | - | Missing | Medium |
| Delete conversation | Yes | Implemented (ADMIN+) | route | - | - |
| Hide/show events | Yes | Not verified | - | - | Low |
| Typing indicator, read receipts | Not inspected | Implemented | socket code; not tested live last round | Not verified live | Medium |
| Visitor details (device, pages, visits) | Yes | Implemented | conversation detail payload | No editable attributes / notes / organizations | Low |
| Shopify customer/orders | Icon present | Missing | - | Out of scope | Low |
| Knowledge base assist | Icon present | Missing | - | Out of scope | Low |
| Notification sounds (new chat / message) | n/a | Implemented | sounds tests + live E2E | - | - |

## Highest-impact gaps

1. Tickets: list, detail thread, create from chat / offline message / compose, real email delivery with failure handling. **Built in this round.**
2. Bulk actions on the inbox list.
3. Ban visitor; Trash instead of hard delete.
4. Inbound email replies (needs an inbound-mail provider; see "Ticketing" in README).

## Status after this round

| Feature | Now | Evidence |
|---|---|---|
| Tickets list (Open/Pending/Closed/All, counts, search incl. `#number`, assignee + priority filters) | Implemented | `server/test/tickets.test.js`, `Tickets.test.jsx`, live check |
| Create ticket: compose / from chat / from offline message | Implemented | tests + live (offline message → ticket #1 via UI) |
| Ticket form: name, email, CC, subject, message, assignee, priority, tags, attachments; validation | Implemented | tests (invalid email/CC, missing fields, no SMTP → refused) |
| Real outbound email, threading, delivery status, retries, failure + manual retry | Implemented | tests against a local SMTP server (accept / 451 / 550); live via local mail catcher |
| Duplicate protection (create + reply retries) | Implemented | tests (same requestId / clientMsgId → one email) |
| Internal notes on tickets (never emailed) | Implemented | tests + live |
| Assignment rules, agent scoping, store isolation, audit log, live updates | Implemented | tests |
| Bulk status / assign on tickets | Implemented | tests |
| Inbound email replies into the ticket thread | **Missing** (needs inbound mail service) | documented in README |
| Bulk chat actions (status, assign, Trash/Spam/Restore), Ban/unban, Trash/Spam folders, Print transcript | Implemented (later round) | `server/test/inbox-actions.test.js`, `printTranscript.test.js`, browser check |
| Real SMTP provider delivery (your mail server) | Not verified | only a local SMTP server was used |
