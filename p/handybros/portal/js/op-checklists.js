/* op-checklists: per-property cleaning and property-check lists, with frequency, included or extra, and scheduling */
(function () {
  const S = () => HB.S;
  const r2 = (n) => Math.round(n * 100) / 100;
  /* the turnover checklists as first loaded: the starting point for every property */
  const BASE = JSON.parse(JSON.stringify(S().checklist || {}));
  if (!document.getElementById('walk-css')) {
    const l = document.createElement('link'); l.id = 'walk-css'; l.rel = 'stylesheet'; l.href = 'css/walk.css'; document.head.appendChild(l);
  }

  const FREQ = [['every', 'Every booking'], ['weekly', 'Weekly'], ['monthly', 'Monthly'], ['quarterly', 'Quarterly'], ['sixmonthly', 'Six-monthly'], ['yearly', 'Yearly']];
  const FQ = { every: 'Every booking', weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', sixmonthly: 'Six-monthly', yearly: 'Yearly' };
  const PC = { weekly: 52, monthly: 12, quarterly: 4, sixmonthly: 2, yearly: 1 };
  const SCHED = { together: 'With the cleaning visit', own: 'Own check visit' };
  const KINDS = [['clean', 'Cleaning'], ['check', 'Property check']];
  const BURN = /kettle|toaster|air ?fryer|\btv\b|television|remote|batter/i;
  const bedKey = (b) => (Number(b) === 0 ? 'studio' : Math.min(5, Number(b) || 1));
  const basePrice = (beds) => S().rates.changeover[bedKey(beds)];

  /* ---------- seeded content ---------- */
  const mk = (kind) => (text, o) => Object.assign({ id: HB.uid('t'), text, freq: 'every', kind, incl: true, price: 0, sched: 'together' }, o || {});
  const room = (name, tasks, id) => ({ id: id || HB.uid('r'), name, tasks });

  function periodic(clean, check, o) {
    const R = S().rates; const c = mk('clean'); const k = mk('check');
    clean.filter((r) => /^Kitchen/.test(r.name)).forEach((r) => {
      if (o.oven) r.tasks.push(c('Deep clean the oven, hob and extractor filter', { freq: o.oven.freq || 'monthly', incl: false, price: R.oven }));
      r.tasks.push(c('Defrost and deep clean the fridge and freezer', { freq: 'monthly' }));
    });
    clean.filter((r) => /^Bathroom/.test(r.name)).forEach((r) => r.tasks.push(c('Descale taps, shower head and screen (limescale)', { freq: 'monthly' })));
    clean.filter((r) => /^Bedroom/.test(r.name)).forEach((r) => r.tasks.push(c('Rotate the mattress and wash the protector', { freq: 'quarterly' })));
    clean.push(room('Outside and building', [
      c('Clear gutters and downpipes', { freq: 'yearly', incl: false, price: r2(R.hourly * 2), sched: 'own' }),
      c('Jet-wash the decking and patio', { freq: 'yearly', incl: false, price: r2(R.hourly * 3), sched: 'own' }),
      c('Wash the outside of windows and frames', { freq: 'sixmonthly', sched: 'own' })
    ]));
    check.unshift(room('Before cleaning: places guests hide damage', [
      k('Bed: check slats, frame, headboard fixings and under the mattress'),
      k('Mattress and protector: stains, burns, tears'),
      k('Sofa and chair seats: lift every cushion, check seams, springs and frames'),
      k('Hardware: door handles, hinges, locks, cabinet doors and drawer runners'),
      k('Curtain poles, blinds, towel rails and toilet seat fixings'),
      k('Inside drawers, wardrobes and bedside cabinets'),
      k('Behind and under furniture: marks, holes and loose plaster'),
      k('Walls, skirting and paintwork: scuffs, burns and nail holes'),
      k('Glass, mirrors and picture frames: cracks and chips'),
      k('Appliances: inside the oven, microwave, dishwasher and washing machine seal'),
      k('Take dated photos of anything found before cleaning starts')
    ]));
    check.push(room('Utility protection', [
      k('Heating set to 18 degrees (thermostat and radiator valves)'),
      k('All windows locked with trickle vents open'),
      k('Taps off, no drips, no running toilet'),
      k('Appliances off at the socket except the fridge and router'),
      k('Look for damp, condensation and mould, and note it')
    ]));
    check.push(room('Safety round', [
      k('Press-test every smoke and CO alarm and log the result', { freq: 'quarterly', sched: 'own' }),
      k('Walk the outside: gates, fences, bins and key safe', { freq: 'quarterly', sched: 'own' }),
      k('Fire blanket and extinguisher in place and in date', { freq: 'sixmonthly', sched: 'own' }),
      k('Photograph the meter readings', { freq: 'monthly' })
    ]));
  }

  function seedProperty(pid) {
    const clean = (BASE[pid] || S().checklist[pid] || []).map((r) => room(r.name, r.tasks.map((t) => Object.assign({}, t, { freq: 'every', kind: 'clean', incl: true, price: 0, sched: 'together' })), r.id));
    const check = [room('High-burn items', [
      mk('check')('Test the kettle, toaster and air fryer; descale and clear crumbs'),
      mk('check')('Check the TV and every remote; replace batteries'),
      mk('check')('Count spare batteries and bulbs')
    ])];
    periodic(clean, check, { oven: { freq: 'monthly' } });
    return { clean, check, meta: { cpm: 8, visit: S().rates.hourly } };
  }

  const CLEAN_BY = {
    kitchen: ['Empty bins and replace liners', 'Wipe worktops, hob and sink', 'Clean the microwave and oven front', 'Run and empty the dishwasher', 'Restock tea, coffee and washing-up liquid'],
    living: ['Vacuum and mop the floor', 'Dust surfaces and shelves', 'Plump cushions and fold throws'],
    bed: ['Strip the bed and bag used linen', 'Make the bed with a fresh linen set', 'Check under the bed and in the wardrobe', 'Set out towels and a spare pillow'],
    bath: ['Disinfect toilet, sink and shower', 'Fresh towels and bath mat', 'Restock toiletries and loo roll'],
    other: ['Dust, vacuum or mop', 'Check for guest left-behind items']
  };
  const roomKey = (n) => (/kitchen/i.test(n) ? 'kitchen' : /living|lounge|sitting/i.test(n) ? 'living' : /bed/i.test(n) ? 'bed' : /bath|shower|wc|toilet/i.test(n) ? 'bath' : 'other');

  function fromWalk(w) {
    const c = mk('clean'); const k = mk('check');
    const clean = [room('Arrival', [c('Photograph the property as found'), c('Open windows and note any left-behind items')])];
    w.rooms.forEach((r) => {
      const tasks = CLEAN_BY[roomKey(r.name)].map((t) => c(t));
      const n = r.items.reduce((a, i) => a + (Number(i.qty) || 0), 0);
      if (r.items.length) tasks.push(c('Count the ' + n + ' inventory items against the list (' + r.items.length + ' lines)'));
      clean.push(room(r.name, tasks));
    });
    clean.push(room('Safety and finish', [c('Final walk-through and after photo'), c('Lock up and check windows')]));
    const check = []; const burn = []; const watch = [];
    w.rooms.forEach((r) => r.items.forEach((i) => {
      if (i.burn) burn.push(k('Test ' + i.name.toLowerCase() + ' in the ' + r.name.toLowerCase() + '; replace if failing'));
      if (i.cond === 'worn' || i.cond === 'damaged') watch.push(k('Re-check the ' + i.name.toLowerCase() + ' in the ' + r.name.toLowerCase() + ' (found ' + i.cond + ')'));
    }));
    if (burn.length) check.push(room('High-burn items', burn));
    if (watch.length) check.push(room('Condition watch from the walk-through', watch));
    periodic(clean, check, { oven: w.svc.oven ? { freq: w.svc.ovenFreq === 'visit' ? 'every' : w.svc.ovenFreq === 'quarter' ? 'quarterly' : 'monthly' } : null });
    return { clean, check, meta: { cpm: w.prop.cpm, visit: S().rates.hourly } };
  }

  /* ---------- store ---------- */
  S().lists = S().lists || {};
  S().prospects = S().prospects || [];
  function info(pid) {
    const p = S().props.find((x) => x.id === pid);
    if (p) return { id: p.id, name: p.name, short: p.short, town: p.town, beds: p.beds, img: p.img, owner: HB.owner(p.ownerId).name, ownerId: p.ownerId, prospect: false };
    const w = S().prospects.find((x) => x.id === pid);
    return w ? Object.assign({ prospect: true, ownerId: null }, w) : null;
  }
  function get(pid) {
    if (!S().lists[pid]) S().lists[pid] = seedProperty(pid);
    return S().lists[pid];
  }
  function stats(pid) {
    const L = get(pid); const inf = info(pid); const V = L.meta.cpm * 12; const R = S().rates;
    const all = []; ['clean', 'check'].forEach((kd) => L[kd].forEach((r) => r.tasks.forEach((t) => all.push({ t, room: r.name, list: kd }))));
    const cad = all.filter((x) => x.t.sched === 'own' && x.t.freq !== 'every').map((x) => PC[x.t.freq]);
    const OV = cad.length ? Math.max.apply(null, cad) : 0;
    const occ = (t) => (t.sched === 'own' ? (t.freq === 'every' ? OV : PC[t.freq]) : t.freq === 'every' ? V : Math.min(PC[t.freq], V));
    let together = 0; let own = 0; let perVisit = 0; let inclN = 0; let extraN = 0; let extraMonthly = 0;
    const byFreq = {}; const extras = [];
    all.forEach((x) => {
      const o = occ(x.t);
      if (x.t.sched === 'own') own += o; else together += o;
      if (x.t.sched === 'together' && x.t.freq === 'every') perVisit++;
      byFreq[x.t.freq] = (byFreq[x.t.freq] || 0) + 1;
      if (x.t.incl) inclN++; else { extraN++; if (Number(x.t.price) > 0) { extraMonthly += (Number(x.t.price) * o) / 12; extras.push({ t: x.t, room: x.room, occ: o, list: x.list }); } }
    });
    const base = basePrice(inf.beds) * L.meta.cpm;
    const visitCharge = OV > 0 ? (OV * (Number(L.meta.visit) || 0)) / 12 : 0;
    return { V, OV, together, own, perVisit, inclN, extraN, byFreq, extras, base, extraMonthly: r2(extraMonthly + visitCharge), taskExtraMonthly: r2(extraMonthly), visitCharge: r2(visitCharge), total: all.length, noPrice: all.filter((x) => !x.t.incl && !(Number(x.t.price) > 0)).length };
  }

  /* ---------- sync to the phone runner ----------
     Cleaning tasks that are due every booking become the runner's rooms and tasks for the property.
     Ids are kept, so ticks already made on a turnover survive an edit. Edits made to the turnover
     template on the property page are folded back into the cleaning list first. */
  const synced = {};
  const shape = (rs) => JSON.stringify(rs.map((r) => [r.id, r.name, r.tasks.map((t) => [t.id, t.text])]));
  const taskMap = (rs) => { const m = {}; rs.forEach((r) => r.tasks.forEach((t) => { m[t.id] = { room: r.id, name: r.name, text: t.text }; })); return m; };
  function foldIn(L, cl, prev) {
    const now = taskMap(cl);
    Object.keys(now).forEach((id) => {
      if (prev[id]) {
        if (prev[id].text !== now[id].text) L.clean.forEach((r) => r.tasks.forEach((t) => { if (t.id === id) t.text = now[id].text; }));
        return;
      }
      let rm = L.clean.find((r) => r.id === now[id].room);
      if (!rm) { rm = room(now[id].name, [], now[id].room); L.clean.push(rm); }
      rm.tasks.push(mk('clean')(now[id].text, { id }));
    });
    Object.keys(prev).forEach((id) => { if (!now[id]) L.clean.forEach((r) => { r.tasks = r.tasks.filter((t) => t.id !== id); }); });
  }
  function syncRunner() {
    try {
      S().props.forEach((p) => {
        const cl = S().checklist[p.id]; if (!cl) return;
        const L = get(p.id);
        if (synced[p.id] && shape(cl) !== synced[p.id].sig) foldIn(L, cl, synced[p.id].map);
        const rooms = L.clean.map((r) => ({ id: r.id, name: r.name, tasks: r.tasks.filter((t) => t.kind === 'clean' && t.freq === 'every').map((t) => ({ id: t.id, text: t.text })) })).filter((r) => r.tasks.length);
        if (shape(rooms) !== shape(cl)) { cl.length = 0; rooms.forEach((r) => cl.push(r)); }
        synced[p.id] = { sig: shape(rooms), map: taskMap(rooms) };
      });
    } catch (e) { console.error(e); }
  }
  HB.syncChecklist = syncRunner;
  HB.subs.unshift(syncRunner);
  syncRunner();

  HB.cl = { FREQ, FQ, PC, BURN, info, get, stats, fromWalk, basePrice, bedKey, mk };

  /* ---------- UI state ---------- */
  HB.ui.cl = { pid: null, kind: 'clean', open: null, filter: 'all', collapsed: {}, draft: {}, rename: null, newRoom: '', lastReq: null, tplClose: null };
  const U = () => HB.ui.cl;
  const cur = () => get(U().pid)[U().kind];
  const findRoom = (id) => cur().find((r) => r.id === id);
  const findTask = (id) => { for (const r of cur()) { const t = r.tasks.find((x) => x.id === id); if (t) return { t, r }; } return null; };
  const refocus = (sel) => setTimeout(() => { const e = HB.$(sel); if (e) e.focus({ preventScroll: true }); }, 70);
  const fid = () => (document.activeElement && document.activeElement.getAttribute ? document.activeElement.getAttribute('data-fid') : null);
  const fa = (id) => 'data-fid="' + id + '"' + (fid() === id ? '' : ' data-sync');
  const fqL = (f) => FQ[f] || f;

  /* ---------- built-in templates ---------- */
  const TPL = [
    { id: 'b-deep', name: 'Deep-clean schedule', kind: 'clean', about: 'Monthly oven, fridge and limescale; yearly gutters and decking', items: [
      { text: 'Deep clean the oven, hob and extractor filter', freq: 'monthly', incl: false, price: () => S().rates.oven }, { text: 'Defrost and deep clean the fridge and freezer', freq: 'monthly' },
      { text: 'Descale taps, shower head and screen (limescale)', freq: 'monthly' }, { text: 'Clear gutters and downpipes', freq: 'yearly', incl: false, price: () => r2(S().rates.hourly * 2), sched: 'own' },
      { text: 'Jet-wash the decking and patio', freq: 'yearly', incl: false, price: () => r2(S().rates.hourly * 3), sched: 'own' }] },
    { id: 'b-damage', name: 'Pre-clean damage check', kind: 'check', about: 'Bed slats, seats, hardware and the places guests hide damage', items: [
      { text: 'Bed: check slats, frame, headboard fixings and under the mattress' }, { text: 'Sofa and chair seats: lift every cushion, check seams and frames' },
      { text: 'Hardware: door handles, hinges, locks and drawer runners' }, { text: 'Inside drawers, wardrobes and bedside cabinets' }, { text: 'Behind and under furniture: marks and holes' }] },
    { id: 'b-util', name: 'Utility protection', kind: 'check', about: 'Heating at 18 degrees, windows locked, trickle vents open', items: [
      { text: 'Heating set to 18 degrees (thermostat and radiator valves)' }, { text: 'All windows locked with trickle vents open' }, { text: 'Taps off, no drips, no running toilet' }] },
    { id: 'b-safety', name: 'Quarterly safety round', kind: 'check', about: 'Alarm test, fire kit and the outside walk-round', items: [
      { text: 'Press-test every smoke and CO alarm and log the result', freq: 'quarterly', sched: 'own' }, { text: 'Fire blanket and extinguisher in place and in date', freq: 'sixmonthly', sched: 'own' },
      { text: 'Walk the outside: gates, fences, bins and key safe', freq: 'quarterly', sched: 'own' }] }
  ];
  const allTpl = () => TPL.concat(S().templates.map((t) => ({ id: t.id, name: t.name, kind: 'clean', about: t.items.length + ' tasks from your saved templates', items: t.items })));

  /* ---------- rendering ---------- */
  function chipsFor(t) {
    const price = t.incl ? '<span class="ck-chip inc">Included</span>' : Number(t.price) > 0 ? '<span class="ck-chip ext">Extra ' + HB.money(t.price) + '</span>' : '<span class="ck-chip warn">Extra, add a price</span>';
    return '<span class="ck-chip fq f-' + t.freq + '">' + fqL(t.freq) + '</span>' + price + '<span class="ck-chip sch s-' + t.sched + '">' + HB.icon(t.sched === 'own' ? 'calendar' : 'link', 13) + SCHED[t.sched] + '</span>';
  }
  function taskEditor(t) {
    const id = t.id;
    return '<div class="ck-edit" role="group" aria-label="Edit task"><label class="fld" style="grid-column:1/-1">Task<input type="text" ' + fa('tx-' + id) + ' value="' + HB.esc(t.text) + '" data-input="cl-tf" data-f="text" data-t="' + id + '" maxlength="140"></label>' +
      '<label class="fld">How often<select data-change="cl-tf" data-f="freq" data-t="' + id + '" data-sync>' + FREQ.map((f) => '<option value="' + f[0] + '"' + (t.freq === f[0] ? ' selected' : '') + '>' + f[1] + '</option>').join('') + '</select></label>' +
      '<div class="fld"><span id="inc-' + id + '">In the price?</span><div class="seg" role="group" aria-labelledby="inc-' + id + '"><button type="button" data-act="cl-incl" data-t="' + id + '" data-v="1" aria-pressed="' + t.incl + '">Included</button><button type="button" data-act="cl-incl" data-t="' + id + '" data-v="0" aria-pressed="' + !t.incl + '">Extra</button></div></div>' +
      (t.incl ? '<div class="fld"><span>Extra price</span><span class="muted" style="min-height:46px;display:flex;align-items:center;font-weight:450">None, covered by the visit price</span></div>'
        : '<label class="fld"><span>Extra price, £ each time' + (Number(t.price) > 0 ? '' : ' <small>needs a price</small>') + '</span><input type="number" min="0" step="0.01" inputmode="decimal" ' + fa('pr-' + id) + ' value="' + (Number(t.price) || '') + '" placeholder="0.00" data-input="cl-tf" data-f="price" data-t="' + id + '"' + (Number(t.price) > 0 ? '' : ' aria-invalid="true"') + '></label>') +
      '<label class="fld">Schedule with<select data-change="cl-tf" data-f="sched" data-t="' + id + '" data-sync><option value="together"' + (t.sched === 'together' ? ' selected' : '') + '>' + SCHED.together + '</option><option value="own"' + (t.sched === 'own' ? ' selected' : '') + '>' + SCHED.own + '</option></select></label>' +
      '<div class="row wrap" style="grid-column:1/-1;justify-content:space-between"><button class="btn btn-ghost btn-sm" data-act="cl-open" data-t="' + id + '">' + HB.icon('check', 16) + 'Done</button><button class="btn btn-danger btn-sm" data-act="cl-del" data-t="' + id + '">' + HB.icon('trash', 16) + 'Remove task</button></div></div>';
  }
  const passes = (t) => { const f = U().filter; return f === 'all' || (f === 'extras' && !t.incl) || (f === 'periodic' && t.freq !== 'every') || (f === 'own' && t.sched === 'own'); };
  function roomCard(r, ri, n) {
    const u = U(); const col = !!u.collapsed[r.id]; const shown = r.tasks.filter(passes);
    if (u.filter !== 'all' && !shown.length) return '';
    const head = u.rename === r.id
      ? '<label class="sr" for="rn-' + r.id + '">Room name</label><input class="ck-rn" id="rn-' + r.id + '" type="text" ' + fa('rn-' + r.id) + ' value="' + HB.esc(r.name) + '" data-change="cl-rename" data-r="' + r.id + '" maxlength="60">'
      : '<h3>' + HB.esc(r.name) + '</h3>';
    const rows = shown.map((t) => {
      const ti = r.tasks.indexOf(t); const open = u.open === t.id;
      return '<li class="ck-task' + (open ? ' open' : '') + '"><div class="ck-row"><button class="ck-main" data-act="cl-open" data-t="' + t.id + '" aria-expanded="' + open + '"><span class="ck-tx">' + HB.esc(t.text) + '</span></button><span class="ck-meta">' + chipsFor(t) + '</span>' +
        '<span class="ck-acts"><button class="ck-ib" data-act="cl-tmove" data-t="' + t.id + '" data-d="-1" aria-label="Move up: ' + HB.esc(t.text) + '"' + (ti === 0 ? ' disabled' : '') + '>' + HB.icon('arrow-up', 16) + '</button><button class="ck-ib" data-act="cl-tmove" data-t="' + t.id + '" data-d="1" aria-label="Move down: ' + HB.esc(t.text) + '"' + (ti === r.tasks.length - 1 ? ' disabled' : '') + '>' + HB.icon('arrow-down', 16) + '</button><button class="ck-ib" data-act="cl-del" data-t="' + t.id + '" aria-label="Remove: ' + HB.esc(t.text) + '">' + HB.icon('trash', 16) + '</button></span></div>' + (open ? taskEditor(t) : '') + '</li>';
    }).join('');
    return '<section class="ck-room' + (col ? ' col' : '') + '" aria-label="' + HB.esc(r.name) + '"><header class="ck-rh"><button class="ck-tog" data-act="cl-collapse" data-r="' + r.id + '" aria-expanded="' + !col + '" aria-label="' + (col ? 'Expand ' : 'Collapse ') + HB.esc(r.name) + '">' + HB.icon(col ? 'chev-r' : 'chev-d', 18) + '</button>' + head +
      '<span class="mono muted ck-n">' + r.tasks.length + '</span><span class="sp"></span>' +
      '<button class="ck-ib" data-act="cl-rrename" data-r="' + r.id + '" aria-label="Rename ' + HB.esc(r.name) + '">' + HB.icon('edit', 16) + '</button><button class="ck-ib" data-act="cl-rmove" data-r="' + r.id + '" data-d="-1" aria-label="Move ' + HB.esc(r.name) + ' up"' + (ri === 0 ? ' disabled' : '') + '>' + HB.icon('arrow-up', 16) + '</button><button class="ck-ib" data-act="cl-rmove" data-r="' + r.id + '" data-d="1" aria-label="Move ' + HB.esc(r.name) + ' down"' + (ri === n - 1 ? ' disabled' : '') + '>' + HB.icon('arrow-down', 16) + '</button><button class="ck-ib" data-act="cl-rdel" data-r="' + r.id + '" aria-label="Remove room ' + HB.esc(r.name) + '">' + HB.icon('trash', 16) + '</button></header>' +
      (col ? '' : '<ul class="ck-list">' + (rows || '<li class="ck-none">No tasks yet.</li>') + '</ul><form class="ck-add" data-submit="cl-tadd" data-r="' + r.id + '"><label class="sr" for="ad-' + r.id + '">Add a task to ' + HB.esc(r.name) + '</label><input id="ad-' + r.id + '" type="text" data-draft="' + r.id + '" ' + fa('ad-' + r.id) + ' value="' + HB.esc(u.draft[r.id] || '') + '" data-input="cl-draft" data-r="' + r.id + '" placeholder="Add a task, press Enter" maxlength="140" autocomplete="off"><button class="btn btn-ghost btn-sm" type="submit">' + HB.icon('plus', 16) + 'Add</button></form>') + '</section>';
  }
  function summary(pid) {
    const st = stats(pid); const L = get(pid); const inf = info(pid); const u = U();
    const tot = st.base + st.extraMonthly || 1;
    const row = (label, val, sub) => '<div class="ck-stat"><div><b>' + label + '</b>' + (sub ? '<span>' + sub + '</span>' : '') + '</div><strong class="mono">' + val + '</strong></div>';
    return '<aside class="ck-sum sheet pad" aria-label="Plan summary"><div class="sec-head"><h2>Next 12 months</h2><span class="tag">Plan</span></div>' +
      '<div class="ck-assume"><span id="cpm-l">Changeovers a month</span><div class="stepper" role="group" aria-labelledby="cpm-l"><button data-act="cl-cpm" data-d="-1" aria-label="Fewer changeovers a month">' + HB.icon('minus', 16) + '</button><output>' + L.meta.cpm + '</output><button data-act="cl-cpm" data-d="1" aria-label="More changeovers a month">' + HB.icon('plus', 16) + '</button></div></div>' +
      '<table class="ck-vtbl"><caption class="sr">Visits and tasks due in the next 12 months</caption><thead><tr><th scope="col">Visit type</th><th scope="col" class="r">Visits</th><th scope="col" class="r">Tasks due</th></tr></thead><tbody>' +
      '<tr><th scope="row"><i class="dot a"></i>Cleaning visit</th><td class="r mono">' + st.V + '</td><td class="r mono">' + st.together.toLocaleString('en-GB') + '</td></tr>' +
      '<tr><th scope="row"><i class="dot b"></i>Own check visit</th><td class="r mono">' + st.OV + '</td><td class="r mono">' + st.own.toLocaleString('en-GB') + '</td></tr></tbody></table>' +
      '<p class="muted ck-hint" style="margin-top:10px">A typical cleaning visit is ' + HB.plural(st.perVisit, 'task') + ', plus the monthly, quarterly and yearly jobs as they fall due.</p>' +
      '<hr class="divider">' +
      '<div class="sec-head" style="margin-bottom:6px"><h2>Each month</h2></div>' +
      row('Included package', HB.money(st.base), L.meta.cpm + ' changeovers at ' + HB.money(basePrice(inf.beds))) +
      row('Extras', HB.money(st.extraMonthly), HB.plural(st.extraN, 'extra task') + (st.visitCharge ? ' and check visits' : '')) +
      '<div class="ck-split" role="img" aria-label="Share of the monthly total that is included and extra"><i class="a" style="width:' + Math.round(st.base / tot * 100) + '%"></i><i class="b" style="width:' + Math.round(st.extraMonthly / tot * 100) + '%"></i></div>' +
      '<div class="ck-leg"><span><i class="dot a"></i>Included ' + Math.round(st.base / tot * 100) + '%</span><span><i class="dot b"></i>Extra ' + Math.round(st.extraMonthly / tot * 100) + '%</span></div>' +
      (st.OV ? '<label class="fld" style="margin-top:12px"><span>Price of a separate check visit, £</span><input type="number" min="0" step="0.01" inputmode="decimal" ' + fa('visit') + ' value="' + (Number(L.meta.visit) || '') + '" data-input="cl-visit"><small>One hour at the hourly rate until you set it.</small></label>' : '') +
      '<button class="btn btn-primary btn-block" style="margin-top:16px" data-act="cl-quote"' + (st.extras.length || st.OV ? '' : ' aria-disabled="true"') + '>' + HB.icon('quote', 18) + 'Extras to quote' + (st.extras.length ? ' (' + st.extras.length + ')' : '') + '</button>' +
      (st.noPrice ? '<p class="ck-warnline">' + HB.icon('alert', 15) + HB.plural(st.noPrice, 'extra task') + ' still need a price.</p>' : '') +
      (u.lastReq && HB.req(u.lastReq) ? '<a class="ck-link" href="#/op/quotes/' + u.lastReq + '">' + HB.icon('arrow-r', 15) + 'Open the quote request</a>' : '') +
      '<p class="footnote" style="margin-top:12px">' + HB.rateChip + ' Extra prices for gutters and decking are the hourly rate times an estimated time. All of this is a draft until the owner confirms the rate card.</p></aside>';
  }
  function chooser() {
    const all = S().props.map((p) => info(p.id)).concat(S().prospects.map((p) => info(p.id)));
    const cards = all.map((x) => {
      const L = get(x.id); const st = stats(x.id);
      return '<a class="ck-card" href="#/op/checklists/' + x.id + '"><span class="ck-cimg">' + (x.img ? '<img src="' + HB.photo(x.img) + '" alt="" loading="lazy">' : '') + '</span><span class="ck-cb"><span class="row wrap" style="gap:6px">' + (x.prospect ? HB.chip('From a walk-through', 'brand') : '') + '</span><b>' + HB.esc(x.name) + '</b><span class="muted">' + HB.esc(x.town) + ', ' + (x.beds === 0 ? 'studio' : x.beds + ' bed') + ' · ' + HB.esc(x.owner) + '</span>' +
        '<span class="ck-counts"><span><b class="mono">' + L.clean.reduce((a, r) => a + r.tasks.length, 0) + '</b> cleaning</span><span><b class="mono">' + L.check.reduce((a, r) => a + r.tasks.length, 0) + '</b> property check</span><span><b class="mono">' + st.extraN + '</b> extras</span></span></span></a>';
    }).join('');
    return HB.pageHead('Checklists', 'Two lists for every property: clean it, then check it.', 'The crew who clean are often the same people who check for damage. Build each list room by room, set how often each task is due, whether it is in the price, and whether it rides along with the clean or gets its own visit.',
      '<a class="btn btn-primary" href="#/op/walkthrough">' + HB.icon('pin', 18) + 'New walk-through quote</a>') + '<div class="ck-cards">' + cards + '</div>';
  }

  HB.view('op.checklists', {
    title: () => 'Checklists',
    render(params) {
      const pid = params && params.id;
      if (!pid) return chooser();
      const inf = info(pid);
      if (!inf) return HB.empty('list', 'No such property', 'Pick a property to see its checklists.', '<a class="btn btn-primary" href="#/op/checklists">Choose a property</a>');
      const u = U(); if (u.pid !== pid) { u.pid = pid; u.open = null; u.rename = null; u.filter = 'all'; u.collapsed = {}; u.draft = {}; }
      const L = get(pid); const rooms = L[u.kind];
      const opts = S().props.concat(S().prospects).map((p) => '<option value="' + p.id + '"' + (p.id === pid ? ' selected' : '') + '>' + HB.esc(p.short || p.name) + '</option>').join('');
      const tabs = '<div class="tabs ck-tabs" role="tablist" aria-label="Checklist kind">' + KINDS.map((kd) => {
        const n = L[kd[0]].reduce((a, r) => a + r.tasks.length, 0);
        return '<button role="tab" id="tab-' + kd[0] + '" aria-selected="' + (u.kind === kd[0]) + '" aria-controls="ck-panel" data-act="cl-kind" data-k="' + kd[0] + '">' + kd[1] + ' <span class="count">' + n + '</span></button>';
      }).join('') + '</div>';
      const filters = '<div class="seg ck-filter" role="group" aria-label="Show">' + [['all', 'All tasks'], ['extras', 'Extras'], ['periodic', 'Not every booking'], ['own', 'Own visit']].map((f) => '<button data-act="cl-filter" data-f="' + f[0] + '" aria-pressed="' + (u.filter === f[0]) + '">' + f[1] + '</button>').join('') + '</div>';
      const body = rooms.map((r, i) => roomCard(r, i, rooms.length)).join('');
      return HB.pageHead(inf.prospect ? 'Checklists · from a walk-through' : 'Checklists', HB.esc(inf.name), (u.kind === 'clean' ? 'The cleaning list the crew follow at every changeover, with the deeper jobs falling due on their own cadence.' : 'The property-check list: damage, utilities and safety. Run it with the clean, or as its own visit.'),
        '<label class="sr" for="ck-prop">Property</label><select id="ck-prop" class="ck-psel" data-change="cl-prop" data-sync>' + opts + '</select><button class="btn btn-ghost" data-act="cl-tpl">' + HB.icon('copy', 18) + 'Templates</button><button class="btn btn-ghost" data-act="cl-reset">' + HB.icon('refresh', 18) + 'Start again</button>') +
        '<div class="cols ck-cols"><div class="ck-main-col">' + tabs + '<div class="ck-bar">' + filters + '</div><div id="ck-panel" role="tabpanel" aria-labelledby="tab-' + u.kind + '" class="stack-l" style="gap:14px">' + (body || HB.empty('list', 'Nothing matches this filter', 'Switch the filter to see every task.')) +
        '<form class="ck-newroom" data-submit="cl-radd"><label class="sr" for="nr">New room or section</label><input id="nr" type="text" ' + fa('nr') + ' value="' + HB.esc(u.newRoom) + '" data-input="cl-nr" placeholder="Add a room or section, such as Utility room" maxlength="60" autocomplete="off"><button class="btn btn-primary" type="submit">' + HB.icon('plus', 18) + 'Add room</button></form></div></div>' + summary(pid) + '</div>';
    }
  });

  /* ---------- actions ---------- */
  HB.act('cl-prop', (el) => { HB.go('/op/checklists/' + el.value); });
  HB.act('cl-kind', (el) => { HB.update(() => { U().kind = el.dataset.k; U().open = null; U().rename = null; }); });
  HB.act('cl-filter', (el) => { HB.update(() => { U().filter = el.dataset.f; }); });
  HB.act('cl-open', (el) => { HB.update(() => { U().open = U().open === el.dataset.t ? null : el.dataset.t; }); if (U().open) refocus('[data-fid="tx-' + U().open + '"]'); });
  HB.act('cl-collapse', (el) => { HB.update(() => { U().collapsed[el.dataset.r] = !U().collapsed[el.dataset.r]; }); });
  HB.act('cl-tf', (el) => {
    const x = findTask(el.dataset.t); if (!x) return; const f = el.dataset.f;
    HB.update(() => { x.t[f] = f === 'price' ? Math.max(0, Number(el.value) || 0) : el.value; });
  });
  HB.act('cl-incl', (el) => {
    const x = findTask(el.dataset.t); if (!x) return; const inc = el.dataset.v === '1';
    HB.update(() => { x.t.incl = inc; if (inc) x.t.price = 0; });
    if (!inc) refocus('[data-fid="pr-' + x.t.id + '"]');
  });
  HB.act('cl-del', (el) => {
    const x = findTask(el.dataset.t); if (!x) return;
    HB.update(() => { x.r.tasks = x.r.tasks.filter((t) => t.id !== x.t.id); if (U().open === x.t.id) U().open = null; }); HB.toast('Task removed', { icon: 'trash' });
  });
  HB.act('cl-tmove', (el) => {
    const x = findTask(el.dataset.t); if (!x) return; const i = x.r.tasks.indexOf(x.t); const j = i + Number(el.dataset.d); if (j < 0 || j >= x.r.tasks.length) return;
    HB.update(() => { x.r.tasks.splice(j, 0, x.r.tasks.splice(i, 1)[0]); });
    refocus('[data-act="cl-tmove"][data-t="' + x.t.id + '"][data-d="' + el.dataset.d + '"]');
  });
  HB.act('cl-draft', (el) => { U().draft[el.dataset.r] = el.value; });
  HB.act('cl-tadd', (el) => {
    const r = findRoom(el.dataset.r); if (!r) return; const inp = HB.$('[data-draft="' + r.id + '"]', el); const text = (inp ? inp.value : '').trim();
    if (!text) { HB.toast('Type the task first', { icon: 'alert' }); if (inp) inp.focus(); return; }
    const t = mk(U().kind)(text); HB.update(() => { r.tasks.push(t); U().draft[r.id] = ''; U().open = t.id; });
    refocus('[data-fid="tx-' + t.id + '"]');
  });
  HB.act('cl-rrename', (el) => { HB.update(() => { U().rename = el.dataset.r; }); refocus('[data-fid="rn-' + el.dataset.r + '"]'); });
  HB.act('cl-rename', (el) => { const r = findRoom(el.dataset.r); if (!r) return; const v = el.value.trim(); HB.update(() => { if (v) r.name = v; U().rename = null; }); });
  HB.act('cl-rmove', (el) => {
    const L = cur(); const i = L.findIndex((r) => r.id === el.dataset.r); const j = i + Number(el.dataset.d); if (i < 0 || j < 0 || j >= L.length) return;
    HB.update(() => { L.splice(j, 0, L.splice(i, 1)[0]); }); refocus('[data-act="cl-rmove"][data-r="' + el.dataset.r + '"][data-d="' + el.dataset.d + '"]');
  });
  HB.act('cl-rdel', (el) => {
    const r = findRoom(el.dataset.r); if (!r) return; const L = get(U().pid);
    HB.confirm('Remove ' + r.name + '?', 'This removes the room and its ' + HB.plural(r.tasks.length, 'task') + ' from the ' + (U().kind === 'clean' ? 'cleaning' : 'property check') + ' list.', 'Remove room', () => { HB.update(() => { L[U().kind] = L[U().kind].filter((x) => x.id !== r.id); }); HB.toast('Room removed', { icon: 'trash' }); }, true);
  });
  HB.act('cl-nr', (el) => { U().newRoom = el.value; });
  HB.act('cl-radd', () => {
    const v = U().newRoom.trim(); if (!v) { HB.toast('Name the room first', { icon: 'alert' }); return; }
    const r = room(v, []); HB.update(() => { cur().push(r); U().newRoom = ''; }); refocus('[data-draft="' + r.id + '"]');
  });
  HB.act('cl-cpm', (el) => { const L = get(U().pid); HB.update(() => { L.meta.cpm = Math.max(1, Math.min(31, L.meta.cpm + Number(el.dataset.d))); }); });
  HB.act('cl-visit', (el) => { const L = get(U().pid); L.meta.visit = Math.max(0, Number(el.value) || 0); HB.emit(); });
  HB.act('cl-reset', () => {
    HB.confirm('Start this property again?', 'Both lists go back to the starting point from the property\'s turnover checklist. Your edits to them are lost.', 'Start again', () => {
      const pid = U().pid; const inf = info(pid);
      const w = S().walk && S().walk.pid === pid ? S().walk : null;
      HB.update((s) => { if (inf.prospect) { if (w) s.lists[pid] = fromWalk(w); } else delete s.lists[pid]; U().open = null; }); HB.toast('Lists reset', { icon: 'refresh' });
    }, true);
  });
  HB.act('cl-tpl', () => {
    const kind = U().kind;
    const body = '<p class="muted" style="margin-bottom:12px">Adds a new room to the <b>' + (kind === 'clean' ? 'cleaning' : 'property check') + '</b> list. Edit it afterwards like any other.</p><ul class="ck-tpls">' + allTpl().map((t) =>
      '<li><div><b>' + HB.esc(t.name) + '</b><span class="muted">' + HB.esc(t.about) + '</span></div><button class="btn btn-ghost btn-sm" data-act="cl-tpl-add" data-id="' + t.id + '">' + HB.icon('plus', 16) + 'Add</button></li>').join('') + '</ul>';
    const m = HB.modal({ title: 'Start from a template', body, hideFooter: true, wide: false }); U().tplClose = m.close;
  });
  HB.act('cl-tpl-add', (el) => {
    const t = allTpl().find((x) => x.id === el.dataset.id); if (!t) return; const kind = U().kind; const mkt = mk(kind);
    const tasks = t.items.map((i) => mkt(i.text, { freq: i.freq || 'every', incl: i.incl !== false, price: typeof i.price === 'function' ? i.price() : Number(i.price) || 0, sched: i.sched || 'together' }));
    HB.update(() => { cur().push(room(t.name, tasks)); }); if (U().tplClose) U().tplClose(); HB.toast(t.name + ' added', { icon: 'check' });
  });
  HB.act('cl-quote', () => {
    const pid = U().pid; const L = get(pid); const inf = info(pid); const st = stats(pid);
    if (st.noPrice) { HB.toast(HB.plural(st.noPrice, 'extra task') + ' still need a price', { icon: 'alert' }); return; }
    const lines = st.extras.map((e) => ({ id: HB.uid('ln'), desc: e.t.text + ' (' + fqL(e.t.freq).toLowerCase() + ', ' + e.room + ')', kind: 'labour', qty: e.occ, rate: Number(e.t.price) }));
    if (st.OV > 0 && Number(L.meta.visit) > 0) lines.push({ id: HB.uid('ln'), desc: 'Separate property check visit (' + st.OV + ' a year)', kind: 'labour', qty: st.OV, rate: Number(L.meta.visit) });
    if (!lines.length) { HB.toast('No priced extras yet. Mark a task as Extra and give it a price.', { icon: 'alert' }); return; }
    const note = 'Recurring extras over the next 12 months at ' + L.meta.cpm + ' changeovers a month. Quantity is how many times each task falls due in a year.';
    let r = S().requests.find((x) => x.extrasFor === pid && x.status === 'New');
    HB.update((s) => {
      if (r) { r.quote.lines = lines; r.quote.note = note; r.at = Date.now(); }
      else {
        r = { id: HB.uid('r'), ownerId: inf.ownerId || null, pid: inf.prospect ? null : pid, who: inf.owner, title: 'Recurring extras, ' + inf.short + ' (next 12 months)', desc: 'Built from the property checklists: the tasks marked as extra, with how often each falls due.', urgency: 'Whenever', day: HB.d(7), slot: 'AM', photos: [], status: 'New', at: Date.now(), kind: 'maintenance', quote: { lines, note, sentAt: null, approvedAt: null }, extrasFor: pid };
        s.requests.unshift(r);
      }
      U().lastReq = r.id;
    });
    HB.toast('Quote request ready with ' + HB.plural(lines.length, 'line'), { icon: 'quote' });
  });
})();
