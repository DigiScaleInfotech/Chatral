// Single source of truth for what the trigger builder can express. The dashboard renders from this,
// the API validates against it, and the engine only executes action types listed here.
import { z } from 'zod';

export const EVENTS = [
  { key: 'page_view', label: 'Visitor views a page', help: 'Each page load / navigation where the widget runs.' },
  { key: 'chat_requested', label: 'Visitor requests a chat', help: 'First visitor message of a new or reopened conversation.' },
  { key: 'visitor_message', label: 'Visitor sends a message' },
  { key: 'agent_message', label: 'Agent sends a message', help: 'Use with a delay + "Waiting for visitor reply" for follow-ups.' },
  { key: 'offline_message', label: 'Visitor leaves an offline message' },
  { key: 'conversation_resolved', label: 'Conversation is resolved' },
];

const NUM = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'];
const STR = ['eq', 'neq', 'contains', 'not_contains', 'starts_with', 'ends_with'];
const BOOL = ['is_true', 'is_false'];
const ENUM = ['eq', 'neq'];
const LIST = ['contains', 'not_contains'];

export const OPERATORS = {
  eq: 'Equals', neq: 'Not equal', gt: 'Greater than', gte: 'At least', lt: 'Less than', lte: 'At most',
  contains: 'Contains', not_contains: 'Does not contain', starts_with: 'Starts with', ends_with: 'Ends with',
  is_true: 'Is True', is_false: 'Is False', for: 'for',
};

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const ONLINE = ['Online', 'Offline'];
export const MAX_WAIT_SECONDS = 7 * 86400;

export const FIELDS = [
  // `unit: 'seconds'` = a duration; the dashboard edits it in seconds / minutes / hours, the API always stores seconds.
  // Wait steps are not checks: they pause before the conditions that follow them are evaluated.
  // `help` is the short note the dashboard shows under a condition row; labels stay as plain names (tawk.to style).
  { key: 'time.hourOfDay', group: 'Time / Date', label: 'Hour of day', help: '0-23, in the business-hours timezone', type: 'number', ops: NUM },
  { key: 'time.dayOfWeek', group: 'Time / Date', label: 'Day of week', type: 'enum', options: DAYS, ops: ENUM },
  { key: 'page.timeOnPage', group: 'Time / Date', label: 'Visitor time on page', type: 'number', unit: 'seconds', ops: NUM },
  { key: 'visitor.timeOnSite', group: 'Time / Date', label: 'Visitor time on site', type: 'number', unit: 'seconds', ops: NUM },
  { key: 'wait', group: 'Time / Date', label: 'Still on site', help: 'Delay before checking the next condition', type: 'wait', unit: 'seconds', ops: ['for'] },
  { key: 'wait_page', group: 'Time / Date', label: 'Still on page', help: 'Delay before checking the next condition; stops if the visitor changes page', type: 'wait', unit: 'seconds', ops: ['for'] },
  { key: 'visitor.ip', group: 'Location of Visitor', label: 'Visitor ip', type: 'string', ops: STR },
  { key: 'visitor.hostname', group: 'Location of Visitor', label: 'Visitor hostname', type: 'string', ops: STR },
  { key: 'visitor.city', group: 'Location of Visitor', label: 'Visitor city', type: 'string', ops: STR },
  { key: 'visitor.country', group: 'Location of Visitor', label: 'Visitor country name', type: 'string', ops: STR },
  { key: 'visitor.visits', group: 'Previous Visit Information', label: 'Visitor previous visits', type: 'number', ops: NUM },
  { key: 'visitor.previousChats', group: 'Previous Visit Information', label: 'Visitor previous chats', type: 'number', ops: NUM },
  { key: 'visitor.isReturning', group: 'Previous Visit Information', label: 'Returning visitor', type: 'bool', ops: BOOL },
  { key: 'page.url', group: 'Page Information', label: 'Visitor page URL', type: 'string', ops: STR },
  { key: 'page.path', group: 'Page Information', label: 'Visitor page path', help: 'Path only, e.g. / for the home page or /products/ring', type: 'string', ops: STR },
  { key: 'visitor.pageViews', group: 'Page Information', label: 'Visitor page count', type: 'number', ops: NUM },
  { key: 'page.title', group: 'Page Information', label: 'Visitor page title', type: 'string', ops: STR },
  { key: 'page.previous', group: 'Page Information', label: 'Previous page', type: 'string', ops: STR },
  { key: 'visitor.name', group: 'Visitor Information', label: 'Visitor Name', type: 'string', ops: STR },
  { key: 'visitor.hasEmail', group: 'Visitor Information', label: 'Visitor email known', type: 'bool', ops: BOOL },
  { key: 'page.referrer', group: 'Visitor Information', label: 'Visitor referrer', type: 'string', ops: STR },
  { key: 'visitor.searchEngine', group: 'Visitor Information', label: 'Visitor search engine', type: 'string', ops: STR },
  { key: 'visitor.searchTerms', group: 'Visitor Information', label: 'Visitor search terms', help: 'Only when the search engine sends them (most no longer do)', type: 'string', ops: STR },
  { key: 'visitor.userAgent', group: 'Software / Computer of Visitor', label: 'Visitor user agent', type: 'string', ops: STR },
  { key: 'visitor.browser', group: 'Software / Computer of Visitor', label: 'Visitor browser', type: 'enum', options: ['Chrome', 'Safari', 'Firefox', 'Edge', 'Opera', 'Samsung Internet', 'Other'], ops: ENUM },
  { key: 'visitor.platform', group: 'Software / Computer of Visitor', label: 'Visitor platform', type: 'enum', options: ['Windows', 'macOS', 'iOS', 'Android', 'Linux', 'Chrome OS', 'Other'], ops: ENUM },
  { key: 'visitor.device', group: 'Software / Computer of Visitor', label: 'Visitor device', type: 'enum', options: ['desktop', 'mobile'], ops: ENUM },
  { key: 'widget.status', group: 'Online statuses', label: 'Widget status', help: 'Online = within business hours', type: 'enum', options: ONLINE, ops: ENUM },
  { key: 'agents.status', group: 'Online statuses', label: 'Agents Availability status', help: 'Online when at least one agent has the dashboard open', type: 'enum', options: ONLINE, ops: ENUM },
  { key: 'visitor.status', group: 'Online statuses', label: 'Visitor status', help: 'Online while the visitor has the website open', type: 'enum', options: ONLINE, ops: ENUM },
  { key: 'agents.onlineCount', group: 'Online statuses', label: 'Online agents', type: 'number', ops: NUM },
  { key: 'businessHours.open', group: 'Online statuses', label: 'Within business hours', type: 'bool', ops: BOOL },
  { key: 'chat.exists', group: 'Chat-related Information', label: 'Visitor requesting chat', help: "'true' if the visitor is requesting a chat", type: 'bool', ops: BOOL },
  { key: 'chat.served', group: 'Chat-related Information', label: 'Visitor served', help: "'true' once an agent has replied", type: 'bool', ops: BOOL },
  { key: 'message.text', group: 'Chat-related Information', label: 'Message', help: 'Text of the message that started the trigger', type: 'string', ops: STR },
  { key: 'chat.status', group: 'Chat-related Information', label: 'Conversation status', type: 'enum', options: ['OPEN', 'PENDING', 'RESOLVED'], ops: ENUM },
  { key: 'chat.priority', group: 'Chat-related Information', label: 'Priority', type: 'enum', options: ['LOW', 'NORMAL', 'HIGH', 'URGENT'], ops: ENUM },
  { key: 'chat.assigned', group: 'Chat-related Information', label: 'Assigned to an agent', type: 'bool', ops: BOOL },
  { key: 'chat.tags', group: 'Chat-related Information', label: 'Tags', type: 'tags', ops: LIST },
  { key: 'chat.messageCount', group: 'Messages', label: 'Total messages', type: 'number', ops: NUM },
  { key: 'chat.visitorMessageCount', group: 'Messages', label: 'Visitor messages', type: 'number', ops: NUM },
  { key: 'chat.agentMessageCount', group: 'Messages', label: 'Agent messages', type: 'number', ops: NUM },
  { key: 'chat.awaitingAgentReply', group: 'Messages', label: 'Waiting for agent reply', type: 'bool', ops: BOOL },
  { key: 'chat.awaitingVisitorReply', group: 'Messages', label: 'Waiting for visitor reply', type: 'bool', ops: BOOL },
];
export const FIELD_MAP = Object.fromEntries(FIELDS.map((f) => [f.key, f]));
export const isWait = (c) => FIELD_MAP[c?.field]?.type === 'wait';

const LEGACY_STATUS = { 'agents.available': 'agents.status', 'visitor.online': 'visitor.status' };
/** Old "Agents available / Visitor connected - is true/false" conditions → "… status Equals Online/Offline". */
export function normalizeCondition(c) {
  const to = c && LEGACY_STATUS[c.field];
  if (!to) return c;
  return { field: to, op: 'eq', value: c.op === 'is_false' ? 'Offline' : 'Online' };
}
export const normalizeConditions = (conds) => (Array.isArray(conds) ? conds.map(normalizeCondition) : conds);

export const ACTIONS = [
  { key: 'send_message', label: 'Send automated message', needsConversation: false },
  { key: 'send_saved_reply', label: 'Send a saved reply', needsConversation: false },
  { key: 'show_contact_form', label: 'Show contact form', needsConversation: false },
  { key: 'assign', label: 'Assign conversation', needsConversation: true },
  { key: 'add_tags', label: 'Add tags', needsConversation: true },
  { key: 'set_priority', label: 'Set priority', needsConversation: true },
  { key: 'notify', label: 'Notify team', needsConversation: false },
  { key: 'webhook', label: 'Call approved webhook', needsConversation: false },
];

// What the Delay is counted from. EVENT keeps the original behaviour; the other two make the Delay an inactivity
// timer that restarts on each customer (or customer/agent) message. Agent = a human agent reply; bot/system messages don't count.
export const TIMER_FROM = [
  { key: 'EVENT', label: 'Trigger event / chat start', help: 'The delay is counted once, from the moment the trigger event happened.', events: ['page_view', 'chat_requested', 'visitor_message', 'agent_message', 'offline_message', 'conversation_resolved'] },
  { key: 'LAST_VISITOR', label: 'Last customer message', help: 'The delay restarts every time the customer sends a message (e.g. rescue a chat 3 minutes after the customer last wrote).', events: ['chat_requested', 'visitor_message'] },
  { key: 'LAST_MESSAGE', label: 'Last message in conversation', help: 'The delay restarts on every customer or agent message (e.g. follow up after 5 minutes of silence from both sides).', events: ['chat_requested', 'visitor_message', 'agent_message'] },
];
export const TIMER_MAP = Object.fromEntries(TIMER_FROM.map((t) => [t.key, t]));

export const FREQUENCIES = [
  { key: 'ONCE_PER_VISITOR', label: 'Once per visitor (ever)' },
  { key: 'ONCE_PER_SESSION', label: 'Once per visit/session' },
  { key: 'ONCE_PER_CONVERSATION', label: 'Once per conversation' },
  { key: 'EVERY_TIME', label: 'Every time (with cooldown)' },
];

const conditionSchema = z.preprocess(normalizeCondition, z.object({
  field: z.string(),
  op: z.string(),
  value: z.union([z.string().max(500), z.number(), z.boolean(), z.null()]).optional(),
}).superRefine((c, ctx) => {
  const f = FIELD_MAP[c.field];
  if (!f) return ctx.addIssue({ code: 'custom', message: `Unknown condition field "${c.field}"` });
  if (!f.ops.includes(c.op)) ctx.addIssue({ code: 'custom', message: `"${OPERATORS[c.op] || c.op}" is not valid for ${f.label}` });
  if (f.type === 'number' && (typeof c.value !== 'number' || !Number.isFinite(c.value))) ctx.addIssue({ code: 'custom', message: `${f.label} needs a number` });
  if (f.type === 'wait' && (!Number.isInteger(c.value) || c.value < 1 || c.value > MAX_WAIT_SECONDS)) ctx.addIssue({ code: 'custom', message: `Wait must be between 1 second and 7 days` });
  if ((f.type === 'string' || f.type === 'tags') && (typeof c.value !== 'string' || !c.value.trim())) ctx.addIssue({ code: 'custom', message: `${f.label} needs a value` });
  if (f.type === 'enum' && !f.options.some((o) => o.toLowerCase() === String(c.value ?? '').toLowerCase())) ctx.addIssue({ code: 'custom', message: `${f.label}: choose one of ${f.options.join(', ')}` });
}));

const sender = { agentName: z.string().trim().max(60).optional(), avatarUrl: z.string().trim().max(500).refine((v) => !v || /^https:\/\//.test(v), 'Avatar must be an https:// URL').optional() };
const actionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('send_message'), text: z.string().trim().min(1).max(2000), suggestedReplies: z.array(z.string().trim().min(1).max(60)).max(5).default([]), ...sender }),
  z.object({ type: z.literal('send_saved_reply'), savedReplyId: z.string().min(1), ...sender }),
  z.object({ type: z.literal('show_contact_form'), text: z.string().trim().max(500).default('Leave your details and we will get back to you.'), fields: z.array(z.enum(['name', 'email', 'phone'])).min(1).default(['name', 'email']), ...sender }),
  z.object({ type: z.literal('assign'), mode: z.enum(['auto', 'agent']), agentId: z.string().optional() }),
  z.object({ type: z.literal('add_tags'), tags: z.array(z.string().trim().min(1).max(30)).min(1).max(10) }),
  z.object({ type: z.literal('set_priority'), priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']) }),
  z.object({ type: z.literal('notify'), target: z.enum(['all_agents', 'online_agents', 'assignee', 'admins']), channels: z.array(z.enum(['dashboard', 'email'])).min(1), text: z.string().trim().min(1).max(500) }),
  z.object({ type: z.literal('webhook'), webhookId: z.string().min(1) }),
]);

export const triggerSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(300).optional().nullable(),
  enabled: z.boolean().default(true),
  kind: z.enum(['BASIC', 'ADVANCED']),
  event: z.enum(EVENTS.map((e) => e.key)),
  delaySeconds: z.number().int().min(0).max(7 * 86400),
  timerFrom: z.enum(TIMER_FROM.map((t) => t.key)).default('EVENT'),
  match: z.enum(['ALL', 'ANY']),
  conditions: z.array(conditionSchema).max(20),
  actions: z.array(actionSchema).min(1, 'Please add at least one action').max(10),
  frequency: z.enum(FREQUENCIES.map((f) => f.key)),
  cooldownSeconds: z.number().int().min(0).max(30 * 86400).default(0),
}).refine((t) => TIMER_MAP[t.timerFrom].events.includes(t.event), { message: '"Timer starts from" is not available for this trigger event', path: ['timerFrom'] })
  .refine((t) => t.timerFrom === 'EVENT' || t.kind === 'ADVANCED', { message: 'Basic triggers always count from the trigger event', path: ['timerFrom'] })
  .refine((t) => t.timerFrom === 'EVENT' || t.delaySeconds > 0, { message: 'Set a Delay: it is how long to wait after the last message', path: ['delaySeconds'] })
  .refine((t) => t.actions.every((a) => a.type !== 'assign' || a.mode === 'auto' || a.agentId), { message: 'Please choose an agent for the assign action', path: ['actions'] })
  .refine((t) => t.match === 'ALL' || !t.conditions.some(isWait), { message: 'Wait steps only work with "Match ALL" conditions', path: ['conditions'] })
  .refine((t) => t.delaySeconds + t.conditions.filter(isWait).reduce((s, c) => s + (Number(c.value) || 0), 0) <= MAX_WAIT_SECONDS, { message: 'Delay plus waits must total 7 days or less', path: ['conditions'] });

export const TEMPLATES = [
  {
    key: 'welcome', name: 'Welcome message', description: 'Greet visitors who have browsed for 30 seconds.',
    trigger: { kind: 'BASIC', event: 'page_view', delaySeconds: 30, match: 'ALL', frequency: 'ONCE_PER_SESSION', cooldownSeconds: 0,
      conditions: [{ field: 'visitor.timeOnSite', op: 'gte', value: 30 }, { field: 'chat.exists', op: 'is_false' }, { field: 'visitor.status', op: 'eq', value: 'Online' }],
      actions: [{ type: 'send_message', text: 'Hi {{visitor.name}}! 👋 Can we help you find anything?', suggestedReplies: ['Yes, please', 'Just browsing'] }] },
  },
  {
    key: 'chat_rescue', name: 'Chat rescue', description: 'If nobody answers within 60s, apologise and collect contact details.',
    trigger: { kind: 'ADVANCED', event: 'chat_requested', delaySeconds: 60, timerFrom: 'LAST_VISITOR', match: 'ALL', frequency: 'ONCE_PER_CONVERSATION', cooldownSeconds: 0,
      conditions: [{ field: 'chat.awaitingAgentReply', op: 'is_true' }, { field: 'chat.agentMessageCount', op: 'eq', value: 0 }],
      actions: [
        { type: 'show_contact_form', text: 'Sorry for the wait! Leave your email and we will reply as soon as possible.', fields: ['name', 'email'] },
        { type: 'notify', target: 'all_agents', channels: ['dashboard', 'email'], text: 'A visitor has been waiting 60s without a reply.' },
        { type: 'set_priority', priority: 'HIGH' },
      ] },
  },
  {
    key: 'no_reply_followup', name: 'No-reply follow-up', description: 'Nudge visitors who have not answered an agent for 5 minutes.',
    trigger: { kind: 'ADVANCED', event: 'agent_message', delaySeconds: 300, match: 'ALL', frequency: 'EVERY_TIME', cooldownSeconds: 1800,
      conditions: [{ field: 'chat.awaitingVisitorReply', op: 'is_true' }, { field: 'chat.status', op: 'neq', value: 'RESOLVED' }],
      actions: [{ type: 'send_message', text: 'Are you still there? Let us know if you have any other questions.', suggestedReplies: ["Yes, I'm here", 'All set, thanks'] }] },
  },
  {
    key: 'offline_support', name: 'Offline support', description: 'Outside business hours, tell visitors when you will reply and tag the chat.',
    trigger: { kind: 'ADVANCED', event: 'chat_requested', delaySeconds: 0, match: 'ANY', frequency: 'ONCE_PER_CONVERSATION', cooldownSeconds: 0,
      conditions: [{ field: 'businessHours.open', op: 'is_false' }, { field: 'agents.status', op: 'eq', value: 'Offline' }],
      actions: [
        { type: 'send_message', text: "We're offline right now, but we'll reply by email as soon as we're back." },
        { type: 'add_tags', tags: ['after-hours'] },
      ] },
  },
];

export const catalog = () => ({ events: EVENTS, fields: FIELDS, operators: OPERATORS, actions: ACTIONS, frequencies: FREQUENCIES, timerFrom: TIMER_FROM, templates: TEMPLATES });
