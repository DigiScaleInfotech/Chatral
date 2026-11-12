import { describe, it, expect } from 'vitest';
import { transcriptHtml } from './printTranscript.js';

const detail = {
  conversation: { createdAt: '2026-10-19T10:00:00Z', status: 'OPEN', assigneeId: 'u1' },
  visitor: { id: 'v123456', name: '<b>Eve</b>', email: 'eve@x.test' },
  attachments: [{ id: 'f1', filename: 'receipt.pdf' }],
  messages: [
    { senderType: 'VISITOR', body: 'Hi <script>alert(1)</script>\nline 2', createdAt: '2026-10-19T10:00:00Z' },
    { senderType: 'NOTE', senderName: 'Ann', body: 'internal', createdAt: '2026-10-19T10:01:00Z' },
    { senderType: 'AGENT', senderName: 'Ann', body: '', attachmentId: 'f1', createdAt: '2026-10-19T10:02:00Z' },
  ],
};

describe('transcriptHtml', () => {
  const html = transcriptHtml({ storeName: 'Aurora', detail, memberName: () => 'Ann' });
  it('escapes visitor-controlled text and keeps line breaks', () => {
    expect(html).not.toContain('<script>alert(1)');
    expect(html).toContain('Hi &lt;script&gt;alert(1)&lt;/script&gt;<br>line 2');
    expect(html).toContain('Chat with &lt;b&gt;Eve&lt;/b&gt;');
  });
  it('marks internal notes, lists files, and shows the header', () => {
    expect(html).toContain('(internal note)');
    expect(html).toContain('Attachment: receipt.pdf');
    expect(html).toContain('Aurora');
    expect(html).toContain('Assigned to Ann');
    expect(html).not.toMatch(/<script/i);
  });
});
