/* Owner: Messages and report archive */
(function () {
  const S = () => HB.S;
  HB.ui.owm = { sel: null }; HB.ui.owr = { pid: 'all' };
  const mine = () => S().threads.filter((t) => t.ownerId === S().ownerId).sort((a, b) => b.msgs[b.msgs.length - 1].at - a.msgs[a.msgs.length - 1].at);

  HB.view('ow.messages', {
    title: () => 'Messages',
    render() {
      const list = mine(); const u = HB.ui.owm; const sel = list.find((t) => t.id === u.sel) || list[0];
      const head = HB.pageHead('Messages', 'Talk to Handy Boys.', 'Questions, access changes, anything you would normally text. Email threads you forward in appear here too.', '<button class="btn btn-primary" data-act="msg-new">' + HB.icon('plus', 18) + 'New message</button>');
      if (!list.length) return head + '<div class="sheet">' + HB.empty('inbox', 'No messages yet', 'Start a conversation and it will show up here, and in the Handy Boys inbox.', '<button class="btn btn-primary" data-act="msg-new">New message</button>') + '</div>';
      return head + '<div class="split"><ul class="tlist" aria-label="Conversations">' + list.map((t) => { const l = t.msgs[t.msgs.length - 1]; return '<li><button class="trow' + (t.id === sel.id ? ' on' : '') + '" data-act="owm-sel" data-id="' + t.id + '">' + (t.unreadOw ? '<i class="ud" aria-label="Unread"></i>' : '') + '<span class="avatar sm">' + HB.icon('wrench', 15) + '</span><span class="tr-b"><b>' + HB.esc(t.subject) + '</b><span class="muted">' + HB.esc(l.text.slice(0, 70)) + (l.text.length > 70 ? '…' : '') + '</span></span><span class="mono muted">' + HB.msgAgo(l.at).replace(' ago', '') + '</span></button></li>'; }).join('') + '</ul>' +
        '<section class="pane"><header><div><h2>' + HB.esc(sel.subject) + '</h2><p class="muted">' + HB.esc(HB.prop(sel.pid).short) + '</p></div>' + (sel.via === 'email' ? HB.chip('Email thread', 'info', 'mail') : '') + '</header>' + HB.thread(sel, 'ow') +
        '<form class="composer" data-submit="owm-send" data-id="' + sel.id + '"><label class="sr" for="owrep">Message</label><textarea id="owrep" name="t" rows="2" placeholder="Write to Handy Boys"></textarea><button class="btn btn-primary" type="submit">' + HB.icon('send', 18) + 'Send</button></form></section></div>';
    }
  });
  HB.act('owm-sel', (el) => { HB.ui.owm.sel = el.dataset.id; HB.update((s) => { s.threads.find((t) => t.id === el.dataset.id).unreadOw = false; }); });
  HB.act('owm-send', (el) => {
    const f = HB.formData(el); if (!f.t.trim()) { HB.toast('Write a message first', { icon: 'alert' }); return; }
    HB.update((s) => { const t = s.threads.find((x) => x.id === el.dataset.id); t.msgs.push({ from: 'ow', text: f.t.trim(), at: Date.now() }); t.unreadOp = true; });
    HB.$('textarea', el).value = ''; HB.toast('Sent. Handy Boys will reply here.', { icon: 'send' });
  });
  HB.act('msg-new', () => HB.modal({ title: 'New message', body: '<div class="form-grid"><label class="fld">Property<select name="pid">' + HB.ownerProps(S().ownerId).map((p) => '<option value="' + p.id + '">' + HB.esc(p.short) + '</option>').join('') + '</select></label><label class="fld">Subject<input type="text" name="s" placeholder="e.g. Blocking dates in December"></label><label class="fld full">Message<textarea name="t" rows="4"></textarea></label></div>', confirm: 'Send',
    onConfirm: (dlg) => { const f = HB.formData(dlg); if (!f.s.trim() || !f.t.trim()) { HB.toast('Add a subject and a message', { icon: 'alert' }); return false; } const id = HB.uid('t'); HB.update((s) => { s.threads.unshift({ id, ownerId: s.ownerId, pid: f.pid, subject: f.s.trim(), via: 'portal', unreadOp: true, unreadOw: false, msgs: [{ from: 'ow', text: f.t.trim(), at: Date.now() }] }); }); HB.ui.owm.sel = id; HB.toast('Message sent', { icon: 'send' }); } }));

  /* reports archive */
  HB.view('ow.reports', {
    title: () => 'Reports',
    render() {
      const props = HB.ownerProps(S().ownerId); const f = HB.ui.owr.pid; const ids = props.map((p) => p.id);
      const list = S().reports.filter((r) => ids.includes(r.pid) && r.sent && (f === 'all' || r.pid === f)).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.time.localeCompare(a.time)));
      return HB.pageHead('Reports', 'Every turnover, on record.', 'Before and after photos, what was checked, and anything we found. Keep them for insurance, or for a guest who says it was not clean.') +
        '<div class="seg" style="margin-bottom:22px" role="group" aria-label="Property"><button data-act="owr-f" data-p="all" aria-pressed="' + (f === 'all') + '">All</button>' + props.map((p) => '<button data-act="owr-f" data-p="' + p.id + '" aria-pressed="' + (f === p.id) + '">' + HB.esc(p.short) + '</button>').join('') + '</div>' +
        (list.length ? '<div class="rep-grid">' + list.map((r) => '<a class="repcard" href="#/ow/reports/' + r.id + '"><img src="' + HB.src(r.after) + '" alt="" loading="lazy"><div><div class="row" style="justify-content:space-between"><b>' + HB.esc(HB.prop(r.pid).short) + '</b><span class="mono">' + r.score + '</span></div><p class="muted">' + HB.fmt(r.date, 'day') + ' · ' + r.time + '</p><p class="muted">' + (r.issues.length ? HB.plural(r.issues.length, 'issue') + ' handled' : 'No issues') + '</p></div></a>').join('') + '</div>' : HB.empty('report', 'No reports yet', 'After the next turnover, the report lands here.'));
    }
  });
  HB.act('owr-f', (el) => { HB.ui.owr.pid = el.dataset.p; HB.emit(); });
  HB.view('ow.report', {
    title: () => 'Report',
    render(pr) { const r = HB.report(pr.id); if (!r || !r.sent || HB.prop(r.pid).ownerId !== S().ownerId) return HB.empty('report', 'Report not found', 'It may not have been sent yet.', '<a class="btn btn-primary" href="#/ow/reports">All reports</a>'); return '<a class="back inline" href="#/ow/reports">' + HB.icon('chev-l', 16) + 'All reports</a><div style="margin-top:16px">' + HB.reportHTML(r, 'ow') + '</div>'; }
  });
})();
