const studycatApiBase = import.meta.env.VITE_STUDYCAT_API_BASE || 'https://medical-studycat.onrender.com/app-api';
const parentToken = import.meta.env.VITE_STUDYCAT_PARENT_TOKEN || '';

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

export async function loadStudycatFamilySnapshot(studentId) {
  const response = await fetch(studycatUrl('/family/snapshot', { studentId }), {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(`Studycat snapshot failed: HTTP ${response.status}`);
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
