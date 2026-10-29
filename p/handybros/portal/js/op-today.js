/* Operator: Today */
(function () {
  const S = () => HB.S;
  const words = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'];

  function weekStrip() {
    const mon = HB.monday(HB.TODAY);
    return '<div class="weekstrip" role="list" aria-label="This week">' + Array.from({ length: 7 }, (_, i) => {
      const dt = HB.addDays(mon, i); const n = S().events.filter((e) => e.type === 'turnover' && e.date === dt).length;
      return '<a role="listitem" href="#/op/calendar" class="ws' + (dt === HB.TODAY ? ' today' : '') + '"><span class="ws-d">' + HB.fmt(dt, 'wd') + '</span><b class="num">' + HB.parse(dt).getDate() + '</b><span class="ws-dots" aria-label="' + HB.plural(n, 'turnover') + '">' + Array.from({ length: Math.min(n, 5) }, () => '<i></i>').join('') + '</span></a>';
    }).join('') + '</div>';
  }

  function stop(e, idx, prevPid) {
    const p = HB.prop(e.pid); const st = HB.turnStatus(e.pid); const pr = HB.progress(e.pid); const run = S().run[e.pid];
    const gap = HB.hnum(p.checkin) - HB.hnum(e.start);
    const drive = prevPid ? HB.drive[prevPid + '>' + e.pid] : null;
    const issue = run.issues.filter((x) => !x.resolved)[0];
    const live = st === 'In progress' ? ' <span class="live">live</span>' : '';
    return '<li class="stop ' + (st === 'Guest-ready' ? 'is-done' : '') + '">' +
      '<div class="stop-rail"><span class="stop-n">' + (idx + 1) + '</span></div>' +
      '<div class="stop-body">' +
      (drive ? '<div class="drive">' + HB.icon('van', 15) + ' ' + drive + ' min drive from ' + HB.esc(HB.prop(prevPid).short) + '</div>' : '') +
      '<article class="stop-card">' +
      '<img src="' + HB.photo(p.img) + '" alt="" width="96" height="96" loading="lazy">' +
      '<div class="stop-main">' +
      '<div class="row wrap" style="gap:8px">' + HB.statusChip(st) + live + '<span class="tag">' + HB.esc(e.who) + '</span></div>' +
      '<h3><a href="#/op/properties/' + p.id + '">' + HB.esc(p.name) + '</a></h3>' +
      '<p class="muted">' + HB.esc(p.town + ' ' + p.pc) + ' · ' + HB.esc(HB.owner(p.ownerId).name) + '</p>' +
      '<div class="gapbar" title="Guest out to next guest in"><span class="num mono">' + p.checkout + '</span><div class="gapline"><i style="left:' + Math.max(2, ((HB.hnum(e.start) - 10) / (HB.hnum(p.checkin) - 9.5)) * 100) + '%;width:' + Math.min(96, (e.dur / (HB.hnum(p.checkin) - 10)) * 100) + '%"></i></div><span class="num mono">' + p.checkin + '</span></div>' +
      '<p class="gaptext">Start ' + e.start + ' · ' + (gap > 0 ? HB.dur(gap) + ' window' : 'tight') + (e.sameDay ? ' · same-day arrival' : '') + '</p>' +
      (st === 'Issue' && issue ? '<div class="note-banner bad" style="margin-top:10px">' + HB.icon('alert', 18) + '<div><b>' + HB.esc(issue.room) + ':</b> ' + HB.esc(issue.note) + '</div></div>' : '') +
      (st === 'In progress' || st === 'Issue' ? '<div class="row" style="margin-top:12px;gap:12px"><div class="bar" style="flex:1"><i style="width:' + pr.pct + '%"></i></div><span class="mono muted num">' + pr.done + '/' + pr.total + '</span></div>' : '') +
      '</div>' +
      '<div class="stop-act">' +
      (st === 'Guest-ready' ? '<a class="btn btn-ghost btn-sm" href="#/op/reports/rp-' + p.id + '-t">' + HB.icon('report', 17) + 'Report</a>' : '<button class="btn btn-primary btn-sm" data-act="runner-job" data-pid="' + p.id + '">' + HB.icon('phone', 17) + (st === 'Checked out' ? 'Start' : 'Open') + '</button>') +
      '<a class="btn btn-ghost btn-sm" href="#/op/inbox">' + HB.icon('inbox', 17) + 'Message</a></div>' +
      '</article></div></li>';
  }

  function oncall() {
    const L = S().lockout; const p = HB.prop(L.pid); const k = S().keysets.find((x) => x.pid === L.pid && /Set B/.test(x.label));
    let body;
    if (L.status === 'incoming') {
      body = '<div class="oc-alert"><span class="ping"></span><b>Guest locked out</b><span class="mono">' + L.received + '</span></div><p class="oc-h">' + HB.esc(p.name) + ', ' + HB.esc(p.town) + '</p><p class="oc-p">' + HB.esc(L.note) + '</p>' +
        '<p class="oc-k">' + HB.icon('key', 16) + ' ' + HB.esc(k.label) + ' is ' + HB.esc(k.where.toLowerCase()) + (k.holder ? ' (' + HB.esc(k.holder) + ')' : '') + '. Key safe code on file.</p>' +
        '<div class="oc-act"><button class="btn btn-accent" data-act="lock-accept">' + HB.icon('van', 18) + 'Accept and head over</button><button class="btn btn-ghost-inv" data-act="lock-call">Call guest</button><button class="btn btn-ghost-inv" data-act="lock-code">Send key-safe code</button></div>';
    } else if (L.status === 'resolved') {
      body = '<div class="oc-alert ok"><b>Resolved</b><span class="mono">' + (L.resolvedAt || '') + '</span></div><p class="oc-p">Guest is in at ' + HB.esc(p.short) + '. The key movement and code rotation are logged.</p><a class="btn btn-ghost-inv" href="#/op/keys">View the key log</a>';
    } else {
      body = '<div class="oc-alert warn"><b>' + (L.status === 'enroute' ? 'On the way' : 'Accepted') + '</b><span class="mono">' + L.received + '</span></div><p class="oc-h">' + HB.esc(p.name) + '</p><p class="oc-p">Sam is heading to ' + HB.esc(p.short) + '. Follow the steps on the Keys screen.</p><a class="btn btn-accent" href="#/op/keys">Open lock-out workflow</a>';
    }
    return '<section class="oncall" aria-labelledby="oc-t"><div class="oc-top"><h2 id="oc-t">On call</h2><span class="oc-rota">Alex · Sam backup</span></div>' + body + '</section>';
  }

  function needs() {
    const rows = [];
    const overdue = HB.complianceItems().filter((c) => c.rag === 'r').length; if (overdue) rows.push(['shield', overdue + ' compliance ' + (overdue === 1 ? 'item is' : 'items are') + ' overdue', '#/op/compliance']);
    const nq = S().requests.filter((r) => r.status === 'New').length; if (nq) rows.push(['quote', HB.plural(nq, 'request') + ' waiting for a quote', '#/op/quotes']);
    const aw = S().requests.filter((r) => r.status === 'Quoted' && r.ownerId).length; if (aw) rows.push(['clock', HB.plural(aw, 'quote') + ' waiting on an owner', '#/op/quotes']);
    const ap = S().requests.filter((r) => r.status === 'Approved').length; if (ap) rows.push(['calendar', HB.plural(ap, 'approved job') + ' to schedule', '#/op/quotes']);
    const low = S().supplies.filter((s) => s.qty <= Math.ceil(s.par * .35)).length; if (low) rows.push(['box', HB.plural(low, 'supply') + ' running low', '#/op/inbox/supplies']);
    const ic = S().props.filter((p) => p.ical.status !== 'synced').length; if (ic) rows.push(['ical', 'An iCal feed has gone stale', '#/op/properties/p3']);
    return '<section><div class="sec-head"><h2>Needs you</h2></div>' + (rows.length ? '<ul class="needs">' + rows.map((r) => '<li><a href="' + r[2] + '">' + HB.icon(r[0], 19) + '<span>' + r[1] + '</span>' + HB.icon('chev-r', 16) + '</a></li>').join('') + '</ul>' : HB.empty('check', 'All clear', 'Nothing is waiting on you right now.')) + '</section>';
  }

  function route() {
    const pts = [['Van', 40, 112], ['Gullwing Row', 150, 78], ['Marine Court', 250, 66], ['Yellow Door', 490, 100], ['Fence quote', 580, 82]];
    return '<section class="route"><div class="sec-head"><h2>Coast route</h2><span class="muted mono" style="font-size:11px">Schematic, not to scale</span></div><svg viewBox="0 0 620 150" role="img" aria-label="Schematic route west to east along the coast: van, Gullwing Row, Marine Court, The Yellow Door, fence quote visit"><path d="M0 128c70-26 120-6 190-26s130-46 210-26 140 30 220 10V150H0z" fill="color-mix(in srgb,var(--info) 14%,var(--surface))"/><path d="M0 128c70-26 120-6 190-26s130-46 210-26 140 30 220 10" fill="none" stroke="var(--info)" stroke-width="1.5" stroke-dasharray="3 5"/><polyline points="' + pts.map((q) => q[1] + ',' + q[2]).join(' ') + '" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' +
      pts.map((q, i) => '<circle cx="' + q[1] + '" cy="' + q[2] + '" r="' + (i ? 7 : 5) + '" fill="' + (i ? 'var(--surface)' : 'var(--accent)') + '" stroke="var(--accent-text)" stroke-width="2"/>' + (i && i < 4 ? '<text x="' + q[1] + '" y="' + (q[2] + 4) + '" text-anchor="middle" font-size="9" font-weight="700" fill="var(--ink)" font-family="var(--mono)">' + i + '</text>' : '') + '<text x="' + q[1] + '" y="' + (q[2] - 14) + '" text-anchor="middle" font-size="11.5" fill="var(--ink-2)">' + q[0] + '</text>').join('') +
      '<text x="330" y="140" font-size="10.5" fill="var(--muted)" text-anchor="middle" font-family="var(--mono)">EASTBOURNE  →  BEXHILL</text></svg></section>';
  }

  HB.view('op.today', {
    title: () => 'Today',
    render() {
      const tv = HB.todayTurnovers(); const ready = tv.filter((e) => HB.turnStatus(e.pid) === 'Guest-ready').length;
      const issues = tv.filter((e) => HB.turnStatus(e.pid) === 'Issue').length;
      const head = HB.pageHead(HB.fmt(HB.TODAY, 'long') + ' · <span class="demo-time">' + HB.clock() + '</span>', (words[tv.length] || tv.length) + ' turnover' + (tv.length === 1 ? '' : 's') + ' today, ' + (ready ? words[ready].toLowerCase() : 'none') + ' guest-ready.',
        issues ? 'Sam flagged a failing smoke alarm at Tidewater Terrace. It needs fixing before tonight\'s 17:00 arrival.' : 'Everything is on track.',
        '<button class="btn btn-ghost" data-act="ev-new" data-type="personal">' + HB.icon('lock', 18) + 'Block time</button><button class="btn btn-primary" data-act="ev-new">' + HB.icon('plus', 18) + 'Add a job</button>');
      let prev = null;
      const stops = tv.map((e, i) => { const h = stop(e, i, prev); prev = e.who === 'Alex' ? e.pid : prev; return h; }).join('');
      const also = S().events.filter((e) => e.date === HB.TODAY && e.type !== 'turnover').sort((a, b) => a.start.localeCompare(b.start));
      return head + weekStrip() +
        '<div class="cols"><div class="stack-l"><section><div class="sec-head"><h2>Turnovers in travel order</h2><a href="#/op/calendar">Open calendar</a></div><ol class="stops">' + stops + '</ol></section>' +
        '<section><div class="sec-head"><h2>Also today</h2></div>' + (also.length ? '<ul class="hair sheet flat also">' + also.map((e) => '<li><span class="mono">' + e.start + '</span><span class="dotk" style="--c:var(--c-' + HB.kindColor[e.type] + ')"></span><span>' + HB.esc(e.title) + '</span><span class="muted">' + HB.esc(e.who) + '</span></li>').join('') + '</ul>' : HB.empty('calendar', 'Nothing else booked', 'No visits or blocks today.')) + '</section>' +
        route() + '</div>' +
        '<aside class="stack-l">' + oncall() + needs() +
        '<section><div class="sec-head"><h2>Quick actions</h2></div><div class="quick"><button data-act="go" data-to="/op/quotes">' + HB.icon('quote', 22) + 'New quote</button><button data-act="ev-new" data-type="personal">' + HB.icon('lock', 22) + 'Block time</button><button data-act="key-quick">' + HB.icon('key', 22) + 'Log a key</button><button data-act="go" data-to="/op/inbox/supplies">' + HB.icon('box', 22) + 'Restock</button></div></section>' +
        (S().tasks.filter((t) => t.status === 'open').length ? '<section><div class="sec-head"><h2>Raised from the field</h2></div><ul class="hair sheet flat tasks">' + S().tasks.filter((t) => t.status === 'open').map((t) => '<li><span class="chip chip-' + (t.sev === 'Urgent' ? 'bad' : t.sev === 'Needs fix' ? 'warn' : 'muted') + ' plain">' + HB.esc(t.sev) + '</span><div><b>' + HB.esc(t.title) + '</b><span class="muted">' + HB.esc(HB.prop(t.pid).short) + ' · ' + HB.esc(t.room) + '</span></div><button class="btn btn-ghost btn-xs" data-act="task-done" data-id="' + t.id + '">Done</button></li>').join('') + '</ul></section>' : '') +
        '</aside></div>';
    }
  });

  HB.act('go', (el) => HB.go(el.dataset.to));
  HB.act('runner-job', (el) => HB.runnerOpen(el.dataset.pid));
  HB.act('task-done', (el) => { HB.update((s) => { const t = s.tasks.find((x) => x.id === el.dataset.id); t.status = 'done'; }); HB.toast('Maintenance task closed'); });
  HB.act('lock-accept', () => { HB.update((s) => { s.lockout.status = 'accepted'; s.lockout.steps[0] = true; }); HB.toast('Accepted. Sam is heading to Kestrel House.', { icon: 'van' }); });
  HB.act('lock-call', () => HB.modal({ title: 'Call the guest', body: '<p class="muted">In the live product this opens your phone dialler with the number from the booking message. In this demo it just logs the attempt.</p><p class="mono" style="margin-top:12px">07700 900188</p>', confirm: 'Log call', onConfirm: () => HB.toast('Call logged') }));
  HB.act('lock-code', () => HB.confirm('Send the key-safe code?', 'This texts the current code to the guest\'s booking phone number and logs it. You will be prompted to change the code afterwards.', 'Send code', () => { HB.update((s) => { s.lockout.status = 'accepted'; s.lockout.steps[4] = true; s.lockout.steps[0] = true; }); HB.toast('Code sent by SMS and logged', { icon: 'sms' }); }));
})();
