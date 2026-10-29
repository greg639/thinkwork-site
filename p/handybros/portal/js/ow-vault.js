/* Owner: Compliance vault */
(function () {
  const S = () => HB.S;
  const mine = () => HB.complianceItems().filter((c) => c.p.ownerId === S().ownerId).sort((a, b) => a.days - b.days);

  function reminders(items) {
    const set = S().settings.reminder; const out = [];
    items.forEach((c) => {
      [60, 30, 7].forEach((n) => { if (set['d' + n]) { const dt = HB.addDays(c.due, -n); if (dt >= HB.TODAY && c.days > 0) out.push({ dt, n, c }); } });
      if (c.reminded) out.push({ dt: c.reminded, sent: true, c });
    });
    return out.sort((a, b) => (a.dt < b.dt ? -1 : 1));
  }

  HB.view('ow.compliance', {
    title: () => 'Compliance vault',
    render() {
      const items = mine(); const rem = reminders(items); const bad = items.filter((c) => c.rag === 'r').length;
      return HB.pageHead('Compliance vault', 'Every certificate, and when it runs out.', 'Upload what you hold, and HandyBros will remind you at 60, 30 and 7 days and can book the engineer.',
        '<button class="btn btn-primary" data-act="doc-up">' + HB.icon('upload', 18) + 'Upload a certificate</button>') +
        (bad ? '<div class="note-banner bad" style="margin-bottom:22px">' + HB.icon('alert', 20) + '<div><b>' + HB.plural(bad, 'item has', 'items have') + ' expired.</b> Ask HandyBros to book the engineer, or upload a newer certificate if you already have one.</div></div>' : '') +
        '<div class="cols"><section><div class="sec-head"><h2>Documents</h2><span class="mono muted">' + items.length + '</span></div><div class="stack">' + items.map((c) => {
          const bk = c.booked ? '<span class="chip chip-info">Engineer booked ' + HB.fmt(c.booked, 'short') + '</span>' : '';
          return '<article class="vrow"><span class="v-ico">' + HB.icon(c.t.icon, 22) + '</span><div class="v-b"><div class="row wrap" style="gap:8px"><b>' + HB.esc(c.t.name.replace(' (EICR)', '').replace(' (EPC)', '')) + '</b>' + HB.expiryBadge(c) + bk + '</div><p class="muted">' + HB.esc(c.p.name) + ' · ' + HB.esc(c.t.cycle) + '</p><p class="v-d">' + (c.doc ? HB.icon('file', 15) + HB.esc(c.doc.name) + ' <span class="muted">· ' + HB.esc(c.doc.size) + ', added ' + HB.fmt(c.doc.added, 'short') + '</span>' : '<span class="muted">No certificate on file' + (c.resp === 'HandyBros' ? ': HandyBros record this at the visit.' : '.') + '</span>') + '</p></div><div class="v-a">' + (c.doc ? '<button class="btn btn-ghost btn-sm" data-act="doc-dl" data-id="' + c.id + '">' + HB.icon('download', 16) + 'Download</button>' : '') + (c.rag !== 'g' && !c.booked ? '<button class="btn btn-accent btn-sm" data-act="doc-book" data-id="' + c.id + '">Book an engineer</button>' : '') + '<button class="btn btn-quiet btn-sm" data-act="doc-up" data-id="' + c.id + '">' + HB.icon('upload', 16) + (c.doc ? 'Replace' : 'Upload') + '</button></div></article>';
        }).join('') + '</div><p class="footnote" style="margin-top:18px">' + HB.complianceNote + '</p></section>' +
        '<aside><div class="sec-head"><h2>Upcoming reminders</h2></div>' + (rem.length ? '<ol class="tl rem-tl">' + rem.slice(0, 7).map((r) => '<li><span class="dot ' + (r.sent ? 'ok' : '') + '">' + HB.icon(r.sent ? 'check' : 'bell', 16) + '</span><div><div class="when">' + HB.fmt(r.dt, 'day').toUpperCase() + '</div><h4>' + (r.sent ? 'Reminder sent' : r.n + '-day reminder') + '</h4><p>' + HB.esc(r.c.t.name.replace(' (EICR)', '').replace(' (EPC)', '')) + ', ' + HB.esc(r.c.p.short) + '</p></div></li>').join('') + '</ol>' : HB.empty('bell', 'No reminders scheduled', 'Reminders appear here once a certificate has a due date.')) + '</aside></div>';
    }
  });
  HB.act('doc-dl', (el) => { const c = HB.complianceItems().find((x) => x.id === el.dataset.id); HB.download(c.doc.name.replace(/\.pdf$/, '') + '-sample.txt', 'text/plain', 'SAMPLE PLACEHOLDER\n' + c.t.name + '\n' + HB.addr(c.p) + '\nThis is demo data, not a real certificate.'); });
  HB.act('doc-book', (el) => { const c = HB.complianceItems().find((x) => x.id === el.dataset.id); HB.update((s) => { s.compliance.find((k) => k.id === c.id).booked = HB.d(4); s.events.push({ id: HB.uid('e'), type: 'maintenance', date: HB.d(4), start: '09:00', dur: 1.5, title: 'Engineer: ' + c.t.name.replace(' (EICR)', '').replace(' (EPC)', ''), pid: c.pid, who: 'Sam', auto: false }); }); HB.toast('Requested for ' + HB.fmt(HB.d(4), 'day') + '. HandyBros will confirm the time.', { icon: 'wrench' }); });
  HB.act('doc-up', (el) => {
    const items = mine(); const pre = el.dataset && el.dataset.id;
    const upd = (dlg) => { const f = HB.formData(dlg); const c = items.find((x) => x.id === f.c); if (c) HB.$('[name=exp]', dlg).value = HB.addMonths(HB.TODAY, c.t.months); };
    HB.acts['doc-pick'] = (e) => upd(e.closest('.dialog'));
    HB.modal({ title: 'Upload a certificate', sub: 'The file stays in this browser in the demo. In the live product it is stored securely against the property.',
      body: '<div class="form-grid"><label class="fld full">Which item?<select name="c" data-change="doc-pick">' + items.map((c) => '<option value="' + c.id + '"' + (pre === c.id ? ' selected' : '') + '>' + HB.esc(c.t.name.replace(' (EICR)', '').replace(' (EPC)', '') + ', ' + c.p.short) + '</option>').join('') + '</select></label><label class="fld full">Certificate file<input type="file" name="file" accept=".pdf,image/*"></label><label class="fld">New expiry date<input type="date" name="exp"></label><label class="fld">Issued on<input type="date" name="iss" value="' + HB.TODAY + '"></label></div>',
      confirm: 'Save to vault', onMount: upd,
      onConfirm: (dlg) => { const f = HB.formData(dlg); const file = HB.$('[name=file]', dlg).files[0]; if (!file) { HB.toast('Choose the certificate file', { icon: 'alert' }); return false; } if (!f.exp) { HB.toast('Set the expiry date', { icon: 'alert' }); return false; } HB.update((s) => { const c = s.compliance.find((k) => k.id === f.c); c.last = f.iss; c.due = f.exp; c.booked = null; c.doc = { name: file.name, added: HB.TODAY, size: Math.max(1, Math.round(file.size / 1024)) + ' KB' }; s.history[c.pid].unshift({ date: HB.TODAY, type: 'compliance', title: s.TYPES[c.type].name + ' uploaded', detail: 'Valid until ' + HB.fmt(f.exp, 'full') + '.', rep: null }); }); HB.toast('Saved. Valid until ' + HB.fmt(f.exp, 'short'), { icon: 'shield' }); } });
  });
})();
