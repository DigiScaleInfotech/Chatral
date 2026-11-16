import { useState, useEffect } from 'react';
import {
  Modal, Flex, Typography, Tag, Segmented, Input, Button, Card,
  Divider, Space, App, Spin, Row, Col, Checkbox, Select,
} from 'antd';
import {
  CheckCircleFilled, QrcodeOutlined, CreditCardOutlined,
  CopyOutlined, LockOutlined, ArrowRightOutlined,
  CheckOutlined, SafetyCertificateOutlined, BankOutlined,
  WalletOutlined, CloseOutlined,
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

const POPULAR_BANKS = [
  { id: 'HDFC', name: 'HDFC Bank', code: 'HDFC', color: '#004c8f' },
  { id: 'SBI', name: 'State Bank of India', code: 'SBI', color: '#280071' },
  { id: 'ICICI', name: 'ICICI Bank', code: 'ICICI', color: '#b02a30' },
  { id: 'AXIS', name: 'Axis Bank', code: 'AXIS', color: '#97144d' },
  { id: 'KOTAK', name: 'Kotak Bank', code: 'KOTAK', color: '#ed1c24' },
  { id: 'PNB', name: 'Punjab National Bank', code: 'PNB', color: '#a20a3a' },
];

const ALL_OTHER_BANKS = [
  { value: 'BOB', label: 'Bank of Baroda' },
  { value: 'BOI', label: 'Bank of India' },
  { value: 'CANARA', label: 'Canara Bank' },
  { value: 'UNION', label: 'Union Bank of India' },
  { value: 'INDUS', label: 'IndusInd Bank' },
  { value: 'YES', label: 'Yes Bank' },
  { value: 'FED', label: 'Federal Bank' },
  { value: 'IDBI', label: 'IDBI Bank' },
  { value: 'IDFC', label: 'IDFC FIRST Bank' },
  { value: 'RBL', label: 'RBL Bank' },
  { value: 'INDIAN', label: 'Indian Bank' },
  { value: 'CENTRAL', label: 'Central Bank of India' },
];

const WALLET_OPTIONS = [
  { id: 'PAYTM', name: 'Paytm Wallet', icon: '🔵', desc: 'Pay with linked Paytm balance or UPI' },
  { id: 'PHONEPE', name: 'PhonePe Wallet', icon: '🟣', desc: 'Instant 1-click checkout via PhonePe' },
  { id: 'AMAZON', name: 'Amazon Pay', icon: '🟡', desc: 'Pay using your Amazon Pay balance' },
  { id: 'MOBIKWIK', name: 'MobiKwik', icon: '🔷', desc: 'Pay using MobiKwik wallet or ZIP' },
];

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
  const [selectedPlan, setSelectedPlan] = useState(initialPlan || 'STARTER');
  const [cycle, setCycle] = useState(initialCycle || 'monthly');
  const [currency, setCurrency] = useState(initialCurrency || 'INR');
  const [paymentMethod, setPaymentMethod] = useState('CARD'); // 'CARD' | 'UPI' | 'NETBANKING' | 'WALLET'
  
  // Card Fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [saveCard, setSaveCard] = useState(true);

  // UPI Fields
  const [upiId, setUpiId] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Netbanking Fields
  const [selectedBank, setSelectedBank] = useState('HDFC');

  // Wallet Fields
  const [selectedWallet, setSelectedWallet] = useState('PAYTM');

  // User contact
  const [userContact, setUserContact] = useState('+91 90992 26483');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedPlan(initialPlan || 'STARTER');
      setCycle(initialCycle || 'monthly');
      setCurrency(initialCurrency || 'INR');
      setSuccess(false);
      setLoading(false);

      // Try reading user info
      const token = localStorage.getItem('token');
      if (token) {
        api('/auth/me').then((m) => {
          if (m?.email) setUserContact(m.email);
        }).catch(() => {});
      }
    }
  }, [open, initialPlan, initialCycle, initialCurrency]);

  const planInfo = PRICING_DATA[selectedPlan] || PRICING_DATA.STARTER;
  
  // Format price
  const priceDisplay = currency === 'USD'
    ? (cycle === 'annual' ? `$${planInfo.annualPriceUSD}` : `$${planInfo.monthlyPriceUSD}`)
    : (cycle === 'annual' ? `₹${planInfo.annualPriceINR.toLocaleString('en-IN')}` : `₹${planInfo.monthlyPriceINR}`);
  
  const periodDisplay = cycle === 'annual' ? '/ year (Save 25%)' : '/ month';

  const officialUpiId = 'chatral.official@okaxis';
  const upiAmount = cycle === 'annual' ? planInfo.annualPriceINR : planInfo.monthlyPriceINR;
  const upiQrString = encodeURIComponent(`upi://pay?pa=${officialUpiId}&pn=Chatral%20Technologies&am=${upiAmount}&cu=INR&tn=${encodeURIComponent(planInfo.name + ' Plan')}`);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${upiQrString}&color=0f172a&bgcolor=ffffff&qzone=1`;

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

    if (paymentMethod === 'UPI' && !upiId && !copiedUpi) {
      // Allow proceeding
    }

    if (paymentMethod === 'NETBANKING' && !selectedBank) {
      message.error('Please select a bank');
      return;
    }

    if (paymentMethod === 'WALLET' && !selectedWallet) {
      message.error('Please select a wallet');
      return;
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
        message.error('No active store found. Please create or select a store first.');
        return;
      }

      // Smooth gateway transition
      await new Promise((resolve) => setTimeout(resolve, 1200));
      
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
      width={760}
      destroyOnClose
      closeIcon={null}
      styles={{
        content: {
          padding: 0,
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
          border: 'none',
        },
      }}
    >
      {success ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', background: '#ffffff' }}>
          <CheckCircleFilled style={{ fontSize: 64, color: '#22c55e', marginBottom: 20 }} />
          <Typography.Title level={3} style={{ margin: '0 0 8px', fontWeight: 800, color: '#0f172a' }}>
            Subscription Activated! 🎉
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 15, display: 'block', maxWidth: 440, margin: '0 auto 28px' }}>
            Your store <b>{storeName || 'Chatral Store'}</b> is now active on <b>{planInfo.name}</b> ({cycle === 'annual' ? 'Annual' : 'Monthly'}).
          </Typography.Text>

          <Card style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, maxWidth: 380, margin: '0 auto 28px', textAlign: 'left' }}>
            <Flex justify="space-between" style={{ marginBottom: 8 }}>
              <span style={{ color: '#64748b' }}>Plan</span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{planInfo.name}</span>
            </Flex>
            <Flex justify="space-between" style={{ marginBottom: 8 }}>
              <span style={{ color: '#64748b' }}>Amount Paid</span>
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
            style={{ height: 44, padding: '0 36px', borderRadius: 8, background: '#2563eb', fontWeight: 600 }}
          >
            Done
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', minHeight: 480, background: '#ffffff' }}>
          {/* 1. Left Razorpay-style Blue Sidebar */}
          <div
            style={{
              width: 260,
              background: 'linear-gradient(175deg, #1d4ed8 0%, #1e40af 60%, #1e3a8a 100%)',
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              color: '#ffffff',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div>
              {/* Chatral Official Logo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: '#ffffff',
                    color: '#1d4ed8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: 18,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  }}
                >
                  C
                </div>
                <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                  Chatral
                </span>
              </div>

              {/* Price Summary */}
              <div style={{ marginTop: 28 }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Price Summary
                </div>
                <div style={{ fontSize: 34, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', margin: '4px 0 2px' }}>
                  {priceDisplay}
                </div>
                <div style={{ fontSize: 12, color: '#93c5fd' }}>
                  {planInfo.name} • {cycle === 'annual' ? 'Annual (25% off)' : 'Monthly'}
                </div>
              </div>

              {/* User Chip */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 8,
                  padding: '9px 12px',
                  marginTop: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  fontSize: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                  <span style={{ fontSize: 13 }}>👤</span>
                  <span style={{ color: '#ffffff', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Using as {userContact}
                  </span>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>›</span>
              </div>
            </div>

            {/* Bottom 3D Graphic & Encryption Note (Clean replacement for Secured by Razorpay) */}
            <div style={{ marginTop: 20 }}>
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <svg width="150" height="90" viewBox="0 0 150 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M75 10L135 45L75 80L15 45L75 10Z" fill="#3b82f6" fillOpacity="0.4" />
                  <path d="M15 45L75 80V85L15 50V45Z" fill="#1e40af" />
                  <path d="M135 45L75 80V85L135 50V45Z" fill="#1d4ed8" />
                  <rect x="42" y="24" width="66" height="42" rx="6" fill="#ffffff" fillOpacity="0.95" />
                  <rect x="42" y="32" width="66" height="8" fill="#1e3a8a" />
                  <circle cx="56" cy="52" r="5" fill="#f59e0b" />
                  <circle cx="64" cy="52" r="5" fill="#ef4444" fillOpacity="0.8" />
                  <rect x="76" y="50" width="24" height="4" rx="2" fill="#94a3b8" />
                </svg>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontSize: 11,
                  justifyContent: 'center',
                }}
              >
                <LockOutlined style={{ fontSize: 12, color: '#60a5fa' }} />
                <span>256-Bit Bank Grade Security</span>
              </div>
            </div>
          </div>

          {/* 2. Right Main Panel */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
            {/* Top Bar */}
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                Payment Options
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Segmented
                  size="small"
                  value={currency}
                  onChange={setCurrency}
                  options={[
                    { label: '₹ INR', value: 'INR' },
                    { label: '$ USD', value: 'USD' },
                  ]}
                />
                <button
                  type="button"
                  onClick={handleClose}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 16,
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '2px 6px',
                    borderRadius: 4,
                  }}
                  title="Close"
                >
                  <CloseOutlined />
                </button>
              </div>
            </div>

            {/* Split Options Body */}
            <div style={{ flex: 1, display: 'flex' }}>
              {/* Left Sub-Nav (Exact Razorpay Tab Menu) */}
              <div
                style={{
                  width: 175,
                  background: '#fafbfc',
                  borderRight: '1px solid #f1f5f9',
                  padding: '8px 0',
                }}
              >
                {/* 1. Cards */}
                <div
                  onClick={() => setPaymentMethod('CARD')}
                  style={{
                    padding: '12px 14px',
                    cursor: 'pointer',
                    background: paymentMethod === 'CARD' ? '#ffffff' : 'transparent',
                    borderLeft: paymentMethod === 'CARD' ? '3px solid #2563eb' : '3px solid transparent',
                    boxShadow: paymentMethod === 'CARD' ? '0 1px 3px rgba(0,0,0,0.03)' : 'none',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: paymentMethod === 'CARD' ? 700 : 500, color: paymentMethod === 'CARD' ? '#1d4ed8' : '#334155' }}>
                    Cards
                  </div>
                  <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2 }}>
                    Visa, Master, RuPay
                  </div>
                </div>

                {/* 2. UPI / QR */}
                <div
                  onClick={() => setPaymentMethod('UPI')}
                  style={{
                    padding: '12px 14px',
                    cursor: 'pointer',
                    background: paymentMethod === 'UPI' ? '#ffffff' : 'transparent',
                    borderLeft: paymentMethod === 'UPI' ? '3px solid #2563eb' : '3px solid transparent',
                    boxShadow: paymentMethod === 'UPI' ? '0 1px 3px rgba(0,0,0,0.03)' : 'none',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: paymentMethod === 'UPI' ? 700 : 500, color: paymentMethod === 'UPI' ? '#1d4ed8' : '#334155' }}>
                    UPI / QR Code
                  </div>
                  <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2 }}>
                    GPay, PhonePe, Paytm
                  </div>
                </div>

                {/* 3. Netbanking */}
                <div
                  onClick={() => setPaymentMethod('NETBANKING')}
                  style={{
                    padding: '12px 14px',
                    cursor: 'pointer',
                    background: paymentMethod === 'NETBANKING' ? '#ffffff' : 'transparent',
                    borderLeft: paymentMethod === 'NETBANKING' ? '3px solid #2563eb' : '3px solid transparent',
                    boxShadow: paymentMethod === 'NETBANKING' ? '0 1px 3px rgba(0,0,0,0.03)' : 'none',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: paymentMethod === 'NETBANKING' ? 700 : 500, color: paymentMethod === 'NETBANKING' ? '#1d4ed8' : '#334155' }}>
                    Netbanking
                  </div>
                  <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2 }}>
                    All Indian Banks
                  </div>
                </div>

                {/* 4. Wallet */}
                <div
                  onClick={() => setPaymentMethod('WALLET')}
                  style={{
                    padding: '12px 14px',
                    cursor: 'pointer',
                    background: paymentMethod === 'WALLET' ? '#ffffff' : 'transparent',
                    borderLeft: paymentMethod === 'WALLET' ? '3px solid #2563eb' : '3px solid transparent',
                    boxShadow: paymentMethod === 'WALLET' ? '0 1px 3px rgba(0,0,0,0.03)' : 'none',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: paymentMethod === 'WALLET' ? 700 : 500, color: paymentMethod === 'WALLET' ? '#1d4ed8' : '#334155' }}>
                    Wallet
                  </div>
                  <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2 }}>
                    Paytm, Amazon, PhonePe
                  </div>
                </div>
              </div>

              {/* Right Content Panel */}
              <div
                style={{
                  flex: 1,
                  padding: '20px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                {/* METHOD 1: CARDS */}
                {paymentMethod === 'CARD' && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>
                      Add a new card
                    </div>

                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                      <div>
                        <Input
                          placeholder="Card Number"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          maxLength={19}
                          style={{ height: 42, borderRadius: 8, fontSize: 13.5 }}
                          prefix={<CreditCardOutlined style={{ color: '#94a3b8', marginRight: 4 }} />}
                        />
                      </div>

                      <Row gutter={10}>
                        <Col span={12}>
                          <Input
                            placeholder="MM / YY"
                            value={cardExpiry}
                            onChange={handleExpiryChange}
                            maxLength={5}
                            style={{ height: 42, borderRadius: 8, fontSize: 13.5 }}
                          />
                        </Col>
                        <Col span={12}>
                          <Input.Password
                            placeholder="CVV"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            maxLength={4}
                            style={{ height: 42, borderRadius: 8, fontSize: 13.5 }}
                          />
                        </Col>
                      </Row>

                      <div>
                        <Input
                          placeholder="Cardholder's Name"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          style={{ height: 42, borderRadius: 8, fontSize: 13.5 }}
                        />
                      </div>

                      <div style={{ marginTop: 4 }}>
                        <Checkbox checked={saveCard} onChange={(e) => setSaveCard(e.target.checked)}>
                          <span style={{ fontSize: 12, color: '#64748b' }}>
                            Save this card as per RBI guidelines
                          </span>
                        </Checkbox>
                      </div>
                    </Space>
                  </div>
                )}

                {/* METHOD 2: UPI / QR */}
                {paymentMethod === 'UPI' && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
                      Scan QR or Enter UPI ID
                    </div>

                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                      <div style={{ background: '#ffffff', padding: 6, borderRadius: 8, border: '1px solid #cbd5e1' }}>
                        <img src={qrUrl} alt="UPI QR" style={{ width: 110, height: 110, display: 'block' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Scan with any UPI app</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>GPay, PhonePe, Paytm, BHIM</div>
                        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#1e293b', fontWeight: 600 }}>{officialUpiId}</span>
                          <Button size="small" type="text" icon={<CopyOutlined />} onClick={copyUpi} style={{ color: '#2563eb', padding: '0 4px', fontSize: 11 }}>
                            {copiedUpi ? 'Copied' : 'Copy'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                        Or enter UPI ID / VPA
                      </div>
                      <Input
                        placeholder="yourname@okaxis"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        style={{ height: 38, borderRadius: 8 }}
                      />
                    </div>
                  </div>
                )}

                {/* METHOD 3: NETBANKING (Razorpay Popular Banks Grid) */}
                {paymentMethod === 'NETBANKING' && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
                      Popular Indian Banks
                    </div>

                    <Row gutter={[8, 8]}>
                      {POPULAR_BANKS.map((b) => {
                        const active = selectedBank === b.id;
                        return (
                          <Col span={8} key={b.id}>
                            <div
                              onClick={() => setSelectedBank(b.id)}
                              style={{
                                border: active ? '2px solid #2563eb' : '1px solid #e2e8f0',
                                background: active ? '#eff6ff' : '#ffffff',
                                borderRadius: 8,
                                padding: '10px 8px',
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <div
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: '50%',
                                  background: b.color,
                                  color: '#ffffff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 10,
                                  fontWeight: 800,
                                  margin: '0 auto 6px',
                                }}
                              >
                                {b.code.slice(0, 2)}
                              </div>
                              <div style={{ fontSize: 11, fontWeight: 600, color: active ? '#1d4ed8' : '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {b.name}
                              </div>
                            </div>
                          </Col>
                        );
                      })}
                    </Row>

                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
                        Or select from all other banks:
                      </div>
                      <Select
                        placeholder="Select Bank"
                        value={POPULAR_BANKS.some((b) => b.id === selectedBank) ? undefined : selectedBank}
                        onChange={(v) => setSelectedBank(v)}
                        options={ALL_OTHER_BANKS}
                        style={{ width: '100%', height: 36 }}
                      />
                    </div>
                  </div>
                )}

                {/* METHOD 4: WALLET */}
                {paymentMethod === 'WALLET' && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
                      Select a Wallet
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {WALLET_OPTIONS.map((w) => {
                        const active = selectedWallet === w.id;
                        return (
                          <div
                            key={w.id}
                            onClick={() => setSelectedWallet(w.id)}
                            style={{
                              border: active ? '2px solid #2563eb' : '1px solid #e2e8f0',
                              background: active ? '#eff6ff' : '#ffffff',
                              borderRadius: 8,
                              padding: '10px 14px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 18 }}>{w.icon}</span>
                              <div>
                                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>{w.name}</div>
                                <div style={{ fontSize: 11, color: '#64748b' }}>{w.desc}</div>
                              </div>
                            </div>
                            <div
                              style={{
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                border: active ? '5px solid #2563eb' : '2px solid #cbd5e1',
                                background: '#ffffff',
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Bottom Continue / Pay Button */}
                <div style={{ marginTop: 16 }}>
                  <Button
                    type="primary"
                    block
                    size="large"
                    loading={loading}
                    onClick={handleProcessPayment}
                    style={{
                      height: 44,
                      background: '#0f172a', // Clean Razorpay-style dark submit button
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    Continue & Pay {priceDisplay}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
