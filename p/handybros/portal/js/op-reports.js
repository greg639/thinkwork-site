/* Reports: list, shared report view with before/after slider */
(function () {
  const S = () => HB.S;
  HB.ui.ba = {}; HB.ui.rep = { pid: 'all' };
  const src = (x) => (x && (x.indexOf('blob:') === 0 ? x : HB.photo(x)));
  HB.src = src;
  const sevK = { Minor: 'muted', 'Needs fix': 'warn', Urgent: 'bad' };

  HB.reportHTML = (r, mode) => {
    const p = HB.prop(r.pid); const o = HB.owner(p.ownerId); const pos = HB.ui.ba[r.id] == null ? 50 : HB.ui.ba[r.id];
    const tot = r.rooms.reduce((a, x) => a + x.total, 0), dn = r.rooms.reduce((a, x) => a + x.done, 0);
    return '<article class="report"><header class="rep-h"><div><div class="eyebrow">Turnover report · ' + HB.fmt(r.date, 'long') + ' at ' + r.time + '</div><h1>' + HB.esc(p.name) + '</h1><p class="muted">' + HB.esc(p.town + ' ' + p.pc) + ' · done by ' + HB.esc(r.by) + ' in ' + r.mins + ' minutes</p></div><div class="rep-score">' + HB.ring(r.score, 92) + '<span class="eyebrow">Cleanliness</span></div></header>' +
      '<section><div class="sec-head"><h2>Before and after</h2><span class="muted" style="font-size:13px">Drag the handle</span></div><div class="ba" style="--pos:' + pos + '%" data-id="' + r.id + '"><img class="ba-a" src="' + src(r.after) + '" alt="After the turnover"><div class="ba-b"><img src="' + src(r.before) + '" alt="Before the turnover" class="' + (r.before === r.after ? 'filtered' : '') + '"></div><span class="ba-l l1">Before</span><span class="ba-l l2">After</span><i class="ba-h"></i><input type="range" min="0" max="100" value="' + pos + '" data-input="ba-move" data-id="' + r.id + '" aria-label="Before and after slider"></div><p class="footnote" style="margin-top:8px">Placeholder pictures in this demo. In the live product these are the runner\'s own before and after photos.</p></section>' +
      '<section><div class="sec-head"><h2>Checklist</h2><span class="mono muted">' + dn + '/' + tot + ' done</span></div><ul class="rep-rooms">' + r.rooms.map((x) => '<li><span>' + HB.esc(x.room) + '</span><div class="bar ' + (x.done === x.total ? 'ok' : 'warn') + '"><i style="width:' + (x.total ? x.done / x.total * 100 : 0) + '%"></i></div><span class="mono">' + x.done + '/' + x.total + '</span></li>').join('') + '</ul></section>' +
      '<section><div class="sec-head"><h2>Damage and issues</h2></div>' + (r.issues.length ? '<div class="issues">' + r.issues.map((i) => '<div class="issue">' + (i.src ? '<img src="' + src(i.src) + '" alt="Evidence photo for ' + HB.esc(i.title) + '">' : '') + '<div><div class="row wrap" style="gap:8px"><b>' + HB.esc(i.title) + '</b>' + HB.chip(i.sev, sevK[i.sev] || 'muted') + '</div><p>' + HB.esc(i.note) + '</p>' + (i.sample ? '<span class="tag">Sample photo</span>' : '') + '</div></div>').join('') + '</div>' : '<div class="note-banner ok">' + HB.icon('check', 18) + '<div>No damage or missing items found. Nothing to claim.</div></div>') + '</section>' +
      (r.diffs.length ? '<section><div class="sec-head"><h2>Inventory differences</h2></div><ul class="hair sheet flat">' + r.diffs.map((d) => '<li class="diffrow"><b>' + HB.esc(d.item) + '</b><span class="muted">' + HB.esc(d.room) + '</span><span class="mono">' + d.last + ' to ' + d.now + '</span>' + HB.chip(d.now < d.last ? 'Missing ' + (d.last - d.now) : 'Extra ' + (d.now - d.last), 'warn') + '</li>').join('') + '</ul></section>' : '') +
      '<footer class="rep-f">' + (mode === 'op'
        ? (r.sent ? HB.chip('Sent to ' + o.name.split(' ')[0], 'ok', 'check') : '<button class="btn btn-primary" data-act="rep-send" data-id="' + r.id + '">' + HB.icon('send', 18) + 'Send to owner</button>') + '<button class="btn btn-ghost" data-act="rep-dl" data-id="' + r.id + '">' + HB.icon('download', 18) + 'Download</button>'
        : '<button class="btn btn-ghost" data-act="rep-dl" data-id="' + r.id + '">' + HB.icon('download', 18) + 'Download report</button><button class="btn btn-ghost" data-act="rep-share" data-id="' + r.id + '">' + HB.icon('share', 18) + 'Share guest-ready link</button>') + '</footer></article>';
  };
  HB.act('ba-move', (el) => { HB.ui.ba[el.dataset.id] = Number(el.value); const ba = el.closest('.ba'); ba.style.setProperty('--pos', el.value + '%'); });
  HB.act('rep-send', (el) => { const r = HB.report(el.dataset.id); HB.update((s) => { r.sent = true; s.notifs.push({ ownerId: HB.prop(r.pid).ownerId, text: 'New report for ' + HB.prop(r.pid).short, at: Date.now() }); }); HB.toast('Report sent to ' + HB.owner(HB.prop(r.pid).ownerId).name.split(' ')[0] + '. It is in their portal now.', { icon: 'send' }); });
  HB.act('rep-dl', (el) => { const r = HB.report(el.dataset.id); HB.download('turnover-report-' + HB.prop(r.pid).short.toLowerCase().replace(/\s+/g, '-') + '-' + r.date + '.txt', 'text/plain', HB.reportText(r)); });
  HB.act('rep-share', (el) => { const r = HB.report(el.dataset.id); HB.shareLink(r.pid); });

  HB.view('op.reports', {
    title: () => 'Reports',
    render() {
      const f = HB.ui.rep.pid; const list = S().reports.filter((r) => f === 'all' || r.pid === f).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.time.localeCompare(a.time)));
      return HB.pageHead('Reports', 'Built as the job is ticked off.', 'Every turnover assembles its own report: before and after, checklist results, damage with evidence, and any inventory differences. Review it, then send it to the owner in one click.') +
        '<div class="row wrap" style="margin-bottom:18px"><label class="fld"><span class="sr">Property</span><select data-change="rep-pid" data-sync aria-label="Filter by property"><option value="all">All properties</option>' + S().props.map((p) => '<option value="' + p.id + '"' + (f === p.id ? ' selected' : '') + '>' + HB.esc(p.short) + '</option>').join('') + '</select></label></div>' +
        (list.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Date</th><th>Property</th><th>By</th><th>Score</th><th>Issues</th><th>Status</th><th></th></tr></thead><tbody>' + list.map((r) => '<tr><td class="mono">' + HB.fmt(r.date, 'day') + ' ' + r.time + '</td><td><b>' + HB.esc(HB.prop(r.pid).short) + '</b></td><td>' + HB.esc(r.by) + '</td><td class="mono">' + r.score + '</td><td>' + (r.issues.length ? HB.chip(r.issues.length + ' flagged', 'warn') : '<span class="muted">None</span>') + '</td><td>' + (r.sent ? HB.chip('Sent', 'ok') : HB.chip('Ready to send', 'brand')) + '</td><td class="r"><a class="btn btn-ghost btn-xs" href="#/op/reports/' + r.id + '">Open</a></td></tr>').join('') + '</tbody></table></div>' : HB.empty('report', 'No reports yet', 'Complete a turnover in the runner to build the first one.'));
    }
  });
  HB.act('rep-pid', (el) => { HB.ui.rep.pid = el.value; HB.emit(); });
  HB.view('op.report', {
    title: (p) => 'Report',
    render(pr) { const r = HB.report(pr.id); if (!r) return HB.empty('report', 'Report not found', 'It may not have been built yet.', '<a class="btn btn-primary" href="#/op/reports">All reports</a>'); return '<a class="back inline" href="#/op/reports">' + HB.icon('chev-l', 16) + 'All reports</a><div style="margin-top:16px">' + HB.reportHTML(r, 'op') + '</div>'; }
  });

  /* guest-ready shareable link (badge preview) */
  HB.shareLink = (pid) => {
    const p = HB.prop(pid); const st = HB.propState(pid); const url = 'https://portal.example/ready/' + pid + '-' + Math.abs(p.name.length * 7919 % 9999);
    HB.modal({ title: 'Share a guest-ready badge', sub: 'A public page that shows only "Guest-ready" and the time, never your notes or access details.',
      body: '<div class="badge-prev"><div class="bp-seal">' + HB.icon(st.k === 'ready' ? 'check' : 'clock', 26) + '</div><div><b>' + HB.esc(p.name) + '</b><p class="muted">' + (st.k === 'ready' ? 'Guest-ready' + (S().turn[pid] && S().turn[pid].at ? ' at ' + S().turn[pid].at + ' today' : '') : HB.esc(st.label)) + '</p></div></div><label class="fld" style="margin-top:16px">Link<input type="text" readonly value="' + url + '" aria-label="Guest-ready link"></label>',
      confirm: 'Copy link', cancel: 'Close', onConfirm: () => { try { navigator.clipboard.writeText(url).catch(() => {}); } catch (e) { /* ignore */ } HB.toast('Link copied', { icon: 'link' }); } });
  };
})();
