import { useEffect, useState } from 'react';
import {
  App, Button, Flex, Form, Input, Modal, Popconfirm, Radio, Space, Table, Tag,
  Tooltip, Typography,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, LockOutlined, TeamOutlined } from '@ant-design/icons';
import { api, showError } from '../api.js';
import { useApp } from '../main.jsx';

export default function SavedReplies() {
  const { storeId, can } = useApp();
  // Agents can only keep private shortcuts; supervisors and above also manage team (public) ones.
  const canPublic = can('SUPERVISOR');
  const { message } = App.useApp();
  const [rows, setRows] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const load = () =>
    api(`/stores/${storeId}/saved-replies`)
      .then(setRows)
      .catch((e) => showError(e, { message }));

  useEffect(() => {
    load();
  }, [storeId]);

  async function save() {
    const v = await form.validateFields();
    try {
      if (editing.id) await api(`/stores/${storeId}/saved-replies/${editing.id}`, { method: 'PUT', body: v });
      else await api(`/stores/${storeId}/saved-replies`, { method: 'POST', body: v });
      message.success('Saved reply saved');
      setEditing(null);
      load();
    } catch (e) {
      showError(e, { message, form });
    }
  }

  return (
    <>
      <div className="saas-page-header">
        <div>
          <Typography.Title level={4} className="saas-page-title">
            Saved Canned Replies
          </Typography.Title>
          <Typography.Text type="secondary" className="saas-page-subtitle">
            Insert quick responses by typing <Tag color="blue" bordered={false} style={{ margin: '0 2px' }}>/shortcut</Tag> in the message composer.
          </Typography.Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
            form.setFieldsValue({ access: canPublic ? 'PUBLIC' : 'PRIVATE' });
            setEditing({});
          }}
        >
          New reply
        </Button>
      </div>

      <Table
        rowKey="id"
        loading={!rows}
        dataSource={rows || []}
        pagination={{ pageSize: 25, hideOnSinglePage: true }}
        locale={{ emptyText: 'No saved replies configured yet' }}
        columns={[
          {
            title: 'Shortcut',
            dataIndex: 'shortcut',
            width: 160,
            render: (s) => (
              <Tag
                color="blue"
                bordered={false}
                style={{ fontWeight: 600, fontFamily: 'monospace', padding: '2px 8px' }}
              >
                /{s}
              </Tag>
            ),
          },
          {
            title: 'Access',
            dataIndex: 'access',
            width: 110,
            render: (a) => (a === 'PRIVATE'
              ? <Tag icon={<LockOutlined />} bordered={false}>Private</Tag>
              : <Tag icon={<TeamOutlined />} color="green" bordered={false}>Team</Tag>),
          },
          {
            title: 'Title / Subject',
            dataIndex: 'title',
            width: 240,
            render: (t) => <span style={{ fontWeight: 600, color: '#0f172a' }}>{t}</span>,
          },
          {
            title: 'Message Content',
            dataIndex: 'body',
            render: (b) => (
              <Typography.Text ellipsis style={{ maxWidth: 500, color: '#475569' }}>
                {b}
              </Typography.Text>
            ),
          },
          {
            title: '',
            width: 130,
            render: (_, r) => (!r.canEdit ? (
              <Tooltip title="Only supervisors and admins can change team shortcuts"><Typography.Text type="secondary" style={{ fontSize: 12 }}>View only</Typography.Text></Tooltip>
            ) : (
              <Space>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => {
                    form.setFieldsValue(r);
                    setEditing(r);
                  }}
                  aria-label="Edit reply"
                />
                <Popconfirm
                  title="Delete this saved reply?"
                  okText="Delete"
                  onConfirm={() =>
                    api(`/stores/${storeId}/saved-replies/${r.id}`, { method: 'DELETE' })
                      .then(() => {
                        message.success('Reply deleted');
                        load();
                      })
                      .catch((e) => showError(e, { message }))
                  }
                >
                  <Button size="small" danger icon={<DeleteOutlined />} aria-label="Delete reply" />
                </Popconfirm>
              </Space>
            )),
          },
        ]}
      />

      <Modal
        open={!!editing}
        title={editing?.id ? 'Edit Saved Reply' : 'New Saved Reply'}
        onOk={save}
        onCancel={() => setEditing(null)}
        okText="Save reply"
        destroyOnClose
        centered
        width={500}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="shortcut"
            label="Slash Shortcut"
            rules={[
              { required: true, pattern: /^[a-z0-9_-]{1,30}$/i, message: 'Alphanumeric characters, dashes or underscores only' },
            ]}
          >
            <Input addonBefore="/" maxLength={30} placeholder="e.g. shipping, returns, pricing" />
          </Form.Item>
          <Form.Item name="access" label="Who can use it" extra={canPublic ? 'Triggers can only use team shortcuts.' : 'Team shortcuts are managed by supervisors and admins.'}>
            <Radio.Group options={[
              { value: 'PUBLIC', label: 'Team (everyone in this store)', disabled: !canPublic },
              { value: 'PRIVATE', label: 'Only me' },
            ]} />
          </Form.Item>
          <Form.Item name="title" label="Title / Label" rules={[{ required: true, message: 'Enter a title' }]}>
            <Input maxLength={80} placeholder="e.g. Shipping policy and delivery times" />
          </Form.Item>
          <Form.Item
            name="body"
            label="Response Message"
            rules={[{ required: true, message: 'Enter response text' }]}
            extra="Variables: {{visitor.name}} will be replaced with the visitor's name"
          >
            <Input.TextArea rows={5} maxLength={2000} placeholder="Type the standard response text..." />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
