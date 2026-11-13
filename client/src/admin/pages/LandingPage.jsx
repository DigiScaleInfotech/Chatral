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

const TRUSTED_COMPANIES = [
  {
    name: 'Brightloop',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M 9 9 C 9.414 9 9.75 9.336 9.75 9.75 C 9.75 10.578 9.078 11.25 8.25 11.25 C 7.007 11.25 6 10.243 6 9 C 6 7.343 7.343 6 9 6 C 11.071 6 12.75 7.679 12.75 9.75 C 12.75 12.235 10.735 14.25 8.25 14.25 C 5.351 14.25 3 11.899 3 9 C 3 5.686 5.686 3 9 3 C 12.728 3 15.75 6.022 15.75 9.75 C 15.75 13.892 12.392 17.25 8.25 17.25 C 3.694 17.25 0 13.556 0 9 C 0 4.029 4.029 0 9 0 C 14.385 0 18.75 4.365 18.75 9.75" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" transform="translate(3.75 3.75)" />
      </svg>
    ),
  },
  {
    name: 'Fieldwork',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M 1.482 14.268 C -3.008 6.786 2.982 -0.696 15.698 0.052 C 16.446 12.772 8.964 18.758 1.482 14.268 Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" transform="translate(4.5 3.75)" />
        <path d="M 11.25 0 L 0 11.25" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" transform="translate(3.75 9)" />
      </svg>
    ),
  },
  {
    name: 'Kestrel',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="15.375" cy="6.375" r="1.125" fill="currentColor" />
        <path d="M 8.25 7.08 L 8.25 4.959 C 8.25 2.261 10.407 0.013 13.101 0 C 15.33 -0.011 17.282 1.49 17.844 3.646 L 20.25 5.25 L 18 6.75 L 18 9 C 18 13.971 13.971 18 9 18 L 0.75 18 C 0.462 18 0.199 17.835 0.074 17.575 C -0.051 17.315 -0.016 17.006 0.165 16.781 Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" transform="translate(1.5 2.25)" />
        <path d="M 6.875 0 L 0 8.25" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" transform="translate(5.125 12)" />
      </svg>
    ),
  },
  {
    name: 'Lumora',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M 21 0 L 0 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" transform="translate(1.5 15)" />
        <path d="M 15 0 L 0 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" transform="translate(4.5 18.75)" />
        <path d="M 0.188 7.488 C -0.434 5.06 0.519 2.502 2.577 1.072 C 4.635 -0.357 7.365 -0.357 9.424 1.072 C 11.482 2.502 12.434 5.06 11.813 7.488" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" transform="translate(6 7.512)" />
        <path d="M 0 0 L 0.75 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" transform="translate(7.5 3.75)" />
        <path d="M 0 0 L 1.5 0.75" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" transform="translate(2.25 9)" />
        <path d="M 1.5 0 L 0 0.75" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" transform="translate(20.25 9)" />
        <path d="M 0.75 0 L 0 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" transform="translate(15.75 3.75)" />
      </svg>
    ),
  },
  {
    name: 'Orbitly',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M 0 8.25 C 0 3.694 3.694 0 8.25 0 C 12.806 0 16.5 3.694 16.5 8.25 C 16.5 12.806 12.806 16.5 8.25 16.5 C 3.694 16.5 0 12.806 0 8.25 Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" transform="translate(3.75 3.75)" />
        <path d="M 15.821 0.445 C 18.365 -0.231 20.266 -0.16 20.831 0.815 C 21.862 2.589 18.07 6.684 12.364 9.963 C 6.657 13.241 1.198 14.463 0.169 12.681 C -0.399 11.704 0.498 10.022 2.371 8.16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" transform="translate(1.5 5.25)" />
      </svg>
    ),
  },
  {
    name: 'Quanta',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M 5.325 11.176 C 1.066 6.917 -1.077 2.154 0.538 0.538 C 2.154 -1.077 6.917 1.066 11.176 5.325 C 15.435 9.584 17.577 14.346 15.962 15.962 C 14.346 17.577 9.584 15.435 5.325 11.176 Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" transform="translate(3.75 3.75)" />
        <path d="M 0.538 15.962 C -1.077 14.346 1.066 9.584 5.325 5.325 C 9.584 1.066 14.346 -1.077 15.962 0.538 C 17.577 2.154 15.435 6.917 11.176 11.176 C 6.917 15.435 2.154 17.577 0.538 15.962 Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" transform="translate(3.75 3.75)" />
        <circle cx="12" cy="12" r="1.125" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: 'Vellum',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M 14.25 0 L 0 14.25" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" transform="translate(3 6.75)" />
        <path d="M 7.719 15.531 C 7.579 15.671 7.388 15.75 7.19 15.75 L 0 15.75 L 0 8.561 C 0 8.362 0.079 8.171 0.219 8.031 L 6.788 1.538 C 8.838 -0.513 12.162 -0.513 14.213 1.538 C 16.263 3.588 16.263 6.912 14.213 8.963 Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" transform="translate(6 2.25)" />
        <path d="M 0 0 L 0 7.451" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" transform="translate(10.5 6.049)" />
        <path d="M 0 0 L 7.425 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" transform="translate(12.75 11.25)" />
      </svg>
    ),
  },
  {
    name: 'Haven',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M 9.36 0.092 L 17.61 4.609 C 17.85 4.74 17.999 4.992 18 5.265 L 18 14.231 C 17.999 14.505 17.85 14.756 17.61 14.888 L 9.36 19.405 C 9.136 19.527 8.864 19.527 8.64 19.405 L 0.39 14.888 C 0.15 14.756 0.001 14.505 0 14.231 L 0 5.265 C 0.001 4.992 0.15 4.74 0.39 4.609 L 8.64 0.092 C 8.864 -0.031 9.136 -0.031 9.36 0.092 Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" transform="translate(3 2.252)" />
      </svg>
    ),
  },
];

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

      {/* Animated Liquid Wave Background Styles */}
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
        @keyframes logoTickerScroll {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
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
              onClick={() => scrollTo('demo')}
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
            <span>✓ 14-day free trial</span>
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
                {/* Relatik Logo in Sidebar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px 16px' }}>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      background: '#0c0d10',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    ⌘
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0c0d10', letterSpacing: '-0.02em' }}>
                    chatral
                  </span>
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

        {/* Relatik Trusted Logos Ticker Section */}
        <div
          style={{
            maxWidth: 1240,
            margin: isMobile ? '44px auto 0' : '64px auto 0',
            padding: '0 20px',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <p
            style={{
              color: '#5b5f6b',
              fontSize: isMobile ? 13 : 14,
              fontWeight: 500,
              letterSpacing: '-0.01em',
              marginBottom: 28,
            }}
          >
            Trusted by fast-growing teams around the world
          </p>

          {/* Marquee Ticker Track with Gradient Masks */}
          <div
            style={{
              overflow: 'hidden',
              position: 'relative',
              width: '100%',
              maskImage: 'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? 36 : 56,
                width: 'max-content',
                animation: 'logoTickerScroll 28s linear infinite',
              }}
            >
              {[...TRUSTED_COMPANIES, ...TRUSTED_COMPANIES].map((company, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    color: '#0c0d10',
                    opacity: 0.85,
                    transition: 'opacity 0.2s ease, transform 0.2s ease',
                    cursor: 'default',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0.85';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', color: '#0c0d10' }}>
                    {company.svg}
                  </span>
                  <span
                    style={{
                      fontSize: isMobile ? 15 : 16.5,
                      fontWeight: 700,
                      letterSpacing: '-0.025em',
                      color: '#0c0d10',
                      fontFamily: 'inherit',
                    }}
                  >
                    {company.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Features Bento Grid (Relatik Signature Bento Layout) */}
      <section id="features" style={{ padding: isMobile ? '64px 16px' : '96px 24px', background: '#f7f8fa' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 14px',
                background: '#ffffff',
                border: '1px solid #e6e7eb',
                borderRadius: 999,
                marginBottom: 16,
                boxShadow: '0 1px 3px rgba(12, 13, 16, 0.04)',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2b7fff' }} />
              <span style={{ color: '#0c0d10', fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Features
              </span>
            </div>
            <Typography.Title
              level={2}
              style={{
                color: '#0c0d10',
                fontSize: isMobile ? 28 : 42,
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
                margin: '0 0 14px',
              }}
            >
              Everything you need to close more deals
            </Typography.Title>
            <Typography.Paragraph
              style={{
                color: '#5b5f6b',
                fontSize: isMobile ? 15 : 16.5,
                lineHeight: 1.6,
                maxWidth: 580,
                margin: '0 auto',
              }}
            >
              Every tool you need to track, manage, and grow customer relationships — from first contact to automation — without the clutter.
            </Typography.Paragraph>
          </div>

          {/* Relatik Signature Bento Grid */}
          <Row gutter={[20, 20]}>
            {/* Bento Card 1: Lead management (Large 14-col) */}
            <Col xs={24} md={14}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e6e7eb',
                  borderRadius: 20,
                  padding: isMobile ? '22px 18px' : '28px 26px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 3px rgba(12, 13, 16, 0.04), 0 10px 24px -8px rgba(12, 13, 16, 0.04)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: '#eaf2ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <GlobalOutlined style={{ fontSize: 19, color: '#2b7fff' }} />
                  </div>
                  <Typography.Title level={4} style={{ color: '#0c0d10', fontSize: 18.5, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.015em' }}>
                    Lead management
                  </Typography.Title>
                  <Typography.Paragraph style={{ color: '#5b5f6b', fontSize: 13.5, lineHeight: 1.6, margin: '0 0 24px', maxWidth: 480 }}>
                    Track every lead from first contact to closed deal with customizable visitor pipelines — no spreadsheets required.
                  </Typography.Paragraph>
                </div>

                {/* Leads Preview UI Window */}
                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: 14,
                    border: '1px solid #e6e7eb',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(12, 13, 16, 0.03)',
                  }}
                >
                  {/* Window Bar */}
                  <div
                    style={{
                      background: '#ffffff',
                      borderBottom: '1px solid #e6e7eb',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0c0d10' }}>Leads</span>
                      <span style={{ background: '#f1f2f5', color: '#5b5f6b', fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 999 }}>
                        248
                      </span>
                    </div>

                    <div style={{ display: 'flex', background: '#f1f2f5', padding: 2, borderRadius: 8, gap: 2 }}>
                      <span style={{ background: '#ffffff', color: '#0c0d10', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6, boxShadow: '0 1px 2px rgba(12, 13, 16, 0.05)' }}>
                        All
                      </span>
                      <span style={{ color: '#6b707c', fontSize: 11, fontWeight: 500, padding: '3px 8px' }}>
                        New · 32
                      </span>
                      <span style={{ color: '#6b707c', fontSize: 11, fontWeight: 500, padding: '3px 8px' }}>
                        Hot · 14
                      </span>
                    </div>
                  </div>

                  {/* Table Headers */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '2fr 1fr' : '2.2fr 1.4fr 1fr 1fr',
                      padding: '8px 14px',
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: '#94a3b8',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      borderBottom: '1px solid #f1f2f5',
                      background: '#ffffff',
                    }}
                  >
                    <span>Name</span>
                    {!isMobile && <span>Source</span>}
                    {!isMobile && <span>Score</span>}
                    <span style={{ textAlign: 'right' }}>Status</span>
                  </div>

                  {/* Table Rows */}
                  {[
                    {
                      name: 'Elena Hart',
                      role: 'Brightloop · Head of Ops',
                      avatar: 'EH',
                      avatarBg: '#ede9fe',
                      avatarColor: '#7c3aed',
                      source: 'Website',
                      score: '98',
                      status: 'Hot',
                      statusBg: '#fee2e2',
                      statusColor: '#dc2626',
                    },
                    {
                      name: 'Owen Malik',
                      role: 'Haven & Co · VP Product',
                      avatar: 'OM',
                      avatarBg: '#e0f2fe',
                      avatarColor: '#0284c7',
                      source: 'Referral',
                      score: '92',
                      status: 'Hot',
                      statusBg: '#fee2e2',
                      statusColor: '#dc2626',
                    },
                    {
                      name: 'Rina Nakamura',
                      role: 'Kestrel · Growth Lead',
                      avatar: 'RN',
                      avatarBg: '#dcfce7',
                      avatarColor: '#16a34a',
                      source: 'LinkedIn',
                      score: '84',
                      status: 'Warm',
                      statusBg: '#fef3c7',
                      statusColor: '#d97706',
                    },
                  ].map((lead, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '2fr 1fr' : '2.2fr 1.4fr 1fr 1fr',
                        padding: '10px 14px',
                        alignItems: 'center',
                        fontSize: 12,
                        background: '#ffffff',
                        borderBottom: idx === 2 ? 'none' : '1px solid #f8fafc',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: lead.avatarBg,
                            color: lead.avatarColor,
                            fontSize: 9.5,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {lead.avatar}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: '#0c0d10', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {lead.name}
                          </div>
                          <div style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {lead.role}
                          </div>
                        </div>
                      </div>

                      {!isMobile && (
                        <span style={{ color: '#5b5f6b', fontSize: 11.5 }}>{lead.source}</span>
                      )}

                      {!isMobile && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 700, fontSize: 11.5, color: '#0c0d10' }}>{lead.score}</span>
                          <div style={{ width: 34, height: 4, background: '#f1f2f5', borderRadius: 999 }}>
                            <div style={{ width: `${lead.score}%`, height: '100%', background: '#16a34a', borderRadius: 999 }} />
                          </div>
                        </div>
                      )}

                      <div style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            background: lead.statusBg,
                            color: lead.statusColor,
                            padding: '2px 8px',
                            borderRadius: 999,
                            fontSize: 10.5,
                            fontWeight: 600,
                          }}
                        >
                          <span style={{ width: 4, height: 4, borderRadius: '50%', background: lead.statusColor }} />
                          {lead.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Col>

            {/* Bento Card 2: Pipeline overview (10-col) */}
            <Col xs={24} md={10}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e6e7eb',
                  borderRadius: 20,
                  padding: isMobile ? '22px 18px' : '28px 26px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 3px rgba(12, 13, 16, 0.04), 0 10px 24px -8px rgba(12, 13, 16, 0.04)',
                }}
              >
                <div>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: '#f0fdf4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <RiseOutlined style={{ fontSize: 19, color: '#16a34a' }} />
                  </div>
                  <Typography.Title level={4} style={{ color: '#0c0d10', fontSize: 18.5, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.015em' }}>
                    Pipeline overview
                  </Typography.Title>
                  <Typography.Paragraph style={{ color: '#5b5f6b', fontSize: 13.5, lineHeight: 1.6, margin: '0 0 24px' }}>
                    See your whole sales pipeline at a glance. Monitor stages, spot bottlenecks, and keep deals moving.
                  </Typography.Paragraph>
                </div>

                {/* Pipeline Preview Kanban Mockup */}
                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: 14,
                    border: '1px solid #e6e7eb',
                    padding: 12,
                    boxShadow: '0 2px 8px rgba(12, 13, 16, 0.03)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#0c0d10' }}>New business</span>
                      <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6 }}>$227k open</span>
                    </div>
                    <div style={{ display: 'flex', background: '#e2e8f0', padding: 2, borderRadius: 6, gap: 2 }}>
                      <span style={{ background: '#ffffff', color: '#0c0d10', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
                        Board
                      </span>
                      <span style={{ color: '#64748b', fontSize: 10, fontWeight: 500, padding: '2px 8px' }}>
                        List
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {/* Stage Column 1 */}
                    <div style={{ background: '#f1f5f9', borderRadius: 10, padding: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, fontWeight: 700, color: '#475569', marginBottom: 8 }}>
                        <span>Qualified · 4</span>
                        <span>$64k</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', boxShadow: '0 1px 2px rgba(12, 13, 16, 0.03)' }}>
                          <div style={{ fontWeight: 600, fontSize: 11.5, color: '#0c0d10' }}>Lumora</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#2b7fff' }}>$18,500</span>
                            <span style={{ fontSize: 9.5, color: '#94a3b8' }}>Oct 28</span>
                          </div>
                        </div>
                        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', boxShadow: '0 1px 2px rgba(12, 13, 16, 0.03)' }}>
                          <div style={{ fontWeight: 600, fontSize: 11.5, color: '#0c0d10' }}>Orbitly</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#2b7fff' }}>$9,200</span>
                            <span style={{ fontSize: 9.5, color: '#94a3b8' }}>Nov 02</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stage Column 2 */}
                    <div style={{ background: '#f1f5f9', borderRadius: 10, padding: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, fontWeight: 700, color: '#475569', marginBottom: 8 }}>
                        <span>Proposal · 3</span>
                        <span>$82k</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div
                          style={{
                            background: '#ffffff',
                            border: '1.5px solid #2b7fff',
                            borderRadius: 8,
                            padding: '8px 10px',
                            boxShadow: '0 4px 12px rgba(43, 127, 255, 0.12)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: 11.5, color: '#0c0d10' }}>Haven & Co</span>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2b7fff' }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#2b7fff' }}>$32,000</span>
                            <span style={{ fontSize: 9.5, color: '#94a3b8' }}>Nov 08</span>
                          </div>
                        </div>
                        <div style={{ border: '1.5px dashed #cbd5e1', borderRadius: 8, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 10 }}>
                          + Drop here
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Col>

            {/* Bento Card 3: Analytics & insights (8-col) */}
            <Col xs={24} md={8}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e6e7eb',
                  borderRadius: 20,
                  padding: isMobile ? '22px 18px' : '28px 24px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 3px rgba(12, 13, 16, 0.04), 0 10px 24px -8px rgba(12, 13, 16, 0.04)',
                }}
              >
                <div>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: '#f5f3ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <BarChartOutlined style={{ fontSize: 19, color: '#7c3aed' }} />
                  </div>
                  <Typography.Title level={4} style={{ color: '#0c0d10', fontSize: 17.5, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.015em' }}>
                    Analytics & insights
                  </Typography.Title>
                  <Typography.Paragraph style={{ color: '#5b5f6b', fontSize: 13, lineHeight: 1.6, margin: '0 0 20px' }}>
                    Real-time reports and dashboards that show what’s working, agent response SLA, and where to focus next.
                  </Typography.Paragraph>
                </div>

                {/* Analytics Bar Chart Mockup */}
                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: 14,
                    border: '1px solid #e6e7eb',
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 10.5, color: '#64748b', fontWeight: 600 }}>REVENUE</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <span style={{ fontSize: 18, fontWeight: 800, color: '#0c0d10' }}>$128.4k</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '1px 6px', borderRadius: 999 }}>
                          ↑ 18.2%
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', background: '#e2e8f0', padding: 2, borderRadius: 6, gap: 2 }}>
                      <span style={{ color: '#64748b', fontSize: 9.5, padding: '2px 5px' }}>W</span>
                      <span style={{ background: '#ffffff', color: '#0c0d10', fontSize: 9.5, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>M</span>
                      <span style={{ color: '#64748b', fontSize: 9.5, padding: '2px 5px' }}>Q</span>
                    </div>
                  </div>

                  {/* Vertical bars */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 75, padding: '0 4px', borderBottom: '1px solid #e2e8f0' }}>
                    {[
                      { month: 'May', h: 32 },
                      { month: 'Jun', h: 46 },
                      { month: 'Jul', h: 40 },
                      { month: 'Aug', h: 58 },
                      { month: 'Sep', h: 68 },
                      { month: 'Oct', h: 88, active: true },
                    ].map((bar, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 24 }}>
                        <div
                          style={{
                            width: 14,
                            height: `${(bar.h / 100) * 65}px`,
                            background: bar.active ? '#2b7fff' : '#cbd5e1',
                            borderRadius: '4px 4px 0 0',
                            transition: 'height 0.3s ease',
                          }}
                        />
                        <span style={{ fontSize: 9, color: bar.active ? '#0c0d10' : '#94a3b8', fontWeight: bar.active ? 700 : 500 }}>
                          {bar.month}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: '#64748b' }}>
                    <span>Top source</span>
                    <strong style={{ color: '#0c0d10' }}>Website (64%)</strong>
                  </div>
                </div>
              </div>
            </Col>

            {/* Bento Card 4: Automated workflows (8-col) */}
            <Col xs={24} md={8}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e6e7eb',
                  borderRadius: 20,
                  padding: isMobile ? '22px 18px' : '28px 24px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 3px rgba(12, 13, 16, 0.04), 0 10px 24px -8px rgba(12, 13, 16, 0.04)',
                }}
              >
                <div>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: '#fffbeb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <ThunderboltOutlined style={{ fontSize: 19, color: '#d97706' }} />
                  </div>
                  <Typography.Title level={4} style={{ color: '#0c0d10', fontSize: 17.5, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.015em' }}>
                    Automated workflows
                  </Typography.Title>
                  <Typography.Paragraph style={{ color: '#5b5f6b', fontSize: 13, lineHeight: 1.6, margin: '0 0 20px' }}>
                    Put sales greetings on autopilot with smart behavioral triggers, so your team can focus on closing deals.
                  </Typography.Paragraph>
                </div>

                {/* Workflow Canvas Nodes Mockup */}
                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: 14,
                    border: '1px solid #e6e7eb',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#0c0d10' }}>Proposal follow-up</span>
                    <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: 9.5, fontWeight: 700, padding: '1px 6px', borderRadius: 999 }}>
                      ● Active
                    </span>
                  </div>

                  {/* Flow Sequence */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    {/* Node 1 */}
                    <div style={{ width: '100%', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ background: '#fef3c7', color: '#b45309', padding: '1px 6px', borderRadius: 4, fontSize: 8.5, fontWeight: 800 }}>TRIGGER</span>
                      <span style={{ fontSize: 10.5, color: '#0c0d10', fontWeight: 600 }}>Deal moves to Proposal</span>
                    </div>

                    {/* Connecting line */}
                    <div style={{ width: 1.5, height: 10, background: '#2b7fff' }} />

                    {/* Node 2 */}
                    <div style={{ width: '100%', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ background: '#f1f5f9', color: '#475569', padding: '1px 6px', borderRadius: 4, fontSize: 8.5, fontWeight: 800 }}>WAIT</span>
                      <span style={{ fontSize: 10.5, color: '#0c0d10', fontWeight: 600 }}>2 business days</span>
                    </div>

                    {/* Connecting line */}
                    <div style={{ width: 1.5, height: 10, background: '#2b7fff' }} />

                    {/* Branch Outcomes */}
                    <div style={{ width: '100%', display: 'flex', gap: 6 }}>
                      <div style={{ flex: 1, background: '#eaf2ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '4px 6px', textAlign: 'center', fontSize: 9.5, color: '#1d4ed8', fontWeight: 600 }}>
                        YES → Email
                      </div>
                      <div style={{ flex: 1, background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 6px', textAlign: 'center', fontSize: 9.5, color: '#64748b', fontWeight: 500 }}>
                        NO → Close
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Col>

            {/* Bento Card 5: Team collaboration (8-col) */}
            <Col xs={24} md={8}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e6e7eb',
                  borderRadius: 20,
                  padding: isMobile ? '22px 18px' : '28px 24px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 3px rgba(12, 13, 16, 0.04), 0 10px 24px -8px rgba(12, 13, 16, 0.04)',
                }}
              >
                <div>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: '#fdf2f8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <TeamOutlined style={{ fontSize: 19, color: '#db2777' }} />
                  </div>
                  <Typography.Title level={4} style={{ color: '#0c0d10', fontSize: 17.5, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.015em' }}>
                    Team collaboration
                  </Typography.Title>
                  <Typography.Paragraph style={{ color: '#5b5f6b', fontSize: 13, lineHeight: 1.6, margin: '0 0 20px' }}>
                    Assign chats, leave internal whisper notes, use canned shortcuts, and stay aligned with real-time updates.
                  </Typography.Paragraph>
                </div>

                {/* Team Activity Feed Mockup */}
                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: 14,
                    border: '1px solid #e6e7eb',
                    padding: '12px 14px',
                  }}
                >
                  {/* Deal Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid #e2e8f0' }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#0c0d10' }}>Brightloop · $24,000</div>
                      <div style={{ fontSize: 9.5, color: '#7e22ce' }}>Negotiation stage</div>
                    </div>
                    {/* Avatars Stack */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#ede9fe', color: '#6d28d9', fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fff' }}>JT</div>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#dcfce7', color: '#15803d', fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fff', marginLeft: -4 }}>MR</div>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fed7aa', color: '#c2410c', fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fff', marginLeft: -4 }}>AS</div>
                    </div>
                  </div>

                  {/* Internal Whisper Note */}
                  <div style={{ background: '#fef3c7', borderRadius: 8, padding: '7px 9px', marginBottom: 8, border: '1px solid #fde68a' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: '#92400e', fontWeight: 600, marginBottom: 2 }}>
                      <span>Julia T. (Whisper note)</span>
                      <span>10:24</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#78350f', lineHeight: 1.35 }}>
                      @Mark sent revised proposal for 25 seats.
                    </div>
                  </div>

                  {/* Checklist item */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#0c0d10', background: '#ffffff', padding: '5px 8px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                    <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                    <span style={{ fontWeight: 500 }}>Sent updated pricing link</span>
                  </div>
                </div>
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
