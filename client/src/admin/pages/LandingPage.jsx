import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Button, Card, Col, Collapse, Divider, Flex, Grid, Row, Segmented, Tag, Typography,
} from 'antd';
import {
  ThunderboltOutlined, GlobalOutlined, ShopOutlined, TeamOutlined, LockOutlined,
  CheckCircleFilled, ArrowRightOutlined, MessageOutlined,
  SendOutlined, RocketOutlined, PlayCircleOutlined,
} from '@ant-design/icons';
import { ChatralFullLogo } from '../components/BrandLogo.jsx';

const { useBreakpoint } = Grid;

export default function LandingPage() {
  const nav = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [billingCycle, setBillingCycle] = useState('yearly');
  const [demoInput, setDemoInput] = useState('');
  const [demoMessages, setDemoMessages] = useState([
    { sender: 'bot', text: 'Hi there! 👋 Welcome to our store. Looking for something special today?', time: 'Just now' },
    { sender: 'visitor', text: 'Hey! Do you offer express shipping to Mumbai?', time: 'Just now' },
    { sender: 'agent', text: 'Yes, absolutely! Order before 4 PM and you will receive next-day delivery.', time: 'Just now' },
  ]);

  const handleDemoSend = (e) => {
    e?.preventDefault();
    if (!demoInput.trim()) return;
    const msg = demoInput.trim();
    setDemoInput('');
    setDemoMessages((prev) => [...prev, { sender: 'visitor', text: msg, time: 'Just now' }]);
    setTimeout(() => {
      setDemoMessages((prev) => [
        ...prev,
        { sender: 'agent', text: 'Thanks for reaching out! Our team is right here to assist you.', time: 'Just now' },
      ]);
    }, 700);
  };

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ background: '#ffffff', color: '#0f172a', minHeight: '100vh', overflowX: 'hidden', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* 1. Header / Navbar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid #e2e8f0',
          padding: '0 24px',
        }}
      >
        <div style={{ maxWidth: 1240, margin: '0 auto', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
            <ChatralFullLogo height={34} dark={false} />
          </Link>

          {!isMobile && (
            <Flex gap={28} align="center">
              <a onClick={() => scrollTo('features')} style={{ color: '#475569', fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'color 0.2s' }}>
                Features
              </a>
              <a onClick={() => scrollTo('how-it-works')} style={{ color: '#475569', fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'color 0.2s' }}>
                How It Works
              </a>
              <a onClick={() => scrollTo('demo')} style={{ color: '#475569', fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'color 0.2s' }}>
                Interactive Demo
              </a>
              <a onClick={() => scrollTo('pricing')} style={{ color: '#475569', fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'color 0.2s' }}>
                Pricing
              </a>
              <a onClick={() => scrollTo('faq')} style={{ color: '#475569', fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'color 0.2s' }}>
                FAQ
              </a>
            </Flex>
          )}

          <Flex gap={12} align="center">
            <Button
              type="text"
              onClick={() => nav('/login')}
              style={{ color: '#0f172a', fontWeight: 600 }}
            >
              Sign In
            </Button>
            <Button
              type="primary"
              size={isMobile ? 'middle' : 'large'}
              icon={<RocketOutlined />}
              onClick={() => nav('/login?mode=signup')}
              style={{
                background: '#2563eb',
                border: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                borderRadius: 8,
              }}
            >
              Start Free Trial
            </Button>
          </Flex>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section style={{ position: 'relative', background: 'radial-gradient(ellipse at 50% 0%, rgba(37, 99, 235, 0.08) 0%, rgba(248, 250, 252, 0) 70%)', padding: isMobile ? '50px 16px 40px' : '80px 24px 60px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 999, marginBottom: 24 }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
            <Typography.Text style={{ color: '#1d4ed8', fontSize: 13, fontWeight: 600 }}>
              Chatral 2.0 • Real-Time Multi-Store Customer Messaging
            </Typography.Text>
          </div>

          <Typography.Title
            level={1}
            style={{
              color: '#0f172a',
              fontSize: isMobile ? 36 : 56,
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              margin: '0 auto 20px',
              maxWidth: 920,
            }}
          >
            Convert Website Visitors into Paying Customers with{' '}
            <span style={{ background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Real-Time Live Chat
            </span>
          </Typography.Title>

          <Typography.Paragraph
            style={{
              color: '#475569',
              fontSize: isMobile ? 16 : 19,
              lineHeight: 1.6,
              maxWidth: 720,
              margin: '0 auto 36px',
            }}
          >
            Lightweight, modern, and lightning fast. Track live visitor journeys, trigger automated sales greetings, view Shopify orders inside chat, and close more deals from a single intuitive dashboard.
          </Typography.Paragraph>

          <Flex justify="center" gap={16} wrap="wrap" style={{ marginBottom: 36 }}>
            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              onClick={() => nav('/login?mode=signup')}
              style={{
                height: 50,
                padding: '0 32px',
                fontSize: 16,
                fontWeight: 600,
                background: '#2563eb',
                border: 'none',
                boxShadow: '0 8px 25px rgba(37, 99, 235, 0.3)',
                borderRadius: 10,
              }}
            >
              Get Started Free — 14 Days Trial
            </Button>
            <Button
              size="large"
              icon={<PlayCircleOutlined />}
              onClick={() => scrollTo('demo')}
              style={{
                height: 50,
                padding: '0 28px',
                fontSize: 15,
                fontWeight: 600,
                color: '#0f172a',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 10,
              }}
            >
              Try Live Interactive Demo
            </Button>
          </Flex>

          <Flex justify="center" gap={24} wrap="wrap" style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>
            <span><CheckCircleFilled style={{ color: '#10b981', marginRight: 6 }} /> No credit card required</span>
            <span><CheckCircleFilled style={{ color: '#10b981', marginRight: 6 }} /> 2-minute 1-line script install</span>
            <span><CheckCircleFilled style={{ color: '#10b981', marginRight: 6 }} /> Shopify & WordPress ready</span>
          </Flex>
        </div>

        {/* Hero Interactive App Mockup Preview */}
        <div style={{ maxWidth: 1100, margin: '50px auto 0', position: 'relative' }}>
          <Card
            bordered={false}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 20,
              overflow: 'hidden',
              boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.12), 0 0 1px 1px rgba(15, 23, 42, 0.05)',
            }}
            bodyStyle={{ padding: isMobile ? 12 : 24 }}
          >
            {/* Window bar */}
            <Flex align="center" justify="space-between" style={{ paddingBottom: 16, borderBottom: '1px solid #f1f5f9', marginBottom: 16 }}>
              <Flex gap={8} align="center">
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} />
                <Typography.Text style={{ color: '#64748b', fontSize: 12, marginLeft: 12, fontWeight: 500 }}>
                  Chatral Unified Operator Inbox • store-alpha.com
                </Typography.Text>
              </Flex>
              <Tag color="success" bordered={false} style={{ margin: 0, fontWeight: 500 }}>
                ● Realtime WebSocket Connected
              </Tag>
            </Flex>

            {/* Split Mockup */}
            <Row gutter={[20, 20]}>
              {/* Left Column: Chat conversation view */}
              <Col xs={24} lg={15}>
                <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16, minHeight: 340, display: 'flex', flexDirection: 'column' }}>
                  <Flex justify="space-between" align="center" style={{ paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
                    <Flex gap={10} align="center">
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600 }}>
                        JP
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>Jaydeep Patel</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>Surat, India • Chrome on macOS • 4 page views</div>
                      </div>
                    </Flex>
                    <Tag color="blue" bordered={false}>High Intent Buyer</Tag>
                  </Flex>

                  {/* Chat messages */}
                  <div style={{ flex: 1, padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ alignSelf: 'flex-start', maxWidth: '80%', background: '#f1f5f9', padding: '10px 14px', borderRadius: '12px 12px 12px 2px', fontSize: 13, color: '#0f172a' }}>
                      Hello! I have added the Premium Plan to my cart, does it include Shopify sync?
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>12:28 PM</div>
                    </div>
                    <div style={{ alignSelf: 'flex-end', maxWidth: '80%', background: '#2563eb', padding: '10px 14px', borderRadius: '12px 12px 2px 12px', fontSize: 13, color: '#ffffff' }}>
                      Hi Jaydeep! Yes, both Starter and Pro plans include full real-time Shopify sync with customer order history!
                      <div style={{ fontSize: 10, color: '#bfdbfe', marginTop: 4, textAlign: 'right' }}>12:29 PM • Read</div>
                    </div>
                    <div style={{ alignSelf: 'flex-start', maxWidth: '80%', background: '#f1f5f9', padding: '10px 14px', borderRadius: '12px 12px 12px 2px', fontSize: 13, color: '#0f172a' }}>
                      Awesome! Proceeding with checkout now. Thank you! 🙌
                    </div>
                  </div>

                  {/* Reply box mockup */}
                  <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#94a3b8', fontSize: 13 }}>Type a reply or press &apos;/&apos; for saved shortcuts...</span>
                    <Button type="primary" size="small" icon={<SendOutlined />} style={{ background: '#2563eb' }}>Send</Button>
                  </div>
                </div>
              </Col>

              {/* Right Column: Visitor & Shopify Intelligence */}
              <Col xs={24} lg={9}>
                <div style={{ background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16, minHeight: 340 }}>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShopOutlined style={{ color: '#2563eb' }} /> Shopify Customer Details
                  </div>

                  <div style={{ background: '#ffffff', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 12 }}>
                    <Flex justify="space-between" style={{ marginBottom: 6 }}>
                      <span style={{ color: '#64748b', fontSize: 12 }}>Lifetime Orders:</span>
                      <strong style={{ color: '#0f172a', fontSize: 12 }}>4 Orders</strong>
                    </Flex>
                    <Flex justify="space-between" style={{ marginBottom: 6 }}>
                      <span style={{ color: '#64748b', fontSize: 12 }}>Total Spent:</span>
                      <strong style={{ color: '#16a34a', fontSize: 12 }}>$489.00 USD</strong>
                    </Flex>
                    <Flex justify="space-between">
                      <span style={{ color: '#64748b', fontSize: 12 }}>Active Cart:</span>
                      <strong style={{ color: '#2563eb', fontSize: 12 }}>$149.00 (2 items)</strong>
                    </Flex>
                  </div>

                  <div style={{ fontWeight: 600, color: '#0f172a', margin: '14px 0 8px', fontSize: 13 }}>
                    Live Visitor Journey (Last 5 mins)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#475569' }}>
                    <div>📍 12:25 PM • Landed from <b>Google Organic</b></div>
                    <div>📄 12:26 PM • Viewed <code>/pricing</code> (2m 14s)</div>
                    <div>🛒 12:28 PM • Viewed <code>/checkout</code> (Trigger fired)</div>
                    <div>💬 12:28 PM • Started conversation with Agent</div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </div>
      </section>

      {/* 3. Numbers / Metrics Bar */}
      <section style={{ borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: '40px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Row gutter={[24, 24]} justify="center" align="middle" style={{ textAlign: 'center' }}>
            <Col xs={12} sm={6}>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#2563eb' }}>150,000+</div>
              <div style={{ color: '#64748b', fontSize: 13, marginTop: 4, fontWeight: 500 }}>Messages Delivered</div>
            </Col>
            <Col xs={12} sm={6}>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#16a34a' }}>3.2x</div>
              <div style={{ color: '#64748b', fontSize: 13, marginTop: 4, fontWeight: 500 }}>Higher Cart Conversion</div>
            </Col>
            <Col xs={12} sm={6}>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#7c3aed' }}>&lt; 15s</div>
              <div style={{ color: '#64748b', fontSize: 13, marginTop: 4, fontWeight: 500 }}>First Response Time</div>
            </Col>
            <Col xs={12} sm={6}>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#d97706' }}>99.98%</div>
              <div style={{ color: '#64748b', fontSize: 13, marginTop: 4, fontWeight: 500 }}>Platform SLA Uptime</div>
            </Col>
          </Row>
        </div>
      </section>

      {/* 4. Core Features Grid */}
      <section id="features" style={{ padding: '90px 24px', background: '#ffffff' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <Tag color="blue" bordered={false} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 999, fontWeight: 600 }}>
              PLATFORM CAPABILITIES
            </Tag>
            <Typography.Title level={2} style={{ color: '#0f172a', fontSize: isMobile ? 28 : 40, fontWeight: 800, marginTop: 12 }}>
              Everything Your Support & Sales Team Needs
            </Typography.Title>
            <Typography.Paragraph style={{ color: '#64748b', fontSize: 16, maxWidth: 600, margin: '0 auto' }}>
              Built specifically to replace bloated legacy chat tools with a lightning-fast, clean, and intuitive customer engagement hub.
            </Typography.Paragraph>
          </div>

          <Row gutter={[24, 24]}>
            {[
              {
                icon: <ThunderboltOutlined style={{ fontSize: 26, color: '#2563eb' }} />,
                bg: '#eff6ff',
                title: 'Real-Time WebSocket Messaging',
                desc: 'Sub-second delivery with live typing indicators, sound alerts, seen receipts, and instant automatic reconnection.',
              },
              {
                icon: <GlobalOutlined style={{ fontSize: 26, color: '#16a34a' }} />,
                bg: '#f0fdf4',
                title: 'Live Visitor Radar & Journeys',
                desc: 'Watch website visitors in real-time. Know their active page, country, duration, and referrer before you reply.',
              },
              {
                icon: <MessageOutlined style={{ fontSize: 26, color: '#d97706' }} />,
                bg: '#fffbeb',
                title: 'Automated Smart Sales Triggers',
                desc: 'Set custom conditional triggers: greet returning shoppers, offer instant discounts on checkout, and capture leads 24/7.',
              },
              {
                icon: <ShopOutlined style={{ fontSize: 26, color: '#db2777' }} />,
                bg: '#fdf2f8',
                title: 'Deep Shopify & CRM Integration',
                desc: 'Search customer orders, lifetime revenue, tracking links, and order tags right inside the agent sidebar.',
              },
              {
                icon: <TeamOutlined style={{ fontSize: 26, color: '#7c3aed' }} />,
                bg: '#f5f3ff',
                title: 'Multi-Role Team Management',
                desc: 'Granular permissions: Super Admin, Owner, Supervisor, and Agent. Reassign chats, use canned replies, and leave internal notes.',
              },
              {
                icon: <LockOutlined style={{ fontSize: 26, color: '#0284c7' }} />,
                bg: '#f0f9ff',
                title: '100% Tenant Isolation & GDPR',
                desc: 'Your data stays yours. Enterprise security, configurable automatic data retention sweeps, and full GDPR/CCPA readiness.',
              },
            ].map((f, i) => (
              <Col xs={24} md={12} lg={8} key={i}>
                <Card
                  bordered={false}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 16,
                    height: '100%',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)',
                  }}
                  bodyStyle={{ padding: 28 }}
                  hoverable
                >
                  <div style={{ width: 52, height: 52, borderRadius: 12, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    {f.icon}
                  </div>
                  <Typography.Title level={4} style={{ color: '#0f172a', fontSize: 18, marginBottom: 10, fontWeight: 700 }}>
                    {f.title}
                  </Typography.Title>
                  <Typography.Paragraph style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                    {f.desc}
                  </Typography.Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* 5. How It Works (3 Steps) */}
      <section id="how-it-works" style={{ background: '#f8fafc', padding: '90px 24px', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', textAlign: 'center' }}>
          <Typography.Title level={2} style={{ color: '#0f172a', fontSize: isMobile ? 28 : 40, fontWeight: 800, marginBottom: 50 }}>
            Up and Running in 3 Easy Steps
          </Typography.Title>

          <Row gutter={[32, 32]}>
            {[
              {
                step: '01',
                title: 'Create Your Workspace',
                desc: 'Sign up in 30 seconds. No credit card required. Chatral instantly provisions your multi-store support dashboard.',
              },
              {
                step: '02',
                title: 'Embed the 1-Line Script',
                desc: 'Paste a single asynchronous script tag into your Shopify theme, WordPress site, or HTML header.',
              },
              {
                step: '03',
                title: 'Start Chatting & Selling',
                desc: 'Your chat widget is instantly live. Receive sound alerts, engage shoppers, and watch conversion rates soar.',
              },
            ].map((s, i) => (
              <Col xs={24} md={8} key={i}>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 32, textAlign: 'left', height: '100%', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)' }}>
                  <div style={{ fontSize: 44, fontWeight: 900, color: '#bfdbfe', marginBottom: 12 }}>
                    {s.step}
                  </div>
                  <Typography.Title level={4} style={{ color: '#0f172a', fontSize: 19, marginBottom: 8, fontWeight: 700 }}>
                    {s.title}
                  </Typography.Title>
                  <Typography.Paragraph style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                    {s.desc}
                  </Typography.Paragraph>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* 6. Live Interactive Demo Playground */}
      <section id="demo" style={{ padding: '90px 24px', background: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <Tag color="blue" bordered={false} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 999, marginBottom: 12, fontWeight: 600 }}>
            INTERACTIVE EXPERIENCE
          </Tag>
          <Typography.Title level={2} style={{ color: '#0f172a', fontSize: isMobile ? 28 : 38, fontWeight: 800, margin: '0 0 16px' }}>
            Experience the Visitor Chat Widget
          </Typography.Title>
          <Typography.Paragraph style={{ color: '#64748b', fontSize: 15, marginBottom: 36 }}>
            Try sending a message below to experience the smooth typing, clean design, and instant responsiveness of Chatral.
          </Typography.Paragraph>

          {/* Interactive Widget Box */}
          <Card
            bordered={false}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 20,
              boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.1)',
              overflow: 'hidden',
              textAlign: 'left',
            }}
            bodyStyle={{ padding: 0 }}
          >
            {/* Widget Header */}
            <div style={{ background: '#2563eb', padding: '16px 20px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Flex gap={12} align="center">
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ffffff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>
                  C
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Chatral Support</div>
                  <div style={{ fontSize: 12, opacity: 0.9 }}>🟢 Active now • Replies in under 1 min</div>
                </div>
              </Flex>
              <Tag color="default" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff' }}>Demo Mode</Tag>
            </div>

            {/* Messages body */}
            <div style={{ padding: 20, minHeight: 250, maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, background: '#f8fafc' }}>
              {demoMessages.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    alignSelf: m.sender === 'visitor' ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    background: m.sender === 'visitor' ? '#2563eb' : '#ffffff',
                    color: m.sender === 'visitor' ? '#ffffff' : '#0f172a',
                    border: m.sender === 'visitor' ? 'none' : '1px solid #e2e8f0',
                    padding: '10px 14px',
                    borderRadius: m.sender === 'visitor' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    fontSize: 13,
                    boxShadow: '0 1px 4px rgba(15, 23, 42, 0.05)',
                  }}
                >
                  {m.text}
                </div>
              ))}
            </div>

            {/* Quick replies */}
            <div style={{ padding: '10px 16px', background: '#f1f5f9', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 8, overflowX: 'auto' }}>
              {['Pricing details?', 'How to install on Shopify?', 'Is there a free plan?'].map((q, i) => (
                <Button
                  key={i}
                  size="small"
                  onClick={() => {
                    setDemoMessages((p) => [...p, { sender: 'visitor', text: q, time: 'Just now' }]);
                    setTimeout(() => {
                      setDemoMessages((p) => [
                        ...p,
                        { sender: 'agent', text: `Great question regarding: "${q}". Chatral takes under 2 minutes to install and includes a free forever tier!`, time: 'Just now' },
                      ]);
                    }, 500);
                  }}
                  style={{ background: '#ffffff', borderColor: '#cbd5e1', color: '#334155', fontSize: 12 }}
                >
                  {q}
                </Button>
              ))}
            </div>

            {/* Input bar */}
            <form onSubmit={handleDemoSend} style={{ display: 'flex', padding: 12, background: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
              <input
                type="text"
                value={demoInput}
                onChange={(e) => setDemoInput(e.target.value)}
                placeholder="Type your message and press enter..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#0f172a',
                  fontSize: 14,
                  padding: '8px 12px',
                }}
              />
              <Button type="primary" htmlType="submit" icon={<SendOutlined />} style={{ background: '#2563eb' }}>
                Send
              </Button>
            </form>
          </Card>
        </div>
      </section>

      {/* 7. Transparent SaaS Pricing Table */}
      <section id="pricing" style={{ background: '#f8fafc', padding: '90px 24px', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', textAlign: 'center' }}>
          <Tag color="green" bordered={false} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 999, fontWeight: 600 }}>
            TRANSPARENT PRICING
          </Tag>
          <Typography.Title level={2} style={{ color: '#0f172a', fontSize: isMobile ? 28 : 42, fontWeight: 800, margin: '12px 0 16px' }}>
            Simple Plans That Scale with Your Growth
          </Typography.Title>
          <Typography.Paragraph style={{ color: '#64748b', fontSize: 16, marginBottom: 32 }}>
            Start free with our 14-day trial. No surprise charges. Upgrade, downgrade, or cancel anytime.
          </Typography.Paragraph>

          {/* Monthly / Yearly Toggle */}
          <div style={{ marginBottom: 50 }}>
            <Segmented
              options={[
                { label: 'Monthly Billing', value: 'monthly' },
                { label: 'Yearly Billing (20% OFF)', value: 'yearly' },
              ]}
              value={billingCycle}
              onChange={setBillingCycle}
              style={{ background: '#e2e8f0', padding: 4, borderRadius: 10, color: '#0f172a', fontWeight: 600 }}
            />
          </div>

          <Row gutter={[24, 24]} align="stretch">
            {/* Free Plan */}
            <Col xs={24} md={8}>
              <Card
                bordered={false}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 18,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  textAlign: 'left',
                  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
                }}
                bodyStyle={{ padding: 32, display: 'flex', flexDirection: 'column', flex: 1 }}
              >
                <div style={{ fontWeight: 600, color: '#64748b', fontSize: 16 }}>Free Forever</div>
                <div style={{ fontSize: 40, fontWeight: 800, color: '#0f172a', margin: '14px 0 6px' }}>
                  $0 <span style={{ fontSize: 14, color: '#64748b', fontWeight: 400 }}>/ month</span>
                </div>
                <div style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>
                  Perfect for new stores and individual website owners getting started.
                </div>
                <Divider style={{ borderColor: '#f1f5f9', margin: '0 0 20px' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28, fontSize: 13, color: '#334155' }}>
                  <div><CheckCircleFilled style={{ color: '#16a34a', marginRight: 8 }} /> 1 Active Store / Website</div>
                  <div><CheckCircleFilled style={{ color: '#16a34a', marginRight: 8 }} /> 2 Support Agents</div>
                  <div><CheckCircleFilled style={{ color: '#16a34a', marginRight: 8 }} /> Unlimited Live Chats</div>
                  <div><CheckCircleFilled style={{ color: '#16a34a', marginRight: 8 }} /> 30-Day Chat History</div>
                  <div><CheckCircleFilled style={{ color: '#16a34a', marginRight: 8 }} /> Standard Web Widget</div>
                </div>
                <Button
                  block
                  size="large"
                  onClick={() => nav('/login?mode=signup')}
                  style={{ background: '#f1f5f9', borderColor: '#e2e8f0', color: '#0f172a', fontWeight: 600 }}
                >
                  Start with Free Plan
                </Button>
              </Card>
            </Col>

            {/* Starter Plan (Most Popular) */}
            <Col xs={24} md={8}>
              <Card
                bordered={false}
                style={{
                  background: '#ffffff',
                  border: '2px solid #2563eb',
                  borderRadius: 18,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  textAlign: 'left',
                  position: 'relative',
                  boxShadow: '0 16px 36px -8px rgba(37, 99, 235, 0.16)',
                }}
                bodyStyle={{ padding: 32, display: 'flex', flexDirection: 'column', flex: 1 }}
              >
                <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)' }}>
                  <Tag color="blue" style={{ padding: '4px 16px', fontWeight: 700, borderRadius: 999, border: 'none', background: '#2563eb', color: '#ffffff' }}>
                    MOST POPULAR
                  </Tag>
                </div>
                <div style={{ fontWeight: 600, color: '#2563eb', fontSize: 16 }}>Starter Growth</div>
                <div style={{ fontSize: 40, fontWeight: 800, color: '#0f172a', margin: '14px 0 6px' }}>
                  {billingCycle === 'yearly' ? '$15' : '$19'}{' '}
                  <span style={{ fontSize: 14, color: '#64748b', fontWeight: 400 }}>/ month</span>
                </div>
                <div style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>
                  For growing e-commerce businesses that need sales triggers and visitor tracking.
                </div>
                <Divider style={{ borderColor: '#f1f5f9', margin: '0 0 20px' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28, fontSize: 13, color: '#334155' }}>
                  <div><CheckCircleFilled style={{ color: '#16a34a', marginRight: 8 }} /> <b>3 Active Stores</b></div>
                  <div><CheckCircleFilled style={{ color: '#16a34a', marginRight: 8 }} /> <b>5 Support Agents</b></div>
                  <div><CheckCircleFilled style={{ color: '#16a34a', marginRight: 8 }} /> Automated Sales Triggers</div>
                  <div><CheckCircleFilled style={{ color: '#16a34a', marginRight: 8 }} /> Real-time Live Visitor Radar</div>
                  <div><CheckCircleFilled style={{ color: '#16a34a', marginRight: 8 }} /> Canned / Saved Replies</div>
                  <div><CheckCircleFilled style={{ color: '#16a34a', marginRight: 8 }} /> 1-Year Chat & Visitor History</div>
                </div>
                <Button
                  type="primary"
                  block
                  size="large"
                  onClick={() => nav('/login?mode=signup')}
                  style={{ background: '#2563eb', border: 'none', fontWeight: 600, boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)' }}
                >
                  Start 14-Day Free Trial
                </Button>
              </Card>
            </Col>

            {/* Pro / Business Plan */}
            <Col xs={24} md={8}>
              <Card
                bordered={false}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 18,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  textAlign: 'left',
                  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
                }}
                bodyStyle={{ padding: 32, display: 'flex', flexDirection: 'column', flex: 1 }}
              >
                <div style={{ fontWeight: 600, color: '#64748b', fontSize: 16 }}>Business Pro</div>
                <div style={{ fontSize: 40, fontWeight: 800, color: '#0f172a', margin: '14px 0 6px' }}>
                  {billingCycle === 'yearly' ? '$39' : '$49'}{' '}
                  <span style={{ fontSize: 14, color: '#64748b', fontWeight: 400 }}>/ month</span>
                </div>
                <div style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>
                  Maximum power, Shopify deep sync, and full white-label branding removal.
                </div>
                <Divider style={{ borderColor: '#f1f5f9', margin: '0 0 20px' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28, fontSize: 13, color: '#334155' }}>
                  <div><CheckCircleFilled style={{ color: '#16a34a', marginRight: 8 }} /> <b>Unlimited Stores</b></div>
                  <div><CheckCircleFilled style={{ color: '#16a34a', marginRight: 8 }} /> <b>15 Support Agents</b></div>
                  <div><CheckCircleFilled style={{ color: '#16a34a', marginRight: 8 }} /> Deep Shopify & Order Integration</div>
                  <div><CheckCircleFilled style={{ color: '#16a34a', marginRight: 8 }} /> <b>White-Label: Remove Chatral Branding</b></div>
                  <div><CheckCircleFilled style={{ color: '#16a34a', marginRight: 8 }} /> Bot Detection & Quality Traffic Filter</div>
                  <div><CheckCircleFilled style={{ color: '#16a34a', marginRight: 8 }} /> 24/7 Dedicated Support</div>
                </div>
                <Button
                  block
                  size="large"
                  onClick={() => nav('/login?mode=signup')}
                  style={{ background: '#f1f5f9', borderColor: '#e2e8f0', color: '#0f172a', fontWeight: 600 }}
                >
                  Contact for Pro Trial
                </Button>
              </Card>
            </Col>
          </Row>
        </div>
      </section>

      {/* 8. Frequently Asked Questions (FAQ) */}
      <section id="faq" style={{ padding: '90px 24px', background: '#ffffff' }}>
        <div style={{ maxWidth: 840, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <Typography.Title level={2} style={{ color: '#0f172a', fontSize: isMobile ? 26 : 38, fontWeight: 800 }}>
              Frequently Asked Questions
            </Typography.Title>
            <Typography.Paragraph style={{ color: '#64748b', fontSize: 15 }}>
              Everything you need to know about Chatral installation, billing, and security.
            </Typography.Paragraph>
          </div>

          <Collapse
            bordered={false}
            defaultActiveKey={['1']}
            style={{ background: 'transparent' }}
            items={[
              {
                key: '1',
                label: <span style={{ color: '#0f172a', fontWeight: 600, fontSize: 16 }}>How do I install Chatral on my website?</span>,
                children: (
                  <Typography.Text style={{ color: '#475569', lineHeight: 1.7, display: 'block' }}>
                    Installation takes less than 2 minutes. In your Chatral dashboard, navigate to Store Settings &rarr; Widget, copy your unique 1-line HTML snippet, and paste it right before the closing <code>&lt;/body&gt;</code> tag of your website, Shopify theme (<code>theme.liquid</code>), or WordPress header.
                  </Typography.Text>
                ),
              },
              {
                key: '2',
                label: <span style={{ color: '#0f172a', fontWeight: 600, fontSize: 16 }}>Will the chat widget slow down my website loading speed?</span>,
                children: (
                  <Typography.Text style={{ color: '#475569', lineHeight: 1.7, display: 'block' }}>
                    No, absolutely not. Chatral is built with an ultra-lightweight asynchronous loader (less than 60 KB gzipped) and isolated inside a Shadow DOM. It loads completely in the background without blocking page render or affecting Google PageSpeed scores.
                  </Typography.Text>
                ),
              },
              {
                key: '3',
                label: <span style={{ color: '#0f172a', fontWeight: 600, fontSize: 16 }}>How does the Shopify integration work?</span>,
                children: (
                  <Typography.Text style={{ color: '#475569', lineHeight: 1.7, display: 'block' }}>
                    When a visitor chats with you, Chatral automatically looks up their email address in your connected Shopify store. You instantly see their previous orders, total lifetime spend, shipping tracking numbers, and items currently in their shopping cart.
                  </Typography.Text>
                ),
              },
              {
                key: '4',
                label: <span style={{ color: '#0f172a', fontWeight: 600, fontSize: 16 }}>Can I remove the &quot;Powered by Chatral&quot; branding?</span>,
                children: (
                  <Typography.Text style={{ color: '#475569', lineHeight: 1.7, display: 'block' }}>
                    Yes. On the Business Pro plan, you can completely remove the branding and customize the widget color, launcher icon, business hours, and sound notifications to match your brand identity 100%.
                  </Typography.Text>
                ),
              },
              {
                key: '5',
                label: <span style={{ color: '#0f172a', fontWeight: 600, fontSize: 16 }}>Is my customer data secure and GDPR compliant?</span>,
                children: (
                  <Typography.Text style={{ color: '#475569', lineHeight: 1.7, display: 'block' }}>
                    Yes. All chat sessions and visitor histories are encrypted in transit over WSS/TLS and stored in tenant-isolated PostgreSQL tables. We do not sell customer data and offer automated data deletion retention sweeps.
                  </Typography.Text>
                ),
              },
            ]}
          />
        </div>
      </section>

      {/* 9. Final CTA Banner */}
      <section style={{ padding: '60px 24px 90px', background: '#ffffff' }}>
        <div
          style={{
            maxWidth: 1040,
            margin: '0 auto',
            background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 60%, #0284c7 100%)',
            borderRadius: 24,
            padding: isMobile ? '40px 20px' : '64px 40px',
            textAlign: 'center',
            boxShadow: '0 20px 45px rgba(37, 99, 235, 0.25)',
          }}
        >
          <Typography.Title level={2} style={{ color: '#ffffff', fontSize: isMobile ? 26 : 42, fontWeight: 800, margin: '0 0 16px' }}>
            Ready to Accelerate Your Online Sales?
          </Typography.Title>
          <Typography.Paragraph style={{ color: '#e0f2fe', fontSize: 17, maxWidth: 620, margin: '0 auto 32px', lineHeight: 1.6 }}>
            Join forward-thinking e-commerce and support teams using Chatral to deliver memorable customer experiences.
          </Typography.Paragraph>
          <Button
            type="primary"
            size="large"
            icon={<ArrowRightOutlined />}
            onClick={() => nav('/login?mode=signup')}
            style={{
              height: 52,
              padding: '0 36px',
              fontSize: 16,
              fontWeight: 700,
              background: '#ffffff',
              color: '#1e40af',
              border: 'none',
              borderRadius: 10,
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
            }}
          >
            Start Your Free 14-Day Trial Today
          </Button>
        </div>
      </section>

      {/* 10. Footer */}
      <footer style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '60px 24px 30px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <Row gutter={[32, 32]} justify="space-between">
            <Col xs={24} md={8}>
              <ChatralFullLogo height={34} dark={false} style={{ marginBottom: 16 }} />
              <Typography.Paragraph style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6, maxWidth: 300 }}>
                Next-generation real-time customer messaging and live visitor engagement platform for modern businesses.
              </Typography.Paragraph>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>
                Developed & Operated by DigiScale Infotech.
              </div>
            </Col>

            <Col xs={12} sm={8} md={5}>
              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14, marginBottom: 14 }}>Product</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                <a onClick={() => scrollTo('features')} style={{ color: '#475569', cursor: 'pointer' }}>Features</a>
                <a onClick={() => scrollTo('pricing')} style={{ color: '#475569', cursor: 'pointer' }}>Pricing</a>
                <a onClick={() => scrollTo('demo')} style={{ color: '#475569', cursor: 'pointer' }}>Interactive Demo</a>
                <Link to="/login" style={{ color: '#475569' }}>Agent Portal</Link>
              </div>
            </Col>

            <Col xs={12} sm={8} md={5}>
              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14, marginBottom: 14 }}>Legal & Trust</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                <Link to="/privacy" style={{ color: '#2563eb', fontWeight: 500 }}>Privacy Policy</Link>
                <Link to="/terms" style={{ color: '#2563eb', fontWeight: 500 }}>Terms of Service</Link>
                <span style={{ color: '#64748b' }}>GDPR Compliant</span>
                <span style={{ color: '#64748b' }}>99.98% SLA</span>
              </div>
            </Col>

            <Col xs={24} sm={8} md={6}>
              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14, marginBottom: 14 }}>Contact & Support</div>
              <div style={{ color: '#475569', fontSize: 13, lineHeight: 1.8 }}>
                <div>Support: <a href="mailto:digiscaleinfotech@gmail.com" style={{ color: '#2563eb' }}>digiscaleinfotech@gmail.com</a></div>
                <div>Hours: Monday - Friday, 9am - 7pm IST</div>
              </div>
            </Col>
          </Row>

          <Divider style={{ borderColor: '#e2e8f0', margin: '40px 0 24px' }} />

          <Flex justify={isMobile ? 'center' : 'space-between'} align="center" wrap="wrap" gap={12}>
            <div style={{ color: '#94a3b8', fontSize: 12 }}>
              &copy; {new Date().getFullYear()} DigiScale Infotech. All rights reserved. Chatral&trade; is a trademark of DigiScale Infotech.
            </div>
            <Flex gap={16} style={{ fontSize: 12 }}>
              <Link to="/privacy" style={{ color: '#64748b' }}>Privacy</Link>
              <Link to="/terms" style={{ color: '#64748b' }}>Terms</Link>
              <Link to="/login" style={{ color: '#64748b' }}>Sign In</Link>
            </Flex>
          </Flex>
        </div>
      </footer>
    </div>
  );
}
