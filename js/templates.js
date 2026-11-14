// 영역과 처음 깔리는 기본 항목. 누구에게나 맞는 일반 주기만 둔다.
// 개인 기록(주행거리, 일정, 메모)은 여기 넣지 않는다. 이 저장소는 공개다.
export const AREAS = [
  { id: 'money', name: '돈', link: { title: '손PB 열기', sub: '자산과 현금흐름은 손PB에서 봐요', url: 'https://sonpb.com' } },
  { id: 'car', name: '차', metric: { key: 'odometer', name: '주행거리', unit: 'km' } },
  { id: 'health', name: '건강', metric: { key: 'weight', name: '체중', unit: 'kg' } },
  { id: 'skin', name: '피부' },
];

const R = (id, area, title, n, unit, extra = {}) => ({ id, type: 'routine', area, title, every: { n, unit }, ...extra, u: 0 });

export const starterItems = () => [
  R('t-money-sonpb', 'money', '손PB 자산 현황 새로 올리기', 1, 'month'),
  R('t-money-fixed', 'money', '고정 지출과 구독 점검', 6, 'month'),
  R('t-money-credit', 'money', '신용점수 확인', 6, 'month'),
  R('t-money-tax', 'money', '연말정산 준비', 1, 'year', { note: '연금저축과 IRP 납입액 확인' }),

  R('t-car-oil', 'car', '엔진오일, 오일필터 교환', 1, 'year', { kmEvery: 7000, note: '시내 단거리 위주면 7,000~8,000km 또는 1년 중 먼저 오는 쪽' }),
  R('t-car-dpf', 'car', '고속도로 30분 주행', 2, 'week', { note: '디젤차. 시내만 타면 매연 필터(DPF)에 그을음이 쌓임' }),
  R('t-car-fuelfilter', 'car', '연료필터 교환', 3, 'year', { kmEvery: 30000 }),
  R('t-car-cabin', 'car', '에어컨 필터 교환', 1, 'year'),
  R('t-car-airfilter', 'car', '에어 필터 교환', 1, 'year'),
  R('t-car-wiper', 'car', '와이퍼 교체', 1, 'year'),
  R('t-car-brakefluid', 'car', '브레이크액 교환', 2, 'year', { kmEvery: 40000 }),
  R('t-car-brakepad', 'car', '브레이크 패드 점검', 1, 'year', { kmEvery: 10000 }),
  R('t-car-tirecheck', 'car', '타이어 위치 교환, 공기압 점검', 1, 'year', { kmEvery: 10000 }),
  R('t-car-tire', 'car', '타이어 교체', 5, 'year', { kmEvery: 50000, note: '옆면 4자리 숫자가 생산 주차와 연도' }),
  R('t-car-battery', 'car', '배터리 교체', 4, 'year'),
  R('t-car-atf', 'car', '변속기 오일 점검', 5, 'year', { kmEvery: 100000 }),
  R('t-car-coolant', 'car', '냉각수 교환', 10, 'year', { kmEvery: 200000, note: '첫 교환은 10년 또는 20만km, 그 뒤로는 2년 또는 4만km' }),
  R('t-car-insurance', 'car', '자동차 보험 갱신', 1, 'year'),
  R('t-car-inspect', 'car', '자동차 정기검사', 2, 'year'),

  R('t-health-checkup', 'health', '건강검진', 2, 'year'),
  R('t-health-scaling', 'health', '치과 스케일링', 1, 'year', { note: '건강보험 적용은 1년에 한 번' }),
  R('t-health-exercise', 'health', '운동', 2, 'day'),
  R('t-health-weight', 'health', '체중 재기', 1, 'week'),

  R('t-skin-sunscreen', 'skin', '선크림 바르기', 1, 'day'),
  R('t-skin-pillow', 'skin', '베개 커버 세탁', 1, 'week'),
];
