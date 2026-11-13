import { Link } from 'react-router-dom';
import { Card, Flex, Typography, Button, Divider } from 'antd';
import { ArrowLeftOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { ChatralFullLogo } from '../components/BrandLogo.jsx';
import { BRAND } from '../theme.js';

export default function PrivacyPolicy() {
  return (
    <div style={{ minHeight: '100vh', background: '#0b0f19', color: '#f8fafc', padding: '32px 16px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        {/* Header */}
        <Flex justify="space-between" align="center" style={{ marginBottom: 32 }}>
          <Link to="/landing">
            <ChatralFullLogo height={32} dark={true} />
          </Link>
          <Link to="/landing">
            <Button type="text" icon={<ArrowLeftOutlined />} style={{ color: '#94a3b8' }}>
              Back to Home
            </Button>
          </Link>
        </Flex>

        {/* Card Content */}
        <Card
          bordered={false}
          style={{
            background: '#131b2e',
            border: '1px solid #1e293b',
            borderRadius: 16,
            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)',
            color: '#cbd5e1',
          }}
          bodyStyle={{ padding: '36px 32px' }}
        >
          <Flex align="center" gap={10} style={{ marginBottom: 8 }}>
            <SafetyCertificateOutlined style={{ fontSize: 24, color: '#38bdf8' }} />
            <Typography.Title level={2} style={{ color: '#ffffff', margin: 0 }}>
              Privacy Policy
            </Typography.Title>
          </Flex>
          <Typography.Text style={{ color: '#64748b', fontSize: 13, display: 'block', marginBottom: 24 }}>
            Last Updated: November 13, 2026 • Effective Date: November 13, 2026
          </Typography.Text>

          <Divider style={{ borderColor: '#1e293b', margin: '16px 0 24px' }} />

          <section style={{ marginBottom: 28 }}>
            <Typography.Title level={4} style={{ color: '#f1f5f9', marginTop: 0 }}>
              1. Overview & Commitment
            </Typography.Title>
            <Typography.Paragraph style={{ color: '#94a3b8', lineHeight: 1.7 }}>
              Chatral (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), operated by DigiScale Infotech, provides real-time customer messaging, live chat widgets, and visitor analytics infrastructure for businesses (&quot;Customers&quot;). We are deeply committed to protecting your privacy and complying with global data protection laws, including the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA).
            </Typography.Paragraph>
            <Typography.Paragraph style={{ color: '#94a3b8', lineHeight: 1.7 }}>
              This Privacy Policy explains how we collect, store, process, and safeguard information when you use our website, dashboard, APIs, or embeddable chat widgets.
            </Typography.Paragraph>
          </section>

          <section style={{ marginBottom: 28 }}>
            <Typography.Title level={4} style={{ color: '#f1f5f9' }}>
              2. Data We Collect
            </Typography.Title>
            <Typography.Paragraph style={{ color: '#94a3b8', lineHeight: 1.7 }}>
              <b>A. Account & Profile Data:</b> When you register for Chatral, we collect your name, email address, password hash, and company/store details.
            </Typography.Paragraph>
            <Typography.Paragraph style={{ color: '#94a3b8', lineHeight: 1.7 }}>
              <b>B. Chat & Communications Data:</b> Real-time chat messages, customer transcripts, visitor notes, offline contact submissions, attachments, and timestamps processed through the widget.
            </Typography.Paragraph>
            <Typography.Paragraph style={{ color: '#94a3b8', lineHeight: 1.7 }}>
              <b>C. Visitor & Device Analytics:</b> When visitors load a site running the Chatral widget, we collect anonymized technical details: browser type, operating system, approximate geographic location (city/country derived from IP), referrer source, session duration, and page views.
            </Typography.Paragraph>
            <Typography.Paragraph style={{ color: '#94a3b8', lineHeight: 1.7 }}>
              <b>D. Integrations Data (Shopify / CRMs):</b> If you connect third-party platforms such as Shopify, we access customer orders, total spend, and contact tags strictly to display them to support agents during live chats.
            </Typography.Paragraph>
          </section>

          <section style={{ marginBottom: 28 }}>
            <Typography.Title level={4} style={{ color: '#f1f5f9' }}>
              3. How We Use Information
            </Typography.Title>
            <Typography.Paragraph style={{ color: '#94a3b8', lineHeight: 1.7 }}>
              We use the collected information exclusively to:
            </Typography.Paragraph>
            <ul style={{ color: '#94a3b8', lineHeight: 1.8, paddingLeft: 20 }}>
              <li>Provide, maintain, and deliver real-time chat and customer support services.</li>
              <li>Detect and prevent spam, malicious bots, and automated crawler abuse.</li>
              <li>Authenticate accounts and secure communication via encrypted WebSockets.</li>
              <li>Deliver proactive automated triggers and customer satisfaction surveys.</li>
              <li>Provide aggregate analytics and conversion tracking to store owners.</li>
            </ul>
          </section>

          <section style={{ marginBottom: 28 }}>
            <Typography.Title level={4} style={{ color: '#f1f5f9' }}>
              4. Data Retention & Tenant Isolation
            </Typography.Title>
            <Typography.Paragraph style={{ color: '#94a3b8', lineHeight: 1.7 }}>
              All customer data is strictly tenant-isolated in our enterprise database. We do not sell, rent, or monetize your customer conversations or personal data to any third party. Each workspace can configure custom data retention schedules (e.g., 30, 90, or 365 days), after which visitor histories and attachments are permanently swept and purged from our servers.
            </Typography.Paragraph>
          </section>

          <section style={{ marginBottom: 28 }}>
            <Typography.Title level={4} style={{ color: '#f1f5f9' }}>
              5. Your Rights Under GDPR & CCPA
            </Typography.Title>
            <Typography.Paragraph style={{ color: '#94a3b8', lineHeight: 1.7 }}>
              Depending on your location, you have the right to access, rectify, port, or request permanent deletion of all personal data held by Chatral. You can export your transcripts or delete visitor records directly from the dashboard, or contact our support team.
            </Typography.Paragraph>
          </section>

          <section style={{ marginBottom: 12 }}>
            <Typography.Title level={4} style={{ color: '#f1f5f9' }}>
              6. Contact Information
            </Typography.Title>
            <Typography.Paragraph style={{ color: '#94a3b8', lineHeight: 1.7 }}>
              If you have any questions about this Privacy Policy or wish to exercise your data privacy rights, please contact our Data Protection Officer at:
              <br />
              <strong style={{ color: '#38bdf8' }}>Email:</strong> digiscaleinfotech@gmail.com
              <br />
              <strong style={{ color: '#38bdf8' }}>Organization:</strong> DigiScale Infotech (Chatral Platform)
            </Typography.Paragraph>
          </section>
        </Card>

        {/* Footer info */}
        <Flex justify="center" style={{ marginTop: 32 }}>
          <Typography.Text style={{ color: '#64748b', fontSize: 12 }}>
            &copy; {new Date().getFullYear()} DigiScale Infotech. All rights reserved.
          </Typography.Text>
        </Flex>
      </div>
    </div>
  );
}

