// Customer Activity Analytics & Content Insights — reads from /analytics and /analytics/content
// which compute everything from VisitorPageView / Visitor / Conversation / Message rows actually
// persisted by real browser events. No mock data is used here or in the API layer.
import { useEffect, useRef, useState } from 'react';
import {
  Alert, App, Badge, Button, Card, Col, DatePicker, Empty, Flex,
  Popconfirm, Row, Segmented, Space, Spin, Statistic, Table, Tag, Tabs,
  Tooltip, Typography, Result,
} from 'antd';
import {
  ArrowUpOutlined, BarChartOutlined, BulbOutlined, ClockCircleOutlined,
  EyeOutlined, GlobalOutlined, InfoCircleOutlined, QuestionCircleOutlined,
  ReloadOutlined, RiseOutlined, TeamOutlined, ThunderboltOutlined,
  WarningOutlined, SafetyOutlined, RobotOutlined, DeleteOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { api, showError } from '../api.js';
import { useApp } from '../main.jsx';
import { countryName } from './Reports.jsx';

const { Text, Title, Paragraph } = Typography;

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmtNum = (n) => (n == null ? '—' : n.toLocaleString());
const pct = (n, d) => (d ? `${Math.round((n / d) * 100)}%` : '—');

function sourceColor(source) {
  if (source === 'Direct') return '#2563eb';
  if (source === 'Organic search') return '#10b981';
  if (source === 'Organic social') return '#f59e0b';
  if (source === 'Paid search') return '#ef4444';
  if (source === 'Paid social') return '#ec4899';
  if (source === 'Email') return '#8b5cf6';
  if (source === 'Referral') return '#06b6d4';
  if (source === 'Unknown') return '#94a3b8';
  return '#64748b';
}

// ─── Date range presets ────────────────────────────────────────────────────────

const PRESETS = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
];

// ─── Top-level page ───────────────────────────────────────────────────────────

export default function Analytics() {
  const { storeId } = useApp();
  const { message } = App.useApp();
  const [range, setRange] = useState([dayjs().subtract(29, 'day'), dayjs()]);
  const [activity, setActivity] = useState(null);
  const [content, setContent] = useState(null);
  const [actErr, setActErr] = useState(null);
  const [conErr, setConErr] = useState(null);
  const [loadingAct, setLoadingAct] = useState(false);
  const [loadingCon, setLoadingCon] = useState(false);
  const [tab, setTab] = useState('activity');

  const from = range[0].format('YYYY-MM-DD');
  const to = range[1].format('YYYY-MM-DD');

  // Load activity analytics
  useEffect(() => {
    if (!storeId) return;
    let live = true;
    setActivity(null);
    setActErr(null);
    setLoadingAct(true);
    api(`/stores/${storeId}/analytics?from=${from}&to=${to}`)
      .then((d) => { if (live) { setActivity(d); setLoadingAct(false); } })
      .catch((e) => { if (live) { setActErr(e); setLoadingAct(false); showError(e, { message }); } });
    return () => { live = false; };
  }, [storeId, from, to]);

  // Load content insights
  useEffect(() => {
    if (!storeId || tab !== 'content') return;
    let live = true;
    setContent(null);
    setConErr(null);
    setLoadingCon(true);
    api(`/stores/${storeId}/analytics/content?from=${from}&to=${to}`)
      .then((d) => { if (live) { setContent(d); setLoadingCon(false); } })
      .catch((e) => { if (live) { setConErr(e); setLoadingCon(false); showError(e, { message }); } });
    return () => { live = false; };
  }, [storeId, from, to, tab]);

  const setPreset = (days) => setRange([dayjs().subtract(days - 1, 'day'), dayjs()]);
  const [resetting, setResetting] = useState(false);

  const resetData = async () => {
    try {
      setResetting(true);
      await api(`/stores/${storeId}/analytics/reset`, { method: 'POST' });
      message.success('Analytics data reset to 0. Real traffic will start recording once the widget is published on your live website.');
      setActivity(null);
      setLoadingAct(true);
      const d = await api(`/stores/${storeId}/analytics?from=${from}&to=${to}`);
      setActivity(d);
    } catch (e) {
      showError(e, { message });
    } finally {
      setResetting(false);
      setLoadingAct(false);
    }
  };

  return (
    <>
      {/* ── Header ── */}
      <div className="saas-page-header">
        <div>
          <Title level={4} className="saas-page-title" style={{ marginBottom: 2 }}>
            Customer Activity Analytics
          </Title>
          <Text type="secondary" className="saas-page-subtitle">
            Every number comes from actual browser-generated events persisted in the database.
            An empty range returns zeros — never fabricated charts.
          </Text>
        </div>
        <Space wrap>
          <Space.Compact size="small">
            {PRESETS.map((p) => (
              <Button key={p.days} onClick={() => setPreset(p.days)}>{p.label}</Button>
            ))}
          </Space.Compact>
          <DatePicker.RangePicker
            value={range}
            onChange={(v) => v && setRange(v)}
            allowClear={false}
            disabledDate={(d) => d.isAfter(dayjs())}
            size="small"
            style={{ width: 230 }}
          />
          <Popconfirm
            title="Reset Analytics Data?"
            description="This will clear all fake/historical page views and unassociated visitor counters for this store so all metrics show 0 - 0 until real visitors view your published website."
            okText="Yes, reset to 0"
            cancelText="Cancel"
            okButtonProps={{ danger: true, loading: resetting }}
            onConfirm={resetData}
          >
            <Button size="small" danger icon={<DeleteOutlined />} loading={resetting}>
              Reset Data to 0
            </Button>
          </Popconfirm>
        </Space>
      </div>

      {/* ── Tabs ── */}
      <Tabs
        activeKey={tab}
        onChange={setTab}
        size="small"
        style={{ marginBottom: 16 }}
        items={[
          {
            key: 'activity',
            label: (
              <span>
                <EyeOutlined style={{ marginRight: 6 }} />
                Visitor Activity
              </span>
            ),
          },
          {
            key: 'content',
            label: (
              <span>
                <BulbOutlined style={{ marginRight: 6 }} />
                Content Insights
              </span>
            ),
          },
        ]}
      />

      {tab === 'activity' && (
        actErr
          ? <Result status="warning" title="Analytics could not be loaded" subTitle={actErr.message}
              extra={<Button type="primary" onClick={() => { setActErr(null); setLoadingAct(true); }}>Retry</Button>} />
          : loadingAct || !activity
            ? <Spin fullscreen tip="Loading visitor analytics…" />
            : <ActivityTab data={activity} range={range} />
      )}

      {tab === 'content' && (
        conErr
          ? <Result status="warning" title="Content insights could not be loaded" subTitle={conErr.message}
              extra={<Button type="primary" onClick={() => { setConErr(null); setLoadingCon(true); setTab(''); setTimeout(() => setTab('content'), 10); }}>Retry</Button>} />
          : loadingCon || !content
            ? <Spin fullscreen tip="Analysing visitor messages…" />
            : <ContentTab data={content} />
      )}
    </>
  );
}

// ─── Activity tab ─────────────────────────────────────────────────────────────

function ActivityTab({ data, range }) {
  const s = data.summary;
  const totalDays = range[1].diff(range[0], 'day') + 1;

  return (
    <>
      {data.retention?.notice && (
        <Alert
          type="warning"
          showIcon
          message="Analytics Retention Notice"
          description={data.retention.notice}
          style={{ marginBottom: 16 }}
        />
      )}
      {/* Summary KPIs */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8} md={3}>
          <MetricCard
            icon={<EyeOutlined />}
            color="#2563eb"
            label="Page Views"
            value={fmtNum(s.totalPageViews)}
            hint="Total genuine human VisitorPageView rows in this date range (confirmed bots excluded)"
          />
        </Col>
        <Col xs={12} sm={8} md={3}>
          <MetricCard
            icon={<TeamOutlined />}
            color="#10b981"
            label="Unique Visitors"
            value={fmtNum(s.uniqueVisitors)}
            hint="Distinct human browser identities seen in this range (bots excluded)"
          />
        </Col>
        <Col xs={12} sm={8} md={3}>
          <MetricCard
            icon={<ArrowUpOutlined />}
            color="#6366f1"
            label="New Visitors"
            value={fmtNum(s.newVisitors)}
            hint="Visitors whose first-seen date falls within this range"
            sub={s.uniqueVisitors ? `${pct(s.newVisitors, s.uniqueVisitors)} of total` : null}
          />
        </Col>
        <Col xs={12} sm={8} md={3}>
          <MetricCard
            icon={<RiseOutlined />}
            color="#f59e0b"
            label="Returning"
            value={fmtNum(s.returningVisitors)}
            hint="Visitors who had at least one prior visit before this range"
            sub={s.uniqueVisitors ? `${pct(s.returningVisitors, s.uniqueVisitors)} of total` : null}
          />
        </Col>
        <Col xs={12} sm={8} md={3}>
          <MetricCard
            icon={<ThunderboltOutlined />}
            color="#ec4899"
            label="Chats Started"
            value={fmtNum(s.conversationsStarted)}
            hint="Conversations created in this date range"
          />
        </Col>
        <Col xs={12} sm={8} md={3}>
          <MetricCard
            icon={<BarChartOutlined />}
            color="#06b6d4"
            label="Chat-Start Rate"
            value={s.chatStartRate != null ? `${s.chatStartRate}%` : '—'}
            hint={
              s.chatStartRate == null
                ? 'No visitors with page views in this range — rate is unavailable (not zero)'
                : `${s.chattingVisitors || 0} distinct chatting visitors ÷ ${s.uniqueVisitors} unique visitors`
            }
            emptyState={s.chatStartRate == null}
          />
        </Col>
        <Col xs={12} sm={8} md={3}>
          <MetricCard
            icon={<ArrowUpOutlined style={{ transform: 'rotate(45deg)' }} />}
            color="#64748b"
            label="Bounce Rate"
            value={s.bounceRate != null ? `${s.bounceRate}%` : '—'}
            hint={
              s.bounceRate == null
                ? 'No human sessions in this range'
                : `${s.bouncedSessions} single-page sessions without chat ÷ ${s.totalSessions} total sessions`
            }
            emptyState={s.bounceRate == null}
          />
        </Col>
        <Col xs={12} sm={8} md={3}>
          <MetricCard
            icon={<SafetyOutlined />}
            color="#10b981"
            label="Human Traffic"
            value={data.trafficQuality?.human?.percentage != null ? `${data.trafficQuality.human.percentage}%` : '—'}
            hint="Percentage of total classified sessions that are verified human browsers"
            sub={data.trafficQuality ? `${fmtNum(data.trafficQuality.human?.sessions)} sessions` : null}
          />
        </Col>
      </Row>

      {/* Traffic Quality Card */}
      {data.trafficQuality && (
        <TrafficQualityCard quality={data.trafficQuality} style={{ marginTop: 20 }} />
      )}

      {/* Daily trend */}
      <DailyTrendChart trend={data.trend} range={range} />

      {/* Top pages + Landing pages */}
      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24} xl={12}>
          <PageTable
            title="Most-Viewed Pages"
            icon={<EyeOutlined style={{ color: '#2563eb' }} />}
            data={data.topPages}
            countLabel="Views"
            countKey="views"
            empty="No page views in this date range"
          />
        </Col>
        <Col xs={24} xl={12}>
          <PageTable
            title="Landing Pages"
            icon={<ArrowUpOutlined style={{ color: '#10b981' }} />}
            data={data.landingPages}
            countLabel="Sessions"
            countKey="sessions"
            empty="No session starts in this date range"
            hint="The first page a visitor loaded in each browser session"
          />
        </Col>
      </Row>

      {/* Traffic sources */}
      <TrafficSourcesCard sources={data.trafficSources} style={{ marginTop: 20 }} />

      {/* Geo breakdown */}
      <GeoCard geo={data.geo} style={{ marginTop: 20 }} />

      {/* Notes */}
      <DataNotes notes={data.notes} style={{ marginTop: 20 }} />
    </>
  );
}

// ─── Metric card ──────────────────────────────────────────────────────────────

function MetricCard({ icon, color, label, value, hint, sub, emptyState }) {
  return (
    <Card size="small" style={{ height: '100%' }}>
      <Flex align="center" gap={8} style={{ marginBottom: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: `${color}15`, color, display: 'grid', placeItems: 'center', flexShrink: 0,
        }}>
          {icon}
        </div>
        <Text style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{label}</Text>
        {hint && (
          <Tooltip title={hint}>
            <InfoCircleOutlined style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto' }} />
          </Tooltip>
        )}
      </Flex>
      <div style={{ fontSize: 22, fontWeight: 700, color: emptyState ? '#94a3b8' : '#0f172a' }}>
        {value}
      </div>
      {sub && <Text type="secondary" style={{ fontSize: 11 }}>{sub}</Text>}
    </Card>
  );
}

// ─── Daily trend chart (CSS bars, no library) ─────────────────────────────────

function DailyTrendChart({ trend, range }) {
  const days = [];
  for (let d = range[0].startOf('day'); !d.isAfter(range[1], 'day'); d = d.add(1, 'day')) {
    days.push(d.format('YYYY-MM-DD'));
  }
  const byDay = Object.fromEntries((trend || []).map((r) => [r.day, r]));
  const maxViews = Math.max(1, ...days.map((d) => byDay[d]?.pageViews || 0));
  const hasData = trend?.some((r) => r.pageViews > 0);

  return (
    <Card
      size="small"
      style={{ marginTop: 20 }}
      title={
        <Flex justify="space-between" align="center">
          <Text strong style={{ fontSize: 13 }}>Daily Page Views</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {hasData ? `${(trend || []).reduce((s, r) => s + r.pageViews, 0).toLocaleString()} total views` : 'No data in this range'}
          </Text>
        </Flex>
      }
    >
      {!hasData ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No page views recorded in this date range"
          style={{ padding: '32px 0' }}
        />
      ) : (
        <>
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: days.length > 30 ? 2 : 4,
            height: 140, padding: '8px 4px 0', borderBottom: '1px solid #e2e8f0',
          }}>
            {days.map((d) => {
              const row = byDay[d] || {};
              const pv = row.pageViews || 0;
              const uv = row.uniqueVisitors || 0;
              const h = Math.max(pv > 0 ? 4 : 1, Math.round((pv / maxViews) * 132));
              return (
                <Tooltip
                  key={d}
                  title={`${dayjs(d).format('MMM D, YYYY')}\n${pv.toLocaleString()} page views · ${uv.toLocaleString()} visitors`}
                >
                  <div style={{
                    flex: 1, height: h, minWidth: 2,
                    background: pv > 0 ? '#2563eb' : '#f1f5f9',
                    borderRadius: '2px 2px 0 0',
                    transition: 'background 0.15s',
                    cursor: 'default',
                  }}
                    onMouseEnter={(e) => { if (pv > 0) e.currentTarget.style.background = '#1d4ed8'; }}
                    onMouseLeave={(e) => { if (pv > 0) e.currentTarget.style.background = '#2563eb'; }}
                  />
                </Tooltip>
              );
            })}
          </div>
          <Flex justify="space-between" style={{ padding: '4px 4px 0', fontSize: 11, color: '#94a3b8' }}>
            <span>{dayjs(days[0]).format('MMM D')}</span>
            {days.length > 6 && <span>{dayjs(days[Math.floor(days.length / 2)]).format('MMM D')}</span>}
            <span>{dayjs(days[days.length - 1]).format('MMM D')}</span>
          </Flex>
        </>
      )}
    </Card>
  );
}

// ─── Page table (top pages & landing pages) ───────────────────────────────────

function PageTable({ title, icon, data, countLabel, countKey, empty, hint }) {
  return (
    <Card
      size="small"
      title={
        <Flex align="center" gap={6}>
          {icon}
          <span>{title}</span>
          {hint && (
            <Tooltip title={hint}>
              <InfoCircleOutlined style={{ fontSize: 11, color: '#94a3b8' }} />
            </Tooltip>
          )}
        </Flex>
      }
    >
      <Table
        rowKey="path"
        size="small"
        pagination={false}
        dataSource={data || []}
        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={empty} /> }}
        columns={[
          {
            title: 'Page',
            dataIndex: 'path',
            render: (path, r) => (
              <Tooltip title={path}>
                <a href={path} target="_blank" rel="noopener noreferrer"
                  style={{ maxWidth: 300, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                  {r.title || path}
                </a>
              </Tooltip>
            ),
          },
          {
            title: countLabel,
            dataIndex: countKey,
            width: 90,
            align: 'right',
            render: (v) => <Text strong>{v?.toLocaleString()}</Text>,
          },
        ]}
      />
    </Card>
  );
}

// ─── Traffic sources ──────────────────────────────────────────────────────────

function TrafficSourcesCard({ sources, style }) {
  const total = (sources || []).reduce((s, r) => s + r.sessions, 0);
  if (!sources?.length) {
    return (
      <Card size="small" title={<Flex align="center" gap={6}><GlobalOutlined style={{ color: '#2563eb' }} /><span>Traffic Sources</span></Flex>} style={style}>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No session starts in this date range" style={{ padding: '24px 0' }} />
      </Card>
    );
  }
  return (
    <Card
      size="small"
      style={style}
      title={
        <Flex align="center" gap={6}>
          <GlobalOutlined style={{ color: '#2563eb' }} />
          <span>Traffic Sources</span>
          <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
            — classified from UTM parameters and HTTP Referer (server-side only)
          </Text>
        </Flex>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sources.map((s) => {
          const bar = total ? Math.max(2, Math.round((s.sessions / total) * 100)) : 2;
          const color = sourceColor(s.source);
          return (
            <div key={s.source}>
              <Flex justify="space-between" style={{ marginBottom: 4 }}>
                <Flex align="center" gap={8}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
                  <Text style={{ fontSize: 13 }}>{s.source}</Text>
                </Flex>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {s.sessions.toLocaleString()} sessions · {s.visitors.toLocaleString()} visitors · {pct(s.sessions, total)}
                </Text>
              </Flex>
              <div style={{ height: 6, borderRadius: 3, background: '#f1f5f9', overflow: 'hidden' }}>
                <div style={{ width: `${bar}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          );
        })}
      </div>
      <Text type="secondary" style={{ fontSize: 11, marginTop: 12, display: 'block' }}>
        Each session is counted once at its landing page. UTM parameters take precedence over referrer.
        "Direct" = no referrer and no UTM. "Unknown" = a referrer was present but not in the known-domain list.
      </Text>
    </Card>
  );
}

// ─── Geo breakdown ────────────────────────────────────────────────────────────

function GeoCard({ geo, style }) {
  const empty = !geo?.countries?.length && !geo?.regions?.length && !geo?.cities?.length;
  return (
    <Card
      size="small"
      style={style}
      title={
        <Flex align="center" gap={6}>
          <GlobalOutlined style={{ color: '#10b981' }} />
          <span>Visitor Geography</span>
          <Tag style={{ fontSize: 10, marginLeft: 4 }}>Approximate · from IP</Tag>
        </Flex>
      }
      extra={
        geo?.unresolved > 0 && (
          <Tooltip title="Localhost, private networks, VPNs, or IPs not matched in the offline database">
            <Text type="secondary" style={{ fontSize: 12 }}>
              <InfoCircleOutlined style={{ marginRight: 4 }} />
              {geo.unresolved} unresolved
            </Text>
          </Tooltip>
        )
      }
    >
      {empty ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No visitor location data in this range" style={{ padding: '24px 0' }} />
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Text strong style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 8 }}>COUNTRIES</Text>
            {(geo.countries || []).map((r) => (
              <Flex key={r.value} justify="space-between" style={{ marginBottom: 4 }}>
                <Text style={{ fontSize: 13 }}>{countryName(r.value)}</Text>
                <Text strong style={{ fontSize: 13 }}>{r.count}</Text>
              </Flex>
            ))}
            {!geo.countries?.length && <Text type="secondary" style={{ fontSize: 12 }}>No data</Text>}
          </Col>
          <Col xs={24} sm={8}>
            <Text strong style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 8 }}>REGIONS / STATES</Text>
            {(geo.regions || []).map((r) => (
              <Flex key={r.value} justify="space-between" style={{ marginBottom: 4 }}>
                <Text style={{ fontSize: 13 }}>{r.value}</Text>
                <Text strong style={{ fontSize: 13 }}>{r.count}</Text>
              </Flex>
            ))}
            {!geo.regions?.length && <Text type="secondary" style={{ fontSize: 12 }}>No data</Text>}
          </Col>
          <Col xs={24} sm={8}>
            <Text strong style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 8 }}>CITIES</Text>
            {(geo.cities || []).map((r) => {
              const key = `${r.city}|${r.region}|${r.country}`;
              return (
                <Flex key={key} justify="space-between" style={{ marginBottom: 4 }}>
                  <Text style={{ fontSize: 13 }} ellipsis>
                    {r.city}{r.country ? `, ${countryName(r.country)}` : ''}
                  </Text>
                  <Text strong style={{ fontSize: 13 }}>{r.count}</Text>
                </Flex>
              );
            })}
            {!geo.cities?.length && <Text type="secondary" style={{ fontSize: 12 }}>No city data</Text>}
          </Col>
        </Row>
      )}
      <Alert
        type="info"
        showIcon
        style={{ marginTop: 12, fontSize: 12 }}
        message="Location data is approximate. VPNs, proxies, mobile carriers, and corporate networks can place a visitor in the wrong city or country. City-level precision is lower than country-level."
      />
    </Card>
  );
}

// ─── Traffic Quality card ───────────────────────────────────────────────────

function TrafficQualityCard({ quality, style }) {
  if (!quality) return null;
  const { human, bot, unknown, totalSessions, totalVisitors, formula } = quality;
  return (
    <Card
      size="small"
      style={style}
      title={
        <Flex align="center" gap={6}>
          <SafetyOutlined style={{ color: '#10b981' }} />
          <span>Traffic Quality</span>
          <Tag color="green" style={{ fontSize: 10, marginLeft: 4 }}>Bot Detection Active</Tag>
        </Flex>
      }
      extra={
        <Text type="secondary" style={{ fontSize: 12 }}>
          {fmtNum(totalSessions)} total sessions across {fmtNum(totalVisitors)} visitors
        </Text>
      }
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card type="inner" size="small" style={{ borderColor: '#bbf7d0', background: '#f0fdf4' }}>
            <Flex justify="space-between" align="center">
              <Space>
                <TeamOutlined style={{ color: '#16a34a', fontSize: 16 }} />
                <Text strong style={{ color: '#16a34a' }}>Human Traffic</Text>
              </Space>
              <Tag color="success">{human.percentage}%</Tag>
            </Flex>
            <div style={{ marginTop: 12 }}>
              <Statistic
                value={human.sessions}
                suffix={<span style={{ fontSize: 13, color: '#64748b' }}>sessions</span>}
                valueStyle={{ fontSize: 20, fontWeight: 700, color: '#16a34a' }}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>
                {fmtNum(human.visitors)} verified human visitors
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card type="inner" size="small" style={{ borderColor: '#fecaca', background: '#fef2f2' }}>
            <Flex justify="space-between" align="center">
              <Space>
                <RobotOutlined style={{ color: '#dc2626', fontSize: 16 }} />
                <Text strong style={{ color: '#dc2626' }}>Bot Traffic</Text>
              </Space>
              <Tag color="error">{bot.percentage}%</Tag>
            </Flex>
            <div style={{ marginTop: 12 }}>
              <Statistic
                value={bot.sessions}
                suffix={<span style={{ fontSize: 13, color: '#64748b' }}>sessions</span>}
                valueStyle={{ fontSize: 20, fontWeight: 700, color: '#dc2626' }}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>
                {fmtNum(bot.visitors)} crawler / scraper bots (excluded from business KPIs)
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card type="inner" size="small" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
            <Flex justify="space-between" align="center">
              <Space>
                <QuestionCircleOutlined style={{ color: '#64748b', fontSize: 16 }} />
                <Text strong style={{ color: '#475569' }}>Unclassified</Text>
              </Space>
              <Tag>{unknown.percentage}%</Tag>
            </Flex>
            <div style={{ marginTop: 12 }}>
              <Statistic
                value={unknown.sessions}
                suffix={<span style={{ fontSize: 13, color: '#64748b' }}>sessions</span>}
                valueStyle={{ fontSize: 20, fontWeight: 700, color: '#475569' }}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>
                {fmtNum(unknown.visitors)} uncertain / unclassified sessions
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Alert
        type="info"
        showIcon
        style={{ marginTop: 12, fontSize: 12 }}
        message={
          <>
            <Text strong>Calculation formula: </Text>
            {formula}
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>
              Confirmed bots are excluded from all business analytics (Page Views, Unique Visitors, Chat-Start Rate, and Journeys) so you only see genuine human customer activity.
            </Text>
          </>
        }
      />
    </Card>
  );
}

// ─── Data notes ───────────────────────────────────────────────────────────────

function DataNotes({ notes, style }) {
  if (!notes) return null;
  return (
    <Card
      size="small"
      style={style}
      title={<Flex align="center" gap={6}><WarningOutlined style={{ color: '#f59e0b' }} /><span>Data Notes &amp; Limitations</span></Flex>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Object.entries(notes).map(([key, text]) => (
          <Alert key={key} type="warning" showIcon={false} style={{ fontSize: 12 }}
            message={<><Text strong style={{ textTransform: 'capitalize' }}>{key}: </Text>{text}</>} />
        ))}
      </div>
    </Card>
  );
}

// ─── Content Insights tab ─────────────────────────────────────────────────────

function ContentTab({ data }) {
  const insufficient = data.insufficientData;

  return (
    <>
      {/* Method / confidence banner */}
      <Alert
        type={insufficient ? 'warning' : 'info'}
        showIcon
        style={{ marginBottom: 16, fontSize: 12 }}
        message={
          <>
            <Text strong>Method: </Text>{data.method}
            {' — '}
            <Text strong>Confidence: </Text>{data.confidence}
          </>
        }
      />

      {insufficient && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 16 }}
          message={`Insufficient data: only ${data.sampleSize} visitor message(s) in this range. Results below are based on very little data and may not be representative.`}
        />
      )}

      <Row gutter={[16, 16]}>
        {/* Summary stats */}
        <Col xs={24} sm={8}>
          <MetricCard
            icon={<QuestionCircleOutlined />}
            color="#6366f1"
            label="Visitor Messages Analysed"
            value={fmtNum(data.sampleSize)}
            hint="Total VISITOR-type messages in this range used for analysis"
          />
        </Col>
        <Col xs={24} sm={8}>
          <MetricCard
            icon={<QuestionCircleOutlined />}
            color="#2563eb"
            label="Questions Identified"
            value={fmtNum(data.questionCount)}
            hint="Messages that ended with '?' or started with a question word"
          />
        </Col>
        <Col xs={24} sm={8}>
          <MetricCard
            icon={<WarningOutlined />}
            color="#ef4444"
            label="Unanswered Conversations"
            value={fmtNum(data.unansweredCount)}
            hint="Conversations with at least one visitor message and no agent reply (excluding very fresh ones)"
          />
        </Col>
      </Row>

      {/* Topic clusters */}
      <Card
        size="small"
        style={{ marginTop: 20 }}
        title={
          <Flex align="center" gap={6}>
            <BarChartOutlined style={{ color: '#2563eb' }} />
            <span>Frequently Asked Topics</span>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
              — 2–4 word phrases from real visitor questions, needing ≥ 2 mentions
            </Text>
          </Flex>
        }
      >
        {!data.topics?.length ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={insufficient
              ? 'Not enough data to identify repeated topics yet'
              : 'No repeated question phrases found in this range'}
            style={{ padding: '24px 0' }}
          />
        ) : (
          <Table
            rowKey="phrase"
            size="small"
            pagination={{ pageSize: 15, hideOnSinglePage: true }}
            dataSource={data.topics}
            columns={[
              {
                title: 'Phrase',
                dataIndex: 'phrase',
                render: (v, r) => (
                  <Flex align="center" gap={8}>
                    <Text strong>"{v}"</Text>
                    {r.mentions < 5 && (
                      <Tooltip title="Fewer than 5 mentions — this is a hypothesis, not a confirmed trend">
                        <Tag color="orange" style={{ fontSize: 10 }}>hypothesis</Tag>
                      </Tooltip>
                    )}
                  </Flex>
                ),
              },
              {
                title: 'Mentions',
                dataIndex: 'mentions',
                width: 90,
                align: 'right',
                render: (v) => <Text strong>{v}</Text>,
              },
              {
                title: 'Sample quotes (real visitor messages)',
                dataIndex: 'examples',
                render: (examples) => (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {(examples || []).map((ex, i) => (
                      <Text key={i} type="secondary" style={{ fontSize: 12, fontStyle: 'italic' }}>
                        "{ex}"
                      </Text>
                    ))}
                  </div>
                ),
              },
            ]}
          />
        )}
      </Card>

      {/* Unanswered conversations */}
      {data.unansweredQuestions?.length > 0 && (
        <Card
          size="small"
          style={{ marginTop: 20 }}
          title={
            <Flex align="center" gap={6}>
              <WarningOutlined style={{ color: '#ef4444' }} />
              <span>Unanswered Questions</span>
              <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
                — conversations with no agent reply ({data.unansweredCount} total, showing first 20)
              </Text>
            </Flex>
          }
        >
          <Table
            rowKey="conversationId"
            size="small"
            pagination={false}
            dataSource={data.unansweredQuestions || []}
            columns={[
              {
                title: 'First message',
                dataIndex: 'firstMessage',
                render: (v) => <Text style={{ fontSize: 13 }}>{v || '(no text)'}</Text>,
              },
              {
                title: 'Started',
                dataIndex: 'createdAt',
                width: 160,
                render: (v) => <Text type="secondary" style={{ fontSize: 12 }}>{new Date(v).toLocaleString()}</Text>,
              },
            ]}
          />
        </Card>
      )}

      {/* Content ideas */}
      {data.contentIdeas?.length > 0 && (
        <Card
          size="small"
          style={{ marginTop: 20 }}
          title={
            <Flex align="center" gap={6}>
              <BulbOutlined style={{ color: '#f59e0b' }} />
              <span>Content Ideas</span>
              <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
                — generated from the phrases above (not AI — each idea cites its real observation)
              </Text>
            </Flex>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.contentIdeas.map((idea, i) => (
              <div key={i} style={{ borderLeft: `3px solid ${idea.hypothesis ? '#f59e0b' : '#10b981'}`, paddingLeft: 12 }}>
                <Flex align="center" gap={8} style={{ marginBottom: 4 }}>
                  <Text strong style={{ fontSize: 13 }}>{idea.idea}</Text>
                  <Tag color={idea.hypothesis ? 'orange' : 'green'} style={{ fontSize: 10 }}>
                    {idea.hypothesis ? 'hypothesis' : 'confirmed trend'}
                  </Tag>
                  <Tag style={{ fontSize: 10 }}>{idea.format}</Tag>
                </Flex>
                <Text type="secondary" style={{ fontSize: 12 }}>{idea.observation}</Text>
                {idea.sampleQuotes?.length > 0 && (
                  <div style={{ marginTop: 4 }}>
                    {idea.sampleQuotes.map((q, qi) => (
                      <Text key={qi} type="secondary" style={{ fontSize: 11, fontStyle: 'italic', display: 'block' }}>
                        "{q}"
                      </Text>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Alert
        type="info"
        showIcon
        style={{ marginTop: 20, fontSize: 12 }}
        message="All content ideas come from real visitor messages in this date range. No AI provider is used. Phrases with fewer than 5 mentions are labelled as hypotheses. Each idea includes its supporting observation and real sample quotes so you can verify it directly."
      />
    </>
  );
}
