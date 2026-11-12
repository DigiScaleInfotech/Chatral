// Tags as removable chips plus a free-text "add" field (no dropdown). Lower-cased, max 30 chars, 20 tags.
import { useState } from 'react';
import { Button, Flex, Input, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

export default function TagEditor({ value = [], onChange, label = 'Tags' }) {
  const [text, setText] = useState('');
  const add = () => {
    const parts = text.split(',').map((t) => t.trim().toLowerCase().slice(0, 30)).filter(Boolean);
    const next = [...new Set([...value, ...parts])].slice(0, 20);
    setText('');
    if (next.length !== value.length) onChange(next);
  };
  return (
    <div>
      {value.length > 0 && (
        <Flex gap={6} wrap style={{ marginBottom: 8 }}>
          {value.map((t) => (
            <Tag key={t} closable bordered={false} color="blue" style={{ margin: 0 }} onClose={(e) => { e.preventDefault(); onChange(value.filter((x) => x !== t)); }}
              closeIcon={<span aria-label={`Remove tag ${t}`}>×</span>}>
              {t}
            </Tag>
          ))}
        </Flex>
      )}
      <Flex gap={6}>
        <Input
          size="small"
          value={text}
          maxLength={60}
          placeholder="Type a tag and press Enter"
          aria-label={`Add ${label.toLowerCase()}`}
          onChange={(e) => setText(e.target.value)}
          onPressEnter={add}
        />
        <Button size="small" icon={<PlusOutlined />} onClick={add} disabled={!text.trim() || value.length >= 20} aria-label="Add tag">Add</Button>
      </Flex>
    </div>
  );
}
