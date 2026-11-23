import test from 'node:test';
import assert from 'node:assert/strict';
import { addInterval, routineStatus, statusText, eventStatus, everyText, mergeItems, serialize } from '../js/logic.js';

test('주기 더하기: 말일과 해 넘김', () => {
  assert.equal(addInterval('2026-01-31', { n: 1, unit: 'month' }), '2026-02-28');
  assert.equal(addInterval('2026-11-14', { n: 2, unit: 'week' }), '2026-11-28');
  assert.equal(addInterval('2026-11-14', { n: 3, unit: 'month' }), '2027-02-14');
  assert.equal(addInterval('2024-02-29', { n: 1, unit: 'year' }), '2025-02-28');
});

const oil = { every: { n: 1, unit: 'year' }, kmEvery: 7000 };

test('긴 주기: 기록 없음, 여유, 곧, 지남', () => {
  assert.equal(routineStatus(oil, '2026-11-14', 99000).level, 'unknown');
  const r = { ...oil, last: '2026-06-01', lastKm: 95000 };
  assert.equal(routineStatus(r, '2026-11-14', 99000).level, 'ok');
  assert.equal(routineStatus(r, '2027-05-25', 99000).level, 'soon');
  assert.equal(routineStatus(r, '2027-06-02', 99000).level, 'over');
});

test('주행거리 기준이 먼저 오면 그쪽을 보여 준다', () => {
  const r = { ...oil, last: '2026-06-01', lastKm: 95000 };
  const soon = routineStatus(r, '2026-11-14', 101500);
  assert.equal(soon.level, 'soon');
  assert.equal(statusText(soon, r), '500km 남음');
  const over = routineStatus(r, '2026-11-14', 102300);
  assert.equal(over.level, 'over');
  assert.equal(statusText(over, r), '300km 지남');
  assert.equal(statusText(routineStatus(r, '2026-11-14', 95500), r), '7개월 남음');
});

test('짧은 주기는 습관: 밀려도 오늘, 기록이 없으면 띄우지 않음', () => {
  const daily = { every: { n: 1, unit: 'day' } };
  assert.equal(routineStatus(daily, '2026-11-14', null).level, 'unknown');
  assert.equal(routineStatus({ ...daily, last: '2026-11-10' }, '2026-11-14', null).level, 'today');
  assert.equal(routineStatus({ ...daily, last: '2026-11-14' }, '2026-11-14', null).level, 'ok');
});

test('일정과 주기 문구', () => {
  assert.equal(eventStatus({ date: '2026-12-08' }, '2026-11-14').text, 'D-24');
  assert.equal(eventStatus({ date: '2026-11-10' }, '2026-11-14').level, 'over');
  assert.equal(everyText(oil), '1년 또는 7,000km마다');
  assert.equal(everyText({ every: { n: 1, unit: 'day' } }), '매일');
  assert.equal(everyText({ every: { n: 2, unit: 'week' } }), '2주마다');
});

test('병합: 나중에 고친 쪽이 남고, 지운 표시도 따라온다', () => {
  const local = [{ id: 'a', u: 5, title: '폰' }, { id: 'b', u: 1 }, { id: 'c', u: 0 }];
  const remote = [{ id: 'a', u: 3, title: 'PC' }, { id: 'b', u: 2, del: true }, { id: 'd', u: 1 }];
  const m = Object.fromEntries(mergeItems(local, remote).map(it => [it.id, it]));
  assert.equal(m.a.title, '폰');
  assert.equal(m.b.del, true);
  assert.ok(m.c && m.d);
  assert.equal(serialize(mergeItems(local, remote)), serialize(mergeItems(remote, mergeItems(local, remote))));
});
