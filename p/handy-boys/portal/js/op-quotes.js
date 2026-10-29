/* Operator: Quotes and requests (inbox, board, quote builder) */
(function () {
  const S = () => HB.S;
  HB.ui.q = { view: 'inbox' };
  const COLS = ['New', 'Quoted', 'Approved', 'Scheduled', 'Done'];
  const ago = (ts) => HB.ago(Math.max(0, Math.round((Date.now() - ts) / 60000)));
  HB.ago2 = ago;
  const stKind = { New: 'info', Quoted: 'brand', Approved: 'ok', Scheduled: 'muted', Done: 'ok', Declined: 'bad' };
  const where = (r) => (r.pid ? HB.prop(r.pid).short + ', ' + HB.prop(r.pid).town : r.who);

  function card(r) {
    const tot = HB.quoteTotal(r);
    return '<a class="rq" href="#/op/quotes/' + r.id + '">' + HB.reqImg(r) + '<div class="rq-b"><div class="row wrap" style="gap:6px">' + HB.chip(r.status, stKind[r.status]) + HB.urgencyChip(r.urgency) + (r.public ? '<span class="tag">Public</span>' : '') + (r.kind === 'eot' ? HB.chip('End of tenancy / void', 'eot') : '') + '</div><h3>' + HB.esc(r.title) + '</h3><p class="muted">' + HB.esc(where(r)) + '</p><p class="rq-m"><span>' + HB.icon('calendar', 14) + HB.fmt(r.day, 'day') + ' ' + r.slot + '</span>' + (tot ? '<b class="mono">' + HB.money(tot) + '</b>' : '<span class="muted">' + ago(r.at) + '</span>') + '</p></div></a>';
  }

  HB.view('op.quotes', {
    title: () => 'Quotes & requests',
    render() {
      const v = HB.ui.q.view; const all = S().requests.slice().sort((a, b) => b.at - a.at);
      const body = v === 'inbox'
        ? '<div class="rq-grid">' + all.filter((r) => r.status !== 'Done').map(card).join('') + '</div>'
        : '<div class="board">' + COLS.map((c) => { const l = all.filter((r) => r.status === c || (c === 'Quoted' && r.status === 'Declined')); const sum = l.reduce((a, r) => a + HB.quoteTotal(r), 0); return '<section class="bcol" aria-label="' + c + '"><header><h2>' + c + '</h2><span class="count mono">' + l.length + '</span><span class="sp"></span><span class="mono muted">' + (sum ? HB.money(sum) : '') + '</span></header>' + (l.length ? l.map(card).join('') : '<div class="bempty">Nothing here</div>') + '</section>'; }).join('') + '</div>';
      return HB.pageHead('Quotes & requests', 'Photos in, fixed prices out.', 'Requests arrive with photos from owners and from the public quote page. Build the quote, send it, and drop the approved job straight into the calendar.',
        '<div class="seg" role="group" aria-label="View"><button data-act="q-view" data-v="inbox" aria-pressed="' + (v === 'inbox') + '">Inbox</button><button data-act="q-view" data-v="board" aria-pressed="' + (v === 'board') + '">Board</button></div>') + body;
    }
  });
  HB.act('q-view', (el) => { HB.ui.q.view = el.dataset.v; HB.emit(); });

  const ensureQuote = (r) => { if (!r.quote) r.quote = { lines: [], note: '', sentAt: null, approvedAt: null }; return r.quote; };

  HB.ui.pf = { rid: null, type: 'hourly', beds: '2', linen: false, oven: false, same: false, up: 'none', hours: 2, mode: 'hours', callout: true };
  const bedLabel = (b) => (b === 'studio' ? 'studio' : b + '-bed');
  function pfState(r) {
    const f = HB.ui.pf;
    if (f.rid !== r.id) { const p = r.pid ? HB.prop(r.pid) : null; Object.assign(f, { rid: r.id, type: r.kind === 'eot' ? 'eot' : 'hourly', beds: p ? String(Math.min(p.beds, 5)) : '2', linen: false, oven: false, same: false, up: 'none', hours: 2, mode: 'hours', callout: true }); }
    return f;
  }
  function prefillPanel(r) {
    const f = pfState(r); const club = r.pid && HB.onClub(r.pid); const R = S().rates;
    const sel = (k, opts) => '<select data-change="pf-set" data-f="' + k + '" data-sync>' + opts.map((o) => '<option value="' + o[0] + '"' + (String(f[k]) === String(o[0]) ? ' selected' : '') + '>' + HB.esc(o[1]) + '</option>').join('') + '</select>';
    const ck = (k, label) => '<label class="chk"><input type="checkbox" data-change="pf-set" data-f="' + k + '"' + (f[k] ? ' checked' : '') + '>' + label + '</label>';
    const beds = [['studio', 'Studio'], ['1', '1 bed'], ['2', '2 bed'], ['3', '3 bed'], ['4', '4 bed'], ['5', '5+ bed (from)']];
    return '<div class="prefill"><div class="row wrap" style="justify-content:space-between"><b>Prefill from the rate card</b>' + HB.rateChip + '</div><div class="form-grid"><label class="fld">Job type' + sel('type', [['turnover', 'Turnover (changeover)'], ['eot', 'End of tenancy / void'], ['hourly', 'Handyman, hourly']]) + '</label>' + (f.type !== 'hourly' ? '<label class="fld">Bedrooms' + sel('beds', beds) + '</label>' : '<label class="fld">Charge by' + sel('mode', [['hours', 'Hourly'], ['half', 'Half day, ' + HB.money(R.half)], ['full', 'Full day, ' + HB.money(R.full)]]) + '</label>') + '</div>' +
      (f.type === 'turnover' ? '<div class="row wrap">' + ck('linen', 'Linen, ' + HB.money(R.linen) + ' a bed') + ck('oven', 'Oven clean, ' + HB.money(R.oven)) + ck('same', 'Same-day, +' + R.sameDay + '%') + '</div>' : '') +
      (f.type === 'hourly' ? '<div class="form-grid">' + (f.mode === 'hours' ? '<label class="fld">Hours<input type="number" min="0.5" step="0.5" value="' + f.hours + '" data-input="pf-set" data-f="hours"></label>' : '<span></span>') + '<div>' + ck('callout', 'Add call-out, ' + HB.money(R.callout)) + '</div></div>' : '') +
      '<label class="fld">Evenings and weekends' + sel('up', [['none', 'Normal hours'], ['min', 'Uplift +' + R.upMin + '%'], ['max', 'Uplift +' + R.upMax + '%']]) + '</label>' +
      '<div class="row wrap" style="justify-content:space-between"><span class="muted" style="font-size:13px">' + (club ? 'Priority Club property: club discount lines are added.' : r.pid ? 'This property is on General rates.' : 'Not a managed property: General rates.') + '</span><button class="btn btn-primary btn-sm" data-act="pf-apply" data-id="' + r.id + '">Prefill lines</button></div></div>';
  }
  HB.act('pf-set', (el) => { const f = HB.ui.pf; f[el.dataset.f] = el.type === 'checkbox' ? el.checked : el.dataset.f === 'hours' ? Number(el.value) || 0 : el.value; HB.emit(); });
  HB.act('pf-apply', (el) => {
    const r = HB.req(el.dataset.id); const f = pfState(r); const R = S().rates; const club = r.pid && HB.onClub(r.pid); const out = []; const r2 = HB.r2;
    const L2 = (d, k, q, rt) => out.push({ id: HB.uid('ln'), desc: d, kind: k, qty: q, rate: rt });
    let base = 0; const nb = f.beds === 'studio' ? 1 : Number(f.beds);
    if (f.type === 'turnover') {
      const price = R.changeover[f.beds]; L2('Holiday-let changeover, ' + bedLabel(f.beds) + (f.beds === '5' ? ' (from)' : '') + ': full clean, beds remade, sanitise, inspection', 'labour', 1, price); base += price;
      if (f.linen) L2('Linen supply, per bed', 'materials', nb, R.linen);
      if (f.oven) { L2('Oven clean', 'labour', 1, R.oven); base += R.oven; }
      if (f.same) { const x = r2(price * R.sameDay / 100); L2('Same-day turnaround, +' + R.sameDay + '%', 'labour', 1, x); base += x; }
      if (club) L2('Priority Club discount on changeover', 'labour', 1, -r2(R.general.changeover - R.club.changeover));
    } else if (f.type === 'eot') {
      const key = Math.min(nb, 3); const price = R.eot[key]; L2('End of tenancy / void: clean, void check and reinstatement look, ' + bedLabel(String(key)) + (nb > 3 ? ' (4+ bed quoted on the visit)' : ' (from)'), 'labour', 1, price); base += price;
      if (f.oven) { L2('Oven clean', 'labour', 1, R.oven); base += R.oven; }
    } else {
      if (f.callout) { L2('Call-out', 'labour', 1, R.callout); base += R.callout; if (club) L2('Priority Club discount on call-out', 'labour', 1, -r2(R.callout - R.club.callout)); }
      if (f.mode === 'half') { L2('Half day', 'labour', 1, R.half); base += R.half; } else if (f.mode === 'full') { L2('Full day', 'labour', 1, R.full); base += R.full; }
      else { L2('Handyman, per hour', 'labour', f.hours || 1, R.hourly); base += (f.hours || 1) * R.hourly; if (club && R.hourly > R.club.hourly) L2('Priority Club hourly rate', 'labour', f.hours || 1, -r2(R.hourly - R.club.hourly)); }
    }
    if (f.up !== 'none') { const pct = f.up === 'min' ? R.upMin : R.upMax; L2('Evening / weekend uplift, +' + pct + '%', 'labour', 1, r2(base * pct / 100)); }
    HB.update(() => { ensureQuote(r).lines = r.quote.lines.concat(out); }); HB.toast(HB.plural(out.length, 'line') + ' added from the draft rate card', { icon: 'list' });
  });
  const PRESETS = [['Call-out and assessment', 'labour', 1, 40], ['Labour, per hour', 'labour', 1, 55], ['Materials and fixings', 'materials', 1, 20], ['Paint and sundries', 'materials', 1, 60]];

  HB.view('op.quote', {
    title: (p) => (HB.req(p.id) ? HB.req(p.id).title : 'Request'),
    render(pr) {
      const r = HB.req(pr.id); if (!r) return HB.empty('quote', 'Request not found', 'It may have been removed.', '<a class="btn btn-primary" href="#/op/quotes">Back to requests</a>');
      const q = r.quote || { lines: [], note: '' }; const lab = q.lines.filter((l) => l.kind === 'labour').reduce((a, l) => a + HB.lineTotal(l), 0); const mat = q.lines.filter((l) => l.kind === 'materials').reduce((a, l) => a + HB.lineTotal(l), 0);
      const o = r.ownerId ? HB.owner(r.ownerId) : null;
      const lines = q.lines.map((l) => '<div class="ql"><label class="fld"><span class="sr">Description</span><input type="text" value="' + HB.esc(l.desc) + '" data-input="ql-edit" data-rid="' + r.id + '" data-lid="' + l.id + '" data-f="desc" placeholder="Describe the line"></label><label class="fld"><span class="sr">Type</span><select data-input="ql-edit" data-rid="' + r.id + '" data-lid="' + l.id + '" data-f="kind"><option value="labour"' + (l.kind === 'labour' ? ' selected' : '') + '>Labour</option><option value="materials"' + (l.kind === 'materials' ? ' selected' : '') + '>Materials</option></select></label><label class="fld"><span class="sr">Quantity</span><input type="number" min="0" step="0.5" value="' + l.qty + '" data-input="ql-edit" data-rid="' + r.id + '" data-lid="' + l.id + '" data-f="qty"></label><label class="fld"><span class="sr">Rate in pounds</span><input type="number" step="0.01" value="' + l.rate + '" data-input="ql-edit" data-rid="' + r.id + '" data-lid="' + l.id + '" data-f="rate"></label><b class="mono ql-t">' + HB.money(HB.lineTotal(l)) + '</b><button class="btn btn-quiet btn-xs" data-act="ql-del" data-rid="' + r.id + '" data-lid="' + l.id + '" aria-label="Remove line">' + HB.icon('trash', 16) + '</button></div>').join('');
      const editable = ['New', 'Quoted', 'Declined'].includes(r.status);
      let cta = '';
      if (r.status === 'New' || r.status === 'Declined') cta = '<button class="btn btn-primary btn-block" data-act="q-send" data-id="' + r.id + '"' + (q.lines.length && HB.quoteTotal(r) > 0 ? '' : ' aria-disabled="true"') + '>' + HB.icon('send', 18) + (o ? 'Send to ' + HB.esc(o.name.split(' ')[0]) : 'Email the quote') + '</button>';
      else if (r.status === 'Quoted') cta = '<div class="note-banner">' + HB.icon('clock', 18) + '<div>Sent ' + ago(q.sentAt) + '. Waiting for ' + (o ? HB.esc(o.name.split(' ')[0]) : 'the customer') + ' to approve.</div></div><div class="row wrap" style="margin-top:12px"><button class="btn btn-ghost" data-act="q-send" data-id="' + r.id + '">Update and resend</button>' + (!o ? '<button class="btn btn-accent" data-act="q-approve-manual" data-id="' + r.id + '">Mark approved (customer replied)</button>' : '') + '</div>';
      else if (r.status === 'Approved') cta = '<div class="note-banner ok">' + HB.icon('check', 18) + '<div>Approved ' + ago(q.approvedAt) + '. Put it in the diary.</div></div><button class="btn btn-primary btn-block" style="margin-top:12px" data-act="q-convert" data-id="' + r.id + '">' + HB.icon('calendar', 18) + 'Convert to job</button>';
      else if (r.status === 'Scheduled') { const e = S().events.find((x) => (r.eventIds || []).includes(x.id)); cta = '<div class="note-banner ok">' + HB.icon('calendar', 18) + '<div>Scheduled' + (e ? ' for ' + HB.fmt(e.date, 'long') + ' at ' + e.start : '') + '.</div></div><div class="row wrap" style="margin-top:12px"><a class="btn btn-ghost" href="#/op/calendar">View calendar</a><button class="btn btn-primary" data-act="q-done" data-id="' + r.id + '">' + HB.icon('check', 18) + 'Mark job done</button></div>'; }
      else cta = '<div class="note-banner ok">' + HB.icon('check', 18) + '<div>Job done. A draft invoice has been added to billing.</div></div>';
      return '<a class="back inline" href="#/op/quotes">' + HB.icon('chev-l', 16) + 'All requests</a>' +
        '<div class="page-head" style="margin-top:14px"><div><div class="eyebrow">Request ' + HB.esc(r.id.toUpperCase()) + ' · ' + ago(r.at) + '</div><h1>' + HB.esc(r.title) + '</h1></div><div class="row wrap">' + HB.chip(r.status, stKind[r.status]) + HB.urgencyChip(r.urgency) + '</div></div>' +
        '<div class="cols"><div class="stack-l"><section class="sheet pad"><div class="gallery">' + (r.photos.length ? r.photos.map((p) => '<img src="' + HB.src(p) + '" alt="Photo sent with the request" class="g-img">').join('') : '<p class="muted">No photos were attached.</p>') + '</div><p style="margin-top:16px;font-size:16px;max-width:60ch">' + HB.esc(r.desc) + '</p><dl class="kv" style="margin-top:14px"><div><dt>From</dt><dd>' + HB.esc(r.who) + (r.public ? ' <span class="tag">Public quote page</span>' : '') + '</dd></div><div><dt>Property</dt><dd>' + (r.pid ? '<a href="#/op/properties/' + r.pid + '" style="text-decoration:underline">' + HB.esc(HB.prop(r.pid).name) + '</a>' : 'Not a managed property') + '</dd></div><div><dt>Preferred</dt><dd>' + HB.fmt(r.day, 'long') + ', ' + (r.slot === 'AM' ? 'morning' : 'afternoon') + '</dd></div>' + (r.pid ? '<div><dt>Access</dt><dd>Key safe and access notes on the property record</dd></div>' : '') + '</dl></section></div>' +
        '<aside class="stack-l"><section class="sheet pad"><div class="sec-head"><h2>Quote</h2><span class="mono muted">' + HB.plural(q.lines.length, 'line') + '</span></div>' + HB.stepsHTML(r) + (editable ? prefillPanel(r) : '') + '<div class="qlines">' + (lines || '<p class="muted" style="padding:14px 0">No lines yet. Start with a preset or add your own.</p>') + '</div>' +
        (editable ? '<div class="row wrap" style="margin-top:8px">' + PRESETS.map((x, i) => '<button class="btn btn-ghost btn-xs" data-act="ql-add" data-id="' + r.id + '" data-p="' + i + '">' + HB.icon('plus', 14) + HB.esc(x[0]) + '</button>').join('') + '<button class="btn btn-ghost btn-xs" data-act="ql-add" data-id="' + r.id + '" data-p="-1">' + HB.icon('plus', 14) + 'Blank line</button></div>' : '') +
        '<dl class="totals"><div><dt>Labour</dt><dd class="mono">' + HB.money(lab) + '</dd></div><div><dt>Materials</dt><dd class="mono">' + HB.money(mat) + '</dd></div><div class="grand"><dt>Total</dt><dd class="mono">' + HB.money(lab + mat) + '</dd></div></dl>' +
        (editable ? '<label class="fld" style="margin-bottom:16px">Note to ' + (o ? HB.esc(o.name.split(' ')[0]) : 'the customer') + '<textarea data-input="ql-note" data-rid="' + r.id + '" rows="2" placeholder="Anything they should know about timing or access">' + HB.esc(q.note || '') + '</textarea></label>' : (q.note ? '<p class="muted" style="margin-bottom:14px">' + HB.esc(q.note) + '</p>' : '')) + cta + '</section></aside></div>';
    }
  });
  HB.act('ql-edit', (el) => { const r = HB.req(el.dataset.rid); const l = r.quote.lines.find((x) => x.id === el.dataset.lid); const f = el.dataset.f; HB.update(() => { l[f] = f === 'qty' || f === 'rate' ? Number(el.value) || 0 : el.value; }); });
  HB.act('ql-note', (el) => { const r = HB.req(el.dataset.rid); r.quote.note = el.value; });
  HB.act('ql-del', (el) => { const r = HB.req(el.dataset.rid); HB.update(() => { r.quote.lines = r.quote.lines.filter((x) => x.id !== el.dataset.lid); }); });
  HB.act('ql-add', (el) => { const r = HB.req(el.dataset.id); const i = Number(el.dataset.p); const p = i >= 0 ? PRESETS[i] : ['', 'labour', 1, 0]; HB.update(() => { ensureQuote(r).lines.push({ id: HB.uid('ln'), desc: p[0], kind: p[1], qty: p[2], rate: p[3] }); }); });
  HB.act('q-send', (el) => {
    const r = HB.req(el.dataset.id); const q = r.quote; if (!q || !q.lines.length || HB.quoteTotal(r) <= 0) { HB.toast('Add at least one priced line first', { icon: 'alert' }); return; }
    const o = r.ownerId ? HB.owner(r.ownerId) : null;
    HB.update((s) => { r.status = 'Quoted'; q.sentAt = Date.now(); q.approvedAt = null; if (o) s.notifs.push({ ownerId: o.id, text: 'New quote for ' + r.title, at: Date.now() }); });
    HB.toast(o ? 'Quote sent to ' + o.name.split(' ')[0] + '. It shows in their portal now.' : 'Quote emailed to the customer', { icon: 'send' });
  });
  HB.act('q-approve-manual', (el) => { const r = HB.req(el.dataset.id); HB.update(() => { r.status = 'Approved'; r.quote.approvedAt = Date.now(); }); HB.toast('Marked approved'); });
  HB.act('q-convert', (el) => {
    const r = HB.req(el.dataset.id);
    HB.modal({ title: 'Convert to a job', sub: 'Drops into the calendar and tells the owner when you are coming.',
      body: '<div class="form-grid"><label class="fld">Date<input type="date" name="date" value="' + (r.day < HB.TODAY ? HB.d(1) : r.day) + '"></label><label class="fld">Starts<select name="start"><option>08:30</option><option selected>09:00</option><option>10:00</option><option>13:00</option><option>14:00</option></select></label><label class="fld">Length<select name="dur"><option value="1">1 hour</option><option value="2" selected>2 hours</option><option value="4">Half day</option><option value="8">Full day</option></select></label><label class="fld">Who<select name="who"><option>Sam</option><option>Alex</option></select></label></div>',
      confirm: 'Add to calendar',
      onConfirm: (dlg) => { const f = HB.formData(dlg); const id = HB.uid('e'); HB.update((s) => { s.events.push({ id, type: r.kind === 'decorating' ? 'decorating' : r.kind === 'eot' ? 'eot' : 'maintenance', date: f.date, start: f.start, dur: Number(f.dur), title: r.title, pid: r.pid, who: f.who, auto: false, req: r.id }); r.status = 'Scheduled'; r.eventIds = [id]; r.day = f.date; }); HB.ui.cal.anchor = f.date; HB.toast('Job added on ' + HB.fmt(f.date, 'day') + ' at ' + f.start, { icon: 'calendar' }); } });
  });
  HB.act('q-done', (el) => {
    const r = HB.req(el.dataset.id);
    HB.update((s) => { r.status = 'Done'; if (r.ownerId) { s.invoices.unshift({ id: 'INV-' + (1100 + s.invoices.length), ownerId: r.ownerId, date: HB.TODAY, desc: r.title, amount: HB.quoteTotal(r), status: 'Draft', kind: 'job', month: 5 }); if (r.pid) s.history[r.pid].unshift({ date: HB.TODAY, type: 'maintenance', title: r.title + ' completed', detail: 'Quote ' + HB.money(HB.quoteTotal(r)) + ' approved.', rep: null }); } });
    HB.toast('Marked done. Draft invoice created.', { icon: 'check' });
  });
})();
