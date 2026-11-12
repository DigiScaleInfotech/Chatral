// Same-origin in production (served by the API at /admin); proxied by Vite in dev.
export async function api(path, { method = 'GET', body, raw, headers = {} } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: { ...(raw ? {} : { 'Content-Type': 'application/json' }), Authorization: `Bearer ${localStorage.getItem('token') || ''}`, ...headers },
    body: raw || (body !== undefined ? JSON.stringify(body) : undefined),
  });
  let data;
  try { data = await res.json(); } catch { data = {}; }
  if (res.status === 401 && !path.startsWith('/auth/login')) {
    localStorage.removeItem('token');
    window.location.href = '/admin/login';
  }
  if (!res.ok) {
    const err = new Error(data.error || FALLBACK[res.status] || 'Something went wrong. Please try again.');
    err.status = res.status;
    err.fields = data.fields || [];
    throw err;
  }
  return data;
}

const FALLBACK = {
  403: "You don't have permission to do this.",
  404: 'Not found - it may have been deleted. Please refresh.',
  413: 'That file is too large.',
  429: 'Too many attempts. Please wait a few minutes and try again.',
  500: 'Server error. Please try again.',
  502: 'Server is not reachable. Is the backend running?',
};

/** Server error → inline field errors + one toast. */
export function showError(err, { message, form } = {}) {
  if (form && err.fields?.length) form.setFields(err.fields.map((f) => ({ name: f.path, errors: [f.message] })));
  if (err instanceof TypeError) return message.error('Cannot reach the server. Check your connection.');
  message.error({ content: err.message, duration: 5 });
}

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export const fmtDur = (s) => {
  if (s == null) return '-';
  if (s < 60) return `${Math.round(s)}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
  return `${Math.floor(s / 3600)}h ${Math.round((s % 3600) / 60)}m`;
};

export const ROLE_LABEL = { OWNER: 'Owner', ADMIN: 'Admin', SUPERVISOR: 'Supervisor', AGENT: 'Agent', SUPER: 'Super admin' };
export const RANK = { AGENT: 1, SUPERVISOR: 2, ADMIN: 3, OWNER: 4, SUPER: 5 };
export const PRIORITY_COLOR = { LOW: 'default', NORMAL: 'blue', HIGH: 'orange', URGENT: 'red' };
export const STATUS_COLOR = { OPEN: 'green', PENDING: 'gold', RESOLVED: 'default' };

const rawTimezones = Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : ['UTC'];
const tzSet = new Set(rawTimezones);
if (tzSet.has('Asia/Calcutta')) tzSet.add('Asia/Kolkata');
if (tzSet.has('Asia/Kolkata')) tzSet.add('Asia/Calcutta');
export const TIMEZONE_OPTIONS = Array.from(tzSet)
  .sort((a, b) => a.localeCompare(b))
  .map((t) => ({ value: t, label: t }));

