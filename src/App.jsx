import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  Award,
  BarChart3,
  Bell,
  BookOpenCheck,
  CalendarCheck,
  Check,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  DoorOpen,
  Edit3,
  FileSpreadsheet,
  Home,
  LineChart,
  LogOut,
  MessageSquareText,
  NotebookPen,
  Pause,
  PieChart,
  Play,
  Plus,
  RefreshCw,
  Salad,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Timer,
  Trash2,
  UserRound,
  UsersRound,
} from 'lucide-react';
import {
  attendance,
  centerInfo,
  examSchedule,
  initialSchedules,
  initialTodos,
  linkedSystems,
  points,
  studySummary,
  subjectStudy,
  userProfile,
  weeklyLearning,
} from './data/mockData.js';
import {
  getDadaMealsForMonth,
  getNextDadaMealAfter,
  toDateKey,
} from './data/dadaMeals2026June.js';
import {
  loadMedipenaltySummary,
  loadMentoringPortal,
  loadStudycatFamilySnapshot,
  loadStudycatStudents,
  sendStudycatAdminMessage,
  subscribeStudycatFamilySnapshot,
} from './api.js';

const studentNav = [
  { id: 'home', label: '홈', icon: Home },
  { id: 'study', label: '학습', icon: BarChart3 },
  { id: 'exam', label: '타이머', icon: Timer },
  { id: 'plan', label: '일정', icon: CalendarCheck },
  { id: 'record', label: '기록', icon: Award },
];

const parentNav = [
  { id: 'home', label: '홈', icon: Home },
  { id: 'attendance', label: '출결', icon: DoorOpen },
  { id: 'study', label: '학습', icon: BarChart3 },
  { id: 'mentoring', label: '멘토링', icon: MessageSquareText },
  { id: 'record', label: '기록', icon: Award },
];

const adminSections = [
  { id: 'dashboard', label: '대시보드', icon: Home },
  { id: 'students', label: '학생', icon: UsersRound },
  { id: 'analysis', label: '학습분석', icon: BarChart3 },
  { id: 'schedules', label: '일정', icon: CalendarCheck },
  { id: 'meals', label: '도시락', icon: FileSpreadsheet },
  { id: 'messages', label: '푸시메시지', icon: Send },
  { id: 'attendance', label: '입퇴실', icon: DoorOpen },
  { id: 'mentoring', label: '멘토링', icon: MessageSquareText },
  { id: 'penalties', label: '벌점', icon: ClipboardCheck },
];

const timeFilters = [
  { key: 'today', label: '일간' },
  { key: 'week', label: '주간' },
  { key: 'month', label: '월간' },
  { key: 'custom', label: '기간' },
];

function formatMinutes(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (!hours) return `${mins}분`;
  return `${hours}시간 ${String(mins).padStart(2, '0')}분`;
}

function formatTimer(seconds) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const MEAL_STORAGE_KEY = 'admin-meal-rows-v1';
const ATTENDANCE_STORAGE_KEY = 'admin-attendance-rows-v1';
const LOCAL_SYNC_EVENT = 'family-local-sync-updated';

function emitLocalSyncUpdate() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(LOCAL_SYNC_EVENT));
}

function readStoredJson(key, fallback) {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '');
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStoredJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  emitLocalSyncUpdate();
}

function splitMealText(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || '')
    .split(/\n|,|·/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function excelSerialToDate(value) {
  const serial = Number(value);
  if (!Number.isFinite(serial) || serial < 1) return '';
  const excelEpoch = Date.UTC(1899, 11, 30);
  const date = new Date(excelEpoch + serial * 24 * 60 * 60 * 1000);
  return toDateKey(date);
}

function normalizeDateText(value, fallbackYear = 2026) {
  if (value instanceof Date) return toDateKey(value);
  if (typeof value === 'number') return excelSerialToDate(value);
  const text = String(value || '').trim();
  if (!text) return '';
  const isoMatch = text.match(/(\d{4})[-./년\s]+(\d{1,2})[-./월\s]+(\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
  }
  const monthDayMatch = text.match(/(\d{1,2})\D+(\d{1,2})/);
  if (monthDayMatch) {
    return `${fallbackYear}-${monthDayMatch[1].padStart(2, '0')}-${monthDayMatch[2].padStart(2, '0')}`;
  }
  return text;
}

function seedMealRows() {
  return getDadaMealsForMonth('2026-06').map((meal) => ({
    ...meal,
    id: `dada-${meal.date}`,
    note: meal.source,
  }));
}

function readStoredMeals() {
  const rows = readStoredJson(MEAL_STORAGE_KEY, []);
  return Array.isArray(rows) && rows.length ? rows : seedMealRows();
}

function normalizeMealRow(row, index) {
  const keys = Object.fromEntries(Object.entries(row).map(([key, value]) => [String(key).trim().toLowerCase(), value]));
  const date = normalizeDateText(keys.date ?? keys['날짜'] ?? keys.day ?? keys['일자'] ?? keys['월일']);
  return {
    id: `meal-${date || index}-${Date.now()}`,
    date,
    lunch: splitMealText(keys.lunch ?? keys['점심'] ?? keys['중식'] ?? keys['lunch menu']),
    dinner: splitMealText(keys.dinner ?? keys['저녁'] ?? keys['석식'] ?? keys['dinner menu']),
    kcal: String(keys.kcal ?? keys['칼로리'] ?? '').trim(),
    note: String(keys.note ?? keys['비고'] ?? '').trim(),
    source: '관리자 업로드 엑셀',
  };
}

function mealForDate(rows, value = new Date()) {
  const dateKey = toDateKey(value);
  return rows.find((meal) => meal.date === dateKey) ?? null;
}

function nextMealAfter(rows, value = new Date()) {
  const dateKey = toDateKey(value);
  return rows.find((meal) => meal.date > dateKey) ?? getNextDadaMealAfter(value);
}

function buildMealSync(mealRows = readStoredMeals()) {
  const plan = Array.isArray(mealRows) && mealRows.length ? mealRows : seedMealRows();
  const todayMeal = mealForDate(plan);
  return {
    mealPlan: plan,
    todayMeal,
    nextMeal: todayMeal ? null : nextMealAfter(plan),
    mealStatus: plan.some((meal) => String(meal.id || '').startsWith('dada-'))
      ? `다다익찬 2026년 6월 이미지 메뉴 적용됨 · ${plan.length}일`
      : `관리자 엑셀 업로드 반영됨 · ${plan.length}건`,
  };
}

function readStoredAttendanceRows() {
  const rows = readStoredJson(ATTENDANCE_STORAGE_KEY, []);
  return Array.isArray(rows) ? rows : [];
}

function normalizeAttendanceRow(row, index) {
  const keys = Object.fromEntries(Object.entries(row).map(([key, value]) => [String(key).trim().toLowerCase(), value]));
  const studentId = String(keys.studentid ?? keys.student_id ?? keys.id ?? keys['학생id'] ?? keys['아이디'] ?? '').trim();
  const name = String(keys.name ?? keys.studentname ?? keys.student_name ?? keys['이름'] ?? keys['학생명'] ?? '').trim();
  const status = String(keys.status ?? keys['상태'] ?? keys['구분'] ?? keys.type ?? '').trim();
  const checkIn = String(keys.checkin ?? keys.check_in ?? keys['입실'] ?? keys['등원'] ?? '').trim();
  const checkOut = String(keys.checkout ?? keys.check_out ?? keys['퇴실'] ?? keys['하원'] ?? '').trim();
  const out = String(keys.out ?? keys['외출'] ?? '').trim();
  const back = String(keys.back ?? keys['복귀'] ?? '').trim();
  const time = String(keys.time ?? keys['시간'] ?? '').trim();
  const seat = String(keys.seat ?? keys['좌석'] ?? keys.room ?? keys['자리'] ?? '').trim();
  return {
    id: `attendance-${studentId || name || index}-${Date.now()}`,
    studentId,
    name,
    status: status || (checkOut ? '하원' : checkIn ? '입실 중' : '기록 있음'),
    checkIn,
    checkOut,
    out,
    back,
    time,
    seat,
    note: String(keys.note ?? keys['비고'] ?? '').trim(),
    source: '관리자 업로드 입퇴실 파일',
  };
}

function readLocalAssets() {
  return {
    mealRows: readStoredMeals(),
    attendanceRows: readStoredAttendanceRows(),
  };
}

function findExternalStudentRow(rows, studentId, studentName) {
  const id = String(studentId || '').trim();
  const name = String(studentName || '').trim();
  return (rows ?? []).find((row) => String(row.id || '').trim() === id)
    ?? (rows ?? []).find((row) => String(row.studentId || '').trim() === id)
    ?? (rows ?? []).find((row) => name && String(row.name || '').trim() === name)
    ?? null;
}

function buildAttendanceFromFile(row, fallback) {
  if (!row) return fallback;
  const timeline = [
    row.checkIn ? { time: row.checkIn, label: '입실 완료', tone: 'good' } : null,
    row.out ? { time: row.out, label: '외출', tone: 'neutral' } : null,
    row.back ? { time: row.back, label: '복귀', tone: 'good' } : null,
    row.checkOut ? { time: row.checkOut, label: '하원 완료', tone: 'neutral' } : null,
  ].filter(Boolean);
  return {
    ...fallback,
    status: row.status || fallback.status,
    checkIn: row.checkIn || fallback.checkIn || '-',
    checkOut: row.checkOut || fallback.checkOut || '-',
    seat: row.seat || fallback.seat,
    timeline: timeline.length ? timeline : fallback.timeline,
  };
}

function penaltyPointFromRow(row) {
  if (!row) return null;
  const value = Number(row.points || 0);
  if (!Number.isFinite(value) || value === 0) return null;
  return {
    id: `medipenalty-${row.id}`,
    type: value > 0 ? '벌점' : '상점',
    amount: value > 0 ? -Math.abs(value) : Math.abs(value),
    reason: 'medipenalty 운영 사이트 누적',
    date: row.updatedAt ? formatUpdatedAt(row.updatedAt) : '실시간',
  };
}

const defaultSyncData = {
  userProfile,
  studySummary,
  subjectStudy,
  weeklyLearning,
  schedules: initialSchedules,
  todos: initialTodos,
  attendance,
  points,
  linkedSystems,
  students: [],
  reports: [],
  penaltyRows: [],
  penaltyStatus: 'medipenalty 연결 전',
  currentPenalty: null,
  mentoringRecords: [],
  mentoringTasks: [],
  mentoringStatus: 'medical_suite 토큰 필요',
  attendanceRows: [],
  ...buildMealSync(),
  syncStatus: 'Studycat 연결 대기',
  updatedAt: null,
};

const SyncDataContext = createContext(defaultSyncData);

function useSyncData() {
  return useContext(SyncDataContext) ?? defaultSyncData;
}

function safeMinutes(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? Math.max(0, Math.floor(next)) : fallback;
}

function formatUpdatedAt(value) {
  if (!value) return '아직 동기화 전';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '동기화 시간 확인 필요';
  return date.toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toParentSchedule(item) {
  const time = item.start ? `${item.day ?? '오늘'} ${item.start}` : item.time ?? '오늘';
  return {
    id: item.id ?? createId('schedule'),
    time,
    title: item.title ?? 'Studycat 일정',
    tag: item.type ? `Studycat ${item.type}` : item.tag ?? 'Studycat 연동',
  };
}

function toParentTodo(task) {
  return {
    id: task.id ?? createId('todo'),
    title: task.title ?? 'Studycat 과제',
    done: Boolean(task.completed),
  };
}

function studycatStatusText(student) {
  if (!student) return 'Studycat 연결 대기';
  if (student.status === 'studying') return `${student.subject || '선택 과목'} 공부 중`;
  if (student.status === 'break') return '잠시 휴식 중';
  return '최근 기록 대기';
}

function buildSyncData(snapshot, linkedStudentId, connectionState, operatingData = {}, localAssets = readLocalAssets()) {
  const report = snapshot?.report ?? snapshot?.reports?.[0] ?? null;
  const student = snapshot?.students?.find((item) => item.id === linkedStudentId) ?? snapshot?.students?.[0] ?? null;
  const reports = Array.isArray(snapshot?.reports) ? snapshot.reports : report ? [report] : [];
  const students = Array.isArray(snapshot?.students) ? snapshot.students : [];
  const penaltyRows = Array.isArray(operatingData.penaltyRows) ? operatingData.penaltyRows : [];
  const mentoringRecords = Array.isArray(operatingData.mentoringRecords) ? operatingData.mentoringRecords : [];
  const mentoringTasks = Array.isArray(operatingData.mentoringTasks) ? operatingData.mentoringTasks : [];
  const attendanceRows = Array.isArray(localAssets.attendanceRows) ? localAssets.attendanceRows : [];
  const mealSync = buildMealSync(localAssets.mealRows);
  const baseLinkedSystems = linkedSystems.map((system) => {
    if (system.name === 'medical_suite 멘토링 포털') {
      return {
        ...system,
        status: operatingData.mentoringStatus || 'medical_suite 토큰 필요',
      };
    }
    if (system.name === '식단 엑셀') {
      return {
        ...system,
        status: mealSync.mealStatus,
      };
    }
    if (system.name === '입퇴실 파일') {
      return {
        ...system,
        status: attendanceRows.length ? `관리자 업로드 ${attendanceRows.length}건 반영됨` : 'StudyCat 출결 또는 파일 업로드 대기',
      };
    }
    return system;
  });
  if (!report && !student) {
    const currentPenalty = findExternalStudentRow(penaltyRows, linkedStudentId, '');
    const livePenaltyPoint = penaltyPointFromRow(currentPenalty);
    const externalStudentName = currentPenalty?.name || userProfile.studentName;
    const fileAttendance = findExternalStudentRow(attendanceRows, linkedStudentId, externalStudentName);
    return {
      ...defaultSyncData,
      userProfile: {
        ...userProfile,
        studentName: externalStudentName,
        parentName: `${externalStudentName} 학부모`,
      },
      attendance: buildAttendanceFromFile(fileAttendance, attendance),
      points: [...(livePenaltyPoint ? [livePenaltyPoint] : []), ...points].slice(0, 8),
      ...mealSync,
      linkedSystems: baseLinkedSystems.map((system) => (
        system.name === 'StudyCat' ? { ...system, status: connectionState } : system
      )),
      reports,
      students,
      penaltyRows,
      penaltyStatus: operatingData.penaltyStatus || defaultSyncData.penaltyStatus,
      currentPenalty,
      mentoringRecords,
      mentoringTasks,
      mentoringStatus: operatingData.mentoringStatus || defaultSyncData.mentoringStatus,
      attendanceRows,
      syncStatus: connectionState,
    };
  }

  const nextStudentName = report?.profile?.studentName || report?.studentName || student?.name || userProfile.studentName;
  const nextSummary = report?.studySummary
    ? {
        today: safeMinutes(report.studySummary.today, studySummary.today),
        week: safeMinutes(report.studySummary.week, studySummary.week),
        month: safeMinutes(report.studySummary.month, studySummary.month),
        custom: safeMinutes(report.studySummary.custom, studySummary.custom),
        streak: safeMinutes(report.studySummary.streak, studySummary.streak),
        goal: safeMinutes(report.studySummary.goal, studySummary.goal),
      }
    : {
        ...studySummary,
        today: safeMinutes(student?.todayMinutes, studySummary.today),
      };

  const nextSubjectStudy = Array.isArray(report?.subjectStudy) && report.subjectStudy.length
    ? report.subjectStudy.map((item, index) => ({
        subject: item.subject ?? `과목 ${index + 1}`,
        minutes: safeMinutes(item.minutes),
        color: item.color ?? subjectStudy[index % subjectStudy.length]?.color ?? '#12372f',
        note: item.note ?? 'Studycat 실시간',
      }))
    : subjectStudy;

  const nextWeeklyLearning = Array.isArray(report?.weeklyLearning) && report.weeklyLearning.length
    ? report.weeklyLearning.map((item) => ({
        day: item.day ?? item.date?.slice(5) ?? '일',
        minutes: safeMinutes(item.minutes),
        completion: safeMinutes(item.completion),
      }))
    : weeklyLearning;

  const nextSchedules = Array.isArray(report?.schedules) && report.schedules.length
    ? report.schedules.map(toParentSchedule)
    : initialSchedules;

  const nextTodos = Array.isArray(report?.tasks) && report.tasks.length
    ? report.tasks.map(toParentTodo)
    : initialTodos;

  const nextAttendance = report?.attendance
    ? {
        status: report.attendance.status ?? studycatStatusText(student),
        checkIn: report.attendance.checkIn ?? '-',
        checkOut: report.attendance.checkOut ?? '-',
        seat: report.attendance.seat ?? attendance.seat,
        timeline: Array.isArray(report.attendance.timeline) && report.attendance.timeline.length
          ? report.attendance.timeline
          : attendance.timeline,
      }
    : {
        ...attendance,
        status: studycatStatusText(student),
      };
  const fileAttendance = findExternalStudentRow(attendanceRows, linkedStudentId, nextStudentName);
  const mergedAttendance = buildAttendanceFromFile(fileAttendance, nextAttendance);
  const currentPenalty = findExternalStudentRow(penaltyRows, linkedStudentId, nextStudentName);

  const rewardPoints = report?.rewards
    ? [{
        id: 'studycat-stars',
        type: '별',
        amount: safeMinutes(report.rewards.fruits),
        reason: 'Studycat 보상 잔액',
        date: '실시간',
      }]
    : [];
  const livePenaltyPoint = penaltyPointFromRow(currentPenalty);
  const penaltyPoint = !livePenaltyPoint && report?.penalty
    ? [{
        id: 'studycat-penalty',
        type: '벌점',
        amount: -safeMinutes(report.penalty.points),
        reason: 'medipenalty 누적',
        date: '실시간',
      }]
    : [];

  return {
    userProfile: {
      ...userProfile,
      studentName: nextStudentName,
      parentName: `${nextStudentName} 학부모`,
      target: studycatStatusText(student),
      phone: report?.profile?.studentPhone || userProfile.phone,
    },
    studySummary: nextSummary,
    subjectStudy: nextSubjectStudy,
    weeklyLearning: nextWeeklyLearning,
    schedules: nextSchedules,
    todos: nextTodos,
    attendance: mergedAttendance,
    points: [...rewardPoints, ...(livePenaltyPoint ? [livePenaltyPoint] : penaltyPoint), ...points].slice(0, 8),
    linkedSystems: baseLinkedSystems.map((system) => (
      system.name === 'StudyCat'
        ? {
            ...system,
            status: report ? `실시간 연결됨 · ${formatUpdatedAt(report.updatedAt)}` : connectionState,
          }
        : system.name === '입퇴실 파일' && fileAttendance
          ? {
              ...system,
              status: `입퇴실 파일 반영됨 · ${fileAttendance.time || fileAttendance.checkIn || fileAttendance.checkOut || '최근 업로드'}`,
            }
        : system
    )),
    students,
    reports,
    penaltyRows,
    penaltyStatus: operatingData.penaltyStatus || defaultSyncData.penaltyStatus,
    currentPenalty,
    mentoringRecords,
    mentoringTasks,
    mentoringStatus: operatingData.mentoringStatus || defaultSyncData.mentoringStatus,
    attendanceRows,
    ...mealSync,
    syncStatus: report ? `Studycat 동기화 완료 · ${formatUpdatedAt(report.updatedAt)}` : connectionState,
    updatedAt: report?.updatedAt ?? snapshot?.serverTime ?? null,
  };
}

function App() {
  const searchParams = new URLSearchParams(window.location.search);
  const demoRole = searchParams.get('role');
  const initialRole = demoRole === 'parent' || demoRole === 'student' || demoRole === 'admin' ? demoRole : null;
  const [role, setRole] = useState('student');
  const [sessionRole, setSessionRole] = useState(initialRole);
  const [activeTab, setActiveTab] = useState('home');
  const [timeFilter, setTimeFilter] = useState('today');
  const [schedules, setSchedules] = useState(initialSchedules);
  const [todos, setTodos] = useState(initialTodos);
  const [adminToken, setAdminToken] = useState('');
  const [linkedStudentId, setLinkedStudentId] = useState(
    searchParams.get('studentId') || localStorage.getItem('studycat-linked-student-id') || 'qtf258',
  );
  const [familySnapshot, setFamilySnapshot] = useState(null);
  const [syncStatus, setSyncStatus] = useState('Studycat 연결 대기');
  const [localAssets, setLocalAssets] = useState(readLocalAssets);
  const [operatingData, setOperatingData] = useState({
    penaltyRows: [],
    penaltyStatus: 'medipenalty 연결 전',
    mentoringRecords: [],
    mentoringTasks: [],
    mentoringStatus: 'medical_suite 토큰 필요',
  });

  const syncData = useMemo(
    () => buildSyncData(familySnapshot, linkedStudentId, syncStatus, operatingData, localAssets),
    [familySnapshot, linkedStudentId, localAssets, operatingData, syncStatus],
  );

  useEffect(() => {
    const refreshLocalAssets = () => setLocalAssets(readLocalAssets());
    window.addEventListener(LOCAL_SYNC_EVENT, refreshLocalAssets);
    window.addEventListener('storage', refreshLocalAssets);
    return () => {
      window.removeEventListener(LOCAL_SYNC_EVENT, refreshLocalAssets);
      window.removeEventListener('storage', refreshLocalAssets);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const snapshotStudentId = sessionRole === 'admin' ? undefined : linkedStudentId;

    async function refreshSnapshot() {
      try {
        const [snapshot, liveStudents] = await Promise.all([
          loadStudycatFamilySnapshot(snapshotStudentId),
          sessionRole === 'admin' ? loadStudycatStudents().catch(() => null) : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setFamilySnapshot(liveStudents?.students ? { ...snapshot, students: liveStudents.students } : snapshot);
        setSyncStatus('Studycat 연결됨');
      } catch {
        if (!cancelled) setSyncStatus('Studycat 연결 실패');
      }
    }

    void refreshSnapshot();
    const unsubscribe = subscribeStudycatFamilySnapshot(
      snapshotStudentId,
      (snapshot) => {
        if (cancelled) return;
        setFamilySnapshot(snapshot);
        setSyncStatus('Studycat 실시간 연결됨');
      },
      () => {
        if (!cancelled) setSyncStatus('Studycat 실시간 재연결 대기');
      },
    );
    const id = window.setInterval(refreshSnapshot, 30000);

    return () => {
      cancelled = true;
      unsubscribe();
      window.clearInterval(id);
    };
  }, [linkedStudentId, sessionRole]);

  useEffect(() => {
    if (!sessionRole) return undefined;
    let cancelled = false;

    async function refreshOperatingData() {
      const [penaltyResult, mentoringResult] = await Promise.allSettled([
        loadMedipenaltySummary(),
        sessionRole === 'admin'
          ? Promise.resolve({ records: [], tasks: [], status: '학생 선택 시 medical_suite 조회' })
          : loadMentoringPortal(linkedStudentId),
      ]);
      if (cancelled) return;

      setOperatingData((current) => {
        const next = { ...current };
        if (penaltyResult.status === 'fulfilled') {
          next.penaltyRows = penaltyResult.value.rows;
          next.penaltyStatus = `${penaltyResult.value.status} · ${formatUpdatedAt(penaltyResult.value.updatedAt)}`;
        } else {
          next.penaltyStatus = 'medipenalty 연결 실패';
        }
        if (mentoringResult.status === 'fulfilled') {
          next.mentoringRecords = mentoringResult.value.records;
          next.mentoringTasks = mentoringResult.value.tasks;
          next.mentoringStatus = mentoringResult.value.updatedAt
            ? `${mentoringResult.value.status} · ${formatUpdatedAt(mentoringResult.value.updatedAt)}`
            : mentoringResult.value.status;
        } else {
          next.mentoringStatus = 'medical_suite 연결 실패';
        }
        return next;
      });
    }

    void refreshOperatingData();
    const id = window.setInterval(refreshOperatingData, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [linkedStudentId, sessionRole]);

  useEffect(() => {
    setSchedules(syncData.schedules);
    setTodos(syncData.todos);
  }, [syncData.schedules, syncData.todos]);

  const navItems = sessionRole === 'admin' ? [] : sessionRole === 'parent' ? parentNav : studentNav;

  function login(nextStudentId, nextAdminToken = '') {
    if (role === 'admin') {
      setAdminToken(nextAdminToken);
      setSessionRole('admin');
      setActiveTab('dashboard');
      return;
    }
    const normalizedStudentId = nextStudentId?.trim() || 'qtf258';
    setLinkedStudentId(normalizedStudentId);
    localStorage.setItem('studycat-linked-student-id', normalizedStudentId);
    setSessionRole(role);
    setActiveTab('home');
  }

  function logout() {
    setSessionRole(null);
    setActiveTab('home');
  }

  if (!sessionRole) {
    return (
      <SyncDataContext.Provider value={syncData}>
        <LoginScreen role={role} setRole={setRole} linkedStudentId={linkedStudentId} onLogin={login} />
      </SyncDataContext.Provider>
    );
  }

  return (
    <SyncDataContext.Provider value={syncData}>
      <MobileShell
        role={sessionRole}
        activeTab={activeTab}
        navItems={navItems}
        onNavigate={setActiveTab}
        onLogout={logout}
      >
        {sessionRole === 'admin' ? (
          <AdminRoutes activeTab={activeTab} setActiveTab={setActiveTab} adminToken={adminToken} />
        ) : sessionRole === 'student' ? (
          <StudentRoutes
            activeTab={activeTab}
            timeFilter={timeFilter}
            setTimeFilter={setTimeFilter}
            schedules={schedules}
            setSchedules={setSchedules}
            todos={todos}
            setTodos={setTodos}
            onNavigate={setActiveTab}
          />
        ) : (
          <ParentRoutes
            activeTab={activeTab}
            timeFilter={timeFilter}
            setTimeFilter={setTimeFilter}
            schedules={schedules}
            setSchedules={setSchedules}
            todos={todos}
            setTodos={setTodos}
            onNavigate={setActiveTab}
          />
        )}
      </MobileShell>
    </SyncDataContext.Provider>
  );
}

function LoginScreen({ role, setRole, linkedStudentId, onLogin }) {
  const [studentId, setStudentId] = useState(linkedStudentId || 'qtf258');
  const [password, setPassword] = useState(role === 'admin' ? 'admin1234' : '');
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    if (role === 'admin') {
      setStudentId('admin');
      setPassword('admin1234');
    } else if (studentId === 'admin') {
      setStudentId(linkedStudentId || 'qtf258');
      setPassword('');
    }
  }, [linkedStudentId, role]);

  function handleSubmit() {
    if (role === 'admin') {
      if (studentId.trim() !== 'admin' || password !== 'admin1234') {
        setError('관리자 아이디 또는 비밀번호가 맞지 않습니다.');
        return;
      }
      onLogin(undefined, password);
      return;
    }
    onLogin(studentId);
  }

  return (
    <main className="login-screen">
      <section className="login-card" aria-label="로그인">
        <div className="brand-row">
          <div className="brand-mark">MR</div>
          <div>
            <p className="eyebrow">Medical Roadmap</p>
            <h1>{centerInfo.name}</h1>
          </div>
        </div>

        <p className="login-copy">
          학생은 오늘의 학습과 일정을, 학부모는 출결과 학습 리포트를 한 화면에서 확인합니다.
        </p>

        <div className="role-switch" role="tablist" aria-label="로그인 역할 선택">
          <button
            className={role === 'student' ? 'active' : ''}
            onClick={() => setRole('student')}
            type="button"
          >
            <UserRound size={18} />
            학생
          </button>
          <button
            className={role === 'parent' ? 'active' : ''}
            onClick={() => setRole('parent')}
            type="button"
          >
            <UsersRound size={18} />
            학부모
          </button>
          <button
            className={role === 'admin' ? 'active' : ''}
            onClick={() => setRole('admin')}
            type="button"
          >
            <ShieldCheck size={18} />
            관리자
          </button>
        </div>

        <label className="input-label">
          아이디
          <input value={studentId} onChange={(event) => setStudentId(event.target.value)} placeholder={role === 'admin' ? 'admin' : 'qtf258'} />
        </label>
        <label className="input-label">
          비밀번호
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={role === 'admin' ? 'admin1234' : 'demo1234'} />
        </label>
        {error ? <div className="login-error">{error}</div> : null}

        <button className="primary-action" type="button" onClick={handleSubmit}>
          {role === 'student' ? '학생 페이지로 들어가기' : role === 'admin' ? '관리자 페이지로 들어가기' : '학부모 페이지로 들어가기'}
          <ChevronRight size={20} />
        </button>

        <div className="login-footnote">
          <ShieldCheck size={16} />
          현재 화면은 데모 로그인으로 이동합니다.
        </div>
      </section>
    </main>
  );
}

function MobileShell({ role, activeTab, navItems, onNavigate, onLogout, children }) {
  const syncData = useSyncData();
  const profile = syncData.userProfile;
  const title = role === 'admin' ? '관리자' : role === 'student' ? profile.studentName : profile.parentName;
  const subtitle = role === 'admin' ? syncData.syncStatus : role === 'student' ? profile.target : `${profile.studentName} 학습 리포트`;

  return (
    <div className={role === 'admin' ? 'app-root admin-root' : 'app-root'}>
      <header className="app-header">
        <div>
          <p>{centerInfo.name}</p>
          <h1>{title}</h1>
          <span>{subtitle}</span>
        </div>
        <div className="header-actions">
          <button className="icon-button" type="button" aria-label="알림">
            <Bell size={19} />
          </button>
          <button className="icon-button" type="button" aria-label="로그아웃" onClick={onLogout}>
            <LogOut size={19} />
          </button>
        </div>
      </header>

      <div className="content">{children}</div>

      <nav className="bottom-nav" aria-label="하단 메뉴">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={activeTab === item.id ? 'active' : ''}
              type="button"
              onClick={() => onNavigate(item.id)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function StudentRoutes(props) {
  switch (props.activeTab) {
    case 'study':
      return <LearningPage {...props} audience="student" />;
    case 'exam':
      return <ExamTimerPage />;
    case 'plan':
      return <PlanPage {...props} role="student" />;
    case 'meal':
      return <MealPage />;
    case 'record':
      return <RecordPage role="student" />;
    default:
      return <StudentHome {...props} />;
  }
}

function ParentRoutes(props) {
  switch (props.activeTab) {
    case 'attendance':
      return <AttendancePage />;
    case 'study':
      return <LearningPage {...props} audience="parent" />;
    case 'mentoring':
      return <MentoringPage />;
    case 'plan':
      return <PlanPage {...props} role="parent" />;
    case 'meal':
      return <MealPage />;
    case 'record':
      return <RecordPage role="parent" />;
    default:
      return <ParentHome {...props} />;
  }
}

function getAdminRows(syncData) {
  const studentMap = new Map((syncData.students ?? []).map((student) => [student.id, student]));
  const penaltyRows = Array.isArray(syncData.penaltyRows) ? syncData.penaltyRows : [];
  const attendanceRows = Array.isArray(syncData.attendanceRows) ? syncData.attendanceRows : [];
  const reportRows = (syncData.reports ?? []).map((report) => {
    const student = studentMap.get(report.studentId) ?? {};
    const name = report.studentName || report.profile?.studentName || student.name || report.studentId;
    const penalty = findExternalStudentRow(penaltyRows, report.studentId, name);
    const attendanceFile = findExternalStudentRow(attendanceRows, report.studentId, name);
    return {
      id: report.studentId,
      name,
      status: student.status || report.attendance?.status || 'offline',
      subject: student.subject || report.subjectStudy?.[0]?.subject || '-',
      today: safeMinutes(report.studySummary?.today),
      week: safeMinutes(report.studySummary?.week),
      month: safeMinutes(report.studySummary?.month),
      completion: safeMinutes(report.analysis?.completionRate),
      focus: safeMinutes(report.analysis?.focusScore),
      penalty: Number.isFinite(Number(penalty?.points)) ? Number(penalty.points) : safeMinutes(report.penalty?.points),
      penaltyUpdatedAt: penalty?.updatedAt,
      attendanceFile,
      report,
      student,
    };
  });

  const reportedIds = new Set(reportRows.map((row) => row.id));
  const liveOnlyRows = [...studentMap.values()]
    .filter((student) => !reportedIds.has(student.id))
    .map((student) => {
      const penalty = findExternalStudentRow(penaltyRows, student.id, student.name);
      const attendanceFile = findExternalStudentRow(attendanceRows, student.id, student.name);
      return {
        id: student.id,
        name: student.name || student.id,
        status: student.status || 'offline',
        subject: student.subject || '-',
        today: safeMinutes(student.todayMinutes),
        week: 0,
        month: 0,
        completion: 0,
        focus: 0,
        penalty: Number(penalty?.points ?? 0),
        penaltyUpdatedAt: penalty?.updatedAt,
        attendanceFile,
        report: null,
        student,
      };
    });

  const knownIds = new Set([...reportRows, ...liveOnlyRows].map((row) => row.id));
  const knownNames = new Set([...reportRows, ...liveOnlyRows].map((row) => row.name));
  const externalOnlyRows = penaltyRows
    .filter((row) => !knownIds.has(row.id) && !knownNames.has(row.name))
    .map((row) => {
      const attendanceFile = findExternalStudentRow(attendanceRows, row.id, row.name);
      return {
        id: row.id,
        name: row.name || row.id,
        status: '운영 사이트',
        subject: '-',
        today: 0,
        week: 0,
        month: 0,
        completion: 0,
        focus: 0,
        penalty: Number(row.points || 0),
        penaltyUpdatedAt: row.updatedAt,
        attendanceFile,
        report: null,
        student: null,
      };
    });

  return [...reportRows, ...liveOnlyRows, ...externalOnlyRows].sort((a, b) => b.today - a.today || a.name.localeCompare(b.name, 'ko-KR'));
}

function AdminRoutes({ activeTab, setActiveTab, adminToken }) {
  const syncData = useSyncData();
  const rows = getAdminRows(syncData);
  const selectedTab = activeTab === 'home' ? 'dashboard' : activeTab;
  const totalToday = rows.reduce((sum, row) => sum + row.today, 0);
  const activeCount = rows.filter((row) => row.status === 'studying' || row.status === 'break' || row.today > 0).length;
  const avgFocus = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.focus, 0) / rows.length) : 0;
  const totalPenalty = rows.reduce((sum, row) => sum + row.penalty, 0);

  function renderPage() {
    switch (selectedTab) {
      case 'students':
        return <AdminStudentsPage rows={rows} />;
      case 'analysis':
        return <AdminAnalysisPage rows={rows} />;
      case 'schedules':
        return <AdminSchedulesPage rows={rows} />;
      case 'meals':
        return <AdminMealsPage />;
      case 'messages':
        return <AdminMessagesPage rows={rows} adminToken={adminToken} />;
      case 'attendance':
        return <AdminAttendancePage rows={rows} />;
      case 'mentoring':
        return <AdminMentoringPage rows={rows} />;
      case 'penalties':
        return <AdminPenaltiesPage rows={rows} />;
      default:
        return <AdminDashboard rows={rows} totalToday={totalToday} activeCount={activeCount} avgFocus={avgFocus} totalPenalty={totalPenalty} />;
    }
  }

  return (
    <div className="screen-stack admin-workspace">
      <section className="admin-overview">
        <div>
          <p>Studycat 관리자</p>
          <h2>{syncData.syncStatus}</h2>
          <span>전체 학생 {rows.length}명 · 실시간 리포트 {syncData.reports?.length ?? 0}건</span>
        </div>
        <button type="button" onClick={() => setActiveTab('dashboard')}>
          <RefreshCw size={16} />
          새로고침
        </button>
      </section>

      <section className="admin-section-grid" aria-label="관리자 메뉴">
        {adminSections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              className={selectedTab === section.id ? 'active' : ''}
              key={section.id}
              type="button"
              onClick={() => setActiveTab(section.id)}
            >
              <Icon size={18} />
              <span>{section.label}</span>
            </button>
          );
        })}
      </section>

      {renderPage()}
    </div>
  );
}

function AdminDashboard({ rows, totalToday, activeCount, avgFocus, totalPenalty }) {
  const topStudents = rows.slice(0, 5);
  return (
    <>
      <section className="admin-kpi-grid">
        <AdminKpi title="오늘 총 공부" value={formatMinutes(totalToday)} detail={`${activeCount}명 활동`} />
        <AdminKpi title="평균 집중도" value={`${avgFocus}%`} detail="과제 완료율 + 시간 기준" />
        <AdminKpi title="누적 벌점" value={`${totalPenalty}점`} detail="medipenalty 연동값" tone={totalPenalty > 0 ? 'warn' : 'good'} />
        <AdminKpi title="리포트 학생" value={`${rows.length}명`} detail="Studycat family snapshot" />
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <h3>오늘 공부시간 TOP 5</h3>
          <span>학생 앱 타이머 기준</span>
        </div>
        <div className="admin-rank-list">
          {topStudents.map((row, index) => (
            <div key={row.id}>
              <strong>{index + 1}. {row.name}</strong>
              <span>{formatMinutes(row.today)} · {row.subject}</span>
              <em>{row.status}</em>
            </div>
          ))}
          {!topStudents.length ? <div className="admin-empty">아직 Studycat 리포트가 없습니다.</div> : null}
        </div>
      </section>
    </>
  );
}

function AdminKpi({ title, value, detail, tone = 'normal' }) {
  return (
    <div className={`admin-kpi ${tone}`}>
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function AdminStudentsPage({ rows }) {
  const [query, setQuery] = useState('');
  const filtered = rows.filter((row) => `${row.name} ${row.id}`.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <h3>학생 전체 현황</h3>
        <label className="admin-search">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="학생 이름 또는 ID 검색" />
        </label>
      </div>
      <div className="admin-table">
        {filtered.map((row) => (
          <article className="admin-row-card" key={row.id}>
            <div>
              <strong>{row.name}</strong>
              <span>{row.id} · {row.status}</span>
            </div>
            <div><span>오늘</span><b>{formatMinutes(row.today)}</b></div>
            <div><span>이번 주</span><b>{formatMinutes(row.week)}</b></div>
            <div><span>완료율</span><b>{row.completion}%</b></div>
            <div><span>벌점</span><b>{row.penalty}점</b></div>
          </article>
        ))}
        {!filtered.length ? <div className="admin-empty">검색 결과가 없습니다.</div> : null}
      </div>
    </section>
  );
}

function AdminAnalysisPage({ rows }) {
  const subjectTotals = new Map();
  rows.forEach((row) => {
    row.report?.subjectStudy?.forEach((item) => {
      subjectTotals.set(item.subject, (subjectTotals.get(item.subject) ?? 0) + safeMinutes(item.minutes));
    });
  });
  const subjects = [...subjectTotals.entries()].sort((a, b) => b[1] - a[1]);
  const maxSubject = Math.max(1, ...subjects.map(([, minutes]) => minutes));

  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <h3>학습 분석</h3>
        <span>과목별 누적 및 집중도</span>
      </div>
      <div className="admin-analysis-grid">
        <div>
          <h4>과목별 오늘 공부시간</h4>
          {subjects.map(([subject, minutes]) => (
            <div className="admin-bar-row" key={subject}>
              <span>{subject}</span>
              <i><b style={{ width: `${Math.max(4, (minutes / maxSubject) * 100)}%` }} /></i>
              <strong>{formatMinutes(minutes)}</strong>
            </div>
          ))}
          {!subjects.length ? <div className="admin-empty">과목별 데이터가 아직 없습니다.</div> : null}
        </div>
        <div>
          <h4>집중도 낮은 학생</h4>
          {rows.slice().sort((a, b) => a.focus - b.focus).slice(0, 6).map((row) => (
            <div className="admin-mini-row" key={row.id}>
              <strong>{row.name}</strong>
              <span>{row.focus}% · 오늘 {formatMinutes(row.today)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AdminSchedulesPage({ rows }) {
  const scheduleRows = rows.flatMap((row) => (row.report?.schedules ?? []).map((schedule) => ({ row, schedule })));
  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <h3>전체 일정 확인</h3>
        <span>Studycat/medischedule 연동 일정</span>
      </div>
      <div className="admin-list">
        {scheduleRows.map(({ row, schedule }) => (
          <article className="admin-list-card" key={`${row.id}-${schedule.id}`}>
            <strong>{row.name}</strong>
            <span>{schedule.day} {schedule.start}-{schedule.end}</span>
            <p>{schedule.title}</p>
            <em>{schedule.type}</em>
          </article>
        ))}
        {!scheduleRows.length ? <div className="admin-empty">일정 데이터가 아직 없습니다.</div> : null}
      </div>
    </section>
  );
}

function AdminMealsPage() {
  const [meals, setMeals] = useState(readStoredMeals);
  const [fileName, setFileName] = useState(() => (
    meals.some((meal) => String(meal.id || '').startsWith('dada-')) ? '첨부 이미지 메뉴 적용됨' : '관리자 업로드 메뉴'
  ));

  async function handleMealFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const XLSX = await import('xlsx');
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' }).map(normalizeMealRow).filter((row) => row.date || row.lunch || row.dinner);
    setMeals(rows);
    setFileName(file.name);
    writeStoredJson(MEAL_STORAGE_KEY, rows);
  }

  function applySeedMenu() {
    const rows = seedMealRows();
    setMeals(rows);
    setFileName('첨부 이미지 메뉴 적용됨');
    writeStoredJson(MEAL_STORAGE_KEY, rows);
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <h3>도시락 월별 엑셀 업로드</h3>
        <span>{fileName || 'xlsx, xls, csv 지원'}</span>
      </div>
      <label className="admin-upload">
        <FileSpreadsheet size={22} />
        <div>
          <strong>월별 도시락 파일 선택</strong>
          <span>권장 컬럼: 날짜, 점심, 저녁, 칼로리, 비고</span>
        </div>
        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleMealFile} />
      </label>
      <button className="admin-secondary-action" type="button" onClick={applySeedMenu}>
        2026년 6월 이미지 메뉴 적용
      </button>
      <div className="admin-list">
        {meals.slice(0, 40).map((meal) => (
          <article className="admin-list-card" key={meal.id}>
            <strong>{meal.date || '날짜 없음'}</strong>
            <span>점심: {splitMealText(meal.lunch).join(' / ') || '-'}</span>
            <p>저녁: {splitMealText(meal.dinner).join(' / ') || '-'}</p>
            <em>{meal.kcal || meal.note || meal.source || '도시락'}</em>
          </article>
        ))}
        {!meals.length ? <div className="admin-empty">업로드된 도시락 파일이 없습니다.</div> : null}
      </div>
    </section>
  );
}

function AdminMessagesPage({ rows, adminToken }) {
  const [recipientId, setRecipientId] = useState('all');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState('');
  const selected = rows.find((row) => row.id === recipientId);

  async function sendMessage() {
    if (!body.trim()) return;
    setStatus('전송 중...');
    try {
      await sendStudycatAdminMessage({
        recipientId,
        recipientName: recipientId === 'all' ? '전체' : selected?.name ?? recipientId,
        body: body.trim(),
        adminToken,
      });
      setBody('');
      setStatus('학생 앱으로 푸시 메시지를 전송했습니다.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '메시지 전송 실패');
    }
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <h3>학생 앱 푸시 메시지</h3>
        <span>{status || 'Studycat 관리자 메시지 API 사용'}</span>
      </div>
      <div className="admin-form-grid">
        <label>
          수신자
          <select value={recipientId} onChange={(event) => setRecipientId(event.target.value)}>
            <option value="all">전체 학생</option>
            {rows.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
          </select>
        </label>
        <label>
          메시지
          <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="학생 앱에 띄울 메시지를 입력하세요." />
        </label>
        <button type="button" onClick={sendMessage}>
          <Send size={17} />
          전송
        </button>
      </div>
    </section>
  );
}

function AdminAttendancePage({ rows }) {
  const [attendanceUploads, setAttendanceUploads] = useState(readStoredAttendanceRows);
  const [fileName, setFileName] = useState('');

  async function handleAttendanceFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const XLSX = await import('xlsx');
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const nextRows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
      .map(normalizeAttendanceRow)
      .filter((row) => row.studentId || row.name || row.checkIn || row.checkOut || row.time);
    setAttendanceUploads(nextRows);
    setFileName(file.name);
    writeStoredJson(ATTENDANCE_STORAGE_KEY, nextRows);
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <h3>학생별 입퇴실 확인</h3>
        <span>{fileName || `Studycat 기록 + 업로드 ${attendanceUploads.length}건`}</span>
      </div>
      <label className="admin-upload">
        <FileSpreadsheet size={22} />
        <div>
          <strong>입퇴실 파일 선택</strong>
          <span>권장 컬럼: 학생ID, 이름, 상태, 입실, 하원, 외출, 복귀, 좌석</span>
        </div>
        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleAttendanceFile} />
      </label>
      <div className="admin-table">
        {rows.map((row) => (
          <article className="admin-row-card" key={row.id}>
            <div>
              <strong>{row.name}</strong>
              <span>{row.attendanceFile?.status ?? row.report?.attendance?.status ?? row.status}</span>
            </div>
            <div><span>입실</span><b>{row.attendanceFile?.checkIn || row.report?.attendance?.checkIn || '-'}</b></div>
            <div><span>퇴실</span><b>{row.attendanceFile?.checkOut || row.report?.attendance?.checkOut || '-'}</b></div>
            <div><span>오늘</span><b>{formatMinutes(row.today)}</b></div>
            <div><span>최근</span><b>{formatUpdatedAt(row.report?.updatedAt)}</b></div>
          </article>
        ))}
        {!rows.length ? <div className="admin-empty">표시할 학생 데이터가 없습니다.</div> : null}
      </div>
    </section>
  );
}

function AdminMentoringPage({ rows }) {
  const syncData = useSyncData();
  const portalRecords = syncData.mentoringRecords ?? [];
  const taskRows = rows.flatMap((row) => (row.report?.tasks ?? []).map((task) => ({ row, task })));
  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <h3>medical_suite 멘토링 연동 데이터</h3>
        <span>{syncData.mentoringStatus}</span>
      </div>
      <div className="admin-list">
        {portalRecords.map((record) => (
          <article className="admin-list-card" key={`${record.studentId || 'portal'}-${record.week}-${record.focus}`}>
            <strong>{record.week} · {record.mentor}</strong>
            <span>{record.focus}</span>
            <p>{record.memo}</p>
            <em>{record.next}</em>
          </article>
        ))}
        {taskRows.map(({ row, task }) => (
          <article className="admin-list-card" key={`${row.id}-${task.id}`}>
            <strong>{row.name} · {task.subject}</strong>
            <span>{task.completed ? '완료' : '진행 중'} · {task.portalStatus}</span>
            <p>{task.title}</p>
            <em>{formatMinutes(Math.round((task.elapsedSeconds ?? 0) / 60))}</em>
          </article>
        ))}
        {!portalRecords.length && !taskRows.length ? <div className="admin-empty">멘토링 포털 토큰이 없거나 과제 데이터가 아직 없습니다.</div> : null}
      </div>
    </section>
  );
}

function readPenaltyAdjustments() {
  try {
    return JSON.parse(localStorage.getItem('admin-penalty-adjustments-v1') || '{}');
  } catch {
    return {};
  }
}

function AdminPenaltiesPage({ rows }) {
  const [adjustments, setAdjustments] = useState(readPenaltyAdjustments);

  function updatePenalty(id, value) {
    const next = { ...adjustments, [id]: Number(value) || 0 };
    setAdjustments(next);
    localStorage.setItem('admin-penalty-adjustments-v1', JSON.stringify(next));
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <h3>벌점 관리 및 확인</h3>
        <span>medipenalty 연동값 + 관리자 보정값</span>
      </div>
      <div className="admin-table">
        {rows.map((row) => {
          const manual = Number(adjustments[row.id] ?? 0);
          return (
            <article className="admin-row-card" key={row.id}>
              <div>
                <strong>{row.name}</strong>
                <span>외부 {row.penalty}점 · 보정 {manual}점</span>
              </div>
              <div><span>합계</span><b>{row.penalty + manual}점</b></div>
              <label className="admin-inline-input">
                보정
                <input type="number" value={manual} onChange={(event) => updatePenalty(row.id, event.target.value)} />
              </label>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function StudentHome({
  timeFilter,
  setTimeFilter,
  schedules,
  setSchedules,
  todos,
  setTodos,
  onNavigate,
}) {
  const { studySummary } = useSyncData();
  const progress = Math.min(99, Math.round((studySummary.today / studySummary.goal) * 100));

  return (
    <div className="screen-stack">
      <HeroPanel
        label="오늘 공부 시간"
        title={formatMinutes(studySummary[timeFilter])}
        caption={`목표 ${formatMinutes(studySummary.goal)} 중 ${progress}% 달성, ${studySummary.streak}일 연속 기록 중`}
        progress={progress}
        progressLabel="달성"
      >
        <Segmented options={timeFilters} value={timeFilter} onChange={setTimeFilter} />
        {timeFilter === 'custom' && <RangePicker />}
      </HeroPanel>

      <section className="feature-grid" aria-label="학생 주요 기능">
        <FeatureTile
          icon={PieChart}
          title="과목별 공부 시간"
          detail="국어, 수학, 영어, 탐구 누적"
          onClick={() => onNavigate('study')}
        />
        <FeatureTile
          icon={Timer}
          title="모의고사 타이머"
          detail="실제 수능 시간표 기준"
          onClick={() => onNavigate('exam')}
        />
        <FeatureTile
          icon={Salad}
          title="오늘의 식단"
          detail="점심과 저녁 메뉴"
          onClick={() => onNavigate('meal')}
        />
        <FeatureTile
          icon={NotebookPen}
          title="일정과 할일"
          detail="StudyCat 리포트 반영"
          onClick={() => onNavigate('plan')}
        />
      </section>

      <SubjectTimeCard />
      <PlanPreview
        schedules={schedules}
        setSchedules={setSchedules}
        todos={todos}
        setTodos={setTodos}
      />
      <MealCard />
      <WeeklyCard />
    </div>
  );
}

function ParentHome({
  timeFilter,
  setTimeFilter,
  schedules,
  setSchedules,
  todos,
  setTodos,
  onNavigate,
}) {
  const { studySummary, userProfile } = useSyncData();
  return (
    <div className="screen-stack">
      <ParentStatusCard onNavigate={onNavigate} />

      <HeroPanel
        label={`${userProfile.studentName} 학습 현황`}
        title={formatMinutes(studySummary[timeFilter])}
        caption={`이번 주 누적 ${formatMinutes(studySummary.week)}, ${studySummary.streak}일 연속 학습`}
        progress={84}
        progressLabel="주간"
      >
        <Segmented options={timeFilters} value={timeFilter} onChange={setTimeFilter} />
        {timeFilter === 'custom' && <RangePicker />}
      </HeroPanel>

      <section className="feature-grid" aria-label="학부모 주요 기능">
        <FeatureTile
          icon={DoorOpen}
          title="입퇴실 현황"
          detail="등원, 하원, 외출 기록"
          onClick={() => onNavigate('attendance')}
        />
        <FeatureTile
          icon={LineChart}
          title="학습 리포트"
          detail="누적 시간과 과목별 시간"
          onClick={() => onNavigate('study')}
        />
        <FeatureTile
          icon={CalendarCheck}
          title="일정과 할일"
          detail="오늘 진행 상황 확인"
          onClick={() => onNavigate('plan')}
        />
        <FeatureTile
          icon={MessageSquareText}
          title="주간 멘토링"
          detail="medical_suite 포털 연동"
          onClick={() => onNavigate('mentoring')}
        />
      </section>

      <PlanPreview
        schedules={schedules}
        setSchedules={setSchedules}
        todos={todos}
        setTodos={setTodos}
        readonly
      />
      <MealCard />
      <SubjectTimeCard />
      <WeeklyCard />
    </div>
  );
}

function ParentStatusCard({ onNavigate }) {
  const { attendance } = useSyncData();
  return (
    <button className="parent-status-card" type="button" onClick={() => onNavigate('attendance')}>
      <div>
        <p>현재 입퇴실 현황</p>
        <h2>{attendance.status}</h2>
        <span>{attendance.seat}</span>
      </div>
      <div className="attendance-times">
        <strong>{attendance.checkIn}</strong>
        <span>입실</span>
      </div>
    </button>
  );
}

function HeroPanel({ label, title, caption, progress, progressLabel, children }) {
  return (
    <section className="hero-panel">
      <div className="hero-heading">
        <div>
          <p>{label}</p>
          <h2>{title}</h2>
          <span>{caption}</span>
        </div>
        <ProgressRing value={progress} label={progressLabel} />
      </div>
      {children}
    </section>
  );
}

function FeatureTile({ icon: Icon, title, detail, onClick }) {
  return (
    <button className="feature-tile" type="button" onClick={onClick}>
      <span className="tile-icon">
        <Icon size={22} />
      </span>
      <strong>{title}</strong>
      <small>{detail}</small>
    </button>
  );
}

function LearningPage({ timeFilter, setTimeFilter, audience }) {
  const { studySummary } = useSyncData();
  return (
    <div className="screen-stack">
      <SectionHeader
        icon={BarChart3}
        title={audience === 'parent' ? '학습 현황' : '내 학습 분석'}
        subtitle="StudyCat 공부 시간과 과목별 통계가 같은 구조로 실시간 반영됩니다."
      />
      <HeroPanel
        label="선택 기간 누적"
        title={formatMinutes(studySummary[timeFilter])}
        caption="일간, 주간, 월간, 직접 설정 기간을 같은 화면에서 조회합니다."
        progress={audience === 'parent' ? 84 : 61}
        progressLabel="집중"
      >
        <Segmented options={timeFilters} value={timeFilter} onChange={setTimeFilter} />
        {timeFilter === 'custom' && <RangePicker />}
      </HeroPanel>
      <StatStrip />
      <SubjectTimeCard expanded />
      <WeeklyCard expanded />
      <IntegrationCard />
    </div>
  );
}

function StatStrip() {
  const { studySummary } = useSyncData();
  return (
    <section className="stat-strip" aria-label="학습 요약">
      <div>
        <span>오늘</span>
        <strong>{formatMinutes(studySummary.today)}</strong>
      </div>
      <div>
        <span>이번 주</span>
        <strong>{formatMinutes(studySummary.week)}</strong>
      </div>
      <div>
        <span>이번 달</span>
        <strong>{formatMinutes(studySummary.month)}</strong>
      </div>
    </section>
  );
}

function ExamTimerPage() {
  const [activeSubject, setActiveSubject] = useState(examSchedule[0].subject);
  const selected = examSchedule.find((item) => item.subject === activeSubject) ?? examSchedule[0];
  const [secondsLeft, setSecondsLeft] = useState(selected.minutes * 60);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    setSecondsLeft(selected.minutes * 60);
    setIsRunning(false);
  }, [selected.minutes, selected.subject]);

  useEffect(() => {
    if (!isRunning) return undefined;
    const interval = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (secondsLeft === 0) setIsRunning(false);
  }, [secondsLeft]);

  const elapsed = selected.minutes * 60 - secondsLeft;
  const percent = Math.min(100, Math.round((elapsed / (selected.minutes * 60)) * 100));

  return (
    <div className="screen-stack">
      <SectionHeader
        icon={Timer}
        title="모의고사용 타이머"
        subtitle="실제 수능 시간표와 동일한 교시별 제한 시간으로 연습합니다."
      />
      <section className="exam-focus">
        <p>
          {selected.start} - {selected.end}
        </p>
        <h2>{selected.subject}</h2>
        <div className="timer-face" style={{ '--timer-progress': `${percent * 3.6}deg` }}>
          <div>
            <strong>{formatTimer(secondsLeft)}</strong>
            <span>남은 시간</span>
          </div>
        </div>
        <div className="timer-actions">
          <button type="button" onClick={() => setIsRunning(true)}>
            <Play size={17} />
            시작
          </button>
          <button type="button" onClick={() => setIsRunning(false)}>
            <Pause size={17} />
            일시정지
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRunning(false);
              setSecondsLeft(selected.minutes * 60);
            }}
          >
            <RefreshCw size={17} />
            리셋
          </button>
        </div>
      </section>
      <section className="exam-list">
        {examSchedule.map((item) => (
          <button
            key={item.subject}
            className={item.subject === activeSubject ? 'active' : ''}
            type="button"
            onClick={() => setActiveSubject(item.subject)}
          >
            <span>{item.subject}</span>
            <strong>
              {item.start} - {item.end}
            </strong>
            <small>
              {item.state} · {item.minutes}분
            </small>
          </button>
        ))}
      </section>
    </div>
  );
}

function PlanPage({ schedules, setSchedules, todos, setTodos, role }) {
  const readonly = role === 'parent';

  return (
    <div className="screen-stack">
      <SectionHeader
        icon={CalendarCheck}
        title="오늘의 일정과 할일"
        subtitle={
          readonly
            ? '학부모는 학생의 오늘 계획과 완료 상태를 확인합니다.'
            : '학생은 일정을 등록하고 할일을 체크할 수 있습니다. StudyCat 리포트와 같은 화면에서 확인합니다.'
        }
      />
      <PlanPreview
        schedules={schedules}
        setSchedules={setSchedules}
        todos={todos}
        setTodos={setTodos}
        readonly={readonly}
        expanded
      />
      <IntegrationCard />
    </div>
  );
}

function MealPage() {
  return (
    <div className="screen-stack">
      <SectionHeader
        icon={Salad}
        title="오늘의 식단"
        subtitle="첨부된 다다익찬 2026년 6월 도시락 메뉴와 관리자 업로드 엑셀을 자동 반영합니다."
      />
      <MealCard expanded />
      <IntegrationCard />
    </div>
  );
}

function AttendancePage() {
  const { attendance } = useSyncData();
  return (
    <div className="screen-stack">
      <SectionHeader
        icon={DoorOpen}
        title="입퇴실 현황"
        subtitle="StudyCat 출결과 관리자 입퇴실 파일 업로드 데이터를 자동 반영합니다."
      />
      <section className="attendance-hero">
        <div>
          <p>현재 상태</p>
          <h2>{attendance.status}</h2>
          <span>{attendance.seat}</span>
        </div>
        <div className="attendance-duo">
          <div>
            <span>입실</span>
            <strong>{attendance.checkIn}</strong>
          </div>
          <div>
            <span>하원</span>
            <strong>{attendance.checkOut}</strong>
          </div>
        </div>
      </section>
      <section className="timeline-card">
        {attendance.timeline.map((item) => (
          <div className="timeline-row" key={`${item.time}-${item.label}`}>
            <span className={item.tone} />
            <div>
              <strong>{item.label}</strong>
              <small>{item.time}</small>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function MentoringPage() {
  const { mentoringRecords, mentoringStatus, todos } = useSyncData();
  const fallbackTasks = mentoringRecords.length ? [] : todos.filter((todo) => todo.title);
  return (
    <div className="screen-stack">
      <SectionHeader
        icon={MessageSquareText}
        title="주간 멘토링 기록"
        subtitle={mentoringStatus}
      />
      {mentoringRecords.map((record) => (
        <section className="mentoring-card" key={record.week}>
          <div className="card-topline">
            <span>{record.week}</span>
            <strong>{record.mentor}</strong>
          </div>
          <h3>{record.focus}</h3>
          <p>{record.memo}</p>
          <div className="next-step">
            <ClipboardCheck size={17} />
            <span>{record.next}</span>
          </div>
        </section>
      ))}
      {!mentoringRecords.length && fallbackTasks.map((task) => (
        <section className="mentoring-card" key={task.id}>
          <div className="card-topline">
            <span>StudyCat 과제</span>
            <strong>{task.done ? '완료' : '진행 중'}</strong>
          </div>
          <h3>{task.title}</h3>
          <p>medical_suite 토큰이 설정되면 주간 멘토링 기록과 다음 주 액션으로 자동 대체됩니다.</p>
        </section>
      ))}
      {!mentoringRecords.length && !fallbackTasks.length ? (
        <section className="data-card">
          <div className="analysis-note">medical_suite 포털 토큰이 없거나 해당 학생의 멘토링 기록이 아직 없습니다.</div>
        </section>
      ) : null}
      <IntegrationCard />
    </div>
  );
}

function RecordPage({ role }) {
  return (
    <div className="screen-stack">
      <SectionHeader
        icon={Award}
        title="상벌점과 주간 현황"
        subtitle={role === 'parent' ? '학부모가 확인하기 쉬운 요약 리포트입니다.' : '내 기록과 이번 주 학습 흐름을 확인합니다.'}
      />
      <PointsCard expanded />
      <WeeklyCard expanded />
    </div>
  );
}

function SubjectTimeCard({ expanded = false }) {
  const { subjectStudy } = useSyncData();
  const total = subjectStudy.reduce((sum, item) => sum + item.minutes, 0);
  return (
    <section className="data-card">
      <div className="card-header">
        <div>
          <p>과목별 공부 시간</p>
          <h3>{formatMinutes(total)}</h3>
        </div>
        <BookOpenCheck size={22} />
      </div>
      <div className="subject-bars">
        {subjectStudy.map((item) => (
          <div className="subject-row" key={item.subject}>
            <div className="subject-label">
              <strong>{item.subject}</strong>
              <span>{formatMinutes(item.minutes)}</span>
            </div>
            <div className="bar-track">
              <span
                style={{
                  width: `${total > 0 ? Math.max(14, Math.round((item.minutes / total) * 100)) : 4}%`,
                  background: item.color,
                }}
              />
            </div>
            {expanded && <small>{item.note}</small>}
          </div>
        ))}
      </div>
      {expanded && (
        <div className="analysis-note">
          수학 비중이 가장 높고 영어는 목표 대비 42분 부족합니다. StudyCat 연동 후 실제 누적값으로 대체됩니다.
        </div>
      )}
    </section>
  );
}

function formatMealDate(dateKey) {
  if (!dateKey) return '날짜 없음';
  const [, , month, day] = dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/) ?? [];
  return month && day ? `${Number(month)}월 ${Number(day)}일` : dateKey;
}

function MealCard({ expanded = false }) {
  const { todayMeal, nextMeal, mealStatus } = useSyncData();
  const meal = todayMeal ?? nextMeal;
  const label = todayMeal ? '오늘의 식단' : '다음 등록 식단';
  return (
    <section className="data-card">
      <div className="card-header">
        <div>
          <p>{label}</p>
          <h3>{meal ? formatMealDate(meal.date) : '등록된 메뉴 없음'}</h3>
        </div>
        <Salad size={22} />
      </div>
      {meal ? (
        <div className="meal-grid">
          <MealItem label="점심" meal={meal.lunch} />
          <MealItem label="저녁" meal={meal.dinner} />
        </div>
      ) : (
        <div className="admin-empty">표시할 도시락 메뉴가 없습니다.</div>
      )}
      {expanded && (
        <div className="analysis-note">
          {todayMeal ? mealStatus : `오늘 등록된 도시락은 없습니다. ${meal ? `${formatMealDate(meal.date)} 메뉴를 미리 보여줍니다.` : mealStatus}`}
        </div>
      )}
    </section>
  );
}

function MealItem({ label, meal }) {
  const items = splitMealText(meal);
  return (
    <div className="meal-item">
      <span>{label}</span>
      <strong>{items[0] || '-'}</strong>
      <p>{items.slice(1).join(' / ') || '추가 메뉴 없음'}</p>
      <small>{items.length ? '다다익찬 도시락' : '메뉴 없음'}</small>
    </div>
  );
}

function PlanPreview({
  schedules,
  setSchedules,
  todos,
  setTodos,
  readonly = false,
  expanded = false,
}) {
  function editSchedule(target) {
    const next = window.prompt('일정 내용을 수정하세요.', target.title);
    if (!next?.trim()) return;
    setSchedules((current) =>
      current.map((item) => (item.id === target.id ? { ...item, title: next.trim() } : item)),
    );
  }

  function editTodo(target) {
    const next = window.prompt('할일 내용을 수정하세요.', target.title);
    if (!next?.trim()) return;
    setTodos((current) =>
      current.map((item) => (item.id === target.id ? { ...item, title: next.trim() } : item)),
    );
  }

  return (
    <section className="data-card">
      <div className="card-header">
        <div>
          <p>오늘의 일정과 할일</p>
          <h3>{readonly ? '학부모 확인 모드' : '등록 및 편집'}</h3>
        </div>
        <CalendarCheck size={22} />
      </div>

      <div className="schedule-list">
        {schedules.map((item) => (
          <article className="schedule-item" key={item.id}>
            <time>{item.time}</time>
            <div>
              <strong>{item.title}</strong>
              <span>{item.tag}</span>
            </div>
            {!readonly && (
              <div className="row-actions">
                <button type="button" aria-label="일정 수정" onClick={() => editSchedule(item)}>
                  <Edit3 size={15} />
                </button>
                <button
                  type="button"
                  aria-label="일정 삭제"
                  onClick={() => setSchedules((current) => current.filter((next) => next.id !== item.id))}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )}
          </article>
        ))}
      </div>

      {!readonly && expanded && (
        <InlineComposer
          placeholder="예: 21:00 탐구 오답 정리"
          buttonLabel="일정 추가"
          onAdd={(value) => {
            const [timeCandidate, ...rest] = value.trim().split(' ');
            const hasTime = /^\d{1,2}:\d{2}$/.test(timeCandidate);
            setSchedules((current) => [
              ...current,
              {
                id: createId('schedule'),
                time: hasTime ? timeCandidate : '오늘',
                title: hasTime ? rest.join(' ') || '새 일정' : value,
                tag: '앱에서 추가',
              },
            ]);
          }}
        />
      )}

      <div className="todo-list">
        {todos.map((todo) => (
          <article className={todo.done ? 'todo done' : 'todo'} key={todo.id}>
            <button
              type="button"
              className="todo-main"
              disabled={readonly}
              onClick={() =>
                setTodos((current) =>
                  current.map((item) =>
                    item.id === todo.id ? { ...item, done: !item.done } : item,
                  ),
                )
              }
            >
              <span>{todo.done && <Check size={13} />}</span>
              <strong>{todo.title}</strong>
            </button>
            {!readonly && (
              <div className="row-actions">
                <button type="button" aria-label="할일 수정" onClick={() => editTodo(todo)}>
                  <Edit3 size={15} />
                </button>
                <button
                  type="button"
                  aria-label="할일 삭제"
                  onClick={() => setTodos((current) => current.filter((item) => item.id !== todo.id))}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )}
          </article>
        ))}
      </div>

      {!readonly && (
        <InlineComposer
          placeholder="새 할일 입력"
          buttonLabel="할일 추가"
          compact={!expanded}
          onAdd={(value) =>
            setTodos((current) => [
              ...current,
              { id: createId('todo'), title: value, done: false },
            ])
          }
        />
      )}
    </section>
  );
}

function InlineComposer({ placeholder, buttonLabel, onAdd, compact = false }) {
  const [value, setValue] = useState('');
  return (
    <form
      className={compact ? 'inline-composer compact' : 'inline-composer'}
      onSubmit={(event) => {
        event.preventDefault();
        if (!value.trim()) return;
        onAdd(value.trim());
        setValue('');
      }}
    >
      <input value={value} onChange={(event) => setValue(event.target.value)} placeholder={placeholder} />
      <button type="submit" aria-label={buttonLabel}>
        <Plus size={18} />
        {!compact && <span>{buttonLabel}</span>}
      </button>
    </form>
  );
}

function WeeklyCard({ expanded = false }) {
  const { weeklyLearning } = useSyncData();
  const max = Math.max(1, ...weeklyLearning.map((item) => item.minutes));
  const average = Math.round(
    weeklyLearning.reduce((sum, item) => sum + item.minutes, 0) / weeklyLearning.length,
  );
  return (
    <section className="data-card">
      <div className="card-header">
        <div>
          <p>주간 학습 현황</p>
          <h3>평균 {formatMinutes(average)}</h3>
        </div>
        <LineChart size={22} />
      </div>
      <div className="week-chart">
        {weeklyLearning.map((item) => (
          <div className="week-column" key={item.day}>
            <div className="week-bar">
              <span style={{ height: `${Math.max(4, (item.minutes / max) * 100)}%` }} />
            </div>
            <strong>{item.day}</strong>
          </div>
        ))}
      </div>
      {expanded && (
        <div className="weekly-detail">
          {weeklyLearning.map((item) => (
            <div key={`${item.day}-detail`}>
              <span>{item.day}요일</span>
              <strong>{formatMinutes(item.minutes)}</strong>
              <small>{item.completion}% 완료</small>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function PointsCard({ expanded = false }) {
  const { points } = useSyncData();
  const total = points.reduce((sum, item) => sum + item.amount, 0);
  return (
    <section className="data-card">
      <div className="card-header">
        <div>
          <p>상벌점 내역</p>
          <h3>누적 {total > 0 ? `+${total}` : total}점</h3>
        </div>
        <Award size={22} />
      </div>
      <div className="points-list">
        {points.map((item) => (
          <article className={item.amount > 0 ? 'point plus' : 'point minus'} key={item.id}>
            <span>{item.type}</span>
            <div>
              <strong>{item.reason}</strong>
              <small>{item.date}</small>
            </div>
            <b>{item.amount > 0 ? `+${item.amount}` : item.amount}</b>
          </article>
        ))}
      </div>
      {expanded && (
        <div className="analysis-note">
          생활 기록 파일이나 API가 연결되면 월별 누적과 사유별 필터를 추가합니다.
        </div>
      )}
    </section>
  );
}

function IntegrationCard() {
  const { linkedSystems, syncStatus } = useSyncData();
  return (
    <section className="integration-card">
      <div className="card-header">
        <div>
          <p>실시간 연동 상태</p>
          <h3>학생·학부모 데이터 소스</h3>
        </div>
        <Sparkles size={22} />
        <span>{syncStatus}</span>
      </div>
      {linkedSystems.map((system) => (
        <div className="integration-row" key={system.name}>
          <strong>{system.name}</strong>
          <span>{system.scope}</span>
          <small>{system.status}</small>
        </div>
      ))}
    </section>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <section className="section-header">
      <span>
        <Icon size={22} />
      </span>
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </section>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="segmented">
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          className={value === option.key ? 'active' : ''}
          onClick={() => onChange(option.key)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function RangePicker() {
  return (
    <div className="range-picker">
      <label>
        시작
        <input type="date" defaultValue="2026-05-01" />
      </label>
      <label>
        종료
        <input type="date" defaultValue="2026-05-16" />
      </label>
    </div>
  );
}

function ProgressRing({ value, label }) {
  const style = useMemo(
    () => ({
      background: `conic-gradient(var(--gold-2) ${value * 3.6}deg, rgba(255,255,255,.18) 0deg)`,
    }),
    [value],
  );
  return (
    <div className="progress-ring" style={style}>
      <div>
        <strong>{value}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

export default App;
