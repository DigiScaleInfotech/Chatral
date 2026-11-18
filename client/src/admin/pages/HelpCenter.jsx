import { useEffect, useState } from 'react';
import {
  App, Button, Card, Col, Empty, Flex, Form, Input, Modal, Popconfirm, Row,
  Space, Switch, Table, Tag, Tooltip, Typography,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, QuestionCircleOutlined,
  SearchOutlined, EyeOutlined, ArrowUpOutlined, ArrowDownOutlined,
  BookOutlined, CloudUploadOutlined, SaveOutlined,
} from '@ant-design/icons';
import { api, showError } from '../api.js';
import { useApp } from '../main.jsx';

export default function HelpCenter() {
  const { storeId, can } = useApp();
  const { message } = App.useApp();
  const [faqs, setFaqs] = useState([]);
  const [publishedFaqs, setPublishedFaqs] = useState([]);
  const [helpCenterEnabled, setHelpCenterEnabled] = useState(true);
  const [publishedHelpCenterEnabled, setPublishedHelpCenterEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [previewFaq, setPreviewFaq] = useState(null);
  const [form] = Form.useForm();

  const load = () => {
    setLoading(true);
    api(`/stores/${storeId}/faqs`)
      .then((data) => {
        if (Array.isArray(data)) {
          setFaqs(data);
          setPublishedFaqs(data);
          setHelpCenterEnabled(true);
          setPublishedHelpCenterEnabled(true);
          if (data.length && !previewFaq) {
            setPreviewFaq(data[0]);
          }
        } else if (data && typeof data === 'object') {
          const list = Array.isArray(data.faqs) ? data.faqs : [];
          const pubList = Array.isArray(data.publishedFaqs) ? data.publishedFaqs : list;
          setFaqs(list);
          setPublishedFaqs(pubList);
          const enabled = data.helpCenterEnabled !== false;
          const pubEnabled = data.publishedHelpCenterEnabled !== undefined ? data.publishedHelpCenterEnabled !== false : enabled;
          setHelpCenterEnabled(enabled);
          setPublishedHelpCenterEnabled(pubEnabled);
          if (list.length && !previewFaq) {
            setPreviewFaq(list[0]);
          }
        }
      })
      .catch((e) => showError(e, { message }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [storeId]);

  const hasUnpublished =
    JSON.stringify(faqs) !== JSON.stringify(publishedFaqs) ||
    helpCenterEnabled !== publishedHelpCenterEnabled;

  const saveDraft = async (newList, newEnabled = helpCenterEnabled) => {
    setSaving(true);
    try {
      await api(`/stores/${storeId}/faqs`, {
        method: 'PUT',
        body: {
          faqs: newList,
          helpCenterEnabled: newEnabled,
          publish: false,
        },
      });
      setFaqs(newList);
      setHelpCenterEnabled(newEnabled);
    } catch (e) {
      showError(e, { message });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await api(`/stores/${storeId}/faqs`, {
        method: 'PUT',
        body: {
          faqs,
          helpCenterEnabled,
          publish: true,
        },
      });
      setPublishedFaqs(faqs);
      setPublishedHelpCenterEnabled(helpCenterEnabled);
      message.success('Help Center FAQs published to live widget!');
    } catch (e) {
      showError(e, { message });
    } finally {
      setPublishing(false);
    }
  };

  const handleOpenAdd = () => {
    form.resetFields();
    form.setFieldsValue({
      showOnHome: true,
    });
    setEditing({ isNew: true });
  };

  const handleSaveModal = async () => {
    try {
      const values = await form.validateFields();
      let updated;
      if (editing.isNew) {
        const newId = `faq_${Date.now()}`;
        const newFaq = {
          id: newId,
          question: values.question.trim(),
          answer: values.answer.trim(),
          category: 'General',
          showOnHome: values.showOnHome !== false,
        };
        updated = [...(faqs || []), newFaq];
      } else {
        updated = (faqs || []).map((f) =>
          f.id === editing.id
            ? {
                ...f,
                question: values.question.trim(),
                answer: values.answer.trim(),
                showOnHome: values.showOnHome !== false,
              }
            : f
        );
      }
      setFaqs(updated);
      if (!previewFaq && updated.length) setPreviewFaq(updated[0]);
      await saveDraft(updated, helpCenterEnabled);
      setEditing(null);
      message.info('FAQ saved to admin panel. Click "Save & Publish" to push live.');
    } catch (e) {
      showError(e, { message, form });
    }
  };

  const handleDelete = async (id) => {
    const updated = (faqs || []).filter((f) => f.id !== id);
    setFaqs(updated);
    if (previewFaq?.id === id) {
      setPreviewFaq(updated[0] || null);
    }
    await saveDraft(updated, helpCenterEnabled);
  };

  const handleToggleHome = async (id, checked) => {
    const updated = (faqs || []).map((f) =>
      f.id === id ? { ...f, showOnHome: checked } : f
    );
    setFaqs(updated);
    await saveDraft(updated, helpCenterEnabled);
  };

  const handleMove = async (index, direction) => {
    if (!faqs) return;
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= faqs.length) return;
    const updated = [...faqs];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    setFaqs(updated);
    await saveDraft(updated, helpCenterEnabled);
  };

  const filtered = (faqs || []).filter((f) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (f.question && f.question.toLowerCase().includes(q)) ||
      (f.answer && f.answer.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <div className="saas-page-header">
        <div>
          <Flex align="center" gap={10}>
            <Typography.Title level={4} className="saas-page-title">
              Help Center & Instant FAQs
            </Typography.Title>
            <Tag color="blue" bordered={false} style={{ fontWeight: 600 }}>
              Self-Service Hub
            </Tag>
          </Flex>
          <Typography.Text type="secondary" className="saas-page-subtitle">
            Create instant answers and policy articles shown directly inside your customer live chat widget (Intercom style).
          </Typography.Text>
        </div>
        {can('ADMIN') && (
          <Space>
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              loading={publishing}
              onClick={handlePublish}
              style={{
                background: '#10b981',
                borderColor: '#10b981',
                fontWeight: 600,
                boxShadow: hasUnpublished ? '0 0 0 2px rgba(16, 185, 129, 0.4)' : undefined,
              }}
            >
              Save & Publish to Live Widget
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenAdd}
              style={{ background: '#2563eb' }}
            >
              Add FAQ / Article
            </Button>
          </Space>
        )}
      </div>

      <Row gutter={[20, 20]}>
        {/* Left Column: FAQ List & Manager */}
        <Col xs={24} xl={16}>
          <Card
            size="small"
            style={{
              marginBottom: 16,
              background: helpCenterEnabled && faqs.length > 0 ? '#f0fdf4' : '#f8fafc',
              borderColor: helpCenterEnabled && faqs.length > 0 ? '#bbf7d0' : '#e2e8f0',
            }}
          >
            <Flex justify="space-between" align="center" wrap gap={12}>
              <Space direction="vertical" size={2}>
                <Space align="center" size={8}>
                  <Typography.Text strong style={{ fontSize: 13.5 }}>
                    {helpCenterEnabled && faqs.length > 0
                      ? 'Home Screen & FAQs Active'
                      : 'Messages-Only Mode (No Home Tab)'}
                  </Typography.Text>
                  <Tag color={helpCenterEnabled && faqs.length > 0 ? 'success' : 'default'} bordered={false}>
                    {helpCenterEnabled && faqs.length > 0 ? 'Home + Messages' : 'Only Messages'}
                  </Tag>
                </Space>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {helpCenterEnabled && faqs.length > 0
                    ? 'Visitors see the Home screen with quick FAQ cards and 2 bottom navigation tabs (Home & Messages).'
                    : 'Home screen and tabs are hidden. Visitors go straight into live chat messaging.'}
                </Typography.Text>
              </Space>
              {can('ADMIN') && (
                <Space align="center" size={8}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#475569' }}>Show Home in Widget:</span>
                  <Switch
                    checked={helpCenterEnabled}
                    loading={saving}
                    onChange={(checked) => {
                      setHelpCenterEnabled(checked);
                      saveDraft(faqs, checked);
                    }}
                  />
                </Space>
              )}
            </Flex>
          </Card>

          <Card>
            {/* Search Filter */}
            <Flex justify="space-between" align="center" wrap gap={12} style={{ marginBottom: 16 }}>
              <Input
                placeholder="Search questions or answers…"
                prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ maxWidth: 320 }}
                allowClear
              />
              {hasUnpublished && (
                <Tag color="warning" bordered={false} style={{ fontWeight: 500 }}>
                  ● Unpublished changes in draft
                </Tag>
              )}
            </Flex>

            <Table
              rowKey="id"
              dataSource={filtered}
              loading={loading}
              pagination={false}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No FAQs created yet"
                  >
                    {can('ADMIN') && (
                      <Button type="primary" onClick={handleOpenAdd}>
                        Create First FAQ
                      </Button>
                    )}
                  </Empty>
                ),
              }}
              columns={[
                {
                  title: 'QUESTION & ANSWER',
                  render: (_, r) => (
                    <div
                      style={{ cursor: 'pointer' }}
                      onClick={() => setPreviewFaq(r)}
                    >
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13.5 }}>
                        {r.question}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: '#64748b',
                          marginTop: 3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          lineHeight: 1.4,
                        }}
                      >
                        {r.answer}
                      </div>
                    </div>
                  ),
                },
                {
                  title: 'SHOW ON HOME',
                  width: 130,
                  align: 'center',
                  render: (_, r) => (
                    <Tooltip title="When enabled, this question appears as a quick card on the widget's home screen">
                      <Switch
                        size="small"
                        checked={r.showOnHome !== false}
                        disabled={!can('ADMIN')}
                        onChange={(chk) => handleToggleHome(r.id, chk)}
                      />
                    </Tooltip>
                  ),
                },
                {
                  title: '',
                  width: 140,
                  align: 'right',
                  render: (_, r, idx) => (
                    <Space size={4}>
                      <Tooltip title="Preview this answer">
                        <Button
                          size="small"
                          type="text"
                          icon={<EyeOutlined />}
                          onClick={() => setPreviewFaq(r)}
                        />
                      </Tooltip>
                      {can('ADMIN') && (
                        <>
                          <Tooltip title="Move up">
                            <Button
                              size="small"
                              type="text"
                              disabled={idx === 0}
                              icon={<ArrowUpOutlined />}
                              onClick={() => handleMove(idx, -1)}
                            />
                          </Tooltip>
                          <Tooltip title="Move down">
                            <Button
                              size="small"
                              type="text"
                              disabled={idx === filtered.length - 1}
                              icon={<ArrowDownOutlined />}
                              onClick={() => handleMove(idx, 1)}
                            />
                          </Tooltip>
                          <Tooltip title="Edit FAQ">
                            <Button
                              size="small"
                              type="text"
                              icon={<EditOutlined />}
                              onClick={() => {
                                form.setFieldsValue(r);
                                setEditing(r);
                              }}
                            />
                          </Tooltip>
                          <Popconfirm
                            title="Delete this FAQ?"
                            description="It will be removed from your customer live chat widget."
                            okText="Delete"
                            okButtonProps={{ danger: true }}
                            onConfirm={() => handleDelete(r.id)}
                          >
                            <Button
                              size="small"
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                            />
                          </Popconfirm>
                        </>
                      )}
                    </Space>
                  ),
                },
              ]}
            />

            <Flex justify="space-between" align="center" style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {(faqs || []).length} total FAQs • {(faqs || []).filter((f) => f?.showOnHome !== false).length} displayed on Home greeting
              </Typography.Text>
              {hasUnpublished && (
                <Typography.Text type="warning" style={{ fontSize: 12, fontWeight: 500 }}>
                  Draft saved in admin. Not published to widget yet.
                </Typography.Text>
              )}
            </Flex>
          </Card>
        </Col>

        {/* Right Column: Live Customer Widget Preview */}
        <Col xs={24} xl={8}>
          <Card
            title={
              <Flex align="center" gap={8}>
                <BookOutlined style={{ color: '#2563eb' }} />
                <span>Customer Widget Preview</span>
              </Flex>
            }
          >
            {/* Mock Widget Frame */}
            <div
              style={{
                borderRadius: 16,
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
              }}
            >
              {/* Widget Gradient Header */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  padding: '16px 18px',
                  color: '#ffffff',
                }}
              >
                <div style={{ fontSize: 13, opacity: 0.9 }}>Hi there 👋</div>
                <div style={{ fontSize: 17, fontWeight: 700, marginTop: 2 }}>
                  How can we help?
                </div>
              </div>

              {/* Widget Content Body */}
              <div style={{ padding: '14px 14px 18px', background: '#ffffff', minHeight: 280 }}>
                {previewFaq ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 10 }}>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>Instant Answer</span>
                    </div>

                    <div style={{ fontWeight: 700, fontSize: 14.5, color: '#0f172a', marginBottom: 8 }}>
                      {previewFaq.question}
                    </div>

                    <div
                      style={{
                        fontSize: 12.5,
                        color: '#475569',
                        lineHeight: 1.55,
                        background: '#f8fafc',
                        padding: 12,
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {previewFaq.answer}
                    </div>

                    <div
                      style={{
                        marginTop: 14,
                        paddingTop: 12,
                        borderTop: '1px dashed #e2e8f0',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>
                        Still have questions?
                      </div>
                      <Button size="small" type="primary" style={{ background: '#2563eb', borderRadius: 6 }}>
                        💬 Chat with an Agent
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Select an FAQ from the list to preview how customers see it."
                  />
                )}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Modal: Add / Edit FAQ */}
      <Modal
        open={!!editing}
        title={editing?.isNew ? 'Create New FAQ / Article' : 'Edit FAQ Article'}
        okText={editing?.isNew ? 'Save FAQ' : 'Save Changes'}
        confirmLoading={saving}
        onOk={handleSaveModal}
        onCancel={() => setEditing(null)}
        destroyOnClose
        centered
        width={560}
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            name="question"
            label="Question / Title"
            rules={[{ required: true, message: 'Please enter the customer question' }]}
          >
            <Input maxLength={200} placeholder="e.g. How can I get started?" />
          </Form.Item>

          <Form.Item
            name="showOnHome"
            label="Show on Home Screen"
            valuePropName="checked"
            extra="When enabled, this FAQ appears as a quick card on the widget's home greeting."
          >
            <Switch checkedChildren="Yes" unCheckedChildren="No" />
          </Form.Item>

          <Form.Item
            name="answer"
            label="Answer & Instructions"
            rules={[{ required: true, message: 'Please write the answer' }]}
            extra="Clear, friendly instructions that solve the customer's problem in seconds."
          >
            <Input.TextArea
              rows={5}
              maxLength={3000}
              showCount
              placeholder="e.g. Once your order has been dispatched, you will receive an email and SMS with the tracking link..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
