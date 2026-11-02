/* op-walkthrough: guided on-site walk-through quote for a new owner's property */
(function () {
  const S = () => HB.S;
  const esc = HB.esc;
  const r2 = (n) => Math.round(n * 100) / 100;
  if (!document.getElementById('walk-css')) {
    const l = document.createElement('link'); l.id = 'walk-css'; l.rel = 'stylesheet'; l.href = 'css/walk.css'; document.head.appendChild(l);
  }

  const STEPS = [['Property', 'Who and where'], ['Rooms', 'Itinerary and inventory'], ['Services', 'What they need'], ['Quote', 'Prices and deposit'], ['Confirm', 'Saved and ready']];
  const PER = { visit: 'per changeover', month: 'per month', quarter: 'per quarter', year: 'per year', once: 'one-off' };
  const CONDS = [['new', 'New'], ['good', 'Good'], ['worn', 'Worn'], ['damaged', 'Damaged']];
  const AGES = [['', 'Age unknown'], ['<1', 'Under 1 year'], ['1-3', '1 to 3 years'], ['3-5', '3 to 5 years'], ['5+', 'Over 5 years']];
  const PLATFORMS = ['Airbnb', 'Booking.com', 'Vrbo', 'Direct bookings'];
  const COVERED = ['BN20', 'BN21', 'BN22', 'BN23', 'BN24', 'TN39', 'TN40'];
  const BURN = () => HB.cl.BURN;
  const TYPICAL = {
    kitchen: [['Dinner plates', 6], ['Side plates', 6], ['Mugs', 6], ['Wine glasses', 6], ['Cutlery sets', 6], ['Saucepans', 3], ['Kettle', 1, 1], ['Toaster', 1, 1], ['Air fryer', 1, 1], ['Microwave', 1]],
    living: [['Sofa cushions', 4], ['Throws', 2], ['TV', 1, 1], ['TV remote', 1, 1], ['Spare AA batteries', 4, 1], ['Board games', 3]],
    bed: [['Pillows', 4], ['Duvet', 1], ['Bed linen sets', 2], ['Bedside lamps', 2]],
    bath: [['Bath towels', 4], ['Hand towels', 4], ['Bath mat', 1], ['Hairdryer', 1]],
    other: [['Spare light bulbs', 4], ['Fire blanket', 1], ['Umbrellas', 2]]
  };
  const keyOf = (n) => (/kitchen/i.test(n) ? 'kitchen' : /living|lounge|sitting/i.test(n) ? 'living' : /bed/i.test(n) ? 'bed' : /bath|shower|wc|toilet/i.test(n) ? 'bath' : 'other');
  const BURN_CHIPS = [['Kettle', 1], ['Toaster', 1], ['Air fryer', 1], ['TV', 1], ['TV remote', 2], ['Batteries (AA and AAA)', 6]];

  function blank() {
    return {
      id: HB.uid('w'), step: 0, seen: 0, errors: {}, cur: null, started: HB.TODAY,
      owner: { name: '', email: '', phone: '' },
      prop: { name: '', town: 'Eastbourne', pc: '', type: 'Flat', beds: 2, baths: 1, sleeps: 4, platforms: ['Airbnb'], keys: 'held', cpm: 8, notes: '' },
      rooms: [],
      svc: { changeover: true, inv: true, check: 'with', damage: true, util: true, linen: false, oven: false, ovenFreq: 'month', sameDay: false, club: false },
      over: {}, custom: [], signup: { amount: 199, waive: false },
      dep: { mode: 'fixed', value: 200, status: 'none', at: null, ref: null, paid: 0 },
      reqId: null, pid: null
    };
  }
  S().walk = S().walk || blank();
  const W = () => S().walk;

  /* ---------- paths, errors, helpers ---------- */
  function setPath(o, path, v) { const p = path.split('.'); let x = o; for (let i = 0; i < p.length - 1; i++) x = x[p[i]]; x[p[p.length - 1]] = v; }
  const fid = () => (document.activeElement && document.activeElement.getAttribute ? document.activeElement.getAttribute('data-fid') : null);
  const fa = (id) => 'data-fid="' + id + '"' + (fid() === id ? '' : ' data-sync');
  const err = (k) => W().errors[k] || '';
  const refocus = (sel) => setTimeout(() => { const e = HB.$(sel); if (e) e.focus({ preventScroll: true }); }, 70);
  const eid = (k) => 'er-' + k.replace(/[^a-z0-9]/gi, '-');
  function field(k, label, val, o) {
    o = o || {}; const e = err(k);
    return '<label class="fld' + (o.cls ? ' ' + o.cls : '') + (e ? ' bad' : '') + '"><span>' + label + (o.hint ? ' <small>' + o.hint + '</small>' : '') + '</span><input type="' + (o.type || 'text') + '" ' + fa(k) + ' value="' + esc(val) + '" data-input="wk-set" data-k="' + k + '" data-t="' + (o.t || 'text') + '"' +
      (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + (o.min != null ? ' min="' + o.min + '"' : '') + (o.step ? ' step="' + o.step + '"' : '') + (o.mode ? ' inputmode="' + o.mode + '"' : '') + (o.ac ? ' autocomplete="' + o.ac + '"' : '') +
      (e ? ' aria-invalid="true" aria-describedby="' + eid(k) + '"' : '') + (o.dis ? ' disabled' : '') + '>' + (e ? '<small class="wk-err" id="' + eid(k) + '">' + esc(e) + '</small>' : '') + '</label>';
  }
  const stepper = (k, label, v, mn, mx) => '<div class="fld"><span id="sl-' + k + '">' + label + '</span><div class="stepper" role="group" aria-labelledby="sl-' + k + '"><button type="button" data-act="wk-step" data-k="' + k + '" data-d="-1" data-min="' + mn + '" data-max="' + mx + '" aria-label="Fewer: ' + esc(label) + '">' + HB.icon('minus', 16) + '</button><output aria-live="polite">' + v + '</output><button type="button" data-act="wk-step" data-k="' + k + '" data-d="1" data-min="' + mn + '" data-max="' + mx + '" aria-label="More: ' + esc(label) + '">' + HB.icon('plus', 16) + '</button></div></div>';
  const bedsName = (b) => (Number(b) === 0 ? 'studio' : b + '-bed');
  /* a zone is a room, or a hallway or stairs; each room counts as one unless switched off */
  const isZone = (r) => r.zone !== false;
  const zq = (w) => { if (w.over && w.over.changeover) delete w.over.changeover.qty; };
  const nzones = (w) => (w.rooms.length ? w.rooms.filter(isZone).length : Math.max(1, Number(w.prop.beds) || 0) + (Number(w.prop.baths) || 1) + (Number(w.prop.beds) === 0 ? 1 : 3));

  /* ---------- quote model ---------- */
  function genLines(w) {
    const R = S().rates; const s = w.svc; const beds = w.prop.beds; const out = []; const zn = nzones(w); const base = HB.zonePrice(zn); const hr = HB.maintRate('hourly', s.club);
    const add = (key, desc, qty, price, per, incl) => out.push({ key, desc, qty, price, per, incl });
    if (s.changeover) {
      add('changeover', 'Changeover clean, ' + HB.zoneSum(zn) + ': full clean, beds remade, sanitise, inspection', zn, R.zone, 'visit', true);
      if (s.inv) add('inv', 'Inventory check against the list at every changeover', 1, 0, 'visit', true);
    }
    if (s.check === 'with') add('check', 'Property check alongside every changeover', 1, 0, 'visit', true);
    if (s.check === 'monthly') add('check', 'Separate property check visit, monthly (about an hour' + (s.club ? ', retained rate' : '') + ')', 1, hr, 'month', false);
    if (s.check === 'quarterly') add('check', 'Separate property check visit, quarterly (about an hour' + (s.club ? ', retained rate' : '') + ')', 1, hr, 'quarter', false);
    if (s.check !== 'none' && s.damage) add('damage', 'Pre-clean damage check: bed slats, seats, hardware and hiding places', 1, 0, s.check === 'with' ? 'visit' : 'once', true);
    if (s.check !== 'none' && s.util) add('util', 'Utility protection: heating at 18 degrees, windows locked, trickle vents open', 1, 0, s.check === 'with' ? 'visit' : 'once', true);
    if (s.linen) add('linen', 'Linen supply, per bed', Math.max(1, beds), R.linen, 'visit', false);
    if (s.oven) add('oven', 'Oven clean', 1, R.oven, s.ovenFreq, false);
    if (s.sameDay && s.changeover) add('sameday', 'Same-day turnaround, +' + R.sameDay + '%', 1, r2(base * R.sameDay / 100), 'visit', false);
    if (s.club) add('club', 'Priority Club: key holding, priority response, lock-out attendance ' + HB.money(R.club.lockout) + ' when used (6-month minimum)', 1, R.club.monthly, 'month', false);
    return out.map((l) => Object.assign({}, l, w.over[l.key] || {})).concat(w.custom.map((c) => Object.assign({}, c)));
  }
  function totals(w) {
    const L = genLines(w); const cpm = w.prop.cpm; let vInc = 0; let vExt = 0; let month = 0; let once = 0;
    L.forEach((l) => {
      const a = (Number(l.qty) || 0) * (Number(l.price) || 0);
      if (l.per === 'visit') { if (l.incl) vInc += a; else vExt += a; } else if (l.per === 'month') month += a; else if (l.per === 'quarter') month += a / 3; else if (l.per === 'year') month += a / 12; else once += a;
    });
    const signup = w.signup.waive ? 0 : Number(w.signup.amount) || 0;
    const monthly = r2((vInc + vExt) * cpm + month);
    const oneOff = r2(signup + once);
    const first = r2(monthly + oneOff);
    const d = w.dep; const dep = d.mode === 'percent' ? r2(first * (Number(d.value) || 0) / 100) : r2(Number(d.value) || 0);
    return { lines: L, vInc: r2(vInc), vExt: r2(vExt), visit: r2(vInc + vExt), monthly, once: r2(once), signup, oneOff, first, dep };
  }
  const counts = (w) => {
    let items = 0; let burn = 0; let worn = 0;
    w.rooms.forEach((r) => r.items.forEach((i) => { items++; if (i.burn) burn++; if (i.cond === 'worn' || i.cond === 'damaged') worn++; }));
    return { rooms: w.rooms.length, items, burn, worn };
  };

  /* ---------- validation ---------- */
  function validate(step) {
    const w = W(); const e = {};
    if (step === 0) {
      if (!w.owner.name.trim()) e['owner.name'] = 'Enter the owner\'s name';
      if (w.owner.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(w.owner.email.trim())) e['owner.email'] = 'That email address does not look right';
      if (w.owner.phone.trim() && w.owner.phone.replace(/\D/g, '').length < 10) e['owner.phone'] = 'A UK number has at least 10 digits';
      if (!w.prop.name.trim()) e['prop.name'] = 'Enter the property name or first line of the address';
      if (!w.prop.pc.trim()) e['prop.pc'] = 'Enter the postcode'; else if (!/^[A-Z]{1,2}\d[A-Z\d]?(\s*\d[A-Z]{2})?$/i.test(w.prop.pc.trim())) e['prop.pc'] = 'That postcode does not look right';
      if (w.prop.platforms.length === 0) e['prop.platforms'] = 'Pick at least one booking platform, or Direct bookings';
    }
    if (step === 1) {
      const c = counts(w);
      if (!c.rooms) e.rooms = 'Add at least one room'; else if (!c.items) e.rooms = 'Add at least one inventory item';
      w.rooms.forEach((r) => { if (!r.name.trim()) e['room.' + r.id] = 'Name this room'; r.items.forEach((i) => { if (!i.name.trim()) e['item.' + i.id] = 'Name this item'; else if (!(Number(i.qty) >= 1)) e['item.' + i.id] = 'Quantity must be 1 or more'; }); });
    }
    if (step === 2) { const s = w.svc; if (!s.changeover && s.check === 'none' && !s.linen && !s.oven && !s.club && !w.custom.length) e.svc = 'Pick at least one service line'; }
    if (step === 3) {
      const t = totals(w);
      t.lines.forEach((l) => {
        if (!String(l.desc).trim()) e['line.' + l.key + '.d'] = 'Describe this line';
        if (!(Number(l.qty) > 0)) e['line.' + l.key + '.q'] = 'Quantity must be above 0';
        if (!(Number(l.price) >= 0) || l.price === '') e['line.' + l.key + '.p'] = 'Enter a price, or 0';
        else if (!l.incl && !(Number(l.price) > 0)) e['line.' + l.key + '.p'] = 'An extra needs a price';
      });
      if (!t.lines.length) e.lines = 'The quote has no lines';
      if (!(Number(w.signup.amount) >= 0) && !w.signup.waive) e.signup = 'Enter the fee, or 0';
      if (!(Number(w.dep.value) >= 0)) e.dep = 'Enter the deposit';
      else if (w.dep.mode === 'percent' && Number(w.dep.value) > 100) e.dep = 'A percentage cannot be more than 100';
      else if (t.dep > t.first && t.first > 0) e.dep = 'The deposit is more than the first invoice (' + HB.money(t.first) + ')';
      else if (t.first <= 0) e.dep = 'The quote total is £0, so there is nothing to take a deposit against';
    }
    w.errors = e; return e;
  }
  const errCount = () => Object.keys(W().errors).length;

  /* ---------- generated rooms ---------- */
  function autoRooms(w) {
    const studio = Number(w.prop.beds) === 0;
    const mk = (name, zone) => ({ id: HB.uid('rm'), name, notes: '', items: [], zone: zone !== false });
    const out = [mk('Hallway'), mk('Kitchen', !studio), mk('Living room', !studio)];
    for (let i = 1; i <= Math.max(1, w.prop.beds); i++) out.push(mk(w.prop.beds === 0 ? 'Studio room' : 'Bedroom ' + i));
    for (let i = 1; i <= Math.max(1, w.prop.baths); i++) out.push(mk(w.prop.baths > 1 ? 'Bathroom ' + i : 'Bathroom'));
    return out;
  }
  function typicalItems(r, w) {
    return (TYPICAL[keyOf(r.name)] || []).map((t) => {
      const scale = /plates|Mugs|glasses|Cutlery/.test(t[0]) ? Math.max(2, Math.round(t[1] * w.prop.sleeps / 6)) : t[1];
      return { id: HB.uid('it'), name: t[0], qty: scale, cond: 'good', age: '', burn: !!t[2], burnSet: false, note: '' };
    });
  }

  /* ---------- step views ---------- */
  function errBanner() {
    const n = errCount(); if (!n) return '';
    const msgs = Object.keys(W().errors).slice(0, 4).map((k) => '<li>' + esc(W().errors[k]) + '</li>').join('');
    return '<div class="note-banner bad wk-errs" role="alert" tabindex="-1" id="wk-errs">' + HB.icon('alert', 18) + '<div><b>' + HB.plural(n, 'thing') + ' to fix before you carry on</b><ul>' + msgs + (n > 4 ? '<li>and ' + (n - 4) + ' more</li>' : '') + '</ul></div></div>';
  }
  function step0(w) {
    const pcd = w.prop.pc.trim().toUpperCase().split(/\s+/)[0];
    const cov = pcd && /^[A-Z]{1,2}\d[A-Z\d]?$/.test(pcd) ? (COVERED.indexOf(pcd) >= 0 ? HB.chip(pcd + ' is in the Eastbourne and Bexhill area', 'ok') : HB.chip(pcd + ' is outside the area for now', 'warn')) : '';
    const plat = PLATFORMS.map((p) => '<label><input type="checkbox" data-change="wk-plat" data-p="' + esc(p) + '"' + (w.prop.platforms.indexOf(p) >= 0 ? ' checked' : '') + '>' + esc(p) + '</label>').join('');
    const seg = (k, opts, v) => '<div class="seg" role="radiogroup">' + opts.map((o) => '<label><input type="radio" name="' + k + '" value="' + esc(o[0]) + '" data-change="wk-radio" data-k="' + k + '"' + (v === o[0] ? ' checked' : '') + '>' + esc(o[1]) + '</label>').join('') + '</div>';
    return '<section class="sheet pad wk-sec"><div class="sec-head"><h2>The owner</h2></div><div class="form-grid">' + field('owner.name', 'Owner name', w.owner.name, { ac: 'off', ph: 'For example, Priya Nair' }) + field('owner.phone', 'Phone <small>optional</small>', w.owner.phone, { type: 'tel', ac: 'off' }) + field('owner.email', 'Email <small>optional</small>', w.owner.email, { type: 'email', cls: 'full', ac: 'off' }) + '</div></section>' +
      '<section class="sheet pad wk-sec"><div class="sec-head"><h2>The property</h2>' + cov + '</div><div class="form-grid">' + field('prop.name', 'Property name or address', w.prop.name, { cls: 'full', ph: 'For example, Flat 2, 14 Rowan Terrace' }) +
      '<label class="fld">Town<select data-change="wk-set" data-k="prop.town" data-t="text" data-sync><option' + (w.prop.town === 'Eastbourne' ? ' selected' : '') + '>Eastbourne</option><option' + (w.prop.town === 'Bexhill' ? ' selected' : '') + '>Bexhill</option></select></label>' + field('prop.pc', 'Postcode', w.prop.pc, { ph: 'BN21 4AB', ac: 'off' }) +
      '<div class="fld full"><span id="ty">Type</span>' + seg('prop.type', ['Flat', 'House', 'Cottage', 'Studio'].map((x) => [x, x]), w.prop.type) + '</div>' +
      stepper('prop.beds', 'Bedrooms (0 is a studio)', w.prop.beds, 0, 8) + stepper('prop.baths', 'Bathrooms', w.prop.baths, 1, 6) + stepper('prop.sleeps', 'Sleeps', w.prop.sleeps, 1, 16) + stepper('prop.cpm', 'Changeovers a month', w.prop.cpm, 1, 31) +
      '<fieldset class="fld full wk-fs"><legend>Booking platforms</legend><div class="seg">' + plat + '</div>' + (err('prop.platforms') ? '<small class="wk-err">' + esc(err('prop.platforms')) + '</small>' : '') + '</fieldset>' +
      '<div class="fld full"><span>Keys</span>' + seg('prop.keys', [['held', 'We will hold a spare set'], ['safe', 'Key safe only'], ['later', 'Not decided yet']], w.prop.keys) + '</div>' +
      '<label class="fld full"><span>Notes from the walk <small>optional</small></span><textarea ' + fa('prop.notes') + ' data-input="wk-set" data-k="prop.notes" data-t="text" placeholder="Access, parking, anything the owner mentioned">' + esc(w.prop.notes) + '</textarea></label></div></section>';
  }
  function itemRow(r, i) {
    const e = err('item.' + i.id);
    return '<li class="wk-item' + (e ? ' bad' : '') + (i.burn ? ' burn' : '') + '"><label class="wk-in"><span class="sr">Item</span><input type="text" ' + fa('in-' + i.id) + ' value="' + esc(i.name) + '" data-input="wk-it" data-r="' + r.id + '" data-i="' + i.id + '" data-f="name" placeholder="Item" maxlength="60"' + (e ? ' aria-invalid="true" aria-describedby="' + eid('item.' + i.id) + '"' : '') + '></label>' +
      '<label class="wk-iq"><span class="sr">Quantity</span><input type="number" min="1" ' + fa('iq-' + i.id) + ' value="' + esc(i.qty) + '" data-input="wk-it" data-r="' + r.id + '" data-i="' + i.id + '" data-f="qty" inputmode="numeric"></label>' +
      '<label class="wk-ic"><span class="sr">Condition</span><select data-change="wk-it" data-r="' + r.id + '" data-i="' + i.id + '" data-f="cond" data-sync>' + CONDS.map((c) => '<option value="' + c[0] + '"' + (i.cond === c[0] ? ' selected' : '') + '>' + c[1] + '</option>').join('') + '</select></label>' +
      '<label class="wk-ia"><span class="sr">Age</span><select data-change="wk-it" data-r="' + r.id + '" data-i="' + i.id + '" data-f="age" data-sync>' + AGES.map((c) => '<option value="' + esc(c[0]) + '"' + (i.age === c[0] ? ' selected' : '') + '>' + c[1] + '</option>').join('') + '</select></label>' +
      '<button type="button" class="wk-burn" data-act="wk-burn" data-r="' + r.id + '" data-i="' + i.id + '" aria-pressed="' + !!i.burn + '" title="High-burn: used hard and replaced often">' + HB.icon('flame', 17) + '<span>High-burn</span></button>' +
      '<button type="button" class="ck-ib" data-act="wk-idel" data-r="' + r.id + '" data-i="' + i.id + '" aria-label="Remove ' + esc(i.name || 'this item') + '">' + HB.icon('trash', 16) + '</button>' + (e ? '<small class="wk-err wk-ierr" id="' + eid('item.' + i.id) + '">' + esc(e) + '</small>' : '') + '</li>';
  }
  function step1(w) {
    if (!w.rooms.length && !w.roomsInit) { w.rooms = autoRooms(w); w.roomsInit = true; }
    if (!w.rooms.length) {
      return (err('rooms') ? '<div class="note-banner bad" role="alert">' + HB.icon('alert', 18) + '<div>' + esc(err('rooms')) + '</div></div>' : '') +
        '<section class="sheet pad wk-sec">' + HB.empty('home', 'No rooms yet', 'Add the rooms in the order you walk them, or start from the bedrooms and bathrooms you entered.', '<div class="row wrap" style="justify-content:center;margin-top:8px"><button class="btn btn-primary" data-act="wk-auto">' + HB.icon('list', 18) + 'Start from the bedrooms and bathrooms</button></div>' +
        '<form class="wk-addroom" data-submit="wk-radd" style="width:min(360px,100%);margin-top:10px"><label class="sr" for="wk-nr">New room</label><input id="wk-nr" type="text" ' + fa('wk-nr') + ' value="' + esc(w.newRoom || '') + '" data-input="wk-nr" placeholder="Or add one room" maxlength="60" autocomplete="off"><button class="btn btn-ghost btn-icon" type="submit" aria-label="Add room">' + HB.icon('plus', 18) + '</button></form>') + '</section>';
    }
    if (!w.cur || !w.rooms.find((r) => r.id === w.cur)) w.cur = w.rooms[0].id;
    const c = counts(w); const r = w.rooms.find((x) => x.id === w.cur);
    const rail = w.rooms.map((x, n) => '<li><button class="wk-rm" data-act="wk-room" data-r="' + x.id + '"' + (x.id === w.cur ? ' aria-current="true"' : '') + '><span class="wk-n mono">' + (n + 1) + '</span><span class="wk-rt">' + esc(x.name || 'Unnamed room') + '</span><span class="mono muted">' + x.items.length + '</span>' + (err('room.' + x.id) ? HB.icon('alert', 15) : '') + '</button></li>').join('');
    const idx = w.rooms.indexOf(r);
    const typical = (TYPICAL[keyOf(r.name)] || []).length;
    const burnChips = BURN_CHIPS.map((b) => '<button type="button" class="wk-q burn" data-act="wk-quick" data-n="' + esc(b[0]) + '" data-q="' + b[1] + '" data-b="1">' + HB.icon('flame', 14) + esc(b[0]) + '</button>').join('');
    return (err('rooms') ? '<div class="note-banner bad" role="alert">' + HB.icon('alert', 18) + '<div>' + esc(err('rooms')) + '</div></div>' : '') +
      '<div class="wk-rooms"><nav class="wk-rail sheet" aria-label="Rooms in walking order"><div class="sec-head" style="padding:14px 16px 0"><h2>Walking order</h2></div><ol>' + rail + '</ol>' +
      '<form class="wk-addroom" data-submit="wk-radd"><label class="sr" for="wk-nr">New room</label><input id="wk-nr" type="text" ' + fa('wk-nr') + ' value="' + esc(w.newRoom || '') + '" data-input="wk-nr" placeholder="Add a room" maxlength="60" autocomplete="off"><button class="btn btn-ghost btn-icon" type="submit" aria-label="Add room">' + HB.icon('plus', 18) + '</button></form></nav>' +
      '<div class="stack-l" style="gap:16px"><section class="sheet pad wk-sec" aria-label="' + esc(r.name) + '"><div class="row wrap" style="gap:10px;align-items:flex-end"><label class="fld" style="flex:1;min-width:200px' + '"><span>Room ' + (idx + 1) + ' of ' + w.rooms.length + (err('room.' + r.id) ? ' <small class="wk-err">' + esc(err('room.' + r.id)) + '</small>' : '') + '</span><input type="text" ' + fa('rmn-' + r.id) + ' value="' + esc(r.name) + '" data-input="wk-rn" data-r="' + r.id + '" maxlength="60"></label>' +
      '<button class="ck-ib" data-act="wk-rmove" data-r="' + r.id + '" data-d="-1" aria-label="Move this room earlier"' + (idx === 0 ? ' disabled' : '') + '>' + HB.icon('arrow-up', 16) + '</button><button class="ck-ib" data-act="wk-rmove" data-r="' + r.id + '" data-d="1" aria-label="Move this room later"' + (idx === w.rooms.length - 1 ? ' disabled' : '') + '>' + HB.icon('arrow-down', 16) + '</button><button class="ck-ib" data-act="wk-rdel" data-r="' + r.id + '" aria-label="Remove this room">' + HB.icon('trash', 16) + '</button></div>' +
      '<label class="fld" style="margin-top:14px"><span>What you noticed here <small>optional</small></span><input type="text" ' + fa('rmo-' + r.id) + ' value="' + esc(r.notes) + '" data-input="wk-rno" data-r="' + r.id + '" placeholder="Damp patch by the window, wobbly shelf" maxlength="140"></label>' +
      '<label class="chk wk-zone"><input type="checkbox" data-change="wk-zone" data-r="' + r.id + '"' + (isZone(r) ? ' checked' : '') + '><span><b>Counts as a zone</b> <span class="muted">' + (isZone(r) ? 'Priced at ' + HB.money(S().rates.zone) + ' a changeover.' : 'Not priced, for example a kitchen area inside an open-plan room.') + '</span></span></label></section>' +
      '<section class="sheet pad wk-sec"><div class="sec-head"><h2>Inventory</h2><span class="mono muted">' + HB.plural(r.items.length, 'line') + '</span></div>' +
      (r.items.length ? '<div class="wk-ih" aria-hidden="true"><span>Item</span><span>Qty</span><span>Condition</span><span>Age</span><span></span></div><ul class="wk-items">' + r.items.map((i) => itemRow(r, i)).join('') + '</ul>' : '<p class="muted" style="padding:6px 0 12px">Nothing listed in this room yet. Add items below, or fill in the usual ones for a ' + esc(keyOf(r.name) === 'bed' ? 'bedroom' : keyOf(r.name) === 'other' ? 'room' : keyOf(r.name)) + '.</p>') +
      '<form class="ck-add" data-submit="wk-iadd"><label class="sr" for="wk-ni">Add an inventory item</label><input id="wk-ni" type="text" ' + fa('wk-ni') + ' value="' + esc(w.newItem || '') + '" data-input="wk-ni" placeholder="Add an item, press Enter" maxlength="60" autocomplete="off"><button class="btn btn-ghost btn-sm" type="submit">' + HB.icon('plus', 16) + 'Add</button></form>' +
      '<div class="wk-quick"><span class="wk-ql">High-burn items, tap to add</span><div class="row wrap" style="gap:8px">' + burnChips + '</div>' +
      (typical ? '<div class="row wrap" style="margin-top:10px"><button class="btn btn-ghost btn-sm" data-act="wk-typical">' + HB.icon('list', 16) + 'Fill in the usual items for this room</button></div>' : '') + '</div></section></div></div>' +
      '<p class="footnote" style="margin-top:14px">High-burn means used hard and replaced often: kettle, toaster, air fryer, TV and remotes, batteries. They go on the property-check list so they are tested every visit.</p>' +
      '<div class="wk-tally" aria-label="Totals so far"><span><b class="mono">' + c.rooms + '</b> rooms</span><span><b class="mono">' + c.items + '</b> items</span><span><b class="mono">' + c.burn + '</b> high-burn</span><span><b class="mono">' + c.worn + '</b> worn or damaged</span><span class="wk-zsum"><b class="mono">' + nzones(w) + '</b> zones × ' + HB.money(S().rates.zone) + ' = <b class="mono">' + HB.money(HB.zonePrice(nzones(w))) + '</b> a changeover</span></div>' +
      '<div class="row wrap wk-zadd" style="margin-top:10px;gap:8px"><span class="muted" style="font-size:13px">A zone is a room, or a hallway or stairs.</span><button class="btn btn-ghost btn-sm" data-act="wk-zadd" data-n="Hallway">' + HB.icon('plus', 16) + 'Add a hallway as a zone</button><button class="btn btn-ghost btn-sm" data-act="wk-zadd" data-n="Stairs">' + HB.icon('plus', 16) + 'Add stairs as a zone</button></div>';
  }
  function step2(w) {
    const s = w.svc; const R = S().rates; const beds = w.prop.beds; const zn = nzones(w); const base = HB.zonePrice(zn);
    const sw = (k, label, sub, price, on, dis) => '<label class="wk-svc' + (on ? ' on' : '') + (dis ? ' dis' : '') + '"><input type="checkbox" data-change="wk-svc" data-k="' + k + '"' + (on ? ' checked' : '') + (dis ? ' disabled' : '') + '><span class="wk-tick">' + HB.icon('check', 14) + '</span><span class="wk-st"><b>' + label + '</b><span>' + sub + '</span></span><span class="wk-sp mono">' + price + '</span></label>';
    const radio = (v, label, sub) => '<label class="wk-opt"><input type="radio" name="svc.check" value="' + v + '" data-change="wk-radio" data-k="svc.check"' + (s.check === v ? ' checked' : '') + '><span><b>' + label + '</b><span>' + sub + '</span></span></label>';
    return (err('svc') ? '<div class="note-banner bad" role="alert">' + HB.icon('alert', 18) + '<div>' + esc(err('svc')) + '</div></div>' : '') +
      '<div class="row wrap" style="justify-content:space-between;margin-bottom:6px"><p class="muted">Changeovers are the owner\'s own price: ' + HB.zoneSum(zn) + ' for this ' + bedsName(beds) + ', counted on the Rooms step. Linen, oven, same-day and Priority Club are still drafts. Change any price on the next step.</p>' + HB.rateChip + '</div>' +
      '<section class="sheet pad wk-sec"><div class="sec-head"><h2>Changeover clean</h2></div>' + sw('changeover', 'Changeover clean, ' + HB.zoneSum(zn), 'Full clean, beds remade, sanitise and inspection between guests.', HB.money(base) + ' a visit', s.changeover) +
      (s.changeover ? sw('inv', 'Inventory check every changeover', 'Counted against the list from this walk-through. Included in the visit price.', 'Included', s.inv) : '') + '</section>' +
      '<section class="sheet pad wk-sec"><div class="sec-head"><h2>Property checks</h2></div><div class="wk-opts" role="radiogroup" aria-label="How property checks run">' +
      radio('with', 'With every changeover', 'The crew check as they clean. Included in the visit price.') + radio('monthly', 'Own visit, monthly', 'A separate hour on site. Extra, at the hourly rate (' + HB.money(HB.maintRate('hourly', s.club)) + (s.club ? ', retained' : '') + ').') + radio('quarterly', 'Own visit, quarterly', 'A separate hour on site each quarter. Extra.') + radio('none', 'No property checks', 'Cleaning and inventory only.') + '</div>' +
      (s.check !== 'none' ? '<div class="wk-sub">' + sw('damage', 'Pre-clean damage check', 'Bed slats, seats, hardware and the places a guest could hide damage.', 'Included', s.damage) + sw('util', 'Utility protection round', 'Heating at 18 degrees, windows locked with trickle vents open.', 'Included', s.util) + '</div>' : '') + '</section>' +
      '<section class="sheet pad wk-sec"><div class="sec-head"><h2>Extras</h2></div><div class="stack" style="gap:10px">' +
      sw('linen', 'Linen supply', 'Fresh sets for every bed, supplied and laundered.', 'from ' + HB.money(R.linen) + ' a bed', s.linen) +
      sw('oven', 'Oven clean', 'A proper oven clean on the schedule you choose.', HB.money(R.oven), s.oven) +
      (s.oven ? '<label class="fld wk-ovf">How often<select data-change="wk-set" data-k="svc.ovenFreq" data-t="text" data-sync><option value="visit"' + (s.ovenFreq === 'visit' ? ' selected' : '') + '>Every changeover</option><option value="month"' + (s.ovenFreq === 'month' ? ' selected' : '') + '>Monthly</option><option value="quarter"' + (s.ovenFreq === 'quarter' ? ' selected' : '') + '>Quarterly</option></select></label>' : '') +
      sw('sameDay', 'Same-day turnaround', 'For back-to-back bookings. Added to each changeover.', '+' + R.sameDay + '%', s.sameDay && s.changeover, !s.changeover) +
      sw('club', 'Priority Club membership', 'Key holding, priority response, lock-out attendance and the retained discount on maintenance, ' + HB.discPct() + '% as an example. Six-month minimum.', HB.money(R.club.monthly) + ' a month', s.club) + '</div></section>';
  }
  const PERS = [['visit', 'Per changeover'], ['month', 'Per month'], ['quarter', 'Per quarter'], ['year', 'Per year'], ['once', 'One-off']];
  function lineRow(l, custom) {
    const kk = l.key; const ed = err('line.' + kk + '.d'); const eq = err('line.' + kk + '.q'); const ep = err('line.' + kk + '.p'); const tot = (Number(l.qty) || 0) * (Number(l.price) || 0);
    return '<li class="wk-ln' + (l.incl ? ' inc' : ' ext') + '"><button type="button" class="wk-flag ' + (l.incl ? 'inc' : 'ext') + '" data-act="wk-flag" data-key="' + kk + '" aria-label="' + (l.incl ? 'Included in the visit price. Switch to extra' : 'Extra, charged on top. Switch to included') + '">' + HB.icon(l.incl ? 'check' : 'plus', 13) + (l.incl ? 'Included' : 'Extra') + '</button>' +
      '<label class="wk-ld' + (ed ? ' bad' : '') + '"><span class="sr">Description</span><input type="text" ' + fa('ld-' + kk) + ' value="' + esc(l.desc) + '" data-input="wk-ln" data-key="' + kk + '" data-f="desc" maxlength="200"' + (ed ? ' aria-invalid="true"' : '') + '>' + (ed ? '<small class="wk-err">' + esc(ed) + '</small>' : '') + '</label>' +
      '<div class="wk-lm"><label class="wk-lq' + (eq ? ' bad' : '') + '"><span class="sr">Quantity</span><input type="number" min="0" step="1" inputmode="numeric" ' + fa('lq-' + kk) + ' value="' + esc(l.qty) + '" data-input="wk-ln" data-key="' + kk + '" data-f="qty"' + (eq ? ' aria-invalid="true"' : '') + '></label>' +
      '<label class="wk-lp' + (ep ? ' bad' : '') + '"><span class="sr">Price each, pounds</span><span class="wk-cur">£</span><input type="number" min="0" step="0.01" inputmode="decimal" ' + fa('lp-' + kk) + ' value="' + esc(l.price) + '" data-input="wk-ln" data-key="' + kk + '" data-f="price"' + (ep ? ' aria-invalid="true"' : '') + '></label>' +
      '<label class="wk-lr"><span class="sr">How often charged</span><select data-change="wk-ln" data-key="' + kk + '" data-f="per" data-sync>' + PERS.map((p) => '<option value="' + p[0] + '"' + (l.per === p[0] ? ' selected' : '') + '>' + p[1] + '</option>').join('') + '</select></label>' +
      '<b class="wk-lt mono">' + (l.incl && !(Number(l.price) > 0) ? 'Included' : HB.money(tot)) + '</b></div>' +
      '<button type="button" class="ck-ib" data-act="wk-ldel" data-key="' + kk + '" aria-label="Remove line: ' + esc(l.desc) + '">' + HB.icon('trash', 16) + '</button>' + (ep || eq ? '<small class="wk-err wk-ierr">' + esc(ep || eq) + '</small>' : '') + '</li>';
  }
  function depositPanel(w, t) {
    const d = w.dep; const secured = d.status === 'secured'; const e = err('dep');
    if (secured) return '<div class="wk-dep ok"><div class="row" style="gap:10px">' + HB.icon('shield', 22) + '<div><b>Deposit secured: ' + HB.money(d.paid) + '</b><span class="muted">Demo payment, reference ' + esc(d.ref) + ', ' + esc(d.at) + '. No real card was used.</span></div></div><button class="btn btn-ghost btn-sm" data-act="wk-dep-undo">' + HB.icon('undo', 16) + 'Undo (demo)</button></div>';
    return '<div class="wk-dep"><div class="sec-head" style="margin-bottom:10px"><h3 class="wk-h3">Deposit</h3><span class="tag">You decide</span></div>' +
      '<div class="form-grid"><div class="fld"><span id="dm">Type</span><div class="seg" role="group" aria-labelledby="dm"><button type="button" data-act="wk-depmode" data-m="fixed" aria-pressed="' + (d.mode === 'fixed') + '">Fixed £</button><button type="button" data-act="wk-depmode" data-m="percent" aria-pressed="' + (d.mode === 'percent') + '">Percent %</button></div></div>' +
      field('dep.value', d.mode === 'fixed' ? 'Deposit, £' : 'Deposit, % of the first invoice', d.value, { type: 'number', t: 'num', min: 0, step: d.mode === 'fixed' ? '1' : '1', mode: 'decimal' }) + '</div>' +
      '<div class="wk-depsum"><span>Deposit to take</span><b class="mono">' + HB.money(t.dep) + '</b></div><p class="footnote">Held against the first invoice. <span class="todo">owner to confirm how deposits are treated</span></p>' +
      '<button class="btn btn-accent btn-block" data-act="wk-card"' + (e || t.dep <= 0 ? ' aria-disabled="true"' : '') + '>' + HB.icon('card', 18) + 'Take deposit by card</button>' + (t.dep <= 0 ? '<p class="footnote" style="margin-top:8px">Set a deposit above £0 to take it by card, or carry on and send a payment link later.</p>' : '') + '</div>';
  }
  function step3(w) {
    const t = totals(w); const inc = t.lines.filter((l) => l.incl); const ext = t.lines.filter((l) => !l.incl);
    const block = (title, sub, list) => '<section class="sheet pad wk-sec"><div class="sec-head"><h2>' + title + '</h2><span class="muted" style="font-size:13px">' + sub + '</span></div>' + (list.length ? '<ul class="wk-lines">' + list.map((l) => lineRow(l)).join('') + '</ul>' : '<p class="muted">Nothing here yet.</p>') + '</section>';
    return '<div class="cols wk-quote"><div class="stack-l" style="gap:18px">' +
      '<div class="row wrap" style="justify-content:space-between"><p class="muted" style="max-width:60ch">Every line says whether it is <b class="wk-inc">Included</b> in the visit price or an <b class="wk-ext">Extra</b> charged on top. Tap the badge to switch.</p>' + HB.rateChip + '</div>' +
      (err('lines') ? '<div class="note-banner bad" role="alert">' + HB.icon('alert', 18) + '<div>' + esc(err('lines')) + '</div></div>' : '') +
      block('Included in the visit price', 'Covered by the changeover price', inc) + block('Extras', 'Charged on top of the visit', ext) +
      '<div class="row wrap"><button class="btn btn-ghost" data-act="wk-ladd">' + HB.icon('plus', 18) + 'Add a line</button></div></div>' +
      '<aside class="wk-paper sheet pad" aria-label="Quote totals"><div class="sec-head"><h2>Totals</h2></div>' +
      '<dl class="wk-tot"><div><dt>In the visit price</dt><dd class="mono">' + HB.money(t.vInc) + '</dd></div><div><dt>Extras per changeover</dt><dd class="mono">' + HB.money(t.vExt) + '</dd></div><div class="strong"><dt>Each changeover</dt><dd class="mono">' + HB.money(t.visit) + '</dd></div></dl>' +
      '<div class="wk-cpm">' + stepper('prop.cpm', 'Changeovers a month', w.prop.cpm, 1, 31) + '</div>' +
      '<dl class="wk-tot"><div><dt>Expected each month</dt><dd class="mono">' + HB.money(t.monthly) + '</dd></div>' +
      '<div class="sf"><dt><label for="su">Sign-up and initial inventory fee</label><span class="todo">draft £199</span></dt><dd><div class="sufield' + (err('signup') ? ' bad' : '') + '"><span>£</span><input id="su" type="number" min="0" step="1" inputmode="decimal" ' + fa('signup.amount') + ' value="' + esc(w.signup.amount) + '" data-input="wk-set" data-k="signup.amount" data-t="num"' + (w.signup.waive ? ' disabled' : '') + '></div></dd></div>' +
      '<label class="chk wk-waive"><input type="checkbox" data-change="wk-waive"' + (w.signup.waive ? ' checked' : '') + '>Waive the fee for this owner</label>' +
      (t.once ? '<div><dt>Other one-off lines</dt><dd class="mono">' + HB.money(t.once) + '</dd></div>' : '') +
      '<div class="strong"><dt>First invoice</dt><dd class="mono">' + HB.money(t.first) + '</dd></div></dl>' + (err('signup') ? '<small class="wk-err">' + esc(err('signup')) + '</small>' : '') +
      depositPanel(w, t) + (err('dep') ? '<small class="wk-err" role="alert">' + esc(err('dep')) + '</small>' : '') + '</aside></div>';
  }
  function listPreview(pid) {
    const L = HB.cl.get(pid);
    const col = (title, rooms) => '<section class="sheet pad wk-sec"><div class="sec-head"><h2>' + title + '</h2><span class="mono muted">' + rooms.reduce((a, r) => a + r.tasks.length, 0) + ' tasks</span></div>' + rooms.map((r) => '<details class="wk-pv"><summary>' + esc(r.name) + ' <span class="mono muted">' + r.tasks.length + '</span></summary><ul>' + r.tasks.map((t) => '<li>' + esc(t.text) + ' <span class="ck-chip fq">' + esc(HB.cl.FQ[t.freq]) + '</span>' + (t.incl ? '' : ' <span class="ck-chip ext">Extra ' + HB.money(t.price) + '</span>') + '</li>').join('') + '</ul></details>').join('') + '</section>';
    return '<div class="cols-2 wk-lists">' + col('Cleaning checklist', L.clean) + col('Property-check checklist', L.check) + '</div>';
  }
  function step4(w) {
    const t = totals(w); const secured = w.dep.status === 'secured'; const c = counts(w);
    const req = w.reqId ? HB.req(w.reqId) : null;
    return '<div class="wk-done sheet pad"><div class="wk-seal" aria-hidden="true">' + HB.icon('check', 30) + '</div><div style="flex:1;min-width:0"><div class="eyebrow">Walk-through complete</div><h2>Quote saved for ' + esc(w.owner.name) + '</h2>' +
      '<p class="muted">' + esc(w.prop.name) + ', ' + esc(w.prop.town) + ' ' + esc(w.prop.pc.toUpperCase()) + '. ' + HB.plural(c.rooms, 'room') + ', ' + HB.plural(c.items, 'inventory item') + ', ' + c.burn + ' marked high-burn.</p>' +
      '<div class="row wrap" style="gap:8px;margin-top:12px">' + HB.chip('Quote saved ' + HB.money(t.first) + ' first invoice', 'ok') + (secured ? HB.chip('Deposit secured ' + HB.money(w.dep.paid) + ' (demo)', 'ok') : HB.chip('Deposit ' + HB.money(t.dep) + ' not taken yet', 'warn')) + HB.chip(HB.money(t.monthly) + ' a month expected', 'info') + '</div>' +
      '<div class="row wrap" style="margin-top:18px">' + (req ? '<a class="btn btn-ghost" href="#/op/quotes/' + req.id + '">' + HB.icon('quote', 18) + 'Open the quote</a>' : '') + '</div></div></div>' +
      '<section class="sheet pad wk-sec wk-gen"><div class="sec-head"><h2>Checklists</h2></div>' +
      (w.pid ? '<p class="muted" style="margin-bottom:14px">Both lists are built from this walk-through: your rooms and inventory, the high-burn items, anything found worn, plus the deep-clean, annual, quarterly, damage and utility-protection tasks.</p><div class="row wrap"><a class="btn btn-primary" href="#/op/checklists/' + w.pid + '">' + HB.icon('list', 18) + 'Open in the checklist builder</a><button class="btn btn-ghost" data-act="wk-rebuild">' + HB.icon('refresh', 18) + 'Rebuild from the walk-through</button></div>'
        : '<p class="muted" style="margin-bottom:14px">One tap turns the rooms and inventory you just recorded into a cleaning checklist and a property-check checklist for this property.</p><button class="btn btn-primary" data-act="wk-gen">' + HB.icon('list', 18) + 'Create checklists from this walk-through</button>') + '</section>' +
      (w.pid ? listPreview(w.pid) : '') + '<div class="row wrap" style="margin-top:24px"><button class="btn btn-ghost" data-act="wk-new">' + HB.icon('plus', 18) + 'Start another walk-through</button></div>';
  }

  /* ---------- aside ---------- */
  function aside(w) {
    const c = counts(w); const t = totals(w); const show = w.seen >= 2 || w.step >= 2;
    const rows = [['Owner', w.owner.name.trim() || '<span class="muted">Not entered</span>'], ['Property', w.prop.name.trim() ? esc(w.prop.name) : '<span class="muted">Not entered</span>'], ['Size', bedsName(w.prop.beds) + ', sleeps ' + w.prop.sleeps], ['Rooms and items', c.rooms + ' and ' + c.items], ['Zones', nzones(w) + ' × ' + HB.money(S().rates.zone)], ['High-burn', String(c.burn)]];
    return '<aside class="wk-side sheet pad" aria-label="Walk-through so far"><div class="sec-head"><h2>So far</h2><span class="tag">Step ' + (w.step + 1) + ' of 5</span></div><dl class="wk-so">' + rows.map((r) => '<div><dt>' + r[0] + '</dt><dd>' + (r[0] === 'Owner' ? esc(w.owner.name.trim()) || r[1] : r[1]) + '</dd></div>').join('') + '</dl>' +
      (show ? '<hr class="divider"><dl class="wk-so"><div><dt>Each changeover</dt><dd class="mono">' + HB.money(t.visit) + '</dd></div><div><dt>Each month</dt><dd class="mono">' + HB.money(t.monthly) + '</dd></div><div><dt>First invoice</dt><dd class="mono">' + HB.money(t.first) + '</dd></div><div><dt>Deposit</dt><dd>' + (w.dep.status === 'secured' ? '<span class="ck-chip inc">Secured ' + HB.money(w.dep.paid) + '</span>' : HB.money(t.dep) + ' to take') + '</dd></div></dl><p class="footnote" style="margin-top:10px">Changeover price is the owner\'s own. Linen, oven, same-day and club prices are drafts. ' + HB.rateChip + '</p>' : '<p class="footnote" style="margin-top:12px">Your quote builds as you go. It saves in this session, so you can leave this page and come back.</p>') + '</aside>';
  }

  /* ---------- view ---------- */
  HB.view('op.walkthrough', {
    title: () => 'Walk-through quote',
    render() {
      const w = W(); const t = STEPS[w.step];
      const rail = '<ol class="wk-steps" aria-label="Walk-through steps">' + STEPS.map((s, i) => {
        const done = i < w.step; const now = i === w.step; const ok = i <= w.seen;
        return '<li class="' + (now ? 'now' : done ? 'done' : '') + '"' + (now ? ' aria-current="step"' : '') + '><button type="button" data-act="wk-jump" data-s="' + i + '"' + (ok ? '' : ' disabled') + '><i class="mono">' + (done ? HB.icon('check', 13) : i + 1) + '</i><span><b>' + s[0] + '</b><em>' + s[1] + '</em></span></button></li>';
      }).join('') + '</ol>';
      const body = [step0, step1, step2, step3, step4][w.step](w);
      const nextLabel = ['Next: rooms and inventory', 'Next: service lines', 'Next: build the quote', 'Save the quote', ''][w.step];
      const foot = w.step < 4 ? '<div class="wk-nav"><button class="btn btn-ghost" data-act="wk-back"' + (w.step === 0 ? ' disabled' : '') + '>' + HB.icon('chev-l', 18) + 'Back</button><span class="wk-prog muted">Step ' + (w.step + 1) + ' of 5, ' + t[0] + '</span><button class="btn btn-primary" data-act="wk-next">' + nextLabel + HB.icon('chev-r', 18) + '</button></div>' : '';
      return HB.pageHead('Walk-through quote', w.step === 4 ? 'Quote saved. Now the checklists.' : 'Walk the property, then quote it on the spot.', w.step === 4 ? (w.dep.status === 'secured' ? 'The quote is saved and the deposit is secured.' : 'The quote is saved. The deposit has not been taken yet.') + ' Turn what you saw into the property\'s checklists.' : 'Run this on site with a new owner: record the property and its inventory room by room, choose the services, set the deposit and take it, then build the checklists.',
        (w.step < 4 ? '<button class="btn btn-ghost" data-act="wk-sample">' + HB.icon('spark', 18) + 'Fill a sample walk-through</button>' : '') + '<button class="btn btn-ghost" data-act="wk-reset">' + HB.icon('refresh', 18) + 'Start over</button>') +
        rail + '<div class="cols wk-cols' + (w.step >= 3 ? ' one' : '') + '"><div class="wk-body"><h2 class="wk-h" tabindex="-1" id="wk-h">' + t[0] + '</h2>' + errBanner() + body + foot + '</div>' + (w.step >= 3 ? '' : aside(w)) + '</div>';
    }
  });

  /* ---------- actions ---------- */
  function focusTop() { window.scrollTo(0, 0); setTimeout(() => { const h = HB.$('#wk-h'); if (h) h.focus({ preventScroll: true }); }, 80); }
  function goStep(n) { HB.update((s) => { s.walk.step = n; if (n > s.walk.seen) s.walk.seen = n; s.walk.errors = {}; }); focusTop(); }
  function showErrors() { setTimeout(() => { const b = HB.$('#wk-errs'); if (b) { b.scrollIntoView({ block: 'center' }); b.focus({ preventScroll: true }); } }, 80); }

  HB.act('wk-set', (el) => {
    const w = W(); const k = el.dataset.k; let v = el.value;
    if (el.dataset.t === 'num') v = el.value === '' ? '' : Number(el.value);
    HB.update(() => { setPath(w, k, v); delete w.errors[k]; if (k === 'dep.value') delete w.errors.dep; if (k === 'signup.amount') delete w.errors.signup; });
  });
  HB.act('wk-radio', (el) => { const w = W(); HB.update(() => { setPath(w, el.dataset.k, el.value); }); });
  HB.act('wk-plat', (el) => { const w = W(); HB.update(() => { const a = w.prop.platforms; const p = el.dataset.p; const i = a.indexOf(p); if (el.checked && i < 0) a.push(p); if (!el.checked && i >= 0) a.splice(i, 1); delete w.errors['prop.platforms']; }); });
  HB.act('wk-step', (el) => {
    const w = W(); const k = el.dataset.k; const p = k.split('.'); const cur = w[p[0]][p[1]]; const v = Math.max(Number(el.dataset.min), Math.min(Number(el.dataset.max), cur + Number(el.dataset.d)));
    HB.update(() => { w[p[0]][p[1]] = v; if (k === 'prop.beds' || k === 'prop.baths') { if (!w.rooms.some((r) => r.items.length)) { w.rooms = []; w.roomsInit = false; } } });
    refocus('[data-act="wk-step"][data-k="' + k + '"][data-d="' + el.dataset.d + '"]');
  });
  HB.act('wk-svc', (el) => { const w = W(); HB.update(() => { w.svc[el.dataset.k] = el.checked; delete w.errors.svc; }); });
  HB.act('wk-waive', (el) => { const w = W(); HB.update(() => { w.signup.waive = el.checked; delete w.errors.signup; }); });

  /* rooms and items */
  const room = (id) => W().rooms.find((r) => r.id === id);
  HB.act('wk-room', (el) => { HB.update(() => { W().cur = el.dataset.r; }); });
  HB.act('wk-nr', (el) => { W().newRoom = el.value; });
  HB.act('wk-auto', () => { const w = W(); HB.update(() => { w.rooms = autoRooms(w); w.roomsInit = true; w.cur = w.rooms[0].id; delete w.errors.rooms; zq(w); }); });
  HB.act('wk-radd', () => {
    const w = W(); const v = (w.newRoom || '').trim(); if (!v) { HB.toast('Name the room first', { icon: 'alert' }); return; }
    const r = { id: HB.uid('rm'), name: v, notes: '', items: [], zone: true }; HB.update(() => { w.rooms.push(r); w.cur = r.id; w.newRoom = ''; delete w.errors.rooms; zq(w); }); refocus('[data-fid="wk-ni"]');
  });
  HB.act('wk-zone', (el) => { const r = room(el.dataset.r); if (r) HB.update(() => { r.zone = el.checked; zq(W()); }); });
  HB.act('wk-zadd', (el) => {
    const w = W(); const base = el.dataset.n; const taken = w.rooms.filter((x) => x.name.indexOf(base) === 0).length;
    const r = { id: HB.uid('rm'), name: taken ? base + ' ' + (taken + 1) : base, notes: '', items: [], zone: true }; HB.update(() => { w.rooms.push(r); w.cur = r.id; delete w.errors.rooms; zq(w); });
  });
  HB.act('wk-rn', (el) => { const r = room(el.dataset.r); if (r) { r.name = el.value; delete W().errors['room.' + r.id]; HB.emit(); } });
  HB.act('wk-rno', (el) => { const r = room(el.dataset.r); if (r) r.notes = el.value; });
  HB.act('wk-rmove', (el) => {
    const a = W().rooms; const i = a.findIndex((r) => r.id === el.dataset.r); const j = i + Number(el.dataset.d); if (i < 0 || j < 0 || j >= a.length) return;
    HB.update(() => { a.splice(j, 0, a.splice(i, 1)[0]); }); refocus('[data-act="wk-rmove"][data-r="' + el.dataset.r + '"][data-d="' + el.dataset.d + '"]');
  });
  HB.act('wk-rdel', (el) => {
    const w = W(); const r = room(el.dataset.r); if (!r) return;
    HB.confirm('Remove ' + (r.name || 'this room') + '?', 'This removes the room and its ' + HB.plural(r.items.length, 'inventory line') + '.', 'Remove room', () => { HB.update(() => { w.rooms = w.rooms.filter((x) => x.id !== r.id); w.cur = w.rooms.length ? w.rooms[0].id : null; zq(w); }); HB.toast('Room removed', { icon: 'trash' }); }, true);
  });
  const item = (el) => { const r = room(el.dataset.r); return r ? { r, i: r.items.find((x) => x.id === el.dataset.i) } : { r: null, i: null }; };
  HB.act('wk-it', (el) => {
    const x = item(el); if (!x.i) return; const f = el.dataset.f; x.i[f] = f === 'qty' ? (el.value === '' ? '' : Number(el.value)) : el.value;
    if (f === 'name' && !x.i.burnSet) x.i.burn = BURN().test(x.i.name);
    delete W().errors['item.' + x.i.id]; HB.emit();
  });
  HB.act('wk-burn', (el) => { const x = item(el); if (!x.i) return; HB.update(() => { x.i.burn = !x.i.burn; x.i.burnSet = true; }); refocus('[data-act="wk-burn"][data-i="' + el.dataset.i + '"]'); });
  HB.act('wk-idel', (el) => { const x = item(el); if (!x.i) return; HB.update(() => { x.r.items = x.r.items.filter((i) => i.id !== x.i.id); }); HB.toast('Item removed', { icon: 'trash' }); });
  HB.act('wk-ni', (el) => { W().newItem = el.value; });
  HB.act('wk-iadd', () => {
    const w = W(); const r = room(w.cur); const v = (w.newItem || '').trim(); if (!r) return; if (!v) { HB.toast('Type the item first', { icon: 'alert' }); return; }
    const it = { id: HB.uid('it'), name: v, qty: 1, cond: 'good', age: '', burn: BURN().test(v), burnSet: false, note: '' };
    HB.update(() => { r.items.push(it); w.newItem = ''; delete w.errors.rooms; }); refocus('[data-fid="wk-ni"]');
  });
  HB.act('wk-quick', (el) => {
    const w = W(); const r = room(w.cur); if (!r) return; const name = el.dataset.n;
    const found = r.items.find((i) => i.name.toLowerCase() === name.toLowerCase());
    HB.update(() => { if (found) found.qty = (Number(found.qty) || 0) + 1; else r.items.push({ id: HB.uid('it'), name, qty: Number(el.dataset.q) || 1, cond: 'good', age: '', burn: true, burnSet: true, note: '' }); delete w.errors.rooms; });
  });
  HB.act('wk-typical', () => {
    const w = W(); const r = room(w.cur); if (!r) return; const have = r.items.map((i) => i.name.toLowerCase());
    const add = typicalItems(r, w).filter((i) => have.indexOf(i.name.toLowerCase()) < 0);
    HB.update(() => { r.items = r.items.concat(add); delete w.errors.rooms; }); if (!add.length) HB.toast('Those are already on the list', { icon: 'list' });
  });

  /* quote lines */
  const lineOf = (key) => genLines(W()).find((l) => l.key === key);
  HB.act('wk-ln', (el) => {
    const w = W(); const key = el.dataset.key; const f = el.dataset.f; const cu = w.custom.find((c) => c.key === key);
    let v = el.value; if (f === 'qty' || f === 'price') v = el.value === '' ? '' : Number(el.value);
    HB.update(() => { if (cu) cu[f] = v; else { w.over[key] = w.over[key] || {}; w.over[key][f] = v; } delete w.errors['line.' + key + '.' + (f === 'desc' ? 'd' : f === 'qty' ? 'q' : 'p')]; });
  });
  HB.act('wk-flag', (el) => {
    const w = W(); const key = el.dataset.key; const l = lineOf(key); if (!l) return; const cu = w.custom.find((c) => c.key === key); const nv = !l.incl;
    HB.update(() => { if (cu) cu.incl = nv; else { w.over[key] = w.over[key] || {}; w.over[key].incl = nv; } });
    refocus('[data-act="wk-flag"][data-key="' + key + '"]');
  });
  HB.act('wk-ldel', (el) => {
    const w = W(); const key = el.dataset.key; const cu = w.custom.find((c) => c.key === key);
    const base = ['changeover', 'inv', 'check', 'damage', 'util', 'linen', 'oven', 'sameday', 'club'].indexOf(key) >= 0;
    HB.update(() => { if (cu) w.custom = w.custom.filter((c) => c.key !== key); else if (base) { const m = { changeover: 'changeover', inv: 'inv', damage: 'damage', util: 'util', linen: 'linen', oven: 'oven', sameday: 'sameDay', club: 'club' }[key]; if (key === 'check') w.svc.check = 'none'; else if (m) w.svc[m] = false; delete w.over[key]; } });
    HB.toast('Line removed from the quote', { icon: 'trash' });
  });
  HB.act('wk-ladd', () => {
    const w = W(); const key = HB.uid('c');
    HB.update(() => { w.custom.push({ key, desc: '', qty: 1, price: '', per: 'once', incl: false }); });
    refocus('[data-fid="ld-' + key + '"]');
  });
  HB.act('wk-depmode', (el) => { const w = W(); HB.update(() => { w.dep.mode = el.dataset.m; w.dep.value = el.dataset.m === 'fixed' ? 200 : 25; delete w.errors.dep; }); });

  /* mock card sheet */
  HB.act('wk-card', () => {
    const w = W(); const e = validate(3);
    if (e.dep || Object.keys(e).length) { HB.update(() => {}); showErrors(); HB.toast('Fix the highlighted items first', { icon: 'alert' }); return; }
    HB.update(() => {}); const t = totals(w); if (t.dep <= 0) { HB.toast('Set a deposit above £0 first', { icon: 'alert' }); return; }
    const body = '<div class="wk-pay"><div class="note-banner" role="note">' + HB.icon('shield', 18) + '<div><b>Demo only.</b> No card is read, nothing is sent anywhere and nobody is charged. The details below are a fixed test card.</div></div>' +
      '<div class="wk-pay-amt"><span>Deposit for ' + esc(w.prop.name) + '</span><b class="mono">' + HB.money(t.dep) + '</b></div>' +
      '<label class="fld">Card number<input type="text" value="4242 4242 4242 4242" readonly aria-readonly="true"></label><div class="form-grid"><label class="fld">Expiry<input type="text" value="12 / 30" readonly aria-readonly="true"></label><label class="fld">CVC<input type="text" value="123" readonly aria-readonly="true"></label></div>' +
      '<label class="fld">Name on card<input type="text" value="' + esc(w.owner.name) + '" readonly aria-readonly="true"></label><p class="footnote" id="wk-payst" role="status">The owner pays on a card reader or their own phone in the real version.</p></div>';
    HB.modal({ title: 'Take deposit by card', sub: 'A stand-in for the payment sheet', body, confirm: 'Pay ' + HB.money(t.dep) + ' (demo)', cancel: 'Cancel',
      onConfirm: (dlg, close) => {
        const btn = HB.$('[data-ok]', dlg); if (btn.disabled) return false; btn.disabled = true; btn.textContent = 'Processing, demo only';
        setTimeout(() => {
          HB.update(() => { w.dep.status = 'secured'; w.dep.paid = t.dep; w.dep.at = HB.fmt(HB.TODAY, 'short') + ' ' + HB.clock(); w.dep.ref = 'demo_' + Math.random().toString(36).slice(2, 8); delete w.errors.dep; });
          close(); HB.toast('Deposit secured (demo)', { icon: 'shield' });
        }, 900);
        return false;
      } });
  });
  HB.act('wk-dep-undo', () => { const w = W(); HB.update(() => { w.dep.status = 'none'; w.dep.paid = 0; w.dep.ref = null; w.dep.at = null; }); HB.toast('Demo deposit undone'); });

  /* navigation */
  function saveQuote() {
    const w = W(); const t = totals(w); const c = counts(w);
    const per = (p) => PER[p] || p;
    const lines = t.lines.map((l) => ({ id: HB.uid('ln'), desc: String(l.desc).trim() + ' (' + per(l.per) + (l.incl ? ', included' : ', extra') + ')', kind: /linen|supply/i.test(l.desc) ? 'materials' : 'labour', qty: Number(l.qty), rate: Number(l.price) }));
    if (t.signup > 0) lines.push({ id: HB.uid('ln'), desc: 'Sign-up and initial inventory (one-off)', kind: 'labour', qty: 1, rate: t.signup });
    const quote = { lines, note: 'Walk-through quote. The total adds one of each line, with how often each is charged in brackets. Expected ' + HB.money(t.monthly) + ' a month at ' + w.prop.cpm + ' changeovers. Deposit ' + HB.money(t.dep) + (w.dep.status === 'secured' ? ' secured (demo).' : ' not yet taken.'), sentAt: null, approvedAt: null, deposit: { amount: t.dep, secured: w.dep.status === 'secured', at: w.dep.at } };
    const title = 'Walk-through quote: ' + w.prop.name.trim();
    const desc = 'Walk-through at ' + w.prop.name.trim() + ', ' + w.prop.town + ' ' + w.prop.pc.toUpperCase() + ' on ' + HB.fmt(HB.TODAY, 'short') + '. ' + HB.plural(c.rooms, 'room') + ', ' + HB.plural(c.items, 'inventory item') + ', ' + c.burn + ' high-burn.';
    HB.update((s) => {
      let r = w.reqId ? HB.req(w.reqId) : null;
      if (r) { r.title = title; r.desc = desc; r.who = w.owner.name.trim(); r.quote = Object.assign({}, r.quote, quote); }
      else { r = { id: HB.uid('r'), ownerId: null, pid: null, who: w.owner.name.trim(), title, desc, urgency: 'Whenever', day: HB.d(7), slot: 'AM', photos: [], status: 'New', at: Date.now(), kind: 'turnover', quote, walkId: w.id }; s.requests.unshift(r); w.reqId = r.id; }
    });
  }
  HB.act('wk-next', () => {
    const w = W(); const e = validate(w.step);
    if (Object.keys(e).length) { HB.update(() => {}); showErrors(); return; }
    if (w.step === 3) { saveQuote(); HB.toast('Quote saved', { icon: 'quote' }); }
    goStep(w.step + 1);
  });
  HB.act('wk-back', () => { const w = W(); if (w.step > 0) goStep(w.step - 1); });
  HB.act('wk-jump', (el) => {
    const w = W(); const n = Number(el.dataset.s); if (n === w.step || n > w.seen) return;
    if (n > w.step) { const e = validate(w.step); if (Object.keys(e).length) { HB.update(() => {}); showErrors(); return; } }
    goStep(n);
  });
  HB.act('wk-gen', () => {
    const w = W(); const pid = 'w-' + w.id.replace(/^w-/, '');
    HB.update((s) => {
      s.lists[pid] = HB.cl.fromWalk(w);
      const rec = { id: pid, name: w.prop.name.trim(), short: w.prop.name.trim(), town: w.prop.town, beds: w.prop.beds, zones: nzones(w), img: w.prop.type === 'House' || w.prop.type === 'Cottage' ? 'seafront-terraces.jpg' : 'flats-dusk.jpg', owner: w.owner.name.trim() };
      const i = s.prospects.findIndex((p) => p.id === pid); if (i >= 0) s.prospects[i] = rec; else s.prospects.push(rec);
      w.pid = pid; w.handoff = { pid, at: Date.now() };
    });
    HB.toast('Cleaning and property-check checklists created', { icon: 'list' });
  });
  HB.act('wk-rebuild', () => {
    HB.confirm('Rebuild the checklists?', 'They are rebuilt from the walk-through. Anything you changed in the checklist builder is replaced.', 'Rebuild', () => { const w = W(); HB.update((s) => { s.lists[w.pid] = HB.cl.fromWalk(w); }); HB.toast('Checklists rebuilt', { icon: 'refresh' }); }, true);
  });
  const startNew = () => { HB.update((s) => { s.walk = blank(); }); focusTop(); };
  HB.act('wk-new', startNew);
  HB.act('wk-reset', () => {
    const w = W(); const dirty = w.owner.name || w.prop.name || w.rooms.length;
    if (!dirty) { HB.toast('Already a blank walk-through'); return; }
    HB.confirm('Start over?', 'This clears the walk-through in progress. A quote you already saved stays in Quotes & requests.', 'Start over', () => { startNew(); HB.toast('Cleared', { icon: 'refresh' }); }, true);
  });
  HB.act('wk-sample', () => {
    const w = W();
    HB.update((s) => {
      const b = blank(); b.id = w.id;
      Object.assign(b.owner, { name: 'Dan Whitcombe', email: 'dan.whitcombe@example.test', phone: '07700 900144' });
      Object.assign(b.prop, { name: 'Flat 2, 14 Rowan Terrace', town: 'Bexhill', pc: 'TN40 1AB', type: 'Flat', beds: 2, baths: 1, sleeps: 4, platforms: ['Airbnb', 'Booking.com'], keys: 'held', cpm: 8, notes: 'Second floor, key safe by the street door. Owner asked for the grout in the bathroom to be looked at.' });
      b.rooms = autoRooms(b); b.roomsInit = true; b.rooms.forEach((r) => { r.items = typicalItems(r, b); }); b.cur = b.rooms[0].id;
      b.rooms[1].items.find((i) => i.name === 'Kettle').cond = 'worn'; b.rooms[1].notes = 'Hob has a loose knob';
      b.svc.linen = true; b.svc.oven = true; b.svc.ovenFreq = 'month';
      b.step = 0; b.seen = 3; s.walk = b;
    });
    HB.toast('Sample filled in. Step through to see the flow.', { icon: 'spark' }); focusTop();
  });
})();
