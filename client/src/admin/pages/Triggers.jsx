import { useEffect, useState, useMemo } from 'react';
import { Routes, Route, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  App, Button, Card, Col, Descriptions, Divider, Dropdown, Empty, Flex,
  Checkbox, Form, Input, InputNumber, Modal, Popconfirm, Radio, Row, Select, Space,
  Spin, Switch, Table, Tag, Tooltip, Typography,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined, CopyOutlined, HistoryOutlined, ThunderboltOutlined,
  ArrowLeftOutlined, ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined,
  PlayCircleOutlined, SettingOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { api, showError } from '../api.js';
import { useApp } from '../main.jsx';
import ChatWindow from '../../widget/ChatWindow.jsx';
import ShadowPreview from '../components/ShadowPreview.jsx';

const EXEC_COLOR = {
  SCHEDULED: 'blue',
  RUNNING: 'processing',
  SUCCEEDED: 'green',
  SKIPPED: 'default',
  FAILED: 'red',
  CANCELLED: 'orange',
};

function useCatalog() {
  const [cat, setCat] = useState(null);
  useEffect(() => {
    api('/trigger-catalog').then(setCat).catch(() => {});
  }, []);
  return cat;
}

// --------------------------------------------------------------------------
// 1. Trigger List
// --------------------------------------------------------------------------

/** Main admin: copy this store's triggers into the ticked stores; shows what was copied or skipped per store. */
export function CopyTriggersModal({ open, onClose, storeId, stores, triggers }) {
  const { message } = App.useApp();
  const others = stores.filter((s) => s.id !== storeId);
  const [targets, setTargets] = useState([]);
  const [picked, setPicked] = useState([]);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState(null);
  useEffect(() => { if (open) { setTargets([]); setPicked(triggers.map((t) => t.id)); setReport(null); } }, [open]);

  async function copy() {
    setBusy(true);
    try {
      const r = await api(`/stores/${storeId}/triggers/copy`, { method: 'POST', body: { storeIds: targets, triggerIds: picked } });
      setReport(r.stores);
      const n = r.stores.reduce((a, s) => a + s.copied.length, 0);
      message.success(`${n} trigger${n === 1 ? '' : 's'} copied`);
    } catch (e) {
      showError(e, { message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} title="Copy triggers to other stores" onCancel={onClose} destroyOnClose centered width={520}
      footer={report ? <Button type="primary" onClick={onClose}>Done</Button> : [
        <Button key="c" onClick={onClose}>Cancel</Button>,
        <Button key="ok" type="primary" loading={busy} disabled={!targets.length || !picked.length} onClick={copy}>
          Copy {picked.length} trigger{picked.length === 1 ? '' : 's'} to {targets.length} store{targets.length === 1 ? '' : 's'}
        </Button>,
      ]}>
      {report ? (
        <Space direction="vertical" style={{ width: '100%' }}>
          {report.map((r) => (
            <div key={r.storeId}>
              <Typography.Text strong>{r.storeName}</Typography.Text>
              <div style={{ fontSize: 13 }}>
                {r.copied.length ? `Copied: ${r.copied.join(', ')}` : 'Nothing new copied.'}
                {r.skipped.map((x) => <div key={x.name}><Typography.Text type="secondary">Skipped "{x.name}": {x.reason}</Typography.Text></div>)}
              </div>
            </div>
          ))}
        </Space>
      ) : (
        <>
          <Typography.Paragraph type="secondary">
            Copies are independent: editing them later in one store doesn't change the others. A store that already has a trigger with the same name keeps its own.
          </Typography.Paragraph>
          <Typography.Text strong>Triggers</Typography.Text>
          <Checkbox.Group style={{ display: 'flex', flexDirection: 'column', gap: 4, margin: '6px 0 14px' }} value={picked} onChange={setPicked}
            options={triggers.map((t) => ({ value: t.id, label: t.name }))} />
          <Flex justify="space-between" align="center">
            <Typography.Text strong>Copy to</Typography.Text>
            <Button type="link" size="small" onClick={() => setTargets(targets.length === others.length ? [] : others.map((s) => s.id))}>
              {targets.length === others.length ? 'Clear' : 'Select all stores'}
            </Button>
          </Flex>
          {others.length ? (
            <Checkbox.Group style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 240, overflowY: 'auto', marginTop: 6 }} value={targets} onChange={setTargets}
              options={others.map((s) => ({ value: s.id, label: s.name }))} />
          ) : <Typography.Text type="secondary">There are no other stores.</Typography.Text>}
        </>
      )}
    </Modal>
  );
}

function TriggerList() {
  const { storeId, me, isSuper } = useApp();
  const { message } = App.useApp();
  const [copyOpen, setCopyOpen] = useState(false);
  const nav = useNavigate();
  const cat = useCatalog();
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState('');
  const [tplOpen, setTplOpen] = useState(false);

  const load = () =>
    api(`/stores/${storeId}/triggers`).then(setRows).catch((e) => showError(e, { message }));

  useEffect(() => {
    load();
  }, [storeId]);

  async function toggle(t, enabled) {
    try {
      const r = await api(`/stores/${storeId}/triggers/${t.id}/enabled`, { method: 'PATCH', body: { enabled } });
      if (r.cancelled) message.info(`${r.cancelled} scheduled run(s) cancelled`);
      load();
    } catch (e) {
      showError(e, { message });
    }
  }

  const filtered = (rows || []).filter(
    (t) => !q || `${t.name} ${t.description || ''}`.toLowerCase().includes(q.toLowerCase()),
  );
  const evLabel = (k) => cat?.events.find((e) => e.key === k)?.label || k;

  return (
    <>
      {isSuper && <CopyTriggersModal open={copyOpen} onClose={() => setCopyOpen(false)} storeId={storeId} stores={me?.stores || []} triggers={rows || []} />}
      <div className="saas-page-header">
        <div>
          <Typography.Title level={4} className="saas-page-title">
            Automated Triggers
          </Typography.Title>
          <Typography.Text type="secondary" className="saas-page-subtitle">
            Send proactive messages, rescue abandoned chats, and route inquiries automatically based on visitor actions.
          </Typography.Text>
        </div>
        <Space wrap>
          <Button icon={<HistoryOutlined />} onClick={() => nav('/triggers/logs')}>
            Execution logs
          </Button>
          <Button icon={<ThunderboltOutlined />} onClick={() => setTplOpen(true)}>
            From template
          </Button>
          {isSuper && (rows || []).length > 0 && (
            <Button icon={<CopyOutlined />} onClick={() => setCopyOpen(true)}>
              Copy to other stores
            </Button>
          )}
          <Dropdown
            menu={{
              items: [
                { key: 'BASIC', label: 'Basic Trigger (Proactive Welcome)' },
                { key: 'ADVANCED', label: 'Advanced Trigger (Custom Rules & Actions)' },
              ],
              onClick: ({ key }) => nav(`/triggers/new?kind=${key}`),
            }}
          >
            <Button type="primary" icon={<PlusOutlined />}>
              Add trigger
            </Button>
          </Dropdown>
        </Space>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Search triggers by name or description..."
          allowClear
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ maxWidth: 360 }}
        />
      </div>

      <Table
        rowKey="id"
        loading={!rows}
        dataSource={filtered}
        pagination={{ pageSize: 20, hideOnSinglePage: true }}
        scroll={{ x: 800 }}
        locale={{
          emptyText: (
            <Empty
              description="No triggers configured yet. Create a proactive welcome message or choose a template to get started."
              style={{ padding: '32px 0' }}
            />
          ),
        }}
        columns={[
          {
            title: 'Trigger Name',
            dataIndex: 'name',
            render: (n, t) => (
              <div>
                <a
                  onClick={() => nav(`/triggers/${t.id}`)}
                  style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}
                >
                  {n}
                </a>
                {t.description && (
                  <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{t.description}</div>
                )}
              </div>
            ),
          },
          {
            title: 'Type',
            dataIndex: 'kind',
            width: 110,
            render: (k) => (
              <Tag
                bordered={false}
                style={{
                  background: k === 'BASIC' ? '#e0f2fe' : '#f3e8ff',
                  color: k === 'BASIC' ? '#0369a1' : '#6b21a8',
                  fontWeight: 500,
                  fontSize: 11,
                }}
              >
                {k === 'BASIC' ? 'Basic' : 'Advanced'}
              </Tag>
            ),
          },
          {
            title: 'When Event Occurs',
            dataIndex: 'event',
            render: (e, t) => (
              <div>
                <span style={{ fontWeight: 500, color: '#334155' }}>{evLabel(e)}</span>
                {t.delaySeconds ? (
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {' '}· after {fmtSeconds(t.delaySeconds)}{t.timerFrom === 'LAST_VISITOR' ? ' since the last customer message' : t.timerFrom === 'LAST_MESSAGE' ? ' since the last message' : ' delay'}
                  </Typography.Text>
                ) : null}
              </div>
            ),
          },
          {
            title: 'Enabled',
            dataIndex: 'enabled',
            width: 90,
            render: (v, t) => (
              <Switch checked={v} onChange={(c) => toggle(t, c)} aria-label="Toggle trigger enabled" />
            ),
          },
          {
            title: '',
            width: 130,
            render: (_, t) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => nav(`/triggers/${t.id}`)} aria-label="Edit trigger" />
                <Button
                  size="small"
                  icon={<HistoryOutlined />}
                  onClick={() => nav(`/triggers/logs?trigger=${t.id}`)}
                  aria-label="View execution logs"
                />
                <Popconfirm
                  title="Delete this trigger?"
                  description="Scheduled runs will be cancelled. Associated logs will be deleted."
                  okText="Delete"
                  onConfirm={async () => {
                    try {
                      await api(`/stores/${storeId}/triggers/${t.id}`, { method: 'DELETE' });
                      load();
                    } catch (e) {
                      showError(e, { message });
                    }
                  }}
                >
                  <Button size="small" danger icon={<DeleteOutlined />} aria-label="Delete trigger" />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      {/* Templates Modal */}
      <Modal
        open={tplOpen}
        onCancel={() => setTplOpen(false)}
        footer={null}
        title="Start with a Prebuilt Template"
        width={720}
        centered
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
          Choose a battle-tested template to quickly boost storefront conversion and automated responsiveness.
        </Typography.Paragraph>
        <Row gutter={[12, 12]}>
          {cat?.templates.map((t) => (
            <Col xs={24} md={12} key={t.key}>
              <Card
                hoverable
                size="small"
                onClick={() => nav(`/triggers/new?template=${t.key}`)}
                style={{
                  cursor: 'pointer',
                  border: '1px solid #e2e8f0',
                  height: '100%',
                }}
              >
                <Card.Meta
                  avatar={
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: '#eff6ff',
                        color: '#2563eb',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 18,
                      }}
                    >
                      <ThunderboltOutlined />
                    </div>
                  }
                  title={<span style={{ fontWeight: 600, fontSize: 13 }}>{t.name}</span>}
                  description={<span style={{ fontSize: 12, color: '#64748b' }}>{t.description}</span>}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Modal>
    </>
  );
}

// --------------------------------------------------------------------------
// 2. Trigger Editor & Builder
// --------------------------------------------------------------------------

const EMPTY_ADV = {
  kind: 'ADVANCED',
  event: 'chat_requested',
  delaySeconds: 0,
  timerFrom: 'EVENT',
  match: 'ALL',
  conditions: [],
  actions: [{ type: 'send_message', text: '', suggestedReplies: [] }],
  frequency: 'ONCE_PER_CONVERSATION',
  cooldownSeconds: 0,
  enabled: true,
};

const EMPTY_BASIC = {
  kind: 'BASIC',
  event: 'page_view',
  delaySeconds: 30,
  match: 'ALL',
  conditions: [],
  actions: [{ type: 'send_message', text: 'Hi! 👋 Need any help?', suggestedReplies: [] }],
  frequency: 'ONCE_PER_SESSION',
  cooldownSeconds: 0,
  enabled: true,
};

function basicToTrigger(b) {
  const conds = [
    { field: 'visitor.timeOnSite', op: 'gte', value: b.delaySeconds },
    { field: 'chat.exists', op: 'is_false' },
    { field: 'visitor.status', op: 'eq', value: 'Online' },
  ];
  if (b.urlContains) conds.push({ field: 'page.url', op: 'contains', value: b.urlContains });
  if (b.homeOnly) conds.push({ field: 'page.path', op: 'eq', value: '/' });
  return {
    name: b.name,
    description: b.description,
    enabled: b.enabled,
    kind: 'BASIC',
    event: 'page_view',
    delaySeconds: b.delaySeconds,
    match: 'ALL',
    conditions: conds,
    frequency: b.frequency,
    cooldownSeconds: 0,
    actions: [
      {
        type: 'send_message',
        text: b.text,
        agentName: b.agentName || undefined,
        avatarUrl: b.avatarUrl || undefined,
        suggestedReplies: b.suggestedReplies || [],
      },
    ],
  };
}

function triggerToBasic(t) {
  const a = t.actions.find((x) => x.type === 'send_message') || {};
  return {
    name: t.name,
    description: t.description,
    enabled: t.enabled,
    delaySeconds: t.delaySeconds,
    frequency: t.frequency,
    urlContains: t.conditions.find((c) => c.field === 'page.url')?.value || '',
    homeOnly: t.conditions.some((c) => c.field === 'page.path' && c.op === 'eq' && c.value === '/'),
    text: a.text,
    agentName: a.agentName,
    avatarUrl: a.avatarUrl,
    suggestedReplies: a.suggestedReplies || [],
  };
}

const UNITS = [{ value: 1, label: 'seconds' }, { value: 60, label: 'minutes' }, { value: 3600, label: 'hours' }];
const unitFor = (sec) => (sec && sec % 3600 === 0 ? 3600 : sec && sec % 60 === 0 ? 60 : 1);

/** Seconds / minutes / hours picker. The form value is always whole seconds. */
export function DurationInput({ value, onChange, min = 0, max = 604800, 'aria-label': ariaLabel, ...rest }) {
  const [unit, setUnit] = useState(() => unitFor(value));
  const shown = value == null ? null : Math.round((value / unit) * 100) / 100;
  return (
    <Space.Compact style={{ width: '100%' }}>
      <InputNumber style={{ width: '100%' }} min={min / unit} max={max / unit} value={shown} aria-label={ariaLabel} {...rest}
        onChange={(n) => onChange?.(n == null ? n : Math.min(max, Math.max(min, Math.round(n * unit))))} />
      <Select style={{ width: 110 }} value={unit} options={UNITS} aria-label={`${ariaLabel || 'Duration'} unit`}
        onChange={(u) => { setUnit(u); if (value != null) onChange?.(Math.min(max, Math.max(min, Math.round((value / unit) * u)))); }} />
    </Space.Compact>
  );
}

export const fmtSeconds = (s) => (!s ? '0 s' : s % 3600 === 0 ? `${s / 3600} h` : s % 60 === 0 ? `${s / 60} min` : `${s} s`);

function ValueInput({ field, ...rest }) {
  if (!field || field.type === 'bool') return <Input disabled placeholder="None required" {...rest} value={undefined} />;
  if (field.type === 'wait') return <DurationInput min={1} {...rest} />;
  if (field.unit === 'seconds') return <DurationInput {...rest} />;
  if (field.type === 'number') return <InputNumber style={{ width: '100%' }} min={0} {...rest} />;
  if (field.type === 'enum') return <Select options={field.options.map((o) => ({ value: o, label: o }))} {...rest} />;
  return <Input maxLength={500} placeholder={field.type === 'tags' ? 'tag value' : 'value'} {...rest} />;
}

function Conditions({ cat, form }) {
  const conds = Form.useWatch('conditions', form) || [];
  const groups = [...new Set(cat.fields.map((f) => f.group))];
  const fieldOpts = groups.map((g) => ({
    label: g,
    options: cat.fields.filter((f) => f.group === g).map((f) => ({ value: f.key, label: f.label })),
  }));

  return (
    <Form.List name="conditions">
      {(fields, { add, remove }) => (
        <Space direction="vertical" style={{ width: '100%' }} size={10}>
          {fields.map((f) => {
            const def = cat.fields.find((x) => x.key === conds[f.name]?.field);
            return (
              <div key={f.key}>
              <div className="cond-row">
                <Form.Item name={[f.name, 'field']} noStyle rules={[{ required: true }]}>
                  <Select
                    showSearch
                    optionFilterProp="label"
                    options={fieldOpts}
                    placeholder="Select Field"
                    onChange={(v) => {
                      const d = cat.fields.find((x) => x.key === v);
                      form.setFieldValue(['conditions', f.name], {
                        field: v,
                        op: d.ops[0],
                        value: d.type === 'wait' ? 30 : d.type === 'number' ? 0 : d.type === 'enum' ? d.options[0] : d.type === 'bool' ? undefined : '',
                      });
                    }}
                    aria-label="Condition field"
                  />
                </Form.Item>
                <Form.Item name={[f.name, 'op']} noStyle rules={[{ required: true }]}>
                  <Select
                    options={(def?.ops || []).map((o) => ({ value: o, label: cat.operators[o] }))}
                    placeholder="Operator"
                    aria-label="Operator"
                  />
                </Form.Item>
                <Form.Item name={[f.name, 'value']} noStyle>
                  <ValueInput field={def} aria-label="Value" />
                </Form.Item>
                <Button icon={<DeleteOutlined />} onClick={() => remove(f.name)} aria-label="Remove condition" />
              </div>
              {def?.help && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>{def.help}</Typography.Text>
              )}
              </div>
            );
          })}
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={() => add({ field: 'page.url', op: 'contains', value: '' })}
            style={{ width: 'fit-content' }}
          >
            Add condition
          </Button>
        </Space>
      )}
    </Form.List>
  );
}

function SenderFields({ name }) {
  return (
    <Row gutter={8}>
      <Col xs={24} md={12}>
        <Form.Item name={[name, 'agentName']} label="Agent display name" extra="Leave blank to use widget default">
          <Input maxLength={60} placeholder="e.g. Support Bot" />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item
          name={[name, 'avatarUrl']}
          label="Avatar URL (HTTPS)"
          rules={[{ pattern: /^(https:\/\/.+)?$/, message: 'Must start with https://' }]}
        >
          <Input placeholder="https://.../bot.jpg" />
        </Form.Item>
      </Col>
    </Row>
  );
}

function ActionFields({ name, type, replies, members, webhooks }) {
  switch (type) {
    case 'send_message':
      return (
        <>
          <Form.Item
            name={[name, 'text']}
            label="Message text"
            rules={[{ required: true, message: 'Enter message text' }]}
            extra="Variables: {{visitor.name}}, {{store.name}}"
          >
            <Input.TextArea rows={3} maxLength={2000} placeholder="Type the automated response..." />
          </Form.Item>
          <Form.Item
            name={[name, 'suggestedReplies']}
            label="Suggested reply buttons"
            extra="Up to 5 options. Press Enter after each."
          >
            <Select mode="tags" open={false} maxCount={5} placeholder="e.g. Yes, Need help, Track order" />
          </Form.Item>
          <SenderFields name={name} />
        </>
      );
    case 'send_saved_reply':
      return (
        <>
          <Form.Item name={[name, 'savedReplyId']} label="Saved reply" rules={[{ required: true }]}>
            <Select
              options={replies.filter((r) => r.access !== 'PRIVATE').map((r) => ({ value: r.id, label: `/${r.shortcut} - ${r.title}` }))}
              notFoundContent="No team (public) saved replies - private ones can't be used by triggers"
            />
          </Form.Item>
          <SenderFields name={name} />
        </>
      );
    case 'show_contact_form':
      return (
        <>
          <Form.Item name={[name, 'text']} label="Intro text above form">
            <Input.TextArea rows={2} maxLength={500} placeholder="Leave your details and we will get back to you shortly." />
          </Form.Item>
          <Form.Item name={[name, 'fields']} label="Required fields" rules={[{ required: true }]}>
            <Select mode="multiple" options={['name', 'email', 'phone'].map((k) => ({ value: k, label: k }))} />
          </Form.Item>
          <SenderFields name={name} />
        </>
      );
    case 'assign':
      return (
        <>
          <Form.Item name={[name, 'mode']} label="Assignment strategy">
            <Radio.Group
              options={[
                { value: 'auto', label: 'Least busy online agent (round-robin)' },
                { value: 'agent', label: 'Specific agent' },
              ]}
            />
          </Form.Item>
          <Form.Item noStyle shouldUpdate>
            {({ getFieldValue }) =>
              getFieldValue(['actions', name, 'mode']) === 'agent' && (
                <Form.Item name={[name, 'agentId']} label="Select agent" rules={[{ required: true }]}>
                  <Select options={members.map((m) => ({ value: m.userId, label: m.name }))} />
                </Form.Item>
              )
            }
          </Form.Item>
        </>
      );
    case 'add_tags':
      return (
        <Form.Item name={[name, 'tags']} label="Tags to add" rules={[{ required: true }]}>
          <Select mode="tags" open={false} placeholder="Enter tags and press Enter" />
        </Form.Item>
      );
    case 'set_priority':
      return (
        <Form.Item name={[name, 'priority']} label="Set priority to" rules={[{ required: true }]}>
          <Select options={['LOW', 'NORMAL', 'HIGH', 'URGENT'].map((p) => ({ value: p, label: p }))} />
        </Form.Item>
      );
    case 'notify':
      return (
        <>
          <Row gutter={8}>
            <Col xs={24} md={12}>
              <Form.Item name={[name, 'target']} label="Recipient target">
                <Select
                  options={[
                    { value: 'all_agents', label: 'All store team members' },
                    { value: 'online_agents', label: 'Currently online agents' },
                    { value: 'assignee', label: 'Assigned agent only' },
                    { value: 'admins', label: 'Store owners & admins' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name={[name, 'channels']} label="Delivery channels" rules={[{ required: true }]}>
                <Select
                  mode="multiple"
                  options={[
                    { value: 'dashboard', label: 'Dashboard alert' },
                    { value: 'email', label: 'Email notification (needs SMTP)' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name={[name, 'text']} label="Notification content" rules={[{ required: true }]}>
            <Input maxLength={500} placeholder="Notification text..." />
          </Form.Item>
        </>
      );
    case 'webhook':
      return (
        <Form.Item
          name={[name, 'webhookId']}
          label="Approved Webhook Endpoint"
          rules={[{ required: true }]}
          extra="Endpoints must be pre-registered under Store Settings → Webhooks."
        >
          <Select
            options={webhooks.map((w) => ({
              value: w.id,
              label: `${w.name} (${w.url})`,
              disabled: !w.enabled,
            }))}
            notFoundContent="No webhooks registered"
          />
        </Form.Item>
      );
    default:
      return <Typography.Text type="danger">Unsupported action type.</Typography.Text>;
  }
}

const ACTION_DEFAULTS = {
  send_message: { text: '', suggestedReplies: [] },
  send_saved_reply: {},
  show_contact_form: { text: 'Leave your details and we will get back to you.', fields: ['name', 'email'] },
  assign: { mode: 'auto' },
  add_tags: { tags: [] },
  set_priority: { priority: 'HIGH' },
  notify: { target: 'all_agents', channels: ['dashboard'], text: '' },
  webhook: {},
};

function TriggerPreview({ cfg, actions, replies }) {
  const [extraMsgs, setExtraMsgs] = useState([]);

  const baseMsgs = useMemo(
    () =>
      (actions || []).flatMap((a, i) => {
        if (!a) return [];
        const sender = { senderName: a.agentName || cfg.agentName, senderAvatar: a.avatarUrl || cfg.avatarUrl };
        if (a.type === 'send_message') {
          return [
            {
              id: `p${i}`,
              senderType: 'BOT',
              ...sender,
              body: (a.text || '…').replace(/\{\{\s*visitor\.name\s*\}\}/g, 'Alex').replace(/\{\{\s*store\.name\s*\}\}/g, 'Store'),
              meta: { suggestedReplies: a.suggestedReplies || [] },
              createdAt: new Date().toISOString(),
            },
          ];
        }
        if (a.type === 'send_saved_reply') {
          const r = replies.find((x) => x.id === a.savedReplyId);
          return r ? [{ id: `p${i}`, senderType: 'BOT', ...sender, body: r.body, createdAt: new Date().toISOString() }] : [];
        }
        if (a.type === 'show_contact_form') {
          return [
            {
              id: `p${i}`,
              senderType: 'BOT',
              ...sender,
              body: a.text || '',
              meta: { form: { fields: a.fields || ['email'] } },
              createdAt: new Date().toISOString(),
            },
          ];
        }
        return [];
      }),
    [actions, replies, cfg],
  );

  const allMsgs = [...baseMsgs, ...extraMsgs];

  return (
    <Card
      size="small"
      title={
        <Flex justify="space-between" align="center">
          <span style={{ fontWeight: 600, fontSize: 13 }}>Live Message Preview</span>
          {extraMsgs.length > 0 && (
            <Button size="small" icon={<ReloadOutlined />} onClick={() => setExtraMsgs([])}>
              Reset
            </Button>
          )}
        </Flex>
      }
      style={{ border: '1px solid #e2e8f0' }}
    >
      <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <ShadowPreview>
          <div style={{ height: 480, maxWidth: 360, margin: '0 auto' }}>
            <ChatWindow
              cfg={{ ...cfg, messages: { ...cfg.messages, greeting: '' }, size: { width: 360, height: 480 } }}
              open
              mode="chat"
              messages={allMsgs}
              layout={{ inline: true }}
              onSend={(text) => {
                setExtraMsgs((prev) => [
                  ...prev,
                  { id: `vis_${Date.now()}`, senderType: 'VISITOR', body: text, createdAt: new Date().toISOString() },
                ]);
              }}
              onContact={async (vals) => {
                setExtraMsgs((prev) => [
                  ...prev,
                  {
                    id: `sys_${Date.now()}`,
                    senderType: 'SYSTEM',
                    body: `Details submitted: ${Object.entries(vals)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(', ')}`,
                    createdAt: new Date().toISOString(),
                  },
                ]);
              }}
              canUpload={false}
            />
          </div>
        </ShadowPreview>
      </div>
      <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 10 }}>
        Non-message actions (assignee, priority, tags, webhooks, notifications) execute silently on the server.
      </Typography.Text>
    </Card>
  );
}

function TriggerEditor() {
  const { storeId } = useApp();
  const { id } = useParams();
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const { message } = App.useApp();
  const cat = useCatalog();
  const [form] = Form.useForm();
  const [kind, setKind] = useState(null);
  const [aux, setAux] = useState({ replies: [], members: [], webhooks: [], cfg: null });
  const [saving, setSaving] = useState(false);
  const values = Form.useWatch([], form);

  useEffect(() => {
    Promise.all([
      api(`/stores/${storeId}/saved-replies`),
      api(`/stores/${storeId}/members`),
      api(`/stores/${storeId}/webhooks`),
      api(`/stores/${storeId}/widget`),
    ])
      .then(([replies, members, wh, w]) => setAux({ replies, members, webhooks: wh.webhooks, cfg: w.published }))
      .catch((e) => showError(e, { message }));
  }, [storeId]);

  useEffect(() => {
    if (!cat) return;
    (async () => {
      let t;
      if (id && id !== 'new') t = await api(`/stores/${storeId}/triggers/${id}`);
      else if (sp.get('template')) {
        const tpl = cat.templates.find((x) => x.key === sp.get('template'));
        t = { ...tpl.trigger, name: tpl.name, description: tpl.description, enabled: true };
      } else t = sp.get('kind') === 'BASIC' ? { ...EMPTY_BASIC, name: '' } : { ...EMPTY_ADV, name: '' };
      setKind(t.kind);
      form.setFieldsValue(t.kind === 'BASIC' ? triggerToBasic(t) : t);
    })().catch((e) => showError(e, { message }));
  }, [cat, id]);

  async function save() {
    let v;
    try {
      v = await form.validateFields();
    } catch {
      return message.error('Please fix the highlighted fields');
    }
    const all = { ...form.getFieldsValue(true), ...v };
    const body =
      kind === 'BASIC'
        ? basicToTrigger(all)
        : { ...all, kind: 'ADVANCED', conditions: all.conditions || [], cooldownSeconds: all.cooldownSeconds || 0 };
    for (const k of [
      'id',
      'storeId',
      'version',
      'createdAt',
      'updatedAt',
      'stats',
      'urlContains',
      'homeOnly',
      'text',
      'agentName',
      'avatarUrl',
      'suggestedReplies',
    ])
      if (kind !== 'BASIC') delete body[k];
    setSaving(true);
    try {
      if (id && id !== 'new') await api(`/stores/${storeId}/triggers/${id}`, { method: 'PUT', body });
      else await api(`/stores/${storeId}/triggers`, { method: 'POST', body });
      message.success('Trigger saved successfully');
      nav('/triggers');
    } catch (e) {
      showError(e, { message, form });
    } finally {
      setSaving(false);
    }
  }

  function switchKind(k) {
    const v = form.getFieldsValue(true);
    if (k === 'ADVANCED') form.setFieldsValue(basicToTrigger({ ...v, text: v.text || '' }));
    else
      form.setFieldsValue(
        triggerToBasic({
          ...EMPTY_BASIC,
          ...v,
          actions: v.actions?.length ? v.actions : EMPTY_BASIC.actions,
          conditions: v.conditions || [],
        }),
      );
    setKind(k);
  }

  if (!cat || !kind || !aux.cfg) return <Spin fullscreen tip="Loading trigger editor..." />;
  const previewActions = kind === 'BASIC' ? basicToTrigger(values || {}).actions : values?.actions;

  return (
    <div>
      <div className="saas-page-header">
        <Flex align="center" gap={12}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => nav('/triggers')}>
            Back to Triggers
          </Button>
          <Typography.Title level={4} className="saas-page-title" style={{ margin: 0 }}>
            {id && id !== 'new' ? 'Edit Trigger' : 'New Trigger'}
          </Typography.Title>
        </Flex>
        <Space wrap>
          <Radio.Group
            value={kind}
            onChange={(e) => switchKind(e.target.value)}
            optionType="button"
            options={[
              { value: 'BASIC', label: 'Basic' },
              { value: 'ADVANCED', label: 'Advanced' },
            ]}
          />
          <Button type="primary" onClick={save} loading={saving}>
            Save trigger
          </Button>
        </Space>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left Side: Builder Form */}
        <Col xs={24} xl={14}>
          <Form form={form} layout="vertical" requiredMark="optional">
            {/* Step 1: Details */}
            <Card
              title={
                <Flex align="center" gap={8}>
                  <Tag color="blue" bordered={false}>1</Tag>
                  <span>General Information</span>
                </Flex>
              }
              size="small"
            >
              <Row gutter={12}>
                <Col xs={24} md={16}>
                  <Form.Item name="name" label="Trigger name" rules={[{ required: true, message: 'Name your trigger' }]}>
                    <Input maxLength={80} placeholder="e.g. Proactive Checkout Assistance" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="enabled" label="Active status" valuePropName="checked">
                    <Switch checkedChildren="Active" unCheckedChildren="Disabled" />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item name="description" label="Internal description (optional)">
                    <Input maxLength={300} placeholder="Explain when and why this trigger executes..." />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {kind === 'BASIC' ? (
              <Card
                title={
                  <Flex align="center" gap={8}>
                    <Tag color="blue" bordered={false}>2</Tag>
                    <span>Proactive Delivery Settings</span>
                  </Flex>
                }
                size="small"
                style={{ marginTop: 16 }}
              >
                <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>
                  Automatically sends an inviting chat message to visitors browsing your storefront who have not started a conversation yet.
                </Typography.Paragraph>
                <Row gutter={12}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="delaySeconds"
                      label="Time on page before sending"
                      rules={[{ required: true }]}
                    >
                      <DurationInput max={3600} aria-label="Time on page before sending" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="urlContains" label="Target URL contains">
                      <Input placeholder="optional, e.g. /products" />
                    </Form.Item>
                    <Form.Item name="homeOnly" valuePropName="checked" style={{ marginTop: -8 }}>
                      <Checkbox>Home page only</Checkbox>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="frequency" label="Frequency limit">
                      <Select
                        options={cat.frequencies
                          .filter((f) => f.key !== 'ONCE_PER_CONVERSATION' && f.key !== 'EVERY_TIME')
                          .map((f) => ({ value: f.key, label: f.label }))}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item
                      name="text"
                      label="Message text"
                      rules={[{ required: true, message: 'Enter a message' }]}
                      extra="Variables: {{visitor.name}}, {{store.name}}"
                    >
                      <Input.TextArea rows={3} maxLength={2000} placeholder="Hi! Let us know if you have any questions..." />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item
                      name="suggestedReplies"
                      label="Quick reply suggestion buttons"
                      extra="Press Enter after each suggestion (up to 5 buttons)"
                    >
                      <Select mode="tags" open={false} maxCount={5} placeholder="e.g. Shipping info, Returns" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="agentName" label="Sender display name">
                      <Input maxLength={60} placeholder={aux.cfg.agentName} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="avatarUrl"
                      label="Sender avatar URL (HTTPS)"
                      rules={[{ pattern: /^(https:\/\/.+)?$/, message: 'Must start with https://' }]}
                    >
                      <Input placeholder="https://..." />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            ) : (
              <>
                {/* Step 2: Event & Delay */}
                <Card
                  title={
                    <Flex align="center" gap={8}>
                      <Tag color="blue" bordered={false}>2</Tag>
                      <span>Trigger Event & Frequency</span>
                    </Flex>
                  }
                  size="small"
                  style={{ marginTop: 16 }}
                >
                  <Row gutter={12}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="event"
                        label="Trigger Event"
                        rules={[{ required: true }]}
                        extra={cat.events.find((e) => e.key === values?.event)?.help}
                      >
                        <Select
                          options={cat.events.map((e) => ({ value: e.key, label: e.label }))}
                          onChange={(ev) => {
                            // Keep "Timer starts from" valid for the new event (falls back to the event itself).
                            const tf = (cat.timerFrom || []).find((x) => x.key === form.getFieldValue('timerFrom'));
                            if (tf && !tf.events.includes(ev)) form.setFieldValue('timerFrom', 'EVENT');
                          }}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={12} md={6}>
                      <Form.Item
                        name="delaySeconds"
                        label="Delay"
                        extra={(values?.timerFrom || 'EVENT') === 'EVENT' ? 'Conditions re-checked upon expiry' : 'Time without a new message before the actions run'}
                        rules={[{
                          validator: (_, v) => ((form.getFieldValue('timerFrom') || 'EVENT') !== 'EVENT' && !(v > 0)
                            ? Promise.reject(new Error('Set a delay for this timer'))
                            : Promise.resolve()),
                        }]}
                        dependencies={['timerFrom']}
                      >
                        <DurationInput aria-label="Delay" />
                      </Form.Item>
                    </Col>
                    {(cat.timerFrom || []).length > 0 && (
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="timerFrom"
                          label="Timer starts from"
                          initialValue="EVENT"
                          extra={(cat.timerFrom.find((x) => x.key === (values?.timerFrom || 'EVENT')) || {}).help}
                        >
                          <Select
                            aria-label="Timer starts from"
                            options={cat.timerFrom.filter((x) => x.events.includes(values?.event)).map((x) => ({ value: x.key, label: x.label }))}
                          />
                        </Form.Item>
                      </Col>
                    )}
                    <Col xs={12} md={6}>
                      <Form.Item name="frequency" label="Frequency">
                        <Select options={cat.frequencies.map((f) => ({ value: f.key, label: f.label }))} />
                      </Form.Item>
                    </Col>
                    {values?.frequency === 'EVERY_TIME' && (
                      <Col xs={12} md={6}>
                        <Form.Item name="cooldownSeconds" label="Cooldown window">
                          <DurationInput max={2592000} aria-label="Cooldown window" />
                        </Form.Item>
                      </Col>
                    )}
                  </Row>
                </Card>

                {/* Step 3: Conditions */}
                <Card
                  size="small"
                  style={{ marginTop: 16 }}
                  title={
                    <Flex justify="space-between" align="center">
                      <Flex align="center" gap={8}>
                        <Tag color="blue" bordered={false}>3</Tag>
                        <span>Filter Conditions</span>
                      </Flex>
                      <Form.Item name="match" noStyle>
                        <Radio.Group
                          size="small"
                          optionType="button"
                          options={[
                            { value: 'ALL', label: 'Match ALL conditions' },
                            { value: 'ANY', label: 'Match ANY condition' },
                          ]}
                        />
                      </Form.Item>
                    </Flex>
                  }
                >
                  <Conditions cat={cat} form={form} />
                  {!(values?.conditions || []).length && (
                    <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0, fontSize: 12 }}>
                      No conditions configured — executes immediately on every matching event occurrence.
                    </Typography.Paragraph>
                  )}
                </Card>

                {/* Step 4: Actions */}
                <Card
                  title={
                    <Flex align="center" gap={8}>
                      <Tag color="blue" bordered={false}>4</Tag>
                      <span>Automated Actions Sequence</span>
                    </Flex>
                  }
                  size="small"
                  style={{ marginTop: 16 }}
                >
                  <Form.List
                    name="actions"
                    rules={[
                      {
                        validator: (_, v) =>
                          v?.length ? Promise.resolve() : Promise.reject(new Error('Add at least one action')),
                      },
                    ]}
                  >
                    {(fields, { add, remove }, { errors }) => (
                      <>
                        {fields.map((f, i) => (
                          <div key={f.key} className="action-card">
                            <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
                              <Flex align="center" gap={8}>
                                <Tag color="blue" style={{ fontWeight: 600 }}>Step {i + 1}</Tag>
                                <Form.Item name={[f.name, 'type']} noStyle>
                                  <Select
                                    style={{ width: 280 }}
                                    options={cat.actions.map((a) => ({
                                      value: a.key,
                                      label: a.label + (a.needsConversation ? ' (requires chat)' : ''),
                                    }))}
                                    onChange={(t) =>
                                      form.setFieldValue(['actions', f.name], {
                                        type: t,
                                        ...ACTION_DEFAULTS[t],
                                      })
                                    }
                                    aria-label="Action type"
                                  />
                                </Form.Item>
                              </Flex>
                              <Button
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => remove(f.name)}
                                aria-label="Remove action"
                              />
                            </Flex>
                            <ActionFields name={f.name} type={values?.actions?.[f.name]?.type} {...aux} />
                          </div>
                        ))}
                        <Form.ErrorList errors={errors} />
                        {fields.length < 10 && (
                          <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={() => add({ type: 'send_message', ...ACTION_DEFAULTS.send_message })}
                            style={{ width: 'fit-content', marginTop: 4 }}
                          >
                            Add another action
                          </Button>
                        )}
                      </>
                    )}
                  </Form.List>
                </Card>
              </>
            )}
          </Form>
        </Col>

        {/* Right Side: Sticky Live Preview */}
        <Col xs={24} xl={10}>
          <div style={{ position: 'sticky', top: 76 }}>
            <TriggerPreview cfg={aux.cfg} actions={previewActions} replies={aux.replies} />
          </div>
        </Col>
      </Row>
    </div>
  );
}

// --------------------------------------------------------------------------
// 3. Trigger Execution Logs
// --------------------------------------------------------------------------

function TriggerLogs() {
  const { storeId } = useApp();
  const { message } = App.useApp();
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();
  const [rows, setRows] = useState(null);
  const [triggers, setTriggers] = useState([]);
  const triggerId = sp.get('trigger') || undefined;
  const status = sp.get('status') || undefined;

  const load = () => {
    setRows(null);
    const p = new URLSearchParams({ limit: '200', ...(triggerId ? { triggerId } : {}), ...(status ? { status } : {}) });
    api(`/stores/${storeId}/trigger-logs?${p}`).then(setRows).catch((e) => showError(e, { message }));
  };

  useEffect(() => {
    load();
  }, [storeId, triggerId, status]);

  useEffect(() => {
    api(`/stores/${storeId}/triggers`).then(setTriggers).catch(() => {});
  }, [storeId]);

  const set = (k, v) => {
    const n = new URLSearchParams(sp);
    if (v) n.set(k, v);
    else n.delete(k);
    setSp(n);
  };

  return (
    <>
      <div className="saas-page-header">
        <Flex align="center" gap={12}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => nav('/triggers')}>
            Back to Triggers
          </Button>
          <div>
            <Typography.Title level={4} className="saas-page-title" style={{ margin: 0 }}>
              Execution Audit Logs
            </Typography.Title>
            <Typography.Text type="secondary" className="saas-page-subtitle">
              Detailed audit trail of all trigger conditions evaluations and action execution results.
            </Typography.Text>
          </div>
        </Flex>

        <Space wrap>
          <Select
            allowClear
            placeholder="All triggers"
            value={triggerId}
            onChange={(v) => set('trigger', v)}
            style={{ minWidth: 220 }}
            options={triggers.map((t) => ({ value: t.id, label: t.name }))}
          />
          <Select
            allowClear
            placeholder="Any status"
            value={status}
            onChange={(v) => set('status', v)}
            style={{ minWidth: 150 }}
            options={Object.keys(EXEC_COLOR).map((s) => ({ value: s, label: s }))}
          />
          <Button icon={<ReloadOutlined />} onClick={load}>
            Refresh
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        loading={!rows}
        dataSource={rows || []}
        size="small"
        scroll={{ x: 900 }}
        pagination={{ pageSize: 50, hideOnSinglePage: true }}
        expandable={{
          expandedRowRender: (r) => (
            <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 6 }}>
              <Descriptions
                size="small"
                column={1}
                bordered
                items={[
                  {
                    label: 'Conditions Evaluated',
                    children: r.details?.conditions?.length ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {r.details.conditions.map((c, i) => (
                          <Flex key={i} align="center" gap={6}>
                            {c.pass ? (
                              <CheckCircleOutlined style={{ color: '#10b981' }} />
                            ) : (
                              <CloseCircleOutlined style={{ color: '#ef4444' }} />
                            )}
                            <span style={{ fontWeight: 500 }}>
                              {c.field} {c.op} {String(c.value ?? '')}
                            </span>
                            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                              (actual: {JSON.stringify(c.actual)})
                            </Typography.Text>
                          </Flex>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>None evaluated</span>
                    ),
                  },
                  {
                    label: 'Actions Executed',
                    children: r.details?.actions?.length ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {r.details.actions.map((a, i) => (
                          <Flex key={i} align="center" gap={6}>
                            <Tag
                              color={a.status === 'done' ? 'green' : a.status === 'failed' ? 'red' : 'default'}
                              style={{ margin: 0, fontSize: 11 }}
                            >
                              {a.status}
                            </Tag>
                            <span style={{ fontWeight: 500 }}>{a.type}</span>
                            <span style={{ color: '#64748b' }}>{a.reason || a.error || a.emailNote || ''}</span>
                          </Flex>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>Not run</span>
                    ),
                  },
                  { label: 'Conversation ID', children: r.conversationId || '-' },
                  { label: 'Visitor ID', children: r.visitorId || '-' },
                ]}
              />
            </div>
          ),
        }}
        columns={[
          {
            title: 'Timestamp',
            dataIndex: 'createdAt',
            width: 150,
            render: (d) => dayjs(d).format('MMM D, HH:mm:ss'),
          },
          {
            title: 'Trigger',
            render: (_, r) => <span style={{ fontWeight: 500 }}>{r.trigger?.name}</span>,
          },
          { title: 'Event', dataIndex: 'event' },
          {
            title: 'Status',
            dataIndex: 'status',
            width: 120,
            render: (s) => (
              <Tag color={EXEC_COLOR[s]} bordered={false} style={{ fontWeight: 500 }}>
                {s}
              </Tag>
            ),
          },
          { title: 'Reason / Outcome', dataIndex: 'reason', render: (v) => v || '-' },
          {
            title: 'Scheduled For',
            dataIndex: 'scheduledFor',
            width: 150,
            render: (d) => (d ? dayjs(d).format('MMM D, HH:mm:ss') : '-'),
          },
          {
            title: 'Executed At',
            dataIndex: 'executedAt',
            width: 150,
            render: (d) => (d ? dayjs(d).format('MMM D, HH:mm:ss') : '-'),
          },
        ]}
      />
    </>
  );
}

export default function Triggers() {
  return (
    <Routes>
      <Route index element={<TriggerList />} />
      <Route path="logs" element={<TriggerLogs />} />
      <Route path=":id" element={<TriggerEditor />} />
      <Route path="new" element={<TriggerEditor />} />
    </Routes>
  );
}
