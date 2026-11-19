import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckOutlined, CloseOutlined, ArrowRightOutlined,
  ThunderboltOutlined, ShopOutlined, TeamOutlined,
  DollarOutlined, SafetyCertificateOutlined,
  ClockCircleOutlined, CalendarOutlined, ShareAltOutlined,
  CheckCircleFilled, BookOutlined, MessageOutlined,
} from '@ant-design/icons';
import { ChatralFullLogo } from '../components/BrandLogo.jsx';

export default function CompareTidio() {
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));
  const [scrollProgress, setScrollProgress] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    const onScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (windowHeight > 0) {
        setScrollProgress((totalScroll / windowHeight) * 100);
      }
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.scrollTo(0, 0);

    // Update document title and description for SEO
    const prevTitle = document.title;
    document.title = 'Chatral vs Tidio (2026 Review): Why E-Commerce Brands Are Switching | Chatral Blog';

    let metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc?.getAttribute('content') || '';
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'An in-depth 2026 comparison between Chatral and Tidio. Compare pricing, widget script speed (67KB vs 1.2MB), multi-store support, and customer satisfaction.'
      );
    }

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
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
        encodeURIComponent('Hi Chatral team, I just read your Chatral vs Tidio comparison guide. I would like to learn more about switching to Chatral.'),
      '_blank'
    );
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const comparisonFeatures = [
    {
      feature: 'Starting Price (Monthly)',
      chatral: '₹508 / mo ($6/mo)',
      tidio: '$29 / mo (~₹2,450/mo)',
      chatralWon: true,
      note: 'Chatral is 80% cheaper every month',
    },
    {
      feature: 'Active Stores Included',
      chatral: '3 Active Stores',
      tidio: '1 Store only',
      chatralWon: true,
      note: 'Run 3 stores under 1 unified account',
    },
    {
      feature: 'Team Member Seats',
      chatral: '3 Team Agents',
      tidio: '1–2 Seats max',
      chatralWon: true,
      note: 'Zero extra per-seat fees',
    },
    {
      feature: 'Live Chat Conversations',
      chatral: 'Unlimited',
      tidio: 'Capped or Pay-per-chat',
      chatralWon: true,
      note: 'Zero message limits or sudden overage charges',
    },
    {
      feature: 'Widget Script Size (Speed)',
      chatral: '⚡ ~67 KB (Ultra-fast)',
      tidio: '⚠️ ~1,200 KB (1.2 MB Heavy)',
      chatralWon: true,
      note: 'Zero penalty on Google Core Web Vitals',
    },
    {
      feature: 'Automated Sales Triggers',
      chatral: 'Included in all plans',
      tidio: 'Paid Flow Add-on ($29+/mo)',
      chatralWon: true,
      note: 'Cart abandonment & exit-intent triggers free',
    },
    {
      feature: 'Multi-Store Unified Inbox',
      chatral: 'Included (1-click switch)',
      tidio: 'Separate logins required',
      chatralWon: true,
      note: 'Manage all brand inboxes in one single browser tab',
    },
    {
      feature: 'Shopify & WooCommerce Setup',
      chatral: '1-Click Embed Snippet',
      tidio: 'Supported',
      chatralWon: false,
      note: 'Both install cleanly across popular platforms',
    },
    {
      feature: 'Free Trial Terms',
      chatral: '7 Days Full Access (No Card)',
      tidio: '7 Days Limited Features',
      chatralWon: true,
      note: 'Instant access without entering billing info',
    },
    {
      feature: 'VIP Customer Support',
      chatral: 'Priority WhatsApp & Email (24/7)',
      tidio: 'Standard Email Support Queue',
      chatralWon: true,
      note: 'Direct WhatsApp assistance whenever you need help',
    },
  ];

  return (
    <div style={{ background: '#fcfcfd', color: '#1e293b', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', minHeight: '100vh' }}>
      
      {/* 1. Top Reading Scroll Progress Bar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: `${scrollProgress}%`,
          height: 3,
          background: 'linear-gradient(90deg, #2563eb, #38bdf8)',
          zIndex: 9999,
          transition: 'width 0.1s ease-out',
        }}
      />

      {/* 2. Blog Header / Navigation */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid #e2e8f0',
          padding: '0 24px',
        }}
      >
        <div
          style={{
            maxWidth: 1080,
            margin: '0 auto',
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
              <ChatralFullLogo height={28} />
            </Link>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#2563eb',
                background: '#eff6ff',
                padding: '2px 8px',
                borderRadius: 6,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Blog & Insights
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
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
                height: 36,
                padding: '0 16px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#1d4ed8')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#2563eb')}
            >
              Start Free Trial <ArrowRightOutlined style={{ fontSize: 11 }} />
            </button>
          </div>
        </div>
      </header>

      {/* 3. Main Editorial Article Wrapper */}
      <main style={{ maxWidth: 840, margin: '0 auto', padding: isMobile ? '28px 18px 80px 18px' : '48px 24px 100px 24px' }}>
        
        {/* Breadcrumb Navigation */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b', marginBottom: 20 }}>
          <Link to="/" style={{ color: '#64748b', textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          <span style={{ color: '#64748b' }}>Articles</span>
          <span>/</span>
          <span style={{ color: '#0f172a', fontWeight: 600 }}>Chatral vs Tidio</span>
        </nav>

        {/* Category Badge & Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: '#0284c7',
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              padding: '3px 10px',
              borderRadius: 999,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Software Comparison • 2026 Edition
          </span>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>•</span>
          <span style={{ fontSize: 13, color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <ClockCircleOutlined style={{ fontSize: 12 }} /> 6 min read
          </span>
        </div>

        {/* Blog Post Title (H1) */}
        <h1
          style={{
            fontSize: isMobile ? 28 : 40,
            fontWeight: 800,
            lineHeight: 1.25,
            color: '#0f172a',
            letterSpacing: '-0.03em',
            marginBottom: 16,
          }}
        >
          Chatral vs Tidio (2026 In-Depth Review): Why Growing E-Commerce Brands Are Switching
        </h1>

        {/* Subtitle / Standfirst */}
        <p
          style={{
            fontSize: isMobile ? 16 : 19,
            lineHeight: 1.6,
            color: '#475569',
            marginBottom: 26,
            fontWeight: 400,
          }}
        >
          An honest, benchmark-backed breakdown of pricing, widget performance (67 KB vs 1.2 MB), multi-store management, and customer support between Chatral and Tidio.
        </p>

        {/* Author Byline & Social Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 14,
            padding: '16px 0',
            borderTop: '1px solid #e2e8f0',
            borderBottom: '1px solid #e2e8f0',
            marginBottom: 36,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563eb, #60a5fa)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
              }}
            >
              C
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                Chatral E-Commerce Research Team
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Updated: November 2026 • Verified & Benchmarked
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handleShare}
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 12.5,
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <ShareAltOutlined /> {copiedLink ? 'Link Copied! ✓' : 'Share Article'}
            </button>
          </div>
        </div>

        {/* Executive Summary / "Quick Takeaway" Callout Box */}
        <div
          style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)',
            border: '1.5px solid #bfdbfe',
            borderRadius: 14,
            padding: isMobile ? '20px 18px' : '24px 26px',
            marginBottom: 40,
            boxShadow: '0 4px 14px -2px rgba(37, 99, 235, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <ThunderboltOutlined style={{ color: '#2563eb', fontSize: 18 }} />
            <span style={{ fontSize: 15, fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Quick Summary (TL;DR)
            </span>
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.65, color: '#1e293b', margin: 0 }}>
            If you want a lightweight live chat app that won’t slow down your Shopify or WooCommerce store, includes <strong>3 active stores</strong> and <strong>3 team seats</strong> right out of the box, and saves you over <strong>₹22,000+ ($280+) every year</strong>, <strong>Chatral is the clear winner</strong>. Tidio remains a capable tool, but its escalating starting price ($29/mo), strict 1-store limit, and bloated ~1.2 MB script make it expensive and slow for lean, high-growth e-commerce brands.
          </p>
        </div>

        {/* Table of Contents Box */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '20px 22px',
            marginBottom: 48,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOutlined style={{ color: '#2563eb' }} /> In This Article:
          </div>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.8, color: '#2563eb' }}>
            <li>
              <a onClick={() => scrollToId('context')} style={{ color: '#2563eb', cursor: 'pointer', textDecoration: 'none' }}>
                1. Why Tidio Users Are Looking for Alternatives in 2026
              </a>
            </li>
            <li>
              <a onClick={() => scrollToId('comparison-table')} style={{ color: '#2563eb', cursor: 'pointer', textDecoration: 'none' }}>
                2. Feature-by-Feature Comparison Table (Chatral vs Tidio)
              </a>
            </li>
            <li>
              <a onClick={() => scrollToId('pricing')} style={{ color: '#2563eb', cursor: 'pointer', textDecoration: 'none' }}>
                3. Deep Dive: Real-World Pricing & True Annual Cost
              </a>
            </li>
            <li>
              <a onClick={() => scrollToId('speed')} style={{ color: '#2563eb', cursor: 'pointer', textDecoration: 'none' }}>
                4. Performance Benchmark: 67 KB vs 1.2 MB Widget Size
              </a>
            </li>
            <li>
              <a onClick={() => scrollToId('multistore')} style={{ color: '#2563eb', cursor: 'pointer', textDecoration: 'none' }}>
                5. Multi-Store Operations Under One Roof
              </a>
            </li>
            <li>
              <a onClick={() => scrollToId('support')} style={{ color: '#2563eb', cursor: 'pointer', textDecoration: 'none' }}>
                6. Customer Support: 24/7 WhatsApp VIP vs Email Queue
              </a>
            </li>
            <li>
              <a onClick={() => scrollToId('verdict')} style={{ color: '#2563eb', cursor: 'pointer', textDecoration: 'none' }}>
                7. The Final Verdict: Which Live Chat Should You Pick?
              </a>
            </li>
            <li>
              <a onClick={() => scrollToId('faq')} style={{ color: '#2563eb', cursor: 'pointer', textDecoration: 'none' }}>
                8. Frequently Asked Questions
              </a>
            </li>
          </ul>
        </div>

        {/* Article Body Content */}
        <article style={{ fontSize: 16.5, lineHeight: 1.75, color: '#334155' }}>
          
          {/* Section 1 */}
          <section id="context" style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 14 }}>
              1. Why Tidio Users Are Looking for Alternatives in 2026
            </h2>
            <p>
              Tidio has long been one of the recognized names in the customer messaging space. For years, Shopify merchants and independent website owners added Tidio to provide a basic chat bubble on their storefronts.
            </p>
            <p>
              However, in recent quarters, hundreds of store owners have taken to forums, Reddit, and Trustpilot expressing frustration over three major shifts:
            </p>
            <ol style={{ paddingLeft: 22, marginBottom: 18 }}>
              <li style={{ marginBottom: 8 }}>
                <strong>Sharp Price Hikes & Seat Penalties:</strong> Tidio shifted away from being an affordable small-business chat app. The entry-level starter plan now begins at $29/mo (approx ₹2,450/mo), with aggressive limits on seats and monthly conversation caps. If your chat volume spikes during a festive sale, your bill multiplies.
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Page Speed Degradation:</strong> As Tidio added heavier AI bot suites, its script ballooned to over <strong>1,200 KB (1.2 MB)</strong>. On mobile e-commerce storefronts, this causes measurable delays in First Contentful Paint (FCP) and hurts Google Core Web Vitals.
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>No Native Multi-Store Support:</strong> Entrepreneurs running 2 or 3 distinct Shopify stores or regional brands are forced to pay for multiple Tidio subscriptions and manage separate logins.
              </li>
            </ol>
            <p>
              This is precisely why we created <strong>Chatral</strong>: a purpose-built, high-converting live chat platform for modern e-commerce brands who want speed, transparency, and multi-store power without the enterprise price tag.
            </p>
          </section>

          {/* Section 2: Comparison Table */}
          <section id="comparison-table" style={{ marginBottom: 52 }}>
            <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 14 }}>
              2. Feature-by-Feature Comparison Table (Chatral vs Tidio)
            </h2>
            <p style={{ marginBottom: 18 }}>
              Here is a side-by-side technical and commercial breakdown between Chatral’s Starter Growth plan and Tidio’s Starter plan:
            </p>

            <div
              style={{
                overflowX: 'auto',
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.05)',
                marginBottom: 20,
              }}
            >
              <table
                style={{
                  width: '100%',
                  minWidth: 620,
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: 14,
                }}
              >
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '14px 18px', width: '38%', fontWeight: 700, color: '#475569' }}>
                      Comparison Criteria
                    </th>
                    <th
                      style={{
                        padding: '14px 18px',
                        width: '32%',
                        fontWeight: 800,
                        color: '#2563eb',
                        background: '#eff6ff',
                        borderLeft: '2px solid #2563eb',
                        borderRight: '2px solid #2563eb',
                      }}
                    >
                      Chatral 🚀
                    </th>
                    <th style={{ padding: '14px 18px', width: '30%', fontWeight: 700, color: '#475569' }}>
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
                        background: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                      }}
                    >
                      <td style={{ padding: '14px 18px', fontWeight: 600, color: '#0f172a' }}>
                        <div>{row.feature}</div>
                        <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2, fontWeight: 400 }}>
                          {row.note}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '14px 18px',
                          fontWeight: 700,
                          color: '#15803d',
                          background: '#f0fdf4',
                          borderLeft: '2px solid #2563eb',
                          borderRight: '2px solid #2563eb',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <CheckCircleFilled style={{ color: '#16a34a', fontSize: 13 }} />
                          <span>{row.chatral}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', color: '#475569' }}>
                        <span>{row.tidio}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3: Deep Dive 1 Pricing */}
          <section id="pricing" style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 14 }}>
              3. Deep Dive: Real-World Pricing & True Annual Cost
            </h2>
            <p>
              When evaluating SaaS applications, the advertised monthly headline price rarely reflects your actual credit card statement at the end of the year. Let’s look at what an e-commerce shop owner really pays over 12 months:
            </p>

            {/* Price Comparison Card */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: 16,
                margin: '24px 0',
              }}
            >
              {/* Tidio Card */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: 20,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Tidio Starter (1 Store, 1 Seat)
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '8px 0' }}>
                  $348 / year <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>(~₹29,000)</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
                  <li>$29/mo billed monthly ($348/yr)</li>
                  <li>1 single store only</li>
                  <li>1 agent seat (extra seats cost more)</li>
                  <li>Capped live conversations</li>
                </ul>
              </div>

              {/* Chatral Card */}
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1.5px solid #86efac',
                  borderRadius: 12,
                  padding: 20,
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    fontSize: 10,
                    fontWeight: 800,
                    color: '#15803d',
                    background: '#dcfce7',
                    padding: '2px 8px',
                    borderRadius: 999,
                    textTransform: 'uppercase',
                  }}
                >
                  Save 80%
                </span>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
                  Chatral Starter Growth
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#15803d', margin: '8px 0' }}>
                  ₹6,100 / year <span style={{ fontSize: 13, fontWeight: 500, color: '#166534' }}>(₹508/mo)</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#166534', lineHeight: 1.6 }}>
                  <li>3 Active Stores included</li>
                  <li>3 Team Agent seats included</li>
                  <li>Unlimited live conversations</li>
                  <li><strong>Net annual savings: Over ₹22,900+</strong></li>
                </ul>
              </div>
            </div>

            <p>
              By switching to Chatral, an e-commerce business retains an extra <strong>₹22,900+ every single year</strong>—capital that is much better spent on paid acquisition, Meta ads, or inventory expansion.
            </p>
          </section>

          {/* Section 4: Performance Benchmark */}
          <section id="speed" style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 14 }}>
              4. Performance Benchmark: 67 KB vs 1.2 MB Widget Size
            </h2>
            <p>
              In e-commerce, speed is revenue. Google’s data shows that even a 100-millisecond delay in mobile load time can decrease conversion rates by 7%.
            </p>
            <p>
              When you install a live chat app, the visitor’s browser must download, parse, and execute its JavaScript bundle before interacting with your product catalog.
            </p>

            {/* Script Size Comparison Graphic */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '22px 24px',
                margin: '24px 0',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
                JavaScript Bundle Payload Comparison
              </div>

              {/* Chatral Bar */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
                  <span style={{ color: '#2563eb' }}>Chatral Embed Widget</span>
                  <span style={{ color: '#15803d' }}>67.1 KB (Ultra-lightweight)</span>
                </div>
                <div style={{ width: '100%', height: 12, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: '6%', height: '100%', background: '#2563eb', borderRadius: 999 }} />
                </div>
              </div>

              {/* Tidio Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
                  <span style={{ color: '#64748b' }}>Tidio Chat Bundle</span>
                  <span style={{ color: '#dc2626' }}>~1,200 KB (1.2 MB Bloat)</span>
                </div>
                <div style={{ width: '100%', height: 12, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: '100%', height: '100%', background: '#ef4444', borderRadius: 999 }} />
                </div>
              </div>

              <div style={{ fontSize: 12, color: '#64748b', marginTop: 12, lineHeight: 1.5 }}>
                Chatral is <strong>18x smaller</strong> than Tidio. It loads entirely asynchronously without blocking DOM rendering or triggering mobile layout shifts.
              </div>
            </div>
          </section>

          {/* Mid-Article Editorial Callout CTA */}
          <div
            style={{
              margin: '36px 0 48px 0',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              borderRadius: 14,
              padding: isMobile ? '24px 18px' : '28px 30px',
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 20,
              boxShadow: '0 12px 28px -6px rgba(37, 99, 235, 0.35)',
            }}
          >
            <div>
              <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 800, marginBottom: 6 }}>
                Ready to speed up your store and save 80%?
              </div>
              <div style={{ fontSize: 13.5, color: '#e0e7ff', lineHeight: 1.5 }}>
                Try Chatral free for 7 days. Instant 2-minute setup, no credit card required.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={handleStartFree}
                style={{
                  height: 42,
                  padding: '0 20px',
                  background: '#ffffff',
                  color: '#2563eb',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              >
                Start Free Trial →
              </button>
              <button
                onClick={handleWhatsApp}
                style={{
                  height: 42,
                  padding: '0 16px',
                  background: '#22c55e',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Chat on WhatsApp
              </button>
            </div>
          </div>

          {/* Section 5: Multi-Store */}
          <section id="multistore" style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 14 }}>
              5. Multi-Store Operations Under One Roof
            </h2>
            <p>
              In 2026, many successful DTC founders don’t just operate a single online storefront. You might run:
            </p>
            <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
              <li>A main brand store and a separate wholesale/B2B portal.</li>
              <li>Two or three sister brands catering to different product categories.</li>
              <li>Regional stores targeting different international customer bases.</li>
            </ul>
            <p>
              With Tidio, managing two stores requires two distinct subscriptions, multiplying your monthly expenses to $58+/mo, while forcing your support agents to log in and out of different windows.
            </p>
            <p>
              <strong>Chatral solves this natively:</strong> your single Starter Growth account includes <strong>3 active stores</strong> out of the box. Your team can switch between stores with 1 click in the top menu bar, viewing customer chats and analytics seamlessly in one single tab.
            </p>
          </section>

          {/* Section 6: Customer Support */}
          <section id="support" style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 14 }}>
              6. Customer Support: 24/7 WhatsApp VIP vs Email Queue
            </h2>
            <p>
              When a flash sale is running and you need immediate help with an automated trigger or a script customization, waiting 24 to 48 hours for an email reply from an overseas support queue is unacceptable.
            </p>
            <p>
              Chatral provides direct <strong>24/7 VIP WhatsApp support</strong> (+91 9978987181). You have a direct line to our core engineering team for instant troubleshooting, onboarding help, and custom setup guidance.
            </p>
          </section>

          {/* Section 7: Final Verdict */}
          <section id="verdict" style={{ marginBottom: 54 }}>
            <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 16 }}>
              7. The Final Verdict: Which Live Chat Should You Pick?
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: 18,
                marginTop: 20,
              }}
            >
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1.5px solid #86efac',
                  borderRadius: 12,
                  padding: 22,
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 800, color: '#166534', marginBottom: 10 }}>
                  Choose Chatral If:
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: '#166534', lineHeight: 1.7 }}>
                  <li>You want an affordable plan at ₹508/mo instead of paying $29+/mo.</li>
                  <li>You manage 1 to 3 e-commerce stores.</li>
                  <li>You need 3 team seats without paying per-seat penalties.</li>
                  <li>You want a fast, ultra-light 67 KB widget for maximum PageSpeed.</li>
                  <li>You prefer direct human assistance over WhatsApp.</li>
                </ul>
              </div>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: 22,
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 800, color: '#334155', marginBottom: 10 }}>
                  Choose Tidio If:
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: '#475569', lineHeight: 1.7 }}>
                  <li>You have an enterprise budget ($300+/month) to spend on custom Lyro AI bot flows.</li>
                  <li>You only operate 1 store and do not require multi-store unification.</li>
                  <li>Your store doesn’t mind a heavier 1.2 MB JavaScript bundle.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 8: FAQ */}
          <section id="faq" style={{ marginBottom: 50 }}>
            <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 20 }}>
              8. Frequently Asked Questions
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 18 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                  How hard is it to migrate from Tidio to Chatral?
                </div>
                <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>
                  It takes under 2 minutes. Simply remove the Tidio script tag from your store’s theme (or deactivate the Tidio app) and paste your 1-line Chatral snippet into your site header.
                </div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 18 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                  Can I try Chatral without entering my credit card?
                </div>
                <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>
                  Yes! Chatral offers a 100% full-access 7-day free trial. No credit card or billing details are required to get started.
                </div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 18 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                  Does Chatral work with Shopify, WooCommerce, and custom web stores?
                </div>
                <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>
                  Yes. Chatral works seamlessly on any platform including Shopify, WooCommerce, WordPress, Magento, Webflow, Wix, or custom HTML/React stacks.
                </div>
              </div>
            </div>
          </section>
        </article>

        {/* Bottom Author Bio Box */}
        <div
          style={{
            marginTop: 40,
            padding: 24,
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 18,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563eb, #38bdf8)',
              color: '#ffffff',
              fontSize: 22,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            C
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>
              Written by Chatral Editorial
            </div>
            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
              We research customer messaging benchmarks, e-commerce conversion optimization, and live chat performance to help online merchants scale faster.
            </div>
          </div>
        </div>

        {/* Final Conversion Action Banner */}
        <div
          style={{
            marginTop: 48,
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            borderRadius: 18,
            padding: isMobile ? '32px 20px' : '40px 36px',
            textAlign: 'center',
            boxShadow: '0 16px 36px -8px rgba(15, 23, 42, 0.25)',
          }}
        >
          <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, marginBottom: 10, letterSpacing: '-0.02em' }}>
            Switch to Chatral and save ₹22,000+ this year
          </div>
          <div style={{ fontSize: 14.5, color: '#94a3b8', maxWidth: 540, margin: '0 auto 24px auto', lineHeight: 1.6 }}>
            Join smart store owners who chose faster loading speeds, 3 included stores, and dedicated 24/7 WhatsApp VIP support.
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
              <MessageOutlined style={{ color: '#4ade80' }} /> Chat on WhatsApp
            </button>
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 14 }}>
            ✓ 7-Day Full Access • Zero Credit Card Required • Setup in 2 Minutes
          </div>
        </div>

      </main>

      {/* 4. Footer */}
      <footer
        style={{
          borderTop: '1px solid #e2e8f0',
          background: '#ffffff',
          padding: '24px 20px',
          textAlign: 'center',
          fontSize: 13,
          color: '#64748b',
        }}
      >
        <div style={{ maxWidth: 840, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>© 2026 Chatral. All rights reserved.</div>
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
