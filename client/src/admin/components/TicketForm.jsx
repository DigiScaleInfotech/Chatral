// New-ticket form: compose from scratch, or prefilled from a chat / offline message.
// The requestId is fixed for the life of the modal, so a double click or a retried request after a
// network error returns the same ticket instead of creating (and emailing) a second one.
import { useRef, useState } from 'react';
import { Alert, App, Button, Flex, Form, Input, Modal, Select, Upload } from 'antd';
import { PaperClipOutlined } from '@ant-design/icons';
import { api, showError, uid } from '../api.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function uploadTicketFile(storeId, file) {
  return api(`/stores/${storeId}/tickets/uploads`, { method: 'POST', raw: file, headers: { 'Content-Type': file.type || 'application/octet-stream', 'X-Filename': encodeURIComponent(file.name) } });
}

export default function TicketForm({ storeId, me, members = [], supervisor, emailReady = true, initial = {}, onClose, onCreated }) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const requestId = useRef(uid());
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const assigneeOptions = supervisor
    ? [{ value: '', label: 'Unassigned' }, ...members.map((m) => ({ value: m.userId, label: m.name }))]
    : [{ value: '', label: 'Unassigned' }, { value: me.id, label: `${me.name} (me)` }];

  async function addFile({ file }) {
    setUploading(true);
    try {
      const att = await uploadTicketFile(storeId, file);
      setFiles((f) => [...f, att]);
    } catch (e) {
      showError(e, { message });
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    let v;
    try { v = await form.validateFields(); } catch { return; } // errors are shown inline
    setSaving(true);
    try {
      const { ticket } = await api(`/stores/${storeId}/tickets`, {
        method: 'POST',
        body: {
          requestId: requestId.current, contactName: v.contactName || null, contactEmail: v.contactEmail, cc: v.cc || [],
          subject: v.subject, body: v.body, priority: v.priority, tags: v.tags || [], assigneeId: v.assigneeId || null,
          conversationId: initial.conversationId || null, attachmentIds: files.map((f) => f.id),
        },
      });
      message.success(`Ticket #${ticket.number} created. The email is being sent.`);
      onCreated?.(ticket);
    } catch (e) {
      showError(e, { message, form });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      title={initial.conversationId ? 'Create ticket from conversation' : 'New ticket'}
      okText="Create and send"
      onOk={submit}
      confirmLoading={saving}
      okButtonProps={{ disabled: uploading }}
      onCancel={onClose}
      destroyOnClose
      width={600}
      centered
    >
      {!emailReady && (
        <Alert type="warning" showIcon style={{ marginBottom: 12 }}
          message="Email isn't set up for this store"
          description="Tickets are sent by email, so a ticket can only be created once email works. Add SMTP in Store settings → Notifications & SMTP (host, port, security, username, password, from address) and use “Send test email” to confirm it works. A server admin can instead set SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS and SMTP_FROM and restart the server." />
      )}
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        initialValues={{ priority: 'NORMAL', assigneeId: initial.assigneeId || '', contactName: initial.contactName, contactEmail: initial.contactEmail, subject: initial.subject, body: initial.body, tags: initial.tags || [] }}
      >
        <Flex gap={12} wrap>
          <Form.Item name="contactName" label="Contact name" style={{ flex: '1 1 200px' }}>
            <Input maxLength={100} autoComplete="off" />
          </Form.Item>
          <Form.Item name="contactEmail" label="Email" style={{ flex: '1 1 220px' }}
            rules={[{ required: true, message: 'Enter the customer email' }, { type: 'email', message: 'Enter a valid email address' }]}>
            <Input maxLength={200} type="email" autoComplete="off" />
          </Form.Item>
        </Flex>
        <Form.Item name="cc" label="CC"
          rules={[{ validator: (_, v) => ((v || []).every((e) => EMAIL.test(e)) ? Promise.resolve() : Promise.reject(new Error('Every CC must be a valid email address'))) }]}>
          <Select mode="tags" tokenSeparators={[',', ' ', ';']} open={false} placeholder="Add email addresses" aria-label="CC recipients" />
        </Form.Item>
        <Form.Item name="subject" label="Subject" rules={[{ required: true, whitespace: true, message: 'Enter a subject' }]}>
          <Input maxLength={200} />
        </Form.Item>
        <Form.Item name="body" label="Message" rules={[{ required: true, whitespace: true, message: 'Write a message' }]}>
          <Input.TextArea autoSize={{ minRows: 4, maxRows: 12 }} maxLength={10000} />
        </Form.Item>
        <Flex gap={12} wrap>
          <Form.Item name="assigneeId" label="Assignee" style={{ flex: '1 1 160px' }}>
            <Select options={assigneeOptions} aria-label="Assignee" />
          </Form.Item>
          <Form.Item name="priority" label="Priority" style={{ flex: '1 1 120px' }}>
            <Select aria-label="Priority" options={['LOW', 'NORMAL', 'HIGH', 'URGENT'].map((p) => ({ value: p, label: p[0] + p.slice(1).toLowerCase() }))} />
          </Form.Item>
          <Form.Item name="tags" label="Tags" style={{ flex: '2 1 200px' }}>
            <Select mode="tags" tokenSeparators={[',']} open={false} placeholder="Add tags" aria-label="Tags" />
          </Form.Item>
        </Flex>
        <Upload customRequest={addFile} showUploadList={false} accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.txt,.csv,.log">
          <Button icon={<PaperClipOutlined />} loading={uploading} disabled={files.length >= 10}>Attach file</Button>
        </Upload>
        {files.length > 0 && (
          <Flex gap={6} wrap style={{ marginTop: 8 }}>
            {files.map((f) => (
              <Button key={f.id} size="small" onClick={() => setFiles((x) => x.filter((y) => y.id !== f.id))} aria-label={`Remove ${f.filename}`}>
                {f.filename} ✕
              </Button>
            ))}
          </Flex>
        )}
      </Form>
    </Modal>
  );
}
