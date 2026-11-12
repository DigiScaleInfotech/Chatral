import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  App as AntApp, Avatar, Badge, Button, Card, ConfigProvider, Dropdown, Empty, Flex,
  Form, Input, Layout, Menu, Modal, Select, Spin, Tag, Tooltip, Typography,
} from 'antd';
import {
  MessageOutlined, MailOutlined, ThunderboltOutlined, BgColorsOutlined, BarChartOutlined, SettingOutlined, SnippetsOutlined, EyeOutlined,
  ShopOutlined, UserOutlined, LogoutOutlined, LockOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  CheckCircleFilled, SyncOutlined, LineChartOutlined,
} from '@ant-design/icons';
import { api, showError, ROLE_LABEL, RANK } from './api.js';
import { alertFor, soundFor } from './notifications.js';
import { createSoundListener, installAudioUnlock } from './sounds.js';
import SoundControl from './components/SoundControl.jsx';
import { ChatralFullLogo, ChatralShortLogo } from './components/BrandLogo.jsx';

// Single page-wide listener: each visitor message sounds at most once, even if several components subscribe.
// The store THIS tab is showing. Not read from localStorage: that is shared by every tab, so opening
// another store in a second tab would make this tab play sounds/alerts for the wrong store.
let tabStoreId = null;
let myStoreIds = []; // every store this user can open: all of them play sounds
const onSoundEvent = createSoundListener({ getStoreIds: () => myStoreIds, classify: soundFor });
installAudioUnlock();
import { connectSocket, disconnectSocket, onSocket, subscribeStore } from './socket.js';
import { theme, BRAND } from './theme.js';
import './global.css';
import Login from './pages/Login.jsx';
import Inbox from './pages/Inbox.jsx';
import Tickets from './pages/Tickets.jsx';
import Visitors from './pages/Visitors.jsx';
import Triggers from './pages/Triggers.jsx';
import WidgetEditor from './pages/WidgetEditor.jsx';
import SavedReplies from './pages/SavedReplies.jsx';
import Reports from './pages/Reports.jsx';
import Analytics from './pages/Analytics.jsx';
import Settings from './pages/Settings.jsx';
import Platform from './pages/Platform.jsx';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

function ChangePassword({ onClose }) {
  const { message } = AntApp.useApp();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  async function save() {
    const { current, next } = await form.validateFields();
    setSaving(true);
    try {
      const { token } = await api('/auth/password', { method: 'POST', body: { current, next } });
      localStorage.setItem('token', token);
      message.success('Password changed. Other sessions were signed out.');
      onClose();
    } catch (e) {
      showError(e, { message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open title="Change password" okText="Change password" confirmLoading={saving} onOk={save} onCancel={onClose} destroyOnClose centered width={420}>
      <Form form={form} layout="vertical" requiredMark={false} style={{ marginTop: 16 }}>
        <Form.Item name="current" label="Current password" rules={[{ required: true, message: 'Enter your current password' }]}>
          <Input.Password autoComplete="current-password" placeholder="••••••••" />
        </Form.Item>
        <Form.Item name="next" label="New password" rules={[{ required: true, min: 10, message: 'Must be at least 10 characters' }]}>
          <Input.Password autoComplete="new-password" placeholder="At least 10 characters" />
        </Form.Item>
        <Form.Item
          name="confirm"
          label="Confirm new password"
          dependencies={['next']}
          rules={[
            { required: true, message: 'Confirm your new password' },
            ({ getFieldValue }) => ({
              validator: (_, v) => (!v || v === getFieldValue('next') ? Promise.resolve() : Promise.reject(new Error('Passwords do not match'))),
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" placeholder="Confirm new password" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function notifyBrowser(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted' || document.visibilityState === 'visible') return;
  try {
    new Notification(title, { body, tag: 'livechat' });
  } catch {
    /* ignore */
  }
}

function Shell() {
  const { notification } = AntApp.useApp();
  const [me, setMe] = useState(null);
  const meRef = useRef(null);
  meRef.current = me;
  const [storeId, setStoreId] = useState(localStorage.getItem('storeId'));
  tabStoreId = storeId;
  const [collapsed, setCollapsed] = useState(window.innerWidth <= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [pwOpen, setPwOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [connected, setConnected] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    const onResize = () => {
      const mob = window.innerWidth <= 768;
      setIsMobile(mob);
      if (mob) setCollapsed(true);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const loadMe = () =>
    api('/auth/me').then((m) => {
      setMe(m);
      const pick = new URLSearchParams(location.search).get('store');
      const ids = m.stores.map((s) => s.id);
      myStoreIds = ids;
      ids.forEach(subscribeStore); // receive events (and sounds) from every store, not only the open one
      setStoreId((cur) => (pick && ids.includes(pick) ? pick : ids.includes(cur) ? cur : ids[0] || null));
    });

  useEffect(() => {
    if (!localStorage.getItem('token')) return nav('/login');
    loadMe().catch(() => nav('/login'));
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    connectSocket();
    const off = onSocket((type, d) => {
      if (type === 'connected' || type === 'reconnected') setConnected(true);
      if (type === 'disconnected') setConnected(false);
      onSoundEvent(type, d);
      const curStore = tabStoreId;
      if (d?.storeId && curStore && d.storeId !== curStore) return;
      if (type === 'message' || type === 'conversation' || type === 'conversations_deleted') {
        if (curStore) {
          api(`/stores/${curStore}/conversations?limit=1`).then((r) => setUnread(r.unreadConversations)).catch(() => {});
        }
      }
      const alert = alertFor(type, d, { meId: meRef.current?.id, storeId: curStore, onInbox: location.pathname.endsWith('/inbox') });
      if (alert) {
        notifyBrowser(alert.title, alert.body);
        if (alert.toast) {
          notification.info({
            message: alert.title,
            description: alert.body,
            onClick: () => alert.conversationId && nav(`/inbox?c=${alert.conversationId}`),
          });
        }
      }
    });
    return () => {
      off();
      disconnectSocket();
    };
  }, []);

  useEffect(() => {
    if (!storeId) return;
    localStorage.setItem('storeId', storeId);
    subscribeStore(storeId);
    api(`/stores/${storeId}/conversations?limit=1`).then((r) => setUnread(r.unreadConversations)).catch(() => {});
  }, [storeId]);

  if (!me) return <Spin fullscreen tip="Loading Chatral..." />;
  const isSuper = me.role === 'SUPER_ADMIN';
  const role = isSuper ? 'SUPER' : me.memberships.find((m) => m.storeId === storeId)?.role;
  const can = (min) => !!role && RANK[role] >= RANK[min];
  const store = me.stores.find((s) => s.id === storeId);

  const items = [
    storeId && {
      key: '/inbox',
      icon: <MessageOutlined style={{ fontSize: 16 }} />,
      label: (
        <Flex justify="space-between" align="center" style={{ width: '100%' }}>
          <span>Inbox</span>
          {unread > 0 && (
            <Badge count={unread} style={{ backgroundColor: BRAND.primary, boxShadow: 'none' }} />
          )}
        </Flex>
      ),
    },
    storeId && {
      key: '/tickets',
      icon: <MailOutlined style={{ fontSize: 16 }} />,
      label: 'Tickets',
    },
    storeId && {
      key: '/visitors',
      icon: <EyeOutlined style={{ fontSize: 16 }} />,
      label: 'Visitors',
    },
    // Every agent can keep private shortcuts; team ones are managed by supervisors+.
    storeId && {
      key: '/saved-replies',
      icon: <SnippetsOutlined style={{ fontSize: 16 }} />,
      label: 'Saved replies',
    },
    storeId && can('ADMIN') && {
      key: '/triggers',
      icon: <ThunderboltOutlined style={{ fontSize: 16 }} />,
      label: 'Triggers',
    },
    storeId && can('ADMIN') && {
      key: '/widget',
      icon: <BgColorsOutlined style={{ fontSize: 16 }} />,
      label: 'Widget design',
    },
    storeId && can('SUPERVISOR') && {
      key: '/reports',
      icon: <BarChartOutlined style={{ fontSize: 16 }} />,
      label: 'Reports',
    },
    storeId && can('SUPERVISOR') && {
      key: '/analytics',
      icon: <LineChartOutlined style={{ fontSize: 16 }} />,
      label: 'Activity Analytics',
    },
    storeId && {
      key: '/settings',
      icon: <SettingOutlined style={{ fontSize: 16 }} />,
      label: 'Store settings',
    },
    isSuper && { type: 'divider', style: { borderColor: '#1e293b', margin: '12px 16px' } },
    isSuper && {
      key: '/platform',
      icon: <ShopOutlined style={{ fontSize: 16 }} />,
      label: 'Platform',
    },
  ].filter(Boolean);

  const selected = '/' + (loc.pathname.split('/')[1] || '');
  const siderW = isMobile ? 0 : collapsed ? 64 : 240;

  return (
    <Ctx.Provider value={{ me, isSuper, storeId, store, role, can, reloadMe: loadMe, setUnread, connected }}>
      <Layout className="saas-layout">
        {isMobile && !collapsed && (
          <div
            onClick={() => setCollapsed(true)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(2px)', zIndex: 999 }}
          />
        )}
        <Layout.Sider
          width={240}
          collapsedWidth={64}
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          trigger={null}
          className="saas-sider"
          style={{
            position: 'fixed',
            insetBlock: 0,
            left: isMobile && collapsed ? -240 : 0,
            zIndex: 1000,
            overflow: 'auto',
            transition: 'all .2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: isMobile && !collapsed ? '0 10px 25px -5px rgba(0, 0, 0, 0.5)' : undefined,
          }}
        >
          {/* Sidebar Brand Header */}
          <Flex
            align="center"
            justify={collapsed && !isMobile ? 'center' : 'flex-start'}
            gap={10}
            style={{
              height: 60,
              padding: collapsed && !isMobile ? '0 16px' : '0 18px',
              borderBottom: '1px solid #1e293b',
            }}
          >
            {collapsed && !isMobile ? (
              <ChatralShortLogo size={34} dark />
            ) : (
              <ChatralFullLogo height={38} dark />
            )}
          </Flex>

          {/* Navigation Menu */}
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[selected]}
            items={items}
            onClick={(e) => {
              nav(e.key);
              if (isMobile) setCollapsed(true);
            }}
            style={{
              padding: '12px 0',
              borderInlineEnd: 0,
              background: 'transparent',
            }}
          />

          {/* Bottom Store / Status indicator */}
          {(!collapsed || isMobile) && store && (
            <div
              style={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                right: 16,
                padding: '10px 12px',
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid #1e293b',
              }}
            >
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 2 }}>
                Active Store
              </div>
              <div style={{ color: '#f8fafc', fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {store.name}
              </div>
            </div>
          )}
        </Layout.Sider>

        <Layout style={{ marginLeft: siderW, transition: 'margin-left .2s cubic-bezier(0.4, 0, 0.2, 1)', minHeight: '100vh', background: BRAND.bg }}>
          {/* Top Application Bar */}
          <Layout.Header className="saas-header">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              aria-label="Toggle navigation"
              style={{ color: '#64748b', padding: '4px 8px' }}
            />

            {/* Store Switcher */}
            {me.stores.length > 0 ? (
              <Select
                value={storeId}
                onChange={(v) => {
                  setStoreId(v);
                  setUnread(0);
                }}
                style={{ minWidth: 170, maxWidth: 280 }}
                showSearch
                optionFilterProp="label"
                options={me.stores.map((s) => ({
                  value: s.id,
                  label: s.name + (s.isActive ? '' : ' (offline)'),
                }))}
                aria-label="Select store"
              />
            ) : (
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>No stores assigned</Typography.Text>
            )}

            {role && (
              <Tag
                bordered={false}
                className="hide-xs"
                style={{
                  background: '#f1f5f9',
                  color: '#334155',
                  fontWeight: 500,
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 4,
                }}
              >
                {ROLE_LABEL[role]}
              </Tag>
            )}

            <div style={{ flex: 1 }} />

            {/* Only a lost connection is shown; there is no online/offline status in the UI. */}
            {!connected && (
              <Tag color="error" bordered={false} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <SyncOutlined spin /> Reconnecting...
              </Tag>
            )}

            <SoundControl />

            {/* User Account Dropdown */}
            <Dropdown
              trigger={['click']}
              menu={{
                items: [
                  {
                    key: 'who',
                    label: (
                      <div style={{ padding: '4px 0' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{me.name}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{me.email}</div>
                      </div>
                    ),
                    disabled: true,
                  },
                  { type: 'divider' },
                  { key: 'pw', icon: <LockOutlined />, label: 'Change password' },
                  { key: 'out', icon: <LogoutOutlined />, label: 'Sign out', danger: true },
                ],
                onClick: ({ key }) => {
                  if (key === 'pw') return setPwOpen(true);
                  if (key !== 'out') return;
                  localStorage.removeItem('token');
                  disconnectSocket();
                  nav('/login');
                },
              }}
            >
              <Avatar
                style={{
                  background: '#e0e7ff',
                  color: '#3730a3',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid #c7d2fe',
                }}
                icon={!me.name ? <UserOutlined /> : undefined}
                aria-label="Account menu"
              >
                {me.name ? me.name.charAt(0).toUpperCase() : undefined}
              </Avatar>
            </Dropdown>
          </Layout.Header>

          {pwOpen && <ChangePassword onClose={() => setPwOpen(false)} />}

          {/* Main View Area */}
          <Layout.Content style={{ padding: isMobile ? 12 : 24, width: '100%', boxSizing: 'border-box' }}>
            {!storeId && !isSuper ? (
              <Card style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center' }}>
                <Empty
                  description={
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>No store membership</div>
                      <Typography.Text type="secondary">You are not a member of any store yet. Contact a store owner to invite you.</Typography.Text>
                    </div>
                  }
                />
              </Card>
            ) : (
              /* Keyed by section so each page change fades in instead of snapping. */
              <div key={selected} className="page-transition">
              <Routes>
                <Route path="/" element={<Navigate to={storeId ? '/inbox' : '/platform'} replace />} />
                {storeId && <Route path="/inbox" element={<Inbox key={storeId} />} />}
                {storeId && <Route path="/tickets" element={<Tickets key={storeId} />} />}
                {storeId && <Route path="/visitors" element={<Visitors key={storeId} />} />}
                {storeId && <Route path="/saved-replies" element={<SavedReplies key={storeId} />} />}
                {storeId && <Route path="/triggers/*" element={<Triggers key={storeId} />} />}
                {storeId && <Route path="/widget" element={<WidgetEditor key={storeId} />} />}
                {storeId && <Route path="/reports" element={<Reports key={storeId} />} />}
                {storeId && <Route path="/analytics" element={<Analytics key={storeId} />} />}
                {storeId && <Route path="/settings" element={<Settings key={storeId} />} />}
                {isSuper && <Route path="/platform" element={<Platform />} />}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              </div>
            )}
          </Layout.Content>
        </Layout>
      </Layout>
    </Ctx.Provider>
  );
}

createRoot(document.getElementById('root')).render(
  <ConfigProvider theme={theme}>
    <AntApp>
      <BrowserRouter basename="/admin">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<Shell />} />
        </Routes>
      </BrowserRouter>
    </AntApp>
  </ConfigProvider>,
);
