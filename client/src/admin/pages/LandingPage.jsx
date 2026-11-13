import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Button, Card, Col, Collapse, Divider, Flex, Grid, Row, Segmented, Tag, Typography,
} from 'antd';
import {
  ArrowRightOutlined, CheckCircleFilled, MessageOutlined,
  SendOutlined, RocketOutlined, PlayCircleOutlined,
  ShopOutlined, TeamOutlined, LockOutlined, ThunderboltOutlined,
  GlobalOutlined, RiseOutlined, SafetyCertificateOutlined,
  CopyOutlined, StarFilled, UserOutlined, SearchOutlined,
  BarChartOutlined, BellOutlined, CheckOutlined,
} from '@ant-design/icons';
import { ChatralFullLogo } from '../components/BrandLogo.jsx';

const { useBreakpoint } = Grid;

export default function LandingPage() {
  const nav = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [billingCycle, setBillingCycle] = useState('annual');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [demoInput, setDemoInput] = useState('');
  const [demoMessages, setDemoMessages] = useState([
    { sender: 'bot', text: 'Hi! 👋 Looking to connect with our sales team?', time: 'Just now' },
    { sender: 'visitor', text: 'Hey! Does Chatral include Shopify real-time sync?', time: 'Just now' },
    { sender: 'agent', text: 'Yes, absolutely! Order history, customer spend & active cart sync automatically.', time: 'Just now' },
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
        { sender: 'agent', text: 'Thanks for asking! Our operator inbox connects directly to your store in under 2 minutes.', time: 'Just now' },
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
        background: '#f7f8fa',
        color: '#0c0d10',
        minHeight: '100vh',
        overflowX: 'hidden',
        fontFamily: '"Work Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      }}
    >
      {/* 1. Navigation Header (Exact Relatik Navbar) */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(247, 248, 250, 0.82)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid #e6e7eb',
          width: '100%',
          padding: '0 24px',
        }}
      >
        <div
          style={{
            maxWidth: 1140,
            margin: '0 auto',
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Relatik Logo: Black Squircle Icon + Lowercase Wordmark */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div
              style={{
                width: 32,
                height: 32,
                background: '#0c0d10',
                borderRadius: 9,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {/* Relatik Geometric Clover Icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M 2.625 0 C 4.075 0 5.25 1.175 5.25 2.625 C 5.25 4.075 4.075 5.25 2.625 5.25 L 0 5.25 L 0 2.625 C 0 1.175 1.175 0 2.625 0 Z"
                  stroke="#ffffff"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  transform="translate(14.25 4.5)"
                />
                <path
                  d="M 5.25 5.25 L 2.625 5.25 C 1.175 5.25 0 4.075 0 2.625 L 0 2.625 C 0 1.175 1.175 0 2.625 0 C 4.075 0 5.25 1.175 5.25 2.625 L 5.25 5.25 Z"
                  stroke="#ffffff"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  transform="translate(4.5 4.5)"
                />
                <path
                  d="M 0 0 L 2.625 0 C 4.075 0 5.25 1.175 5.25 2.625 L 5.25 2.625 C 5.25 4.075 4.075 5.25 2.625 5.25 L 2.625 5.25 C 1.175 5.25 0 4.075 0 2.625 L 0 0 Z"
                  stroke="#ffffff"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  transform="translate(14.25 14.25)"
                />
                <path
                  d="M 2.625 5.25 C 1.175 5.25 0 4.075 0 2.625 L 0 2.625 C 0 1.175 1.175 0 2.625 0 L 5.25 0 L 5.25 0 L 5.25 2.625 C 5.25 4.075 4.075 5.25 2.625 5.25 Z"
                  stroke="#ffffff"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  transform="translate(4.5 14.25)"
                />
                <rect x="9.75" y="9.75" width="4.5" height="4.5" stroke="#ffffff" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span
              style={{
                fontFamily: '"Work Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: 19,
                fontWeight: 600,
                letterSpacing: '-0.03em',
                lineHeight: '1em',
                color: '#0c0d10',
              }}
            >
              chatral
            </span>
          </Link>

          {/* Relatik Center Nav Links: Features, How it works, Testimonials, FAQ, Pricing */}
          {!isMobile && (
            <Flex gap={32} align="center">
              <a
                onClick={() => scrollTo('features')}
                style={{
                  color: '#5b5f6b',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'color 0.15s',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#0c0d10')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#5b5f6b')}
              >
                Features
              </a>
              <a
                onClick={() => scrollTo('how-it-works')}
                style={{
                  color: '#5b5f6b',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'color 0.15s',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#0c0d10')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#5b5f6b')}
              >
                How it works
              </a>
              <a
                onClick={() => scrollTo('testimonials')}
                style={{
                  color: '#5b5f6b',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'color 0.15s',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#0c0d10')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#5b5f6b')}
              >
                Testimonials
              </a>
              <a
                onClick={() => scrollTo('faq')}
                style={{
                  color: '#5b5f6b',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'color 0.15s',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#0c0d10')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#5b5f6b')}
              >
                FAQ
              </a>
              <a
                onClick={() => scrollTo('pricing')}
                style={{
                  color: '#5b5f6b',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'color 0.15s',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#0c0d10')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#5b5f6b')}
              >
                Pricing
              </a>
            </Flex>
          )}

          {/* Relatik Right Button: Signature Black Button with Arrow */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => nav('/login?mode=signup')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#0c0d10',
                color: '#ffffff',
                border: 'none',
                borderRadius: 12,
                padding: '8px 18px',
                height: 38,
                fontSize: 13.5,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0px 1px 2px 0px rgba(12, 13, 16, 0.12), inset 0px 1px 0px 0px rgba(255, 255, 255, 0.12)',
                transition: 'all 0.15s ease',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <span>Start Free</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section (Relatik Typography & Minimalist Clean Feel) */}
      <section style={{ padding: isMobile ? '48px 20px 36px' : '76px 24px 50px', textAlign: 'center' }}>
        <div style={{ maxWidth: 840, margin: '0 auto' }}>
          
          {/* Relatik Section Pill Tag */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 14px',
              background: '#eaf2ff',
              border: '1px solid #d3e4ff',
              borderRadius: 999,
              marginBottom: 20,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2b7fff' }} />
            <span style={{ color: '#2b7fff', fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Customer Messaging Made Simple
            </span>
          </div>

          {/* Relatik Big Title */}
          <Typography.Title
            level={1}
            style={{
              color: '#0c0d10',
              fontSize: isMobile ? 32 : 52,
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              margin: '0 auto 18px',
              maxWidth: 780,
            }}
          >
            Turn website visitors into paying customers with{' '}
            <span style={{ color: '#2b7fff' }}>real-time live chat</span>
          </Typography.Title>

          {/* Relatik Subtitle */}
          <Typography.Paragraph
            style={{
              color: '#5b5f6b',
              fontSize: isMobile ? 15 : 16.5,
              lineHeight: 1.6,
              maxWidth: 580,
              margin: '0 auto 32px',
              fontWeight: 400,
            }}
          >
            Chatral is a simple, modern live chat platform that keeps your visitors, customer data, and sales conversations organized in one place. Start your free 14-day trial.
          </Typography.Paragraph>

          {/* Relatik Hero CTAs */}
          <Flex justify="center" gap={12} wrap="wrap" style={{ marginBottom: 24 }}>
            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              onClick={() => nav('/login?mode=signup')}
              style={{
                height: 48,
                padding: '0 28px',
                fontSize: 14.5,
                fontWeight: 600,
                background: '#2b7fff',
                border: 'none',
                borderRadius: 10,
                boxShadow: '0 8px 24px rgba(43, 127, 255, 0.28)',
              }}
            >
              Start Free Trial
            </Button>
            <Button
              size="large"
              onClick={() => scrollTo('demo')}
              style={{
                height: 48,
                padding: '0 24px',
                fontSize: 14.5,
                fontWeight: 600,
                color: '#0c0d10',
                background: '#ffffff',
                border: '1px solid #e6e7eb',
                borderRadius: 10,
                boxShadow: '0 2px 6px rgba(12, 13, 16, 0.02)',
              }}
            >
              Try Live Demo
            </Button>
          </Flex>

          {/* Relatik Trust micro-copy */}
          <div style={{ color: '#6b707c', fontSize: 12.5, fontWeight: 400 }}>
            No credit card required • 14-day free trial • Cancel anytime
          </div>
        </div>

        {/* Hero Dashboard Showcase (Relatik CRM App UI Preview) */}
        <div style={{ maxWidth: 1040, margin: '48px auto 0' }}>
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e6e7eb',
              borderRadius: 20,
              overflow: 'hidden',
              boxShadow: '0 24px 48px -12px rgba(12, 13, 16, 0.08), 0 1px 3px rgba(12, 13, 16, 0.04)',
              textAlign: 'left',
            }}
          >
            {/* Relatik Top Navigation Bar inside dashboard */}
            <div
              style={{
                background: '#f7f8fa',
                borderBottom: '1px solid #e6e7eb',
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <Flex gap={12} align="center">
                <Flex gap={6}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f' }} />
                </Flex>
                <Divider type="vertical" style={{ borderColor: '#e6e7eb', margin: '0 4px' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#0c0d10', fontWeight: 600 }}>
                  <ShopOutlined style={{ color: '#2b7fff' }} /> Store Alpha (Live)
                </div>
              </Flex>

              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e6e7eb',
                  borderRadius: 8,
                  padding: '4px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 11.5,
                  color: '#6b707c',
                }}
              >
                <SearchOutlined />
                <span>Search visitors, Shopify orders, conversations...</span>
                <span style={{ background: '#f1f2f5', padding: '1px 6px', borderRadius: 4, fontSize: 10, color: '#0c0d10' }}>⌘K</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#27c93f' }} />
                <span style={{ fontSize: 11.5, color: '#16a34a', fontWeight: 600 }}>Connected</span>
              </div>
            </div>

            {/* Relatik Dashboard Metrics Ribbon */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #f1f2f5',
                background: '#ffffff',
                display: 'flex',
                gap: 24,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: '#6b707c', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
                  Live Visitors
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#0c0d10', marginTop: 2 }}>
                  42 <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>+18%</span>
                </div>
              </div>
              <Divider type="vertical" style={{ height: 36, borderColor: '#e6e7eb' }} />
              <div>
                <div style={{ fontSize: 11, color: '#6b707c', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
                  Avg. Response Time
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#2b7fff', marginTop: 2 }}>
                  14s <span style={{ fontSize: 11, color: '#5b5f6b', fontWeight: 400 }}>sub-second socket</span>
                </div>
              </div>
              <Divider type="vertical" style={{ height: 36, borderColor: '#e6e7eb' }} />
              <div>
                <div style={{ fontSize: 11, color: '#6b707c', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
                  Deals Closed Today
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#0c0d10', marginTop: 2 }}>
                  $3,840.00 <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>Shopify sync</span>
                </div>
              </div>
            </div>

            {/* Main Workspace Split Preview */}
            <div style={{ padding: isMobile ? 12 : 20, background: '#fafbfd' }}>
              <Row gutter={[16, 16]}>
                {/* Left: Conversations Queue */}
                <Col xs={24} md={8}>
                  <div style={{ background: '#ffffff', border: '1px solid #e6e7eb', borderRadius: 12, padding: 12 }}>
                    <div style={{ fontSize: 11, color: '#6b707c', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 10 }}>
                      Active Conversations (3)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        { name: 'Jaydeep Patel', msg: 'Added Starter plan to cart...', time: '1m', active: true, tag: 'High Intent' },
                        { name: 'Rina Nakamura', msg: 'Do you ship to Tokyo?', time: '4m', active: false, tag: 'Inquiry' },
                        { name: 'Theo Castillo', msg: 'How do I add team members?', time: '12m', active: false, tag: 'Support' },
                      ].map((c, i) => (
                        <div
                          key={i}
                          style={{
                            padding: '10px 12px',
                            borderRadius: 8,
                            background: c.active ? '#eaf2ff' : '#ffffff',
                            border: c.active ? '1px solid #b3d1ff' : '1px solid #f1f2f5',
                            cursor: 'pointer',
                          }}
                        >
                          <Flex justify="space-between" align="center">
                            <span style={{ fontWeight: 600, fontSize: 12.5, color: '#0c0d10' }}>{c.name}</span>
                            <span style={{ fontSize: 10.5, color: '#6b707c' }}>{c.time}</span>
                          </Flex>
                          <div style={{ fontSize: 11.5, color: c.active ? '#2b7fff' : '#6b707c', marginTop: 3, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {c.msg}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Col>

                {/* Middle: Active Live Chat */}
                <Col xs={24} md={10}>
                  <div style={{ background: '#ffffff', border: '1px solid #e6e7eb', borderRadius: 12, padding: 14, minHeight: 280, display: 'flex', flexDirection: 'column' }}>
                    <Flex justify="space-between" align="center" style={{ paddingBottom: 10, borderBottom: '1px solid #f1f2f5' }}>
                      <Flex gap={8} align="center">
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#2b7fff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11 }}>
                          JP
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 12, color: '#0c0d10' }}>Jaydeep Patel</div>
                          <div style={{ fontSize: 10.5, color: '#6b707c' }}>Surat, India • Chrome on macOS</div>
                        </div>
                      </Flex>
                      <Tag color="processing" bordered={false} style={{ fontSize: 10, borderRadius: 999 }}>Active</Tag>
                    </Flex>

                    {/* Messages */}
                    <div style={{ flex: 1, padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ alignSelf: 'flex-start', maxWidth: '85%', background: '#f1f2f5', padding: '8px 12px', borderRadius: '10px 10px 10px 2px', fontSize: 12, color: '#0c0d10' }}>
                        Hello! Does Chatral include live Shopify customer history?
                        <div style={{ fontSize: 9, color: '#81d43be3', marginTop: 3 }}>12:28 PM</div>
                      </div>
                      <div style={{ alignSelf: 'flex-end', maxWidth: '85%', background: '#2b7fff', color: '#fff', padding: '8px 12px', borderRadius: '10px 10px 2px 10px', fontSize: 12 }}>
                        Hi Jaydeep! Yes, both Starter and Pro plans sync lifetime orders and active carts instantly!
                        <div style={{ fontSize: 9, color: '#eaf2ff', marginTop: 3, textAlign: 'right' }}>12:29 PM • Read</div>
                      </div>
                    </div>

                    <div style={{ background: '#f7f8fa', border: '1px solid #e6e7eb', borderRadius: 8, padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11.5, color: '#94a3b8' }}>Type a reply or press / for shortcuts...</span>
                      <Button type="primary" size="small" icon={<SendOutlined />} style={{ background: '#2b7fff', height: 24, fontSize: 11 }}>Send</Button>
                    </div>
                  </div>
                </Col>

                {/* Right: Shopify & Visitor Intelligence */}
                <Col xs={24} md={6}>
                  <div style={{ background: '#ffffff', border: '1px solid #e6e7eb', borderRadius: 12, padding: 12, height: '100%' }}>
                    <div style={{ fontSize: 11, color: '#6b707c', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 10 }}>
                      Customer Intelligence
                    </div>
                    <div style={{ background: '#f7f8fa', borderRadius: 8, padding: 10, border: '1px solid #e6e7eb', marginBottom: 10 }}>
                      <Flex justify="space-between" style={{ marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: '#6b707c' }}>Total Orders:</span>
                        <strong style={{ fontSize: 11, color: '#0c0d10' }}>4 Orders</strong>
                      </Flex>
                      <Flex justify="space-between" style={{ marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: '#6b707c' }}>Lifetime Spent:</span>
                        <strong style={{ fontSize: 11, color: '#16a34a' }}>$489.00</strong>
                      </Flex>
                      <Flex justify="space-between">
                        <span style={{ fontSize: 11, color: '#6b707c' }}>Active Cart:</span>
                        <strong style={{ fontSize: 11, color: '#2b7fff' }}>$149.00</strong>
                      </Flex>
                    </div>

                    <div style={{ fontSize: 11, fontWeight: 600, color: '#0c0d10', marginBottom: 6 }}>
                      Journey Timeline
                    </div>
                    <div style={{ fontSize: 10.5, color: '#5b5f6b', display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <div>📍 12:25 PM • Google Search</div>
                      <div>📄 12:26 PM • Viewed /pricing</div>
                      <div>🛒 12:28 PM • Checkout trigger</div>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Features Bento Grid (Relatik Signature Bento Layout) */}
      <section id="features" style={{ padding: '80px 24px', background: '#f7f8fa' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                background: '#eaf2ff',
                border: '1px solid #d3e4ff',
                borderRadius: 999,
                marginBottom: 12,
              }}
            >
              <span style={{ color: '#2b7fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Features
              </span>
            </div>
            <Typography.Title
              level={2}
              style={{
                color: '#0c0d10',
                fontSize: isMobile ? 26 : 38,
                fontWeight: 800,
                letterSpacing: '-0.025em',
                margin: '0 0 12px',
              }}
            >
              Everything you need to close more deals
            </Typography.Title>
            <Typography.Paragraph style={{ color: '#5b5f6b', fontSize: 15, maxWidth: 540, margin: '0 auto' }}>
              Built for speed and simplicity. Replace complex, bloated chat tools with an intuitive platform your team will actually love using.
            </Typography.Paragraph>
          </div>

          {/* Relatik Bento Grid */}
          <Row gutter={[20, 20]}>
            {/* Bento Card 1: Lead & Visitor Management (Large 2-column or prominent) */}
            <Col xs={24} md={14}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e6e7eb',
                  borderRadius: 18,
                  padding: '28px 26px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 8px rgba(12, 13, 16, 0.02)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eaf2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <GlobalOutlined style={{ fontSize: 20, color: '#2b7fff' }} />
                  </div>
                  <Typography.Title level={4} style={{ color: '#0c0d10', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                    Lead & Visitor Management
                  </Typography.Title>
                  <Typography.Paragraph style={{ color: '#5b5f6b', fontSize: 13.5, lineHeight: 1.6, margin: 0, maxWidth: 440 }}>
                    Track every lead from first contact to closed deal with customizable visitor pipelines — no spreadsheets required.
                  </Typography.Paragraph>
                </div>

                {/* Relatik Mini Visual inside card */}
                <div style={{ marginTop: 24, background: '#f7f8fa', borderRadius: 12, padding: 14, border: '1px solid #e6e7eb' }}>
                  <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#0c0d10' }}>Live Radar • Active Page</span>
                    <span style={{ fontSize: 10.5, color: '#16a34a', fontWeight: 600 }}>● 8 Active Now</span>
                  </Flex>
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
                    <Tag color="blue" bordered={false} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6 }}>/checkout (Triggered)</Tag>
                    <Tag color="cyan" bordered={false} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6 }}>/pricing (2m 14s)</Tag>
                    <Tag color="default" bordered={false} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6 }}>/products/pro</Tag>
                  </div>
                </div>
              </div>
            </Col>

            {/* Bento Card 2: Pipeline Overview */}
            <Col xs={24} md={10}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e6e7eb',
                  borderRadius: 18,
                  padding: '28px 26px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 8px rgba(12, 13, 16, 0.02)',
                }}
              >
                <div>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <RiseOutlined style={{ fontSize: 20, color: '#16a34a' }} />
                  </div>
                  <Typography.Title level={4} style={{ color: '#0c0d10', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                    Pipeline & Conversation Overview
                  </Typography.Title>
                  <Typography.Paragraph style={{ color: '#5b5f6b', fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>
                    See your whole sales pipeline at a glance. Monitor response times, spot bottlenecks, and keep conversations moving.
                  </Typography.Paragraph>
                </div>

                <div style={{ marginTop: 24, background: '#f7f8fa', borderRadius: 12, padding: 12, border: '1px solid #e6e7eb' }}>
                  <Flex justify="space-between" align="center">
                    <span style={{ fontSize: 11, color: '#5b5f6b' }}>Avg. Response Speed</span>
                    <strong style={{ fontSize: 12, color: '#16a34a' }}>&lt; 14 Seconds</strong>
                  </Flex>
                </div>
              </div>
            </Col>

            {/* Bento Card 3: Analytics & Insights */}
            <Col xs={24} md={8}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e6e7eb',
                  borderRadius: 18,
                  padding: '28px 24px',
                  height: '100%',
                  boxShadow: '0 2px 8px rgba(12, 13, 16, 0.02)',
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <BarChartOutlined style={{ fontSize: 20, color: '#7c3aed' }} />
                </div>
                <Typography.Title level={4} style={{ color: '#0c0d10', fontSize: 17, fontWeight: 700, marginBottom: 8 }}>
                  Analytics & Insights
                </Typography.Title>
                <Typography.Paragraph style={{ color: '#5b5f6b', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                  Real-time reports and dashboards that show what’s working, agent response SLA, and where to focus next.
                </Typography.Paragraph>
              </div>
            </Col>

            {/* Bento Card 4: Automated Workflows */}
            <Col xs={24} md={8}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e6e7eb',
                  borderRadius: 18,
                  padding: '28px 24px',
                  height: '100%',
                  boxShadow: '0 2px 8px rgba(12, 13, 16, 0.02)',
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <ThunderboltOutlined style={{ fontSize: 20, color: '#d97706' }} />
                </div>
                <Typography.Title level={4} style={{ color: '#0c0d10', fontSize: 17, fontWeight: 700, marginBottom: 8 }}>
                  Automated Workflows
                </Typography.Title>
                <Typography.Paragraph style={{ color: '#5b5f6b', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                  Put sales greetings on autopilot with smart behavioral triggers, so your team can focus on closing deals.
                </Typography.Paragraph>
              </div>
            </Col>

            {/* Bento Card 5: Team Collaboration */}
            <Col xs={24} md={8}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e6e7eb',
                  borderRadius: 18,
                  padding: '28px 24px',
                  height: '100%',
                  boxShadow: '0 2px 8px rgba(12, 13, 16, 0.02)',
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fdf2f8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <TeamOutlined style={{ fontSize: 20, color: '#db2777' }} />
                </div>
                <Typography.Title level={4} style={{ color: '#0c0d10', fontSize: 17, fontWeight: 700, marginBottom: 8 }}>
                  Team Collaboration
                </Typography.Title>
                <Typography.Paragraph style={{ color: '#5b5f6b', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                  Assign chats, leave internal whisper notes, use canned shortcuts, and stay aligned with real-time updates.
                </Typography.Paragraph>
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* 4. How It Works (Relatik 3 Simple Steps with Pill Numbers) */}
      <section id="how-it-works" style={{ padding: '80px 24px', background: '#ffffff', borderTop: '1px solid #e6e7eb', borderBottom: '1px solid #e6e7eb' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              background: '#eaf2ff',
              border: '1px solid #d3e4ff',
              borderRadius: 999,
              marginBottom: 12,
            }}
          >
            <span style={{ color: '#2b7fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              How It Works
            </span>
          </div>
          <Typography.Title
            level={2}
            style={{
              color: '#0c0d10',
              fontSize: isMobile ? 26 : 38,
              fontWeight: 800,
              letterSpacing: '-0.025em',
              margin: '0 0 12px',
            }}
          >
            Get started in 3 simple steps
          </Typography.Title>
          <Typography.Paragraph style={{ color: '#5b5f6b', fontSize: 15, maxWidth: 540, margin: '0 auto 48px' }}>
            Set up your workspace and start chatting with customers in less than 2 minutes.
          </Typography.Paragraph>

          <Row gutter={[24, 24]}>
            {[
              {
                step: '01',
                title: 'Create your workspace',
                desc: 'Sign up with your email and set up your workspace in minutes. Pick a store name and invite your team.',
              },
              {
                step: '02',
                title: 'Embed the 1-line script',
                desc: 'Paste a single lightweight asynchronous script tag into your Shopify theme, WordPress header, or HTML site.',
              },
              {
                step: '03',
                title: 'Start chatting & selling',
                desc: 'Your widget is instantly live. Receive sound notifications, engage shoppers with triggers, and boost conversions.',
              },
            ].map((s, i) => (
              <Col xs={24} md={8} key={i}>
                <div
                  style={{
                    background: '#f7f8fa',
                    border: '1px solid #e6e7eb',
                    borderRadius: 18,
                    padding: '32px 24px',
                    textAlign: 'left',
                    height: '100%',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: '#ffffff',
                      border: '1px solid #e6e7eb',
                      fontWeight: 800,
                      fontSize: 14,
                      color: '#2b7fff',
                      marginBottom: 20,
                    }}
                  >
                    {s.step}
                  </div>
                  <Typography.Title level={4} style={{ color: '#0c0d10', fontSize: 17, fontWeight: 700, marginBottom: 10 }}>
                    {s.title}
                  </Typography.Title>
                  <Typography.Paragraph style={{ color: '#5b5f6b', fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>
                    {s.desc}
                  </Typography.Paragraph>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* 5. Relatik Numbers / Stats Banner */}
      <section style={{ padding: '60px 24px', background: '#f7f8fa' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e6e7eb',
              borderRadius: 20,
              padding: isMobile ? '30px 20px' : '40px 36px',
              textAlign: 'center',
            }}
          >
            <Row gutter={[24, 24]} align="middle">
              <Col xs={24} sm={8}>
                <div style={{ fontSize: 36, fontWeight: 800, color: '#0c0d10', letterSpacing: '-0.03em' }}>150,000+</div>
                <div style={{ fontSize: 13, color: '#5b5f6b', marginTop: 4 }}>conversations tracked weekly</div>
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ fontSize: 36, fontWeight: 800, color: '#2b7fff', letterSpacing: '-0.03em' }}>&lt; 14s</div>
                <div style={{ fontSize: 13, color: '#5b5f6b', marginTop: 4 }}>average first response time</div>
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ fontSize: 36, fontWeight: 800, color: '#16a34a', letterSpacing: '-0.03em' }}>99.98%</div>
                <div style={{ fontSize: 13, color: '#5b5f6b', marginTop: 4 }}>platform SLA uptime</div>
              </Col>
            </Row>
          </div>
        </div>
      </section>

      {/* 6. Testimonials (Relatik Exact Quotes & Clean Grid) */}
      <section id="testimonials" style={{ padding: '80px 24px', background: '#ffffff', borderTop: '1px solid #e6e7eb' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                background: '#eaf2ff',
                border: '1px solid #d3e4ff',
                borderRadius: 999,
                marginBottom: 12,
              }}
            >
              <span style={{ color: '#2b7fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Testimonials
              </span>
            </div>
            <Typography.Title
              level={2}
              style={{
                color: '#0c0d10',
                fontSize: isMobile ? 26 : 38,
                fontWeight: 800,
                letterSpacing: '-0.025em',
                margin: '0 0 12px',
              }}
            >
              Loved by fast-growing brands
            </Typography.Title>
            <Typography.Paragraph style={{ color: '#5b5f6b', fontSize: 15, maxWidth: 540, margin: '0 auto' }}>
              See why modern e-commerce and SaaS teams trust Chatral for their daily customer operations.
            </Typography.Paragraph>
          </div>

          <Row gutter={[20, 20]}>
            {[
              {
                title: 'Clean, modern, and so easy to set up',
                quote: '“I’ve tried a dozen live chat tools, and this is the first one my team adopted without a fight. Everything just makes sense.”',
                author: 'Alex B.',
                role: 'Startup Founder',
                avatarBg: '#2b7fff',
              },
              {
                title: 'Streamlined our workflow instantly',
                quote: '“We switched two months ago and the difference is night and day. Managing visitors and follow-ups has never been this effortless.”',
                author: 'Julia T.',
                role: 'Sales Director',
                avatarBg: '#16a34a',
              },
              {
                title: 'Exactly what our team needed',
                quote: '“The interface is clean, intuitive, and fast. Our sales team actually enjoys using it — which says a lot.”',
                author: 'Mark R.',
                role: 'Head of Growth',
                avatarBg: '#7c3aed',
              },
              {
                title: 'Increased our productivity by 30%',
                quote: '“With automated reminders and real-time visitor alerts, we no longer let promising deals slip through the cracks.”',
                author: 'Anika S.',
                role: 'CRM Operations Manager',
                avatarBg: '#d97706',
              },
              {
                title: 'Fast, reliable, and beautiful',
                quote: '“It’s rare to find software that looks this good and performs this well. Chatral checks every box for our customer support.”',
                author: 'Sophie D.',
                role: 'Marketing Manager',
                avatarBg: '#0284c7',
              },
              {
                title: 'Support team is next level',
                quote: '“Beyond the product itself, the onboarding and ongoing support from DigiScale Infotech have been outstanding from day one.”',
                author: 'Daniel K.',
                role: 'Customer Success Lead',
                avatarBg: '#db2777',
              },
            ].map((t, i) => (
              <Col xs={24} md={8} key={i}>
                <div
                  style={{
                    background: '#f7f8fa',
                    border: '1px solid #e6e7eb',
                    borderRadius: 16,
                    padding: '24px 22px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    {/* 5 Stars */}
                    <div style={{ display: 'flex', gap: 3, color: '#f59e0b', fontSize: 13, marginBottom: 12 }}>
                      {[...Array(5)].map((_, s) => <StarFilled key={s} />)}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14.5, color: '#0c0d10', marginBottom: 8 }}>
                      {t.title}
                    </div>
                    <div style={{ color: '#5b5f6b', fontSize: 13, lineHeight: 1.6 }}>
                      {t.quote}
                    </div>
                  </div>

                  <Flex align="center" gap={10} style={{ marginTop: 20 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        background: t.avatarBg,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      {t.author.slice(0, 1)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#0c0d10' }}>{t.author}</div>
                      <div style={{ fontSize: 11.5, color: '#6b707c' }}>{t.role}</div>
                    </div>
                  </Flex>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* 7. Interactive Playground Widget (Experience Chatral live) */}
      <section id="demo" style={{ padding: '80px 24px', background: '#f7f8fa', borderTop: '1px solid #e6e7eb' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              background: '#eaf2ff',
              border: '1px solid #d3e4ff',
              borderRadius: 999,
              marginBottom: 12,
            }}
          >
            <span style={{ color: '#2b7fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Interactive Demo
            </span>
          </div>
          <Typography.Title
            level={2}
            style={{
              color: '#0c0d10',
              fontSize: isMobile ? 24 : 34,
              fontWeight: 800,
              letterSpacing: '-0.025em',
              margin: '0 0 12px',
            }}
          >
            Experience the visitor chat widget
          </Typography.Title>
          <Typography.Paragraph style={{ color: '#5b5f6b', fontSize: 14.5, marginBottom: 32 }}>
            Send a message below to test the instant real-time response and clean interface.
          </Typography.Paragraph>

          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e6e7eb',
              borderRadius: 18,
              boxShadow: '0 16px 36px -10px rgba(12, 13, 16, 0.06)',
              overflow: 'hidden',
              textAlign: 'left',
            }}
          >
            {/* Widget Bar */}
            <div style={{ background: '#2b7fff', padding: '14px 18px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Flex gap={10} align="center">
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#ffffff', color: '#2b7fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>
                  C
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>Chatral Support</div>
                  <div style={{ fontSize: 11, opacity: 0.9 }}>🟢 Active now • Replies in under 1 min</div>
                </div>
              </Flex>
              <Tag color="default" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: 10.5, borderRadius: 999 }}>
                Demo Mode
              </Tag>
            </div>

            {/* Chat Body */}
            <div style={{ padding: 16, minHeight: 220, maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, background: '#f7f8fa' }}>
              {demoMessages.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    alignSelf: m.sender === 'visitor' ? 'flex-end' : 'flex-start',
                    maxWidth: '82%',
                    background: m.sender === 'visitor' ? '#2b7fff' : '#ffffff',
                    color: m.sender === 'visitor' ? '#ffffff' : '#0c0d10',
                    border: m.sender === 'visitor' ? 'none' : '1px solid #e6e7eb',
                    padding: '8px 12px',
                    borderRadius: m.sender === 'visitor' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    fontSize: 12.5,
                    lineHeight: 1.5,
                    boxShadow: '0 1px 3px rgba(12, 13, 16, 0.03)',
                  }}
                >
                  {m.text}
                </div>
              ))}
            </div>

            {/* Quick Prompts */}
            <div style={{ padding: '8px 14px', background: '#ffffff', borderTop: '1px solid #f1f2f5', display: 'flex', gap: 6, overflowX: 'auto' }}>
              {['Pricing plans?', 'How to install on Shopify?', 'Is there a free trial?'].map((q, i) => (
                <Button
                  key={i}
                  size="small"
                  onClick={() => {
                    setDemoMessages((p) => [...p, { sender: 'visitor', text: q, time: 'Just now' }]);
                    setTimeout(() => {
                      setDemoMessages((p) => [
                        ...p,
                        { sender: 'agent', text: `Great question regarding: "${q}". Chatral takes under 2 minutes to install and comes with a 14-day free trial!`, time: 'Just now' },
                      ]);
                    }, 500);
                  }}
                  style={{ background: '#f7f8fa', borderColor: '#e6e7eb', color: '#5b5f6b', fontSize: 11.5, height: 26 }}
                >
                  {q}
                </Button>
              ))}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleDemoSend} style={{ display: 'flex', padding: 10, background: '#ffffff', borderTop: '1px solid #e6e7eb' }}>
              <input
                type="text"
                value={demoInput}
                onChange={(e) => setDemoInput(e.target.value)}
                placeholder="Type your message..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#0c0d10',
                  fontSize: 13,
                  padding: '6px 10px',
                }}
              />
              <Button type="primary" htmlType="submit" icon={<SendOutlined />} style={{ background: '#2b7fff', fontSize: 12, height: 32 }}>
                Send
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* 8. Pricing Plans (Relatik Exact Styling) */}
      <section id="pricing" style={{ padding: '80px 24px', background: '#ffffff', borderTop: '1px solid #e6e7eb' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', textAlign: 'center' }}>
          
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              background: '#eaf2ff',
              border: '1px solid #d3e4ff',
              borderRadius: 999,
              marginBottom: 12,
            }}
          >
            <span style={{ color: '#2b7fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Pricing
            </span>
          </div>

          <Typography.Title
            level={2}
            style={{
              color: '#0c0d10',
              fontSize: isMobile ? 26 : 38,
              fontWeight: 800,
              letterSpacing: '-0.025em',
              margin: '0 0 12px',
            }}
          >
            Simple, transparent pricing
          </Typography.Title>
          <Typography.Paragraph style={{ color: '#5b5f6b', fontSize: 15, maxWidth: 540, margin: '0 auto 36px' }}>
            Choose the plan that fits your business. All plans include a 14-day free trial.
          </Typography.Paragraph>

          {/* Relatik Monthly / Annual Toggle Switch */}
          <div style={{ marginBottom: 44 }}>
            <Segmented
              options={[
                { label: 'Monthly', value: 'monthly' },
                { label: 'Annual (Save 20%)', value: 'annual' },
              ]}
              value={billingCycle}
              onChange={setBillingCycle}
              style={{
                background: '#f1f2f5',
                padding: 3,
                borderRadius: 10,
                color: '#0c0d10',
                fontWeight: 600,
                fontSize: 13,
              }}
            />
          </div>

          <Row gutter={[20, 20]} align="stretch">
            {/* Free Plan */}
            <Col xs={24} md={8}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e6e7eb',
                  borderRadius: 20,
                  padding: 28,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontWeight: 700, color: '#0c0d10', fontSize: 16 }}>Free Forever</div>
                <div style={{ fontSize: 34, fontWeight: 800, color: '#0c0d10', margin: '12px 0 4px', letterSpacing: '-0.03em' }}>
                  $0 <span style={{ fontSize: 13, color: '#6b707c', fontWeight: 400 }}>/ month</span>
                </div>
                <div style={{ color: '#5b5f6b', fontSize: 13, marginBottom: 20 }}>
                  Essential live chat for individual websites and solo founders.
                </div>
                <Divider style={{ borderColor: '#f1f2f5', margin: '0 0 16px' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24, fontSize: 13, color: '#0c0d10' }}>
                  <div><CheckOutlined style={{ color: '#2b7fff', marginRight: 8 }} /> 1 Active Store</div>
                  <div><CheckOutlined style={{ color: '#2b7fff', marginRight: 8 }} /> 2 Support Agents</div>
                  <div><CheckOutlined style={{ color: '#2b7fff', marginRight: 8 }} /> Unlimited Live Chats</div>
                  <div><CheckOutlined style={{ color: '#2b7fff', marginRight: 8 }} /> 30-Day Chat History</div>
                  <div><CheckOutlined style={{ color: '#2b7fff', marginRight: 8 }} /> Standard Web Widget</div>
                </div>
                <Button
                  block
                  size="middle"
                  onClick={() => nav('/login?mode=signup')}
                  style={{ background: '#f7f8fa', borderColor: '#e6e7eb', color: '#0c0d10', fontWeight: 600, height: 42, borderRadius: 10, fontSize: 13.5 }}
                >
                  Start Free
                </Button>
              </div>
            </Col>

            {/* Starter Plan (Relatik Featured / Most Popular) */}
            <Col xs={24} md={8}>
              <div
                style={{
                  background: '#ffffff',
                  border: '2px solid #2b7fff',
                  borderRadius: 20,
                  padding: 28,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  textAlign: 'left',
                  position: 'relative',
                  boxShadow: '0 12px 32px -8px rgba(43, 127, 255, 0.18)',
                }}
              >
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)' }}>
                  <span
                    style={{
                      background: '#2b7fff',
                      color: '#ffffff',
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: '3px 14px',
                      borderRadius: 999,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Most Popular
                  </span>
                </div>
                <div style={{ fontWeight: 700, color: '#2b7fff', fontSize: 16 }}>Starter Growth</div>
                <div style={{ fontSize: 34, fontWeight: 800, color: '#0c0d10', margin: '12px 0 4px', letterSpacing: '-0.03em' }}>
                  {billingCycle === 'annual' ? '$15' : '$19'}{' '}
                  <span style={{ fontSize: 13, color: '#6b707c', fontWeight: 400 }}>/ month</span>
                </div>
                <div style={{ color: '#5b5f6b', fontSize: 13, marginBottom: 20 }}>
                  For growing e-commerce businesses needing sales triggers and radar.
                </div>
                <Divider style={{ borderColor: '#f1f2f5', margin: '0 0 16px' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24, fontSize: 13, color: '#0c0d10' }}>
                  <div><CheckOutlined style={{ color: '#2b7fff', marginRight: 8 }} /> <b>3 Active Stores</b></div>
                  <div><CheckOutlined style={{ color: '#2b7fff', marginRight: 8 }} /> <b>5 Support Agents</b></div>
                  <div><CheckOutlined style={{ color: '#2b7fff', marginRight: 8 }} /> Automated Sales Triggers</div>
                  <div><CheckOutlined style={{ color: '#2b7fff', marginRight: 8 }} /> Real-Time Live Visitor Radar</div>
                  <div><CheckOutlined style={{ color: '#2b7fff', marginRight: 8 }} /> Canned / Saved Shortcuts</div>
                  <div><CheckOutlined style={{ color: '#2b7fff', marginRight: 8 }} /> 1-Year Chat & Visitor History</div>
                </div>
                <Button
                  type="primary"
                  block
                  size="middle"
                  onClick={() => nav('/login?mode=signup')}
                  style={{
                    background: '#2b7fff',
                    border: 'none',
                    fontWeight: 600,
                    height: 42,
                    borderRadius: 10,
                    fontSize: 13.5,
                    boxShadow: '0 4px 14px rgba(43, 127, 255, 0.25)',
                  }}
                >
                  Start 14-Day Free Trial
                </Button>
              </div>
            </Col>

            {/* Pro / Business Plan */}
            <Col xs={24} md={8}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e6e7eb',
                  borderRadius: 20,
                  padding: 28,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontWeight: 700, color: '#0c0d10', fontSize: 16 }}>Business Pro</div>
                <div style={{ fontSize: 34, fontWeight: 800, color: '#0c0d10', margin: '12px 0 4px', letterSpacing: '-0.03em' }}>
                  {billingCycle === 'annual' ? '$39' : '$49'}{' '}
                  <span style={{ fontSize: 13, color: '#6b707c', fontWeight: 400 }}>/ month</span>
                </div>
                <div style={{ color: '#5b5f6b', fontSize: 13, marginBottom: 20 }}>
                  Maximum power, deep Shopify sync, and white-label branding removal.
                </div>
                <Divider style={{ borderColor: '#f1f2f5', margin: '0 0 16px' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24, fontSize: 13, color: '#0c0d10' }}>
                  <div><CheckOutlined style={{ color: '#2b7fff', marginRight: 8 }} /> <b>Unlimited Stores</b></div>
                  <div><CheckOutlined style={{ color: '#2b7fff', marginRight: 8 }} /> <b>15 Support Agents</b></div>
                  <div><CheckOutlined style={{ color: '#2b7fff', marginRight: 8 }} /> Deep Shopify & Order Integration</div>
                  <div><CheckOutlined style={{ color: '#2b7fff', marginRight: 8 }} /> <b>White-Label: Remove Branding</b></div>
                  <div><CheckOutlined style={{ color: '#2b7fff', marginRight: 8 }} /> Bot Detection & Quality Traffic Filter</div>
                  <div><CheckOutlined style={{ color: '#2b7fff', marginRight: 8 }} /> 24/7 Dedicated Support</div>
                </div>
                <Button
                  block
                  size="middle"
                  onClick={() => nav('/login?mode=signup')}
                  style={{ background: '#f7f8fa', borderColor: '#e6e7eb', color: '#0c0d10', fontWeight: 600, height: 42, borderRadius: 10, fontSize: 13.5 }}
                >
                  Contact for Pro Trial
                </Button>
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* 9. FAQ Section (Relatik Exact Accordion & Questions) */}
      <section id="faq" style={{ padding: '80px 24px', background: '#f7f8fa' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                background: '#eaf2ff',
                border: '1px solid #d3e4ff',
                borderRadius: 999,
                marginBottom: 12,
              }}
            >
              <span style={{ color: '#2b7fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                FAQ
              </span>
            </div>
            <Typography.Title
              level={2}
              style={{
                color: '#0c0d10',
                fontSize: isMobile ? 26 : 38,
                fontWeight: 800,
                letterSpacing: '-0.025em',
                margin: '0 0 10px',
              }}
            >
              Frequently asked questions
            </Typography.Title>
            <Typography.Paragraph style={{ color: '#5b5f6b', fontSize: 15 }}>
              Have questions? We’re here to help.
            </Typography.Paragraph>
          </div>

          <Collapse
            bordered={false}
            defaultActiveKey={['1']}
            style={{ background: 'transparent' }}
            items={[
              {
                key: '1',
                label: <span style={{ color: '#0c0d10', fontWeight: 600, fontSize: 14.5 }}>What is Chatral?</span>,
                children: (
                  <Typography.Text style={{ color: '#5b5f6b', fontSize: 13.5, lineHeight: 1.65, display: 'block' }}>
                    Chatral is a simple, modern live chat and customer messaging platform designed to help e-commerce stores and online businesses engage website visitors, track active customer journeys, and boost sales in real time.
                  </Typography.Text>
                ),
              },
              {
                key: '2',
                label: <span style={{ color: '#0c0d10', fontWeight: 600, fontSize: 14.5 }}>Who is Chatral for?</span>,
                children: (
                  <Typography.Text style={{ color: '#5b5f6b', fontSize: 13.5, lineHeight: 1.65, display: 'block' }}>
                    Chatral is built for online store owners, SaaS founders, and customer support teams who want a fast, clutter-free alternative to bloated legacy chat tools.
                  </Typography.Text>
                ),
              },
              {
                key: '3',
                label: <span style={{ color: '#0c0d10', fontWeight: 600, fontSize: 14.5 }}>Do I need technical skills to use it?</span>,
                children: (
                  <Typography.Text style={{ color: '#5b5f6b', fontSize: 13.5, lineHeight: 1.65, display: 'block' }}>
                    No technical skills are required. Setup takes under 2 minutes: simply copy the 1-line script tag from your dashboard and paste it into your Shopify theme, WordPress site, or HTML header.
                  </Typography.Text>
                ),
              },
              {
                key: '4',
                label: <span style={{ color: '#0c0d10', fontWeight: 600, fontSize: 14.5 }}>What features does Chatral offer?</span>,
                children: (
                  <Typography.Text style={{ color: '#5b5f6b', fontSize: 13.5, lineHeight: 1.65, display: 'block' }}>
                    Real-time WebSocket messaging, live visitor radar, automated sales triggers, Shopify order lookup, team roles & permissions, canned replies, sound notifications, and GDPR data isolation.
                  </Typography.Text>
                ),
              },
              {
                key: '5',
                label: <span style={{ color: '#0c0d10', fontWeight: 600, fontSize: 14.5 }}>Can I try Chatral for free?</span>,
                children: (
                  <Typography.Text style={{ color: '#5b5f6b', fontSize: 13.5, lineHeight: 1.65, display: 'block' }}>
                    Yes! Every plan comes with a 14-day free trial — no credit card required. We also offer a Free Forever plan for single stores getting started.
                  </Typography.Text>
                ),
              },
            ]}
          />
        </div>
      </section>

      {/* 10. Relatik Signature CTA Banner (Radial Gradient Card) */}
      <section style={{ padding: '60px 24px 80px', background: '#f7f8fa' }}>
        <div
          style={{
            maxWidth: 1040,
            margin: '0 auto',
            background: 'radial-gradient(70% 100% at 50% 0%, #2b7fff 0%, #0c0d10 72%)',
            borderRadius: 24,
            padding: isMobile ? '44px 20px' : '64px 40px',
            textAlign: 'center',
            boxShadow: '0px 24px 48px -16px rgba(12, 13, 16, 0.35)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Typography.Title
            level={2}
            style={{
              color: '#ffffff',
              fontSize: isMobile ? 26 : 42,
              fontWeight: 800,
              letterSpacing: '-0.025em',
              margin: '0 0 14px',
            }}
          >
            Ready to build better customer relationships?
          </Typography.Title>
          <Typography.Paragraph
            style={{
              color: 'rgba(255, 255, 255, 0.76)',
              fontSize: 15.5,
              maxWidth: 540,
              margin: '0 auto 32px',
              lineHeight: 1.6,
            }}
          >
            Start your free 14-day trial today. No credit card required — set up your workspace in minutes.
          </Typography.Paragraph>
          <Button
            type="primary"
            size="large"
            icon={<ArrowRightOutlined />}
            onClick={() => nav('/login?mode=signup')}
            style={{
              height: 48,
              padding: '0 32px',
              fontSize: 14.5,
              fontWeight: 700,
              background: '#ffffff',
              color: '#0c0d10',
              border: 'none',
              borderRadius: 10,
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
            }}
          >
            Start Free Trial
          </Button>
        </div>
      </section>

      {/* 11. Relatik Footer */}
      <footer style={{ background: '#ffffff', borderTop: '1px solid #e6e7eb', padding: '50px 24px 28px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <Row gutter={[28, 28]} justify="space-between">
            <Col xs={24} md={8}>
              <ChatralFullLogo height={28} dark={false} style={{ marginBottom: 12 }} />
              <Typography.Paragraph style={{ color: '#5b5f6b', fontSize: 13, lineHeight: 1.6, maxWidth: 280 }}>
                Customer messaging made simple. Real-time live chat for modern e-commerce and support teams.
              </Typography.Paragraph>
              <div style={{ color: '#81d43be3', fontSize: 11.5 }}>
                Developed & operated by DigiScale Infotech.
              </div>
            </Col>

            <Col xs={12} sm={8} md={5}>
              <div style={{ fontWeight: 700, color: '#0c0d10', fontSize: 13, marginBottom: 12 }}>Product</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <a onClick={() => scrollTo('features')} style={{ color: '#5b5f6b', cursor: 'pointer' }}>Features</a>
                <a onClick={() => scrollTo('how-it-works')} style={{ color: '#5b5f6b', cursor: 'pointer' }}>How It Works</a>
                <a onClick={() => scrollTo('testimonials')} style={{ color: '#5b5f6b', cursor: 'pointer' }}>Testimonials</a>
                <a onClick={() => scrollTo('pricing')} style={{ color: '#5b5f6b', cursor: 'pointer' }}>Pricing</a>
              </div>
            </Col>

            <Col xs={12} sm={8} md={5}>
              <div style={{ fontWeight: 700, color: '#0c0d10', fontSize: 13, marginBottom: 12 }}>Legal</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <Link to="/privacy" style={{ color: '#5b5f6b' }}>Privacy Policy</Link>
                <Link to="/terms" style={{ color: '#5b5f6b' }}>Terms of Service</Link>
                <span style={{ color: '#81d43be3' }}>GDPR Compliant</span>
              </div>
            </Col>

            <Col xs={24} sm={8} md={6}>
              <div style={{ fontWeight: 700, color: '#0c0d10', fontSize: 13, marginBottom: 12 }}>Contact</div>
              <div style={{ color: '#5b5f6b', fontSize: 13, lineHeight: 1.7 }}>
                <div>Email: <a href="mailto:digiscaleinfotech@gmail.com" style={{ color: '#2b7fff' }}>digiscaleinfotech@gmail.com</a></div>
                <div>Support: Mon – Fri, 9am – 7pm IST</div>
              </div>
            </Col>
          </Row>

          <Divider style={{ borderColor: '#e6e7eb', margin: '32px 0 20px' }} />

          <Flex justify={isMobile ? 'center' : 'space-between'} align="center" wrap="wrap" gap={10}>
            <div style={{ color: '#6b707c', fontSize: 12 }}>
              &copy; {new Date().getFullYear()} DigiScale Infotech. All rights reserved. Chatral&trade;
            </div>
            <Flex gap={16} style={{ fontSize: 12 }}>
              <Link to="/privacy" style={{ color: '#5b5f6b' }}>Privacy</Link>
              <Link to="/terms" style={{ color: '#5b5f6b' }}>Terms</Link>
              <Link to="/login" style={{ color: '#5b5f6b' }}>Sign In</Link>
            </Flex>
          </Flex>
        </div>
      </footer>
    </div>
  );
}
