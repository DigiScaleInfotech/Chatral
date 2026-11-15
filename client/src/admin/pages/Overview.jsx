// Store Overview & Workspace Dashboard: Central operational hub for merchants and store owners.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  App, Avatar, Badge, Button, Card, Col, Divider, Empty, Flex, Form, Input, InputNumber,
  Modal, Row, Select, Skeleton, Space, Statistic, Switch, Table, Tag, Tooltip, Typography,
} from 'antd';
import {
  DashboardOutlined, MessageOutlined, TeamOutlined, EyeOutlined, CheckCircleOutlined,
  CopyOutlined, CodeOutlined, ExportOutlined, SettingOutlined, UserAddOutlined,
  ThunderboltOutlined, BgColorsOutlined, ClockCircleOutlined, ShopOutlined,
} from '@ant-design/icons';
import { api, showError, ROLE_LABEL } from '../api.js';
import { useApp } from '../main.jsx';

export default function Overview() {
  const { store, me, role, can, reloadMe } = useApp();
  const { message } = App.useApp();
  const nav = useNavigate();

  const [members, setMembers] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [widgetBusy, setWidgetBusy] = useState(false);
  const [widgetEnabled, setWidgetEnabled] = useState(store?.widgetEnabled ?? true);

  // Add team member modal state
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [memberForm] = Form.useForm();
  const [savingMember, setSavingMember] = useState(false);

  useEffect(() => {
    setWidgetEnabled(store?.widgetEnabled ?? true);
  }, [store?.widgetEnabled]);

  const loadData = async () => {
    if (!store?.id) return;
    setLoading(true);
    try {
      const [membersData, reportsData] = await Promise.all([
        api(`/stores/${store.id}/members`).catch(() => []),
        api(`/stores/${store.id}/reports`).catch(() => null),
      ]);
      setMembers(membersData || []);

      if (reportsData) {
        const totalConvs = (reportsData.byStatus || []).reduce((acc, x) => acc + (x._count || 0), 0);
        const totalMsgs = (reportsData.msgs || []).reduce((acc, x) => acc + (x._count || 0), 0);
        setStats({
          conversations: totalConvs,
          visitors: reportsData.visitors || 0,
          messages: totalMsgs,
          answered: reportsData.timing?.[0]?.answered || 0,
        });
      } else {
        setStats({ conversations: 0, visitors: 0, messages: 0, answered: 0 });
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
    setWidgetBusy(true);
    setWidgetEnabled(enabled);
    try {
      await api(`/stores/${store.id}/widget-enabled`, {
        method: 'PUT',
        body: { enabled },
      });
      message.success(`Chat widget is now ${enabled ? 'Live on your website' : 'Hidden from your website'}`);
      reloadMe?.();
    } catch (e) {
      setWidgetEnabled(!enabled);
      showError(e, { message });
    } finally {
      setWidgetBusy(false);
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
      message.success(`Team member ${values.name} added successfully!`);
      setAddMemberOpen(false);
      memberForm.resetFields();
      loadData();
    } catch (e) {
      showError(e, { message, form: memberForm });
    } finally {
      setSavingMember(false);
    }
  };

  const copyText = (txt, label) => {
    navigator.clipboard.writeText(txt).then(() => {
      message.success(`${label} copied to clipboard!`);
    }).catch(() => {
      message.info(txt);
    });
  };

  const widgetUrl = `${window.location.origin}/widget/chat.js`;
  const snippet = `<script async src="${widgetUrl}" data-store="${store?.publicKey || ''}"></script>`;
  const popoutUrl = `${window.location.origin}/chat/${store?.chatLinkId || store?.id || ''}`;

  const onlineMembersCount = (members || []).filter((m) => m.presence === 'ONLINE' || m.connected).length;

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1280, margin: '0 auto' }}>
      {/* 1. Header Hero Card */}
      <Card
        bordered={false}
        style={{
          borderRadius: 12,
          marginBottom: 20,
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
        }}
      >
        <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
          <div>
            <Flex align="center" gap={10} style={{ marginBottom: 6 }}>
              <ShopOutlined style={{ fontSize: 22, color: '#38bdf8' }} />
              <Typography.Title level={3} style={{ color: '#ffffff', margin: 0, fontWeight: 700 }}>
                {store?.name || 'My Store'}
              </Typography.Title>
              <Tag color={store?.isActive ? 'success' : 'warning'} bordered={false} style={{ borderRadius: 6, fontWeight: 600 }}>
                {store?.isActive ? 'Store Active' : 'Store Paused'}
              </Tag>
              {role && (
                <Tag color="geekblue" bordered={false} style={{ borderRadius: 6, fontWeight: 500 }}>
                  {ROLE_LABEL[role] || role}
                </Tag>
              )}
            </Flex>
            <Typography.Text style={{ color: '#94a3b8', fontSize: 13 }}>
              Workspace Command Center: Live chat operations, website embed status, and team routing.
            </Typography.Text>
          </div>

          <Space wrap size={10}>
            <Button
              type="primary"
              icon={<ExportOutlined />}
              onClick={() => window.open(popoutUrl, '_blank')}
              style={{ background: '#2563eb', borderColor: '#2563eb' }}
            >
              Test Live Chat
            </Button>
            <Button
              ghost
              style={{ color: '#ffffff', borderColor: '#475569' }}
              icon={<MessageOutlined />}
              onClick={() => nav('/inbox')}
            >
              Open Inbox
            </Button>
            {can('ADMIN') && (
              <Button
                ghost
                style={{ color: '#ffffff', borderColor: '#475569' }}
                icon={<SettingOutlined />}
                onClick={() => nav('/settings')}
              >
                Settings
              </Button>
            )}
          </Space>
        </Flex>
      </Card>

      {/* 2. Top Metric Cards (Row of 4) */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {/* Widget On / Off */}
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 10, height: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Flex justify="space-between" align="start">
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
                  WIDGET VISIBILITY
                </Typography.Text>
                <div style={{ marginTop: 8 }}>
                  <Tag color={widgetEnabled ? 'green' : 'default'} bordered={false} style={{ fontSize: 13, padding: '4px 8px', borderRadius: 6, fontWeight: 600 }}>
                    {widgetEnabled ? '● Live on Website' : '○ Hidden from Site'}
                  </Tag>
                </div>
              </div>
              <Switch
                checked={widgetEnabled}
                loading={widgetBusy}
                disabled={!can('ADMIN')}
                onChange={toggleWidget}
                checkedChildren="On"
                unCheckedChildren="Off"
              />
            </Flex>
            <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 12 }}>
              {can('ADMIN') ? 'Toggle to hide or show on all allowed domains' : 'Controlled by store owner / admin'}
            </Typography.Text>
          </Card>
        </Col>

        {/* 30-Day Conversations */}
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 10, height: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={<Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>CONVERSATIONS (30D)</Typography.Text>}
              value={stats?.conversations ?? 0}
              loading={loading}
              prefix={<MessageOutlined style={{ color: '#2563eb', marginRight: 6 }} />}
              valueStyle={{ fontWeight: 700, fontSize: 24, color: '#0f172a' }}
            />
            <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 6 }}>
              {stats?.answered ?? 0} answered by support team
            </Typography.Text>
          </Card>
        </Col>

        {/* 30-Day Visitors */}
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 10, height: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={<Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>UNIQUE VISITORS</Typography.Text>}
              value={stats?.visitors ?? 0}
              loading={loading}
              prefix={<EyeOutlined style={{ color: '#059669', marginRight: 6 }} />}
              valueStyle={{ fontWeight: 700, fontSize: 24, color: '#0f172a' }}
            />
            <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 6 }}>
              Tracked across your connected storefront
            </Typography.Text>
          </Card>
        </Col>

        {/* Team Members */}
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 10, height: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={<Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>ASSIGNED AGENTS</Typography.Text>}
              value={members?.length ?? 0}
              loading={loading}
              prefix={<TeamOutlined style={{ color: '#7c3aed', marginRight: 6 }} />}
              valueStyle={{ fontWeight: 700, fontSize: 24, color: '#0f172a' }}
            />
            <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 6 }}>
              <Badge status={onlineMembersCount > 0 ? 'success' : 'default'} text={`${onlineMembersCount} active/online now`} />
            </Typography.Text>
          </Card>
        </Col>
      </Row>

      {/* 3. Main Content: Team Directory + Embed Integration */}
      <Row gutter={[20, 20]}>
        {/* Left Column: Team & Staff Directory (The Customer's User Directory) */}
        <Col xs={24} lg={14}>
          <Card
            bordered={false}
            style={{ borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
            title={
              <Flex justify="space-between" align="center" style={{ width: '100%' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: '#0f172a' }}>
                    <TeamOutlined style={{ marginRight: 8, color: '#2563eb' }} />
                    Team & Staff Directory
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}>
                    Active agents and operators handling inquiries for this store.
                  </div>
                </div>
                {can('ADMIN') && (
                  <Button
                    type="primary"
                    size="small"
                    icon={<UserAddOutlined />}
                    onClick={() => {
                      memberForm.resetFields();
                      setAddMemberOpen(true);
                    }}
                  >
                    Add Member
                  </Button>
                )}
              </Flex>
            }
          >
            <Table
              rowKey="userId"
              loading={loading}
              dataSource={members || []}
              pagination={false}
              size="middle"
              columns={[
                {
                  title: 'Name & Email',
                  dataIndex: 'name',
                  render: (n, m) => (
                    <Flex align="center" gap={10}>
                      <Badge dot={m.presence === 'ONLINE' || m.connected} color="#10b981" offset={[-2, 28]}>
                        <Avatar style={{ backgroundColor: '#2563eb' }}>
                          {(n || m.email || '?')[0].toUpperCase()}
                        </Avatar>
                      </Badge>
                      <div>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>
                          {n || 'Agent'}
                          {m.userId === me?.id && (
                            <Tag bordered={false} style={{ marginLeft: 6, fontSize: 10, background: '#f1f5f9' }}>You</Tag>
                          )}
                        </div>
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
                  width: 110,
                  render: (r) => (
                    <Tag
                      bordered={false}
                      color={r === 'OWNER' ? 'blue' : r === 'ADMIN' ? 'cyan' : 'default'}
                      style={{ fontWeight: 500 }}
                    >
                      {ROLE_LABEL[r] || r}
                    </Tag>
                  ),
                },
                {
                  title: 'Status',
                  dataIndex: 'presence',
                  width: 100,
                  render: (p, m) => {
                    const online = p === 'ONLINE' || m.connected;
                    const away = p === 'AWAY';
                    return (
                      <Tag
                        bordered={false}
                        color={online ? 'success' : away ? 'warning' : 'default'}
                        style={{ fontSize: 11 }}
                      >
                        {online ? 'Online' : away ? 'Away' : 'Offline'}
                      </Tag>
                    );
                  },
                },
                {
                  title: 'Max Chats',
                  dataIndex: 'maxChats',
                  width: 90,
                  render: (v) => <span style={{ fontWeight: 500 }}>{v || 10}</span>,
                },
              ]}
            />
          </Card>
        </Col>

        {/* Right Column: Website Embed & Setup Quickstart */}
        <Col xs={24} lg={10}>
          {/* Card: Embed Script */}
          <Card
            bordered={false}
            style={{ borderRadius: 10, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
            title={
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: '#0f172a' }}>
                  <CodeOutlined style={{ marginRight: 8, color: '#2563eb' }} />
                  Connect Website
                </div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}>
                  Add live chat to any HTML, Shopify, or WordPress website.
                </div>
              </div>
            }
          >
            <Typography.Text style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 8 }}>
              Paste this tag into your website before the closing <code>&lt;/head&gt;</code> tag:
            </Typography.Text>

            <div
              style={{
                background: '#0f172a',
                color: '#e2e8f0',
                padding: '12px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontFamily: 'monospace',
                wordBreak: 'break-all',
                position: 'relative',
                marginBottom: 12,
                lineHeight: 1.5,
              }}
            >
              {snippet}
            </div>

            <Flex gap={8} wrap="wrap">
              <Button
                type="primary"
                icon={<CopyOutlined />}
                onClick={() => copyText(snippet, 'Widget script tag')}
              >
                Copy Embed Code
              </Button>
              <Button
                icon={<ExportOutlined />}
                onClick={() => window.open(popoutUrl, '_blank')}
              >
                Direct Chat Link
              </Button>
            </Flex>

            <Divider style={{ margin: '14px 0' }} />

            <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
              <b>Public Key:</b> <code style={{ fontSize: 11 }}>{store?.publicKey || 'Loading...'}</code>
            </Typography.Text>
          </Card>

          {/* Card: Quick Shortcuts */}
          <Card
            bordered={false}
            style={{ borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
            title={<div style={{ fontWeight: 600, fontSize: 14 }}>Quick Shortcuts</div>}
          >
            <Space direction="vertical" style={{ width: '100%' }} size={10}>
              <Button
                block
                style={{ textAlign: 'left', height: 'auto', padding: '10px 14px' }}
                icon={<BgColorsOutlined style={{ color: '#2563eb', fontSize: 18 }} />}
                onClick={() => nav('/widget')}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>Customise Widget Design</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Change colors, header avatar, position & text</div>
                </div>
              </Button>

              <Button
                block
                style={{ textAlign: 'left', height: 'auto', padding: '10px 14px' }}
                icon={<ThunderboltOutlined style={{ color: '#f59e0b', fontSize: 18 }} />}
                onClick={() => nav('/triggers')}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>Auto-replies & Welcome Triggers</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Set up greeting messages and routing rules</div>
                </div>
              </Button>

              <Button
                block
                style={{ textAlign: 'left', height: 'auto', padding: '10px 14px' }}
                icon={<SettingOutlined style={{ color: '#64748b', fontSize: 18 }} />}
                onClick={() => nav('/settings')}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>Store Settings & Notifications</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Configure SMTP, email alerts, domains & retention</div>
                </div>
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 4. Add Member Modal */}
      <Modal
        open={addMemberOpen}
        title="Add Team Member to Store"
        okText="Add Member"
        confirmLoading={savingMember}
        onOk={handleAddMember}
        onCancel={() => setAddMemberOpen(false)}
        destroyOnClose
        centered
        width={460}
      >
        <Form
          form={memberForm}
          layout="vertical"
          style={{ marginTop: 16 }}
          initialValues={{ maxChats: 10 }}
        >
          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: 'Enter full name' }]}
          >
            <Input placeholder="e.g. Priya Sharma" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Enter email address' },
              { type: 'email', message: 'Enter a valid email' },
            ]}
          >
            <Input placeholder="priya@company.com" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Initial Password"
            extra="New staff member can log in with this password"
            rules={[
              { required: true, message: 'Enter password' },
              { min: 10, message: 'Must be at least 10 characters' },
            ]}
          >
            <Input.Password placeholder="••••••••••••" />
          </Form.Item>

          <Form.Item
            name="maxChats"
            label="Max Concurrent Chats"
            extra="Auto-assignment limit for incoming chats"
          >
            <InputNumber min={1} max={50} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
