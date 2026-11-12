// Printable chat transcript: a plain, escaped HTML page printed from a hidden iframe.
// Includes internal notes (marked as such) because only agents can print; files are listed by name.

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const when = (d) => new Date(d).toLocaleString();

const WHO = { VISITOR: 'Visitor', BOT: 'Automated', SYSTEM: 'System' };

export function transcriptHtml({ storeName, detail, memberName = (id) => id }) {
  const { conversation: c, visitor: v, messages, attachments = [] } = detail;
  const visitorName = v.name || v.email || `Visitor ${v.id.slice(-4)}`;
  const fileName = (id) => attachments.find((a) => a.id === id)?.filename || 'attachment';
  const rows = messages.map((m) => {
    const who = m.senderType === 'VISITOR' ? visitorName : m.senderType === 'AGENT' || m.senderType === 'NOTE' ? m.senderName || 'Agent' : WHO[m.senderType] || m.senderType;
    const label = m.senderType === 'NOTE' ? ' <em>(internal note)</em>' : '';
    const file = m.attachmentId
      ? `<div class="file">Attachment: ${esc(fileName(m.attachmentId))}</div>`
      : m.meta?.removedAttachment ? `<div class="file">Attachment: ${esc(m.meta.removedAttachment.filename || 'attachment')} (no longer available)</div>` : '';
    return `<tr class="${m.senderType.toLowerCase()}"><td class="t">${esc(when(m.createdAt))}</td><td class="w">${esc(who)}${label}</td><td>${esc(m.body).replace(/\n/g, '<br>')}${file}</td></tr>`;
  }).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>Chat with ${esc(visitorName)}</title>
<style>
body{font:13px/1.5 system-ui,sans-serif;color:#0f172a;margin:24px}
h1{font-size:18px;margin:0 0 4px}.meta{color:#475569;margin-bottom:16px}
table{width:100%;border-collapse:collapse}td{vertical-align:top;padding:6px 8px;border-bottom:1px solid #e2e8f0}
.t{white-space:nowrap;color:#64748b;width:1%}.w{white-space:nowrap;font-weight:600;width:1%}
tr.note td{background:#fffbeb}tr.system td,tr.bot td{color:#64748b}.file{color:#475569;font-style:italic}
@media print{body{margin:0}}
</style></head><body>
<h1>Chat with ${esc(visitorName)}</h1>
<div class="meta">${esc(storeName || '')} · Started ${esc(when(c.createdAt))} · Status ${esc(c.status)}${c.assigneeId ? ` · Assigned to ${esc(memberName(c.assigneeId))}` : ''}${v.email ? ` · ${esc(v.email)}` : ''}</div>
<table>${rows}</table>
</body></html>`;
}

/**
 * Prints through a hidden same-page iframe (no pop-up, so pop-up blockers don't interfere). The print
 * call is made from here because the frame inherits the dashboard CSP, which blocks inline scripts.
 * Returns false if printing could not start.
 */
export function printTranscript(args) {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(frame);
  const w = frame.contentWindow;
  if (!w) { frame.remove(); return false; }
  w.document.open();
  w.document.write(transcriptHtml(args));
  w.document.close();
  setTimeout(() => {
    try { w.focus(); w.print(); } finally { setTimeout(() => frame.remove(), 60_000); }
  }, 100);
  return true;
}
