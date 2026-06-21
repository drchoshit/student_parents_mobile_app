export const dadaMeals2026June = [
  {
    date: '2026-06-01',
    lunch: ['묵은지돼지불고기', '불고기고로케 샐러드'],
    dinner: ['훈제오리부추잡채', '모듬채소찜 샐러드'],
  },
  {
    date: '2026-06-02',
    lunch: ['함박스테이크', '게살마요 & 감자샐러드'],
    dinner: ['가라아게치킨마요덮밥', '칠리새우 샐러드'],
  },
  {
    date: '2026-06-03',
    lunch: ['버섯소불고기떡볶음', '케이준치킨샌드위치 & 샐러드'],
    dinner: ['저녁없음'],
  },
  {
    date: '2026-06-04',
    lunch: ['닭볶음탕 & 옛날사라다', '리코타치즈&무화과조림샐러드'],
    dinner: ['오삼불고기', '토마토파스타 샐러드'],
  },
  {
    date: '2026-06-05',
    lunch: ['삼겹살수육보쌈정식', '구운버섯 & 베이컨샐러드'],
    dinner: ['닭다릿살데리소스볶음', '훈제오리단호박샐러드'],
  },
  {
    date: '2026-06-06',
    lunch: ['고기말이떡볶음', '알리오올리오 샐러드'],
    dinner: [],
  },
  {
    date: '2026-06-08',
    lunch: ['등심돈까스', '해시브라운 샐러드'],
    dinner: ['닭가슴살스테이크', '카프레제 샐러드'],
  },
  {
    date: '2026-06-09',
    lunch: ['중국식돈육불고기', '돈까스 샐러드'],
    dinner: ['사천짜장덮밥&탕수육', '두부튀김오리엔탈샐러드'],
  },
  {
    date: '2026-06-10',
    lunch: ['오징어떡볶음', '바질햄치즈샌드위치 & 샐러드'],
    dinner: ['생선까스', '리코타치즈 & 과일 샐러드'],
  },
  {
    date: '2026-06-11',
    lunch: ['등갈비김치찜', '오믈렛 & 소세지샐러드'],
    dinner: ['김치참치볶음밥', '닭가슴살 & 포케 샐러드'],
  },
  {
    date: '2026-06-12',
    lunch: ['짜장덮밥 & 떡볶이', '두부튀김 오리엔탈 샐러드'],
    dinner: ['간장돼지갈비찜', '치킨텐더 샐러드'],
  },
  {
    date: '2026-06-13',
    lunch: ['돈육김치찌개백반', '브런치 샐러드'],
    dinner: [],
  },
  {
    date: '2026-06-15',
    lunch: ['하드찬스테이크', '훈제오리 & 단호박 샐러드'],
    dinner: ['버섯소불고기', '모듬야채찜 샐러드'],
  },
  {
    date: '2026-06-16',
    lunch: ['묵은지닭볶음탕', '베이컨 & 버섯샐러드'],
    dinner: ['마파두부 덮밥', '카프레제 샐러드'],
  },
  {
    date: '2026-06-17',
    lunch: ['봉함고추장돼지불고기', '참치샌드위치 & 샐러드'],
    dinner: ['꽃게된장찌개 & 고기말이', '베이컨&버섯샐러드'],
  },
  {
    date: '2026-06-18',
    lunch: ['떡갈비 & 제철과일', '고구마고로케 & 새우샐러드'],
    dinner: ['삼치데리야끼구이', '구운단호박 & 견과 샐러드'],
  },
  {
    date: '2026-06-19',
    lunch: ['매운돼지갈비찜', '닭가슴살 샐러드'],
    dinner: ['치폴레햄볶음밥 & 미트볼', '닭가슴살 & 연두부 샐러드'],
  },
  {
    date: '2026-06-20',
    lunch: ['가라아게치킨마요덮밥', '돈까스 샐러드'],
    dinner: [],
  },
  {
    date: '2026-06-22',
    lunch: ['치킨까스 & 인도식카레', '게살마요 & 고구마 샐러드'],
    dinner: ['얼큰 닭개장', '돈까스 샐러드'],
  },
  {
    date: '2026-06-23',
    lunch: ['꽈리고추돼지간장불고기', '함박스테이크 & 샐러드'],
    dinner: ['부대찌개 백반 & 왕만두', '리코타치즈샐러드'],
  },
  {
    date: '2026-06-24',
    lunch: ['순살닭다릿살고추장볶음', '햄에그치즈샌드위치 & 샐러드'],
    dinner: ['한돈제육볶음', '닭가슴살&브로콜리샐러드'],
  },
  {
    date: '2026-06-25',
    lunch: ['매운오징어떡볶음', '불고기치즈샌드위치 & 샐러드'],
    dinner: ['새우야채볶음밥', '리코타치즈 샐러드'],
  },
  {
    date: '2026-06-26',
    lunch: ['안동찜닭', '카프레제 샐러드'],
    dinner: ['등심돈까스 & 계란찜', '불고기고로케 샐러드'],
  },
  {
    date: '2026-06-27',
    lunch: ['스팸김치볶음밥', '찹스테이크 샐러드'],
    dinner: [],
  },
  {
    date: '2026-06-29',
    lunch: ['봉함고추장불고기', '해시브라운 샐러드'],
    dinner: ['참치김치찌개 백반', '소불고기 & 포케 샐러드'],
  },
  {
    date: '2026-06-30',
    lunch: ['훈제오리부추잡채', '케이준치킨 &샐러드'],
    dinner: ['간장양념치킨', '함박스테이크 샐러드'],
  },
].map((meal) => ({
  ...meal,
  source: '다다익찬 2026년 6월 이미지 메뉴',
}));

export function toDateKey(value = new Date()) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDadaMealsForMonth(monthKey = '2026-06') {
  return dadaMeals2026June.filter((meal) => meal.date.startsWith(monthKey));
}

export function getDadaMealForDate(value = new Date()) {
  const dateKey = toDateKey(value);
  return dadaMeals2026June.find((meal) => meal.date === dateKey) ?? null;
}

export function getNextDadaMealAfter(value = new Date()) {
  const dateKey = toDateKey(value);
  return dadaMeals2026June.find((meal) => meal.date > dateKey) ?? null;
}
