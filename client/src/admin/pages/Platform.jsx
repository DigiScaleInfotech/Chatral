// Super Admin: Multi-store management, platform user administration, and usage statistics.
import { useEffect, useState } from 'react';
import {
  App, Button, Card, Checkbox, Empty, Flex, Form, Input, Modal, Select, Space, Switch,
  Table, Tabs, Tag, Tooltip, Typography,
} from 'antd';
import {
  PlusOutlined, ShopOutlined, UserOutlined, DeleteOutlined, EditOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { api, showError, ROLE_LABEL, TIMEZONE_OPTIONS } from '../api.js';
import { useApp } from '../main.jsx';

function Stores() {
  const { reloadMe } = useApp();
  const { message, modal } = App.useApp();
  const [rows, setRows] = useState(null);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const load = () =>
    api('/platform/usage')
      .then(setRows)
      .catch((e) => showError(e, { message }));

  useEffect(() => {
    load();
  }, []);

  async function toggleWidget(s, enabled) {
    setRows((list) => list.map((x) => (x.id === s.id ? { ...x, widgetEnabled: enabled } : x)));
    try {
      await api(`/platform/stores/${s.id}/widget-enabled`, { method: 'PUT', body: { enabled } });
      message.success(`${s.name}: widget ${enabled ? 'shown on the website' : 'hidden on the website'}`);
    } catch (e) {
      showError(e, { message });
      load();
    }
  }

  async function create() {
    const v = await form.validateFields();
    try {
      await api('/stores', { method: 'POST', body: { ...v, ownerEmail: v.ownerEmail || undefined } });
      setOpen(false);
      form.resetFields();
      load();
      reloadMe();
      message.success('Store created successfully');
    } catch (e) {
      showError(e, { message, form });
    }
  }

  function remove(s) {
    let typed = '';
    modal.confirm({
      title: `Permanently delete "${s.name}"?`,
      okType: 'danger',
      okText: 'Delete store',
      content: (
        <div>
          <Typography.Paragraph type="secondary" style={{ fontSize: 13 }}>
            All conversations, visitor tokens, files, triggers and configuration for this store will be purged permanently. To temporarily disable instead, pause the store in settings.
          </Typography.Paragraph>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
              Type <b>{s.name}</b> to confirm deletion:
            </div>
            <Input placeholder={s.name} onChange={(e) => { typed = e.target.value; }} />
          </div>
        </div>
      ),
      onOk: () =>
        api(`/stores/${s.id}`, { method: 'DELETE', body: { confirmName: typed } })
          .then(() => {
            message.success('Store deleted');
            load();
            reloadMe();
          })
          .catch((e) => {
            showError(e, { message });
            throw e;
          }),
    });
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>All Store Tenancies</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            Multi-store tenant isolation and aggregate 30-day activity tracking.
          </div>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          New store
        </Button>
      </div>

      <Table
        rowKey="id"
        loading={!rows}
        dataSource={rows || []}
        pagination={{ pageSize: 25, hideOnSinglePage: true }}
        scroll={{ x: 900 }}
        columns={[
          {
            title: 'Store Name',
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
            title: 'Widget on site',
            dataIndex: 'widgetEnabled',
            width: 130,
            render: (on, s) => (
              <Tooltip title={on ? 'Shown on the website. Turn off to hide it everywhere (settings are kept).' : 'Hidden on every website'}>
                <Switch checked={on} checkedChildren="On" unCheckedChildren="Off" aria-label={`Widget on site for ${s.name}`} onChange={(v) => toggleWidget(s, v)} />
              </Tooltip>
            ),
          },
          { title: 'Members', dataIndex: 'members', width: 100 },
          { title: 'Conversations (Last 30 Days)', dataIndex: 'conversations', width: 200 },
          {
            title: '',
            width: 100,
            render: (_, s) => (
              <Button size="small" danger onClick={() => remove(s)}>
                Delete
              </Button>
            ),
          },
        ]}
      />

      <Modal open={open} title="Create New Store" onOk={create} onCancel={() => setOpen(false)} okText="Create Store" destroyOnClose centered width={480}>
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 16 }}
          initialValues={{ timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, allowedOrigins: [] }}
        >
          <Form.Item name="name" label="Store Name" rules={[{ required: true, message: 'Enter store name' }]}>
            <Input maxLength={80} placeholder="e.g. Acme Worldwide" />
          </Form.Item>
          <Form.Item
            name="allowedOrigins"
            label="Allowed Website Domains"
            extra="Press Enter after each domain (can be configured later)"
          >
            <Select mode="tags" open={false} tokenSeparators={[',', ' ']} placeholder="example.com" />
          </Form.Item>
          <Form.Item name="timezone" label="Default Timezone">
            <Select showSearch options={TIMEZONE_OPTIONS} />
          </Form.Item>
          <Form.Item
            name="ownerEmail"
            label="Agent Email (Optional)"
            rules={[{ type: 'email', message: 'Enter a valid email' }]}
            extra="Adds an existing platform user to this store as an agent"
          >
            <Input placeholder="agent@company.com" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export function Users() {
  const { me } = useApp();
  const { message } = App.useApp();
  const [rows, setRows] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [stores, setStores] = useState([]);
  const [form] = Form.useForm();

  async function confirmDelete() {
    setDeleteBusy(true);
    try {
      await api(`/users/${deleting.id}`, { method: 'DELETE' });
      message.success(`${deleting.name} was deleted`);
      setDeleting(null);
      load();
    } catch (e) {
      // e.g. sole store owner / last super admin: keep the dialog open so the reason is visible in context.
      showError(e, { message });
    } finally {
      setDeleteBusy(false);
    }
  }

  const load = () =>
    api('/users')
      .then(setRows)
      .catch((e) => showError(e, { message }));

  useEffect(() => {
    load();
    api('/platform/usage').then((list) => setStores(list.map((s) => ({ id: s.id, name: s.name })))).catch(() => {});
  }, []);

  async function save() {
    const v = await form.validateFields();
    if (!v.password) delete v.password;
    try {
      if (editing.id)
        await api(`/users/${editing.id}`, {
          method: 'PATCH',
          body: { name: v.name, ...(editing.role === 'SUPER_ADMIN' ? {} : { storeIds: v.storeIds || [] }), ...(v.password ? { password: v.password } : {}) },
        });
      else await api('/users', { method: 'POST', body: v });
      message.success('User updated successfully');
      setEditing(null);
      load();
    } catch (e) {
      showError(e, { message, form });
    }
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Platform User Directory</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            Manage staff accounts and system administrator privileges.
          </div>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
            setEditing({});
          }}
        >
          New user
        </Button>
      </div>

      <Table
        rowKey="id"
        loading={!rows}
        dataSource={rows || []}
        pagination={{ pageSize: 25, hideOnSinglePage: true }}
        scroll={{ x: 800 }}
        columns={[
          {
            title: 'User Name & Email',
            dataIndex: 'name',
            render: (n, u) => (
              <div>
                <div style={{ fontWeight: 600 }}>{n}</div>
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
                color={r === 'SUPER_ADMIN' ? 'blue' : 'default'}
                bordered={false}
                style={{ fontWeight: 500 }}
              >
                {r === 'SUPER_ADMIN' ? 'Main admin' : 'Agent'}
              </Tag>
            ),
          },
          {
            title: 'Store Memberships',
            dataIndex: 'memberships',
            render: (m) => (
              <Space wrap size={4}>
                {m.map((x) => (
                  <Tag key={x.storeId} bordered={false} style={{ fontSize: 11 }}>
                    {x.storeName}: {ROLE_LABEL[x.role]}
                  </Tag>
                ))}
              </Space>
            ),
          },
          {
            title: 'Active',
            dataIndex: 'isActive',
            width: 90,
            render: (v, u) => (
              <Switch
                checked={v}
                disabled={u.id === me.id}
                onChange={(c) =>
                  api(`/users/${u.id}`, { method: 'PATCH', body: { isActive: c } })
                    .then(() => {
                      message.success('User status updated');
                      load();
                    })
                    .catch((e) => showError(e, { message }))
                }
              />
            ),
          },
          {
            title: '',
            width: 180,
            render: (_, u) => (
              <Space size={6}>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => {
                    form.setFieldsValue({ ...u, password: '', storeIds: u.memberships.map((m) => m.storeId) });
                    setEditing(u);
                  }}
                >
                  Edit
                </Button>
                <Tooltip title={u.id === me.id ? 'You cannot delete your own account' : ''}>
                  <Button size="small" danger icon={<DeleteOutlined />} disabled={u.id === me.id} onClick={() => setDeleting(u)} aria-label={`Delete ${u.name}`}>
                    Delete
                  </Button>
                </Tooltip>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        open={!!deleting}
        title="Delete user permanently?"
        okText="Delete user"
        okButtonProps={{ danger: true }}
        confirmLoading={deleteBusy}
        onOk={confirmDelete}
        onCancel={() => setDeleting(null)}
        destroyOnClose
        centered
        width={460}
      >
        {deleting && (
          <>
            <Typography.Paragraph style={{ marginTop: 8 }}>
              <b>{deleting.name}</b> ({deleting.email}) will lose access immediately and the account will be removed. This cannot be undone.
            </Typography.Paragraph>
            {deleting.memberships.length > 0 && (
              <Typography.Paragraph>
                They will be removed from: {deleting.memberships.map((m) => `${m.storeName} (${ROLE_LABEL[m.role]})`).join(', ')}. Their open chats become unassigned; message history stays.
              </Typography.Paragraph>
            )}
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              To block access but keep the account, turn off <i>Active</i> instead.
            </Typography.Paragraph>
          </>
        )}
      </Modal>

      <Modal open={!!editing} title={editing?.id ? 'Edit Platform User' : 'Create Platform User'} onOk={save} onCancel={() => setEditing(null)} okText="Save user" destroyOnClose centered width={460}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Name is required' }]}>
            <Input placeholder="e.g. John Doe" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email Address"
            rules={[{ required: true, type: 'email', message: 'Valid email is required' }]}
          >
            <Input disabled={!!editing?.id} placeholder="name@company.com" />
          </Form.Item>
          <Form.Item
            name="password"
            label={editing?.id ? 'Reset Password (Leave blank to keep unchanged)' : 'Initial Password'}
            rules={[{ required: !editing?.id }, { min: 10, message: 'Must be at least 10 characters' }]}
          >
            <Input.Password autoComplete="new-password" placeholder="At least 10 characters" />
          </Form.Item>
          {editing?.role !== 'SUPER_ADMIN' && (
            <Form.Item name="storeIds" label="Store access" extra="The agent can answer chats only for the ticked stores.">
              {stores.length ? (
                <Checkbox.Group style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}
                  options={stores.map((s) => {
                    const m = editing?.memberships?.find((x) => x.storeId === s.id);
                    const fixed = m && m.role !== 'AGENT'; // legacy owner/admin roles are managed in that store's settings
                    return { value: s.id, label: fixed ? `${s.name} (${ROLE_LABEL[m.role]})` : s.name, disabled: fixed };
                  })} />
              ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No stores yet" />}
            </Form.Item>
          )}
          {/* Two roles only: the one main admin, and agents. New users are always agents. */}
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            {editing?.role === 'SUPER_ADMIN' ? 'Role: Main admin (full access).' : 'Role: Agent.'}
          </Typography.Paragraph>
        </Form>
      </Modal>
    </>
  );
}

export default function Platform() {
  return (
    <div>
      <div className="saas-page-header">
        <div>
          <Typography.Title level={4} className="saas-page-title">
            Platform Administration
          </Typography.Title>
          <Typography.Text type="secondary" className="saas-page-subtitle">
            Super Administrator console for cross-store tenant monitoring and system-wide user credentials.
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
              children: <Stores />,
            },
            {
              key: 'users',
              label: (
                <span>
                  <UserOutlined /> Users Directory
                </span>
              ),
              children: <Users />,
            },
          ]}
        />
      </Card>
    </div>
  );
}
