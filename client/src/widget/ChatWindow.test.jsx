import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import ChatWindow from './ChatWindow.jsx';

const DEFAULT_CONFIG = {
  colors: { primary: '#2563eb', headerText: '#ffffff', visitorBubble: '#2563eb', visitorText: '#ffffff', agentBubble: '#f1f5f9', agentText: '#0f172a', background: '#ffffff' },
  logoUrl: '', agentName: 'Support', avatarUrl: '',
  launcher: { position: 'right', offsetX: 20, offsetY: 20, size: 60, label: '' },
  size: { width: 370, height: 560 }, font: { family: 'system', size: 14 },
  layout: { mobileFullscreen: true, showOnMobile: true, showOnDesktop: true },
  messages: { title: 'Chat with us', subtitle: 'Online', greeting: '', placeholder: 'Type…', offlineTitle: 'Offline', offlineText: 'Leave a message', offlineThanks: 'Thanks' },
  preChatForm: { enabled: false, fields: [] },
};

afterEach(cleanup);
const base = { cfg: DEFAULT_CONFIG, open: true, onToggle: () => {} };

describe('ChatWindow', () => {
  it('renders messages safely: only http(s) links become anchors', () => {
    const messages = [
      { id: '1', seq: 1, senderType: 'VISITOR', body: 'see https://shop.test/a and javascript:alert(1)', createdAt: new Date().toISOString() },
    ];
    render(<ChatWindow {...base} messages={messages} />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('href')).toBe('https://shop.test/a');
    expect(links[0].getAttribute('rel')).toContain('noopener');
  });

  it('shows Seen on the last visitor message the agent has read, and lets failed sends retry', () => {
    const onRetry = vi.fn();
    const messages = [
      { id: '1', seq: 1, senderType: 'VISITOR', body: 'first', createdAt: new Date().toISOString() },
      { clientMsgId: 'x', senderType: 'VISITOR', body: 'second', state: 'failed', createdAt: new Date().toISOString() },
    ];
    render(<ChatWindow {...base} messages={messages} agentReadSeq={1} onRetry={onRetry} />);
    expect(screen.getByText('Seen')).toBeTruthy();
    fireEvent.click(screen.getByText(/Not sent/));
    expect(onRetry).toHaveBeenCalledWith(expect.objectContaining({ clientMsgId: 'x' }));
  });

  it('sends on Enter and clears the box', () => {
    const onSend = vi.fn();
    render(<ChatWindow {...base} onSend={onSend} />);
    const box = screen.getByLabelText('Message');
    fireEvent.change(box, { target: { value: 'hello' } });
    fireEvent.keyDown(box, { key: 'Enter' });
    expect(onSend).toHaveBeenCalledWith('hello');
    expect(box.value).toBe('');
  });

  it('validates the offline form before submitting', async () => {
    const onOffline = vi.fn(async () => {});
    render(<ChatWindow {...base} mode="offline" online={false} onOffline={onOffline} />);
    fireEvent.click(screen.getByText('Send message'));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(onOffline).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'Sam' } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'sam@example.com' } });
    fireEvent.change(screen.getByLabelText(/Message \*/), { target: { value: 'Need help' } });
    fireEvent.click(screen.getByText('Send message'));
    await waitFor(() => expect(onOffline).toHaveBeenCalledWith({ name: 'Sam', email: 'sam@example.com', message: 'Need help' }));
  });

  it('hides the launcher when the mobile panel is full screen', () => {
    const { container } = render(<ChatWindow {...base} layout={{ mobile: true }} />);
    expect(container.querySelector('.lc-root').className).toContain('mobile-full');
  });
});

describe('ChatWindow attachments', () => {
  it('an image-only message is a bare thumbnail; an image with text keeps the bubble', () => {
    const Attachment = () => <img className="lc-img" alt="photo" src="blob:x" />;
    const now = new Date().toISOString();
    render(<ChatWindow {...base} Attachment={Attachment} messages={[
      { id: 'a', seq: 1, senderType: 'VISITOR', body: '', attachmentId: 'f1', createdAt: now },
      { id: 'b', seq: 2, senderType: 'VISITOR', body: 'see this', attachmentId: 'f2', createdAt: now },
    ]} />);
    const [only, withText] = screen.getAllByAltText('photo').map((img) => img.closest('.lc-bubble'));
    expect(only.classList.contains('media')).toBe(true);
    expect(withText.classList.contains('media')).toBe(false);
  });
});

describe('ChatWindow behaviour toggles', () => {
  it('shows a dismissible message preview above the closed launcher; click opens the chat', () => {
    const onToggle = vi.fn();
    const onDismissPreview = vi.fn();
    const { container, rerender } = render(<ChatWindow {...base} open={false} onToggle={onToggle} preview={{ name: 'Alex', body: 'Your order shipped' }} onDismissPreview={onDismissPreview} />);
    expect(screen.getByText('Your order shipped')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Open chat to read the message'));
    expect(onToggle).toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText('Dismiss message preview'));
    expect(onDismissPreview).toHaveBeenCalled();
    rerender(<ChatWindow {...base} open preview={{ name: 'Alex', body: 'Your order shipped' }} />);
    expect(container.querySelector('.lc-preview')).toBeNull();
  });

  it('hides the attach button when uploads are off', () => {
    const { rerender } = render(<ChatWindow {...base} onUpload={() => {}} canUpload />);
    expect(screen.queryByLabelText('Attach a file')).toBeTruthy();
    rerender(<ChatWindow {...base} onUpload={() => {}} canUpload={false} />);
    expect(screen.queryByLabelText('Attach a file')).toBeNull();
  });
});

describe('welcome preview above the launcher', () => {
  it('shows the message without a sender heading when no name is given; click opens the chat', () => {
    const onToggle = vi.fn();
    render(<ChatWindow {...base} open={false} onToggle={onToggle} preview={{ name: '', body: 'Welcome to our site, if you need help simply reply to this message.' }} onDismissPreview={() => {}} />);
    const btn = screen.getByRole('button', { name: 'Open chat to read the message' });
    expect(btn.textContent).toBe('Welcome to our site, if you need help simply reply to this message.');
    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalled();
  });

  it('never shows a sender heading, even if one is passed', () => {
    render(<ChatWindow {...base} open={false} preview={{ name: 'Customer Support', body: 'Welcome!' }} onDismissPreview={() => {}} />);
    expect(screen.queryByText('Customer Support')).toBeNull();
    expect(screen.getByText('Welcome!')).toBeTruthy();
  });
});
