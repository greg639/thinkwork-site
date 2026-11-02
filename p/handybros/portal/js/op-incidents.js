/* Field records: photo retention model, incidents, operator Incidents views, incident report document */
(function () {
  const S = () => HB.S;
  const sheetLink = document.createElement('link'); sheetLink.rel = 'stylesheet'; sheetLink.href = 'css/field.css'; document.head.appendChild(sheetLink);
  HB.addIcons({
    pinned: '<path d="M9 3.800h6l-.9 5 3.400 3.400H6.500l3.400-3.400zM12 12.200V20.500"/>',
    store: '<ellipse cx="12" cy="6" rx="7.500" ry="2.800"/><path d="M4.500 6v6c0 1.500 3.400 2.800 7.500 2.800s7.500-1.300 7.500-2.800V6M4.500 12v6c0 1.500 3.400 2.800 7.500 2.800s7.500-1.300 7.500-2.800v-6"/>',
    printer: '<path d="M7 9V3.500h10V9M7 17.500H4.500v-8h15v8H17M7 14h10v6.500H7z"/>'
  });

  const F = (HB.field = {});
  const fld = (HB.ui.fld = { pid: 'p2', pending: {}, uploads: {} });
  const SAMPLES = [
    ['bedroom-hero.jpg', 'Bedroom'], ['linen-detail.jpg', 'Linen'], ['inventory-kitchen.jpg', 'Kitchen'], ['tap-repair.jpg', 'Taps'],
    ['smoke-alarm-test.jpg', 'Alarm'], ['yellow-door.jpg', 'Front door'], ['key-safe-dusk.jpg', 'Key safe'], ['flats-dusk.jpg', 'Building'],
    ['seafront-terraces.jpg', 'Street'], ['painter-sage.jpg', 'Walls'], ['toolkit-flatlay.jpg', 'Tools'], ['lockout-night.jpg', 'Night']
  ];
  F.samples = SAMPLES;
  const POOL = { Kitchen: ['inventory-kitchen.jpg', 'tap-repair.jpg'], 'Living room': ['flats-dusk.jpg', 'seafront-terraces.jpg'], Bedroom: ['bedroom-hero.jpg', 'linen-detail.jpg'], Bathroom: ['tap-repair.jpg', 'painter-sage.jpg'], Hallway: ['yellow-door.jpg', 'smoke-alarm-test.jpg'] };
  const roomKey = (r) => (r.indexOf('Bedroom') === 0 ? 'Bedroom' : POOL[r] ? r : 'Hallway');
  F.sample = (room, n) => POOL[roomKey(room)][n % 2];
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; return h ^ (h >>> 13); };
  F.kbFor = (key) => 2300 + (hash(key) % 1900);
  F.mb = (kb) => (kb / 1024).toFixed(1);
  F.rooms = (pid) => S().inventory[pid].map((r) => r.room);
  const stamp = () => ({ d: HB.TODAY, t: HB.clock() });
  F.stamp = stamp;
  const fs = (x) => (x ? HB.fmt(x.d, 'short') + ' ' + x.t : '');
  F.fs = fs;
  const src = (x) => (x && (x.indexOf('blob:') === 0 || x.indexOf('data:') === 0 ? x : HB.photo(x)));

  /* ---------- seed ---------- */
  const st = (S().field = { visits: [], photos: [], incidents: [], invoiceDrafts: [], work: {}, seq: 1, incSeq: 2040 });
  F.st = () => S().field;
  const nid = (p) => p + '-' + (st.seq++).toString(36);
  const seedVisit = (pid, d, who, t) => { const v = { id: nid('v'), pid, who, d, t, inAt: null, outAt: null, committed: true, seed: true }; st.visits.push(v); return v; };
  const mkPhoto = (o) => {
    const p = Object.assign({ id: nid('ph'), incidentId: null, sample: true, state: 'current' }, o);
    p.kb = p.kb || F.kbFor(p.id + (p.src || '')); st.photos.push(p); return p;
  };
  F.mkPhoto = mkPhoto;
  const dayOf = { p1: -4, p2: 0, p3: -3, p4: -2, p5: -5, p6: -4 };
  S().props.forEach((p) => {
    const old = seedVisit(p.id, HB.d(-14), p.who, p.time);
    const cur = seedVisit(p.id, HB.d(dayOf[p.id]), p.who, p.time);
    F.rooms(p.id).forEach((room) => {
      mkPhoto({ pid: p.id, room, src: null, d: old.d, t: old.t, visitId: old.id, state: 'deleted' });
      mkPhoto({ pid: p.id, room, src: F.sample(room, 0), d: cur.d, t: cur.t, visitId: cur.id, state: 'current' });
    });
  });
  const incident = (o) => { const i = Object.assign({ id: 'INC-' + (++st.incSeq), status: 'open', insurance: false, remedy: '', before: [], after: [], fix: [], timeline: [], sent: null, read: null, ack: null, claimRef: '', visitId: null }, o); st.incidents.push(i); return i; };
  const pinned = (inc, role, o) => { const p = mkPhoto(Object.assign({ state: 'pinned', incidentId: inc.id }, o)); inc[role].push(p.id); return p; };

  /* resolved: lamp shade */
  const i1 = incident({ pid: 'p2', room: 'Bedroom 2', sev: 'Needs fix', title: 'Bedside lamp shade cracked', found: 'Shade on the left bedside lamp found cracked from the rim to the seam after the weekend stay. Lamp still works. Guest messaged afterwards to say it was already like that.', remedy: 'Replacement shade fitted and checked. Cracked shade kept for the host and listed on the stay report. Cost of £14 covered by the booking deposit.', status: 'resolved', attended: 'Sam', raised: { d: HB.d(-6), t: '12:52' }, resolved: { d: HB.d(-5), t: '10:20' }, visitId: 'seed' });
  pinned(i1, 'before', { pid: 'p2', room: 'Bedroom 2', src: 'bedroom-hero.jpg', d: HB.d(-13), t: '12:40', visitId: 'seed' });
  pinned(i1, 'after', { pid: 'p2', room: 'Bedroom 2', src: 'linen-detail.jpg', d: HB.d(-6), t: '12:52', visitId: 'seed' });
  pinned(i1, 'fix', { pid: 'p2', room: 'Bedroom 2', src: 'bedroom-hero.jpg', d: HB.d(-5), t: '10:20', visitId: 'seed' });
  i1.timeline = [{ d: HB.d(-6), t: '12:52', by: 'Sam', text: 'Cracked lamp shade found during the pre-clean damage check. Photographed against the last visit.' }, { d: HB.d(-6), t: '13:05', by: 'HandyBros', text: 'Incident raised. Last visit photos and this visit photos pinned as proof.' }, { d: HB.d(-6), t: '13:30', by: 'HandyBros', text: 'Report sent to Priya Nair.' }, { d: HB.d(-5), t: '09:10', by: 'Priya Nair', text: 'Opened and acknowledged the report. Asked for a replacement shade.' }, { d: HB.d(-5), t: '10:20', by: 'Sam', text: 'New shade fitted. Remedy photo added. Incident resolved.' }];
  i1.sent = { d: HB.d(-6), t: '13:30' }; i1.read = { d: HB.d(-5), t: '09:10' }; i1.ack = { d: HB.d(-5), t: '09:11', by: 'Priya Nair' };

  /* open: smoke alarm, raised today */
  const i2 = incident({ pid: 'p3', room: 'Hallway', sev: 'Urgent', title: 'Hallway smoke alarm fails the test', found: 'The hallway alarm head fails the button test and chirps on battery warning. It needs replacing before tonight\'s guest arrives.', remedy: '', attended: 'Sam', raised: { d: HB.TODAY, t: '13:50' }, visitId: 'seed' });
  pinned(i2, 'before', { pid: 'p3', room: 'Hallway', src: 'yellow-door.jpg', d: HB.d(-9), t: '12:45', visitId: 'seed' });
  const c3 = st.photos.find((x) => x.pid === 'p3' && x.room === 'Hallway' && x.state === 'current');
  c3.src = 'smoke-alarm-test.jpg'; c3.state = 'pinned'; c3.incidentId = i2.id; c3.d = HB.TODAY; c3.t = '13:50'; i2.after.push(c3.id);
  i2.timeline = [{ d: HB.TODAY, t: '13:50', by: 'Sam', text: 'Alarm head failed the button test during the turnover.' }, { d: HB.TODAY, t: '13:52', by: 'HandyBros', text: 'Incident raised. Replacement booked for this afternoon (request r3). Photos pinned.' }];

  /* insurance relevance: forced front door */
  const i3 = incident({ pid: 'p4', room: 'Hallway', sev: 'Urgent', title: 'Front door frame split at the latch', found: 'The frame beside the latch is split and the strike plate has been pulled out. The key safe was found intact. Looks like force was used on the door overnight. Door secured with a temporary fixing and the property is locked and safe.', remedy: 'Frame repair booked. Police log number and photos kept for the insurer.', insurance: true, attended: 'Alex', raised: { d: HB.d(-2), t: '14:05' }, visitId: 'seed' });
  pinned(i3, 'before', { pid: 'p4', room: 'Hallway', src: 'yellow-door.jpg', d: HB.d(-9), t: '15:45', visitId: 'seed' });
  pinned(i3, 'after', { pid: 'p4', room: 'Hallway', src: 'key-safe-dusk.jpg', d: HB.d(-2), t: '14:05', visitId: 'seed' });
  const c4 = st.photos.find((x) => x.pid === 'p4' && x.room === 'Hallway' && x.state === 'current'); if (c4) st.photos.splice(st.photos.indexOf(c4), 1);
  i3.timeline = [{ d: HB.d(-2), t: '14:05', by: 'Alex', text: 'Split frame found on arrival for the turnover. Photographed before anything was touched.' }, { d: HB.d(-2), t: '14:20', by: 'HandyBros', text: 'Marked as insurance relevant. Previous and current photos pinned permanently.' }, { d: HB.d(-2), t: '15:00', by: 'HandyBros', text: 'Temporary fixing in place. Report sent to Tom & Elise.' }];
  i3.sent = { d: HB.d(-2), t: '15:00' };

  S().docs = S().docs || [];
  F.docFor = (inc) => ({ id: 'doc-' + inc.id, ownerId: HB.prop(inc.pid).ownerId, pid: inc.pid, cat: 'Incident report', incidentId: inc.id, name: 'incident-report-' + inc.id + '.pdf', title: inc.title, added: inc.sent.d, size: Math.round(180 + (inc.before.length + inc.after.length + inc.fix.length) * 240) + ' KB', permanent: true });
  [i1, i3].forEach((i) => S().docs.push(F.docFor(i)));

  /* ---------- model ---------- */
  F.photo = (id) => st.photos.find((p) => p.id === id);
  F.inc = (id) => st.incidents.find((i) => i.id === id);
  F.visit = (id) => st.visits.find((v) => v.id === id);
  F.incOf = (pid) => st.incidents.filter((i) => i.pid === pid);
  F.openVisit = (pid, who) => {
    let v = st.visits.find((x) => x.pid === pid && !x.committed);
    if (!v) { v = { id: nid('v'), pid, who: who || HB.prop(pid).who, d: HB.TODAY, t: HB.clock(), inAt: null, outAt: null, committed: false }; st.visits.push(v); }
    return v;
  };
  F.runVisit = (pid) => { const r = S().run[pid]; return r && r.started ? st.visits.find((v) => v.pid === pid && v.inAt === r.started) : null; };
  F.checkIn = (pid, who) => {
    const r = S().run[pid]; let v = F.runVisit(pid); if (v) return v;
    v = F.openVisit(pid, who); v.inAt = r.started; v.who = who || v.who; v.d = HB.TODAY; v.t = HB.clockAt(r.started); return v;
  };
  const del = (p) => { p.state = 'deleted'; p.src = null; p.deletedAt = stamp(); };
  const attach = (inc, p, role) => { if (p.state !== 'pinned') p.state = 'pinned'; if (!p.incidentId) p.incidentId = inc.id; if (!inc[role].includes(p.id)) inc[role].push(p.id); };
  const roomsFor = (inc) => (inc.room === 'Whole property' ? F.rooms(inc.pid) : [inc.room]);
  /* pin the previous (before) and current (after) photos of the room to an incident */
  F.pinRooms = (inc) => {
    let n = 0;
    st.photos.forEach((p) => {
      if (p.pid !== inc.pid || !roomsFor(inc).includes(p.room)) return;
      const fresh = !(F.visit(p.visitId) || { committed: true }).committed;
      if (p.state === 'previous' || p.state === 'current') { attach(inc, p, p.state === 'previous' || !fresh ? 'before' : 'after'); n++; }
      else if (p.state === 'pinned' && p.visitId === inc.visitId && p.incidentId !== inc.id && !inc.after.includes(p.id)) { inc.after.push(p.id); n++; }
    });
    return n;
  };
  const guard = (pid, room, v) => st.incidents.find((i) => i.pid === pid && (i.status === 'open' || i.visitId === v.id) && roomsFor(i).includes(room));
  /* sign-off: earlier set is deleted unless an incident is open or raised for the visit */
  F.commit = (v) => {
    const out = { deleted: 0, pinned: 0, kb: 0 }; if (!v || v.committed) return out;
    F.rooms(v.pid).forEach((room) => {
      const inc = guard(v.pid, room, v);
      st.photos.forEach((p) => {
        if (p.pid !== v.pid || p.room !== room) return;
        if (p.state === 'previous') { if (inc) { attach(inc, p, 'before'); out.pinned++; } else { out.deleted++; out.kb += p.kb; del(p); } }
        else if (p.state === 'current' && p.visitId === v.id && inc) { attach(inc, p, 'after'); out.pinned++; }
      });
    });
    v.committed = true; fld.pending[v.pid] = null; return out;
  };
  /* add or replace this visit's photo for a room; the earlier current photo becomes previous */
  F.addRoomPhoto = (pid, room, source, o) => {
    o = o || {}; const v = o.visit || F.openVisit(pid);
    const old = st.photos.find((p) => p.pid === pid && p.room === room && p.visitId === v.id && p.state === 'current');
    if (old) st.photos.splice(st.photos.indexOf(old), 1);
    st.photos.filter((p) => p.pid === pid && p.room === room && p.state === 'current' && p.visitId !== v.id).forEach((p) => { p.state = 'previous'; });
    const p = mkPhoto({ pid, room, src: source, d: HB.TODAY, t: HB.clock(), visitId: v.id, state: 'current', sample: o.sample !== false, kb: o.kb });
    const inc = st.incidents.find((i) => i.pid === pid && i.status === 'open' && roomsFor(i).includes(room));
    if (inc) { attach(inc, p, 'after'); }
    return p;
  };
  F.raise = (o) => {
    const v = o.visit || F.openVisit(o.pid);
    const inc = incident({ pid: o.pid, room: o.room || 'Whole property', sev: o.sev || 'Needs fix', title: o.title, found: o.found, insurance: !!o.insurance, attended: o.who || HB.prop(o.pid).who, raised: stamp(), visitId: v.id });
    (o.photos || []).forEach((ph) => { const p = mkPhoto({ pid: o.pid, room: inc.room, src: ph.src, d: HB.TODAY, t: HB.clock(), visitId: v.id, state: 'pinned', incidentId: inc.id, sample: !!ph.sample, kb: ph.kb }); inc.after.push(p.id); });
    F.pinRooms(inc);
    inc.timeline.push({ d: inc.raised.d, t: inc.raised.t, by: inc.attended, text: o.found.length > 110 ? o.found.slice(0, 108) + '...' : o.found });
    inc.timeline.push({ d: inc.raised.d, t: inc.raised.t, by: 'HandyBros', text: 'Incident raised. Previous and current photos for ' + (inc.room === 'Whole property' ? 'the property' : inc.room) + ' pinned as proof.' + (inc.insurance ? ' Marked insurance relevant.' : '') });
    return inc;
  };
  F.stats = () => {
    const live = st.photos.filter((p) => p.state !== 'deleted'), gone = st.photos.filter((p) => p.state === 'deleted'), pin = st.photos.filter((p) => p.state === 'pinned');
    const sum = (a) => a.reduce((n, p) => n + p.kb, 0);
    return { kept: live.length, cur: live.filter((p) => p.state === 'current').length, prev: live.filter((p) => p.state === 'previous').length, pinned: pin.length, deleted: gone.length, keptKb: sum(live), pinnedKb: sum(pin), savedKb: sum(gone), wouldKb: sum(st.photos) };
  };
  /* newest finished photo per room, for the owner gallery */
  F.latest = (pid) => F.rooms(pid).map((room) => {
    const c = st.photos.filter((p) => p.pid === pid && p.room === room && p.state !== 'deleted' && p.src && (F.visit(p.visitId) || { committed: true }).committed).sort((a, b) => (a.d + a.t < b.d + b.t ? 1 : -1))[0];
    return { room, photo: c || null };
  });
  F.sevKind = { Minor: 'muted', 'Needs fix': 'warn', Urgent: 'bad' };
  F.badge = (p) => {
    const k = { current: ['cur', 'Current', 'check'], previous: ['prev', 'Previous', 'history'], deleted: ['gone', 'Deleted', 'trash'], pinned: ['pin', 'Pinned', 'pinned'] }[p.state];
    return '<span class="pst ' + k[0] + '">' + HB.icon(k[2], 12) + k[1] + (p.state === 'pinned' && p.incidentId ? ' · ' + HB.esc(p.incidentId) : '') + '</span>';
  };
  F.thumb = (p, cls) => '<figure class="ph ' + (cls || '') + (p.state === 'deleted' ? ' gone' : '') + '">' + (p.src ? '<img src="' + src(p.src) + '" alt="' + HB.esc(p.room) + ' photo, ' + HB.fmt(p.d, 'short') + (p.sample ? ', sample picture' : '') + '" loading="lazy">' : '<span class="ph-x">' + HB.icon('trash', 20) + '<i>Freed ' + F.mb(p.kb) + ' MB</i></span>') + '<figcaption>' + F.badge(p) + '<span class="mono">' + HB.fmt(p.d, 'short') + ' · ' + F.mb(p.kb) + ' MB</span></figcaption></figure>';

  /* ---------- incident report document ---------- */
  const statusChip = (i) => (i.status === 'resolved' ? HB.chip('Resolved', 'ok', 'check') : HB.chip('Open', 'warn', 'alert'));
  const fig = (label, ids, note) => {
    const ph = ids.map((id) => F.photo(id)).filter(Boolean);
    return '<div class="idoc-ph"><h4>' + label + '</h4>' + (ph.length ? ph.map((p) => '<figure><img src="' + src(p.src) + '" alt="' + HB.esc(label + ', ' + p.room + ', ' + HB.fmt(p.d, 'short')) + '"><figcaption><b>' + HB.fmt(p.d, 'short') + ' ' + p.t + '</b> · ' + HB.esc(p.room) + (p.sample ? ' · sample picture' : '') + '<br><span class="mono">' + HB.esc(p.id) + ' · kept permanently</span></figcaption></figure>').join('') : '<div class="idoc-none">' + HB.esc(note) + '</div>') + '</div>';
  };
  F.docHTML = (inc) => {
    const p = HB.prop(inc.pid), o = HB.owner(p.ownerId), v = F.visit(inc.visitId);
    const kv = [['Property', HB.esc(HB.addr(p))], ['Owner', HB.esc(o.name)], ['Raised', fs(inc.raised)], ['Area', HB.esc(inc.room)], ['Attended by', HB.esc(inc.attended) + (v && v.inAt ? ', on site from ' + HB.clockAt(v.inAt) : '')], ['Severity', HB.esc(inc.sev)], ['Status', inc.status === 'resolved' ? 'Resolved ' + fs(inc.resolved) : 'Open'], ['Insurance', inc.insurance ? 'Relevant. Photos kept permanently for a claim. Claim reference: <span class="todo">[claim ref]</span>' : 'Not flagged']];
    return '<article class="idoc" aria-label="Incident report ' + HB.esc(inc.id) + '"><header class="idoc-h"><div class="idoc-brand"><span class="idoc-mark">HB</span><div><b>HandyBros</b><span>Incident report</span></div></div><div class="idoc-ref"><b class="mono">' + HB.esc(inc.id) + '</b><span>' + fs(inc.raised) + '</span></div></header>' +
      '<h1>' + HB.esc(inc.title) + '</h1><p class="idoc-demo">Demo data. Sample pictures stand in for real photographs.</p>' +
      '<dl class="idoc-kv">' + kv.map((r) => '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>').join('') + '</dl>' +
      '<section><h2>What was found</h2><p>' + HB.esc(inc.found) + '</p></section>' +
      '<section><h2>Remedy and confirmation</h2><p>' + (inc.remedy ? HB.esc(inc.remedy) : 'No remedy recorded yet. This report is updated when the fix is confirmed.') + '</p></section>' +
      '<section><h2>Photographic proof</h2><div class="idoc-phs">' + fig('Before (previous visit)', inc.before, 'No earlier photo of this area was on file.') + fig('After (this visit)', inc.after, 'No photo taken yet.') + (inc.fix.length || inc.status === 'resolved' ? fig('Remedy', inc.fix, 'No remedy photo added.') : '') + '</div></section>' +
      '<section><h2>Timeline</h2><ol class="idoc-tl">' + inc.timeline.map((t) => '<li><span class="mono">' + HB.fmt(t.d, 'short') + ' ' + t.t + '</span><div><b>' + HB.esc(t.by) + '</b> ' + HB.esc(t.text) + '</div></li>').join('') + '</ol></section>' +
      '<footer class="idoc-f">' + (inc.sent ? 'Sent to ' + HB.esc(o.name) + ' on ' + fs(inc.sent) + '. ' : 'Not yet sent to the owner. ') + 'Photos attached to this report are pinned and are not removed by the routine clean-up of earlier photo sets.</footer></article>';
  };
  F.print = (id) => {
    const inc = F.inc(id); if (!inc) return;
    let root = HB.$('#print-root'); if (!root) { root = document.createElement('div'); root.id = 'print-root'; document.body.appendChild(root); }
    root.innerHTML = F.docHTML(inc); document.body.classList.add('printing');
    const done = () => { document.body.classList.remove('printing'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(() => { try { window.print(); } catch (e) { done(); } }, 60);
    setTimeout(done, 120000);
  };
  HB.act('inc-print', (el) => { F.print(el.dataset.id); HB.toast('Choose "Save as PDF" in the print window', { icon: 'printer' }); });

  /* ---------- sending ---------- */
  F.send = (inc) => {
    if (inc.sent) return;
    HB.update((s) => {
      inc.sent = stamp(); const o = HB.prop(inc.pid).ownerId;
      inc.timeline.push({ d: inc.sent.d, t: inc.sent.t, by: 'HandyBros', text: 'Report sent to ' + HB.owner(o).name + '. Saved to their Incidents list and compliance vault.' });
      s.docs.push(F.docFor(inc)); s.notifs.push({ ownerId: o, text: 'Incident report ' + inc.id + ' for ' + HB.prop(inc.pid).short, at: Date.now() });
    });
    HB.toast('Sent to ' + HB.owner(HB.prop(inc.pid).ownerId).name.split(' ')[0] + '. Saved to their Incidents and vault.', { icon: 'send' });
  };
  HB.act('inc-send', (el) => F.send(F.inc(el.dataset.id)));

  /* ---------- picture picker (modal, operator side) ---------- */
  F.pickModal = (title, sub, cb, extra, label) => HB.modal({
    title, sub, confirm: label || 'Use this photo', wide: true,
    body: (extra || '') + '<div class="spick-grid" role="radiogroup" aria-label="Sample pictures">' + SAMPLES.map((s, n) => '<label class="spick"><input type="radio" name="s" value="' + s[0] + '"' + (n === 0 ? ' checked' : '') + '><img src="' + HB.photo(s[0]) + '" alt="' + s[1] + ' sample picture"><span>' + s[1] + '</span></label>').join('') + '</div><label class="fld" style="margin-top:14px">Or upload a real photo<input type="file" name="file" accept="image/*" capture="environment"></label>',
    onConfirm: (dlg) => {
      const f = HB.formData(dlg); const file = HB.$('[name=file]', dlg).files[0];
      const pick = file ? { src: HB.images([file])[0].src, sample: false, kb: Math.max(1, Math.round(file.size / 1024)) } : { src: f.s, sample: true };
      return cb(pick, f, dlg);
    }
  });

  /* ---------- operator: list + storage panel ---------- */
  const incRow = (i) => {
    const p = HB.prop(i.pid), o = HB.owner(p.ownerId); const lead = F.photo(i.after[0] || i.before[0]);
    const own = i.sent ? (i.ack ? HB.chip('Acknowledged', 'ok', 'check') : i.read ? HB.chip('Opened, not acknowledged', 'info', 'eye') : HB.chip('Sent, not opened', 'muted', 'send')) : HB.chip('Not sent yet', 'brand');
    return '<a class="inc-row" href="#/op/incidents/' + i.id + '"><span class="inc-th">' + (lead && lead.src ? '<img src="' + src(lead.src) + '" alt="">' : '') + '</span><div class="inc-b"><div class="row wrap" style="gap:8px"><b>' + HB.esc(i.title) + '</b></div><p class="muted">' + HB.esc(p.short) + ' · ' + HB.esc(i.room) + ' · ' + HB.esc(o.name) + ' · ' + fs(i.raised) + '</p><div class="row wrap" style="gap:6px;margin-top:8px">' + statusChip(i) + HB.chip(i.sev, F.sevKind[i.sev]) + (i.insurance ? HB.chip('Insurance relevant', 'info', 'shield') : '') + own + '<span class="pst pin">' + HB.icon('pinned', 12) + (i.before.length + i.after.length + i.fix.length) + ' photos pinned</span></div></div>' + HB.icon('chev-r', 18) + '</a>';
  };
  const slot = (room, pid) => {
    const ph = st.photos.filter((p) => p.pid === pid && p.room === room);
    const live = ph.filter((p) => p.state !== 'deleted').sort((a, b) => (a.d + a.t < b.d + b.t ? 1 : -1));
    const gone = ph.filter((p) => p.state === 'deleted').sort((a, b) => ((b.deletedAt ? b.deletedAt.t : '') > (a.deletedAt ? a.deletedAt.t : '') ? 1 : -1));
    const tomb = gone.find((p) => p.deletedAt) || gone[0];
    return '<div class="set-row"><b>' + HB.esc(room) + '</b><div class="set-ph">' + live.map((p) => F.thumb(p)).join('') + (tomb ? F.thumb(tomb) : '') + '</div></div>';
  };
  HB.act('fld-pid', (el) => { fld.pid = el.value; HB.emit(); });
  HB.act('fld-up', (el) => {
    const pid = fld.pid, p = HB.prop(pid), withInc = el.dataset.inc === '1'; if (fld.pending[pid]) return;
    const n = (fld.uploads[pid] = (fld.uploads[pid] || 0) + 1); const rooms = F.rooms(pid);
    HB.update(() => {
      const v = F.openVisit(pid, p.who); fld.pending[pid] = v.id;
      rooms.forEach((r) => F.addRoomPhoto(pid, r, F.sample(r, n), { visit: v }));
      if (withInc) {
        const room = rooms.find((r) => r.indexOf('Kitchen') === 0) || rooms[0];
        F.raise({ pid, room, sev: 'Needs fix', title: 'Oven door glass cracked', found: 'Inner glass on the oven door is cracked across the corner. Not reported by the guest. Found on the pre-clean damage check.', who: p.who, visit: v, photos: [{ src: 'tap-repair.jpg', sample: true }] });
      }
    });
    HB.toast(withInc ? 'New set uploaded and an incident raised. The kitchen photos are pinned, the rest wait for sign-off.' : 'New set uploaded. The earlier set is kept only until the visit is signed off.', { icon: 'camera', ms: 4600 });
  });
  HB.act('fld-sign', () => {
    const pid = fld.pid; const v = F.visit(fld.pending[pid]); if (!v) return; let r;
    HB.update(() => { r = F.commit(v); });
    HB.toast(r.deleted + ' earlier photos deleted, ' + F.mb(r.kb) + ' MB freed.' + (r.pinned ? ' ' + r.pinned + ' pinned to an incident and kept.' : ''), { icon: 'trash', ms: 4600 });
  });
  /* undo an unsigned visit: new photos and incidents go, earlier photos become current again */
  F.undoVisit = (v) => {
    const pid = v.pid; const gone = st.incidents.filter((i) => i.visitId === v.id).map((i) => i.id);
    st.photos = st.photos.filter((p) => p.visitId !== v.id);
    st.photos.forEach((p) => { if (p.pid === pid && (p.state === 'previous' || (p.state === 'pinned' && gone.includes(p.incidentId)))) { p.state = 'current'; p.incidentId = null; } });
    st.incidents = st.incidents.filter((i) => !gone.includes(i.id));
    st.visits = st.visits.filter((x) => x.id !== v.id); fld.pending[pid] = null;
  };
  HB.act('fld-reset', () => { const v = F.visit(fld.pending[fld.pid]); if (!v) return; HB.update(() => F.undoVisit(v)); HB.toast('Upload cancelled, the earlier set is current again'); });

  function storagePanel() {
    const s = F.stats(), pid = fld.pid, pend = fld.pending[pid];
    return '<section class="stor" aria-labelledby="stor-h"><div class="sec-head"><h2 id="stor-h">Storage and retention</h2><span class="muted" style="font-size:13px">Each room keeps one current set</span></div>' +
      '<div class="stor-fig"><div><span class="eyebrow">Photos kept</span><b class="fig">' + s.kept + '</b><span class="muted">' + s.cur + ' current, ' + s.prev + ' awaiting sign-off, ' + s.pinned + ' pinned · ' + F.mb(s.keptKb) + ' MB</span></div>' +
      '<div><span class="eyebrow">Auto-deleted</span><b class="fig">' + s.deleted + '</b><span class="muted">earlier sets removed after sign-off</span></div>' +
      '<div><span class="eyebrow">Space saved</span><b class="fig">' + F.mb(s.savedKb) + ' <small>MB</small></b><span class="muted">of ' + F.mb(s.wouldKb) + ' MB if everything was kept</span></div>' +
      '<div><span class="eyebrow">Pinned to incidents</span><b class="fig">' + s.pinned + '</b><span class="muted">' + F.mb(s.pinnedKb) + ' MB kept as proof</span></div></div>' +
      '<div class="stor-bar" role="img" aria-label="Storage split"><i class="k" style="flex:' + (s.keptKb - s.pinnedKb) + '"></i><i class="p" style="flex:' + s.pinnedKb + '"></i><i class="s" style="flex:' + s.savedKb + '"></i></div><div class="stor-key"><span><i class="k"></i>Current and awaiting sign-off</span><span><i class="p"></i>Pinned to incidents</span><span><i class="s"></i>Deleted to save space</span></div>' +
      '<div class="rule-box"><div><b>1. A new set arrives</b><p>After the next visit, the room\'s new photos become Current and the earlier ones become Previous.</p></div><div><b>2. The visit is signed off</b><p>Previous photos are deleted to save space.</p></div><div class="pinrule"><b>Unless there is an incident</b><p>If an incident is open or raised for that property, the Previous (before) and Current (after) photos are pinned to it and kept permanently as proof for Airbnb or the insurer.</p></div></div>' +
      '<div class="demo-ctl"><div class="demo-h"><span class="tag">Demo</span><label class="fld" style="grid-template-columns:auto 1fr;align-items:center;gap:10px;display:grid">Property<select data-change="fld-pid" data-sync aria-label="Property for the demo">' + S().props.map((p) => '<option value="' + p.id + '"' + (p.id === pid ? ' selected' : '') + '>' + HB.esc(p.short) + '</option>').join('') + '</select></label></div>' +
      '<div class="row wrap" style="gap:10px"><button class="btn btn-primary" data-act="fld-up" data-inc="0"' + (pend ? ' disabled' : '') + '>' + HB.icon('upload', 18) + '1. Next visit uploads new photos</button><button class="btn btn-ghost" data-act="fld-up" data-inc="1"' + (pend ? ' disabled' : '') + '>' + HB.icon('alert', 18) + '1. Same, with an incident raised</button><button class="btn btn-accent" data-act="fld-sign"' + (pend ? '' : ' disabled') + '>' + HB.icon('trash', 18) + '2. Sign off the visit</button>' + (pend ? '<button class="btn btn-quiet" data-act="fld-reset">Cancel upload</button>' : '') + '</div>' +
      (pend ? '<p class="note-banner" style="margin-top:12px">' + HB.icon('history', 18) + '<span>The new set is Current. The earlier set shows as Previous and disappears when you sign off, unless an incident pins it.</span></p>' : '') + '</div>' +
      '<div class="set-grid" aria-label="Photo sets for ' + HB.esc(HB.prop(pid).short) + '">' + F.rooms(pid).map((r) => slot(r, pid)).join('') + '</div></section>';
  }
  HB.view('op.incidents', {
    title: () => 'Incidents',
    render() {
      const list = st.incidents.slice().sort((a, b) => (a.raised.d + a.raised.t < b.raised.d + b.raised.t ? 1 : -1));
      const open = list.filter((i) => i.status === 'open').length, ins = list.filter((i) => i.insurance).length, unsent = list.filter((i) => !i.sent).length;
      return HB.pageHead('Incidents', 'Proof, kept for as long as it is needed.', 'When something is found, the photos from the last visit and this visit are pinned to an incident report. Everything else is tidied away at the next visit so storage stays small.', '<button class="btn btn-primary" data-act="inc-new">' + HB.icon('plus', 18) + 'Raise an incident</button><button class="btn btn-ghost" id="inc-reset-demo" data-act="inc-reset-demo">' + HB.icon('refresh', 18) + 'Reset demo</button>') +
        '<section class="figures" style="margin-bottom:30px"><div><span class="eyebrow">Open</span><b class="fig">' + open + '</b></div><div><span class="eyebrow">Insurance relevant</span><b class="fig">' + ins + '</b></div><div><span class="eyebrow">Not sent to owner</span><b class="fig">' + unsent + '</b></div><div><span class="eyebrow">All time</span><b class="fig">' + list.length + '</b></div></section>' +
        '<section><div class="sec-head"><h2>Incident reports</h2><span class="mono muted">' + list.length + '</span></div><div class="inc-list">' + list.map(incRow).join('') + '</div></section>' + storagePanel();
    }
  });
  HB.act('inc-reset-demo', () => {
    HB.confirm('Reset the demo?', 'This clears the photos, incidents, ticks and visits kept in this browser and puts the sample data back. The page reloads.', 'Reset demo', () => { if (HB.resetDemo) HB.resetDemo(); }, true);
  });
  HB.act('inc-new', () => {
    const rooms = ['Whole property', 'Kitchen', 'Living room', 'Bedroom 1', 'Bedroom 2', 'Bedroom 3', 'Bathroom', 'Hallway'];
    HB.modal({ title: 'Raise an incident', sub: 'Photos from the last visit and this visit for the area are pinned to it straight away.',
      body: '<div class="form-grid"><label class="fld">Property<select name="pid">' + S().props.map((p) => '<option value="' + p.id + '">' + HB.esc(p.short) + '</option>').join('') + '</select></label><label class="fld">Area<select name="room">' + rooms.map((r) => '<option>' + r + '</option>').join('') + '</select></label><label class="fld full">Short title<input type="text" name="title" placeholder="e.g. Sofa arm torn"></label><label class="fld full">What was found<textarea name="found" rows="3" placeholder="What you saw and where"></textarea></label><label class="fld">Severity<select name="sev"><option>Minor</option><option selected>Needs fix</option><option>Urgent</option></select></label><label class="fld" style="align-content:end"><span class="row" style="gap:10px"><input type="checkbox" name="ins"> Insurance relevant</span></label></div>',
      confirm: 'Raise incident',
      onConfirm: (dlg) => {
        const f = HB.formData(dlg); if (f.title.trim().length < 3 || f.found.trim().length < 3) { HB.toast('Add a title and what was found', { icon: 'alert' }); return false; }
        const rm = F.rooms(f.pid).includes(f.room) ? f.room : 'Whole property'; let inc;
        HB.update(() => { inc = F.raise({ pid: f.pid, room: rm, sev: f.sev, title: f.title.trim(), found: f.found.trim(), insurance: f.ins, who: 'Alex' }); });
        HB.toast(inc.id + ' raised. ' + (inc.before.length + inc.after.length) + ' photos pinned.', { icon: 'pinned' }); HB.go('/op/incidents/' + inc.id);
      } });
  });

  /* ---------- operator: one incident ---------- */
  HB.view('op.incident', {
    title: (p) => (F.inc(p.id) ? p.id : 'Incident'),
    render(pr) {
      const i = F.inc(pr.id); if (!i) return HB.empty('alert', 'Incident not found', 'It may have been removed.', '<a class="btn btn-primary" href="#/op/incidents">All incidents</a>');
      const o = HB.owner(HB.prop(i.pid).ownerId);
      const own = i.sent ? '<div class="note-banner ok">' + HB.icon('check', 20) + '<div><b>Sent to ' + HB.esc(o.name) + ' on ' + fs(i.sent) + '.</b> Permanently saved in their Incidents list and compliance vault. ' + (i.ack ? 'Acknowledged ' + fs(i.ack) + '.' : i.read ? 'Opened ' + fs(i.read) + ', not yet acknowledged.' : 'Not opened yet.') + '</div></div>' : '';
      return '<a class="back inline" href="#/op/incidents">' + HB.icon('chev-l', 16) + 'All incidents</a><div class="inc-bar"><div class="row wrap" style="gap:8px">' + statusChip(i) + HB.chip(i.sev, F.sevKind[i.sev]) + (i.insurance ? HB.chip('Insurance relevant', 'info', 'shield') : '') + '</div><div class="row wrap" style="gap:10px">' +
        (i.status === 'open' ? '<button class="btn btn-ghost" data-act="inc-resolve" data-id="' + i.id + '">' + HB.icon('check', 18) + 'Mark resolved</button>' : '') +
        '<button class="btn btn-ghost" data-act="inc-ins" data-id="' + i.id + '">' + HB.icon('shield', 18) + (i.insurance ? 'Remove insurance flag' : 'Flag for insurance') + '</button><button class="btn btn-ghost" data-act="inc-print" data-id="' + i.id + '">' + HB.icon('download', 18) + 'Download PDF</button>' +
        (i.sent ? '' : '<button class="btn btn-primary" data-act="inc-send" data-id="' + i.id + '">' + HB.icon('send', 18) + 'Send to owner</button>') + '</div></div>' + own + F.docHTML(i);
    }
  });
  HB.act('inc-ins', (el) => { const i = F.inc(el.dataset.id); HB.update(() => { i.insurance = !i.insurance; i.timeline.push(Object.assign({}, stamp(), { by: 'HandyBros', text: i.insurance ? 'Marked insurance relevant. Photos stay pinned permanently.' : 'Insurance flag removed. Photos stay pinned while the incident is open.' })); }); HB.toast(i.insurance ? 'Flagged for insurance' : 'Insurance flag removed', { icon: 'shield' }); });
  HB.act('inc-resolve', (el) => {
    const i = F.inc(el.dataset.id);
    F.pickModal('Mark resolved', 'Say how it was put right. A remedy photo is optional but makes the proof complete.', (pick, f) => {
      if (!f.rem || f.rem.trim().length < 3) { HB.toast('Add what was done', { icon: 'alert' }); return false; }
      HB.update(() => {
        i.status = 'resolved'; i.resolved = stamp(); i.remedy = f.rem.trim();
        const p = mkPhoto({ pid: i.pid, room: i.room, src: pick.src, d: HB.TODAY, t: HB.clock(), visitId: i.visitId, state: 'pinned', incidentId: i.id, sample: pick.sample, kb: pick.kb }); i.fix.push(p.id);
        i.timeline.push(Object.assign({}, i.resolved, { by: i.attended, text: 'Remedy confirmed: ' + i.remedy }));
      });
      HB.toast(i.id + ' resolved. Its photos stay pinned.', { icon: 'check' });
    }, '<label class="fld" style="margin-bottom:14px">What was done<textarea name="rem" rows="3" placeholder="e.g. Replacement fitted and tested"></textarea></label>', 'Mark resolved');
  });
})();
