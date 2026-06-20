const studycatApiBase = import.meta.env.VITE_STUDYCAT_API_BASE || 'https://medical-studycat.onrender.com/app-api';
const parentToken = import.meta.env.VITE_STUDYCAT_PARENT_TOKEN || '';
const configuredAdminToken = import.meta.env.VITE_STUDYCAT_ADMIN_TOKEN || '';

function studycatUrl(path, params = {}) {
  const base = studycatApiBase.replace(/\/$/, '');
  const origin = typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
  const url = new URL(`${base}${path}`, origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  return base.startsWith('http') ? url.toString() : `${url.pathname}${url.search}`;
}

function authHeaders() {
  return parentToken ? { Authorization: `Bearer ${parentToken}` } : {};
}

function adminHeaders(adminToken = '') {
  const token = configuredAdminToken || adminToken;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function loadStudycatFamilySnapshot(studentId) {
  const response = await fetch(studycatUrl('/family/snapshot', { studentId }), {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(`Studycat snapshot failed: HTTP ${response.status}`);
  return response.json();
}

export async function loadStudycatStudents() {
  const response = await fetch(studycatUrl('/students'), {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(`Studycat students failed: HTTP ${response.status}`);
  return response.json();
}

export async function sendStudycatAdminMessage({ recipientId, recipientName, body, adminToken }) {
  const response = await fetch(studycatUrl('/messages'), {
    method: 'POST',
    headers: adminHeaders(adminToken),
    body: JSON.stringify({ recipientId, recipientName, body }),
  });
  if (!response.ok) throw new Error(`Studycat message failed: HTTP ${response.status}`);
  return response.json();
}

export function subscribeStudycatFamilySnapshot(studentId, onSnapshot, onError) {
  if (typeof EventSource === 'undefined') return () => {};
  const source = new EventSource(studycatUrl('/family/events', { studentId, parentToken }));
  source.onmessage = (event) => {
    try {
      onSnapshot(JSON.parse(event.data));
    } catch (error) {
      onError?.(error);
    }
  };
  source.onerror = () => {
    onError?.(new Error('Studycat realtime connection failed'));
  };
  return () => source.close();
}
