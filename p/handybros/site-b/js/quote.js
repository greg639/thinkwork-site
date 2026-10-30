(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var form = $('#qform');
  var steps = $$('.q-step', form);
  var TOTAL = 5;
  var cur = 1;
  var photos = [];
  var pickedDay = null;
  var COVER = { BN20: 'Eastbourne', BN21: 'Eastbourne', BN22: 'Eastbourne', BN23: 'Eastbourne', BN24: 'Eastbourne', TN39: 'Bexhill', TN40: 'Bexhill' };
  var MAX_FILES = 8, MAX_MB = 10;

  function kind() { var r = $('input[name=kind]:checked'); return r ? r.value : ''; }
  function setErr(id, msg, field) {
    var e = $('#e-' + id); if (e) e.textContent = msg || '';
    if (field) { if (msg) field.setAttribute('aria-invalid', 'true'); else field.removeAttribute('aria-invalid'); }
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* progress + step switching */
  function render(initial) {
    steps.forEach(function (s) { s.hidden = Number(s.getAttribute('data-step')) !== cur; });
    $$('#progress li').forEach(function (li, i) {
      li.classList.toggle('done', i + 1 < cur);
      li.classList.toggle('cur', i + 1 === cur);
      if (i + 1 === cur) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    var count = $('#stepCount');
    count.textContent = cur <= TOTAL ? 'Step ' + cur + ' of ' + TOTAL : 'Done';
    $('#navRow').hidden = cur > TOTAL;
    $('#back').style.visibility = cur === 1 ? 'hidden' : 'visible';
    var nx = $('#next');
    nx.firstChild.nodeValue = cur === TOTAL ? 'Send request ' : (cur === 4 ? 'Next ' : 'Next ');
    if (cur === 3) setupDetails();
    if (cur === 4) setupWhen();
    if (initial) return;
    var h = $('[data-step="' + cur + '"] h2', form);
    if (h) { h.focus({ preventScroll: true }); }
    var top = form.getBoundingClientRect().top + window.scrollY - 90;
    if (window.scrollY > top) window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
  }

  /* step 3 variants */
  function setupDetails() {
    var care = kind() === 'care';
    $$('[data-for=care]').forEach(function (el) { el.hidden = !care; });
    $('#descLabel').textContent = care ? 'Anything we should know about the property?' : 'What needs doing?';
    $('#descHint').textContent = care ? 'Access, parking, quirks, what a good turnover looks like to you. A line or two is plenty.' : 'A line or two is plenty. What is it, where is it, and what is wrong?';
    $('#photoLabel').textContent = care ? 'Photos of the property (optional)' : 'Photos of the job';
  }
  function setupWhen() {
    var wt = kind() === 'care' && ($('input[name=path]:checked') || {}).value === 'walkthrough';
    $('#whenLede').textContent = wt ? 'Pick a day for your free walk-through. We visit, build your inventory and a custom to-do list, then quote.' : 'Choose the day that suits you best over the next four weeks.';
  }

  /* draft changeover estimate by bedroom count */
  var BASE = { 'Studio': [60, 1, false], '1': [70, 1, false], '2': [80, 2, false], '3': [105, 3, false], '4': [135, 4, false], '5': [160, 5, true], '6 or more': [160, 6, true] };
  var estText = '';
  function estimate() {
    var box = $('#est'), v = $('#beds').value, r = BASE[v];
    if (!r) { box.hidden = true; estText = ''; return; }
    var total = r[0];
    var adds = $$('input[name=addon]:checked').map(function (x) { return x.value; });
    if (adds.indexOf('linen') > -1) total += 15 * r[1];
    if (adds.indexOf('oven') > -1) total += 30;
    if (adds.indexOf('sameday') > -1) total = Math.round(total * 1.2);
    var label = 'from \u00a3' + total + (r[2] && adds.length === 0 ? '+' : '') + ' a changeover, draft';
    $('#estPrice').textContent = label.charAt(0).toUpperCase() + label.slice(1);
    estText = label + (adds.length ? ' (with ' + adds.join(', ').replace('sameday', 'same-day').replace('oven', 'oven clean') + ')' : '') + '. Draft rate, owner to confirm';
    box.hidden = false;
  }
  $('#beds').addEventListener('change', estimate);
  $$('input[name=addon]').forEach(function (a) { a.addEventListener('change', estimate); });

  /* validation per step */
  function validate(n) {
    var ok = true, firstBad = null;
    function bad(el) { ok = false; if (!firstBad) firstBad = el; }
    if (n === 1) {
      if (!kind()) { setErr('kind', 'Please choose one so we know what to ask next.'); bad($('input[name=kind]')); } else setErr('kind', '');
    }
    if (n === 2) {
      var pc = $('#postcode'), v = pc.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      var m = v.match(/^([A-Z]{1,2}[0-9][A-Z0-9]?)([0-9][A-Z]{2})?$/);
      if (!v) { setErr('postcode', 'Please enter a postcode.', pc); bad(pc); }
      else if (!m) { setErr('postcode', 'That does not look like a UK postcode. Try something like BN21 3AB.', pc); bad(pc); }
      else if (!COVER[m[1]]) { setErr('postcode', 'We do not cover ' + m[1] + ' yet. We are in Eastbourne and Bexhill for now.', pc); bad(pc); showJoin(m[1]); }
      else { setErr('postcode', '', pc); $('#pcResult').innerHTML = ''; }
    }
    if (n === 3) {
      var care = kind() === 'care';
      var d = $('#desc');
      if (care) {
        var b = $('#beds'), k = $('#keys');
        if (!b.value) { setErr('beds', 'Choose the number of bedrooms.', b); bad(b); } else setErr('beds', '', b);
        if (!k.value) { setErr('keys', 'Tell us about spare keys.', k); bad(k); } else setErr('keys', '', k);
        if (!$$('input[name=platform]:checked').length) { setErr('platform', 'Pick at least one platform.'); bad($('input[name=platform]')); } else setErr('platform', '');
        setErr('desc', '', d);
      } else {
        if (d.value.trim().length < 10) { setErr('desc', 'Please say a little more about the job (at least a few words).', d); bad(d); } else setErr('desc', '', d);
      }
    }
    if (n === 4) {
      if (!pickedDay) { setErr('day', 'Please pick a day from the calendar.'); bad($('#calGrid button:not(:disabled)')); } else setErr('day', '');
      if (!$('input[name=slot]:checked')) { setErr('slot', 'Morning or afternoon?'); bad($('input[name=slot]')); } else setErr('slot', '');
    }
    if (n === 5) {
      var nm = $('#name'), em = $('#email'), ph = $('#phone'), cs = $('#consent');
      if (nm.value.trim().length < 2) { setErr('name', 'Please tell us your name.', nm); bad(nm); } else setErr('name', '', nm);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em.value.trim())) { setErr('email', 'Please enter a valid email address.', em); bad(em); } else setErr('email', '', em);
      if (ph.value.trim() && !/^[0-9+()\s-]{7,}$/.test(ph.value.trim())) { setErr('phone', 'That phone number looks too short.', ph); bad(ph); } else setErr('phone', '', ph);
      if (!cs.checked) { setErr('consent', 'We need the okay to reply to you.'); bad(cs); } else setErr('consent', '');
    }
    if (firstBad) firstBad.focus();
    return ok;
  }

  function showJoin(d) {
    $('#pcResult').innerHTML = '<p class="err" style="color:var(--ink)">Outside our patch for now. <a href="index.html#area">See where we work</a> and join the list.</p>';
  }
  $('#postcode').addEventListener('input', function () {
    var v = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    var m = v.match(/^([A-Z]{1,2}[0-9][A-Z0-9]?)([0-9][A-Z]{2})?$/);
    var out = $('#pcResult');
    if (m && COVER[m[1]]) out.innerHTML = '<p style="font-weight:700;background:var(--butter);border:3px solid var(--ink);border-radius:12px;padding:.7rem 1rem">Good news: ' + esc(m[1]) + ' is in ' + COVER[m[1]] + ', which we cover.</p>';
    else out.innerHTML = '';
  });

  /* photos */
  var dz = $('#dz'), fileIn = $('#files'), thumbs = $('#thumbs');
  function addFiles(list) {
    var msgs = [];
    Array.prototype.forEach.call(list, function (f) {
      if (!/^image\//.test(f.type)) { msgs.push(f.name + ' is not an image.'); return; }
      if (f.size > MAX_MB * 1024 * 1024) { msgs.push(f.name + ' is over ' + MAX_MB + ' MB.'); return; }
      if (photos.length >= MAX_FILES) { msgs.push('Only ' + MAX_FILES + ' photos, please.'); return; }
      photos.push({ file: f, url: URL.createObjectURL(f), id: Math.random().toString(36).slice(2) });
    });
    setErr('files', msgs.join(' '));
    drawThumbs();
  }
  function drawThumbs() {
    thumbs.innerHTML = '';
    photos.forEach(function (p) {
      var li = document.createElement('li');
      var img = document.createElement('img'); img.src = p.url; img.alt = 'Preview of ' + p.file.name;
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Remove photo ' + p.file.name);
      b.innerHTML = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-x"/></svg>';
      b.addEventListener('click', function () {
        URL.revokeObjectURL(p.url);
        photos = photos.filter(function (x) { return x.id !== p.id; });
        drawThumbs();
        (thumbs.querySelector('button') || fileIn).focus();
      });
      li.appendChild(img); li.appendChild(b); thumbs.appendChild(li);
    });
  }
  fileIn.addEventListener('change', function () { addFiles(fileIn.files); fileIn.value = ''; });
  ['dragenter', 'dragover'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove('over'); }); });
  dz.addEventListener('drop', function (e) { if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files); });

  /* calendar: next four weeks, weekends and some weekdays taken */
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function seeded(n) { var x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); }
  function buildCal() {
    var grid = $('#calGrid'); grid.innerHTML = '';
    var start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() + 1);
    var lead = (start.getDay() + 6) % 7;
    for (var i = 0; i < lead; i++) { var bl = document.createElement('span'); bl.className = 'day blank'; bl.setAttribute('aria-hidden', 'true'); grid.appendChild(bl); }
    var availableCount = 0;
    for (var d = 0; d < 28; d++) {
      var dt = new Date(start); dt.setDate(start.getDate() + d);
      var dow = dt.getDay();
      var taken = dow === 0 || dow === 6 || seeded(dt.getDate() + dt.getMonth() * 31) < 0.28;
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'day';
      var label = DAYS[dow] + ' ' + dt.getDate() + ' ' + MONTHS[dt.getMonth()];
      btn.setAttribute('aria-label', label + (taken ? ', taken' : ''));
      btn.innerHTML = dt.getDate() + '<small>' + ((d === 0 || dt.getDate() === 1) ? MONTHS[dt.getMonth()] : (taken ? 'taken' : '&nbsp;')) + '</small>';
      btn.setAttribute('aria-pressed', 'false');
      if (taken) btn.disabled = true; else availableCount++;
      btn.dataset.label = label;
      btn.addEventListener('click', function () {
        $$('.day', grid).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        this.setAttribute('aria-pressed', 'true');
        pickedDay = this.dataset.label;
        setErr('day', '');
      });
      grid.appendChild(btn);
    }
  }
  buildCal();

  /* summary */
  function row(dt, dd) { return '<dt>' + esc(dt) + '</dt><dd>' + dd + '</dd>'; }
  function summarise() {
    var care = kind() === 'care';
    var wt = care && $('input[name=path]:checked').value === 'walkthrough';
    var h = '';
    h += row('Request', care ? (wt ? 'Free walk-through for a short let' : 'Short-let property care, quote from photos') : 'Handyman / decorating, quote from photos');
    var pcv = $('#postcode').value.toUpperCase().replace(/\s+/g, ' ').trim();
    var d = pcv.replace(/\s/g, '').match(/^([A-Z]{1,2}[0-9][A-Z0-9]?)/);
    h += row('Where', esc(pcv) + (d && COVER[d[1]] ? ' (' + COVER[d[1]] + ')' : ''));
    if (care) {
      h += row('Property', esc($('#beds').value) + ' bedroom' + ($('#beds').value === '1' ? '' : 's') + (isNaN(parseInt($('#beds').value, 10)) ? '' : '') );
      h += row('Listed on', esc($$('input[name=platform]:checked').map(function (x) { return x.value; }).join(', ')));
      h += row('Check-in / out', esc($('#cin').value || 'varies') + ' / ' + esc($('#cout').value || 'varies'));
      h += row('Spare key', esc($('#keys').value));
      if (estText) h += row('Estimate', esc(estText));
    }
    var desc = $('#desc').value.trim();
    if (desc) h += row(care ? 'Notes' : 'The job', esc(desc).replace(/\n/g, '<br>'));
    h += row('Photos', photos.length ? '<span class="sthumbs">' + photos.map(function (p) { return '<img src="' + p.url + '" alt="Photo you added: ' + esc(p.file.name) + '">'; }).join('') + '</span>' : 'None added');
    h += row(wt ? 'Walk-through day' : 'Preferred day', esc(pickedDay) + ', ' + ($('input[name=slot]:checked').value === 'AM' ? 'morning' : 'afternoon'));
    h += row('Contact', esc($('#name').value.trim()) + '<br>' + esc($('#email').value.trim()) + ($('#phone').value.trim() ? '<br>' + esc($('#phone').value.trim()) : ''));
    $('#summary').innerHTML = h;
    $('#doneLede').textContent = 'Thanks, ' + $('#name').value.trim().split(' ')[0] + '. ' + (wt ? 'We will confirm your walk-through day.' : 'We will look at your photos and come back with a quote.');
    $('#nextWhat').textContent = wt ? 'come and walk round your property' : 'send you a quote';
  }

  /* navigation */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (cur > TOTAL) return;
    if (!validate(cur)) return;
    if (cur === TOTAL) { summarise(); cur = TOTAL + 1; render(); return; }
    cur++; render();
  });
  $('#back').addEventListener('click', function () { if (cur > 1) { cur--; render(); } });
  $('#again').addEventListener('click', function () {
    form.reset(); estimate(); photos.forEach(function (p) { URL.revokeObjectURL(p.url); }); photos = []; drawThumbs(); pickedDay = null; buildCal(); cur = 1; render();
  });
  /* choosing a type moves on, so the first step is one tap */
  $$('input[name=kind]').forEach(function (r) { r.addEventListener('change', function () { setErr('kind', ''); }); });

  /* deep links from the home page */
  var qp = new URLSearchParams(location.search);
  var t = qp.get('type');
  if (t === 'care' || t === 'handyman') {
    var r = $('input[name=kind][value=' + t + ']'); if (r) { r.checked = true; cur = 2; }
  }
  if (qp.get('pc')) $('#postcode').value = qp.get('pc');
  render(true);
})();
