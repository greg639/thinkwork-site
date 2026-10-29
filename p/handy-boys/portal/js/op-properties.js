/* Operator: Properties list and detail */
(function () {
  const S = () => HB.S;
  HB.ui.plist = { town: 'All' }; HB.ui.reveal = {}; HB.ui.inv = { check: false };

  const worstRag = (pid) => { const r = HB.complianceItems().filter((c) => c.pid === pid).map((c) => c.rag); return r.includes('r') ? 'r' : r.includes('a') ? 'a' : 'g'; };
  const icalChip = (p) => p.ical.status === 'synced' ? HB.chip('iCal synced ' + p.ical.last, 'ok') : HB.chip('iCal quiet since ' + p.ical.last, 'warn');

  HB.view('op.properties', {
    title: () => 'Properties',
    render() {
      const t = HB.ui.plist.town; const list = S().props.filter((p) => t === 'All' || p.town === t);
      return HB.pageHead('Properties', 'Every place you look after.', 'Access, inventory, checklists, compliance and history for each property, in one record that the owner can see their half of.',
        '<button class="btn btn-primary" data-act="walkthrough">' + HB.icon('plus', 18) + 'Book a walk-through</button>') +
        '<div class="row wrap" style="margin-bottom:22px"><div class="seg" role="group" aria-label="Town">' + ['All', 'Eastbourne', 'Bexhill'].map((x) => '<button data-act="plist-town" data-t="' + x + '" aria-pressed="' + (t === x) + '">' + x + '</button>').join('') + '</div><span class="muted">' + HB.plural(list.length, 'property', 'properties') + '</span></div>' +
        '<div class="pgrid">' + list.map((p) => {
          const st = HB.propState(p.id); const o = HB.owner(p.ownerId); const rag = worstRag(p.id);
          return '<a class="pcard" href="#/op/properties/' + p.id + '"><div class="pc-img"><img src="' + HB.photo(p.img) + '" alt="" loading="lazy"><span class="pc-st">' + HB.chip(st.label, st.k === 'ready' ? 'ok' : st.k === 'issue' ? 'bad' : st.k === 'prep' ? 'info' : 'muted') + '</span></div><div class="pc-b"><h3>' + HB.esc(p.name) + '</h3><p class="muted">' + HB.esc(p.town + ' ' + p.pc) + ' · ' + p.beds + ' bed · ' + HB.esc(o.name) + '</p><div class="row wrap" style="gap:6px;margin-top:12px">' + p.platforms.map((x) => '<span class="tag">' + HB.esc(x) + '</span>').join('') + '</div><div class="pc-f"><span class="rag ' + rag + '"><i></i>' + (rag === 'r' ? 'Compliance overdue' : rag === 'a' ? 'Compliance due soon' : 'Compliance in date') + '</span><span class="mono muted">' + HB.score(p.id) + ' / 100</span></div></div></a>';
        }).join('') + '</div>';
    }
  });
  HB.act('plist-town', (el) => { HB.ui.plist.town = el.dataset.t; HB.emit(); });
  HB.act('walkthrough', () => HB.modal({
    title: 'Book a free walk-through', sub: 'Capture the inventory room by room, build the custom to-do list, then quote.',
    body: '<div class="form-grid"><label class="fld full">Property or address<input type="text" name="addr" placeholder="e.g. Garden Flat, 22 Pennant Gardens"></label><label class="fld">Owner name<input type="text" name="owner"></label><label class="fld">Date<input type="date" name="date" value="' + HB.d(3) + '"></label></div>',
    confirm: 'Add to calendar', onConfirm: (dlg) => { const f = HB.formData(dlg); if (!f.addr.trim()) { HB.toast('Add the property address', { icon: 'alert' }); return false; } HB.update((s) => { s.events.push({ id: HB.uid('e'), type: 'quote', date: f.date, start: '10:00', dur: 1.5, title: 'Walk-through: ' + f.addr, pid: null, who: 'Alex', auto: false }); }); HB.toast('Walk-through added to the calendar', { icon: 'calendar' }); }
  }));

  /* ---------- detail ---------- */
  const TABS = [['overview', 'Overview'], ['inventory', 'Inventory'], ['checklists', 'Checklists'], ['compliance', 'Compliance'], ['history', 'History'], ['retainer', 'Retainer']];
  HB.view('op.property', {
    title: (p) => (HB.prop(p.id) ? HB.prop(p.id).short : 'Property'),
    render(pr) {
      const p = HB.prop(pr.id); if (!p) return HB.empty('home', 'Property not found', 'Pick one from the list.', '<a class="btn btn-primary" href="#/op/properties">All properties</a>');
      const tab = pr.tab || 'overview'; const st = HB.propState(p.id); const o = HB.owner(p.ownerId);
      const nCompl = HB.complianceItems().filter((c) => c.pid === p.id && c.rag !== 'g').length;
      const hero = '<header class="phero"><img src="' + HB.photo(p.img) + '" alt="' + HB.esc(p.name) + ', photo placeholder"><div class="phero-in"><a class="back" href="#/op/properties">' + HB.icon('chev-l', 16) + 'All properties</a><div><div class="row wrap" style="gap:8px;margin-bottom:10px">' + p.platforms.map((x) => '<span class="chip plain" style="background:rgb(255 255 255 / .16);color:#fff">' + HB.esc(x) + '</span>').join('') + '</div><h1>' + HB.esc(p.name) + '</h1><p>' + HB.esc(p.street + ', ' + p.town + ' ' + p.pc) + ' · ' + p.beds + ' bed, sleeps ' + p.sleeps + ' · ' + HB.esc(o.name) + '</p></div></div></header>';
      const tabs = '<nav class="tabs" aria-label="Property sections">' + TABS.map((t) => '<a href="#/op/properties/' + p.id + '/' + t[0] + '"' + (tab === t[0] ? ' aria-current="page"' : '') + '>' + t[1] + (t[0] === 'compliance' && nCompl ? '<span class="count">' + nCompl + '</span>' : '') + '</a>').join('') + '</nav>';
      const body = { overview, inventory, checklists, compliance, history, retainer }[tab] || overview;
      return hero + tabs + body(p);
    }
  });

  function secret(key, val, label) {
    const on = HB.ui.reveal[key];
    return '<span class="' + (on ? 'mono' : 'masked') + '">' + (on ? HB.esc(val) : '•••• ••••') + '</span> <button class="btn btn-ghost btn-xs" data-act="reveal" data-k="' + key + '" aria-label="' + (on ? 'Hide ' : 'Reveal ') + label + '">' + HB.icon(on ? 'eye-off' : 'eye', 16) + (on ? 'Hide' : 'Reveal') + '</button> <button class="btn btn-ghost btn-xs" data-act="copy" data-v="' + HB.esc(val) + '" aria-label="Copy ' + label + '">' + HB.icon('copy', 16) + '</button>';
  }
  function overview(p) {
    const stays = HB.nextStays(p.id, 4);
    return '<div class="cols"><div class="stack-l">' +
      '<section class="sheet pad"><div class="sec-head"><h2>Access and house</h2></div><dl class="kv"><div><dt>Getting in</dt><dd>' + HB.esc(p.access) + '</dd></div>' +
      '<div><dt>Key safe</dt><dd class="stack" style="gap:8px"><span>' + secret(p.id + '-key', p.keysafe.code, 'key safe code') + '</span><span class="muted">' + HB.esc(p.keysafe.where) + '. Code changed ' + HB.fmt(p.keysafe.changed, 'short') + '.</span><span><button class="btn btn-ghost btn-xs" data-act="rotate-code" data-id="' + p.id + '">' + HB.icon('refresh', 16) + 'Rotate code</button></span></dd></div>' +
      '<div><dt>Wi-Fi</dt><dd><span class="mono">' + HB.esc(p.wifi.ssid) + '</span> · ' + secret(p.id + '-wifi', p.wifi.pass, 'Wi-Fi password') + '</dd></div>' +
      '<div><dt>Bin day</dt><dd>' + HB.icon('bin', 16) + ' ' + HB.esc(p.bin) + '</dd></div><div><dt>Parking</dt><dd>' + HB.esc(p.parking) + '</dd></div>' +
      '<div><dt>Notes</dt><dd><label class="sr" for="pn">Property notes</label><textarea id="pn" data-note="' + p.id + '" rows="3">' + HB.esc(p.notes) + '</textarea><div style="margin-top:8px"><button class="btn btn-ghost btn-sm" data-act="note-save" data-id="' + p.id + '">Save notes</button></div></dd></div></dl></section>' +
      '<section class="sheet pad"><div class="sec-head"><h2>Asset register</h2><span class="muted" style="font-size:13px">Age and warranty at a glance</span></div><div class="tbl-wrap" style="border:0"><table class="tbl"><thead><tr><th>Asset</th><th>Age</th><th>Warranty</th></tr></thead><tbody>' + p.assets.map((a) => '<tr><td>' + HB.esc(a[0]) + '</td><td class="mono">' + HB.esc(a[1]) + '</td><td>' + (/ended|Out of/.test(a[2]) ? '<span class="muted">' + HB.esc(a[2]) + '</span>' : HB.esc(a[2])) + '</td></tr>').join('') + '</tbody></table></div></section></div>' +
      '<aside class="stack-l"><section class="sheet pad"><div class="sec-head"><h2>End of tenancy / void</h2></div><p class="muted">' + (HB.eotPrice(p) ? 'Clean, void check and reinstatement. From <b class="mono" style="color:var(--ink)">' + HB.money(HB.eotPrice(p)) + '</b> for ' + p.beds + ' bed.' : 'Quoted separately for this size.') + '</p><p style="margin:10px 0">' + HB.rateChip + '</p><div class="row wrap"><button class="btn btn-ghost btn-sm" data-act="ev-new" data-type="eot" data-pid="' + p.id + '">' + HB.icon('calendar', 16) + 'Book a void job</button><a class="btn btn-quiet btn-sm" href="#/op/quotes">Quotes</a></div></section>' +
      '<section class="sheet pad"><div class="sec-head"><h2>Short-let registration</h2></div><label class="fld">England registration number <small>due by March 2027, confirm</small><input type="text" id="regno" value="' + HB.esc(p.regNo) + '" placeholder="Not registered yet" autocomplete="off"></label><div class="row wrap" style="margin-top:10px"><button class="btn btn-ghost btn-sm" data-act="reg-save" data-id="' + p.id + '">Save number</button>' + (p.regNo ? HB.chip('On file', 'ok') : HB.chip('Confirm when the register opens', 'warn')) + '</div></section><section class="sheet pad"><div class="sec-head"><h2>Booking feed</h2></div>' + icalChip(p) + '<p class="muted" style="margin:12px 0">' + (p.ical.status === 'synced' ? p.ical.n + ' upcoming bookings found. Turnovers are created from them automatically.' : 'No new events received. Ask the owner to re-share the iCal link from ' + HB.esc(p.platforms[0]) + '.') + '</p><button class="btn btn-ghost btn-sm" data-act="ical-sync" data-id="' + p.id + '">' + HB.icon('refresh', 16) + 'Sync now</button>' +
      '<hr class="divider"><div class="eyebrow" style="margin-bottom:10px">Next stays</div><ul class="hair">' + stays.map((s) => '<li style="padding:10px 0;display:flex;justify-content:space-between;gap:10px"><span>' + HB.fmt(s.start, 'day') + ' to ' + HB.fmt(s.end, 'short') + '</span><span class="muted">' + HB.esc(s.platform) + '</span></li>').join('') + '</ul></section>' +
      '<section class="sheet pad"><div class="sec-head"><h2>Cleanliness score</h2></div><div class="row"><b class="bigscore">' + HB.score(p.id) + '</b><span class="muted">of 100, last six turnovers</span><span class="sp"></span>' + HB.spark(p.trend, 120, 40) + '</div></section></aside></div>';
  }
  HB.eotPrice = (p) => S().rates.eot[Math.min(p.beds, 3)] || null;
  HB.act('reg-save', (el) => { const v = HB.$('#regno').value.trim(); HB.update((s) => { const p = s.props.find((x) => x.id === el.dataset.id); p.regNo = v; const c = s.compliance.find((k) => k.pid === p.id && k.type === 'register'); if (c) { c.last = v ? HB.TODAY : null; c.doc = v ? { name: 'Registration ' + v, added: HB.TODAY, size: 'number on file' } : null; } }); HB.toast(v ? 'Registration number saved' : 'Registration number cleared', { icon: 'file' }); });
  HB.act('reveal', (el) => { HB.ui.reveal[el.dataset.k] = !HB.ui.reveal[el.dataset.k]; HB.emit(); });
  HB.act('copy', (el) => { try { navigator.clipboard.writeText(el.dataset.v).catch(() => {}); } catch (e) { /* ignore */ } HB.toast('Copied', { icon: 'copy' }); });
  HB.act('ical-sync', (el) => { HB.update((s) => { const p = s.props.find((x) => x.id === el.dataset.id); p.ical.status = 'synced'; p.ical.last = 'just now'; if (!p.ical.n) p.ical.n = 2; }); HB.toast('Feed synced, bookings refreshed', { icon: 'ical' }); });
  HB.act('note-save', (el) => { const v = HB.$('#pn').value; HB.update((s) => { s.props.find((x) => x.id === el.dataset.id).notes = v; }); HB.toast('Notes saved'); });
  HB.act('rotate-code', (el) => {
    const p = HB.prop(el.dataset.id); const code = String(1000 + Math.floor(Math.random() * 9000));
    HB.confirm('Rotate the key-safe code?', 'A new code <b class="mono">' + code + '</b> is generated for ' + HB.esc(p.short) + '. Remember to set it on the physical safe, then it is logged against the visit.', 'Save new code', () => { HB.update((s) => { const q = s.props.find((x) => x.id === p.id); q.keysafe.code = code; q.keysafe.changed = HB.TODAY; s.history[p.id].unshift({ date: HB.TODAY, type: 'key', title: 'Key safe code changed', detail: 'Rotated from the property record.', rep: null }); }); HB.toast('Code saved and logged', { icon: 'key' }); });
  });

  /* ---------- inventory ---------- */
  const invAll = (pid) => S().inventory[pid].reduce((a, r) => a.concat(r.items), []);
  const isDiff = (it) => it.qty !== it.last || it.cond !== it.lastCond;
  function inventory(p) {
    const chk = HB.ui.inv.check; const rooms = S().inventory[p.id]; const diffs = invAll(p.id).filter(isDiff);
    const banner = chk ? (diffs.length ? '<div class="note-banner" style="margin-bottom:18px">' + HB.icon('alert', 20) + '<div style="flex:1"><b>' + HB.plural(diffs.length, 'difference') + ' since the last visit.</b> ' + diffs.map((i) => HB.esc(i.name) + (i.qty !== i.last ? ' (' + i.last + ' to ' + i.qty + ')' : ' (' + i.lastCond + ' to ' + i.cond + ')')).join(', ') + '.</div><button class="btn btn-ghost btn-sm" data-act="inv-accept" data-id="' + p.id + '">Accept as new baseline</button></div>' : '<div class="note-banner ok" style="margin-bottom:18px">' + HB.icon('check', 20) + '<div><b>Everything matches the last visit.</b> No missing or changed items.</div></div>') : '';
    return '<div class="row wrap" style="justify-content:space-between;margin-bottom:18px"><div><h2 style="font-size:22px">Inventory</h2><p class="muted">' + HB.plural(invAll(p.id).length, 'item') + ' across ' + HB.plural(rooms.length, 'room') + '. Counts update when you or the runner change them.</p></div><div class="row wrap"><button class="btn ' + (chk ? 'btn-primary' : 'btn-ghost') + '" data-act="inv-check" aria-pressed="' + chk + '">' + HB.icon('list', 18) + 'Check against last time</button><button class="btn btn-ghost" data-act="inv-add" data-id="' + p.id + '">' + HB.icon('plus', 18) + 'Add item</button></div></div>' + banner +
      '<div class="stack-l">' + rooms.map((r) => {
        const rd = r.items.filter(isDiff).length;
        return '<section class="sheet"><div class="room-h"><h3>' + HB.esc(r.room) + '</h3><span class="muted">' + HB.plural(r.items.length, 'item') + '</span>' + (chk && rd ? HB.chip(rd + ' changed', 'warn') : '') + '</div><ul class="hair inv">' + r.items.map((it) => {
          const d = chk && isDiff(it);
          return '<li class="inv-row' + (d ? ' diff' : '') + '"><label class="inv-ph" title="' + (it.photo ? 'Photo on file' : 'Add a photo') + '">' + (it.photo ? '<img src="' + (it.photo.indexOf('blob:') === 0 ? it.photo : HB.photo(it.photo)) + '" alt="' + HB.esc(it.name) + ' photo">' : HB.icon('camera', 20)) + '<input type="file" accept="image/*" hidden data-change="inv-photo" data-id="' + it.id + '" data-pid="' + p.id + '"><span class="sr">Photo for ' + HB.esc(it.name) + '</span></label>' +
            '<div class="inv-n"><b>' + HB.esc(it.name) + '</b>' + (it.note ? '<span class="muted">' + HB.esc(it.note) + '</span>' : '') + (d ? '<span class="difftxt">' + (it.qty !== it.last ? (it.qty < it.last ? 'Missing ' + (it.last - it.qty) + '. ' : 'Extra ' + (it.qty - it.last) + '. ') : '') + (it.cond !== it.lastCond ? 'Condition changed from ' + it.lastCond + ' to ' + it.cond + '.' : '') + '</span>' : '') + '</div>' +
            (chk ? '<span class="mono muted last">last ' + it.last + '</span>' : '') +
            '<div class="stepper" role="group" aria-label="Quantity of ' + HB.esc(it.name) + '"><button data-act="inv-qty" data-id="' + it.id + '" data-pid="' + p.id + '" data-d="-1" aria-label="One fewer">' + HB.icon('minus', 16) + '</button><output>' + it.qty + '</output><button data-act="inv-qty" data-id="' + it.id + '" data-pid="' + p.id + '" data-d="1" aria-label="One more">' + HB.icon('plus', 16) + '</button></div>' +
            '<div class="seg cond" role="group" aria-label="Condition of ' + HB.esc(it.name) + '">' + ['good', 'worn', 'damaged'].map((c) => '<button data-act="inv-cond" data-id="' + it.id + '" data-pid="' + p.id + '" data-c="' + c + '" aria-pressed="' + (it.cond === c) + '">' + c + '</button>').join('') + '</div></li>';
        }).join('') + '</ul></section>';
      }).join('') + '</div>';
  }
  const findItem = (pid, id) => invAll(pid).find((i) => i.id === id);
  HB.act('inv-check', () => { HB.ui.inv.check = !HB.ui.inv.check; HB.emit(); });
  HB.act('inv-qty', (el) => HB.update((s) => { const i = s.inventory[el.dataset.pid].reduce((a, r) => a.concat(r.items), []).find((x) => x.id === el.dataset.id); i.qty = Math.max(0, Math.min(99, i.qty + Number(el.dataset.d))); }));
  HB.act('inv-cond', (el) => HB.update((s) => { const i = s.inventory[el.dataset.pid].reduce((a, r) => a.concat(r.items), []).find((x) => x.id === el.dataset.id); i.cond = el.dataset.c; }));
  HB.act('inv-photo', (el) => { const im = HB.images(el.files)[0]; if (!im) return; HB.update((s) => { s.inventory[el.dataset.pid].reduce((a, r) => a.concat(r.items), []).find((x) => x.id === el.dataset.id).photo = im.src; }); HB.toast('Photo attached', { icon: 'camera' }); });
  HB.act('inv-accept', (el) => { HB.update((s) => { s.inventory[el.dataset.id].forEach((r) => r.items.forEach((i) => { i.last = i.qty; i.lastCond = i.cond; })); }); HB.toast('New baseline saved for the next visit'); });
  HB.act('inv-add', (el) => {
    const p = HB.prop(el.dataset.id);
    HB.modal({ title: 'Add an inventory item', body: '<div class="form-grid"><label class="fld">Room<select name="room">' + S().inventory[p.id].map((r) => '<option>' + HB.esc(r.room) + '</option>').join('') + '</select></label><label class="fld">Quantity<input type="number" name="qty" value="1" min="0" max="99"></label><label class="fld full">Item<input type="text" name="name" placeholder="e.g. Cafetière"></label></div>', confirm: 'Add item',
      onConfirm: (dlg) => { const f = HB.formData(dlg); if (!f.name.trim()) { HB.toast('Give the item a name', { icon: 'alert' }); return false; } HB.update((s) => { const r = s.inventory[p.id].find((x) => x.room === f.room); const q = Number(f.qty) || 0; r.items.push({ id: HB.uid(p.id + '-i'), name: f.name.trim(), qty: q, last: q, cond: 'good', lastCond: 'good', note: '', photo: null }); }); HB.toast('Item added to ' + f.room); } });
  });

  /* ---------- checklists ---------- */
  function checklists(p) {
    const todos = S().todos[p.id];
    return '<div class="cols-2" style="gap:36px"><section><div class="sec-head"><h2>Turnover template</h2><span class="muted" style="font-size:13px">Used by the runner for every turnover</span></div><div class="stack">' + S().checklist[p.id].map((r, ri) => '<details class="tplroom sheet" ' + (ri < 2 ? 'open' : '') + '><summary><b>' + HB.esc(r.name) + '</b><span class="muted">' + HB.plural(r.tasks.length, 'task') + '</span>' + HB.icon('chev-d', 16) + '</summary><ul class="hair tpl">' + r.tasks.map((t, ti) => '<li><span>' + HB.esc(t.text) + '</span><button class="btn btn-quiet btn-xs" data-act="tpl-del" data-pid="' + p.id + '" data-r="' + ri + '" data-t="' + ti + '" aria-label="Remove task">' + HB.icon('x', 16) + '</button></li>').join('') + '</ul><form class="pill-input" data-submit="tpl-add" data-pid="' + p.id + '" data-r="' + ri + '"><label class="sr" for="ta' + ri + '">Add a task to ' + HB.esc(r.name) + '</label><input id="ta' + ri + '" type="text" name="t" placeholder="Add a task to this room" autocomplete="off"><button class="btn btn-ghost btn-sm" type="submit">Add</button></form></details>').join('') + '</div></section>' +
      '<section><div class="sec-head"><h2>This property\'s to-do list</h2></div><p class="muted" style="margin:-6px 0 16px">Specific to ' + HB.esc(p.short) + '. "Every turnover" items appear in the runner each time; one-off items drop off once ticked.</p><div class="sheet pad"><ul class="todos">' +
      (todos.length ? todos.map((t, i) => '<li class="todo-row"><div class="reorder"><button data-act="todo-mv" data-pid="' + p.id + '" data-i="' + i + '" data-d="-1" aria-label="Move up"' + (i === 0 ? ' disabled' : '') + '>' + HB.icon('arrow-up', 15) + '</button><button data-act="todo-mv" data-pid="' + p.id + '" data-i="' + i + '" data-d="1" aria-label="Move down"' + (i === todos.length - 1 ? ' disabled' : '') + '>' + HB.icon('arrow-down', 15) + '</button></div><input type="text" value="' + HB.esc(t.text) + '" data-change="todo-text" data-pid="' + p.id + '" data-i="' + i + '" aria-label="To-do text"><button class="chip ' + (t.freq === 'every' ? 'chip-info' : 'chip-muted') + '" data-act="todo-freq" data-pid="' + p.id + '" data-i="' + i + '" title="Click to switch" style="min-height:44px">' + (t.freq === 'every' ? 'Every turnover' : 'One-off') + '</button><button class="btn btn-quiet btn-xs" data-act="todo-del" data-pid="' + p.id + '" data-i="' + i + '" aria-label="Delete to-do">' + HB.icon('trash', 16) + '</button></li>').join('') : '<li>' + HB.empty('list', 'No custom to-dos yet', 'Add the things only this property needs, like winding a blind cord.') + '</li>') +
      '</ul><form class="todo-add" data-submit="todo-add" data-pid="' + p.id + '"><label class="sr" for="tdn">New to-do</label><input id="tdn" type="text" name="t" placeholder="Add a to-do for this property" autocomplete="off"><label class="sr" for="tdf">How often</label><select id="tdf" name="f" style="width:auto"><option value="every">Every turnover</option><option value="once">One-off</option></select><button class="btn btn-primary" type="submit">' + HB.icon('plus', 18) + 'Add</button></form>' +
      '<hr class="divider"><div class="row wrap"><button class="btn btn-ghost" data-act="tpl-save" data-pid="' + p.id + '">' + HB.icon('copy', 18) + 'Save as template</button><label class="fld" style="grid-auto-flow:column;align-items:center;gap:8px"><span class="sr">Start from a template</span><select data-change="tpl-apply" data-pid="' + p.id + '" aria-label="Start from a template"><option value="">Start from a template…</option>' + S().templates.map((t) => '<option value="' + t.id + '">' + HB.esc(t.name) + '</option>').join('') + '</select></label></div></div></section></div>';
  }
  HB.act('tpl-del', (el) => HB.update((s) => { s.checklist[el.dataset.pid][el.dataset.r].tasks.splice(Number(el.dataset.t), 1); }));
  HB.act('tpl-add', (el) => { const f = HB.formData(el); if (!f.t.trim()) { HB.toast('Type a task first', { icon: 'alert' }); return; } HB.update((s) => { const r = s.checklist[el.dataset.pid][el.dataset.r]; r.tasks.push({ id: HB.uid(r.id + 't'), text: f.t.trim() }); }); el.reset(); });
  HB.act('todo-add', (el) => { const f = HB.formData(el); if (!f.t.trim()) { HB.toast('Type a to-do first', { icon: 'alert' }); return; } HB.update((s) => { s.todos[el.dataset.pid].push({ id: HB.uid('td'), text: f.t.trim(), freq: f.f }); }); el.reset(); HB.toast('To-do added'); });
  HB.act('todo-text', (el) => HB.update((s) => { s.todos[el.dataset.pid][el.dataset.i].text = el.value; }));
  HB.act('todo-freq', (el) => HB.update((s) => { const t = s.todos[el.dataset.pid][el.dataset.i]; t.freq = t.freq === 'every' ? 'once' : 'every'; }));
  HB.act('todo-del', (el) => HB.update((s) => { s.todos[el.dataset.pid].splice(Number(el.dataset.i), 1); }));
  HB.act('todo-mv', (el) => HB.update((s) => { const a = s.todos[el.dataset.pid]; const i = Number(el.dataset.i), j = i + Number(el.dataset.d); if (j < 0 || j >= a.length) return; const t = a[i]; a[i] = a[j]; a[j] = t; }));
  HB.act('tpl-save', (el) => HB.modal({ title: 'Save as template', sub: 'Reuse this list when you onboard a similar property.', body: '<label class="fld">Template name<input type="text" name="n" value="' + HB.esc(HB.prop(el.dataset.pid).short) + ' list"></label>', confirm: 'Save template', onConfirm: (dlg) => { const n = HB.formData(dlg).n.trim(); if (!n) return false; HB.update((s) => { s.templates.push({ id: HB.uid('tpl'), name: n, items: s.todos[el.dataset.pid].map((t) => ({ text: t.text, freq: t.freq })) }); }); HB.toast('Template saved: ' + n, { icon: 'copy' }); } }));
  HB.act('tpl-apply', (el) => { const t = S().templates.find((x) => x.id === el.value); if (!t) return; const pid = el.dataset.pid; HB.update((s) => { s.todos[pid] = s.todos[pid].concat(t.items.map((x) => ({ id: HB.uid('td'), text: x.text, freq: x.freq }))); }); HB.toast(HB.plural(t.items.length, 'to-do') + ' added from "' + t.name + '"'); el.value = ''; });

  /* ---------- compliance / history / retainer ---------- */
  function compliance(p) {
    const items = HB.complianceItems().filter((c) => c.pid === p.id).sort((a, b) => a.days - b.days);
    return '<div class="sec-head"><h2>Compliance for ' + HB.esc(p.short) + '</h2><a href="#/op/compliance">All properties</a></div>' + HB.complianceTable(items, { noProp: true }) + '<p class="footnote" style="margin-top:14px">' + HB.complianceNote + '</p>';
  }
  const TLI = { turnover: ['check', 'ok'], key: ['key', ''], inspection: ['report', ''], maintenance: ['wrench', 'warn'], compliance: ['shield', ''], issue: ['alert', 'warn'], request: ['quote', 'info'] };
  function history(p) {
    const h = S().history[p.id].slice().sort((a, b) => (a.date < b.date ? 1 : -1));
    return '<div class="cols"><section><div class="sec-head"><h2>History</h2></div><ol class="tl">' + h.map((x) => '<li><span class="dot ' + TLI[x.type][1] + '">' + HB.icon(TLI[x.type][0], 17) + '</span><div><div class="when">' + HB.fmt(x.date, 'day').toUpperCase() + '</div><h4>' + HB.esc(x.title) + '</h4><p>' + HB.esc(x.detail) + '</p>' + (x.rep && HB.report(x.rep) ? '<a class="btn btn-quiet btn-xs" href="#/op/reports/' + x.rep + '" style="margin-top:4px;padding-left:0">View report ' + HB.icon('chev-r', 14) + '</a>' : '') + '</div></li>').join('') + '</ol></section><aside class="sheet pad"><div class="sec-head"><h2>Reports</h2></div>' + (HB.propReports(p.id).length ? '<ul class="hair">' + HB.propReports(p.id).slice(0, 5).map((r) => '<li style="padding:12px 0"><a href="#/op/reports/' + r.id + '" class="row" style="justify-content:space-between"><span>' + HB.fmt(r.date, 'day') + '</span><span class="mono">' + r.score + '</span></a></li>').join('') + '</ul>' : HB.empty('report', 'No reports yet', 'The first completed turnover builds one.')) + '</aside></div>';
  }
  function retainer(p) {
    const o = HB.owner(p.ownerId); const pl = S().plans[o.id]; const on = HB.onClub(p.id); const R = S().rates;
    const ev = S().events.filter((e) => e.pid === p.id && e.date.slice(0, 7) === HB.TODAY.slice(0, 7) && e.date <= HB.TODAY).length;
    return '<div class="cols"><section class="sheet pad"><div class="row" style="justify-content:space-between"><div><div class="eyebrow">' + (on ? 'Priority Club, this property' : 'Not in the Priority Club') + '</div><h2 style="font-size:28px;margin-top:8px">' + (on ? HB.money(R.club.monthly) + ' <span class="muted" style="font-weight:400">a month</span>' : 'General rates') + '</h2></div>' + HB.chip(on ? 'Active' : 'Pay as you go', on ? 'ok' : 'muted') + '</div>' +
      (on ? '<dl class="kv" style="margin-top:14px"><div><dt>Minimum term</dt><dd>' + R.club.term + ' months from ' + HB.fmt(pl.start, 'full') + '</dd></div><div><dt>Term end</dt><dd><b>' + HB.fmt(pl.termEnd, 'full') + '</b> · renewal date</dd></div></dl>' : '<p class="muted" style="margin-top:12px">Ask ' + HB.esc(o.name.split(' ')[0]) + ' about joining: key holding is included and lock-out attendance is from ' + HB.money(R.club.lockout) + '.</p>') +
      '<hr class="divider"><ul class="incl">' + pl.includes.map((x) => '<li>' + HB.icon('check', 16) + HB.esc(x) + '</li>').join('') + '</ul><hr class="divider"><div class="eyebrow">Used this month, all of ' + HB.esc(o.name.split(' ')[0]) + '\'s properties</div>' + HB.usageHTML(pl) + '</section><aside class="sheet pad"><div class="sec-head"><h2>This month at ' + HB.esc(p.short) + '</h2></div><p><b class="bigscore">' + ev + '</b> <span class="muted">visits so far</span></p><p style="margin:14px 0">' + HB.rateChip + '</p><a class="btn btn-ghost" href="#/op/billing">' + HB.icon('card', 18) + 'Open billing</a></aside></div>';
  }
})();
