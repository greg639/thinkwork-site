/* Mobile turnover runner (phone frame, drawer or full screen) */
(function () {
  const S = () => HB.S;
  const U = HB.ui.rn = { screen: 'pick', pid: null, tab: 'checklist', open: null, sheet: null };
  const SEV = ['Minor', 'Needs fix', 'Urgent'];
  const fmtT = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
  const elapsed = (run) => (run.started ? (run.finished || Date.now()) - run.started : 0);
  const nextOpen = (pid) => { const r = HB.rooms(pid).find((x) => { const p = HB.roomProgress(pid, x); return p.done < p.total; }); return r ? r.id : null; };

  function startJob(pid) {
    if (S().run[pid].finished) { U.pid = pid; U.screen = 'done'; U.sheet = null; HB.emit(); return; }
    HB.update((s) => {
      const run = s.run[pid];
      if (!s.turn[pid]) s.turn[pid] = { status: 'In progress' };
      if (s.turn[pid].status === 'Checked out') s.turn[pid].status = 'In progress';
      if (!run.started) run.started = Date.now();
      if (run.finished) { run.finished = null; s.turn[pid] = { status: 'In progress' }; }
    });
    U.pid = pid; U.screen = 'job'; U.tab = 'checklist'; U.open = nextOpen(pid); U.sheet = null; HB.emit();
  }
  HB.runnerOpen = (pid) => {
    if (pid) startJob(pid);
    if (window.innerWidth <= 640) { if (HB.match().key !== 'runner') HB.go('/runner'); return; }
    HB.$('#drawer').classList.add('open'); document.body.classList.add('drawer-open'); HB.runnerRender();
    const b = HB.$('#drawer .drawer-head button'); if (b) b.focus({ preventScroll: true });
  };
  HB.act('runner-open', () => HB.runnerOpen());
  HB.act('runner-full', () => { HB.acts['drawer-close'](); HB.go('/runner'); });
  HB.act('drawer-close', () => { HB.$('#drawer').classList.remove('open'); document.body.classList.remove('drawer-open'); });
  HB.act('rn-exit', (el) => { if (el.closest('.rn-host').dataset.mode === 'full') HB.go('/' + (HB.role() === 'ow' ? 'ow/overview' : 'op/today')); else HB.acts['drawer-close'](); });

  /* ---------- screens ---------- */
  function pick() {
    const today = HB.todayTurnovers(); const ids = today.map((e) => e.pid); const rest = S().props.filter((p) => !ids.includes(p.id));
    const card = (p, e) => { const st = HB.turnStatus(p.id); const pr = HB.progress(p.id); return '<button class="rn-card" data-act="rn-start" data-pid="' + p.id + '"><img src="' + HB.photo(p.img) + '" alt=""><span class="rc-b"><b>' + HB.esc(p.short) + '</b><span>' + (e ? e.start + ' · ' + HB.esc(e.who) : 'Not on today\'s list') + '</span>' + (st ? '<span class="rc-s">' + HB.statusChip(st) + '</span>' : '') + (st === 'In progress' || st === 'Issue' ? '<span class="bar"><i style="width:' + pr.pct + '%"></i></span>' : '') + '</span>' + HB.icon('chev-r', 20) + '</button>'; };
    return '<header class="rn-top"><div><span class="rn-eyebrow">Handy Boys · Alex</span><h2>Pick a property</h2></div><button class="rn-x" data-act="rn-exit" aria-label="Close runner">' + HB.icon('x', 22) + '</button></header>' +
      '<div class="rn-body"><p class="rn-lede">' + HB.fmt(HB.TODAY, 'long') + ' · ' + HB.plural(today.length, 'turnover') + '</p>' + today.map((e) => card(HB.prop(e.pid), e)).join('') + '<h3 class="rn-h3">Other properties</h3>' + rest.map((p) => card(p)).join('') + '</div>';
  }

  function job() {
    const pid = U.pid; const p = HB.prop(pid); const run = S().run[pid]; const pr = HB.progress(pid); const t = S().turn[pid] || {};
    const issuesOpen = run.issues.length;
    const head = '<header class="rn-top job"><button class="rn-x" data-act="rn-back" aria-label="Back to the list">' + HB.icon('chev-l', 22) + '</button><div style="flex:1;min-width:0"><span class="rn-eyebrow">' + HB.esc(HB.owner(p.ownerId).name) + '</span><h2>' + HB.esc(p.short) + '</h2></div><div class="rn-timer-w"><span class="rn-timer mono">' + fmtT(elapsed(run)) + '</span><span class="rn-eyebrow">on site</span></div>' + HB.ring(pr.pct, 52, pr.pct >= 100) + '</header>';
    let body = '';
    if (U.tab === 'checklist') body = checklist(pid);
    else if (U.tab === 'count') body = count(pid);
    else if (U.tab === 'photos') body = photosTab(pid);
    else body = finish(pid);
    const tabs = [['checklist', 'Checklist', 'list'], ['count', 'Count', 'box'], ['photos', 'Photos', 'camera'], ['finish', 'Finish', 'check']];
    return head + '<div class="rn-body' + (U.tab === 'checklist' ? ' tight' : '') + '">' + body + '</div><nav class="rn-tabs" aria-label="Runner sections">' + tabs.map((x) => '<button data-act="rn-tab" data-t="' + x[0] + '" aria-current="' + (U.tab === x[0] ? 'page' : 'false') + '">' + HB.icon(x[2], 22) + '<span>' + x[1] + '</span>' + (x[0] === 'photos' && issuesOpen ? '<i class="rn-b">' + issuesOpen + '</i>' : '') + '</button>').join('') + '</nav>' + (U.sheet ? sheet(pid) : '');
  }

  function checklist(pid) {
    const run = S().run[pid]; const rooms = HB.rooms(pid);
    return rooms.map((r) => {
      const rp = HB.roomProgress(pid, r); const open = U.open === r.id; const full = rp.done === rp.total;
      return '<section class="rn-room' + (open ? ' open' : '') + (full ? ' full' : '') + '"><button class="rn-rh" data-act="rn-room" data-id="' + r.id + '" aria-expanded="' + open + '"><span class="rn-rc">' + (full ? HB.icon('check', 18) : '') + '</span><b>' + HB.esc(r.name) + '</b><span class="mono">' + rp.done + '/' + rp.total + '</span>' + HB.icon('chev-d', 18, 'chev') + '</button>' +
        (open ? '<ul class="rn-tasks">' + r.tasks.map((x) => '<li><button class="rn-task' + (run.done[x.id] ? ' on' : '') + '" data-act="rn-tick" data-id="' + x.id + '" aria-pressed="' + !!run.done[x.id] + '"><span class="rn-cb">' + HB.icon('check', 18) + '</span><span>' + HB.esc(x.text) + (x.freq === 'once' ? ' <em>one-off</em>' : '') + '</span></button></li>').join('') + '</ul><div class="rn-row-acts"><label class="rn-btn">' + HB.icon('camera', 18) + 'Add photo<input type="file" accept="image/*" capture="environment" hidden data-change="rn-photo" data-room="' + HB.esc(r.name) + '"></label><button class="rn-btn" data-act="rn-flag" data-room="' + HB.esc(r.name) + '">' + HB.icon('alert', 18) + 'Flag an issue</button>' + (full ? '' : '<button class="rn-btn ghost" data-act="rn-all" data-id="' + r.id + '">Tick all</button>') + '</div>' : '') + '</section>';
    }).join('');
  }

  function count(pid) {
    const run = S().run[pid];
    return '<p class="rn-lede">Count what is in the property. Anything different from last time is flagged in the report.</p>' + S().inventory[pid].map((r) => '<section class="rn-room open"><div class="rn-rh static"><b>' + HB.esc(r.room) + '</b></div><ul class="rn-count">' + r.items.map((it) => { const c = run.counts[it.id] != null ? run.counts[it.id] : it.qty; const diff = c !== it.last; return '<li class="' + (diff ? 'diff' : '') + '"><div><b>' + HB.esc(it.name) + '</b><span>Last time ' + it.last + (diff ? ' · ' + (c < it.last ? 'missing ' + (it.last - c) : 'extra ' + (c - it.last)) : '') + '</span></div><div class="rn-step" role="group" aria-label="Count of ' + HB.esc(it.name) + '"><button data-act="rn-count" data-id="' + it.id + '" data-d="-1" aria-label="One fewer">' + HB.icon('minus', 20) + '</button><output>' + c + '</output><button data-act="rn-count" data-id="' + it.id + '" data-d="1" aria-label="One more">' + HB.icon('plus', 20) + '</button></div></li>'; }).join('') + '</ul></section>').join('');
  }

  function photosTab(pid) {
    const run = S().run[pid];
    return '<label class="rn-add">' + HB.icon('camera', 26) + '<b>Add photo</b><span>Tagged to ' + HB.esc(roomName(pid)) + '</span><input type="file" accept="image/*" capture="environment" multiple hidden data-change="rn-photo" data-room="' + HB.esc(roomName(pid)) + '"></label>' +
      (run.photos.length ? '<h3 class="rn-h3">Photos (' + run.photos.length + ')</h3><div class="rn-grid">' + run.photos.map((x) => '<figure><img src="' + HB.src(x.src) + '" alt="' + HB.esc(x.room) + ' photo"><figcaption>' + HB.esc(x.room) + ' · ' + HB.clockAt(x.ts) + (x.sample ? ' · sample' : '') + '</figcaption></figure>').join('') + '</div>' : '<p class="rn-empty">No photos yet. Take a before and an after.</p>') +
      '<h3 class="rn-h3">Issues flagged (' + run.issues.length + ')</h3>' + (run.issues.length ? run.issues.map((i) => '<div class="rn-issue">' + (i.src ? '<img src="' + HB.src(i.src) + '" alt="">' : '') + '<div><b>' + HB.esc(i.room) + '</b> ' + HB.chip(i.sev, i.sev === 'Urgent' ? 'bad' : i.sev === 'Needs fix' ? 'warn' : 'muted') + '<p>' + HB.esc(i.note) + '</p></div></div>').join('') : '<p class="rn-empty">Nothing flagged.</p>') +
      '<button class="rn-btn wide" data-act="rn-flag" data-room="' + HB.esc(roomName(pid)) + '">' + HB.icon('alert', 18) + 'Flag an issue</button>';
  }
  const roomName = (pid) => { const r = HB.rooms(pid).find((x) => x.id === U.open) || HB.rooms(pid)[0]; return r.name; };

  function diffs(pid) {
    const run = S().run[pid]; const out = [];
    S().inventory[pid].forEach((r) => r.items.forEach((it) => { const c = run.counts[it.id] != null ? run.counts[it.id] : it.qty; if (c !== it.last) out.push({ room: r.room, item: it.name, last: it.last, now: c }); }));
    return out;
  }
  function finish(pid) {
    const run = S().run[pid]; const pr = HB.progress(pid); const d = diffs(pid); const o = HB.owner(HB.prop(pid).ownerId); const ok = pr.pct >= 100;
    return '<div class="rn-sum"><div><b class="mono">' + pr.done + '/' + pr.total + '</b><span>tasks</span></div><div><b class="mono">' + run.photos.length + '</b><span>photos</span></div><div><b class="mono">' + run.issues.length + '</b><span>issues</span></div><div><b class="mono">' + d.length + '</b><span>count differences</span></div></div>' +
      (d.length ? '<h3 class="rn-h3">Different from last time</h3><ul class="rn-dl">' + d.map((x) => '<li><span>' + HB.esc(x.item) + ' <em>' + HB.esc(x.room) + '</em></span><b class="mono">' + x.last + ' to ' + x.now + '</b></li>').join('') + '</ul>' : '') +
      (ok ? '<div class="rn-ok">' + HB.icon('check', 20) + 'Everything is ticked. Ready to send.</div>' : '<div class="rn-left">' + HB.icon('alert', 20) + (pr.total - pr.done) + ' tasks still to do.<button data-act="rn-tickrest">Tick everything left</button></div>') +
      '<button class="rn-go" data-act="rn-complete"' + (ok ? '' : ' aria-disabled="true"') + '>' + HB.icon('send', 22) + 'Complete and send report</button><p class="rn-fine">Marks the property guest-ready and sends the report to ' + HB.esc(o.name.split(' ')[0]) + '.</p>';
  }

  function sheet(pid) {
    const sh = U.sheet;
    return '<div class="rn-scrim" data-act="rn-sheet-x"></div><form class="rn-sheet" data-submit="rn-issue" role="dialog" aria-label="Flag an issue"><div class="rn-grab"></div><h3>Flag an issue</h3>' +
      '<label class="rn-f">Where<select name="room">' + HB.rooms(pid).map((r) => '<option' + (r.name === sh.room ? ' selected' : '') + '>' + HB.esc(r.name) + '</option>').join('') + '</select></label>' +
      '<label class="rn-f">What is wrong<textarea name="note" rows="3" placeholder="e.g. Shower screen sealant is lifting"></textarea></label>' +
      '<div class="rn-f"><span>How urgent</span><div class="rn-seg" role="radiogroup">' + SEV.map((s) => '<label><input type="radio" name="sev" value="' + s + '" data-change="rn-sev"' + (sh.sev === s ? ' checked' : '') + '><span>' + s + '</span></label>').join('') + '</div></div>' +
      '<div class="rn-f"><span>Photo</span><label class="rn-btn" style="justify-content:center">' + HB.icon('camera', 18) + (sh.photo ? 'Change photo' : 'Add photo') + '<input type="file" accept="image/*" capture="environment" hidden data-change="rn-issue-photo"></label>' + (sh.photo ? '<img class="rn-prev" src="' + sh.photo + '" alt="Attached photo preview">' : '') + '</div>' +
      '<div class="rn-sheet-a"><button type="button" class="rn-btn ghost" data-act="rn-sheet-x">Cancel</button><button type="submit" class="rn-btn primary">Create maintenance task</button></div></form>';
  }

  function done(pid) {
    const p = HB.prop(pid); const run = S().run[pid]; const r = HB.report('rp-' + pid + '-t'); const o = HB.owner(p.ownerId);
    return '<div class="rn-done"><div class="rn-big">' + HB.icon('check', 54) + '</div><h2>Guest-ready</h2><p>' + HB.esc(p.name) + ' at ' + (S().turn[pid].at || HB.clock()) + '</p><div class="rn-sum" style="margin:22px 0"><div><b class="mono">' + fmtT(elapsed(run)) + '</b><span>on site</span></div><div><b class="mono">' + (r ? r.score : '') + '</b><span>cleanliness</span></div><div><b class="mono">' + run.issues.length + '</b><span>issues</span></div></div><p class="rn-fine">Report sent to ' + HB.esc(o.name) + '. Their checklist is complete and the property shows as guest-ready.</p><button class="rn-go" data-act="rn-view-owner" data-pid="' + pid + '">' + HB.icon('eye', 22) + 'See what ' + HB.esc(o.name.split(' ')[0]) + ' sees</button><button class="rn-btn wide" data-act="rn-back">Back to the list</button><button class="rn-linkbtn" data-act="rn-reset" data-pid="' + pid + '">Reset this turnover (demo)</button></div>';
  }

  /* ---------- render ---------- */
  HB.runnerRender = () => {
    const hosts = HB.$$('.rn-host'); if (!hosts.length) return;
    if (U.screen !== 'pick' && !U.pid) U.screen = 'pick';
    const html = '<div class="rn ' + U.screen + '">' + (U.screen === 'pick' ? pick() : U.screen === 'done' ? '<header class="rn-top"><div><span class="rn-eyebrow">Handy Boys · Alex</span><h2>All done</h2></div><button class="rn-x" data-act="rn-exit" aria-label="Close runner">' + HB.icon('x', 22) + '</button></header><div class="rn-body">' + done(U.pid) + '</div>' : job()) + '</div>';
    hosts.forEach((h) => { HB.morph(h, html); });
    const clk = HB.clock(); HB.$$('.phone-clock').forEach((c) => { c.textContent = clk; });
  };
  HB.subs.push(HB.runnerRender);
  setInterval(() => { const run = U.pid && S().run[U.pid]; if (run && U.screen === 'job') { const t = fmtT(elapsed(run)); HB.$$('.rn-timer').forEach((e) => { e.textContent = t; }); } const c = HB.clock(); HB.$$('.demo-time,.phone-clock').forEach((e) => { e.textContent = c; }); }, 1000);

  /* ---------- actions ---------- */
  HB.act('rn-start', (el) => startJob(el.dataset.pid));
  HB.act('rn-back', () => { U.screen = 'pick'; U.sheet = null; HB.emit(); });
  HB.act('rn-tab', (el) => { U.tab = el.dataset.t; HB.emit(); });
  HB.act('rn-room', (el) => { U.open = U.open === el.dataset.id ? null : el.dataset.id; HB.emit(); });
  HB.act('rn-tick', (el) => {
    const pid = U.pid; const id = el.dataset.id;
    HB.update((s) => { const run = s.run[pid]; if (run.done[id]) delete run.done[id]; else run.done[id] = Date.now(); if (s.turn[pid].status === 'Guest-ready') s.turn[pid] = { status: 'In progress' }; });
    const cur = HB.rooms(pid).find((r) => r.id === U.open);
    if (cur) { const rp = HB.roomProgress(pid, cur); if (rp.done === rp.total) { setTimeout(() => { if (U.open === cur.id) { U.open = nextOpen(pid); HB.emit(); } }, 450); } }
  });
  HB.act('rn-all', (el) => { const pid = U.pid; const r = HB.rooms(pid).find((x) => x.id === el.dataset.id); HB.update((s) => { r.tasks.forEach((t) => { if (!s.run[pid].done[t.id]) s.run[pid].done[t.id] = Date.now(); }); }); setTimeout(() => { U.open = nextOpen(pid); HB.emit(); }, 450); });
  HB.act('rn-tickrest', () => { const pid = U.pid; HB.update((s) => { HB.rooms(pid).forEach((r) => r.tasks.forEach((t) => { if (!s.run[pid].done[t.id]) s.run[pid].done[t.id] = Date.now(); })); }); });
  HB.act('rn-count', (el) => { const pid = U.pid; HB.update((s) => { const it = s.inventory[pid].reduce((a, r) => a.concat(r.items), []).find((x) => x.id === el.dataset.id); const run = s.run[pid]; const c = run.counts[it.id] != null ? run.counts[it.id] : it.qty; run.counts[it.id] = Math.max(0, Math.min(99, c + Number(el.dataset.d))); }); });
  HB.act('rn-photo', (el) => {
    const pid = U.pid; const ims = HB.images(el.files); el.value = ''; if (!ims.length) return;
    HB.update((s) => { ims.forEach((im) => s.run[pid].photos.push({ src: im.src, room: el.dataset.room, ts: Date.now() })); });
    HB.toast(HB.plural(ims.length, 'photo') + ' added to ' + el.dataset.room, { icon: 'camera' });
  });
  HB.act('rn-flag', (el) => { U.sheet = { room: el.dataset.room, sev: 'Needs fix', photo: null }; HB.emit(); });
  HB.act('rn-sheet-x', () => { U.sheet = null; HB.emit(); });
  HB.act('rn-sev', (el) => { U.sheet.sev = el.value; });
  HB.act('rn-issue-photo', (el) => { const im = HB.images(el.files)[0]; el.value = ''; if (im) { U.sheet.photo = im.src; HB.emit(); } });
  HB.act('rn-issue', (el) => {
    const f = HB.formData(el); const pid = U.pid; const p = HB.prop(pid);
    if (f.note.trim().length < 3) { HB.toast('Say what is wrong', { icon: 'alert' }); return; }
    const id = HB.uid('is'); const tid = HB.uid('tk');
    HB.update((s) => {
      s.run[pid].issues.push({ id, room: f.room, note: f.note.trim(), sev: f.sev || 'Needs fix', src: U.sheet.photo, ts: Date.now(), taskId: tid });
      s.tasks.unshift({ id: tid, pid, title: f.note.trim().slice(0, 64), room: f.room, sev: f.sev || 'Needs fix', status: 'open', source: 'runner', at: Date.now() });
      s.history[pid].unshift({ date: HB.TODAY, type: 'issue', title: f.room + ': ' + f.note.trim().slice(0, 50), detail: 'Raised during today\'s turnover. A maintenance task was created.', rep: null });
    });
    U.sheet = null; HB.emit(); HB.toast('Maintenance task created for ' + p.short, { icon: 'wrench' });
  });
  HB.act('rn-complete', () => {
    const pid = U.pid; const pr = HB.progress(pid); if (pr.pct < 100) { HB.toast('Finish the checklist first, or tick everything left', { icon: 'alert' }); return; }
    const p = HB.prop(pid); const run = S().run[pid]; const d = diffs(pid); const mins = Math.max(1, Math.round(elapsed(run) / 60000)); const clk = HB.clock();
    const score = Math.max(80, Math.min(99, 100 - run.issues.length * 3 - d.length * 2 - (mins > 150 ? 2 : 0) - 1));
    const photos = run.photos;
    const rep = { id: 'rp-' + pid + '-t', pid, date: HB.TODAY, time: clk, by: p.who, mins, score, sent: true, rooms: HB.rooms(pid).map((r) => { const rp = HB.roomProgress(pid, r); return { room: r.name, done: rp.done, total: rp.total }; }), issues: run.issues.map((i) => ({ title: i.note.length > 46 ? i.note.slice(0, 44) + '…' : i.note, note: i.note, sev: i.sev, src: i.src, sample: i.sample })), diffs: d, before: photos.length ? photos[0].src : p.img, after: photos.length > 1 ? photos[photos.length - 1].src : p.img, evidence: [] };
    HB.update((s) => {
      s.reports = s.reports.filter((r) => r.id !== rep.id); s.reports.unshift(rep);
      run.finished = Date.now(); s.turn[pid] = { status: 'Guest-ready', at: clk };
      s.inventory[pid].forEach((r) => r.items.forEach((it) => { if (run.counts[it.id] != null) it.qty = run.counts[it.id]; }));
      (s.todos[pid] || []).forEach((t) => { if (t.freq === 'once' && run.done[t.id]) t.finished = true; });
      s.history[pid] = s.history[pid].filter((h) => h.rep !== rep.id); s.history[pid].unshift({ date: HB.TODAY, type: 'turnover', title: 'Turnover complete', detail: 'Guest-ready at ' + clk + ', score ' + score + '.', rep: rep.id });
      s.props.find((x) => x.id === pid).trend = p.trend.slice(1).concat(score);
      s.notifs.push({ ownerId: p.ownerId, text: p.short + ' is guest-ready', at: Date.now() });
    });
    U.screen = 'done'; HB.emit();
    if (HB.role() === 'ow' && S().ownerId === p.ownerId) HB.toast(p.short + ' is now guest-ready', { icon: 'check' }); else HB.toast('Report sent to ' + HB.owner(p.ownerId).name.split(' ')[0], { icon: 'send' });
  });
  HB.act('rn-view-owner', (el) => { const p = HB.prop(el.dataset.pid); HB.S.ownerId = p.ownerId; HB.acts['drawer-close'](); HB.go('/ow/properties/' + p.id + '/checklist'); HB.emit(); });
  HB.act('rn-reset', (el) => {
    const pid = el.dataset.pid; HB.update((s) => { const run = s.run[pid]; run.done = {}; run.started = null; run.finished = null; run.photos = []; run.issues = []; run.counts = {}; s.turn[pid] = { status: 'Checked out' }; s.tasks = s.tasks.filter((t) => !(t.pid === pid && t.source === 'runner')); (s.todos[pid] || []).forEach((t) => { t.finished = false; }); s.reports = s.reports.filter((r) => r.id !== 'rp-' + pid + '-t'); });
    U.screen = 'pick'; HB.emit(); HB.toast('Turnover reset for the demo');
  });
})();
