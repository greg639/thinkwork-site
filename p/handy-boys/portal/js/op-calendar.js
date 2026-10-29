/* Operator: Calendar (week and month, iCal ghost stays, add/block time) */
(function () {
  const S = () => HB.S;
  HB.ui.cal = { view: 'week', anchor: HB.TODAY, hide: {} };
  const H0 = 8, H1 = 20, RH = 52; // visible hours and row height
  const TYPES = ['turnover', 'eot', 'maintenance', 'quote', 'decorating', 'personal'];

  const visible = (e) => !HB.ui.cal.hide[e.type];
  const evLabel = (e) => (e.pid ? HB.prop(e.pid).short : '') + (e.pid && e.type !== 'turnover' ? ' · ' : e.pid ? '' : '') + (e.type === 'turnover' ? ' turnover' : e.pid ? e.title.replace(/^[^:]*:\s*/, '') : e.title);

  /* stays that touch a window of days, as grid bars on a 70-column track */
  function stayBars(first, ndays, compact) {
    if (HB.ui.cal.hide.stays) return { html: '', lanes: 0 };
    const last = HB.addDays(first, ndays - 1); const cols = ndays * 10; const list = [];
    S().stays.filter((s) => s.end >= first && s.start <= last).sort((a, b) => (a.start < b.start ? -1 : 1)).forEach((s) => {
      const si = HB.diff(s.start, first), ei = HB.diff(s.end, first);
      const a = si < 0 ? 1 : si * 10 + 7, b = ei >= ndays ? cols + 1 : ei * 10 + 5;
      if (b <= a) return; list.push({ s, a, b, cl: si < 0, cr: ei >= ndays });
    });
    const lanesEnd = []; list.forEach((x) => { let l = 0; while (lanesEnd[l] && lanesEnd[l] > x.a) l++; x.l = l; lanesEnd[l] = x.b; });
    const html = list.map((x) => { const p = HB.prop(x.s.pid); return '<div class="stay' + (x.cl ? ' cl' : '') + (x.cr ? ' cr' : '') + '" style="grid-column:' + x.a + ' / ' + x.b + ';grid-row:' + (x.l + 1) + '" title="' + HB.esc(p.name + ' · ' + x.s.platform + ' · ' + HB.fmt(x.s.start) + ' to ' + HB.fmt(x.s.end)) + '"><span>' + HB.esc(p.short) + '</span><em>' + HB.esc(x.s.platform) + '</em></div>'; }).join('');
    return { html, lanes: lanesEnd.length, cols };
  }

  function packDay(list) {
    list = list.slice().sort((a, b) => HB.hnum(a.start) - HB.hnum(b.start)); const out = []; let cluster = []; let cEnd = 0;
    const flush = () => { const n = Math.max(1, ...cluster.map((x) => x.col + 1)); cluster.forEach((x) => { x.n = n; out.push(x); }); cluster = []; };
    list.forEach((e) => {
      const s = HB.hnum(e.start), en = s + e.dur;
      if (cluster.length && s >= cEnd) { flush(); cEnd = 0; }
      const used = cluster.filter((x) => HB.hnum(x.e.start) + x.e.dur > s).map((x) => x.col); let col = 0; while (used.includes(col)) col++;
      cluster.push({ e, col }); cEnd = Math.max(cEnd, en);
    });
    flush(); return out;
  }

  function weekHTML() {
    const mon = HB.monday(HB.ui.cal.anchor); const days = Array.from({ length: 7 }, (_, i) => HB.addDays(mon, i));
    const bars = stayBars(mon, 7);
    const head = days.map((dt) => '<div class="cal-dh' + (dt === HB.TODAY ? ' today' : '') + '"><span>' + HB.fmt(dt, 'wd') + '</span><b class="num">' + HB.parse(dt).getDate() + '</b></div>').join('');
    const times = Array.from({ length: H1 - H0 }, (_, i) => '<div class="cal-t mono">' + String(H0 + i).padStart(2, '0') + ':00</div>').join('');
    const cols = days.map((dt) => {
      const evs = S().events.filter((e) => e.date === dt && visible(e));
      const slots = Array.from({ length: H1 - H0 }, (_, i) => '<button class="slot" data-act="cal-slot" data-date="' + dt + '" data-h="' + (H0 + i) + '" aria-label="Add or block time, ' + HB.fmt(dt, 'day') + ' ' + (H0 + i) + ':00"></button>').join('');
      const items = packDay(evs).map((x) => {
        const e = x.e; const s = Math.max(H0, HB.hnum(e.start)); const en = Math.min(H1, HB.hnum(e.start) + e.dur); const c = HB.kindColor[e.type];
        const st = e.type === 'turnover' && dt === HB.TODAY ? HB.turnStatus(e.pid) : null;
        return '<button class="ev ev-' + c + (st === 'Guest-ready' ? ' fin' : '') + '" style="top:' + ((s - H0) * RH + 1) + 'px;height:' + Math.max(24, (en - s) * RH - 2) + 'px;left:calc(' + (x.col / x.n * 100) + '% + 2px);width:calc(' + (100 / x.n) + '% - 4px)" data-act="ev-open" data-id="' + e.id + '"><b>' + HB.esc(evLabel(e)) + '</b><span class="mono">' + e.start + (e.auto ? ' · iCal' : '') + '</span></button>';
      }).join('');
      const now = dt === HB.TODAY ? '<div class="nowline" style="top:' + ((HB.hnum(HB.clock()) - H0) * RH) + 'px"><i></i></div>' : '';
      return '<div class="cal-col' + (dt === HB.TODAY ? ' today' : '') + '">' + slots + items + now + '</div>';
    }).join('');
    return '<div class="cal-scroll"><div class="cal week"><div class="cal-corner"></div>' + head +
      '<div class="cal-lane-l"><span>Guest stays</span><em>iCal</em></div><div class="cal-lane" style="grid-column:2 / -1"><div class="stays" style="grid-template-columns:repeat(70,1fr);min-height:' + Math.max(1, bars.lanes) * 22 + 'px">' + bars.html + '</div><div class="lane-grid">' + days.map(() => '<i></i>').join('') + '</div></div>' +
      '<div class="cal-times" style="height:' + (H1 - H0) * RH + 'px">' + times + '</div>' + cols + '</div></div>';
  }

  function monthHTML() {
    const a = HB.ui.cal.anchor; const first = a.slice(0, 8) + '01'; const start = HB.monday(first); const month = a.slice(0, 7);
    const lastDay = (() => { const d = HB.parse(first); d.setMonth(d.getMonth() + 1); d.setDate(0); return HB.iso(d); })();
    const nweeks = Math.ceil((HB.diff(lastDay, start) + 1) / 7); let out = '<div class="cal-scroll"><div class="cal month"><div class="mhead">' + ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((x) => '<span>' + x + '</span>').join('') + '</div>';
    for (let w = 0; w < nweeks; w++) {
      const wk = HB.addDays(start, w * 7); const bars = stayBars(wk, 7, true); const days = Array.from({ length: 7 }, (_, i) => HB.addDays(wk, i));
      const top = 28 + bars.lanes * 15 + 3;
      const cells = days.map((dt) => '<button class="mcell' + (dt.slice(0, 7) !== month ? ' off' : '') + (dt === HB.TODAY ? ' today' : '') + '" data-act="cal-slot" data-date="' + dt + '" data-h="9" aria-label="Add or block time, ' + HB.fmt(dt, 'day') + '"><span class="mnum num">' + HB.parse(dt).getDate() + '</span></button>').join('');
      const pills = days.map((dt) => {
        const evs = S().events.filter((e) => e.date === dt && visible(e)).sort((x, y) => x.start.localeCompare(y.start));
        return '<div class="mp">' + evs.slice(0, 3).map((e) => '<button class="pill pill-' + HB.kindColor[e.type] + '" data-act="ev-open" data-id="' + e.id + '"><span class="mono">' + e.start.replace(/^0/, '') + '</span> ' + HB.esc(evLabel(e)) + '</button>').join('') + (evs.length > 3 ? '<button class="more" data-act="cal-week" data-date="' + dt + '">+' + (evs.length - 3) + ' more</button>' : '') + '</div>';
      }).join('');
      out += '<div class="mweek" style="min-height:' + (top + 3 * 24 + 30) + 'px"><div class="mcells">' + cells + '</div><div class="mstays" style="top:26px;grid-template-columns:repeat(70,1fr)">' + bars.html + '</div><div class="mpills" style="top:' + top + 'px">' + pills + '</div></div>';
    }
    return out + '</div></div>';
  }

  HB.view('op.calendar', {
    title: () => 'Calendar',
    render() {
      const c = HB.ui.cal; const mon = HB.monday(c.anchor);
      const title = c.view === 'week' ? HB.fmt(mon) + ' to ' + HB.fmt(HB.addDays(mon, 6), 'full') : HB.fmt(c.anchor, 'month');
      const nauto = S().events.filter((e) => e.auto && e.date >= HB.TODAY && e.date <= HB.d(14)).length;
      const legend = TYPES.map((t) => '<button class="lg lg-' + HB.kindColor[t] + '" data-act="cal-toggle" data-k="' + t + '" aria-pressed="' + !c.hide[t] + '"><i></i>' + HB.kindName[t] + '</button>').join('') + '<button class="lg lg-stay" data-act="cal-toggle" data-k="stays" aria-pressed="' + !c.hide.stays + '"><i></i>Guest stays (iCal)</button>';
      return HB.pageHead('Calendar', title, 'Guest stays are ghosted from each iCal feed, so turnovers fall in the gaps. Click an empty slot to add a job or block time.',
        '<button class="btn btn-primary" data-act="ev-new">' + HB.icon('plus', 18) + 'Add or block time</button>') +
        '<div class="cal-bar"><div class="row"><button class="btn btn-ghost btn-icon" data-act="cal-nav" data-d="-1" aria-label="Previous">' + HB.icon('chev-l', 18) + '</button><button class="btn btn-ghost" data-act="cal-today">Today</button><button class="btn btn-ghost btn-icon" data-act="cal-nav" data-d="1" aria-label="Next">' + HB.icon('chev-r', 18) + '</button></div>' +
        '<div class="seg" role="group" aria-label="View"><button data-act="cal-view" data-v="week" aria-pressed="' + (c.view === 'week') + '">Week</button><button data-act="cal-view" data-v="month" aria-pressed="' + (c.view === 'month') + '">Month</button></div></div>' +
        '<div class="legend" role="group" aria-label="Show or hide job types">' + legend + '</div>' +
        '<div class="note-banner" style="margin:14px 0 18px">' + HB.icon('ical', 20) + '<div><b>' + HB.plural(nauto, 'turnover') + ' created automatically from synced bookings</b> over the next two weeks. One feed (Tidewater Terrace) has gone quiet, so check it before relying on that property\'s gaps.</div></div>' +
        (c.view === 'week' ? weekHTML() : monthHTML());
    }
  });

  HB.act('cal-nav', (el) => { const c = HB.ui.cal; const n = Number(el.dataset.d); if (c.view === 'week') c.anchor = HB.addDays(c.anchor, 7 * n); else { const d = HB.parse(c.anchor.slice(0, 8) + '01'); d.setMonth(d.getMonth() + n); c.anchor = HB.iso(d); } HB.emit(); });
  HB.act('cal-today', () => { HB.ui.cal.anchor = HB.TODAY; HB.emit(); });
  HB.act('cal-view', (el) => { HB.ui.cal.view = el.dataset.v; HB.emit(); });
  HB.act('cal-week', (el) => { HB.ui.cal.view = 'week'; HB.ui.cal.anchor = el.dataset.date; HB.emit(); });
  HB.act('cal-toggle', (el) => { const h = HB.ui.cal.hide; h[el.dataset.k] = !h[el.dataset.k]; HB.emit(); });
  HB.act('cal-slot', (el) => HB.eventModal({ date: el.dataset.date, start: String(el.dataset.h).padStart(2, '0') + ':00' }));
  HB.act('ev-new', (el) => HB.eventModal({ date: HB.ui.cal.anchor === HB.TODAY || HB.role() === 'op' && HB.match().key === 'op.today' ? HB.TODAY : HB.ui.cal.anchor, type: el.dataset.type, pid: el.dataset.pid }));

  function slotOpts(sel) { let o = ''; for (let h = 6; h <= 20.5; h += .5) { const v = HB.hm(h); o += '<option' + (v === sel ? ' selected' : '') + '>' + v + '</option>'; } return o; }
  function hint(root) {
    const f = HB.formData(root); const el = HB.$('#evm-hint', root); const pw = HB.$('#evm-prop', root);
    if (pw) pw.hidden = f.type === 'personal';
    if (!el) return;
    if (f.type === 'personal' || !f.pid) { el.innerHTML = ''; return; }
    const out = S().stays.find((s) => s.pid === f.pid && s.end === f.date); const inn = S().stays.find((s) => s.pid === f.pid && s.start === f.date); const p = HB.prop(f.pid);
    const clash = S().stays.find((s) => s.pid === f.pid && s.start < f.date && s.end > f.date);
    el.innerHTML = clash ? '<div class="note-banner bad">' + HB.icon('alert', 18) + '<div>Guests are staying at ' + HB.esc(p.short) + ' on this date (' + HB.fmt(clash.start) + ' to ' + HB.fmt(clash.end) + '). Pick a gap, or confirm with the owner.</div></div>'
      : out || inn ? '<div class="note-banner ok">' + HB.icon('ical', 18) + '<div>' + (out ? 'Guest checks out ' + p.checkout : 'Empty before arrival') + (inn ? ' · next guest arrives ' + p.checkin : '') + (out && inn ? ' · a ' + HB.dur(HB.hnum(p.checkin) - HB.hnum(p.checkout)) + ' window' : '') + '. From iCal.</div></div>' : '<div class="note-banner">' + HB.icon('ical', 18) + '<div>No guest changeover on this date at ' + HB.esc(p.short) + '.</div></div>';
  }
  HB.act('evm-hint', (el) => hint(el.closest('.dialog')));
  HB.eventModal = (o) => {
    o = o || {}; const type = o.type || 'turnover'; const date = o.date || HB.TODAY;
    HB.modal({
      title: type === 'personal' ? 'Block time' : 'Add to the calendar', sub: 'Pick the kind of job, the property and the slot.',
      body: '<div class="stack" style="gap:16px"><div class="seg" role="radiogroup" aria-label="Job type">' + TYPES.map((t) => '<label><input type="radio" name="type" value="' + t + '" data-change="evm-hint"' + (t === type ? ' checked' : '') + '>' + HB.kindName[t] + '</label>').join('') + '</div>' +
        '<div id="evm-prop"' + (type === 'personal' ? ' hidden' : '') + '><label class="fld">Property<select name="pid" data-change="evm-hint"><option value="">Not tied to a property</option>' + S().props.map((p) => '<option value="' + p.id + '"' + (o.pid === p.id ? ' selected' : '') + '>' + HB.esc(p.name) + '</option>').join('') + '</select></label></div><div id="evm-hint"></div>' +
        '<div class="form-grid"><label class="fld">Title <small>optional</small><input type="text" name="title" placeholder="e.g. Fix gate latch"></label><label class="fld">Who<select name="who"><option>Alex</option><option>Sam</option></select></label>' +
        '<label class="fld">Date<input type="date" name="date" value="' + date + '" data-change="evm-hint"></label><label class="fld">Starts<select name="start">' + slotOpts(o.start || '09:00') + '</select></label>' +
        '<label class="fld">Length<select name="dur"><option value="0.5">30 min</option><option value="1" selected>1 hour</option><option value="1.5">1.5 hours</option><option value="2">2 hours</option><option value="3">3 hours</option><option value="6">Half day</option><option value="9">All day</option></select></label></div></div>',
      confirm: 'Add to calendar',
      onMount: (dlg) => hint(dlg),
      onConfirm: (dlg) => {
        const f = HB.formData(dlg); if (!f.date) { HB.toast('Pick a date', { icon: 'alert' }); return false; }
        const pid = f.type === 'personal' ? null : f.pid || null; const dur = Number(f.dur); const st = HB.hnum(f.start);
        const e = { id: HB.uid('e'), type: f.type, date: f.date, start: dur >= 9 ? '08:00' : f.start, dur: dur >= 9 ? 10 : dur, title: f.title || (f.type === 'personal' ? 'Blocked' : HB.kindName[f.type]), pid, who: f.who, auto: false };
        if (st + dur > 21 && dur < 9) e.dur = Math.max(.5, 21 - st);
        HB.update((s) => { s.events.push(e); }); HB.ui.cal.anchor = f.date;
        HB.toast((f.type === 'personal' ? 'Time blocked' : 'Added') + ' on ' + HB.fmt(f.date, 'day'), { icon: 'calendar' });
      }
    });
  };

  HB.act('ev-open', (el) => {
    const e = S().events.find((x) => x.id === el.dataset.id); if (!e) return; const p = e.pid ? HB.prop(e.pid) : null; const c = HB.kindColor[e.type];
    const st = e.type === 'turnover' && e.date === HB.TODAY && p ? HB.turnStatus(e.pid) : null;
    const rq = e.req ? HB.req(e.req) : null;
    HB.modal({
      title: e.type === 'turnover' ? 'Turnover, ' + p.short : e.title, sub: '<span class="chip chip-' + c + '">' + HB.kindName[e.type] + '</span>' + (st ? ' ' + HB.statusChip(st) : ''),
      body: '<dl class="kv"><div><dt>When</dt><dd>' + HB.fmt(e.date, 'long') + ', ' + e.start + ' for ' + HB.dur(e.dur) + '</dd></div>' + (p ? '<div><dt>Property</dt><dd><a href="#/op/properties/' + p.id + '" data-close style="text-decoration:underline">' + HB.esc(p.name) + '</a>, ' + HB.esc(p.town) + '</dd></div>' : '') + '<div><dt>Who</dt><dd>' + HB.esc(e.who) + '</dd></div>' + (e.auto ? '<div><dt>Source</dt><dd>Created automatically from the ' + HB.esc(p.platforms[0]) + ' iCal booking' + (e.sameDay ? '. Same-day arrival, so the window is tight.' : '.') + '</dd></div>' : '') + (rq ? '<div><dt>Request</dt><dd><a href="#/op/quotes/' + rq.id + '" data-close style="text-decoration:underline">' + HB.esc(rq.title) + '</a></dd></div>' : '') + '</dl>',
      confirm: e.type === 'turnover' && p && HB.turnStatus(e.pid) !== 'Guest-ready' && e.date === HB.TODAY ? 'Open in runner' : 'Close', cancel: e.auto ? 'Close' : 'Delete this',
      onConfirm: () => { if (e.type === 'turnover' && p && e.date === HB.TODAY && HB.turnStatus(e.pid) !== 'Guest-ready') setTimeout(() => HB.runnerOpen(e.pid), 50); },
      onMount: (dlg) => { if (e.auto) return; const del = HB.$('footer [data-close]', dlg); if (del) { del.classList.add('btn-danger'); del.classList.remove('btn-ghost'); del.addEventListener('click', () => { HB.update((s) => { s.events = s.events.filter((x) => x.id !== e.id); }); HB.toast('Removed from the calendar', { icon: 'trash' }); }, { once: true }); } }
    });
  });
})();
