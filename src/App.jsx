import React, { useEffect, useMemo, useState } from 'react';
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
  meals,
  mentoringRecords,
  points,
  studySummary,
  subjectStudy,
  userProfile,
  weeklyLearning,
} from './data/mockData.js';

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

function App() {
  const demoRole = new URLSearchParams(window.location.search).get('role');
  const initialRole = demoRole === 'parent' || demoRole === 'student' ? demoRole : null;
  const [role, setRole] = useState('student');
  const [sessionRole, setSessionRole] = useState(initialRole);
  const [activeTab, setActiveTab] = useState('home');
  const [timeFilter, setTimeFilter] = useState('today');
  const [schedules, setSchedules] = useState(initialSchedules);
  const [todos, setTodos] = useState(initialTodos);

  const navItems = sessionRole === 'parent' ? parentNav : studentNav;

  function login() {
    setSessionRole(role);
    setActiveTab('home');
  }

  function logout() {
    setSessionRole(null);
    setActiveTab('home');
  }

  if (!sessionRole) {
    return <LoginScreen role={role} setRole={setRole} onLogin={login} />;
  }

  return (
    <MobileShell
      role={sessionRole}
      activeTab={activeTab}
      navItems={navItems}
      onNavigate={setActiveTab}
      onLogout={logout}
    >
      {sessionRole === 'student' ? (
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
  );
}

function LoginScreen({ role, setRole, onLogin }) {
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
        </div>

        <label className="input-label">
          아이디
          <input placeholder={role === 'student' ? 'student.demo' : 'parent.demo'} />
        </label>
        <label className="input-label">
          비밀번호
          <input type="password" placeholder="demo1234" />
        </label>

        <button className="primary-action" type="button" onClick={onLogin}>
          {role === 'student' ? '학생 페이지로 들어가기' : '학부모 페이지로 들어가기'}
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
  const title = role === 'student' ? userProfile.studentName : userProfile.parentName;
  const subtitle = role === 'student' ? userProfile.target : `${userProfile.studentName} 학습 리포트`;

  return (
    <div className="app-root">
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

function StudentHome({
  timeFilter,
  setTimeFilter,
  schedules,
  setSchedules,
  todos,
  setTodos,
  onNavigate,
}) {
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
          detail="StudyCat 양방향 연동 예정"
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
          detail="멘토링 포털 연동 예정"
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
  return (
    <div className="screen-stack">
      <SectionHeader
        icon={BarChart3}
        title={audience === 'parent' ? '학습 현황' : '내 학습 분석'}
        subtitle="StudyCat 공부 시간 데이터가 연결되면 같은 구조로 실시간 반영됩니다."
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
            : '학생은 일정을 등록하고 할일을 체크할 수 있습니다. StudyCat과 양방향 연동될 영역입니다.'
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
        subtitle="점심과 저녁 메뉴 엑셀 파일을 받으면 이 화면에 자동 연결합니다."
      />
      <MealCard expanded />
      <IntegrationCard />
    </div>
  );
}

function AttendancePage() {
  return (
    <div className="screen-stack">
      <SectionHeader
        icon={DoorOpen}
        title="입퇴실 현황"
        subtitle="추후 제공될 입퇴실 파일 포맷에 맞춰 자동 반영합니다."
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
  return (
    <div className="screen-stack">
      <SectionHeader
        icon={MessageSquareText}
        title="주간 멘토링 기록"
        subtitle="medical_suite 멘토링 포털 데이터를 이곳으로 옮겨올 예정입니다."
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
                  width: `${Math.max(14, Math.round((item.minutes / total) * 100))}%`,
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

function MealCard({ expanded = false }) {
  return (
    <section className="data-card">
      <div className="card-header">
        <div>
          <p>오늘의 식단</p>
          <h3>점심 · 저녁</h3>
        </div>
        <Salad size={22} />
      </div>
      <div className="meal-grid">
        <MealItem label="점심" meal={meals.lunch} />
        <MealItem label="저녁" meal={meals.dinner} />
      </div>
      {expanded && (
        <div className="analysis-note">
          현재는 샘플 메뉴입니다. 식단 엑셀 파일을 받으면 날짜별 메뉴 조회 구조로 확장합니다.
        </div>
      )}
    </section>
  );
}

function MealItem({ label, meal }) {
  return (
    <div className="meal-item">
      <span>{label}</span>
      <strong>{meal.title}</strong>
      <p>{meal.side}</p>
      <small>{meal.kcal} kcal</small>
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
  const max = Math.max(...weeklyLearning.map((item) => item.minutes));
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
  return (
    <section className="integration-card">
      <div className="card-header">
        <div>
          <p>연동 설계</p>
          <h3>나중에 붙일 데이터 소스</h3>
        </div>
        <Sparkles size={22} />
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
