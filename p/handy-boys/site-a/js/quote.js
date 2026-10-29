/* Handy Boys quote and booking flow. Client-side only, no back end. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* mobile menu */
  var nav = $('#nav'), tg = $('.nav-tg');
  function setMenu(open) {
    nav.classList.toggle('open', open);
    tg.setAttribute('aria-expanded', open ? 'true' : 'false');
    tg.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    tg.innerHTML = '<svg class="i" aria-hidden="true"><use href="#i-' + (open ? 'close' : 'menu') + '"/></svg>';
  }
  tg.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); tg.focus(); } });

  var state = { type: '', mode: 'walkthrough', preMode: '', pc: null, photos: [], date: null, slot: '' };
  var form = $('#qf'), steps = $$('.qstep'), stepper = $$('#stepper li');
  var back = $('#back'), next = $('#next'), live = $('#q-live'), navrow = $('#navrow');
  var cur = 1, TOTAL = 6;
  var NEXT_HTML = 'Next <svg class="i" aria-hidden="true"><use href="#i-arrow"/></svg>';

  function err(id, msg, field) {
    var e = $('#' + id); if (!e) return;
    e.textContent = msg || ''; e.classList.toggle('on', !!msg);
    if (field) { if (msg) field.setAttribute('aria-invalid', 'true'); else field.removeAttribute('aria-invalid'); }
  }
  function focusFirstError() {
    var cs = $('.qstep.on'); var bad = $('[aria-invalid="true"]', cs) || $('.err.on', cs);
    if (!bad) return;
    var target = bad.matches('.err') ? (bad.closest('.fld, fieldset, .cal, .qstep') && ($('input,select,textarea,button', bad.closest('.fld, fieldset')) || bad)) : bad;
    if (target && target.focus) target.focus();
  }
  function clearErrors(cs) { $$('.err', cs).forEach(function (e) { e.classList.remove('on'); e.textContent = ''; }); $$('[aria-invalid]', cs).forEach(function (f) { f.removeAttribute('aria-invalid'); }); }

  function show(n, focusHeading, noScroll) {
    cur = n;
    steps.forEach(function (s) { s.classList.toggle('on', +s.dataset.step === n); });
    stepper.forEach(function (li) {
      var k = +li.dataset.n;
      li.classList.toggle('done', k < n); li.classList.toggle('cur', k === n);
      if (k === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    back.hidden = n === 1 || n === TOTAL;
    navrow.hidden = n === TOTAL;
    next.innerHTML = n === 5 ? 'Review request <svg class="i" aria-hidden="true"><use href="#i-arrow"/></svg>' : NEXT_HTML;
    var h = $('h2', $('.qstep.on'));
    live.textContent = 'Step ' + n + ' of ' + TOTAL + ': ' + h.textContent;
    if (n === 3) configure3();
    if (n === 4) buildCal();
    if (focusHeading !== false) { h.focus({ preventScroll: true }); }
    if (noScroll) return;
    var top = $('#stepper').getBoundingClientRect().top + window.scrollY - 110;
    window.scrollTo({ top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth' });
  }

  /* step 1 */
  var careMode = $('#care-mode');
  $$('input[name="type"]').forEach(function (r) {
    r.addEventListener('change', function () {
      state.type = r.value; err('e-type', '');
      careMode.hidden = r.value !== 'care';
      if (r.value === 'care') $('input[name="mode"][value="' + (state.preMode || 'walkthrough') + '"]').checked = true;
    });
  });
  function pickType(v) { var r = $('input[name="type"][value="' + v + '"]'); r.checked = true; r.dispatchEvent(new Event('change')); }

  function v1() {
    if (!state.type) { err('e-type', 'Please choose one to continue.'); $('input[name="type"]').focus(); return false; }
    state.mode = state.type === 'care' ? $('input[name="mode"]:checked').value : 'photo';
    return true;
  }

  /* step 2: postcode */
  var pcIn = $('#pc'), pcOut = $('#pc-out');
  function pcResult(r) {
    pcOut.textContent = '';
    var d = document.createElement('div');
    if (!r.valid) { d.className = 'bad'; d.textContent = 'That does not look like a UK postcode. Try something like BN21 4AA.'; }
    else if (r.covered) { d.className = 'ok'; d.textContent = 'Good news: ' + r.district + (r.town ? ' is in ' + r.town + ', which we cover.' : ' is inside our current area.'); }
    else {
      d.className = 'no';
      var t = document.createElement('div'); t.innerHTML = '<b></b> We are in Eastbourne and Bexhill for now. Leave your email and we will tell you when we reach you.<form class="join" novalidate><label class="vh" for="jl">Your email</label><input id="jl" type="email" autocomplete="email" placeholder="you@example.com"><button class="btn btn-d" type="submit" style="min-height:48px">Join the list</button></form><div class="err" role="alert" id="jl-e"></div>';
      $('b', t).textContent = 'Not yet for ' + r.district + '.';
      d.appendChild(t);
      var jf = $('form', t);
      jf.addEventListener('submit', function (e) {
        e.preventDefault(); e.stopPropagation();
        var v = $('input', jf).value.trim(), je = $('#jl-e', t);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { je.textContent = 'Please enter a valid email address.'; je.classList.add('on'); return; }
        je.classList.remove('on');
        var p = document.createElement('p'); p.style.margin = '12px 0 0';
        p.textContent = 'Thanks. We have noted ' + v + ' for ' + r.district + '. (Prototype: this does not send anything yet.)';
        jf.replaceWith(p);
      });
    }
    pcOut.appendChild(d);
  }
  function v2() {
    var r = window.HB.checkPostcode(pcIn.value);
    err('e-pc', '');
    if (!r.valid) { err('e-pc', pcIn.value.trim() ? 'That does not look like a UK postcode. Try something like BN21 4AA.' : 'Please enter your postcode.', pcIn); pcOut.textContent = ''; pcIn.focus(); return false; }
    pcIn.removeAttribute('aria-invalid');
    state.pc = r; pcResult(r);
    if (!r.covered) { var j = $('#jl'); if (j) j.focus(); return false; }
    return true;
  }
  pcIn.addEventListener('input', function () { pcOut.textContent = ''; state.pc = null; });

  /* step 3 */
  var photosRequired = false;
  function configure3() {
    var care = state.type === 'care';
    $('#care-fields').hidden = !care;
    var wt = care && state.mode === 'walkthrough';
    photosRequired = !wt;
    $('#s3lede').textContent = care ? (wt ? 'A few details so the walk-through is useful. Photos are optional but help.' : 'A few details about the property and what needs doing.') : 'Tell us what needs doing, and add photos so we can quote.';
    $('#desc-l').textContent = care ? (wt ? 'Anything we should know? (optional)' : 'What needs doing?') : 'Describe the job';
    $('#photo-l').textContent = photosRequired ? 'Photos' : 'Photos (optional)';
    $('#skip-wrap').hidden = !photosRequired;
    $('#addr').closest('.fld').querySelector('label').textContent = care ? 'Property address, first line' : 'Address of the job, first line';
  }
  var EST = { 'Studio': ['£60', 0], '1': ['£70', 0], '2': ['£80', 0], '3': ['£105', 0], '4': ['£135', 0], '5': ['£160', 1], '6 or more': ['£160', 1] };
  function estimate() {
    var v = $('#beds').value, e = EST[v], box = $('#est');
    if (!e) { box.hidden = true; return null; }
    $('#est-v').textContent = (e[1] ? 'from ' : '') + e[0];
    $('#est-n').textContent = 'Full clean, beds remade, sanitise and inspection, for ' + (v === 'Studio' ? 'a studio' : v === '6 or more' ? 'a property of 5 bedrooms or more' : v === '5' ? 'a property of 5 bedrooms or more' : v + (v === '1' ? ' bedroom' : ' bedrooms')) + '. Linen, oven clean and same-day are extra. Your walk-through confirms the figure.';
    box.hidden = false; return (e[1] ? 'from ' : '') + e[0];
  }
  $('#beds').addEventListener('change', estimate);
  var files = $('#files'), drop = $('#drop'), thumbs = $('#thumbs');
  var MAXP = 8;
  function addFiles(list) {
    var msg = '';
    Array.prototype.forEach.call(list, function (f) {
      if (!/^image\//.test(f.type)) { msg = 'Only image files can be added.'; return; }
      if (f.size > 12 * 1024 * 1024) { msg = 'Each photo must be under 12 MB.'; return; }
      if (state.photos.length >= MAXP) { msg = 'You can add up to ' + MAXP + ' photos.'; return; }
      state.photos.push({ name: f.name, url: URL.createObjectURL(f) });
    });
    renderThumbs(); err('e-photos', msg);
  }
  function renderThumbs() {
    thumbs.textContent = '';
    state.photos.forEach(function (p, i) {
      var li = document.createElement('li'), img = document.createElement('img'), b = document.createElement('button');
      img.src = p.url; img.alt = 'Chosen photo: ' + p.name;
      b.type = 'button'; b.setAttribute('aria-label', 'Remove photo ' + p.name);
      b.innerHTML = '<svg class="i" aria-hidden="true"><use href="#i-close"/></svg>';
      b.addEventListener('click', function () {
        URL.revokeObjectURL(p.url); state.photos.splice(i, 1); renderThumbs();
        (thumbs.querySelector('button') || files).focus();
      });
      li.appendChild(img); li.appendChild(b); thumbs.appendChild(li);
    });
  }
  files.addEventListener('change', function () { addFiles(files.files); files.value = ''; });
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
  drop.addEventListener('drop', function (e) { if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files); });

  function checked(name) { return $$('input[name="' + name + '"]:checked').map(function (i) { return i.value; }); }
  function v3() {
    var ok = true, care = state.type === 'care', wt = care && state.mode === 'walkthrough';
    clearErrors($('.qstep.on'));
    var a = $('#addr'); if (a.value.trim().length < 3) { err('e-addr', 'Please enter the first line of the address.', a); ok = false; }
    if (care) {
      var b = $('#beds'); if (!b.value) { err('e-beds', 'Please choose the number of bedrooms.', b); ok = false; }
      var k = $('#keys'); if (!k.value) { err('e-keys', 'Please tell us who holds the keys now.', k); ok = false; }
      if (!checked('plat').length) { err('e-plat', 'Please choose at least one platform.'); ok = false; }
      if (!checked('din').length) { err('e-din', 'Please choose at least one check-in day, or Varies.'); ok = false; }
      if (!checked('dout').length) { err('e-dout', 'Please choose at least one check-out day, or Varies.'); ok = false; }
    }
    var d = $('#desc');
    if (!wt && d.value.trim().length < 10) { err('e-desc', 'Please describe the job in a sentence or two.', d); ok = false; }
    if (photosRequired && !state.photos.length && !$('#skipphotos').checked) { err('e-photos', 'Please add at least one photo, or tick the box to send them later.'); ok = false; }
    if (!ok) focusFirstError();
    return ok;
  }

  /* step 4: calendar */
  var DAYN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var calBuilt = false, cells = [];
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function taken(d) {
    var dow = d.getDay(); if (dow === 0 || dow === 6) return true;
    var s = iso(d), h = 2166136261; for (var i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0; }
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; h = (h ^ (h >>> 13)) >>> 0;
    return h % 100 < 26;
  }
  function pretty(d) { return DAYN[d.getDay()] + ' ' + d.getDate() + ' ' + MONN[d.getMonth()]; }
  function buildCal() {
    $('#s4lede').textContent = state.type === 'care' && state.mode === 'walkthrough' ? 'Pick a day for your free walk-through in the next four weeks, and morning or afternoon. We confirm the exact time with you.' : 'Pick a day for the visit in the next four weeks, and morning or afternoon. We confirm the exact time with you.';
    if (calBuilt) return; calBuilt = true;
    var g = $('#cal-g'); g.textContent = '';
    var start = new Date(); start.setHours(12, 0, 0, 0); start.setDate(start.getDate() + 1);
    var lead = (start.getDay() + 6) % 7; // Monday first
    for (var p = 0; p < lead; p++) { var sp = document.createElement('span'); sp.setAttribute('aria-hidden', 'true'); g.appendChild(sp); }
    for (var i = 0; i < 28; i++) {
      var d = new Date(start); d.setDate(start.getDate() + i);
      var t = taken(d), b = document.createElement('button');
      b.type = 'button'; b.dataset.date = iso(d); b.dataset.i = cells.length;
      b.setAttribute('aria-pressed', 'false');
      if (t) b.setAttribute('aria-disabled', 'true');
      b.setAttribute('aria-label', pretty(d) + (t ? ', taken' : ', available'));
      var mon = (i === 0 || d.getDate() === 1) ? MONN[d.getMonth()].slice(0, 3) : '';
      b.innerHTML = '<span>' + d.getDate() + '</span><small>' + (mon || (t ? '' : '')) + '</small>';
      b.tabIndex = -1; b._d = d; b._taken = t;
      g.appendChild(b); cells.push(b);
    }
    var first = cells.filter(function (c) { return !c._taken; })[0] || cells[0]; first.tabIndex = 0;
    g.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) pick(b); });
    g.addEventListener('keydown', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var i = +b.dataset.i, n = i;
      if (e.key === 'ArrowRight') n = i + 1; else if (e.key === 'ArrowLeft') n = i - 1; else if (e.key === 'ArrowDown') n = i + 7; else if (e.key === 'ArrowUp') n = i - 7; else if (e.key === 'Home') n = i - ((b._d.getDay() + 6) % 7); else if (e.key === 'End') n = i + (6 - ((b._d.getDay() + 6) % 7)); else return;
      e.preventDefault();
      if (n < 0 || n >= cells.length) return;
      focusCell(cells[n]);
    });
  }
  function focusCell(c) { cells.forEach(function (x) { x.tabIndex = -1; }); c.tabIndex = 0; c.focus(); }
  function pick(b) {
    focusCell(b);
    if (b._taken) { err('e-date', pretty(b._d) + ' is taken. Please pick another day.'); return; }
    err('e-date', '');
    cells.forEach(function (c) { c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
    state.date = b._d; err('e-date', '');
  }
  function v4() {
    var ok = true; err('e-date', ''); err('e-slot', '');
    if (!state.date) { err('e-date', 'Please pick an available day.'); ok = false; }
    var s = checked('slot'); state.slot = s[0] || '';
    if (!state.slot) { err('e-slot', 'Please choose morning or afternoon.'); ok = false; }
    if (!ok) { var f = !state.date ? (cells.filter(function (c) { return c.tabIndex === 0; })[0]) : $('input[name="slot"]'); if (f) f.focus(); }
    return ok;
  }

  /* step 5 */
  function v5() {
    var ok = true; clearErrors($('.qstep.on'));
    var n = $('#name'), e = $('#email'), p = $('#phone'), c = $('#consent');
    if (n.value.trim().length < 2) { err('e-name', 'Please enter your name.', n); ok = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.value.trim())) { err('e-email', 'Please enter a valid email address.', e); ok = false; }
    var digits = p.value.replace(/[\s()+-]/g, '');
    if (!/^\d{10,13}$/.test(digits)) { err('e-phone', 'Please enter a phone number with 10 to 13 digits.', p); ok = false; }
    if (!c.checked) { err('e-consent', 'Please tick the box so we can contact you.'); ok = false; }
    if (!ok) focusFirstError();
    return ok;
  }

  /* step 6: summary */
  function row(dt, ddNode, step) {
    var wrap = document.createElement('div'), t = document.createElement('dt'), d = document.createElement('dd'), cell = document.createElement('span');
    t.textContent = dt; if (typeof ddNode === 'string') d.textContent = ddNode; else d.appendChild(ddNode);
    wrap.appendChild(t); wrap.appendChild(d);
    if (step) { var b = document.createElement('button'); b.type = 'button'; b.textContent = 'Edit'; b.setAttribute('aria-label', 'Edit ' + dt.toLowerCase()); b.addEventListener('click', function () { show(step); }); wrap.appendChild(b); }
    else wrap.appendChild(cell);
    return wrap;
  }
  function buildSummary() {
    var s = $('#sum'); s.textContent = '';
    var care = state.type === 'care', wt = care && state.mode === 'walkthrough';
    $('#s6h').textContent = wt ? 'Walk-through request ready.' : 'Quote request ready.';
    s.appendChild(row('Service', care ? 'Short-let property care' : 'Handyman / decorating', 1));
    s.appendChild(row('Starting with', wt ? 'A free walk-through' : 'A quote by photo', care ? 1 : null));
    s.appendChild(row('Where', $('#addr').value.trim() + ', ' + state.pc.pretty, 2));
    if (care) {
      var bv = $('#beds').value, bl = /^\d$/.test(bv) ? bv + (bv === '1' ? ' bedroom' : ' bedrooms') : (bv === '6 or more' ? '6 or more bedrooms' : bv);
      s.appendChild(row('Property', bl + ' \u00b7 ' + checked('plat').join(', '), 3));
      var est = estimate(); if (est) s.appendChild(row('Estimate', est + ' per turnover (draft rate, owner to confirm)', 3));
      s.appendChild(row('Changeovers', 'Check-in: ' + checked('din').join(', ') + '. Check-out: ' + checked('dout').join(', ') + '.', 3));
      s.appendChild(row('Keys', $('#keys').value + ($('#holdspare').checked ? '. Would like Handy Boys to hold a spare set.' : ''), 3));
    }
    var desc = $('#desc').value.trim(); if (desc) s.appendChild(row(care && wt ? 'Notes' : 'The job', desc, 3));
    var ph = document.createElement('span');
    ph.appendChild(document.createTextNode(state.photos.length ? state.photos.length + (state.photos.length === 1 ? ' photo' : ' photos') : ($('#skipphotos').checked ? 'To be sent later' : 'None added')));
    if (state.photos.length) { var th = document.createElement('span'); th.className = 'th'; th.style.display = 'flex'; state.photos.forEach(function (p) { var im = document.createElement('img'); im.src = p.url; im.alt = ''; th.appendChild(im); }); ph.appendChild(th); }
    s.appendChild(row('Photos', ph, 3));
    s.appendChild(row('Preferred day', pretty(state.date) + ', ' + state.slot.toLowerCase(), 4));
    s.appendChild(row('Contact', $('#name').value.trim() + ', ' + $('#email').value.trim() + ', ' + $('#phone').value.trim(), 5));
    var ref = 'HB-'; var ch = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; for (var i = 0; i < 5; i++) ref += ch[Math.floor(Math.random() * ch.length)];
    $('#ref').textContent = ref;
    $('#s6lede').textContent = wt ? 'This is the walk-through we will arrange. Check it over.' : 'This is the quote request. Check it over.';
  }

  /* clear a field's error as soon as it is edited */
  function liveClear(e) {
    var t = e.target; if (!t || !t.closest || t.closest('.join')) return;
    var box = t.closest('.fld, fieldset, .ampm');
    if (box) { var er = $('.err.on', box); if (er) { er.classList.remove('on'); er.textContent = ''; } }
    if (t.hasAttribute('aria-invalid')) t.removeAttribute('aria-invalid');
  }
  form.addEventListener('input', liveClear); form.addEventListener('change', liveClear);

  /* navigation */
  var validators = { 1: v1, 2: v2, 3: v3, 4: v4, 5: v5 };
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (cur >= TOTAL) return;
    if (!validators[cur]()) return;
    if (cur === 5) buildSummary();
    show(cur + 1);
  });
  back.addEventListener('click', function () { if (cur > 1) show(cur - 1); });
  $('#again').addEventListener('click', function () {
    form.reset(); state = { type: '', mode: 'walkthrough', preMode: '', pc: null, photos: [], date: null, slot: '' };
    renderThumbs(); pcOut.textContent = ''; careMode.hidden = true; $('#est').hidden = true;
    cells.forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
    clearErrors(form); show(1);
  });

  /* entry points: ?start=walkthrough | photo, ?pc=BN21 */
  var q = new URLSearchParams(window.location.search), st = q.get('start'), pcq = q.get('pc');
  if (pcq && /^[A-Za-z0-9 ]{2,9}$/.test(pcq)) pcIn.value = pcq.toUpperCase();
  if (st === 'walkthrough') { pickType('care'); $('input[name="mode"][value="walkthrough"]').checked = true; state.mode = 'walkthrough'; show(2, false, true); pcIn.focus({ preventScroll: true }); }
  else if (st === 'photo') { state.preMode = 'photo'; show(1, false, true); }
  else show(1, false, true);
})();
