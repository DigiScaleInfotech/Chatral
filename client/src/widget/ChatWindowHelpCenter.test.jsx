import { describe, it, expect, afterEach } from 'vitest';
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
const base = { cfg: CONFIG_WITH_FAQS, open: true, onToggle: () => { } };

describe('ChatWindow Help Center & FAQ navigation', () => {
  it('renders streamlined Home screen with greeting, 2 bottom tabs (Home and Messages), brand pill, and featured FAQ cards', () => {
    render(<ChatWindow {...base} messages={[]} visitorName="Hiren" />);
    expect(screen.getByText(/Hi Hiren 👋/)).toBeTruthy();
    expect(screen.getByText('Send us a message')).toBeTruthy();
    expect(screen.getByText('How do I track my order status?')).toBeTruthy();
    expect(screen.getByText('What is your return & exchange policy?')).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Chat navigation' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Home' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Messages' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Help' })).toBeNull();
  });

  it('clicking an FAQ card opens the article view with full answer and back button', () => {
    render(<ChatWindow {...base} messages={[]} />);
    fireEvent.click(screen.getByText('How do I track my order status?'));
    expect(screen.getByText('You can track your order using the tracking link sent via SMS/Email.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Back to Home' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Send us a message' })).toBeTruthy();
  });

  it('clicking "Send us a message" transitions smoothly to Messages tab with composer', () => {
    render(<ChatWindow {...base} messages={[]} />);
    fireEvent.click(screen.getByText('How do I track my order status?'));
    fireEvent.click(screen.getByRole('button', { name: 'Send us a message' }));
    expect(screen.getByLabelText('Message')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Send' })).toBeTruthy();
  });

  it('renders clean FAQ cards on Home without any search bar', () => {
    render(<ChatWindow {...base} messages={[]} />);
    expect(screen.queryByLabelText('Search for help')).toBeNull();
    expect(screen.getByText('How do I track my order status?')).toBeTruthy();
    expect(screen.getByText('What is your return & exchange policy?')).toBeTruthy();
  });

  it('does not show Recent message card on Home screen even when conversation has messages', () => {
    const messages = [
      { id: 'm1', seq: 1, senderType: 'AGENT', senderName: 'Alex', body: 'Your package has been dispatched!', createdAt: new Date().toISOString() },
    ];
    render(<ChatWindow {...base} messages={messages} />);
    fireEvent.click(screen.getByRole('button', { name: 'Home' }));
    expect(screen.queryByText('Recent message')).toBeNull();
    expect(screen.getByText('Send us a message')).toBeTruthy();
  });

  it('renders messages-only mode without Home tab or bottom nav when faqs is empty', () => {
    const cfgNoFaqs = { ...CONFIG_WITH_FAQS, faqs: [] };
    render(<ChatWindow {...base} cfg={cfgNoFaqs} messages={[]} />);
    expect(screen.queryByRole('navigation', { name: 'Chat navigation' })).toBeNull();
    expect(screen.queryByText('Send us a message')).toBeNull();
    expect(screen.getByPlaceholderText('Type…')).toBeTruthy();
  });

  it('renders messages-only mode when helpCenterEnabled is false even if faqs exist', () => {
    const cfgDisabled = { ...CONFIG_WITH_FAQS, helpCenterEnabled: false };
    render(<ChatWindow {...base} cfg={cfgDisabled} messages={[]} />);
    expect(screen.queryByRole('navigation', { name: 'Chat navigation' })).toBeNull();
    expect(screen.queryByText('Send us a message')).toBeNull();
    expect(screen.getByPlaceholderText('Type…')).toBeTruthy();
  });
});
