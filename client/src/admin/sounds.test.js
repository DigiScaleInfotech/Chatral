import { describe, it, expect, vi, beforeEach } from 'vitest';
import { soundFor } from './notifications.js';
import { __setAudioContextFactory, playSound, getSoundStatus, unlockAudio, createDeduper, createSoundListener, loadSoundPrefs, saveSoundPrefs, DEFAULT_PREFS } from './sounds.js';

// Minimal fake AudioContext that records scheduled tones.
function fakeContext(state = 'running') {
  const tones = [];
  const node = () => ({ connect: (n) => n || node(), gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} } });
  return {
    state, tones, currentTime: 0, destination: {},
    resume: vi.fn(async function () { if (this.allowResume) this.state = 'running'; }),
    addEventListener() {},
    createGain: () => node(),
    createOscillator: () => {
      const o = { type: 'sine', frequency: { value: 0 }, connect: (n) => n, start: () => tones.push(o.frequency.value), stop() {} };
      return o;
    },
  };
}

const ctx = { storeIds: ['s1'] };
const ev = (extra = {}, msg = {}) => ({ storeId: 's1', conversation: { id: 'c1' }, message: { id: 'm1', senderType: 'VISITOR', body: 'hi', ...msg }, ...extra });

describe('soundFor (classification)', () => {
  it('new conversation → new-chat sound; existing conversation → message sound', () => {
    expect(soundFor('message', ev({ isNewConversation: true }), ctx)).toBe('newConversation');
    expect(soundFor('message', ev({ isNewConversation: true, isOffline: true }), ctx)).toBe('newConversation');
    expect(soundFor('message', ev(), ctx)).toBe('message');
  });
  it('never for agent replies, notes, bots, system, typing, receipts, notifications or other stores', () => {
    for (const senderType of ['AGENT', 'NOTE', 'BOT', 'SYSTEM']) expect(soundFor('message', ev({}, { senderType }), ctx)).toBeNull();
    expect(soundFor('typing', { storeId: 's1', from: 'visitor' }, ctx)).toBeNull();
    expect(soundFor('receipt', { storeId: 's1' }, ctx)).toBeNull();
    expect(soundFor('notification', { storeId: 's1', kind: 'new_chat' }, ctx)).toBeNull();
    expect(soundFor('message', ev({ storeId: 's2', isNewConversation: true }), ctx)).toBeNull();
  });
});

describe('sound playback', () => {
  beforeEach(() => { localStorage.clear(); });

  it('the two sounds are different tone patterns', () => {
    const c = fakeContext();
    __setAudioContextFactory(() => c);
    expect(playSound('newConversation')).toBe(true);
    const chime = [...c.tones];
    c.tones.length = 0;
    expect(playSound('message')).toBe(true);
    expect(chime).toEqual([1046.5, 1318.5, 1760]);
    expect(c.tones).toEqual([880, 1320]);
  });

  it('respects the master and per-sound toggles (persisted)', () => {
    const c = fakeContext();
    __setAudioContextFactory(() => c);
    saveSoundPrefs({ ...DEFAULT_PREFS, message: false });
    expect(loadSoundPrefs().message).toBe(false);
    expect(playSound('message')).toBe(false);
    expect(playSound('newConversation')).toBe(true);
    saveSoundPrefs({ ...DEFAULT_PREFS, enabled: false });
    expect(playSound('newConversation')).toBe(false);
  });

  it('reports blocked audio honestly and unlocks on a user gesture', async () => {
    const c = fakeContext('suspended');
    __setAudioContextFactory(() => c);
    expect(getSoundStatus()).toBe('blocked');
    expect(playSound('message')).toBe(false);
    expect(await unlockAudio()).toBe('blocked'); // browser still refuses
    c.allowResume = true;
    expect(await unlockAudio()).toBe('ready');
    expect(playSound('message')).toBe(true);
  });

  it('missing or broken Web Audio never throws', async () => {
    __setAudioContextFactory(() => null);
    expect(getSoundStatus()).toBe('unavailable');
    expect(playSound('newConversation')).toBe(false);
    expect(await unlockAudio()).toBe('unavailable');
    __setAudioContextFactory(() => { throw new Error('denied'); });
    expect(getSoundStatus()).toBe('unavailable');
    const broken = fakeContext();
    broken.createOscillator = () => { throw new Error('boom'); };
    __setAudioContextFactory(() => broken);
    expect(playSound('message')).toBe(false);
  });

  it('a replayed / duplicate event id sounds only once', () => {
    const first = createDeduper(3);
    expect(first('m1')).toBe(true);
    expect(first('m1')).toBe(false);
    expect(first(undefined)).toBe(false);
    first('m2'); first('m3'); first('m4'); // m1 evicted after max
    expect(first('m4')).toBe(false);
  });
});

describe('shell sound listener', () => {
  const setup = (storeId = 's1') => {
    const play = vi.fn(() => true);
    const listen = createSoundListener({ getStoreIds: () => [storeId], classify: soundFor, play });
    return { play, listen };
  };

  it('plays new-chat for the first message, message sound after, nothing for agent replies', () => {
    const { play, listen } = setup();
    expect(listen('message', ev({ isNewConversation: true }, { id: 'a1' }))).toBe('newConversation');
    expect(listen('message', ev({}, { id: 'a2' }))).toBe('message');
    expect(listen('message', ev({}, { id: 'a3', senderType: 'AGENT' }))).toBeNull();
    expect(play.mock.calls.map((c) => c[0])).toEqual(['newConversation', 'message']);
  });

  it('a re-delivered event, a reconnect and the parallel new_chat notification never add sounds', () => {
    const { play, listen } = setup();
    listen('message', ev({ isNewConversation: true }, { id: 'b1' }));
    listen('notification', { storeId: 's1', kind: 'new_chat', conversationId: 'c1' });
    listen('message', ev({ isNewConversation: true }, { id: 'b1' })); // replay
    listen('reconnected', {});
    expect(play).toHaveBeenCalledTimes(1);
  });

  it('other store events are silent; muted playback reports nothing played', () => {
    const { play, listen } = setup('s2');
    expect(listen('message', ev({ isNewConversation: true }, { id: 'c9' }))).toBeNull();
    expect(play).not.toHaveBeenCalled();
    const muted = createSoundListener({ getStoreIds: () => ['s1'], classify: soundFor, play: () => false });
    expect(muted('message', ev({}, { id: 'c10' }))).toBeNull();
  });
});

describe('sounds for all of the user stores', () => {
  it('sounds for any store the user can open, never for others', async () => {
    const { soundFor } = await import('./notifications.js');
    const msg = (storeId) => ({ storeId, conversation: { id: 'c' }, message: { id: 'm-' + storeId, senderType: 'VISITOR' }, isNewConversation: true });
    expect(soundFor('message', msg('A'), { storeIds: ['A'] })).toBe('newConversation');
    expect(soundFor('message', msg('B'), { storeIds: ['A'] })).toBeNull();
    expect(soundFor('message', msg('B'), { storeIds: ['A', 'B'] })).toBe('newConversation');
    expect(soundFor('message', msg(undefined), { storeIds: ['A'] })).toBeNull();
    expect(soundFor('message', msg('A'), { storeIds: [] })).toBeNull();
  });
});

describe('customisable sounds: tone, repeat count, own file', () => {
  it('defaults are unchanged: chime once for new chats, tick once for messages', async () => {
    const c = fakeContext();
    __setAudioContextFactory(() => c);
    expect(playSound('newConversation', DEFAULT_PREFS)).toBe(true);
    expect(c.tones).toEqual([1046.5, 1318.5, 1760]);
    c.tones.length = 0;
    expect(playSound('message', DEFAULT_PREFS)).toBe(true);
    expect(c.tones).toEqual([880, 1320]);
  });

  it('plays the chosen tone the chosen number of times (clamped to 1–10)', async () => {
    const { TONES } = await import('./sounds.js');
    const c = fakeContext();
    __setAudioContextFactory(() => c);
    playSound('message', { ...DEFAULT_PREFS, messageTone: 'bell', messageRepeat: 3 });
    expect(c.tones.length).toBe(TONES.bell.notes.length * 3);
    c.tones.length = 0;
    playSound('newConversation', { ...DEFAULT_PREFS, newConversationRepeat: 99 });
    expect(c.tones.length).toBe(TONES.chime.notes.length * 10);
    c.tones.length = 0;
    playSound('newConversation', { ...DEFAULT_PREFS, newConversationRepeat: 0 });
    expect(c.tones.length).toBe(TONES.chime.notes.length);
  });

  it('own sound file: only audio, max 500 KB; removing it falls back to the built-in tone', async () => {
    const { saveSoundFile, loadSoundFile, removeSoundFile } = await import('./sounds.js');
    await expect(saveSoundFile('message', new File(['x'], 'a.txt', { type: 'text/plain' }))).rejects.toThrow(/audio file/);
    await expect(saveSoundFile('message', new File([new Uint8Array(600 * 1024)], 'big.mp3', { type: 'audio/mpeg' }))).rejects.toThrow(/too large/);
    const saved = await saveSoundFile('message', new File([new Uint8Array(10)], 'ding.mp3', { type: 'audio/mpeg' }));
    expect(saved.name).toBe('ding.mp3');
    expect(loadSoundFile('message').dataUrl).toMatch(/^data:audio\/mpeg;base64,/);
    removeSoundFile('message');
    expect(loadSoundFile('message')).toBeNull();
    const c = fakeContext();
    __setAudioContextFactory(() => c);
    playSound('message', { ...DEFAULT_PREFS, messageTone: 'custom' }); // no file any more → built-in tone
    expect(c.tones).toEqual([880, 1320]);
  });
});

describe('own sound file playback', () => {
  it('decodes the stored file without fetch (blocked by the dashboard CSP) and plays it N times', async () => {
    const { saveSoundFile, dataUrlToBuffer } = await import('./sounds.js');
    const wav = new Uint8Array([82, 73, 70, 70, 1, 2, 3, 4]); // bytes are only passed through to decodeAudioData
    await saveSoundFile('newConversation', new File([wav], 'new chat.wav', { type: 'audio/wav' }));
    const c = fakeContext();
    const starts = [];
    let decodedBytes = null;
    c.decodeAudioData = (buf) => { decodedBytes = new Uint8Array(buf); return Promise.resolve({ duration: 1 }); };
    c.createBufferSource = () => ({ buffer: null, connect() {}, start: (t) => starts.push(t) });
    __setAudioContextFactory(() => c);
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    expect(playSound('newConversation', { ...DEFAULT_PREFS, newConversationTone: 'custom', newConversationRepeat: 3 })).toBe(true);
    await vi.waitFor(() => expect(starts.length).toBe(3));
    expect(fetchSpy).not.toHaveBeenCalled();
    expect([...decodedBytes]).toEqual([...wav]);
    expect(starts[1] - starts[0]).toBeCloseTo(1.3); // file length + small gap
    expect(new Uint8Array(dataUrlToBuffer('data:audio/wav;base64,UklGRg=='))).toEqual(new Uint8Array([82, 73, 70, 70]));
    fetchSpy.mockRestore();
  });
});
