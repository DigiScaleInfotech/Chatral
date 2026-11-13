// Header control for notification sounds: master + per-sound toggles, tone / own file, how many times it plays,
// real browser status, test buttons. Settings and uploaded files are kept in this browser.
import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Divider, Flex, InputNumber, Popover, Select, Switch, Tooltip, Typography, App } from 'antd';
import { SoundOutlined, MutedOutlined, PlayCircleOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  getSoundStatus, onSoundStatus, unlockAudio, loadSoundPrefs, saveSoundPrefs, playSound,
  TONES, MAX_REPEAT, loadSoundFile, saveSoundFile, removeSoundFile,
} from '../sounds.js';

const STATUS_TEXT = {
  ready: 'Sound is on in this browser.',
  blocked: 'Your browser is blocking sound until you click "Enable sound".',
  unavailable: 'This browser does not support in-app sound.',
};

const SOUNDS = [
  ['newConversation', 'New conversation'],
  ['message', 'New message in an existing chat'],
];

function SoundRow({ kind, title, prefs, update, status }) {
  const { message } = App.useApp();
  const fileRef = useRef(null);
  const [file, setFile] = useState(() => loadSoundFile(kind));
  const tone = prefs[`${kind}Tone`];

  async function upload(f) {
    try {
      const saved = await saveSoundFile(kind, f);
      setFile(saved);
      update({ [`${kind}Tone`]: 'custom' });
      message.success(`"${saved.name}" will play for: ${title.toLowerCase()}`);
    } catch (e) {
      message.error(e.message);
    }
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <Flex justify="space-between" align="center" gap={8}>
        <div>{title}</div>
        <Flex gap={6} align="center">
          <Tooltip title="Play">
            <Button size="small" type="text" icon={<PlayCircleOutlined />} aria-label={`Play ${title} sound`} disabled={status !== 'ready'}
              onClick={() => playSound(kind, { ...prefs, enabled: true, [kind]: true })} />
          </Tooltip>
          <Switch size="small" checked={prefs[kind]} disabled={!prefs.enabled} onChange={(v) => update({ [kind]: v })} aria-label={`${title} sound`} />
        </Flex>
      </Flex>
      <Flex gap={6} align="center" style={{ marginTop: 6 }}>
        <Select size="small" style={{ flex: 1 }} value={tone === 'custom' && !file ? 'chime' : tone} aria-label={`${title} tone`}
          disabled={!prefs.enabled || !prefs[kind]}
          options={[...Object.entries(TONES).map(([k, t]) => ({ value: k, label: t.label })), { value: 'custom', label: file ? `My file: ${file.name}` : 'My file (upload)…' }]}
          onChange={(v) => (v === 'custom' && !file ? fileRef.current?.click() : update({ [`${kind}Tone`]: v }))} />
        <InputNumber size="small" min={1} max={MAX_REPEAT} style={{ width: 92 }} value={prefs[`${kind}Repeat`]} addonAfter="×"
          aria-label={`${title} plays`} disabled={!prefs.enabled || !prefs[kind]}
          onChange={(v) => update({ [`${kind}Repeat`]: Math.min(MAX_REPEAT, Math.max(1, Math.round(v || 1))) })} />
      </Flex>
      <Flex gap={6} align="center" style={{ marginTop: 4 }}>
        <Button size="small" type="link" icon={<UploadOutlined />} style={{ padding: 0 }} onClick={() => fileRef.current?.click()}>
          {file ? 'Replace sound file' : 'Upload sound file'}
        </Button>
        {file && (
          <Button size="small" type="link" danger icon={<DeleteOutlined />} style={{ padding: 0 }} aria-label={`Remove ${title} sound file`}
            onClick={() => { removeSoundFile(kind); setFile(null); if (tone === 'custom') update({ [`${kind}Tone`]: kind === 'message' ? 'tick' : 'chime' }); }}>
            Remove
          </Button>
        )}
        <input ref={fileRef} type="file" accept="audio/*" hidden aria-label={`${title} sound file`}
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) upload(f); }} />
      </Flex>
    </div>
  );
}

export default function SoundControl() {
  const [prefs, setPrefs] = useState(loadSoundPrefs);
  const [status, setStatus] = useState(getSoundStatus);
  useEffect(() => onSoundStatus(setStatus), []);

  const update = (patch) => setPrefs((p) => saveSoundPrefs({ ...p, ...patch }));
  const muted = !prefs.enabled || (!prefs.newConversation && !prefs.message);
  const icon = muted || status !== 'ready' ? <MutedOutlined /> : <SoundOutlined />;
  const label = muted ? 'Sounds off' : status === 'ready' ? 'Sounds on' : status === 'blocked' ? 'Sound blocked by browser' : 'Sound unavailable';

  const content = (
    <div style={{ width: 300 }}>
      <Flex justify="space-between" align="center">
        <Typography.Text strong>Notification sounds</Typography.Text>
        <Switch size="small" checked={prefs.enabled} onChange={(v) => update({ enabled: v })} aria-label="All notification sounds" />
      </Flex>
      <Divider style={{ margin: '10px 0' }} />
      {SOUNDS.map(([key, title]) => <SoundRow key={key} kind={key} title={title} prefs={prefs} update={update} status={status} />)}
      <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
        Choose a tone or upload your own (max 500 KB), and how many times it plays. Saved in this browser.
      </Typography.Text>
      <Divider style={{ margin: '10px 0' }} />
      <Typography.Text type={status === 'ready' ? 'secondary' : 'warning'} style={{ fontSize: 12, display: 'block' }} role="status">
        {STATUS_TEXT[status]}
      </Typography.Text>
      {status === 'blocked' && (
        <Button size="small" type="primary" style={{ marginTop: 8 }} onClick={() => unlockAudio()}>Enable sound</Button>
      )}
    </div>
  );

  return (
    <Popover trigger="click" placement="bottomRight" content={content}>
      <Tooltip title={label}>
        <Badge dot={!muted && status === 'blocked'} color="orange" offset={[-4, 6]}>
          <Button type="text" icon={icon} aria-label={label} />
        </Badge>
      </Tooltip>
    </Popover>
  );
}
