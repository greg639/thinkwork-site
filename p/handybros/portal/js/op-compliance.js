/* Operator: Compliance and reminders */
(function () {
  const S = () => HB.S;
  HB.ui.comp = { f: 'all', pid: 'all', sel: 'c14' };
  HB.complianceNote = 'Obligations depend on the letting type (holiday let, short-term let or standard tenancy) and on the property. The basis tags are guidance drawn from council, HSE and fire-service pages, not legal advice, and every item must be confirmed with the local council, the fire and rescue service and your insurer. England is expected to bring in a short-let register by March 2027; registration numbers will be tracked here once the details are confirmed.';

  HB.complianceTable = (items, o) => {
    o = o || {};
    if (!items.length) return HB.empty('shield', 'Nothing to show', 'No items match this filter.');
    return '<div class="tbl-wrap"><table class="tbl comp"><thead><tr>' + (o.noProp ? '' : '<th>Property</th>') + '<th>Item</th><th>Basis</th><th>Last done</th><th>Due</th><th>Status</th><th>Who</th><th></th></tr></thead><tbody>' + items.map((c) =>
      '<tr class="' + (HB.ui.comp.sel === c.id ? 'sel' : '') + '" data-act="comp-sel" data-id="' + c.id + '">' + (o.noProp ? '' : '<td><a href="#/op/properties/' + c.pid + '/compliance"><b>' + HB.esc(c.p.short) + '</b></a><br><span class="muted">' + HB.esc(c.p.town) + '</span></td>') +
      '<td><div class="ci">' + HB.icon(c.t.icon, 18) + '<div><b>' + HB.esc(c.t.name.replace(' (EICR)', '').replace(' (EPC)', '')) + '</b><br><span class="muted">' + HB.esc(c.t.cycle) + '</span></div></div></td><td>' + HB.basisChip(c.t) + '</td><td class="mono">' + (c.last ? HB.fmt(c.last, 'full') : 'Never') + '</td><td><b>' + HB.fmt(c.due, 'full') + '</b><br><span class="muted">' + HB.dueLabel(c) + '</span></td><td>' + HB.rag(c) + (c.booked ? '<br><span class="chip chip-info" style="margin-top:6px">Booked ' + HB.fmt(c.booked, 'short') + '</span>' : '') + '</td><td>' + HB.esc(c.resp) + '</td>' +
      '<td><div class="acts"><button class="btn btn-ghost btn-xs" data-act="comp-remind" data-id="' + c.id + '" aria-label="Remind owner about ' + HB.esc(c.t.name) + ' at ' + HB.esc(c.p.short) + '">' + HB.icon('bell', 15) + 'Remind owner</button><button class="btn btn-ghost btn-xs" data-act="comp-book" data-id="' + c.id + '" aria-label="Book an engineer for ' + HB.esc(c.t.name) + '">' + HB.icon('wrench', 15) + 'Book</button><button class="btn btn-quiet btn-xs" data-act="comp-done" data-id="' + c.id + '" aria-label="Mark ' + HB.esc(c.t.name) + ' done">' + HB.icon('check', 15) + 'Done</button></div></td></tr>').join('') + '</tbody></table></div>';
  };

  const first = (n) => n.split(/[ &]/)[0];
  function preview(c) {
    if (!c) return HB.empty('bell', 'Pick an item', 'Select a row to preview the reminder.');
    const o = HB.owner(c.p.ownerId); const set = S().settings.reminder; const date = HB.fmt(c.due, 'long'); const when = c.days < 0 ? 'overdue by ' + HB.plural(-c.days, 'day') : c.days === 0 ? 'due today' : 'due in ' + HB.plural(c.days, 'day');
    const who = c.resp === 'Owner' ? 'This one sits with you, so we can arrange the engineer and let them in if you like.' : 'This is on our list, and we will do it at the next visit unless you would rather arrange it yourself.';
    const subj = c.t.name.replace(' (EICR)', '').replace(' (EPC)', '') + ' at ' + c.p.short + ' is ' + when;
    const steps = [60, 30, 7].map((n) => ({ n, on: set['d' + n], past: c.days <= n }));
    return '<div class="rem-steps">' + steps.map((s) => '<span class="rs ' + (s.past ? 'past' : '') + (s.on ? '' : ' off') + '">' + HB.icon(s.past ? 'check' : 'clock', 14) + s.n + ' days' + '</span>').join('') + '</div>' +
      (set.email ? '<div class="msg-prev"><div class="mp-h">' + HB.icon('mail', 16) + '<span>Email to ' + HB.esc(o.name) + '</span></div><div class="mp-b"><b>' + HB.esc(subj) + '</b><p>Hi ' + HB.esc(first(o.name)) + ',</p><p>The ' + HB.esc(c.t.name.toLowerCase()) + ' for ' + HB.esc(HB.addr(c.p)) + ' is ' + when + ' (' + HB.esc(date) + ').</p><p>' + HB.esc(who) + '</p><p><span class="btn btn-primary btn-sm" aria-hidden="true">Book it in your portal</span></p><p class="muted" style="font-size:12.5px">Whether this applies depends on how the property is let. Check with your insurer if unsure.</p></div></div>' : '') +
      (set.sms ? '<div class="msg-prev sms"><div class="mp-h">' + HB.icon('sms', 16) + '<span>SMS to ' + HB.esc(o.phone) + '</span></div><div class="mp-b"><p class="bubble">HandyBros: ' + HB.esc(c.t.name) + ' at ' + HB.esc(c.p.short) + ' is ' + when + ' (' + HB.fmt(c.due, 'short') + '). Book in your owner portal: <span class="todo">[portal link]</span></p></div></div>' : '') +
      (!set.email && !set.sms ? '<p class="muted">Turn on email or SMS to send reminders.</p>' : '');
  }

  HB.view('op.compliance', {
    title: () => 'Compliance',
    render() {
      const u = HB.ui.comp; let items = HB.complianceItems();
      const cnt = { r: items.filter((c) => c.rag === 'r').length, a: items.filter((c) => c.rag === 'a').length, g: items.filter((c) => c.rag === 'g').length };
      if (u.pid !== 'all') items = items.filter((c) => c.pid === u.pid);
      items = items.filter((c) => u.f === 'all' ? true : u.f === 'r' ? c.rag === 'r' : u.f === 'a' ? c.rag === 'a' : u.f === 'hb' ? c.resp === 'HandyBros' : c.resp === 'Owner').sort((a, b) => a.days - b.days);
      const set = S().settings.reminder; const sel = HB.complianceItems().find((c) => c.id === u.sel);
      const flt = [['all', 'All'], ['r', 'Overdue ' + cnt.r], ['a', 'Due soon ' + cnt.a], ['hb', 'HandyBros'], ['ow', 'Owner']];
      return HB.pageHead('Compliance and reminders', cnt.r + ' overdue, ' + cnt.a + ' coming up.', 'One table across every property. Reminders go to owners at 60, 30 and 7 days by email and SMS, and book the engineer when they say yes.') +
        '<div class="cols"><div class="stack-l"><div class="row wrap"><div class="seg" role="group" aria-label="Filter">' + flt.map((f) => '<button data-act="comp-f" data-f="' + f[0] + '" aria-pressed="' + (u.f === f[0]) + '">' + f[1] + '</button>').join('') + '</div><label class="fld" style="margin-left:auto"><span class="sr">Property</span><select data-change="comp-pid" data-sync aria-label="Filter by property"><option value="all">All properties</option>' + S().props.map((p) => '<option value="' + p.id + '"' + (u.pid === p.id ? ' selected' : '') + '>' + HB.esc(p.short) + '</option>').join('') + '</select></label></div>' + HB.complianceTable(items) + '<p class="footnote">' + HB.complianceNote + '</p></div>' +
        '<aside class="stack-l"><section class="sheet pad"><div class="sec-head"><h2>Reminder automation</h2></div>' +
        '<div class="switchrow"><div><b>60 days before</b><span class="muted">First heads-up</span></div><button class="switch" role="switch" data-act="rem-set" data-k="d60" aria-checked="' + set.d60 + '" aria-label="60 days"></button></div>' +
        '<div class="switchrow"><div><b>30 days before</b><span class="muted">Book now</span></div><button class="switch" role="switch" data-act="rem-set" data-k="d30" aria-checked="' + set.d30 + '" aria-label="30 days"></button></div>' +
        '<div class="switchrow"><div><b>7 days before</b><span class="muted">Final nudge</span></div><button class="switch" role="switch" data-act="rem-set" data-k="d7" aria-checked="' + set.d7 + '" aria-label="7 days"></button></div><hr class="divider">' +
        '<div class="switchrow"><div><b>' + HB.icon('mail', 16) + ' Email</b></div><button class="switch" role="switch" data-act="rem-set" data-k="email" aria-checked="' + set.email + '" aria-label="Email"></button></div>' +
        '<div class="switchrow"><div><b>' + HB.icon('sms', 16) + ' SMS</b></div><button class="switch" role="switch" data-act="rem-set" data-k="sms" aria-checked="' + set.sms + '" aria-label="SMS"></button></div></section>' +
        '<section><div class="sec-head"><h2>Live preview</h2>' + (sel ? '<span class="muted" style="font-size:13px">' + HB.esc(sel.p.short) + '</span>' : '') + '</div>' + preview(sel) + '</section></aside></div>';
    }
  });
  HB.act('comp-f', (el) => { HB.ui.comp.f = el.dataset.f; HB.emit(); });
  HB.act('comp-pid', (el) => { HB.ui.comp.pid = el.value; HB.emit(); });
  HB.act('comp-sel', (el, e) => { if (e.target.closest('a,button')) return; HB.ui.comp.sel = el.dataset.id; HB.emit(); });
  HB.act('rem-set', (el) => HB.update((s) => { const r = s.settings.reminder; r[el.dataset.k] = !r[el.dataset.k]; }));
  HB.act('comp-remind', (el) => {
    const c = HB.complianceItems().find((x) => x.id === el.dataset.id); HB.ui.comp.sel = c.id; const set = S().settings.reminder; const ch = [set.email && 'email', set.sms && 'SMS'].filter(Boolean);
    if (!ch.length) { HB.toast('Turn on email or SMS first', { icon: 'alert' }); HB.emit(); return; }
    HB.update((s) => { const x = s.compliance.find((k) => k.id === c.id); x.reminded = HB.TODAY; s.reminderLog.unshift({ cid: c.id, at: HB.clock(), ch }); });
    HB.toast('Reminder sent to ' + first(HB.owner(c.p.ownerId).name) + ' by ' + ch.join(' and '), { icon: 'bell' });
  });
  const engineer = { gas: 'Gas Safe registered engineer', boiler: 'Gas Safe registered engineer', eicr: 'Registered electrician', pat: 'PAT tester', alarms: 'HandyBros', fire: 'Fire risk assessor', legionella: 'Water hygiene assessor', epc: 'Domestic energy assessor', ext: 'Fire equipment engineer' };
  HB.act('comp-book', (el) => {
    const c = HB.complianceItems().find((x) => x.id === el.dataset.id);
    HB.modal({ title: 'Book an engineer', sub: HB.esc(c.t.name) + ' at ' + HB.esc(c.p.name),
      body: '<div class="form-grid"><label class="fld full">Engineer<input type="text" name="eng" value="' + HB.esc(engineer[c.type]) + '"></label><label class="fld">Date<input type="date" name="date" value="' + HB.d(Math.max(3, Math.min(10, c.days < 0 ? 4 : c.days - 1))) + '"></label><label class="fld">Arrive<select name="start"><option>09:00</option><option>11:00</option><option>13:00</option><option>15:00</option></select></label></div><p class="muted" style="margin-top:12px">HandyBros will let the engineer in, using the key set on file, and log the visit.</p>',
      confirm: 'Book and add to calendar',
      onConfirm: (dlg) => { const f = HB.formData(dlg); HB.update((s) => { s.compliance.find((k) => k.id === c.id).booked = f.date; s.events.push({ id: HB.uid('e'), type: 'maintenance', date: f.date, start: f.start, dur: 1.5, title: 'Engineer: ' + c.t.name.replace(' (EICR)', '').replace(' (EPC)', ''), pid: c.pid, who: 'Sam', auto: false }); }); HB.toast('Booked for ' + HB.fmt(f.date, 'day'), { icon: 'calendar' }); } });
  });
  HB.act('comp-done', (el) => {
    const c = HB.complianceItems().find((x) => x.id === el.dataset.id);
    HB.modal({ title: 'Mark as done', sub: HB.esc(c.t.name) + ' at ' + HB.esc(c.p.name),
      body: '<div class="form-grid"><label class="fld">Completed on<input type="date" name="date" value="' + HB.TODAY + '"></label><label class="fld">Certificate <small>optional</small><input type="file" name="f"></label></div><p class="muted" style="margin-top:12px">The next due date is set from the cycle: ' + HB.esc(c.t.cycle.toLowerCase()) + '.</p>',
      confirm: 'Save',
      onConfirm: (dlg) => { const f = HB.formData(dlg); const file = HB.$('input[type=file]', dlg).files[0]; HB.update((s) => { const x = s.compliance.find((k) => k.id === c.id); x.last = f.date; x.due = HB.addMonths(f.date, c.t.months); x.booked = null; x.reminded = null; if (file) x.doc = { name: file.name, added: f.date, size: Math.max(1, Math.round(file.size / 1024)) + ' KB' }; s.history[c.pid].unshift({ date: f.date, type: 'compliance', title: c.t.name + ' completed', detail: 'Next due ' + HB.fmt(x.due, 'full') + '.', rep: null }); }); HB.toast('Saved. Next due ' + HB.fmt(HB.addMonths(f.date, c.t.months), 'short'), { icon: 'shield' }); } });
  });
})();
