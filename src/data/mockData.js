export const centerInfo = {
  name: '메디컬로드맵 독학재수센터',
  shortName: 'Medical Roadmap',
  campus: '본원 집중관리관',
};

export const linkedSystems = [
  {
    name: 'StudyCat',
    scope: '공부 시간, 과목별 통계, 일정, 할일을 StudyCat family API에서 실시간으로 불러옵니다.',
    status: 'API 연결 대기',
  },
  {
    name: 'medical_suite 멘토링 포털',
    scope: '토큰이 설정되면 주간 멘토링 기록과 다음 주 학습 액션을 불러옵니다.',
    status: '데이터 연결 대기',
  },
  {
    name: '식단 엑셀',
    scope: '첨부 이미지의 2026년 6월 메뉴를 기본 적용하고, 엑셀 업로드 시 자동 교체합니다.',
    status: '엑셀 템플릿 대기',
  },
  {
    name: '입퇴실 파일',
    scope: '등원, 하원, 외출, 복귀 파일을 업로드하면 학부모 출결 화면에 반영합니다.',
    status: '파일 포맷 대기',
  },
];

export const userProfile = {
  studentName: '김로드',
  parentName: '김로드 학부모',
  grade: 'N수 정규반',
  phone: '010-1234-5678',
  target: '의예과 정시 집중반',
  room: 'A관 3층 18번',
};

export const studySummary = {
  today: 437,
  week: 2475,
  month: 10480,
  custom: 3720,
  streak: 18,
  goal: 720,
};

export const subjectStudy = [
  { subject: '국어', minutes: 126, color: '#12372f', note: '독서 실전 3지문' },
  { subject: '수학', minutes: 154, color: '#1f5a4a', note: '미적분 오답 집중' },
  { subject: '영어', minutes: 63, color: '#b08a45', note: '순서/삽입 유형' },
  { subject: '탐구', minutes: 94, color: '#7c6f42', note: '개념 회독 및 자료 분석' },
];

export const weeklyLearning = [
  { day: '월', minutes: 398, completion: 72 },
  { day: '화', minutes: 452, completion: 83 },
  { day: '수', minutes: 421, completion: 78 },
  { day: '목', minutes: 510, completion: 91 },
  { day: '금', minutes: 437, completion: 84 },
  { day: '토', minutes: 257, completion: 49 },
  { day: '일', minutes: 0, completion: 0 },
];

export const examSchedule = [
  { subject: '국어', start: '08:40', end: '10:00', minutes: 80, state: '1교시' },
  { subject: '수학', start: '10:30', end: '12:10', minutes: 100, state: '2교시' },
  { subject: '점심', start: '12:10', end: '13:00', minutes: 50, state: '휴식' },
  { subject: '영어', start: '13:10', end: '14:20', minutes: 70, state: '3교시' },
  { subject: '한국사/탐구', start: '14:50', end: '16:37', minutes: 107, state: '4교시' },
  { subject: '제2외국어/한문', start: '17:05', end: '17:45', minutes: 40, state: '선택' },
];

export const meals = {
  lunch: {
    title: '닭가슴살 카레라이스',
    side: '미소장국, 양배추 샐러드, 배추김치',
    kcal: 690,
  },
  dinner: {
    title: '소고기 버섯 불고기',
    side: '현미밥, 계란찜, 오이무침',
    kcal: 735,
  },
};

export const initialSchedules = [
  { id: 's1', time: '09:00', title: '국어 독서 실전 세트', tag: 'StudyCat 연동' },
  { id: 's2', time: '14:00', title: '수학 미적분 오답 정리', tag: '담임 확인' },
  { id: 's3', time: '19:30', title: '영어 단어 누적 테스트', tag: '개인 일정' },
];

export const initialTodos = [
  { id: 't1', title: '국어 독서 3지문 분석', done: true },
  { id: 't2', title: '수학 킬러 문항 12개 오답', done: false },
  { id: 't3', title: '탐구 개념 노트 20쪽 정리', done: false },
];

export const points = [
  { id: 'p1', type: '상점', amount: 3, reason: '자율학습 집중 우수', date: '오늘' },
  { id: 'p2', type: '상점', amount: 2, reason: '주간 플래너 완성', date: '어제' },
  { id: 'p3', type: '벌점', amount: -1, reason: '입실 지연', date: '5월 13일' },
];

export const attendance = {
  status: '입실 중',
  checkIn: '08:12',
  checkOut: '-',
  seat: 'A관 3층 18번',
  timeline: [
    { time: '08:12', label: '입실 완료', tone: 'good' },
    { time: '12:12', label: '점심 식사 이동', tone: 'neutral' },
    { time: '13:01', label: '재입실 완료', tone: 'good' },
  ],
};

export const mentoringRecords = [
  {
    week: '5월 2주차',
    mentor: '이현서 멘토',
    focus: '수학 실전 시간 배분 조절',
    memo: '시간 제한 안에서 계산 검산 루틴을 줄이고 4점 문항 진입 기준을 명확히 잡기로 했습니다.',
    next: '미적분 실전 2회분, 오답 원인 3분류 제출',
  },
  {
    week: '5월 1주차',
    mentor: '이현서 멘토',
    focus: '국어 독서 지문 구조화',
    memo: '경제 지문에서 판단 시간이 길어지는 패턴을 확인했습니다. 문단별 역할 표시를 먼저 고정합니다.',
    next: '경제/법 지문 하루 2세트 풀이',
  },
];
