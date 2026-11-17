import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ChatWindow from './ChatWindow.jsx';

const SAMPLE_FAQS = [
  {
    id: 'faq_1',
    question: 'How do I track my order status?',
    answer: 'You can track your order using the tracking link sent via SMS/Email.',
    category: 'Orders',
    showOnHome: true,
  },
  {
    id: 'faq_2',
    question: 'What is your return & exchange policy?',
    answer: 'We offer a 7-day hassle-free return and exchange policy.',
    category: 'Returns',
    showOnHome: true,
  },
  {
    id: 'faq_3',
    question: 'Do you offer Cash on Delivery (COD)?',
    answer: 'Yes, Cash on Delivery is available across all serviceable pin codes.',
    category: 'Payment',
    showOnHome: false,
  },
];

const CONFIG_WITH_FAQS = {
  colors: { primary: '#2563eb', headerText: '#ffffff', visitorBubble: '#2563eb', visitorText: '#ffffff', agentBubble: '#f1f5f9', agentText: '#0f172a', background: '#ffffff' },
  logoUrl: '', agentName: 'Support Kitty', avatarUrl: '',
  launcher: { position: 'right', offsetX: 20, offsetY: 20, size: 60, label: '' },
  size: { width: 370, height: 560 }, font: { family: 'system', size: 14 },
  layout: { mobileFullscreen: true, showOnMobile: true, showOnDesktop: true },
  messages: { title: 'How can we help?', subtitle: 'Instant Help & Live Chat', greeting: '', placeholder: 'Type…', offlineTitle: 'Offline', offlineText: 'Leave a message', offlineThanks: 'Thanks' },
  preChatForm: { enabled: false, fields: [] },
  faqs: SAMPLE_FAQS,
};

afterEach(cleanup);
const base = { cfg: CONFIG_WITH_FAQS, open: true, onToggle: () => {} };

describe('ChatWindow Help Center & FAQ navigation', () => {
  it('renders Intercom-style Home screen with greeting, FAQ cards, and bottom tabs', () => {
    render(<ChatWindow {...base} messages={[]} visitorName="Hiren" />);
    expect(screen.getByText(/Hi Hiren 👋/)).toBeTruthy();
    expect(screen.getByText('Frequently Asked Questions')).toBeTruthy();
    expect(screen.getByText('How do I track my order status?')).toBeTruthy();
    expect(screen.getByText('What is your return & exchange policy?')).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Chat navigation' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Home' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Messages' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Help' })).toBeTruthy();
  });

  it('clicking an FAQ card opens the Help Center article view with full answer and CTA', () => {
    render(<ChatWindow {...base} messages={[]} />);
    fireEvent.click(screen.getByText('How do I track my order status?'));
    expect(screen.getByText('You can track your order using the tracking link sent via SMS/Email.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Back to Help' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Chat with an Agent' })).toBeTruthy();
  });

  it('clicking "Chat with an Agent" transitions smoothly to Messages tab with composer', () => {
    render(<ChatWindow {...base} messages={[]} />);
    fireEvent.click(screen.getByText('How do I track my order status?'));
    fireEvent.click(screen.getByRole('button', { name: 'Chat with an Agent' }));
    expect(screen.getByLabelText('Message')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Send' })).toBeTruthy();
  });

  it('switches to Help tab and filters articles with real-time search', () => {
    render(<ChatWindow {...base} messages={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Help' }));
    const search = screen.getByLabelText('Search for help');
    expect(search).toBeTruthy();
    fireEvent.change(search, { target: { value: 'COD' } });
    expect(screen.getByText('Do you offer Cash on Delivery (COD)?')).toBeTruthy();
    expect(screen.queryByText('How do I track my order status?')).toBeNull();
  });

  it('shows Recent message card on Home screen when conversation has messages', () => {
    const messages = [
      { id: 'm1', seq: 1, senderType: 'AGENT', senderName: 'Alex', body: 'Your package has been dispatched!', createdAt: new Date().toISOString() },
    ];
    render(<ChatWindow {...base} messages={messages} />);
    // When messages exist, visitor starts on Messages or can switch to Home
    fireEvent.click(screen.getByRole('button', { name: 'Home' }));
    expect(screen.getByText('Recent message')).toBeTruthy();
    expect(screen.getByText(/Your package has been dispatched!/)).toBeTruthy();
  });
});
