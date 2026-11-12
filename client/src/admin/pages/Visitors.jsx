// Live visitor monitoring: who is on the site now (or within the chosen window), where, and whether they're chatting.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, Button, Empty, Flex, Input, Segmented, Table, Tag, Tooltip, Typography } from 'antd';
import { DeleteOutlined, DesktopOutlined, MobileOutlined, MessageOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { api, showError } from '../api.js';
import { onSocket } from '../socket.js';
import { useApp } from '../main.jsx';
import { countryName } from './Reports.jsx';
import PageHeader from '../components/PageHeader.jsx';

dayjs.extend(relativeTime);

export const formatDuration = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}:${String(sec).padStart(2, '0')}`;
};

const pathOf = (url) => {
  try { const u = new URL(url); return u.pathname + u.search; } catch { return url || ''; }
};

const WINDOWS = [
  { value: 5, label: '5m' }, { value: 10, label: '10m' }, { value: 30, label: '30m' }, { value: 60, label: '60m' },
  { value: 1440, label: '24h' }, { value: 10080, label: '7 days' }, { value: 43200, label: '30 days' }, { value: 0, label: 'All' },
];
const windowText = (m) => (m === 0 ? 'at any time' : `in the last ${WINDOWS.find((w) => w.value === m)?.label.replace(/^(\d+)m$/, '$1 min') || `${m} min`}`);

export default function Visitors() {
  const { storeId, can } = useApp();
  const { message, modal } = App.useApp();
  const nav = useNavigate();
  const [minutes, setMinutes] = useState(10);
  const [rows, setRows] = useState(null);
  const [now, setNow] = useState(Date.now());
  const timer = useRef(null);

  const load = () => api(`/stores/${storeId}/visitors/live?minutes=${minutes}`).then(setRows).catch((e) => showError(e, { message }));

  useEffect(() => { setRows(null); load(); }, [storeId, minutes]);

  // Live: refetch (debounced) on visitor/chat events; tick the clock for time-on-site.
  useEffect(() => {
    const off = onSocket((type, d) => {
      if (d?.storeId && d.storeId !== storeId) return;
      if (['visitor_online', 'visitor_page', 'message', 'conversation', 'reconnected'].includes(type)) {
        clearTimeout(timer.current);
        timer.current = setTimeout(load, 500);
      }
    });
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const refresh = setInterval(load, 30_000); // picks up visitors who went idle without an event
    return () => { off(); clearInterval(tick); clearInterval(refresh); clearTimeout(timer.current); };
  }, [storeId, minutes]);

  // Two confirmations: a warning, then typing DELETE. Removes the visitor with all chats, files and page history.
  const [selected, setSelected] = useState([]);
  const confirmDelete = (list) => {
    const one = list.length === 1;
    const label = one ? (list[0].name || list[0].email || `Visitor ${list[0].id.slice(-4)}`) : `${list.length} visitors`;
    const ids = list.map((x) => x.id);
    modal.confirm({
      title: `Delete ${label}?`,
      content: `This permanently deletes ${one ? 'this visitor' : 'these visitors'}, all of their chats, messages, files and page history. It cannot be undone.`,
      okText: 'Continue', okButtonProps: { danger: true },
      onOk: () => {
        let typed = '';
        modal.confirm({
          title: 'Are you absolutely sure?',
          content: (
            <>
              <Typography.Paragraph>Type <b>DELETE</b> to permanently delete {label}.</Typography.Paragraph>
              <Input aria-label="Type DELETE to confirm" autoFocus onChange={(e) => { typed = e.target.value; }} />
            </>
          ),
          okText: 'Delete permanently', okButtonProps: { danger: true },
          onOk: async () => {
            if (typed.trim() !== 'DELETE') { message.error('Type DELETE to confirm.'); throw new Error('not confirmed'); }
            try {
              if (one) await api(`/stores/${storeId}/visitors/${ids[0]}`, { method: 'DELETE' });
              else await api(`/stores/${storeId}/visitors/bulk-delete`, { method: 'POST', body: { ids } });
              message.success(`${one ? label : `${ids.length} visitors`} ${one ? 'was' : 'were'} deleted.`);
              setRows((rs) => (rs || []).filter((x) => !ids.includes(x.id)));
              setSelected((sel) => sel.filter((id) => !ids.includes(id)));
            } catch (e) { showError(e, { message }); throw e; }
          },
        });
      },
    });
  };

  const chatting = (rows || []).filter((r) => r.conversation).length;

  return (
    <>
      <PageHeader
        title="Visitors"
        subtitle={rows ? `${chatting} with an open chat · ${rows.length} filled the form ${windowText(minutes)} (browsing-only visitors are not listed)` : 'Loading visitors…'}
        extra={(
          <Flex gap={8} align="center">
            <Segmented value={minutes} onChange={setMinutes} aria-label="Time window" options={WINDOWS} />
            {can?.('ADMIN') && selected.length > 0 && (
              <Button danger icon={<DeleteOutlined />} onClick={() => confirmDelete((rows || []).filter((x) => selected.includes(x.id)))}>
                Delete selected ({selected.length})
              </Button>
            )}
            <Button icon={<ReloadOutlined />} onClick={load} aria-label="Refresh" />
          </Flex>
        )}
      />
      <Table
        rowKey="id"
        loading={!rows}
        rowSelection={can?.('ADMIN') ? { selectedRowKeys: selected, onChange: setSelected, preserveSelectedRowKeys: false } : undefined}
        dataSource={rows || []}
        pagination={{ pageSize: 50, hideOnSinglePage: true }}
        scroll={{ x: 1200 }}
        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`No one filled the chat form ${windowText(minutes)}`} /> }}
        columns={[
          {
            title: 'Visitor',
            key: 'visitor',
            width: 220,
            render: (_, r) => (
              <Flex align="center" gap={8} style={{ minWidth: 0 }}>
                <div style={{ minWidth: 0 }}>
                  <Typography.Text strong ellipsis style={{ display: 'block', maxWidth: 180 }}>{r.name || r.email || `Visitor ${r.id.slice(-4)}`}</Typography.Text>
                  {r.email && r.name && <Typography.Text type="secondary" ellipsis style={{ fontSize: 12, display: 'block', maxWidth: 180 }}>{r.email}</Typography.Text>}
                </div>
              </Flex>
            ),
          },
          {
            title: 'Current page',
            key: 'page',
            render: (_, r) => (r.currentUrl ? (
              <Tooltip title={r.currentUrl}>
                <Typography.Link href={r.currentUrl} target="_blank" rel="noopener noreferrer" ellipsis style={{ maxWidth: 260, display: 'inline-block' }}>
                  {r.currentTitle || pathOf(r.currentUrl)}
                </Typography.Link>
              </Tooltip>
            ) : <Typography.Text type="secondary">No page data</Typography.Text>),
          },
          {
            title: 'Location',
            key: 'location',
            width: 160,
            render: (_, r) => (r.country ? <Typography.Text ellipsis style={{ maxWidth: 150 }} title="Approximate, from IP">{r.city ? `${r.city}, ` : ''}{countryName(r.country)}</Typography.Text> : <Typography.Text type="secondary">Unknown</Typography.Text>),
          },
          {
            title: 'Referrer',
            dataIndex: 'referrer',
            width: 170,
            render: (v) => (v ? <Typography.Text ellipsis style={{ maxWidth: 160 }} title={v}>{(() => { try { return new URL(v).hostname; } catch { return v; } })()}</Typography.Text> : <Typography.Text type="secondary">Direct</Typography.Text>),
          },
          { title: 'Device', dataIndex: 'device', width: 80, render: (d) => (d === 'mobile' ? <Tooltip title="Mobile"><MobileOutlined /></Tooltip> : <Tooltip title="Desktop"><DesktopOutlined /></Tooltip>) },
          { title: 'On site', key: 'time', width: 90, render: (_, r) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatDuration((r.online ? now : new Date(r.lastSeenAt).getTime()) - new Date(r.sessionStartedAt).getTime())}</span> },
          { title: 'Pages', dataIndex: 'sessionPageViews', width: 70, align: 'right' },
          { title: 'Visits', dataIndex: 'visits', width: 70, align: 'right' },
          { title: 'Chats', dataIndex: 'chats', width: 70, align: 'right' },
          {
            title: 'Chat',
            key: 'chat',
            width: 150,
            render: (_, r) => (r.conversation ? (
              <Button size="small" icon={<MessageOutlined />} onClick={() => nav(`/inbox?c=${r.conversation.id}`)}>
                {r.conversation.status === 'PENDING' ? 'Pending' : 'Open chat'}
                {r.conversation.unreadForAgent > 0 && <Tag color="blue" bordered={false} style={{ marginLeft: 6, marginRight: 0 }}>{r.conversation.unreadForAgent}</Tag>}
              </Button>
            ) : <Typography.Text type="secondary">Browsing</Typography.Text>),
          },
          ...(can?.('ADMIN') ? [{
            title: '', key: 'delete', width: 56, align: 'center',
            render: (_, r) => <Tooltip title="Delete visitor"><Button size="small" danger type="text" icon={<DeleteOutlined />} aria-label="Delete visitor" onClick={() => confirmDelete([r])} /></Tooltip>,
          }] : []),
        ]}
      />
    </>
  );
}
