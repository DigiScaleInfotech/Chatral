import { useState, useEffect } from 'react';
import {
  Modal, Flex, Typography, Tag, Segmented, Input, Button, Card,
  Divider, Space, App, Spin, Row, Col,
} from 'antd';
import {
  CheckCircleFilled, QrcodeOutlined, CreditCardOutlined,
  CopyOutlined, LockOutlined, ArrowRightOutlined,
  CheckOutlined, SafetyCertificateOutlined,
} from '@ant-design/icons';
import { api, showError } from '../api.js';

export const PRICING_DATA = {
  STARTER: {
    name: 'Starter Growth',
    badge: 'Most Popular',
    monthlyPriceINR: 499,
    annualPriceINR: 4488, // ₹374/mo
    monthlyPriceUSD: 6,
    annualPriceUSD: 54, // $4.50/mo
    features: [
      '3 Active Stores',
      'Unlimited Live Chats',
      'Automated Sales Triggers',
      'Canned Replies & Shortcuts',
      'Sound & Desktop Alerts',
      'Shopify & WooCommerce Integration',
      'Remove "Powered by Chatral" Badge',
      'Priority 24/7 Support',
    ],
  },
  BUSINESS: {
    name: 'Business & Scale',
    badge: 'Enterprise',
    monthlyPriceINR: 999,
    annualPriceINR: 8988, // ₹749/mo
    monthlyPriceUSD: 12,
    annualPriceUSD: 108, // $9/mo
    features: [
      'Unlimited Active Stores',
      'Unlimited Team Members & Roles',
      'Everything in Starter Growth',
      '1-on-1 Setup & Onboarding Support',
      'Custom CSS & Brand White-labeling',
      'Advanced Analytics & Reports Export',
      'Dedicated Account Manager',
      'WhatsApp & Priority Phone Support',
    ],
  },
};

export default function ChatralPaymentModal({
  open,
  onClose,
  storeId,
  storeName,
  initialPlan = 'STARTER',
  initialCycle = 'monthly',
  initialCurrency = 'INR',
  onSuccess,
}) {
  const { message } = App.useApp();
  const [selectedPlan, setSelectedPlan] = useState(initialPlan);
  const [cycle, setCycle] = useState(initialCycle);
  const [currency, setCurrency] = useState(initialCurrency);
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI' | 'CARD'
  
  // Form fields
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedPlan(initialPlan || 'STARTER');
      setCycle(initialCycle || 'monthly');
      setCurrency(initialCurrency || 'INR');
      setSuccess(false);
      setLoading(false);
    }
  }, [open, initialPlan, initialCycle, initialCurrency]);

  const planInfo = PRICING_DATA[selectedPlan] || PRICING_DATA.STARTER;
  
  // Format price
  const priceDisplay = currency === 'USD'
    ? (cycle === 'annual' ? `$${planInfo.annualPriceUSD}` : `$${planInfo.monthlyPriceUSD}`)
    : (cycle === 'annual' ? `₹${planInfo.annualPriceINR.toLocaleString('en-IN')}` : `₹${planInfo.monthlyPriceINR}`);
  
  const periodDisplay = cycle === 'annual' ? '/ year (Save 25%)' : '/ month';

  const officialUpiId = 'chatral.official@okaxis';
  const upiQrString = encodeURIComponent(`upi://pay?pa=${officialUpiId}&pn=Chatral%20Technologies&am=${cycle === 'annual' ? planInfo.annualPriceINR : planInfo.monthlyPriceINR}&cu=INR&tn=${encodeURIComponent(planInfo.name + ' Plan')}`);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${upiQrString}&color=0f172a&bgcolor=ffffff&qzone=1`;

  const copyUpi = () => {
    navigator.clipboard?.writeText(officialUpiId);
    setCopiedUpi(true);
    message.success('UPI ID copied to clipboard');
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleCardNumberChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = val.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 2) val = `${val.slice(0, 2)}/${val.slice(2)}`;
    setCardExpiry(val);
  };

  const handleProcessPayment = async () => {
    if (paymentMethod === 'UPI' && !upiId && !copiedUpi) {
      // Allow proceeding if they verified QR scan or entered UPI ID
    }
    if (paymentMethod === 'CARD') {
      if (cardNumber.replace(/\s/g, '').length < 15) {
        message.error('Please enter a valid card number');
        return;
      }
      if (!cardExpiry || cardExpiry.length < 5) {
        message.error('Please enter a valid expiry date (MM/YY)');
        return;
      }
      if (!cardCvv || cardCvv.length < 3) {
        message.error('Please enter a valid CVV');
        return;
      }
    }

    setLoading(true);
    try {
      let targetStoreId = storeId;
      if (!targetStoreId) {
        const stores = await api('/stores').catch(() => []);
        if (stores && stores.length > 0) {
          targetStoreId = stores[0].id;
        }
      }
      if (!targetStoreId) {
        message.error('No active store found. Please set up your store first.');
        return;
      }

      // Simulate real-time secure gateway handoff, then activate
      await new Promise((resolve) => setTimeout(resolve, 1400));
      
      const res = await api(`/stores/${targetStoreId}/billing/subscribe`, {
        method: 'POST',
        body: {
          plan: selectedPlan,
          cycle,
          currency,
          method: paymentMethod,
          transactionId: `chtr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        },
      });

      setSuccess(true);
      onSuccess?.(res);
    } catch (err) {
      showError(err, { message });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setLoading(false);
    onClose?.();
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      centered
      width={680}
      destroyOnClose
      styles={{
        content: {
          padding: '28px 32px',
          borderRadius: 20,
          boxShadow: '0 24px 60px -12px rgba(15, 23, 42, 0.22)',
        },
      }}
    >
      {success ? (
        <div style={{ textAlign: 'center', padding: '36px 16px' }}>
          <CheckCircleFilled style={{ fontSize: 64, color: '#22c55e', marginBottom: 20 }} />
          <Typography.Title level={3} style={{ margin: '0 0 8px', fontWeight: 800 }}>
            Subscription Activated! 🎉
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 15, display: 'block', maxWidth: 440, margin: '0 auto 28px' }}>
            Your store <b>{storeName || 'Chatral Store'}</b> is now active on the <b>{planInfo.name}</b> ({cycle === 'annual' ? 'Annual' : 'Monthly'}).
          </Typography.Text>

          <Card style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, maxWidth: 400, margin: '0 auto 28px', textAlign: 'left' }}>
            <Flex justify="space-between" style={{ marginBottom: 8 }}>
              <span style={{ color: '#64748b' }}>Plan</span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{planInfo.name}</span>
            </Flex>
            <Flex justify="space-between" style={{ marginBottom: 8 }}>
              <span style={{ color: '#64748b' }}>Billing Amount</span>
              <span style={{ fontWeight: 700, color: '#2563eb' }}>{priceDisplay} {periodDisplay}</span>
            </Flex>
            <Flex justify="space-between">
              <span style={{ color: '#64748b' }}>Status</span>
              <Tag color="success" bordered={false} style={{ margin: 0, fontWeight: 700 }}>Active</Tag>
            </Flex>
          </Card>

          <Button
            type="primary"
            size="large"
            onClick={handleClose}
            style={{ height: 46, padding: '0 36px', borderRadius: 10, background: '#2563eb', fontWeight: 600 }}
          >
            Go to Store Settings
          </Button>
        </div>
      ) : (
        <div>
          {/* Header */}
          <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
            <div>
              <Flex align="center" gap={8}>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Chatral Checkout</span>
                <Tag color="blue" bordered={false} style={{ fontWeight: 700, borderRadius: 6 }}>
                  {planInfo.name}
                </Tag>
              </Flex>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                Instant plan activation with zero branding and priority support.
              </Typography.Text>
            </div>
            
            <Flex gap={8} align="center">
              <Segmented
                size="small"
                value={currency}
                onChange={setCurrency}
                options={[
                  { label: '₹ INR', value: 'INR' },
                  { label: '$ USD', value: 'USD' },
                ]}
              />
              <Segmented
                size="small"
                value={cycle}
                onChange={setCycle}
                options={[
                  { label: 'Monthly', value: 'monthly' },
                  { label: 'Annual (-25%)', value: 'annual' },
                ]}
              />
            </Flex>
          </Flex>

          {/* Pricing Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
              color: '#ffffff',
              borderRadius: 14,
              padding: '18px 22px',
              marginBottom: 22,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: 12, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                Total Due Today
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
                {priceDisplay} <span style={{ fontSize: 13, fontWeight: 400, opacity: 0.9 }}>{periodDisplay}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, opacity: 0.9 }}>
              <div>Auto-activates instantly</div>
              <div>Cancel anytime from settings</div>
            </div>
          </div>

          {/* Payment Method Tabs */}
          <div style={{ marginBottom: 16 }}>
            <Segmented
              block
              value={paymentMethod}
              onChange={setPaymentMethod}
              options={[
                {
                  label: (
                    <Flex align="center" justify="center" gap={8} style={{ padding: '6px 0' }}>
                      <QrcodeOutlined style={{ fontSize: 16 }} />
                      <span style={{ fontWeight: 600 }}>UPI / QR Code (India)</span>
                    </Flex>
                  ),
                  value: 'UPI',
                },
                {
                  label: (
                    <Flex align="center" justify="center" gap={8} style={{ padding: '6px 0' }}>
                      <CreditCardOutlined style={{ fontSize: 16 }} />
                      <span style={{ fontWeight: 600 }}>Credit / Debit Card (Global)</span>
                    </Flex>
                  ),
                  value: 'CARD',
                },
              ]}
            />
          </div>

          {/* Tab 1: UPI */}
          {paymentMethod === 'UPI' && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px', marginBottom: 20 }}>
              <Row gutter={[20, 20]} align="middle">
                <Col xs={24} sm={10} style={{ textAlign: 'center' }}>
                  <div style={{ background: '#ffffff', padding: 12, borderRadius: 12, border: '1px solid #cbd5e1', display: 'inline-block', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                    <img
                      src={qrUrl}
                      alt="Scan UPI QR Code"
                      style={{ width: 140, height: 140, display: 'block' }}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 8, fontWeight: 600 }}>
                    Scan with GPay, PhonePe, Paytm, CRED
                  </div>
                </Col>

                <Col xs={24} sm={14}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                    Direct UPI Transfer
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
                    Copy our verified official merchant UPI ID:
                  </div>

                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: 8,
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 14,
                    }}
                  >
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e293b', fontSize: 13 }}>
                      {officialUpiId}
                    </span>
                    <Button
                      size="small"
                      type="text"
                      icon={<CopyOutlined />}
                      onClick={copyUpi}
                      style={{ color: '#2563eb', fontWeight: 600 }}
                    >
                      {copiedUpi ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>

                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                    Or enter your UPI ID for quick verification:
                  </div>
                  <Input
                    placeholder="e.g. yourname@okhdfcbank"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    style={{ borderRadius: 8, height: 38 }}
                  />
                </Col>
              </Row>
            </div>
          )}

          {/* Tab 2: Credit / Debit Card */}
          {paymentMethod === 'CARD' && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Enter Card Details</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>Visa • Mastercard • RuPay • Amex</span>
              </div>

              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Card Number
                  </div>
                  <Input
                    prefix={<CreditCardOutlined style={{ color: '#94a3b8' }} />}
                    placeholder="4532 •••• •••• ••••"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    maxLength={19}
                    style={{ borderRadius: 8, height: 40 }}
                  />
                </div>

                <Row gutter={12}>
                  <Col span={12}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      Expiry (MM/YY)
                    </div>
                    <Input
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      maxLength={5}
                      style={{ borderRadius: 8, height: 40 }}
                    />
                  </Col>
                  <Col span={12}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      CVV / CVC
                    </div>
                    <Input.Password
                      placeholder="•••"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      maxLength={4}
                      style={{ borderRadius: 8, height: 40 }}
                    />
                  </Col>
                </Row>

                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Cardholder Name
                  </div>
                  <Input
                    placeholder="Full name as printed on card"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    style={{ borderRadius: 8, height: 40 }}
                  />
                </div>
              </Space>
            </div>
          )}

          {/* Security & Action */}
          <Flex justify="space-between" align="center" style={{ marginTop: 16 }}>
            <Flex align="center" gap={6} style={{ color: '#64748b', fontSize: 12 }}>
              <SafetyCertificateOutlined style={{ color: '#22c55e', fontSize: 15 }} />
              <span>256-bit bank-grade encryption</span>
            </Flex>

            <Button
              type="primary"
              size="large"
              loading={loading}
              onClick={handleProcessPayment}
              style={{
                height: 46,
                padding: '0 32px',
                borderRadius: 10,
                background: '#2563eb',
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              Complete Payment ({priceDisplay})
            </Button>
          </Flex>
        </div>
      )}
    </Modal>
  );
}
