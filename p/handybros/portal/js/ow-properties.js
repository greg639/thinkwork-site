/* Owner: My properties and the live checklist */
(function () {
  const S = () => HB.S;
  const TABS = [['checklist', 'Live checklist'], ['photos', 'Photos'], ['notes', 'Notes'], ['inventory', 'Inventory'], ['history', 'History']];
  const sev = { Minor: 'muted', 'Needs fix': 'warn', Urgent: 'bad' };

  HB.view('ow.properties', {
    title: () => 'My properties',
    render() {
      const props = HB.ownerProps(S().ownerId);
      return HB.pageHead('My properties', 'Everything about your places.', 'Open one to watch the checklist tick off live, see today\'s photos, and read the notes HandyBros leave.') + '<div class="ptiles">' + props.map(HB.ptile).join('') + '</div>';
    }
  });

  function live(p) {
    const run = S().run[p.id]; const t = S().turn[p.id]; const st = HB.propState(p.id);
    if (!t) {
      const nx = S().events.find((e) => e.type === 'turnover' && e.pid === p.id && e.date >= HB.TODAY);
      return '<div class="cols"><section class="sheet">' + HB.empty('clock', 'No turnover in progress', 'The next one is ' + (nx ? HB.fmt(nx.date, 'long') + ' at ' + nx.start : 'not scheduled yet') + '. This page fills in live the moment HandyBros start, tick by tick.') + '</section><aside><div class="sec-head"><h2>What a turnover covers</h2></div><div class="stack">' + S().checklist[p.id].slice(0, 4).map((r) => '<details class="sheet tplroom"><summary><b>' + HB.esc(r.name) + '</b><span class="muted">' + HB.plural(r.tasks.length, 'task') + '</span>' + HB.icon('chev-d', 16) + '</summary><ul class="hair tpl">' + r.tasks.map((x) => '<li><span>' + HB.esc(x.text) + '</span></li>').join('') + '</ul></details>').join('') + '</div></aside></div>';
    }
    const pr = HB.progress(p.id); const rooms = HB.rooms(p.id); const done = t.status === 'Guest-ready';
    const issues = run.issues;
    const head = '<section class="sheet pad livehead"><div class="row" style="gap:22px">' + HB.ring(pr.pct, 112, done) + '<div style="flex:1"><div class="row wrap" style="gap:8px">' + HB.statusChip(t.status) + (t.status === 'In progress' ? '<span class="live">live</span>' : '') + '</div><h2 style="font-size:24px;margin-top:10px">' + (done ? 'Guest-ready at ' + t.at : t.status === 'Issue' ? 'One thing to fix before check-in' : t.status === 'Checked out' ? 'Guests have left. HandyBros arrive at ' + HB.turnoverTime(p.id) : 'HandyBros are in the property') + '</h2><p class="muted" style="margin-top:6px">' + pr.done + ' of ' + pr.total + ' tasks done' + (run.started ? ' · started ' + HB.clockAt(run.started) : '') + ' · next guest arrives ' + p.checkin + '</p></div></div></section>';
    const groups = rooms.map((r) => { const rp = HB.roomProgress(p.id, r); return '<section class="sheet lroom ' + (rp.done === rp.total ? 'full' : '') + '"><div class="room-h"><h3>' + HB.esc(r.name) + '</h3><span class="mono muted">' + rp.done + '/' + rp.total + '</span>' + (rp.done === rp.total ? HB.chip('Done', 'ok') : '') + '</div><ul class="hair lcheck">' + r.tasks.map((x) => { const d = run.done[x.id]; return '<li class="' + (d ? 'on' : '') + '"><span class="lc" aria-hidden="true">' + (d ? HB.icon('check', 14) : '') + '</span><span class="sr">' + (d ? 'Done: ' : 'Not yet: ') + '</span><span class="lt">' + HB.esc(x.text) + '</span>' + (d ? '<span class="mono muted">' + HB.clockAt(d) + '</span>' : '') + '</li>'; }).join('') + '</ul></section>'; }).join('');
    return head + '<div class="cols" style="margin-top:28px"><div class="stack">' + groups + '</div><aside class="stack-l">' +
      '<section><div class="sec-head"><h2>Today\'s photos</h2><a href="#/ow/properties/' + p.id + '/photos">All</a></div>' + (run.photos.length ? '<div class="thumbs">' + run.photos.slice(-6).map((x) => '<div class="t"><img src="' + HB.src(x.src) + '" alt="Photo from ' + HB.esc(x.room) + '"><span class="cap">' + HB.esc(x.room) + ' · ' + HB.clockAt(x.ts) + '</span></div>').join('') + '</div>' : '<p class="muted">Photos appear here as they are taken.</p>') + '</section>' +
      '<section><div class="sec-head"><h2>Notes from HandyBros</h2></div>' + (issues.length ? issues.map((i) => '<div class="note-banner bad" style="margin-bottom:10px">' + HB.icon('alert', 18) + '<div><b>' + HB.esc(i.room) + ' · ' + HB.esc(i.sev) + '</b><br>' + HB.esc(i.note) + '</div></div>').join('') : '') + '<div class="note-banner">' + HB.icon('inbox', 18) + '<div>' + HB.esc(p.notes) + '</div></div></section></aside></div>';
  }
  function photos(p) {
    const run = S().run[p.id]; const items = run.photos.concat(run.issues.filter((i) => i.src).map((i) => ({ src: i.src, room: i.room + ' (issue)', ts: i.ts, sample: i.sample })));
    return items.length ? '<div class="thumbs big">' + items.map((x) => '<div class="t"><img src="' + HB.src(x.src) + '" alt="' + HB.esc(x.room) + ' photo"><span class="cap">' + HB.esc(x.room) + ' · ' + HB.clockAt(x.ts) + (x.sample ? ' · sample' : '') + '</span></div>').join('') + '</div>' : HB.empty('camera', 'No photos today', 'Photos taken during a turnover show up here, room by room.');
  }
  function notes(p) {
    const run = S().run[p.id];
    const items = run.issues.map((i) => ({ k: 'Issue', t: i.sev, n: i.note, w: 'Today ' + HB.clockAt(i.ts), s: i.sev })).concat(S().history[p.id].filter((h) => h.type === 'maintenance' || h.type === 'inspection').map((h) => ({ k: 'Visit', t: h.title, n: h.detail, w: HB.fmt(h.date, 'day') })));
    return '<div class="stack"><div class="note-banner">' + HB.icon('inbox', 18) + '<div><b>Standing note</b><br>' + HB.esc(p.notes) + '</div></div>' + items.map((i) => '<article class="sheet pad"><div class="row" style="justify-content:space-between"><b>' + HB.esc(i.t) + '</b><span class="mono muted">' + i.w + '</span></div><p class="muted" style="margin-top:6px">' + HB.esc(i.n) + '</p></article>').join('') + '</div>';
  }
  function inv(p) {
    return '<div class="stack-l">' + S().inventory[p.id].map((r) => '<details class="sheet tplroom"' + (r.items.some((i) => i.qty !== i.last || i.cond !== 'good') ? ' open' : '') + '><summary><b>' + HB.esc(r.room) + '</b><span class="muted">' + HB.plural(r.items.length, 'item') + '</span>' + HB.icon('chev-d', 16) + '</summary><ul class="hair">' + r.items.map((i) => '<li class="diffrow"><b>' + HB.esc(i.name) + '</b><span class="mono">' + i.qty + '</span>' + (i.qty < i.last ? HB.chip('Missing ' + (i.last - i.qty), 'warn') : '') + HB.chip(i.cond, i.cond === 'good' ? 'ok' : i.cond === 'worn' ? 'warn' : 'bad') + '</li>').join('') + '</ul></details>').join('') + '</div>';
  }
  const TLI = { turnover: ['check', 'ok'], key: ['key', ''], inspection: ['report', ''], maintenance: ['wrench', 'warn'], compliance: ['shield', ''], issue: ['alert', 'warn'], request: ['quote', 'info'] };
  function history(p) {
    return '<ol class="tl">' + S().history[p.id].slice().sort((a, b) => (a.date < b.date ? 1 : -1)).map((x) => '<li><span class="dot ' + TLI[x.type][1] + '">' + HB.icon(TLI[x.type][0], 17) + '</span><div><div class="when">' + HB.fmt(x.date, 'day').toUpperCase() + '</div><h4>' + HB.esc(x.title) + '</h4><p>' + HB.esc(x.detail) + '</p>' + (x.rep && HB.report(x.rep) && HB.report(x.rep).sent ? '<a class="btn btn-quiet btn-xs" href="#/ow/reports/' + x.rep + '" style="padding-left:0">View report ' + HB.icon('chev-r', 14) + '</a>' : '') + '</div></li>').join('') + '</ol>';
  }

  HB.view('ow.property', {
    title: (pr) => (HB.prop(pr.id) ? HB.prop(pr.id).short : 'Property'),
    render(pr) {
      const p = HB.prop(pr.id); if (!p || p.ownerId !== S().ownerId) return HB.empty('home', 'Property not found', 'That property is not on your account.', '<a class="btn btn-primary" href="#/ow/properties">My properties</a>');
      const tab = pr.tab || 'checklist'; const st = HB.propState(p.id);
      const hero = '<header class="phero ow"><img src="' + HB.photo(p.img) + '" alt="' + HB.esc(p.name) + ', placeholder photo"><div class="phero-in"><a class="back" href="#/ow/properties">' + HB.icon('chev-l', 16) + 'My properties</a><div><h1>' + HB.esc(p.name) + '</h1><p>' + HB.esc(p.street + ', ' + p.town + ' ' + p.pc) + ' · ' + p.beds + ' bed · ' + p.platforms.join(', ') + '</p></div></div></header>' +
        '<div class="row wrap" style="margin:18px 0 8px;gap:10px"><span class="seal-chip ' + st.k + '">' + HB.icon(st.k === 'ready' ? 'check' : st.k === 'occ' ? 'bed' : 'clock', 17) + '<b>' + st.label + '</b><span>' + HB.esc(st.sub) + '</span></span><span class="sp"></span><button class="btn btn-ghost" data-act="share" data-id="' + p.id + '">' + HB.icon('share', 18) + 'Guest-ready link</button><a class="btn btn-primary" href="#/ow/request" data-act="req-for" data-id="' + p.id + '">' + HB.icon('camera', 18) + 'Request something</a></div>';
      const tabs = '<nav class="tabs" aria-label="Property sections">' + TABS.map((t) => '<a href="#/ow/properties/' + p.id + '/' + t[0] + '"' + (tab === t[0] ? ' aria-current="page"' : '') + '>' + t[1] + (t[0] === 'checklist' && S().turn[p.id] && S().turn[p.id].status === 'In progress' ? '<span class="count live-c">live</span>' : '') + '</a>').join('') + '</nav>';
      return hero + tabs + { checklist: live, photos, notes, inventory: inv, history }[tab](p);
    }
  });
  HB.act('share', (el) => HB.shareLink(el.dataset.id));
  HB.act('req-for', (el) => { HB.ui.rf.pid = el.dataset.id; HB.go('/ow/request'); });
})();
