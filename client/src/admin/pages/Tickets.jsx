// Tickets: email support threads. Same layout as the chat inbox (list | thread | details).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, App, Button, Checkbox, Drawer, Empty, Flex, Input, Select, Space, Spin, Tag, Tooltip, Typography, Upload } from 'antd';
import { ArrowLeftOutlined, InfoCircleOutlined, PaperClipOutlined, PlusOutlined, ReloadOutlined, SearchOutlined, SendOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { api, showError, uid, PRIORITY_COLOR } from '../api.js';
import { useApp } from '../main.jsx';
import { onSocket } from '../socket.js';
import TicketForm, { uploadTicketFile } from '../components/TicketForm.jsx';

dayjs.extend(relativeTime);

export const TICKET_STATUS_COLOR = { OPEN: 'green', PENDING: 'gold', CLOSED: 'default' };
const STATUS_LABEL = { OPEN: 'Open', PENDING: 'Pending', CLOSED: 'Closed' };
const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'].map((p) => ({ value: p, label: p[0] + p.slice(1).toLowerCase() }));
const EMAIL_LABEL = { QUEUED: 'Sending…', SENT: 'Emailed', FAILED: 'Not delivered' };

function TicketFile({ storeId, file }) {
  async function open() {
    const r = await fetch(`/api/stores/${encodeURIComponent(storeId)}/ticket-files/${encodeURIComponent(file.id)}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    if (!r.ok) return;
    const url = URL.createObjectURL(await r.blob());
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
  return <Button size="small" icon={<PaperClipOutlined />} onClick={open} style={{ marginTop: 6 }}>{file.filename}</Button>;
}

export default function Tickets() {
  const { me, storeId, can } = useApp();
  const { message } = App.useApp();
  const supervisor = can('SUPERVISOR');
  const [status, setStatus] = useState('OPEN');
  const [assignee, setAssignee] = useState('any');
  const [priority, setPriority] = useState(null);
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emailReady, setEmailReady] = useState(true);
  const [selected, setSelected] = useState([]);
  const [activeId, setActiveId] = useState(new URLSearchParams(location.search).get('t'));
  const [detail, setDetail] = useState(null);
  const [members, setMembers] = useState([]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [text, setText] = useState('');
  const [isNote, setIsNote] = useState(false);
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [sideDrawer, setSideDrawer] = useState(false);
  const activeRef = useRef(activeId);
  activeRef.current = activeId;
  const pendingMsgId = useRef(null);

  const memberName = (id) => members.find((m) => m.userId === id)?.name || (id === me.id ? me.name : 'Unknown');

  const query = useMemo(() => {
    const p = new URLSearchParams({ status, assignee });
    if (q.trim()) p.set('q', q.trim());
    if (priority) p.set('priority', priority);
    return p.toString();
  }, [status, assignee, q, priority]);

  const loadList = useCallback(async (more = false) => {
    setLoading(true);
    try {
      const d = await api(`/stores/${storeId}/tickets?${query}${more && cursor ? `&cursor=${cursor}` : ''}`);
      setItems((prev) => (more ? [...prev, ...d.items] : d.items));
      setCounts(d.counts);
      setCursor(d.nextCursor);
      setEmailReady(d.emailReady);
      setError(null);
      if (!more) setSelected([]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [storeId, query, cursor]);

  const loadDetail = useCallback(async (id) => {
    try {
      setDetail(await api(`/stores/${storeId}/tickets/${id}`));
    } catch (e) {
      setDetail(null);
      if (e.status === 404) { message.warning('That ticket is no longer available to you.'); setActiveId(null); } else showError(e, { message });
    }
  }, [storeId, message]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { const t = setTimeout(() => loadList(), q ? 250 : 0); return () => clearTimeout(t); }, [query]);
  useEffect(() => { api(`/stores/${storeId}/members`).then(setMembers).catch(() => {}); }, [storeId]);
  useEffect(() => {
    const url = new URL(location.href);
    if (activeId) url.searchParams.set('t', activeId); else url.searchParams.delete('t');
    history.replaceState(null, '', url);
    setText(''); setFiles([]); setIsNote(false); pendingMsgId.current = null;
    if (activeId) { setDetail(null); loadDetail(activeId); }
  }, [activeId, loadDetail]);

  // Status counts and list membership come from the server; refresh them (debounced) after changes.
  const refreshTimer = useRef(null);
  const loadListRef = useRef(loadList);
  loadListRef.current = loadList;
  const refreshSoon = useCallback(() => {
    clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => loadListRef.current(), 400);
  }, []);
  useEffect(() => () => clearTimeout(refreshTimer.current), []);

  // Live updates: list rows and the open thread.
  useEffect(() => onSocket((type, d) => {
    if (d?.storeId && d.storeId !== storeId) return;
    if (type === 'ticket_created' || type === 'ticket' || type === 'ticket_removed') refreshSoon();
    if (type === 'ticket_created' || type === 'ticket') {
      setItems((prev) => {
        const i = prev.findIndex((t) => t.id === d.ticket.id);
        if (i < 0) return type === 'ticket_created' && (status === 'ALL' || status === d.ticket.status) ? [d.ticket, ...prev] : prev;
        const next = [...prev];
        next[i] = d.ticket;
        return next;
      });
      if (d.ticket.id === activeRef.current) loadDetail(d.ticket.id);
    }
    if (type === 'ticket_message' && d.ticketId === activeRef.current) {
      setDetail((cur) => {
        if (!cur) return cur;
        const i = cur.messages.findIndex((m) => m.id === d.message.id);
        const messages = i < 0 ? [...cur.messages, d.message] : cur.messages.map((m) => (m.id === d.message.id ? d.message : m));
        return { ...cur, messages };
      });
    }
    if (type === 'ticket_removed' && d.userId === me.id && !supervisor) {
      setItems((prev) => prev.filter((t) => t.id !== d.ticketId));
      if (d.ticketId === activeRef.current) setActiveId(null);
    }
  }), [storeId, status, loadDetail, me.id, supervisor, refreshSoon]);

  async function patch(body) {
    try {
      const t = await api(`/stores/${storeId}/tickets/${activeId}`, { method: 'PATCH', body });
      setItems((prev) => prev.map((x) => (x.id === t.id ? t : x)));
      refreshSoon();
      await loadDetail(t.id);
    } catch (e) {
      showError(e, { message });
    }
  }

  async function bulk(change) {
    try {
      const r = await api(`/stores/${storeId}/tickets/bulk`, { method: 'POST', body: { ids: selected, patch: change } });
      message.success(`Updated ${r.updated.length} ticket${r.updated.length === 1 ? '' : 's'}${r.skipped.length ? ` (${r.skipped.length} skipped)` : ''}.`);
      loadList();
    } catch (e) {
      showError(e, { message });
    }
  }

  async function send() {
    if (!text.trim() || sending) return;
    setSending(true);
    // Same id on retry after a network error, so the reply is never emailed twice.
    pendingMsgId.current ||= uid();
    try {
      await api(`/stores/${storeId}/tickets/${activeId}/messages`, { method: 'POST', body: { body: text, note: isNote, clientMsgId: pendingMsgId.current, attachmentIds: isNote ? [] : files.map((f) => f.id) } });
      setText(''); setFiles([]); pendingMsgId.current = null;
      await loadDetail(activeId);
    } catch (e) {
      showError(e, { message });
    } finally {
      setSending(false);
    }
  }

  async function retry(m) {
    try {
      await api(`/stores/${storeId}/tickets/${activeId}/messages/${m.id}/retry`, { method: 'POST' });
      await loadDetail(activeId);
    } catch (e) {
      showError(e, { message });
    }
  }

  async function addFile({ file }) {
    try { const att = await uploadTicketFile(storeId, file); setFiles((f) => [...f, att]); } catch (e) { showError(e, { message }); }
  }

  const ticket = detail?.ticket;
  const total = (counts.OPEN || 0) + (counts.PENDING || 0) + (counts.CLOSED || 0);
  const allChecked = items.length > 0 && selected.length === items.length;
  const sidePanel = ticket && (
          <div style={{ padding: 16 }}>
            <div className="inbox-side-section-title">Details</div>
            <Space direction="vertical" style={{ width: '100%' }} size={10}>
              <label style={{ display: 'block' }}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>Assignee</Typography.Text>
                <Select style={{ width: '100%' }} value={ticket.assigneeId || ''} onChange={(v) => patch({ assigneeId: v || null })} aria-label="Assignee"
                  options={[{ value: '', label: 'Unassigned' }, ...(supervisor ? members.map((m) => ({ value: m.userId, label: m.name })) : [{ value: me.id, label: `${me.name} (me)` }, ...(ticket.assigneeId && ticket.assigneeId !== me.id ? [{ value: ticket.assigneeId, label: memberName(ticket.assigneeId) }] : [])])]} />
              </label>
              <label style={{ display: 'block' }}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>Priority</Typography.Text>
                <Select style={{ width: '100%' }} value={ticket.priority} onChange={(v) => patch({ priority: v })} options={PRIORITIES} aria-label="Priority" />
              </label>
              <label style={{ display: 'block' }}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>Tags</Typography.Text>
                <Select mode="tags" style={{ width: '100%' }} value={ticket.tags} open={false} onChange={(v) => patch({ tags: v.map((x) => x.toLowerCase()) })} aria-label="Tags" placeholder="Add tags" />
              </label>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Created {dayjs(ticket.createdAt).format('MMM D, YYYY HH:mm')}
                {ticket.closedAt && <div>Closed {dayjs(ticket.closedAt).format('MMM D, YYYY HH:mm')}</div>}
                {ticket.conversationId && <div><a href={`/admin/inbox?c=${ticket.conversationId}`}>Open source conversation</a></div>}
              </div>
            </Space>
          </div>
  );

  return (
    <div className={`inbox tickets ${activeId ? 'has-active' : ''}`}>
      <section className="inbox-list" aria-label="Tickets">
        <div className="inbox-list-header">
          <Flex justify="space-between" align="center" style={{ marginBottom: 10 }}>
            <Typography.Title level={5} style={{ margin: 0 }}>Tickets</Typography.Title>
            <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setComposeOpen(true)}>New ticket</Button>
          </Flex>
          <Input allowClear prefix={<SearchOutlined style={{ color: '#64748b' }} />} placeholder="Search subject, email, message or #number"
            value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search tickets" />
          <div className="inbox-status-tabs" role="tablist" aria-label="Ticket status">
            {[['OPEN', counts.OPEN || 0], ['PENDING', counts.PENDING || 0], ['CLOSED', counts.CLOSED || 0], ['ALL', total]].map(([v, n]) => (
              <button key={v} type="button" role="tab" aria-selected={status === v} className="inbox-status-tab" onClick={() => setStatus(v)}>
                {STATUS_LABEL[v] || 'All'}<span className="count">{n}</span>
              </button>
            ))}
          </div>
          <Flex gap={8}>
            <Select size="small" value={assignee} onChange={setAssignee} style={{ flex: 1, minWidth: 0 }} aria-label="Assignee filter"
              options={[{ value: 'any', label: 'All assignees' }, { value: 'me', label: 'Assigned to me' }, { value: 'unassigned', label: 'Unassigned' },
                ...(supervisor ? members.map((m) => ({ value: m.userId, label: m.name })) : [])]} />
            <Select size="small" allowClear placeholder="Priority" value={priority} onChange={setPriority} style={{ width: 110 }} aria-label="Priority filter" options={PRIORITIES} />
          </Flex>
          {items.length > 0 && (
            <Flex align="center" gap={8} wrap style={{ marginTop: 10 }}>
              <Checkbox checked={allChecked} indeterminate={selected.length > 0 && !allChecked}
                onChange={(e) => setSelected(e.target.checked ? items.map((t) => t.id) : [])} aria-label="Select all tickets">
                {selected.length ? `${selected.length} selected` : 'Select'}
              </Checkbox>
              {selected.length > 0 && (
                <Space size={4} wrap>
                  <Select size="small" placeholder="Set status" style={{ width: 110 }} value={null} aria-label="Bulk status"
                    options={['OPEN', 'PENDING', 'CLOSED'].map((s) => ({ value: s, label: STATUS_LABEL[s] }))} onChange={(s) => bulk({ status: s })} />
                  <Select size="small" placeholder="Assign" style={{ width: 110 }} value={null} aria-label="Bulk assign"
                    options={[{ value: '', label: 'Unassigned' }, ...(supervisor ? members.map((m) => ({ value: m.userId, label: m.name })) : [{ value: me.id, label: 'Me' }])]}
                    onChange={(a) => bulk({ assigneeId: a || null })} />
                </Space>
              )}
            </Flex>
          )}
        </div>
        <div className="inbox-items" aria-busy={loading}>
          {!emailReady && (
            <Alert type="warning" showIcon style={{ margin: 8 }} message="Email isn't set up" description="Tickets can't be created or answered by email until SMTP works. Add SMTP in Store settings → Notifications & SMTP (host, port, security, username, password, from address) and use “Send test email” to confirm it works. A server admin can instead set SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS and SMTP_FROM and restart the server." />
          )}
          {error && <Alert type="error" showIcon style={{ margin: 8 }} message={error} action={<Button size="small" onClick={() => loadList()}>Retry</Button>} />}
          {!error && !loading && items.length === 0 && <Empty style={{ marginTop: 40 }} description={q ? 'No tickets match your search' : 'No tickets here'} />}
          {items.map((t) => (
            <div key={t.id} className={`inbox-item ${t.id === activeId ? 'active' : ''}`} style={{ display: 'flex', gap: 8 }}>
              <Checkbox checked={selected.includes(t.id)} onChange={(e) => setSelected((s) => (e.target.checked ? [...s, t.id] : s.filter((x) => x !== t.id)))}
                aria-label={`Select ticket ${t.number}`} style={{ marginTop: 2 }} />
              <button type="button" onClick={() => setActiveId(t.id)} style={{ all: 'unset', cursor: 'pointer', flex: 1, minWidth: 0 }} aria-label={`Open ticket ${t.number}: ${t.subject}`}>
                <Flex justify="space-between" gap={8}>
                  <span className="inbox-item-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>#{t.number} {t.subject}</span>
                  <span className="inbox-item-time">{dayjs(t.lastMessageAt).fromNow(true)}</span>
                </Flex>
                <div className="inbox-item-snippet">{t.contactName || t.contactEmail} · {t.lastMessagePreview}</div>
                <Flex gap={4} style={{ marginTop: 4 }} wrap>
                  <Tag color={TICKET_STATUS_COLOR[t.status]} bordered={false} style={{ margin: 0, fontSize: 11 }}>{STATUS_LABEL[t.status]}</Tag>
                  {t.priority !== 'NORMAL' && <Tag color={PRIORITY_COLOR[t.priority]} bordered={false} style={{ margin: 0, fontSize: 11 }}>{t.priority.toLowerCase()}</Tag>}
                  {t.assigneeId && <Tag bordered={false} style={{ margin: 0, fontSize: 11 }}>{memberName(t.assigneeId)}</Tag>}
                </Flex>
              </button>
            </div>
          ))}
          {loading && <Flex justify="center" style={{ padding: 16 }}><Spin /></Flex>}
          {cursor && !loading && <Flex justify="center" style={{ padding: 8 }}><Button size="small" onClick={() => loadList(true)}>Load more</Button></Flex>}
        </div>
      </section>

      <section className="inbox-thread" aria-label="Ticket thread" key={ticket?.id || 'none'}>
        {!ticket ? (
          <Empty style={{ margin: 'auto' }} description={activeId ? <Spin /> : 'Select a ticket, or create a new one'} />
        ) : (
          <>
            <div className="inbox-thread-header">
              <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => setActiveId(null)} className="show-mobile" aria-label="Back to tickets" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Typography.Text strong ellipsis style={{ display: 'block' }}>#{ticket.number} {ticket.subject}</Typography.Text>
                <Typography.Text type="secondary" ellipsis style={{ fontSize: 12, display: 'block' }}>
                  {ticket.contactName ? `${ticket.contactName} <${ticket.contactEmail}>` : ticket.contactEmail}{ticket.cc.length ? ` · cc ${ticket.cc.join(', ')}` : ''}
                </Typography.Text>
              </div>
              <Select size="small" value={ticket.status} onChange={(s) => patch({ status: s })} style={{ width: 104 }} aria-label="Ticket status"
                options={['OPEN', 'PENDING', 'CLOSED'].map((s) => ({ value: s, label: STATUS_LABEL[s] }))} />
              <Button className="show-side-btn" size="small" icon={<InfoCircleOutlined />} onClick={() => setSideDrawer(true)} aria-label="Ticket details" />
            </div>
            <div className="inbox-msgs">
              {detail.messages.map((m) => {
                const atts = detail.attachments.filter((a) => a.messageId === m.id);
                if (m.senderType === 'SYSTEM') {
                  const [first, ...rest] = m.body.split('\n\n');
                  return (
                    <div key={m.id} className="msg-system" style={{ whiteSpace: 'pre-wrap', textAlign: rest.length ? 'left' : undefined }}>
                      {first} · {dayjs(m.createdAt).format('MMM D, HH:mm')}
                      {rest.length > 0 && <details style={{ marginTop: 6 }}><summary style={{ cursor: 'pointer' }}>Original conversation</summary>{rest.join('\n\n').replace(/^Original conversation:\n/, '')}</details>}
                    </div>
                  );
                }
                const cls = m.senderType === 'NOTE' ? 'note' : m.senderType === 'CUSTOMER' ? 'visitor' : 'agent';
                return (
                  <div key={m.id} style={{ display: 'contents' }}>
                    <div className={`msg ${cls}`} style={{ whiteSpace: 'pre-wrap' }}>
                      {m.body}
                      {atts.map((a) => <div key={a.id}><TicketFile storeId={storeId} file={a} /></div>)}
                    </div>
                    <div className={`msg-meta ${cls === 'visitor' ? '' : 'right'}`}>
                      {m.senderName} · {dayjs(m.createdAt).format('MMM D, HH:mm')}
                      {m.emailStatus !== 'NONE' && (
                        <>
                          {' · '}
                          <Tooltip title={m.emailStatus === 'FAILED' ? m.emailError : m.emailStatus === 'QUEUED' && m.emailError ? `Retrying: ${m.emailError}` : null}>
                            <span style={{ color: m.emailStatus === 'FAILED' ? '#dc2626' : undefined }}>{EMAIL_LABEL[m.emailStatus]}</span>
                          </Tooltip>
                          {m.emailStatus === 'FAILED' && <Button type="link" size="small" icon={<ReloadOutlined />} onClick={() => retry(m)} style={{ padding: '0 4px', height: 'auto' }}>Retry</Button>}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ borderTop: '1px solid var(--color-border)', padding: 12 }}>
              <Flex gap={8} align="center" style={{ marginBottom: 8 }}>
                <Button size="small" type={isNote ? 'default' : 'primary'} ghost={!isNote} onClick={() => setIsNote(false)} aria-pressed={!isNote}>Reply by email</Button>
                <Button size="small" type={isNote ? 'primary' : 'default'} ghost={isNote} onClick={() => setIsNote(true)} aria-pressed={isNote}>Internal note</Button>
              </Flex>
              {!isNote && !detail.emailReady && <Alert type="warning" showIcon style={{ marginBottom: 8 }} message="Email isn't set up, so replies can't be sent. You can still add internal notes." />}
              <Input.TextArea value={text} onChange={(e) => setText(e.target.value)} autoSize={{ minRows: 2, maxRows: 8 }} maxLength={10000}
                placeholder={isNote ? 'Note for your team (never emailed)' : `Reply to ${ticket.contactEmail}`} aria-label={isNote ? 'Internal note' : 'Reply'}
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send(); }}
                style={isNote ? { background: '#fffbeb' } : undefined} />
              <Flex justify="space-between" align="center" style={{ marginTop: 8 }} gap={8} wrap>
                <Flex gap={6} wrap align="center">
                  {!isNote && (
                    <Upload customRequest={addFile} showUploadList={false} accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.txt,.csv,.log">
                      <Button size="small" icon={<PaperClipOutlined />} aria-label="Attach file" />
                    </Upload>
                  )}
                  {!isNote && files.map((f) => <Button key={f.id} size="small" onClick={() => setFiles((x) => x.filter((y) => y.id !== f.id))} aria-label={`Remove ${f.filename}`}>{f.filename} ✕</Button>)}
                  {ticket.status === 'CLOSED' && !isNote && <Typography.Text type="secondary" style={{ fontSize: 12 }}>Replying reopens this ticket.</Typography.Text>}
                </Flex>
                <Button type="primary" icon={<SendOutlined />} loading={sending} disabled={!text.trim()} onClick={send}>
                  {isNote ? 'Add note' : 'Send'}
                </Button>
              </Flex>
            </div>
          </>
        )}
      </section>

      <aside className="inbox-side" aria-label="Ticket details">
        {ticket && sidePanel}
      </aside>
      {/* Below 1280px the side column is hidden; the same controls open in a drawer. */}
      <Drawer open={sideDrawer && !!ticket} onClose={() => setSideDrawer(false)} title="Ticket details" width="min(360px, 100vw)">
        {ticket && sidePanel}
      </Drawer>

      {composeOpen && (
        <TicketForm storeId={storeId} me={me} members={members} supervisor={supervisor} emailReady={emailReady}
          onClose={() => setComposeOpen(false)}
          onCreated={(t) => { setComposeOpen(false); setStatus('OPEN'); loadList(); setActiveId(t.id); }} />
      )}
    </div>
  );
}
