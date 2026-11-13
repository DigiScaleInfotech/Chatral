import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChatralFullLogo } from '../components/BrandLogo.jsx';

export default function TermsOfService() {
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
        color: '#101828',
        fontFamily: '"Work Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {/* Top Sticky Navbar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #eaecf0',
          padding: isMobile ? '0 16px' : '0 32px',
          height: isMobile ? 66 : 76,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
          <ChatralFullLogo height={isMobile ? 32 : 38} dark={false} />
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 20 }}>
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f2f4f7', padding: '4px 6px', borderRadius: 10 }}>
              <Link
                to="/privacy"
                style={{
                  padding: '6px 14px',
                  borderRadius: 7,
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#667085',
                  textDecoration: 'none',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#101828')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#667085')}
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                style={{
                  padding: '6px 14px',
                  borderRadius: 7,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#101828',
                  background: '#ffffff',
                  boxShadow: '0 1px 3px rgba(16, 24, 40, 0.1)',
                  textDecoration: 'none',
                }}
              >
                Terms of Service
              </Link>
            </div>
          )}

          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: isMobile ? '8px 14px' : '9px 18px',
              borderRadius: 999,
              border: '1px solid #d0d5dd',
              background: '#ffffff',
              color: '#344054',
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f9fafb';
              e.currentTarget.style.borderColor = '#98a2b3';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.borderColor = '#d0d5dd';
            }}
          >
            <span>←</span>
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Hero Header */}
      <section
        style={{
          background: 'linear-gradient(180deg, #f8faff 0%, #ffffff 100%)',
          borderBottom: '1px solid #eaecf0',
          padding: isMobile ? '48px 20px 40px' : '72px 24px 56px',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 840, margin: '0 auto' }}>
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              borderRadius: 999,
              background: '#eff8ff',
              border: '1px solid #b2ddff',
              color: '#175cd3',
              fontSize: 13.5,
              fontWeight: 600,
              marginBottom: 20,
            }}
          >
            <span>⚖️</span>
            <span>Customer Agreement &amp; Master Terms</span>
          </div>

          <h1
            style={{
              fontSize: isMobile ? 34 : 48,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#101828',
              margin: '0 0 16px',
              lineHeight: 1.15,
            }}
          >
            Terms of Service
          </h1>

          <p style={{ color: '#475467', fontSize: isMobile ? 15 : 17, margin: '0 0 24px', lineHeight: 1.6 }}>
            Please read these terms carefully before accessing or using the Chatral live chat customer platform.
          </p>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 16,
              color: '#667085',
              fontSize: 14,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <span>📅 <strong>Last Updated:</strong> November 13, 2026</span>
            <span>•</span>
            <span>⚡ <strong>Effective Date:</strong> November 13, 2026</span>
            <span>•</span>
            <span>🏛️ <strong>Operator:</strong> DigiScale Infotech</span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main style={{ maxWidth: 880, margin: '0 auto', padding: isMobile ? '40px 20px 60px' : '64px 24px 90px' }}>
        {/* Quick Highlights Callout */}
        <div
          style={{
            background: 'rgba(37, 99, 235, 0.04)',
            border: '1px solid rgba(37, 99, 235, 0.18)',
            borderRadius: 16,
            padding: isMobile ? '20px' : '26px 30px',
            marginBottom: 48,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>📑</span>
            <span style={{ fontWeight: 700, fontSize: 16.5, color: '#175cd3' }}>Contract Summary</span>
          </div>
          <p style={{ color: '#344054', fontSize: 15, lineHeight: 1.7, margin: 0 }}>
            By signing up or embedding the Chatral widget, you agree to these Terms. You retain <strong>100% ownership</strong> of all your customer conversations, data, and store information. Chatral provides 99.9% targeted uptime, enterprise TLS security, and transparent month-to-month plans.
          </p>
        </div>

        {/* Section 1 */}
        <section style={{ marginBottom: 44 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#101828', letterSpacing: '-0.02em', marginBottom: 14 }}>
            1. Acceptance of Terms
          </h2>
          <p style={{ color: '#475467', fontSize: 16, lineHeight: 1.8 }}>
            By registering an account, embedding our chat widget script, or accessing the Chatral platform, you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you are entering into this agreement on behalf of a company or legal entity, you represent that you possess the requisite authority to bind such entity to these Terms.
          </p>
        </section>

        {/* Section 2 */}
        <section style={{ marginBottom: 44 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#101828', letterSpacing: '-0.02em', marginBottom: 14 }}>
            2. Description of Service
          </h2>
          <p style={{ color: '#475467', fontSize: 16, lineHeight: 1.8 }}>
            Chatral is a Software-as-a-Service customer messaging and visitor engagement platform providing real-time chat widgets, team management, automated response triggers, Shopify integrations, visitor radar tracking, and analytics tools operated by <strong>DigiScale Infotech</strong>.
          </p>
        </section>

        {/* Section 3 */}
        <section style={{ marginBottom: 44 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#101828', letterSpacing: '-0.02em', marginBottom: 14 }}>
            3. Account &amp; Security Responsibilities
          </h2>
          <p style={{ color: '#475467', fontSize: 16, lineHeight: 1.8, marginBottom: 14 }}>
            You are responsible for maintaining the confidentiality of your account login credentials, public store keys, and secret access tokens. You agree to immediately notify us of any unauthorized access or breach of security. Chatral cannot and will not be liable for any loss or damage arising from your failure to safeguard your credentials.
          </p>
          <div style={{ background: '#f9fafb', border: '1px solid #eaecf0', borderRadius: 12, padding: '16px 20px' }}>
            <span style={{ fontSize: 15, color: '#344054', lineHeight: 1.7 }}>
              🔒 <strong>Domain Whitelisting:</strong> For maximum security, we recommend keeping your <em>Allowed Website Domains</em> configured in your dashboard so third parties cannot load your store key on unauthorized sites.
            </span>
          </div>
        </section>

        {/* Section 4 */}
        <section style={{ marginBottom: 44 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#101828', letterSpacing: '-0.02em', marginBottom: 16 }}>
            4. Acceptable Use Policy
          </h2>
          <p style={{ color: '#475467', fontSize: 16, lineHeight: 1.8, marginBottom: 14 }}>
            You agree not to use the Chatral platform to:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ color: '#ef4444', fontSize: 18, lineHeight: 1.2 }}>✕</span>
              <span style={{ color: '#475467', fontSize: 15.5, lineHeight: 1.7 }}>
                Send unsolicited bulk spam communications or harass website visitors.
              </span>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ color: '#ef4444', fontSize: 18, lineHeight: 1.2 }}>✕</span>
              <span style={{ color: '#475467', fontSize: 15.5, lineHeight: 1.7 }}>
                Upload malicious code, viruses, or conduct security exploits or automated DDoS attacks.
              </span>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ color: '#ef4444', fontSize: 18, lineHeight: 1.2 }}>✕</span>
              <span style={{ color: '#475467', fontSize: 15.5, lineHeight: 1.7 }}>
                Collect, store, or transmit prohibited content, unlawful materials, or payment card numbers (PCI data) in violation of applicable laws.
              </span>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ color: '#ef4444', fontSize: 18, lineHeight: 1.2 }}>✕</span>
              <span style={{ color: '#475467', fontSize: 15.5, lineHeight: 1.7 }}>
                Attempt to reverse-engineer, decompile, or bypass the platform access controls or rate limits.
              </span>
            </div>
          </div>
        </section>

        {/* Section 5 */}
        <section style={{ marginBottom: 44 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#101828', letterSpacing: '-0.02em', marginBottom: 14 }}>
            5. Intellectual Property &amp; Customer Data Ownership
          </h2>
          <p style={{ color: '#475467', fontSize: 16, lineHeight: 1.8, marginBottom: 14 }}>
            Chatral and its logos, source code, designs, and documentation are the exclusive intellectual property of <strong>DigiScale Infotech</strong>.
          </p>
          <p style={{ color: '#475467', fontSize: 16, lineHeight: 1.8 }}>
            <strong>Your Data is Yours:</strong> You retain complete ownership and all rights to the customer transcripts, visitor data, and store assets processed through your account. We claim zero proprietary rights over your conversations.
          </p>
        </section>

        {/* Section 6 */}
        <section style={{ marginBottom: 44 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#101828', letterSpacing: '-0.02em', marginBottom: 14 }}>
            6. Service Level, Warranties &amp; Liability
          </h2>
          <p style={{ color: '#475467', fontSize: 16, lineHeight: 1.8 }}>
            Chatral targets a 99.9% service uptime across its distributed infrastructure. While we employ automated failover and enterprise monitoring, the service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. Under no circumstances shall Chatral or DigiScale Infotech be liable for indirect, incidental, or consequential damages resulting from network interruptions or lost profits.
          </p>
        </section>

        {/* Section 7 */}
        <section
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: isMobile ? '24px' : '32px 36px',
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#101828', letterSpacing: '-0.02em', marginTop: 0, marginBottom: 12 }}>
            7. Termination &amp; Cancellation
          </h2>
          <p style={{ color: '#475467', fontSize: 15.5, lineHeight: 1.7, marginBottom: 18 }}>
            You may cancel your account at any time through your dashboard or by emailing our support team. Upon cancellation, your right to use the service and embed the widget will immediately cease, and your store data will be deleted in accordance with our data retention schedule.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 15 }}>
            <div>
              <strong style={{ color: '#101828' }}>Legal &amp; Support Contact:</strong>{' '}
              <a href="mailto:digiscaleinfotech@gmail.com" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
                digiscaleinfotech@gmail.com
              </a>
            </div>
            <div>
              <strong style={{ color: '#101828' }}>Entity:</strong> DigiScale Infotech (Chatral Platform)
            </div>
          </div>
        </section>
      </main>

      {/* Prominent Unified Footer */}
      <footer style={{ background: '#ffffff', borderTop: '1px solid #ebecee', padding: isMobile ? '56px 20px 36px' : '80px 24px 44px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: isMobile ? 36 : 54,
            }}
          >
            <div style={{ maxWidth: 360 }}>
              <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
                <ChatralFullLogo height={isMobile ? 36 : 42} dark={false} />
              </Link>
              <div style={{ color: '#475467', fontSize: 17, lineHeight: 1.6, marginTop: 20 }}>
                The simple live chat for teams that care<br />about relationships.
              </div>
            </div>

            <div style={{ display: 'flex', gap: isMobile ? 44 : 96, flexWrap: 'wrap' }}>
              <div style={{ minWidth: 120 }}>
                <div style={{ fontWeight: 700, color: '#101828', fontSize: 18, marginBottom: 20 }}>Product</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 15, fontSize: 16.5 }}>
                  <Link to="/#features" style={{ color: '#475467', textDecoration: 'none' }}>Features</Link>
                  <Link to="/#how-it-works" style={{ color: '#475467', textDecoration: 'none' }}>How it works</Link>
                  <Link to="/#pricing" style={{ color: '#475467', textDecoration: 'none' }}>Pricing</Link>
                  <Link to="/#faq" style={{ color: '#475467', textDecoration: 'none' }}>FAQ</Link>
                </div>
              </div>

              <div style={{ minWidth: 120 }}>
                <div style={{ fontWeight: 700, color: '#101828', fontSize: 18, marginBottom: 20 }}>Company</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 15, fontSize: 16.5 }}>
                  <Link to="/#testimonials" style={{ color: '#475467', textDecoration: 'none' }}>Testimonials</Link>
                  <a href="mailto:digiscaleinfotech@gmail.com" style={{ color: '#475467', textDecoration: 'none' }}>Contact</a>
                </div>
              </div>

              <div style={{ minWidth: 120 }}>
                <div style={{ fontWeight: 700, color: '#101828', fontSize: 18, marginBottom: 20 }}>Legal</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 15, fontSize: 16.5 }}>
                  <Link to="/privacy" style={{ color: '#475467', textDecoration: 'none' }}>Privacy policy</Link>
                  <Link to="/terms" style={{ color: '#101828', fontWeight: 600, textDecoration: 'none' }}>Terms of service</Link>
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #ebecee', margin: '56px 0 32px' }} />

          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'flex-start' : 'center',
              gap: 16,
            }}
          >
            <div style={{ color: '#667085', fontSize: 15.5, fontWeight: 400 }}>
              &copy; {new Date().getFullYear()} Chatral. All rights reserved. &nbsp;&nbsp; Made by <span style={{ color: '#101828', fontWeight: 700 }}>DigiScale Infotech</span>
            </div>

            <div style={{ display: 'flex', gap: 22, alignItems: 'center' }}>
              <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="X (Twitter)" style={{ color: '#667085' }}>
                <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn" style={{ color: '#667085' }}>
                <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor">
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
