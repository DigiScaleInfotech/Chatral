import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckOutlined, ArrowRightOutlined,
  ThunderboltOutlined, ShopOutlined, TeamOutlined,
  DollarOutlined, CheckCircleFilled, MessageOutlined,
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
    document.title = 'Chatral vs Tidio: The Modern, Fast Alternative | Official Comparison';

    let metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc?.getAttribute('content') || '';
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Compare Chatral vs Tidio. See why modern stores switch to Chatral for 80% lower pricing (₹508/mo vs $29/mo), an 18x lighter 67KB widget, and 3 included stores.'
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
      note: 'No extra per-seat fees or penalties',
    },
    {
      feature: 'Live Chat Conversations',
      chatral: 'Unlimited',
      tidio: 'Capped or Pay-per-chat',
      winner: 'chatral',
      highlight: false,
      note: 'Zero chat quotas or sudden overage bills',
    },
    {
      feature: 'Widget Script Size (Speed)',
      chatral: '⚡ ~67 KB (Ultra-fast)',
      tidio: '⚠️ ~1,200 KB (1.2 MB Heavy)',
      winner: 'chatral',
      highlight: true,
      note: 'Zero penalty on Google Core Web Vitals',
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
      chatral: 'Included (1-click switch)',
      tidio: 'Separate logins required',
      winner: 'chatral',
      highlight: false,
      note: 'Manage all brand inboxes in one single browser tab',
    },
    {
      feature: 'Shopify & WooCommerce Setup',
      chatral: '1-Click Embed Snippet',
      tidio: 'Supported',
      winner: 'tie',
      highlight: false,
      note: 'Both install cleanly across popular platforms',
    },
    {
      feature: 'Free Trial Terms',
      chatral: '7 Days Full Access (No Card)',
      tidio: '7 Days Limited Features',
      winner: 'chatral',
      highlight: false,
      note: 'Instant setup without entering billing info',
    },
    {
      feature: 'VIP Customer Support',
      chatral: 'Priority WhatsApp & Email (24/7)',
      tidio: 'Standard Email Queue',
      winner: 'chatral',
      highlight: false,
      note: 'Direct WhatsApp assistance whenever you need help',
    },
  ];

  const faqs = [
    {
      q: 'Why should I switch from Tidio to Chatral?',
      a: 'Chatral gives you everything you need to sell and support customers over live chat, without the bloated software or high monthly fees. For ₹508/mo ($6/mo), you get 3 stores, 3 team seats, and unlimited conversations. Tidio starts at $29/mo (approx ₹2,450/mo) for just 1 store and 1 seat. In addition, Chatral’s 67 KB widget keeps your store noticeably faster.',
    },
    {
      q: 'How long does it take to switch from Tidio to Chatral?',
      a: 'It takes less than 2 minutes. Simply remove the Tidio script from your store theme or app manager, and paste the 1-line Chatral snippet into your site header. All your agent accounts, colors, greetings, and multi-store settings are ready immediately.',
    },
    {
      q: 'Will Chatral slow down my store’s loading speed?',
      a: 'No. One of the main reasons store owners leave Tidio is its heavy ~1.2 MB script that drags down Google PageSpeed and mobile performance. Chatral’s embed script is engineered to be featherlight at ~67 KB and loads completely asynchronously with zero layout shifts.',
    },
    {
      q: 'Can I test Chatral without a credit card?',
      a: 'Yes, 100%. Chatral offers a 7-day full-access free trial. No credit card or payment details are required to get started.',
    },
  ];

  return (
    <div style={{ background: '#fcfcfd', color: '#0f172a', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', minHeight: '100vh' }}>
      
      {/* 1. Header Navigation */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #e2e8f0',
          padding: '0 24px',
        }}
      >
        <div
          style={{
            maxWidth: 1060,
            margin: '0 auto',
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
              <ChatralFullLogo height={28} />
            </Link>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#2563eb',
                background: '#eff6ff',
                padding: '3px 8px',
                borderRadius: 6,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Comparison
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link
              to="/#pricing"
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                color: '#475569',
                textDecoration: 'none',
              }}
            >
              Pricing
            </Link>
            <button
              onClick={handleStartFree}
              style={{
                height: 38,
                padding: '0 18px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13.5,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
              }}
            >
              Start Free Trial <ArrowRightOutlined style={{ fontSize: 11 }} />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section
        style={{
          padding: isMobile ? '44px 20px 32px 20px' : '64px 24px 44px 24px',
          textAlign: 'center',
          maxWidth: 920,
          margin: '0 auto',
        }}
      >
        {/* Pill Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            color: '#2563eb',
            fontSize: 11.5,
            fontWeight: 700,
            padding: '4px 12px',
            borderRadius: 999,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: 20,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }} />
          Official Comparison • Updated 2026
        </div>

        {/* Main Title */}
        <h1
          style={{
            fontSize: isMobile ? 30 : 46,
            fontWeight: 800,
            lineHeight: 1.18,
            color: '#0f172a',
            letterSpacing: '-0.03em',
            marginBottom: 16,
          }}
        >
          Chatral vs Tidio
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: isMobile ? 16 : 18,
            lineHeight: 1.6,
            color: '#475569',
            maxWidth: 680,
            margin: '0 auto 28px auto',
          }}
        >
          A transparent comparison of pricing, widget performance, multi-store capabilities, and support — built to help you choose the best live chat for your store.
        </p>

        {/* 3 Core Highlight Badges */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 32,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: '8px 16px',
              fontSize: 13,
              color: '#334155',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            }}
          >
            <DollarOutlined style={{ color: '#16a34a' }} />
            <span>Save 80% on Monthly Cost</span>
          </div>

          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: '8px 16px',
              fontSize: 13,
              color: '#334155',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            }}
          >
            <ThunderboltOutlined style={{ color: '#2563eb' }} />
            <span>18x Lighter Widget (67 KB vs 1.2 MB)</span>
          </div>

          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: '8px 16px',
              fontSize: 13,
              color: '#334155',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            }}
          >
            <ShopOutlined style={{ color: '#d97706' }} />
            <span>3 Stores Included vs 1 Store</span>
          </div>
        </div>

        {/* Dual Hero CTA Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={handleStartFree}
            style={{
              height: 44,
              padding: '0 24px',
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 6px 16px -2px rgba(37, 99, 235, 0.35)',
            }}
          >
            Start 7-Day Free Trial <ArrowRightOutlined style={{ fontSize: 12 }} />
          </button>
          <button
            onClick={handleWhatsApp}
            style={{
              height: 44,
              padding: '0 20px',
              background: '#ffffff',
              color: '#15803d',
              border: '1.5px solid #bbf7d0',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <MessageOutlined style={{ color: '#16a34a' }} /> Chat on WhatsApp
          </button>
        </div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 12 }}>
          ✓ 7-Day Full Access • No Credit Card Required • Setup in 2 Minutes
        </div>
      </section>

      {/* 3. Comparison Table Container */}
      <section style={{ maxWidth: 960, margin: '0 auto', padding: isMobile ? '20px 16px 40px 16px' : '24px 24px 60px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 8 }}>
            Feature by Feature Breakdown
          </h2>
          <p style={{ fontSize: 14.5, color: '#64748b', margin: 0 }}>
            See why high-growth e-commerce stores are choosing Chatral over Tidio.
          </p>
        </div>

        <div
          style={{
            overflowX: 'auto',
            borderRadius: 16,
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.06)',
          }}
        >
          <table
            style={{
              width: '100%',
              minWidth: 640,
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: 14,
            }}
          >
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '16px 20px', width: '36%', fontWeight: 700, color: '#475569' }}>
                  Comparison Criteria
                </th>
                <th
                  style={{
                    padding: '16px 20px',
                    width: '34%',
                    fontWeight: 800,
                    color: '#2563eb',
                    background: '#eff6ff',
                    borderLeft: '2px solid #2563eb',
                    borderRight: '2px solid #2563eb',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Chatral 🚀</span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        background: '#2563eb',
                        color: '#ffffff',
                        padding: '2px 8px',
                        borderRadius: 999,
                        textTransform: 'uppercase',
                      }}
                    >
                      Best Value
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
                    background: row.highlight ? '#faf5ff00' : idx % 2 === 0 ? '#ffffff' : '#fafafa',
                  }}
                >
                  <td style={{ padding: '15px 20px', fontWeight: 600, color: '#0f172a' }}>
                    <div>{row.feature}</div>
                    <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2, fontWeight: 400 }}>
                      {row.note}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: '15px 20px',
                      fontWeight: 700,
                      color: row.highlight ? '#15803d' : '#2563eb',
                      background: row.highlight ? '#f0fdf4' : '#eff6ff',
                      borderLeft: '2px solid #2563eb',
                      borderRight: '2px solid #2563eb',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircleFilled style={{ color: '#16a34a', fontSize: 13 }} />
                      <span>{row.chatral}</span>
                    </div>
                  </td>
                  <td style={{ padding: '15px 20px', color: '#475569' }}>
                    <span>{row.tidio}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Four Core Reasons Grid */}
      <section style={{ maxWidth: 960, margin: '0 auto', padding: isMobile ? '20px 16px 40px 16px' : '20px 24px 60px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 8 }}>
            4 Reasons to Choose Chatral Over Tidio
          </h2>
          <p style={{ fontSize: 14.5, color: '#64748b', margin: 0 }}>
            Built specifically to solve the biggest pain points e-commerce merchants experience with legacy chat tools.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: 20,
          }}
        >
          {/* Card 1 */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              padding: 24,
              boxShadow: '0 4px 12px -2px rgba(15, 23, 42, 0.04)',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                marginBottom: 14,
              }}
            >
              <DollarOutlined />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
              1. Save 80% every month without hidden penalties
            </div>
            <div style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6 }}>
              Tidio’s starter plan begins at $29/mo (₹2,450+) and charges extra as soon as your conversation volume or seats grow. Chatral gives you 3 team seats, 3 active stores, and unlimited chats for just ₹508/mo ($6/mo).
            </div>
          </div>

          {/* Card 2 */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              padding: 24,
              boxShadow: '0 4px 12px -2px rgba(15, 23, 42, 0.04)',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: '#f0fdf4',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                marginBottom: 14,
              }}
            >
              <ThunderboltOutlined />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
              2. 18x lighter widget script (67 KB vs 1.2 MB)
            </div>
            <div style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6 }}>
              Heavy chat widgets slow down mobile pages and hurt conversion rates. Tidio downloads nearly 1.2 MB of scripts on every visitor hit. Chatral is ultra-optimized under 67 KB, preserving your store’s Google Speed Score.
            </div>
          </div>

          {/* Card 3 */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              padding: 24,
              boxShadow: '0 4px 12px -2px rgba(15, 23, 42, 0.04)',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: '#fffbeb',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                marginBottom: 14,
              }}
            >
              <ShopOutlined />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
              3. Multi-Store management under 1 single login
            </div>
            <div style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6 }}>
              If you operate more than one store or client brand, Tidio forces you to buy separate subscriptions or switch browser tabs constantly. With Chatral, manage up to 3 active stores from one unified dashboard.
            </div>
          </div>

          {/* Card 4 */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              padding: 24,
              boxShadow: '0 4px 12px -2px rgba(15, 23, 42, 0.04)',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: '#faf5ff',
                color: '#9333ea',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                marginBottom: 14,
              }}
            >
              <TeamOutlined />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
              4. Direct 24/7 WhatsApp VIP Support
            </div>
            <div style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6 }}>
              Tired of waiting hours for standard email support tickets? Chatral offers priority WhatsApp assistance directly to our engineering leads, so any store customization or question is solved in minutes.
            </div>
          </div>
        </div>
      </section>

      {/* 5. Annual Savings Breakdown Card */}
      <section style={{ maxWidth: 960, margin: '0 auto', padding: isMobile ? '20px 16px 40px 16px' : '20px 24px 60px 24px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)',
            border: '1.5px solid #86efac',
            borderRadius: 16,
            padding: isMobile ? '24px 18px' : '32px 36px',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
          }}
        >
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
              Real-World Annual Savings
            </div>
            <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
              Save over ₹22,900+ every year
            </div>
            <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, maxWidth: 540 }}>
              Tidio Starter costs $348/year (~₹29,000) for 1 store and 1 seat. Chatral costs ₹6,100/year (₹508/mo) with 3 stores and 3 seats included. That’s an 80% annual savings on your bottom line.
            </div>
          </div>

          <div style={{ textAlign: isMobile ? 'center' : 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#15803d', lineHeight: 1 }}>
              ₹22,900+
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, marginBottom: 14 }}>
              Average annual savings per business
            </div>
            <button
              onClick={handleStartFree}
              style={{
                height: 42,
                padding: '0 20px',
                background: '#15803d',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Start Free Trial →
            </button>
          </div>
        </div>
      </section>

      {/* 6. FAQ Section */}
      <section style={{ maxWidth: 840, margin: '0 auto', padding: isMobile ? '20px 16px 40px 16px' : '20px 24px 60px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h2 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 8 }}>
            Frequently Asked Questions
          </h2>
          <p style={{ fontSize: 14.5, color: '#64748b', margin: 0 }}>
            Everything you need to know about switching from Tidio to Chatral.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '20px 22px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              }}
            >
              <div style={{ fontSize: 15.5, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                {faq.q}
              </div>
              <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.65 }}>
                {faq.a}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Bottom Conversion Banner */}
      <section style={{ maxWidth: 960, margin: '0 auto', padding: isMobile ? '20px 16px 60px 16px' : '20px 24px 80px 24px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            borderRadius: 18,
            padding: isMobile ? '32px 20px' : '44px 40px',
            textAlign: 'center',
            boxShadow: '0 16px 36px -8px rgba(15, 23, 42, 0.25)',
          }}
        >
          <div style={{ fontSize: isMobile ? 22 : 30, fontWeight: 800, marginBottom: 10, letterSpacing: '-0.02em' }}>
            Ready to switch to a faster, 80% cheaper live chat?
          </div>
          <div style={{ fontSize: 14.5, color: '#94a3b8', maxWidth: 540, margin: '0 auto 24px auto', lineHeight: 1.6 }}>
            Join smart store owners who saved thousands on customer support without sacrificing any features.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={handleStartFree}
              style={{
                height: 44,
                padding: '0 24px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              Start 7-Day Free Trial <ArrowRightOutlined style={{ fontSize: 12 }} />
            </button>
            <button
              onClick={handleWhatsApp}
              style={{
                height: 44,
                padding: '0 20px',
                background: 'rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <MessageOutlined style={{ color: '#4ade80' }} /> Talk on WhatsApp
            </button>
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 14 }}>
            ✓ 7-Day Full Access • No Credit Card Required • Setup in 2 Minutes
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer
        style={{
          borderTop: '1px solid #e2e8f0',
          background: '#ffffff',
          padding: '24px 20px',
          fontSize: 13,
          color: '#64748b',
        }}
      >
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>© 2026 Chatral. All rights reserved. Built for modern high-growth stores.</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link to="/" style={{ color: '#64748b', textDecoration: 'none' }}>Home</Link>
            <Link to="/#pricing" style={{ color: '#64748b', textDecoration: 'none' }}>Pricing</Link>
            <Link to="/privacy" style={{ color: '#64748b', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link to="/terms" style={{ color: '#64748b', textDecoration: 'none' }}>Terms of Service</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
