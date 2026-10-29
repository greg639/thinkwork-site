/* Core: helpers, store, morph, router, modal, toast, shell */
(function () {
  const HB = (window.HB = window.HB || {});
  HB.views = {}; HB.acts = {}; HB.subs = []; HB.ui = {}; HB.S = null;

  /* ---------- tiny helpers ---------- */
  HB.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  HB.$ = (s, r) => (r || document).querySelector(s);
  HB.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  HB.act = (name, fn) => { HB.acts[name] = fn; };
  HB.view = (key, def) => { HB.views[key] = def; };
  HB.uid = (p) => (p || 'id') + '-' + Math.random().toString(36).slice(2, 8);
  HB.plural = (n, a, b) => n + ' ' + (n === 1 ? a : b || a + 's');

  /* ---------- dates (demo today = Thu 29 Oct 2026) ---------- */
  HB.TODAY = '2026-10-29';
  HB.parse = (iso) => { const p = iso.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); };
  HB.iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  HB.addDays = (iso, n) => { const d = HB.parse(iso); d.setDate(d.getDate() + n); return HB.iso(d); };
  HB.d = (n) => HB.addDays(HB.TODAY, n);
  HB.diff = (a, b) => Math.round((HB.parse(a) - HB.parse(b)) / 864e5);
  HB.dow = (iso) => (HB.parse(iso).getDay() + 6) % 7; // Mon = 0
  HB.monday = (iso) => HB.addDays(iso, -HB.dow(iso));
  HB.fmt = (iso, kind) => {
    const d = HB.parse(iso);
    const o = { short: { day: 'numeric', month: 'short' }, day: { weekday: 'short', day: 'numeric', month: 'short' }, long: { weekday: 'long', day: 'numeric', month: 'long' }, full: { day: 'numeric', month: 'short', year: 'numeric' }, month: { month: 'long', year: 'numeric' }, wd: { weekday: 'short' }, mon: { month: 'short' } }[kind || 'short'];
    return d.toLocaleDateString('en-GB', o);
  };
  HB.rel = (iso) => { const n = HB.diff(iso, HB.TODAY); return n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : n === -1 ? 'Yesterday' : n > 0 ? 'in ' + n + ' days' : -n + ' days ago'; };
  const boot = Date.now();
  HB.now = () => new Date(new Date(2026, 9, 29, 14, 20, 0).getTime() + (Date.now() - boot));
  HB.clock = (d) => { d = d || HB.now(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  HB.hm = (h) => { const hh = Math.floor(h), mm = Math.round((h - hh) * 60); return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0'); };
  HB.dur = (h) => { const H = Math.floor(h), M = Math.round((h - H) * 60); return (H ? H + 'h' : '') + (M ? (H ? ' ' : '') + M + 'm' : '') || '0m'; };
  HB.hnum = (t) => { const p = String(t).split(':').map(Number); return p[0] + (p[1] || 0) / 60; };
  HB.money = (n) => { n = Number(n) || 0; const a = Math.abs(n); return (n < 0 ? '-' : '') + '£' + a.toLocaleString('en-GB', { minimumFractionDigits: Math.abs(a % 1) > .001 ? 2 : 0, maximumFractionDigits: 2 }); };
  HB.ago = (mins) => mins < 1 ? 'just now' : mins < 60 ? mins + ' min ago' : mins < 1440 ? Math.round(mins / 60) + ' h ago' : Math.round(mins / 1440) + ' d ago';
  HB.initials = (n) => String(n).replace(/&/g, ' ').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  /* ---------- store ---------- */
  let pending = 0;
  HB.emit = () => {
    if (pending) return;
    pending = requestAnimationFrame(() => { pending = 0; HB.subs.forEach((f) => { try { f(); } catch (e) { console.error(e); } }); });
  };
  HB.update = (fn) => { fn(HB.S); HB.emit(); };

  /* ---------- DOM morph: patch in place so transitions and focus survive ---------- */
  function syncAttrs(x, y) {
    for (const a of Array.from(y.attributes)) if (x.getAttribute(a.name) !== a.value) x.setAttribute(a.name, a.value);
    for (const a of Array.from(x.attributes)) if (!y.hasAttribute(a.name)) x.removeAttribute(a.name);
  }
  function patchNode(x, y, parent) {
    if (x.nodeType !== y.nodeType || (x.nodeType === 1 && x.tagName !== y.tagName)) { parent.replaceChild(y.cloneNode(true), x); return; }
    if (x.nodeType !== 1) { if (x.nodeValue !== y.nodeValue) x.nodeValue = y.nodeValue; return; }
    const tag = x.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
      const keep = x.type === 'file' || x.type === 'range';
      const v = x.value, ck = x.checked;
      syncAttrs(x, y);
      if (x.type === 'checkbox' || x.type === 'radio') x.checked = y.hasAttribute('checked');
      else if (y.hasAttribute('data-sync')) { x.value = tag === 'SELECT' ? ((Array.from(y.options).find((o) => o.selected) || {}).value || '') : y.getAttribute('value') || y.value; }
      else if (!keep) { if (x.value !== v) x.value = v; }
      if (tag === 'SELECT') { patchChildren(x, y); if (!y.hasAttribute('data-sync')) x.value = v; }
      return;
    }
    syncAttrs(x, y);
    if (x.hasAttribute('data-static')) return;
    patchChildren(x, y);
  }
  function patchChildren(a, b) {
    const bn = Array.from(b.childNodes);
    for (let i = 0; i < bn.length; i++) {
      const x = a.childNodes[i];
      if (!x) a.appendChild(bn[i].cloneNode(true)); else patchNode(x, bn[i], a);
    }
    while (a.childNodes.length > bn.length) a.removeChild(a.lastChild);
  }
  HB.morph = (root, html) => { const t = document.createElement('template'); t.innerHTML = html; patchChildren(root, t.content); };

  /* ---------- toast & modal ---------- */
  HB.toast = (msg, o) => {
    o = o || {};
    const box = HB.$('#toasts'); const el = document.createElement('div');
    el.className = 'toast'; el.setAttribute('role', 'status');
    el.innerHTML = '<span class="ti">' + HB.icon(o.icon || 'check', 15) + '</span><span>' + HB.esc(msg) + '</span>';
    box.appendChild(el);
    while (box.children.length > 3) box.removeChild(box.firstChild);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, o.ms || 3200);
  };
  HB.formData = (root) => {
    const out = {};
    HB.$$('[name]', root).forEach((e) => {
      if (e.type === 'radio') { if (e.checked) out[e.name] = e.value; }
      else if (e.type === 'checkbox') out[e.name] = e.checked;
      else out[e.name] = e.value;
    });
    return out;
  };
  HB.modal = (o) => {
    const prev = document.activeElement; const root = HB.$('#modal-root');
    const wrap = document.createElement('div'); wrap.className = 'scrim';
    const id = HB.uid('dlg');
    wrap.innerHTML = '<div class="dialog' + (o.wide ? ' wide' : '') + '" role="dialog" aria-modal="true" aria-labelledby="' + id + '"><header><div style="flex:1"><h2 id="' + id + '">' + HB.esc(o.title) + '</h2>' + (o.sub ? '<p>' + o.sub + '</p>' : '') + '</div><button class="btn btn-ghost btn-icon btn-sm" data-close aria-label="Close">' + HB.icon('x', 18) + '</button></header><div class="dbody">' + (o.body || '') + '</div>' + (o.hideFooter ? '' : '<footer>' + (o.cancel === false ? '' : '<button class="btn btn-ghost" data-close>' + HB.esc(o.cancel || 'Cancel') + '</button>') + '<button class="btn ' + (o.danger ? 'btn-danger' : 'btn-primary') + '" data-ok>' + HB.esc(o.confirm || 'Save') + '</button></footer>') + '</div>';
    root.appendChild(wrap);
    const dlg = wrap.firstChild;
    const close = () => { wrap.remove(); document.removeEventListener('keydown', key, true); if (prev && prev.focus && document.contains(prev)) prev.focus({ preventScroll: true }); if (o.onClose) o.onClose(); };
    const key = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
      if (e.key === 'Tab') {
        const f = HB.$$('button:not([disabled]),input,select,textarea,a[href],[tabindex="0"]', dlg).filter((x) => x.offsetParent !== null);
        if (!f.length) return; const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', key, true);
    wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) close(); });
    wrap.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) close();
      else if (e.target.closest('[data-ok]')) { const r = o.onConfirm ? o.onConfirm(dlg, close) : true; if (r !== false) close(); }
    });
    if (o.onMount) o.onMount(dlg, close);
    const first = HB.$('input:not([type=hidden]),select,textarea', dlg) || HB.$('[data-ok]', dlg) || HB.$('[data-close]', dlg);
    if (first) first.focus({ preventScroll: true });
    return { el: dlg, close };
  };
  HB.confirm = (title, text, label, fn, danger) => HB.modal({ title, body: '<p class="muted">' + text + '</p>', confirm: label || 'Confirm', danger, onConfirm: () => { fn(); } });

  /* ---------- files ---------- */
  HB.download = (name, mime, text) => {
    const url = URL.createObjectURL(new Blob([text], { type: mime }));
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 500);
  };
  HB.images = (files) => Array.from(files || []).filter((f) => /^image\//.test(f.type)).map((f) => ({ name: f.name, src: URL.createObjectURL(f) }));

  /* ---------- small component builders ---------- */
  HB.chip = (t, k, icon) => '<span class="chip chip-' + (k || 'muted') + '">' + (icon ? HB.icon(icon, 13) : '') + HB.esc(t) + '</span>';
  HB.ring = (pct, size, done) => {
    size = size || 64; const r = 41, c = 2 * Math.PI * r; pct = Math.max(0, Math.min(100, pct));
    return '<span class="ring' + (done || pct >= 100 ? ' done' : '') + '" style="--s:' + size + 'px;width:' + size + 'px;height:' + size + 'px"><svg width="' + size + '" height="' + size + '" viewBox="0 0 100 100" aria-hidden="true"><circle class="bg" cx="50" cy="50" r="' + r + '"/><circle class="fg" cx="50" cy="50" r="' + r + '" stroke-dasharray="' + c.toFixed(1) + '" style="stroke-dashoffset:' + (c * (1 - pct / 100)).toFixed(1) + 'px"/></svg><b>' + Math.round(pct) + '</b></span>';
  };
  HB.empty = (icon, title, text, btn) => '<div class="empty"><div class="ico">' + HB.icon(icon, 28) + '</div><h3>' + HB.esc(title) + '</h3><p>' + HB.esc(text) + '</p>' + (btn || '') + '</div>';
  HB.statusKind = { 'Guest-ready': 'ok', 'In progress': 'info', 'Checked out': 'muted', 'Issue': 'bad', 'Scheduled': 'muted' };
  HB.statusChip = (s) => HB.chip(s, HB.statusKind[s] || 'muted');
  HB.photo = (p) => '../assets/img/' + p;
  HB.spark = (vals, w, h, col) => {
    w = w || 120; h = h || 34; const mn = Math.min.apply(null, vals) - 2, mx = Math.max.apply(null, vals) + 2;
    const pts = vals.map((v, i) => [(i / (vals.length - 1)) * (w - 6) + 3, h - 3 - ((v - mn) / (mx - mn)) * (h - 6)]);
    return '<svg class="spark" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true"><polyline fill="none" stroke="' + (col || 'var(--accent)') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="' + pts.map((p) => p.join(',')).join(' ') + '"/><circle cx="' + pts[pts.length - 1][0] + '" cy="' + pts[pts.length - 1][1] + '" r="3" fill="' + (col || 'var(--accent)') + '"/></svg>';
  };
  HB.pageHead = (eyebrow, title, lede, actions) => '<div class="page-head"><div><div class="eyebrow">' + eyebrow + '</div><h1>' + title + '</h1>' + (lede ? '<p class="lede">' + lede + '</p>' : '') + '</div>' + (actions ? '<div class="head-actions">' + actions + '</div>' : '') + '</div>';

  /* ---------- routing ---------- */
  const ROUTES = [
    ['/op/today', 'op.today'], ['/op/calendar', 'op.calendar'], ['/op/properties', 'op.properties'], ['/op/properties/:id/:tab?', 'op.property'],
    ['/op/quotes', 'op.quotes'], ['/op/quotes/:id', 'op.quote'], ['/op/compliance', 'op.compliance'], ['/op/keys', 'op.keys'],
    ['/op/billing', 'op.billing'], ['/op/inbox/:tab?', 'op.inbox'], ['/op/reports', 'op.reports'], ['/op/reports/:id', 'op.report'], ['/op/settings', 'op.settings'],
    ['/ow/overview', 'ow.overview'], ['/ow/properties', 'ow.properties'], ['/ow/properties/:id/:tab?', 'ow.property'], ['/ow/request', 'ow.request'],
    ['/ow/quotes', 'ow.quotes'], ['/ow/compliance', 'ow.compliance'], ['/ow/billing', 'ow.billing'], ['/ow/messages', 'ow.messages'],
    ['/ow/reports', 'ow.reports'], ['/ow/reports/:id', 'ow.report'], ['/runner', 'runner']
  ].map(([p, k]) => {
    const names = []; const re = p.replace(/\/:(\w+)(\?)?/g, (_, n, o) => { names.push(n); return o ? '(?:/([^/]+))?' : '/([^/]+)'; });
    return { re: new RegExp('^' + re + '/?$'), names, key: k, path: p };
  });
  HB.match = () => {
    const h = (location.hash || '').replace(/^#/, '') || '/op/today';
    for (const r of ROUTES) { const m = r.re.exec(h); if (m) { const params = {}; r.names.forEach((n, i) => { params[n] = m[i + 1]; }); return { key: r.key, params, path: h }; } }
    return { key: 'op.today', params: {}, path: '/op/today', miss: true };
  };
  HB.role = () => (HB.match().path.indexOf('/ow') === 0 ? 'ow' : 'op');
  HB.go = (p) => { location.hash = '#' + p; };
  HB.NAV = {
    op: [
      { l: 'Today', i: 'sunrise', p: '/op/today' }, { l: 'Calendar', i: 'calendar', p: '/op/calendar' }, { l: 'Properties', i: 'home', p: '/op/properties' },
      { l: 'Quotes & requests', i: 'quote', p: '/op/quotes', b: () => HB.S.requests.filter((r) => r.status === 'New').length },
      { l: 'Compliance', i: 'shield', p: '/op/compliance', b: () => HB.complianceItems().filter((c) => c.rag === 'r').length, q: true },
      { l: 'Keys', i: 'key', p: '/op/keys', b: () => (HB.S.lockout.status === 'incoming' ? 1 : 0) },
      { l: 'Retainers & billing', i: 'card', p: '/op/billing' },
      { l: 'Inbox', i: 'inbox', p: '/op/inbox', b: () => HB.S.threads.filter((t) => t.unreadOp).length },
      { l: 'Reports', i: 'report', p: '/op/reports' }, { l: 'Settings', i: 'sliders', p: '/op/settings' }
    ],
    ow: [
      { l: 'Overview', i: 'sunrise', p: '/ow/overview' }, { l: 'My properties', i: 'home', p: '/ow/properties' }, { l: 'Request something', i: 'camera', p: '/ow/request' },
      { l: 'Quotes', i: 'quote', p: '/ow/quotes', b: () => HB.S.requests.filter((r) => r.ownerId === HB.S.ownerId && r.status === 'Quoted').length },
      { l: 'Compliance vault', i: 'shield', p: '/ow/compliance' }, { l: 'Retainer & billing', i: 'card', p: '/ow/billing' },
      { l: 'Messages', i: 'inbox', p: '/ow/messages', b: () => HB.S.threads.filter((t) => t.ownerId === HB.S.ownerId && t.unreadOw).length },
      { l: 'Reports', i: 'report', p: '/ow/reports' }
    ]
  };

  /* ---------- shell ---------- */
  const last = { op: '/op/today', ow: '/ow/overview' };
  function shellHTML() {
    const m = HB.match(); const role = HB.role(); const S = HB.S; const o = HB.curOwner();
    const items = HB.NAV[role].map((n) => {
      const cur = m.path === n.p || m.path.indexOf(n.p + '/') === 0;
      const b = n.b ? n.b() : 0;
      return '<a href="#' + n.p + '"' + (cur ? ' aria-current="page"' : '') + '>' + HB.icon(n.i, 21) + '<span>' + n.l + '</span>' + (b ? '<span class="badge' + (n.q ? ' quiet' : '') + '" aria-label="' + b + ' need attention">' + b + '</span>' : '') + '</a>';
    }).join('');
    const side = '<div class="brand"><div class="brand-mark" aria-hidden="true">HB</div><div><div class="brand-name">Handy Boys</div><div class="brand-sub">' + (role === 'op' ? 'Operator console' : 'Owner portal') + '</div></div></div>' +
      '<div class="nav-label">' + (role === 'op' ? 'Run the day' : 'Your properties') + '</div><nav class="nav" aria-label="Main">' + items + '</nav>' +
      '<div class="side-foot">' + (role === 'op'
        ? '<div class="who"><span class="avatar">A</span><div><b>Alex</b><span>Operator, sample account</span></div></div>'
        : '<div class="who"><span class="avatar">' + HB.esc(HB.initials(o.name)) + '</span><div><b>' + HB.esc(o.name) + '</b><span>' + HB.plural(o.props.length, 'property', 'properties') + '</span></div></div><label class="sr" for="ownersel">Demo owner</label><select id="ownersel" data-change="owner-pick" data-sync>' + S.owners.map((x) => '<option value="' + x.id + '"' + (x.id === S.ownerId ? ' selected' : '') + '>' + HB.esc(x.name) + '</option>').join('') + '</select>') + '</div>';
    const top = '<button class="btn btn-ghost btn-icon menu-btn" data-act="nav-open" aria-label="Open menu">' + HB.icon('list', 20) + '</button>' +
      '<div class="role-switch" role="group" aria-label="Switch view"><button data-act="role" data-role="op" aria-pressed="' + (role === 'op') + '">' + HB.icon('wrench', 17) + '<span class="long">Handy Boys (operator)</span><span class="short">Operator</span></button><button data-act="role" data-role="ow" aria-pressed="' + (role === 'ow') + '">' + HB.icon('home', 17) + '<span class="long">Owner portal (customer)</span><span class="short">Owner</span></button></div>' +
      '<div class="grow"></div><div class="clock" title="Demo clock"><i></i><span>' + HB.fmt(HB.TODAY, 'day') + ' · <span class="demo-time">' + HB.clock() + '</span></span></div>' +
      '<span class="demo-chip" title="Everything in this prototype is sample data">Demo data</span>' +
      '<button class="btn btn-primary runner-btn" data-act="runner-open">' + HB.icon('phone', 18) + '<span class="lbl">Run a turnover (phone)</span></button>';
    return { side, top };
  }
  HB.renderShell = () => {
    const s = shellHTML();
    HB.morph(HB.$('#side'), s.side); HB.morph(HB.$('#top'), s.top);
    const root = document.documentElement; const set = HB.S.settings;
    root.dataset.theme = set.theme; root.dataset.mode = set.mode;
    const sb = set.sidebar === 'auto' ? (HB.role() === 'op' ? 'dark' : 'light') : set.sidebar;
    if (sb === 'light') root.dataset.sidebar = 'light'; else delete root.dataset.sidebar;
  };
  let lastKey = '';
  HB.renderView = (full) => {
    const m = HB.match(); const main = HB.$('#main');
    document.body.classList.toggle('runner-full', m.key === 'runner');
    if (m.key === 'runner') { document.title = 'Turnover runner · Handy Boys demo'; HB.runnerRender && HB.runnerRender(); return; }
    const def = HB.views[m.key]; if (!def) { main.innerHTML = HB.empty('map', 'Nothing here yet', 'That page does not exist in the demo.'); return; }
    const html = def.render(m.params);
    if (full || lastKey !== m.path) {
      main.innerHTML = html; main.classList.remove('enter'); void main.offsetWidth; main.classList.add('enter');
      window.scrollTo(0, 0); document.title = (def.title ? def.title(m.params) : 'Portal') + ' · Handy Boys demo';
      lastKey = m.path; if (def.mount) def.mount(main, m.params);
    } else HB.morph(main, html);
  };
  HB.skeleton = () => '<div class="stack-l" aria-busy="true"><div class="skel" style="height:22px;width:160px"></div><div class="skel" style="height:56px;width:min(520px,80%)"></div><div class="cols"><div class="stack"><div class="skel" style="height:118px"></div><div class="skel" style="height:118px"></div><div class="skel" style="height:118px"></div></div><div class="skel" style="height:320px"></div></div></div>';

  HB.subs.push(() => { HB.renderShell(); HB.renderView(false); });
  window.addEventListener('hashchange', () => {
    const m = HB.match(); const r = HB.role(); if (m.key !== 'runner') last[r] = m.path;
    HB.$('#app').classList.remove('nav-open');
    HB.renderShell(); HB.renderView(true);
    const main = HB.$('#main'); if (main && m.key !== 'runner') main.focus({ preventScroll: true });
  });

  /* ---------- delegated events ---------- */
  document.addEventListener('click', (e) => {
    if (e.target.closest('.nav a')) HB.$('#app').classList.remove('nav-open');
    const el = e.target.closest('[data-act]'); if (!el) return;
    const fn = HB.acts[el.dataset.act]; if (!fn) return;
    if (el.tagName === 'A') e.preventDefault();
    fn(el, e);
  });
  ['change', 'input'].forEach((ev) => document.addEventListener(ev, (e) => {
    const el = e.target.closest('[data-' + ev + ']'); if (!el) return;
    const fn = HB.acts[el.getAttribute('data-' + ev)]; if (fn) fn(el, e);
  }));
  document.addEventListener('submit', (e) => {
    const el = e.target.closest('[data-submit]'); if (!el) return; e.preventDefault();
    const fn = HB.acts[el.dataset.submit]; if (fn) fn(el, e);
  });
  ['dragenter', 'dragover'].forEach((ev) => document.addEventListener(ev, (e) => { const el = e.target.closest('[data-drop]'); if (el) { e.preventDefault(); el.classList.add('over'); } }));
  document.addEventListener('dragleave', (e) => { const el = e.target.closest('[data-drop]'); if (el && !el.contains(e.relatedTarget)) el.classList.remove('over'); });
  document.addEventListener('drop', (e) => {
    const el = e.target.closest('[data-drop]'); if (!el) return; e.preventDefault(); el.classList.remove('over');
    const fn = HB.acts[el.dataset.drop]; if (fn) fn(el, e, e.dataTransfer.files);
  });

  HB.act('nav-open', () => HB.$('#app').classList.add('nav-open'));
  HB.act('nav-close', () => HB.$('#app').classList.remove('nav-open'));
  HB.act('role', (el) => { HB.go(last[el.dataset.role]); });
  HB.act('owner-pick', (el) => { HB.S.ownerId = el.value; const m = HB.match(); if (/^\/ow\/(properties|reports|quotes)\/.+/.test(m.path)) HB.go('/ow/overview'); HB.emit(); HB.toast('Now viewing as ' + HB.curOwner().name, { icon: 'user' }); });
  HB.acts['owner-pick'].fromChange = true;
  // select elements use data-change
  HB.go_last = last;
})();
