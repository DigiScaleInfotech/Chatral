import { useEffect, useState } from 'react';
import {
  App, Alert, Button, Card, Col, Collapse, ColorPicker, Flex, Form, Input,
  InputNumber, List, Popconfirm, Radio, Row, Segmented, Select, Space, Spin,
  Switch, Tag, Tooltip, Typography,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, CloudUploadOutlined, SaveOutlined,
  DesktopOutlined, MobileOutlined, EyeOutlined, EyeInvisibleOutlined,
  HistoryOutlined, CheckCircleFilled, ArrowUpOutlined, ArrowDownOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { api, showError, TIMEZONE_OPTIONS } from '../api.js';
import { useApp } from '../main.jsx';
import ChatWindow from '../../widget/ChatWindow.jsx';
import ShadowPreview from '../components/ShadowPreview.jsx';

const DAYS = [
  ['mon', 'Monday'],
  ['tue', 'Tuesday'],
  ['wed', 'Wednesday'],
  ['thu', 'Thursday'],
  ['fri', 'Friday'],
  ['sat', 'Saturday'],
  ['sun', 'Sunday'],
];

const hex = (v) => (typeof v === 'string' ? v : v?.toHexString?.() || '#000000');

const PALETTES = [
  { name: 'Linear Indigo', primary: '#2563eb', headerText: '#ffffff', background: '#f8fafc', visitorBubble: '#2563eb', visitorText: '#ffffff', agentBubble: '#ffffff', agentText: '#0f172a' },
  { name: 'Stripe Slate', primary: '#0f172a', headerText: '#ffffff', background: '#f8fafc', visitorBubble: '#0f172a', visitorText: '#ffffff', agentBubble: '#ffffff', agentText: '#0f172a' },
  { name: 'Intercom Cyan', primary: '#0284c7', headerText: '#ffffff', background: '#f0f9ff', visitorBubble: '#0284c7', visitorText: '#ffffff', agentBubble: '#ffffff', agentText: '#0369a1' },
  { name: 'Emerald Forest', primary: '#059669', headerText: '#ffffff', background: '#f0fdf4', visitorBubble: '#059669', visitorText: '#ffffff', agentBubble: '#ffffff', agentText: '#064e3b' },
  { name: 'Royal Violet', primary: '#7c3aed', headerText: '#ffffff', background: '#faf5ff', visitorBubble: '#7c3aed', visitorText: '#ffffff', agentBubble: '#ffffff', agentText: '#4c1d95' },
  { name: 'Warm Amber', primary: '#d97706', headerText: '#ffffff', background: '#fffbeb', visitorBubble: '#d97706', visitorText: '#ffffff', agentBubble: '#ffffff', agentText: '#78350f' },
];

const SAMPLE = [
  { id: 's1', seq: 1, senderType: 'VISITOR', body: 'Hi! Do you ship internationally?', createdAt: new Date().toISOString() },
  { id: 's2', seq: 2, senderType: 'AGENT', senderName: 'Alex', body: 'Yes - we ship to 40+ countries. Where are you located?', createdAt: new Date().toISOString() },
];

function ColorField({ name, label }) {
  return (
    <Form.Item
      name={['colors', name]}
      label={<span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{label}</span>}
      getValueFromEvent={hex}
      style={{ marginBottom: 12 }}
    >
      <ColorPicker showText disabledAlpha format="hex" style={{ width: '100%', justifyContent: 'flex-start' }} />
    </Form.Item>
  );
}

function DayHours({ day, label }) {
  return (
    <Form.List name={['businessHours', 'days', day]}>
      {(fields, { add, remove }) => (
        <Flex gap={8} align="center" wrap style={{ marginBottom: 8, padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ width: 85, fontSize: 13, fontWeight: 500, color: '#334155' }}>{label}</div>
          {!fields.length && <Typography.Text type="secondary" style={{ fontSize: 12 }}>Closed</Typography.Text>}
          {fields.map((f) => (
            <Space.Compact key={f.key}>
              <Form.Item name={[f.name, 'start']} noStyle rules={[{ required: true }]}>
                <Input type="time" style={{ width: 105 }} aria-label={`${label} start`} />
              </Form.Item>
              <Form.Item name={[f.name, 'end']} noStyle rules={[{ required: true }]}>
                <Input type="time" style={{ width: 105 }} aria-label={`${label} end`} />
              </Form.Item>
              <Button icon={<DeleteOutlined />} onClick={() => remove(f.name)} aria-label="Remove hours" />
            </Space.Compact>
          ))}
          <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => add({ start: '09:00', end: '17:00' })}>
            Add hours
          </Button>
        </Flex>
      )}
    </Form.List>
  );
}


// Pre-chat field types (server validates the same list).
const PRECHAT_TYPES = [
  { value: 'name', label: 'Name' }, { value: 'email', label: 'Email' }, { value: 'phone', label: 'Phone' },
  { value: 'text', label: 'Short text' }, { value: 'textarea', label: 'Text area' }, { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' }, { value: 'select', label: 'Single choice' }, { value: 'multiselect', label: 'Multiple choice' },
];
const BUILTIN_FIELD = { name: 'name', email: 'email', phone: 'phone' };
const newFieldKey = () => `cf_${Math.random().toString(36).slice(2, 8)}`;

export default function WidgetEditor() {
  const { storeId } = useApp();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [data, setData] = useState(null);
  const [draft, setDraft] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [device, setDevice] = useState('desktop');
  const [state, setState] = useState('chat');
  const [open, setOpen] = useState(true);

  const load = () =>
    api(`/stores/${storeId}/widget`).then((d) => {
      setData(d);
      setDraft(d.draft);
      form.setFieldsValue(d.draft);
      setDirty(false);
    });

  useEffect(() => {
    load().catch((e) => showError(e, { message }));
  }, [storeId]);

  async function saveDraft(quiet) {
    const values = { ...draft, ...(await form.validateFields()) };
    await api(`/stores/${storeId}/widget/draft`, { method: 'PUT', body: values });
    setDirty(false);
    if (!quiet) message.success('Draft saved - not live yet');
    return values;
  }

  async function run(fn) {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      if (e.errorFields) message.error('Please fix the highlighted fields');
      else showError(e, { message, form });
    } finally {
      setBusy(false);
    }
  }

  function applyPalette(p) {
    const { name, ...colors } = p;
    const updated = { ...draft.colors, ...colors };
    form.setFieldValue('colors', updated);
    setDraft((d) => ({ ...d, colors: updated }));
    setDirty(true);
  }

  if (!data || !draft) return <Spin fullscreen tip="Loading widget designer..." />;
  const unpublished = dirty || JSON.stringify(draft) !== JSON.stringify(data.published);

  return (
    <div>
      {/* Top Studio Action Bar */}
      <div className="saas-page-header">
        <div>
          <Flex align="center" gap={10}>
            <Typography.Title level={4} className="saas-page-title">
              Widget Designer
            </Typography.Title>
            <Tag color="blue" bordered={false} style={{ fontWeight: 600 }}>
              Live: v{data.publishedVersion}
            </Tag>
            {dirty ? (
              <Tag color="warning" bordered={false}>Unsaved changes</Tag>
            ) : unpublished ? (
              <Tag color="gold" bordered={false}>Draft differs from live</Tag>
            ) : (
              <Tag color="success" bordered={false}>Published (Live)</Tag>
            )}
          </Flex>
          <Typography.Text type="secondary" className="saas-page-subtitle">
            Configure appearance, copy, launcher behavior, and business hours. Changes remain in draft until published.
          </Typography.Text>
        </div>

        <Space wrap>
          <Button icon={<SaveOutlined />} onClick={() => run(() => saveDraft())} loading={busy} disabled={!dirty}>
            Save draft
          </Button>
          <Popconfirm
            title="Publish this design to storefront?"
            description="Visitors will see this design on their next page load. The embed code snippet does not change."
            okText="Publish now"
            onConfirm={() =>
              run(async () => {
                await saveDraft(true);
                const r = await api(`/stores/${storeId}/widget/publish`, { method: 'POST', body: {} });
                message.success(`Successfully published v${r.version}`);
                await load();
              })
            }
          >
            <Button type="primary" icon={<CloudUploadOutlined />} loading={busy} disabled={!unpublished}>
              Publish design
            </Button>
          </Popconfirm>
        </Space>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left Column: Studio Controls */}
        <Col xs={24} xl={13}>
          <Form
            form={form}
            layout="vertical"
            onValuesChange={(_, all) => {
              setDraft((d) => ({
                ...d,
                ...all,
                colors: {
                  ...d.colors,
                  ...Object.fromEntries(Object.entries(all.colors || {}).map(([k, v]) => [k, hex(v)])),
                },
              }));
              setDirty(true);
            }}
          >
            <Collapse
              defaultActiveKey={['look', 'launcher']}
              style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8 }}
              items={[
                {
                  key: 'look',
                  label: <span style={{ fontWeight: 600, fontSize: 14 }}>Appearance & Branding</span>,
                  children: (
                    <>
                      <div style={{ marginBottom: 16 }}>
                        <Typography.Text style={{ fontSize: 12, fontWeight: 500, color: '#64748b', display: 'block', marginBottom: 8 }}>
                          PRESET THEMES:
                        </Typography.Text>
                        <Space wrap size={8}>
                          {PALETTES.map((p) => (
                            <Button
                              key={p.name}
                              size="small"
                              onClick={() => applyPalette(p)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                borderColor: draft.colors.primary === p.primary ? '#2563eb' : '#e2e8f0',
                                background: draft.colors.primary === p.primary ? '#eff6ff' : '#ffffff',
                              }}
                            >
                              <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.primary, display: 'inline-block' }} />
                              <span style={{ fontSize: 12 }}>{p.name}</span>
                            </Button>
                          ))}
                        </Space>
                      </div>

                      <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0', marginBottom: 16 }}>
                        <Typography.Text style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 8 }}>
                          COLOR PALETTE
                        </Typography.Text>
                        <Row gutter={12}>
                          <Col xs={12} sm={8}><ColorField name="primary" label="Brand Accent" /></Col>
                          <Col xs={12} sm={8}><ColorField name="headerText" label="Header Text" /></Col>
                          <Col xs={12} sm={8}><ColorField name="background" label="Chat Background" /></Col>
                          <Col xs={12} sm={8}><ColorField name="visitorBubble" label="Visitor Bubble" /></Col>
                          <Col xs={12} sm={8}><ColorField name="visitorText" label="Visitor Text" /></Col>
                          <Col xs={12} sm={8}><ColorField name="agentBubble" label="Agent Bubble" /></Col>
                          <Col xs={12} sm={8}><ColorField name="agentText" label="Agent Text" /></Col>
                        </Row>
                      </div>

                      <Row gutter={12}>
                        <Col xs={24} md={12}>
                          <Form.Item name="agentName" label="Agent display name" rules={[{ required: true }]}>
                            <Input maxLength={60} placeholder="e.g. Support Team" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item name={['font', 'family']} label="Typography font">
                            <Select
                              options={['inherit', 'system', 'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Georgia'].map((f) => ({
                                value: f,
                                label: f === 'inherit' ? 'Match host website (inherit)' : f === 'system' ? 'System default' : f,
                              }))}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item
                            name="logoUrl"
                            label="Store logo URL (HTTPS)"
                            rules={[{ pattern: /^(https:\/\/.+)?$/, message: 'Must start with https://' }]}
                          >
                            <Input placeholder="https://.../logo.png" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item
                            name="avatarUrl"
                            label="Default agent avatar URL (HTTPS)"
                            rules={[{ pattern: /^(https:\/\/.+)?$/, message: 'Must start with https://' }]}
                          >
                            <Input placeholder="https://.../avatar.jpg" />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={8}>
                          <Form.Item name={['font', 'size']} label="Base text size (px)">
                            <InputNumber min={12} max={18} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={8}>
                          <Form.Item name="sound" label="Sound on message" valuePropName="checked">
                            <Switch checkedChildren="On" unCheckedChildren="Off" />
                          </Form.Item>
                        </Col>
                      </Row>
                    </>
                  ),
                },
                {
                  key: 'launcher',
                  label: <span style={{ fontWeight: 600, fontSize: 14 }}>Launcher, Positioning & Size</span>,
                  children: (
                    <Row gutter={12}>
                      <Col xs={24} md={8}>
                        <Form.Item name={['launcher', 'position']} label="Screen position">
                          <Radio.Group
                            optionType="button"
                            options={[
                              { value: 'left', label: 'Bottom left' },
                              { value: 'right', label: 'Bottom right' },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={12} md={8}>
                        <Form.Item name={['launcher', 'offsetX']} label="Side offset (px)">
                          <InputNumber min={0} max={200} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col xs={12} md={8}>
                        <Form.Item name={['launcher', 'offsetY']} label="Bottom offset (px)">
                          <InputNumber min={0} max={300} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col xs={12} md={8}>
                        <Form.Item name={['launcher', 'size']} label="Launcher button size (px)">
                          <InputNumber min={40} max={90} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col xs={12} md={16}>
                        <Form.Item name={['launcher', 'label']} label="Button label (optional)">
                          <Input maxLength={40} placeholder="e.g. Chat with us" />
                        </Form.Item>
                      </Col>
                      <Col xs={12} md={8}>
                        <Form.Item name={['size', 'width']} label="Window width (px)">
                          <InputNumber min={300} max={520} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col xs={12} md={8}>
                        <Form.Item name={['size', 'height']} label="Window height (px)">
                          <InputNumber min={400} max={800} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col xs={24}>
                        <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0', marginTop: 4 }}>
                          <Space wrap size={24}>
                            <Form.Item name={['layout', 'mobileFullscreen']} label="Full screen on mobile" valuePropName="checked" style={{ marginBottom: 0 }}>
                              <Switch />
                            </Form.Item>
                            <Form.Item name={['layout', 'showOnDesktop']} label="Show on desktop" valuePropName="checked" style={{ marginBottom: 0 }}>
                              <Switch />
                            </Form.Item>
                            <Form.Item name={['layout', 'showOnMobile']} label="Show on mobile" valuePropName="checked" style={{ marginBottom: 0 }}>
                              <Switch />
                            </Form.Item>
                          </Space>
                        </div>
                      </Col>
                    </Row>
                  ),
                },
                {
                  key: 'msgs',
                  label: <span style={{ fontWeight: 600, fontSize: 14 }}>Copy & Greetings</span>,
                  children: (
                    <Row gutter={12}>
                      <Col xs={24} md={12}>
                        <Form.Item name={['messages', 'title']} label="Widget Header Title" rules={[{ required: true }]}>
                          <Input maxLength={60} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name={['messages', 'subtitle']} label="Header Subtitle">
                          <Input maxLength={120} />
                        </Form.Item>
                      </Col>
                      <Col xs={24}>
                        <Form.Item name={['messages', 'greeting']} label="Welcome message (first message after the pre-chat form)">
                          <Input.TextArea rows={2} maxLength={500} />
                        </Form.Item>
                      </Col>
                      <Col xs={24}>
                        <Form.Item name={['messages', 'afterPrechat']} label="Please-wait message (after the customer's details)" extra="Sent once when a customer starts a chat from the pre-chat form. Leave empty to turn it off.">
                          <Input.TextArea rows={2} maxLength={500} placeholder="Thank you for your message! Please wait 2 minutes, our customer support team will join you shortly." />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name={['messages', 'placeholder']} label="Input composer placeholder">
                          <Input maxLength={80} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name={['messages', 'offlineTitle']} label="Offline modal title">
                          <Input maxLength={60} />
                        </Form.Item>
                      </Col>
                      <Col xs={24}>
                        <Form.Item name={['messages', 'offlineText']} label="Offline intro message">
                          <Input.TextArea rows={2} maxLength={300} />
                        </Form.Item>
                      </Col>
                      <Col xs={24}>
                        <Form.Item name={['messages', 'offlineThanks']} label="Thank-you confirmation note">
                          <Input.TextArea rows={2} maxLength={300} />
                        </Form.Item>
                      </Col>
                    </Row>
                  ),
                },
                {
                  key: 'form',
                  label: <span style={{ fontWeight: 600, fontSize: 14 }}>Pre-chat Information Form</span>,
                  children: (
                    <>
                      <Form.Item name={['preChatForm', 'enabled']} label="Require visitor information before chat starts" valuePropName="checked">
                        <Switch />
                      </Form.Item>
                      <Form.List name={['preChatForm', 'fields']}>
                        {(fields, { add, remove, move }) => {
                          const current = form.getFieldValue(['preChatForm', 'fields']) || [];
                          const used = new Set(current.map((x) => x?.type));
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {fields.map((f, i) => (
                                <div key={f.key} style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                                  <Flex gap={8} align="center" wrap>
                                    <Form.Item name={[f.name, 'key']} hidden><Input /></Form.Item>
                                    <Form.Item name={[f.name, 'type']} rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                                      <Select
                                        style={{ width: 150 }}
                                        aria-label="Field type"
                                        onChange={(t) => {
                                          // Built-in types use fixed keys; custom types get a stable custom key.
                                          const row = form.getFieldValue(['preChatForm', 'fields', f.name]) || {};
                                          const key = BUILTIN_FIELD[t] || (BUILTIN_FIELD[row.key] || !row.key ? newFieldKey() : row.key);
                                          form.setFieldValue(['preChatForm', 'fields', f.name, 'key'], key);
                                        }}
                                        options={PRECHAT_TYPES.map((t) => ({ value: t.value, label: t.label, disabled: BUILTIN_FIELD[t.value] && used.has(t.value) && current[i]?.type !== t.value }))}
                                      />
                                    </Form.Item>
                                    <Form.Item name={[f.name, 'label']} rules={[{ required: true, whitespace: true, message: 'Label required' }]} style={{ marginBottom: 0, flex: '1 1 140px' }}>
                                      <Input placeholder="Field label" maxLength={60} aria-label="Field label" />
                                    </Form.Item>
                                    <Form.Item name={[f.name, 'required']} valuePropName="checked" style={{ marginBottom: 0 }}>
                                      <Switch checkedChildren="Required" unCheckedChildren="Optional" />
                                    </Form.Item>
                                    <Button size="small" icon={<ArrowUpOutlined />} disabled={i === 0} onClick={() => move(i, i - 1)} aria-label="Move field up" />
                                    <Button size="small" icon={<ArrowDownOutlined />} disabled={i === fields.length - 1} onClick={() => move(i, i + 1)} aria-label="Move field down" />
                                    <Button size="small" icon={<DeleteOutlined />} onClick={() => remove(f.name)} aria-label="Remove field" />
                                  </Flex>
                                  <Form.Item noStyle shouldUpdate>
                                    {() => (['select', 'multiselect'].includes(form.getFieldValue(['preChatForm', 'fields', f.name, 'type'])) ? (
                                      <Form.Item name={[f.name, 'options']} rules={[{ required: true, type: 'array', min: 1, message: 'Add at least one option' }]} style={{ marginTop: 8, marginBottom: 0 }}>
                                        <Select mode="tags" open={false} tokenSeparators={[',']} placeholder="Type an option and press Enter" aria-label="Options" />
                                      </Form.Item>
                                    ) : null)}
                                  </Form.Item>
                                </div>
                              ))}
                              {fields.length < 12 && (
                                <Flex gap={8} wrap>
                                  <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ key: newFieldKey(), type: 'text', label: 'New field', required: false })} style={{ width: 'fit-content' }}>
                                    Add custom field
                                  </Button>
                                  {!current.some((x) => x?.key === 'question') && (
                                    <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ key: 'question', type: 'textarea', label: 'Question', required: false })} style={{ width: 'fit-content' }}>
                                      Add Question field
                                    </Button>
                                  )}
                                </Flex>
                              )}
                              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                Answers are saved on the visitor and shown to agents in the chat. A field with the key "question" (the Question field) is also sent as the visitor's first chat message.
                              </Typography.Text>
                            </div>
                          );
                        }}
                      </Form.List>
                    </>
                  ),
                },
                {
                  key: 'rules',
                  label: <span style={{ fontWeight: 600, fontSize: 14 }}>Page Display Rules</span>,
                  children: (
                    <>
                      <Form.Item name={['displayRules', 'mode']} label="Show the widget on:">
                        <Radio.Group
                          options={[
                            { value: 'all', label: 'All storefront pages' },
                            { value: 'include', label: 'Only URLs matching specified patterns' },
                            { value: 'exclude', label: 'All pages except specified URLs' },
                          ]}
                        />
                      </Form.Item>
                      <Form.Item
                        name={['displayRules', 'patterns']}
                        label="URL patterns"
                        extra="Press Enter after each, e.g. /products, /cart, /pages/contact"
                      >
                        <Select mode="tags" open={false} placeholder="Enter URL paths..." />
                      </Form.Item>
                    </>
                  ),
                },
                {
                  key: 'behavior',
                  label: <span style={{ fontWeight: 600, fontSize: 14 }}>Widget Behaviour</span>,
                  children: (
                    <Row gutter={[16, 0]}>
                      {[
                        ['fileUpload', 'Visitors can attach files', 'Turning this off also blocks uploads on the server.'],
                        ['agentTyping', 'Show "agent is typing" to visitors', null],
                        ['visitorTypingPreview', 'Let agents see what visitors are typing', 'Sends the draft text to agents before it is sent.'],
                        ['tabNotification', 'Flash the browser tab on new messages', 'Only while the visitor is on another tab.'],
                        ['messagePreviewDesktop', 'Message preview bubble on desktop', 'Shown above the launcher while the chat is closed.'],
                        ['messagePreviewMobile', 'Message preview bubble on mobile', null],
                      ].map(([key, label, extra]) => (
                        <Col xs={24} md={12} key={key}>
                          <Form.Item name={['behavior', key]} label={label} extra={extra} valuePropName="checked">
                            <Switch />
                          </Form.Item>
                        </Col>
                      ))}
                    </Row>
                  ),
                },
                {
                  key: 'hours',
                  label: <span style={{ fontWeight: 600, fontSize: 14 }}>Business Hours & Offline Mode</span>,
                  children: (
                    <>
                      <Row gutter={12}>
                        <Col xs={24} md={8}>
                          <Form.Item
                            name={['businessHours', 'enabled']}
                            label="Enable business hours"
                            valuePropName="checked"
                            extra="Outside these hours, visitors receive the offline form automatically."
                          >
                            <Switch />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={16}>
                          <Form.Item name={['businessHours', 'timezone']} label="Store timezone">
                            <Select showSearch options={TIMEZONE_OPTIONS} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <div style={{ marginTop: 12 }}>
                        {DAYS.map(([k, l]) => (
                          <DayHours key={k} day={k} label={l} />
                        ))}
                      </div>
                      <Form.Item name="offlineBehavior" label="When offline / outside hours" style={{ marginTop: 16 }}>
                        <Radio.Group
                          options={[
                            { value: 'form', label: 'Show offline contact message form' },
                            { value: 'hide', label: 'Hide widget entirely' },
                          ]}
                        />
                      </Form.Item>
                    </>
                  ),
                },
              ]}
            />
          </Form>

          {/* Published Versions History */}
          <Card
            title={
              <Flex align="center" gap={8}>
                <HistoryOutlined />
                <span>Published Versions</span>
              </Flex>
            }
            size="small"
            style={{ marginTop: 20 }}
            extra={
              <Popconfirm
                title="Clear published version history?"
                description={<div style={{ maxWidth: 300 }}>Deletes the {Math.max(0, data.versions.length - 1)} older published version(s) from this list. The live version (v{data.publishedVersion}), your draft and the storefront widget are not changed. This cannot be undone.</div>}
                okText="Clear history"
                okButtonProps={{ danger: true }}
                onConfirm={() =>
                  run(async () => {
                    const r = await api(`/stores/${storeId}/widget/versions`, { method: 'DELETE' });
                    setData((d) => ({ ...d, versions: r.versions }));
                    message.success(r.removed ? `Cleared ${r.removed} old version${r.removed === 1 ? '' : 's'}` : 'Nothing to clear');
                  })
                }
              >
                <Button size="small" danger disabled={data.versions.length <= 1}>Clear History</Button>
              </Popconfirm>
            }
          >
            <List
              size="small"
              dataSource={data.versions}
              renderItem={(v) => (
                <List.Item
                  actions={[
                    <Popconfirm
                      key="r"
                      title={`Restore v${v.version} into draft?`}
                      description="Your current draft will be overwritten with this version. Nothing changes live on the storefront until you publish."
                      okText="Restore"
                      onConfirm={() =>
                        run(async () => {
                          const r = await api(`/stores/${storeId}/widget/restore/${v.version}`, { method: 'POST' });
                          setDraft(r.draft);
                          form.setFieldsValue(r.draft);
                          setDirty(true);
                          message.info(`Version ${v.version} restored into draft`);
                        })
                      }
                    >
                      <Button size="small">Restore to draft</Button>
                    </Popconfirm>,
                  ]}
                >
                  <Space>
                    <b>v{v.version}</b>
                    {v.version === data.publishedVersion && <Tag color="green">Live on site</Tag>}
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(v.createdAt).format('MMM D, YYYY HH:mm')}
                    </Typography.Text>
                    {v.note && <span>{v.note}</span>}
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Right Column: Sticky Live Preview Studio */}
        <Col xs={24} xl={11}>
          <div style={{ position: 'sticky', top: 76 }}>
            <Card
              size="small"
              title={
                <Flex justify="space-between" align="center" wrap gap={8}>
                  <Flex align="center" gap={8}>
                    <Segmented
                      size="small"
                      value={device}
                      onChange={setDevice}
                      options={[
                        { value: 'desktop', icon: <DesktopOutlined />, label: 'Desktop' },
                        { value: 'mobile', icon: <MobileOutlined />, label: 'Mobile' },
                      ]}
                    />
                    <Segmented
                      size="small"
                      value={state}
                      onChange={setState}
                      options={[
                        { value: 'chat', label: 'Chat' },
                        { value: 'prechat', label: 'Pre-chat' },
                        { value: 'offline', label: 'Offline' },
                      ]}
                    />
                  </Flex>
                  <Button
                    size="small"
                    icon={open ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                    onClick={() => setOpen(!open)}
                  >
                    {open ? 'Minimize' : 'Open'}
                  </Button>
                </Flex>
              }
              style={{ background: '#ffffff', borderColor: '#e2e8f0' }}
            >
              {device === 'mobile' && !draft.layout.showOnMobile && (
                <Alert
                  type="warning"
                  showIcon
                  message="Hidden on mobile based on current display settings"
                  style={{ marginBottom: 12 }}
                />
              )}

              {/* Shadow Preview Container */}
              <div
                style={{
                  background: '#0b0f19',
                  borderRadius: 8,
                  padding: device === 'mobile' ? '24px 12px' : '20px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: 640,
                }}
              >
                <ShadowPreview style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <div
                    className={`preview-stage ${draft.launcher.position}`}
                    style={{
                      transform: 'translateZ(0)',
                      width: device === 'mobile' ? 'min(360px, 100%)' : '100%',
                      maxWidth: '100%',
                      height: device === 'mobile' ? 640 : 600,
                      background: '#f8fafc',
                      borderRadius: device === 'mobile' ? 24 : 8,
                      border: device === 'mobile' ? '8px solid #1e293b' : '1px solid #334155',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <ChatWindow
                      cfg={draft}
                      open={open}
                      onToggle={() => setOpen(!open)}
                      mode={state}
                      online={state !== 'offline'}
                      messages={state === 'chat' ? SAMPLE : []}
                      agentReadSeq={1}
                      layout={{ mobile: device === 'mobile' }}
                      onSend={() => {}}
                      onPrechat={async () => {}}
                      onOffline={async () => {}}
                      canUpload
                    />
                  </div>
                </ShadowPreview>
              </div>

              <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 10, textAlign: 'center' }}>
                Real-time preview rendered directly via storefront Web Components. Sample conversation displayed for preview.
              </Typography.Text>
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  );
}
