// Header menu, typed pre-chat fields and the greeting rule.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import ChatWindow, { fieldError } from './ChatWindow.jsx';

const cfg = {
  colors: { primary: '#2563eb', headerText: '#ffffff', visitorBubble: '#2563eb', visitorText: '#ffffff', agentBubble: '#f1f5f9', agentText: '#0f172a', background: '#ffffff' },
  logoUrl: '', agentName: 'Support', avatarUrl: '',
  launcher: { position: 'right', offsetX: 20, offsetY: 20, size: 60, label: '' },
  size: { width: 370, height: 560 }, font: { family: 'system', size: 14 },
  layout: { mobileFullscreen: true, showOnMobile: true, showOnDesktop: true },
  messages: { title: 'Chat with us', subtitle: 'We typically reply in a few minutes', greeting: 'Hi there 👋 How can we help?', placeholder: 'Type…', offlineTitle: 'Offline', offlineText: 'Leave a message', offlineThanks: 'Thanks' },
  preChatForm: { enabled: true, fields: [] },
  sound: true,
};
afterEach(cleanup);
const now = new Date().toISOString();

describe('widget header and greeting', () => {
  it('shows "Chat with us" / "We typically reply in a few minutes"', () => {
    render(<ChatWindow cfg={cfg} open onToggle={() => {}} />);
    expect(screen.getByText('Chat with us')).toBeTruthy();
    expect(screen.getByText('We typically reply in a few minutes')).toBeTruthy();
  });

  it('greeting is only an intro: hidden once the chat has messages (no duplicate welcome)', () => {
    const { rerender } = render(<ChatWindow cfg={cfg} open onToggle={() => {}} messages={[]} />);
    expect(screen.getByText(/Hi there/)).toBeTruthy();
    rerender(<ChatWindow cfg={cfg} open onToggle={() => {}} messages={[
      { id: 'b', seq: 1, senderType: 'BOT', senderName: 'Support', body: 'Welcome to our store!', createdAt: now },
      { id: 'v', seq: 2, senderType: 'VISITOR', body: 'Do you resize?', createdAt: now },
    ]} />);
    expect(screen.queryByText(/Hi there/)).toBeNull();
    expect(screen.getByText('Welcome to our store!')).toBeTruthy();
  });
});

describe('header menu', () => {
  const handlers = () => ({
    onChangeName: vi.fn().mockResolvedValue(), onEmailTranscript: vi.fn().mockResolvedValue(), onToggleSound: vi.fn(),
    onEndChat: vi.fn().mockResolvedValue(),
  });

  it('lists every option, and each one works', async () => {
    const h = handlers();
    render(<ChatWindow cfg={cfg} open onToggle={() => {}} visitorName="Ann" soundOn {...h} />);
    fireEvent.click(screen.getByLabelText('Chat menu'));
    expect(screen.getAllByRole('menuitem').map((b) => b.textContent)).toEqual(['Change name', 'Email transcript', 'Sound off', 'End this chat session']);

    fireEvent.click(screen.getByText('Change name'));
    const name = screen.getByLabelText(/Your name/);
    expect(name.value).toBe('Ann');
    fireEvent.change(name, { target: { value: 'Ann Lee' } });
    fireEvent.click(screen.getByText('Save name'));
    await waitFor(() => expect(h.onChangeName).toHaveBeenCalledWith('Ann Lee'));
    expect(await screen.findByText('Your name was updated.')).toBeTruthy();

    fireEvent.click(screen.getByLabelText('Chat menu'));
    fireEvent.click(screen.getByText('Email transcript'));
    fireEvent.change(screen.getByLabelText(/Send the transcript to/), { target: { value: 'nope' } });
    fireEvent.click(screen.getByText('Send transcript'));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(h.onEmailTranscript).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/Send the transcript to/), { target: { value: 'ann@x.test' } });
    fireEvent.click(screen.getByText('Send transcript'));
    await waitFor(() => expect(h.onEmailTranscript).toHaveBeenCalledWith('ann@x.test'));

    fireEvent.click(screen.getByLabelText('Chat menu'));
    fireEvent.click(screen.getByText('Sound off'));
    expect(h.onToggleSound).toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText('Chat menu'));
    fireEvent.click(screen.getByText('End this chat session'));
    expect(h.onEndChat).not.toHaveBeenCalled(); // confirmation first
    fireEvent.click(screen.getByText('End chat'));
    await waitFor(() => expect(h.onEndChat).toHaveBeenCalled());
  });

  it('after the visitor ends the chat the message box is replaced by "Start a new chat"', () => {
    const onStartNew = vi.fn();
    const { rerender } = render(<ChatWindow cfg={cfg} open onToggle={() => {}} ended onStartNew={onStartNew} />);
    expect(screen.queryByLabelText('Message')).toBeNull();
    fireEvent.click(screen.getByText('Start a new chat'));
    expect(onStartNew).toHaveBeenCalled();
    rerender(<ChatWindow cfg={cfg} open onToggle={() => {}} ended={false} onStartNew={onStartNew} />);
    expect(screen.getByLabelText('Message')).toBeTruthy();
  });

  it('chat-ended card: email the transcript (validated) or start a new chat', async () => {
    const onEmailTranscript = vi.fn().mockResolvedValue();
    const onStartNew = vi.fn();
    render(<ChatWindow cfg={cfg} open onToggle={() => {}} ended onStartNew={onStartNew} onEmailTranscript={onEmailTranscript} />);
    expect(screen.getByText('Your chat has ended')).toBeTruthy();
    fireEvent.click(screen.getByText('Email transcript'));
    expect(await screen.findByText('Please enter a valid email')).toBeTruthy();
    expect(onEmailTranscript).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Email for transcript'), { target: { value: 'ann@x.test' } });
    fireEvent.click(screen.getByText('Email transcript'));
    await waitFor(() => expect(onEmailTranscript).toHaveBeenCalledWith('ann@x.test'));
    expect(await screen.findByText('Transcript sent. Check your inbox.')).toBeTruthy();
    fireEvent.click(screen.getByText('Start a new chat'));
    expect(onStartNew).toHaveBeenCalled();
  });

  it('without email set up, the ended card offers only a new chat (no transcript option)', () => {
    render(<ChatWindow cfg={cfg} open onToggle={() => {}} ended onStartNew={() => {}} onEmailTranscript={null} />);
    expect(screen.getByText('Start a new chat')).toBeTruthy();
    expect(screen.queryByText('Email transcript')).toBeNull();
    expect(screen.queryByLabelText('Email for transcript')).toBeNull();
  });

  it('download instead of email: menu item and chat-ended card both download the transcript', async () => {
    const onDownloadTranscript = vi.fn().mockResolvedValue();
    const { unmount } = render(<ChatWindow cfg={cfg} open onToggle={() => {}} onChangeName={vi.fn()} onDownloadTranscript={onDownloadTranscript} />);
    fireEvent.click(screen.getByLabelText('Chat menu'));
    expect(screen.queryByText('Email transcript')).toBeNull();
    fireEvent.click(screen.getByText('Download transcript'));
    await waitFor(() => expect(onDownloadTranscript).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Transcript downloaded.')).toBeTruthy();
    unmount();

    render(<ChatWindow cfg={cfg} open onToggle={() => {}} ended onStartNew={() => {}} onDownloadTranscript={onDownloadTranscript} />);
    expect(screen.getByText(/or download a transcript of this conversation/)).toBeTruthy();
    expect(screen.queryByLabelText('Email for transcript')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Download transcript' }));
    await waitFor(() => expect(onDownloadTranscript).toHaveBeenCalledTimes(2));
  });

  it('header close button only for the full-screen phone layout', () => {
    const { rerender } = render(<ChatWindow cfg={{ ...cfg, layout: { ...cfg.layout, mobileFullscreen: false } }} open onToggle={() => {}} layout={{ mobile: true }} />);
    expect(screen.queryByLabelText('Close chat', { selector: '.lc-head button' })).toBeNull();
    rerender(<ChatWindow cfg={{ ...cfg, layout: { ...cfg.layout, mobileFullscreen: true } }} open onToggle={() => {}} layout={{ mobile: true }} />);
    expect(screen.getByLabelText('Close chat', { selector: '.lc-head button' })).toBeTruthy();
  });

  it('shows a send failure instead of claiming success', async () => {
    const h = handlers();
    h.onEmailTranscript.mockRejectedValue(new Error('Email transcripts are not available right now.'));
    render(<ChatWindow cfg={cfg} open onToggle={() => {}} {...h} />);
    fireEvent.click(screen.getByLabelText('Chat menu'));
    fireEvent.click(screen.getByText('Email transcript'));
    fireEvent.change(screen.getByLabelText(/Send the transcript to/), { target: { value: 'ann@x.test' } });
    fireEvent.click(screen.getByText('Send transcript'));
    expect(await screen.findByText('Email transcripts are not available right now.')).toBeTruthy();
    expect(screen.queryByText(/Transcript sent/)).toBeNull();
  });

  it('hides options that have no handler (e.g. no pop-out inside the pop-out window)', () => {
    render(<ChatWindow cfg={cfg} open onToggle={() => {}} onChangeName={vi.fn()} layout={{ popout: true }} />);
    fireEvent.click(screen.getByLabelText('Chat menu'));
    expect(screen.getAllByRole('menuitem').map((b) => b.textContent)).toEqual(['Change name']);
    expect(screen.queryByLabelText('Minimise chat')).toBeNull();
  });
});

describe('typed pre-chat form', () => {
  const fields = [
    { key: 'name', type: 'name', label: 'Name', required: true },
    { key: 'cf_topic', type: 'select', label: 'Topic', required: true, options: ['Order', 'Sizing'] },
    { key: 'cf_metal', type: 'multiselect', label: 'Metals', required: false, options: ['Gold', 'Silver'] },
    { key: 'cf_size', type: 'number', label: 'Ring size', required: false },
    { key: 'question', type: 'textarea', label: 'Question', required: true },
  ];

  it('renders each type and submits validated values', async () => {
    const onPrechat = vi.fn().mockResolvedValue();
    render(<ChatWindow cfg={{ ...cfg, preChatForm: { enabled: true, fields } }} open onToggle={() => {}} mode="prechat" onPrechat={onPrechat} />);
    expect(screen.getByRole('combobox')).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Metals' })).toBeTruthy();
    fireEvent.click(screen.getByText('Start chat'));
    expect((await screen.findByRole('alert')).textContent).toBe('Name is required');
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'Ann' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Sizing' } });
    fireEvent.click(screen.getByLabelText('Gold'));
    fireEvent.change(screen.getByLabelText(/Question/), { target: { value: 'Can you resize?' } });
    fireEvent.change(screen.getByLabelText(/Ring size/), { target: { value: '7.5' } });
    fireEvent.click(screen.getByText('Start chat'));
    await waitFor(() => expect(onPrechat).toHaveBeenCalledWith({ name: 'Ann', cf_topic: 'Sizing', cf_metal: ['Gold'], cf_size: '7.5', question: 'Can you resize?' }));
  });

  it('fieldError mirrors server rules', () => {
    expect(fieldError({ type: 'email', label: 'Email' }, 'x')).toMatch(/valid email/);
    expect(fieldError({ type: 'number', label: 'Size' }, 'seven')).toMatch(/must be a number/);
    expect(fieldError({ type: 'phone', label: 'Phone' }, '+1 555 0100')).toBe('');
    expect(fieldError({ type: 'phone', label: 'Phone' }, '+91 9876543210')).toBe(''); // 10-digit national number, country code excluded
    expect(fieldError({ type: 'phone', label: 'Phone' }, '+91 98765432100')).toMatch(/7-10 digits/); // 11 national digits
    expect(fieldError({ type: 'phone', label: 'Phone' }, '9876543210')).toBe(''); // no country code, exactly 10
    expect(fieldError({ type: 'phone', label: 'Phone' }, '98765432100')).toMatch(/7-10 digits/); // no country code, 11 digits
    expect(fieldError({ type: 'phone', label: 'Phone' }, '1000')).toMatch(/7-10 digits/); // too short to be a real number
    expect(fieldError({ type: 'phone', label: 'Phone' }, 'abcdefghij')).toMatch(/valid phone number/); // letters never pass
    expect(fieldError({ type: 'date', label: 'Date' }, '2026-12-24')).toBe('');
    expect(fieldError({ key: 'email', label: 'Email' }, 'a@b.co')).toBe(''); // legacy field without a type
    expect(fieldError({ type: 'multiselect', label: 'M', required: true }, [])).toMatch(/required/);
  });
});
