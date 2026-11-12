// Shopify customer + last order for the open chat, looked up by the visitor's email (or one typed in).
import { useEffect, useState } from 'react';
import { Alert, Button, Descriptions, Empty, Flex, Input, Spin, Tag, Typography } from 'antd';
import { SearchOutlined, ExportOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { api } from '../api.js';
import { useApp } from '../main.jsx';

const money = (m) => (m ? new Intl.NumberFormat(undefined, { style: 'currency', currency: m.currencyCode }).format(Number(m.amount)) : '-');
const nice = (s) => (s ? s.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : '-');

export default function ShopifyPanel({ conversationId, visitorEmail }) {
  const { storeId, can } = useApp();
  const [email, setEmail] = useState(visitorEmail || '');
  const [state, setState] = useState({ loading: true });

  const load = async (q) => {
    setState({ loading: true });
    try {
      const r = await api(`/stores/${storeId}/conversations/${conversationId}/shopify${q ? `?email=${encodeURIComponent(q)}` : ''}`);
      setState({ ...r });
      if (r.email) setEmail(r.email);
    } catch (e) {
      setState({ connected: true, error: e.message });
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setEmail(visitorEmail || ''); load(); }, [conversationId, visitorEmail]);

  if (state.loading && state.connected === undefined) return <Flex justify="center" style={{ padding: 12 }}><Spin size="small" /></Flex>;
  if (state.connected === false) {
    return (
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        Shopify isn't connected.{can('ADMIN') ? ' Connect it in Store settings → Integrations to see orders here.' : ' Ask an admin to connect it.'}
      </Typography.Text>
    );
  }
  const c = state.customer;
  return (
    <div>
      <Flex gap={6} style={{ marginBottom: 10 }}>
        <Input size="small" value={email} placeholder="Customer email" aria-label="Shopify customer email"
          onChange={(e) => setEmail(e.target.value)} onPressEnter={() => email.trim() && load(email.trim())} />
        <Button size="small" icon={<SearchOutlined />} onClick={() => load(email.trim())} disabled={!email.trim()} loading={state.loading} aria-label="Search Shopify" />
      </Flex>
      {state.error && <Alert type="error" showIcon message={state.error} style={{ fontSize: 12 }} />}
      {!state.error && !state.loading && !c && (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={state.email ? 'No Shopify customer with this email' : 'No email for this visitor yet'} />
      )}
      {c && (
        <div style={{ fontSize: 12 }}>
          <Flex justify="space-between" align="center" style={{ marginBottom: 6 }}>
            <Typography.Text strong>{c.name}</Typography.Text>
            <a href={c.adminUrl} target="_blank" rel="noopener noreferrer" aria-label="Open customer in Shopify"><ExportOutlined /></a>
          </Flex>
          <Descriptions size="small" column={1} colon={false} labelStyle={{ color: '#64748b', width: 92 }}
            items={[
              { key: 'e', label: 'Email', children: c.email },
              ...(c.phone ? [{ key: 'p', label: 'Phone', children: c.phone }] : []),
              { key: 'c', label: 'Customer since', children: dayjs(c.createdAt).format('MMM D, YYYY') },
              { key: 'o', label: 'Orders', children: c.ordersCount },
              { key: 's', label: 'Total spent', children: money(c.amountSpent) },
              ...(c.tags?.length ? [{ key: 't', label: 'Tags', children: <Flex gap={4} wrap>{c.tags.map((t) => <Tag key={t} bordered={false} style={{ margin: 0 }}>{t}</Tag>)}</Flex> }] : []),
            ]} />
          <div className="inbox-side-section-title" style={{ marginTop: 12 }}>Last order</div>
          {c.lastOrder ? (
            <div style={{ border: '1px solid var(--color-border, #e2e8f0)', borderRadius: 8, padding: 10 }}>
              <Flex justify="space-between" align="center">
                <a href={c.lastOrder.adminUrl} target="_blank" rel="noopener noreferrer"><b>{c.lastOrder.name}</b></a>
                <span>{money(c.lastOrder.total)}</span>
              </Flex>
              <div style={{ color: '#64748b', margin: '4px 0 6px' }}>{dayjs(c.lastOrder.createdAt).format('MMM D, YYYY HH:mm')}</div>
              <Flex gap={4} wrap style={{ marginBottom: 6 }}>
                <Tag bordered={false} color="blue" style={{ margin: 0 }}>{nice(c.lastOrder.financialStatus)}</Tag>
                <Tag bordered={false} style={{ margin: 0 }}>{nice(c.lastOrder.fulfillmentStatus)}</Tag>
              </Flex>
              {c.lastOrder.items.map((li, i) => <div key={i}>{li.quantity} × {li.title}</div>)}
            </div>
          ) : <Typography.Text type="secondary">No orders yet</Typography.Text>}
        </div>
      )}
    </div>
  );
}
