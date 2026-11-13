import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Button, Card, Col, Collapse, Divider, Flex, Grid, Row, Segmented, Tag, Typography,
} from 'antd';
import {
  ThunderboltOutlined, GlobalOutlined, ShopOutlined, TeamOutlined, LockOutlined,
  CheckCircleFilled, ArrowRightOutlined, MessageOutlined,
  SendOutlined, RocketOutlined, PlayCircleOutlined,
  RiseOutlined, SafetyCertificateOutlined, CodeOutlined, AppstoreAddOutlined,
  CheckOutlined, CustomerServiceOutlined, CopyOutlined,
} from '@ant-design/icons';
import { ChatralFullLogo } from '../components/BrandLogo.jsx';

const { useBreakpoint } = Grid;

export default function LandingPage() {
  const nav = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [billingCycle, setBillingCycle] = useState('yearly');
  const [demoInput, setDemoInput] = useState('');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
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
    }, 600);
  };

  const handleCopySnippet = () => {
    navigator.clipboard?.writeText('<script async src="https://chatral.app/widget.js" data-chatral-store="store_live_992"></script>');
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      style={{
        background: '#fafbfd',
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.16) 1px, transparent 0)',
        backgroundSize: '32px 32px',
        color: '#0f172a',
        minHeight: '100vh',
        overflowX: 'hidden',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: 'relative',
      }}
    >
      {/* Creative Background Ambient Glows */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '20%',
          width: 500,
          height: 350,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.09) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 200,
          right: '15%',
          width: 450,
          height: 350,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.08) 0%, transparent 70%)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* 1. Header / Navbar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
          padding: '0 24px',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
            <ChatralFullLogo height={32} dark={false} />
          </Link>

          {!isMobile && (
            <Flex gap={28} align="center">
              <a onClick={() => scrollTo('features')} style={{ color: '#475569', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', transition: 'color 0.15s' }}>
                Features
              </a>
              <a onClick={() => scrollTo('how-it-works')} style={{ color: '#475569', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', transition: 'color 0.15s' }}>
                How It Works
              </a>
              <a onClick={() => scrollTo('demo')} style={{ color: '#475569', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', transition: 'color 0.15s' }}>
                Interactive Demo
              </a>
              <a onClick={() => scrollTo('pricing')} style={{ color: '#475569', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', transition: 'color 0.15s' }}>
                Pricing
              </a>
              <a onClick={() => scrollTo('faq')} style={{ color: '#475569', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', transition: 'color 0.15s' }}>
                FAQ
              </a>
            </Flex>
          )}

          <Flex gap={10} align="center">
            <Button
              type="text"
              onClick={() => nav('/login')}
              style={{ color: '#0f172a', fontWeight: 600, fontSize: 13.5 }}
            >
              Sign In
            </Button>
            <Button
              type="primary"
              size="middle"
              icon={<RocketOutlined />}
              onClick={() => nav('/login?mode=signup')}
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                border: 'none',
                fontWeight: 600,
                fontSize: 13.5,
                height: 38,
                padding: '0 18px',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.22)',
                borderRadius: 8,
              }}
            >
              Start Free Trial
            </Button>
          </Flex>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section style={{ position: 'relative', zIndex: 1, padding: isMobile ? '40px 16px 30px' : '68px 24px 50px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
          
          {/* Creative floating pill badge with live ping dot */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 14px',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(203, 213, 225, 0.9)',
              borderRadius: 999,
              marginBottom: 20,
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.25)',
              }}
            />
            <span style={{ color: '#1e40af', fontSize: 12, fontWeight: 700, letterSpacing: '0.02em' }}>
              CHATRAL 2.0
            </span>
            <span style={{ color: '#cbd5e1' }}>|</span>
            <span style={{ color: '#475569', fontSize: 12, fontWeight: 500 }}>
              Real-Time Customer Messaging & Visitor Radar
            </span>
          </div>

          {/* Refined Headline with clean typography */}
          <Typography.Title
            level={1}
            style={{
              color: '#0f172a',
              fontSize: isMobile ? 30 : 46,
              fontWeight: 800,
              lineHeight: 1.18,
              letterSpacing: '-0.025em',
              margin: '0 auto 16px',
              maxWidth: 820,
            }}
          >
            Convert Website Visitors into Paying Customers with{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Real-Time Live Chat
            </span>
          </Typography.Title>

          {/* Balanced Subtitle Paragraph (Refined Size) */}
          <Typography.Paragraph
            style={{
              color: '#475569',
              fontSize: isMobile ? 14 : 15.5,
              lineHeight: 1.65,
              maxWidth: 640,
              margin: '0 auto 28px',
            }}
          >
            Lightweight, modern, and lightning fast. Track live visitor journeys, trigger automated sales greetings, view customer orders inside chat, and close more deals from a single intuitive dashboard.
          </Typography.Paragraph>

          {/* Action CTAs */}
          <Flex justify="center" gap={12} wrap="wrap" style={{ marginBottom: 28 }}>
            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              onClick={() => nav('/login?mode=signup')}
              style={{
                height: 46,
                padding: '0 26px',
                fontSize: 14.5,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                border: 'none',
                boxShadow: '0 8px 20px rgba(37, 99, 235, 0.28)',
                borderRadius: 9,
              }}
            >
              Get Started Free — 14 Days Trial
            </Button>
            <Button
              size="large"
              icon={<PlayCircleOutlined />}
              onClick={() => scrollTo('demo')}
              style={{
                height: 46,
                padding: '0 22px',
                fontSize: 14,
                fontWeight: 600,
                color: '#1e293b',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 9,
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
              }}
            >
              Try Live Interactive Demo
            </Button>
          </Flex>

          {/* Trust badges */}
          <Flex justify="center" gap={20} wrap="wrap" style={{ color: '#64748b', fontSize: 12.5, fontWeight: 500 }}>
            <span><CheckCircleFilled style={{ color: '#10b981', marginRight: 5 }} /> No credit card required</span>
            <span><CheckCircleFilled style={{ color: '#10b981', marginRight: 5 }} /> 2-minute 1-line script install</span>
            <span><CheckCircleFilled style={{ color: '#10b981', marginRight: 5 }} /> Shopify & WordPress ready</span>
          </Flex>
        </div>

        {/* Hero Interactive App Mockup Preview (Creative Browser Container) */}
        <div style={{ maxWidth: 1040, margin: '42px auto 0', position: 'relative' }}>
          
          {/* Subtle soft backdrop glow under mockup */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90%',
              height: '80%',
              background: 'radial-gradient(ellipse at center, rgba(37, 99, 235, 0.08) 0%, transparent 70%)',
              filter: 'blur(40px)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />

          <Card
            bordered={false}
            style={{
              position: 'relative',
              zIndex: 1,
              background: '#ffffff',
              border: '1px solid rgba(203, 213, 225, 0.8)',
              borderRadius: 18,
              overflow: 'hidden',
              boxShadow: '0 20px 50px -10px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.04)',
            }}
            bodyStyle={{ padding: 0 }}
          >
            {/* macOS Browser Chrome Window Bar */}
            <div
              style={{
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                padding: '10px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Flex gap={7} align="center">
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ef4444' }} />
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#10b981' }} />
              </Flex>

              {/* Realistic fake URL Pill */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 6,
                  padding: '3px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11.5,
                  color: '#64748b',
                }}
              >
                <LockOutlined style={{ color: '#10b981', fontSize: 10 }} />
                <span style={{ color: '#0f172a', fontWeight: 600 }}>chatral.app</span>
                <span style={{ color: '#94a3b8' }}>/operator/store-alpha</span>
              </div>

              {/* Live Connection Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: 11.5, color: '#16a34a', fontWeight: 600 }}>Live WebSocket</span>
              </div>
            </div>

            {/* Split Mockup Content */}
            <div style={{ padding: isMobile ? 12 : 20 }}>
              <Row gutter={[16, 16]}>
                {/* Left Column: Chat conversation view */}
                <Col xs={24} lg={15}>
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: 12,
                      border: '1px solid #e2e8f0',
                      padding: 14,
                      minHeight: 330,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* Visitor Header */}
                    <Flex justify="space-between" align="center" style={{ paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
                      <Flex gap={10} align="center">
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #2563eb, #38bdf8)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: 13,
                          }}
                        >
                          JP
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>Jaydeep Patel</div>
                          <div style={{ fontSize: 11.5, color: '#64748b' }}>Surat, India • Chrome on macOS • 4 page views</div>
                        </div>
                      </Flex>
                      <Tag color="blue" bordered={false} style={{ fontSize: 11, borderRadius: 999, fontWeight: 600 }}>
                        High Intent Buyer
                      </Tag>
                    </Flex>

                    {/* Chat messages */}
                    <div style={{ flex: 1, padding: '14px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div
                        style={{
                          alignSelf: 'flex-start',
                          maxWidth: '82%',
                          background: '#f1f5f9',
                          padding: '9px 13px',
                          borderRadius: '12px 12px 12px 2px',
                          fontSize: 12.5,
                          color: '#0f172a',
                          lineHeight: 1.5,
                        }}
                      >
                        Hello! I have added the Starter Plan to my cart, does it include Shopify sync?
                        <div style={{ fontSize: 9.5, color: '#94a3b8', marginTop: 3 }}>12:28 PM</div>
                      </div>

                      <div
                        style={{
                          alignSelf: 'flex-end',
                          maxWidth: '82%',
                          background: '#2563eb',
                          padding: '9px 13px',
                          borderRadius: '12px 12px 2px 12px',
                          fontSize: 12.5,
                          color: '#ffffff',
                          lineHeight: 1.5,
                        }}
                      >
                        Hi Jaydeep! Yes, both Starter and Pro plans include full real-time Shopify sync with customer order history!
                        <div style={{ fontSize: 9.5, color: '#bfdbfe', marginTop: 3, textAlign: 'right' }}>12:29 PM • Read</div>
                      </div>

                      <div
                        style={{
                          alignSelf: 'flex-start',
                          maxWidth: '82%',
                          background: '#f1f5f9',
                          padding: '9px 13px',
                          borderRadius: '12px 12px 12px 2px',
                          fontSize: 12.5,
                          color: '#0f172a',
                          lineHeight: 1.5,
                        }}
                      >
                        Awesome! Proceeding with checkout now. Thank you! 🙌
                      </div>
                    </div>

                    {/* Reply box mockup */}
                    <div
                      style={{
                        background: '#f8fafc',
                        borderRadius: 8,
                        padding: '6px 10px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ color: '#94a3b8', fontSize: 12 }}>Type a reply or press &apos;/&apos; for saved shortcuts...</span>
                      <Button type="primary" size="small" icon={<SendOutlined />} style={{ background: '#2563eb', fontSize: 11.5, height: 26 }}>
                        Send
                      </Button>
                    </div>
                  </div>
                </Col>

                {/* Right Column: Visitor & Shopify Intelligence */}
                <Col xs={24} lg={9}>
                  <div
                    style={{
                      background: '#f8fafc',
                      borderRadius: 12,
                      border: '1px solid #e2e8f0',
                      padding: 14,
                      minHeight: 330,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 12.5, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ShopOutlined style={{ color: '#2563eb' }} /> Shopify Customer Details
                    </div>

                    <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 12 }}>
                      <Flex justify="space-between" style={{ marginBottom: 5 }}>
                        <span style={{ color: '#64748b', fontSize: 11.5 }}>Lifetime Orders:</span>
                        <strong style={{ color: '#0f172a', fontSize: 11.5 }}>4 Orders</strong>
                      </Flex>
                      <Flex justify="space-between" style={{ marginBottom: 5 }}>
                        <span style={{ color: '#64748b', fontSize: 11.5 }}>Total Spent:</span>
                        <strong style={{ color: '#16a34a', fontSize: 11.5 }}>$489.00 USD</strong>
                      </Flex>
                      <Flex justify="space-between">
                        <span style={{ color: '#64748b', fontSize: 11.5 }}>Active Cart:</span>
                        <strong style={{ color: '#2563eb', fontSize: 11.5 }}>$149.00 (2 items)</strong>
                      </Flex>
                    </div>

                    <div style={{ fontWeight: 600, color: '#0f172a', margin: '4px 0 8px', fontSize: 12 }}>
                      Live Visitor Journey
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11.5, color: '#475569' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#94a3b8' }}>12:25</span>
                        <span>📍 Landed from <b>Google Organic</b></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#94a3b8' }}>12:26</span>
                        <span>📄 Viewed <code>/pricing</code> (2m 14s)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#94a3b8' }}>12:28</span>
                        <span>🛒 Checkout trigger fired</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#94a3b8' }}>12:28</span>
                        <span>💬 Chat started with Agent</span>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          </Card>
        </div>
      </section>

      {/* 3. Numbers / Metrics Bar (Creative Frosted Cards) */}
      <section style={{ padding: '30px 24px 60px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <Row gutter={[16, 16]}>
            {[
              {
                icon: <MessageOutlined style={{ fontSize: 18, color: '#2563eb' }} />,
                iconBg: '#eff6ff',
                value: '150,000+',
                label: 'Messages Delivered',
                badge: '+48% this month',
                badgeColor: '#16a34a',
              },
              {
                icon: <RiseOutlined style={{ fontSize: 18, color: '#16a34a' }} />,
                iconBg: '#f0fdf4',
                value: '3.2x',
                label: 'Higher Cart Conversion',
                badge: 'Proven E-Commerce Lift',
                badgeColor: '#2563eb',
              },
              {
                icon: <ThunderboltOutlined style={{ fontSize: 18, color: '#7c3aed' }} />,
                iconBg: '#f5f3ff',
                value: '< 15s',
                label: 'First Response Time',
                badge: 'Sub-second WebSocket',
                badgeColor: '#7c3aed',
              },
              {
                icon: <SafetyCertificateOutlined style={{ fontSize: 18, color: '#d97706' }} />,
                iconBg: '#fffbeb',
                value: '99.98%',
                label: 'Platform SLA Uptime',
                badge: 'High Availability',
                badgeColor: '#d97706',
              },
            ].map((m, i) => (
              <Col xs={12} md={6} key={i}>
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 14,
                    padding: '18px 18px',
                    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: m.iconBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {m.icon}
                    </div>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 600,
                        color: m.badgeColor,
                        background: '#f8fafc',
                        padding: '2px 8px',
                        borderRadius: 999,
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      {m.badge}
                    </span>
                  </Flex>
                  <div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1 }}>
                      {m.value}
                    </div>
                    <div style={{ color: '#64748b', fontSize: 12.5, marginTop: 6, fontWeight: 500 }}>
                      {m.label}
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* 4. Core Features Grid */}
      <section id="features" style={{ padding: '70px 24px', background: '#ffffff', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <Tag color="blue" bordered={false} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, fontWeight: 600 }}>
              PLATFORM CAPABILITIES
            </Tag>
            <Typography.Title level={2} style={{ color: '#0f172a', fontSize: isMobile ? 24 : 34, fontWeight: 800, marginTop: 10, letterSpacing: '-0.02em' }}>
              Everything Your Support & Sales Team Needs
            </Typography.Title>
            <Typography.Paragraph style={{ color: '#64748b', fontSize: 14.5, maxWidth: 540, margin: '0 auto' }}>
              Built specifically to replace bloated legacy chat tools with a lightning-fast, clean, and intuitive customer engagement hub.
            </Typography.Paragraph>
          </div>

          <Row gutter={[20, 20]}>
            {[
              {
                icon: <ThunderboltOutlined style={{ fontSize: 20, color: '#2563eb' }} />,
                bg: '#eff6ff',
                pill: 'Sub-second',
                title: 'Real-Time WebSocket Messaging',
                desc: 'Instant delivery with typing indicators, sound alerts, seen receipts, and automatic background reconnection.',
              },
              {
                icon: <GlobalOutlined style={{ fontSize: 20, color: '#16a34a' }} />,
                bg: '#f0fdf4',
                pill: 'Live Radar',
                title: 'Live Visitor Radar & Journeys',
                desc: 'Watch visitors in real time. Know their active page, country, duration, and search referrer before replying.',
              },
              {
                icon: <MessageOutlined style={{ fontSize: 20, color: '#d97706' }} />,
                bg: '#fffbeb',
                pill: 'Automation',
                title: 'Automated Smart Sales Triggers',
                desc: 'Set custom triggers: greet returning shoppers, offer discount on checkout, and capture leads 24/7.',
              },
              {
                icon: <ShopOutlined style={{ fontSize: 20, color: '#db2777' }} />,
                bg: '#fdf2f8',
                pill: 'E-Commerce',
                title: 'Deep Shopify & CRM Integration',
                desc: 'Search customer orders, lifetime revenue, tracking links, and order tags right inside the chat sidebar.',
              },
              {
                icon: <TeamOutlined style={{ fontSize: 20, color: '#7c3aed' }} />,
                bg: '#f5f3ff',
                pill: 'Workspaces',
                title: 'Multi-Role Team Management',
                desc: 'Super Admin, Owner, Supervisor, and Agent roles. Reassign chats, use canned replies, and leave internal notes.',
              },
              {
                icon: <LockOutlined style={{ fontSize: 20, color: '#0284c7' }} />,
                bg: '#f0f9ff',
                pill: 'Enterprise',
                title: '100% Tenant Isolation & GDPR',
                desc: 'Your data stays yours. Enterprise security, automated data retention sweeps, and full GDPR/CCPA readiness.',
              },
            ].map((f, i) => (
              <Col xs={24} sm={12} lg={8} key={i}>
                <Card
                  bordered={false}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 14,
                    height: '100%',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.02)',
                  }}
                  bodyStyle={{ padding: 22 }}
                  hoverable
                >
                  <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 10,
                        background: f.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {f.icon}
                    </div>
                    <span style={{ fontSize: 11, color: '#64748b', background: '#f8fafc', padding: '2px 8px', borderRadius: 999, border: '1px solid #e2e8f0', fontWeight: 500 }}>
                      {f.pill}
                    </span>
                  </Flex>
                  <Typography.Title level={4} style={{ color: '#0f172a', fontSize: 15.5, marginBottom: 8, fontWeight: 700 }}>
                    {f.title}
                  </Typography.Title>
                  <Typography.Paragraph style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                    {f.desc}
                  </Typography.Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* 5. How It Works (Creative 3-Step Interactive Workflow) */}
      <section id="how-it-works" style={{ background: '#f8fafc', padding: '70px 24px', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', textAlign: 'center' }}>
          <Tag color="cyan" bordered={false} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, fontWeight: 600 }}>
            EASY SETUP
          </Tag>
          <Typography.Title level={2} style={{ color: '#0f172a', fontSize: isMobile ? 24 : 34, fontWeight: 800, marginTop: 10, marginBottom: 44, letterSpacing: '-0.02em' }}>
            Up and Running in 3 Simple Steps
          </Typography.Title>

          <Row gutter={[20, 20]}>
            {/* Step 1 */}
            <Col xs={24} md={8}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 14,
                  padding: 24,
                  textAlign: 'left',
                  height: '100%',
                  boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ height: 3, background: 'linear-gradient(90deg, #2563eb, #38bdf8)', position: 'absolute', top: 0, left: 0, right: 0 }} />
                <Flex justify="space-between" align="center" style={{ marginBottom: 14 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '3px 10px', borderRadius: 999, border: '1px solid #bfdbfe' }}>
                    STEP 01
                  </span>
                  <AppstoreAddOutlined style={{ fontSize: 18, color: '#94a3b8' }} />
                </Flex>
                <Typography.Title level={4} style={{ color: '#0f172a', fontSize: 16, marginBottom: 8, fontWeight: 700 }}>
                  Create Your Workspace
                </Typography.Title>
                <Typography.Paragraph style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
                  Sign up in 30 seconds. No credit card required. Chatral instantly provisions your multi-store support dashboard.
                </Typography.Paragraph>
                
                {/* Creative preview pill */}
                <div style={{ marginTop: 'auto', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 11.5 }}>
                  <Flex justify="space-between" align="center">
                    <span style={{ color: '#475569' }}>Workspace: <b>Store Alpha</b></span>
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>● Active</span>
                  </Flex>
                </div>
              </div>
            </Col>

            {/* Step 2 */}
            <Col xs={24} md={8}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 14,
                  padding: 24,
                  textAlign: 'left',
                  height: '100%',
                  boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ height: 3, background: 'linear-gradient(90deg, #38bdf8, #10b981)', position: 'absolute', top: 0, left: 0, right: 0 }} />
                <Flex justify="space-between" align="center" style={{ marginBottom: 14 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#0284c7', background: '#f0f9ff', padding: '3px 10px', borderRadius: 999, border: '1px solid #bae6fd' }}>
                    STEP 02
                  </span>
                  <CodeOutlined style={{ fontSize: 18, color: '#94a3b8' }} />
                </Flex>
                <Typography.Title level={4} style={{ color: '#0f172a', fontSize: 16, marginBottom: 8, fontWeight: 700 }}>
                  Embed the 1-Line Script
                </Typography.Title>
                <Typography.Paragraph style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
                  Paste a single lightweight asynchronous script tag into your Shopify theme, WordPress header, or HTML footer.
                </Typography.Paragraph>
                
                {/* Creative code snippet box */}
                <div
                  onClick={handleCopySnippet}
                  style={{
                    marginTop: 'auto',
                    background: '#0f172a',
                    borderRadius: 8,
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                  }}
                >
                  <code style={{ color: '#38bdf8', fontSize: 11, fontFamily: 'monospace' }}>
                    &lt;script src=&quot;chatral.js&quot;&gt;
                  </code>
                  <span style={{ color: '#94a3b8', fontSize: 11 }}>
                    {copiedSnippet ? 'Copied!' : <CopyOutlined />}
                  </span>
                </div>
              </div>
            </Col>

            {/* Step 3 */}
            <Col xs={24} md={8}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 14,
                  padding: 24,
                  textAlign: 'left',
                  height: '100%',
                  boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ height: 3, background: 'linear-gradient(90deg, #10b981, #f59e0b)', position: 'absolute', top: 0, left: 0, right: 0 }} />
                <Flex justify="space-between" align="center" style={{ marginBottom: 14 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '3px 10px', borderRadius: 999, border: '1px solid #bbf7d0' }}>
                    STEP 03
                  </span>
                  <RocketOutlined style={{ fontSize: 18, color: '#94a3b8' }} />
                </Flex>
                <Typography.Title level={4} style={{ color: '#0f172a', fontSize: 16, marginBottom: 8, fontWeight: 700 }}>
                  Start Chatting & Selling
                </Typography.Title>
                <Typography.Paragraph style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
                  Your chat widget is instantly live. Receive sound alerts, engage shoppers with triggers, and boost conversions.
                </Typography.Paragraph>
                
                {/* Creative live toast preview */}
                <div style={{ marginTop: 'auto', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '8px 12px', fontSize: 11.5 }}>
                  <Flex align="center" gap={6}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }} />
                    <span style={{ color: '#1e40af', fontWeight: 600 }}>💬 New visitor on /checkout</span>
                  </Flex>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* 6. Live Interactive Demo Playground */}
      <section id="demo" style={{ padding: '70px 24px', background: '#ffffff' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <Tag color="blue" bordered={false} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, marginBottom: 10, fontWeight: 600 }}>
            INTERACTIVE EXPERIENCE
          </Tag>
          <Typography.Title level={2} style={{ color: '#0f172a', fontSize: isMobile ? 24 : 32, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
            Experience the Visitor Chat Widget
          </Typography.Title>
          <Typography.Paragraph style={{ color: '#64748b', fontSize: 14, marginBottom: 30 }}>
            Try sending a message below to experience the sub-second speed, clean design, and responsiveness of Chatral.
          </Typography.Paragraph>

          {/* Interactive Widget Box */}
          <Card
            bordered={false}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 18,
              boxShadow: '0 16px 36px -10px rgba(15, 23, 42, 0.08)',
              overflow: 'hidden',
              textAlign: 'left',
            }}
            bodyStyle={{ padding: 0 }}
          >
            {/* Widget Header */}
            <div style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', padding: '14px 18px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Flex gap={10} align="center">
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#ffffff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                  C
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Chatral Support</div>
                  <div style={{ fontSize: 11.5, opacity: 0.9 }}>🟢 Active now • Replies in under 1 min</div>
                </div>
              </Flex>
              <Tag color="default" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: 11, borderRadius: 999 }}>
                Demo Mode
              </Tag>
            </div>

            {/* Messages body */}
            <div style={{ padding: 16, minHeight: 230, maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, background: '#f8fafc' }}>
              {demoMessages.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    alignSelf: m.sender === 'visitor' ? 'flex-end' : 'flex-start',
                    maxWidth: '82%',
                    background: m.sender === 'visitor' ? '#2563eb' : '#ffffff',
                    color: m.sender === 'visitor' ? '#ffffff' : '#0f172a',
                    border: m.sender === 'visitor' ? 'none' : '1px solid #e2e8f0',
                    padding: '8px 12px',
                    borderRadius: m.sender === 'visitor' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    fontSize: 12.5,
                    lineHeight: 1.5,
                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                  }}
                >
                  {m.text}
                </div>
              ))}
            </div>

            {/* Quick replies */}
            <div style={{ padding: '8px 14px', background: '#f1f5f9', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 6, overflowX: 'auto' }}>
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
                  style={{ background: '#ffffff', borderColor: '#cbd5e1', color: '#334155', fontSize: 11.5, height: 26 }}
                >
                  {q}
                </Button>
              ))}
            </div>

            {/* Input bar */}
            <form onSubmit={handleDemoSend} style={{ display: 'flex', padding: 10, background: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
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
                  fontSize: 13,
                  padding: '6px 10px',
                }}
              />
              <Button type="primary" htmlType="submit" icon={<SendOutlined />} style={{ background: '#2563eb', fontSize: 12, height: 32 }}>
                Send
              </Button>
            </form>
          </Card>
        </div>
      </section>

      {/* 7. Transparent SaaS Pricing Table */}
      <section id="pricing" style={{ background: '#f8fafc', padding: '70px 24px', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', textAlign: 'center' }}>
          <Tag color="green" bordered={false} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, fontWeight: 600 }}>
            TRANSPARENT PRICING
          </Tag>
          <Typography.Title level={2} style={{ color: '#0f172a', fontSize: isMobile ? 24 : 34, fontWeight: 800, margin: '10px 0 12px', letterSpacing: '-0.02em' }}>
            Simple Plans That Scale with Your Growth
          </Typography.Title>
          <Typography.Paragraph style={{ color: '#64748b', fontSize: 14.5, marginBottom: 28 }}>
            Start free with our 14-day trial. No surprise charges. Upgrade, downgrade, or cancel anytime.
          </Typography.Paragraph>

          {/* Monthly / Yearly Toggle */}
          <div style={{ marginBottom: 40 }}>
            <Segmented
              options={[
                { label: 'Monthly Billing', value: 'monthly' },
                { label: 'Yearly Billing (20% OFF)', value: 'yearly' },
              ]}
              value={billingCycle}
              onChange={setBillingCycle}
              style={{ background: '#e2e8f0', padding: 3, borderRadius: 8, color: '#0f172a', fontWeight: 600, fontSize: 12.5 }}
            />
          </div>

          <Row gutter={[20, 20]} align="stretch">
            {/* Free Plan */}
            <Col xs={24} md={8}>
              <Card
                bordered={false}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 16,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  textAlign: 'left',
                  boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
                }}
                bodyStyle={{ padding: 26, display: 'flex', flexDirection: 'column', flex: 1 }}
              >
                <div style={{ fontWeight: 600, color: '#64748b', fontSize: 14.5 }}>Free Forever</div>
                <div style={{ fontSize: 34, fontWeight: 800, color: '#0f172a', margin: '10px 0 4px', letterSpacing: '-0.02em' }}>
                  $0 <span style={{ fontSize: 12.5, color: '#64748b', fontWeight: 400 }}>/ month</span>
                </div>
                <div style={{ color: '#64748b', fontSize: 12.5, marginBottom: 20 }}>
                  Perfect for new stores and individual website owners getting started.
                </div>
                <Divider style={{ borderColor: '#f1f5f9', margin: '0 0 16px' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24, fontSize: 12.5, color: '#334155' }}>
                  <div><CheckCircleFilled style={{ color: '#16a34a', marginRight: 7 }} /> 1 Active Store / Website</div>
                  <div><CheckCircleFilled style={{ color: '#16a34a', marginRight: 7 }} /> 2 Support Agents</div>
                  <div><CheckCircleFilled style={{ color: '#16a34a', marginRight: 7 }} /> Unlimited Live Chats</div>
                  <div><CheckCircleFilled style={{ color: '#16a34a', marginRight: 7 }} /> 30-Day Chat History</div>
                  <div><CheckCircleFilled style={{ color: '#16a34a', marginRight: 7 }} /> Standard Web Widget</div>
                </div>
                <Button
                  block
                  size="middle"
                  onClick={() => nav('/login?mode=signup')}
                  style={{ background: '#f8fafc', borderColor: '#e2e8f0', color: '#0f172a', fontWeight: 600, height: 40, fontSize: 13 }}
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
                  borderRadius: 16,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  textAlign: 'left',
                  position: 'relative',
                  boxShadow: '0 12px 30px -6px rgba(37, 99, 235, 0.16)',
                }}
                bodyStyle={{ padding: 26, display: 'flex', flexDirection: 'column', flex: 1 }}
              >
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)' }}>
                  <Tag color="blue" style={{ padding: '3px 14px', fontWeight: 700, borderRadius: 999, border: 'none', background: '#2563eb', color: '#ffffff', fontSize: 11 }}>
                    MOST POPULAR
                  </Tag>
                </div>
                <div style={{ fontWeight: 600, color: '#2563eb', fontSize: 14.5 }}>Starter Growth</div>
                <div style={{ fontSize: 34, fontWeight: 800, color: '#0f172a', margin: '10px 0 4px', letterSpacing: '-0.02em' }}>
                  {billingCycle === 'yearly' ? '$15' : '$19'}{' '}
                  <span style={{ fontSize: 12.5, color: '#64748b', fontWeight: 400 }}>/ month</span>
                </div>
                <div style={{ color: '#64748b', fontSize: 12.5, marginBottom: 20 }}>
                  For growing e-commerce businesses needing sales triggers and visitor radar.
                </div>
                <Divider style={{ borderColor: '#f1f5f9', margin: '0 0 16px' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24, fontSize: 12.5, color: '#334155' }}>
                  <div><CheckCircleFilled style={{ color: '#16a34a', marginRight: 7 }} /> <b>3 Active Stores</b></div>
                  <div><CheckCircleFilled style={{ color: '#16a34a', marginRight: 7 }} /> <b>5 Support Agents</b></div>
                  <div><CheckCircleFilled style={{ color: '#16a34a', marginRight: 7 }} /> Automated Sales Triggers</div>
                  <div><CheckCircleFilled style={{ color: '#16a34a', marginRight: 7 }} /> Real-time Live Visitor Radar</div>
                  <div><CheckCircleFilled style={{ color: '#16a34a', marginRight: 7 }} /> Canned / Saved Replies</div>
                  <div><CheckCircleFilled style={{ color: '#16a34a', marginRight: 7 }} /> 1-Year Chat & Visitor History</div>
                </div>
                <Button
                  type="primary"
                  block
                  size="middle"
                  onClick={() => nav('/login?mode=signup')}
                  style={{ background: '#2563eb', border: 'none', fontWeight: 600, height: 40, fontSize: 13, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.22)' }}
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
                  borderRadius: 16,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  textAlign: 'left',
                  boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
                }}
                bodyStyle={{ padding: 26, display: 'flex', flexDirection: 'column', flex: 1 }}
              >
                <div style={{ fontWeight: 600, color: '#64748b', fontSize: 14.5 }}>Business Pro</div>
                <div style={{ fontSize: 34, fontWeight: 800, color: '#0f172a', margin: '10px 0 4px', letterSpacing: '-0.02em' }}>
                  {billingCycle === 'yearly' ? '$39' : '$49'}{' '}
                  <span style={{ fontSize: 12.5, color: '#64748b', fontWeight: 400 }}>/ month</span>
                </div>
                <div style={{ color: '#64748b', fontSize: 12.5, marginBottom: 20 }}>
                  Maximum power, Shopify deep sync, and full white-label branding removal.
                </div>
                <Divider style={{ borderColor: '#f1f5f9', margin: '0 0 16px' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24, fontSize: 12.5, color: '#334155' }}>
                  <div><CheckCircleFilled style={{ color: '#16a34a', marginRight: 7 }} /> <b>Unlimited Stores</b></div>
                  <div><CheckCircleFilled style={{ color: '#16a34a', marginRight: 7 }} /> <b>15 Support Agents</b></div>
                  <div><CheckCircleFilled style={{ color: '#16a34a', marginRight: 7 }} /> Deep Shopify & Order Integration</div>
                  <div><CheckCircleFilled style={{ color: '#16a34a', marginRight: 7 }} /> <b>White-Label: Remove Branding</b></div>
                  <div><CheckCircleFilled style={{ color: '#16a34a', marginRight: 7 }} /> Bot Detection & Quality Filter</div>
                  <div><CheckCircleFilled style={{ color: '#16a34a', marginRight: 7 }} /> 24/7 Dedicated Support</div>
                </div>
                <Button
                  block
                  size="middle"
                  onClick={() => nav('/login?mode=signup')}
                  style={{ background: '#f8fafc', borderColor: '#e2e8f0', color: '#0f172a', fontWeight: 600, height: 40, fontSize: 13 }}
                >
                  Contact for Pro Trial
                </Button>
              </Card>
            </Col>
          </Row>
        </div>
      </section>

      {/* 8. Frequently Asked Questions (FAQ) */}
      <section id="faq" style={{ padding: '70px 24px', background: '#ffffff' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <Typography.Title level={2} style={{ color: '#0f172a', fontSize: isMobile ? 24 : 32, fontWeight: 800, letterSpacing: '-0.02em' }}>
              Frequently Asked Questions
            </Typography.Title>
            <Typography.Paragraph style={{ color: '#64748b', fontSize: 14 }}>
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
                label: <span style={{ color: '#0f172a', fontWeight: 600, fontSize: 14.5 }}>How do I install Chatral on my website?</span>,
                children: (
                  <Typography.Text style={{ color: '#475569', fontSize: 13.5, lineHeight: 1.65, display: 'block' }}>
                    Installation takes less than 2 minutes. In your Chatral dashboard, navigate to Store Settings &rarr; Widget, copy your unique 1-line HTML snippet, and paste it right before the closing <code>&lt;/body&gt;</code> tag of your website, Shopify theme (<code>theme.liquid</code>), or WordPress header.
                  </Typography.Text>
                ),
              },
              {
                key: '2',
                label: <span style={{ color: '#0f172a', fontWeight: 600, fontSize: 14.5 }}>Will the chat widget slow down my website loading speed?</span>,
                children: (
                  <Typography.Text style={{ color: '#475569', fontSize: 13.5, lineHeight: 1.65, display: 'block' }}>
                    No, absolutely not. Chatral is built with an ultra-lightweight asynchronous loader (less than 60 KB gzipped) and isolated inside a Shadow DOM. It loads completely in the background without blocking page render or affecting Google PageSpeed scores.
                  </Typography.Text>
                ),
              },
              {
                key: '3',
                label: <span style={{ color: '#0f172a', fontWeight: 600, fontSize: 14.5 }}>How does the Shopify integration work?</span>,
                children: (
                  <Typography.Text style={{ color: '#475569', fontSize: 13.5, lineHeight: 1.65, display: 'block' }}>
                    When a visitor chats with you, Chatral automatically looks up their email address in your connected Shopify store. You instantly see their previous orders, total lifetime spend, shipping tracking numbers, and items currently in their shopping cart.
                  </Typography.Text>
                ),
              },
              {
                key: '4',
                label: <span style={{ color: '#0f172a', fontWeight: 600, fontSize: 14.5 }}>Can I remove the &quot;Powered by Chatral&quot; branding?</span>,
                children: (
                  <Typography.Text style={{ color: '#475569', fontSize: 13.5, lineHeight: 1.65, display: 'block' }}>
                    Yes. On the Business Pro plan, you can completely remove the branding and customize the widget color, launcher icon, business hours, and sound notifications to match your brand identity 100%.
                  </Typography.Text>
                ),
              },
              {
                key: '5',
                label: <span style={{ color: '#0f172a', fontWeight: 600, fontSize: 14.5 }}>Is my customer data secure and GDPR compliant?</span>,
                children: (
                  <Typography.Text style={{ color: '#475569', fontSize: 13.5, lineHeight: 1.65, display: 'block' }}>
                    Yes. All chat sessions and visitor histories are encrypted in transit over WSS/TLS and stored in tenant-isolated PostgreSQL tables. We do not sell customer data and offer automated data deletion retention sweeps.
                  </Typography.Text>
                ),
              },
            ]}
          />
        </div>
      </section>

      {/* 9. Final CTA Banner */}
      <section style={{ padding: '50px 24px 80px', background: '#ffffff' }}>
        <div
          style={{
            maxWidth: 960,
            margin: '0 auto',
            background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 60%, #0284c7 100%)',
            borderRadius: 20,
            padding: isMobile ? '36px 20px' : '54px 40px',
            textAlign: 'center',
            boxShadow: '0 16px 36px rgba(37, 99, 235, 0.22)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle background ring */}
          <div
            style={{
              position: 'absolute',
              top: -60,
              right: -60,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              pointerEvents: 'none',
            }}
          />

          <Typography.Title level={2} style={{ color: '#ffffff', fontSize: isMobile ? 22 : 34, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
            Ready to Accelerate Your Online Sales?
          </Typography.Title>
          <Typography.Paragraph style={{ color: '#e0f2fe', fontSize: 15, maxWidth: 540, margin: '0 auto 28px', lineHeight: 1.6 }}>
            Join forward-thinking e-commerce and support teams using Chatral to deliver memorable customer experiences.
          </Typography.Paragraph>
          <Button
            type="primary"
            size="large"
            icon={<ArrowRightOutlined />}
            onClick={() => nav('/login?mode=signup')}
            style={{
              height: 46,
              padding: '0 30px',
              fontSize: 14.5,
              fontWeight: 700,
              background: '#ffffff',
              color: '#1e40af',
              border: 'none',
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
            }}
          >
            Start Your Free 14-Day Trial Today
          </Button>
        </div>
      </section>

      {/* 10. Footer */}
      <footer style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '50px 24px 26px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <Row gutter={[28, 28]} justify="space-between">
            <Col xs={24} md={8}>
              <ChatralFullLogo height={30} dark={false} style={{ marginBottom: 14 }} />
              <Typography.Paragraph style={{ color: '#64748b', fontSize: 12.5, lineHeight: 1.6, maxWidth: 280 }}>
                Next-generation real-time customer messaging and live visitor engagement platform for modern businesses.
              </Typography.Paragraph>
              <div style={{ color: '#94a3b8', fontSize: 11.5 }}>
                Developed & Operated by DigiScale Infotech.
              </div>
            </Col>

            <Col xs={12} sm={8} md={5}>
              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13, marginBottom: 12 }}>Product</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5 }}>
                <a onClick={() => scrollTo('features')} style={{ color: '#475569', cursor: 'pointer' }}>Features</a>
                <a onClick={() => scrollTo('pricing')} style={{ color: '#475569', cursor: 'pointer' }}>Pricing</a>
                <a onClick={() => scrollTo('demo')} style={{ color: '#475569', cursor: 'pointer' }}>Interactive Demo</a>
                <Link to="/login" style={{ color: '#475569' }}>Agent Portal</Link>
              </div>
            </Col>

            <Col xs={12} sm={8} md={5}>
              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13, marginBottom: 12 }}>Legal & Trust</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5 }}>
                <Link to="/privacy" style={{ color: '#2563eb', fontWeight: 500 }}>Privacy Policy</Link>
                <Link to="/terms" style={{ color: '#2563eb', fontWeight: 500 }}>Terms of Service</Link>
                <span style={{ color: '#64748b' }}>GDPR Compliant</span>
                <span style={{ color: '#64748b' }}>99.98% SLA</span>
              </div>
            </Col>

            <Col xs={24} sm={8} md={6}>
              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13, marginBottom: 12 }}>Contact & Support</div>
              <div style={{ color: '#475569', fontSize: 12.5, lineHeight: 1.7 }}>
                <div>Support: <a href="mailto:digiscaleinfotech@gmail.com" style={{ color: '#2563eb' }}>digiscaleinfotech@gmail.com</a></div>
                <div>Hours: Monday - Friday, 9am - 7pm IST</div>
              </div>
            </Col>
          </Row>

          <Divider style={{ borderColor: '#e2e8f0', margin: '34px 0 20px' }} />

          <Flex justify={isMobile ? 'center' : 'space-between'} align="center" wrap="wrap" gap={10}>
            <div style={{ color: '#94a3b8', fontSize: 11.5 }}>
              &copy; {new Date().getFullYear()} DigiScale Infotech. All rights reserved. Chatral&trade; is a trademark of DigiScale Infotech.
            </div>
            <Flex gap={14} style={{ fontSize: 11.5 }}>
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
