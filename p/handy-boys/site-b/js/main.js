(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* mobile menu */
  var menuBtn = $('#menuBtn'), nav = $('#nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    $$('a', nav).forEach(function (a) {
      a.addEventListener('click', function () { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.focus(); }
    });
  }

  /* hero doors: hover or tap expands one door */
  var doors = $('#doors');
  if (doors) {
    var locked = null;
    var doorEls = $$('.door', doors);
    function setOpen(id) {
      doors.setAttribute('data-open', id || '');
      doorEls.forEach(function (d) {
        var b = $('.door-toggle', d);
        if (b) b.setAttribute('aria-expanded', d.getAttribute('data-door') === id ? 'true' : 'false');
      });
    }
    doorEls.forEach(function (d) {
      var id = d.getAttribute('data-door');
      d.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' && !locked) setOpen(id); });
      d.addEventListener('focusin', function () { if (!locked) setOpen(id); });
      var btn = $('.door-toggle', d);
      btn.addEventListener('click', function () {
        locked = (locked === id) ? null : id;
        setOpen(locked);
      });
    });
    doors.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') setOpen(locked); });
    doors.addEventListener('focusout', function (e) { if (!doors.contains(e.relatedTarget) && !locked) setOpen(null); });
  }

  /* scroll reveals */
  var rv = $$('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  } else { rv.forEach(function (el) { el.classList.add('in'); }); }

  /* timeline spine fills as you scroll */
  var tl = $('#tl');
  if (tl) {
    var upd = function () {
      var r = tl.getBoundingClientRect(), vh = window.innerHeight;
      var p = (vh * 0.6 - r.top) / r.height;
      p = Math.max(0, Math.min(1, p));
      tl.style.setProperty('--p', (p * 100).toFixed(1) + '%');
    };
    window.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd);
    upd();
  }

  /* FAQ accordion */
  $$('.qa button').forEach(function (b) {
    b.addEventListener('click', function () {
      var open = b.getAttribute('aria-expanded') === 'true';
      b.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
  });

  /* portal mock: tabs + ticking checklist */
  var tabs = $$('.ph-tabs [role=tab]');
  function selectTab(t) {
    tabs.forEach(function (x) {
      var on = x === t;
      x.setAttribute('aria-selected', on ? 'true' : 'false');
      x.tabIndex = on ? 0 : -1;
      $('#' + x.getAttribute('aria-controls')).hidden = !on;
    });
    if (t.id === 'pt1') runTicks();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(t); });
    t.addEventListener('keydown', function (e) {
      var n = null;
      if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowLeft') n = tabs[(i + tabs.length - 1) % tabs.length];
      if (n) { e.preventDefault(); n.focus(); selectTab(n); }
    });
  });
  var chk = $('#chk'), ticked = false, tickTimers = [];
  function setProgress(n, total) {
    var bar = $('#chkbar'), meta = $('#chkmeta');
    if (bar) bar.style.width = (n / total * 100) + '%';
    if (meta) meta.textContent = n + ' of ' + total + ' ticked';
  }
  function runTicks() {
    if (!chk) return;
    tickTimers.forEach(clearTimeout); tickTimers = [];
    var items = $$('li', chk);
    items.forEach(function (li) { li.classList.remove('done'); });
    setProgress(0, items.length);
    items.forEach(function (li, i) {
      var delay = reduce ? 0 : 500 + i * 650;
      tickTimers.push(setTimeout(function () { li.classList.add('done'); setProgress(i + 1, items.length); }, delay));
    });
  }
  if (chk) {
    $$('li', chk).forEach(function (li) {
      li.addEventListener('click', function () {
        li.classList.toggle('done');
        var items = $$('li', chk);
        setProgress(items.filter(function (x) { return x.classList.contains('done'); }).length, items.length);
      });
    });
    var ph = $('.phone');
    if ('IntersectionObserver' in window) {
      var io2 = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting && !ticked) { ticked = true; runTicks(); } });
      }, { threshold: 0.4 });
      io2.observe(ph);
    } else { runTicks(); }
  }

  /* coverage: pins + postcode checker */
  var COVER = { BN20: 'e', BN21: 'e', BN22: 'e', BN23: 'e', BN24: 'e', TN39: 'b', TN40: 'b' };
  var NAMES = { e: 'Eastbourne', b: 'Bexhill' };
  var TIPS = {
    e: 'Eastbourne: postcodes BN20, BN21, BN22, BN23 and BN24.',
    b: 'Bexhill: postcodes TN39 and TN40.'
  };
  var pins = { e: $('#pinE'), b: $('#pinB') };
  var tip = $('#mapTip');
  function showTown(t, msg) {
    Object.keys(pins).forEach(function (k) { if (pins[k]) pins[k].classList.toggle('on', k === t); });
    if (tip) tip.textContent = msg || (t ? TIPS[t] : 'Tap a pin to see the postcodes we cover.');
  }
  Object.keys(pins).forEach(function (k) {
    var p = pins[k]; if (!p) return;
    p.addEventListener('click', function () { showTown(k); });
    p.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showTown(k); } });
    p.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') showTown(k); });
  });
  var form = $('#pcForm'), out = $('#pcOut'), input = $('#pc');
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var raw = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (!raw) { out.innerHTML = '<span class="no">Type your postcode first, like BN21 3AB or just BN21.</span>'; input.focus(); showTown(null); return; }
      var m = raw.match(/^([A-Z]{1,2}[0-9][A-Z0-9]?)([0-9][A-Z]{2})?$/);
      if (!m) { out.innerHTML = '<span class="no">That does not look like a UK postcode. Try something like BN21 3AB.</span>'; showTown(null); return; }
      var district = m[1], town = COVER[district];
      if (town) {
        out.innerHTML = '<span class="ok"><strong>Yes, we cover ' + esc(district) + '.</strong> That is ' + NAMES[town] + '. <a href="quote.html?type=care&amp;pc=' + encodeURIComponent(district) + '">Book a free walk-through</a> or <a href="quote.html?type=handyman&amp;pc=' + encodeURIComponent(district) + '">send us a photo for a quote</a>.</span>';
        showTown(town, NAMES[town] + ' is covered: ' + esc(district) + ' is on our list.');
      } else {
        out.innerHTML = '<span class="no"><strong>Not yet.</strong> We only work in Eastbourne and Bexhill for now, and ' + esc(district) + ' is outside that. Leave your email and we will tell you when we reach you.<form id="joinForm" novalidate><label class="sr" for="joinEmail">Email address</label><input id="joinEmail" type="email" autocomplete="email" placeholder="you@example.com"><button class="btn" type="submit">Join the list</button></form><span id="joinMsg" class="err" role="alert"></span></span>';
        showTown(null, 'Outside our patch for now. We are in Eastbourne and Bexhill.');
        var jf = $('#joinForm');
        jf.addEventListener('submit', function (ev) {
          ev.preventDefault();
          var v = $('#joinEmail').value.trim(), msg = $('#joinMsg');
          if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) { msg.textContent = 'Please enter a valid email address.'; $('#joinEmail').focus(); return; }
          jf.outerHTML = '<span><strong>You are on the list.</strong> <span class="todo">[waiting list not connected yet]</span></span>';
          msg.textContent = '';
        });
      }
    });
  }
  var qpc = new URLSearchParams(location.search).get('pc');
  if (qpc && input) { input.value = qpc; }
})();
