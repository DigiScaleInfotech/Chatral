import { describe, it, expect, vi, afterEach } from 'vitest';
import { downloadTranscript } from './ChatApp.jsx';

afterEach(() => vi.restoreAllMocks());

describe('downloadTranscript', () => {
  it('saves a download-only file (octet-stream) via a link that is never added to the shop page', async () => {
    let blob = null;
    let clicked = null;
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('Chat transcript - Shop\n', { status: 200, headers: { 'Content-Disposition': 'attachment; filename="chat-transcript-2026-10-23.txt"' } }));
    URL.createObjectURL = vi.fn((b) => { blob = b; return 'blob:x'; });
    URL.revokeObjectURL = vi.fn();
    const pageClicks = vi.fn();
    document.addEventListener('click', pageClicks, true);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () { clicked = { href: this.href, download: this.download, inPage: document.contains(this) }; });
    await downloadTranscript('https://chat.test/api/widget/k/conversations/c1/transcript', 'tok');
    document.removeEventListener('click', pageClicks, true);
    expect(fetch).toHaveBeenCalledWith('https://chat.test/api/widget/k/conversations/c1/transcript', { headers: { 'X-Visitor-Token': 'tok' } });
    expect(blob.type).toBe('application/octet-stream');
    expect(await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsText(blob); })).toBe('Chat transcript - Shop\n');
    expect(clicked).toEqual({ href: 'blob:x', download: 'chat-transcript-2026-10-23.txt', inPage: false });
    expect(pageClicks).not.toHaveBeenCalled();
  });

  it('reports a missing chat clearly', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 404 }));
    await expect(downloadTranscript('u', 't')).rejects.toThrow('This chat is no longer available.');
  });
});
