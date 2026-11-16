import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Button, Card, Col, Collapse, Divider, Drawer, Flex, Grid, Row, Segmented, Tag, Typography,
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
import { api } from '../api.js';
import { usePlanPricing } from '../constants/plans.js';

const { useBreakpoint } = Grid;

// Elegant custom dropdown select for form (no native OS gray menu)
function CustomSelect({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '11px 14px',
          borderRadius: 10,
          border: open ? '1.5px solid #2563eb' : '1.5px solid #e2e8f0',
          background: open ? '#ffffff' : '#f8fafc',
          boxShadow: open ? '0 0 0 3px rgba(37, 99, 235, 0.12)' : 'none',
          fontSize: 14,
          fontFamily: 'inherit',
          color: '#0f172a',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all 0.18s ease',
        }}
      >
        <span style={{ fontWeight: 500 }}>{value}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#64748b"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 60,
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            boxShadow: '0 14px 34px -4px rgba(15, 23, 42, 0.14), 0 4px 12px rgba(0, 0, 0, 0.04)',
            padding: 6,
          }}
        >
          {options.map((opt) => {
            const isSelected = opt === value;
            return (
              <div
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 8,
                  fontSize: 13.5,
                  fontWeight: isSelected ? 600 : 500,
                  color: isSelected ? '#2563eb' : '#1e293b',
                  background: isSelected ? '#eff6ff' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.12s ease, color 0.12s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.color = '#2563eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#1e293b';
                  }
                }}
              >
                <span>{opt}</span>
                {isSelected && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Slick kinetic character rolling text for navbar menu links & buttons (staggered roll-up, no box)
function RollText({ text, secondaryColor }) {
  return (
    <span className="roll-text" aria-label={text}>
      <span className="roll-stack roll-stack-primary" aria-hidden="true">
        {text.split('').map((char, i) => (
          <span
            key={i}
            className="roll-char"
            style={{ transitionDelay: `${i * 18}ms` }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </span>
      <span
        className="roll-stack roll-stack-secondary"
        aria-hidden="true"
        style={secondaryColor ? { color: secondaryColor } : undefined}
      >
        {text.split('').map((char, i) => (
          <span
            key={i}
            className="roll-char"
            style={{ transitionDelay: `${i * 18}ms` }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </span>
      <span className="roll-ghost">{text}</span>
    </span>
  );
}

export default function LandingPage() {
  const nav = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [billingCycle, setBillingCycle] = useState('annual');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [openFaq, setOpenFaq] = useState(null);
  const [heroActiveConvId, setHeroActiveConvId] = useState('chatral');
  const [showWidgetPill, setShowWidgetPill] = useState(true);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Contact Form state & submission handler
  const [contactForm, setContactForm] = useState({ name: '', email: '', company: '', topic: 'Schedule a Live Demo', message: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactSubmitting, setContactSubmitting] = useState(false);

  const handlePurchasePlan = (targetPlan) => {
    const token = localStorage.getItem('token');
    if (!token) {
      nav(`/login?mode=signup&plan=${targetPlan.toLowerCase()}`);
    } else {
      nav(`/settings?tab=billing&plan=${targetPlan.toLowerCase()}`);
    }
  };

  // Helper for "Book a demo" CTA across the entire page (exact same smooth scroll as navbar Contact Us)
  const handleBookDemo = (topic = 'Schedule a Live Demo') => {
    setContactForm((prev) => ({ ...prev, topic }));
    setMobileMenuOpen(false);
    scrollTo('contact');
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
      return;
    }
    setContactSubmitting(true);
    try {
      // 1. Direct reliable delivery to chatral.official@gmail.com via FormSubmit AJAX
      const formPromise = fetch('https://formsubmit.co/ajax/chatral.official@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: contactForm.name,
          email: contactForm.email,
          company: contactForm.company || 'N/A',
          topic: contactForm.topic,
          message: contactForm.message,
          _subject: `New Chatral Lead: ${contactForm.name} (${contactForm.topic})`,
          _template: 'table',
        }),
      }).catch((err) => console.warn('FormSubmit error:', err));

      // 2. Also send to internal backend endpoint /api/contact if available
      const apiPromise = fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      }).catch((err) => console.warn('API contact error:', err));

      // Wait max 1.8s so user never experiences lag
      await Promise.race([
        Promise.all([formPromise, apiPromise]),
        new Promise((resolve) => setTimeout(resolve, 1800)),
      ]);

      setContactSubmitted(true);
      setContactForm({ name: '', email: '', company: '', topic: 'Schedule a Live Demo', message: '' });
    } catch (err) {
      console.error('Submission error:', err);
      setContactSubmitted(true);
    } finally {
      setContactSubmitting(false);
    }
  };

  const handleLogoClick = (e) => {
    e.preventDefault();
    if (location.pathname !== '/' && location.pathname !== '/landing') {
      nav('/');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Guarantee page loads at absolute top (0, 0) on fresh load / hard refresh and clear any dismissal flag
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    try {
      sessionStorage.removeItem('chatral_pill_dismissed');
      localStorage.removeItem('chatral_pill_dismissed');
    } catch {
      // ignore
    }
  }, []);

  // Monitor whether Chatral live chat panel is open
  useEffect(() => {
    const checkState = () => {
      const host = document.querySelector('[id^="livechat-"]');
      if (host && host.shadowRoot) {
        const panel = host.shadowRoot.querySelector('.lc-panel:not(.closing)');
        setIsWidgetOpen(!!panel);
      }
    };
    checkState();
    const timer = setInterval(checkState, 150);
    return () => clearInterval(timer);
  }, []);

  const handleOpenLiveWidget = () => {
    const host = document.querySelector('[id^="livechat-"]');
    if (host && host.shadowRoot) {
      const launcher = host.shadowRoot.querySelector('.lc-launcher');
      if (launcher) {
        launcher.click();
      }
    }
  };

  const handleDismissPill = (e) => {
    e.stopPropagation();
    setShowWidgetPill(false);
  };

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
  const planPricing = usePlanPricing();

  // Ensure Chatral live chat widget is loaded and visible ONLY on Landing Page
  useEffect(() => {
    const showWidget = () => {
      const hosts = document.querySelectorAll('[id^="livechat-"]');
      hosts.forEach((h) => {
        if (h.getAttribute('data-disabled') === 'true') {
          h.style.display = 'none';
          h.style.visibility = 'hidden';
        } else {
          h.style.display = 'block';
          h.style.visibility = 'visible';
        }
      });
    };

    showWidget();

    let existing = document.querySelector('script[data-store="pk_yU4JQtndJuFviYy6d94ZzZE-"]');
    if (!existing) {
      const s = document.createElement('script');
      s.src = 'https://chatral-backend.onrender.com/widget/chat.js';
      s.dataset.store = 'pk_yU4JQtndJuFviYy6d94ZzZE-';
      s.dataset.api = 'https://chatral-backend.onrender.com';
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
    if (el) {
      const navOffset = 78;
      const elementPosition = el.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - navOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div
      className="page-smooth-fade"
      style={{
        background: '#ffffff',
        color: '#0c0d10',
        minHeight: '100vh',
        overflowX: 'clip',
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
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.85)',
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
          <a
            href="/"
            onClick={handleLogoClick}
            style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', cursor: 'pointer' }}
          >
            <ChatralFullLogo height={isMobile ? 32 : 38} dark={false} />
          </a>

          {/* Center Nav Links: Features, How it works, Pricing, Testimonials, FAQ, Contact Us with Kinetic Text Roll (No Box) */}
          {!isMobile && (
            <Flex gap={26} align="center">
              <a onClick={() => scrollTo('features')} className="nav-menu-link">
                <RollText text="Features" secondaryColor="#2563eb" />
              </a>
              <a onClick={() => scrollTo('how-it-works')} className="nav-menu-link">
                <RollText text="How it works" secondaryColor="#2563eb" />
              </a>
              <a onClick={() => scrollTo('testimonials')} className="nav-menu-link">
                <RollText text="Testimonials" secondaryColor="#2563eb" />
              </a>
              <a onClick={() => scrollTo('pricing')} className="nav-menu-link">
                <RollText text="Pricing" secondaryColor="#2563eb" />
              </a>
              <a onClick={() => scrollTo('faq')} className="nav-menu-link">
                <RollText text="FAQ" secondaryColor="#2563eb" />
              </a>
              <a onClick={() => scrollTo('contact')} className="nav-menu-link">
                <RollText text="Contact us" secondaryColor="#2563eb" />
              </a>
            </Flex>
          )}

          {/* Right Button: Brand Blue Button + Mobile Hamburger Menu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => nav('/login?mode=signup')}
              className="btn-brand-primary"
              style={{
                padding: isMobile ? '8px 16px' : '10px 22px',
                height: isMobile ? 38 : 42,
                fontSize: isMobile ? 13 : 14,
                fontFamily: 'inherit',
              }}
            >
              <RollText text="Start Free" />
              <svg className="btn-arrow-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>

            {/* Mobile Hamburger Toggle */}
            {isMobile && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open Navigation Menu"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0f172a',
                  cursor: 'pointer',
                  padding: 0,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      <Drawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        placement="right"
        width={300}
        styles={{ body: { padding: '24px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' } }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, paddingBottom: 14, borderBottom: '1px solid #f1f5f9' }}>
            <ChatralFullLogo height={30} dark={false} />
            <button
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b',
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Features', id: 'features' },
              { label: 'How it works', id: 'how-it-works' },
              { label: 'Testimonials', id: 'testimonials' },
              { label: 'Pricing', id: 'pricing' },
              { label: 'FAQ', id: 'faq' },
              { label: 'Contact us', id: 'contact' },
            ].map((item) => (
              <a
                key={item.id}
                onClick={() => {
                  setMobileMenuOpen(false);
                  scrollTo(item.id);
                }}
                style={{
                  fontSize: 15.5,
                  fontWeight: 600,
                  color: '#0f172a',
                  textDecoration: 'none',
                  padding: '10px 4px',
                  borderBottom: '1px solid #f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <span>{item.label}</span>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>→</span>
              </a>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 32 }}>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              nav('/login?mode=signup');
            }}
            className="btn-brand-primary"
            style={{ width: '100%', height: 44, borderRadius: 10, fontSize: 14, justifyContent: 'center' }}
          >
            <RollText text="Start 7-Day Free Trial" />
          </button>
          <button
            onClick={() => handleBookDemo()}
            className="btn-brand-secondary"
            style={{ width: '100%', height: 44, borderRadius: 10, fontSize: 14, justifyContent: 'center' }}
          >
            <RollText text="Book a demo" secondaryColor="#1d4ed8" />
          </button>
        </div>
      </Drawer>

      {/* Interactive Micro-animations, Liquid Waves & Styles */}
      <style>{`
        /* 1. Navbar Menu Items Hover Animation - Text Roll / Flip (No Box, Pure Typography) */
        .nav-menu-link {
          position: relative;
          color: #475569;
          font-size: 14.5px;
          font-weight: 500;
          padding: 6px 0;
          background: transparent !important;
          border: none !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          text-decoration: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          user-select: none;
          transition: none !important;
        }
        .nav-menu-link:hover,
        .nav-menu-link:focus,
        .nav-menu-link:active {
          background: transparent !important;
          box-shadow: none !important;
          transform: none !important;
          outline: none;
        }
        .nav-menu-link::after {
          display: none !important;
        }

        .roll-text {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          line-height: 1.25;
          vertical-align: middle;
        }
        .roll-ghost {
          visibility: hidden;
          opacity: 0;
          pointer-events: none;
          display: inline-block;
          white-space: nowrap;
          height: auto;
        }
        .roll-stack {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
          pointer-events: none;
        }
        .roll-stack-primary {
          color: inherit;
        }
        .roll-stack-secondary {
          color: inherit;
        }
        .roll-char {
          display: inline-block;
          transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform;
        }
        .roll-stack-primary .roll-char {
          transform: translateY(0%);
        }
        .roll-stack-secondary .roll-char {
          transform: translateY(115%);
        }

        /* Hover on Nav Menu Link */
        .nav-menu-link:hover .roll-stack-primary .roll-char {
          transform: translateY(-115%);
        }
        .nav-menu-link:hover .roll-stack-secondary .roll-char {
          transform: translateY(0%);
        }

        /* Hover on ALL Buttons on Landing Page */
        button:hover .roll-stack-primary .roll-char,
        .btn-brand-primary:hover .roll-stack-primary .roll-char,
        .btn-brand-secondary:hover .roll-stack-primary .roll-char {
          transform: translateY(-115%);
        }
        button:hover .roll-stack-secondary .roll-char,
        .btn-brand-primary:hover .roll-stack-secondary .roll-char,
        .btn-brand-secondary:hover .roll-stack-secondary .roll-char {
          transform: translateY(0%);
        }

        /* 2. Global Button Hover (NO scale/size increase, steady button dimensions) */
        .btn-brand-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #2563eb;
          color: #ffffff;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.28);
          transition: background-color 0.2s ease, box-shadow 0.2s ease;
          user-select: none;
          position: relative;
          transform: none !important;
        }
        .btn-brand-primary:hover {
          background: #1d4ed8;
          transform: none !important;
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.35);
        }
        .btn-brand-primary:active {
          transform: scale(0.98) !important;
        }
        .btn-brand-primary .btn-arrow-icon {
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-brand-primary:hover .btn-arrow-icon {
          transform: translateX(4px);
        }

        .btn-brand-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          color: #2563eb;
          border: 1.5px solid #dbeafe;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          box-shadow: 0 2px 6px rgba(37, 99, 235, 0.06);
          transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
          user-select: none;
          transform: none !important;
        }
        .btn-brand-secondary:hover {
          background: #eff6ff;
          border-color: #93c5fd;
          transform: none !important;
          box-shadow: 0 2px 10px rgba(37, 99, 235, 0.12);
        }
        .btn-brand-secondary:active {
          transform: scale(0.98) !important;
        }

        .btn-cta-banner {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          color: #1d4ed8;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 700;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
          transition: background-color 0.2s ease, color 0.2s ease;
          user-select: none;
          transform: none !important;
        }
        .btn-cta-banner:hover {
          background: #f8faff;
          color: #1e40af;
          transform: none !important;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }
        .btn-cta-banner .cta-arrow {
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-cta-banner:hover .cta-arrow {
          transform: translateX(4px);
        }
        .btn-cta-banner:active {
          transform: scale(0.98) !important;
        }

        /* 3. Footer Links Hover Animation */
        .footer-nav-link {
          color: #64748b;
          text-decoration: none;
          font-size: 14px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          width: fit-content;
        }
        .footer-nav-link:hover {
          color: #2563eb;
          transform: translateX(4px);
        }

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
          padding: isMobile ? '56px 16px 36px' : '84px 24px 52px',
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
            background: 'radial-gradient(ellipse 60% 50% at 30% 40%, rgba(186, 230, 253, 0.8) 0%, rgba(191, 219, 254, 0.5) 45%, rgba(255, 255, 255, 0) 75%)',
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
            background: 'radial-gradient(ellipse 60% 50% at 70% 45%, rgba(199, 210, 254, 0.75) 0%, rgba(147, 197, 253, 0.45) 45%, rgba(255, 255, 255, 0) 75%)',
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
            background: 'radial-gradient(circle at 50% 30%, rgba(224, 242, 254, 0.7) 0%, rgba(255, 255, 255, 0) 65%)',
            filter: 'blur(45px)',
            animation: 'liquidPulse 10s ease-in-out infinite',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <div style={{ maxWidth: 860, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          
          {/* Relatik Top Pill Badge with 3 Overlapping Avatars */}
          <div
            className="hero-fade-item-1"
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
              Trusted by 25+ modern businesses
            </span>
          </div>

          {/* Relatik Big Title in 2 Clean Lines */}
          <Typography.Title
            level={1}
            className="hero-fade-item-1"
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
            className="hero-fade-item-2"
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

          {/* Relatik Hero CTA Buttons with Dynamic Hover Animations */}
          <Flex justify="center" gap={14} wrap="wrap" className="hero-fade-item-2" style={{ marginBottom: 26 }}>
            <button
              onClick={() => nav('/login?mode=signup')}
              className="btn-brand-primary"
              style={{
                padding: '13px 26px',
                height: 48,
                fontSize: 15,
                fontFamily: 'inherit',
              }}
            >
              <RollText text="Start free trial" />
              <svg className="btn-arrow-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => handleBookDemo('Schedule a Live Demo')}
              className="btn-brand-secondary"
              style={{
                padding: '13px 26px',
                height: 48,
                fontSize: 15,
                fontFamily: 'inherit',
              }}
            >
              <RollText text="Book a demo" secondaryColor="#1d4ed8" />
            </button>
          </Flex>

          {/* Relatik Trust Checkmarks */}
          <Flex justify="center" gap={22} wrap="wrap" className="hero-fade-item-2" style={{ color: '#6b707c', fontSize: 13, fontWeight: 400 }}>
            <span>✓ No credit card required</span>
            <span>✓ 7-day free trial</span>
            <span>✓ Cancel anytime</span>
          </Flex>
        </div>

        {/* Hero Dashboard Showcase (Official Chatral Live Chat Platform UI) */}
        <div className="hero-fade-item-3" style={{ maxWidth: 1080, margin: '48px auto 0' }}>
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
                    borderRight: isMobile ? 'none' : '1px solid #f1f3f7',
                    background: '#ffffff',
                    padding: '14px 12px',
                    display: isMobile ? (heroActiveConvId ? 'none' : 'flex') : 'flex',
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
                    display: isMobile ? (heroActiveConvId ? 'flex' : 'none') : 'flex',
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
                              {isMobile && (
                                <button
                                  type="button"
                                  onClick={() => setHeroActiveConvId(null)}
                                  style={{
                                    border: '1px solid #dbeafe',
                                    background: '#eff6ff',
                                    color: '#2563eb',
                                    padding: '3px 8px',
                                    borderRadius: 6,
                                    fontSize: 11.5,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    marginRight: 4,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    flexShrink: 0,
                                  }}
                                >
                                  ← List
                                </button>
                              )}
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
      <section
        id="features"
        style={{
          padding: isMobile ? '48px 16px' : '72px 24px',
          background: 'radial-gradient(ellipse 90% 60% at 50% 0%, rgba(219, 234, 254, 0.45) 0%, rgba(240, 247, 255, 0.25) 50%, #ffffff 100%)',
          borderTop: '1px solid #e2e8f0',
        }}
      >
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 36 : 48 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 14px',
                background: '#eaf2ff',
                border: '1px solid rgba(37, 99, 235, 0.2)',
                borderRadius: 999,
                marginBottom: 16,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }} />
              <span style={{ color: '#2563eb', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
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

            {/* Bento Card 6: Role-based access (Bottom Right) */}
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
                  <SafetyCertificateOutlined style={{ fontSize: 18, color: '#ec4899' }} />
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
                  Role-based access
                </Typography.Title>
                <Typography.Paragraph
                  style={{
                    color: '#5b5f6b',
                    fontSize: 13.5,
                    lineHeight: 1.55,
                    margin: 0,
                  }}
                >
                  Assign granular roles (Owner, Admin, Agent) with custom permissions, ensuring team members only access what they need.
                </Typography.Paragraph>
              </div>
            </Col>

          </Row>
        </div>
      </section>

      {/* 4. How It Works - High-Converting 3-Step Flow with Hero Blue Accent */}
      <section
        id="how-it-works"
        style={{
          padding: isMobile ? '48px 16px' : '72px 24px',
          background: 'linear-gradient(180deg, #ffffff 0%, #f0f7ff 50%, #ffffff 100%)',
          borderTop: '1px solid #e2e8f0',
        }}
      >
        <div style={{ maxWidth: 1080, margin: '0 auto', textAlign: 'center' }}>
          
          {/* Header */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 14px',
              background: '#eaf2ff',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              borderRadius: 999,
              marginBottom: 16,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }} />
            <span style={{ color: '#2563eb', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
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

          <Row gutter={[24, 24]}>
            {[
              {
                step: '01',
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
                    border: '1px solid #dbeafe',
                    borderRadius: 20,
                    padding: '34px 28px',
                    textAlign: 'left',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 20px -4px rgba(37, 99, 235, 0.06)',
                    transition: 'all 0.22s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.borderColor = '#93c5fd';
                    e.currentTarget.style.boxShadow = '0 12px 30px -6px rgba(37, 99, 235, 0.14)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.borderColor = '#dbeafe';
                    e.currentTarget.style.boxShadow = '0 4px 20px -4px rgba(37, 99, 235, 0.06)';
                  }}
                >
                  {/* Top Row: Icon on left with blue gradient, Step pill on right */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 14,
                        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(37, 99, 235, 0.12)',
                      }}
                    >
                      {s.icon}
                    </div>
                    <span
                      style={{
                        color: '#2563eb',
                        background: '#eff6ff',
                        padding: '3px 10px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                      }}
                    >
                      STEP {s.step}
                    </span>
                  </div>

                  {/* Title & Description below */}
                  <div style={{ marginTop: 26 }}>
                    <Typography.Title
                      level={3}
                      style={{
                        color: '#0c0d10',
                        fontSize: 19,
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                        margin: '0 0 10px',
                      }}
                    >
                      {s.title}
                    </Typography.Title>
                    <Typography.Paragraph
                      style={{
                        color: '#5b5f6b',
                        fontSize: 14,
                        lineHeight: 1.6,
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

      {/* 5. Testimonials (Exact Relatik Infinite Marquee Carousel with Hero Blue Ambient Glow) */}
      <section
        id="testimonials"
        style={{
          padding: isMobile ? '48px 0' : '72px 0',
          background: 'radial-gradient(ellipse 90% 60% at 50% 0%, rgba(224, 242, 254, 0.45) 0%, rgba(240, 247, 255, 0.3) 55%, #ffffff 100%)',
          borderTop: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: 1080, margin: '0 auto', textAlign: 'center', padding: '0 24px', marginBottom: 44 }}>
          
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 14px',
              background: '#eaf2ff',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              borderRadius: 999,
              marginBottom: 16,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }} />
            <span style={{ color: '#2563eb', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
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
                title: 'Increased website orders by 40%',
                quote: 'We sell sarees across India from Surat. Chatral lets our sales team initiate live chats when shoppers are on checkout. We stopped cart drop-offs completely.',
                author: 'Bhavik Patel',
                role: 'Founder, Surat Silk & Sarees',
                initials: 'BP',
                avatarBg: '#eff6ff',
                avatarColor: '#2563eb',
              },
              {
                title: 'Setup took literally 2 minutes on Shopify',
                quote: 'Installed the widget on our Shopify jewellery store without any developer. Customers love the instant replies and sound alerts during high-traffic festivals.',
                author: 'Priya Shah',
                role: 'Head of E-Commerce, Aura Jewels (Surat)',
                initials: 'PS',
                avatarBg: '#fdf2f8',
                avatarColor: '#db2777',
              },
              {
                title: 'Manages 3 brand stores smoothly',
                quote: 'We run two wholesale stores and one retail brand from Ring Road, Surat. Multi-store management inside one Chatral dashboard saved our team from opening 10 browser tabs.',
                author: 'Jignesh Mehta',
                role: 'Director, TexFab Global Textiles',
                initials: 'JM',
                avatarBg: '#ecfdf5',
                avatarColor: '#059669',
              },
              {
                title: 'Our customer conversions doubled',
                quote: 'The automated welcome greeting triggers right when visitors spend 30 seconds on a product page. Our lead response time dropped from 2 hours to under 1 minute.',
                author: 'Kavita Desai',
                role: 'Founder, Shreeji Organics & Wellness',
                initials: 'KD',
                avatarBg: '#fff7ed',
                avatarColor: '#ea580c',
              },
              {
                title: 'Handled 3,000+ chats during wedding season',
                quote: 'Zero lags, crystal-clear visitor location tracking, and lightning-fast chat replies. Chatral is built for high-volume sales teams that care about relationships.',
                author: 'Harshil Chothani',
                role: 'Partner, Surat Diamond Craft',
                initials: 'HC',
                avatarBg: '#f5f3ff',
                avatarColor: '#7c3aed',
              },
              {
                title: 'Best customer messaging tool in Gujarat',
                quote: 'We recommend Chatral to all our e-commerce clients in Surat & Ahmedabad. Clean UI, honest pricing, and immediate support from the Chatral team.',
                author: 'Rohan Vaghani',
                role: 'Growth Lead, Vaghani Commerce (Surat)',
                initials: 'RV',
                avatarBg: '#eff6ff',
                avatarColor: '#1d4ed8',
              },
              // Duplicate once to enable seamless infinite scroll loop
              {
                title: 'Increased website orders by 40%',
                quote: 'We sell sarees across India from Surat. Chatral lets our sales team initiate live chats when shoppers are on checkout. We stopped cart drop-offs completely.',
                author: 'Bhavik Patel',
                role: 'Founder, Surat Silk & Sarees',
                initials: 'BP',
                avatarBg: '#eff6ff',
                avatarColor: '#2563eb',
              },
              {
                title: 'Setup took literally 2 minutes on Shopify',
                quote: 'Installed the widget on our Shopify jewellery store without any developer. Customers love the instant replies and sound alerts during high-traffic festivals.',
                author: 'Priya Shah',
                role: 'Head of E-Commerce, Aura Jewels (Surat)',
                initials: 'PS',
                avatarBg: '#fdf2f8',
                avatarColor: '#db2777',
              },
              {
                title: 'Manages 3 brand stores smoothly',
                quote: 'We run two wholesale stores and one retail brand from Ring Road, Surat. Multi-store management inside one Chatral dashboard saved our team from opening 10 browser tabs.',
                author: 'Jignesh Mehta',
                role: 'Director, TexFab Global Textiles',
                initials: 'JM',
                avatarBg: '#ecfdf5',
                avatarColor: '#059669',
              },
              {
                title: 'Our customer conversions doubled',
                quote: 'The automated welcome greeting triggers right when visitors spend 30 seconds on a product page. Our lead response time dropped from 2 hours to under 1 minute.',
                author: 'Kavita Desai',
                role: 'Founder, Shreeji Organics & Wellness',
                initials: 'KD',
                avatarBg: '#fff7ed',
                avatarColor: '#ea580c',
              },
              {
                title: 'Handled 3,000+ chats during wedding season',
                quote: 'Zero lags, crystal-clear visitor location tracking, and lightning-fast chat replies. Chatral is built for high-volume sales teams that care about relationships.',
                author: 'Harshil Chothani',
                role: 'Partner, Surat Diamond Craft',
                initials: 'HC',
                avatarBg: '#f5f3ff',
                avatarColor: '#7c3aed',
              },
              {
                title: 'Best customer messaging tool in Gujarat',
                quote: 'We recommend Chatral to all our e-commerce clients in Surat & Ahmedabad. Clean UI, honest pricing, and immediate support from the Chatral team.',
                author: 'Rohan Vaghani',
                role: 'Growth Lead, Vaghani Commerce (Surat)',
                initials: 'RV',
                avatarBg: '#eff6ff',
                avatarColor: '#1d4ed8',
              },
            ].map((t, idx) => (
              <div
                key={idx}
                style={{
                  width: isMobile ? 300 : 350,
                  flexShrink: 0,
                  background: '#ffffff',
                  border: '1px solid #e0eafc',
                  borderRadius: 22,
                  padding: '30px 26px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                  boxShadow: '0 4px 16px -2px rgba(37, 99, 235, 0.05)',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#93c5fd';
                  e.currentTarget.style.boxShadow = '0 12px 30px -4px rgba(37, 99, 235, 0.12)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e0eafc';
                  e.currentTarget.style.boxShadow = '0 4px 16px -2px rgba(37, 99, 235, 0.05)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div>
                  {/* Top: 5 Blue Stars + Light Blue Quotation Mark */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ display: 'flex', gap: 3, color: '#2563eb', fontSize: 13 }}>
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

      {/* 6. Pricing Plans (Exact Relatik Styling with Hero Blue Ambient Glow) */}
      <section
        id="pricing"
        style={{
          padding: isMobile ? '48px 16px 80px' : '72px 24px 100px',
          background: 'radial-gradient(ellipse 90% 50% at 50% -10%, rgba(219, 234, 254, 0.45) 0%, rgba(240, 247, 255, 0.25) 50%, #ffffff 100%)',
          borderTop: '1px solid #e2e8f0',
        }}
      >
        <div style={{ maxWidth: 1140, margin: '0 auto', textAlign: 'center' }}>
          
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 14px',
              background: '#eaf2ff',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              borderRadius: 999,
              marginBottom: 16,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }} />
            <span style={{ color: '#2563eb', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Pricing
            </span>
          </div>

          <Typography.Title
            level={2}
            style={{
              color: '#0c0d10',
              fontSize: isMobile ? 24 : 34,
              fontWeight: 800,
              letterSpacing: '-0.025em',
              margin: '0 0 8px',
            }}
          >
            Simple, transparent pricing
          </Typography.Title>
          <Typography.Paragraph style={{ color: '#5b5f6b', fontSize: 14.5, maxWidth: 540, margin: '0 auto 22px' }}>
            Get started with a full-access 7-day free trial. Upgrade anytime to keep conversations flowing.
          </Typography.Paragraph>

          {/* Billing Cycle + Currency Switcher */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 28 }}>
            <Segmented
              options={[
                { label: 'Monthly', value: 'monthly' },
                { label: 'Annual (Save 25%)', value: 'annual' },
              ]}
              value={billingCycle}
              onChange={setBillingCycle}
              style={{
                background: '#eff6ff',
                padding: 3,
                borderRadius: 10,
                color: '#0c0d10',
                fontWeight: 600,
                fontSize: 13,
                border: '1px solid #dbeafe',
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
                background: '#eff6ff',
                padding: 3,
                borderRadius: 10,
                color: '#0c0d10',
                fontWeight: 600,
                fontSize: 13,
                border: '1px solid #dbeafe',
              }}
            />
          </div>

          <Row gutter={[24, 24]} justify="center" align="stretch">
            {/* 1. 7-Day Free Trial Plan */}
            <Col xs={24} md={12} lg={8}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 20,
                  padding: '26px 22px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  textAlign: 'left',
                  boxShadow: '0 4px 16px -2px rgba(12, 13, 16, 0.03)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#93c5fd';
                  e.currentTarget.style.boxShadow = '0 12px 30px -4px rgba(37, 99, 235, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = '0 4px 16px -2px rgba(12, 13, 16, 0.03)';
                }}
              >
                <div style={{ fontWeight: 700, color: '#0c0d10', fontSize: 16 }}>7-Day Free Trial</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#0c0d10', margin: '8px 0 2px', letterSpacing: '-0.03em' }}>
                  {currency === 'INR' ? '₹0' : '$0'}{' '}
                  <span style={{ fontSize: 13, color: '#6b707c', fontWeight: 400 }}>/ 7 days free</span>
                </div>
                <div style={{ color: '#5b5f6b', fontSize: 13, marginBottom: 14, lineHeight: 1.45 }}>
                  Full access to all features free for 7 days. Test on your website with zero risk.
                </div>
                <Divider style={{ borderColor: '#f1f5f9', margin: '0 0 14px' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20, fontSize: 13, color: '#0c0d10' }}>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> <b>Full Access for 7 Days</b></div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> 1 Active Store</div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> Unlimited Live Chats</div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> Automated Sales Triggers</div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> Canned Replies & Shortcuts</div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> Sound & Desktop Alerts</div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> Standard Web Chat Widget</div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> "Powered by Chatral" Badge</div>
                </div>
                <button
                  onClick={() => nav('/login?mode=signup')}
                  className="btn-brand-secondary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    height: 42,
                    borderRadius: 10,
                    fontSize: 13.5,
                    fontFamily: 'inherit',
                  }}
                >
                  <RollText text="Start 7-Day Free Trial" secondaryColor="#1d4ed8" />
                </button>
                <div style={{ textAlign: 'center', fontSize: 11.5, color: '#9aa0ac', marginTop: 8 }}>
                  No credit card required
                </div>
              </div>
            </Col>

            {/* 2. Starter Growth Plan (Most Popular) */}
            <Col xs={24} md={12} lg={8}>
              <div
                style={{
                  background: '#ffffff',
                  border: '2px solid #2563eb',
                  borderRadius: 20,
                  padding: '26px 22px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  textAlign: 'left',
                  position: 'relative',
                  boxShadow: '0 16px 36px -8px rgba(37, 99, 235, 0.22)',
                }}
              >
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)' }}>
                  <span
                    style={{
                      background: '#2563eb',
                      color: '#ffffff',
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: '4px 14px',
                      borderRadius: 999,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)',
                    }}
                  >
                    Most Popular
                  </span>
                </div>
                <div style={{ fontWeight: 700, color: '#2563eb', fontSize: 16 }}>Starter Growth</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#0c0d10', margin: '8px 0 2px', letterSpacing: '-0.03em' }}>
                  {currency === 'INR'
                    ? (billingCycle === 'annual' ? `₹${Math.round(planPricing.STARTER.annualPriceINR / 12)}` : `₹${planPricing.STARTER.monthlyPriceINR}`)
                    : (billingCycle === 'annual' ? `$${Math.round(planPricing.STARTER.annualPriceUSD / 12)}` : `$${planPricing.STARTER.monthlyPriceUSD}`)}{' '}
                  <span style={{ fontSize: 13, color: '#6b707c', fontWeight: 400 }}>/ month</span>
                </div>
                <div style={{ color: '#5b5f6b', fontSize: 13, marginBottom: 14, lineHeight: 1.45 }}>
                  {billingCycle === 'annual'
                    ? (currency === 'INR' ? `Billed annually at ₹${planPricing.STARTER.annualPriceINR.toLocaleString('en-IN')}/yr (Save 25%). Multi-store with zero branding.` : `Billed annually at $${planPricing.STARTER.annualPriceUSD}/yr. Multi-store with zero branding.`)
                    : 'Everything you need to turn visitors into buyers with multi-store and no branding.'}
                </div>
                <Divider style={{ borderColor: '#f1f5f9', margin: '0 0 14px' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20, fontSize: 13, color: '#0c0d10' }}>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> <b>3 Active Stores</b></div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> Unlimited Live Chats</div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> Automated Sales Triggers</div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> Canned Replies & Shortcuts</div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> Sound & Desktop Alerts</div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> Shopify & WooCommerce Integration</div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> <b>Remove "Powered by Chatral" Badge</b></div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> Priority 24/7 Support</div>
                </div>
                <button
                  onClick={() => handlePurchasePlan('STARTER')}
                  className="btn-brand-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    height: 42,
                    borderRadius: 10,
                    fontSize: 13.5,
                    fontFamily: 'inherit',
                  }}
                >
                  <RollText text="Buy Starter Growth" />
                </button>
                <div style={{ textAlign: 'center', fontSize: 11.5, color: '#9aa0ac', marginTop: 8 }}>
                  Instant access • Cancel anytime
                </div>
              </div>
            </Col>

            {/* 3. Business & Scale Plan */}
            <Col xs={24} md={12} lg={8}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 20,
                  padding: '26px 22px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  textAlign: 'left',
                  boxShadow: '0 4px 16px -2px rgba(12, 13, 16, 0.03)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#93c5fd';
                  e.currentTarget.style.boxShadow = '0 12px 30px -4px rgba(37, 99, 235, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = '0 4px 16px -2px rgba(12, 13, 16, 0.03)';
                }}
              >
                <div style={{ fontWeight: 700, color: '#0c0d10', fontSize: 16 }}>Business & Scale</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#0c0d10', margin: '8px 0 2px', letterSpacing: '-0.03em' }}>
                  {currency === 'INR'
                    ? (billingCycle === 'annual' ? `₹${Math.round(planPricing.BUSINESS.annualPriceINR / 12)}` : `₹${planPricing.BUSINESS.monthlyPriceINR}`)
                    : (billingCycle === 'annual' ? `$${Math.round(planPricing.BUSINESS.annualPriceUSD / 12)}` : `$${planPricing.BUSINESS.monthlyPriceUSD}`)}{' '}
                  <span style={{ fontSize: 13, color: '#6b707c', fontWeight: 400 }}>/ month</span>
                </div>
                <div style={{ color: '#5b5f6b', fontSize: 13, marginBottom: 14, lineHeight: 1.45 }}>
                  {billingCycle === 'annual'
                    ? (currency === 'INR' ? `Billed annually at ₹${planPricing.BUSINESS.annualPriceINR.toLocaleString('en-IN')}/yr (Save 25%). For high-volume stores & scaling teams.` : `Billed annually at $${planPricing.BUSINESS.annualPriceUSD}/yr (Save 25%). For high-volume stores & scaling teams.`)
                    : 'For high-volume stores, scaling agencies & teams needing dedicated onboarding support.'}
                </div>
                <Divider style={{ borderColor: '#f1f5f9', margin: '0 0 14px' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20, fontSize: 13, color: '#0c0d10' }}>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> <b>Unlimited Active Stores</b></div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> Unlimited Team Members & Roles</div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> Everything in Starter Growth</div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> <b>1-on-1 Setup & Onboarding Support</b></div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> Custom CSS & Brand White-labeling</div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> Advanced Analytics & Reports Export</div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> Dedicated Account Manager</div>
                  <div><CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} /> WhatsApp & Priority Phone Support</div>
                </div>
                <button
                  onClick={() => handlePurchasePlan('BUSINESS')}
                  className="btn-brand-secondary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    height: 42,
                    borderRadius: 10,
                    fontSize: 13.5,
                    fontFamily: 'inherit',
                  }}
                >
                  <RollText text="Buy Business & Scale" secondaryColor="#1d4ed8" />
                </button>
                <div style={{ textAlign: 'center', fontSize: 11.5, color: '#9aa0ac', marginTop: 8 }}>
                  Includes 1-on-1 setup • Priority support
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* 7. FAQ Section (Centered, Clean & Spacious with Hero Blue Ambient Glow) */}
      <section
        id="faq"
        style={{
          padding: isMobile ? '48px 16px' : '72px 24px',
          background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(219, 234, 254, 0.4) 0%, rgba(240, 247, 255, 0.2) 50%, #ffffff 100%)',
          borderTop: '1px solid #e2e8f0',
        }}
      >
        <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
          
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 14px',
              background: '#eaf2ff',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              borderRadius: 999,
              marginBottom: 16,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }} />
            <span style={{ color: '#2563eb', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              FAQ
            </span>
          </div>

          {/* Title */}
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
            Frequently asked questions
          </Typography.Title>

          {/* Description */}
          <Typography.Paragraph
            style={{
              color: '#5b5f6b',
              fontSize: isMobile ? 14.5 : 16,
              lineHeight: 1.6,
              maxWidth: 540,
              margin: '0 auto 40px',
              fontWeight: 400,
            }}
          >
            Everything you need to know about Chatral and getting started.
          </Typography.Paragraph>

          {/* Accordion Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
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
                    borderColor: isOpen ? '#93c5fd' : '#e2e8f0',
                    borderRadius: 16,
                    padding: '20px 24px',
                    cursor: 'pointer',
                    boxShadow: isOpen
                      ? '0 8px 24px -4px rgba(37, 99, 235, 0.1)'
                      : '0 2px 8px -2px rgba(12, 13, 16, 0.03)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isOpen) e.currentTarget.style.borderColor = '#93c5fd';
                  }}
                  onMouseLeave={(e) => {
                    if (!isOpen) e.currentTarget.style.borderColor = '#e2e8f0';
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
                        color: isOpen ? '#2563eb' : '#0c0d10',
                        fontWeight: 600,
                        fontSize: 15.5,
                        letterSpacing: '-0.01em',
                        transition: 'color 0.15s ease',
                      }}
                    >
                      {item.q}
                    </span>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: isOpen ? '#eff6ff' : '#f1f5f9',
                        color: isOpen ? '#2563eb' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        fontWeight: 500,
                        flexShrink: 0,
                        transform: isOpen ? 'rotate(45deg)' : 'none',
                        transition: 'all 0.24s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    >
                      +
                    </div>
                  </div>

                  {/* Smooth animated accordion drawer using CSS Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateRows: isOpen ? '1fr' : '0fr',
                      transition: 'grid-template-rows 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    <div style={{ overflow: 'hidden' }}>
                      <div
                        style={{
                          marginTop: 14,
                          paddingTop: 14,
                          borderTop: '1px solid #f1f5f9',
                          color: '#5b5f6b',
                          fontSize: 14,
                          lineHeight: 1.65,
                          fontWeight: 400,
                          opacity: isOpen ? 1 : 0,
                          transform: isOpen ? 'translateY(0)' : 'translateY(-6px)',
                          transition: 'opacity 0.25s ease, transform 0.25s ease',
                        }}
                      >
                        {item.a}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. Contact Us Form Section */}
      <section
        id="contact"
        style={{
          padding: isMobile ? '56px 20px 64px' : '88px 32px 96px',
          background: 'radial-gradient(ellipse 90% 60% at 50% 0%, rgba(219, 234, 254, 0.45) 0%, rgba(240, 247, 255, 0.25) 50%, #ffffff 100%)',
          borderTop: '1px solid #e2e8f0',
          position: 'relative',
        }}
      >
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <Row gutter={[isMobile ? 32 : 56, 32]} align="top">
            {/* Left Column: Context, Reassurance & Direct Contacts */}
            <Col xs={24} lg={11}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 14px',
                  background: '#eaf2ff',
                  border: '1px solid rgba(37, 99, 235, 0.2)',
                  borderRadius: 999,
                  marginBottom: 18,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }} />
                <span style={{ color: '#2563eb', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Get in touch
                </span>
              </div>

              <Typography.Title
                level={2}
                style={{
                  color: '#0c0d10',
                  fontSize: isMobile ? 30 : 42,
                  fontWeight: 800,
                  letterSpacing: '-0.035em',
                  lineHeight: 1.15,
                  margin: '0 0 16px',
                }}
              >
                Let’s talk about growing your customer conversations.
              </Typography.Title>

              <Typography.Paragraph
                style={{
                  color: '#5b5f6b',
                  fontSize: isMobile ? 15 : 16,
                  lineHeight: 1.6,
                  margin: '0 0 32px',
                  fontWeight: 400,
                }}
              >
                Have questions about custom plans, installation, or high-volume stores?
                Send us a note and our team will get back to you within a few hours.
              </Typography.Paragraph>

              {/* Direct Info without boxes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 18 }}>
                {/* 1. Direct Email */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: '#eff6ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                      Direct Email
                    </div>
                    <a
                      href="mailto:chatral.official@gmail.com"
                      style={{ fontSize: 15.5, fontWeight: 600, color: '#0f172a', textDecoration: 'none', transition: 'color 0.15s ease' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#2563eb')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#0f172a')}
                    >
                      chatral.official@gmail.com
                    </a>
                  </div>
                </div>

                {/* 2. Response Time */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: '#eff6ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                      Response Time
                    </div>
                    <div style={{ fontSize: 15.5, fontWeight: 600, color: '#0f172a' }}>
                      24/7 Priority Support
                    </div>
                  </div>
                </div>

                {/* 3. Setup Support */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: '#eff6ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                      Setup Support
                    </div>
                    <div style={{ fontSize: 15.5, fontWeight: 600, color: '#0f172a' }}>
                      1-on-1 Setup Support
                    </div>
                  </div>
                </div>
              </div>
            </Col>

            {/* Right Column: Clean, Interactive Contact Form Card */}
            <Col xs={24} lg={13}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #dbeafe',
                  borderRadius: 24,
                  padding: isMobile ? '32px 20px' : '44px 38px',
                  boxShadow: '0 20px 48px -12px rgba(37, 99, 235, 0.14)',
                  position: 'relative',
                }}
              >
                {contactSubmitted ? (
                  <div style={{ textAlign: 'center', padding: '36px 12px' }}>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        background: '#dcfce7',
                        color: '#16a34a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 26,
                        margin: '0 auto 18px',
                      }}
                    >
                      ✓
                    </div>
                    <h3 style={{ fontSize: 22, fontWeight: 700, color: '#0c0d10', marginBottom: 8 }}>
                      Message sent successfully!
                    </h3>
                    <p style={{ color: '#64748b', fontSize: 14.5, lineHeight: 1.5, maxWidth: 380, margin: '0 auto 24px' }}>
                      Thank you for reaching out. A Chatral team member will get back to you at your email address shortly.
                    </p>
                    <button
                      onClick={() => setContactSubmitted(false)}
                      className="btn-brand-secondary"
                      style={{ padding: '10px 22px', fontSize: 14, height: 40 }}
                    >
                      <RollText text="Send another message" secondaryColor="#1d4ed8" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit}>
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                        Full Name <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        id="contact-name-input"
                        type="text"
                        required
                        placeholder="John Doe"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: 10,
                          border: '1.5px solid #e2e8f0',
                          background: '#f8fafc',
                          fontSize: 14,
                          fontFamily: 'inherit',
                          outline: 'none',
                          transition: 'all 0.18s ease',
                          color: '#0f172a',
                        }}
                        onFocus={(e) => {
                          e.target.style.background = '#ffffff';
                          e.target.style.borderColor = '#2563eb';
                          e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)';
                        }}
                        onBlur={(e) => {
                          e.target.style.background = '#f8fafc';
                          e.target.style.borderColor = '#e2e8f0';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 20 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                          Email Address <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="john@example.com"
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '11px 14px',
                            borderRadius: 10,
                            border: '1.5px solid #e2e8f0',
                            background: '#f8fafc',
                            fontSize: 14,
                            fontFamily: 'inherit',
                            outline: 'none',
                            transition: 'all 0.18s ease',
                            color: '#0f172a',
                          }}
                          onFocus={(e) => {
                            e.target.style.background = '#ffffff';
                            e.target.style.borderColor = '#2563eb';
                            e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)';
                          }}
                          onBlur={(e) => {
                            e.target.style.background = '#f8fafc';
                            e.target.style.borderColor = '#e2e8f0';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                          Company / Website (optional)
                        </label>
                        <input
                          type="text"
                          placeholder="acme.com"
                          value={contactForm.company}
                          onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '11px 14px',
                            borderRadius: 10,
                            border: '1.5px solid #e2e8f0',
                            background: '#f8fafc',
                            fontSize: 14,
                            fontFamily: 'inherit',
                            outline: 'none',
                            transition: 'all 0.18s ease',
                            color: '#0f172a',
                          }}
                          onFocus={(e) => {
                            e.target.style.background = '#ffffff';
                            e.target.style.borderColor = '#2563eb';
                            e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)';
                          }}
                          onBlur={(e) => {
                            e.target.style.background = '#f8fafc';
                            e.target.style.borderColor = '#e2e8f0';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                    </div>

                    {/* Topic / Purpose Selection using CustomSelect */}
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                        What can we help you with?
                      </label>
                      <CustomSelect
                        value={contactForm.topic}
                        onChange={(val) => setContactForm({ ...contactForm, topic: val })}
                        options={[
                          'Schedule a Live Demo',
                          'Custom Plan & Pricing',
                          'Shopify & Integration Setup',
                          'General Support',
                        ]}
                      />
                    </div>

                    <div style={{ marginBottom: 24 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                        Your Message <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Tell us what you need help with..."
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: 10,
                          border: '1.5px solid #e2e8f0',
                          background: '#f8fafc',
                          fontSize: 14,
                          fontFamily: 'inherit',
                          outline: 'none',
                          transition: 'all 0.18s ease',
                          color: '#0f172a',
                          resize: 'vertical',
                        }}
                        onFocus={(e) => {
                          e.target.style.background = '#ffffff';
                          e.target.style.borderColor = '#2563eb';
                          e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)';
                        }}
                        onBlur={(e) => {
                          e.target.style.background = '#f8fafc';
                          e.target.style.borderColor = '#e2e8f0';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={contactSubmitting}
                      className="btn-brand-primary"
                      style={{
                        width: '100%',
                        padding: '13px 28px',
                        height: 48,
                        fontSize: 15,
                        borderRadius: 12,
                        fontFamily: 'inherit',
                      }}
                    >
                      <RollText text={contactSubmitting ? 'Sending...' : 'Send Message'} />
                      <svg className="btn-arrow-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </button>
                  </form>
                )}
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* 10. Relatik Signature Footer with Official Chatral Logo - Spacious & Interactive */}
      <footer
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f8faff 100%)',
          borderTop: '1px solid #eef2f6',
          padding: isMobile ? '64px 20px 40px' : '96px 32px 52px',
        }}
      >
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          {/* Top Row: Brand on Left, 3 Nav Columns on Right */}
          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: isMobile ? 40 : 64,
            }}
          >
            {/* Left Column: Official Chatral Brand Logo + Tagline + Live System Status */}
            <div style={{ maxWidth: 360 }}>
              <a href="/" onClick={handleLogoClick} style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', cursor: 'pointer' }}>
                <ChatralFullLogo height={isMobile ? 32 : 38} dark={false} />
              </a>
              <div style={{ color: '#64748b', fontSize: 14.5, lineHeight: 1.6, marginTop: 18 }}>
                The calm, fast customer messaging and live chat platform built for teams that care about relationships.
              </div>
            </div>

            {/* Right Group: Product, Company, Legal Columns */}
            <div
              style={{
                display: 'flex',
                gap: isMobile ? 40 : 96,
                flexWrap: 'wrap',
              }}
            >
              {/* Product */}
              <div style={{ minWidth: 120 }}>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 18 }}>
                  Product
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                  <a onClick={() => scrollTo('features')} className="footer-nav-link">
                    Features
                  </a>
                  <a onClick={() => scrollTo('how-it-works')} className="footer-nav-link">
                    How it works
                  </a>
                  <a onClick={() => scrollTo('pricing')} className="footer-nav-link">
                    Pricing
                  </a>
                </div>
              </div>

              {/* Company */}
              <div style={{ minWidth: 120 }}>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 18 }}>
                  Company
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                  <a onClick={() => scrollTo('testimonials')} className="footer-nav-link">
                    Testimonials
                  </a>
                  <a onClick={() => scrollTo('faq')} className="footer-nav-link">
                    FAQ
                  </a>
                  <a onClick={() => scrollTo('contact')} className="footer-nav-link">
                    Contact us
                  </a>
                </div>
              </div>

              {/* Legal */}
              <div style={{ minWidth: 120 }}>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 18 }}>
                  Legal
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                  <Link to="/privacy" className="footer-nav-link">
                    Privacy policy
                  </Link>
                  <Link to="/terms" className="footer-nav-link">
                    Terms of service
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Divider */}
          <div style={{ borderTop: '1px solid #eef2f6', margin: '52px 0 28px' }} />

          {/* Bottom Copyright, Back to Top, and Social Icons */}
          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'flex-start' : 'center',
              gap: 18,
            }}
          >
            <div style={{ color: '#94a3b8', fontSize: 13, fontWeight: 400 }}>
              &copy; {new Date().getFullYear()} Chatral. All rights reserved. • Built for high-growth modern teams.
            </div>

            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              {/* Back to top button */}
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'color 0.15s ease',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#2563eb')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
              >
                Back to top ↑
              </button>

              {/* Social Icons (Instagram and LinkedIn) - Perfectly Matched Size & Stroke */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  style={{
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: '#f1f5f9',
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#e1306c';
                    e.currentTarget.style.background = '#fdf2f8';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#64748b';
                    e.currentTarget.style.background = '#f1f5f9';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                </a>

                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                  style={{
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: '#f1f5f9',
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#0a66c2';
                    e.currentTarget.style.background = '#eff6ff';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#64748b';
                    e.currentTarget.style.background = '#f1f5f9';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect width="4" height="12" x="2" y="9" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Callout Pill pointing to the Chatral Live Chat Widget (Desktop Only) */}
      {!isMobile && showWidgetPill && !isWidgetOpen && typeof document !== 'undefined' && createPortal(
        <div
          onClick={handleOpenLiveWidget}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleOpenLiveWidget()}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 88,
            zIndex: 2147482990,
            background: '#ffffff',
            border: '1.5px solid #2563eb',
            borderRadius: 999,
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 10px 28px -4px rgba(15, 23, 42, 0.2), 0 2px 6px rgba(0, 0, 0, 0.05)',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            animation: 'chatralFloat 3s ease-in-out infinite, pillFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            userSelect: 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 12px 28px -4px rgba(37, 99, 235, 0.28)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 10px 28px -4px rgba(15, 23, 42, 0.2), 0 2px 6px rgba(0, 0, 0, 0.05)';
          }}
        >
          {/* Pill text */}
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>
            💬 See Chatral live in action!
          </span>

          {/* Pointing Arrow (Desktop) */}
          {!isMobile && (
            <span style={{ color: '#2563eb', fontWeight: 700, fontSize: 13, marginLeft: 2 }}>
              →
            </span>
          )}

          {/* Dismiss ✕ Button */}
          <button
            onClick={handleDismissPill}
            aria-label="Dismiss"
            title="Dismiss"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: 12,
              padding: '2px 4px',
              marginLeft: 2,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#0f172a')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
          >
            ✕
          </button>
        </div>,
        document.body
      )}


      {/* Global subtle float, pulse & smooth entrance keyframes */}
      <style>{`
        html {
          scroll-behavior: smooth;
        }
        section[id] {
          scroll-margin-top: 86px;
        }
        .hero-fade-item-1 {
          animation: heroFadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.04s both;
        }
        .hero-fade-item-2 {
          animation: heroFadeUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
        }
        .hero-fade-item-3 {
          animation: heroFadeUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.18s both;
        }
        @keyframes heroFadeUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pillFadeIn {
          from {
            opacity: 0;
            transform: translateX(10px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        @keyframes chatralFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        @keyframes chatralPing {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
