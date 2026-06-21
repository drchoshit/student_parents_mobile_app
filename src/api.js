const studycatApiBase = import.meta.env.VITE_STUDYCAT_API_BASE || 'https://medical-studycat.onrender.com/app-api';
const parentToken = import.meta.env.VITE_STUDYCAT_PARENT_TOKEN || '';
const configuredAdminToken = import.meta.env.VITE_STUDYCAT_ADMIN_TOKEN || '';
const configuredMentoringToken = import.meta.env.VITE_MENTORING_TOKEN || '';
const mentoringApiBase = import.meta.env.VITE_MENTORING_API_BASE || 'https://mentoring-api-6l1a.onrender.com';
const medipenaltyApiBase = import.meta.env.VITE_MEDIPENALTY_API_BASE || 'https://medipenalty.kr/api';

function studycatUrl(path, params = {}) {
  const base = studycatApiBase.replace(/\/$/, '');
  const origin = typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
  const url = new URL(`${base}${path}`, origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  return base.startsWith('http') ? url.toString() : `${url.pathname}${url.search}`;
}

function externalUrl(base, path, params = {}) {
  const normalizedBase = base.replace(/\/$/, '');
  const origin = typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
  const url = new URL(`${normalizedBase}${path}`, origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  });
  return normalizedBase.startsWith('http') ? url.toString() : `${url.pathname}${url.search}`;
}

function authHeaders() {
  return parentToken ? { Authorization: `Bearer ${parentToken}` } : {};
}

function localToken(...keys) {
  if (typeof localStorage === 'undefined') return '';
  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value?.trim()) return value.trim();
  }
  return '';
}

function mentoringHeaders() {
  const token = configuredMentoringToken || localToken('medical-study-mentor-token', 'mentorToken', 'mentoring-token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function adminHeaders(adminToken = '') {
  const token = configuredAdminToken || adminToken;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await readJson(response);
  if (!response.ok) {
    const message = typeof payload === 'object' && payload?.error ? payload.error : `HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return payload;
}

function extractRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  const candidates = [payload.data, payload.items, payload.rows, payload.list, payload.students, payload.weeks];
  return candidates.find(Array.isArray) ?? [];
}

function normalizePenaltyRows(payload) {
  return extractRows(payload)
    .map((row, index) => {
      const source = row && typeof row === 'object' ? row : {};
      const id = String(source.id ?? source.student_id ?? source.studentId ?? `penalty-${index + 1}`).trim();
      const name = String(source.name ?? source.studentName ?? source.student_name ?? id).trim();
      const points = Number(source.points ?? source.total_points ?? source.totalPoints ?? 0);
      return {
        id,
        name,
        grade: String(source.grade ?? '').trim(),
        points: Number.isFinite(points) ? points : 0,
        updatedAt: String(source.updated_at ?? source.updatedAt ?? payload?.updatedAt ?? '').trim(),
      };
    })
    .filter((row) => row.id);
}

function readMentoringTasks(value, result = [], subject = '멘토링') {
  if (!value) return result;
  if (typeof value === 'string') {
    const text = value.trim();
    if (!text) return result;
    if ((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']'))) {
      try {
        return readMentoringTasks(JSON.parse(text), result, subject);
      } catch {
        // fall through to newline parsing
      }
    }
    text.split('\n').map((line) => line.trim()).filter(Boolean).forEach((line, index) => {
      result.push({
        id: `mentor-line-${subject}-${result.length}-${index}`,
        subject,
        title: line,
        completed: false,
        portalStatus: 'synced',
      });
    });
    return result;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => readMentoringTasks(item, result, subject));
    return result;
  }
  if (typeof value !== 'object') return result;

  const item = value;
  const taskTitle = item.title ?? item.text ?? item.name ?? item.assignment ?? item.content ?? item.memo;
  if (taskTitle && (item.completed !== undefined || item.done !== undefined || item.checked !== undefined || item.title || item.text || item.assignment)) {
    result.push({
      id: String(item.id ?? `mentor-task-${result.length + 1}`),
      subject: String(item.subject ?? item.subjectName ?? item.subject_name ?? subject),
      title: String(taskTitle).trim(),
      completed: Boolean(item.completed || item.done || item.checked || item.status === 'done' || item.status === 'completed'),
      portalStatus: 'synced',
    });
    return result;
  }

  Object.entries(item).forEach(([key, child]) => {
    if (/wrong|score|image|problem/i.test(key)) return;
    const nextSubject = /tasks|todos|assignments|daily|record|memo|content/i.test(key) ? subject : key;
    readMentoringTasks(child, result, nextSubject);
  });
  return result;
}

function normalizeMentoringResult(recordPayload, studentId, weekId) {
  const payload = recordPayload?.record ?? recordPayload ?? {};
  const weekRecord = payload.week_record ?? payload.weekRecord ?? {};
  const taskRows = [];

  if (Array.isArray(payload.subjects)) {
    payload.subjects.forEach((subjectRow) => {
      const subject = subjectRow.subject || subjectRow.subjectName || subjectRow.subject_name || subjectRow.name || subjectRow.title || '멘토링';
      readMentoringTasks(subjectRow.tasks ?? subjectRow.todos ?? subjectRow.assignments, taskRows, subject);
    });
  }
  if (Array.isArray(payload.subject_records ?? payload.subjectRecords)) {
    (payload.subject_records ?? payload.subjectRecords).forEach((subjectRow) => {
      const subject = subjectRow.subject || subjectRow.subjectName || subjectRow.subject_name || subjectRow.name || subjectRow.title || '멘토링';
      readMentoringTasks(subjectRow.tasks ?? subjectRow.todos ?? subjectRow.assignments ?? subjectRow.daily_tasks ?? subjectRow.b_daily_tasks_this_week, taskRows, subject);
    });
  }
  readMentoringTasks(weekRecord.b_daily_tasks_this_week ?? weekRecord.b_daily_tasks, taskRows, '다음 주 액션');
  readMentoringTasks(payload.tasks ?? payload.todos, taskRows, '멘토링');

  const seen = new Set();
  const tasks = taskRows.filter((task) => {
    const key = `${task.subject}-${task.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return task.title;
  });

  const record = {
    week: String(weekRecord.title ?? weekRecord.week ?? payload.week ?? weekId ?? '최근 주차'),
    mentor: String(payload.mentorName ?? payload.mentor_name ?? payload.mentor ?? 'medical_suite'),
    focus: String(payload.focus ?? payload.summary ?? payload.title ?? '주간 멘토링 기록'),
    memo: String(payload.memo ?? payload.content ?? payload.comment ?? weekRecord.memo ?? '멘토링 포털에서 불러온 기록입니다.'),
    next: tasks[0]?.title ?? String(weekRecord.next ?? weekRecord.action ?? '다음 주 학습 액션을 확인하세요.'),
    studentId,
    weekId: String(weekId ?? ''),
    tasks,
  };

  return { records: tasks.length || record.memo ? [record] : [], tasks };
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

export async function loadMedipenaltySummary() {
  const directUrl = externalUrl(medipenaltyApiBase, '/summary/cumulative', { _t: Date.now() });
  const proxyUrl = studycatUrl('/../penalty-api/summary/cumulative', { _t: Date.now() });
  const payload = await fetchJson(proxyUrl).catch(() => fetchJson(directUrl));
  return {
    rows: normalizePenaltyRows(payload),
    status: 'medipenalty 실시간 연결됨',
    updatedAt: new Date().toISOString(),
  };
}

export async function loadMentoringPortal(studentId) {
  const headers = mentoringHeaders();
  if (!headers.Authorization) {
    return {
      records: [],
      tasks: [],
      status: 'medical_suite 토큰 필요',
      requiresAuth: true,
    };
  }

  const weeksUrl = studycatUrl('/../mentoring-api/api/weeks', { _t: Date.now() });
  const directWeeksUrl = externalUrl(mentoringApiBase, '/api/weeks', { _t: Date.now() });
  const weeksPayload = await fetchJson(weeksUrl, { headers }).catch(() => fetchJson(directWeeksUrl, { headers }));
  const weeks = extractRows(weeksPayload).sort((a, b) => Number(a.id ?? a.weekId ?? 0) - Number(b.id ?? b.weekId ?? 0));
  const latestWeek = weeks.at(-1);
  const weekId = latestWeek?.id ?? latestWeek?.weekId ?? latestWeek?._id;
  if (!weekId) {
    return {
      records: [],
      tasks: [],
      status: 'medical_suite 주차 데이터 없음',
    };
  }

  const params = { studentId, weekId, _t: Date.now() };
  const recordUrl = studycatUrl('/../mentoring-api/api/mentoring/record', params);
  const directRecordUrl = externalUrl(mentoringApiBase, '/api/mentoring/record', params);
  const recordPayload = await fetchJson(recordUrl, { headers }).catch(() => fetchJson(directRecordUrl, { headers }));
  const normalized = normalizeMentoringResult(recordPayload, studentId, weekId);
  return {
    ...normalized,
    status: normalized.records.length ? 'medical_suite 실시간 연결됨' : 'medical_suite 과제 없음',
    updatedAt: new Date().toISOString(),
  };
}
