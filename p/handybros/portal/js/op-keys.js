/* Operator: Keys and on-call lock-out */
(function () {
  const S = () => HB.S;
  HB.ui.keys = { pid: 'all' };
  const WHERE = ['Key safe', 'Van', 'Office', 'With owner', 'With cleaner'];
  const wk = { 'Key safe': 'ok', Van: 'info', Office: 'muted', 'With owner': 'brand', 'With cleaner': 'warn' };
  const ks = (id) => S().keysets.find((k) => k.id === id);

  function move(keyId, action, by, where, note) {
    const k = ks(keyId);
    HB.update((s) => {
      const x = s.keysets.find((q) => q.id === keyId); x.where = where; x.holder = where === 'Key safe' ? 'In key safe at property' : where === 'Office' ? 'Office lockbox' : where === 'With owner' ? HB.owner(HB.prop(x.pid).ownerId).name : by; x.moved = HB.TODAY;
      s.keylog.unshift({ date: HB.TODAY, time: HB.clock(), keyId, action, by, note: note || '' });
    });
    return k;
  }

  const wf = [
    ['Accept the call-out', 'Done when you tap Accept on Today or here.'],
    ['Verify the booking', 'A guest is in-house at Kestrel House on the Booking.com feed (arrived yesterday, 3 nights). Name on the message matches the booking.'],
    ['Choose how to get them in', 'Remote: text the key-safe code. On site: take Set B from the van.'],
    ['Log the key movement', 'Check Set B out to Sam so the register is right.'],
    ['Guest is inside', 'Confirm with the guest and note the time.'],
    ['Rotate the key-safe code', 'The code was shared, so set a new one and log it.']
  ];

  HB.view('op.keys', {
    title: () => 'Keys',
    render() {
      const L = S().lockout; const u = HB.ui.keys; const p = HB.prop(L.pid);
      const sets = S().keysets.filter((k) => u.pid === 'all' || k.pid === u.pid);
      const done = L.steps.filter(Boolean).length;
      const flow = '<section class="sheet pad lock ' + L.status + '"><div class="row" style="justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px"><div><div class="eyebrow">On-call lock-out workflow</div><h2 style="font-size:24px;margin-top:8px">' + HB.esc(L.guest) + '</h2><p class="muted" style="margin-top:6px;max-width:60ch">' + HB.esc(p.name) + ', ' + HB.esc(p.town) + ' · received ' + L.received + ' by ' + HB.esc(L.channel) + '</p></div>' + (L.status === 'incoming' ? '<span class="chip chip-bad"><span class="ping" style="margin-right:2px"></span>Incoming</span>' : L.status === 'resolved' ? HB.chip('Resolved', 'ok') : HB.chip('In progress', 'info')) + '</div><div class="note-banner bad" style="margin:16px 0">' + HB.icon('alert', 18) + '<div>' + HB.esc(L.note) + '</div></div>' +
        (L.status === 'incoming' ? '<div class="row wrap"><button class="btn btn-primary" data-act="lock-accept">' + HB.icon('van', 18) + 'Accept and head over</button><button class="btn btn-ghost" data-act="lock-call">Call guest</button></div>'
          : '<ol class="wf">' + wf.map((w, i) => '<li class="' + (L.steps[i] ? 'done' : (i === L.steps.findIndex((x) => !x) ? 'now' : '')) + '"><button class="wf-c" data-act="wf-step" data-i="' + i + '" aria-pressed="' + L.steps[i] + '" aria-label="' + (L.steps[i] ? 'Mark not done: ' : 'Mark done: ') + w[0] + '">' + (L.steps[i] ? HB.icon('check', 16) : '<span>' + (i + 1) + '</span>') + '</button><div><b>' + w[0] + '</b><p class="muted">' + w[1] + '</p>' +
            (i === 2 && !L.steps[2] ? '<div class="row wrap" style="margin-top:8px"><button class="btn btn-ghost btn-sm" data-act="lock-code">Text the key-safe code</button><button class="btn btn-ghost btn-sm" data-act="wf-step" data-i="2">Attend with Set B</button></div>' : '') +
            (i === 3 && !L.steps[3] ? '<div style="margin-top:8px"><button class="btn btn-ghost btn-sm" data-act="wf-out">Check Set B out to Sam</button></div>' : '') +
            (i === 5 && !L.steps[5] ? '<div style="margin-top:8px"><button class="btn btn-ghost btn-sm" data-act="wf-rotate">Rotate and log new code</button></div>' : '') + '</div></li>').join('') + '</ol><div class="row wrap" style="margin-top:16px"><div class="bar" style="flex:1;min-width:120px"><i style="width:' + done / 6 * 100 + '%"></i></div><span class="mono muted">' + done + '/6</span>' + (L.status !== 'resolved' ? '<button class="btn btn-primary" data-act="wf-resolve"' + (done < 6 ? ' aria-disabled="true"' : '') + '>Resolve call-out</button>' : '<button class="btn btn-ghost" data-act="wf-reset">Reset demo call-out</button>') + '</div>') + '</section>';
      return HB.pageHead('Keys', 'Every spare set, and where it is right now.', 'A register for each property, a check-out and check-in log with timestamps, and a guided workflow for when a guest is locked out.',
        '<button class="btn btn-primary" data-act="key-quick">' + HB.icon('key', 18) + 'Log a key movement</button>') +
        flow +
        '<div class="cols section"><section><div class="sec-head"><h2>Key register</h2><label class="fld"><span class="sr">Property</span><select data-change="keys-pid" data-sync aria-label="Filter by property"><option value="all">All properties</option>' + S().props.map((q) => '<option value="' + q.id + '"' + (u.pid === q.id ? ' selected' : '') + '>' + HB.esc(q.short) + '</option>').join('') + '</select></label></div>' +
        '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Property</th><th>Set</th><th>Where</th><th>Held by</th><th>Moved</th><th></th></tr></thead><tbody>' + sets.map((k) => { const q = HB.prop(k.pid); const inSafe = k.where === 'Key safe'; return '<tr><td><b>' + HB.esc(q.short) + '</b></td><td>' + HB.esc(k.label) + '<br><span class="muted">' + k.copies + (k.copies === 1 ? ' copy' : ' copies') + '</span></td><td>' + HB.chip(k.where, wk[k.where]) + '</td><td>' + HB.esc(k.holder) + '</td><td class="mono">' + HB.fmt(k.moved, 'short') + '</td><td class="r"><div class="acts"><button class="btn btn-ghost btn-xs" data-act="key-out" data-id="' + k.id + '"' + (k.where === 'With owner' ? ' disabled' : '') + '>' + (inSafe ? 'Take' : 'Hand on') + '</button><button class="btn btn-ghost btn-xs" data-act="key-in" data-id="' + k.id + '">Return</button></div></td></tr>'; }).join('') + '</tbody></table></div></section>' +
        '<aside><div class="sec-head"><h2>Movement log</h2></div><ol class="klog">' + S().keylog.slice(0, 9).map((l) => { const k = ks(l.keyId); return '<li><span class="kdot ' + l.action + '">' + HB.icon(l.action === 'out' ? 'arrow-r' : 'undo', 14) + '</span><div><b>' + (l.action === 'out' ? 'Out' : 'In') + ': ' + HB.esc(HB.prop(k.pid).short) + ', ' + HB.esc(k.label.split(',')[0]) + '</b><p class="muted">' + HB.esc(l.by) + (l.note ? ' · ' + HB.esc(l.note) : '') + '</p></div><span class="mono muted">' + (l.date === HB.TODAY ? l.time : HB.fmt(l.date, 'short')) + '</span></li>'; }).join('') + '</ol></aside></div>';
    }
  });
  HB.act('keys-pid', (el) => { HB.ui.keys.pid = el.value; HB.emit(); });
  HB.act('wf-step', (el) => HB.update((s) => { const i = Number(el.dataset.i); s.lockout.steps[i] = !s.lockout.steps[i]; if (s.lockout.status === 'incoming') s.lockout.status = 'accepted'; }));
  HB.act('wf-out', () => { move('k-p5b', 'out', 'Sam', 'With cleaner', 'Lock-out call-out at Kestrel House'); HB.update((s) => { s.lockout.steps[3] = true; }); HB.toast('Set B logged out to Sam', { icon: 'key' }); });
  HB.act('wf-rotate', () => { const c = String(1000 + Math.floor(Math.random() * 9000)); HB.update((s) => { const q = s.props.find((x) => x.id === 'p5'); q.keysafe.code = c; q.keysafe.changed = HB.TODAY; s.lockout.steps[5] = true; s.history.p5.unshift({ date: HB.TODAY, type: 'key', title: 'Key safe code changed', detail: 'Rotated after a lock-out call-out.', rep: null }); }); HB.toast('New code ' + c + ' saved and logged', { icon: 'key' }); });
  HB.act('wf-resolve', () => {
    if (S().lockout.steps.some((x) => !x)) { HB.toast('Finish every step first', { icon: 'alert' }); return; }
    HB.update((s) => { s.lockout.status = 'resolved'; s.lockout.resolvedAt = HB.clock(); }); HB.toast('Call-out resolved and logged', { icon: 'check' });
  });
  HB.act('wf-reset', () => { HB.update((s) => { s.lockout.status = 'incoming'; s.lockout.steps = [false, false, false, false, false, false]; delete s.lockout.resolvedAt; }); HB.toast('Demo call-out reset'); });

  HB.act('key-out', (el) => HB.keyModal(el.dataset.id, 'out'));
  HB.act('key-in', (el) => HB.keyModal(el.dataset.id, 'in'));
  HB.act('key-quick', () => HB.keyModal(null, 'out'));
  HB.keyModal = (id, action) => {
    HB.modal({ title: action === 'out' ? 'Take or hand on a key set' : 'Return a key set', sub: 'The movement is logged with a timestamp.',
      body: '<div class="form-grid"><label class="fld full">Key set<select name="k" data-change="key-mode">' + S().keysets.map((k) => '<option value="' + k.id + '"' + (k.id === id ? ' selected' : '') + '>' + HB.esc(HB.prop(k.pid).short + ', ' + k.label + ' (' + k.where + ')') + '</option>').join('') + '</select></label>' +
        '<label class="fld">Action<select name="a"><option value="out"' + (action === 'out' ? ' selected' : '') + '>Check out</option><option value="in"' + (action === 'in' ? ' selected' : '') + '>Check in</option></select></label><label class="fld">Who<select name="by"><option>Alex</option><option>Sam</option><option>Owner</option></select></label>' +
        '<label class="fld">Now with / back to<select name="w">' + WHERE.map((w) => '<option>' + w + '</option>').join('') + '</select></label><label class="fld">Note <small>optional</small><input type="text" name="n"></label></div>',
      confirm: 'Log it',
      onMount: (dlg) => { if (action === 'in') HB.$('[name=w]', dlg).value = 'Key safe'; else HB.$('[name=w]', dlg).value = 'Van'; },
      onConfirm: (dlg) => { const f = HB.formData(dlg); move(f.k, f.a, f.by, f.w, f.n); HB.toast('Logged: ' + (f.a === 'out' ? 'checked out' : 'returned'), { icon: 'key' }); } });
  };
})();
