# Features

## Roles and permissions

**Two roles:** one **main admin** (platform super admin: every store, users, settings) and **agents**. New users are always agents; the server refuses a second main admin and any store role other than Agent. When creating or editing an agent (Platform → Users) the main admin ticks the stores the agent may work in; creating a store with a user email adds that user as an agent. Owner/Admin/Supervisor memberships that existed before this change keep their permissions (table below) but can't be granted any more.

| Action | Agent | Supervisor | Admin | Owner |
|---|---|---|---|---|
| See chats/tickets | unassigned + own | all | all | all |
| Reply, notes, status, take a chat | ✓ | ✓ | ✓ | ✓ |
| Assign to someone else | - | ✓ | ✓ | ✓ |
| Bulk status / assign (within what they can see) | ✓ (assign to self only) | ✓ | ✓ | ✓ |
| Move chats to Trash/Spam, restore | - | ✓ | ✓ | ✓ |
| Ban / unban visitors | - | ✓ | ✓ | ✓ |
| Delete a chat permanently (only from Trash/Spam) | - | - | ✓ | ✓ |
| Saved replies | ✓ | ✓ | ✓ | ✓ |
| Reports | - | ✓ | ✓ | ✓ |
| Settings, widget, triggers, members | - | - | ✓ | ✓ |
| Owners, key rotation, retention | - | - | - | ✓ |

## Inbox (chats)

- List and table views; status tabs Open / Pending / Resolved / All with counts; search (name, email, message text, id); assignee and tag filters.
- **Folders: Inbox / Trash / Spam.** Trash and Spam hold chats moved out of the inbox; they can be restored. A returning visitor always continues their previous (unexpired) chat: if it was in Trash it moves back to the Inbox; if it was in Spam it stays in Spam and raises no sound, alert, trigger or webhook. Permanent delete is only offered from Trash/Spam and only to Admin/Owner.
- **Bulk actions:** tick chats in the list (or table) → set status, assign, Trash/Spam/Restore. Chats the user can't see are skipped and reported.
- Conversation: reply, internal notes (never sent to the visitor), attachments, saved replies (`/`), status, tags (type a tag and press Enter; click × to remove), assignment, delivered/seen receipts, typing indicators, visitor details and history.
- **Ban visitor** (⋯ menu): the visitor can still browse but cannot send chat messages, offline messages, contact details or files (server returns 403; the widget shows "You can no longer send messages in this chat."). Unban from the same menu. Banned state shows as a banner in the conversation.
- **Download transcript** (⋯ menu): the chat as a .txt file, internal notes included and marked; same visibility rules as opening the chat; audit-logged.
- **Print transcript** (⋯ menu): readable transcript with timestamps, senders, notes (marked) and file names, printed from a hidden frame (no pop-up).
- **Create ticket** from any chat or offline message.
- All of the above update other agents' dashboards live.

## Tickets

Email support threads under Tickets: compose, from a chat, from an offline message; Open / Pending / Closed; assignment, priority, tags, search (incl. `#number`), filters, bulk status/assign; replies by email and internal notes; attachments. See [TICKETS-EMAIL.md](TICKETS-EMAIL.md).

## Visitors

Visitors who **filled the chat form or started a chat** in the last 5/10/30/60 minutes (people who only browse are recorded but not listed): current page, approximate location (city, country - from the IP via the bundled offline GeoLite database; "Unknown" for older visitors or when the proxy hides the IP), referrer, device, open chat. Admins can delete one visitor or tick several and **Delete selected**; both ask twice (warning, then typing DELETE) and remove the visitor with chats, files and page history. No online/offline status is shown anywhere in the product.

## Page tracking

Every page a visitor opens (including single-page-app navigation) is recorded and shown inside their conversation as **"Visitor navigated to <page title> – site"** in time order, live while the chat is open. Only agents see it; it is never sent to the visitor. Page history is deleted after the store's retention period (default 30 days). Pages from up to one hour before the chat started are included.

## Shopify (customer and last order)

Admins connect Shopify in Store settings → Integrations with the store's `.myshopify.com` domain and an Admin API access token from a custom app with the `read_customers` and `read_orders` scopes (token stored encrypted, never shown again). The conversation side panel then shows the matching customer (by the visitor's email, or any email typed in) and their last order: number, date, payment and fulfilment status, total and items, with links to Shopify admin. Each store uses only its own connection. **Not verified against a real Shopify store** - automated tests simulate Shopify's responses; the query was validated against the Admin API 2026-07 schema.

## Widget

- **Header menu (☰):** Change name; Download transcript (a .txt file of the conversation saved on the customer's device - no email needed; no internal notes; agents appear as "Customer Support". The email-transcript route still exists on the server but the widget no longer offers it); no internal notes; agents appear as "Customer Support"); Sound on/off (saved in the visitor's browser; the store's sound setting must allow sound); End this chat session (with confirmation; marks the chat resolved and replaces the message box with **Start a new chat** until the visitor clicks it - a page reload shows the box again). There is no minimise button on desktop (the launcher closes the chat); phones keep a close button. The pop-out option was removed from the menu (the `/widget/popout` page still exists but nothing links to it).
- **Master switch:** Platform → Stores & Usage → **Widget on site** On/Off per store (main admin only). Off hides the widget on every website immediately (the widget API and visitor socket refuse the store); all settings are kept.
- **Theme compatibility:** the widget host forces `display:block`, because some themes (e.g. Shopify Dawn) hide empty `div`s.
- **Names shown to customers:** every agent reply (typed or saved reply) shows as **"Customer Support"** with no avatar. System lines such as "X joined the chat" are unchanged and still contain the agent's name.
- **Pre-chat form:** typed fields - Name, Email, Phone, Short text, Text area, Number, Date, Single choice, Multiple choice - with label, required/optional, options for choice fields, reorder and remove (up to 12). A Question (text area) field is included by default for new stores and can be added with one click. Answers are validated on the server against the published form, saved on the visitor (`Visitor.attributes`), shown to agents under "Pre-chat answers", and all answers are sent as the visitor's first chat message (see below).
- **Chat started from the pre-chat form:** the conversation reads (1) the **welcome message** (Widget design → "Welcome message", sent as the store's agent name), (2) the customer's details as their first message, one `Label : value` line per answered field (Name, Email, Phone, Question, …), (3) the **please-wait message** (Widget design → "Please-wait message"; default "Thank you for your message! 😊 Please wait 2 minutes, our customer support team will join you shortly."; empty = off). Both are added once, only when the form starts a new chat. Without a pre-chat form, the welcome text is only an intro above an empty chat and is never inserted as a message.
- **Published versions:** "Clear History" deletes older published versions only; the live version, the draft and the storefront widget are kept.

Shadow-DOM widget with draft/publish customisation (colours, position, texts, fonts, behaviour toggles), business hours with offline form, pre-chat/contact form, attachments, returning-visitor resume, unread badge, tab-title flash, domain allowlist.

## Automation and integrations

- **Trigger conditions (tawk.to groups):** Time / Date (hour, day, time on page, time on site, **Still on site**, **Still on page** - stops if the visitor changes page), Location (IP, hostname via reverse DNS, city, country name - approximate), Previous visits/chats, Page (URL, page count, title, previous page), Visitor (name, email known, referrer, search engine, search terms - most engines no longer send terms), Software (user agent, browser, platform, device), Online statuses (Widget status, Agents Availability status and Visitor status - each `Equals Online/Offline`; widget = business hours, agents = someone has the dashboard open, visitor = website open), Chat (requesting chat, served, message, status, assignment, tags, message counts). **Department** is not available (no departments in this app). Conditions use plain tawk.to names; short explanations appear under the row. Triggers saved with the older "agents available / visitor connected - is true/false" form are converted automatically. Every time value (waits, delays, cooldown, time conditions) is entered in seconds, minutes or hours and stored in seconds. IP/user agent are recorded from this update on.
- **Timer starts from (Advanced triggers):** what the Delay is counted from - *Trigger event / chat start* (original behaviour, the default for every existing trigger), *Last customer message* (restarts on each customer message; chat requested / visitor message events) or *Last message in conversation* (restarts on each customer or agent message; also agent-message events). Bot/system messages never restart it. Message-based timers need a Delay > 0, keep one pending run per trigger and conversation (later messages move its deadline when it wakes, so nothing is sent twice), skip closed conversations, and re-check enabled/version, frequency and filters right before sending. The Chat rescue template uses *Last customer message*. Example: 3-minute delay, customer writes at 1:38 → eligible 1:41; another message at 1:40 → 1:43; an agent reply before then suppresses it when the trigger has "Visitor served Is False" (or the template's waiting-for-agent conditions).
- **Triggers:** events (page view, visitor message, chat requested, offline message, conversation resolved, …), conditions, sequential waits, actions (send message, saved reply, contact form, tags, priority, assign, notify, webhook); cooldowns and execution logs.
- **Webhooks:** signed (HMAC-SHA256) HTTP callbacks for conversation/message/offline events, with delivery log and retries.
- **Reports:** volume, response times and related metrics per store, plus **Top countries / Top cities** of customers who chatted (approximate, from IP; recorded from the location update onwards) and a breakdown of every **single-choice pre-chat question** (add e.g. "Gender" or "Age group" questions to get those - they can't be detected automatically).
- **Bitrix24 alert (externally configured):** with `BITRIX24_WEBHOOK_URL` and `BITRIX24_DIALOG_ID` set in the server environment, each new chat and offline message sends one Bitrix24 chat message (`im.message.add`) with name, email, pre-chat answers, first message, page and an inbox link. Retried on errors; bad credentials stop and are logged as `[bitrix24]`. **Not verified against a real Bitrix24 portal** (tests use a simulated one).
- **Sounds across stores:** the dashboard plays the new-chat/new-message sound for every store the user can open, not only the one on screen (toasts and counts stay per store).
- **Assignment:** new chats are Unassigned. A store member who replies to an unassigned chat takes it (super admins who aren't members of the store don't). Triggers can assign explicitly. The Assignee dropdown always shows a name ("Name (not a member)" or "Unknown agent" for edge cases), never an internal id.
- **Email delivery panel** (Store settings → Notifications & SMTP): whether SMTP is configured and from where, who receives new-chat/offline alerts (placeholder addresses like `…@example.test` are flagged), and the last 20 notification emails with status queued / retrying / sent / failed and the error. Subjects and recipients only - no message bodies or passwords. Without SMTP, alerts are skipped and the server log says so (`[email] … SMTP is not configured`).
- **Email setup check:** Store settings → Notifications & SMTP → "Send test email" sends a real message and reports success only when the mail server accepted it.
- **Notifications:** in-app toasts and browser notifications, new-chat and new-message sounds (see [REALTIME-CHAT.md](REALTIME-CHAT.md)), optional email alerts.

## Retention

`retentionDays` (default 30) after the last qualifying visitor activity, only the conversation's **uploaded files** are removed; the conversation and its text messages are kept permanently. The widget tells visitors: "Uploaded files are kept for N days after your last message, then removed automatically." Tickets are not subject to this. Trash/Spam do not change retention.

## Availability and names

There is no agent online/away status. Live chat is available whenever business hours allow it (always, if business hours are off); outside them the widget shows the offline form. Customers see the widget's configured name (default "Support") and each agent's own name on that agent's replies; the store's name is not shown in the widget. Priority is not shown or set in the inbox (it still exists for triggers).

## Known limitations

- **Not implemented:** inbound customer email replies into tickets; knowledge-base assist; departments routing; hide/show event filters; pop-out conversation.
- Ban is per visitor token (browser storage). A visitor who clears storage gets a new identity; there is no IP/email ban.
- A banned visitor's widget stays connected; their typing indicator is not suppressed (messages are blocked).
- Trash/Spam have no automatic purge other than normal retention.
- Single-instance real-time fan-out (see BUILD-DEPLOY.md).
