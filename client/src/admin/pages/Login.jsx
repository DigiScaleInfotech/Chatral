import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Button, Card, Flex, Form, Input, Typography } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { api } from '../api.js';
import { BRAND } from '../theme.js';
import { ChatralFullLogo } from '../components/BrandLogo.jsx';

const MODE_COPY = {
  login: {
    title: 'Welcome back',
    subtitle: 'Sign in to access your support workspace',
  },
  signup: {
    title: 'Create your account',
    subtitle: 'Sign up to get started with your support workspace',
  },
  forgot: {
    title: 'Forgot your password?',
    subtitle: 'Enter your email and we will send reset instructions',
  },
  reset: {
    title: 'Set a new password',
    subtitle: 'Choose a strong password for your account',
  },
};

// Light card on a dark page. The card, labels, inputs and alerts use the theme tokens
// (no inline colour overrides), so every state - hover, focus, error, disabled - stays readable.
export default function Login() {
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const resetParam = searchParams.get('reset') || '';
  const [mode, setMode] = useState(resetParam ? 'reset' : 'login');
  const [resetToken, setResetToken] = useState(resetParam);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [devResetToken, setDevResetToken] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (resetParam) {
      setResetToken(resetParam);
      setMode('reset');
    }
  }, [resetParam]);

  function switchMode(next) {
    setError(null);
    setNotice(null);
    setDevResetToken(null);
    if (next !== 'reset' && resetParam) {
      setSearchParams({}, { replace: true });
    }
    setMode(next);
  }

  async function onLogin({ email, password }) {
    setLoading(true);
    setError(null);
    try {
      const { token } = await api('/auth/login', { method: 'POST', body: { email, password } });
      localStorage.setItem('token', token);
      nav('/');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function onSignup({ name, email, password }) {
    setLoading(true);
    setError(null);
    try {
      const { token } = await api('/auth/register', { method: 'POST', body: { name, email, password } });
      localStorage.setItem('token', token);
      nav('/');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function onForgot({ email }) {
    setLoading(true);
    setError(null);
    setNotice(null);
    setDevResetToken(null);
    try {
      const res = await api('/auth/forgot-password', { method: 'POST', body: { email } });
      setNotice(res.message || 'If an account exists for that email, password reset instructions have been sent.');
      if (res.devResetToken) setDevResetToken(res.devResetToken);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function onReset({ password }) {
    setLoading(true);
    setError(null);
    try {
      await api('/auth/reset-password', { method: 'POST', body: { token: resetToken, password } });
      setSearchParams({}, { replace: true });
      setMode('login');
      setNotice('Your password has been updated. Please sign in.');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const copy = MODE_COPY[mode];

  return (
    <Flex align="center" justify="center" className="login-page" style={{ minHeight: '100vh', padding: '24px 16px', background: BRAND.sider }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <Flex justify="center" style={{ marginBottom: 28 }}>
          <ChatralFullLogo height={48} dark />
        </Flex>

        <Card className="login-card">
          <div style={{ marginBottom: 22 }}>
            <Typography.Title level={4} style={{ margin: 0, fontWeight: 600 }}>
              {copy.title}
            </Typography.Title>
            <Typography.Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 13 }}>
              {copy.subtitle}
            </Typography.Text>
          </div>
          {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 20 }} role="alert" />}
          {notice && (
            <Alert
              type="success"
              message={notice}
              showIcon
              style={{ marginBottom: 20 }}
              action={devResetToken && (
                <Button
                  size="small"
                  type="link"
                  onClick={() => {
                    setResetToken(devResetToken);
                    setNotice(null);
                    setDevResetToken(null);
                    setMode('reset');
                  }}
                >
                  Reset now
                </Button>
              )}
            />
          )}

          {mode === 'login' && (
            <Form key="login" layout="vertical" onFinish={onLogin} requiredMark={false}>
              <Form.Item
                name="email"
                label="Email address"
                rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}
              >
                <Input prefix={<MailOutlined />} autoComplete="email" placeholder="name@company.com" size="large" />
              </Form.Item>
              <Form.Item
                name="password"
                label="Password"
                rules={[{ required: true, message: 'Enter your password' }]}
                style={{ marginBottom: 8 }}
              >
                <Input.Password prefix={<LockOutlined />} autoComplete="current-password" placeholder="Your password" size="large" />
              </Form.Item>
              <Flex justify="flex-end" style={{ marginBottom: 20 }}>
                <Button
                  type="link"
                  size="small"
                  onClick={() => switchMode('forgot')}
                  style={{ padding: 0, height: 'auto', fontSize: 13 }}
                >
                  Forgot password?
                </Button>
              </Flex>
              <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                Sign in
              </Button>
              <Flex justify="center" align="center" gap={4} style={{ marginTop: 18 }}>
                <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                  Don&apos;t have an account?
                </Typography.Text>
                <Button type="link" size="small" onClick={() => switchMode('signup')} style={{ padding: 0, height: 'auto', fontSize: 13, fontWeight: 500 }}>
                  Sign up
                </Button>
              </Flex>
            </Form>
          )}

          {mode === 'signup' && (
            <Form key="signup" layout="vertical" onFinish={onSignup} requiredMark={false}>
              <Form.Item
                name="name"
                label="Full name"
                rules={[{ required: true, whitespace: true, message: 'Enter your full name' }]}
              >
                <Input prefix={<UserOutlined />} autoComplete="name" placeholder="Your full name" size="large" />
              </Form.Item>
              <Form.Item
                name="email"
                label="Email address"
                rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}
              >
                <Input prefix={<MailOutlined />} autoComplete="email" placeholder="name@company.com" size="large" />
              </Form.Item>
              <Form.Item
                name="password"
                label="Password"
                rules={[
                  { required: true, message: 'Enter a password' },
                  { min: 8, message: 'Password must be at least 8 characters' },
                ]}
              >
                <Input.Password prefix={<LockOutlined />} autoComplete="new-password" placeholder="At least 8 characters" size="large" />
              </Form.Item>
              <Form.Item
                name="confirm"
                label="Confirm password"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Confirm your password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) return Promise.resolve();
                      return Promise.reject(new Error('Passwords do not match'));
                    },
                  }),
                ]}
                style={{ marginBottom: 24 }}
              >
                <Input.Password prefix={<LockOutlined />} autoComplete="new-password" placeholder="Repeat your password" size="large" />
              </Form.Item>
              <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                Create account
              </Button>
              <Flex justify="center" align="center" gap={4} style={{ marginTop: 18 }}>
                <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                  Already have an account?
                </Typography.Text>
                <Button type="link" size="small" onClick={() => switchMode('login')} style={{ padding: 0, height: 'auto', fontSize: 13, fontWeight: 500 }}>
                  Sign in
                </Button>
              </Flex>
            </Form>
          )}

          {mode === 'forgot' && (
            <Form key="forgot" layout="vertical" onFinish={onForgot} requiredMark={false}>
              <Form.Item
                name="email"
                label="Email address"
                rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}
                style={{ marginBottom: 24 }}
              >
                <Input prefix={<MailOutlined />} autoComplete="email" placeholder="name@company.com" size="large" />
              </Form.Item>
              <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                Send reset link
              </Button>
              <Flex justify="center" align="center" style={{ marginTop: 18 }}>
                <Button type="link" size="small" onClick={() => switchMode('login')} style={{ padding: 0, height: 'auto', fontSize: 13, fontWeight: 500 }}>
                  Back to Sign in
                </Button>
              </Flex>
            </Form>
          )}

          {mode === 'reset' && (
            <Form key="reset" layout="vertical" onFinish={onReset} requiredMark={false}>
              <Form.Item
                name="password"
                label="New password"
                rules={[
                  { required: true, message: 'Enter a new password' },
                  { min: 8, message: 'Password must be at least 8 characters' },
                ]}
              >
                <Input.Password prefix={<LockOutlined />} autoComplete="new-password" placeholder="At least 8 characters" size="large" />
              </Form.Item>
              <Form.Item
                name="confirm"
                label="Confirm new password"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Confirm your new password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) return Promise.resolve();
                      return Promise.reject(new Error('Passwords do not match'));
                    },
                  }),
                ]}
                style={{ marginBottom: 24 }}
              >
                <Input.Password prefix={<LockOutlined />} autoComplete="new-password" placeholder="Repeat your new password" size="large" />
              </Form.Item>
              <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                Update password
              </Button>
              <Flex justify="center" align="center" style={{ marginTop: 18 }}>
                <Button type="link" size="small" onClick={() => switchMode('login')} style={{ padding: 0, height: 'auto', fontSize: 13, fontWeight: 500 }}>
                  Back to Sign in
                </Button>
              </Flex>
            </Form>
          )}
        </Card>

        <Flex justify="center" align="center" gap={6} style={{ marginTop: 24, color: '#cbd5e1', fontSize: 12 }}>
          <SafetyCertificateOutlined />
          <span>Tenant-isolated workspaces</span>
        </Flex>
      </div>
    </Flex>
  );
}
