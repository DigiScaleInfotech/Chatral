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
    fireEvent.click(screen.getByRole('button', { name: 'Back to messages' }));
    fireEvent.click(screen.getByRole('button', { name: 'Home' }));
    expect(screen.queryByText('Recent message')).toBeNull();
    expect(screen.getByText('Send us a message')).toBeTruthy();
  });

  it('hides bottom tabs during active chat conversation and shows Messages list overview on back button', () => {
    const messages = [
      { id: 'm1', seq: 1, senderType: 'VISITOR', senderName: 'User', body: 'Our Problem Is Hear', createdAt: new Date().toISOString() },
    ];
    render(<ChatWindow {...base} messages={messages} />);
    // Bottom tabs must be hidden during active conversation
    expect(screen.queryByRole('navigation', { name: 'Chat navigation' })).toBeNull();
    expect(screen.getByLabelText('Message')).toBeTruthy();

    // Click header back button to exit conversation
    fireEvent.click(screen.getByRole('button', { name: 'Back to messages' }));

    // Now on Messages list overview screen: tabs are visible and conversation snippet is displayed
    expect(screen.getByRole('navigation', { name: 'Chat navigation' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Home' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Messages' })).toBeTruthy();
    expect(screen.getByText(/Our Problem Is Hear/)).toBeTruthy();
    expect(screen.getByText('Send us a message')).toBeTruthy();

    // Clicking the conversation card returns to active chat
    fireEvent.click(screen.getByText(/Our Problem Is Hear/));
    expect(screen.queryByRole('navigation', { name: 'Chat navigation' })).toBeNull();
    expect(screen.getByLabelText('Message')).toBeTruthy();
  });

  it('renders up to 4 past chats on Messages screen and caps at 4 when more exist', () => {
    const mockChats = [
      { id: 'c1', messages: [{ id: 'm1', body: 'Chat 1 Message', senderType: 'VISITOR' }], updatedAt: new Date().toISOString() },
      { id: 'c2', messages: [{ id: 'm2', body: 'Chat 2 Message', senderType: 'VISITOR' }], updatedAt: new Date().toISOString() },
      { id: 'c3', messages: [{ id: 'm3', body: 'Chat 3 Message', senderType: 'VISITOR' }], updatedAt: new Date().toISOString() },
      { id: 'c4', messages: [{ id: 'm4', body: 'Chat 4 Message', senderType: 'VISITOR' }], updatedAt: new Date().toISOString() },
      { id: 'c5', messages: [{ id: 'm5', body: 'Chat 5 Oldest', senderType: 'VISITOR' }], updatedAt: new Date().toISOString() },
    ];
    let selected = null;
    render(
      <ChatWindow
        {...base}
        messages={[]}
        chats={mockChats}
        onSelectChat={(c) => { selected = c; }}
      />
    );
    // Switch to Messages tab
    fireEvent.click(screen.getByRole('button', { name: 'Messages' }));

    // Should show newest 4 chats (c1 to c4)
    expect(screen.getByText(/Chat 1 Message/)).toBeTruthy();
    expect(screen.getByText(/Chat 2 Message/)).toBeTruthy();
    expect(screen.getByText(/Chat 3 Message/)).toBeTruthy();
    expect(screen.getByText(/Chat 4 Message/)).toBeTruthy();
    // 5th oldest chat should NOT be shown
    expect(screen.queryByText(/Chat 5 Oldest/)).toBeNull();

    // Selecting a chat invokes onSelectChat
    fireEvent.click(screen.getByText(/Chat 2 Message/));
    expect(selected?.id).toBe('c2');
  });

  it('renders past ended chat as strictly read-only without Start a new chat or message box', () => {
    const mockChats = [
      { id: 'c1', status: 'RESOLVED', messages: [{ id: 'm1', body: 'Past resolved message', senderType: 'VISITOR' }], updatedAt: new Date().toISOString() },
    ];
    render(
      <ChatWindow
        {...base}
        messages={[]}
        chats={mockChats}
      />
    );
    // Switch to Messages tab
    fireEvent.click(screen.getByRole('button', { name: 'Messages' }));

    // Click on past ended chat to view it
    fireEvent.click(screen.getByText(/Past resolved message/));

    // Message must be readable
    expect(screen.getByText('Past resolved message')).toBeTruthy();
    // Must NOT show message box
    expect(screen.queryByLabelText('Message')).toBeNull();
    // Must NOT show Start a new chat button inside past chat
    expect(screen.queryByText('Start a new chat')).toBeNull();
    // Must show read-only status
    expect(screen.getByText('This chat has ended')).toBeTruthy();
  });

  it('renders greeting message with smooth entrance animation container in new chat', () => {
    const cfgGreeting = {
      ...CONFIG_WITH_FAQS,
      messages: { ...CONFIG_WITH_FAQS.messages, greeting: 'Hi there 👋 How can we help?' },
    };
    const { container } = render(<ChatWindow {...base} cfg={cfgGreeting} messages={[]} />);
    // Click Send us a message to enter new chat
    fireEvent.click(screen.getByText('Send us a message'));
    expect(screen.getByText(/Hi there 👋 How can we help?/)).toBeTruthy();
    expect(container.querySelector('.lc-greeting-anim')).toBeTruthy();
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
