// Store Overview: Minimal 2-tab workspace management matching Platform layout, scoped to the current store.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  App, Button, Card, Flex, Form, Input, InputNumber, Modal, Progress, Space, Switch, Table, Tabs, Tag,
  Tooltip, Typography,
} from 'antd';
import {
  ShopOutlined, UserOutlined, PlusOutlined, RocketOutlined, CheckCircleFilled, CheckOutlined,
  CopyOutlined, BgColorsOutlined, MessageOutlined, DownOutlined, UpOutlined, CloseOutlined,
  TrophyOutlined, SettingOutlined,
} from '@ant-design/icons';
import { api, showError, ROLE_LABEL } from '../api.js';
import { useApp } from '../main.jsx';

function OnboardingChecklist({ store, stats, diag, can }) {
  const nav = useNavigate();
  const { message } = App.useApp();
  const [copied, setCopied] = useState(false);
  const [minimized, setMinimized] = useState(() => {
    return localStorage.getItem(`chatral_onboarding_min_${store?.id}`) === 'true';
  });
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem(`chatral_onboarding_dismiss_${store?.id}`) === 'true';
  });

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(`chatral_onboarding_dismiss_${store?.id}`, 'true');
    message.info('Setup guide dismissed. You can reopen it anytime from the top banner.');
  };

  const handleReopen = () => {
    setDismissed(false);
    localStorage.removeItem(`chatral_onboarding_dismiss_${store?.id}`);
  };

  const toggleMinimize = () => {
    const next = !minimized;
    setMinimized(next);
    localStorage.setItem(`chatral_onboarding_min_${store?.id}`, String(next));
  };

  // 100% Automated System Detection
  const installedCheck = diag?.checks?.find((c) => c.key === 'installed')?.ok;
  const publishedCheck = diag?.checks?.find((c) => c.key === 'published')?.ok;

  const hasConvs = (stats?.conversations || 0) > 0;
  const isInstalled = Boolean(installedCheck || store?.lastWidgetSeenAt || hasConvs);
  const isCustomized = Boolean(publishedCheck || store?.publishedVersion != null);
  const isTested = hasConvs;

  const handleCopySnippet = () => {
    const snippet = `<script src="${window.location.origin}/widget/chat.js" data-store-id="${store?.id}" async></script>`;
    navigator.clipboard?.writeText(snippet);
    setCopied(true);
    message.success('Widget script tag copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const steps = [
    {
      key: 'account',
      title: 'Store workspace created',
      desc: `${store?.name || 'Store'} is registered, configured, and running on Chatral.`,
      done: true,
      action: (
        <Tag color="success" bordered={false} style={{ fontWeight: 600 }}>
          Active
        </Tag>
      ),
    },
    {
      key: 'install',
      title: 'Install live chat widget on your website',
      desc: isInstalled
        ? store?.lastWidgetOrigin
          ? `Widget automatically detected on ${store.lastWidgetOrigin}.`
          : 'Widget automatically detected and loaded on website.'
        : 'Paste this 1-line script tag into your Shopify, WordPress/WooCommerce, or HTML website.',
      done: isInstalled,
      action: isInstalled ? (
        <Space wrap size={8}>
          <Tag color="success" bordered={false} style={{ fontWeight: 600 }}>
            Detected on website ✓
          </Tag>
          <Button
            size="small"
            icon={<SettingOutlined />}
            onClick={() => nav('/settings?tab=installation')}
          >
            Installation Settings
          </Button>
        </Space>
      ) : (
        <Space wrap size={8}>
          <Button
            size="small"
            type="primary"
            icon={copied ? <CheckOutlined style={{ color: '#10b981' }} /> : <CopyOutlined />}
            onClick={handleCopySnippet}
          >
            {copied ? 'Copied' : 'Copy Script Tag'}
          </Button>
          <Button
            size="small"
            icon={<SettingOutlined />}
            onClick={() => nav('/settings?tab=installation')}
          >
            Installation Guide
          </Button>
        </Space>
      ),
    },
    {
      key: 'design',
      title: 'Customize widget styling & branding',
      desc: isCustomized
        ? 'Custom colors, greetings, and branding published.'
        : 'Personalize widget theme colors, agent name, greeting title, and pre-chat form.',
      done: isCustomized,
      action: isCustomized ? (
        <Space wrap size={8}>
          <Tag color="success" bordered={false} style={{ fontWeight: 600 }}>
            Customized ✓
          </Tag>
          <Button
            size="small"
            icon={<BgColorsOutlined />}
            onClick={() => nav('/widget')}
          >
            Edit Design
          </Button>
        </Space>
      ) : (
        <Button
          size="small"
          type="primary"
          icon={<BgColorsOutlined />}
          onClick={() => nav('/widget')}
        >
          Customize Widget
        </Button>
      ),
    },
    {
      key: 'test',
      title: 'Send your first live test message',
      desc: isTested
        ? `First conversation received (${stats.conversations} chat${stats.conversations === 1 ? '' : 's'} logged).`
        : 'Test your visitor chat window, verify sound alerts, and check real-time agent replies.',
      done: isTested,
      action: isTested ? (
        <Tag color="success" bordered={false} style={{ fontWeight: 600 }}>
          Received chats ✓
        </Tag>
      ) : (
        <Button
          size="small"
          type="primary"
          icon={<MessageOutlined />}
          onClick={() => nav('/widget')}
        >
          Test Live Preview
        </Button>
      ),
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const percent = Math.round((completedCount / steps.length) * 100);
  const allCompleted = completedCount === steps.length;

  if (dismissed) {
    return (
      <div
        style={{
          marginBottom: 16,
          padding: '6px 14px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 8,
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 12,
        }}
      >
        <span style={{ color: '#64748b' }}>
          🚀 <b>Quick Setup Guide</b> is hidden ({completedCount}/{steps.length} completed).
        </span>
        <Button size="small" type="link" onClick={handleReopen} style={{ padding: 0 }}>
          Show Setup Guide
        </Button>
      </div>
    );
  }

  return (
    <Card
      style={{
        marginBottom: 20,
        borderRadius: 10,
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      }}
      bodyStyle={{ padding: '16px 20px 18px' }}
    >
      {/* Header */}
      <Flex justify="space-between" align="center" wrap gap={12} style={{ marginBottom: minimized ? 0 : 12 }}>
        <Flex align="center" gap={10}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: allCompleted ? '#ecfdf5' : '#eff6ff',
              border: `1px solid ${allCompleted ? '#a7f3d0' : '#bfdbfe'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {allCompleted ? (
              <TrophyOutlined style={{ fontSize: 16, color: '#10b981' }} />
            ) : (
              <RocketOutlined style={{ fontSize: 16, color: '#2563eb' }} />
            )}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>
              {allCompleted ? '🎉 Congratulations! Live chat is fully configured' : '🚀 Getting Started with Chatral'}
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              {allCompleted
                ? 'Your website live chat widget is ready to engage visitors and capture leads.'
                : 'Complete these quick steps to start chatting with your website visitors.'}
            </div>
          </div>
        </Flex>

        <Flex align="center" gap={8}>
          <Tag
            color={allCompleted ? 'success' : percent >= 50 ? 'processing' : 'default'}
            bordered={false}
            style={{ fontWeight: 600, fontSize: 12, padding: '2px 8px' }}
          >
            {completedCount} of {steps.length} Completed ({percent}%)
          </Tag>
          <Tooltip title={minimized ? 'Expand checklist' : 'Minimize checklist'}>
            <Button
              type="text"
              size="small"
              icon={minimized ? <DownOutlined /> : <UpOutlined />}
              onClick={toggleMinimize}
              aria-label="Toggle checklist"
            />
          </Tooltip>
          <Tooltip title="Dismiss setup guide">
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined style={{ fontSize: 12 }} />}
              onClick={handleDismiss}
              aria-label="Dismiss setup guide"
            />
          </Tooltip>
        </Flex>
      </Flex>

      {/* Progress Bar */}
      <Progress
        percent={percent}
        showInfo={false}
        size="small"
        strokeColor={{ '0%': '#2563eb', '100%': '#10b981' }}
        style={{ marginBottom: minimized ? 0 : 16 }}
      />

      {/* Checklist items */}
      {!minimized && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {steps.map((s, idx) => (
            <div
              key={s.key}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 8,
                background: s.done ? '#f8fafc' : '#ffffff',
                border: `1px solid ${s.done ? '#e2e8f0' : '#cbd5e1'}`,
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ paddingTop: 2 }}>
                {s.done ? (
                  <CheckCircleFilled style={{ color: '#10b981', fontSize: 20 }} />
                ) : (
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      border: '2px solid #94a3b8',
                      color: '#64748b',
                      fontSize: 11,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {idx + 1}
                  </div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: 13.5,
                        color: s.done ? '#475569' : '#0f172a',
                        textDecoration: s.done && s.key === 'account' ? 'none' : s.done ? 'line-through' : 'none',
                      }}
                    >
                      {s.title}
                    </span>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                      {s.desc}
                    </div>
                  </div>
                  {s.action && <div>{s.action}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}





function StoreUsage({ store, members, stats, loading, can, toggleWidget, me }) {
  const isPlatformStore = me?.role === 'SUPER_ADMIN' && (store?.name === 'Chatral Store' || store?.id === 'cmwejj2wi0002ri646fs0jj8l');
  const dataSource = store
    ? [
        {
          id: store.id,
          name: store.name,
          isActive: store.isActive,
          widgetEnabled: store.widgetEnabled,
          members: members?.length || 0,
          conversations: stats?.conversations || 0,
          plan: isPlatformStore ? 'BUSINESS' : (store.plan || 'TRIAL'),
        },
      ]
    : [];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{store?.name || 'Store'} Tenancy</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            Store tenant isolation and aggregate 30-day activity tracking.
          </div>
        </div>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={dataSource}
        pagination={false}
        scroll={{ x: 800 }}
        columns={[
          {
            title: 'STORE NAME',
            dataIndex: 'name',
            render: (n, s) => (
              <Flex align="center" gap={8}>
                <span style={{ fontWeight: 600 }}>{n}</span>
                {!s.isActive && (
                  <Tag bordered={false} style={{ fontSize: 11, background: '#fef3c7', color: '#92400e' }}>
                    Paused
                  </Tag>
                )}
              </Flex>
            ),
          },
          {
            title: 'WIDGET ON SITE',
            dataIndex: 'widgetEnabled',
            width: 140,
            render: (on, s) => (
              <Tooltip title={!can('ADMIN') ? 'Only Admin or Owner can toggle widget visibility' : on ? 'Shown on the website. Turn off to hide it everywhere (settings are kept).' : 'Hidden on every website'}>
                <Switch
                  checked={on}
                  checkedChildren="On"
                  unCheckedChildren="Off"
                  disabled={!can('ADMIN')}
                  aria-label={`Widget on site for ${s.name}`}
                  onChange={(v) => toggleWidget(v)}
                />
              </Tooltip>
            ),
          },
          {
            title: 'MEMBERS',
            dataIndex: 'members',
            width: 110,
            render: (m) => <span style={{ fontWeight: 600 }}>{m}</span>,
          },
          {
            title: 'CONVERSATIONS (LAST 30 DAYS)',
            dataIndex: 'conversations',
            width: 200,
            render: (c) => <span style={{ fontWeight: 600 }}>{c}</span>,
          },
          {
            title: 'CURRENT PLAN',
            dataIndex: 'plan',
            width: 160,
            render: (p, s) => {
              const plan = p || 'TRIAL';
              const color = isPlatformStore ? 'purple' : plan === 'BUSINESS' ? 'purple' : plan === 'STARTER' ? 'green' : 'blue';
              const label = isPlatformStore ? 'Super Admin' : plan === 'BUSINESS' ? 'Business & Scale' : plan === 'STARTER' ? 'Starter Growth' : '7-Day Free Trial';
              return (
                <Tag color={color} bordered={false} style={{ fontWeight: 600 }}>
                  {label}
                </Tag>
              );
            },
          },
        ]}
      />
    </>
  );
}

function UsersDirectory({ store, members, loading, can, onAddMember }) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{store?.name || 'Store'} User Directory</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            Manage staff accounts and agent privileges.
          </div>
        </div>
        {can('ADMIN') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={onAddMember}>
            New user
          </Button>
        )}
      </div>

      <Table
        rowKey="userId"
        loading={loading}
        dataSource={members || []}
        pagination={{ pageSize: 25, hideOnSinglePage: true }}
        scroll={{ x: 800 }}
        columns={[
          {
            title: 'User Name & Email',
            dataIndex: 'name',
            render: (n, u) => (
              <div>
                <div style={{ fontWeight: 600 }}>{n || 'Agent'}</div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {u.email}
                </Typography.Text>
              </div>
            ),
          },
          {
            title: 'Platform Role',
            dataIndex: 'role',
            width: 140,
            render: (r) => (
              <Tag
                color={r === 'OWNER' ? 'blue' : 'default'}
                bordered={false}
                style={{ fontWeight: 500 }}
              >
                {ROLE_LABEL[r] || r}
              </Tag>
            ),
          },
          {
            title: 'Store Memberships',
            dataIndex: 'role',
            render: (r) => (
              <Space wrap size={4}>
                <Tag bordered={false} style={{ fontSize: 11 }}>
                  {store?.name}: {ROLE_LABEL[r] || r}
                </Tag>
              </Space>
            ),
          },
          {
            title: 'Status',
            dataIndex: 'presence',
            width: 110,
            render: (p, m) => {
              const online = p === 'ONLINE' || m.connected;
              return (
                <Tag color={online ? 'success' : 'default'} bordered={false}>
                  {online ? 'Online' : 'Offline'}
                </Tag>
              );
            },
          },
          {
            title: 'Max Chats',
            dataIndex: 'maxChats',
            width: 110,
            render: (v) => <span style={{ fontWeight: 500 }}>{v || 10}</span>,
          },
        ]}
      />
    </>
  );
}

export default function Overview() {
  const { store, role, can, reloadMe, me } = useApp();
  const isPlatformStore = me?.role === 'SUPER_ADMIN' && (store?.name === 'Chatral Store' || store?.id === 'cmwejj2wi0002ri646fs0jj8l');
  const { message } = App.useApp();

  const [members, setMembers] = useState(null);
  const [stats, setStats] = useState(null);
  const [diag, setDiag] = useState(null);
  const [loading, setLoading] = useState(true);

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [memberForm] = Form.useForm();
  const [savingMember, setSavingMember] = useState(false);

  const loadData = async () => {
    if (!store?.id) return;
    setLoading(true);
    try {
      const [membersData, reportsData, diagData] = await Promise.all([
        api(`/stores/${store.id}/members`).catch(() => []),
        api(`/stores/${store.id}/reports`).catch(() => null),
        can('ADMIN') ? api(`/stores/${store.id}/diagnostics`).catch(() => null) : null,
      ]);
      setMembers(membersData || []);
      setDiag(diagData || null);

      if (reportsData) {
        const totalConvs = (reportsData.byStatus || []).reduce((acc, x) => acc + (x._count || 0), 0);
        setStats({ conversations: totalConvs });
      } else {
        setStats({ conversations: 0 });
      }
    } catch (e) {
      showError(e, { message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [store?.id]);

  const toggleWidget = async (enabled) => {
    try {
      await api(`/stores/${store.id}/widget-enabled`, {
        method: 'PUT',
        body: { enabled },
      });
      message.success(`${store.name}: widget ${enabled ? 'shown on the website' : 'hidden on the website'}`);
      reloadMe?.();
    } catch (e) {
      showError(e, { message });
    }
  };

  const handleAddMember = async () => {
    try {
      const values = await memberForm.validateFields();
      setSavingMember(true);
      await api(`/stores/${store.id}/members`, {
        method: 'POST',
        body: {
          ...values,
          role: 'AGENT',
        },
      });
      message.success(`User ${values.name} added successfully`);
      setAddMemberOpen(false);
      memberForm.resetFields();
      loadData();
    } catch (e) {
      showError(e, { message, form: memberForm });
    } finally {
      setSavingMember(false);
    }
  };

  return (
    <div>
      <div className="saas-page-header">
        <div>
          <Flex align="center" gap={10}>
            <Typography.Title level={4} className="saas-page-title">
              Overview
            </Typography.Title>
            <Tag color={isPlatformStore ? 'purple' : store?.plan === 'BUSINESS' ? 'purple' : store?.plan === 'STARTER' ? 'green' : 'blue'} bordered={false} style={{ fontWeight: 600 }}>
              {isPlatformStore ? 'Super Admin' : store?.plan === 'BUSINESS' ? 'Business Plan' : store?.plan === 'STARTER' ? 'Starter Plan' : '7-Day Free Trial'}
            </Tag>
          </Flex>
          <Typography.Text type="secondary" className="saas-page-subtitle">
            Workspace overview for store tenancy, widget status, and user credentials.
          </Typography.Text>
        </div>
      </div>

      {!isPlatformStore && (
        <OnboardingChecklist store={store} stats={stats} diag={diag} can={can} />
      )}

      <Card>
        <Tabs
          items={[
            {
              key: 'stores',
              label: (
                <span>
                  <ShopOutlined /> Stores & Usage
                </span>
              ),
              children: (
                <StoreUsage
                  store={store}
                  members={members}
                  stats={stats}
                  loading={loading}
                  can={can}
                  toggleWidget={toggleWidget}
                  me={me}
                />
              ),
            },
            {
              key: 'users',
              label: (
                <span>
                  <UserOutlined /> Users Directory
                </span>
              ),
              children: (
                <UsersDirectory
                  store={store}
                  members={members}
                  loading={loading}
                  can={can}
                  onAddMember={() => {
                    memberForm.resetFields();
                    setAddMemberOpen(true);
                  }}
                />
              ),
            },
          ]}
        />
      </Card>

      <Modal
        open={addMemberOpen}
        title="Create New User"
        okText="Create User"
        confirmLoading={savingMember}
        onOk={handleAddMember}
        onCancel={() => setAddMemberOpen(false)}
        destroyOnClose
        centered
        width={480}
      >
        <Form
          form={memberForm}
          layout="vertical"
          style={{ marginTop: 16 }}
          initialValues={{ maxChats: 10 }}
        >
          <Form.Item
            name="name"
            label="User Name"
            rules={[{ required: true, message: 'Enter name' }]}
          >
            <Input maxLength={80} placeholder="e.g. John Doe" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Enter email' },
              { type: 'email', message: 'Enter a valid email' },
            ]}
          >
            <Input placeholder="agent@company.com" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: 'Enter password' },
              { min: 10, message: 'Password must be at least 10 characters' },
            ]}
          >
            <Input.Password placeholder="••••••••••••" />
          </Form.Item>

          <Form.Item
            name="maxChats"
            label="Max Concurrent Chats"
          >
            <InputNumber min={1} max={50} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
