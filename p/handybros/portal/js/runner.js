/* Mobile turnover runner (phone frame, drawer or full screen) */
(function () {
  const S = () => HB.S; const F = HB.field;
  HB.addIcons({ search: '<circle cx="10.500" cy="10.500" r="6"/><path d="m15 15 5 5"/>' });
  const U = HB.ui.rn = { screen: 'pick', pid: null, tab: 'checklist', open: null, sheet: null, cam: null, out: false };
  const SEV = ['Minor', 'Needs fix', 'Urgent'];
  const fmtT = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
  const elapsed = (pid) => { const run = S().run[pid]; const v = F.runVisit(pid); return run.started ? ((v && v.outAt) || run.finished || Date.now()) - run.started : 0; };
  const work = (pid) => { const st = F.st(); return st.work[pid] || (st.work[pid] = { damage: {}, secure: { heat: 18, heatOk: false, windows: false, vents: false }, cons: {}, rp: {} }); };
  const issueRooms = (pid) => F.rooms(pid).concat(['Whole property']);
  const CONS = [['tr', 'Toilet roll'], ['hs', 'Hand soap'], ['wu', 'Washing-up liquid'], ['dw', 'Dishwasher tablets'], ['bl', 'Bin liners'], ['tc', 'Tea, coffee and milk'], ['sg', 'Shampoo and shower gel'], ['cl', 'Cleaning spray and cloths']];
  const dmgItems = (pid) => {
    const p = HB.prop(pid); const o = [];
    for (let i = 1; i <= p.beds; i++) { o.push({ id: 'b' + i + 's', room: 'Bedroom ' + i, text: 'Bed slats, frame and headboard' }); o.push({ id: 'b' + i + 'm', room: 'Bedroom ' + i, text: 'Mattress, pillows and wardrobe inside: stains, burns, tears' }); }
    return o.concat([{ id: 'seat', room: 'Living room', text: 'Sofa and chair seats: under cushions, arms and legs' }, { id: 'furn', room: 'Living room', text: 'Behind the TV and under furniture' }, { id: 'kit', room: 'Kitchen', text: 'Oven, under the sink and inside cupboards' }, { id: 'bath', room: 'Bathroom', text: 'Behind the toilet, grout, sealant and shower screen' }, { id: 'hw', room: 'Hallway', text: 'Door and window hardware: handles, hinges, catches, curtain rails' }, { id: 'wall', room: 'Hallway', text: 'Walls, skirting and floors: scuffs, marks, burns' }, { id: 'out', room: 'Whole property', text: 'Outside: balcony, yard, bin area' }]);
  };
  const dmgProg = (pid) => { const w = work(pid); const it = dmgItems(pid); return { total: it.length, done: it.filter((x) => w.damage[x.id] && w.damage[x.id].st).length, dmg: it.filter((x) => w.damage[x.id] && w.damage[x.id].st === 'dmg').length }; };
  const secN = (pid) => { const x = work(pid).secure; return [x.heatOk, x.windows, x.vents].filter(Boolean).length; };
  const lowN = (pid) => CONS.filter((c) => work(pid).cons[c[0]] === 'low').length;
  const roomsDone = (pid) => F.rooms(pid).filter((r) => work(pid).rp[r] && F.photo(work(pid).rp[r])).length;
  const nextOpen = (pid) => { const r = HB.rooms(pid).find((x) => { const p = HB.roomProgress(pid, x); return p.done < p.total; }); return r ? r.id : null; };

  function startJob(pid) {
    if (S().run[pid].finished) { U.pid = pid; U.screen = 'done'; U.sheet = null; U.cam = null; HB.emit(); return; }
    HB.update((s) => {
      const run = s.run[pid];
      if (!s.turn[pid]) s.turn[pid] = { status: 'In progress' };
      if (s.turn[pid].status === 'Checked out') s.turn[pid].status = 'In progress';
      if (!run.started) run.started = Date.now();
      if (run.finished) { run.finished = null; s.turn[pid] = { status: 'In progress' }; }
      F.checkIn(pid, 'Alex');
    });
    U.pid = pid; U.screen = 'job'; U.tab = dmgProg(pid).done < dmgProg(pid).total ? 'damage' : 'checklist'; U.open = nextOpen(pid); U.sheet = null; U.cam = null; U.out = false; HB.emit();
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
    return '<header class="rn-top"><div><span class="rn-eyebrow">HandyBros · Alex</span><h2>Pick a property</h2></div><button class="rn-x" data-act="rn-exit" aria-label="Close runner">' + HB.icon('x', 22) + '</button></header>' +
      '<div class="rn-body"><p class="rn-lede">' + HB.fmt(HB.TODAY, 'long') + ' · ' + HB.plural(today.length, 'turnover') + '</p>' + today.map((e) => card(HB.prop(e.pid), e)).join('') + '<h3 class="rn-h3">Other properties</h3>' + rest.map((p) => card(p)).join('') + '</div>';
  }

  function bar(pid) {
    const v = F.runVisit(pid); const run = S().run[pid];
    if (!v) return '<div class="rn-bar"><div class="rb-t"><b>Not checked in</b><span>Start the clock when you arrive</span></div><button class="rn-btn primary" data-act="rn-checkin">Check in</button></div>';
    if (v.outAt) {
      const inv = F.st().invoiceDrafts.find((x) => x.id === v.invoiceId);
      return '<div class="rn-bar out"><div class="rb-t"><b>' + HB.icon('check', 15) + 'Checked out ' + HB.clockAt(v.outAt) + '</b><span>In ' + HB.clockAt(v.inAt) + ' · ' + HB.dur(v.mins / 60) + ' on site</span></div><button class="rn-btn" data-act="rn-flag" data-room="Whole property">' + HB.icon('alert', 17) + 'Issue</button>' +
        (inv ? '<p class="rb-note">' + HB.icon('card', 15) + '<span>Draft invoice line created from time on site: <b class="mono">' + HB.esc(inv.id) + '</b>, ' + HB.dur(inv.billed / 60) + ' billed, <b class="mono">' + HB.money(inv.amount) + '</b></span></p>' : '') + (v.res && v.res.deleted ? '<p class="rb-note">' + HB.icon('trash', 15) + '<span>Earlier photo set cleared: ' + v.res.deleted + ' photos, ' + F.mb(v.res.kb) + ' MB saved</span></p>' : '') + (v.res && v.res.pinned ? '<p class="rb-note">' + HB.icon('pinned', 15) + '<span>' + v.res.pinned + ' photos pinned to an incident and kept</span></p>' : '') + '</div>';
    }
    return '<div class="rn-bar"><div class="rb-t"><b><i class="rb-dot"></i>Checked in ' + HB.clockAt(v.inAt) + '</b><span><span class="rn-timer mono">' + fmtT(elapsed(pid)) + '</span> on site</span></div><button class="rn-btn" data-act="rn-flag" data-room="Whole property">' + HB.icon('alert', 17) + 'Issue</button><button class="rn-btn primary" data-act="rn-out">' + HB.icon('clock', 17) + 'Check out</button></div>';
  }

  function job() {
    const pid = U.pid; const p = HB.prop(pid); const run = S().run[pid]; const pr = HB.progress(pid);
    const issuesOpen = run.issues.length; const dp = dmgProg(pid);
    const head = '<header class="rn-top job"><button class="rn-x" data-act="rn-back" aria-label="Back to the list">' + HB.icon('chev-l', 22) + '</button><div style="flex:1;min-width:0"><span class="rn-eyebrow">' + HB.esc(HB.owner(p.ownerId).name) + '</span><h2>' + HB.esc(p.short) + '</h2></div>' + HB.ring(pr.pct, 52, pr.pct >= 100) + '</header>';
    let body = '';
    if (U.tab === 'checklist') body = checklist(pid);
    else if (U.tab === 'damage') body = damage(pid);
    else if (U.tab === 'count') body = count(pid);
    else if (U.tab === 'photos') body = photosTab(pid);
    else if (U.tab === 'secure') body = secure(pid);
    else body = finish(pid);
    const tabs = [['damage', 'Damage', 'search'], ['checklist', 'Checklist', 'list'], ['count', 'Count', 'box'], ['photos', 'Photos', 'camera'], ['secure', 'Secure', 'lock'], ['finish', 'Finish', 'check']];
    const badge = (t) => (t === 'photos' && issuesOpen ? '<i class="rn-b">' + issuesOpen + '</i>' : t === 'damage' && dp.dmg ? '<i class="rn-b">' + dp.dmg + '</i>' : '');
    return head + bar(pid) + '<div class="rn-body' + (U.tab === 'checklist' ? ' tight' : '') + '">' + body + '</div><nav class="rn-tabs" aria-label="Runner sections">' + tabs.map((x) => '<button data-act="rn-tab" data-t="' + x[0] + '" aria-current="' + (U.tab === x[0] ? 'page' : 'false') + '">' + HB.icon(x[2], 21) + '<span>' + x[1] + '</span>' + badge(x[0]) + '</button>').join('') + '</nav>' + (U.sheet ? sheet(pid) : '') + (U.out ? outSheet(pid) : '') + (U.cam ? cam(pid) : '');
  }

  function damage(pid) {
    const w = work(pid); const dp = dmgProg(pid);
    return '<div class="rn-lede"><b>Before you clean:</b> check the places a guest could hide damage. Mark each one Ok or Damaged, with a photo. ' + '<span class="mono">' + dp.done + '/' + dp.total + '</span></div><ul class="rn-dcs">' + dmgItems(pid).map((it) => {
      const c = w.damage[it.id] || {};
      return '<li class="rn-dc' + (c.st ? ' ' + c.st : '') + '"><div class="dc-t"><b>' + HB.esc(it.text) + '</b><span>' + HB.esc(it.room) + '</span></div><div class="dc-a"><button data-act="rn-dc" data-id="' + it.id + '" data-v="ok" aria-pressed="' + (c.st === 'ok') + '">' + HB.icon('check', 17) + 'Ok</button><button data-act="rn-dc" data-id="' + it.id + '" data-v="dmg" aria-pressed="' + (c.st === 'dmg') + '">' + HB.icon('alert', 17) + 'Damaged</button><button class="dc-cam" data-act="rn-cam" data-kind="check" data-key="' + it.id + '" aria-label="' + (c.src ? 'Retake photo: ' : 'Take photo: ') + HB.esc(it.text) + '">' + (c.src ? '<img src="' + HB.src(c.src) + '" alt="Photo of ' + HB.esc(it.text) + '">' : HB.icon('camera', 20)) + '</button></div>' +
        (c.st === 'dmg' ? (c.inc ? '<p class="dc-n">' + HB.icon('pinned', 14) + 'Incident ' + HB.esc(c.inc) + ' raised. Photos pinned as proof.</p>' : '<button class="rn-btn wide" data-act="rn-dc-report" data-id="' + it.id + '">' + HB.icon('alert', 17) + 'Report this as an incident</button>') : '') + '</li>';
    }).join('') + '</ul>' + (dp.done === dp.total ? '<div class="rn-ok">' + HB.icon('check', 20) + 'Damage check done' + (dp.dmg ? ': ' + dp.dmg + ' damaged' : ', nothing found') + '. Start cleaning.<button data-act="rn-tab" data-t="checklist">Checklist</button></div>' : '');
  }

  function secure(pid) {
    const x = work(pid).secure; const w = work(pid);
    const row = (k, text, extra) => '<li class="rn-sec"><button class="rn-task' + (x[k] ? ' on' : '') + '" data-act="rn-sec" data-k="' + k + '" aria-pressed="' + !!x[k] + '"><span class="rn-cb">' + HB.icon('check', 18) + '</span><span>' + text + '</span></button>' + (extra || '') + '</li>';
    return '<p class="rn-lede">Utility protection before you lock up: stops frozen pipes, damp and condensation while the property is empty. <span class="mono">' + secN(pid) + '/3</span></p><section class="rn-room open"><div class="rn-rh static"><b>Utility protection</b></div><ul class="rn-tasks">' +
      row('heatOk', 'Heating set to 18°C', '<div class="rn-sec-s"><span>Thermostat now</span><div class="rn-step" role="group" aria-label="Thermostat"><button data-act="rn-heat" data-d="-1" aria-label="One degree lower">' + HB.icon('minus', 20) + '</button><output>' + x.heat + '°C</output><button data-act="rn-heat" data-d="1" aria-label="One degree higher">' + HB.icon('plus', 20) + '</button></div></div>') +
      row('windows', 'All windows closed and locked') + row('vents', 'Trickle vents open') + '</ul></section>' +
      '<h3 class="rn-h3">Consumables</h3><p class="rn-fine" style="text-align:left">Low items go on the restock list.</p><section class="rn-room open"><ul class="rn-cons">' + CONS.map((c) => { const v = w.cons[c[0]]; return '<li class="' + (v === 'low' ? 'low' : '') + '"><b>' + c[1] + '</b><div class="rn-seg2" role="group" aria-label="' + c[1] + '"><button data-act="rn-cons" data-id="' + c[0] + '" data-v="ok" aria-pressed="' + (v === 'ok') + '">Ok</button><button data-act="rn-cons" data-id="' + c[0] + '" data-v="low" aria-pressed="' + (v === 'low') + '">Low</button></div></li>'; }).join('') + '</ul></section>';
  }

  function cam(pid) {
    const k = U.cam; const lab = k.kind === 'room' ? k.key : k.kind === 'check' ? (dmgItems(pid).find((i) => i.id === k.key) || { text: 'Damage check' }).text : 'Issue photo';
    return '<div class="rn-scrim z2" data-act="rn-cam-x"></div><div class="rn-sheet rn-cam" role="dialog" aria-label="Take photo"><div class="rn-grab"></div><h3>Take photo</h3><div class="rn-vf" aria-hidden="true"><i></i><i></i><i></i><i></i><span>' + HB.icon('camera', 26) + HB.esc(lab) + '</span></div><p class="rn-fine" style="text-align:left">The camera is simulated in this demo. Tap a sample picture to use it as the photo, or upload a real one.</p><div class="rn-pg">' + F.samples.map((x) => '<button type="button" data-act="rn-cam-pick" data-src="' + x[0] + '" aria-label="Use sample picture: ' + x[1] + '"><img src="' + HB.photo(x[0]) + '" alt=""></button>').join('') + '</div><label class="rn-btn wide" style="justify-content:center">' + HB.icon('upload', 18) + 'Upload a real photo<input type="file" accept="image/*" capture="environment" hidden data-change="rn-cam-file"></label><button type="button" class="rn-btn ghost wide" data-act="rn-cam-x">Cancel</button></div>';
  }

  function outSheet(pid) {
    const v = F.runVisit(pid); const mins = Math.max(1, Math.round(elapsed(pid) / 60000)); const pr = HB.progress(pid); const dp = dmgProg(pid);
    const R = S().rates; const ret = HB.onClub(pid); const rate = R.hourly; const billed = Math.max(15, Math.ceil(mins / 15) * 15);
    const left = []; if (pr.pct < 100) left.push((pr.total - pr.done) + ' checklist tasks not ticked'); if (dp.done < dp.total) left.push('Damage check ' + dp.done + '/' + dp.total); if (roomsDone(pid) < F.rooms(pid).length) left.push('Room photos ' + roomsDone(pid) + '/' + F.rooms(pid).length); if (secN(pid) < 3) left.push('Utility protection ' + secN(pid) + '/3');
    return '<div class="rn-scrim" data-act="rn-out-x"></div><form class="rn-sheet" data-submit="rn-out-ok" role="dialog" aria-label="Check out"><div class="rn-grab"></div><h3>Check out of ' + HB.esc(HB.prop(pid).short) + '?</h3><div class="rn-sum"><div><b class="mono">' + HB.clockAt(v ? v.inAt : Date.now()) + '</b><span>checked in</span></div><div><b class="mono">' + HB.dur(mins / 60) + '</b><span>on site</span></div></div>' +
      (left.length ? '<div class="rn-left">' + HB.icon('alert', 20) + '<span>Still open: ' + left.join(', ') + '.</span></div>' : '<div class="rn-ok">' + HB.icon('check', 20) + 'Everything is done.</div>') +
      '<p class="rn-fine" style="text-align:left">Checking out ends the visit and creates a draft invoice line from time on site: ' + HB.dur(billed / 60) + ' billed (15 minute steps, 15 minute minimum) at ' + HB.money(rate) + ' an hour' + (ret ? ', less the retained discount of ' + HB.discPct() + '% <span class="todo">discount to confirm</span>' : '') + '. Earlier photos are tidied away unless an incident pins them.</p><div class="rn-sheet-a"><button type="button" class="rn-btn ghost" data-act="rn-out-x">Stay on site</button><button type="submit" class="rn-btn primary">Check out</button></div></form>';
  }

  function checklist(pid) {
    const run = S().run[pid]; const rooms = HB.rooms(pid); const dp = dmgProg(pid);
    return (dp.done < dp.total ? '<div class="rn-left">' + HB.icon('search', 20) + 'Damage check first: ' + dp.done + '/' + dp.total + ' done.<button data-act="rn-tab" data-t="damage">Do it now</button></div>' : '') + rooms.map((r) => {
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
    const run = S().run[pid]; const w = work(pid); const rooms = F.rooms(pid);
    const roomCards = rooms.map((r) => {
      const ph = w.rp[r] && F.photo(w.rp[r]); const prev = F.st().photos.filter((x) => x.pid === pid && x.room === r && x.state === 'previous')[0];
      return '<figure class="rn-rp' + (ph ? ' has' : '') + '"><button class="rp-img" data-act="rn-cam" data-kind="room" data-key="' + HB.esc(r) + '" aria-label="' + (ph ? 'Retake' : 'Take') + ' photo of ' + HB.esc(r) + '">' + (ph ? '<img src="' + HB.src(ph.src) + '" alt="' + HB.esc(r) + ' photo">' : HB.icon('camera', 26)) + (prev && prev.src ? '<span class="rp-prev" title="Last visit"><img src="' + HB.src(prev.src) + '" alt="Last visit photo of ' + HB.esc(r) + '"></span>' : '') + '</button><figcaption><b>' + HB.esc(r) + '</b>' + (ph ? F.badge(ph) : '<span class="rn-pend">Needed</span>') + '<button class="rp-b" data-act="rn-cam" data-kind="room" data-key="' + HB.esc(r) + '">' + (ph ? 'Retake' : 'Take photo') + '</button></figcaption></figure>';
    }).join('');
    return '<p class="rn-lede">One photo of every room as you leave it. The earlier photo is kept for comparison until you check out, then it is cleared unless an incident pins it. <span class="mono">' + roomsDone(pid) + '/' + rooms.length + '</span></p><div class="rn-rps">' + roomCards + '</div>' +
      '<label class="rn-add">' + HB.icon('camera', 26) + '<b>Add another photo</b><span>Tagged to ' + HB.esc(roomName(pid)) + '</span><input type="file" accept="image/*" capture="environment" multiple hidden data-change="rn-photo" data-room="' + HB.esc(roomName(pid)) + '"></label>' +
      (run.photos.length ? '<h3 class="rn-h3">All photos this visit (' + run.photos.length + ')</h3><div class="rn-grid">' + run.photos.map((x) => '<figure><img src="' + HB.src(x.src) + '" alt="' + HB.esc(x.room) + ' photo"><figcaption>' + HB.esc(x.room) + ' · ' + HB.clockAt(x.ts) + (x.sample ? ' · sample' : '') + '</figcaption></figure>').join('') + '</div>' : '<p class="rn-empty">No photos yet. Take a before and an after.</p>') +
      '<h3 class="rn-h3">Issues flagged (' + run.issues.length + ')</h3>' + (run.issues.length ? run.issues.map((i) => '<div class="rn-issue">' + (i.src ? '<img src="' + HB.src(i.src) + '" alt="">' : '') + '<div><b>' + HB.esc(i.room) + '</b> ' + HB.chip(i.sev, i.sev === 'Urgent' ? 'bad' : i.sev === 'Needs fix' ? 'warn' : 'muted') + '<p>' + HB.esc(i.note) + '</p>' + (i.incidentId ? '<span class="pst pin">' + HB.icon('pinned', 12) + HB.esc(i.incidentId) + '</span>' : '') + '</div></div>').join('') : '<p class="rn-empty">Nothing flagged.</p>') +
      '<button class="rn-btn wide" data-act="rn-flag" data-room="' + HB.esc(roomName(pid)) + '">' + HB.icon('alert', 18) + 'Report an issue</button>';
  }
  const roomName = (pid) => { const r = HB.rooms(pid).find((x) => x.id === U.open) || HB.rooms(pid)[0]; return r.name; };

  function diffs(pid) {
    const run = S().run[pid]; const out = [];
    S().inventory[pid].forEach((r) => r.items.forEach((it) => { const c = run.counts[it.id] != null ? run.counts[it.id] : it.qty; if (c !== it.last) out.push({ room: r.room, item: it.name, last: it.last, now: c }); }));
    return out;
  }
  function finish(pid) {
    const run = S().run[pid]; const pr = HB.progress(pid); const d = diffs(pid); const o = HB.owner(HB.prop(pid).ownerId); const ok = pr.pct >= 100;
    const dp = dmgProg(pid), nr = F.rooms(pid).length;
    const li = (good, t, v) => '<li class="' + (good ? 'ok' : '') + '"><span class="rn-chk">' + (good ? HB.icon('check', 14) : '') + '</span><span>' + t + '</span><b class="mono">' + v + '</b></li>';
    const low = CONS.filter((c) => work(pid).cons[c[0]] === 'low').map((c) => c[1]);
    return '<div class="rn-sum"><div><b class="mono">' + pr.done + '/' + pr.total + '</b><span>tasks</span></div><div><b class="mono">' + run.photos.length + '</b><span>photos</span></div><div><b class="mono">' + run.issues.length + '</b><span>issues</span></div><div><b class="mono">' + d.length + '</b><span>count differences</span></div></div>' +
      '<ul class="rn-chks">' + li(dp.done === dp.total, 'Pre-clean damage check' + (dp.dmg ? ' (' + dp.dmg + ' damaged)' : ''), dp.done + '/' + dp.total) + li(roomsDone(pid) === nr, 'Room photos', roomsDone(pid) + '/' + nr) + li(secN(pid) === 3, 'Heating 18°C, windows locked, vents open', secN(pid) + '/3') + li(!low.length, 'Consumables', low.length ? low.length + ' low' : 'Ok') + '</ul>' + (low.length ? '<p class="rn-fine" style="text-align:left"><b>Restock list:</b> ' + low.map(HB.esc).join(', ') + '.</p>' : '') +
      (d.length ? '<h3 class="rn-h3">Different from last time</h3><ul class="rn-dl">' + d.map((x) => '<li><span>' + HB.esc(x.item) + ' <em>' + HB.esc(x.room) + '</em></span><b class="mono">' + x.last + ' to ' + x.now + '</b></li>').join('') + '</ul>' : '') +
      (ok ? '<div class="rn-ok">' + HB.icon('check', 20) + 'Everything is ticked. Ready to send.</div>' : '<div class="rn-left">' + HB.icon('alert', 20) + (pr.total - pr.done) + ' tasks still to do.<button data-act="rn-tickrest">Tick everything left</button></div>') +
      '<button class="rn-go" data-act="rn-complete"' + (ok ? '' : ' aria-disabled="true"') + '>' + HB.icon('send', 22) + 'Complete and send report</button><p class="rn-fine">Marks the property guest-ready, checks you out with a draft invoice line for time on site, and sends the report to ' + HB.esc(o.name.split(' ')[0]) + '.</p>';
  }

  function sheet(pid) {
    const sh = U.sheet; const rooms = issueRooms(pid);
    return '<div class="rn-scrim" data-act="rn-sheet-x"></div><form class="rn-sheet" data-submit="rn-issue" role="dialog" aria-label="Report an issue"><div class="rn-grab"></div><h3>Report an issue</h3>' +
      '<label class="rn-f">Where<select name="room">' + rooms.map((r) => '<option' + (r === sh.room ? ' selected' : '') + '>' + HB.esc(r) + '</option>').join('') + '</select></label>' +
      '<label class="rn-f">What is wrong<textarea name="note" rows="3" placeholder="e.g. Shower screen sealant is lifting">' + HB.esc(sh.note || '') + '</textarea></label>' +
      '<div class="rn-f"><span>How urgent</span><div class="rn-seg" role="radiogroup">' + SEV.map((s) => '<label><input type="radio" name="sev" value="' + s + '" data-change="rn-sev"' + (sh.sev === s ? ' checked' : '') + '><span>' + s + '</span></label>').join('') + '</div></div>' +
      '<div class="rn-f"><span>Photos (' + sh.photos.length + ')</span>' + (sh.photos.length ? '<div class="rn-thumbs">' + sh.photos.map((x, n) => '<span><img src="' + HB.src(x.src) + '" alt="Attached photo ' + (n + 1) + '"><button type="button" data-act="rn-issue-rm" data-n="' + n + '" aria-label="Remove photo ' + (n + 1) + '">' + HB.icon('x', 14) + '</button></span>').join('') + '</div>' : '') + '<button type="button" class="rn-btn" data-act="rn-cam" data-kind="issue" data-key="">' + HB.icon('camera', 18) + (sh.photos.length ? 'Add another photo' : 'Add photo') + '</button></div>' +
      '<label class="rn-chkl"><input type="checkbox" name="ins" data-change="rn-ins"' + (sh.ins ? ' checked' : '') + '><span>Possible insurance matter</span></label>' +
      '<p class="rn-fine" style="text-align:left">This raises an incident report. The last visit\'s and this visit\'s photos for the area are pinned and kept permanently as proof.</p>' +
      '<div class="rn-sheet-a"><button type="button" class="rn-btn ghost" data-act="rn-sheet-x">Cancel</button><button type="submit" class="rn-btn primary">Raise incident</button></div></form>';
  }

  function done(pid) {
    const p = HB.prop(pid); const run = S().run[pid]; const r = HB.report('rp-' + pid + '-t'); const o = HB.owner(p.ownerId); const v = F.runVisit(pid);
    const inv = v && F.st().invoiceDrafts.find((x) => x.id === v.invoiceId);
    return '<div class="rn-done"><div class="rn-big">' + HB.icon('check', 54) + '</div><h2>Guest-ready</h2><p>' + HB.esc(p.name) + ' at ' + (S().turn[pid].at || HB.clock()) + '</p><div class="rn-sum" style="margin:22px 0"><div><b class="mono">' + fmtT(elapsed(pid)) + '</b><span>on site</span></div><div><b class="mono">' + (r ? r.score : '') + '</b><span>cleanliness</span></div><div><b class="mono">' + run.issues.length + '</b><span>issues</span></div></div>' + (inv ? '<p class="rn-fine rb-note solo">' + HB.icon('card', 15) + '<span>Draft invoice line created from time on site: <b class="mono">' + HB.esc(inv.id) + '</b>, ' + HB.money(inv.amount) + '</span></p>' : '') + '<p class="rn-fine">Report sent to ' + HB.esc(o.name) + '. Their checklist is complete and the property shows as guest-ready.</p><button class="rn-go" data-act="rn-view-owner" data-pid="' + pid + '">' + HB.icon('eye', 22) + 'See what ' + HB.esc(o.name.split(' ')[0]) + ' sees</button><button class="rn-btn wide" data-act="rn-back">Back to the list</button><button class="rn-linkbtn" data-act="rn-reset" data-pid="' + pid + '">Reset this turnover (demo)</button></div>';
  }

  /* ---------- render ---------- */
  HB.runnerRender = () => {
    const hosts = HB.$$('.rn-host'); if (!hosts.length) return;
    if (U.screen !== 'pick' && !U.pid) U.screen = 'pick';
    const html = '<div class="rn ' + U.screen + '">' + (U.screen === 'pick' ? pick() : U.screen === 'done' ? '<header class="rn-top"><div><span class="rn-eyebrow">HandyBros · Alex</span><h2>All done</h2></div><button class="rn-x" data-act="rn-exit" aria-label="Close runner">' + HB.icon('x', 22) + '</button></header><div class="rn-body">' + done(U.pid) + '</div>' : job()) + '</div>';
    hosts.forEach((h) => { HB.morph(h, html); });
    const clk = HB.clock(); HB.$$('.phone-clock').forEach((c) => { c.textContent = clk; });
  };
  HB.subs.push(HB.runnerRender);
  setInterval(() => { if (U.pid && U.screen === 'job') { const t = fmtT(elapsed(U.pid)); HB.$$('.rn-timer').forEach((e) => { e.textContent = t; }); } const c = HB.clock(); HB.$$('.demo-time,.phone-clock').forEach((e) => { e.textContent = c; }); }, 1000);

  /* ---------- actions ---------- */
  HB.act('rn-start', (el) => startJob(el.dataset.pid));
  HB.act('rn-back', () => { U.screen = 'pick'; U.sheet = null; U.cam = null; U.out = false; HB.emit(); });
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
  const addRoomShot = (pid, room, pick) => {
    const w = work(pid); const run = S().run[pid]; const old = w.rp[room];
    const ph = F.addRoomPhoto(pid, room, pick.src, { sample: pick.sample, kb: pick.kb, visit: F.runVisit(pid) || undefined });
    w.rp[room] = ph.id;
    run.photos = run.photos.filter((x) => x.fid !== old); run.photos.push({ src: pick.src, room, ts: Date.now(), sample: !!pick.sample, fid: ph.id });
    return ph;
  };
  HB.act('rn-photo', (el) => {
    const pid = U.pid; const ims = Array.from(el.files || []).filter((f) => /^image\//.test(f.type)).map((f) => ({ src: URL.createObjectURL(f), kb: Math.round(f.size / 1024) })); el.value = ''; if (!ims.length) return;
    HB.update((s) => { ims.forEach((im) => { if (F.rooms(pid).includes(el.dataset.room)) addRoomShot(pid, el.dataset.room, { src: im.src, sample: false, kb: im.kb }); else s.run[pid].photos.push({ src: im.src, room: el.dataset.room, ts: Date.now() }); }); });
    HB.toast(HB.plural(ims.length, 'photo') + ' added to ' + el.dataset.room, { icon: 'camera' });
  });
  HB.act('rn-flag', (el) => { U.sheet = { room: issueRooms(U.pid).includes(el.dataset.room) ? el.dataset.room : 'Whole property', sev: 'Needs fix', photos: [], note: '', ins: false }; HB.emit(); });
  HB.act('rn-sheet-x', () => { U.sheet = null; U.cam = null; HB.emit(); });
  HB.act('rn-sev', (el) => { U.sheet.sev = el.value; });
  HB.act('rn-ins', (el) => { U.sheet.ins = el.checked; });
  HB.act('rn-issue-rm', (el) => { U.sheet.photos.splice(Number(el.dataset.n), 1); HB.emit(); });
  /* simulated camera */
  HB.act('rn-cam', (el) => { U.cam = { kind: el.dataset.kind, key: el.dataset.key }; HB.emit(); const b = HB.$('.rn-cam .rn-pg button'); if (b) b.focus({ preventScroll: true }); });
  HB.act('rn-cam-x', () => { U.cam = null; HB.emit(); });
  const camGot = (pick) => {
    const pid = U.pid, k = U.cam; U.cam = null;
    HB.update(() => {
      if (k.kind === 'room') addRoomShot(pid, k.key, pick);
      else if (k.kind === 'check') { const c = work(pid).damage[k.key] || (work(pid).damage[k.key] = {}); c.src = pick.src; c.sample = pick.sample; }
      else if (U.sheet) U.sheet.photos.push(pick);
    });
    HB.toast(k.kind === 'room' ? 'Photo saved for ' + k.key + '. It replaces the last one when you check out.' : 'Photo attached', { icon: 'camera' });
  };
  HB.act('rn-cam-pick', (el) => camGot({ src: el.dataset.src, sample: true }));
  HB.act('rn-cam-file', (el) => { const f = el.files && el.files[0]; el.value = ''; if (!f || !/^image\//.test(f.type)) return; camGot({ src: URL.createObjectURL(f), sample: false, kb: Math.max(1, Math.round(f.size / 1024)) }); });
  /* damage check, utilities, consumables */
  HB.act('rn-dc', (el) => {
    const pid = U.pid, w = work(pid), id = el.dataset.id, v = el.dataset.v; const it = dmgItems(pid).find((x) => x.id === id);
    HB.update(() => { const c = w.damage[id] || (w.damage[id] = {}); c.st = c.st === v ? null : v; });
    if (w.damage[id].st === 'dmg' && !w.damage[id].inc) { U.sheet = { room: it.room, sev: 'Needs fix', photos: w.damage[id].src ? [{ src: w.damage[id].src, sample: w.damage[id].sample }] : [], note: 'Damage found: ' + it.text + '. ', ins: false, from: id }; HB.emit(); }
  });
  HB.act('rn-dc-report', (el) => { const pid = U.pid, w = work(pid), id = el.dataset.id; const it = dmgItems(pid).find((x) => x.id === id); const c = w.damage[id] || {}; U.sheet = { room: it.room, sev: 'Needs fix', photos: c.src ? [{ src: c.src, sample: c.sample }] : [], note: 'Damage found: ' + it.text + '. ', ins: false, from: id }; HB.emit(); });
  HB.act('rn-sec', (el) => {
    const x = work(U.pid).secure, k = el.dataset.k; if (k === 'heatOk' && !x.heatOk && x.heat !== 18) { HB.toast('Set the thermostat to 18°C first', { icon: 'alert' }); return; }
    HB.update(() => { x[k] = !x[k]; });
  });
  HB.act('rn-heat', (el) => { const x = work(U.pid).secure; HB.update(() => { x.heat = Math.max(5, Math.min(30, x.heat + Number(el.dataset.d))); if (x.heat !== 18) x.heatOk = false; }); });
  HB.act('rn-cons', (el) => { const w = work(U.pid); HB.update(() => { w.cons[el.dataset.id] = w.cons[el.dataset.id] === el.dataset.v ? null : el.dataset.v; }); });
  /* report an issue: raises an incident */
  HB.act('rn-issue', (el) => {
    const f = HB.formData(el); const pid = U.pid; const p = HB.prop(pid); const sh = U.sheet;
    if (f.note.trim().length < 3) { HB.toast('Say what is wrong', { icon: 'alert' }); return; }
    const id = HB.uid('is'); const tid = HB.uid('tk'); const note = f.note.trim(); let inc;
    const title = note.replace(/^Damage found: /, '').replace(/\s+/g, ' ').slice(0, 64);
    HB.update((s) => {
      inc = F.raise({ pid, room: f.room, sev: f.sev || 'Needs fix', title, found: note, insurance: !!f.ins, who: 'Alex', photos: sh.photos, visit: F.runVisit(pid) || undefined });
      s.run[pid].issues.push({ id, room: f.room, note, sev: f.sev || 'Needs fix', src: sh.photos[0] ? sh.photos[0].src : null, sample: sh.photos[0] ? sh.photos[0].sample : false, ts: Date.now(), taskId: tid, incidentId: inc.id });
      s.tasks.unshift({ id: tid, pid, title: note.slice(0, 64), room: f.room, sev: f.sev || 'Needs fix', status: 'open', source: 'runner', at: Date.now() });
      s.history[pid].unshift({ date: HB.TODAY, type: 'issue', title: f.room + ': ' + note.slice(0, 50), detail: 'Raised during today\'s turnover as incident ' + inc.id + '. A maintenance task was created.', rep: null });
      if (sh.from) work(pid).damage[sh.from].inc = inc.id;
    });
    U.sheet = null; HB.emit(); HB.toast(inc.id + ' raised for ' + p.short + '. Photos pinned as proof.', { icon: 'pinned' });
  });
  /* check in and out */
  const checkOut = (pid) => {
    const v = F.runVisit(pid) || F.checkIn(pid, 'Alex'); if (v.outAt) return v; const s = S();
    v.outAt = Date.now(); const mins = Math.max(1, Math.round((v.outAt - v.inAt) / 60000)); const R = s.rates; const ret = HB.onClub(pid); const rate = R.hourly;
    const billed = Math.max(15, Math.ceil(mins / 15) * 15); const gross = HB.r2(billed / 60 * rate); const amount = ret ? HB.r2(gross - HB.retainedOff(gross)) : gross; const p = HB.prop(pid); const id = 'INV-' + (1300 + F.st().invoiceDrafts.length);
    s.invoices.unshift({ id, ownerId: p.ownerId, date: HB.TODAY, desc: 'Time on site, ' + p.short + ', ' + HB.dur(mins / 60) + ' (' + (ret ? 'retained rate, discount to confirm' : 'hourly rate') + ')', amount, status: 'Draft', kind: 'job', month: 5, auto: true });
    F.st().invoiceDrafts.push({ id, visitId: v.id, pid, mins, billed, rate, amount });
    v.invoiceId = id; v.mins = mins; v.res = F.commit(v); return v;
  };
  HB.act('rn-checkin', () => { const pid = U.pid; HB.update((s) => { const run = s.run[pid]; if (!run.started) run.started = Date.now(); F.checkIn(pid, 'Alex'); }); HB.toast('Checked in at ' + HB.clock(), { icon: 'clock' }); });
  HB.act('rn-out', () => { U.out = true; HB.emit(); });
  HB.act('rn-out-x', () => { U.out = false; HB.emit(); });
  HB.act('rn-out-ok', () => {
    const pid = U.pid; let v; HB.update(() => { v = checkOut(pid); }); U.out = false; HB.emit();
    const inv = F.st().invoiceDrafts.find((x) => x.id === v.invoiceId);
    HB.toast('Checked out. Draft invoice line created from time on site: ' + HB.money(inv.amount), { icon: 'card', ms: 4800 });
  });
  HB.act('rn-complete', () => {
    const pid = U.pid; const pr = HB.progress(pid); if (pr.pct < 100) { HB.toast('Finish the checklist first, or tick everything left', { icon: 'alert' }); return; }
    const p = HB.prop(pid); const run = S().run[pid]; const d = diffs(pid); const mins = Math.max(1, Math.round(elapsed(pid) / 60000)); const clk = HB.clock();
    const score = Math.max(80, Math.min(99, 100 - run.issues.length * 3 - d.length * 2 - (mins > 150 ? 2 : 0) - 1));
    const photos = run.photos;
    const rep = { id: 'rp-' + pid + '-t', pid, date: HB.TODAY, time: clk, by: p.who, mins, score, sent: true, rooms: HB.rooms(pid).map((r) => { const rp = HB.roomProgress(pid, r); return { room: r.name, done: rp.done, total: rp.total }; }), issues: run.issues.map((i) => ({ title: i.note.length > 46 ? i.note.slice(0, 44) + '…' : i.note, note: i.note, sev: i.sev, src: i.src, sample: i.sample })), diffs: d, before: photos.length ? photos[0].src : p.img, after: photos.length > 1 ? photos[photos.length - 1].src : p.img, evidence: [] };
    HB.update((s) => {
      s.reports = s.reports.filter((r) => r.id !== rep.id); s.reports.unshift(rep);
      checkOut(pid); run.finished = Date.now(); s.turn[pid] = { status: 'Guest-ready', at: clk };
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
    const pid = el.dataset.pid; const st = F.st();
    HB.update((s) => {
      const run = s.run[pid]; const v = F.runVisit(pid);
      if (v) { s.invoices = s.invoices.filter((i) => i.id !== v.invoiceId); st.invoiceDrafts = st.invoiceDrafts.filter((i) => i.visitId !== v.id); if (!v.committed) F.undoVisit(v); else v.inAt = null; }
      delete st.work[pid];
      run.done = {}; run.started = null; run.finished = null; run.photos = []; run.issues = []; run.counts = {}; s.turn[pid] = { status: 'Checked out' }; s.tasks = s.tasks.filter((t) => !(t.pid === pid && t.source === 'runner')); (s.todos[pid] || []).forEach((t) => { t.finished = false; }); s.reports = s.reports.filter((r) => r.id !== 'rp-' + pid + '-t');
    });
    U.screen = 'pick'; HB.emit(); HB.toast('Turnover reset for the demo');
  });
  /* ---------- keep the demo state in this browser ----------
     Photos, incidents, ticks and visits survive a reload. Pictures you add are shrunk to at most
     800px on the long side (JPEG, quality 0.6) before they are stored; sample pictures are kept
     by file name. Every storage call is guarded, so a blocked or full store never breaks the page. */
  (function () {
    const KEY = 'hb.demo.state.v1', CAP = 3400000, KEYS = ['field', 'run', 'turn', 'invoices', 'tasks', 'reports', 'todos', 'notifs', 'docs', 'inventory'];
    const FIXED = new Date(2026, 9, 29, 14, 20, 0).getTime();
    const bootAt = () => Date.now() - (HB.now().getTime() - FIXED);
    const SCREENS = ['pick', 'job', 'done'];
    const HOLD = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#e7e2d6"/><text x="200" y="154" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#5a6670">Photo not kept</text></svg>');
    let off = false, timer = 0, lastOut = '', warned = false;
    const cache = Object.create(null), busy = Object.create(null);
    const seedFp = () => JSON.stringify([S().props.map((p) => p.id), S().field.photos.length, S().field.incidents.length, S().field.visits.length]);
    const fp = seedFp();
    const ls = { get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }, set(v) { try { localStorage.setItem(KEY, v); return true; } catch (e) { return false; } }, del() { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } } };

    /* ---- shrink a picture the user added ---- */
    function shrink(url) {
      return fetch(url).then((r) => r.blob()).then((b) => (window.createImageBitmap ? createImageBitmap(b) : new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = url; }))).then((im) => {
        const w = im.width || im.naturalWidth, h = im.height || im.naturalHeight; const k = Math.min(1, 800 / Math.max(w, h, 1));
        const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
        const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height);
        const out = c.toDataURL('image/jpeg', 0.6); return out && out.length > 40 ? out : HOLD;
      }).catch(() => HOLD);
    }
    function want(url) {
      if (cache[url] !== undefined || busy[url]) return;
      busy[url] = true;
      shrink(url).then((v) => { cache[url] = v; delete busy[url]; schedule(); });
    }

    /* ---- write ---- */
    function build() {
      const snap = { v: 1, fp, boot: bootAt(), s: {}, fld: { pid: HB.ui.fld.pid, pending: HB.ui.fld.pending, uploads: HB.ui.fld.uploads }, rn: { screen: U.screen, pid: U.pid, tab: U.tab, open: U.open } };
      KEYS.forEach((k) => { if (S()[k] !== undefined) snap.s[k] = S()[k]; });
      let waiting = false; const table = [], at = Object.create(null);
      const json = JSON.stringify(snap, (k, v) => {
        if (typeof v !== 'string') return v;
        if (v.indexOf('blob:') === 0) { if (cache[v] === undefined) { waiting = true; want(v); return null; } v = cache[v]; }
        if (v.indexOf('data:image/') === 0 && v.length > 200) { if (at[v] === undefined) { at[v] = table.length; table.push(v); } return '@@img:' + at[v]; }
        return v;
      });
      if (waiting) return null;
      return { json, table };
    }
    function pack(b, drop) { return JSON.stringify({ t: b.table.map((x, i) => (i < drop ? HOLD : x)), d: b.json }); }
    function save() {
      timer = 0; if (off) return;
      try {
        const b = build(); if (!b) return;
        let drop = 0, out = pack(b, 0);
        while (out.length > CAP && drop < b.table.length) { drop++; out = pack(b, drop); }
        if (out === lastOut) return;
        if (ls.set(out)) { lastOut = out; return; }
        if (drop < b.table.length && ls.set(pack(b, b.table.length))) { lastOut = out; return; }
        if (!warned) { warned = true; try { HB.toast('This browser has no room to keep your changes after a reload.', { icon: 'alert' }); } catch (e) { /* ignore */ } }
      } catch (e) { /* never block the page */ }
    }
    function schedule() { if (off) return; clearTimeout(timer); timer = setTimeout(save, 350); }
    HB.subs.push(schedule);
    const flush = () => { if (timer) { clearTimeout(timer); save(); } };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });

    /* a stored picture becomes an object URL again, so every screen treats it like a fresh upload */
    const blobOf = Object.create(null);
    function toBlob(d) {
      if (blobOf[d]) return blobOf[d];
      try {
        const i = d.indexOf(','), head = d.slice(5, i), body = d.slice(i + 1); let bytes;
        if (/;base64/.test(head)) { const bin = atob(body); bytes = new Uint8Array(bin.length); for (let n = 0; n < bin.length; n++) bytes[n] = bin.charCodeAt(n); }
        else bytes = new TextEncoder().encode(decodeURIComponent(body));
        const u = URL.createObjectURL(new Blob([bytes], { type: head.split(';')[0] })); cache[u] = d; blobOf[d] = u; return u;
      } catch (e) { return d; }
    }

    /* ---- read, in place so earlier references stay valid ---- */
    const put = (cur, val) => {
      if (Array.isArray(cur) && Array.isArray(val)) { cur.length = 0; val.forEach((x) => cur.push(x)); return cur; }
      if (cur && typeof cur === 'object' && !Array.isArray(cur) && val && typeof val === 'object' && !Array.isArray(val)) { Object.keys(cur).forEach((x) => { delete cur[x]; }); Object.assign(cur, val); return cur; }
      return val;
    };
    function restore() {
      let raw = ls.get(); if (!raw) return;
      try {
        const w = JSON.parse(raw); const inner = JSON.parse(w.d); if (!inner || inner.v !== 1 || inner.fp !== fp) { ls.del(); return; }
        const delta = bootAt() - (Number(inner.boot) || bootAt());
        const fix = (x) => {
          if (typeof x === 'string') { const m = /^@@img:(\d+)$/.exec(x); return m ? toBlob(w.t[Number(m[1])] || HOLD) : x; }
          if (typeof x === 'number') return x > 1e12 ? x + delta : x;
          if (Array.isArray(x)) return x.map(fix);
          if (x && typeof x === 'object') { const o = {}; Object.keys(x).forEach((k) => { o[k] = fix(x[k]); }); return o; }
          return x;
        };
        const data = fix(inner);
        KEYS.forEach((k) => { if (data.s && data.s[k] !== undefined && S()[k] !== undefined) S()[k] = put(S()[k], data.s[k]); });
        if (data.fld) { const f = HB.ui.fld; if (typeof data.fld.pid === 'string' && HB.prop(data.fld.pid)) f.pid = data.fld.pid; put(f.pending, data.fld.pending || {}); put(f.uploads, data.fld.uploads || {}); }
        const r = data.rn;
        if (r && SCREENS.indexOf(r.screen) >= 0 && (r.screen === 'pick' || (typeof r.pid === 'string' && S().run[r.pid]))) { U.screen = r.screen; U.pid = r.screen === 'pick' ? null : r.pid; if (typeof r.tab === 'string') U.tab = r.tab; U.open = typeof r.open === 'string' ? r.open : null; }
        lastOut = raw;
      } catch (e) { ls.del(); }
    }
    restore();

    /* ---- clear everything and start again from the sample data ---- */
    HB.resetDemo = () => { off = true; clearTimeout(timer); ls.del(); try { location.reload(); } catch (e) { off = false; } };
  })();
})();
