// 기기 안 저장(localStorage)과 비공개 저장소 동기화(GitHub Contents API).
// 모든 항목은 { id, type, u(고친 시각), del? } 를 갖는다. 지운 항목은 del 표시만 하고 남긴다.
import { mergeItems, serialize } from './logic.js?v=20261123b';
import { starterItems } from './templates.js?v=20261123b';

const KEY = 'me.data.v1';
const CFG = 'me.sync.v1';
const FILE = 'data.json';

let items = [];
let cfg = null;
let state = { status: 'off', at: null, msg: '' };
let busy = false, again = false, timer = null;
const listeners = new Set();
const emit = () => listeners.forEach(f => f());
const read = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* 저장 공간을 못 쓰는 브라우저 */ } };
const persist = () => write(KEY, { v: 1, items });
const setState = (status, msg = '') => { state = { status, msg, at: status === 'ok' ? Date.now() : state.at }; emit(); };

const b64encode = text => {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};
const b64decode = b64 => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, '')), c => c.charCodeAt(0)));

async function api(method, body) {
  const res = await fetch(`https://api.github.com/repos/${cfg.repo}/contents/${FILE}`, {
    method,
    cache: 'no-store',
    headers: { Authorization: `Bearer ${cfg.token}`, Accept: 'application/vnd.github+json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 || res.status === 403) throw new Error('토큰을 확인해 주세요');
  return res;
}

async function pull() {
  const res = await api('GET');
  if (res.status === 404) return { items: [], sha: null, text: '' };
  if (!res.ok) throw new Error(`저장소 응답 ${res.status}`);
  const j = await res.json();
  const text = b64decode(j.content);
  return { items: JSON.parse(text).items || [], sha: j.sha, text };
}

async function push(text, sha) {
  const res = await api('PUT', { message: '앱에서 저장', content: b64encode(text), ...(sha ? { sha } : {}) });
  if (res.status === 409 || res.status === 422) return false; // 그사이 다른 기기가 먼저 올림
  if (!res.ok) throw new Error(`저장소 응답 ${res.status}`);
  return true;
}

export const store = {
  init() {
    items = read(KEY)?.items;
    if (!Array.isArray(items)) items = [];
    // 기본 항목 가운데 아직 없는 것만 채운다. 지운 항목은 del 표시가 남아 있어 다시 생기지 않는다.
    const have = new Set(items.map(it => it.id));
    const missing = starterItems().filter(it => !have.has(it.id));
    if (missing.length) { items.push(...missing); persist(); }
    cfg = read(CFG);
    if (cfg) { state.status = 'idle'; this.sync(); }
  },
  on(f) { listeners.add(f); },
  list(type, area) { return items.filter(it => !it.del && it.type === type && (!area || it.area === area)); },
  get(id) { return items.find(it => it.id === id && !it.del); },
  put(item) {
    const next = { ...item, u: Date.now() };
    const i = items.findIndex(it => it.id === next.id);
    if (i < 0) items.push(next); else items[i] = next;
    this.changed();
  },
  remove(id) {
    const i = items.findIndex(it => it.id === id);
    if (i < 0) return;
    items[i] = { id, type: items[i].type, del: true, u: Date.now() };
    this.changed();
  },
  changed() {
    persist();
    emit();
    if (cfg) { clearTimeout(timer); timer = setTimeout(() => this.sync(), 2000); }
  },

  config() { return cfg; },
  syncState() { return state; },
  connect(repo, token) { cfg = { repo: repo.trim(), token: token.trim() }; write(CFG, cfg); return this.sync(); },
  disconnect() { cfg = null; try { localStorage.removeItem(CFG); } catch { /* 무시 */ } setState('off'); },
  setupLink() { return `${location.origin}${location.pathname}#setup=${btoa(JSON.stringify(cfg))}`; },

  async sync() {
    if (!cfg) return;
    if (busy) { again = true; return; }
    busy = true;
    setState('syncing');
    try {
      for (let i = 0; i < 3; i++) {
        const remote = await pull();
        items = mergeItems(items, remote.items);
        persist();
        const text = serialize(items);
        if (text === remote.text || await push(text, remote.sha)) break;
      }
      setState('ok');
    } catch (e) {
      setState(e instanceof TypeError ? 'offline' : 'error', e.message);
    }
    busy = false;
    if (again) { again = false; this.sync(); }
  },

  exportText() { return serialize(items); },
  importText(text) {
    const incoming = JSON.parse(text).items;
    if (!Array.isArray(incoming)) throw new Error('형식이 다른 파일이에요');
    items = mergeItems(items, incoming);
    this.changed();
  },
};
