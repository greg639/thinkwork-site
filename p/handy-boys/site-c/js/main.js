/* Handy Boys: home page behaviour. Vanilla JS. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var TICK = '<svg viewBox="0 0 20 20"><path d="M4 10.5l4 4 8-9"/></svg>';

  /* ---- mobile nav ---- */
  var toggle = $('.nav-toggle'), nav = $('#nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    $$('a', nav).forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  /* ---- scroll reveals ---- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(function (el, i) {
      el.style.transitionDelay = (i % 3) * 80 + 'ms';
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---- hero: the job ticket writes itself ---- */
  var ticket = $('#heroTicket');
  if (ticket && !reduce) {
    var elNo = $('[data-no]', ticket), elSide = $('[data-side]', ticket), elProp = $('[data-prop]', ticket),
        elTasks = $('[data-tasks]', ticket), elStamp = $('[data-stamp]', ticket), elStub = $('[data-stub]', ticket),
        card = $('.t-body', ticket).parentNode;
    var jobs = [
      { no: '0001', side: 'Side A / Short-let', prop: 'Sample: 2-bed seaside flat', stamp: 'Guest-ready', stub: 'Turnover ticket',
        tasks: ['Check-out', 'Clean', 'Inventory', 'Fix dripping tap', 'Guest-ready'] },
      { no: '0002', side: 'Side B / Handyman', prop: 'Sample: spare room repaint', stamp: 'Done', stub: 'Handyman ticket',
        tasks: ['Photo quote', 'Prep and mask', 'Two coats, sage', 'Tidy and clear', 'Signed off'] }
    ];
    var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
    var running = true;
    var visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(ticket);
    }
    var pace = function (ms) {
      /* hold the loop while the tab is hidden or the ticket is off screen */
      return new Promise(function (res) {
        (function poll() {
          if (document.hidden || !visible) { setTimeout(poll, 400); } else { setTimeout(res, ms); }
        })();
      });
    };
    var play = async function (job) {
      elNo.textContent = job.no;
      elSide.textContent = job.side;
      elStub.textContent = job.stub;
      elStamp.textContent = job.stamp;
      elStamp.classList.remove('on');
      elProp.textContent = '';
      elTasks.innerHTML = '';
      card.classList.add('typing');
      for (var i = 0; i <= job.prop.length; i++) { elProp.textContent = job.prop.slice(0, i); await pace(32); }
      card.classList.remove('typing');
      var lis = job.tasks.map(function (t) {
        var li = document.createElement('li');
        li.innerHTML = '<span class="box">' + TICK + '</span><span class="txt"></span>';
        $('.txt', li).textContent = t;
        elTasks.appendChild(li);
        return li;
      });
      for (var k = 0; k < lis.length; k++) {
        await pace(260);
        lis[k].classList.add('show');
        await pace(520);
        lis[k].classList.add('done');
      }
      await pace(420);
      elStamp.classList.add('on');
      await pace(3600);
      elTasks.querySelectorAll('li').forEach(function (li) { li.classList.remove('show'); });
      elStamp.classList.remove('on');
      await pace(450);
    };
    (async function loop() {
      var n = 0;
      await pace(900);
      while (running) { await play(jobs[n % jobs.length]); n++; }
    })();
  }

  /* ---- sample checklist ---- */
  var grid = $('#chkGrid');
  if (grid) {
    var boxes = $$('input[type=checkbox]', grid);
    var count = $('#chkCount'), bar = $('#chkBar'), msg = $('#chkMsg'), stamp = $('#chkStamp');
    var update = function () {
      var n = boxes.filter(function (b) { return b.checked; }).length, t = boxes.length;
      count.textContent = n + '/' + t;
      bar.style.width = (n / t * 100) + '%';
      var done = n === t;
      msg.textContent = done ? 'Guest-ready' : (n === 0 ? 'Not guest-ready yet' : (t - n) + ' to go');
      stamp.classList.toggle('on', done);
    };
    boxes.forEach(function (b) { b.addEventListener('change', update); });
    $('#chkAll').addEventListener('click', function () { boxes.forEach(function (b) { b.checked = true; }); update(); });
    $('#chkReset').addEventListener('click', function () { boxes.forEach(function (b) { b.checked = false; }); update(); });
    update();
  }

  /* ---- key cabinet ---- */
  var board = $('#board');
  if (board) {
    var tags = $$('.keytag', board);
    var kin = $('#keyIn'), kout = $('#keyOut'), kmsg = $('#keyMsg');
    var label = function (t) {
      var out = t.getAttribute('aria-pressed') === 'true';
      t.setAttribute('aria-label', 'Key tag ' + t.dataset.code + ', ' + (out ? 'out on a job. Press to return it to the cabinet.' : 'in the cabinet. Press to sign it out.'));
      $('.state', t).textContent = out ? 'Out' : 'In';
    };
    var tally = function () {
      var o = tags.filter(function (t) { return t.getAttribute('aria-pressed') === 'true'; }).length;
      kout.textContent = o; kin.textContent = tags.length - o;
    };
    tags.forEach(function (t) {
      label(t);
      t.addEventListener('click', function () {
        var out = t.getAttribute('aria-pressed') !== 'true';
        t.setAttribute('aria-pressed', out ? 'true' : 'false');
        label(t); tally();
        kmsg.textContent = t.dataset.code + (out ? ' signed out for a job.' : ' back on its hook.');
      });
    });
    tally();
  }

  /* ---- portal mock ticks when it scrolls in ---- */
  var plist = $('#pList');
  if (plist) {
    var items = $$('li', plist), pc = $('#pCount'), ps = $('#pStatus');
    var setP = function (n) {
      items.forEach(function (li, i) { li.classList.toggle('done', i < n); });
      pc.textContent = n + '/' + items.length;
      var fin = n === items.length;
      ps.textContent = fin ? 'Guest-ready' : 'In progress';
    };
    if (reduce || !('IntersectionObserver' in window)) { setP(items.length); }
    else {
      setP(0);
      var started = false;
      new IntersectionObserver(function (e, o) {
        if (e[0].isIntersecting && !started) {
          started = true; o.disconnect();
          var i = 0;
          (function step() { setP(i); if (i < items.length) { i++; setTimeout(step, 650); } })();
        }
      }, { threshold: 0.4 }).observe(plist);
    }
  }
  /* ---- service rows ---- */
  $$('.svc').forEach(function (row) {
    var btn = $('.svc-head', row);
    btn.addEventListener('click', function () {
      var open = row.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* ---- postcode checker ---- */
  var COVER = { BN20: 'Eastbourne', BN21: 'Eastbourne', BN22: 'Eastbourne', BN23: 'Eastbourne', BN24: 'Eastbourne area', TN39: 'Bexhill', TN40: 'Bexhill' };
  var pcForm = $('#pcForm');
  if (pcForm) {
    var pcIn = $('#pcInput'), res = $('#pcResult'), join = $('#joinForm');
    var showResult = function (cls, stampTxt, text) {
      res.className = 'result ' + cls;
      res.innerHTML = '<span class="stamp"></span><p></p>';
      $('.stamp', res).textContent = stampTxt;
      $('p', res).textContent = text;
    };
    pcForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = pcIn.value.toUpperCase().replace(/\s+/g, '');
      var outward = null;
      if (/^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(v)) { outward = v.slice(0, -3); }
      else if (/^[A-Z]{1,2}\d[A-Z\d]?$/.test(v)) { outward = v; }
      join.hidden = true;
      if (!outward) {
        pcIn.setAttribute('aria-invalid', 'true');
        showResult('no', 'Check it', 'That does not look like a UK postcode. Try something like BN21 4AA or TN39.');
        return;
      }
      pcIn.removeAttribute('aria-invalid');
      if (COVER[outward]) {
        var extra = outward === 'BN24' ? 'We will confirm your exact address when you book.' : 'Book a free walk-through or send photos for a quote.';
        showResult('yes', 'Covered', outward + ' (' + COVER[outward] + ') is on our patch. ' + extra);
      } else {
        showResult('no', 'Not yet', outward + ' is outside our patch for now. Join the list and we will tell you when we reach you.');
        join.hidden = false;
      }
    });
    join.addEventListener('submit', function (e) {
      e.preventDefault();
      var em = $('#joinEmail'), m = $('#joinMsg');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value.trim())) {
        em.setAttribute('aria-invalid', 'true');
        m.textContent = 'Enter a valid email address.';
        em.focus();
        return;
      }
      em.removeAttribute('aria-invalid');
      m.textContent = 'You are on the list. (Prototype: nothing was actually sent.)';
      em.value = '';
    });
  }

  /* ---- FAQ: one open at a time ---- */
  var faq = $$('#faqList details');
  faq.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (d.open) { faq.forEach(function (o) { if (o !== d) o.open = false; }); }
    });
  });
})();
