// iOS Safari/Chrome can get stuck zoomed in after focusing a form field when the host page's own
// <meta name="viewport"> locks the zoom level. preventStuckZoom briefly relaxes that page-level lock
// while a widget field has focus, and restores it on blur - it never changes the page permanently.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { preventStuckZoom } from './ChatApp.jsx';

let meta;
let host;
let shadow;
let input;
let cleanup;

function iosUA() {
  return vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
  );
}

beforeEach(() => {
  meta = document.createElement('meta');
  meta.name = 'viewport';
  meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
  document.head.appendChild(meta);
  host = document.createElement('div');
  document.body.appendChild(host);
  shadow = host.attachShadow({ mode: 'open' });
  input = document.createElement('input');
  shadow.appendChild(input);
});

afterEach(() => {
  cleanup?.();
  cleanup = null;
  meta.remove();
  host.remove();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('preventStuckZoom', () => {
  it('on iOS: relaxes the page viewport while a widget field has focus, restores it after blur', async () => {
    iosUA();
    vi.useFakeTimers();
    cleanup = preventStuckZoom(shadow);

    input.focus();
    expect(meta.getAttribute('content')).toContain('maximum-scale=10');
    expect(meta.getAttribute('content')).toContain('user-scalable=yes');
    expect(meta.getAttribute('content')).not.toMatch(/user-scalable=no/);

    input.blur();
    expect(meta.getAttribute('content')).toContain('maximum-scale=10'); // not restored yet (debounced)
    vi.advanceTimersByTime(150);
    expect(meta.getAttribute('content')).toBe('width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
  });

  it('ignores focus on elements outside the widget shadow root', () => {
    iosUA();
    cleanup = preventStuckZoom(shadow);
    const outside = document.createElement('input');
    document.body.appendChild(outside);
    outside.focus();
    expect(meta.getAttribute('content')).toContain('user-scalable=no');
    outside.remove();
  });

  it('does nothing on non-iOS browsers (Android stays untouched)', () => {
    vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (Linux; Android 14) Chrome/120.0');
    cleanup = preventStuckZoom(shadow);
    input.focus();
    expect(meta.getAttribute('content')).toBe('width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
  });

  it('cleanup removes listeners and restores the original viewport immediately', () => {
    iosUA();
    cleanup = preventStuckZoom(shadow);
    input.focus();
    expect(meta.getAttribute('content')).toContain('maximum-scale=10');
    cleanup();
    expect(meta.getAttribute('content')).toBe('width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
    cleanup = null;
  });
});
