/* Derived data and shared queries */
(function () {
  const S = () => HB.S;
  HB.prop = (id) => S().props.find((p) => p.id === id);
  HB.owner = (id) => S().owners.find((o) => o.id === id);
  HB.curOwner = () => HB.owner(S().ownerId);
  HB.req = (id) => S().requests.find((r) => r.id === id);
  HB.ownerProps = (oid) => S().props.filter((p) => p.ownerId === oid);
  HB.addr = (p) => p.name + ', ' + p.street + ', ' + p.town + ' ' + p.pc;
  HB.demoTime = (ts) => new Date(ts + (HB.now().getTime() - Date.now()));
  HB.clockAt = (ts) => HB.clock(HB.demoTime(ts));

  /* merge to-do ticks into the done map once */
  Object.keys(S().run).forEach((pid) => { const r = S().run[pid]; Object.assign(r.done, r.todoDone || {}); });

  /* checklist rooms as the runner and owner see them: template rooms plus the property to-do list */
  HB.rooms = (pid) => {
    const base = S().checklist[pid].map((r) => ({ id: r.id, name: r.name, tasks: r.tasks }));
    const todo = (S().todos[pid] || []).filter((t) => t.freq === 'every' || !t.finished);
    if (todo.length) base.push({ id: pid + '-todo', name: 'Property to-do', todo: true, tasks: todo.map((t) => ({ id: t.id, text: t.text, freq: t.freq })) });
    return base;
  };
  HB.progress = (pid) => {
    const run = S().run[pid] || { done: {} }; let total = 0, done = 0;
    HB.rooms(pid).forEach((r) => r.tasks.forEach((t) => { total++; if (run.done[t.id]) done++; }));
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  };
  HB.roomProgress = (pid, room) => { const run = S().run[pid]; const t = room.tasks.length; const d = room.tasks.filter((x) => run.done[x.id]).length; return { done: d, total: t }; };

  HB.turnStatus = (pid) => (S().turn[pid] && S().turn[pid].status) || null;
  HB.todayTurnovers = () => S().events.filter((e) => e.type === 'turnover' && e.date === HB.TODAY && S().turn[e.pid]).sort((a, b) => HB.hnum(a.start) - HB.hnum(b.start));
  HB.drive = { 'p2>p1': 14, 'p1>p4': 32 };
  HB.stayNow = (pid) => S().stays.find((s) => s.pid === pid && s.start <= HB.TODAY && s.end > HB.TODAY);
  HB.nextStays = (pid, n) => S().stays.filter((s) => s.pid === pid && s.start >= HB.TODAY).slice(0, n || 3);
  HB.propState = (pid) => {
    const t = S().turn[pid]; const p = HB.prop(pid);
    if (t) {
      if (t.status === 'Guest-ready') return { k: 'ready', label: 'Guest-ready', sub: 'Ready at ' + t.at + ' today' };
      if (t.status === 'In progress') { const pr = HB.progress(pid); return { k: 'prep', label: 'Being prepared', sub: pr.pct + '% of the checklist done', pct: pr.pct }; }
      if (t.status === 'Issue') return { k: 'issue', label: 'One thing to fix', sub: 'HandyBros are on it before check-in', pct: HB.progress(pid).pct };
      return { k: 'wait', label: 'Turnover due today', sub: 'Guests have left. HandyBros arrive at ' + HB.turnoverTime(pid), pct: 0 };
    }
    const stay = HB.stayNow(pid);
    if (stay) return { k: 'occ', label: 'Guests staying', sub: 'Checks out ' + HB.fmt(stay.end, 'day') };
    return { k: 'ready', label: 'Guest-ready', sub: 'Vacant and ready for the next arrival' };
  };
  HB.turnoverTime = (pid) => { const e = S().events.find((x) => x.type === 'turnover' && x.pid === pid && x.date === HB.TODAY); return e ? e.start : HB.prop(pid).time; };

  /* compliance */
  HB.complianceItems = () => S().compliance.map((c) => {
    const days = HB.diff(c.due, HB.TODAY); const rag = days < 0 ? 'r' : days <= 60 ? 'a' : 'g';
    return Object.assign({}, c, { t: S().TYPES[c.type], days, rag, p: HB.prop(c.pid) });
  });
  HB.dueLabel = (c) => c.t.confirm ? 'Due by ' + HB.fmt(c.due, 'full') + ' (confirm)' : c.days < 0 ? 'Overdue by ' + HB.plural(-c.days, 'day') : c.days === 0 ? 'Due today' : c.days <= 60 ? 'Due in ' + HB.plural(c.days, 'day') : 'Valid to ' + HB.fmt(c.due, 'full');
  HB.rag = (c) => '<span class="rag ' + c.rag + '"><i></i>' + (c.rag === 'r' ? 'Overdue' : c.rag === 'a' ? 'Due soon' : 'In date') + '</span>';
  HB.basisChip = (t) => HB.chip(t.basis, t.basis === 'Legal duty' ? 'info' : t.basis === 'Fire-service advice' ? 'brand' : 'muted') + (t.confirm ? ' ' + HB.chip('Confirm', 'warn') : '');

  /* requests and quotes */
  HB.lineTotal = (l) => (Number(l.qty) || 0) * (Number(l.rate) || 0);
  HB.quoteTotal = (r) => (r.quote ? r.quote.lines.reduce((a, l) => a + HB.lineTotal(l), 0) : 0);
  HB.reqSteps = ['Received', 'Quoted', 'Approved', 'Scheduled', 'Done'];
  HB.reqIndex = (r) => ({ New: 0, Quoted: 1, Approved: 2, Scheduled: 3, Done: 4, Declined: 1 }[r.status]);
  HB.stepsHTML = (r) => {
    const i = HB.reqIndex(r);
    return '<ol class="steps" aria-label="Request progress">' + HB.reqSteps.map((s, n) => '<li class="' + (n < i || r.status === 'Done' ? 'done' : n === i ? 'now' : '') + '"><i>' + (n < i || r.status === 'Done' ? HB.icon('check', 11) : '') + '</i><span>' + (n === 1 && r.status === 'Declined' ? 'Declined' : s) + '</span></li>').join('') + '</ol>';
  };
  HB.urgencyChip = (u) => HB.chip(u, u === 'Urgent' ? 'bad' : u === 'This week' ? 'warn' : 'muted');
  HB.kindColor = { turnover: 'turn', maintenance: 'maint', quote: 'quote', decorating: 'decor', eot: 'eot', personal: 'personal' };
  HB.kindName = { turnover: 'Turnover', maintenance: 'Maintenance', quote: 'Quote visit', decorating: 'Decorating job', eot: 'End of tenancy / void', personal: 'Personal block' };
  HB.jobLabel = { maintenance: 'Handyman', decorating: 'Decorating', eot: 'End of tenancy / void', turnover: 'Turnover' };

  /* reports */
  HB.report = (id) => S().reports.find((r) => r.id === id);
  HB.propReports = (pid) => S().reports.filter((r) => r.pid === pid).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.time.localeCompare(a.time)));
  HB.score = (pid) => { const r = HB.propReports(pid)[0]; return r ? r.score : HB.prop(pid).trend[5]; };

  /* generated files */
  const css = 'body{font:15px/1.5 system-ui,sans-serif;max-width:720px;margin:40px auto;padding:0 20px;color:#14202b}h1{font-size:26px;margin:0}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{text-align:left;padding:10px 8px;border-bottom:1px solid #ddd}td.r,th.r{text-align:right}.m{color:#667}.tot{font-size:20px;font-weight:700}@media print{body{margin:0}}';
  HB.invoiceFile = (inv, receipt) => {
    const o = HB.owner(inv.ownerId); const title = receipt ? 'Receipt' : 'Invoice';
    const html = '<!doctype html><html lang="en"><meta charset="utf-8"><title>' + title + ' ' + HB.esc(inv.id) + '</title><style>' + css + '</style><body><p class="m">HandyBros · sample document from a prototype</p><h1>' + title + ' ' + HB.esc(inv.id) + '</h1><p class="m">' + HB.fmt(inv.date, 'full') + '</p><p><b>' + HB.esc(o.name) + '</b><br>' + HB.esc(o.email) + '</p><table><tr><th>Description</th><th class="r">Amount</th></tr><tr><td>' + HB.esc(inv.desc) + '</td><td class="r">' + HB.money(inv.amount) + '</td></tr></table><p class="tot">Total ' + HB.money(inv.amount) + '</p><p>Status: ' + HB.esc(receipt ? 'Paid, thank you' : inv.status) + '</p><p class="m">Demo data. Not a real invoice. Print this page to save it as a PDF.</p></body></html>';
    return { name: (receipt ? 'receipt-' : 'invoice-') + inv.id + '.html', mime: 'text/html', content: html };
  };
  HB.reportText = (r) => {
    const p = HB.prop(r.pid);
    return ['TURNOVER REPORT (sample)', HB.addr(p), HB.fmt(r.date, 'full') + ' at ' + r.time, 'Done by ' + r.by + ' in ' + r.mins + ' minutes', 'Cleanliness score ' + r.score + '/100', '', 'CHECKLIST'].concat(r.rooms.map((x) => ' - ' + x.room + ': ' + x.done + '/' + x.total), ['', 'ISSUES'], r.issues.length ? r.issues.map((i) => ' - ' + i.title + ' (' + i.sev + '): ' + i.note) : [' - None'], ['', 'INVENTORY DIFFERENCES'], r.diffs.length ? r.diffs.map((x) => ' - ' + x.item + ' (' + x.room + '): ' + x.last + ' -> ' + x.now) : [' - None'], ['', 'Demo data. Prototype only.']).join('\n');
  };
})();

(function () {
  const S = () => HB.S;
  /* rate card and Priority Club */
  HB.r2 = (n) => Math.round(n * 100) / 100;
  HB.planSync = (oid) => {
    const p = S().plans[oid]; const R = S().rates; const club = p.tier === 'club';
    p.name = club ? 'Priority Club' : 'General'; p.monthly = HB.r2(p.enrolled.length * R.club.monthly);
    p.termEnd = club && p.start ? HB.addMonths(p.start, R.club.term) : null; p.next = '2026-11-01';
    p.includes = club ? ['Key holding included', 'Lock-out attendance from ' + HB.money(R.club.lockout) + ' (priority)', 'Priority response', 'Club rates on jobs: hourly from ' + HB.money(R.club.hourly) + ', changeovers from ' + HB.money(R.club.changeover), 'Compliance reminders and booking']
      : ['Pay as you go, no monthly fee', 'Call-out ' + HB.money(R.general.callout) + ', hourly from ' + HB.money(R.general.hourly), 'Changeovers from ' + HB.money(R.general.changeover), 'No key holding or lock-out cover'];
  };
  HB.onClub = (pid) => { const o = HB.prop(pid); const p = o && S().plans[o.ownerId]; return !!(p && p.tier === 'club' && p.status === 'active' && p.enrolled.includes(pid)); };
  HB.usageRows = (pl) => {
    const R = S().rates; const u = pl.usage; const club = pl.tier === 'club';
    return [['Lock-out attendances', u.lockouts, club ? u.lockouts + ' × ' + HB.money(R.club.lockout) : 'Not offered'], ['Handyman hours', u.hours, u.hours + ' h at ' + HB.money(club ? R.club.hourly : R.general.hourly)], ['Condition checks', u.checks, u.checks + ' this month']];
  };
  HB.usageHTML = (pl) => '<ul class="usage">' + HB.usageRows(pl).map((r) => '<li><span>' + r[0] + '</span><b class="mono">' + HB.esc(r[2]) + '</b></li>').join('') + '</ul>';
  HB.rateChip = '<span class="todo">draft rate, owner to confirm</span>';
  HB.addMonths = (iso, n) => { const d = HB.parse(iso); d.setMonth(d.getMonth() + n); return HB.iso(d); };
  Object.keys(S().plans).forEach(HB.planSync);
})();
