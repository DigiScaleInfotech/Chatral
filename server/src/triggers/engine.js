// Server-side trigger engine.
//  event → matching enabled triggers → TriggerExecution (unique dedupeKey = idempotency)
//  → immediate run, or a durable 'run_trigger' job at now + delay
//  → at run time: re-load trigger (cancel if disabled/edited), frequency limits, loop guard,
//    re-evaluate ALL/ANY conditions against fresh state, then run each action and log the result.
import { DateTime } from 'luxon';
import { prisma, clock } from '../config.js';
import { FIELD_MAP, ACTIONS, isWait, normalizeCondition } from './catalog.js';
import { browserOf, platformOf, searchOf, hostnameOf, countryNameOf } from './visitorInfo.js';
import { events } from '../services/events.js';
import { enqueue, registerJob, cancelJobs } from '../services/jobs.js';
import { sendStaffMessage, updateConversation, findResumable } from '../services/conversations.js';
import { getPublishedConfig, isWithinBusinessHours } from '../services/stores.js';
import { toAgents, toVisitor, visitorOnline, onlineAgentIds } from '../realtime.js';
import { queueEmail, recipientsFor, queueWebhook } from '../services/notify.js';

const MAX_DEPTH = 3;
const LOOP_WINDOW_MS = 60_000;
const LOOP_MAX = 10; // successful executions per conversation/visitor per minute, across all triggers
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
/** '/collections/rings' for 'https://shop.com/collections/rings/?x=1'; '/' for the home page; '' when unknown. */
export function pathOf(url) {
  try { const p = new URL(url).pathname.replace(/\/+$/, ''); return p || '/'; } catch { return ''; }
}

// ---------- Context + conditions ----------

export async function buildContext({ storeId, visitorId, conversationId, text, needHostname = false }) {
  const now = clock.now();
  let conv = conversationId ? await prisma.conversation.findFirst({ where: { id: conversationId, storeId } }) : null;
  if (!conv && visitorId) {
    conv = await findResumable(storeId, visitorId);
  }
  const [store, visitor] = await Promise.all([
    prisma.store.findUnique({ where: { id: storeId } }),
    visitorId ? prisma.visitor.findFirst({ where: { id: visitorId, storeId } }) : null,
  ]);
  const counts = conv
    ? await prisma.message.groupBy({ by: ['senderType'], where: { conversationId: conv.id }, _count: true })
    : [];
  const count = (t) => counts.find((c) => c.senderType === t)?._count || 0;
  const cfg = store ? await getPublishedConfig(store) : null;
  const online = await onlineAgentIds(storeId);
  const lastVisitor = conv?.lastVisitorMessageAt?.getTime() || 0;
  const lastAgent = conv?.lastAgentMessageAt?.getTime() || 0;
  // Clock-based conditions follow the store's business-hours timezone (falls back to the store timezone).
  const local = DateTime.fromJSDate(now, { zone: cfg?.businessHours?.timezone || store?.timezone || 'UTC' });
  // Counts only conversations still kept by retention.
  const previousChats = visitor ? await prisma.conversation.count({ where: { storeId, visitorId: visitor.id, ...(conv ? { id: { not: conv.id } } : {}) } }) : 0;
  // Last two page views: when the current page was opened (time on page) and the page before it.
  const pages = visitor ? await prisma.visitorPageView.findMany({ where: { visitorId: visitor.id }, orderBy: { createdAt: 'desc' }, take: 2, select: { url: true, createdAt: true } }) : [];
  const search = searchOf(visitor?.referrer);
  const hoursOpen = cfg ? isWithinBusinessHours(cfg.businessHours, now) : true;
  return {
    store, visitor, conv, cfg,
    values: {
      'time.hourOfDay': local.hour,
      'time.dayOfWeek': DAY_KEYS[local.weekday - 1],
      'visitor.name': visitor?.name || '',
      'visitor.previousChats': previousChats,
      'visitor.timeOnSite': visitor ? Math.floor((now - visitor.sessionStartedAt) / 1000) : 0,
      'visitor.pageViews': visitor?.sessionPageViews || 0,
      'visitor.visits': visitor?.visits || 0,
      'visitor.isReturning': (visitor?.visits || 0) > 1,
      'visitor.hasEmail': !!visitor?.email,
      'visitor.online': visitor ? visitorOnline(visitor.id) : false,
      'visitor.status': visitor && visitorOnline(visitor.id) ? 'Online' : 'Offline',
      'visitor.device': visitor?.device || 'desktop',
      'visitor.ip': visitor?.ip || '',
      'visitor.hostname': needHostname ? await hostnameOf(visitor?.ip) : '',
      'visitor.city': visitor?.city || '',
      'visitor.country': countryNameOf(visitor?.country),
      'visitor.searchEngine': search.engine,
      'visitor.searchTerms': search.terms,
      'visitor.userAgent': visitor?.userAgent || '',
      'visitor.browser': browserOf(visitor?.userAgent || ''),
      'visitor.platform': platformOf(visitor?.userAgent || ''),
      'page.timeOnPage': pages[0] ? Math.max(0, Math.floor((now - pages[0].createdAt) / 1000)) : 0,
      'page.previous': pages[1]?.url || '',
      'widget.status': hoursOpen ? 'Online' : 'Offline',
      'chat.served': count('AGENT') > 0,
      'page.url': visitor?.currentUrl || '',
      'page.path': pathOf(visitor?.currentUrl),
      'page.title': visitor?.currentTitle || '',
      'page.referrer': visitor?.referrer || '',
      'chat.exists': !!conv,
      'chat.status': conv?.status || '',
      'chat.priority': conv?.priority || '',
      'chat.assigned': !!conv?.assigneeId,
      'chat.tags': conv?.tags || [],
      'chat.messageCount': count('VISITOR') + count('AGENT') + count('BOT'),
      'chat.visitorMessageCount': count('VISITOR'),
      'chat.agentMessageCount': count('AGENT'),
      'chat.awaitingAgentReply': !!conv && lastVisitor > lastAgent,
      'chat.awaitingVisitorReply': !!conv && lastAgent > lastVisitor,
      'message.text': text || '',
      'agents.available': online.length > 0,
      'agents.status': online.length > 0 ? 'Online' : 'Offline',
      'agents.onlineCount': online.length,
      'businessHours.open': hoursOpen,
    },
  };
}

export function evalCondition(c, values) {
  c = normalizeCondition(c);
  const f = FIELD_MAP[c.field];
  if (!f) return false;
  const actual = values[c.field];
  const lc = (v) => String(v ?? '').toLowerCase();
  switch (c.op) {
    case 'is_true': return actual === true;
    case 'is_false': return actual === false;
    case 'eq': return f.type === 'number' ? actual === c.value : lc(actual) === lc(c.value);
    case 'neq': return f.type === 'number' ? actual !== c.value : lc(actual) !== lc(c.value);
    case 'gt': return actual > c.value;
    case 'gte': return actual >= c.value;
    case 'lt': return actual < c.value;
    case 'lte': return actual <= c.value;
    case 'contains': return f.type === 'tags' ? (Array.isArray(actual) ? actual : []).map(lc).includes(lc(c.value)) : lc(actual).includes(lc(c.value));
    case 'not_contains': return f.type === 'tags' ? !(Array.isArray(actual) ? actual : []).map(lc).includes(lc(c.value)) : !lc(actual).includes(lc(c.value));
    case 'starts_with': return lc(actual).startsWith(lc(c.value));
    case 'ends_with': return lc(actual).endsWith(lc(c.value));
    default: return false;
  }
}

/** Evaluates `conds` (default: all of the trigger's conditions); wait steps are not checks and are skipped. */
export function conditionsMatch(trigger, values, conds = trigger.conditions || []) {
  conds = conds.filter((c) => !isWait(c));
  if (!conds.length) return { ok: true, results: [] };
  const results = conds.map((c) => ({ field: c.field, op: c.op, value: c.value, actual: values[c.field], pass: evalCondition(c, values) }));
  const ok = trigger.match === 'ANY' ? results.some((r) => r.pass) : results.every((r) => r.pass);
  return { ok, results };
}

// ---------- Frequency + loop guard ----------

async function frequencyBlocked(trigger, { visitor, conv }, excludeId, statuses = ['SUCCEEDED']) {
  const base = { triggerId: trigger.id, status: { in: statuses }, ...(excludeId ? { id: { not: excludeId } } : {}) };
  switch (trigger.frequency) {
    case 'ONCE_PER_VISITOR':
      return visitor && (await prisma.triggerExecution.count({ where: { ...base, visitorId: visitor.id } })) > 0 ? 'Already ran for this visitor' : null;
    case 'ONCE_PER_SESSION':
      return visitor && (await prisma.triggerExecution.count({ where: { ...base, visitorId: visitor.id, createdAt: { gte: visitor.sessionStartedAt } } })) > 0 ? 'Already ran this session' : null;
    case 'ONCE_PER_CONVERSATION': {
      const where = conv ? { ...base, conversationId: conv.id } : visitor ? { ...base, visitorId: visitor.id, createdAt: { gte: visitor.sessionStartedAt } } : null;
      return where && (await prisma.triggerExecution.count({ where })) > 0 ? 'Already ran for this conversation' : null;
    }
    case 'EVERY_TIME': {
      if (!trigger.cooldownSeconds || !visitor) return null;
      const since = new Date(clock.now().getTime() - trigger.cooldownSeconds * 1000);
      const n = await prisma.triggerExecution.count({
        where: {
          ...base,
          visitorId: visitor.id,
          OR: [
            { executedAt: { gte: since } },
            { status: { in: ['SCHEDULED', 'RUNNING'] }, createdAt: { gte: since } },
          ],
        },
      });
      return n > 0 ? `Cooldown (${trigger.cooldownSeconds}s) active` : null;
    }
    default: return null;
  }
}

async function loopGuard({ visitor, conv }) {
  const since = new Date(clock.now().getTime() - LOOP_WINDOW_MS);
  const where = conv ? { conversationId: conv.id } : visitor ? { visitorId: visitor.id } : null;
  if (!where) return null;
  const n = await prisma.triggerExecution.count({ where: { ...where, status: 'SUCCEEDED', executedAt: { gte: since } } });
  return n >= LOOP_MAX ? `Loop guard: ${n} automated actions in the last minute` : null;
}

// ---------- Dispatch ----------

/** Called for every chat event. Never throws into the caller. */
export async function dispatch(evt) {
  const { storeId, event, visitorId = null, conversationId = null, sourceId, depth = 0 } = evt;
  const triggers = await prisma.trigger.findMany({ where: { storeId, event, enabled: true } });
  if (!triggers.length) return [];
  const created = [];
  for (const t of triggers) {
    const dedupeKey = `${t.id}:v${t.version}:${event}:${sourceId}`;
    const now = clock.now();
    if (depth > MAX_DEPTH) {
      await logOnce({ storeId, triggerId: t.id, triggerVersion: t.version, visitorId, conversationId, event, status: 'SKIPPED', reason: `Loop prevention: event depth ${depth} > ${MAX_DEPTH}`, dedupeKey, depth, scheduledFor: now, executedAt: now });
      continue;
    }
    // Cheap pre-check so e.g. many page views don't each schedule a delayed welcome message.
    const visitor = visitorId ? await prisma.visitor.findUnique({ where: { id: visitorId } }) : null;
    const conv = conversationId ? await prisma.conversation.findUnique({ where: { id: conversationId } }) : (visitorId ? await findResumable(storeId, visitorId) : null);
    if (t.timerFrom && t.timerFrom !== 'EVENT' && conv) {
      const pending = await prisma.triggerExecution.count({ where: { triggerId: t.id, conversationId: conv.id, status: { in: ['SCHEDULED', 'RUNNING'] } } });
      if (pending) continue; // the pending run re-reads the last message time when it wakes, so it already covers this event
    }
    if (t.delaySeconds > 0) {
      if (t.frequency !== 'EVERY_TIME' && (await frequencyBlocked(t, { visitor, conv }, null, ['SUCCEEDED', 'SCHEDULED', 'RUNNING']))) continue;
      if (t.frequency === 'EVERY_TIME' && (await frequencyBlocked(t, { visitor, conv }, null, ['SCHEDULED', 'RUNNING']))) continue;
    }

    const exec = await logOnce({
      storeId, triggerId: t.id, triggerVersion: t.version, visitorId, conversationId, event, status: 'SCHEDULED', dedupeKey, depth,
      scheduledFor: new Date(now.getTime() + t.delaySeconds * 1000), details: { text: evt.text ? String(evt.text).slice(0, 500) : undefined },
    });
    if (!exec) continue; // duplicate event → already handled (idempotent)
    created.push(exec);
    if (t.delaySeconds > 0) {
      await enqueue('run_trigger', { executionId: exec.id, conversationId: conv?.id || conversationId }, { storeId, runAt: exec.scheduledFor, dedupeKey: `exec:${exec.id}` });
    } else {
      await execute(exec.id);
    }
  }
  return created;
}

async function logOnce(data) {
  try {
    return await prisma.triggerExecution.create({ data: { createdAt: clock.now(), ...data } });
  } catch (e) {
    if (e.code === 'P2002') return null;
    throw e;
  }
}

const finish = (id, status, reason, details) =>
  prisma.triggerExecution.update({ where: { id }, data: { status, reason, executedAt: clock.now(), ...(details ? { details } : {}) } });

/** When a message-based timer is due: last customer (or customer/agent) message + Delay. Bot/system messages don't count. */
export function timerDue(trigger, conv, exec) {
  const v = conv.lastVisitorMessageAt?.getTime() || 0;
  const a = conv.lastAgentMessageAt?.getTime() || 0;
  const last = trigger.timerFrom === 'LAST_MESSAGE' ? Math.max(v, a) : v;
  return (last || exec.createdAt.getTime()) + trigger.delaySeconds * 1000;
}

/** Runs a scheduled execution exactly once (atomic SCHEDULED → RUNNING claim). */
export async function execute(executionId) {
  const claimed = await prisma.triggerExecution.updateMany({ where: { id: executionId, status: 'SCHEDULED' }, data: { status: 'RUNNING' } });
  if (!claimed.count) return null;
  const exec = await prisma.triggerExecution.findUnique({ where: { id: executionId } });
  const trigger = await prisma.trigger.findUnique({ where: { id: exec.triggerId } });
  if (!trigger || !trigger.enabled) return finish(exec.id, 'CANCELLED', 'Trigger disabled or deleted before it ran');
  if (trigger.version !== exec.triggerVersion) return finish(exec.id, 'CANCELLED', 'Trigger was edited before it ran');

  const ctx = await buildContext({ storeId: exec.storeId, visitorId: exec.visitorId, conversationId: exec.conversationId, text: exec.details?.text, needHostname: (trigger?.conditions || []).some((c) => c.field === 'visitor.hostname') });
  if (exec.conversationId && !ctx.conv) return finish(exec.id, 'CANCELLED', 'Conversation no longer exists');
  if (!exec.conversationId && ctx.conv) {
    await prisma.triggerExecution.update({ where: { id: exec.id }, data: { conversationId: ctx.conv.id } }).catch(() => {});
    exec.conversationId = ctx.conv.id;
  }
  // Message-based timer ("Timer starts from" = last customer / last message): the Delay counts from the latest
  // relevant message, re-read now. If a newer message moved the deadline, park this same execution until then.
  if ((trigger.timerFrom || 'EVENT') !== 'EVENT' && !(exec.details?.step > 0)) {
    if (!ctx.conv) return finish(exec.id, 'CANCELLED', 'No conversation for a message-based timer');
    if (ctx.conv.status === 'RESOLVED' || ctx.conv.folder !== 'INBOX') return finish(exec.id, 'SKIPPED', 'Conversation is closed');
    const due = timerDue(trigger, ctx.conv, exec);
    if (due > clock.now().getTime() + 500) {
      const runAt = new Date(due);
      await prisma.triggerExecution.update({ where: { id: exec.id }, data: { status: 'SCHEDULED', scheduledFor: runAt, details: { ...(exec.details || {}), timerResets: (exec.details?.timerResets || 0) + 1 } } });
      await enqueue('run_trigger', { executionId: exec.id, conversationId: ctx.conv.id }, { storeId: exec.storeId, runAt, dedupeKey: `exec:${exec.id}:t${due}` });
      return { rescheduled: true, until: runAt };
    }
  }
  const freq = await frequencyBlocked(trigger, ctx, exec.id, ['SUCCEEDED']);
  if (freq) return finish(exec.id, 'SKIPPED', freq);
  const loop = await loopGuard(ctx);
  if (loop) return finish(exec.id, 'SKIPPED', loop);
  // Wait steps split the conditions into segments. Each run checks one segment; if a wait follows,
  // the execution is parked as a durable job and resumes at the next segment (fresh state each time).
  const conds = trigger.conditions || [];
  const step = exec.details?.step || 0;
  // "Still on page": the visitor must still be on the page they were on when the wait started.
  if (step > 0 && exec.details?.waitPageUrl && (ctx.visitor?.currentUrl || '') !== exec.details.waitPageUrl) {
    return finish(exec.id, 'SKIPPED', 'Visitor left the page during "Still on page"', exec.details);
  }
  const waitAt = conds.findIndex((c, i) => i >= step && isWait(c));
  const cond = conditionsMatch(trigger, ctx.values, conds.slice(step, waitAt === -1 ? conds.length : waitAt));
  const checked = [...(exec.details?.conditions || []), ...cond.results];
  if (!cond.ok) {
    const delayed = exec.scheduledFor > exec.createdAt || step > 0;
    return finish(exec.id, 'SKIPPED', delayed ? 'Conditions no longer match after delay' : 'Conditions do not match', { ...exec.details, conditions: checked });
  }
  if (waitAt !== -1) {
    const runAt = new Date(clock.now().getTime() + conds[waitAt].value * 1000);
    await prisma.triggerExecution.update({ where: { id: exec.id }, data: { status: 'SCHEDULED', scheduledFor: runAt, details: { ...exec.details, step: waitAt + 1, conditions: checked, waitPageUrl: conds[waitAt].field === 'wait_page' ? (ctx.visitor?.currentUrl || '') : undefined } } });
    await enqueue('run_trigger', { executionId: exec.id, conversationId: exec.conversationId }, { storeId: exec.storeId, runAt, dedupeKey: `exec:${exec.id}:${waitAt + 1}` });
    return { waiting: true, until: runAt };
  }

  const results = [];
  for (const action of trigger.actions) {
    try {
      results.push({ type: action.type, ...(await runAction(action, trigger, ctx, exec)) });
    } catch (e) {
      results.push({ type: action.type, status: 'failed', error: String(e.message).slice(0, 300) });
    }
  }
  const ran = results.filter((r) => r.status === 'done').length;
  const failed = results.filter((r) => r.status === 'failed').length;
  const status = failed ? 'FAILED' : ran ? 'SUCCEEDED' : 'SKIPPED';
  const reason = failed ? `${failed} action(s) failed` : ran ? null : 'No action could run: ' + results.map((r) => r.reason).filter(Boolean).join('; ');
  // Re-read: actions (proactive delivery) may have added to details meanwhile.
  const fresh = await prisma.triggerExecution.findUnique({ where: { id: exec.id }, select: { details: true } });
  return finish(exec.id, status, reason, { ...fresh.details, conditions: checked, actions: results });
}

// ---------- Actions ----------

const render = (text, ctx) => String(text).replace(/\{\{\s*visitor\.name\s*\}\}/g, ctx.visitor?.name || 'there').replace(/\{\{\s*store\.name\s*\}\}/g, ctx.store?.name || '');

function senderOf(action, ctx) {
  return { senderName: action.agentName || ctx.cfg?.agentName || 'Support', senderAvatar: action.avatarUrl || ctx.cfg?.avatarUrl || null };
}

/** Visible bot message: persisted into the conversation, or (no chat yet) pushed as a proactive message. */
async function deliverBot(ctx, trigger, exec, body, meta) {
  const sender = senderOf(meta.__action, ctx);
  delete meta.__action;
  if (ctx.conv) {
    // Never post the same automated text twice in a row (e.g. a trigger repeating the widget's please-wait message).
    const last = await prisma.message.findFirst({ where: { conversationId: ctx.conv.id, senderType: { not: 'NOTE' } }, orderBy: { seq: 'desc' }, select: { senderType: true, body: true } });
    if (last?.senderType === 'BOT' && (last.body || '').trim() === (body || '').trim()) return { status: 'skipped', reason: 'The same message was just sent' };
    const { message } = await sendStaffMessage(ctx.store.id, ctx.conv.id, { senderType: 'BOT', ...sender, body, meta, triggerId: trigger.id });
    return { status: 'done', messageId: message.id };
  }
  if (!ctx.visitor || !visitorOnline(ctx.visitor.id)) return { status: 'skipped', reason: 'Visitor not connected and has no conversation' };
  const proactive = { executionId: exec.id, triggerId: trigger.id, body, meta, ...sender };
  await prisma.triggerExecution.update({ where: { id: exec.id }, data: { details: { ...(exec.details || {}), proactive } } });
  toVisitor(ctx.visitor.id, 'proactive', proactive);
  return { status: 'done', proactive: true };
}

async function runAction(action, trigger, ctx, exec) {
  if (!ACTIONS.some((a) => a.key === action.type)) return { status: 'failed', error: 'Unsupported action type' };
  const needsConv = ACTIONS.find((a) => a.key === action.type).needsConversation;
  if (needsConv && !ctx.conv) return { status: 'skipped', reason: 'Requires a conversation' };
  const storeId = ctx.store.id;

  switch (action.type) {
    case 'send_message':
      return deliverBot(ctx, trigger, exec, render(action.text, ctx), { suggestedReplies: action.suggestedReplies || [], __action: action });
    case 'send_saved_reply': {
      const reply = await prisma.savedReply.findFirst({ where: { id: action.savedReplyId, storeId, access: 'PUBLIC' } });
      if (!reply) return { status: 'failed', error: 'Saved reply not found in this store' };
      return deliverBot(ctx, trigger, exec, render(reply.body, ctx), { savedReplyId: reply.id, __action: action });
    }
    case 'show_contact_form':
      return deliverBot(ctx, trigger, exec, render(action.text, ctx), { form: { fields: action.fields }, __action: action });
    case 'assign': {
      let agentId = action.agentId;
      if (action.mode === 'auto') {
        agentId = await pickAgent(storeId);
        if (!agentId) return { status: 'skipped', reason: 'No online agent with free capacity' };
      } else {
        const m = await prisma.storeMember.findUnique({ where: { userId_storeId: { userId: agentId, storeId } } });
        if (!m) return { status: 'failed', error: 'Agent is not a member of this store' };
      }
      if (ctx.conv.assigneeId === agentId) return { status: 'skipped', reason: 'Already assigned to that agent' };
      await updateConversation(storeId, ctx.conv.id, { assigneeId: agentId }, { trigger: trigger.id });
      await prisma.storeMember.update({ where: { userId_storeId: { userId: agentId, storeId } }, data: { lastAssignedAt: clock.now() } });
      return { status: 'done', agentId };
    }
    case 'add_tags': {
      const tags = [...new Set([...ctx.conv.tags, ...action.tags.map((t) => t.toLowerCase())])];
      await updateConversation(storeId, ctx.conv.id, { tags });
      return { status: 'done', tags };
    }
    case 'set_priority':
      await updateConversation(storeId, ctx.conv.id, { priority: action.priority });
      return { status: 'done' };
    case 'notify': {
      const members = await recipientsFor(storeId, action.target, ctx.conv);
      if (!members.length) return { status: 'skipped', reason: 'No recipients for this target' };
      const out = { status: 'done', recipients: members.length };
      if (action.channels.includes('dashboard')) {
        toAgents(storeId, 'notification', { kind: 'trigger', triggerId: trigger.id, conversationId: ctx.conv?.id, text: render(action.text, ctx), userIds: members.map((m) => m.userId) });
        out.dashboard = true;
      }
      if (action.channels.includes('email')) {
        out.email = await queueEmail(ctx.store, members.map((m) => m.user.email), `[${ctx.store.name}] ${trigger.name}`, `${render(action.text, ctx)}\n\nConversation: ${ctx.conv?.id || '-'}\nVisitor page: ${ctx.visitor?.currentUrl || '-'}`);
        if (!out.email) out.emailNote = 'SMTP not configured - email not sent';
      }
      if (!out.dashboard && !out.email) return { status: 'skipped', reason: out.emailNote };
      return out;
    }
    case 'webhook': {
      const hook = await prisma.webhook.findFirst({ where: { id: action.webhookId, storeId, enabled: true } });
      if (!hook) return { status: 'failed', error: 'Webhook not found, disabled, or not approved for this store' };
      await queueWebhook(hook, 'trigger.fired', { triggerId: trigger.id, triggerName: trigger.name, event: exec.event, conversationId: ctx.conv?.id || null, visitorId: ctx.visitor?.id || null });
      return { status: 'done', queued: true };
    }
    default:
      return { status: 'failed', error: 'Unsupported action type' };
  }
}

/** Least-loaded online agent under their maxChats; ties → least recently assigned. */
export async function pickAgent(storeId) {
  const online = await onlineAgentIds(storeId);
  if (!online.length) return null;
  const members = await prisma.storeMember.findMany({ where: { storeId, userId: { in: online } } });
  const loads = await prisma.conversation.groupBy({ by: ['assigneeId'], where: { storeId, assigneeId: { in: online }, status: { not: 'RESOLVED' } }, _count: true });
  const load = (id) => loads.find((l) => l.assigneeId === id)?._count || 0;
  const free = members.filter((m) => load(m.userId) < m.maxChats);
  free.sort((a, b) => load(a.userId) - load(b.userId) || (a.lastAssignedAt?.getTime() || 0) - (b.lastAssignedAt?.getTime() || 0));
  return free[0]?.userId || null;
}

/** Cancel everything pending for a trigger (on disable / edit / delete). */
export async function cancelPendingForTrigger(triggerId, reason) {
  const pending = await prisma.triggerExecution.findMany({ where: { triggerId, status: 'SCHEDULED' }, select: { id: true } });
  if (!pending.length) return 0;
  await prisma.triggerExecution.updateMany({ where: { id: { in: pending.map((p) => p.id) }, status: 'SCHEDULED' }, data: { status: 'CANCELLED', reason, executedAt: clock.now() } });
  // Match by execution id in the payload: covers the initial delay job and any wait-step jobs.
  await cancelJobs({ type: 'run_trigger', OR: pending.map((p) => ({ payload: { path: ['executionId'], equals: p.id } })) });
  return pending.length;
}

registerJob('run_trigger', async ({ executionId }) => { await execute(executionId); });
events.on('trigger', (evt) => dispatch(evt));
