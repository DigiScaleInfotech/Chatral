import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Collapse, Typography, Row, Col } from 'antd';
import {
  CheckOutlined, CloseOutlined, ArrowRightOutlined,
  ThunderboltOutlined, ShopOutlined, TeamOutlined,
  DollarOutlined, SafetyCertificateOutlined,
} from '@ant-design/icons';
import { ChatralFullLogo } from '../components/BrandLogo.jsx';

export default function CompareTidio() {
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));
  const nav = useNavigate();

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    window.scrollTo(0, 0);

    // Update document title and description for SEO
    const prevTitle = document.title;
    document.title = 'Chatral vs Tidio - The #1 Affordable, Faster Alternative | Save 80%';
    
    let metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc?.getAttribute('content') || '';
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Looking for an affordable Tidio alternative? Chatral gives you 3 active stores, 3 team agents, and unlimited live chat for just ₹508/mo ($6/mo). Start your 7-day free trial.'
      );
    }

    return () => {
      window.removeEventListener('resize', onResize);
      document.title = prevTitle;
      if (metaDesc && prevDesc) metaDesc.setAttribute('content', prevDesc);
    };
  }, []);

  const handleStartFree = () => {
    nav('/login?mode=signup');
  };

  const handleWhatsApp = () => {
    window.open(
      'https://wa.me/919978987181?text=' +
        encodeURIComponent('Hi Chatral team, I am interested in switching from Tidio to Chatral. Please share details.'),
      '_blank'
    );
  };

  const comparisonFeatures = [
    {
      feature: 'Starting Price (Monthly)',
      chatral: '₹508 / mo ($6/mo)',
      tidio: '$29 / mo (~₹2,450/mo)',
      winner: 'chatral',
      highlight: true,
      note: 'Chatral is 80% cheaper every month',
    },
    {
      feature: 'Active Stores Included',
      chatral: '3 Active Stores',
      tidio: '1 Store only',
      winner: 'chatral',
      highlight: true,
      note: 'Run 3 stores under 1 single account',
    },
    {
      feature: 'Team Member Seats',
      chatral: '3 Team Agents',
      tidio: '1–2 Seats max',
      winner: 'chatral',
      highlight: true,
      note: 'No extra per-seat penalties',
    },
    {
      feature: 'Live Chat Conversations',
      chatral: 'Unlimited',
      tidio: 'Capped or Pay-per-chat',
      winner: 'chatral',
      highlight: false,
      note: 'Never worry about message quotas',
    },
    {
      feature: 'Widget Script Size (Speed)',
      chatral: '⚡ ~67 KB (Ultra-fast)',
      tidio: '⚠️ ~1,200 KB (1.2 MB Heavy)',
      winner: 'chatral',
      highlight: true,
      note: 'Zero impact on your store’s Google speed score',
    },
    {
      feature: 'Automated Sales Triggers',
      chatral: 'Included Free',
      tidio: 'Paid Flow Add-on ($29+/mo)',
      winner: 'chatral',
      highlight: false,
      note: 'Exit-intent and cart-abandonment greetings included',
    },
    {
      feature: 'Multi-Store Unified Inbox',
      chatral: 'Included',
      tidio: 'Not available (Separate logins)',
      winner: 'chatral',
      highlight: false,
      note: 'Switch between stores with one click',
    },
    {
      feature: 'Shopify & WooCommerce Integration',
      chatral: 'Instant 1-Click Embed',
      tidio: 'Supported',
      winner: 'tie',
      highlight: false,
      note: 'Works seamlessly on any site or CMS',
    },
    {
      feature: 'Free Trial',
      chatral: '7 Days Full Access (No Card)',
      tidio: '7 Days Limited Features',
      winner: 'chatral',
      highlight: false,
      note: 'Instant setup with zero commitment',
    },
    {
      feature: 'Support & Onboarding',
      chatral: 'Priority 24/7 WhatsApp & Email',
      tidio: 'Standard Email Queue',
      winner: 'chatral',
      highlight: false,
      note: 'Instant WhatsApp assistance when you need help',
    },
  ];

  const faqs = [
    {
      q: 'Why is Chatral a better alternative to Tidio?',
      a: 'Chatral is built specifically for modern e-commerce stores and fast-growing businesses who want the core power of live chat without overpaying. Tidio charges $29/mo (approx ₹2,450+) for just 1 seat and 1 store, while Chatral provides 3 active stores, 3 team agents, and unlimited chats for only ₹508/month ($6/mo). Furthermore, Chatral’s script is only ~67 KB compared to Tidio’s heavy ~1.2 MB script, keeping your store blazing fast.',
    },
    {
      q: 'How much money will I save by switching from Tidio to Chatral?',
      a: 'A typical business using Tidio pays between $348 to $700+ per year. With Chatral’s Starter Growth plan at ₹508/mo (billed annually at ₹6,100/yr), you save over ₹22,000+ (approx $280+) every single year while getting multi-store support and more team seats.',
    },
    {
      q: 'Will Chatral slow down my Shopify or WordPress site?',
      a: 'No! One of the biggest complaints store owners have with Tidio is its massive ~1.2 MB bundle size, which hurts Google Core Web Vitals and slows down product pages. Chatral’s widget is engineered from the ground up to be ultra-lightweight at just ~67 KB, resulting in zero noticeable impact on page load speed.',
    },
    {
      q: 'How hard is it to switch from Tidio to Chatral?',
      a: 'It takes less than 2 minutes! Simply remove the Tidio script tag from your store theme or app manager, and paste the 1-line Chatral embed snippet. All your customizations, colors, greetings, and agent seats are set up instantly in Chatral’s intuitive dashboard.',
    },
    {
      q: 'Can I manage multiple e-commerce stores in one Chatral account?',
      a: 'Yes! Unlike Tidio, where you often need separate subscriptions or logins for different domains, Chatral Starter Growth includes 3 active stores natively with a unified multi-tenant inbox.',
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#ffffff',
        color: '#0c0d10',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {/* 1. Header Navbar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid #e2e8f0',
          padding: isMobile ? '0 16px' : '0 32px',
        }}
      >
        <div
          style={{
            maxWidth: 1140,
            margin: '0 auto',
            height: isMobile ? 64 : 74,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
            <ChatralFullLogo height={isMobile ? 30 : 36} dark={false} />
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Link
              to="/#pricing"
              style={{
                color: '#475569',
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                display: isMobile ? 'none' : 'inline-block',
              }}
            >
              Pricing
            </Link>
            <Button
              type="primary"
              onClick={handleStartFree}
              style={{
                height: 40,
                padding: '0 20px',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                background: '#2563eb',
              }}
            >
              Start Free Trial →
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section
        style={{
          padding: isMobile ? '48px 18px 40px' : '72px 24px 60px',
          background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37, 99, 235, 0.14) 0%, rgba(255, 255, 255, 1) 100%)',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 840, margin: '0 auto' }}>
          {/* Tag Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: 999,
              marginBottom: 20,
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563eb' }} />
            <span style={{ color: '#2563eb', fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Tidio Alternative • Save 80%
            </span>
          </div>

          {/* Main Title */}
          <Typography.Title
            level={1}
            style={{
              fontSize: isMobile ? 32 : 48,
              fontWeight: 800,
              letterSpacing: '-0.035em',
              lineHeight: 1.18,
              color: '#0f172a',
              margin: '0 0 18px',
            }}
          >
            Tidio pricing getting too expensive? <br />
            <span style={{ color: '#2563eb' }}>Meet Chatral.</span>
          </Typography.Title>

          {/* Subtitle */}
          <Typography.Paragraph
            style={{
              fontSize: isMobile ? 15 : 18,
              color: '#475569',
              lineHeight: 1.6,
              maxWidth: 680,
              margin: '0 auto 32px',
            }}
          >
            Get <strong>3 active stores</strong>, <strong>3 team agents</strong>, and <strong>unlimited live chats</strong> for just <strong>₹508/month ($6/mo)</strong> instead of Tidio’s $29/mo (₹2,450+). No per-seat penalties, no bloated scripts.
          </Typography.Paragraph>

          {/* Dual Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 22 }}>
            <Button
              type="primary"
              size="large"
              onClick={handleStartFree}
              style={{
                height: 48,
                padding: '0 28px',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                background: '#2563eb',
                boxShadow: '0 10px 24px -4px rgba(37, 99, 235, 0.4)',
              }}
            >
              Start 7-Day Free Trial (No Card)
            </Button>
            <Button
              size="large"
              onClick={handleWhatsApp}
              style={{
                height: 48,
                padding: '0 24px',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600,
                color: '#15803d',
                borderColor: '#22c55e',
                background: '#f0fdf4',
              }}
            >
              Chat on WhatsApp 💬
            </Button>
          </div>

          {/* Micro Trust Indicators */}
          <div style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span>✓ 7-Day Full Access Trial</span>
            <span>✓ Zero Credit Card Required</span>
            <span>✓ Setup in under 2 minutes</span>
          </div>
        </div>
      </section>

      {/* 3. Deep Dive Comparison Table */}
      <section style={{ padding: isMobile ? '36px 16px' : '56px 24px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em', margin: '0 0 10px' }}>
              Feature by Feature: Chatral vs Tidio
            </h2>
            <p style={{ fontSize: 15, color: '#64748b', margin: 0 }}>
              See why hundreds of store owners are switching to Chatral for their daily customer conversations.
            </p>
          </div>

          {/* Comparison Table Box */}
          <div
            style={{
              overflowX: 'auto',
              borderRadius: 16,
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 12px 30px -8px rgba(15, 23, 42, 0.08)',
            }}
          >
            <table style={{ width: '100%', minWidth: 620, borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '16px 20px', width: '38%', fontWeight: 700, color: '#334155' }}>
                    Comparison Criteria
                  </th>
                  <th
                    style={{
                      padding: '16px 20px',
                      width: '32%',
                      fontWeight: 800,
                      color: '#2563eb',
                      background: '#eff6ff',
                      borderLeft: '2px solid #2563eb',
                      borderRight: '2px solid #2563eb',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 16 }}>Chatral 🚀</span>
                      <span style={{ fontSize: 10, background: '#2563eb', color: '#fff', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>
                        BEST VALUE
                      </span>
                    </div>
                  </th>
                  <th style={{ padding: '16px 20px', width: '30%', fontWeight: 700, color: '#475569' }}>
                    Tidio
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((row, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: row.highlight ? '#fcfdfe' : '#ffffff',
                    }}
                  >
                    <td style={{ padding: '16px 20px', color: '#0f172a', fontWeight: 600 }}>
                      <div>{row.feature}</div>
                      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 400, marginTop: 2 }}>{row.note}</div>
                    </td>
                    <td
                      style={{
                        padding: '16px 20px',
                        fontWeight: 700,
                        color: row.winner === 'chatral' ? '#15803d' : '#0f172a',
                        background: '#eff6ff',
                        borderLeft: '2px solid #2563eb',
                        borderRight: '2px solid #2563eb',
                        borderBottom: idx === comparisonFeatures.length - 1 ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      }}
                    >
                      <CheckOutlined style={{ color: '#2563eb', marginRight: 6 }} />
                      {row.chatral}
                    </td>
                    <td style={{ padding: '16px 20px', color: '#64748b' }}>
                      {row.tidio}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 4. Why Make the Switch: 4 Core Advantages */}
      <section style={{ padding: isMobile ? '48px 18px' : '72px 24px', background: '#ffffff' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 32 : 48 }}>
            <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', margin: '0 0 12px' }}>
              4 Reasons to choose Chatral over Tidio
            </h2>
            <p style={{ fontSize: 16, color: '#64748b', maxWidth: 580, margin: '0 auto' }}>
              Tidio has become a bloated, complex tool with escalating pricing tiers. Here is how Chatral solves it.
            </p>
          </div>

          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <div
                style={{
                  padding: 26,
                  borderRadius: 16,
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  height: '100%',
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 16 }}>
                  <DollarOutlined />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                  1. Save 80% every month without hidden penalties
                </h3>
                <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                  Tidio’s starter plan begins at $29/mo (₹2,450+) and charges extra as soon as your chat volume or seats grow. Chatral gives you 3 full team seats, 3 active stores, and unlimited chats for just ₹508/mo.
                </p>
              </div>
            </Col>

            <Col xs={24} md={12}>
              <div
                style={{
                  padding: 26,
                  borderRadius: 16,
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  height: '100%',
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 16 }}>
                  <ThunderboltOutlined />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                  2. 18x lighter widget script (67 KB vs 1.2 MB)
                </h3>
                <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                  Heavy chat widgets kill e-commerce conversion rates. Tidio downloads nearly 1.2 MB of scripts on every product page. Chatral is built with ultra-optimized zero-bloat code under 67 KB, preserving your store’s Google Speed Score.
                </p>
              </div>
            </Col>

            <Col xs={24} md={12}>
              <div
                style={{
                  padding: 26,
                  borderRadius: 16,
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  height: '100%',
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 16 }}>
                  <ShopOutlined />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                  3. Multi-Store management under 1 roof
                </h3>
                <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                  If you operate more than one store or client brand, Tidio forces you to purchase multiple subscriptions or constantly switch tabs. With Chatral, manage up to 3 active stores with a single unified dashboard.
                </p>
              </div>
            </Col>

            <Col xs={24} md={12}>
              <div
                style={{
                  padding: 26,
                  borderRadius: 16,
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  height: '100%',
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fae8ff', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 16 }}>
                  <TeamOutlined />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                  4. Direct 24/7 WhatsApp VIP Support
                </h3>
                <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                  Tired of waiting hours for standard email support tickets? Chatral offers priority WhatsApp assistance directly to our engineering and support leads, so any store issue is resolved in minutes.
                </p>
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* 5. FAQs Section */}
      <section style={{ padding: isMobile ? '48px 18px' : '64px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h2 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em', margin: '0 0 8px' }}>
              Frequently Asked Questions
            </h2>
            <p style={{ fontSize: 15, color: '#64748b', margin: 0 }}>
              Everything you need to know about switching from Tidio to Chatral.
            </p>
          </div>

          <Collapse
            bordered={false}
            size="large"
            items={faqs.map((faq, i) => ({
              key: String(i),
              label: <span style={{ fontWeight: 600, fontSize: 15, color: '#0f172a' }}>{faq.q}</span>,
              children: <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{faq.a}</p>,
            }))}
            style={{ background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0' }}
          />
        </div>
      </section>

      {/* 6. Final High-Converting Bottom Banner */}
      <section style={{ padding: isMobile ? '48px 18px' : '72px 24px', background: '#ffffff' }}>
        <div
          style={{
            maxWidth: 960,
            margin: '0 auto',
            background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
            borderRadius: 24,
            padding: isMobile ? '36px 20px' : '52px 48px',
            color: '#ffffff',
            textAlign: 'center',
            boxShadow: '0 20px 40px -12px rgba(37, 99, 235, 0.45)',
          }}
        >
          <h2 style={{ fontSize: isMobile ? 26 : 38, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', margin: '0 0 14px' }}>
            Ready to switch to a faster, 80% cheaper live chat?
          </h2>
          <p style={{ fontSize: isMobile ? 15 : 17, color: 'rgba(255, 255, 255, 0.9)', maxWidth: 560, margin: '0 auto 28px', lineHeight: 1.6 }}>
            Join smart store owners who saved thousands on customer support without sacrificing any features.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <Button
              size="large"
              onClick={handleStartFree}
              style={{
                height: 50,
                padding: '0 32px',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 700,
                color: '#2563eb',
                background: '#ffffff',
                border: 'none',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              }}
            >
              Start 7-Day Free Trial →
            </Button>
            <Button
              size="large"
              onClick={handleWhatsApp}
              style={{
                height: 50,
                padding: '0 26px',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600,
                color: '#ffffff',
                background: 'rgba(255, 255, 255, 0.15)',
                borderColor: 'rgba(255, 255, 255, 0.35)',
              }}
            >
              Talk on WhatsApp 💬
            </Button>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.75)', marginTop: 18 }}>
            No credit card required • Cancel anytime • 2-minute setup
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '32px 24px' }}>
        <div
          style={{
            maxWidth: 1140,
            margin: '0 auto',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            fontSize: 13,
            color: '#64748b',
          }}
        >
          <div>
            © {new Date().getFullYear()} Chatral. All rights reserved. • Built for modern high-growth stores.
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link to="/" style={{ color: '#64748b', textDecoration: 'none' }}>Home</Link>
            <Link to="/privacy" style={{ color: '#64748b', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link to="/terms" style={{ color: '#64748b', textDecoration: 'none' }}>Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
