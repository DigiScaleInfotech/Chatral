import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, App, Avatar, Badge, Button, Checkbox, Descriptions, Drawer, Dropdown, Empty, Flex, Input, List,
  Popover, Segmented, Select, Space, Spin, Table, Tag, Tooltip, Typography,
} from 'antd';
import {
  PaperClipOutlined, SendOutlined, SearchOutlined, UserOutlined, MobileOutlined,
  DesktopOutlined, ArrowLeftOutlined, FileOutlined, InfoCircleOutlined,
  CheckOutlined, CheckCircleOutlined, ClockCircleOutlined, GlobalOutlined,
  CopyOutlined, ReloadOutlined, UnorderedListOutlined, TableOutlined, MailOutlined, MoreOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { api, showError, uid, STATUS_COLOR, RANK } from '../api.js';
import { onSocket, sendSocket } from '../socket.js';
import TicketForm from '../components/TicketForm.jsx';
import TagEditor from '../components/TagEditor.jsx';
import ShopifyPanel from '../components/ShopifyPanel.jsx';
import { printTranscript } from '../printTranscript.js';
import { useApp } from '../main.jsx';
import { Linkified } from '../../widget/ChatWindow.jsx';

dayjs.extend(relativeTime);

const siteOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; } };

/** Messages and page views in time order; pending (unsent) messages stay at the end. */
export function withPages(messages, pages = []) {
  if (!pages?.length) return messages;
  const items = [...messages, ...pages.map((p) => ({ ...p, pageView: true }))];
  return items
    .map((x, i) => ({ x, i, t: x.createdAt ? new Date(x.createdAt).getTime() : Infinity }))
    .sort((a, b) => a.t - b.t || a.i - b.i)
    .map((e) => e.x);
}

/** "Visitor navigated to <page title> - site" (agents only; never sent to the visitor). */
function PageViewRow({ page }) {
  const site = siteOf(page.url);
  const title = page.title || page.url;
  return (
    <div className="msg-pageview">
      <span aria-hidden="true">↪</span>
      <span>
        Visitor navigated to{' '}
        <a href={page.url} target="_blank" rel="noopener noreferrer" title={page.url}>{title}</a>
        {site && !title.toLowerCase().includes(site.split('.')[0]) ? <span className="site"> – {site}</span> : null}
      </span>
      <span className="time">{dayjs(page.createdAt).format('HH:mm')}</span>
    </div>
  );
}

/**
 * Assignee dropdown options. The current assignee is always an option with a readable name, so the
 * select never falls back to showing a raw user id (e.g. before members load, or a removed member).
 */
export function assigneeOptions({ conv, members = [], me, supervisor, assignee }) {
  const opts = [{ value: '', label: 'Unassigned' }];
  if (supervisor) opts.push(...members.map((m) => ({ value: m.userId, label: m.name })));
  else opts.push({ value: me.id, label: me.name });
  const id = conv.assigneeId;
  if (id && !opts.some((o) => o.value === id)) {
    const name = members.find((m) => m.userId === id)?.name || (assignee?.id === id ? assignee.name : null) || (id === me.id ? me.name : null);
    opts.push({ value: id, label: name ? (supervisor ? `${name} (not a member)` : name) : 'Unknown agent', disabled: true });
  }
  return opts;
}

/** Staff transcript download (internal notes included); the login token goes in a header, never the URL. */
export async function downloadStaffTranscript(storeId, convId) {
  const res = await fetch(`/api/stores/${encodeURIComponent(storeId)}/conversations/${encodeURIComponent(convId)}/transcript`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });
  if (!res.ok) throw new Error('Could not download the transcript.');
  const blob = await res.blob();
  const name = (res.headers.get('content-disposition') || '').match(/filename="([^"]+)"/)?.[1] || 'chat-transcript.txt';
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 10_000);
}

function AuthFile({ storeId, id }) {
  const [state, setState] = useState(null);
  useEffect(() => {
    let url;
    fetch(`/api/stores/${encodeURIComponent(storeId)}/files/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const b = await r.blob();
        url = URL.createObjectURL(b);
        setState({
          url,
          type: b.type,
          name: (r.headers.get('content-disposition') || '').match(/filename="([^"]+)"/)?.[1] || 'file',
        });
      })
      .catch(() => setState({ error: true }));
    return () => url && URL.revokeObjectURL(url);
  }, [storeId, id]);

  if (!state) return <Spin size="small" />;
  if (state.error) return <span style={{ color: '#ef4444', fontSize: 12 }}>File unavailable</span>;
  return state.type.startsWith('image/') ? (
    <a href={state.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: 4 }}>
      <img
        src={state.url}
        alt={state.name}
        style={{ maxWidth: 280, maxHeight: 240, borderRadius: 8, display: 'block', border: '1px solid rgba(0,0,0,0.1)' }}
      />
    </a>
  ) : (
    <a
      href={state.url}
      download={state.name}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        background: 'rgba(0,0,0,0.04)',
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 500,
        textDecoration: 'none',
        color: 'inherit',
        marginTop: 4,
      }}
    >
      <FileOutlined /> {state.name}
    </a>
  );
}

const merge = (list, m) => {
  const i = list.findIndex((x) => x.id === m.id || (m.clientMsgId && x.clientMsgId === m.clientMsgId));
  const out = i >= 0 ? list.map((x, j) => (j === i ? { ...x, ...m } : x)) : [...list, m];
  return out.sort((a, b) => (a.seq ?? Infinity) - (b.seq ?? Infinity));
};

function SidePanelContent({ detail, conv, supervisor, members, me, memberName, patch }) {
  const { message } = App.useApp();
  const copyVisitorId = () => {
    navigator.clipboard.writeText(detail.visitor.id);
    message.success('Visitor ID copied');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Conversation Controls */}
      <div>
        <div className="inbox-side-section-title">Conversation Controls</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
          <div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 500 }}>Status</div>
            <Select
              value={conv.status}
              onChange={(v) => patch({ status: v })}
              style={{ width: '100%' }}
              options={[
                { value: 'OPEN', label: <Tag color="green" bordered={false} style={{ margin: 0 }}>Open</Tag> },
                { value: 'PENDING', label: <Tag color="gold" bordered={false} style={{ margin: 0 }}>Pending</Tag> },
                { value: 'RESOLVED', label: <Tag color="default" bordered={false} style={{ margin: 0 }}>Resolved</Tag> },
              ]}
              aria-label="Status"
            />
          </div>

          <div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 500 }}>Assignee</div>
            <Select
              value={conv.assigneeId || ''}
              onChange={(v) => patch({ assigneeId: v || null })}
              style={{ width: '100%' }}
              aria-label="Assignee"
              options={assigneeOptions({ conv, members, me, supervisor, assignee: detail.assignee })}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 500 }}>Tags</div>
            <TagEditor value={conv.tags} onChange={(tags) => patch({ tags })} />
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #e2e8f0' }} />

      {/* Shopify customer + last order */}
      <div>
        <div className="inbox-side-section-title">Shopify</div>
        <ShopifyPanel conversationId={conv.id} visitorEmail={detail.visitor.email} />
      </div>

      <div style={{ borderTop: '1px solid #e2e8f0' }} />

      {/* Pre-chat answers (custom fields) */}
      {Object.keys(detail.visitor.attributes || {}).length > 0 && (
        <div>
          <div className="inbox-side-section-title">Pre-chat answers</div>
          <Descriptions
            size="small"
            column={1}
            style={{ marginTop: 10 }}
            items={Object.entries(detail.visitor.attributes).map(([k, a]) => ({
              key: k,
              label: a.label || k,
              children: <span style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{Array.isArray(a.value) ? a.value.join(', ') : String(a.value)}</span>,
            }))}
          />
        </div>
      )}

      {/* Visitor Attributes */}
      <div>
        <div className="inbox-side-section-title">Visitor Attributes</div>
        <Descriptions
          size="small"
          column={1}
          style={{ marginTop: 10 }}
          items={[
            { label: 'Name', children: detail.visitor.name || <span style={{ color: '#94a3b8' }}>Anonymous</span> },
            {
              label: 'Email',
              children: detail.visitor.email ? (
                <a href={`mailto:${detail.visitor.email}`} style={{ color: '#2563eb' }}>
                  {detail.visitor.email}
                </a>
              ) : (
                <span style={{ color: '#94a3b8' }}>Not provided</span>
              ),
            },
            {
              label: 'Device',
              children:
                detail.visitor.device === 'mobile' ? (
                  <Flex align="center" gap={4}>
                    <MobileOutlined /> Mobile
                  </Flex>
                ) : (
                  <Flex align="center" gap={4}>
                    <DesktopOutlined /> Desktop
                  </Flex>
                ),
            },
            {
              label: 'Current Page',
              children: detail.visitor.currentUrl ? (
                <Typography.Link
                  href={detail.visitor.currentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  ellipsis
                  style={{ maxWidth: 160 }}
                >
                  <GlobalOutlined style={{ marginRight: 4 }} />
                  {detail.visitor.currentTitle || detail.visitor.currentUrl}
                </Typography.Link>
              ) : (
                '-'
              ),
            },
            { label: 'Total Visits', children: detail.visitor.visits },
            { label: 'First Seen', children: dayjs(detail.visitor.firstSeenAt).format('MMM D, YYYY') },
            { label: 'Past Chats', children: detail.visitor.conversations },
            {
              label: 'Visitor ID',
              children: (
                <Flex align="center" gap={4}>
                  <Typography.Text style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b' }}>
                    {detail.visitor.id.slice(0, 12)}...
                  </Typography.Text>
                  <Tooltip title="Copy visitor ID">
                    <Button type="text" size="small" icon={<CopyOutlined />} onClick={copyVisitorId} style={{ padding: 2 }} />
                  </Tooltip>
                </Flex>
              ),
            },
          ]}
        />
      </div>

      <div style={{ borderTop: '1px solid #e2e8f0' }} />

      {/* Retention Policy Note */}
      <div
        style={{
          padding: '10px 12px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 6,
          fontSize: 12,
          color: '#64748b',
          lineHeight: 1.4,
        }}
      >
        <Flex gap={6} align="start">
          <ClockCircleOutlined style={{ marginTop: 2, color: '#94a3b8' }} />
          <span>
            Conversation retained until <b>{dayjs(conv.expiresAt).format('MMM D, YYYY')}</b> under rolling 30-day retention.
          </span>
        </Flex>
      </div>
    </div>
  );
}

export default function Inbox() {
  const { me, storeId, role, can, setUnread } = useApp();
  const { message, modal } = App.useApp();
  const [status, setStatus] = useState('OPEN');
  const [folder, setFolder] = useState('INBOX'); // INBOX | TRASH | SPAM
  const [folderCounts, setFolderCounts] = useState({});
  const [selected, setSelected] = useState([]);
  const [assignee, setAssignee] = useState('any');
  const [q, setQ] = useState('');
  const [tag, setTag] = useState(null);
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(new URLSearchParams(location.search).get('c'));
  // 'list' = list + conversation workspace, 'table' = full-width overview. Remembered per browser.
  const [view, setView] = useState(() => { try { return localStorage.getItem('inboxView') === 'table' ? 'table' : 'list'; } catch { return 'list'; } });
  const changeView = (v) => { setView(v); try { localStorage.setItem('inboxView', v); } catch { /* storage blocked */ } };
  const [detail, setDetail] = useState(null);
  const [members, setMembers] = useState([]);
  const [replies, setReplies] = useState([]);
  const [typing, setTyping] = useState({});
  const [text, setText] = useState('');
  const [isNote, setIsNote] = useState(false);
  const [sending, setSending] = useState(false);
  const [sideDrawer, setSideDrawer] = useState(false);
  const [ticketFrom, setTicketFrom] = useState(null); // { emailReady } while the create-ticket form is open
  const msgsRef = useRef(null);
  const fileRef = useRef(null);
  const activeRef = useRef(activeId);
  const detailRef = useRef(detail);
  const lastTyping = useRef(0);
  activeRef.current = activeId;
  detailRef.current = detail;
  const isMember = me.memberships.some((m) => m.storeId === storeId);
  const supervisor = can('SUPERVISOR');

  const query = useMemo(() => {
    const p = new URLSearchParams({ status, assignee });
    if (folder !== 'INBOX') p.set('folder', folder);
    if (q.trim()) p.set('q', q.trim());
    if (tag) p.set('tag', tag);
    return p.toString();
  }, [status, assignee, q, tag, folder]);

  const loadList = useCallback(
    async (more = false) => {
      setLoading(true);
      try {
        const r = await api(`/stores/${storeId}/conversations?${query}${more && cursor ? `&cursor=${cursor}` : ''}`);
        setItems((cur) => (more ? [...cur, ...r.items] : r.items));
        setCursor(r.nextCursor);
        setCounts(r.counts);
        setFolderCounts(r.folderCounts || {});
        if (!more) setSelected([]);
        setUnread(r.unreadConversations);
      } catch (e) {
        showError(e, { message });
      } finally {
        setLoading(false);
      }
    },
    [storeId, query, cursor],
  );

  const loadListRef = useRef(loadList);
  loadListRef.current = loadList;

  const loadDetail = useCallback(
    async (id, after = 0) => {
      try {
        const r = await api(`/stores/${storeId}/conversations/${id}${after ? `?after=${after}` : ''}`);
        setDetail((d) => (after && d?.conversation.id === id ? { ...r, messages: r.messages.reduce(merge, d.messages) } : r));
        if (r.conversation.unreadForAgent > 0) markRead(id);
      } catch (e) {
        if (e.status === 404) {
          setDetail(null);
          setActiveId(null);
          message.warning('That conversation is no longer available.');
        } else {
          showError(e, { message });
        }
      }
    },
    [storeId],
  );

  const countTimer = useRef(null);
  const refreshCounts = () => {
    clearTimeout(countTimer.current);
    countTimer.current = setTimeout(
      () =>
        api(`/stores/${storeId}/conversations?${query}&limit=1`)
          .then((r) => {
            setCounts(r.counts);
            setUnread(r.unreadConversations);
          })
          .catch(() => {}),
      400,
    );
  };

  const markRead = (id) =>
    api(`/stores/${storeId}/conversations/${id}/read`, { method: 'POST' })
      .then(() => {
        setItems((list) => list.map((c) => (c.id === id ? { ...c, unreadForAgent: 0 } : c)));
      })
      .catch(() => {});

  useEffect(() => {
    const t = setTimeout(() => loadList(), q ? 300 : 0);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    api(`/stores/${storeId}/members`).then(setMembers).catch(() => {});
    api(`/stores/${storeId}/saved-replies`).then(setReplies).catch(() => {});
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {});
  }, [storeId]);

  useEffect(() => {
    if (activeId) loadDetail(activeId);
    else setDetail(null);
    setText('');
  }, [activeId]);

  useEffect(() => {
    const el = msgsRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [detail?.messages?.length, typing[activeId]]);

  // Realtime
  useEffect(
    () =>
      onSocket((type, d) => {
        if (d.storeId && d.storeId !== storeId) return;
        if (type === 'message' || type === 'conversation' || type === 'conversations_deleted' || type === 'conversations_moved') refreshCounts();
        if (type === 'message') {
          const c = d.conversation;
          setItems((list) => {
            const rest = list.filter((x) => x.id !== c.id);
            const matches =
              (c.folder || 'INBOX') === folder &&
              (status === 'ALL' || c.status === status) &&
              (assignee === 'any' || (assignee === 'me' ? c.assigneeId === me.id : assignee === 'unassigned' ? !c.assigneeId : true));
            if (!matches) return rest.length === list.length ? list : rest;
            const unread = activeRef.current === c.id && document.visibilityState === 'visible' ? 0 : c.unreadForAgent;
            return [{ ...(list.find((x) => x.id === c.id) || {}), ...c, unreadForAgent: unread }, ...rest];
          });
          if (activeRef.current === c.id) {
            setDetail((det) => (det ? { ...det, conversation: { ...det.conversation, ...c }, messages: merge(det.messages, d.message) } : det));
            if (d.message.senderType === 'VISITOR') {
              setTyping((t) => ({ ...t, [c.id]: null }));
              if (document.visibilityState === 'visible') markRead(c.id);
            }
          }
        } else if (type === 'conversation') {
          const c = d.conversation;
          const visible = RANK[role] >= RANK.SUPERVISOR || !c.assigneeId || c.assigneeId === me.id;
          setItems((list) => (visible ? list.map((x) => (x.id === c.id ? { ...x, ...c } : x)) : list.filter((x) => x.id !== c.id)));
          if (activeRef.current === c.id) {
            if (!visible) {
              setActiveId(null);
              message.info('This chat was assigned to another agent.');
            } else {
              const reassigned = detailRef.current && detailRef.current.conversation.assigneeId !== c.assigneeId;
              setDetail((det) => (det ? { ...det, conversation: { ...det.conversation, ...c } } : det));
              if (reassigned) loadDetail(c.id); // refresh the assignee's name
            }
          }
        } else if (type === 'conversations_moved') {
          if (d.folder !== folder) setItems((list) => list.filter((x) => !d.ids.includes(x.id)));
          else loadListRef.current();
          if (d.ids.includes(activeRef.current)) setDetail((det) => (det ? { ...det, conversation: { ...det.conversation, folder: d.folder } } : det));
        } else if (type === 'visitor_page' && d.page) {
          setDetail((det) => (det && det.visitor.id === d.visitorId && !(det.pages || []).some((p) => p.id === d.page.id)
            ? { ...det, pages: [...(det.pages || []), d.page], visitor: { ...det.visitor, currentUrl: d.url, currentTitle: d.title } }
            : det));
        } else if (type === 'visitor_updated') {
          setDetail((det) => (det && det.visitor.id === d.visitorId
            ? { ...det, visitor: { ...det.visitor, name: d.name, email: d.email, ...(d.attributes ? { attributes: d.attributes } : {}) } }
            : det));
          setItems((list) => list.map((x) => (x.visitorId === d.visitorId && x.visitor ? { ...x, visitor: { ...x.visitor, name: d.name, email: d.email } } : x)));
        } else if (type === 'visitor_banned') {
          setDetail((det) => (det && det.visitor.id === d.visitorId ? { ...det, visitor: { ...det.visitor, bannedAt: d.bannedAt, banReason: d.banReason } } : det));
        } else if (type === 'conversations_deleted') {
          setItems((list) => list.filter((x) => !d.ids.includes(x.id)));
          if (d.ids.includes(activeRef.current)) setActiveId(null);
        } else if (type === 'media_expired') {
          if (activeRef.current === d.conversationId) {
            setDetail((det) => (det ? { ...det, messages: merge(det.messages, d.message) } : det));
          }
        } else if (type === 'typing' && d.from === 'visitor') {
          setTyping((t) => ({ ...t, [d.conversationId]: d.typing ? d.preview || '…' : null }));
        } else if (type === 'receipt') {
          if (activeRef.current === d.conversationId) {
            setDetail((det) =>
              det
                ? {
                    ...det,
                    conversation: {
                      ...det.conversation,
                      ...(d.visitorReadSeq ? { visitorReadSeq: d.visitorReadSeq } : {}),
                      ...(d.visitorDeliveredSeq ? { visitorDeliveredSeq: d.visitorDeliveredSeq } : {}),
                    },
                  }
                : det,
            );
          }
        } else if (type === 'reconnected') {
          loadList();
          const det = detailRef.current;
          if (det) loadDetail(det.conversation.id, Math.max(0, ...det.messages.map((m) => m.seq || 0)));
        }
      }),
    [storeId, status, assignee, role, folder],
  );

  async function patch(data) {
    try {
      const c = await api(`/stores/${storeId}/conversations/${activeId}`, { method: 'PATCH', body: data });
      setDetail((d) => ({ ...d, conversation: { ...d.conversation, ...c } }));
      setItems((list) => list.map((x) => (x.id === c.id ? { ...x, ...c } : x)));
    } catch (e) {
      showError(e, { message });
    }
  }

  const FOLDER_LABEL = { INBOX: 'Inbox', TRASH: 'Trash', SPAM: 'Spam' };

  /** Bulk (or single-chat) action; the server skips chats this user can't see. */
  async function bulk(body, ids = selected) {
    try {
      const r = await api(`/stores/${storeId}/conversations/bulk`, { method: 'POST', body: { ids, ...body } });
      const n = r.updated.length;
      const gone = body.action === 'delete';
      message.success(`${n} chat${n === 1 ? '' : 's'} ${gone ? 'deleted' : 'updated'}${r.skipped.length ? ` (${r.skipped.length} not allowed)` : ''}`);
      setSelected([]);
      loadList();
      if (activeId && ids.includes(activeId)) { if (gone) setActiveId(null); else loadDetail(activeId); }
    } catch (e) {
      showError(e, { message });
    }
  }

  const moveTo = (f, ids) => bulk({ action: 'folder', folder: f }, ids);

  async function setBan(banned) {
    const vid = detail.visitor.id;
    try {
      const r = banned
        ? await api(`/stores/${storeId}/visitors/${vid}/ban`, { method: 'POST', body: {} })
        : await api(`/stores/${storeId}/visitors/${vid}/ban`, { method: 'DELETE' });
      setDetail((d) => (d ? { ...d, visitor: { ...d.visitor, bannedAt: r.bannedAt, banReason: r.banReason ?? null } } : d));
      message.success(banned ? 'Visitor banned. They can no longer send messages.' : 'Visitor unbanned.');
    } catch (e) {
      showError(e, { message });
    }
  }

  function deleteForever() {
    const id = activeId;
    modal.confirm({
      title: 'Delete this chat permanently?',
      content: 'All messages and files in it are removed. This cannot be undone.',
      okText: 'Delete permanently',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await api(`/stores/${storeId}/conversations/${id}`, { method: 'DELETE' });
          setItems((list) => list.filter((x) => x.id !== id));
          setActiveId(null);
        } catch (e) {
          showError(e, { message });
        }
      },
    });
  }

  async function send(body, extra = {}) {
    const clientMsgId = uid();
    const note = isNote;
    const optimistic = {
      clientMsgId,
      body,
      senderType: note ? 'NOTE' : 'AGENT',
      senderName: me.name,
      createdAt: new Date().toISOString(),
      pending: true,
      ...extra,
    };
    setDetail((d) => ({ ...d, messages: merge(d.messages, optimistic) }));
    setSending(true);
    const attempt = async () => {
      const r = await api(`/stores/${storeId}/conversations/${activeId}/messages`, {
        method: 'POST',
        body: { body, clientMsgId, note, ...extra },
      });
      setDetail((d) => (d ? { ...d, messages: merge(d.messages, { ...r.message, pending: false, failed: false }) } : d));
    };
    try {
      await attempt();
    } catch (e) {
      setDetail((d) => (d ? { ...d, messages: merge(d.messages, { clientMsgId, pending: false, failed: true, retry: attempt }) } : d));
      showError(e, { message });
    } finally {
      setSending(false);
    }
  }

  function submit() {
    const t = text.trim();
    if (!t || sending) return;
    setText('');
    send(t);
    sendSocket('typing', { storeId, conversationId: activeId, typing: false });
  }

  async function upload(file) {
    try {
      const att = await api(`/stores/${storeId}/conversations/${activeId}/uploads`, {
        method: 'POST',
        raw: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream', 'X-Filename': encodeURIComponent(file.name) },
      });
      send('', { attachmentId: att.id });
    } catch (e) {
      showError(e, { message });
    }
  }

  const memberName = (id) => members.find((m) => m.userId === id)?.name || (id === me.id ? me.name : 'Unknown');
  const slash = text.startsWith('/') ? text.slice(1).toLowerCase() : null;
  const replyMatches = slash !== null ? replies.filter((r) => r.shortcut.includes(slash) || r.title.toLowerCase().includes(slash)).slice(0, 8) : [];
  const conv = detail?.conversation;
  const lastAgentSeq = detail ? Math.max(0, ...detail.messages.filter((m) => m.senderType === 'AGENT' && m.seq).map((m) => m.seq)) : 0;
  const allTags = [...new Set(items.flatMap((i) => i.tags))];

  const listHeader = (
    <div className="inbox-list-header">
      <Flex align="center" justify="space-between" gap={8} wrap style={{ marginBottom: 10 }}>
        <Flex align="center" gap={8}>
          <Typography.Text strong style={{ fontSize: 14 }}>Conversations</Typography.Text>
          <Segmented
            size="small"
            value={view}
            onChange={changeView}
            aria-label="Inbox layout"
            options={[
              { value: 'list', icon: <UnorderedListOutlined />, title: 'List with conversation' },
              { value: 'table', icon: <TableOutlined />, title: 'Table' },
            ]}
          />
        </Flex>
        {!isMember && <Tag color="blue" bordered={false} style={{ margin: 0 }}>Super Admin</Tag>}
      </Flex>

      <Input
        allowClear
        prefix={<SearchOutlined style={{ color: '#64748b' }} />}
        placeholder="Search name, email or message"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search conversations"
      />

      <Segmented
        block
        size="small"
        value={folder}
        onChange={(f) => { setFolder(f); setActiveId(null); }}
        aria-label="Folder"
        style={{ marginTop: 10 }}
        options={['INBOX', 'TRASH', 'SPAM'].map((f) => ({ value: f, label: f === 'INBOX' ? 'Inbox' : `${FOLDER_LABEL[f]}${folderCounts[f] ? ` (${folderCounts[f]})` : ''}` }))}
      />
      {/* Full labels that wrap instead of truncating; counts come from the server's per-status totals. */}
      <div className="inbox-status-tabs" role="tablist" aria-label="Conversation status">
        {[
          { value: 'OPEN', label: 'Open', count: counts.OPEN || 0 },
          { value: 'PENDING', label: 'Pending', count: counts.PENDING || 0 },
          { value: 'RESOLVED', label: 'Resolved', count: counts.RESOLVED || 0 },
          { value: 'ALL', label: 'All', count: (counts.OPEN || 0) + (counts.PENDING || 0) + (counts.RESOLVED || 0) },
        ].map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={status === t.value}
            className="inbox-status-tab"
            onClick={() => setStatus(t.value)}
          >
            {t.label}
            <span className="count">{t.count}</span>
          </button>
        ))}
      </div>

      <Flex gap={8}>
        <Select
          size="small"
          value={assignee}
          onChange={setAssignee}
          style={{ flex: 1 }}
          aria-label="Assignee filter"
          options={[
            { value: 'any', label: 'All assignees' },
            { value: 'me', label: 'Assigned to me' },
            { value: 'unassigned', label: 'Unassigned' },
            ...(supervisor ? members.map((m) => ({ value: m.userId, label: m.name })) : []),
          ]}
        />
        <Select
          size="small"
          allowClear
          placeholder="Filter tag"
          value={tag}
          onChange={setTag}
          style={{ flex: 1 }}
          options={allTags.map((t) => ({ value: t, label: t }))}
          aria-label="Tag filter"
        />
      </Flex>
      {selected.length > 0 && (
        <Flex align="center" gap={6} wrap className="inbox-bulk-bar" style={{ marginTop: 10, padding: 8, borderRadius: 8, background: 'var(--color-surface-subtle, #f1f5f9)' }} role="toolbar" aria-label="Bulk actions">
          <Typography.Text strong style={{ fontSize: 12 }}>{selected.length} selected</Typography.Text>
          <Select size="small" placeholder="Status" value={null} style={{ width: 100 }} aria-label="Set status for selected"
            options={['OPEN', 'PENDING', 'RESOLVED'].map((v) => ({ value: v, label: v[0] + v.slice(1).toLowerCase() }))}
            onChange={(v) => bulk({ action: 'status', status: v })} />
          <Select size="small" placeholder="Assign" value={null} style={{ width: 110 }} aria-label="Assign selected"
            options={[{ value: '', label: 'Unassigned' }, ...(supervisor ? members.map((m) => ({ value: m.userId, label: m.name })) : [{ value: me.id, label: 'Me' }])]}
            onChange={(v) => bulk({ action: 'assign', assigneeId: v || null })} />
          {supervisor && (folder === 'INBOX' ? (
            <>
              <Button size="small" onClick={() => moveTo('TRASH', selected)}>Trash</Button>
              <Button size="small" onClick={() => moveTo('SPAM', selected)}>Spam</Button>
            </>
          ) : (
            <Button size="small" onClick={() => moveTo('INBOX', selected)}>Restore</Button>
          ))}
          <Button size="small" type="text" onClick={() => setSelected([])}>Clear</Button>
          {folder !== 'INBOX' && can('ADMIN') && (
            <Button size="small" danger onClick={() => modal.confirm({
              title: `Delete ${selected.length} chat${selected.length === 1 ? '' : 's'} permanently?`,
              content: 'The chats, their messages and files are removed for good. This cannot be undone.',
              okText: 'Delete permanently', okButtonProps: { danger: true },
              onOk: () => bulk({ action: 'delete' }),
            })}>Delete</Button>
          )}
        </Flex>
      )}
    </div>
  );

  // Table view: dense, scannable overview of the filtered list; a row opens the full workspace.
  if (view === 'table') {
    return (
      <div className="inbox-table-mode">
        {listHeader}
        <Table
          rowKey="id"
          size="middle"
          rowSelection={{ selectedRowKeys: selected, onChange: (keys) => setSelected(keys), columnWidth: 40 }}
          loading={loading && !items.length}
          dataSource={items}
          pagination={false}
          scroll={{ x: 1000 }}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No conversations found" /> }}
          onRow={(c) => ({
            onClick: () => { setActiveId(c.id); changeView('list'); },
            onKeyDown: (e) => { if (e.key === 'Enter') { setActiveId(c.id); changeView('list'); } },
            tabIndex: 0,
            style: { cursor: 'pointer', fontWeight: c.unreadForAgent > 0 ? 600 : undefined },
          })}
          columns={[
            {
              title: 'Contact',
              key: 'contact',
              width: 220,
              render: (_, c) => (
                <Flex align="center" gap={8} style={{ minWidth: 0 }}>
                  <Typography.Text ellipsis style={{ maxWidth: 180, fontWeight: 'inherit' }}>
                    {c.visitor?.name || c.visitor?.email || `Visitor ${c.visitorId.slice(-4)}`}
                  </Typography.Text>
                </Flex>
              ),
            },
            { title: 'Channel', key: 'channel', width: 110, render: (_, c) => (c.isOffline ? <Tag bordered={false} style={{ background: '#fef3c7', color: '#92400e' }}>Offline msg</Tag> : <Tag bordered={false}>Chat</Tag>) },
            {
              title: 'Preview',
              key: 'preview',
              render: (_, c) => (typing[c.id]
                ? <Typography.Text type="secondary" italic>typing…</Typography.Text>
                : <Typography.Text type="secondary" ellipsis style={{ maxWidth: 320 }}>{c.lastMessagePreview || 'No messages'}</Typography.Text>),
            },
            { title: 'Assignee', key: 'assignee', width: 150, render: (_, c) => (c.assigneeId ? <Typography.Text ellipsis style={{ maxWidth: 140 }}>{memberName(c.assigneeId)}</Typography.Text> : <Tag bordered={false} style={{ background: '#eef2ff', color: '#4338ca' }}>Unassigned</Tag>) },
            { title: 'Status', dataIndex: 'status', width: 100, render: (s) => <Tag color={STATUS_COLOR[s]} bordered={false}>{s}</Tag> },
            { title: 'Tags', dataIndex: 'tags', width: 150, render: (t) => (t.length ? t.slice(0, 2).map((x) => <Tag key={x} bordered={false}>{x}</Tag>) : null) },
            { title: 'Last activity', dataIndex: 'lastMessageAt', width: 120, render: (d) => <Tooltip title={dayjs(d).format('MMM D, YYYY HH:mm')}>{dayjs(d).fromNow()}</Tooltip> },
            { title: '', key: 'unread', width: 50, render: (_, c) => (c.unreadForAgent > 0 ? <Badge count={c.unreadForAgent} style={{ backgroundColor: '#2563eb', boxShadow: 'none' }} /> : null) },
          ]}
        />
        {cursor && (
          <Flex justify="center" style={{ padding: 12 }}>
            <Button onClick={() => loadList(true)}>Load more conversations</Button>
          </Flex>
        )}
      </div>
    );
  }

  return (
    <div className={`inbox ${activeId ? 'has-active' : ''}`}>
      {/* 1. Left List: Search, Filters & Conversation List */}
      <div className="inbox-list">
        {listHeader}

        <div className="inbox-items">
          {loading && !items.length ? (
            <Flex justify="center" align="center" style={{ padding: 40 }}>
              <Spin />
            </Flex>
          ) : !items.length ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 48 }} description="No conversations found" />
          ) : (
            items.map((c) => (
              <div
                key={c.id}
                className={`inbox-item ${c.id === activeId ? 'active' : ''}`}
                onClick={() => setActiveId(c.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setActiveId(c.id)}
              >
                <Flex justify="space-between" align="center" gap={8}>
                  <Flex align="center" gap={8} style={{ minWidth: 0 }}>
                    <Checkbox
                      checked={selected.includes(c.id)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      onChange={(e) => setSelected((cur) => (e.target.checked ? [...cur, c.id] : cur.filter((x) => x !== c.id)))}
                      aria-label={`Select chat with ${c.visitor?.name || c.visitor?.email || `Visitor ${c.visitorId.slice(-4)}`}`}
                    />
                      <Avatar
                        size="small"
                        icon={<UserOutlined />}
                        style={{
                          backgroundColor: '#f1f5f9',
                          color: '#64748b',
                          border: '1px solid #e2e8f0',
                        }}
                      />
                    <span className="inbox-item-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.visitor?.name || c.visitor?.email || `Visitor ${c.visitorId.slice(-4)}`}
                    </span>
                  </Flex>
                  <span className="inbox-item-time">{dayjs(c.lastMessageAt).fromNow(true)}</span>
                </Flex>

                <Flex justify="space-between" align="center" style={{ marginTop: 4 }} gap={8}>
                  <div className="inbox-item-snippet">
                    {typing[c.id] ? (
                      <span style={{ color: '#2563eb', fontStyle: 'italic' }}>typing…</span>
                    ) : (
                      c.lastMessagePreview || <span style={{ color: '#94a3b8' }}>No messages</span>
                    )}
                  </div>
                  {c.unreadForAgent > 0 && (
                    <Badge count={c.unreadForAgent} style={{ backgroundColor: '#2563eb', boxShadow: 'none' }} />
                  )}
                </Flex>

                <Space size={4} wrap style={{ marginTop: 6 }}>
                  {c.isOffline && (
                    <Tag bordered={false} style={{ fontSize: 10, padding: '0 6px', margin: 0, lineHeight: '18px', background: '#fef3c7', color: '#92400e' }}>
                      Offline
                    </Tag>
                  )}
                  {!c.assigneeId && (
                    <Tag
                      bordered={false}
                      style={{ fontSize: 10, padding: '0 6px', margin: 0, lineHeight: '18px', background: '#eef2ff', color: '#4338ca' }}
                    >
                      Unassigned
                    </Tag>
                  )}
                  {c.tags.slice(0, 2).map((t) => (
                    <Tag key={t} bordered={false} style={{ fontSize: 10, padding: '0 6px', margin: 0, lineHeight: '18px' }}>
                      {t}
                    </Tag>
                  ))}
                </Space>
              </div>
            ))
          )}
          {cursor && (
            <div style={{ padding: '8px 12px' }}>
              <Button block type="dashed" size="small" onClick={() => loadList(true)}>
                Load more conversations
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Center Thread: Message Feed & Composer */}
      <div className="inbox-thread" key={detail?.conversation.id || 'none'}>
        {!detail ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ margin: 'auto' }}
            description={activeId ? <Spin tip="Loading conversation..." /> : 'Select a conversation to start chatting'}
          />
        ) : (
          <>
            {/* Thread Header */}
            <div className="inbox-thread-header">
              <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => setActiveId(null)} className="show-mobile" aria-label="Back" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Flex align="center" gap={8} style={{ minWidth: 0 }}>
                  <Typography.Text strong ellipsis style={{ fontSize: 14, minWidth: 0 }}>
                    {detail.visitor.name || detail.visitor.email || `Visitor ${detail.visitor.id.slice(-4)}`}
                  </Typography.Text>
                  <Tag color={STATUS_COLOR[conv.status]} bordered={false} style={{ margin: 0, fontSize: 11, flex: 'none' }}>
                    {conv.status}
                  </Tag>
                </Flex>
              </div>
              <Space style={{ flex: 'none' }}>
                {conv.status !== 'RESOLVED' ? (
                  <Button
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={() => patch({ status: 'RESOLVED' })}
                    style={{ borderColor: '#cbd5e1' }}
                    aria-label="Resolve"
                  >
                    <span className="hide-xs">Resolve</span>
                  </Button>
                ) : (
                  <Button size="small" icon={<ReloadOutlined />} onClick={() => patch({ status: 'OPEN' })} aria-label="Reopen">
                    <span className="hide-xs">Reopen</span>
                  </Button>
                )}
                <Dropdown
                  trigger={['click']}
                  menu={{
                    items: [
                      { key: 'download', label: 'Download transcript' },
                      { key: 'print', label: 'Print transcript' },
                      ...(supervisor ? [
                        { type: 'divider' },
                        detail.visitor.bannedAt ? { key: 'unban', label: 'Unban visitor' } : { key: 'ban', label: 'Ban visitor', danger: true },
                        ...(conv.folder && conv.folder !== 'INBOX'
                          ? [{ key: 'restore', label: 'Restore to Inbox' }]
                          : [{ key: 'trash', label: 'Move to Trash' }, { key: 'spam', label: 'Mark as Spam' }]),
                      ] : []),
                      ...(can('ADMIN') && conv.folder && conv.folder !== 'INBOX' ? [{ key: 'delete', label: 'Delete permanently', danger: true }] : []),
                    ],
                    onClick: ({ key }) => {
                      if (key === 'download') downloadStaffTranscript(storeId, conv.id).catch((e) => message.error(e.message));
                      else if (key === 'print') { if (!printTranscript({ storeName: me.stores?.find((x) => x.id === storeId)?.name, detail, memberName })) message.error('Printing is not available in this browser.'); }
                      else if (key === 'ban') modal.confirm({ title: 'Ban this visitor?', content: 'They can keep browsing but cannot send chats, offline messages or files to this store until unbanned.', okText: 'Ban', okButtonProps: { danger: true }, onOk: () => setBan(true) });
                      else if (key === 'unban') setBan(false);
                      else if (key === 'trash') moveTo('TRASH', [conv.id]);
                      else if (key === 'spam') moveTo('SPAM', [conv.id]);
                      else if (key === 'restore') moveTo('INBOX', [conv.id]);
                      else if (key === 'delete') deleteForever();
                    },
                  }}
                >
                  <Button size="small" icon={<MoreOutlined />} aria-label="More actions" />
                </Dropdown>
                <Tooltip title="Create a ticket from this conversation">
                  <Button
                    size="small"
                    icon={<MailOutlined />}
                    onClick={() => api(`/stores/${storeId}/tickets?limit=1&status=ALL`).then((d) => setTicketFrom({ emailReady: d.emailReady })).catch((e) => showError(e, { message }))}
                    aria-label="Create ticket"
                  >
                    <span className="hide-xs">Create ticket</span>
                  </Button>
                </Tooltip>
                <Button className="show-side-btn" size="small" icon={<InfoCircleOutlined />} onClick={() => setSideDrawer(true)} aria-label="Details" />
              </Space>
            </div>

            {/* Messages Feed */}
            <div className="inbox-msgs" ref={msgsRef}>
              {withPages(detail.messages, detail.pages).map((m) => {
                if (m.pageView) return <PageViewRow key={`pv-${m.id}`} page={m} />;
                if (m.senderType === 'SYSTEM') {
                  return (
                    <div key={m.id || m.clientMsgId} className="msg-system">
                      {m.body} · {dayjs(m.createdAt).format('HH:mm')}
                    </div>
                  );
                }
                const cls = { VISITOR: 'visitor', AGENT: 'agent', BOT: 'bot', NOTE: 'note' }[m.senderType];
                const right = cls !== 'visitor';
                const deliv =
                  m.senderType === 'AGENT' && m.seq === lastAgentSeq
                    ? m.seq <= conv.visitorReadSeq
                      ? ' · Seen'
                      : m.seq <= conv.visitorDeliveredSeq
                        ? ' · Delivered'
                        : ' · Sent'
                    : '';

                return (
                  <div key={m.id || m.clientMsgId} style={{ display: 'contents' }}>
                    <div className={`msg ${cls}`}>
                      {m.attachmentId && <AuthFile storeId={storeId} id={m.attachmentId} />}
                      {!m.attachmentId && m.meta?.removedAttachment && (
                        <div style={{ fontSize: 12, fontStyle: 'italic', opacity: 0.7 }}>{m.meta.removedAttachment.filename || 'File'} - no longer available</div>
                      )}
                      {m.body && <Linkified text={m.body} />}
                      {m.meta?.form && (
                        <div style={{ fontSize: 11, opacity: 0.8, marginTop: 6, padding: '4px 8px', background: 'rgba(0,0,0,0.05)', borderRadius: 4 }}>
                          Form response: {m.meta.form.fields.join(', ')}
                        </div>
                      )}
                      {m.meta?.suggestedReplies?.length > 0 && (
                        <div style={{ fontSize: 11, opacity: 0.8, marginTop: 6 }}>
                          Suggested: {m.meta.suggestedReplies.join(' · ')}
                        </div>
                      )}
                    </div>
                    <div className={`msg-meta ${right ? 'right' : ''}`}>
                      {m.senderType === 'NOTE' ? 'Internal note · ' : m.senderType === 'BOT' ? 'Automated · ' : ''}
                      {m.senderType !== 'VISITOR' && m.senderName ? `${m.senderName} · ` : ''}
                      {m.pending ? (
                        <span>Sending…</span>
                      ) : m.failed ? (
                        <a onClick={() => m.retry?.().catch(() => {})} style={{ color: '#ef4444' }}>Failed - retry</a>
                      ) : (
                        dayjs(m.createdAt).format('MMM D, HH:mm')
                      )}
                      {deliv}
                    </div>
                  </div>
                );
              })}
              {typing[activeId] && (
                <div className="msg visitor" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b' }}>
                  <div className="typing-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span style={{ fontSize: 12 }}>Visitor is typing...</span>
                </div>
              )}
            </div>

            {(detail.visitor.bannedAt || (conv.folder && conv.folder !== 'INBOX')) && (
              <Alert
                type="warning"
                showIcon
                banner
                message={[
                  detail.visitor.bannedAt && `This visitor is banned${detail.visitor.banReason ? ` (${detail.visitor.banReason})` : ''} and can't send messages.`,
                  conv.folder && conv.folder !== 'INBOX' && `This chat is in ${FOLDER_LABEL[conv.folder]}. The visitor's next message starts a new chat.`,
                ].filter(Boolean).join(' ')}
              />
            )}
            {/* Composer */}
            <div className={`composer ${isNote ? 'note' : ''}`}>
              <Flex gap={10} align="center" justify="space-between" wrap style={{ marginBottom: 8 }}>
                <Segmented
                  size="small"
                  value={isNote ? 'note' : 'reply'}
                  onChange={(v) => setIsNote(v === 'note')}
                  options={[
                    { value: 'reply', label: 'Reply to visitor' },
                    { value: 'note', label: 'Internal note' },
                  ]}
                />
                <Typography.Text type="secondary" className="hide-xs" style={{ fontSize: 11 }}>
                  Type <Tag style={{ margin: '0 2px', fontSize: 10 }}>/</Tag> for saved replies · Enter to send
                </Typography.Text>
              </Flex>

              <Popover
                open={replyMatches.length > 0}
                placement="topLeft"
                content={
                  <List
                    size="small"
                    dataSource={replyMatches}
                    style={{ width: 360, maxHeight: 240, overflowY: 'auto' }}
                    renderItem={(r) => (
                      <List.Item
                        style={{ cursor: 'pointer', padding: '8px 12px' }}
                        onClick={() => setText(r.body.replace(/\{\{\s*visitor\.name\s*\}\}/g, detail.visitor.name || 'there'))}
                      >
                        <List.Item.Meta
                          title={
                            <Flex gap={6} align="center">
                              <Tag color="blue">/{r.shortcut}</Tag>
                              <span style={{ fontWeight: 500 }}>{r.title}</span>
                            </Flex>
                          }
                          description={<Typography.Text ellipsis type="secondary" style={{ fontSize: 12 }}>{r.body}</Typography.Text>}
                        />
                      </List.Item>
                    )}
                  />
                }
              >
                <Input.TextArea
                  autoSize={{ minRows: 2, maxRows: 6 }}
                  value={text}
                  maxLength={5000}
                  aria-label="Message"
                  placeholder={isNote ? 'Write an internal note for your team (hidden from visitor)...' : 'Type your reply... (Press Enter to send)'}
                  onChange={(e) => {
                    setText(e.target.value);
                    if (!isNote && Date.now() - lastTyping.current > 2000) {
                      lastTyping.current = Date.now();
                      sendSocket('typing', { storeId, conversationId: activeId, typing: true });
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !replyMatches.length) {
                      e.preventDefault();
                      submit();
                    }
                  }}
                />
              </Popover>

              <Flex justify="space-between" align="center" style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                <Tooltip title="Attach image or file (up to 10 MB)">
                  <Button
                    type="text"
                    size="small"
                    icon={<PaperClipOutlined style={{ fontSize: 15, color: '#64748b' }} />}
                    onClick={() => fileRef.current?.click()}
                    aria-label="Attach file"
                  />
                </Tooltip>
                <input
                  ref={fileRef}
                  type="file"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    if (f) upload(f);
                  }}
                />
                <Button
                  type="primary"
                  size="small"
                  icon={<SendOutlined />}
                  onClick={submit}
                  disabled={!text.trim()}
                  loading={sending}
                  style={{
                    background: isNote ? '#d97706' : '#2563eb',
                    borderColor: isNote ? '#d97706' : '#2563eb',
                  }}
                >
                  {isNote ? 'Add note' : 'Send'}
                </Button>
              </Flex>
            </div>
          </>
        )}
      </div>

      {/* 3. Right Column: Permanent details sidebar on wide screens */}
      <div className="inbox-side">
        {detail ? (
          <SidePanelContent
            detail={detail}
            conv={conv}
            supervisor={supervisor}
            members={members}
            me={me}
            memberName={memberName}
            patch={patch}
          />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No active conversation" style={{ marginTop: 60 }} />
        )}
      </div>

      {/* 4. Slide-out Drawer for screens < 1200px */}
      <Drawer
        open={sideDrawer}
        onClose={() => setSideDrawer(false)}
        title="Conversation Details"
        width="min(360px, 100vw)"
        destroyOnClose
      >
        {detail && (
          <SidePanelContent
            detail={detail}
            conv={conv}
            supervisor={supervisor}
            members={members}
            me={me}
            memberName={memberName}
            patch={patch}
          />
        )}
      </Drawer>
      {ticketFrom && detail && (
        <TicketForm
          storeId={storeId}
          me={me}
          members={members}
          supervisor={supervisor}
          emailReady={ticketFrom.emailReady}
          initial={{
            conversationId: detail.conversation.id,
            contactName: detail.visitor.name || undefined,
            contactEmail: detail.visitor.email || undefined,
            subject: `RE: ${detail.conversation.isOffline ? 'Your message' : 'Chat'} with ${detail.visitor.name || 'us'}`,
            assigneeId: detail.conversation.assigneeId || undefined,
            tags: detail.conversation.tags,
          }}
          onClose={() => setTicketFrom(null)}
          onCreated={() => setTicketFrom(null)}
        />
      )}
    </div>
  );
}
