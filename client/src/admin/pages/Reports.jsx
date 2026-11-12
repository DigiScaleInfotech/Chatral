import { useEffect, useState } from 'react';
import {
  App, Card, Col, DatePicker, Empty, Flex, Row, Spin, Statistic, Table,
  Tag, Tooltip, Typography, Button, Space, Result,
} from 'antd';
import {
  BarChartOutlined, UserOutlined, ThunderboltOutlined, ClockCircleOutlined,
  MessageOutlined, EyeOutlined, CheckCircleOutlined, GlobalOutlined, PieChartOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { api, showError, fmtDur, ROLE_LABEL } from '../api.js';
import { useApp } from '../main.jsx';

export default function Reports() {
  const { storeId } = useApp();
  const { message } = App.useApp();
  const [range, setRange] = useState([dayjs().subtract(29, 'day'), dayjs()]);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    setData(null);
    setError(null);
    api(`/stores/${storeId}/reports?from=${range[0].format('YYYY-MM-DD')}&to=${range[1].format('YYYY-MM-DD')}`)
      .then((d) => live && setData(d))
      .catch((e) => { if (live) { setError(e); showError(e, { message }); } });
    return () => { live = false; };
  }, [storeId, range, attempt]);

  if (error) {
    return (
      <Result status="warning" title="Reports could not be loaded" subTitle={error.message}
        extra={<Button type="primary" onClick={() => setAttempt((n) => n + 1)}>Try again</Button>} />
    );
  }
  if (!data) return <Spin fullscreen tip="Computing store analytics..." />;
  const c = data.conversations;
  const max = Math.max(1, ...c.perDay.map((d) => d.conversations));
  const days = [];
  for (let d = range[0].startOf('day'); !d.isAfter(range[1], 'day'); d = d.add(1, 'day')) {
    days.push(d.format('YYYY-MM-DD'));
  }

  const setPreset = (daysBack) => {
    setRange([dayjs().subtract(daysBack, 'day'), dayjs()]);
  };

  return (
    <>
      {/* Header & Date Range Filter */}
      <div className="saas-page-header">
        <div>
          <Typography.Title level={4} className="saas-page-title">
            Reports & Analytics
          </Typography.Title>
          <Typography.Text type="secondary" className="saas-page-subtitle">
            Store-scoped performance metrics derived from real-time conversation data and trigger executions.
          </Typography.Text>
        </div>
        <Space wrap>
          <Space.Compact size="small">
            <Button onClick={() => setPreset(6)}>Last 7 days</Button>
            <Button onClick={() => setPreset(13)}>Last 14 days</Button>
            <Button onClick={() => setPreset(29)}>Last 30 days</Button>
          </Space.Compact>
          <DatePicker.RangePicker
            value={range}
            onChange={(v) => v && setRange(v)}
            allowClear={false}
            disabledDate={(d) => d.isAfter(dayjs())}
            size="small"
            style={{ width: 230 }}
          />
        </Space>
      </div>

      {/* KPI Metric Summary Cards */}
      <Row gutter={[16, 16]}>
        {/* Conversations Group */}
        <Col xs={24} md={8}>
          <Card
            size="small"
            title={
              <Flex align="center" gap={6}>
                <MessageOutlined style={{ color: '#2563eb' }} />
                <span>Conversations</span>
              </Flex>
            }
            style={{ height: '100%' }}
          >
            <Statistic
              title={<span style={{ color: '#64748b', fontSize: 12 }}>Total Inquiries</span>}
              value={c.total}
              valueStyle={{ fontWeight: 700, fontSize: 26, color: '#0f172a' }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 16, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
              <div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Answered</div>
                <div style={{ fontWeight: 600, color: '#10b981', fontSize: 14 }}>{c.answered}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Missed</div>
                <div style={{ fontWeight: 600, color: '#ef4444', fontSize: 14 }}>{c.missed}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Offline</div>
                <div style={{ fontWeight: 600, color: '#f59e0b', fontSize: 14 }}>{c.offline}</div>
              </div>
            </div>
          </Card>
        </Col>

        {/* Response Times Group */}
        <Col xs={24} md={8}>
          <Card
            size="small"
            title={
              <Flex align="center" gap={6}>
                <ClockCircleOutlined style={{ color: '#10b981' }} />
                <span>Response Speed</span>
              </Flex>
            }
            style={{ height: '100%' }}
          >
            <Statistic
              title={<span style={{ color: '#64748b', fontSize: 12 }}>Avg First Response</span>}
              value={fmtDur(c.avgFirstResponseSec)}
              valueStyle={{ fontWeight: 700, fontSize: 26, color: '#0f172a' }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
              <div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Median First Reply</div>
                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>{fmtDur(c.medianFirstResponseSec)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Avg Resolution Time</div>
                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>{fmtDur(c.avgResolutionSec)}</div>
              </div>
            </div>
          </Card>
        </Col>

        {/* Traffic & Messages */}
        <Col xs={24} md={8}>
          <Card
            size="small"
            title={
              <Flex align="center" gap={6}>
                <EyeOutlined style={{ color: '#6366f1' }} />
                <span>Storefront Activity</span>
              </Flex>
            }
            style={{ height: '100%' }}
          >
            <Statistic
              title={<span style={{ color: '#64748b', fontSize: 12 }}>Active Visitors</span>}
              value={data.usage.activeVisitors}
              valueStyle={{ fontWeight: 700, fontSize: 26, color: '#0f172a' }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 16, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
              <div>
                <div style={{ fontSize: 10, color: '#64748b' }}>Pageviews</div>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{data.usage.pageViews}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#64748b' }}>Visitor Msgs</div>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{data.messages.VISITOR || 0}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#64748b' }}>Agent Msgs</div>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{data.messages.AGENT || 0}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#64748b' }}>Automated</div>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{data.messages.BOT || 0}</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Daily Volume Bar Chart */}
      <Card
        title={
          <Flex justify="space-between" align="center">
            <span style={{ fontWeight: 600, fontSize: 13 }}>Daily Conversation Volume</span>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Total: <b>{c.total}</b> conversations across {days.length} days
            </Typography.Text>
          </Flex>
        }
        size="small"
        style={{ marginTop: 20 }}
      >
        {!c.total ? (
          <Empty description="No conversation activity recorded in this date range" style={{ padding: '32px 0' }} />
        ) : (
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: days.length > 20 ? 3 : 6,
                height: 160,
                minWidth: days.length > 20 ? 320 : 'auto',
                padding: '16px 8px 4px',
                background: '#ffffff',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              {days.map((d) => {
                const n = c.perDay.find((x) => x.day === d)?.conversations || 0;
                const pct = (n / max) * 100;
                return (
                  <Tooltip key={d} title={`${dayjs(d).format('MMM D, YYYY')}: ${n} conversation${n === 1 ? '' : 's'}`}>
                    <div
                      style={{
                        flex: 1,
                        height: `${Math.max(4, pct)}%`,
                        background: n > 0 ? '#2563eb' : '#f1f5f9',
                        borderRadius: '3px 3px 0 0',
                        transition: 'all 0.15s ease',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        if (n > 0) e.currentTarget.style.backgroundColor = '#1d4ed8';
                      }}
                      onMouseLeave={(e) => {
                        if (n > 0) e.currentTarget.style.backgroundColor = '#2563eb';
                      }}
                    />
                  </Tooltip>
                );
              })}
            </div>
            <Flex justify="space-between" style={{ padding: '6px 8px 0', fontSize: 11, color: '#94a3b8' }}>
              <span>{dayjs(days[0]).format('MMM D')}</span>
              <span>{dayjs(days[Math.floor(days.length / 2)]).format('MMM D')}</span>
              <span>{dayjs(days[days.length - 1]).format('MMM D')}</span>
            </Flex>
          </div>
        )}
      </Card>

      <Audience audience={data.audience} />

      {/* Tables: Agent Performance & Trigger Analytics */}
      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        {/* Agent Activity */}
        <Col xs={24} xl={14}>
          <Card
            title={
              <Flex align="center" gap={6}>
                <UserOutlined style={{ color: '#2563eb' }} />
                <span>Agent Performance</span>
              </Flex>
            }
            size="small"
          >
            <Table
              rowKey="userId"
              size="small"
              pagination={false}
              dataSource={data.agents}
              scroll={{ x: 560 }}
              locale={{ emptyText: 'No agent responses logged in this range' }}
              columns={[
                {
                  title: 'Agent',
                  dataIndex: 'name',
                  render: (n, a) => (
                    <Flex align="center" gap={8}>
                      <span style={{ fontWeight: 600 }}>{n}</span>
                      <Tag bordered={false} style={{ fontSize: 10, padding: '0 6px', margin: 0 }}>
                        {ROLE_LABEL[a.role]}
                      </Tag>
                    </Flex>
                  ),
                },
                { title: 'Chats Replied', dataIndex: 'conversations', width: 110 },
                { title: 'Messages Sent', dataIndex: 'messages', width: 110 },
                { title: 'Resolved', dataIndex: 'resolved', width: 90 },
                {
                  title: 'Avg First Reply',
                  dataIndex: 'avgFirstResponseSec',
                  render: (v) => <Tag color="blue" bordered={false}>{fmtDur(v)}</Tag>,
                },
              ]}
            />
          </Card>
        </Col>

        {/* Trigger Analytics */}
        <Col xs={24} xl={10}>
          <Card
            title={
              <Flex align="center" gap={6}>
                <ThunderboltOutlined style={{ color: '#f59e0b' }} />
                <span>Automated Trigger Executions</span>
              </Flex>
            }
            size="small"
          >
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={data.triggers}
              locale={{ emptyText: 'No trigger runs in this range' }}
              columns={[
                {
                  title: 'Trigger Name',
                  dataIndex: 'name',
                  render: (n) => <span style={{ fontWeight: 500 }}>{n}</span>,
                },
                {
                  title: 'Succeeded',
                  dataIndex: 'SUCCEEDED',
                  render: (v) => (
                    <Tag color="green" bordered={false} style={{ margin: 0 }}>
                      {v || 0}
                    </Tag>
                  ),
                },
                {
                  title: 'Skipped',
                  dataIndex: 'SKIPPED',
                  render: (v) => (
                    <Tag bordered={false} style={{ margin: 0 }}>
                      {v || 0}
                    </Tag>
                  ),
                },
                {
                  title: 'Failed',
                  dataIndex: 'FAILED',
                  render: (v) => (
                    <Tag color={v > 0 ? 'red' : 'default'} bordered={false} style={{ margin: 0 }}>
                      {v || 0}
                    </Tag>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </>
  );
}

const regionNames = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames(['en'], { type: 'region' }) : null;
export const countryName = (code) => {
  if (!code || code === 'Unknown') return 'Unknown';
  try { return regionNames?.of(code) || code; } catch { return code; }
};

/** Where customers who chatted are from (approximate, from IP) and their answers to pre-chat choice questions. */
export function Audience({ audience }) {
  if (!audience) return null;
  const total = audience.visitors || 0;
  const pct = (n) => (total ? `${Math.round((n / total) * 100)}%` : '');
  const share = (title, rows, label) => (
    <Table size="small" rowKey={(r) => label(r)} pagination={false} dataSource={rows}
      locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data in this range" /> }}
      columns={[
        { title, key: 'k', render: (_, r) => label(r) },
        { title: 'Customers', dataIndex: 'count', width: 100, align: 'right' },
        { title: 'Share', key: 'p', width: 80, align: 'right', render: (_, r) => pct(r.count) },
      ]} />
  );
  return (
    <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
      <Col xs={24} xl={12}>
        <Card size="small" title={<Flex align="center" gap={6}><GlobalOutlined style={{ color: '#2563eb' }} /><span>Top countries</span></Flex>}
          extra={<Typography.Text type="secondary" style={{ fontSize: 12 }}>{total} customer{total === 1 ? '' : 's'} who chatted · approximate, from IP</Typography.Text>}>
          {share('Country', audience.countries, (r) => countryName(r.country))}
        </Card>
      </Col>
      <Col xs={24} xl={12}>
        <Card size="small" title={<Flex align="center" gap={6}><GlobalOutlined style={{ color: '#2563eb' }} /><span>Top cities</span></Flex>}>
          {share('City', audience.cities, (r) => `${r.city}${r.country ? `, ${countryName(r.country)}` : ''}`)}
        </Card>
      </Col>
      <Col xs={24}>
        <Card size="small" title={<Flex align="center" gap={6}><PieChartOutlined style={{ color: '#2563eb' }} /><span>Pre-chat answers (e.g. gender, age group)</span></Flex>}>
          {audience.answers.length === 0 ? (
            <Typography.Text type="secondary">
              No answers yet. Websites can't detect gender or age automatically; to report them, add a "Single choice" question
              such as Gender or Age group to the pre-chat form in Widget design.
            </Typography.Text>
          ) : (
            <Row gutter={[16, 16]}>
              {audience.answers.map((q) => (
                <Col xs={24} md={12} key={q.question}>
                  {share(q.question, q.values, (r) => r.value)}
                </Col>
              ))}
            </Row>
          )}
        </Card>
      </Col>
    </Row>
  );
}
