import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChatralFullLogo } from '../components/BrandLogo.jsx';

export default function PrivacyPolicy() {
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    window.scrollTo(0, 0);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#ffffff',
        color: '#0c0d10',
        fontFamily: '"Work Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {/* 1. Header / Navbar - Exact Match to Landing Page Design */}
      <header
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
            <div style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
              <Link
                to="/#features"
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
              </Link>
              <Link
                to="/#how-it-works"
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
              </Link>
              <Link
                to="/#testimonials"
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
              </Link>
              <Link
                to="/#faq"
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
              </Link>
              <Link
                to="/#pricing"
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
              </Link>
            </div>
          )}

          {/* Right Button: Signature Black Button with Arrow */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Link
              to="/login?mode=signup"
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
                textDecoration: 'none',
                boxShadow: '0px 1px 2px 0px rgba(12, 13, 16, 0.12), inset 0px 1px 0px 0px rgba(255, 255, 255, 0.12)',
                transition: 'all 0.15s ease',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1e2025';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#0c0d10';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <span>Start Free</span>
              <span style={{ fontSize: 13 }}>→</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Legal Content */}
      <main style={{ maxWidth: 840, margin: '0 auto', padding: isMobile ? '36px 20px 60px' : '52px 24px 80px' }}>
        {/* Simple Page Title */}
        <h1
          style={{
            fontSize: isMobile ? 30 : 38,
            fontWeight: 700,
            color: '#0c0d10',
            letterSpacing: '-0.025em',
            margin: '0 0 8px',
          }}
        >
          Privacy Policy
        </h1>
        <div style={{ color: '#6b707c', fontSize: 13.5, marginBottom: 28 }}>
          Last Updated: November 13, 2026 • Effective Date: November 13, 2026
        </div>

        <div style={{ borderTop: '1px solid #ebecee', marginBottom: 36 }} />

        {/* Section 1 */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 19, fontWeight: 600, color: '#0c0d10', margin: '0 0 12px' }}>
            1. Overview &amp; Commitment
          </h2>
          <p style={{ color: '#4b5162', fontSize: 15, lineHeight: 1.75, margin: '0 0 12px' }}>
            Chatral (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), operated by DigiScale Infotech, provides real-time customer messaging, live chat widgets, and visitor analytics infrastructure for businesses (&quot;Customers&quot;). We are deeply committed to protecting your privacy and complying with global data protection laws, including the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA).
          </p>
          <p style={{ color: '#4b5162', fontSize: 15, lineHeight: 1.75, margin: 0 }}>
            This Privacy Policy explains how we collect, store, process, and safeguard information when you use our website, dashboard, APIs, or embeddable chat widgets.
          </p>
        </section>

        {/* Section 2 */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 19, fontWeight: 600, color: '#0c0d10', margin: '0 0 12px' }}>
            2. Data We Collect
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ color: '#4b5162', fontSize: 15, lineHeight: 1.75, margin: 0 }}>
              <strong style={{ color: '#0c0d10' }}>A. Account &amp; Profile Data:</strong> When you register for Chatral, we collect your name, email address, password hash, and company/store details.
            </p>
            <p style={{ color: '#4b5162', fontSize: 15, lineHeight: 1.75, margin: 0 }}>
              <strong style={{ color: '#0c0d10' }}>B. Chat &amp; Communications Data:</strong> Real-time chat messages, customer transcripts, visitor notes, offline contact submissions, attachments, and timestamps processed through the widget.
            </p>
            <p style={{ color: '#4b5162', fontSize: 15, lineHeight: 1.75, margin: 0 }}>
              <strong style={{ color: '#0c0d10' }}>C. Visitor &amp; Device Analytics:</strong> When visitors load a site running the Chatral widget, we collect anonymized technical details: browser type, operating system, approximate geographic location (city/country derived from IP), referrer source, session duration, and page views.
            </p>
            <p style={{ color: '#4b5162', fontSize: 15, lineHeight: 1.75, margin: 0 }}>
              <strong style={{ color: '#0c0d10' }}>D. Integrations Data (Shopify / CRMs):</strong> If you connect third-party platforms such as Shopify, we access customer orders, total spend, and contact tags strictly to display them to support agents during live chats.
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 19, fontWeight: 600, color: '#0c0d10', margin: '0 0 12px' }}>
            3. How We Use Information
          </h2>
          <p style={{ color: '#4b5162', fontSize: 15, lineHeight: 1.75, margin: '0 0 10px' }}>
            We use the collected information exclusively to:
          </p>
          <ul style={{ color: '#4b5162', fontSize: 15, lineHeight: 1.8, paddingLeft: 22, margin: 0 }}>
            <li>Provide, maintain, and deliver real-time chat and customer support services.</li>
            <li>Detect and prevent spam, malicious bots, and automated crawler abuse.</li>
            <li>Authenticate accounts and secure communication via encrypted WebSockets.</li>
            <li>Deliver proactive automated triggers and customer satisfaction surveys.</li>
            <li>Provide aggregate analytics and conversion tracking to store owners.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 19, fontWeight: 600, color: '#0c0d10', margin: '0 0 12px' }}>
            4. Data Retention &amp; Tenant Isolation
          </h2>
          <p style={{ color: '#4b5162', fontSize: 15, lineHeight: 1.75, margin: '0 0 10px' }}>
            All customer data is strictly tenant-isolated in our enterprise database. We do not sell, rent, or monetize your customer conversations or personal data to any third party.
          </p>
          <p style={{ color: '#4b5162', fontSize: 15, lineHeight: 1.75, margin: 0 }}>
            Each workspace can configure custom data retention schedules (e.g., 30, 90, or 365 days), after which visitor histories and attachments are permanently swept and purged from our servers.
          </p>
        </section>

        {/* Section 5 */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 19, fontWeight: 600, color: '#0c0d10', margin: '0 0 12px' }}>
            5. Your Rights Under GDPR &amp; CCPA
          </h2>
          <p style={{ color: '#4b5162', fontSize: 15, lineHeight: 1.75, margin: 0 }}>
            Depending on your location, you have the right to access, rectify, port, or request permanent deletion of all personal data held by Chatral. You can export your transcripts or delete visitor records directly from the dashboard, or contact our support team.
          </p>
        </section>

        {/* Section 6 */}
        <section style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 19, fontWeight: 600, color: '#0c0d10', margin: '0 0 12px' }}>
            6. Contact Information
          </h2>
          <p style={{ color: '#4b5162', fontSize: 15, lineHeight: 1.75, margin: '0 0 10px' }}>
            If you have any questions about this Privacy Policy or wish to exercise your data privacy rights, please contact our Data Protection Officer at:
          </p>
          <div style={{ color: '#4b5162', fontSize: 15, lineHeight: 1.75 }}>
            <div><strong style={{ color: '#0c0d10' }}>Email:</strong> digiscaleinfotech@gmail.com</div>
            <div><strong style={{ color: '#0c0d10' }}>Organization:</strong> DigiScale Infotech (Chatral Platform)</div>
          </div>
        </section>
      </main>

      {/* Unified Footer */}
      <footer style={{ background: '#ffffff', borderTop: '1px solid #ebecee', padding: isMobile ? '52px 20px 32px' : '68px 24px 36px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: isMobile ? 36 : 48,
            }}
          >
            <div style={{ maxWidth: 320 }}>
              <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
                <ChatralFullLogo height={isMobile ? 30 : 34} dark={false} />
              </Link>
              <div style={{ color: '#6b707c', fontSize: 14, lineHeight: 1.55, marginTop: 16 }}>
                The simple live chat for teams that care<br />about relationships.
              </div>
            </div>

            <div style={{ display: 'flex', gap: isMobile ? 36 : 80, flexWrap: 'wrap' }}>
              <div style={{ minWidth: 105 }}>
                <div style={{ fontWeight: 600, color: '#0c0d10', fontSize: 14.5, marginBottom: 16 }}>Product</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11, fontSize: 14 }}>
                  <Link to="/#features" style={{ color: '#5b5f6b', textDecoration: 'none' }}>Features</Link>
                  <Link to="/#how-it-works" style={{ color: '#5b5f6b', textDecoration: 'none' }}>How it works</Link>
                  <Link to="/#pricing" style={{ color: '#5b5f6b', textDecoration: 'none' }}>Pricing</Link>
                  <Link to="/#faq" style={{ color: '#5b5f6b', textDecoration: 'none' }}>FAQ</Link>
                </div>
              </div>

              <div style={{ minWidth: 105 }}>
                <div style={{ fontWeight: 600, color: '#0c0d10', fontSize: 14.5, marginBottom: 16 }}>Company</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11, fontSize: 14 }}>
                  <Link to="/#testimonials" style={{ color: '#5b5f6b', textDecoration: 'none' }}>Testimonials</Link>
                  <a href="mailto:digiscaleinfotech@gmail.com" style={{ color: '#5b5f6b', textDecoration: 'none' }}>Contact</a>
                </div>
              </div>

              <div style={{ minWidth: 105 }}>
                <div style={{ fontWeight: 600, color: '#0c0d10', fontSize: 14.5, marginBottom: 16 }}>Legal</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11, fontSize: 14 }}>
                  <Link to="/privacy" style={{ color: '#0c0d10', fontWeight: 600, textDecoration: 'none' }}>Privacy policy</Link>
                  <Link to="/terms" style={{ color: '#5b5f6b', textDecoration: 'none' }}>Terms of service</Link>
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #ebecee', margin: '44px 0 24px' }} />

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
