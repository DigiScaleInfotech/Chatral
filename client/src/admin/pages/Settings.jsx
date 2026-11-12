import { useEffect, useState } from 'react';
import {
  App, Alert, Badge, Button, Card, Col, Flex, Form, Input, InputNumber,
  List, Modal, Popconfirm, Row, Select, Space, Spin, Switch, Table, Tabs,
  Tag, Tooltip, Typography,
} from 'antd';
import {
  CopyOutlined, CheckCircleFilled, CloseCircleFilled, ExclamationCircleFilled,
  ReloadOutlined, PlusOutlined, SettingOutlined, CodeOutlined, TeamOutlined,
  BellOutlined, ApiOutlined, SafetyCertificateOutlined, AuditOutlined,
  KeyOutlined, CheckOutlined, ShopOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { api, showError, ROLE_LABEL, TIMEZONE_OPTIONS } from '../api.js';
import { useApp } from '../main.jsx';

const copy = (text, message) =>
  navigator.clipboard.writeText(text).then(() => message.success('Copied to clipboard'));

// --------------------------------------------------------------------------
// 1. General Settings
// --------------------------------------------------------------------------

function General({ store, reload, can }) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => form.setFieldsValue(store), [store]);

  async function save() {
    const v = await form.validateFields();
    if (!can('OWNER')) {
      delete v.retentionDays;
      delete v.isActive;
    }
    setSaving(true);
    try {
      await api(`/stores/${store.id}`, { method: 'PATCH', body: v });
      message.success('Store settings saved');
      reload();
    } catch (e) {
      showError(e, { message, form });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card style={{ maxWidth: 680 }}>
      <Form form={form} layout="vertical" disabled={!can('ADMIN')}>
        <Form.Item name="name" label="Store Name" rules={[{ required: true, message: 'Store name is required' }]}>
          <Input maxLength={80} placeholder="e.g. Acme Online Store" />
        </Form.Item>

        <Form.Item
          name="timezone"
          label="Store Timezone"
          extra="Used to calculate report day boundaries and sets the default timezone for business hours."
        >
          <Select showSearch options={TIMEZONE_OPTIONS} />
        </Form.Item>

        <Form.Item
          name="retentionDays"
          label="Media Retention Period (Days)"
          extra="Uploaded files (images, videos, documents) are deleted automatically once a conversation has been inactive for this many days. Conversations and their text messages are kept. Owner only."
          rules={[{ required: true }]}
        >
          <InputNumber min={1} max={365} disabled={!can('OWNER')} style={{ width: 140 }} />
        </Form.Item>

        <Form.Item
          name="isActive"
          label="Store Active Status"
          valuePropName="checked"
          extra="When toggled off, the live chat widget will not load on customer storefronts. Owner only."
        >
          <Switch disabled={!can('OWNER')} checkedChildren="Active" unCheckedChildren="Paused" />
        </Form.Item>

        {can('ADMIN') && (
          <Button type="primary" onClick={save} loading={saving} style={{ marginTop: 8 }}>
            Save general settings
          </Button>
        )}
      </Form>
    </Card>
  );
}

// --------------------------------------------------------------------------
// 2. Installation & Storefront Embed
// --------------------------------------------------------------------------

function Installation({ store, reload, can }) {
  const { message, modal } = App.useApp();
  const [diag, setDiag] = useState(null);
  const [domains, setDomains] = useState(store.allowedOrigins);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const loadDiag = () =>
    api(`/stores/${store.id}/diagnostics`)
      .then(setDiag)
      .catch((e) => showError(e, { message }));

  useEffect(() => {
    loadDiag();
    setDomains(store.allowedOrigins);
  }, [store]);

  async function saveDomains() {
    try {
      await api(`/stores/${store.id}`, { method: 'PATCH', body: { allowedOrigins: domains } });
      message.success('Allowed domains updated');
      reload();
    } catch (e) {
      showError(e, { message });
    }
  }

  function rotate() {
    modal.confirm({
      title: 'Rotate Store Public Key?',
      content:
        'A new public key will be generated immediately. The old key will continue functioning for a 7-day grace period to allow you to update storefront snippets without downtime.',
      okText: 'Rotate Key',
      okType: 'danger',
      onOk: async () => {
        try {
          await api(`/stores/${store.id}/rotate-key`, { method: 'POST', body: { graceDays: 7 } });
          message.success('New key generated. Please update your storefront snippet.');
          reload();
        } catch (e) {
          showError(e, { message });
        }
      },
    });
  }

  const handleCopy = (text) => {
    copy(text, message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const handleCopyLink = (text) => {
    copy(text, message);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  if (!diag) return <Spin fullscreen tip="Checking installation..." />;

  return (
    <Row gutter={[20, 20]}>
      <Col xs={24} xl={14}>
        {/* Embed Snippet Card */}
        <Card
          title={
            <Flex justify="space-between" align="center">
              <span>Embed Code Snippet</span>
              <Button
                size="small"
                icon={copied ? <CheckOutlined style={{ color: '#10b981' }} /> : <CopyOutlined />}
                onClick={() => handleCopy(diag.snippet)}
              >
                {copied ? 'Copied' : 'Copy Snippet'}
              </Button>
            </Flex>
          }
        >
          <div
            style={{
              background: '#0b0f19',
              padding: 14,
              borderRadius: 6,
              border: '1px solid #1e293b',
              marginBottom: 16,
            }}
          >
            <Typography.Paragraph
              copyable={{ text: diag.snippet }}
              style={{
                margin: 0,
                color: '#f8fafc',
                fontFamily: 'monospace',
                fontSize: 12,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {diag.snippet}
            </Typography.Paragraph>
          </div>

          <Tabs
            size="small"
            items={[
              {
                key: 'html',
                label: 'Standard HTML Website',
                children: (
                  <Typography.Text type="secondary" style={{ fontSize: 13, lineHeight: 1.6, display: 'block' }}>
                    Paste the snippet code directly above the closing <code>&lt;/body&gt;</code> tag on every page where you want the live chat widget to appear. It loads asynchronously without blocking your page load.
                  </Typography.Text>
                ),
              },
              {
                key: 'shopify',
                label: 'Shopify Store',
                children: (
                  <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
                    <ol style={{ paddingLeft: 18, margin: '4px 0 0' }}>
                      <li>In Shopify Admin, navigate to <b>Online Store → Themes</b>.</li>
                      <li>Click the <b>⋯</b> button and select <b>Edit code</b>.</li>
                      <li>Under <code>Layout</code>, open <code>theme.liquid</code>.</li>
                      <li>Paste the embed code right above the closing <code>&lt;/body&gt;</code> tag and click <b>Save</b>.</li>
                      <li>Ensure both your custom domain and <code>yourshop.myshopify.com</code> are added to Allowed Domains below.</li>
                    </ol>
                  </div>
                ),
              },
            ]}
          />

          <div style={{ padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, marginTop: 16 }}>
            <Flex justify="space-between" align="center" wrap gap={8}>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Public Store Key</div>
                <code style={{ fontSize: 12, color: '#0f172a' }}>{store.publicKey}</code>
              </div>
              {can('OWNER') && (
                <Button size="small" danger icon={<KeyOutlined />} onClick={rotate}>
                  Rotate Key
                </Button>
              )}
            </Flex>
            {store.previousKeyExpires && dayjs(store.previousKeyExpires).isAfter(dayjs()) && (
              <Alert
                type="warning"
                showIcon
                style={{ marginTop: 12 }}
                message={`Old key active during grace period until ${dayjs(store.previousKeyExpires).format('MMM D, YYYY')}. Please update your site snippet before this date.`}
              />
            )}
          </div>

          <div style={{ padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, marginTop: 12 }}>
            <Flex justify="space-between" align="center" wrap gap={8}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Direct Chat Link</div>
                {diag.chatLink ? (
                  <code style={{ fontSize: 12, color: '#0f172a', wordBreak: 'break-all' }}>{diag.chatLink}</code>
                ) : (
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>Add an allowed domain below to get this link.</Typography.Text>
                )}
              </div>
              {diag.chatLink && (
                <Button
                  size="small"
                  icon={linkCopied ? <CheckOutlined style={{ color: '#10b981' }} /> : <CopyOutlined />}
                  onClick={() => handleCopyLink(diag.chatLink)}
                >
                  {linkCopied ? 'Copied' : 'Copy Link'}
                </Button>
              )}
            </Flex>
            <Typography.Paragraph type="secondary" style={{ fontSize: 12, margin: '8px 0 0' }}>
              Opens the chat automatically when visited - paste it as the URL of a "Chat with us" link, button, email signature or QR code. Unique to this store.
            </Typography.Paragraph>
          </div>
        </Card>

        {/* Allowed Domains Card */}
        <Card title="Allowed Website Domains" style={{ marginTop: 20 }}>
          <Typography.Paragraph type="secondary" style={{ fontSize: 13 }}>
            For security, only requests from these domains are allowed to load your widget and chat with visitors. Use <code>*.example.com</code> to allow subdomains. Leaving this empty is insecure.
          </Typography.Paragraph>
          <Select
            mode="tags"
            value={domains}
            onChange={setDomains}
            style={{ width: '100%' }}
            open={false}
            placeholder="e.g. example.com, store.example.com"
            tokenSeparators={[',', ' ']}
            disabled={!can('ADMIN')}
          />
          <Button
            type="primary"
            style={{ marginTop: 12 }}
            onClick={saveDomains}
            disabled={!can('ADMIN')}
          >
            Save allowed domains
          </Button>
        </Card>
      </Col>

      {/* Right Column: Diagnostics Checklist */}
      <Col xs={24} xl={10}>
        <Card
          title={
            <Flex justify="space-between" align="center">
              <span>Installation Health Check</span>
              <Button size="small" icon={<ReloadOutlined />} onClick={loadDiag}>
                Re-check
              </Button>
            </Flex>
          }
        >
          <List
            dataSource={diag.checks}
            renderItem={(c) => (
              <List.Item style={{ padding: '12px 0' }}>
                <List.Item.Meta
                  avatar={
                    c.ok ? (
                      <CheckCircleFilled style={{ color: '#10b981', fontSize: 18 }} />
                    ) : c.warn ? (
                      <ExclamationCircleFilled style={{ color: '#f59e0b', fontSize: 18 }} />
                    ) : (
                      <CloseCircleFilled style={{ color: '#ef4444', fontSize: 18 }} />
                    )
                  }
                  title={<span style={{ fontWeight: 500, fontSize: 13 }}>{c.label}</span>}
                  description={!c.ok && <span style={{ color: '#64748b', fontSize: 12 }}>{c.fix}</span>}
                />
              </List.Item>
            )}
          />
        </Card>
      </Col>
    </Row>
  );
}

// --------------------------------------------------------------------------
// 3. Team & Member Management
// --------------------------------------------------------------------------

function Team({ store, can, me }) {
  const { message } = App.useApp();
  const [rows, setRows] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form] = Form.useForm();

  const load = () =>
    api(`/stores/${store.id}/members`)
      .then(setRows)
      .catch((e) => showError(e, { message }));

  useEffect(() => {
    load();
  }, [store.id]);


  async function add() {
    const v = await form.validateFields();
    try {
      await api(`/stores/${store.id}/members`, { method: 'POST', body: v });
      setAdding(false);
      form.resetFields();
      load();
      message.success('Team member added');
    } catch (e) {
      showError(e, { message, form });
    }
  }

  const act = (fn) =>
    fn()
      .then(load)
      .catch((e) => showError(e, { message }));

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Team Members & Agent Routing</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            Agents and their chat auto-assignment limits.
          </div>
        </div>
        {can('ADMIN') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAdding(true)}>
            Add member
          </Button>
        )}
      </div>

      <Table
        rowKey="userId"
        loading={!rows}
        dataSource={rows || []}
        pagination={false}
        scroll={{ x: 700 }}
        columns={[
          {
            title: 'Agent Name & Email',
            dataIndex: 'name',
            render: (n, m) => (
              <Flex align="center" gap={10}>
                <div>
                  <div style={{ fontWeight: 600 }}>{n}</div>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {m.email}
                  </Typography.Text>
                </div>
              </Flex>
            ),
          },
          {
            title: 'Role',
            dataIndex: 'role',
            render: (r) => <Tag color={r === 'OWNER' ? 'blue' : 'default'} bordered={false}>{ROLE_LABEL[r]}</Tag>,
          },
          {
            title: 'Max Chats',
            dataIndex: 'maxChats',
            render: (v, m) =>
              can('ADMIN') ? (
                <InputNumber
                  size="small"
                  min={1}
                  max={100}
                  defaultValue={v}
                  onBlur={(e) =>
                    Number(e.target.value) !== v &&
                    act(() =>
                      api(`/stores/${store.id}/members/${m.userId}`, {
                        method: 'PATCH',
                        body: { maxChats: Number(e.target.value) },
                      }),
                    )
                  }
                />
              ) : (
                v
              ),
          },
          {
            title: '',
            render: (_, m) =>
              can('ADMIN') &&
              m.userId !== me.id && (
                <Popconfirm
                  title={`Remove ${m.name} from this store?`}
                  description="Their open conversations will become unassigned."
                  okText="Remove"
                  onConfirm={() =>
                    act(() => api(`/stores/${store.id}/members/${m.userId}`, { method: 'DELETE' }))
                  }
                >
                  <Button size="small" danger>
                    Remove
                  </Button>
                </Popconfirm>
              ),
          },
        ]}
      />

      <Modal open={adding} title="Add Team Member" onOk={add} onCancel={() => setAdding(false)} okText="Add member" destroyOnClose centered width={460}>
        <Form form={form} layout="vertical" initialValues={{ role: 'AGENT', maxChats: 10 }} style={{ marginTop: 12 }}>
          <Form.Item name="email" label="User Email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="name@company.com" />
          </Form.Item>
          <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 6, marginBottom: 16, fontSize: 12, color: '#64748b' }}>
            If this user has no account yet, enter their name and initial password to register them automatically.
          </div>
          <Form.Item name="name" label="Full Name (for new user)">
            <Input maxLength={80} placeholder="e.g. Sarah Connor" />
          </Form.Item>
          <Form.Item name="password" label="Initial Password (for new user)" rules={[{ min: 10, message: 'Must be at least 10 characters' }]}>
            <Input.Password autoComplete="new-password" placeholder="••••••••••••" />
          </Form.Item>
          <Form.Item name="role" hidden><Input /></Form.Item>
          <Typography.Paragraph type="secondary">They join as an <b>Agent</b> (answers chats and tickets).</Typography.Paragraph>
          <Form.Item name="maxChats" label="Simultaneous chat limit (for round-robin auto-assign)">
            <InputNumber min={1} max={100} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

/** Email setup, who receives alerts, and what happened to recent notification emails (no message bodies). */
function EmailStatus({ storeId }) {
  const [st, setSt] = useState(null);
  const [err, setErr] = useState(null);
  const load = () => api(`/stores/${storeId}/email/status`).then(setSt).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, [storeId]);
  if (err) return <Alert type="error" showIcon message={`Email status unavailable: ${err}`} style={{ marginBottom: 20 }} />;
  if (!st) return null;
  const COLOR = { sent: 'green', failed: 'red', retrying: 'orange', queued: 'blue', sending: 'blue', cancelled: 'default' };
  return (
    <Card title="Email delivery" style={{ marginBottom: 20 }} extra={<Button size="small" icon={<ReloadOutlined />} onClick={load} aria-label="Refresh email status" />}>
      {st.configured ? (
        <Alert type="success" showIcon style={{ marginBottom: 12 }} message={`Email is configured (${st.source === 'store' ? "this store's SMTP" : 'platform SMTP'}), sending from ${st.from}. Use “Send test email” below to confirm delivery.`} />
      ) : (
        <Alert type="warning" showIcon style={{ marginBottom: 12 }} message="No email is being sent: SMTP is not configured"
          description="Add SMTP below (host, port, security, username, password, from address) or set SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS and SMTP_FROM on the server and restart it. Until then new-chat and offline-message alerts are skipped (the server log says so)." />
      )}
      <Typography.Text strong>New-chat / offline-message alerts go to</Typography.Text>
      <div style={{ margin: '6px 0 12px' }}>
        {st.recipients.length ? st.recipients.map((e) => <Tag key={e} color={st.undeliverable.includes(e) ? 'red' : undefined} style={{ marginBottom: 4 }}>{e}</Tag>) : <Typography.Text type="secondary">Nobody - turn on “Email me” for a team member or add notification emails below.</Typography.Text>}
        {st.undeliverable.length > 0 && (
          <Alert type="warning" showIcon style={{ marginTop: 8 }} message="Some recipients are test addresses that can't receive mail"
            description="Addresses like …@example.test are placeholders. Add a real address under Notification emails, or change those team members' emails." />
        )}
        {!st.newChat && !st.offlineMessage && <Typography.Text type="secondary"> (both alerts are turned off)</Typography.Text>}
      </div>
      <Typography.Text strong>Recent notification emails</Typography.Text>
      <Table size="small" rowKey="id" style={{ marginTop: 6 }} pagination={false} dataSource={st.deliveries} scroll={{ x: 520 }}
        locale={{ emptyText: 'No notification emails yet' }}
        columns={[
          { title: 'When', dataIndex: 'at', width: 140, render: (v) => dayjs(v).format('MMM D, HH:mm') },
          { title: 'Subject', dataIndex: 'subject', ellipsis: true },
          { title: 'Recipients', dataIndex: 'to', width: 90, render: (to) => to.length },
          { title: 'Status', dataIndex: 'status', width: 110, render: (v, r) => <Tooltip title={r.error || (v === 'sent' ? 'Accepted by the mail server' : null)}><Tag color={COLOR[v]}>{v}</Tag></Tooltip> },
        ]} />
    </Card>
  );
}

/** Sends a real email through the saved SMTP; success only when the mail server accepted it. */
function TestEmail({ storeId }) {
  const { message } = App.useApp();
  const [to, setTo] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  async function send() {
    setBusy(true);
    setResult(null);
    try {
      await api(`/stores/${storeId}/email/test`, { method: 'POST', body: { to } });
      setResult({ type: 'success', text: `The mail server accepted the test email for ${to}. Check that inbox (and spam).` });
    } catch (e) {
      setResult({ type: 'error', text: e.message });
      showError(e, { message });
    } finally {
      setBusy(false);
    }
  }
  return (
    <div style={{ marginTop: 16 }}>
      <Typography.Text strong>Send test email</Typography.Text>
      <Space.Compact style={{ width: '100%', marginTop: 6 }}>
        <Input placeholder="you@example.com" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Test email recipient" />
        <Button onClick={send} loading={busy} disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim())}>Send test</Button>
      </Space.Compact>
      {result && <Alert style={{ marginTop: 8 }} type={result.type} showIcon message={result.text} />}
    </div>
  );
}

// --------------------------------------------------------------------------
// 4. Notifications & SMTP
// --------------------------------------------------------------------------

function Notifications({ store, reload, can, me }) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [smtpForm] = Form.useForm();
  const mine = me.memberships.find((m) => m.storeId === store.id);
  const [myEmail, setMyEmail] = useState(null);

  useEffect(() => {
    form.setFieldsValue(store);
  }, [store]);

  useEffect(() => {
    if (mine)
      api(`/stores/${store.id}/members`)
        .then((rows) => setMyEmail(rows.find((r) => r.userId === me.id)?.emailNotify ?? true))
        .catch(() => {});
  }, [store.id]);

  const save = async (body, f) => {
    try {
      await api(`/stores/${store.id}`, { method: 'PATCH', body });
      message.success('Notification settings saved');
      reload();
    } catch (e) {
      showError(e, { message, form: f });
    }
  };

  return (
    <Row gutter={[20, 20]}>
      <Col xs={24} lg={12}>
        <EmailStatus storeId={store.id} />
        <Card title="Store Email Alerts">
          <Form form={form} layout="vertical" disabled={!can('ADMIN')}>
            <Form.Item name="emailOnNewChat" label="Notify team when a new conversation starts" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="emailOnOffline" label="Notify team when an offline contact message arrives" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item
              name="notifyEmails"
              label="Additional recipient emails"
              extra="In addition to team members with active notifications"
            >
              <Select mode="tags" open={false} tokenSeparators={[',', ' ']} placeholder="ops@company.com" />
            </Form.Item>
            <Button type="primary" onClick={async () => save(await form.validateFields(), form)}>
              Save store email settings
            </Button>
          </Form>
        </Card>

        {mine && myEmail !== null && (
          <Card title="Personal Notification Preference" style={{ marginTop: 20 }}>
            <Flex align="center" gap={12}>
              <Switch
                checked={myEmail}
                onChange={(v) =>
                  api(`/stores/${store.id}/me`, { method: 'PATCH', body: { emailNotify: v } })
                    .then(() => {
                      setMyEmail(v);
                      message.success('Personal notification preference updated');
                    })
                    .catch((e) => showError(e, { message }))
                }
              />
              <span style={{ fontSize: 13, color: '#0f172a' }}>Email me about new inbound chats in this store</span>
            </Flex>
          </Card>
        )}
      </Col>

      <Col xs={24} lg={12}>
        <Card
          title="Custom SMTP Server"
          extra={
            store.hasOwnSmtp ? (
              <Tag color="green" bordered={false}>Custom SMTP Configured</Tag>
            ) : (
              <Tag bordered={false}>Using Platform SMTP</Tag>
            )
          }
        >
          <Typography.Paragraph type="secondary" style={{ fontSize: 12 }}>
            Dispatch customer-facing and agent emails from your company's own mail server. Passwords are encrypted at rest.
          </Typography.Paragraph>
          <Form form={smtpForm} layout="vertical" disabled={!can('ADMIN')} initialValues={{ port: 465, secure: true }}>
            <Row gutter={10}>
              <Col span={16}>
                <Form.Item name="host" label="Host" rules={[{ required: true }]}>
                  <Input placeholder="smtp.mailgun.org" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="port" label="Port" rules={[{ required: true }]}>
                  <InputNumber min={1} max={65535} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="user" label="Username" rules={[{ required: true }]}>
                  <Input autoComplete="off" placeholder="postmaster@domain" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="pass" label="Password" rules={[{ required: true }]}>
                  <Input.Password autoComplete="new-password" placeholder="••••••••••••" />
                </Form.Item>
              </Col>
              <Col span={16}>
                <Form.Item name="from" label="Sender 'From' address">
                  <Input placeholder='"Acme Support" <support@acme.com>' />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="secure" label="TLS / SSL" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
            <Space>
              <Button type="primary" onClick={async () => save({ smtp: await smtpForm.validateFields() }, smtpForm)}>
                Save SMTP
              </Button>
              {store.hasOwnSmtp && (
                <Popconfirm title="Remove custom store SMTP?" onConfirm={() => save({ smtp: null })}>
                  <Button danger>Revert to Platform SMTP</Button>
                </Popconfirm>
              )}
            </Space>
            <TestEmail storeId={store.id} />
          </Form>
        </Card>
      </Col>
    </Row>
  );
}

// --------------------------------------------------------------------------
// 5. Webhooks & Integrations
// --------------------------------------------------------------------------

function Webhooks({ store }) {
  const { message, modal } = App.useApp();
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const load = () =>
    api(`/stores/${store.id}/webhooks`)
      .then(setData)
      .catch((e) => showError(e, { message }));

  useEffect(() => {
    load();
  }, [store.id]);

  async function save() {
    const v = await form.validateFields();
    try {
      if (editing.id) await api(`/stores/${store.id}/webhooks/${editing.id}`, { method: 'PUT', body: v });
      else {
        const r = await api(`/stores/${store.id}/webhooks`, { method: 'POST', body: v });
        modal.success({
          title: 'Webhook Registered Successfully',
          width: 520,
          content: (
            <div>
              <Typography.Paragraph type="secondary">
                Signing Secret (shown once — store it securely in your environment):
              </Typography.Paragraph>
              <Input.TextArea readOnly autoSize value={r.secret} style={{ fontFamily: 'monospace' }} />
              <Typography.Paragraph style={{ marginTop: 12, fontSize: 12 }}>
                Verify incoming requests using <code>X-Livechat-Signature</code> = <code>sha256=HMAC_SHA256(secret, timestamp + "." + body)</code>.
              </Typography.Paragraph>
            </div>
          ),
        });
      }
      setEditing(null);
      load();
    } catch (e) {
      showError(e, { message, form });
    }
  }

  if (!data) return <Spin fullscreen tip="Loading webhooks..." />;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Registered Webhook Endpoints</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            Only endpoints defined here can receive real-time event payloads or be invoked by automated triggers.
          </div>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.setFieldsValue({ name: '', url: '', events: [], enabled: true });
            setEditing({});
          }}
        >
          Add webhook
        </Button>
      </div>

      <Table
        rowKey="id"
        dataSource={data.webhooks}
        pagination={false}
        scroll={{ x: 800 }}
        locale={{ emptyText: 'No webhook endpoints registered' }}
        expandable={{
          expandedRowRender: (w) => (
            <div style={{ padding: 10, background: '#f8fafc', borderRadius: 6 }}>
              <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6 }}>Recent Deliveries Log</div>
              <Table
                size="small"
                rowKey="id"
                pagination={false}
                dataSource={w.deliveries}
                locale={{ emptyText: 'No recent deliveries logged' }}
                columns={[
                  { title: 'Time', dataIndex: 'createdAt', render: (d) => dayjs(d).format('MMM D, HH:mm:ss') },
                  { title: 'Event', dataIndex: 'event' },
                  {
                    title: 'Outcome',
                    dataIndex: 'status',
                    render: (s) => (
                      <Tag color={s === 'SUCCESS' ? 'green' : 'red'} bordered={false}>
                        {s}
                      </Tag>
                    ),
                  },
                  { title: 'HTTP Status', dataIndex: 'httpStatus', render: (s) => (s ? <code>{s}</code> : '-') },
                  { title: 'Error', dataIndex: 'error', render: (e) => e || '-' },
                ]}
              />
            </div>
          ),
        }}
        columns={[
          { title: 'Name', dataIndex: 'name', render: (n) => <span style={{ fontWeight: 600 }}>{n}</span> },
          {
            title: 'Endpoint URL',
            dataIndex: 'url',
            render: (u) => (
              <code style={{ fontSize: 12, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>
                {u}
              </code>
            ),
          },
          {
            title: 'Subscribed Events',
            dataIndex: 'events',
            render: (e) =>
              e.length ? (
                <Space wrap size={4}>
                  {e.map((x) => (
                    <Tag key={x} bordered={false} style={{ fontSize: 11 }}>
                      {x}
                    </Tag>
                  ))}
                </Space>
              ) : (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Triggers only
                </Typography.Text>
              ),
          },
          {
            title: 'Enabled',
            dataIndex: 'enabled',
            render: (v) => (
              <Tag color={v ? 'green' : 'default'} bordered={false}>
                {v ? 'Active' : 'Disabled'}
              </Tag>
            ),
          },
          {
            title: '',
            render: (_, w) => (
              <Space>
                <Button
                  size="small"
                  onClick={() =>
                    api(`/stores/${store.id}/webhooks/${w.id}/test`, { method: 'POST' })
                      .then(() => {
                        message.info('Test payload queued - check deliveries in a moment');
                        setTimeout(load, 3000);
                      })
                      .catch((e) => showError(e, { message }))
                  }
                >
                  Test
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    form.setFieldsValue(w);
                    setEditing(w);
                  }}
                >
                  Edit
                </Button>
                <Popconfirm
                  title="Delete webhook?"
                  onConfirm={() =>
                    api(`/stores/${store.id}/webhooks/${w.id}`, { method: 'DELETE' })
                      .then(load)
                      .catch((e) => showError(e, { message }))
                  }
                >
                  <Button size="small" danger>
                    Delete
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Modal open={!!editing} title={editing?.id ? 'Edit Webhook Endpoint' : 'Register Webhook Endpoint'} onOk={save} onCancel={() => setEditing(null)} okText="Save endpoint" destroyOnClose centered width={520}>
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="name" label="Webhook Identifier Name" rules={[{ required: true }]}>
            <Input maxLength={80} placeholder="e.g. Order Support Sync" />
          </Form.Item>
          <Form.Item name="url" label="HTTPS Target URL" rules={[{ required: true, type: 'url' }]}>
            <Input placeholder="https://api.yourdomain.com/hooks/livechat" />
          </Form.Item>
          <Form.Item name="events" label="Subscribe to Automatic Events (Optional)">
            <Select mode="multiple" options={data.events.map((e) => ({ value: e, label: e }))} placeholder="Select events..." />
          </Form.Item>
          <Form.Item name="enabled" label="Enable Webhook" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

// --------------------------------------------------------------------------
// Integrations: Shopify (customer + last order in the inbox)
// --------------------------------------------------------------------------
function Integrations({ store }) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api(`/stores/${store.id}/integrations/shopify`).then((r) => { setState(r); form.setFieldsValue({ domain: r.domain || '' }); }).catch((e) => showError(e, { message }));
  }, [store.id]);

  async function save() {
    const v = await form.validateFields();
    setBusy(true);
    try {
      const r = await api(`/stores/${store.id}/integrations/shopify`, { method: 'PUT', body: { domain: v.domain, ...(v.token ? { token: v.token } : {}) } });
      setState(r);
      form.setFieldsValue({ token: '' });
      message.success('Shopify settings saved');
    } catch (e) {
      showError(e, { message, form });
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    try {
      const r = await api(`/stores/${store.id}/integrations/shopify/test`, { method: 'POST' });
      message.success(`Connected to ${r.name} (${r.domain})`);
    } catch (e) {
      showError(e, { message });
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    try {
      setState(await api(`/stores/${store.id}/integrations/shopify`, { method: 'PUT', body: { domain: null } }));
      form.setFieldsValue({ domain: '', token: '' });
      message.success('Shopify disconnected');
    } catch (e) {
      showError(e, { message });
    } finally {
      setBusy(false);
    }
  }

  if (!state) return <Spin />;
  return (
    <Card title="Shopify" style={{ maxWidth: 680 }} extra={state.connected ? <Tag color="green" bordered={false}>Connected</Tag> : <Tag bordered={false}>Not connected</Tag>}>
      <Typography.Paragraph type="secondary" style={{ fontSize: 13 }}>
        Shows the chatting customer's Shopify profile and last order in the inbox (matched by email). Create a custom app in your
        Shopify admin (Settings → Apps and sales channels → Develop apps) with the Admin API scopes <b>read_customers</b> and{' '}
        <b>read_orders</b>, install it, and paste its Admin API access token here. The token is stored encrypted and is never shown again.
      </Typography.Paragraph>
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item name="domain" label="Store domain" rules={[{ required: true, message: 'Enter your .myshopify.com domain' }]}>
          <Input placeholder="your-store.myshopify.com" autoComplete="off" />
        </Form.Item>
        <Form.Item name="token" label={state.connected ? 'Admin API access token (leave empty to keep the current one)' : 'Admin API access token'}
          rules={state.connected ? [] : [{ required: true, message: 'Paste the Admin API access token' }]}>
          <Input.Password placeholder="shpat_…" autoComplete="new-password" />
        </Form.Item>
        <Space wrap>
          <Button type="primary" onClick={save} loading={busy}>Save</Button>
          <Button onClick={test} disabled={!state.connected || busy}>Test connection</Button>
          {state.connected && <Popconfirm title="Disconnect Shopify?" onConfirm={disconnect}><Button danger disabled={busy}>Disconnect</Button></Popconfirm>}
        </Space>
      </Form>
    </Card>
  );
}

// --------------------------------------------------------------------------
// 6. Privacy & GDPR Compliance
// --------------------------------------------------------------------------

function Privacy({ store }) {
  const { message, modal } = App.useApp();
  const [vid, setVid] = useState('');

  async function exportV() {
    try {
      const res = await fetch(`/api/stores/${store.id}/visitors/${encodeURIComponent(vid.trim())}/export`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Export failed');
      const url = URL.createObjectURL(await res.blob());
      Object.assign(document.createElement('a'), { href: url, download: `visitor-${vid.trim()}.json` }).click();
      URL.revokeObjectURL(url);
      message.success('Visitor data export downloaded');
    } catch (e) {
      message.error(e.message);
    }
  }

  function erase() {
    modal.confirm({
      title: 'Permanently Erase Visitor Data?',
      okType: 'danger',
      okText: 'Erase Data',
      content:
        'All conversations, messages, and uploaded files for this visitor will be deleted permanently. This action is irreversible.',
      onOk: () =>
        api(`/stores/${store.id}/visitors/${encodeURIComponent(vid.trim())}`, { method: 'DELETE' })
          .then(() => {
            message.success('Visitor data deleted successfully');
            setVid('');
          })
          .catch((e) => showError(e, { message })),
    });
  }

  return (
    <Card style={{ maxWidth: 720 }}>
      <Typography.Title level={5} style={{ marginTop: 0 }}>
        Data Access & Erasure (GDPR / CCPA)
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ fontSize: 13 }}>
        Process privacy requests for any visitor. Copy the unique Visitor ID from the conversation details sidebar.
      </Typography.Paragraph>
      <Space.Compact style={{ width: '100%', marginTop: 8 }}>
        <Input
          placeholder="Paste visitor ID (e.g. 1a2b3c4d...)"
          value={vid}
          onChange={(e) => setVid(e.target.value)}
        />
        <Button disabled={!vid.trim()} onClick={exportV}>
          Export JSON
        </Button>
        <Button danger disabled={!vid.trim()} onClick={erase}>
          Erase Visitor
        </Button>
      </Space.Compact>
      <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0', marginTop: 20 }}>
        <Typography.Text type="secondary" style={{ fontSize: 12, lineHeight: 1.5, display: 'block' }}>
          <b>Privacy by Design:</b> Visitors are identified by a cryptographically random token stored in localStorage (only its one-way hash is recorded in the database). Visitor IP addresses are never retained. Uploaded media automatically purges based on your store retention policy; conversations and their text are kept.
        </Typography.Text>
      </div>
    </Card>
  );
}

// --------------------------------------------------------------------------
// 7. Store Audit Trail
// --------------------------------------------------------------------------

function Audit({ store }) {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    api(`/stores/${store.id}/audit`)
      .then(setRows)
      .catch(() => setRows([]));
  }, [store.id]);

  return (
    <Table
      rowKey="id"
      loading={!rows}
      dataSource={rows || []}
      size="small"
      pagination={{ pageSize: 50, hideOnSinglePage: true }}
      scroll={{ x: 700 }}
      columns={[
        {
          title: 'Timestamp',
          dataIndex: 'createdAt',
          width: 170,
          render: (d) => dayjs(d).format('MMM D, YYYY HH:mm:ss'),
        },
        {
          title: 'User / Actor',
          dataIndex: 'userName',
          width: 160,
          render: (u) => <span style={{ fontWeight: 500 }}>{u}</span>,
        },
        {
          title: 'Action',
          dataIndex: 'action',
          render: (a) => <Tag color="blue" bordered={false}>{a}</Tag>,
        },
        { title: 'Target Entity', dataIndex: 'target' },
        {
          title: 'Change Details',
          dataIndex: 'meta',
          render: (m) =>
            m ? (
              <Typography.Text type="secondary" style={{ fontSize: 12, fontFamily: 'monospace' }}>
                {JSON.stringify(m).slice(0, 160)}
              </Typography.Text>
            ) : null,
        },
      ]}
    />
  );
}

// --------------------------------------------------------------------------
// Main Settings Shell
// --------------------------------------------------------------------------

export default function Settings() {
  const { storeId, can, me, reloadMe } = useApp();
  const { message } = App.useApp();
  const [store, setStore] = useState(null);

  const load = () =>
    api(`/stores/${storeId}`)
      .then(setStore)
      .catch((e) => showError(e, { message }));

  const reload = () => {
    load();
    reloadMe();
  };

  useEffect(() => {
    load();
  }, [storeId]);

  if (!store) return <Spin fullscreen tip="Loading store configuration..." />;

  const props = { store, reload, can, me };
  const items = [
    {
      key: 'general',
      label: (
        <span>
          <SettingOutlined /> General
        </span>
      ),
      children: <General {...props} />,
    },
    can('ADMIN') && {
      key: 'install',
      label: (
        <span>
          <CodeOutlined /> Installation & Embed
        </span>
      ),
      children: <Installation {...props} />,
    },
    {
      key: 'team',
      label: (
        <span>
          <TeamOutlined /> Team Members
        </span>
      ),
      children: <Team {...props} />,
    },
    {
      key: 'notify',
      label: (
        <span>
          <BellOutlined /> Notifications & SMTP
        </span>
      ),
      children: <Notifications {...props} />,
    },
    can('ADMIN') && {
      key: 'webhooks',
      label: (
        <span>
          <ApiOutlined /> Webhooks
        </span>
      ),
      children: <Webhooks {...props} />,
    },
    can('ADMIN') && {
      key: 'integrations',
      label: (
        <span>
          <ShopOutlined /> Integrations
        </span>
      ),
      children: <Integrations {...props} />,
    },
    can('ADMIN') && {
      key: 'privacy',
      label: (
        <span>
          <SafetyCertificateOutlined /> Privacy & GDPR
        </span>
      ),
      children: <Privacy {...props} />,
    },
    can('ADMIN') && {
      key: 'audit',
      label: (
        <span>
          <AuditOutlined /> Audit Trail
        </span>
      ),
      children: <Audit {...props} />,
    },
  ].filter(Boolean);

  return (
    <div>
      <div className="saas-page-header">
        <div>
          <Flex align="center" gap={10}>
            <Typography.Title level={4} className="saas-page-title">
              Store Settings
            </Typography.Title>
            <Tag color={store.isActive ? 'green' : 'default'} bordered={false} style={{ fontWeight: 500 }}>
              {store.isActive ? 'Active' : 'Paused'}
            </Tag>
          </Flex>
          <Typography.Text type="secondary" className="saas-page-subtitle">
            Configure storefront embed snippets, team permissions, notification mailboxes, and webhooks for {store.name}.
          </Typography.Text>
        </div>
      </div>
      <Tabs items={items} destroyInactiveTabPane style={{ background: '#ffffff', padding: '16px 20px', borderRadius: 8, border: '1px solid #e2e8f0' }} />
    </div>
  );
}
