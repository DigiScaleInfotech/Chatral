import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import TagEditor from './TagEditor.jsx';

vi.mock('../main.jsx', () => ({ useApp: () => ({}) }));
const { withPages, assigneeOptions } = await import('../pages/Inbox.jsx');

afterEach(cleanup);

describe('TagEditor', () => {
  it('adds typed tags (lower-cased, de-duplicated, comma-separated) and removes them', () => {
    const onChange = vi.fn();
    const { rerender } = render(<TagEditor value={['vip']} onChange={onChange} />);
    const input = screen.getByLabelText('Add tags');
    fireEvent.change(input, { target: { value: 'Refund, VIP ,  rings' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', keyCode: 13 });
    expect(onChange).toHaveBeenLastCalledWith(['vip', 'refund', 'rings']);
    rerender(<TagEditor value={['vip', 'refund']} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Remove tag vip'));
    expect(onChange).toHaveBeenLastCalledWith(['refund']);
  });

  it('has no dropdown, only a text field and an Add button', () => {
    render(<TagEditor value={[]} onChange={() => {}} />);
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.getByRole('button', { name: /add tag/i }).disabled).toBe(true);
  });
});

describe('withPages', () => {
  it('interleaves page views with messages by time and keeps unsent messages last', () => {
    const msgs = [
      { id: 'm1', createdAt: '2026-10-19T10:00:00Z' },
      { id: 'm2', createdAt: '2026-10-19T10:05:00Z' },
      { clientMsgId: 'pending' },
    ];
    const pages = [{ id: 'p1', url: 'https://s.test/cart', createdAt: '2026-10-19T10:02:00Z' }];
    expect(withPages(msgs, pages).map((x) => x.id || x.clientMsgId)).toEqual(['m1', 'p1', 'm2', 'pending']);
    expect(withPages(msgs, pages)[1].pageView).toBe(true);
    expect(withPages(msgs, [])).toBe(msgs);
  });
});

describe('assigneeOptions', () => {
  const me = { id: 'u1', name: 'Ann' };
  const members = [{ userId: 'u1', name: 'Ann' }, { userId: 'u2', name: 'Bob' }];
  const labelOf = (opts, id) => opts.find((o) => o.value === id)?.label;
  it('unassigned chats select "Unassigned"', () => {
    expect(labelOf(assigneeOptions({ conv: { assigneeId: null }, members, me, supervisor: true }), '')).toBe('Unassigned');
  });
  it('never shows a raw id: uses the member list, then the server-provided name, then "Unknown agent"', () => {
    expect(labelOf(assigneeOptions({ conv: { assigneeId: 'u2' }, members, me, supervisor: true }), 'u2')).toBe('Bob');
    expect(labelOf(assigneeOptions({ conv: { assigneeId: 'u9' }, members: [], me, supervisor: true, assignee: { id: 'u9', name: 'Zed' } }), 'u9')).toBe('Zed (not a member)');
    expect(labelOf(assigneeOptions({ conv: { assigneeId: 'u9' }, members: [], me, supervisor: false }), 'u9')).toBe('Unknown agent');
    const agentView = assigneeOptions({ conv: { assigneeId: 'u2' }, members, me, supervisor: false, assignee: { id: 'u2', name: 'Bob' } });
    expect(agentView.map((o) => o.label)).toEqual(['Unassigned', 'Ann', 'Bob']);
    expect(agentView.find((o) => o.value === 'u2').disabled).toBe(true);
  });
});
