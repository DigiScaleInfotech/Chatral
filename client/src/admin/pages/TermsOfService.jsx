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
        color: '#0c0d10',
        fontFamily: '"Work Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {/* Standard Header matching site aesthetic */}
      <header
        style={{
          borderBottom: '1px solid #ebecee',
          padding: isMobile ? '0 16px' : '0 32px',
          height: isMobile ? 66 : 76,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#ffffff',
        }}
      >
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
          <ChatralFullLogo height={isMobile ? 32 : 38} dark={false} />
        </Link>

        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: isMobile ? '7px 14px' : '8px 18px',
            borderRadius: 999,
            border: '1px solid #d0d5dd',
            background: '#ffffff',
            color: '#344054',
            fontSize: 13.5,
            fontWeight: 500,
            textDecoration: 'none',
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
      </header>

      {/* Main Legal Content */}
      <main style={{ maxWidth: 840, margin: '0 auto', padding: isMobile ? '36px 20px 60px' : '52px 24px 80px' }}>
        {/* Simple Page Title - No extra badges or marketing text */}
        <h1
          style={{
            fontSize: isMobile ? 30 : 38,
            fontWeight: 700,
            color: '#0c0d10',
            letterSpacing: '-0.025em',
            margin: '0 0 8px',
          }}
        >
          Terms of Service
        </h1>
        <div style={{ color: '#6b707c', fontSize: 13.5, marginBottom: 28 }}>
          Last Updated: November 13, 2026 • Effective Date: November 13, 2026
        </div>

        <div style={{ borderTop: '1px solid #ebecee', marginBottom: 36 }} />

        {/* Section 1 */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 19, fontWeight: 600, color: '#0c0d10', margin: '0 0 12px' }}>
            1. Acceptance of Terms
          </h2>
          <p style={{ color: '#4b5162', fontSize: 15, lineHeight: 1.75, margin: 0 }}>
            By registering an account, embedding our chat widget script, or accessing the Chatral platform, you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you are entering into this agreement on behalf of a company, you represent that you have the authority to bind such entity.
          </p>
        </section>

        {/* Section 2 */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 19, fontWeight: 600, color: '#0c0d10', margin: '0 0 12px' }}>
            2. Description of Service
          </h2>
          <p style={{ color: '#4b5162', fontSize: 15, lineHeight: 1.75, margin: 0 }}>
            Chatral is a Software-as-a-Service customer messaging and visitor engagement platform providing real-time chat widgets, team management, automated response triggers, Shopify integrations, and visitor tracking tools operated by DigiScale Infotech.
          </p>
        </section>

        {/* Section 3 */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 19, fontWeight: 600, color: '#0c0d10', margin: '0 0 12px' }}>
            3. Account &amp; Security Responsibilities
          </h2>
          <p style={{ color: '#4b5162', fontSize: 15, lineHeight: 1.75, margin: 0 }}>
            You are responsible for maintaining the confidentiality of your account login credentials and store public/secret keys. You agree to immediately notify us of any unauthorized access or breach of security. Chatral cannot and will not be liable for any loss or damage arising from your failure to safeguard your credentials.
          </p>
        </section>

        {/* Section 4 */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 19, fontWeight: 600, color: '#0c0d10', margin: '0 0 12px' }}>
            4. Acceptable Use Policy
          </h2>
          <p style={{ color: '#4b5162', fontSize: 15, lineHeight: 1.75, margin: '0 0 10px' }}>
            You agree not to use the Chatral platform to:
          </p>
          <ul style={{ color: '#4b5162', fontSize: 15, lineHeight: 1.8, paddingLeft: 22, margin: 0 }}>
            <li>Send unsolicited bulk communications (spam) or harass website visitors.</li>
            <li>Upload malicious code, viruses, or conduct security exploits or automated DDoS attacks.</li>
            <li>Collect, store, or transmit prohibited content, unlawful materials, or payment card numbers (PCI data) in violation of applicable laws.</li>
            <li>Attempt to reverse-engineer, decompile, or bypass the platform access controls or rate limits.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 19, fontWeight: 600, color: '#0c0d10', margin: '0 0 12px' }}>
            5. Intellectual Property
          </h2>
          <p style={{ color: '#4b5162', fontSize: 15, lineHeight: 1.75, margin: 0 }}>
            Chatral and its logos, source code, designs, and documentation are the exclusive intellectual property of DigiScale Infotech. You retain all rights and ownership to the customer data, visitor conversations, and store content processed through your account.
          </p>
        </section>

        {/* Section 6 */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 19, fontWeight: 600, color: '#0c0d10', margin: '0 0 12px' }}>
            6. Service Level, Warranties &amp; Liability
          </h2>
          <p style={{ color: '#4b5162', fontSize: 15, lineHeight: 1.75, margin: 0 }}>
            Chatral provides a 99.9% targeted service uptime. While we employ automated failover and secure cloud infrastructure, the service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. Under no circumstances shall Chatral or DigiScale Infotech be liable for indirect, incidental, or consequential damages resulting from downtime, network failures, or lost profits.
          </p>
        </section>

        {/* Section 7 */}
        <section style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 19, fontWeight: 600, color: '#0c0d10', margin: '0 0 12px' }}>
            7. Termination &amp; Cancellation
          </h2>
          <p style={{ color: '#4b5162', fontSize: 15, lineHeight: 1.75, margin: '0 0 10px' }}>
            You may cancel your account at any time through your account settings or by submitting a written request. Upon termination, your right to use the service and embed the widget will immediately cease, and your store data will be deleted in accordance with our data retention schedule.
          </p>
          <div style={{ color: '#4b5162', fontSize: 15, lineHeight: 1.75 }}>
            <div>For legal inquiries regarding these terms, contact us at: <span style={{ color: '#0c0d10', fontWeight: 600 }}>digiscaleinfotech@gmail.com</span></div>
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
                  <Link to="/privacy" style={{ color: '#5b5f6b', textDecoration: 'none' }}>Privacy policy</Link>
                  <Link to="/terms" style={{ color: '#0c0d10', fontWeight: 600, textDecoration: 'none' }}>Terms of service</Link>
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
