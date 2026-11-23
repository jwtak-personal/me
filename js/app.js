import { AREAS } from './templates.js?v=20261123c';
import * as L from './logic.js?v=20261123c';
import { store } from './store.js?v=20261123c';

const app = document.getElementById('app');
const dlg = document.getElementById('sheet');
const toastEl = document.getElementById('toast');

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = n => Number(n).toLocaleString('ko-KR');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// 선 아이콘 한 세트 (24 격자, 선 2px)
const ICON = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  money: '<path d="M19 9V6a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V7"/><path d="M16.5 14h.01"/>',
  car: '<path d="M5 11l1.6-4.6A2 2 0 0 1 8.5 5h7a2 2 0 0 1 1.9 1.4L19 11"/><rect x="3" y="11" width="18" height="6" rx="2"/><path d="M6 17v2M18 17v2M7.5 14h.01M16.5 14h.01"/>',
  health: '<path d="M12 20.5s-8-4.6-8-10.7A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 8 2.4c0 6.1-8 10.7-8 10.7z"/>',
  skin: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/>',
  growth: '<path d="M4 20h16M5 15l4-4 3 3 6-7"/><path d="M14 7h4v4"/>',
  people: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8"/>',
  rest: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  sonpb: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
  docs: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  settings: '<path d="M4 7h9M19 7h1M4 17h1M11 17h9"/><circle cx="16" cy="7" r="2.5"/><circle cx="8" cy="17" r="2.5"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  back: '<path d="m15 6-6 6 6 6"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  check: '<path d="m6 12.5 4 4 8-9"/>',
  spark: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/>',
  pencil: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  career: '<rect x="4" y="3" width="16" height="18" rx="3"/><circle cx="12" cy="10" r="3"/><path d="M8 17a4 4 0 0 1 8 0"/>',
  logbook: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
};
const icon = (name, size = 24, sw = 2) =>
  `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name]}</svg>`;

// CSP 가 인라인 style 을 막아서 색은 클래스로 준다(styles.css 의 .g-영역).
const mm = q => matchMedia(q).matches;

const ui = { allLogs: false, allDue: false, day: null };
let sheetCtx = null;
let installEvt = null;

// ── 데이터 읽기 ──────────────────────────────────────────
const areaName = id => AREAS.find(a => a.id === id)?.name ?? '';
const latest = key => store.list('reading').filter(r => r.key === key)
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.u - a.u))[0] ?? null;
const curKm = () => latest('odometer')?.value ?? null;
const RANK = { over: 0, today: 1, soon: 2, ok: 3, unknown: 4 };

function dueList() {
  const now = L.today(), km = curKm(), out = [];
  for (const r of store.list('routine')) {
    const st = L.routineStatus(r, now, km);
    if (RANK[st.level] <= 2) out.push({ it: r, level: st.level, text: L.statusText(st, r), key: st.daysLeft ?? 0 });
  }
  for (const e of store.list('event')) {
    if (e.done) continue;
    const st = L.eventStatus(e, now);
    if (st.level !== 'ok') out.push({ it: e, level: st.level, text: st.text, key: st.daysLeft });
  }
  return out.sort((a, b) => RANK[a.level] - RANK[b.level] || a.key - b.key);
}

const upcoming = () => store.list('event')
  .filter(e => !e.done && e.date > L.today())
  .sort((a, b) => (a.date < b.date ? -1 : 1));

function areaSummary(a) {
  const due = dueList().filter(d => d.it.area === a.id);
  if (due.length) return { text: `챙길 것 ${due.length}개`, alert: due.some(d => d.level === 'over') };
  const ev = upcoming().find(e => e.area === a.id);
  if (ev) return { text: `${L.dateText(ev.date, false)} ${ev.title}` };
  const now = L.today(), km = curKm();
  const unknown = store.list('routine', a.id).filter(r => L.routineStatus(r, now, km).level === 'unknown').length;
  return { text: unknown ? `기록 없는 항목 ${unknown}개` : '다 챙겼어요' };
}

// ── 화면 조각 (손PB 11-21 시안 방식: 회색 바탕 위 흰 둥근 상자, 색 아이콘 원, 왼쪽 체크박스) ──
// 영역 색은 styles.css 의 .g-영역. 연한 원 바탕에 진한 아이콘.
const glyph = (name, color = name, size = 20) => `<span class="glyph g-${color}">${icon(name, size)}</span>`;
const card = (inner, cls = '') => `<section class="card${cls ? ` ${cls}` : ''}">${inner}</section>`;
const box = it =>
  `<button class="box" data-act="done" data-id="${it.id}" aria-label="${esc(it.title)} 완료"><span>${icon('check', 14, 3)}</span></button>`;

// 할 일 한 줄: 체크박스, 제목, 아래 회색 보조, 오른쪽 작은 상태
function taskRow(it, { sub = '', meta = '', metaCls = '', check = true, lead = '' } = {}) {
  return `<li class="row">
    ${check ? box(it) : lead}
    <button class="row-main" data-act="edit" data-id="${it.id}">
      <span class="row-text"><span class="row-title">${esc(it.title)}</span>${sub ? `<span class="row-sub">${esc(sub)}</span>` : ''}</span>
      ${meta ? `<span class="row-meta ${metaCls}">${esc(meta)}</span>` : ''}
    </button>
  </li>`;
}
// 예전 이름으로 부르는 곳(목표)을 위해 남겨 둔다
const itemRow = (it, { sub, right, level, check = true, lead = '' }) =>
  taskRow(it, { sub, meta: right, metaCls: STATUS_CLS[level] ?? '', check, lead });
const STATUS_CLS = { over: 'alert', today: 'today', soon: 'soon' };

// 페이지 머리: 큰 제목(영역 화면은 앞에 색 원), 아래 회색 한 줄
const pageTitle = (title, g, color, sub = '') => `<div class="page-title">
  <h1>${g ? glyph(g, color, 22) : ''}<span>${title}</span></h1>
  ${sub ? `<p class="page-sub">${sub}</p>` : ''}
</div>`;
// 안쪽 화면 머리: 뒤로가기만
const navBar = back => `<header class="nav"><a class="icon-btn" href="${back}" aria-label="뒤로">${icon('back', 26)}</a></header>`;
// 상자 머리: 작은 머리말 한 줄 + 제목, 오른쪽에 보조 글자나 + 버튼
const groupHead = (title, { eyebrow, add, right } = {}) => `<div class="card-head">
  <div class="card-head-text">${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ''}<h2>${title}</h2></div>
  ${right ? `<span class="card-head-right">${right}</span>` : ''}
  ${add ? `<button class="add-mini" data-act="add" data-kind="${add.kind}" data-area="${add.area ?? ''}" aria-label="${add.label ?? title} 추가">${icon('plus', 20, 2.2)}</button>` : ''}
</div>`;
const empty = text => `<p class="empty">${text}</p>`;
const fab = (kind, label) => `<button class="fab" data-act="add" data-kind="${kind}" aria-label="${label}">${icon('plus', 28, 2.4)}</button>`;

// 홈 맨 위 내 정보(웍스 인사 상자처럼). 이름과 생일은 공개 저장소에 두지 않고 기록의 profile 항목에서 읽는다
const age = birth => {
  const b = L.parse(birth), n = new Date();
  return n.getFullYear() - b.getFullYear() - (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate()) ? 1 : 0);
};
const clockText = () => { const n = new Date(), p = x => String(x).padStart(2, '0'); return `${p(n.getHours())}:${p(n.getMinutes())}:${p(n.getSeconds())}`; };
function profileCard() {
  const p = store.list('profile')[0];
  if (!p) return '';
  const d = L.parse(L.today());
  const sub = [p.birth ? `만 ${age(p.birth)}세` : '', p.role ?? ''].filter(Boolean).join(', ');
  return card(`<div class="profile-head"><span class="avatar">${esc((p.name ?? '').slice(0, 1))}</span>
      <div><p class="profile-name">${esc(p.name)} 님</p>${sub ? `<p class="row-sub">${esc(sub)}</p>` : ''}</div></div>
    <div class="profile-tiles">
      <div class="ptile"><p class="eyebrow">${d.getMonth() + 1}월 ${d.getDate()}일 (${'일월화수목금토'[d.getDay()]})</p><p class="ptile-v today" data-clock>${clockText()}</p></div>
      ${p.since ? `<div class="ptile"><p class="eyebrow">${esc(p.sinceLabel ?? '시작')} 후</p><p class="ptile-v">${L.diffDays(L.today(), p.since) + 1}일째</p></div>` : ''}
    </div>`, 'summary');
}
setInterval(() => { const el = document.querySelector('[data-clock]'); if (el) el.textContent = clockText(); }, 1000);

function syncLine() {
  const s = store.syncState();
  const text = { syncing: '동기화하는 중', offline: '오프라인이에요. 다음에 열 때 올려요', error: `동기화 실패. ${s.msg}` }[s.status];
  return text ? `<p class="foot">${esc(text)}</p>` : '';
}

// ── 데이터 묶기 ──────────────────────────────────────────
// Claude 가 점검 때 data.json 에 넣는 제안. 읽고 반영하거나 넘기면 사라진다.
const TIP_KIND = { fact: '새로 알게 된 것', auto: '자동으로 할 수 있는 것', better: '더 잘할 수 있는 것' };
const openTips = () => store.list('tip').filter(t => !t.status).sort((a, b) => (a.date < b.date ? 1 : -1));
const won = n => `${num(n)}원`;
const spentIn = prefix => store.list('log').filter(l => l.date.startsWith(prefix)).reduce((t, l) => t + (l.cost || 0), 0);
const dayLabel = s => {
  const d = L.diffDays(s, L.today());
  return d === 0 ? '오늘' : d === 1 ? '내일' : `${'일월화수목금토'[L.parse(s).getDay()]}요일`;
};

// 앞으로 돌아오는 것: 일정 + 2주 이상 주기 항목(마지막 날짜를 아는 것만), 날짜별로
function agenda(days) {
  const now = L.today(), end = L.addInterval(now, { n: days, unit: 'day' });
  const out = [];
  for (const e of store.list('event')) if (!e.done && e.date > now && e.date <= end) out.push({ date: e.date, it: e });
  for (const r of store.list('routine')) {
    if (!r.last || L.spanDays(r.every) < 14) continue;
    const due = L.addInterval(r.last, r.every);
    if (due > now && due <= end) out.push({ date: due, it: r });
  }
  out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const groups = [];
  for (const x of out) {
    if (groups.at(-1)?.date !== x.date) groups.push({ date: x.date, items: [] });
    groups.at(-1).items.push(x.it);
  }
  return groups;
}

// ── 홈 (웍스 일정 화면처럼: 두 주 달력, 고른 날, 앞으로 일정, 영역별) ──
const md = s => { const d = L.parse(s); return `${d.getMonth() + 1}/${d.getDate()}(${'일월화수목금토'[d.getDay()]})`; };
// 영역 표시: 색 점 + 영역 이름
const tag = area => `<span class="tag g-${area}"><i></i>${areaName(area)}</span>`;
function homeRow(it, { meta = '', metaCls = '', check = false } = {}) {
  return `<li class="row hrow">
    ${tag(it.area)}
    <button class="hrow-main" data-act="edit" data-id="${it.id}"><span class="row-title">${esc(it.title)}</span>${meta ? `<span class="row-sub ${metaCls}">${esc(meta)}</span>` : ''}</button>
    ${check ? box(it) : ''}
  </li>`;
}

// 날짜별 항목. 지난날은 한 일(기록), 오늘은 챙길 것 전부(밀린 것 포함), 앞날은 일정과 돌아오는 주기 항목
function dayItems(date, ahead) {
  const now = L.today();
  if (date < now) return store.list('log').filter(l => l.date === date).map(it => ({ it }));
  if (date === now) return dueList().filter(d => d.level !== 'soon')
    .map(d => ({ it: d.it, meta: d.level === 'over' ? d.text : '', metaCls: d.level === 'over' ? 'alert' : '', check: true }));
  return (ahead.get(date) ?? []).map(it => ({ it, meta: it.type === 'routine' ? L.everyText(it) : '' }));
}

function calendar(sel, ahead) {
  const now = L.today();
  const start = L.addInterval(now, { n: -L.parse(now).getDay(), unit: 'day' });
  const days = Array.from({ length: 14 }, (_, i) => L.addInterval(start, { n: i, unit: 'day' }));
  const dots = d => [...new Set(dayItems(d, ahead).map(x => x.it.area))].slice(0, 3).map(a => `<i class="g-${a}"></i>`).join('');
  const wk = i => (i % 7 === 0 ? ' sun' : i % 7 === 6 ? ' sat' : '');
  return `<div class="cal">
    ${[...'일월화수목금토'].map((w, i) => `<span class="cal-w${wk(i)}">${w}</span>`).join('')}
    ${days.map((d, i) => `<button class="cal-d${wk(i)}${d < now ? ' past' : ''}${d === now ? ' now' : ''}${d === sel ? ' sel' : ''}" data-act="day" data-date="${d}" aria-label="${L.dateText(d)}"${d === sel ? ' aria-pressed="true"' : ''}>
      <b>${L.parse(d).getDate()}</b><span class="cal-dots">${dots(d)}</span></button>`).join('')}
  </div>`;
}

function homeView() {
  const now = L.today(), sel = ui.day ?? now;
  const groups = agenda(60);
  const ahead = new Map(groups.map(g => [g.date, g.items]));
  const items = dayItems(sel, ahead);
  const soonGroups = groups.filter(g => L.diffDays(g.date, now) <= 30);
  const shownGroups = []; // 앞으로 일정은 여덟 줄까지만, 나머지는 일정 탭에서
  let left = 8;
  for (const g of soonGroups) {
    if (left <= 0) break;
    shownGroups.push({ date: g.date, items: g.items.slice(0, left) });
    left -= g.items.length;
  }
  const more = soonGroups.reduce((t, g) => t + g.items.length, 0) - shownGroups.reduce((t, g) => t + g.items.length, 0);
  const tips = openTips();
  return `
  ${pageTitle('홈', '', '', store.list('profile').length ? '' : L.dateText(now))}
  ${profileCard()}
  ${card(`${calendar(sel, ahead)}
    <div class="day-bar"><h2>${md(sel)}${sel === now ? ' 오늘' : ''}</h2>
      ${sel >= now ? `<button class="chip" data-act="add" data-kind="event" data-date="${sel}">${icon('plus', 18, 2.2)}일정</button>` : ''}</div>
    ${items.length ? `<ul class="hlist">${items.map(x => homeRow(x.it, x)).join('')}</ul>`
      : empty(sel < now ? '이날 남긴 기록이 없어요' : sel === now ? '오늘 챙길 것이 없어요' : '이날 잡힌 일이 없어요')}`)}
  ${tips.length ? card(`<a class="link-row" href="#/tips">${glyph('spark', 'tip')}<span class="link-row-text"><span class="row-title">Claude 제안 ${tips.length}개</span><span class="row-sub">읽고 반영하거나 넘겨 주세요</span></span>${icon('chevron', 18)}</a>`, 'tight') : ''}
  ${card(`${groupHead('앞으로 일정', { right: soonGroups.length ? '30일 안' : '' })}
    ${shownGroups.length ? shownGroups.map(g => `<p class="date-head">${md(g.date)}</p>
      <ul class="hlist">${g.items.map(it => homeRow(it, { meta: L.diffDays(g.date, now) === 1 ? '내일' : `D-${L.diffDays(g.date, now)}` })).join('')}</ul>`).join('') : empty('30일 안에 잡힌 일정이 없어요')}
    ${more > 0 ? `<a class="more" href="#/plan">${more}개 더 보기</a>` : ''}`)}
  ${card(`${groupHead('영역별')}
    <div class="area-grid">${AREAS.map(a => {
      const s = areaSummary(a);
      return `<a class="area-tile" href="#/a/${a.id}">${glyph(a.id, a.id)}<span class="row-title">${a.name}</span><span class="row-sub${s.alert ? ' alert' : ''}">${esc(s.text)}</span></a>`;
    }).join('')}</div>`)}
  ${syncLine()}`;
}

// ── 일정 (Things 'Upcoming') ──────────────────────────────
function planView() {
  const groups = agenda(120);
  const thisYear = L.today().slice(0, 4);
  return `
  ${pageTitle('일정', '', '', groups.length ? `넉 달 안에 ${groups.reduce((t, g) => t + g.items.length, 0)}개` : '')}
  ${groups.length ? groups.map(g => {
    const d = L.parse(g.date);
    return card(`<div class="day-head"><b>${d.getDate()}</b><span>${g.date.slice(0, 4) === thisYear ? '' : `${d.getFullYear()}년 `}${d.getMonth() + 1}월 ${dayLabel(g.date)}</span></div>
      <ul class="rows">${g.items.map(it => taskRow(it, { sub: it.type === 'routine' ? L.everyText(it) : areaName(it.area) })).join('')}</ul>`);
  }).join('') : card(empty('앞으로 넉 달 동안 잡힌 일정이 없어요'))}
  ${fab('event', '일정 추가')}`;
}

// ── 기록 (Things 'Logbook') ──────────────────────────────
function logView() {
  const logs = store.list('log').sort((x, y) => (x.date < y.date ? 1 : x.date > y.date ? -1 : y.u - x.u));
  const ym = L.today().slice(0, 7), year = L.today().slice(0, 4);
  const months = [];
  for (const l of logs) {
    const k = l.date.slice(0, 7);
    if (months.at(-1)?.ym !== k) months.push({ ym: k, items: [] });
    months.at(-1).items.push(l);
  }
  return `
  ${pageTitle('기록')}
  ${card(`<p class="eyebrow">이번 달 쓴 돈</p><p class="display">${won(spentIn(ym))}</p><p class="row-sub">올해 ${won(spentIn(year))}</p>`, 'summary')}
  ${months.length ? months.map(m => {
    const [y, mo] = m.ym.split('-').map(Number);
    const sum = m.items.reduce((t, l) => t + (l.cost || 0), 0);
    return card(`${groupHead(`${String(y) === year ? '' : `${y}년 `}${mo}월`, { right: sum ? won(sum) : '' })}
      <ul class="rows">${m.items.map(l => taskRow(l, { check: false, lead: `<span class="box done-box"><span>${icon('check', 14, 3)}</span></span>`, sub: L.dateText(l.date), meta: l.cost ? won(l.cost) : '' })).join('')}</ul>`);
  }).join('') : card(empty('할 일을 끝내면 여기에 쌓여요'))}
  ${fab('log', '기록 추가')}`;
}

// ── 전체 (Things 첫 화면 목록) ────────────────────────────
function allView() {
  const due = dueList();
  const over = due.filter(d => d.level === 'over').length;
  const navRow = (href, g, color, name, sub = '', badge = '') => `<li><a class="list-row" href="${href}">
    ${glyph(g, color)}<span class="link-row-text"><span class="row-title">${name}</span>${sub ? `<span class="row-sub">${esc(sub)}</span>` : ''}</span>
    ${badge ? `<span class="badge">${badge}</span>` : ''}${icon('chevron', 18)}
  </a></li>`;
  return `
  ${pageTitle('전체')}
  ${card(`<ul class="list">
    ${navRow('#/', 'star', 'star', '홈', due.length ? `챙길 것 ${due.length}개` : '', over || '')}
    ${navRow('#/plan', 'calendar', 'cal', '일정', upcoming().length ? `잡힌 일정 ${upcoming().length}개` : '')}
    ${navRow('#/tips', 'spark', 'tip', 'Claude 제안', openTips().length ? `새 제안 ${openTips().length}개` : '')}
    ${navRow('#/log', 'logbook', 'done', '기록')}
    ${navRow('#/links', 'link', 'tip', '바로가기', store.list('link').length ? `사이트 ${store.list('link').length}개` : '')}
  </ul>`)}
  ${card(`${groupHead('영역')}<ul class="list">
    ${AREAS.map(a => {
      const o = due.filter(d => d.it.area === a.id && d.level === 'over').length;
      return navRow(`#/a/${a.id}`, a.id, a.id, a.name, areaSummary(a).text, o || '');
    }).join('')}
  </ul>`)}
  ${card(`<ul class="list">${navRow('#/settings', 'settings', 'gray', '설정')}</ul>`)}`;
}

// ── 바로가기 ─────────────────────────────────────────────
const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };
const safeUrl = u => (/^https?:\/\//.test(u) ? u : '#');
const linkRows = list => `<ul class="rows">${list.map(l => `<li class="row">
    <a class="row-main" href="${esc(safeUrl(l.url))}" target="_blank" rel="noopener">
      <span class="row-text"><span class="row-title">${esc(l.title)}</span><span class="row-sub">${esc(l.note || host(l.url))}</span></span>
    </a>
    <button class="add-mini" data-act="edit" data-id="${l.id}" aria-label="${esc(l.title)} 고치기">${icon('pencil', 18, 2)}</button>
  </li>`).join('')}</ul>`;
const linksOf = area => store.list('link', area).sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || (a.title < b.title ? -1 : 1));

function linksView() {
  const groups = AREAS.map(a => ({ a, list: linksOf(a.id) })).filter(g => g.list.length);
  return `
  ${navBar('#/all')}
  ${pageTitle('바로가기')}
  ${groups.length ? groups.map(g => card(`${groupHead(g.a.name)}${linkRows(g.list)}`)).join('') : card(empty('저장한 사이트가 없어요'))}
  ${fab('link', '사이트 추가')}`;
}

// ── Claude 제안 ──────────────────────────────────────────
function tipsView() {
  const tips = openTips();
  return `
  ${navBar('#/all')}
  ${pageTitle('Claude 제안')}
  ${card(tips.length ? `<ul class="rows">${tips.map(t => taskRow(t, { check: false, lead: glyph('spark', 'tip'), sub: TIP_KIND[t.kind] ?? '', meta: t.reply ? '메모 있음' : '', metaCls: 'today' })).join('')}</ul>` : empty('지금은 새 제안이 없어요'))}`;
}

// ── 영역 (Things 'Project') ──────────────────────────────
function metricBlock(a) {
  const m = a.metric, cur = latest(m.key);
  return card(`<div class="metric">
    <div><p class="eyebrow">${m.name}</p><p class="display">${cur ? `${num(cur.value)}${m.unit}` : '적기 전'}</p>${cur ? `<p class="row-sub">${L.dateText(cur.date, false)} 기준</p>` : ''}</div>
    <button class="pill" data-act="reading" data-area="${a.id}">${cur ? '새로 적기' : '적기'}</button>
  </div>`, 'summary');
}

function goalSection(a) {
  const goals = store.list('goal', a.id).sort((x, y) => ((x.by || '9') < (y.by || '9') ? -1 : 1));
  return card(`${groupHead('목표', { add: { kind: 'goal', area: a.id } })}
    ${goals.length ? `<ul class="rows">${goals.map(g => taskRow(g, { check: false, lead: glyph('growth', 'growth'), sub: g.by ? `${L.dateText(g.by, false)}까지` : '', meta: g.pct != null ? `${g.pct}%` : '', metaCls: 'today' })).join('')}</ul>` : empty('아직 목표가 없어요')}`);
}

function areaView(a) {
  const now = L.today(), km = curKm();
  const rs = store.list('routine', a.id).map(r => ({ r, st: L.routineStatus(r, now, km) }))
    .sort((x, y) => RANK[x.st.level] - RANK[y.st.level] || (x.st.daysLeft ?? 0) - (y.st.daysLeft ?? 0) || L.spanDays(x.r.every) - L.spanDays(y.r.every));
  const evs = store.list('event', a.id).filter(e => !e.done).sort((x, y) => (x.date < y.date ? -1 : 1));
  const logs = store.list('log', a.id).sort((x, y) => (x.date < y.date ? 1 : x.date > y.date ? -1 : y.u - x.u));
  const spent = logs.filter(l => l.date.startsWith(now.slice(0, 4))).reduce((s, l) => s + (l.cost || 0), 0);
  const shown = ui.allLogs ? logs : logs.slice(0, 5);
  const s = areaSummary(a);
  return `
  ${navBar('#/all')}
  ${pageTitle(a.name, a.id, a.id, esc(s.text))}
  ${a.metric ? metricBlock(a) : ''}
  ${linksOf(a.id).length ? card(`${groupHead('바로가기', { add: { kind: 'link', area: a.id, label: '사이트' } })}${linkRows(linksOf(a.id))}`) : ''}
  ${a.goals ? goalSection(a) : ''}
  ${card(`${groupHead('주기 관리', { add: { kind: 'routine', area: a.id } })}
  ${rs.length ? `<ul class="rows">${(ui.allDue ? rs : rs.slice(0, 5)).map(({ r, st }) => taskRow(r, { sub: L.everyText(r), meta: L.statusText(st, r), metaCls: STATUS_CLS[st.level] ?? '' })).join('')}</ul>` : empty('주기로 챙길 항목을 추가해 보세요')}
  ${rs.length > 5 && !ui.allDue ? `<button class="more" data-act="moredue">${rs.length - 5}개 더 보기</button>` : ''}`)}
  ${card(`${groupHead('일정', { add: { kind: 'event', area: a.id } })}
  ${evs.length ? `<ul class="rows">${evs.map(e => { const st = L.eventStatus(e, now); return taskRow(e, { sub: L.dateText(e.date), meta: st.text, metaCls: STATUS_CLS[st.level] ?? '' }); }).join('')}</ul>` : empty('예정된 일정이 없어요')}`)}
  ${card(`${groupHead('기록', { right: spent ? `올해 ${won(spent)}` : '', add: { kind: 'log', area: a.id } })}
  ${logs.length ? `<ul class="rows">${shown.map(l => taskRow(l, { check: false, lead: `<span class="box done-box"><span>${icon('check', 14, 3)}</span></span>`, sub: L.dateText(l.date), meta: l.cost ? won(l.cost) : '' })).join('')}</ul>` : empty('아직 기록이 없어요')}
  ${logs.length > 5 && !ui.allLogs ? `<button class="more" data-act="morelogs">더 보기</button>` : ''}`)}`;
}

function navView(tab) {
  const t = (href, id, name, ic) =>
    `<a href="${href}" class="${tab === id ? 'on' : ''}"${tab === id ? ' aria-current="page"' : ''}>${icon(ic, 24, 2)}<span>${name}</span></a>`;
  return `<nav class="tabbar">${t('#/', 'home', '홈', 'home')}${t('#/plan', 'plan', '일정', 'calendar')}${t('#/log', 'log', '기록', 'logbook')}${t('#/all', 'all', '전체', 'grid')}</nav>`;
}

// ── 설정 ─────────────────────────────────────────────────
function settingsView() {
  const s = store.syncState(), c = store.config();
  const at = s.at ? new Date(s.at).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' }) : '';
  const line = { syncing: '동기화하는 중이에요', ok: `${at}에 맞췄어요`, offline: '오프라인이에요. 다음에 열 때 올려요', error: `동기화하지 못했어요. ${s.msg}`, idle: '연결돼 있어요' }[s.status] ?? '';
  return `
  ${navBar('#/all')}
  ${pageTitle('설정')}
  ${card(`${groupHead(c ? esc(line) : '연결 전이에요', { eyebrow: '동기화' })}
  ${c ? `<div class="stack">
      <button class="pill wide" data-act="sync">지금 동기화</button>
      <button class="pill wide" data-act="copylink">다른 기기 연결 링크 복사</button>
      <button class="btn-text" data-act="disconnect">연결 끊기</button>
    </div>`
  : `<form class="stack" data-connect>
      <label class="field"><span>연결 링크 또는 토큰</span><input name="token" type="password" required autocomplete="off"></label>
      <label class="field"><span>저장소</span><input name="repo" placeholder="토큰을 넣을 때만" autocapitalize="off" autocomplete="off" spellcheck="false"></label>
      <button class="btn-primary" type="submit">연결</button>
    </form>`}`)}
  ${card(`${groupHead('백업')}
  <div class="stack">
    <button class="pill wide" data-act="export">파일로 내보내기</button>
    <label class="pill wide">파일에서 가져오기<input type="file" accept="application/json,.json" hidden data-import></label>
  </div>`)}
  ${installEvt ? card(`${groupHead('설치')}<div class="stack"><button class="pill wide" data-act="install">홈 화면에 추가</button></div>`) : ''}`;
}

// ── 입력 시트 ────────────────────────────────────────────
const field = (label, inner) => `<label class="field"><span class="t-cap muted">${label}</span>${inner}</label>`;
const val = v => (v == null ? '' : esc(v));

const areaField = () => field('영역', `<select name="area">${AREAS.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}</select>`);

function sheetHtml(c) {
  const it = c.item, now = L.today();
  let title, body, submit = '저장';
  const pickArea = !it && !c.area && ['routine', 'event', 'log', 'link'].includes(c.kind);
  if (c.kind === 'routine') {
    const r = it ?? { every: { n: 1, unit: 'month' } };
    const car = (it?.area ?? c.area) === 'car';
    title = it ? '주기 항목' : '주기 항목 추가';
    body = field('이름', `<input name="title" required value="${val(r.title)}">`)
      + `<div class="field"><span class="t-cap muted">주기</span><div class="pair">
          <input name="n" type="number" inputmode="numeric" min="1" required value="${r.every.n}" aria-label="주기 숫자">
          <select name="unit" aria-label="주기 단위">${[['day', '일'], ['week', '주'], ['month', '개월'], ['year', '년']].map(([v, t]) => `<option value="${v}"${r.every.unit === v ? ' selected' : ''}>${t}마다</option>`).join('')}</select>
        </div></div>`
      + (car ? field('주행거리 주기', `<input name="kmEvery" type="number" inputmode="numeric" min="0" placeholder="km" value="${val(r.kmEvery)}">`) : '')
      + field('마지막으로 한 날', `<input name="last" type="date" max="${now}" value="${val(r.last)}">`)
      + (car ? field('그때 주행거리', `<input name="lastKm" type="number" inputmode="numeric" min="0" placeholder="km" value="${val(r.lastKm)}">`) : '')
      + field('메모', `<textarea name="note" rows="3">${val(r.note)}</textarea>`);
  } else if (c.kind === 'event') {
    title = it ? '일정' : '일정 추가';
    body = field('이름', `<input name="title" required value="${val(it?.title)}">`)
      + (pickArea ? areaField() : '')
      + field('날짜', `<input name="date" type="date" required value="${val(it?.date ?? c.date ?? now)}">`)
      + field('메모', `<textarea name="note" rows="${it?.note ? Math.min(14, it.note.split('\n').length + 1) : 3}">${val(it?.note)}</textarea>`);
  } else if (c.kind === 'log') {
    title = it ? '기록' : '기록 추가';
    body = field('이름', `<input name="title" required value="${val(it?.title)}">`)
      + (pickArea ? areaField() : '')
      + field('날짜', `<input name="date" type="date" required max="${now}" value="${val(it?.date ?? now)}">`)
      + field('비용', `<input name="cost" type="number" inputmode="numeric" min="0" placeholder="원" value="${val(it?.cost)}">`)
      + field('메모', `<textarea name="note" rows="3">${val(it?.note)}</textarea>`);
  } else if (c.kind === 'link') {
    title = it ? '바로가기' : '사이트 추가';
    body = field('이름', `<input name="title" required value="${val(it?.title)}">`)
      + field('주소', `<input name="url" type="url" inputmode="url" required placeholder="https://" autocapitalize="off" spellcheck="false" value="${val(it?.url)}">`)
      + (pickArea ? areaField() : '')
      + field('메모', `<input name="note" value="${val(it?.note)}">`);
  } else if (c.kind === 'goal') {
    title = it ? '목표' : '목표 추가';
    body = field('이름', `<input name="title" required value="${val(it?.title)}">`)
      + field('언제까지', `<input name="by" type="date" value="${val(it?.by)}">`)
      + field('진행률', `<input name="pct" type="number" inputmode="numeric" min="0" max="100" placeholder="%" value="${val(it?.pct)}">`)
      + field('메모', `<textarea name="note" rows="4">${val(it?.note)}</textarea>`);
  } else if (c.kind === 'tip') {
    title = esc(it.title);
    submit = '반영했어요';
    body = `<p class="t-cap weak">${TIP_KIND[it.kind] ?? ''}</p>
      <p class="t-body tip-body">${esc(it.body)}</p>`
      + field('Claude에게 남길 메모', `<textarea name="reply" rows="3">${val(it.reply)}</textarea>`);
  } else if (c.kind === 'done') {
    title = esc(it.title);
    submit = '완료';
    body = field('한 날', `<input name="date" type="date" required max="${now}" value="${now}">`)
      + (it.kmEvery ? field('주행거리', `<input name="km" type="number" inputmode="numeric" min="0" placeholder="km" value="${val(curKm())}">`) : '')
      + field('비용', `<input name="cost" type="number" inputmode="numeric" min="0" placeholder="원">`)
      + field('메모', `<textarea name="note" rows="3"></textarea>`);
  } else {
    const m = AREAS.find(a => a.id === c.area).metric;
    title = m.name;
    body = field(`값`, `<input name="value" type="number" inputmode="decimal" step="any" min="0" required placeholder="${m.unit}" value="${val(latest(m.key)?.value)}">`)
      + field('날짜', `<input name="date" type="date" required max="${now}" value="${now}">`);
  }
  return `<form class="sheet" data-form>
    <div class="sheet-head"><h2 class="t-section">${title}</h2><button type="button" class="icon-btn" data-act="close" aria-label="닫기">${icon('close')}</button></div>
    ${body}
    <button class="btn-primary" type="submit">${submit}</button>
    ${c.kind === 'tip' ? `<button type="button" class="btn-sub wide" data-act="tiplater">메모만 저장</button>
    <button type="button" class="btn-text" data-act="tipskip">필요 없어요</button>`
    : it && c.kind !== 'done' ? `<button type="button" class="btn-text" data-act="delete">삭제</button>` : ''}
  </form>`;
}

function openSheet(ctx) {
  sheetCtx = ctx;
  dlg.innerHTML = sheetHtml(ctx);
  dlg.showModal();
  document.activeElement?.blur(); // 열자마자 닫기 버튼에 테두리가 생기지 않게
  dlg.scrollTop = 0;
}

function submitSheet(fd) {
  const c = sheetCtx;
  const v = k => String(fd.get(k) ?? '').trim();
  const nv = k => (v(k) === '' ? undefined : Number(v(k)));
  const note = v('note') || undefined;
  const area = c.area ?? (v('area') || undefined);
  if (c.kind === 'routine') {
    store.put({
      ...(c.item ?? { id: uid(), type: 'routine', area }),
      title: v('title'), every: { n: Math.max(1, Math.round(nv('n') || 1)), unit: v('unit') },
      kmEvery: nv('kmEvery') || undefined, last: v('last') || undefined, lastKm: nv('lastKm'), note,
    });
  } else if (c.kind === 'event') {
    store.put({ ...(c.item ?? { id: uid(), type: 'event', area }), title: v('title'), date: v('date'), note });
  } else if (c.kind === 'log') {
    store.put({ ...(c.item ?? { id: uid(), type: 'log', area }), title: v('title'), date: v('date'), cost: nv('cost'), note });
  } else if (c.kind === 'link') {
    const url = /^https?:\/\//.test(v('url')) ? v('url') : `https://${v('url')}`;
    store.put({ ...(c.item ?? { id: uid(), type: 'link', area }), title: v('title'), url, note });
  } else if (c.kind === 'goal') {
    store.put({ ...(c.item ?? { id: uid(), type: 'goal', area }), title: v('title'), by: v('by') || undefined, pct: nv('pct'), note });
  } else if (c.kind === 'tip') {
    saveTip('done', fd);
    toast('반영한 것으로 남겼어요');
  } else if (c.kind === 'done') {
    const r = c.item, date = v('date'), km = nv('km');
    if (km != null && km > (curKm() ?? -1)) store.put({ id: uid(), type: 'reading', key: 'odometer', date, value: km });
    store.put({ ...r, last: date, ...(km != null ? { lastKm: km } : {}) });
    store.put({ id: uid(), type: 'log', area: r.area, date, title: r.title, cost: nv('cost'), note });
    toast('기록에 남겼어요');
  } else {
    const m = AREAS.find(a => a.id === c.area).metric;
    store.put({ id: uid(), type: 'reading', key: m.key, date: v('date'), value: nv('value') });
  }
  dlg.close();
}

// ── 동작 ─────────────────────────────────────────────────
let toastTimer;
function toast(text) {
  toastEl.textContent = text;
  toastEl.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('on'), 2200);
}

function done(it) {
  if (it.type === 'event') {
    store.put({ ...it, done: true });
    store.put({ id: uid(), type: 'log', area: it.area, date: L.today(), title: it.title, note: it.note });
    return toast('기록에 남겼어요');
  }
  // 습관처럼 짧은 주기는 한 번 눌러 끝낸다. 긴 주기는 비용과 메모를 받는다.
  if (L.spanDays(it.every) < 14) { store.put({ ...it, last: L.today() }); return toast(`${it.title} 완료`); }
  openSheet({ kind: 'done', item: it });
}

// status 가 비어 있으면 아직 홈에 떠 있는 제안이다
function saveTip(status, fd = new FormData(dlg.querySelector('form'))) {
  const reply = String(fd.get('reply') ?? '').trim() || undefined;
  store.put({ ...sheetCtx.item, reply, ...(status ? { status, closed: L.today() } : {}) });
}

const ACT = {
  tiplater: () => { saveTip(null); dlg.close(); toast('메모를 남겼어요'); },
  tipskip: () => { saveTip('skip'); dlg.close(); toast('넘겼어요'); },
  done: el => {
    const it = store.get(el.dataset.id);
    if (!it) return;
    el.classList.add('on');
    navigator.vibrate?.(10);
    const instant = it.type === 'event' || L.spanDays(it.every) < 14;
    if (instant) setTimeout(() => el.closest('.row')?.classList.add('leaving'), 180);
    setTimeout(() => done(it), mm('(prefers-reduced-motion: reduce)') ? 0 : instant ? 460 : 240);
  },
  edit: el => { const it = store.get(el.dataset.id); if (it) openSheet({ kind: it.type, item: it }); },
  add: el => openSheet({ kind: el.dataset.kind, area: el.dataset.area, date: el.dataset.date }),
  day: el => { ui.day = el.dataset.date === L.today() ? null : el.dataset.date; render(); },
  reading: el => openSheet({ kind: 'reading', area: el.dataset.area }),
  close: () => dlg.close(),
  delete: () => { store.remove(sheetCtx.item.id); dlg.close(); toast('지웠어요'); },
  morelogs: () => { ui.allLogs = true; render(); },
  moredue: () => { ui.allDue = true; render(); },
  sync: () => store.sync(),
  disconnect: () => store.disconnect(),
  copylink: async () => {
    try { await navigator.clipboard.writeText(store.setupLink()); toast('링크를 복사했어요. 나에게만 보내세요'); }
    catch { toast('복사하지 못했어요'); }
  },
  export: () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([store.exportText()], { type: 'application/json' }));
    a.download = `나관리-${L.today()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  },
  install: async () => { await installEvt.prompt(); installEvt = null; render(); },
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (el) ACT[el.dataset.act]?.(el);
  else if (e.target === dlg) dlg.close(); // 시트 바깥을 누르면 닫는다
});

document.addEventListener('submit', e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  if (e.target.matches('[data-form]')) submitSheet(fd);
  else if (e.target.matches('[data-connect]')) connectForm(String(fd.get('token')).trim(), String(fd.get('repo')).trim());
});

document.addEventListener('change', async e => {
  if (!e.target.matches('[data-import]') || !e.target.files[0]) return;
  try { store.importText(await e.target.files[0].text()); toast('가져왔어요'); }
  catch (err) { toast(err.message || '가져오지 못했어요'); }
});

// ── 시작 ─────────────────────────────────────────────────
function route() {
  const h = location.hash;
  if (h.startsWith('#/a/')) return { name: 'area', id: h.slice(4), tab: 'all' };
  const name = { '#/plan': 'plan', '#/log': 'log', '#/all': 'all', '#/settings': 'settings', '#/tips': 'tips', '#/links': 'links' }[h] ?? 'home';
  return { name, tab: ['settings', 'tips', 'links'].includes(name) ? 'all' : name };
}

const VIEWS = { home: homeView, plan: planView, log: logView, all: allView, settings: settingsView, tips: tipsView, links: linksView };

let lastRoute = route();
const depth = r => (['area', 'settings', 'tips', 'links'].includes(r.name) ? 1 : 0);

function render(animate = false) {
  const r = route();
  const area = AREAS.find(a => a.id === r.id);
  app.innerHTML = (area ? areaView(area) : VIEWS[r.name]()) + navView(r.tab);
  if (animate && !mm('(prefers-reduced-motion: reduce)')) {
    const dir = depth(r) > depth(lastRoute) ? 'push' : depth(r) < depth(lastRoute) ? 'pop' : 'fade';
    app.classList.remove('push', 'pop', 'fade');
    void app.offsetWidth;
    app.classList.add(dir);
  }
  lastRoute = r;
  onScroll();
}

// 스크롤하면 위 막대에 배경과 선이 생긴다
function onScroll() { document.body.classList.toggle('scrolled', scrollY > 8); }
addEventListener('scroll', onScroll, { passive: true });
app.addEventListener('animationend', () => app.classList.remove('push', 'pop', 'fade'));

// 다른 기기에서 복사해 온 연결 링크. 주소에 토큰이 남지 않게 바로 지운다.
// 앱이 이미 열린 탭에 붙여 넣으면 새로 읽지 않고 hashchange 만 일어나서 거기서도 받는다.
function takeSetup() {
  if (!location.hash.startsWith('#setup=')) return false;
  try { const c = JSON.parse(atob(location.hash.slice(7))); store.connect(c.repo, c.token); } catch { /* 깨진 링크 */ }
  history.replaceState(null, '', location.pathname + '#/');
  return true;
}

// 아이폰은 홈 화면 앱과 사파리의 저장 공간이 따로라 링크를 열어도 앱에 안 들어간다.
// 그래서 설정의 칸에 연결 링크를 통째로 붙여 넣어도 되게 한다.
function connectForm(text, repo) {
  const i = text.indexOf('#setup=');
  if (i >= 0) {
    try { const c = JSON.parse(atob(text.slice(i + 7))); store.connect(c.repo, c.token); }
    catch { toast('링크가 잘렸어요. 다시 복사해 주세요'); }
    return;
  }
  if (!repo) return toast('저장소를 적어 주세요');
  store.connect(repo, text);
}

store.init();
takeSetup();
store.on(render);
dlg.addEventListener('close', () => render()); // 완료 시트를 그냥 닫으면 파랗게 바뀐 동그라미를 되돌린다
addEventListener('hashchange', () => { takeSetup(); ui.allLogs = false; ui.allDue = false; ui.day = null; scrollTo(0, 0); render(true); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) { store.sync(); render(); } });
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; render(); });
render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
