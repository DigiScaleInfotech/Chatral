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
  const [heroActiveConvId, setHeroActiveConvId] = useState('chatral');

  const heroConversations = {
    chatral: {
      id: 'chatral',
      name: 'Chatral Visitor',
      initials: 'CV',
      avatarBg: '#f1f5f9',
      avatarColor: '#64748b',
      time: '6m',
      preview: 'Hi! How fast can we install Chatral?',
      channel: 'Website Live Widget',
      location: 'Gujarat, India 🇮🇳',
      page: '/pricing',
      browser: 'Chrome • macOS',
      messages: [
        { sender: 'visitor', name: 'Visitor', time: '5m ago', text: 'Hi! How fast can we install Chatral?' },
        { sender: 'agent', name: 'Support Agent', time: '3m ago', text: 'Under 2 minutes! Just paste one script tag.' },
        { sender: 'visitor', name: 'Visitor', time: 'Just now', text: 'Awesome, thanks!' },
      ],
    },
    sarah: {
      id: 'sarah',
      name: 'Sarah Jenkins',
      initials: 'SJ',
      avatarBg: '#e0f2fe',
      avatarColor: '#0369a1',
      time: '24m',
      preview: 'Can we customize the chat widget color?',
      channel: 'Online Store Widget',
      location: 'Mumbai, India 🇮🇳',
      page: '/products',
      browser: 'Safari • iOS',
      messages: [
        { sender: 'visitor', name: 'Sarah Jenkins', time: '20m ago', text: 'Can we customize the chat widget color?' },
        { sender: 'agent', name: 'Support Agent', time: '18m ago', text: 'Yes! Colors, logo, and greetings are customizable.' },
        { sender: 'visitor', name: 'Sarah Jenkins', time: '15m ago', text: 'Great, thank you!' },
      ],
    },
    alex: {
      id: 'alex',
      name: 'Alex Cooper',
      initials: 'AC',
      avatarBg: '#fef3c7',
      avatarColor: '#b45309',
      time: '1h',
      preview: 'Can we auto-greet visitors after 30s?',
      channel: 'Website Live Widget',
      location: 'London, UK 🇬🇧',
      page: '/features',
      browser: 'Firefox • Windows',
      messages: [
        { sender: 'visitor', name: 'Alex Cooper', time: '45m ago', text: 'Can we auto-greet visitors after 30s?' },
        { sender: 'agent', name: 'Support Agent', time: '40m ago', text: 'Yes! You can trigger proactive chat invitations.' },
        { sender: 'visitor', name: 'Alex Cooper', time: '35m ago', text: 'Perfect, thank you!' },
      ],
    },
  };

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

        {/* Hero Dashboard Showcase (Official Chatral Live Chat Platform UI) */}
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
              minHeight: isMobile ? 520 : 660,
              height: isMobile ? 'auto' : 660,
            }}
          >
            {/* 1. Dark Left Navigation Sidebar (matching Chatral app shell) */}
            <div
              style={{
                width: 200,
                flexShrink: 0,
                background: '#070b13',
                borderRight: '1px solid #172133',
                display: isMobile ? 'none' : 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '16px 10px 14px',
              }}
            >
              <div>
                {/* Brand Logo in Sidebar */}
                <div style={{ display: 'flex', alignItems: 'center', padding: '4px 8px 18px' }}>
                  <ChatralFullLogo height={22} dark={true} />
                </div>

                {/* Sidebar Menu Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* 1. Inbox (Active) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: '#162238',
                      color: '#ffffff',
                      borderRadius: 7,
                      padding: '7px 10px',
                      fontWeight: 600,
                      fontSize: 12.5,
                      cursor: 'pointer',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <span>Inbox</span>
                  </div>

                  {/* 2. Tickets */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      color: '#94a3b8',
                      borderRadius: 7,
                      padding: '7px 10px',
                      fontSize: 12.5,
                      cursor: 'pointer',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <span>Tickets</span>
                  </div>

                  {/* 3. Visitors */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      color: '#94a3b8',
                      borderRadius: 7,
                      padding: '7px 10px',
                      fontSize: 12.5,
                      cursor: 'pointer',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    <span>Visitors</span>
                  </div>

                  {/* 4. Saved replies */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      color: '#94a3b8',
                      borderRadius: 7,
                      padding: '7px 10px',
                      fontSize: 12.5,
                      cursor: 'pointer',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                    <span>Saved replies</span>
                  </div>

                  {/* 5. Triggers */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      color: '#94a3b8',
                      borderRadius: 7,
                      padding: '7px 10px',
                      fontSize: 12.5,
                      cursor: 'pointer',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                    <span>Triggers</span>
                  </div>

                  {/* 6. Widget design */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      color: '#94a3b8',
                      borderRadius: 7,
                      padding: '7px 10px',
                      fontSize: 12.5,
                      cursor: 'pointer',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="13.5" cy="6.5" r=".5"/>
                      <circle cx="17.5" cy="10.5" r=".5"/>
                      <circle cx="8.5" cy="7.5" r=".5"/>
                      <circle cx="6.5" cy="12.5" r=".5"/>
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
                    </svg>
                    <span>Widget design</span>
                  </div>

                  {/* 7. Reports */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      color: '#94a3b8',
                      borderRadius: 7,
                      padding: '7px 10px',
                      fontSize: 12.5,
                      cursor: 'pointer',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="20" x2="18" y2="10"/>
                      <line x1="12" y1="20" x2="12" y2="4"/>
                      <line x1="6" y1="20" x2="6" y2="14"/>
                    </svg>
                    <span>Reports</span>
                  </div>

                  {/* 8. Activity Analytics */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      color: '#94a3b8',
                      borderRadius: 7,
                      padding: '7px 10px',
                      fontSize: 12.5,
                      cursor: 'pointer',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                      <polyline points="17 6 23 6 23 12"/>
                    </svg>
                    <span>Activity Analytics</span>
                  </div>

                  {/* 9. Store settings */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      color: '#94a3b8',
                      borderRadius: 7,
                      padding: '7px 10px',
                      fontSize: 12.5,
                      cursor: 'pointer',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                    <span>Store settings</span>
                  </div>

                  <div style={{ borderTop: '1px solid #1a2436', margin: '6px 4px' }} />

                  {/* 10. Platform */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      color: '#94a3b8',
                      borderRadius: 7,
                      padding: '7px 10px',
                      fontSize: 12.5,
                      cursor: 'pointer',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                      <line x1="8" y1="21" x2="16" y2="21"/>
                      <line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                    <span>Platform</span>
                  </div>
                </div>
              </div>

              {/* Bottom Active Store Box - Chatral */}
              <div
                style={{
                  background: '#0d1524',
                  border: '1px solid #1b283d',
                  borderRadius: 10,
                  padding: '10px 12px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                }}
              >
                <div style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b', letterSpacing: '0.06em' }}>
                  ACTIVE STORE
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff', marginTop: 3 }}>
                  Chatral
                </div>
              </div>
            </div>

            {/* 2. Right Main Layout (Top Header + 3-Column Workspace) */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                background: '#ffffff',
              }}
            >
              {/* Top Header Bar */}
              <div
                style={{
                  height: 52,
                  borderBottom: '1px solid #f1f3f7',
                  padding: '0 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#ffffff',
                }}
              >
                {/* Left controls - Chatral store dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                      color: '#64748b',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="3" y1="12" x2="21" y2="12"/>
                      <line x1="3" y1="6" x2="21" y2="6"/>
                      <line x1="3" y1="18" x2="21" y2="18"/>
                    </svg>
                  </button>

                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      fontSize: 12.5,
                      fontWeight: 500,
                      color: '#0f172a',
                    }}
                  >
                    <span>Chatral</span>
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>▾</span>
                  </div>

                  <span
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 4,
                      padding: '2px 8px',
                      fontSize: 11,
                      fontWeight: 500,
                      color: '#475569',
                    }}
                  >
                    Super admin
                  </span>
                </div>

                {/* Right controls - Profile circle with 'C' */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ color: '#64748b', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                    </svg>
                  </div>

                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: '#9333ea',
                      color: '#ffffff',
                      fontSize: 12,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 1px 3px rgba(147, 51, 234, 0.3)',
                    }}
                  >
                    C
                  </div>
                </div>
              </div>

              {/* Workspace 3-Column Content Area */}
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  height: isMobile ? 'auto' : 608,
                  overflow: 'hidden',
                }}
              >
                {/* Column 1: Conversations List */}
                <div
                  style={{
                    width: isMobile ? '100%' : 295,
                    flexShrink: 0,
                    borderRight: '1px solid #f1f3f7',
                    background: '#ffffff',
                    padding: '14px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    overflowY: 'auto',
                  }}
                >
                  {/* Conversations Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Conversations</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94a3b8' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                      </div>
                    </div>
                    <span
                      style={{
                        background: '#eff6ff',
                        color: '#2563eb',
                        border: '1px solid #dbeafe',
                        borderRadius: 4,
                        padding: '2px 7px',
                        fontSize: 10.5,
                        fontWeight: 600,
                      }}
                    >
                      Super Admin
                    </span>
                  </div>

                  {/* Search bar */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      border: '1px solid #e2e8f0',
                      borderRadius: 6,
                      padding: '6px 10px',
                      background: '#ffffff',
                    }}
                  >
                    <SearchOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
                    <span style={{ color: '#94a3b8', fontSize: 11.5, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                      Search name, email or message
                    </span>
                  </div>

                  {/* Segmented Sub-tabs */}
                  <div
                    style={{
                      display: 'flex',
                      background: '#f1f5f9',
                      borderRadius: 6,
                      padding: 3,
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        background: '#ffffff',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                        color: '#0f172a',
                        fontWeight: 600,
                        fontSize: 11.5,
                        padding: '3px 0',
                        borderRadius: 4,
                        cursor: 'pointer',
                      }}
                    >
                      Inbox
                    </div>
                    <div
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        color: '#64748b',
                        fontSize: 11.5,
                        padding: '3px 0',
                        cursor: 'pointer',
                      }}
                    >
                      Trash
                    </div>
                    <div
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        color: '#64748b',
                        fontSize: 11.5,
                        padding: '3px 0',
                        cursor: 'pointer',
                      }}
                    >
                      Spam
                    </div>
                  </div>

                  {/* Status filter chips */}
                  <div style={{ display: 'flex', gap: 10, fontSize: 11.5, padding: '1px 2px' }}>
                    <span style={{ color: '#2563eb', fontWeight: 600, cursor: 'pointer' }}>Open 1</span>
                    <span style={{ color: '#64748b', cursor: 'pointer' }}>Pending 0</span>
                    <span style={{ color: '#64748b', cursor: 'pointer' }}>Resolved 0</span>
                    <span style={{ color: '#64748b', cursor: 'pointer' }}>All 1</span>
                  </div>

                  {/* Dropdowns row */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: 6,
                        padding: '3px 8px',
                        fontSize: 11,
                        color: '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        background: '#ffffff',
                      }}
                    >
                      <span>All assignees</span>
                      <span style={{ fontSize: 9, color: '#94a3b8' }}>▾</span>
                    </div>

                    <div
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: 6,
                        padding: '3px 8px',
                        fontSize: 11,
                        color: '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        background: '#ffffff',
                      }}
                    >
                      <span>Filter tag</span>
                      <span style={{ fontSize: 9, color: '#94a3b8' }}>▾</span>
                    </div>
                  </div>

                  {/* Conversation List Cards (clean without extra unassign/support/feature tags) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 2 }}>
                    {Object.values(heroConversations).map((conv) => {
                      const isSelected = heroActiveConvId === conv.id;
                      return (
                        <div
                          key={conv.id}
                          onClick={() => setHeroActiveConvId((prev) => (prev === conv.id ? null : conv.id))}
                          style={{
                            border: isSelected ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                            borderRadius: 8,
                            padding: '10px 10px',
                            background: isSelected ? '#f8fafc' : '#ffffff',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            boxShadow: isSelected ? '0 2px 6px rgba(37, 99, 235, 0.08)' : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              style={{ marginTop: 4, cursor: 'pointer' }}
                            />
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                background: conv.avatarBg,
                                border: '1px solid #e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                color: conv.avatarColor,
                                fontSize: 11,
                                fontWeight: 700,
                              }}
                            >
                              {conv.initials === 'CV' ? <UserOutlined style={{ fontSize: 12 }} /> : conv.initials}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{conv.name}</span>
                                <span style={{ fontSize: 11, color: '#94a3b8' }}>{conv.time}</span>
                              </div>
                              <div
                                style={{
                                  fontSize: 11.5,
                                  color: '#64748b',
                                  marginTop: 3,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {conv.preview}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Interactive Helper Hint */}
                  <div style={{ fontSize: 10.5, color: '#94a3b8', textAlign: 'center', marginTop: 'auto', padding: '6px 0' }}>
                    💡 Click any chat above to view the live conversation
                  </div>
                </div>

                {/* Column 2: Middle Chat Area */}
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    borderRight: isMobile ? 'none' : '1px solid #f1f3f7',
                    background: heroActiveConvId ? '#f8fafc' : '#ffffff',
                    display: isMobile && !heroActiveConvId ? 'none' : 'flex',
                    flexDirection: 'column',
                    justifyContent: heroActiveConvId ? 'space-between' : 'center',
                    alignItems: heroActiveConvId ? 'stretch' : 'center',
                    padding: heroActiveConvId ? 0 : 24,
                    height: '100%',
                  }}
                >
                  {!heroActiveConvId || !heroConversations[heroActiveConvId] ? (
                    /* Default empty state matching Image 2 */
                    <div style={{ textAlign: 'center' }}>
                      <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
                        <path d="M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8" />
                        <polyline points="21 8 16 3 8 3 3 8" />
                        <line x1="3" y1="8" x2="21" y2="8" />
                        <path d="M10 12h4" />
                      </svg>
                      <div style={{ fontSize: 13.5, color: '#64748b', marginTop: 14, fontWeight: 400 }}>
                        Select a conversation to start chatting
                      </div>
                    </div>
                  ) : (
                    /* Active chat conversation for selected customer */
                    (() => {
                      const activeConv = heroConversations[heroActiveConvId];
                      return (
                        <>
                          {/* Chat Header - Fixed single line without awkward wrapping */}
                          <div
                            style={{
                              height: 52,
                              borderBottom: '1px solid #eef2f6',
                              background: '#ffffff',
                              padding: '0 16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexShrink: 0,
                              minWidth: 0,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                {activeConv.name}
                              </span>
                              <span style={{ fontSize: 11.5, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                • Live on Chatral
                              </span>
                            </div>
                            <span style={{ fontSize: 11.5, color: '#2563eb', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 12 }}>
                              Resolve chat
                            </span>
                          </div>

                          {/* Chat Messages Body */}
                          <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
                            {activeConv.messages.map((msg, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: msg.sender === 'visitor' ? 'flex-start' : 'flex-end',
                                  maxWidth: msg.sender === 'visitor' ? '82%' : '85%',
                                  alignSelf: msg.sender === 'visitor' ? 'flex-start' : 'flex-end',
                                }}
                              >
                                <div style={{ fontSize: 10.5, color: '#94a3b8', marginBottom: 3 }}>
                                  {msg.name} • {msg.time}
                                </div>
                                <div
                                  style={{
                                    background: msg.sender === 'visitor' ? '#ffffff' : '#2563eb',
                                    color: msg.sender === 'visitor' ? '#0f172a' : '#ffffff',
                                    border: msg.sender === 'visitor' ? '1px solid #e2e8f0' : 'none',
                                    borderRadius: msg.sender === 'visitor' ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                                    padding: '10px 14px',
                                    fontSize: 12.5,
                                    lineHeight: 1.5,
                                    boxShadow: msg.sender === 'visitor' ? '0 1px 2px rgba(0,0,0,0.03)' : '0 1px 3px rgba(37,99,235,0.2)',
                                  }}
                                >
                                  {msg.text}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Chat Input Bar */}
                          <div style={{ padding: '12px 16px', background: '#ffffff', borderTop: '1px solid #eef2f6', flexShrink: 0 }}>
                            <div
                              style={{
                                border: '1px solid #e2e8f0',
                                borderRadius: 8,
                                padding: '8px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: '#fafbfd',
                              }}
                            >
                              <span style={{ fontSize: 12, color: '#94a3b8' }}>Type a reply or use saved replies...</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b' }}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                                <div style={{ background: '#2563eb', color: '#ffffff', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600 }}>Send</div>
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    })()
                  )}
                </div>

                {/* Column 3: Right Details Panel */}
                <div
                  style={{
                    width: isMobile ? '0' : 235,
                    display: isMobile ? 'none' : 'flex',
                    flexDirection: 'column',
                    justifyContent: heroActiveConvId ? 'flex-start' : 'center',
                    alignItems: heroActiveConvId ? 'stretch' : 'center',
                    background: '#ffffff',
                    padding: heroActiveConvId ? 16 : 24,
                    height: '100%',
                    flexShrink: 0,
                  }}
                >
                  {!heroActiveConvId || !heroConversations[heroActiveConvId] ? (
                    /* Default state matching Image 2 */
                    <div style={{ textAlign: 'center' }}>
                      <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
                        <path d="M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8" />
                        <polyline points="21 8 16 3 8 3 3 8" />
                        <line x1="3" y1="8" x2="21" y2="8" />
                        <path d="M10 12h4" />
                      </svg>
                      <div style={{ fontSize: 13.5, color: '#64748b', marginTop: 14, fontWeight: 400 }}>
                        No active conversation
                      </div>
                    </div>
                  ) : (
                    /* Active Visitor Details dynamically reflecting selected customer */
                    (() => {
                      const activeConv = heroConversations[heroActiveConvId];
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #f1f3f7', paddingBottom: 8 }}>
                            Visitor Details
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 11, fontSize: 11.5 }}>
                            <div>
                              <div style={{ color: '#94a3b8', fontSize: 10, letterSpacing: '0.04em' }}>NAME</div>
                              <div style={{ color: '#0f172a', fontWeight: 600, marginTop: 2 }}>{activeConv.name}</div>
                            </div>

                            <div>
                              <div style={{ color: '#94a3b8', fontSize: 10, letterSpacing: '0.04em' }}>CHANNEL</div>
                              <div style={{ color: '#0f172a', fontWeight: 500, marginTop: 2 }}>{activeConv.channel}</div>
                            </div>

                            <div>
                              <div style={{ color: '#94a3b8', fontSize: 10, letterSpacing: '0.04em' }}>LOCATION</div>
                              <div style={{ color: '#0f172a', fontWeight: 500, marginTop: 2 }}>{activeConv.location}</div>
                            </div>

                            <div>
                              <div style={{ color: '#94a3b8', fontSize: 10, letterSpacing: '0.04em' }}>ACTIVE PAGE</div>
                              <div style={{ color: '#2563eb', fontWeight: 500, marginTop: 2 }}>{activeConv.page}</div>
                            </div>

                            <div>
                              <div style={{ color: '#94a3b8', fontSize: 10, letterSpacing: '0.04em' }}>BROWSER & DEVICE</div>
                              <div style={{ color: '#0f172a', fontWeight: 500, marginTop: 2 }}>{activeConv.browser}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  )}
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
