// Direct "open chat" link: https://<shop>/#lc-<store's 8-digit chatLinkId> auto-opens the widget.
import { describe, it, expect } from 'vitest';
import { chatLinkMatches } from './ChatApp.jsx';

describe('chatLinkMatches', () => {
  it('matches only this store\'s own 8-digit id, in the #lc- form', () => {
    expect(chatLinkMatches('#lc-01234567', '01234567')).toBe(true);
    expect(chatLinkMatches('#lc-01234567', '09999999')).toBe(false); // different store's id
    expect(chatLinkMatches('#chat', '01234567')).toBe(false); // old generic hash, not this store's
    expect(chatLinkMatches('#lc-012345678', '01234567')).toBe(false); // 9 digits
    expect(chatLinkMatches('#lc-0123456', '01234567')).toBe(false); // 7 digits
    expect(chatLinkMatches('#lc-abcdefgh', '01234567')).toBe(false); // not digits
    expect(chatLinkMatches('', '01234567')).toBe(false);
    expect(chatLinkMatches('#lc-01234567', undefined)).toBe(false); // config not loaded yet
    expect(chatLinkMatches('#lc-01234567', null)).toBe(false);
  });
});
