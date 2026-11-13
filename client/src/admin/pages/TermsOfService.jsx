import { Link } from 'react-router-dom';
import { Card, Flex, Typography, Button, Divider } from 'antd';
import { ArrowLeftOutlined, FileTextOutlined } from '@ant-design/icons';
import { ChatralFullLogo } from '../components/BrandLogo.jsx';

export default function TermsOfService() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', padding: '40px 16px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        {/* Header */}
        <Flex justify="space-between" align="center" style={{ marginBottom: 28 }}>
          <Link to="/">
            <ChatralFullLogo height={32} dark={false} />
          </Link>
          <Link to="/">
            <Button type="default" icon={<ArrowLeftOutlined />} style={{ color: '#475569', borderColor: '#cbd5e1', fontSize: 13, height: 36 }}>
              Back to Home
            </Button>
          </Link>
        </Flex>

        {/* Card Content */}
        <Card
          bordered={false}
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            boxShadow: '0 10px 30px -5px rgba(15, 23, 42, 0.06)',
            color: '#334155',
          }}
          bodyStyle={{ padding: '40px 36px' }}
        >
          <Flex align="center" gap={12} style={{ marginBottom: 8 }}>
            <FileTextOutlined style={{ fontSize: 28, color: '#2563eb' }} />
            <Typography.Title level={2} style={{ color: '#0f172a', margin: 0, fontWeight: 700 }}>
              Terms of Service
            </Typography.Title>
          </Flex>
          <Typography.Text style={{ color: '#64748b', fontSize: 13, display: 'block', marginBottom: 24 }}>
            Last Updated: November 13, 2026 • Effective Date: November 13, 2026
          </Typography.Text>

          <Divider style={{ borderColor: '#e2e8f0', margin: '16px 0 28px' }} />

          <section style={{ marginBottom: 28 }}>
            <Typography.Title level={4} style={{ color: '#0f172a', marginTop: 0 }}>
              1. Acceptance of Terms
            </Typography.Title>
            <Typography.Paragraph style={{ color: '#475569', lineHeight: 1.75, fontSize: 14 }}>
              By registering an account, embedding our chat widget script, or accessing the Chatral platform, you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you are entering into this agreement on behalf of a company, you represent that you have the authority to bind such entity.
            </Typography.Paragraph>
          </section>

          <section style={{ marginBottom: 28 }}>
            <Typography.Title level={4} style={{ color: '#0f172a' }}>
              2. Description of Service
            </Typography.Title>
            <Typography.Paragraph style={{ color: '#475569', lineHeight: 1.75, fontSize: 14 }}>
              Chatral is a Software-as-a-Service customer messaging and visitor engagement platform providing real-time chat widgets, team management, automated response triggers, Shopify integrations, and visitor tracking tools.
            </Typography.Paragraph>
          </section>

          <section style={{ marginBottom: 28 }}>
            <Typography.Title level={4} style={{ color: '#0f172a' }}>
              3. Account & Security Responsibilities
            </Typography.Title>
            <Typography.Paragraph style={{ color: '#475569', lineHeight: 1.75, fontSize: 14 }}>
              You are responsible for maintaining the confidentiality of your account login credentials and store public/secret keys. You agree to immediately notify us of any unauthorized access or breach of security. Chatral cannot and will not be liable for any loss or damage arising from your failure to safeguard your credentials.
            </Typography.Paragraph>
          </section>

          <section style={{ marginBottom: 28 }}>
            <Typography.Title level={4} style={{ color: '#0f172a' }}>
              4. Acceptable Use Policy
            </Typography.Title>
            <Typography.Paragraph style={{ color: '#475569', lineHeight: 1.75, fontSize: 14 }}>
              You agree not to use the Chatral platform to:
            </Typography.Paragraph>
            <ul style={{ color: '#475569', lineHeight: 1.8, paddingLeft: 20, fontSize: 14 }}>
              <li>Send unsolicited bulk communications (spam) or harass website visitors.</li>
              <li>Upload malicious code, viruses, or conduct security exploits or automated DDoS attacks.</li>
              <li>Collect, store, or transmit prohibited content, unlawful materials, or payment card numbers (PCI data) in violation of applicable laws.</li>
              <li>Attempt to reverse-engineer, decompile, or bypass the platform access controls or rate limits.</li>
            </ul>
          </section>

          <section style={{ marginBottom: 28 }}>
            <Typography.Title level={4} style={{ color: '#0f172a' }}>
              5. Intellectual Property
            </Typography.Title>
            <Typography.Paragraph style={{ color: '#475569', lineHeight: 1.75, fontSize: 14 }}>
              Chatral and its logos, source code, designs, and documentation are the exclusive intellectual property of DigiScale Infotech. You retain all rights and ownership to the customer data, visitor conversations, and store content processed through your account.
            </Typography.Paragraph>
          </section>

          <section style={{ marginBottom: 28 }}>
            <Typography.Title level={4} style={{ color: '#0f172a' }}>
              6. Service Level, Warranties & Liability
            </Typography.Title>
            <Typography.Paragraph style={{ color: '#475569', lineHeight: 1.75, fontSize: 14 }}>
              Chatral provides a 99.9% targeted service uptime. While we employ automated failover and secure cloud infrastructure, the service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. Under no circumstances shall Chatral or DigiScale Infotech be liable for indirect, incidental, or consequential damages resulting from downtime, network failures, or lost profits.
            </Typography.Paragraph>
          </section>

          <section style={{ marginBottom: 12 }}>
            <Typography.Title level={4} style={{ color: '#0f172a' }}>
              7. Termination & Cancellation
            </Typography.Title>
            <Typography.Paragraph style={{ color: '#475569', lineHeight: 1.75, fontSize: 14 }}>
              You may cancel your account at any time through your account settings or by submitting a written request. Upon termination, your right to use the service and embed the widget will immediately cease, and your store data will be deleted in accordance with our data retention schedule.
            </Typography.Paragraph>
            <Typography.Paragraph style={{ color: '#475569', lineHeight: 1.75, fontSize: 14 }}>
              For legal inquiries regarding these terms, contact us at: <span style={{ color: '#2563eb', fontWeight: 600 }}>digiscaleinfotech@gmail.com</span>
            </Typography.Paragraph>
          </section>
        </Card>

        {/* Footer */}
        <Flex justify="center" style={{ marginTop: 28 }}>
          <Typography.Text style={{ color: '#64748b', fontSize: 12 }}>
            &copy; {new Date().getFullYear()} DigiScale Infotech. All rights reserved.
          </Typography.Text>
        </Flex>
      </div>
    </div>
  );
}
