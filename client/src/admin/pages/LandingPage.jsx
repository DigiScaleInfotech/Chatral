import { useState, useEffect } from 'react';
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
  const [openFaq, setOpenFaq] = useState(null);

  // Auto-detect India for INR currency, otherwise USD
  const detectIsIndia = () => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (tz.includes('Calcutta') || tz.includes('Kolkata')) return true;
      if (navigator.languages?.some((l) => l.endsWith('-IN') || l.includes('IN'))) return true;
    } catch (e) {
      // fallback
    }
    return false;
  };
  const [currency, setCurrency] = useState(() => (detectIsIndia() ? 'INR' : 'USD'));

  // Ensure Chatral live chat widget is loaded and visible ONLY on Landing Page
  useEffect(() => {
    const showWidget = () => {
      const hosts = document.querySelectorAll('[id^="livechat-"]');
      hosts.forEach((h) => {
        h.style.display = 'block';
        h.style.visibility = 'visible';
      });
    };

    showWidget();

    let existing = document.querySelector('script[data-store="pk_yU4JQtndJuFviYy6d94ZzZE-"]');
    if (!existing) {
      const s = document.createElement('script');
      s.src = 'https://chatral-backend.onrender.com/widget/chat.js';
      s.dataset.store = 'pk_yU4JQtndJuFviYy6d94ZzZE-';
      s.async = true;
      document.body.appendChild(s);
    }

    const timer = setInterval(showWidget, 500);
    const stopTimer = setTimeout(() => clearInterval(timer), 6000);

    return () => {
      clearInterval(timer);
      clearTimeout(stopTimer);
      // Hide widget completely when leaving the Landing Page (Login, Sign up, Dashboard, etc.)
      const hosts = document.querySelectorAll('[id^="livechat-"]');
      hosts.forEach((h) => {
        h.style.display = 'none';
        h.style.visibility = 'hidden';
      });
    };
  }, []);

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
      {/* 1. Navigation Header (Taller 76px with Official Chatral Brand Logo) */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(247, 248, 250, 0.9)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid #e6e7eb',
          width: '100%',
          padding: isMobile ? '0 16px' : '0 32px',
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            height: isMobile ? 66 : 76,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Official Chatral Logo */}
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
            <ChatralFullLogo height={isMobile ? 32 : 38} dark={false} />
          </Link>

          {/* Center Nav Links: Features, How it works, Testimonials, FAQ, Pricing */}
          {!isMobile && (
            <Flex gap={36} align="center">
              <a
                onClick={() => scrollTo('features')}
                style={{
                  color: '#5b5f6b',
                  fontSize: 14.5,
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
                  fontSize: 14.5,
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
                  fontSize: 14.5,
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
                  fontSize: 14.5,
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
                  fontSize: 14.5,
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

          {/* Right Button: Signature Black Button with Arrow */}
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
                padding: '10px 22px',
                height: 42,
                fontSize: 14,
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

      {/* Animated Liquid Wave & Marquee Background Styles */}
      <style>{`
        @keyframes liquidFlowLeft {
          0% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); }
          50% { transform: translate3d(-35px, 25px, 0) scale(1.08) rotate(3deg); }
          100% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); }
        }
        @keyframes liquidFlowRight {
          0% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); }
          50% { transform: translate3d(30px, -20px, 0) scale(1.06) rotate(-3deg); }
          100% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); }
        }
        @keyframes liquidPulse {
          0% { opacity: 0.65; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.04); }
          100% { opacity: 0.65; transform: scale(1); }
        }
        @keyframes marqueeScroll {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .testimonials-marquee:hover {
          animation-play-state: paused !important;
        }
      `}</style>

      {/* 2. Hero Section (Exact Relatik Design & Background Animation) */}
      <section
        style={{
          position: 'relative',
          padding: isMobile ? '56px 16px 40px' : '84px 24px 64px',
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Relatik Silky Animated Liquid Gradient Layers */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-15%',
            width: '70vw',
            height: '85vh',
            background: 'radial-gradient(ellipse 60% 50% at 30% 40%, rgba(186, 230, 253, 0.8) 0%, rgba(191, 219, 254, 0.5) 45%, rgba(247, 248, 250, 0) 75%)',
            filter: 'blur(55px)',
            animation: 'liquidFlowLeft 14s ease-in-out infinite',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '-15%',
            right: '-15%',
            width: '70vw',
            height: '90vh',
            background: 'radial-gradient(ellipse 60% 50% at 70% 45%, rgba(199, 210, 254, 0.75) 0%, rgba(147, 197, 253, 0.45) 45%, rgba(247, 248, 250, 0) 75%)',
            filter: 'blur(60px)',
            animation: 'liquidFlowRight 16s ease-in-out infinite',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '0%',
            left: '25%',
            width: '50vw',
            height: '50vh',
            background: 'radial-gradient(circle at 50% 30%, rgba(224, 242, 254, 0.7) 0%, rgba(247, 248, 250, 0) 65%)',
            filter: 'blur(45px)',
            animation: 'liquidPulse 10s ease-in-out infinite',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <div style={{ maxWidth: 860, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          
          {/* Relatik Top Pill Badge with 3 Overlapping Avatars */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '4px 14px 4px 6px',
              background: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(10px)',
              border: '1px solid #e6e7eb',
              borderRadius: 999,
              marginBottom: 24,
              boxShadow: '0 2px 8px rgba(12, 13, 16, 0.04)',
            }}
          >
            {/* 3 Overlapping Avatar Circles */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: '#fef08a',
                  color: '#854d0e',
                  fontSize: 9.5,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid #ffffff',
                }}
              >
                AS
              </div>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: '#fecdd3',
                  color: '#9f1239',
                  fontSize: 9.5,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid #ffffff',
                  marginLeft: -6,
                }}
              >
                SD
              </div>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: '#e9d5ff',
                  color: '#6b21a8',
                  fontSize: 9.5,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid #ffffff',
                  marginLeft: -6,
                }}
              >
                DK
              </div>
            </div>
            <span style={{ color: '#0c0d10', fontSize: 13, fontWeight: 500 }}>
              Loved by 38,456 growing teams
            </span>
          </div>

          {/* Relatik Big Title in 2 Clean Lines */}
          <Typography.Title
            level={1}
            style={{
              color: '#0c0d10',
              fontSize: isMobile ? 36 : 58,
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: '-0.035em',
              margin: '0 auto 20px',
              maxWidth: 780,
            }}
          >
            Customer management<br />made simple
          </Typography.Title>

          {/* Relatik Subtitle in 2 Clean Lines */}
          <Typography.Paragraph
            style={{
              color: '#5b5f6b',
              fontSize: isMobile ? 15 : 17,
              lineHeight: 1.6,
              maxWidth: 600,
              margin: '0 auto 34px',
              fontWeight: 400,
            }}
          >
            All your customer data, tasks, and conversations — organized in one calm, fast workspace your whole team will actually use.
          </Typography.Paragraph>

          {/* Relatik Hero CTA Buttons */}
          <Flex justify="center" gap={12} wrap="wrap" style={{ marginBottom: 26 }}>
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
                padding: '12px 24px',
                height: 46,
                fontSize: 14.5,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0px 1px 2px 0px rgba(12, 13, 16, 0.12), inset 0px 1px 0px 0px rgba(255, 255, 255, 0.12)',
                transition: 'opacity 0.15s ease',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <span>Start free trial</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => scrollTo('pricing')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#ffffff',
                color: '#0c0d10',
                border: '1px solid #e6e7eb',
                borderRadius: 12,
                padding: '12px 24px',
                height: 46,
                fontSize: 14.5,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0px 1px 2px 0px rgba(12, 13, 16, 0.04)',
                transition: 'all 0.15s ease',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#cbd5e1')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e6e7eb')}
            >
              Book a demo
            </button>
          </Flex>

          {/* Relatik Trust Checkmarks */}
          <Flex justify="center" gap={22} wrap="wrap" style={{ color: '#6b707c', fontSize: 13, fontWeight: 400 }}>
            <span>✓ No credit card required</span>
            <span>✓ 7-day free trial</span>
            <span>✓ Cancel anytime</span>
          </Flex>
        </div>

        {/* Hero Dashboard Showcase (Relatik CRM App UI Preview) */}
        <div style={{ maxWidth: 1080, margin: '48px auto 0' }}>
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e6e7eb',
              borderRadius: 20,
              overflow: 'hidden',
              boxShadow: '0 24px 60px -12px rgba(12, 13, 16, 0.1), 0 2px 6px rgba(12, 13, 16, 0.04)',
              textAlign: 'left',
              display: 'flex',
              minHeight: 520,
            }}
          >
            {/* Left Sidebar (210px) */}
            <div
              style={{
                width: 200,
                flexShrink: 0,
                background: '#ffffff',
                borderRight: '1px solid #f1f2f5',
                display: isMobile ? 'none' : 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '16px 12px 14px',
              }}
            >
              <div>
                {/* Chatral Logo in Sidebar */}
                <div style={{ display: 'flex', alignItems: 'center', padding: '4px 8px 16px' }}>
                  <ChatralFullLogo height={22} dark={false} />
                </div>

                {/* Main Navigation Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: '#f1f2f5',
                      borderRadius: 8,
                      padding: '7px 10px',
                      color: '#0c0d10',
                      fontWeight: 600,
                      fontSize: 12.5,
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 13 }}>⊞</span>
                    <span>Overview</span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderRadius: 8,
                      padding: '7px 10px',
                      color: '#5b5f6b',
                      fontSize: 12.5,
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13 }}>👥</span>
                      <span>Contacts</span>
                    </span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>1,284</span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderRadius: 8,
                      padding: '7px 10px',
                      color: '#5b5f6b',
                      fontSize: 12.5,
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13 }}>💼</span>
                      <span>Deals</span>
                    </span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>96</span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderRadius: 8,
                      padding: '7px 10px',
                      color: '#5b5f6b',
                      fontSize: 12.5,
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13 }}>☑</span>
                      <span>Tasks</span>
                    </span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>12</span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderRadius: 8,
                      padding: '7px 10px',
                      color: '#5b5f6b',
                      fontSize: 12.5,
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13 }}>💬</span>
                      <span>Inbox</span>
                    </span>
                    <span
                      style={{
                        background: '#eaf2ff',
                        color: '#2b7fff',
                        borderRadius: 999,
                        padding: '1px 7px',
                        fontSize: 10.5,
                        fontWeight: 700,
                      }}
                    >
                      4
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      borderRadius: 8,
                      padding: '7px 10px',
                      color: '#5b5f6b',
                      fontSize: 12.5,
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 13 }}>📊</span>
                    <span>Reports</span>
                  </div>
                </div>

                {/* Pipelines Section */}
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#94a3b8',
                    letterSpacing: '0.06em',
                    padding: '18px 10px 8px',
                    textTransform: 'uppercase',
                  }}
                >
                  Pipelines
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 10px',
                      fontSize: 12,
                      color: '#0c0d10',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2b7fff' }} />
                    <span>New business</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 10px',
                      fontSize: 12,
                      color: '#5b5f6b',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b5cf6' }} />
                    <span>Expansion</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 10px',
                      fontSize: 12,
                      color: '#5b5f6b',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                    <span>Partnerships</span>
                  </div>
                </div>
              </div>

              {/* Bottom Trial Box */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e6e7eb',
                  borderRadius: 12,
                  padding: '12px 14px',
                  boxShadow: '0 1px 3px rgba(12, 13, 16, 0.02)',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0c0d10' }}>Trial · 9 days left</div>
                <div style={{ fontSize: 10.5, color: '#6b707c', marginTop: 4, lineHeight: 1.35 }}>
                  Invite your team to get the most out of Chatral.
                </div>
                <div style={{ marginTop: 10, height: 4, background: '#f1f2f5', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: '65%', height: '100%', background: '#2b7fff', borderRadius: 999 }} />
                </div>
              </div>
            </div>

            {/* Right Main Content Area */}
            <div
              style={{
                flex: 1,
                background: '#fafbfd',
                padding: isMobile ? 12 : 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                position: 'relative',
                minWidth: 0,
              }}
            >
              {/* Header: Title, Search, Date, New deal, AS Avatar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 700, color: '#0c0d10' }}>Overview</span>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Search input */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e6e7eb',
                      borderRadius: 8,
                      padding: '5px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 12,
                      color: '#6b707c',
                      width: isMobile ? 180 : 230,
                    }}
                  >
                    <SearchOutlined style={{ fontSize: 12, color: '#94a3b8' }} />
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Search contacts, deals...
                    </span>
                    <span style={{ fontSize: 10, color: '#94a3b8', background: '#f1f2f5', padding: '1px 5px', borderRadius: 4 }}>
                      ⌘K
                    </span>
                  </div>

                  {/* Last 30 days pill */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e6e7eb',
                      borderRadius: 8,
                      padding: '5px 10px',
                      fontSize: 11.5,
                      fontWeight: 500,
                      color: '#0c0d10',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>📅</span>
                    <span>Last 30 days</span>
                  </div>

                  {/* + New deal button */}
                  <button
                    style={{
                      background: '#0c0d10',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '6px 12px',
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      boxShadow: '0 1px 2px rgba(12, 13, 16, 0.08)',
                    }}
                  >
                    <span>+</span>
                    <span>New deal</span>
                  </button>

                  {/* AS Avatar */}
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: '#fed7aa',
                      color: '#9a3412',
                      fontSize: 10.5,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1.5px solid #ffffff',
                      boxShadow: '0 1px 2px rgba(12, 13, 16, 0.08)',
                    }}
                  >
                    AS
                  </div>
                </div>
              </div>

              {/* 4 Metric Cards */}
              <Row gutter={[12, 12]}>
                {/* 1. Pipeline value */}
                <Col xs={12} sm={6}>
                  <div style={{ background: '#ffffff', border: '1px solid #e6e7eb', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11.5, color: '#6b707c', fontWeight: 500 }}>Pipeline value</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#0c0d10', margin: '4px 0 6px', letterSpacing: '-0.02em' }}>
                      $482,900
                    </div>
                    <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span>↑ 12.4%</span>
                      <span style={{ color: '#94a3b8', fontWeight: 400 }}>vs last month</span>
                    </div>
                  </div>
                </Col>

                {/* 2. Deals won */}
                <Col xs={12} sm={6}>
                  <div style={{ background: '#ffffff', border: '1px solid #e6e7eb', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11.5, color: '#6b707c', fontWeight: 500 }}>Deals won</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#0c0d10', margin: '4px 0 6px', letterSpacing: '-0.02em' }}>
                      38
                    </div>
                    <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span>↑ 8</span>
                      <span style={{ color: '#94a3b8', fontWeight: 400 }}>vs last month</span>
                    </div>
                  </div>
                </Col>

                {/* 3. Win rate */}
                <Col xs={12} sm={6}>
                  <div style={{ background: '#ffffff', border: '1px solid #e6e7eb', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11.5, color: '#6b707c', fontWeight: 500 }}>Win rate</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#0c0d10', margin: '4px 0 6px', letterSpacing: '-0.02em' }}>
                      32.6%
                    </div>
                    <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span>↑ 2.1 pt</span>
                      <span style={{ color: '#94a3b8', fontWeight: 400 }}>vs last month</span>
                    </div>
                  </div>
                </Col>

                {/* 4. Avg. response time */}
                <Col xs={12} sm={6}>
                  <div style={{ background: '#ffffff', border: '1px solid #e6e7eb', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11.5, color: '#6b707c', fontWeight: 500 }}>Avg. response time</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#0c0d10', margin: '4px 0 6px', letterSpacing: '-0.02em' }}>
                      1h 12m
                    </div>
                    <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span>↑ 18%</span>
                      <span style={{ color: '#94a3b8', fontWeight: 400 }}>faster</span>
                    </div>
                  </div>
                </Col>
              </Row>

              {/* Middle Row: Revenue Wave Chart & Pipeline by stage */}
              <Row gutter={[12, 12]}>
                {/* Left: Revenue chart */}
                <Col xs={24} md={15}>
                  <div style={{ background: '#ffffff', border: '1px solid #e6e7eb', borderRadius: 12, padding: '16px 18px', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 11.5, color: '#6b707c', fontWeight: 500 }}>Revenue</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                          <span style={{ fontSize: 18, fontWeight: 700, color: '#0c0d10', letterSpacing: '-0.02em' }}>$128,450</span>
                          <span style={{ fontSize: 10.5, fontWeight: 600, color: '#16a34a', background: '#dcfce7', padding: '1px 6px', borderRadius: 999 }}>
                            ↑ 18.2%
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: '#6b707c' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2b7fff' }} />
                          This year
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#cbd5e1' }} />
                          Last year
                        </span>
                      </div>
                    </div>

                    {/* SVG Chart area */}
                    <div style={{ position: 'relative', width: '100%', height: 125 }}>
                      <svg viewBox="0 0 540 120" style={{ width: '100%', height: '100%', overflow: 'visible' }} preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2b7fff" stopOpacity="0.22" />
                            <stop offset="100%" stopColor="#2b7fff" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        {/* Horizontal guide lines */}
                        <line x1="0" y1="30" x2="540" y2="30" stroke="#f1f2f5" strokeWidth="1" />
                        <line x1="0" y1="70" x2="540" y2="70" stroke="#f1f2f5" strokeWidth="1" />
                        <line x1="0" y1="110" x2="540" y2="110" stroke="#f1f2f5" strokeWidth="1" />

                        {/* Last year dashed line */}
                        <path
                          d="M 0,105 Q 45,98 90,102 T 180,95 T 270,90 T 360,78 T 450,72 T 540,65"
                          fill="none"
                          stroke="#cbd5e1"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                        />

                        {/* This year filled area */}
                        <path
                          d="M 0,95 C 45,95 70,82 110,80 C 150,78 180,88 220,72 C 260,56 290,62 330,55 C 370,48 400,52 440,32 C 475,18 510,12 540,8 L 540,120 L 0,120 Z"
                          fill="url(#chartGrad)"
                        />

                        {/* This year smooth curve line */}
                        <path
                          d="M 0,95 C 45,95 70,82 110,80 C 150,78 180,88 220,72 C 260,56 290,62 330,55 C 370,48 400,52 440,32 C 475,18 510,12 540,8"
                          fill="none"
                          stroke="#2b7fff"
                          strokeWidth="2.5"
                        />

                        {/* Point marker on November (x=460, y=24) */}
                        <circle cx="460" cy="24" r="5" fill="#2b7fff" stroke="#ffffff" strokeWidth="2.5" />
                      </svg>

                      {/* Floating Tooltip Bubble over November point */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: '10%',
                          background: '#0c0d10',
                          color: '#ffffff',
                          padding: '6px 10px',
                          borderRadius: 8,
                          fontSize: 10.5,
                          boxShadow: '0 8px 18px rgba(12, 13, 16, 0.25)',
                          pointerEvents: 'none',
                          zIndex: 2,
                        }}
                      >
                        <div style={{ color: '#94a3b8', fontSize: 9.5 }}>November</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, marginTop: 1 }}>
                          <span>$11,920</span>
                          <span style={{ color: '#4ade80', fontSize: 9.5 }}>↑ 21%</span>
                        </div>
                        {/* Tooltip triangle tail */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: -4,
                            left: '50%',
                            transform: 'translateX(-50%) rotate(45deg)',
                            width: 8,
                            height: 8,
                            background: '#0c0d10',
                          }}
                        />
                      </div>
                    </div>

                    {/* X axis months */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 10, color: '#94a3b8' }}>
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m) => (
                        <span key={m}>{m}</span>
                      ))}
                    </div>
                  </div>
                </Col>

                {/* Right: Pipeline by stage */}
                <Col xs={24} md={9}>
                  <div style={{ background: '#ffffff', border: '1px solid #e6e7eb', borderRadius: 12, padding: '16px 18px', height: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0c0d10' }}>Pipeline by stage</span>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>86 deals</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                      {[
                        { label: 'Lead', count: 124, pct: 100 },
                        { label: 'Qualified', count: 68, pct: 68 },
                        { label: 'Proposal', count: 41, pct: 45 },
                        { label: 'Negotiation', count: 19, pct: 26 },
                        { label: 'Won', count: 12, pct: 18 },
                      ].map((stage, idx) => (
                        <div key={idx}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
                            <span style={{ color: '#0c0d10', fontWeight: 500 }}>{stage.label}</span>
                            <span style={{ color: '#6b707c', fontWeight: 600 }}>{stage.count}</span>
                          </div>
                          <div style={{ height: 6, background: '#f1f2f5', borderRadius: 999, overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${stage.pct}%`,
                                height: '100%',
                                background: '#2b7fff',
                                borderRadius: 999,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Col>
              </Row>

              {/* Bottom Card: Recent Deals Table */}
              <div style={{ background: '#ffffff', border: '1px solid #e6e7eb', borderRadius: 12, padding: '16px 18px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0c0d10' }}>Recent deals</span>
                  <span style={{ fontSize: 11.5, color: '#2b7fff', fontWeight: 600, cursor: 'pointer' }}>View all</span>
                </div>

                {/* Table columns header */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr 1.5fr 1.2fr 1fr 1fr',
                    padding: '6px 8px',
                    fontSize: 10.5,
                    color: '#94a3b8',
                    fontWeight: 600,
                    borderBottom: '1px solid #f1f2f5',
                  }}
                >
                  <span>Company</span>
                  {!isMobile && <span>Owner</span>}
                  <span>Stage</span>
                  {!isMobile && <span>Close date</span>}
                  <span style={{ textAlign: 'right' }}>Value</span>
                </div>

                {/* Table rows */}
                {[
                  {
                    company: 'Brightloop',
                    icon: 'B',
                    iconBg: '#2b7fff',
                    owner: 'Julia T.',
                    ownerAvatar: 'JT',
                    ownerBg: '#ede9fe',
                    ownerColor: '#6d28d9',
                    stage: 'Negotiation',
                    stageBg: '#f3e8ff',
                    stageColor: '#7e22ce',
                    date: 'Oct 24',
                    val: '$24,000',
                  },
                  {
                    company: 'Fieldwork',
                    icon: 'F',
                    iconBg: '#10b981',
                    owner: 'Mark R.',
                    ownerAvatar: 'MR',
                    ownerBg: '#dcfce7',
                    ownerColor: '#15803d',
                    stage: 'Won',
                    stageBg: '#dcfce7',
                    stageColor: '#15803d',
                    date: 'Oct 19',
                    val: '$12,400',
                  },
                  {
                    company: 'Kestrel Labs',
                    icon: 'K',
                    iconBg: '#8b5cf6',
                    owner: 'Sophie D.',
                    ownerAvatar: 'SD',
                    ownerBg: '#ffedd5',
                    ownerColor: '#c2410c',
                    stage: 'Proposal',
                    stageBg: '#ffedd5',
                    stageColor: '#c2410c',
                    date: 'Oct 15',
                    val: '$18,500',
                  },
                ].map((deal, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr 1.5fr 1.2fr 1fr 1fr',
                      padding: '10px 8px',
                      alignItems: 'center',
                      fontSize: 12,
                      borderBottom: idx === 2 ? 'none' : '1px solid #f8fafc',
                    }}
                  >
                    {/* Company */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          background: deal.iconBg,
                          color: '#ffffff',
                          fontSize: 11,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {deal.icon}
                      </div>
                      <span style={{ fontWeight: 600, color: '#0c0d10' }}>{deal.company}</span>
                    </div>

                    {/* Owner */}
                    {!isMobile && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            background: deal.ownerBg,
                            color: deal.ownerColor,
                            fontSize: 9,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {deal.ownerAvatar}
                        </div>
                        <span style={{ color: '#5b5f6b' }}>{deal.owner}</span>
                      </div>
                    )}

                    {/* Stage */}
                    <div>
                      <span
                        style={{
                          display: 'inline-block',
                          background: deal.stageBg,
                          color: deal.stageColor,
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 500,
                        }}
                      >
                        {deal.stage}
                      </span>
                    </div>

                    {/* Close date */}
                    {!isMobile && <span style={{ color: '#6b707c' }}>{deal.date}</span>}

                    {/* Value */}
                    <span style={{ fontWeight: 700, color: '#0c0d10', textAlign: 'right' }}>{deal.val}</span>
                  </div>
                ))}

                {/* Floating Toast Notification at bottom-right of Mockup */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 14,
                    right: 16,
                    background: '#ffffff',
                    border: '1px solid #e6e7eb',
                    borderRadius: 12,
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    boxShadow: '0 12px 24px -4px rgba(12, 13, 16, 0.12), 0 2px 6px rgba(12, 13, 16, 0.04)',
                    zIndex: 5,
                  }}
                >
                  <span style={{ fontSize: 16 }}>📅</span>
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0c0d10' }}>
                      Meeting booked - Kestrel
                    </div>
                    <div style={{ fontSize: 10, color: '#6b707c', marginTop: 1 }}>
                      Tomorrow, 10:00 • 3m ago
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Features Bento Grid (Exact Relatik 5-Card Bento Layout) */}
      <section id="features" style={{ padding: isMobile ? '60px 16px' : '96px 24px', background: '#f7f8fa' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 36 : 48 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                background: '#eaf2ff',
                border: '1px solid rgba(43, 127, 255, 0.2)',
                borderRadius: 999,
                marginBottom: 16,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2b7fff' }} />
              <span style={{ color: '#2b7fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Features
              </span>
            </div>
            <Typography.Title
              level={2}
              style={{
                color: '#0c0d10',
                fontSize: isMobile ? 28 : 42,
                fontWeight: 800,
                letterSpacing: '-0.035em',
                lineHeight: 1.15,
                margin: '0 0 14px',
              }}
            >
              Everything you need to close more deals
            </Typography.Title>
            <Typography.Paragraph
              style={{
                color: '#5b5f6b',
                fontSize: isMobile ? 14.5 : 16,
                maxWidth: 620,
                margin: '0 auto',
                lineHeight: 1.55,
                fontWeight: 400,
              }}
            >
              Every tool you need to track, manage, and grow customer relationships —<br className={isMobile ? 'none' : ''} />
              from first contact to automation — without the clutter.
            </Typography.Paragraph>
          </div>

          {/* Relatik 6-Card Bento Grid (3x2 Balanced Grid) */}
          <Row gutter={[20, 20]}>
            
            {/* Card 1: Live visitor tracking */}
            <Col xs={24} md={8}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e8e9ee',
                  borderRadius: 24,
                  padding: '30px 28px',
                  height: '100%',
                  minHeight: 180,
                  boxShadow: '0px 2px 4px 0px rgba(12, 13, 16, 0.02)',
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: '#eaf2ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 14,
                  }}
                >
                  <GlobalOutlined style={{ fontSize: 18, color: '#2b7fff' }} />
                </div>
                <Typography.Title
                  level={3}
                  style={{
                    color: '#0c0d10',
                    fontSize: 19,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    margin: '0 0 8px',
                  }}
                >
                  Live visitor tracking
                </Typography.Title>
                <Typography.Paragraph
                  style={{
                    color: '#5b5f6b',
                    fontSize: 13.5,
                    lineHeight: 1.55,
                    margin: 0,
                  }}
                >
                  Track visitors on your site in real-time, see their active browsing journey, and initiate sales chats before they leave.
                </Typography.Paragraph>
              </div>
            </Col>

            {/* Card 2: Unified operator inbox */}
            <Col xs={24} md={8}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e8e9ee',
                  borderRadius: 24,
                  padding: '30px 28px',
                  height: '100%',
                  minHeight: 180,
                  boxShadow: '0px 2px 4px 0px rgba(12, 13, 16, 0.02)',
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: '#ecfdf5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 14,
                  }}
                >
                  <MessageOutlined style={{ fontSize: 18, color: '#10b981' }} />
                </div>
                <Typography.Title
                  level={3}
                  style={{
                    color: '#0c0d10',
                    fontSize: 19,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    margin: '0 0 8px',
                  }}
                >
                  Unified operator inbox
                </Typography.Title>
                <Typography.Paragraph
                  style={{
                    color: '#5b5f6b',
                    fontSize: 13.5,
                    lineHeight: 1.55,
                    margin: 0,
                  }}
                >
                  Manage all customer conversations in one calm, lightning-fast workspace with live typing preview and instant status tracking.
                </Typography.Paragraph>
              </div>
            </Col>

            {/* Card 3: Multi-store management */}
            <Col xs={24} md={8}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e8e9ee',
                  borderRadius: 24,
                  padding: '30px 28px',
                  height: '100%',
                  minHeight: 180,
                  boxShadow: '0px 2px 4px 0px rgba(12, 13, 16, 0.02)',
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: '#ecfeff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 14,
                  }}
                >
                  <ShopOutlined style={{ fontSize: 18, color: '#0891b2' }} />
                </div>
                <Typography.Title
                  level={3}
                  style={{
                    color: '#0c0d10',
                    fontSize: 19,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    margin: '0 0 8px',
                  }}
                >
                  Multi-store management
                </Typography.Title>
                <Typography.Paragraph
                  style={{
                    color: '#5b5f6b',
                    fontSize: 13.5,
                    lineHeight: 1.55,
                    margin: 0,
                  }}
                >
                  Connect and manage multiple websites, Shopify stores, and customer domains effortlessly from one unified master dashboard.
                </Typography.Paragraph>
              </div>
            </Col>

            {/* Bento Card 3: Analytics & insights (Bottom Left) */}
            <Col xs={24} md={8}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e8e9ee',
                  borderRadius: 24,
                  padding: '30px 28px',
                  height: '100%',
                  minHeight: 180,
                  boxShadow: '0px 2px 4px 0px rgba(12, 13, 16, 0.02)',
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: '#f3e8ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 14,
                  }}
                >
                  <BarChartOutlined style={{ fontSize: 18, color: '#8b5cf6' }} />
                </div>
                <Typography.Title
                  level={3}
                  style={{
                    color: '#0c0d10',
                    fontSize: 19,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    margin: '0 0 8px',
                  }}
                >
                  Analytics & insights
                </Typography.Title>
                <Typography.Paragraph
                  style={{
                    color: '#5b5f6b',
                    fontSize: 13.5,
                    lineHeight: 1.55,
                    margin: 0,
                  }}
                >
                  Real-time reports on first-response SLA, peak-hour chat volumes, and conversion metrics that show what drives revenue.
                </Typography.Paragraph>
              </div>
            </Col>

            {/* Bento Card 4: Automated workflows (Bottom Center) */}
            <Col xs={24} md={8}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e8e9ee',
                  borderRadius: 24,
                  padding: '30px 28px',
                  height: '100%',
                  minHeight: 180,
                  boxShadow: '0px 2px 4px 0px rgba(12, 13, 16, 0.02)',
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: '#fef3c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 14,
                  }}
                >
                  <ThunderboltOutlined style={{ fontSize: 18, color: '#f59e0b' }} />
                </div>
                <Typography.Title
                  level={3}
                  style={{
                    color: '#0c0d10',
                    fontSize: 19,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    margin: '0 0 8px',
                  }}
                >
                  Automated workflows
                </Typography.Title>
                <Typography.Paragraph
                  style={{
                    color: '#5b5f6b',
                    fontSize: 13.5,
                    lineHeight: 1.55,
                    margin: 0,
                  }}
                >
                  Put sales greetings on autopilot with smart exit-intent and cart-abandonment triggers, so your team focuses on closing deals.
                </Typography.Paragraph>
              </div>
            </Col>

            {/* Bento Card 5: Team collaboration (Bottom Right) */}
            <Col xs={24} md={8}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e8e9ee',
                  borderRadius: 24,
                  padding: '30px 28px',
                  height: '100%',
                  minHeight: 180,
                  boxShadow: '0px 2px 4px 0px rgba(12, 13, 16, 0.02)',
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: '#fce7f3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 14,
                  }}
                >
                  <TeamOutlined style={{ fontSize: 18, color: '#ec4899' }} />
                </div>
                <Typography.Title
                  level={3}
                  style={{
                    color: '#0c0d10',
                    fontSize: 19,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    margin: '0 0 8px',
                  }}
                >
                  Team collaboration
                </Typography.Title>
                <Typography.Paragraph
                  style={{
                    color: '#5b5f6b',
                    fontSize: 13.5,
                    lineHeight: 1.55,
                    margin: 0,
                  }}
                >
                  Assign chats, leave internal whisper notes, use canned /shortcuts, and stay perfectly aligned with your support team.
                </Typography.Paragraph>
              </div>
            </Col>

          </Row>
        </div>
      </section>

      {/* 4. How It Works (Exact Relatik Design from Image 1) */}
      <section id="how-it-works" style={{ padding: isMobile ? '60px 16px' : '96px 24px', background: '#ffffff', borderTop: '1px solid #e6e7eb' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', textAlign: 'center' }}>
          
          {/* Header */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              background: '#eaf2ff',
              border: '1px solid rgba(43, 127, 255, 0.2)',
              borderRadius: 999,
              marginBottom: 16,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2b7fff' }} />
            <span style={{ color: '#2b7fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              How it works
            </span>
          </div>

          <Typography.Title
            level={2}
            style={{
              color: '#0c0d10',
              fontSize: isMobile ? 28 : 42,
              fontWeight: 800,
              letterSpacing: '-0.035em',
              lineHeight: 1.15,
              margin: '0 0 14px',
            }}
          >
            From sign-up to success in minutes
          </Typography.Title>
          <Typography.Paragraph
            style={{
              color: '#5b5f6b',
              fontSize: isMobile ? 14.5 : 16,
              maxWidth: 580,
              margin: '0 auto 48px',
              lineHeight: 1.55,
              fontWeight: 400,
            }}
          >
            Three simple steps to a workspace your whole team will love using.
          </Typography.Paragraph>

          <Row gutter={[20, 20]}>
            {[
              {
                step: '01',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2b7fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="19" y1="8" x2="19" y2="14" />
                    <line x1="22" y1="11" x2="16" y2="11" />
                  </svg>
                ),
                title: 'Create your account',
                desc: 'Sign up with your email and set up your workspace in minutes. Pick a pipeline layout and invite your team.',
              },
              {
                step: '02',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2b7fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                ),
                title: 'Import & organize leads',
                desc: 'Bring in contacts from spreadsheets or your favorite tools. Sort them into stages, assign owners, and set priorities.',
              },
              {
                step: '03',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2b7fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                ),
                title: 'Automate & grow',
                desc: 'Add workflows, reminders, and follow-ups. Track progress in real time and close more deals with less effort.',
              },
            ].map((s, i) => (
              <Col xs={24} md={8} key={i}>
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e8e9ee',
                    borderRadius: 24,
                    padding: '32px 28px',
                    textAlign: 'left',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0px 2px 4px 0px rgba(12, 13, 16, 0.02)',
                  }}
                >
                  {/* Top Row: Icon on left, Step number on right */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        background: '#f0f5ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {s.icon}
                    </div>
                    <span style={{ color: '#9aa0ac', fontSize: 13, fontWeight: 500, letterSpacing: '0.02em' }}>
                      {s.step}
                    </span>
                  </div>

                  {/* Title & Description below */}
                  <div style={{ marginTop: 28 }}>
                    <Typography.Title
                      level={3}
                      style={{
                        color: '#0c0d10',
                        fontSize: 19,
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                        margin: '0 0 8px',
                      }}
                    >
                      {s.title}
                    </Typography.Title>
                    <Typography.Paragraph
                      style={{
                        color: '#5b5f6b',
                        fontSize: 13.5,
                        lineHeight: 1.55,
                        margin: 0,
                      }}
                    >
                      {s.desc}
                    </Typography.Paragraph>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* 5. Testimonials (Exact Relatik Infinite Marquee Carousel from Image 2) */}
      <section id="testimonials" style={{ padding: isMobile ? '60px 0' : '96px 0', background: '#ffffff', borderTop: '1px solid #e6e7eb', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', textAlign: 'center', padding: '0 24px', marginBottom: 44 }}>
          
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              background: '#eaf2ff',
              border: '1px solid rgba(43, 127, 255, 0.2)',
              borderRadius: 999,
              marginBottom: 16,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2b7fff' }} />
            <span style={{ color: '#2b7fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Testimonials
            </span>
          </div>

          <Typography.Title
            level={2}
            style={{
              color: '#0c0d10',
              fontSize: isMobile ? 28 : 42,
              fontWeight: 800,
              letterSpacing: '-0.035em',
              lineHeight: 1.15,
              margin: '0 0 14px',
            }}
          >
            Loved by teams who sell
          </Typography.Title>
          <Typography.Paragraph
            style={{
              color: '#5b5f6b',
              fontSize: isMobile ? 14.5 : 16,
              maxWidth: 580,
              margin: '0 auto',
              lineHeight: 1.55,
              fontWeight: 400,
            }}
          >
            Founders, sales leaders, and support teams use Chatral to stay close to their customers.
          </Typography.Paragraph>
        </div>

        {/* Marquee Carousel Track with Edge Fade Masks */}
        <div
          style={{
            width: '100%',
            overflow: 'hidden',
            position: 'relative',
            padding: '12px 0 24px',
            maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
          }}
        >
          <div
            className="testimonials-marquee"
            style={{
              display: 'flex',
              gap: 20,
              width: 'max-content',
              animation: 'marqueeScroll 45s linear infinite',
              cursor: 'grab',
            }}
          >
            {[
              {
                title: 'Streamlined our workflow instantly',
                quote: 'We switched two months ago and the difference is night and day. Managing leads and follow-ups has never been this effortless.',
                author: 'Julia T.',
                role: 'Sales Director',
                initials: 'JT',
                avatarBg: '#ede9fe',
                avatarColor: '#7c3aed',
              },
              {
                title: 'Exactly what our team needed',
                quote: 'The interface is clean, intuitive, and fast. Our sales team actually enjoys using it — which says a lot.',
                author: 'Mark R.',
                role: 'Head of Growth',
                initials: 'MR',
                avatarBg: '#dcfce7',
                avatarColor: '#15803d',
              },
              {
                title: 'Increased our productivity by 30%',
                quote: 'With automated reminders and real-time updates, we no longer let promising deals slip through the cracks.',
                author: 'Anika S.',
                role: 'CRM Operations Manager',
                initials: 'AS',
                avatarBg: '#ffedd5',
                avatarColor: '#c2410c',
              },
              {
                title: 'Fast, reliable, and beautiful',
                quote: 'It’s rare to find software that looks this good and performs this well. Chatral checks every box for customer support.',
                author: 'Sophie D.',
                role: 'Marketing Manager',
                initials: 'SD',
                avatarBg: '#e0f2fe',
                avatarColor: '#0284c7',
              },
              {
                title: 'Support team is next level',
                quote: 'Beyond the product itself, the onboarding and ongoing support from DigiScale Infotech have been outstanding from day one.',
                author: 'Daniel K.',
                role: 'Customer Success Lead',
                initials: 'DK',
                avatarBg: '#fce7f3',
                avatarColor: '#db2777',
              },
              {
                title: 'Clean, modern, and so easy to set up',
                quote: 'I’ve tried a dozen live chat tools, and this is the first one my team adopted without a fight. Everything just makes sense.',
                author: 'Alex B.',
                role: 'Startup Founder',
                initials: 'AB',
                avatarBg: '#e0f2fe',
                avatarColor: '#2563eb',
              },
              // Duplicate once to enable seamless infinite scroll loop
              {
                title: 'Streamlined our workflow instantly',
                quote: 'We switched two months ago and the difference is night and day. Managing leads and follow-ups has never been this effortless.',
                author: 'Julia T.',
                role: 'Sales Director',
                initials: 'JT',
                avatarBg: '#ede9fe',
                avatarColor: '#7c3aed',
              },
              {
                title: 'Exactly what our team needed',
                quote: 'The interface is clean, intuitive, and fast. Our sales team actually enjoys using it — which says a lot.',
                author: 'Mark R.',
                role: 'Head of Growth',
                initials: 'MR',
                avatarBg: '#dcfce7',
                avatarColor: '#15803d',
              },
              {
                title: 'Increased our productivity by 30%',
                quote: 'With automated reminders and real-time updates, we no longer let promising deals slip through the cracks.',
                author: 'Anika S.',
                role: 'CRM Operations Manager',
                initials: 'AS',
                avatarBg: '#ffedd5',
                avatarColor: '#c2410c',
              },
              {
                title: 'Fast, reliable, and beautiful',
                quote: 'It’s rare to find software that looks this good and performs this well. Chatral checks every box for customer support.',
                author: 'Sophie D.',
                role: 'Marketing Manager',
                initials: 'SD',
                avatarBg: '#e0f2fe',
                avatarColor: '#0284c7',
              },
              {
                title: 'Support team is next level',
                quote: 'Beyond the product itself, the onboarding and ongoing support from DigiScale Infotech have been outstanding from day one.',
                author: 'Daniel K.',
                role: 'Customer Success Lead',
                initials: 'DK',
                avatarBg: '#fce7f3',
                avatarColor: '#db2777',
              },
              {
                title: 'Clean, modern, and so easy to set up',
                quote: 'I’ve tried a dozen live chat tools, and this is the first one my team adopted without a fight. Everything just makes sense.',
                author: 'Alex B.',
                role: 'Startup Founder',
                initials: 'AB',
                avatarBg: '#e0f2fe',
                avatarColor: '#2563eb',
              },
            ].map((t, idx) => (
              <div
                key={idx}
                style={{
                  width: isMobile ? 300 : 350,
                  flexShrink: 0,
                  background: '#ffffff',
                  border: '1px solid #e8e9ee',
                  borderRadius: 24,
                  padding: '30px 26px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                  boxShadow: '0px 2px 4px 0px rgba(12, 13, 16, 0.02)',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#c7d2fe';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(43, 127, 255, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e8e9ee';
                  e.currentTarget.style.boxShadow = '0px 2px 4px 0px rgba(12, 13, 16, 0.02)';
                }}
              >
                <div>
                  {/* Top: 5 Blue Stars + Light Blue Quotation Mark */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ display: 'flex', gap: 3, color: '#2b7fff', fontSize: 13 }}>
                      {[...Array(5)].map((_, s) => (
                        <StarFilled key={s} />
                      ))}
                    </div>
                    {/* Quotation mark svg */}
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#dbeafe">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                  </div>

                  {/* Title */}
                  <Typography.Title
                    level={4}
                    style={{
                      color: '#0c0d10',
                      fontSize: 16.5,
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                      margin: '0 0 8px',
                      lineHeight: 1.35,
                    }}
                  >
                    {t.title}
                  </Typography.Title>

                  {/* Quote */}
                  <Typography.Paragraph
                    style={{
                      color: '#5b5f6b',
                      fontSize: 13.5,
                      lineHeight: 1.55,
                      margin: 0,
                    }}
                  >
                    {t.quote}
                  </Typography.Paragraph>
                </div>

                {/* Author Footer */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: t.avatarBg,
                      color: t.avatarColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 11,
                      flexShrink: 0,
                    }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0c0d10', lineHeight: 1.2 }}>
                      {t.author}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#9aa0ac', marginTop: 2 }}>
                      {t.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FAQ Section (Relatik Exact 2-Column Accordion from Image) */}
      <section id="faq" style={{ padding: isMobile ? '60px 16px' : '96px 24px', background: '#f7f8fa', borderTop: '1px solid #e6e7eb' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <Row gutter={isMobile ? [0, 40] : [64, 32]} align="top">
            {/* Left Column: Badge, Heading, Subtitle & Button */}
            <Col xs={24} md={10} style={{ textAlign: isMobile ? 'center' : 'left' }}>
              {/* Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  background: '#eaf2ff',
                  border: '1px solid rgba(43, 127, 255, 0.2)',
                  borderRadius: 999,
                  marginBottom: 16,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2b7fff' }} />
                <span style={{ color: '#2b7fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  FAQ
                </span>
              </div>

              {/* Title */}
              <Typography.Title
                level={2}
                style={{
                  color: '#0c0d10',
                  fontSize: isMobile ? 32 : 46,
                  fontWeight: 800,
                  letterSpacing: '-0.035em',
                  lineHeight: 1.12,
                  margin: '0 0 16px',
                }}
              >
                Questions<br />& answers
              </Typography.Title>

              {/* Description */}
              <Typography.Paragraph
                style={{
                  color: '#5b5f6b',
                  fontSize: isMobile ? 14.5 : 15.5,
                  lineHeight: 1.6,
                  maxWidth: isMobile ? '100%' : 340,
                  margin: isMobile ? '0 auto 24px' : '0 0 28px',
                  fontWeight: 400,
                }}
              >
                Everything you need to know about Chatral. Can’t find what you’re looking for? Our team is happy to help.
              </Typography.Paragraph>

              {/* Contact us Button */}
              <button
                onClick={() => scrollTo('pricing')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#ffffff',
                  color: '#0c0d10',
                  border: '1px solid #e6e7eb',
                  borderRadius: 12,
                  padding: '11px 24px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(12, 13, 16, 0.04)',
                  transition: 'all 0.15s ease',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.background = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e6e7eb';
                  e.currentTarget.style.background = '#ffffff';
                }}
              >
                Contact us
              </button>
            </Col>

            {/* Right Column: 5 Accordion Cards */}
            <Col xs={24} md={14}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  {
                    q: 'What is Chatral?',
                    a: 'Chatral is a calm, fast live chat and customer messaging platform designed to help e-commerce stores and modern teams engage visitors, track active shoppers, and close more deals in real time.',
                  },
                  {
                    q: 'Who is Chatral for?',
                    a: 'Chatral is built for online store owners, SaaS founders, sales leaders, and customer support teams who want a simple, clutter-free workspace that their entire team will actually enjoy using.',
                  },
                  {
                    q: 'Do I need technical skills to use it?',
                    a: 'No technical skills required at all. Setup takes less than 2 minutes: simply paste the 1-line lightweight script tag into your Shopify theme, WordPress site, or HTML header.',
                  },
                  {
                    q: 'What features does Chatral offer?',
                    a: 'Chatral provides real-time visitor tracking, unified operator inboxes, multi-store management, automated sales trigger greetings, canned replies, sound notifications, and fast analytics.',
                  },
                  {
                    q: 'Can I try Chatral for free?',
                    a: 'Yes! Every plan starts with a full-access 7-day free trial — no credit card required. Cancel anytime with a single click.',
                  },
                ].map((item, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      style={{
                        background: '#ffffff',
                        border: '1px solid',
                        borderColor: isOpen ? '#c7d2fe' : '#e8e9ee',
                        borderRadius: 16,
                        padding: '20px 24px',
                        cursor: 'pointer',
                        boxShadow: isOpen
                          ? '0 6px 20px rgba(43, 127, 255, 0.06)'
                          : '0 1px 3px rgba(12, 13, 16, 0.02)',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isOpen) e.currentTarget.style.borderColor = '#cbd5e1';
                      }}
                      onMouseLeave={(e) => {
                        if (!isOpen) e.currentTarget.style.borderColor = '#e8e9ee';
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 16,
                        }}
                      >
                        <span
                          style={{
                            color: '#0c0d10',
                            fontWeight: 600,
                            fontSize: 15.5,
                            letterSpacing: '-0.01em',
                          }}
                        >
                          {item.q}
                        </span>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: isOpen ? '#eaf2ff' : '#f1f2f5',
                            color: isOpen ? '#2b7fff' : '#5b5f6b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 16,
                            fontWeight: 500,
                            flexShrink: 0,
                            transform: isOpen ? 'rotate(45deg)' : 'none',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          +
                        </div>
                      </div>

                      {isOpen && (
                        <div
                          style={{
                            marginTop: 14,
                            paddingTop: 14,
                            borderTop: '1px solid #f1f2f5',
                            color: '#5b5f6b',
                            fontSize: 14,
                            lineHeight: 1.65,
                            fontWeight: 400,
                          }}
                        >
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* 8. Pricing Plans (Relatik Exact Styling - 7-Day Free Trial + Starter Growth) */}
      <section id="pricing" style={{ padding: '80px 24px', background: '#ffffff', borderTop: '1px solid #e6e7eb' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
          
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
            Get started with a full-access 7-day free trial. Upgrade anytime to keep conversations flowing.
          </Typography.Paragraph>

          {/* Billing Cycle + Currency Switcher */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 44 }}>
            <Segmented
              options={[
                { label: 'Monthly', value: 'monthly' },
                { label: 'Annual (Save 25%)', value: 'annual' },
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

            <Segmented
              options={[
                { label: '$ USD', value: 'USD' },
                { label: '₹ INR', value: 'INR' },
              ]}
              value={currency}
              onChange={setCurrency}
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

          <Row gutter={[24, 24]} justify="center" align="stretch">
            {/* 1. 7-Day Free Trial Plan */}
            <Col xs={24} md={12} lg={10}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e6e7eb',
                  borderRadius: 20,
                  padding: '32px 28px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  textAlign: 'left',
                  boxShadow: '0 1px 3px rgba(12, 13, 16, 0.02)',
                  transition: 'border-color 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#cbd5e1')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e6e7eb')}
              >
                <div style={{ fontWeight: 700, color: '#0c0d10', fontSize: 16 }}>7-Day Free Trial</div>
                <div style={{ fontSize: 34, fontWeight: 800, color: '#0c0d10', margin: '12px 0 4px', letterSpacing: '-0.03em' }}>
                  {currency === 'INR' ? '₹0' : '$0'}{' '}
                  <span style={{ fontSize: 13, color: '#6b707c', fontWeight: 400 }}>/ 7 days free</span>
                </div>
                <div style={{ color: '#5b5f6b', fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
                  Full access to all features free for 7 days. Test on your website with zero risk.
                </div>
                <Divider style={{ borderColor: '#f1f2f5', margin: '0 0 18px' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 26, fontSize: 13, color: '#0c0d10' }}>
                  <div><CheckOutlined style={{ color: '#2b7fff', marginRight: 8 }} /> <b>Full Access for 7 Days</b></div>
                  <div><CheckOutlined style={{ color: '#2b7fff', marginRight: 8 }} /> 1 Active Store</div>
                  <div><CheckOutlined style={{ color: '#2b7fff', marginRight: 8 }} /> Unlimited Live Chats</div>
                  <div><CheckOutlined style={{ color: '#2b7fff', marginRight: 8 }} /> Automated Sales Triggers</div>
                  <div><CheckOutlined style={{ color: '#2b7fff', marginRight: 8 }} /> Canned Replies & Shortcuts</div>
                  <div><CheckOutlined style={{ color: '#2b7fff', marginRight: 8 }} /> Sound & Desktop Alerts</div>
                  <div><CheckOutlined style={{ color: '#2b7fff', marginRight: 8 }} /> Standard Web Chat Widget</div>
                  <div><CheckOutlined style={{ color: '#2b7fff', marginRight: 8 }} /> "Powered by Chatral" Badge</div>
                </div>
                <Button
                  block
                  size="middle"
                  onClick={() => nav('/login?mode=signup')}
                  style={{ background: '#f7f8fa', borderColor: '#e6e7eb', color: '#0c0d10', fontWeight: 600, height: 44, borderRadius: 10, fontSize: 13.5 }}
                >
                  Start 7-Day Free Trial
                </Button>
                <div style={{ textAlign: 'center', fontSize: 11.5, color: '#9aa0ac', marginTop: 10 }}>
                  No credit card required
                </div>
              </div>
            </Col>

            {/* 2. Starter Growth Plan (Starts at $5 / mo) */}
            <Col xs={24} md={12} lg={10}>
              <div
                style={{
                  background: '#ffffff',
                  border: '2px solid #2b7fff',
                  borderRadius: 20,
                  padding: '32px 28px',
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
                  {currency === 'INR'
                    ? (billingCycle === 'annual' ? '₹399' : '₹499')
                    : (billingCycle === 'annual' ? '$5' : '$7')}{' '}
                  <span style={{ fontSize: 13, color: '#6b707c', fontWeight: 400 }}>/ month</span>
                </div>
                <div style={{ color: '#5b5f6b', fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
                  Everything you need to turn visitors into buyers with multi-store and no branding.
                </div>
                <Divider style={{ borderColor: '#f1f2f5', margin: '0 0 18px' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 26, fontSize: 13, color: '#0c0d10' }}>
                  <div><CheckOutlined style={{ color: '#2b7fff', marginRight: 8 }} /> <b>3 Active Stores</b></div>
                  <div><CheckOutlined style={{ color: '#2b7fff', marginRight: 8 }} /> Unlimited Live Chats</div>
                  <div><CheckOutlined style={{ color: '#2b7fff', marginRight: 8 }} /> Automated Sales Triggers</div>
                  <div><CheckOutlined style={{ color: '#2b7fff', marginRight: 8 }} /> Canned Replies & Shortcuts</div>
                  <div><CheckOutlined style={{ color: '#2b7fff', marginRight: 8 }} /> Sound & Desktop Alerts</div>
                  <div><CheckOutlined style={{ color: '#2b7fff', marginRight: 8 }} /> Shopify & E-commerce Integration</div>
                  <div><CheckOutlined style={{ color: '#2b7fff', marginRight: 8 }} /> <b>Remove "Powered by Chatral" Badge</b></div>
                  <div><CheckOutlined style={{ color: '#2b7fff', marginRight: 8 }} /> Priority 24/7 Support</div>
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
                    height: 44,
                    borderRadius: 10,
                    fontSize: 13.5,
                    boxShadow: '0 4px 14px rgba(43, 127, 255, 0.25)',
                  }}
                >
                  Start 7-Day Free Trial
                </Button>
                <div style={{ textAlign: 'center', fontSize: 11.5, color: '#9aa0ac', marginTop: 10 }}>
                  Includes 7-day free trial • Cancel anytime
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* 9. Relatik Signature CTA Banner (Exact Match to Image 2) */}
      <section style={{ padding: isMobile ? '40px 16px 70px' : '60px 24px 96px', background: '#f7f8fa' }}>
        <div
          style={{
            maxWidth: 1040,
            margin: '0 auto',
            background: 'radial-gradient(75% 100% at 50% -10%, #1e5eff 0%, #0d2870 38%, #07090e 75%, #050608 100%)',
            borderRadius: 32,
            padding: isMobile ? '56px 20px' : '92px 48px',
            textAlign: 'center',
            boxShadow: '0 30px 80px -20px rgba(12, 13, 16, 0.45), 0 12px 36px -10px rgba(30, 94, 255, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle top shimmer accent */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '60%',
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent)',
            }}
          />

          <Typography.Title
            level={2}
            style={{
              color: '#ffffff',
              fontSize: isMobile ? 28 : 46,
              fontWeight: 800,
              letterSpacing: '-0.035em',
              lineHeight: 1.15,
              margin: '0 0 16px',
            }}
          >
            Ready to build better customer relationships?
          </Typography.Title>
          <Typography.Paragraph
            style={{
              color: 'rgba(255, 255, 255, 0.68)',
              fontSize: isMobile ? 14.5 : 15.5,
              maxWidth: 520,
              margin: '0 auto 36px',
              lineHeight: 1.6,
              fontWeight: 400,
            }}
          >
            Start your free 7-day trial today. No credit card required — set up your workspace in minutes.
          </Typography.Paragraph>

          <button
            onClick={() => nav('/login?mode=signup')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#ffffff',
              color: '#0c0d10',
              border: 'none',
              borderRadius: 12,
              padding: '13px 28px',
              fontSize: 14.5,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
              transition: 'all 0.15s ease',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 255, 255, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.25)';
            }}
          >
            <span style={{ fontSize: 16 }}>→</span>
            <span>Start Free Trial</span>
          </button>
        </div>
      </section>

      {/* 10. Relatik Signature Footer with Official Chatral Logo */}
      <footer style={{ background: '#ffffff', borderTop: '1px solid #ebecee', padding: isMobile ? '52px 20px 32px' : '68px 24px 36px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          {/* Top Row: Brand on Left, 3 Nav Columns on Right */}
          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: isMobile ? 36 : 48,
            }}
          >
            {/* Left Column: Official Chatral Brand Logo + Tagline */}
            <div style={{ maxWidth: 320 }}>
              <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
                <ChatralFullLogo height={isMobile ? 30 : 34} dark={false} />
              </Link>
              <div style={{ color: '#6b707c', fontSize: 14, lineHeight: 1.55, marginTop: 16 }}>
                The simple live chat for teams that care<br />about relationships.
              </div>
            </div>

            {/* Right Group: Product, Company, Legal Columns */}
            <div
              style={{
                display: 'flex',
                gap: isMobile ? 36 : 80,
                flexWrap: 'wrap',
              }}
            >
              {/* Product */}
              <div style={{ minWidth: 105 }}>
                <div style={{ fontWeight: 600, color: '#0c0d10', fontSize: 14.5, marginBottom: 16 }}>Product</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11, fontSize: 14 }}>
                  <a
                    onClick={() => scrollTo('features')}
                    style={{ color: '#5b5f6b', cursor: 'pointer', textDecoration: 'none', transition: 'color 0.15s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#0c0d10')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#5b5f6b')}
                  >
                    Features
                  </a>
                  <a
                    onClick={() => scrollTo('how-it-works')}
                    style={{ color: '#5b5f6b', cursor: 'pointer', textDecoration: 'none', transition: 'color 0.15s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#0c0d10')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#5b5f6b')}
                  >
                    How it works
                  </a>
                  <a
                    onClick={() => scrollTo('pricing')}
                    style={{ color: '#5b5f6b', cursor: 'pointer', textDecoration: 'none', transition: 'color 0.15s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#0c0d10')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#5b5f6b')}
                  >
                    Pricing
                  </a>
                  <a
                    onClick={() => scrollTo('faq')}
                    style={{ color: '#5b5f6b', cursor: 'pointer', textDecoration: 'none', transition: 'color 0.15s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#0c0d10')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#5b5f6b')}
                  >
                    FAQ
                  </a>
                </div>
              </div>

              {/* Company */}
              <div style={{ minWidth: 105 }}>
                <div style={{ fontWeight: 600, color: '#0c0d10', fontSize: 14.5, marginBottom: 16 }}>Company</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11, fontSize: 14 }}>
                  <a
                    onClick={() => scrollTo('testimonials')}
                    style={{ color: '#5b5f6b', cursor: 'pointer', textDecoration: 'none', transition: 'color 0.15s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#0c0d10')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#5b5f6b')}
                  >
                    Testimonials
                  </a>
                  <a
                    href="mailto:digiscaleinfotech@gmail.com"
                    style={{ color: '#5b5f6b', textDecoration: 'none', transition: 'color 0.15s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#0c0d10')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#5b5f6b')}
                  >
                    Contact
                  </a>
                </div>
              </div>

              {/* Legal */}
              <div style={{ minWidth: 105 }}>
                <div style={{ fontWeight: 600, color: '#0c0d10', fontSize: 14.5, marginBottom: 16 }}>Legal</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11, fontSize: 14 }}>
                  <Link
                    to="/privacy"
                    style={{ color: '#5b5f6b', textDecoration: 'none', transition: 'color 0.15s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#0c0d10')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#5b5f6b')}
                  >
                    Privacy policy
                  </Link>
                  <Link
                    to="/terms"
                    style={{ color: '#5b5f6b', textDecoration: 'none', transition: 'color 0.15s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#0c0d10')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#5b5f6b')}
                  >
                    Terms of service
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Divider */}
          <div style={{ borderTop: '1px solid #ebecee', margin: '44px 0 24px' }} />

          {/* Bottom Copyright & Social Icons */}
          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'flex-start' : 'center',
              gap: 14,
            }}
          >
            <div style={{ color: '#8c92a4', fontSize: 13, fontWeight: 400 }}>
              &copy; {new Date().getFullYear()} Chatral. All rights reserved.
            </div>

            {/* Social Icons (Instagram and LinkedIn) */}
            <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                style={{ color: '#717684', display: 'flex', alignItems: 'center', transition: 'color 0.15s ease' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#0c0d10')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#717684')}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>

              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                style={{ color: '#717684', display: 'flex', alignItems: 'center', transition: 'color 0.15s ease' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#0c0d10')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#717684')}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.6 1.6 0 1 0 1.6 1.6 1.6 1.6 0 0 0-1.6-1.6z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
