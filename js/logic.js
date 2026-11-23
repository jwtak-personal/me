// 날짜와 주기 계산, 병합. 화면과 저장소에 기대지 않는 순수 함수만 둔다.
const DAY = 86400000;
const pad = n => String(n).padStart(2, '0');
const num = n => Number(n).toLocaleString('ko-KR');

export const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const today = () => fmt(new Date());
export const diffDays = (a, b) => Math.round((parse(a) - parse(b)) / DAY);

export function addInterval(dateStr, { n, unit }) {
  const d = parse(dateStr);
  if (unit === 'day') d.setDate(d.getDate() + n);
  else if (unit === 'week') d.setDate(d.getDate() + 7 * n);
  else {
    // 1월 31일 + 1개월은 2월 말일로 맞춘다
    const day = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + (unit === 'year' ? 12 * n : n));
    d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  }
  return fmt(d);
}

export const spanDays = ({ n, unit }) => n * { day: 1, week: 7, month: 30, year: 365 }[unit];

// level: over(지남) / today(오늘) / soon(곧) / ok(여유) / unknown(기록 없음)
// 주기가 2주보다 짧은 항목은 습관으로 본다. 밀려도 '지남' 대신 '오늘'로만 보여 준다.
// 한 번도 기록이 없으면 길든 짧든 띄우지 않는다(11-23: 기록 없는 1주 항목이 매일 홈에 떠서 헷갈렸음).
export function routineStatus(r, now, curKm) {
  const span = spanDays(r.every);
  const short = span < 14;
  const hasKm = !!r.kmEvery && r.lastKm != null && curKm != null;
  if (!r.last && !hasKm) return { level: 'unknown', daysLeft: null, kmLeft: null };
  const daysLeft = r.last ? diffDays(addInterval(r.last, r.every), now) : null;
  const kmLeft = hasKm ? r.lastKm + r.kmEvery - curKm : null;
  const soonDays = span >= 90 ? 14 : short ? 0 : 3;
  let level = 'ok';
  if ((daysLeft != null && daysLeft < 0) || (kmLeft != null && kmLeft < 0)) level = short ? 'today' : 'over';
  else if (daysLeft === 0) level = 'today';
  else if ((daysLeft != null && daysLeft <= soonDays) || (kmLeft != null && kmLeft <= 1000)) level = 'soon';
  return { level, daysLeft, kmLeft };
}

const leftText = d => d >= 345 ? `${Math.round(d / 365)}년 남음` : d >= 60 ? `${Math.round(d / 30)}개월 남음` : `${d}일 남음`;

// 날짜와 주행거리 기준이 둘 다 있으면 더 급한 쪽 하나만 보여 준다
export function statusText(st, r) {
  if (st.level === 'unknown') return '기록 없음';
  if (st.level === 'today') return '오늘';
  const kmCloser = st.kmLeft != null
    && (st.daysLeft == null || st.kmLeft / r.kmEvery < st.daysLeft / spanDays(r.every));
  if (kmCloser) return st.kmLeft < 0 ? `${num(-st.kmLeft)}km 지남` : `${num(st.kmLeft)}km 남음`;
  return st.daysLeft < 0 ? `${-st.daysLeft}일 지남` : leftText(st.daysLeft);
}

export function eventStatus(e, now) {
  const d = diffDays(e.date, now);
  if (d < 0) return { level: 'over', daysLeft: d, text: `${-d}일 지남` };
  if (d === 0) return { level: 'today', daysLeft: 0, text: '오늘' };
  return { level: 'ok', daysLeft: d, text: `D-${d}` };
}

const UNIT = { day: '일', week: '주', month: '개월', year: '년' };
const EVERY_ONE = { day: '매일', week: '매주', month: '매달', year: '매년' };

export function everyText(r) {
  const { n, unit } = r.every;
  if (r.kmEvery) return `${n}${UNIT[unit]} 또는 ${num(r.kmEvery)}km마다`;
  return n === 1 ? EVERY_ONE[unit] : `${n}${UNIT[unit]}마다`;
}

export function dateText(s, weekday = true) {
  const d = parse(s);
  const y = d.getFullYear() === new Date().getFullYear() ? '' : `${d.getFullYear()}년 `;
  return `${y}${d.getMonth() + 1}월 ${d.getDate()}일${weekday ? ` ${'일월화수목금토'[d.getDay()]}요일` : ''}`;
}

// 같은 id는 u(고친 시각)가 큰 쪽을 남긴다. 같으면 b(원격) 쪽.
export function mergeItems(a, b) {
  const m = new Map(a.map(it => [it.id, it]));
  for (const it of b) {
    const cur = m.get(it.id);
    if (!cur || (it.u || 0) >= (cur.u || 0)) m.set(it.id, it);
  }
  return [...m.values()];
}

export const serialize = items =>
  JSON.stringify({ v: 1, items: [...items].sort((x, y) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0)) }, null, 1) + '\n';
