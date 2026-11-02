/* Owner: welcome book editor. Writes the same saved object the guest page reads. */
(function () {
  const S = () => HB.S;
  const CSS_ID = 'stay-admin-css', JS_ID = 'stay-data-js';
  if (!document.getElementById(CSS_ID)) { const l = document.createElement('link'); l.id = CSS_ID; l.rel = 'stylesheet'; l.href = 'css/stay-admin.css'; document.head.appendChild(l); }
  let loadState = 'idle';
  function ensureData() {
    if (window.StayData) return true;
    if (loadState === 'idle') {
      loadState = 'loading';
      const s = document.createElement('script'); s.id = JS_ID; s.src = '../stay/js/data.js';
      s.onload = () => { loadState = 'ready'; if (HB.match().key === 'ow.welcome') HB.renderView(true); };
      s.onerror = () => { loadState = 'failed'; if (HB.match().key === 'ow.welcome') HB.renderView(true); };
      document.head.appendChild(s);
    }
    return false;
  }
  ensureData();

  const EXTRA = { arrival: ['keysafe.code'], contacts: ['host.name', 'host.phone', 'handy.phone'] };
  const HINTS = {
    welcome: 'The first thing a guest reads. A few warm lines.', wifi: 'Guests tap to copy these.', times: 'Shown as two big times at the top.', arrival: 'How guests get in. The key safe code is a demo field.',
    bins: 'Which day each bin goes out.', parking: 'Where to park and any permits.', rules: 'One rule per line.', heating: 'How to work the heating, hot water and appliances.',
    contacts: 'Who guests call. Emergency numbers are added for you.', taxis: 'Local firms you trust, one per line.', shops: 'Optional. Search links for shops are always shown.', things: 'Optional. Search links for things to do are always shown.'
  };
  const ui = (HB.ui.wel = HB.ui.wel || { pid: null, draft: null, base: '' });

  function sync(pid) {
    const SD = window.StayData; const slug = SD.slugForPid(pid);
    if (ui.pid !== pid || !ui.draft) { ui.pid = pid; ui.slug = slug; ui.draft = SD.load(slug); ui.base = JSON.stringify(ui.draft); }
  }
  const dirty = () => JSON.stringify(ui.draft) !== ui.base;

  function field(f) {
    const SD = window.StayData; const v = SD.get(ui.draft, f.path); const id = 'wf-' + f.path.replace(/\./g, '-');
    const help = f.help ? '<small>' + HB.esc(f.help) + '</small>' : '';
    if (f.type === 'textarea') return '<label class="fld full" for="' + id + '">' + HB.esc(f.label) + help + '<textarea id="' + id + '" name="' + f.path + '" rows="3">' + HB.esc(v) + '</textarea></label>';
    return '<label class="fld" for="' + id + '">' + HB.esc(f.label) + help + '<input id="' + id + '" type="' + (f.type === 'tel' ? 'tel' : f.type === 'time' ? 'time' : 'text') + '" name="' + f.path + '" value="' + HB.esc(v) + '" autocomplete="off"></label>';
  }
  function flag(sec) { const ok = window.StayData.filled(ui.draft, sec); return '<span class="sa-flag ' + (ok ? 'ok' : '') + '" data-flag="' + sec.id + '">' + (ok ? 'Filled' : 'Not filled yet') + '</span>'; }
  function group(sec, i) {
    const SD = window.StayData; const paths = sec.paths.concat(EXTRA[sec.id] || []).filter((x, k, a) => a.indexOf(x) === k);
    const fs = paths.map((p) => SD.FIELDS.find((f) => f.path === p)).filter(Boolean);
    return '<section class="sheet pad sa-grp" id="wg-' + sec.id + '" aria-labelledby="wh-' + sec.id + '"><header><h3 id="wh-' + sec.id + '"><span class="mono muted" style="font-size:12px;margin-right:10px">' + String(i + 1).padStart(2, '0') + '</span>' + HB.esc(sec.label) + '</h3>' + flag(sec) + '</header><p class="hint">' + HB.esc(HINTS[sec.id] || '') + '</p><div class="form-grid">' + fs.map(field).join('') + '</div></section>';
  }

  function meter() {
    const SD = window.StayData; const c = SD.completeness(ui.draft);
    return '<div class="sa-meter sheet" id="wel-meter" aria-live="polite"><div class="big"><b>' + c.n + ' of ' + c.total + '</b><span class="muted">sections filled</span></div><div class="segs" aria-hidden="true">' + c.rows.map((r) => '<i class="' + (r.ok ? 'on' : '') + '"></i>').join('') + '</div>' +
      (c.n < c.total ? '<div class="sa-miss">' + c.rows.filter((r) => !r.ok).map((r) => '<a href="#wg-' + r.id + '" data-act="wel-jump" data-to="wg-' + r.id + '" class="chip chip-muted plain">' + HB.esc(r.label) + '</a>').join('') + '</div>' : '<div class="chip chip-ok">Every section is filled</div>') +
      '<p class="sa-note">' + HB.icon('alert', 16) + '<span>This guide is only as accurate as you keep it. HandyBros cannot see when a bin day or a wifi password changes at your place.</span></p></div>';
  }

  function mirror() {
    const SD = window.StayData; const d = ui.draft; const base = SD.defaults(ui.slug); const g = (p) => String(SD.get(d, p)).trim();
    const td = (t) => '<span class="todo">[' + HB.esc(t) + ']</span>';
    const card = (t, body) => '<div class="sa-m"><h4>' + HB.esc(t) + '</h4>' + body + '</div>';
    const txt = (p, miss) => (g(p) ? '<p>' + HB.esc(g(p)) + '</p>' : '<p>' + td(miss) + '</p>');
    const heat = [g('heating'), g('appliances')].filter(Boolean).join('\n');
    const rules = g('rules');
    return '<div class="sa-phone"><div class="sa-screen" id="wel-mirror" aria-label="Preview of the guest page"><div class="sa-hero"><img src="' + HB.photo(base.img || 'yellow-door.jpg') + '" alt=""><div><small>' + HB.esc(base.address || '') + '</small><b>' + HB.esc(d.name || base.name) + '</b></div></div><div class="sa-body">' +
      '<p class="w">' + (g('welcome') ? HB.esc(g('welcome')) : td('welcome message')) + '</p>' +
      card('Wifi', g('wifi.ssid') || g('wifi.pass') ? '<p>' + HB.esc(g('wifi.ssid')) + '</p><p style="font-family:var(--mono)">' + HB.esc(g('wifi.pass')) + '</p>' : '<p>' + td('wifi') + '</p>') +
      '<div class="sa-2"><div class="sa-m"><h4>Check in</h4><div class="v">' + (g('times.checkin') ? HB.esc(g('times.checkin')) : '--:--') + '</div></div><div class="sa-m"><h4>Check out</h4><div class="v">' + (g('times.checkout') ? HB.esc(g('times.checkout')) : '--:--') + '</div></div></div>' +
      card('Arriving', (g('arrival') ? '<p>' + HB.esc(g('arrival')) + '</p>' : '<p>' + td('arrival') + '</p>') + (g('keysafe.where') ? '<p style="margin-top:4px">Key safe: ' + HB.esc(g('keysafe.where')) + '</p>' : '')) +
      card('Bins and recycling', txt('bins', 'bin days')) + card('Parking', txt('parking', 'parking')) +
      card('Heating and appliances', heat ? '<p>' + HB.esc(heat) + '</p>' : '<p>' + td('heating and appliances') + '</p>') +
      card('House rules', rules ? '<p>' + HB.esc(rules) + '</p>' : '<p>' + td('house rules') + '</p>') +
      card('Who to call', (g('host.phone') ? '<p>' + HB.esc(g('host.name') || 'Your host') + ': ' + HB.esc(g('host.phone')) + '</p>' : '<p>' + td('host phone') + '</p>') + (g('handy.phone') ? '<p>HandyBros: ' + HB.esc(g('handy.phone')) + '</p>' : '<p>' + td('call-out phone') + '</p>')) +
      card('Taxis', txt('taxis', 'taxi firm')) +
      (g('shops') ? card('Shops, from your host', '<p>' + HB.esc(g('shops')) + '</p>') : '') + (g('things') ? card('Things to do, from your host', '<p>' + HB.esc(g('things')) + '</p>') : '') +
      '</div></div></div>';
  }

  function qrBox() {
    const SD = window.StayData; const slug = ui.slug;
    return '<div class="sheet sa-qr"><img src="../stay/qr-' + slug + '.svg" alt="QR code that opens the welcome guide for this property"><div><b>QR for the front door</b><p class="u">' + HB.esc(SD.url(slug)) + '</p><div class="acts"><a class="btn btn-ghost btn-sm" href="../stay/print.html?p=' + slug + '" target="_blank" rel="noopener" id="wel-print">' + HB.icon('report', 15) + 'Print QR card</a><a class="btn btn-ghost btn-sm" href="../stay/qr-' + slug + '.png" download="welcome-qr-' + slug + '.png">' + HB.icon('download', 15) + 'PNG</a></div></div></div>';
  }

  function state() { return '<span class="sa-state ' + (dirty() ? 'dirty' : '') + '" id="wel-state">' + (dirty() ? 'Unsaved changes' : 'Saved in this browser') + '</span>'; }

  HB.view('ow.welcome', {
    title: () => 'Welcome book',
    render(pr) {
      if (!ensureData()) return loadState === 'failed' ? HB.empty('alert', 'The welcome book could not load', 'The guest page files were not found next to the portal.') : HB.skeleton();
      const SD = window.StayData; const props = HB.ownerProps(S().ownerId).filter((p) => SD.slugForPid(p.id));
      if (!props.length) return HB.pageHead('Welcome book', 'Your guests\' welcome guide', '') + HB.empty('home', 'No properties yet', 'Once a property is on your account you can build its welcome guide here.');
      const p = props.find((x) => x.id === pr.id) || props[0]; sync(p.id);
      const slug = ui.slug;
      const picker = '<nav class="sa-props" aria-label="Choose a property">' + props.map((x) => '<a href="#/ow/welcome/' + x.id + '"' + (x.id === p.id ? ' aria-current="page"' : '') + '><img src="' + HB.photo(x.img) + '" alt="">' + HB.esc(x.short) + '</a>').join('') + '</nav>';
      const actions = '<a class="btn btn-ghost" id="wel-open" href="../stay/index.html?p=' + slug + '" target="_blank" rel="noopener">' + HB.icon('phone', 18) + 'Open guest page</a>';
      const head = HB.pageHead('Welcome book', 'What your guests see when they scan.', 'Fill in the house details once. Guests scan a QR code inside the front door and get a simple guide on their phone: wifi, arrival, bins, local tips and a way to report a problem.', actions);
      const form = '<form class="stack-l" id="wel-form" data-input="wel-in" data-submit="wel-save" novalidate>' + SD.SECTIONS.map(group).join('') +
        '<div class="sa-actions"><button class="btn btn-primary" type="submit" id="wel-save">' + HB.icon('check', 18) + 'Save</button><button class="btn btn-ghost" type="button" data-act="wel-reset">Reset to sample</button><span class="sp"></span>' + state() + '</div></form>';
      const note = '<p class="note-banner" style="margin-bottom:22px">' + HB.icon('alert', 18) + '<span>In this prototype, Save keeps your changes in this browser only. In the full build, Save would publish to the guest page for every guest.</span></p>';
      return head + picker + note + '<div class="cols">' + form + '<aside class="sa-side" aria-label="Preview and QR code"><div>' + meter() + '</div><div><div class="sec-head"><h2>Live preview</h2></div>' + mirror() + '</div>' + qrBox() + '</aside></div>';
    }
  });

  function refresh() {
    const SD = window.StayData; const m = HB.$('#wel-meter'); if (!m) return;
    const tmp = document.createElement('div');
    tmp.innerHTML = meter(); m.replaceWith(tmp.firstChild);
    const mir = HB.$('#wel-mirror'); if (mir) { tmp.innerHTML = mirror(); const st = mir.scrollTop; mir.replaceWith(tmp.firstChild.firstChild); const n = HB.$('#wel-mirror'); if (n) n.scrollTop = st; }
    SD.SECTIONS.forEach((s) => { const el = HB.$('[data-flag="' + s.id + '"]'); if (!el) return; const ok = SD.filled(ui.draft, s); el.className = 'sa-flag ' + (ok ? 'ok' : ''); el.textContent = ok ? 'Filled' : 'Not filled yet'; });
    const st = HB.$('#wel-state'); if (st) { st.className = 'sa-state ' + (dirty() ? 'dirty' : ''); st.textContent = dirty() ? 'Unsaved changes' : 'Saved in this browser'; }
  }

  HB.act('wel-in', (el, e) => {
    const t = e && e.target; if (!t || !t.name || !ui.draft) return;
    window.StayData.set(ui.draft, t.name, t.value); refresh();
  });
  HB.act('wel-save', () => {
    if (!ui.draft) return;
    const ok = window.StayData.write(ui.slug, ui.draft);
    if (ok) { ui.base = JSON.stringify(ui.draft); refresh(); HB.toast('Saved. The guest page now shows these details.'); }
    else HB.toast('This browser would not let us save. Try a normal window.', { icon: 'alert' });
  });
  HB.act('wel-reset', () => {
    HB.confirm('Reset to the sample guide?', 'This clears your saved changes for this property and puts the sample details back.', 'Reset', () => {
      window.StayData.clear(ui.slug); ui.draft = null; ui.pid = null; HB.renderView(true); HB.toast('Back to the sample guide');
    }, true);
  });
  HB.act('wel-jump', (el) => { const t = document.getElementById(el.dataset.to); if (t) { t.scrollIntoView({ behavior: 'smooth', block: 'center' }); const i = HB.$('input,textarea', t); if (i) i.focus({ preventScroll: true }); } });
})();
