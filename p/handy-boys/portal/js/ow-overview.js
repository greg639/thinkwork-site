/* Owner: Overview */
(function () {
  const S = () => HB.S;
  const me = () => HB.curOwner();
  HB.expiryBadge = (c) => c.t.confirm ? HB.chip('Register by ' + HB.fmt(c.due, 'mon') + ' ' + HB.parse(c.due).getFullYear() + ' · confirm', 'muted') : HB.chip(c.days < 0 ? 'Expired ' + HB.plural(-c.days, 'day') + ' ago' : c.days === 0 ? 'Expires today' : c.days <= 60 ? 'Expires in ' + HB.plural(c.days, 'day') : 'Valid to ' + HB.fmt(c.due, 'mon') + ' ' + HB.parse(c.due).getFullYear(), c.rag === 'r' ? 'bad' : c.rag === 'a' ? 'warn' : 'ok');
  HB.myReqs = () => S().requests.filter((r) => r.ownerId === S().ownerId).sort((a, b) => b.at - a.at);

  HB.approveCard = (r, big) => {
    const o = me(); const tot = HB.quoteTotal(r); const under = tot <= o.limit;
    return '<article class="approve' + (big ? ' big' : '') + '">' + HB.reqImg(r, 'ap-img') + '<div class="ap-b"><div class="row wrap" style="gap:8px"><span class="chip chip-brand">Needs your approval</span>' + HB.urgencyChip(r.urgency) + '</div><h3>' + HB.esc(r.title) + '</h3><p class="muted">' + HB.esc(HB.prop(r.pid).name) + ' · quoted ' + HB.ago2(r.quote.sentAt) + '</p>' +
      '<ul class="ap-l">' + r.quote.lines.map((l) => '<li><span>' + HB.esc(l.desc) + '</span><span class="mono">' + HB.money(HB.lineTotal(l)) + '</span></li>').join('') + '</ul>' + (r.quote.note ? '<p class="ap-n">' + HB.icon('inbox', 15) + HB.esc(r.quote.note) + '</p>' : '') +
      '<div class="ap-t"><span class="muted">Total</span><b class="mono">' + HB.money(tot) + '</b></div><p class="footnote">' + (under ? 'Under your ' + HB.money(o.limit) + ' limit. This goes ahead on its own after 24 hours unless you decline.' : 'Over your ' + HB.money(o.limit) + ' limit, so it waits for your yes.') + '</p>' +
      '<div class="row wrap" style="margin-top:14px"><button class="btn btn-primary" data-act="ow-approve" data-id="' + r.id + '">' + HB.icon('check', 18) + 'Approve ' + HB.money(tot) + '</button><button class="btn btn-ghost" data-act="ow-decline" data-id="' + r.id + '">Decline</button></div></div></article>';
  };
  HB.act('ow-approve', (el) => {
    const r = HB.req(el.dataset.id);
    HB.update((s) => { r.status = 'Approved'; r.quote.approvedAt = Date.now(); s.notifs.push({ ownerId: null, text: me().name + ' approved ' + r.title, at: Date.now() }); });
    HB.toast('Approved. Handy Boys have been told and will book a day with you.', { icon: 'check' });
  });
  HB.act('ow-decline', (el) => {
    const r = HB.req(el.dataset.id);
    HB.modal({ title: 'Decline this quote?', sub: HB.esc(r.title) + ', ' + HB.money(HB.quoteTotal(r)), body: '<label class="fld">Tell us why <small>optional, helps us revise it</small><textarea name="why" rows="3" placeholder="e.g. Can it wait until January?"></textarea></label>', confirm: 'Decline quote', danger: true,
      onConfirm: (dlg) => { const why = HB.formData(dlg).why; HB.update(() => { r.status = 'Declined'; r.quote.declinedWhy = why; }); HB.toast('Declined. Handy Boys have been told.', { icon: 'x' }); } });
  });

  function ptile(p) {
    const st = HB.propState(p.id); const nx = HB.nextStays(p.id, 1)[0];
    const kind = st.k === 'ready' ? 'ok' : st.k === 'issue' ? 'bad' : st.k === 'prep' ? 'info' : 'muted';
    return '<a class="ptile" href="#/ow/properties/' + p.id + '"><img src="' + HB.photo(p.img) + '" alt="' + HB.esc(p.name) + ', placeholder photo"><div class="pt-b"><div class="pt-seal ' + kind + '">' + (st.k === 'prep' || st.k === 'issue' ? HB.ring(st.pct || 0, 44) : '<span class="seal">' + HB.icon(st.k === 'ready' ? 'check' : st.k === 'occ' ? 'bed' : 'clock', 22) + '</span>') + '<div><b>' + st.label + '</b><span>' + HB.esc(st.sub) + '</span></div></div><h3>' + HB.esc(p.name) + '</h3><p class="muted">' + HB.esc(p.town) + (nx ? ' · next arrival ' + HB.fmt(nx.start, 'day') : '') + '</p><div class="row" style="margin-top:12px;justify-content:space-between"><span class="muted">Cleanliness</span>' + HB.spark(p.trend, 84, 26) + '<b class="mono">' + HB.score(p.id) + '</b></div></div></a>';
  }

  HB.ptile = ptile;
  HB.view('ow.overview', {
    title: () => 'Overview',
    render() {
      const o = me(); const props = HB.ownerProps(o.id); const first = o.name.split(/[ &]/)[0]; const pend = HB.myReqs().filter((r) => r.status === 'Quoted');
      const st = props.map((p) => ({ p, s: HB.propState(p.id) }));
      const bits = st.map((x) => x.p.short + (x.s.k === 'ready' ? ' is guest-ready' : x.s.k === 'prep' ? ' is being prepared (' + x.s.pct + '%)' : x.s.k === 'issue' ? ' has one thing being fixed' : x.s.k === 'occ' ? ' has guests staying' : ' is due its turnover'));
      const arr = props.reduce((a, p) => a.concat(HB.nextStays(p.id, 3).map((s) => Object.assign({ p }, s))), []).sort((a, b) => (a.start < b.start ? -1 : 1)).slice(0, 4);
      const rep = props.reduce((a, p) => a.concat(HB.propReports(p.id)), []).filter((r) => r.sent).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.time.localeCompare(a.time)))[0];
      const comp = HB.complianceItems().filter((c) => c.p.ownerId === o.id).sort((a, b) => a.days - b.days).slice(0, 4);
      const pl = S().plans[o.id]; const reqs = HB.myReqs().filter((r) => r.status !== 'Done' && r.status !== 'Declined').slice(0, 3);
      const hr = HB.now().getHours(); const greet = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
      return HB.pageHead(HB.fmt(HB.TODAY, 'long'), greet + ', ' + HB.esc(first) + '.', bits.join('. ') + '.' + (pend.length ? ' ' + HB.plural(pend.length, 'repair') + ' to approve.' : '')) +
        '<section aria-labelledby="needs-h"><div class="sec-head"><h2 id="needs-h">Needs your say</h2></div>' + (pend.length ? '<div class="stack">' + pend.map((r) => HB.approveCard(r, true)).join('') + '</div>' : '<div class="sheet caught">' + HB.icon('check', 22) + '<div><b>You\'re all caught up</b><p class="muted">Nothing is waiting on a decision from you.</p></div></div>') + '</section>' +
        '<section class="section"><div class="sec-head"><h2>Your properties</h2><a href="#/ow/properties">All properties</a></div><div class="ptiles">' + props.map(ptile).join('') + '</div></section>' +
        '<div class="cols section"><div class="stack-l"><section><div class="sec-head"><h2>Next arrivals</h2></div><ul class="hair sheet flat arr">' + arr.map((a) => '<li><div class="adate"><b class="num">' + HB.parse(a.start).getDate() + '</b><span>' + HB.fmt(a.start, 'mon') + '</span></div><div><b>' + HB.esc(a.p.short) + '</b><p class="muted">' + HB.fmt(a.start, 'wd') + ' · ' + HB.plural(a.nights, 'night') + ' · ' + HB.esc(a.platform) + '</p></div>' + (a.start === HB.TODAY ? HB.chip('Today', 'brand') : '') + '</li>').join('') + '</ul></section>' +
        (rep ? '<section><div class="sec-head"><h2>Last turnover</h2><a href="#/ow/reports/' + rep.id + '">Full report</a></div><a class="sheet last-t" href="#/ow/reports/' + rep.id + '"><img src="' + HB.src(rep.after) + '" alt="" loading="lazy"><div><b>' + HB.esc(HB.prop(rep.pid).name) + '</b><p class="muted">' + HB.fmt(rep.date, 'day') + ' · guest-ready at ' + rep.time + ' · done by ' + HB.esc(rep.by) + '</p><p>' + (rep.issues.length ? HB.plural(rep.issues.length, 'thing') + ' flagged and handled. ' : 'No damage or missing items. ') + (rep.diffs.length ? HB.plural(rep.diffs.length, 'inventory difference') + ' noted.' : 'Inventory matched.') + '</p></div>' + HB.ring(rep.score, 64) + '</a></section>' : '') + '</div>' +
        '<aside class="stack-l"><section><div class="sec-head"><h2>Compliance coming up</h2><a href="#/ow/compliance">Vault</a></div><ul class="hair sheet flat comp-mini">' + comp.map((c) => '<li><div>' + HB.icon(c.t.icon, 18) + '<span><b>' + HB.esc(c.t.name.replace(' (EICR)', '').replace(' (EPC)', '')) + '</b><br><span class="muted">' + HB.esc(c.p.short) + '</span></span></div>' + HB.expiryBadge(c) + '</li>').join('') + '</ul></section>' +
        '<section><div class="sec-head"><h2>Retainer this month</h2><a href="#/ow/billing">Manage</a></div><div class="sheet pad"><div class="row" style="justify-content:space-between"><b>' + HB.esc(pl.name) + '</b><span class="mono">' + (pl.tier === 'club' ? HB.money(pl.monthly) + '/mo' : 'No monthly fee') + '</span></div>' + (pl.termEnd ? '<p class="muted" style="font-size:13px;margin-top:4px">Minimum term ends ' + HB.fmt(pl.termEnd, 'full') + '</p>' : '<p class="muted" style="font-size:13px;margin-top:4px">Priority Club adds key holding and priority cover.</p>') + HB.usageHTML(pl) + '</div></section>' +
        '<section><div class="sec-head"><h2>Open requests</h2><a href="#/ow/request">Request something</a></div>' + (reqs.length ? '<ul class="hair sheet flat reqmini">' + reqs.map((r) => '<li><b>' + HB.esc(r.title) + '</b><span class="muted">' + HB.esc(HB.prop(r.pid).short) + '</span>' + HB.stepsHTML(r) + '</li>').join('') + '</ul>' : HB.empty('camera', 'No open requests', 'Send a photo of anything that needs fixing.', '<a class="btn btn-primary" href="#/ow/request">Request something</a>')) + '</section></aside></div>';
    }
  });
})();
