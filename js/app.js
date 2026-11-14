import { AREAS } from './templates.js';
import * as L from './logic.js';
import { store } from './store.js';

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
  check: '<path d="m6 12.5 4 4 8-9"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.5 2.5M15.2 15.2l2.5 2.5M6.3 17.7l2.5-2.5M15.2 8.8l2.5-2.5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
};
const icon = (name, size = 24, sw = 2) =>
  `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name]}</svg>`;

// 영역마다 색 하나(styles.css 의 .c-영역). 아이콘 원의 바탕과 아이콘에만 쓴다.
// CSP 가 인라인 style 을 막아서 색은 클래스로 준다.
const iconCircle = (name, colorKey = name) => `<span class="icon-circle c-${colorKey}">${icon(name, 22)}</span>`;

const ui = { allLogs: false };
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

// ── 화면 조각 ────────────────────────────────────────────
function itemRow(it, { sub, right, level, check = true, lead = '' }) {
  const cls = { over: 'alert', today: 'today', soon: 'soon' }[level] ?? 'weak';
  return `<li class="row">
    ${check ? `<button class="check" data-act="done" data-id="${it.id}" aria-label="${esc(it.title)} 완료"><span>${icon('check', 16, 3)}</span></button>` : ''}
    <button class="row-main" data-act="edit" data-id="${it.id}">
      ${lead}
      <span class="row-text"><span class="t-item">${esc(it.title)}</span>${sub ? `<span class="t-cap weak">${esc(sub)}</span>` : ''}</span>
      ${right ? `<span class="row-right t-cap ${cls}">${esc(right)}</span>` : ''}
    </button>
  </li>`;
}

const secHead = (title, kind, area) => `<div class="sec-head">
  <h2 class="t-section">${title}</h2>
  <button class="link" data-act="add" data-kind="${kind}" data-area="${area}">추가</button>
</div>`;

const empty = text => `<p class="t-body weak empty">${text}</p>`;

function syncLine() {
  const s = store.syncState();
  const text = { syncing: '동기화하는 중', offline: '오프라인이에요. 다음에 열 때 올려요', error: `동기화 실패. ${s.msg}` }[s.status];
  return text ? `<p class="t-cap weak foot">${esc(text)}</p>` : '';
}

// ── 홈 ───────────────────────────────────────────────────
// Claude 가 점검 때 data.json 에 넣는 제안. 읽고 반영하거나 넘기면 홈에서 사라진다.
const TIP_KIND = { fact: '새로 알게 된 것', auto: '자동으로 할 수 있는 것', better: '더 잘할 수 있는 것' };
const openTips = () => store.list('tip').filter(t => !t.status).sort((a, b) => (a.date < b.date ? 1 : -1));

function tipSection() {
  const tips = openTips();
  if (!tips.length) return '';
  return `<section class="sec">
    <h2 class="t-section">Claude 제안 <span class="count">${tips.length}</span></h2>
    <ul class="rows">${tips.map(t => itemRow(t, { sub: TIP_KIND[t.kind] ?? '', right: t.reply ? '메모 있음' : '', check: false, lead: iconCircle('spark', 'tip') })).join('')}</ul>
  </section>`;
}

// 홈의 할 일 행: 왼쪽은 영역 색 아이콘, 오른쪽은 완료 동그라미.
// 오늘 할 것이면 영역 이름을, 지났거나 곧이면 그 상태를 색으로 보여 준다.
function progress(left) {
  const done = doneToday(), total = done + left;
  if (!total) return '';
  const pct = Math.round((done / total) * 100);
  return `<div class="progress" role="img" aria-label="오늘 ${total}개 중 ${done}개 완료">
    <div class="bar"><i class="w${Math.round(pct / 5) * 5}"></i></div>
    <p class="t-cap weak">${done ? `${total}개 중 <b>${done}개</b> 했어요` : '하나씩 눌러서 끝내 보세요'}</p>
  </div>`;
}

function dueRow(d) {
  const it = d.it;
  const sub = d.level === 'today'
    ? `<span class="t-cap weak">${esc(areaName(it.area))}</span>`
    : `<span class="t-cap ${d.level === 'over' ? 'alert' : 'soon'}">${esc(d.text)}</span>`;
  return `<li class="row">
    <button class="row-main" data-act="edit" data-id="${it.id}">
      ${iconCircle(it.area)}
      <span class="row-text"><span class="t-item">${esc(it.title)}</span>${sub}</span>
    </button>
    <button class="check end" data-act="done" data-id="${it.id}" aria-label="${esc(it.title)} 완료"><span>${icon('check', 16, 3)}</span></button>
  </li>`;
}

// 오늘 끝낸 것: 오늘 날짜 기록 + 오늘 체크한 짧은 주기 항목(짧은 건 기록을 안 남긴다)
function doneToday() {
  const now = L.today();
  return store.list('log').filter(l => l.date === now).length
    + store.list('routine').filter(r => r.last === now && L.spanDays(r.every) < 14).length;
}

function homeView() {
  const due = dueList(), up = upcoming().slice(0, 5);
  return `
  <header class="top"><h1 class="t-title">나 관리</h1><a class="icon-btn" href="#/settings" aria-label="설정">${icon('settings')}</a></header>
  <section class="sec hero">
    <p class="t-cap weak">${L.dateText(L.today())}</p>
    <h2 class="t-hero">${due.length ? `오늘 챙길 것 <em>${due.length}개</em>` : '오늘 챙길 것을 다 했어요'}</h2>
    ${progress(due.length)}
    ${due.length ? `<ul class="rows">${due.map(dueRow).join('')}</ul>` : ''}
  </section>
  ${tipSection()}
  <section class="sec">
    <h2 class="t-section">다가오는 일정</h2>
    ${up.length ? `<ul class="rows">${up.map(e => { const st = L.eventStatus(e, L.today()); return itemRow(e, { sub: L.dateText(e.date), right: st.text, level: st.daysLeft <= 7 ? 'soon' : 'ok', check: false, lead: iconCircle(e.area) }); }).join('')}</ul>` : empty('예정된 일정이 없어요')}
  </section>
  <section class="sec">
    <h2 class="t-section">영역</h2>
    <ul class="rows">${AREAS.map(a => {
      const s = areaSummary(a);
      return `<li class="row"><a class="row-main" href="#/a/${a.id}">
        ${iconCircle(a.id)}
        <span class="row-text"><span class="t-item">${a.name}</span><span class="t-cap ${s.alert ? 'alert' : 'weak'}">${esc(s.text)}</span></span>
        <span class="chev">${icon('chevron', 16)}</span>
      </a></li>`;
    }).join('')}</ul>
  </section>
  ${syncLine()}`;
}

// ── 영역 ─────────────────────────────────────────────────
function metricBlock(a) {
  const m = a.metric, cur = latest(m.key);
  return `<section class="sec metric">
    <div>
      <p class="t-cap weak">${m.name}</p>
      ${cur ? `<p class="t-hero">${num(cur.value)}${m.unit}</p><p class="t-cap weak">${L.dateText(cur.date, false)} 기준</p>` : `<p class="t-body weak">아직 적은 값이 없어요</p>`}
    </div>
    <button class="btn-sub" data-act="reading" data-area="${a.id}">${cur ? '새로 적기' : '적기'}</button>
  </section>`;
}

function goalSection(a) {
  const goals = store.list('goal', a.id).sort((x, y) => ((x.by || '9') < (y.by || '9') ? -1 : 1));
  return `<section class="sec">
    ${secHead('목표', 'goal', a.id)}
    ${goals.length ? `<ul class="rows">${goals.map(g => itemRow(g, { sub: g.by ? `${L.dateText(g.by, false)}까지` : '', right: g.pct != null ? `${g.pct}%` : '', level: 'today', check: false })).join('')}</ul>` : empty('아직 목표가 없어요')}
  </section>`;
}

function areaView(a) {
  const now = L.today(), km = curKm();
  const rs = store.list('routine', a.id).map(r => ({ r, st: L.routineStatus(r, now, km) }))
    .sort((x, y) => RANK[x.st.level] - RANK[y.st.level] || (x.st.daysLeft ?? 0) - (y.st.daysLeft ?? 0) || L.spanDays(x.r.every) - L.spanDays(y.r.every));
  const evs = store.list('event', a.id).filter(e => !e.done).sort((x, y) => (x.date < y.date ? -1 : 1));
  const logs = store.list('log', a.id).sort((x, y) => (x.date < y.date ? 1 : x.date > y.date ? -1 : y.u - x.u));
  const spent = logs.filter(l => l.date.startsWith(now.slice(0, 4))).reduce((s, l) => s + (l.cost || 0), 0);
  const shown = ui.allLogs ? logs : logs.slice(0, 5);
  return `
  <header class="top left"><a class="icon-btn back" href="#/" aria-label="뒤로">${icon('back')}</a><h1 class="t-title">${a.name}</h1></header>
  ${a.metric ? metricBlock(a) : ''}
  ${a.link ? `<section class="sec"><ul class="rows"><li class="row"><a class="row-main" href="${a.link.url}" target="_blank" rel="noopener">
      ${iconCircle(a.id)}
      <span class="row-text"><span class="t-item">${a.link.title}</span></span>
      <span class="chev">${icon('chevron', 16)}</span></a></li></ul></section>` : ''}
  ${a.goals ? goalSection(a) : ''}
  <section class="sec">
    ${secHead('주기 관리', 'routine', a.id)}
    ${rs.length ? `<ul class="rows">${rs.map(({ r, st }) => itemRow(r, { sub: L.everyText(r), right: L.statusText(st, r), level: st.level })).join('')}</ul>` : empty('주기로 챙길 항목을 추가해 보세요')}
  </section>
  <section class="sec">
    ${secHead('일정', 'event', a.id)}
    ${evs.length ? `<ul class="rows">${evs.map(e => { const st = L.eventStatus(e, now); return itemRow(e, { sub: L.dateText(e.date), right: st.text, level: st.level }); }).join('')}</ul>` : empty('예정된 일정이 없어요')}
  </section>
  <section class="sec">
    ${secHead('기록', 'log', a.id)}
    ${spent ? `<p class="t-cap weak spent">올해 쓴 돈 ${num(spent)}원</p>` : ''}
    ${logs.length ? `<ul class="rows">${shown.map(l => itemRow(l, { sub: L.dateText(l.date), right: l.cost ? `${num(l.cost)}원` : '', check: false })).join('')}</ul>` : empty('아직 기록이 없어요')}
    ${logs.length > 5 && !ui.allLogs ? `<button class="btn-sub wide" data-act="morelogs">기록 ${logs.length}개 모두 보기</button>` : ''}
  </section>`;
}

// ── 설정 ─────────────────────────────────────────────────
function settingsView() {
  const s = store.syncState(), c = store.config();
  const at = s.at ? new Date(s.at).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' }) : '';
  const line = { syncing: '동기화하는 중이에요', ok: `${at}에 맞췄어요`, offline: '오프라인이에요. 다음에 열 때 올려요', error: `동기화하지 못했어요. ${s.msg}`, idle: '연결돼 있어요' }[s.status] ?? '';
  return `
  <header class="top left"><a class="icon-btn back" href="#/" aria-label="뒤로">${icon('back')}</a><h1 class="t-title">설정</h1></header>
  <section class="sec">
    <h2 class="t-section">동기화</h2>
    ${c ? `<p class="t-body muted lead">${esc(line)}</p>
      <div class="stack">
        <button class="btn-sub wide" data-act="sync">지금 동기화</button>
        <button class="btn-sub wide" data-act="copylink">다른 기기 연결 링크 복사</button>
        <button class="btn-text" data-act="disconnect">연결 끊기</button>
      </div>`
    : `<form class="stack" data-connect>
        <label class="field"><span class="t-cap muted">저장소</span><input name="repo" placeholder="계정/저장소" required autocapitalize="off" autocomplete="off" spellcheck="false"></label>
        <label class="field"><span class="t-cap muted">토큰</span><input name="token" type="password" required autocomplete="off"></label>
        <button class="btn-primary" type="submit">연결</button>
      </form>`}
  </section>
  <section class="sec">
    <h2 class="t-section">백업</h2>
    <div class="stack">
      <button class="btn-sub wide" data-act="export">파일로 내보내기</button>
      <label class="btn-sub wide">파일에서 가져오기<input type="file" accept="application/json,.json" hidden data-import></label>
    </div>
  </section>
  ${installEvt ? `  <section class="sec">
    <h2 class="t-section">설치</h2>
    <div class="stack"><button class="btn-sub wide" data-act="install">홈 화면에 추가</button></div>
  </section>` : ''}`;
}

// ── 입력 시트 ────────────────────────────────────────────
const field = (label, inner) => `<label class="field"><span class="t-cap muted">${label}</span>${inner}</label>`;
const val = v => (v == null ? '' : esc(v));

function sheetHtml(c) {
  const it = c.item, now = L.today();
  let title, body, submit = '저장';
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
      + field('날짜', `<input name="date" type="date" required value="${val(it?.date ?? now)}">`)
      + field('메모', `<textarea name="note" rows="${it?.note ? Math.min(14, it.note.split('\n').length + 1) : 3}">${val(it?.note)}</textarea>`);
  } else if (c.kind === 'log') {
    title = it ? '기록' : '기록 추가';
    body = field('이름', `<input name="title" required value="${val(it?.title)}">`)
      + field('날짜', `<input name="date" type="date" required max="${now}" value="${val(it?.date ?? now)}">`)
      + field('비용', `<input name="cost" type="number" inputmode="numeric" min="0" placeholder="원" value="${val(it?.cost)}">`)
      + field('메모', `<textarea name="note" rows="3">${val(it?.note)}</textarea>`);
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
  if (c.kind === 'routine') {
    store.put({
      ...(c.item ?? { id: uid(), type: 'routine', area: c.area }),
      title: v('title'), every: { n: Math.max(1, Math.round(nv('n') || 1)), unit: v('unit') },
      kmEvery: nv('kmEvery') || undefined, last: v('last') || undefined, lastKm: nv('lastKm'), note,
    });
  } else if (c.kind === 'event') {
    store.put({ ...(c.item ?? { id: uid(), type: 'event', area: c.area }), title: v('title'), date: v('date'), note });
  } else if (c.kind === 'log') {
    store.put({ ...(c.item ?? { id: uid(), type: 'log', area: c.area }), title: v('title'), date: v('date'), cost: nv('cost'), note });
  } else if (c.kind === 'goal') {
    store.put({ ...(c.item ?? { id: uid(), type: 'goal', area: c.area }), title: v('title'), by: v('by') || undefined, pct: nv('pct'), note });
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
    setTimeout(() => done(it), matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 240);
  },
  edit: el => { const it = store.get(el.dataset.id); if (it) openSheet({ kind: it.type, item: it }); },
  add: el => openSheet({ kind: el.dataset.kind, area: el.dataset.area }),
  reading: el => openSheet({ kind: 'reading', area: el.dataset.area }),
  close: () => dlg.close(),
  delete: () => { store.remove(sheetCtx.item.id); dlg.close(); toast('지웠어요'); },
  morelogs: () => { ui.allLogs = true; render(); },
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
  else if (e.target.matches('[data-connect]')) store.connect(String(fd.get('repo')), String(fd.get('token')));
});

document.addEventListener('change', async e => {
  if (!e.target.matches('[data-import]') || !e.target.files[0]) return;
  try { store.importText(await e.target.files[0].text()); toast('가져왔어요'); }
  catch (err) { toast(err.message || '가져오지 못했어요'); }
});

// ── 시작 ─────────────────────────────────────────────────
function route() {
  const h = location.hash;
  if (h.startsWith('#/a/')) return { name: 'area', id: h.slice(4) };
  return { name: h === '#/settings' ? 'settings' : 'home' };
}

function render() {
  const r = route();
  const area = AREAS.find(a => a.id === r.id);
  app.innerHTML = (area ? areaView(area) : r.name === 'settings' ? settingsView() : homeView());
}

// 다른 기기에서 복사해 온 연결 링크. 주소에 토큰이 남지 않게 바로 지운다.
// 앱이 이미 열린 탭에 붙여 넣으면 새로 읽지 않고 hashchange 만 일어나서 거기서도 받는다.
function takeSetup() {
  if (!location.hash.startsWith('#setup=')) return false;
  try { const c = JSON.parse(atob(location.hash.slice(7))); store.connect(c.repo, c.token); } catch { /* 깨진 링크 */ }
  history.replaceState(null, '', location.pathname + '#/');
  return true;
}

store.init();
takeSetup();
store.on(render);
dlg.addEventListener('close', render); // 완료 시트를 그냥 닫으면 파랗게 바뀐 동그라미를 되돌린다
addEventListener('hashchange', () => { takeSetup(); ui.allLogs = false; render(); scrollTo(0, 0); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) { store.sync(); render(); } });
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; render(); });
render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
