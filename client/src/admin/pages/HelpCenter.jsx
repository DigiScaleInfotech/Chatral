import { useEffect, useState } from 'react';
import {
  App, Button, Card, Col, Empty, Flex, Form, Input, Modal, Popconfirm, Row, Select,
  Space, Switch, Table, Tag, Tooltip, Typography,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, QuestionCircleOutlined,
  SearchOutlined, EyeOutlined, ArrowUpOutlined, ArrowDownOutlined,
  BookOutlined, ThunderboltOutlined, CloudUploadOutlined, SaveOutlined,
} from '@ant-design/icons';
import { api, showError } from '../api.js';
import { useApp } from '../main.jsx';

const TEMPLATES = [
  {
    question: 'How do I track my order?',
    category: 'Orders',
    answer: 'Once your order has been dispatched, you will receive an email and SMS with the tracking link and courier details. You can also contact our support team here with your Order ID for real-time updates.',
  },
  {
    question: 'What are your delivery times & charges?',
    category: 'Shipping',
    answer: 'Standard delivery takes 3 to 5 business days across major cities. We offer Free Shipping on orders above ₹999. Express delivery options are also available at checkout.',
  },
  {
    question: 'What is your return & refund policy?',
    category: 'Returns',
    answer: 'We offer a 7-day easy return policy for unused items in original packaging. Once we receive and inspect the returned item, your refund is credited within 3-5 business days.',
  },
  {
    question: 'Do you accept Cash on Delivery (COD)?',
    category: 'Payment',
    answer: 'Yes! Cash on Delivery is available on most pincodes. We also accept UPI (GPay, PhonePe, Paytm), Debit/Credit Cards, and Net Banking.',
  },
  {
    question: 'How can I contact customer support?',
    category: 'Support',
    answer: 'Our customer support team is available Monday to Saturday, 9:00 AM to 7:00 PM. You can chat with us live using this widget or email us at support@chatral.com.',
  },
];

const CATEGORY_COLORS = {
  Setup: 'blue',
  Accounts: 'cyan',
  Customization: 'geekblue',
  Automation: 'purple',
  Security: 'green',
  Support: 'orange',
  Orders: 'blue',
  Shipping: 'purple',
  Returns: 'orange',
  Payment: 'green',
  General: 'default',
};

export default function HelpCenter() {
  const { storeId, can } = useApp();
  const { message } = App.useApp();
  const [faqs, setFaqs] = useState([]);
  const [helpCenterEnabled, setHelpCenterEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [editing, setEditing] = useState(null);
  const [previewFaq, setPreviewFaq] = useState(null);
  const [form] = Form.useForm();

  const load = () => {
    setLoading(true);
    api(`/stores/${storeId}/faqs`)
      .then((data) => {
        if (Array.isArray(data)) {
          setFaqs(data);
          setHelpCenterEnabled(true);
          if (data.length && !previewFaq) {
            setPreviewFaq(data[0]);
          }
        } else if (data && typeof data === 'object') {
          const list = Array.isArray(data.faqs) ? data.faqs : [];
          setFaqs(list);
          setHelpCenterEnabled(data.helpCenterEnabled !== false);
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

  const saveList = async (newList, newEnabled = helpCenterEnabled) => {
    setSaving(true);
    try {
      const res = await api(`/stores/${storeId}/faqs`, {
        method: 'PUT',
        body: {
          faqs: newList,
          helpCenterEnabled: newEnabled,
        },
      });
      const returnedList = Array.isArray(res?.faqs) ? res.faqs : newList;
      setFaqs(returnedList);
      if (typeof res?.helpCenterEnabled === 'boolean') {
        setHelpCenterEnabled(res.helpCenterEnabled);
      }
      message.success('Help Center settings published to live widget!');
    } catch (e) {
      showError(e, { message });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAdd = () => {
    form.resetFields();
    form.setFieldsValue({
      category: 'General',
      showOnHome: true,
    });
    setEditing({ isNew: true });
  };

  const handleApplyTemplate = (tmpl) => {
    form.setFieldsValue({
      question: tmpl.question,
      category: tmpl.category,
      answer: tmpl.answer,
      showOnHome: true,
    });
  };

  const handleSaveModal = async () => {
    try {
      const values = await form.validateFields();
      let updated;
      if (editing.isNew) {
        const newId = `faq_${Date.now()}`;
        const newFaq = {
          id: newId,
          ...values,
        };
        updated = [...(faqs || []), newFaq];
      } else {
        updated = (faqs || []).map((f) =>
          f.id === editing.id ? { ...f, ...values } : f
        );
      }
      await saveList(updated);
      setEditing(null);
    } catch (e) {
      showError(e, { message, form });
    }
  };

  const handleDelete = async (id) => {
    const updated = (faqs || []).filter((f) => f.id !== id);
    await saveList(updated);
    if (previewFaq?.id === id) {
      setPreviewFaq(updated[0] || null);
    }
  };

  const handleToggleHome = async (id, checked) => {
    const updated = (faqs || []).map((f) =>
      f.id === id ? { ...f, showOnHome: checked } : f
    );
    await saveList(updated);
  };

  const handleMove = async (index, direction) => {
    if (!faqs) return;
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= faqs.length) return;
    const updated = [...faqs];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    await saveList(updated);
  };

  const categories = ['ALL', ...new Set((faqs || []).map((f) => f.category || 'General'))];

  const filtered = (faqs || []).filter((f) => {
    const matchCat = categoryFilter === 'ALL' || f.category === categoryFilter;
    const matchQuery =
      !search ||
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQuery;
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
              loading={saving}
              onClick={() => saveList(faqs || [])}
              style={{
                background: '#10b981',
                borderColor: '#10b981',
                fontWeight: 600,
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
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
                      saveList(faqs, checked);
                    }}
                  />
                </Space>
              )}
            </Flex>
          </Card>

          <Card>
            {/* Search and Category Filter */}
            <Flex justify="space-between" align="center" wrap gap={12} style={{ marginBottom: 16 }}>
              <Input
                placeholder="Search questions or answers…"
                prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ maxWidth: 280 }}
                allowClear
              />
              <Space wrap>
                <span style={{ fontSize: 12, color: '#64748b' }}>Category:</span>
                <Select
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  style={{ width: 140 }}
                  options={categories.map((c) => ({ label: c, value: c }))}
                />
              </Space>
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
                  title: 'CATEGORY',
                  width: 120,
                  dataIndex: 'category',
                  render: (cat) => (
                    <Tag
                      color={CATEGORY_COLORS[cat] || 'default'}
                      bordered={false}
                      style={{ fontWeight: 600 }}
                    >
                      {cat || 'General'}
                    </Tag>
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

            {can('ADMIN') && (
              <Flex justify="space-between" align="center" style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {(faqs || []).length} total FAQs • {(faqs || []).filter((f) => f?.showOnHome).length} displayed on Home greeting
                </Typography.Text>
                <Button
                  type="primary"
                  icon={<CloudUploadOutlined />}
                  loading={saving}
                  onClick={() => saveList(faqs || [])}
                  style={{
                    background: '#10b981',
                    borderColor: '#10b981',
                    fontWeight: 600,
                  }}
                >
                  Save & Publish to Live Widget
                </Button>
              </Flex>
            )}
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <Tag color={CATEGORY_COLORS[previewFaq.category] || 'default'} bordered={false}>
                        {previewFaq.category || 'General'}
                      </Tag>
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
        okText={editing?.isNew ? 'Publish FAQ' : 'Save Changes'}
        confirmLoading={saving}
        onOk={handleSaveModal}
        onCancel={() => setEditing(null)}
        destroyOnClose
        centered
        width={560}
      >
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>
            Quick Pre-fill Templates
          </div>
          <Space wrap size={[6, 6]}>
            {TEMPLATES.map((tmpl) => (
              <Button
                key={tmpl.question}
                size="small"
                icon={<ThunderboltOutlined style={{ color: '#2563eb' }} />}
                onClick={() => handleApplyTemplate(tmpl)}
              >
                {tmpl.category}
              </Button>
            ))}
          </Space>
        </div>

        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            name="question"
            label="Question / Title"
            rules={[{ required: true, message: 'Please enter the customer question' }]}
          >
            <Input maxLength={200} placeholder="e.g. How do I install Chatral on my website?" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={14}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: 'Select or type category' }]}
              >
                <Select
                  options={[
                    { label: 'Orders', value: 'Orders' },
                    { label: 'Shipping', value: 'Shipping' },
                    { label: 'Returns', value: 'Returns' },
                    { label: 'Payment', value: 'Payment' },
                    { label: 'Support', value: 'Support' },
                    { label: 'General', value: 'General' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item
                name="showOnHome"
                label="Show on Home"
                valuePropName="checked"
              >
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
              </Form.Item>
            </Col>
          </Row>

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
