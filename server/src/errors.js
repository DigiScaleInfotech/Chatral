// Turns validation / database errors into plain-English messages for the admin and widget.

const LABELS = {
  name: 'Name', email: 'Email', password: 'Password', phone: 'Phone number', phoneCountry: 'Country',
  guests: 'Guest emails', notes: 'Notes', start: 'Time slot', meetingType: 'Meeting type', meetingTypes: 'Meeting types',
  timezone: 'Timezone', durationMinutes: 'Duration', slotInterval: 'Start every', minNoticeHours: 'Minimum notice',
  maxDaysAhead: 'Book up to (days)', allowedOrigins: 'Website domains', primaryColor: 'Brand colour', title: 'Form heading',
  subtitle: 'Form subheading', eventName: 'Event name', questions: 'Form questions', label: 'Question', reminderHours: 'Reminder hours',
  notifyEmails: 'Team emails', consultantIds: 'Consultants', bufferMinutes: 'Buffer', weeklyHours: 'Weekly hours',
  memberships: 'Store access', siteId: 'Store', role: 'Role', host: 'SMTP host', port: 'SMTP port', user: 'SMTP username',
};

const label = (path) => {
  const key = [...path].reverse().find((p) => typeof p === 'string');
  const idx = path.find((p) => typeof p === 'number');
  const base = LABELS[key] || key || 'Value';
  return idx !== undefined && path.length > 1 ? `${base} #${idx + 1}` : base;
};

function friendly(issue) {
  const what = label(issue.path);
  switch (issue.code) {
    case 'invalid_type':
      return issue.received === 'undefined' || issue.received === 'null' ? `${what} is required` : `${what} has an invalid value`;
    case 'too_small':
      if (issue.type === 'string') return issue.minimum <= 1 ? `${what} is required` : `${what} must be at least ${issue.minimum} characters`;
      if (issue.type === 'array') return issue.minimum <= 1 ? `Please choose at least one ${what.toLowerCase()}` : `${what}: choose at least ${issue.minimum}`;
      return `${what} must be at least ${issue.minimum}`;
    case 'too_big':
      if (issue.type === 'string') return `${what} must be at most ${issue.maximum} characters`;
      if (issue.type === 'array') return `${what}: at most ${issue.maximum} allowed`;
      return `${what} must be at most ${issue.maximum}`;
    case 'invalid_enum_value':
      return `${what}: please choose one of ${issue.options.join(', ')}`;
    case 'invalid_string':
      return issue.validation === 'email' ? `${what} is not a valid email` : issue.validation === 'datetime' ? `${what} is not a valid date/time` : `${what} is invalid`;
    default:
      // Custom messages from .refine()/.regex() are already human-readable; full sentences ("Please …") stand alone.
      if (/^Please /.test(issue.message || '')) return issue.message;
      return issue.message && !/^(Invalid|Required)$/.test(issue.message) ? `${what}: ${issue.message}` : `${what} is invalid`;
  }
}

export function zodToResponse(err) {
  const issues = err.issues || err.errors || [];
  const fields = issues.map((i) => ({ path: i.path, message: friendly(i) }));
  const unique = [...new Set(fields.map((f) => f.message))];
  return {
    error: unique.length === 1 ? unique[0] : `Please fix ${unique.length} fields: ${unique.slice(0, 3).join('; ')}${unique.length > 3 ? '…' : ''}`,
    fields,
  };
}

export function prismaToResponse(err) {
  if (err.code === 'P2025') return [404, { error: 'This record no longer exists. Please refresh the page.' }];
  if (err.code === 'P2002') {
    const target = [].concat(err.meta?.target || []).join(', ');
    return [409, { error: target.includes('email') ? 'A user with this email already exists' : 'This already exists', fields: target ? [{ path: [target], message: 'Already in use' }] : [] }];
  }
  if (err.code === 'P2003') return [400, { error: 'This item is linked to other records and cannot be changed that way.' }];
  if (err.code === 'P2021' || err.code === 'P2022') return [500, { error: 'Database is out of date. Run "npx prisma migrate deploy" in the server folder.' }];
  return null;
}
