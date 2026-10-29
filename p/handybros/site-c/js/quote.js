/* HandyBros: quote flow. Vanilla JS, client-side only. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var TOTAL = 6;
  var COVER = { BN20: 'Eastbourne', BN21: 'Eastbourne', BN22: 'Eastbourne', BN23: 'Eastbourne', BN24: 'Eastbourne area', TN39: 'Bexhill', TN40: 'Bexhill' };
  var MAXPHOTOS = 8, MAXBYTES = 15 * 1024 * 1024;

  var form = $('#qf');
  var panes = $$('.pane', form);
  var back = $('#back'), next = $('#next'), navRow = $('#navRow');
  var state = { step: 1, type: '', postcode: '', outward: '', covered: false, photos: [], day: '', slot: '', jobNo: '' };

  var jobNo = function () { return String(Math.floor(Math.random() * 9000) + 1000); };
  state.jobNo = jobNo();

  /* ---------- changeover estimator (draft rate card) ---------- */
  var RATE = { 'Studio': [60, 1, false], '1 bedroom': [70, 1, false], '2 bedrooms': [80, 2, false], '3 bedrooms': [105, 3, false], '4 bedrooms': [135, 4, false], '5 or more': [160, 5, true] };
  var estimate = function () {
    if (state.type !== 'care') return '';
    var r = RATE[$('#beds').value];
    if (!r) return '';
    var t = r[0] + ($('#estLinen').checked ? 15 * r[1] : 0);
    if ($('#estSame').checked) t = Math.round(t * 1.2 * 100) / 100;
    return 'from \u00a3' + (Number.isInteger(t) ? t : t.toFixed(2)) + ' per changeover, draft';
  };
  var updateEst = function () {
    var box = $('#est'), e = estimate();
    box.hidden = state.type !== 'care';
    $('#estPrice').textContent = e || 'Choose bedrooms for an estimate';
    live();
  };

  /* ---------- helpers ---------- */
  var setErr = function (id, msg, field) {
    var e = $('#e-' + id);
    if (!e) return;
    e.hidden = !msg;
    e.textContent = msg || '';
    var f = field || $('#' + id);
    if (f && f.setAttribute) { if (msg) f.setAttribute('aria-invalid', 'true'); else f.removeAttribute('aria-invalid'); }
  };
  var val = function (id) { return ($('#' + id).value || '').trim(); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var typeName = function () { return state.type === 'care' ? 'Short-let property care' : (state.type === 'handy' ? 'Handyman / decorating' : ''); };
  var pathName = function () {
    if (state.type !== 'care') return 'Quote by photo';
    return $('input[name=path]:checked').value === 'walkthrough' ? 'Free walk-through' : 'Quote by photo';
  };
  var dayLabel = function (iso) {
    if (!iso) return '';
    var d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  /* ---------- progress + step control ---------- */
  var announce = $('#stepAnnounce');
  var names = ['', 'Type', 'Postcode', 'The job', 'Day', 'You', 'Done'];
  var show = function (n, focus) {
    state.step = n;
    panes.forEach(function (p) { p.hidden = Number(p.dataset.step) !== n; });
    $$('#prog li').forEach(function (li) {
      var p = Number(li.dataset.p);
      li.classList.toggle('done', p < n);
      li.classList.toggle('current', p === n);
      if (p === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    back.hidden = n === 1 || n === TOTAL;
    navRow.hidden = n === TOTAL;
    next.textContent = n === 5 ? 'Send request' : 'Next';
    if (n === 2) { next.hidden = false; }
    announce.textContent = 'Step ' + n + ' of ' + TOTAL + ': ' + names[n];
    if (n === 3) {
      var care = state.type === 'care';
      $('.only-care').hidden = !care;
      $('#h3-text').textContent = care ? 'Tell us about your property' : 'Tell us about the job';
      $('#desc-label').textContent = care ? 'Anything we should know' : 'Describe the job';
      $('#photo-lbl').firstChild.textContent = care ? 'Photos of the property ' : 'Photos of the job ';
    }
    if (n === 3) updateEst();
    if (n === 4) buildCal();
    if (focus !== false) {
      var h = $('h2', panes[n - 1]);
      h.focus({ preventScroll: true });
      var top = $('.prog').getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: top, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
    live();
  };

  /* ---------- step validation ---------- */
  var parsePC = function (raw) {
    var v = raw.toUpperCase().replace(/\s+/g, '');
    if (/^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(v)) return v.slice(0, -3);
    if (/^[A-Z]{1,2}\d[A-Z\d]?$/.test(v)) return v;
    return null;
  };
  var showPC = function () {
    var out = $('#pcOut'), join = $('#joinBox');
    var o = parsePC(val('postcode'));
    state.postcode = val('postcode').toUpperCase();
    if (!o) { out.hidden = true; join.hidden = true; return null; }
    state.outward = o;
    state.covered = !!COVER[o];
    out.hidden = false;
    out.innerHTML = '<span class="stamp"></span><p></p>';
    $('.stamp', out).textContent = state.covered ? 'Covered' : 'Not yet';
    $('p', out).textContent = state.covered
      ? o + ' (' + COVER[o] + ') is on our patch.'
      : o + ' is outside our patch for now. Join the list and we will tell you when we reach you.';
    join.hidden = state.covered;
    return o;
  };

  var validators = {
    1: function () {
      var r = $('input[name=type]:checked');
      if (!r) { setErr('type', 'Choose one to carry on.', null); return false; }
      setErr('type', ''); state.type = r.value; return true;
    },
    2: function () {
      var raw = val('postcode');
      if (!raw) { setErr('postcode', 'Enter your postcode.'); $('#pcOut').hidden = true; $('#joinBox').hidden = true; return false; }
      var o = showPC();
      if (!o) { setErr('postcode', 'That does not look like a UK postcode. Try BN21 4AA.'); return false; }
      setErr('postcode', '');
      if (!state.covered) { setErr('postcode', 'We are not in that area yet. Join the list below.'); return false; }
      return true;
    },
    3: function () {
      var ok = true, first = null;
      var fail = function (id, msg, el) { setErr(id, msg, el); ok = false; if (!first) first = el || $('#' + id); };
      if (state.type === 'care') {
        if (!val('beds')) fail('beds', 'Choose the number of bedrooms.'); else setErr('beds', '');
        if (!val('keys')) fail('keys', 'Tell us about the keys.'); else setErr('keys', '');
        if (!$$('input[name=platform]:checked').length) fail('platforms', 'Pick at least one platform.', $('input[name=platform]')); else setErr('platforms', '', $('input[name=platform]'));
        if (!val('cin')) fail('cin', 'Choose a check-in day.'); else setErr('cin', '');
        if (!val('cout')) fail('cout', 'Choose a check-out day.'); else setErr('cout', '');
      }
      if (val('desc').length < 10) fail('desc', 'Add a few words (at least 10 characters).'); else setErr('desc', '');
      if (first && first.focus) first.focus();
      return ok;
    },
    4: function () {
      var ok = true;
      if (!state.day) { setErr('day', 'Pick a free day.', null); ok = false; } else setErr('day', '');
      if (!$('input[name=slot]:checked')) { setErr('slot', 'Choose AM or PM.', null); ok = false; } else setErr('slot', '');
      if (!ok) { var t = !state.day ? $('.day[tabindex="0"]') : $('input[name=slot]'); if (t) t.focus(); }
      return ok;
    },
    5: function () {
      var ok = true, first = null;
      var fail = function (id, msg) { setErr(id, msg); ok = false; if (!first) first = $('#' + id); };
      if (val('name').length < 2) fail('name', 'Enter your name.'); else setErr('name', '');
      var digits = val('phone').replace(/[^\d]/g, '');
      if (digits.length < 10 || digits.length > 13) fail('phone', 'Enter a phone number we can ring.'); else setErr('phone', '');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val('email'))) fail('email', 'Enter a valid email address.'); else setErr('email', '');
      if (!$('#consent').checked) { setErr('consent', 'Tick the box so we can contact you.', $('#consent')); ok = false; if (!first) first = $('#consent'); } else setErr('consent', '', $('#consent'));
      if (first) first.focus();
      return ok;
    }
  };

  next.addEventListener('click', function () {
    if (!validators[state.step]()) return;
    if (state.step === 5) { finish(); return; }
    show(state.step + 1);
  });
  back.addEventListener('click', function () { if (state.step > 1) show(state.step - 1); });
  form.addEventListener('submit', function (e) { e.preventDefault(); next.click(); });
  /* Enter in a text input moves on rather than submitting nothing */
  form.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'file' && e.target.type !== 'checkbox' && e.target.type !== 'radio') {
      e.preventDefault();
      if (e.target.id === 'joinEmail') { $('#joinBtn').click(); } else { next.click(); }
    }
  });

  /* clear errors as people fix things */
  $$('input[name=type]').forEach(function (r) { r.addEventListener('change', function () { setErr('type', '', null); state.type = r.value; live(); }); });
  ['beds', 'keys', 'cin', 'cout', 'desc', 'name', 'phone', 'email'].forEach(function (id) {
    $('#' + id).addEventListener('input', function () { if (this.getAttribute('aria-invalid')) setErr(id, ''); live(); });
    $('#' + id).addEventListener('change', function () { if (this.getAttribute('aria-invalid')) setErr(id, ''); live(); });
  });
  $('#beds').addEventListener('change', updateEst);
  $('#estLinen').addEventListener('change', updateEst);
  $('#estSame').addEventListener('change', updateEst);
  $$('input[name=platform]').forEach(function (c) { c.addEventListener('change', function () { setErr('platforms', '', $('input[name=platform]')); live(); }); });
  $$('input[name=slot]').forEach(function (c) { c.addEventListener('change', function () { setErr('slot', '', null); live(); }); });
  $$('input[name=path],input[name=contact]').forEach(function (c) { c.addEventListener('change', live); });
  $('#consent').addEventListener('change', function () { setErr('consent', '', this); });
  $('#postcode').addEventListener('input', function () {
    setErr('postcode', ''); state.postcode = this.value.toUpperCase();
    if (parsePC(this.value)) showPC(); else { $('#pcOut').hidden = true; $('#joinBox').hidden = true; }
    live();
  });

  /* join the list (postcode outside patch) */
  $('#joinBtn').addEventListener('click', function () {
    var em = val('joinEmail');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) { setErr('join', 'Enter a valid email address.', $('#joinEmail')); $('#joinEmail').focus(); return; }
    setErr('join', '', $('#joinEmail'));
    state.listEmail = em;
    $('#h6-text').textContent = 'You are on the list';
    $('#r-kind').textContent = 'Waiting list';
    $('#r-stamp').textContent = 'Listed';
    renderSummary([['Postcode', state.postcode], ['Email', em], ['Interested in', typeName() || 'Not chosen']], false);
    $('#r-no').textContent = state.jobNo;
    show(TOTAL);
    freshStamp();
  });

  /* ---------- photos ---------- */
  var drop = $('#drop'), fileIn = $('#photos'), thumbs = $('#thumbs'), upMsg = $('#upMsg');
  var addFiles = function (list) {
    var msgs = [];
    Array.prototype.forEach.call(list, function (f) {
      if (!/^image\//.test(f.type)) { msgs.push(f.name + ' is not an image.'); return; }
      if (f.size > MAXBYTES) { msgs.push(f.name + ' is over 15 MB.'); return; }
      if (state.photos.length >= MAXPHOTOS) { if (msgs.indexOf('Up to 8 photos.') < 0) msgs.push('Up to 8 photos.'); return; }
      state.photos.push({ id: Date.now() + Math.random(), name: f.name, url: URL.createObjectURL(f) });
    });
    upMsg.textContent = msgs.join(' ') || (state.photos.length ? state.photos.length + (state.photos.length === 1 ? ' photo added.' : ' photos added.') : '');
    renderThumbs();
  };
  var X = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 4l12 12M16 4L4 16"/></svg>';
  var renderThumbs = function () {
    thumbs.innerHTML = '';
    state.photos.forEach(function (p) {
      var li = document.createElement('li');
      var img = document.createElement('img'); img.src = p.url; img.alt = 'Photo: ' + p.name;
      var b = document.createElement('button'); b.type = 'button'; b.className = 'rm';
      b.setAttribute('aria-label', 'Remove photo ' + p.name); b.innerHTML = X;
      b.addEventListener('click', function () {
        URL.revokeObjectURL(p.url);
        state.photos = state.photos.filter(function (q) { return q.id !== p.id; });
        upMsg.textContent = 'Removed ' + p.name + '.';
        renderThumbs();
        (thumbs.querySelector('.rm') || fileIn).focus();
      });
      li.appendChild(img); li.appendChild(b); thumbs.appendChild(li);
    });
    live();
  };
  fileIn.addEventListener('change', function () { addFiles(fileIn.files); fileIn.value = ''; });
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
  drop.addEventListener('drop', function (e) { if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files); });

  /* ---------- calendar ---------- */
  var iso = function (d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  var calBuilt = false;
  var buildCal = function () {
    if (calBuilt) return; calBuilt = true;
    var grid = $('#calGrid');
    var today = new Date(); today.setHours(12, 0, 0, 0);
    var start = new Date(today);
    var dow = (start.getDay() + 6) % 7;            /* Monday = 0 */
    start.setDate(start.getDate() - dow);
    var end = new Date(today); end.setDate(end.getDate() + 27);
    var cells = [], firstFree = null;
    for (var d = new Date(start); d <= end || cells.length % 7; d.setDate(d.getDate() + 1)) {
      var cur = new Date(d);
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'day';
      var inRange = cur >= today && cur <= end;
      var weekend = cur.getDay() === 0 || cur.getDay() === 6;
      var seed = (cur.getDate() * 7 + (cur.getMonth() + 1) * 13 + cur.getDay() * 3) % 5;
      var isToday = iso(cur) === iso(today);
      var taken = inRange && (weekend || seed === 0 || isToday);
      var full = dayLabel(iso(cur));
      if (!inRange) {
        btn.className += ' blank'; btn.setAttribute('aria-disabled', 'true'); btn.tabIndex = -1;
        btn.setAttribute('aria-label', full + ', not available');
        btn.innerHTML = '<span class="d">' + cur.getDate() + '</span>';
      } else if (taken) {
        btn.className += ' taken'; btn.setAttribute('aria-disabled', 'true');
        btn.setAttribute('aria-label', full + ', taken');
        btn.innerHTML = '<span class="d">' + cur.getDate() + '</span><span class="st">Taken</span>';
      } else {
        btn.className += ' free'; btn.setAttribute('aria-pressed', 'false'); btn.dataset.date = iso(cur);
        btn.setAttribute('aria-label', full + ', free');
        btn.innerHTML = '<span class="d">' + cur.getDate() + '</span><span class="st">Free</span>';
        if (!firstFree) firstFree = btn;
      }
      if (inRange && (cur.getDate() === 1 || cells.length === 0 || iso(cur) === iso(today))) {
        btn.insertAdjacentHTML('afterbegin', '<span class="m">' + cur.toLocaleDateString('en-GB', { month: 'short' }) + '</span>');
      }
      btn.tabIndex = -1;
      cells.push(btn); grid.appendChild(btn);
    }
    if (firstFree) firstFree.tabIndex = 0;
    var move = function (from, delta) {
      var i = cells.indexOf(from) + delta;
      while (i >= 0 && i < cells.length) {
        if (!cells[i].classList.contains('blank')) { cells.forEach(function (c) { c.tabIndex = -1; }); cells[i].tabIndex = 0; cells[i].focus(); return; }
        i += delta;
      }
    };
    grid.addEventListener('click', function (e) {
      var b = e.target.closest('.day'); if (!b || !b.classList.contains('free')) return;
      cells.forEach(function (c) { if (c.classList.contains('free')) c.setAttribute('aria-pressed', 'false'); c.tabIndex = -1; });
      b.setAttribute('aria-pressed', 'true'); b.tabIndex = 0;
      state.day = b.dataset.date; setErr('day', '', null); live();
    });
    grid.addEventListener('keydown', function (e) {
      var b = e.target.closest('.day'); if (!b) return;
      var m = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7 }[e.key];
      if (m) { e.preventDefault(); move(b, m); }
    });
  };

  /* ---------- live ticket ---------- */
  var row = function (k, v) {
    return '<div><dt>' + esc(k) + '</dt><dd' + (v ? '' : ' class="empty"') + '>' + (v ? esc(v) : 'Not yet') + '</dd></div>';
  };
  function live() {
    var lv = $('#lv'); if (!lv) return;
    var care = state.type === 'care';
    var rows = [['Service', typeName()], ['Postcode', state.covered ? state.postcode : '']];
    if (care) rows.push(['Start with', pathName()]);
    if (care) rows.push(['Estimate', estimate()]);
    rows.push(['Photos', state.photos.length ? String(state.photos.length) : '']);
    rows.push(['Day', state.day ? dayLabel(state.day) + ($('input[name=slot]:checked') ? ', ' + $('input[name=slot]:checked').value : '') : '']);
    lv.innerHTML = rows.map(function (r) { return row(r[0], r[1]); }).join('');
    $('#lvEst').hidden = !(care && estimate());
    $('#lv-no').textContent = 'Job ' + state.jobNo;
    var filled = rows.filter(function (r) { return r[1]; }).length;
    $('#lv-stub').textContent = filled + ' of ' + rows.length + ' filled';
  }

  /* ---------- finish ---------- */
  var renderSummary = function (rows, thumbsToo) {
    $('#sumList').innerHTML = rows.map(function (r) { return row(r[0], r[1]); }).join('');
    var st = $('#sumThumbs'); st.innerHTML = '';
    if (thumbsToo) state.photos.forEach(function (p) {
      var li = document.createElement('li'); var im = document.createElement('img'); im.src = p.url; im.alt = 'Uploaded photo: ' + p.name;
      li.appendChild(im); st.appendChild(li);
    });
  };
  var freshStamp = function () {
    var p = $('.pane.done'); p.classList.remove('fresh'); void p.offsetWidth; p.classList.add('fresh');
  };
  var finish = function () {
    var care = state.type === 'care';
    var rows = [['Service', typeName()], ['Start with', pathName()], ['Postcode', state.postcode]];
    if (care) {
      rows.push(['Bedrooms', val('beds')]);
      if (estimate()) rows.push(['Estimate', estimate()]);
      rows.push(['Platforms', $$('input[name=platform]:checked').map(function (c) { return c.value; }).join(', ')]);
      rows.push(['Check-in / out', val('cin') + ' / ' + val('cout')]);
      rows.push(['Keys', val('keys')]);
    }
    rows.push(['The job', val('desc')]);
    rows.push(['Photos', state.photos.length ? state.photos.length + (state.photos.length === 1 ? ' photo' : ' photos') : 'None added']);
    rows.push(['Day', dayLabel(state.day) + ', ' + $('input[name=slot]:checked').value]);
    rows.push(['Name', val('name')]);
    rows.push(['Phone', val('phone')]);
    rows.push(['Email', val('email')]);
    if (val('addr')) rows.push(['Address', val('addr')]);
    rows.push(['Contact by', $('input[name=contact]:checked').value]);
    renderSummary(rows, true);
    $('#estNote').hidden = !(care && estimate());
    $('#r-no').textContent = state.jobNo;
    $('#r-kind').textContent = care && pathName() === 'Free walk-through' ? 'Walk-through request' : 'Quote request';
    $('#h6-text').textContent = 'Request logged';
    $('#r-stamp').textContent = 'Logged';
    show(TOTAL);
    freshStamp();
  };

  $('#again').addEventListener('click', function () {
    state.photos.forEach(function (p) { URL.revokeObjectURL(p.url); });
    form.reset();
    state = { step: 1, type: '', postcode: '', outward: '', covered: false, photos: [], day: '', slot: '', jobNo: jobNo() };
    renderThumbs(); upMsg.textContent = '';
    $$('.day[aria-pressed=true]').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    $('#pcOut').hidden = true; $('#joinBox').hidden = true;
    $$('[aria-invalid]').forEach(function (e) { e.removeAttribute('aria-invalid'); });
    $$('.err').forEach(function (e) { e.hidden = true; });
    updateEst();
    show(1);
  });

  /* ---------- start ---------- */
  var param = new URLSearchParams(location.search).get('type');
  if (param === 'care' || param === 'handy') {
    var r = $('input[name=type][value=' + param + ']');
    if (r) { r.checked = true; state.type = param; show(2, false); }
    else show(1, false);
  } else { show(1, false); }
})();
