// Store Overview: Minimal 2-tab workspace management matching Platform layout, scoped to the current store.
import { useEffect, useState } from 'react';
import {
  App, Button, Card, Flex, Form, Input, InputNumber, Modal, Space, Switch, Table, Tabs, Tag,
  Tooltip, Typography,
} from 'antd';
import { ShopOutlined, UserOutlined, PlusOutlined } from '@ant-design/icons';
import { api, showError, ROLE_LABEL } from '../api.js';
import { useApp } from '../main.jsx';

function StoreUsage({ store, members, stats, loading, can, toggleWidget }) {
  const dataSource = store
    ? [
        {
          id: store.id,
          name: store.name,
          isActive: store.isActive,
          widgetEnabled: store.widgetEnabled,
          members: members?.length || 0,
          conversations: stats?.conversations || 0,
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
            width: 220,
            render: (c) => <span style={{ fontWeight: 600 }}>{c}</span>,
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
  const { store, role, can, reloadMe } = useApp();
  const { message } = App.useApp();

  const [members, setMembers] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [memberForm] = Form.useForm();
  const [savingMember, setSavingMember] = useState(false);

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
          <Typography.Title level={4} className="saas-page-title">
            Overview
          </Typography.Title>
          <Typography.Text type="secondary" className="saas-page-subtitle">
            Workspace overview for store tenancy, widget status, and user credentials.
          </Typography.Text>
        </div>
      </div>

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
