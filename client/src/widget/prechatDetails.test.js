import { describe, it, expect } from 'vitest';
import { prechatDetails } from './ChatApp.jsx';

describe('prechatDetails', () => {
  it('lists every answered field as "Label : value" in form order, skipping empty ones', () => {
    const fields = [
      { key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' },
      { key: 'cf_metal', label: 'Metals' }, { key: 'cf_note', label: 'Note' }, { key: 'question', label: 'Question' },
    ];
    const v = { name: 'keval', email: 'k@x.test', phone: '+918956985658', cf_metal: ['Gold', 'Silver'], cf_note: '  ', question: ' vsvdsv ' };
    expect(prechatDetails(fields, v)).toBe('Name : keval\nEmail : k@x.test\nPhone : +918956985658\nMetals : Gold, Silver\nQuestion : vsvdsv');
    expect(prechatDetails(fields, {})).toBe('');
  });
});
