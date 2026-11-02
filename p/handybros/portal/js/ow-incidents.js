/* Owner: Incidents list and the owner's copy of an incident report */
(function () {
  const S = () => HB.S; const F = HB.field;
  const mine = () => F.st().incidents.filter((i) => i.sent && HB.prop(i.pid).ownerId === S().ownerId).sort((a, b) => (a.sent.d + a.sent.t < b.sent.d + b.sent.t ? 1 : -1));
  const lead = (i) => F.photo(i.after[0] || i.before[0]);
  const img = (x) => (x.indexOf('blob:') === 0 || x.indexOf('data:') === 0 ? x : HB.photo(x));

  HB.view('ow.incidents', {
    title: () => 'Incidents',
    render() {
      const list = mine(); const pinned = list.reduce((n, i) => n + i.before.length + i.after.length + i.fix.length, 0);
      return HB.pageHead('Incidents', 'If something goes wrong, you have the proof.', 'Damage, break-ins, guest disputes: each one becomes a report with before and after photos, who attended, and what was done. Reports stay here permanently and are copied to your compliance vault, ready for Airbnb or your insurer.') +
        (list.length ? '<section class="figures" style="margin-bottom:28px"><div><span class="eyebrow">Reports</span><b class="fig">' + list.length + '</b></div><div><span class="eyebrow">Open</span><b class="fig">' + list.filter((i) => i.status === 'open').length + '</b></div><div><span class="eyebrow">Insurance relevant</span><b class="fig">' + list.filter((i) => i.insurance).length + '</b></div><div><span class="eyebrow">Photos kept as proof</span><b class="fig">' + pinned + '</b></div></section>' +
          '<div class="inc-list">' + list.map((i) => {
            const p = HB.prop(i.pid), l = lead(i);
            return '<a class="inc-row" href="#/ow/incidents/' + i.id + '"><span class="inc-th">' + (l && l.src ? '<img src="' + img(l.src) + '" alt="">' : '') + '</span><div class="inc-b"><b>' + HB.esc(i.title) + '</b><p class="muted">' + HB.esc(p.short) + ' · ' + HB.esc(i.room) + ' · ' + HB.fmt(i.raised.d, 'day') + '</p><div class="row wrap" style="gap:6px;margin-top:8px">' + (i.status === 'resolved' ? HB.chip('Resolved', 'ok', 'check') : HB.chip('Open', 'warn', 'alert')) + HB.chip(i.sev, F.sevKind[i.sev]) + (i.insurance ? HB.chip('Insurance relevant', 'info', 'shield') : '') + (i.ack ? HB.chip('You acknowledged', 'ok', 'check') : HB.chip('Needs your acknowledgement', 'brand', 'eye')) + '<span class="pst pin">' + HB.icon('file', 12) + 'In your vault</span></div></div>' + HB.icon('chev-r', 18) + '</a>';
          }).join('') + '</div>'
          : HB.empty('shield', 'No incidents', 'Nothing has gone wrong at your properties. If it does, the report appears here with the photos attached.')) +
        '<p class="footnote" style="margin-top:22px">Routine photos are replaced at the next visit to keep storage small. Photos attached to an incident are never removed.</p>';
    }
  });

  HB.view('ow.incident', {
    title: (p) => (F.inc(p.id) ? 'Incident ' + p.id : 'Incident'),
    mount(main, pr) {
      const i = F.inc(pr.id);
      if (i && i.sent && !i.read && HB.prop(i.pid).ownerId === S().ownerId) HB.update(() => { i.read = F.stamp(); i.timeline.push({ d: i.read.d, t: i.read.t, by: HB.curOwner().name, text: 'Opened the report.' }); });
    },
    render(pr) {
      const i = F.inc(pr.id);
      if (!i || !i.sent || HB.prop(i.pid).ownerId !== S().ownerId) return HB.empty('alert', 'Report not found', 'It may not have been sent to you yet.', '<a class="btn btn-primary" href="#/ow/incidents">All incidents</a>');
      const d = (S().docs || []).find((x) => x.incidentId === i.id);
      return '<a class="back inline" href="#/ow/incidents">' + HB.icon('chev-l', 16) + 'All incidents</a><div class="inc-bar"><div class="row wrap" style="gap:8px">' + (i.status === 'resolved' ? HB.chip('Resolved', 'ok', 'check') : HB.chip('Open', 'warn', 'alert')) + HB.chip(i.sev, F.sevKind[i.sev]) + (i.insurance ? HB.chip('Insurance relevant', 'info', 'shield') : '') + (d ? '<span class="pst pin">' + HB.icon('file', 12) + 'Saved in your vault as ' + HB.esc(d.name) + ' (' + HB.esc(d.size) + ')</span>' : '') + '</div><div class="row wrap" style="gap:10px"><button class="btn btn-ghost" data-act="inc-print" data-id="' + i.id + '">' + HB.icon('download', 18) + 'Download PDF</button>' +
        (i.ack ? '' : '<button class="btn btn-primary" data-act="ow-ack" data-id="' + i.id + '">' + HB.icon('check', 18) + 'Acknowledge</button>') + '</div></div>' +
        '<div class="note-banner ' + (i.ack ? 'ok' : '') + '">' + HB.icon(i.ack ? 'check' : 'eye', 20) + '<div>' + (i.ack ? '<b>Read receipt sent.</b> You acknowledged this report on ' + F.fs(i.ack) + '. HandyBros can see that you have it.' : '<b>HandyBros are told when you open this.</b> Tap Acknowledge once you have read it, so there is a record that you have seen it.') + '</div></div>' + F.docHTML(i);
    }
  });
  HB.act('ow-ack', (el) => {
    const i = F.inc(el.dataset.id);
    HB.update(() => { i.ack = Object.assign(F.stamp(), { by: HB.curOwner().name }); i.timeline.push({ d: i.ack.d, t: i.ack.t, by: HB.curOwner().name, text: 'Acknowledged the report.' }); });
    HB.toast('Acknowledged. HandyBros can see you have read it.', { icon: 'check' });
  });
})();
