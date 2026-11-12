import { it, expect, vi } from 'vitest';

it('passes the page font to the widget host (regression: cssText used to wipe it)', async () => {
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  document.body.style.fontFamily = 'Georgia, serif';
  const s = document.createElement('script');
  s.src = 'https://chat.example.com/widget/chat.js';
  s.dataset.store = 'pk_test';
  document.body.appendChild(s);
  await import('./embed.jsx');
  const host = document.getElementById('livechat-pk_test');
  expect(host).not.toBeNull();
  expect(host.style.getPropertyValue('--lc-page-font')).toBe('Georgia, serif');
  expect(host.style.position).toBe('fixed');
  expect(host.shadowRoot.querySelector('style').textContent).toContain('.lc-launcher');
});
