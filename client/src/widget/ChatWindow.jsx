// Pure UI. Used by the live widget (ChatApp) and by the dashboard's live preview with draft config.
import { useEffect, useRef, useState } from 'react';
import { cssVars } from './styles.js';

const Icon = {
  chat: <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3C6.5 3 2 6.8 2 11.5c0 2.4 1.2 4.6 3.1 6.1L4 21l4.2-2.1c1.2.4 2.5.6 3.8.6 5.5 0 10-3.8 10-8.5S17.5 3 12 3z" /></svg>,
  close: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>,
  min: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M6 12h12" /></svg>,
  send: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 20.5l18-8.5L3 3.5v6.6l12 1.9-12 1.9z" /></svg>,
  clip: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 11.5l-8.6 8.6a5 5 0 01-7.1-7.1l8.6-8.6a3.5 3.5 0 015 5L10.3 18a2 2 0 01-2.8-2.8l7.9-7.9" /></svg>,
  menu: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>,
  file: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z" /><path d="M14 3v6h6" /></svg>,
};

/** Plain text with safe http(s) links only. React escapes everything else. */

/** Chats are deleted after this many days without a visitor message (store setting, default 30). */
export const retentionNotice = (cfg) => `Uploaded files are kept for ${cfg.retentionDays || 30} days after your last message, then removed automatically.`;
export function Linkified({ text }) {
  const parts = String(text || '').split(/(https?:\/\/[^\s<>"']+)/g);
  return parts.map((p, i) => (/^https?:\/\//.test(p) ? <a key={i} href={p} target="_blank" rel="noopener noreferrer nofollow">{p}</a> : p));
}

const initials = (n) => (n || '?').trim().slice(0, 1).toUpperCase();
const time = (d) => new Date(d).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

function Avatar({ src, name }) {
  return src ? <img className="lc-avatar" src={src} alt="" /> : <div className="lc-avatar">{initials(name)}</div>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const fieldType = (f) => f.type || (['name', 'email', 'phone'].includes(f.key) ? f.key : f.multiline ? 'textarea' : 'text');
const isEmpty = (v) => v === undefined || v === null || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && !v.length);

/** Client-side check mirroring the server's validation (the server re-validates everything). */
export function fieldError(f, v) {
  const t = fieldType(f);
  if (isEmpty(v)) return f.required ? `${f.label} is required` : '';
  const s = typeof v === 'string' ? v.trim() : v;
  if (t === 'email' && !EMAIL_RE.test(s)) return 'Please enter a valid email';
  if (t === 'phone') {
    if (!/^[+()0-9\s.-]{4,30}$/.test(s)) return 'Please enter a valid phone number';
    // Country code (a leading +<1-3 digits>) doesn't count toward the national number's digit count.
    const national = s.replace(/^\+\d{1,3}[\s.-]*/, '').replace(/\D/g, '').length;
    if (national < 7 || national > 10) return 'Phone number must be 7-10 digits (not counting the country code)';
  }
  if (t === 'number' && !/^-?\d+(\.\d+)?$/.test(s)) return `${f.label} must be a number`;
  if (t === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${f.label} must be a date`;
  return '';
}

function Field({ f, value, onChange }) {
  const t = fieldType(f);
  if (t === 'textarea') return <textarea rows={4} value={value || ''} onChange={(e) => onChange(e.target.value)} maxLength={2000} />;
  if (t === 'select') {
    return (
      <select value={value || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">Choose…</option>
        {(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  if (t === 'multiselect') {
    const cur = Array.isArray(value) ? value : [];
    return (
      <span className="lc-checks" role="group" aria-label={f.label}>
        {(f.options || []).map((o) => (
          <span key={o} className="lc-check">
            <input type="checkbox" checked={cur.includes(o)} onChange={(e) => onChange(e.target.checked ? [...cur, o] : cur.filter((x) => x !== o))} aria-label={o} />
            <span>{o}</span>
          </span>
        ))}
      </span>
    );
  }
  const type = { email: 'email', phone: 'tel', number: 'number', date: 'date' }[t] || 'text';
  const auto = { name: 'name', email: 'email', phone: 'tel' }[t] || 'off';
  return <input type={type} inputMode={t === 'number' ? 'decimal' : undefined} autoComplete={auto} value={value || ''} onChange={(e) => onChange(e.target.value)} maxLength={t === 'email' ? 200 : t === 'text' ? 200 : 100} />;
}

function Form({ fields, submitLabel, onSubmit, extra, className = 'lc-form', initial = {} }) {
  const [values, setValues] = useState(initial);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setErr('');
    for (const f of fields) {
      const problem = fieldError(f, values[f.key]);
      if (problem) return setErr(problem);
    }
    setBusy(true);
    try { await onSubmit(values); } catch (e2) { setErr(e2.message || 'Could not send. Please try again.'); } finally { setBusy(false); }
  }
  return (
    <form className={className} onSubmit={submit} noValidate>
      {extra}
      {fields.map((f) => (
        <label key={f.key}>
          {f.label}{f.required ? ' *' : ''}
          <Field f={f} value={values[f.key]} onChange={(v) => setValues((cur) => ({ ...cur, [f.key]: v }))} />
        </label>
      ))}
      {err && <div className="lc-err" role="alert">{err}</div>}
      <button className="lc-btn" type="submit" disabled={busy}>{busy ? 'Sending…' : submitLabel}</button>
    </form>
  );
}

/** Header menu (Change name, Email transcript, Sound, Pop out, End chat). Only working options are shown. */
function Menu({ items, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="lc-menu" role="menu">
      {items.map((it) => (
        <button key={it.key} type="button" role="menuitem" className={`lc-menu-item${it.danger ? ' danger' : ''}`} onClick={() => { onClose(); it.onClick(); }}>
          {it.label}
        </button>
      ))}
    </div>
  );
}

const FIELD_LABEL = { name: 'Name', email: 'Email', phone: 'Phone' };

function Message({ m, cfg, showName, onRetry, onSuggest, isLastBot, onContact, Attachment, seen }) {
  if (m.senderType === 'SYSTEM') return <div className="lc-system">{m.body}</div>;
  const me = m.senderType === 'VISITOR';
  const form = m.meta?.form;
  return (
    <>
      {!me && showName && <div className="lc-name">{m.senderName || cfg.agentName}</div>}
      <div className={`lc-row ${me ? 'me' : 'them'}`}>
        {!me && <Avatar src={m.senderAvatar || cfg.avatarUrl} name={m.senderName || cfg.agentName} />}
        {/* An attachment without text is shown as a bare thumbnail/file card, not inside a coloured bubble. */}
        <div className={`lc-bubble${m.attachmentId && !m.body ? ' media' : ''}`}>
          {m.attachmentId && Attachment ? <Attachment id={m.attachmentId} meta={m.meta} /> : null}
          {!m.attachmentId && m.meta?.removedAttachment && (
            <div className="lc-removed-file">{m.meta.removedAttachment.filename || 'File'} - no longer available</div>
          )}
          {m.body ? <Linkified text={m.body} /> : null}
        </div>
      </div>
      {me && (m.state === 'failed'
        ? <div className="lc-meta failed" onClick={() => onRetry(m)} role="button">Not sent - tap to retry</div>
        : <div className="lc-meta">{m.state === 'pending' ? 'Sending…' : seen ? 'Seen' : time(m.createdAt)}</div>)}
      {form && !m.formDone && onContact && (
        <Form className="lc-form card" fields={form.fields.map((k) => ({ key: k, label: FIELD_LABEL[k], required: k !== 'phone' }))} submitLabel="Send details" onSubmit={(v) => onContact(v, m)} />
      )}
      {form && m.formDone && <div className="lc-system">Thanks - details sent ✓</div>}
      {isLastBot && m.meta?.suggestedReplies?.length > 0 && (
        <div className="lc-chips">{m.meta.suggestedReplies.map((s) => <button key={s} className="lc-chip" onClick={() => onSuggest(s)}>{s}</button>)}</div>
      )}
    </>
  );
}

/** Shown instead of the message box once the visitor ends the chat: start again, or email the transcript. */
function EndedCard({ onStartNew, onEmailTranscript, onDownloadTranscript }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState({ busy: false, error: '', sent: false });
  async function download() {
    setState({ busy: true, error: '', sent: false });
    try { await onDownloadTranscript(); setState({ busy: false, error: '', sent: false }); }
    catch (err) { setState({ busy: false, error: err.message || 'Could not download the transcript.', sent: false }); }
  }
  async function send(e) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setState({ busy: false, error: 'Please enter a valid email', sent: false });
    setState({ busy: true, error: '', sent: false });
    try { await onEmailTranscript(email.trim()); setState({ busy: false, error: '', sent: true }); }
    catch (err) { setState({ busy: false, error: err.message || 'Could not send the transcript.', sent: false }); }
  }
  return (
    <form className="lc-foot lc-ended lc-form" onSubmit={send}>
      <div className="lc-ended-title">{Icon.chat}<span>Your chat has ended</span></div>
      <div className="lc-ended-text">
        Thank you for chatting with us. Feel free to start a new chat{onEmailTranscript ? ', or enter your email to receive a transcript of this conversation.' : onDownloadTranscript ? ', or download a transcript of this conversation.' : '.'}
      </div>
      {onEmailTranscript && (
        <input type="email" value={email} placeholder="Email" aria-label="Email for transcript" maxLength={200}
          onChange={(e) => { setEmail(e.target.value); if (state.error || state.sent) setState({ busy: false, error: '', sent: false }); }} />
      )}
      {state.error && <div className="lc-err" role="alert">{state.error}</div>}
      {state.sent && <div className="lc-ended-sent" role="status">Transcript sent. Check your inbox.</div>}
      <div className="lc-ended-actions">
        <button type="button" className="lc-btn lc-btn-light" onClick={onStartNew}>Start a new chat</button>
        {onEmailTranscript && <button type="submit" className="lc-btn" disabled={state.busy}>{state.busy ? 'Sending…' : 'Email transcript'}</button>}
        {!onEmailTranscript && onDownloadTranscript && <button type="button" className="lc-btn" disabled={state.busy} onClick={download}>{state.busy ? 'Preparing…' : 'Download transcript'}</button>}
      </div>
    </form>
  );
}

export default function ChatWindow({
  cfg, open, onToggle, mode = 'chat', online = true, messages = [], typing = false, unread = 0, agentReadSeq = 0,
  onSend, onRetry, onUpload, onPrechat, onOffline, onContact, onTyping, layout = {}, Attachment, banner, canUpload = true,
  preview = null, onDismissPreview,
  // header menu (all optional; an option is only shown when its handler is given)
  visitorName = '', onChangeName, onEmailTranscript, onDownloadTranscript, soundOn = true, onToggleSound, onEndChat, ended = false, onStartNew,
}) {
  const [text, setText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [panel, setPanel] = useState(null); // null | 'name' | 'transcript' | 'end'
  const [notice, setNotice] = useState('');
  const bodyRef = useRef(null);
  const fileRef = useRef(null);
  const typingRef = useRef(0);
  const m = cfg.messages;

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, typing, open, mode]);

  function submit(e) {
    e?.preventDefault();
    const t = text.trim();
    if (!t) return;
    onSend?.(t);
    setText('');
    onTyping?.(false);
  }

  function changed(v) {
    setText(v);
    const now = Date.now();
    if (now - typingRef.current > 2000) { typingRef.current = now; onTyping?.(true, v); }
  }

  const lastBotIdx = messages.length && messages[messages.length - 1].senderType === 'BOT' ? messages.length - 1 : -1;
  const lastSeenVisitorSeq = [...messages].reverse().find((x) => x.senderType === 'VISITOR' && x.seq && x.seq <= agentReadSeq)?.seq;
  const cls = ['lc-root', layout.popout ? 'popout' : layout.inline ? 'inline' : 'fixed', cfg.launcher.position, open ? 'open' : '', layout.mobile && cfg.layout.mobileFullscreen && !layout.popout ? 'mobile-full' : ''].join(' ');
  const menuItems = [
    onChangeName && { key: 'name', label: 'Change name', onClick: () => setPanel('name') },
    onEmailTranscript && { key: 'transcript', label: 'Email transcript', onClick: () => setPanel('transcript') },
    onDownloadTranscript && { key: 'download', label: 'Download transcript', onClick: async () => { try { await onDownloadTranscript(); setNotice('Transcript downloaded.'); } catch (e) { setNotice(e.message || 'Could not download the transcript.'); } } },
    onToggleSound && { key: 'sound', label: soundOn ? 'Sound off' : 'Sound on', onClick: () => { onToggleSound(); setNotice(soundOn ? 'Sound is off.' : 'Sound is on.'); } },
    onEndChat && { key: 'end', label: 'End this chat session', danger: true, onClick: () => setPanel('end') },
  ].filter(Boolean);
  const done = (msg) => { setPanel(null); setNotice(msg); };

  return (
    <div className={cls} style={cssVars(cfg)}>
      {open && (
        <section className="lc-panel" role="dialog" aria-label={m.title}>
          <header className="lc-head">
            {cfg.logoUrl ? <img className="logo" src={cfg.logoUrl} alt="" /> : <Avatar src={cfg.avatarUrl} name={cfg.agentName} />}
            <div className="lc-grow">
              <div className="lc-title">{mode === 'offline' || mode === 'offline_sent' ? m.offlineTitle : m.title}</div>
              {m.subtitle && <div className="lc-sub">{m.subtitle}</div>}
            </div>
            {menuItems.length > 0 && mode === 'chat' && (
              <button className="lc-icon" onClick={() => setMenuOpen((v) => !v)} aria-label="Chat menu" aria-haspopup="menu" aria-expanded={menuOpen}>{Icon.menu}</button>
            )}
            {/* No minimise button: the launcher closes the chat. Phones keep a close button (full-screen chat covers the launcher). */}
            {!layout.inline && !layout.popout && layout.mobile && cfg.layout.mobileFullscreen && <button className="lc-icon" onClick={onToggle} aria-label="Close chat">{Icon.close}</button>}
            {menuOpen && <Menu items={menuItems} onClose={() => setMenuOpen(false)} />}
          </header>
          {banner && <div className="lc-banner">{banner}</div>}
          {notice && !banner && <div className="lc-banner info" role="status" onClick={() => setNotice('')}>{notice}</div>}
          <div className="lc-body" ref={bodyRef} aria-live="polite">
            {mode === 'prechat' && (
              <Form fields={cfg.preChatForm.fields} submitLabel="Start chat" onSubmit={onPrechat} extra={m.greeting ? <div className="lc-note">{m.greeting}</div> : null} />
            )}
            {mode === 'offline' && (
              <Form fields={[{ key: 'name', label: 'Name', required: true }, { key: 'email', label: 'Email', required: true }, { key: 'message', label: 'Message', required: true, multiline: true }]}
                submitLabel="Send message" onSubmit={onOffline} extra={<><div className="lc-note">{m.offlineText}</div><div className="lc-retention" role="note">{retentionNotice(cfg)}</div></>} />
            )}
            {mode === 'offline_sent' && <div className="lc-center">✓<br />{m.offlineThanks}</div>}
            {mode === 'chat' && panel === 'name' && (
              <Form fields={[{ key: 'name', type: 'name', label: 'Your name', required: true }]} initial={{ name: visitorName }} submitLabel="Save name"
                extra={<button type="button" className="lc-link" onClick={() => setPanel(null)}>← Back to chat</button>}
                onSubmit={async (v) => { await onChangeName(v.name.trim()); done('Your name was updated.'); }} />
            )}
            {mode === 'chat' && panel === 'transcript' && (
              <Form fields={[{ key: 'email', type: 'email', label: 'Send the transcript to', required: true }]} submitLabel="Send transcript"
                extra={<button type="button" className="lc-link" onClick={() => setPanel(null)}>← Back to chat</button>}
                onSubmit={async (v) => { await onEmailTranscript(v.email.trim()); done('Transcript sent. Check your inbox.'); }} />
            )}
            {mode === 'chat' && panel === 'end' && (
              <div className="lc-form">
                <div className="lc-note">End this chat? You can start a new chat at any time.</div>
                <button type="button" className="lc-btn" onClick={async () => { try { await onEndChat(); done('Chat ended. Thanks for reaching out!'); } catch (e) { setNotice(e.message || 'Could not end the chat.'); setPanel(null); } }}>End chat</button>
                <button type="button" className="lc-link" onClick={() => setPanel(null)}>Cancel</button>
              </div>
            )}
            {mode === 'chat' && !panel && (
              <>
                <div className="lc-retention" role="note">{retentionNotice(cfg)}</div>
                {/* The greeting is an intro, not a chat message: shown only until the conversation has any message, never alongside automated welcomes. */}
                {m.greeting && messages.length === 0 && <Message m={{ senderType: 'BOT', body: m.greeting, senderName: cfg.agentName }} cfg={cfg} showName />}
                {messages.map((msg, i) => (
                  <Message key={msg.clientMsgId || msg.id} m={msg} cfg={cfg} Attachment={Attachment}
                    showName={msg.senderType !== 'VISITOR' && (i === 0 || messages[i - 1].senderType === 'VISITOR' || messages[i - 1].senderName !== msg.senderName)}
                    onRetry={onRetry} onSuggest={(s) => onSend?.(s)} isLastBot={i === lastBotIdx} onContact={onContact} seen={msg.seq && msg.seq === lastSeenVisitorSeq} />
                ))}
                {typing && <div className="lc-row them"><Avatar src={cfg.avatarUrl} name={cfg.agentName} /><div className="lc-bubble lc-typing" aria-label="Agent is typing"><i /><i /><i /></div></div>}
              </>
            )}
          </div>
          {mode === 'chat' && !panel && ended && <EndedCard onStartNew={onStartNew} onEmailTranscript={onEmailTranscript} onDownloadTranscript={onDownloadTranscript} />}
          {mode === 'chat' && !panel && !ended && (
            <form className="lc-foot" onSubmit={submit}>
              {canUpload && onUpload && (
                <>
                  <button type="button" className="lc-icon" onClick={() => fileRef.current?.click()} aria-label="Attach a file">{Icon.clip}</button>
                  <input ref={fileRef} type="file" hidden accept="image/png,image/jpeg,image/gif,image/webp,application/pdf,text/plain"
                    onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onUpload(f); }} />
                </>
              )}
              <textarea rows={1} value={text} placeholder={m.placeholder} aria-label="Message" maxLength={5000}
                onChange={(e) => changed(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }} />
              <button type="submit" className="lc-icon lc-send" disabled={!text.trim()} aria-label="Send">{Icon.send}</button>
            </form>
          )}
        </section>
      )}
      {!open && !layout.inline && preview && (
        <div className="lc-preview" role="status">
          <button type="button" className="lc-preview-body" onClick={onToggle} aria-label="Open chat to read the message">
            <span>{preview.body}</span>
          </button>
          <button type="button" className="lc-icon lc-preview-close" onClick={onDismissPreview} aria-label="Dismiss message preview">{Icon.close}</button>
        </div>
      )}
      {!layout.inline && (
        <button className={`lc-launcher ${cfg.launcher.label && !open ? 'labeled' : ''}`} onClick={onToggle} aria-label={open ? 'Close chat' : 'Open chat'}>
          {open ? Icon.close : Icon.chat}
          {!open && cfg.launcher.label ? <span>{cfg.launcher.label}</span> : null}
          {!open && unread > 0 && <span className="lc-badge">{unread > 9 ? '9+' : unread}</span>}
        </button>
      )}
    </div>
  );
}

export { Icon };
