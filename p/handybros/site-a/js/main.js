/* HandyBros home page behaviour. Vanilla JS, no dependencies. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* header: solid after scroll, mobile menu */
  var hdr = $('.hdr'), nav = $('#nav'), tg = $('.nav-tg');
  function onScrollHdr() { hdr.classList.toggle('solid', window.scrollY > 40); }
  onScrollHdr();
  window.addEventListener('scroll', onScrollHdr, { passive: true });
  function setMenu(open) {
    nav.classList.toggle('open', open);
    tg.setAttribute('aria-expanded', open ? 'true' : 'false');
    tg.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    tg.innerHTML = '<svg class="i" aria-hidden="true"><use href="#i-' + (open ? 'close' : 'menu') + '"/></svg>';
    if (open) hdr.classList.add('solid'); else onScrollHdr();
  }
  tg.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); tg.focus(); } });

  /* scroll reveals */
  var rvs = $$('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    rvs.forEach(function (n) { io.observe(n); });
  } else { rvs.forEach(function (n) { n.classList.add('in'); }); }

  /* hero turnover clock */
  (function () {
    var ol = $('[data-clock]'); if (!ol) return;
    var items = $$('li', ol), at = items.map(function (li) { return +li.dataset.at; });
    var tEl = $('[data-clock-time]');
    var fmt = function (m) { var t = 660 + Math.round(m); return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); };
    var lastKey = '';
    function render(m) {
      var key = m < 0 ? 'x' : String(Math.round(m));
      if (key === lastKey) return; lastKey = key;
      var firstOpen = -1;
      items.forEach(function (li, i) {
        var d = m >= at[i];
        li.classList.toggle('done', d);
        li.classList.remove('active');
        $('.tm', li).textContent = d ? fmt(at[i]) : '';
        if (!d && firstOpen < 0) firstOpen = i;
      });
      if (firstOpen >= 0 && m >= 0) items[firstOpen].classList.add('active');
      tEl.textContent = fmt(Math.max(0, m));
    }
    if (reduce) { render(240); return; }
    var RUN = 12000, HOLD = 4800, t0 = performance.now() + 1700;
    render(-1);
    (function frame(now) {
      var el = now - t0, m;
      if (el < 0) m = -1;
      else if (el < RUN) m = 240 * el / RUN;
      else if (el < RUN + HOLD) m = 240;
      else { t0 = now + 900; m = -1; }
      render(m);
      requestAnimationFrame(frame);
    })(performance.now());
  })();

  /* pinned turnover walk-through */
  (function () {
    var walk = $('[data-walk]'); if (!walk) return;
    var track = $('.walk-track', walk), steps = $$('[data-step]', walk), btns = $$('[data-walk-nav] button', walk);
    var n = steps.length, mq = window.matchMedia('(min-width:1000px) and (min-height:640px)'), cur = -1, ticking = false;
    function setActive(i) {
      if (i === cur) return; cur = i;
      steps.forEach(function (s, k) { s.classList.toggle('on', k === i); });
      btns.forEach(function (b, k) {
        b.classList.toggle('on', k === i); b.classList.toggle('past', k < i);
        if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
    }
    function update() {
      ticking = false;
      if (!walk.classList.contains('is-pinned')) return;
      var total = track.offsetHeight - window.innerHeight;
      var p = clamp(-track.getBoundingClientRect().top / total, 0, 0.9999);
      setActive(Math.floor(p * n));
    }
    function sync() {
      walk.classList.toggle('is-pinned', mq.matches);
      cur = -1; update();
      if (!mq.matches) { steps.forEach(function (s) { s.classList.add('on'); }); btns.forEach(function (b) { b.removeAttribute('aria-current'); }); }
      else if (cur < 0) setActive(0);
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    if (mq.addEventListener) mq.addEventListener('change', sync);
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var i = +b.dataset.i, total = track.offsetHeight - window.innerHeight;
        var top = track.getBoundingClientRect().top + window.scrollY + total * ((i + 0.5) / n);
        window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
      });
    });
    sync();
  })();

  /* dusk band parallax */
  (function () {
    var band = $('[data-dusk]'), bg = $('[data-dusk-bg]'); if (!band || reduce) return;
    var t = false;
    function go() {
      t = false; var r = band.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      var p = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
      bg.style.transform = 'translate3d(0,' + (p * -50).toFixed(1) + 'px,0)';
    }
    window.addEventListener('scroll', function () { if (!t) { t = true; requestAnimationFrame(go); } }, { passive: true });
    go();
  })();

  /* owner portal: the checklist ticks itself */
  (function () {
    var host = $('[data-portal]'); if (!host) return;
    var lists = $$('[data-cl]', host), N = lists[0].children.length;
    var ring = $('[data-ring]', host), count = $('[data-count]', host), gr = $('[data-gr]', host), bar = $('[data-bar]', host), toast = $('[data-toast]', host);
    function setN(k) {
      lists.forEach(function (l) { Array.prototype.forEach.call(l.children, function (li, i) { li.classList.toggle('done', i < k); }); });
      count.textContent = k + ' of ' + N;
      ring.style.strokeDashoffset = (138.2 * (1 - k / N)).toFixed(1);
      bar.style.width = (k / N * 100).toFixed(0) + '%';
      gr.classList.toggle('on', k === N); toast.classList.toggle('on', k === N);
    }
    setN(N);
    if (reduce || !('IntersectionObserver' in window)) return;
    var k = 0, timer = null, started = false;
    function step() {
      if (k < N) { k++; setN(k); timer = setTimeout(step, 1000); }
      else { timer = setTimeout(function () { k = 0; setN(0); timer = setTimeout(step, 900); }, 4800); }
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && !started) { started = true; k = 0; setN(0); timer = setTimeout(step, 700); }
        else if (!e.isIntersecting && started) { clearTimeout(timer); started = false; setN(N); }
      });
    }, { threshold: 0.35 });
    io.observe(host);
  })();

  /* postcode checker */
  (function () {
    var form = $('[data-pc]'), out = $('[data-pc-res]'); if (!form) return;
    var input = $('input', form);
    var tick = '<svg class="i" aria-hidden="true" style="color:var(--green-ink);margin-top:3px"><use href="#i-check"/></svg>';
    function el(html) { var d = document.createElement('div'); d.innerHTML = html; return d; }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var r = window.HB.checkPostcode(input.value);
      out.textContent = '';
      if (!r.valid) {
        out.appendChild(el('<div class="bad"><div><b>That does not look like a UK postcode.</b> Try something like BN21 4AA.</div></div>'));
        input.setAttribute('aria-invalid', 'true'); input.focus(); return;
      }
      input.removeAttribute('aria-invalid');
      if (r.covered) {
        var where = r.town ? 'That is ' + r.town + '.' : 'That is inside our current area.';
        var n = el('<div class="ok">' + tick + '<div><b></b> <span></span> <a class="link" href="quote.html?start=walkthrough&pc=' + encodeURIComponent(r.pretty) + '">Book a free walk-through</a></div></div>');
        $('b', n).textContent = 'Yes, we cover ' + r.district + '.'; $('span', n).textContent = where;
        out.appendChild(n);
      } else {
        var m = el('<div class="no"><div><b></b> We are in Eastbourne and Bexhill for now. Join the list and we will tell you when we reach you.' +
          '<form class="join" novalidate><label class="vh" for="jl">Your email</label><input id="jl" type="email" autocomplete="email" placeholder="you@example.com"><button class="btn btn-d" type="submit" style="min-height:48px">Join the list</button></form>' +
          '<div class="err" role="alert"></div></div></div>');
        $('b', m).textContent = 'Not yet for ' + r.district + '.';
        var jf = $('form', m), err = $('.err', m);
        jf.addEventListener('submit', function (ev) {
          ev.preventDefault();
          var v = $('input', jf).value.trim();
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { err.textContent = 'Please enter a valid email address.'; err.classList.add('on'); return; }
          err.classList.remove('on');
          jf.innerHTML = '';
          var p = document.createElement('p'); p.style.margin = '12px 0 0';
          p.textContent = 'Thanks. We have noted ' + v + ' for ' + r.district + '. (Prototype: this does not send anything yet.)';
          jf.appendChild(p);
        });
        out.appendChild(m);
      }
    });
  })();
})();
