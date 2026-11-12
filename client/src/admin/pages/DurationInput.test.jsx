import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../main.jsx', () => ({ useApp: () => ({}) }));
const { DurationInput, fmtSeconds } = await import('./Triggers.jsx');
afterEach(cleanup);

describe('DurationInput (seconds / minutes / hours)', () => {
  it('shows a stored value in the natural unit and always reports seconds', () => {
    const onChange = vi.fn();
    render(<DurationInput value={7200} onChange={onChange} aria-label="Wait" />);
    expect(screen.getByLabelText('Wait').value).toBe('2');
    expect(screen.getByText('hours')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Wait'), { target: { value: '3' } });
    expect(onChange).toHaveBeenLastCalledWith(10800);
  });

  it('seconds stay seconds; labels format each unit', () => {
    const onChange = vi.fn();
    render(<DurationInput value={45} onChange={onChange} aria-label="Delay" />);
    expect(screen.getByLabelText('Delay').value).toBe('45');
    expect(screen.getByText('seconds')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Delay'), { target: { value: '90' } });
    expect(onChange).toHaveBeenLastCalledWith(90);
    expect([fmtSeconds(30), fmtSeconds(120), fmtSeconds(3600), fmtSeconds(0)]).toEqual(['30 s', '2 min', '1 h', '0 s']);
  });
});
