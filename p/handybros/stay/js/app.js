/* Guest welcome guide. Renders from StayData plus any saved edits. */
(function () {
  var D = window.StayData;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  var params = new URLSearchParams(location.search);
  var slug = params.get('p') || 'yellow-door';
  if (!D.has(slug)) slug = 'yellow-door';
  var loaded = D.loadFor(slug, location.search);
  var d = loaded.data;
  var isBexhill = d.town === 'Bexhill';
  var geo = D.COORDS[d.town] || D.COORDS.Bexhill;

  /* ---------- icons ---------- */
  var IC = {
    wifi: '<path d="M3.5 9.3a12.5 12.5 0 0 1 17 0M6.5 12.5a8.2 8.2 0 0 1 11 0M9.4 15.6a4 4 0 0 1 5.2 0"/><circle cx="12" cy="18.6" r=".7"/>',
    key: '<circle cx="8" cy="15.5" r="4"/><path d="m11 12.5 8.5-8.5M16 7.5l2.2 2.2M13.8 9.7l1.8 1.8"/>',
    bin: '<path d="M4.5 7h15M9 7V4.5h6V7M6.5 7l.8 12.5h9.4L17.5 7M10 11v5.5M14 11v5.5"/>',
    car: '<path d="M5 16.5V12l1.8-4.5h10.4L19 12v4.5M4 16.5h16M7.5 19.5v-3M16.5 19.5v-3"/><circle cx="8" cy="13" r=".8"/><circle cx="16" cy="13" r=".8"/>',
    list: '<path d="M8.5 6.5H19M8.5 12H19M8.5 17.5H19"/><circle cx="4.8" cy="6.5" r=".9"/><circle cx="4.8" cy="12" r=".9"/><circle cx="4.8" cy="17.5" r=".9"/>',
    flame: '<path d="M12 3.5c1 3.2 5 5.200 5 10a5 5 0 0 1-10 0c0-2 1-3.200 2-4.200.200 1.400.900 2.100 1.600 2.400C10.200 8.500 10.800 6 12 3.500z"/>',
    phone: '<path d="M6.500 3.500h3l1.500 4-2 1.300a11 11 0 0 0 5.200 5.200l1.300-2 4 1.500v3a2 2 0 0 1-2 2A14.500 14.500 0 0 1 4.500 5.500a2 2 0 0 1 2-2z"/>',
    bag: '<path d="M5.500 8h13l-1 11.500h-11zM9 8V6.500a3 3 0 0 1 6 0V8"/>',
    compass: '<circle cx="12" cy="12" r="8.500"/><path d="m15.500 8.500-2 5-5 2 2-5z"/>',
    fork: '<path d="M7 3.500v6.500a2 2 0 0 0 2 2v8.500M5 3.500V9M9 3.500V9M16.500 20.500V3.500c-2 1.500-3 4-3 6.500h3"/>',
    pin: '<path d="M12 21s-6.500-5.300-6.500-10.200a6.500 6.500 0 0 1 13 0C18.500 15.700 12 21 12 21z"/><circle cx="12" cy="10.800" r="2.300"/>',
    out: '<path d="M9 5.500H6.500a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2H9M14 8l4 4-4 4M18 12H9.500"/>',
    arrow: '<path d="M7 17 17 7M9 7h8v8"/>',
    check: '<path d="m5 12.500 4.500 4.500L19 7.500"/>',
    x: '<path d="m6 6 12 12M18 6 6 18"/>',
    camera: '<path d="M4 8.500h3l1.600-2.300h6.800L17 8.500h3v11H4z"/><circle cx="12" cy="13.500" r="3.500"/>',
    alert: '<path d="M12 4 21.500 20h-19z"/><path d="M12 10v4.500M12 17.300v.2"/>',
    info: '<circle cx="12" cy="12" r="8.500"/><path d="M12 11v5M12 8v.2"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.600 5.600 7 7M17 17l1.400 1.400M5.600 18.400 7 17M17 7l1.400-1.400"/>',
    part: '<circle cx="8.500" cy="8.500" r="3"/><path d="M8.500 2.800v.9M2.800 8.500h.9M4.500 4.500l.6.6M12.500 4.500l-.6.6"/><path d="M8 19h9a3.500 3.500 0 0 0 .5-6.950A5 5 0 0 0 8 13.500 2.750 2.750 0 0 0 8 19z"/>',
    cloud: '<path d="M7 18.500h10a4 4 0 0 0 .6-7.950A5.500 5.500 0 0 0 7 12a3.250 3.250 0 0 0 0 6.500z"/>',
    rain: '<path d="M7 15h10a3.700 3.700 0 0 0 .5-7.350A5.200 5.200 0 0 0 7.300 9 3.200 3.200 0 0 0 7 15z"/><path d="M8.500 18l-1 2.200M12.500 18l-1 2.200M16.500 18l-1 2.200"/>',
    snow: '<path d="M7 14h10a3.700 3.700 0 0 0 .5-7.350A5.200 5.200 0 0 0 7.300 8 3.200 3.200 0 0 0 7 14z"/><path d="M8.500 17.500v.2M12 19v.2M15.500 17.500v.2M10.200 20.500v.2M13.800 20.500v.2"/>',
    storm: '<path d="M7 14h10a3.700 3.700 0 0 0 .5-7.350A5.200 5.200 0 0 0 7.300 8 3.200 3.200 0 0 0 7 14z"/><path d="m12.500 14-2 3.500h3L11.500 21"/>',
    fog: '<path d="M7 12h10a3.700 3.700 0 0 0 .5-7.350A5.200 5.200 0 0 0 7.300 6 3.200 3.200 0 0 0 7 12zM5 15.500h14M7.500 19h9"/>'
  };
  function ico(n, s) { return '<svg width="' + (s || 22) + '" height="' + (s || 22) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IC[n] || '') + '</svg>'; }

  /* ---------- helpers ---------- */
  function paras(t) { return String(t).split(/\n+/).map(function (x) { return x.trim(); }).filter(Boolean); }
  function pHtml(t) { return paras(t).map(function (x) { return '<p>' + esc(x) + '</p>'; }).join(''); }
  function todo(t) { return '<span class="todo">[' + esc(t) + ']</span>'; }
  function has(v) { return String(v == null ? '' : v).trim() !== ''; }
  function telHref(n) { return 'tel:' + String(n).replace(/[^\d+]/g, ''); }
  function maps(q) { return D.mapsUrl(q); }
  function place() { return d.town || 'Bexhill'; }
  function pcd() { var m = /\b([A-Z]{1,2}\d{1,2}[A-Z]?)\s*$/.exec(d.address || ''); return m ? m[1] : ''; }
  function area() { return place() + (pcd() ? ' ' + pcd() : ''); }
  var toastT;
  function toast(msg) { var t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('on'); }, 2200); }
  function row(icon, title, inner) { return '<div class="card row"><span class="ico">' + ico(icon, 22) + '</span><div><h3>' + esc(title) + '</h3>' + inner + '</div></div>'; }
  function head(n, title, id) { return '<div class="sec-h"><span class="n">' + n + '</span><h2 id="' + id + '-h">' + esc(title) + '</h2></div>'; }

  /* ---------- sections ---------- */
  function secQuick() {
    var w = d.wifi || {}, t = d.times || {};
    var wifi = '<div class="card wifi" id="wifi" role="group" aria-label="Wifi"><div class="wifi-h">' + ico('wifi', 18) + 'Wifi</div>';
    if (has(w.ssid) || has(w.pass)) {
      if (has(w.ssid)) wifi += '<button class="copy" data-copy="' + esc(w.ssid) + '" data-what="Network name" type="button" aria-label="Copy network name ' + esc(w.ssid) + '"><span><span class="k">Network</span><span class="v">' + esc(w.ssid) + '</span></span><span class="act">Copy</span></button>';
      if (has(w.pass)) wifi += '<button class="copy" data-copy="' + esc(w.pass) + '" data-what="Password" type="button" aria-label="Copy wifi password"><span><span class="k">Password</span><span class="v">' + esc(w.pass) + '</span></span><span class="act">Copy</span></button>';
    } else wifi += '<p style="padding:8px 0 16px">' + todo('wifi details to be added') + '</p>';
    wifi += '</div>';
    var times = '<div class="times"><div class="card time"><span class="k">Check in from</span><span class="v">' + (has(t.checkin) ? esc(t.checkin) : '--:--') + '</span></div><div class="card time"><span class="k">Check out by</span><span class="v">' + (has(t.checkout) ? esc(t.checkout) : '--:--') + '</span></div></div>';
    return '<div class="quick">' + wifi + times + '</div>';
  }

  function secArrival() {
    var inner = '';
    if (has(d.arrival)) inner += pHtml(d.arrival); else inner += '<p>' + todo('arrival instructions to be added') + '</p>';
    var ks = d.keysafe || {};
    var keyBlock = '';
    if (has(ks.where)) {
      keyBlock = '<p><b>Key safe:</b> ' + esc(ks.where) + '.</p>';
      if (has(ks.code)) keyBlock += '<div class="code"><button type="button" class="btn btn-sm" data-reveal aria-expanded="false" aria-controls="ks-code">Show key safe code</button><span class="codebox" id="ks-code" hidden>' + esc(ks.code) + '</span></div><p class="muted" style="font-size:13px;margin-top:8px">Demo code for a sample property. A real host sends the code on the day.</p>';
    }
    return '<section class="sec" id="arrival" aria-labelledby="arrival-h">' + head('01', 'Arriving', 'arrival') +
      '<div class="info">' + row('key', 'Getting in', inner + keyBlock) + '</div></section>';
  }

  function secHouse() {
    var rules = paras(d.rules || '');
    var heat = '';
    if (has(d.heating)) heat += pHtml(d.heating);
    if (has(d.appliances)) heat += pHtml(d.appliances);
    if (!heat) heat = '<p>' + todo('heating and appliances to be added') + '</p>';
    return '<section class="sec" id="house" aria-labelledby="house-h">' + head('02', 'The house', 'house') + '<div class="info">' +
      row('bin', 'Bins and recycling', has(d.bins) ? pHtml(d.bins) : '<p>' + todo('bin days to be added') + '</p>') +
      row('car', 'Parking', has(d.parking) ? pHtml(d.parking) : '<p>' + todo('parking to be added') + '</p>') +
      row('flame', 'Heating and appliances', heat) +
      row('list', 'House rules', rules.length ? '<ul class="rules">' + rules.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul>' : '<p>' + todo('house rules to be added') + '</p>') +
      '</div></section>';
  }

  function secWeather() {
    return '<section class="sec" id="weather" aria-labelledby="weather-h">' + head('03', 'Weather in ' + place(), 'weather') +
      '<div class="card wx" id="wx" aria-live="polite"><div class="wx-msg" aria-busy="true"><div class="skel" style="width:40%"></div><div class="skel"></div><div class="skel" style="width:75%"></div></div></div></section>';
  }

  function placeCard(r, i, ctx) {
    var cuisine = has(r.cuisine) ? esc(r.cuisine) : todo('cuisine');
    var live = r.id === 'shiplu';
    var acts = '';
    if (live) {
      var bookP = ctx === 'sitdown', orderP = ctx === 'takeaway';
      acts += '<button type="button" class="btn btn-sm ' + (bookP ? 'btn-door' : '') + '" data-book="' + r.id + '">Book a table</button>';
      acts += '<button type="button" class="btn btn-sm ' + (orderP ? 'btn-door' : '') + '" data-order="' + r.id + '">Order takeaway</button>';
    } else {
      acts += '<span class="todo">[Book / order link: to be added]</span>';
    }
    acts += '<a class="link" href="' + esc(D.directions(r)) + '" target="_blank" rel="noopener">' + ico('pin', 18) + 'Directions<span class="sr"> to ' + esc(r.name) + ' (opens in a new tab)</span></a>';
    return '<li class="card place" data-place="' + esc(r.id) + '" data-name="' + esc(r.name) + '"><div class="place-top"><span class="rank" aria-hidden="true">' + (i + 1) + '</span><div><h4>' + esc(r.name) + '</h4><p class="meta">' + cuisine + ' · ' + esc(r.street) + ', Bexhill</p></div></div><div class="acts">' + acts + '</div></li>';
  }
  function secEat() {
    if (!isBexhill) return '';
    return '<section class="sec" id="eat" aria-labelledby="eat-h">' + head('04', 'Eat and drink', 'eat') +
      '<p class="sec-lede">Some places in Bexhill to eat. Book or order from here, or get directions.</p>' +
      '<div class="sub" id="eat-take-h">Takeaway and delivery</div><ol class="places" id="list-takeaway" aria-labelledby="eat-take-h">' + D.EAT.takeaway.map(function (r, i) { return placeCard(r, i, 'takeaway'); }).join('') + '</ol>' +
      '<div class="sub" id="eat-sit-h">Sit-down</div><ol class="places" id="list-sitdown" aria-labelledby="eat-sit-h">' + D.EAT.sitdown.map(function (r, i) { return placeCard(r, i, 'sitdown'); }).join('') + '</ol>' +
      '<p class="partners">Local partners may be shown here.</p></section>';
  }

  function secNearby() {
    var a = area();
    function lk(label, q) { return '<a href="' + esc(maps(q)) + '" target="_blank" rel="noopener"><span>' + esc(label) + '</span>' + ico('arrow', 18) + '<span class="sr">(opens in a new tab)</span></a>'; }
    function glk(label, q) { return '<a href="https://www.google.com/search?q=' + encodeURIComponent(q) + '" target="_blank" rel="noopener"><span>' + esc(label) + '</span>' + ico('arrow', 18) + '<span class="sr">(opens in a new tab)</span></a>'; }
    var taxi = has(d.taxis)
      ? '<ul>' + paras(d.taxis).map(function (l) { var m = /(\+?\d[\d\s]{6,})/.exec(l); return '<li style="padding:2px 0">' + (m ? '<a href="' + telHref(m[1]) + '" style="color:var(--link);font-weight:600">' + esc(l) + '</a>' : esc(l)) + '</li>'; }).join('') + '</ul>'
      : '<p>' + todo('taxi firm and number to be added') + '</p>';
    return '<section class="sec" id="nearby" aria-labelledby="nearby-h">' + head(isBexhill ? '05' : '04', 'Nearby', 'nearby') +
      '<div class="sub" style="margin-top:0">Shops</div><div class="links">' +
      lk('Supermarkets near ' + a, 'supermarket near ' + a) + lk('Convenience stores near ' + a, 'convenience store near ' + a) + lk('Pharmacies near ' + a, 'pharmacy near ' + a) + '</div>' +
      (has(d.shops) ? '<div class="tips card pad"><b>From your host</b>' + pHtml(d.shops) + '</div>' : '') +
      '<div class="sub">Taxis</div><div class="card pad">' + taxi + '</div>' +
      '<div class="sub">Things to do</div><div class="links">' +
      glk('Things to do in ' + place(), 'things to do in ' + place()) + lk('Walks near ' + a, 'walks near ' + a) + lk('Cafes near ' + a, 'cafe near ' + a) + '</div>' +
      (has(d.things) ? '<div class="tips card pad"><b>From your host</b>' + pHtml(d.things) + '</div>' : '') +
      '</section>';
  }

  function secHelp() {
    var h = d.host || {}, y = d.handy || {};
    function who(name, sub, num, ph) {
      return '<li><div class="w">' + esc(name) + '<span>' + esc(sub) + '</span>' + (has(num) ? '' : '<span style="margin-top:6px">' + todo(ph) + '</span>') + '</div>' + (has(num) ? '<a class="callbtn" href="' + telHref(num) + '">' + ico('phone', 16) + esc(num) + '</a>' : '') + '</li>';
    }
    function em(name, sub, num, cls) { return '<li><div class="w">' + esc(name) + '<span>' + esc(sub) + '</span></div><a class="callbtn ' + (cls || '') + '" href="' + telHref(num) + '">' + ico('phone', 16) + esc(num) + '</a></li>'; }
    var n = isBexhill ? '06' : '05';
    return '<section class="sec" id="help" aria-labelledby="help-h">' + head(n, 'Help', 'help') +
      '<div class="sub" style="margin-top:0">Who to call</div><ul class="card calls">' +
      who(has(h.name) ? h.name : 'Your host', 'Questions about the stay', h.phone, 'host phone to be added') +
      who('HandyBros call-out', 'Locked out, or something broken', y.phone, 'call-out phone to be added') + '</ul>' +
      '<div class="sub">In an emergency</div><ul class="card calls">' +
      em('Police, fire, ambulance', 'Emergency', '999', 'em') + em('NHS 111', 'Urgent medical advice that is not an emergency', '111') +
      em('Gas emergency', 'National Gas Emergency Service', '0800 111 999') + em('Power cut', 'Report a power cut', '105') + '</ul>' +
      '<div class="sub" id="report">Report a problem</div>' +
      '<div class="card pad" id="report-card">' + reportForm() + '</div></section>';
  }

  function reportForm() {
    return '<form class="form" id="report-form" novalidate>' +
      '<label class="fld">What is it about?<select name="cat" required aria-describedby="e-cat"><option value="">Choose one</option><option>Wifi or TV</option><option>Heating or hot water</option><option>An appliance</option><option>Keys or getting in</option><option>Cleanliness</option><option>Something broken</option><option>Something else</option></select><span class="err" id="e-cat" role="alert"></span></label>' +
      '<label class="fld">Tell us what is wrong<textarea name="msg" required aria-describedby="e-msg" placeholder="A line or two is plenty"></textarea><span class="err" id="e-msg" role="alert"></span></label>' +
      '<div class="fld"><span>Photo <small>(optional)</small></span><div class="photo-row"><label class="btn btn-sm">' + ico('camera', 18) + 'Add a photo<input type="file" accept="image/*" id="photo-in"></label><div id="photo-prev"></div></div></div>' +
      '<label class="fld">Your name <small>(optional)</small><input type="text" name="who" autocomplete="name"></label>' +
      '<button class="btn btn-ink btn-block" type="submit">Send report</button>' +
      '<p class="demo-note">' + ico('info', 18) + '<span>Demo only: nothing is sent anywhere.</span></p></form>';
  }

  /* ---------- build page ---------- */
  var NAV = [['wifi', 'Wifi'], ['arrival', 'Arriving'], ['house', 'The house'], ['weather', 'Weather']];
  if (isBexhill) NAV.push(['eat', 'Eat and drink']);
  NAV.push(['nearby', 'Nearby'], ['help', 'Help']);

  function build() {
    document.title = d.name + ' · welcome guide · demo for HandyBros';
    $('#prop-name').textContent = d.name;
    $('#prop-addr').textContent = d.address || '';
    var img = $('#hero-img');
    img.alt = 'The front of ' + d.name + ', placeholder photo';
    img.onerror = function () { img.style.display = 'none'; };
    img.src = '../assets/img/' + (D.defaults(slug).img || 'yellow-door.jpg');
    $('#chips').innerHTML = NAV.map(function (n) { return '<a href="#' + n[0] + '">' + esc(n[1]) + '</a>'; }).join('');
    var welcome = has(d.welcome) ? '<p class="welcome" id="welcome">' + esc(d.welcome) + '</p>' : '<p class="welcome" id="welcome">' + todo('welcome message to be added') + '</p>';
    $('#guide').innerHTML = welcome + secQuick() + secArrival() + secHouse() + secWeather() + secEat() + secNearby() + secHelp();
  }

  /* ---------- weather ---------- */
  var WX = {
    0: ['Clear sky', 'sun'], 1: ['Mainly clear', 'sun'], 2: ['Partly cloudy', 'part'], 3: ['Overcast', 'cloud'], 45: ['Fog', 'fog'], 48: ['Freezing fog', 'fog'],
    51: ['Light drizzle', 'rain'], 53: ['Drizzle', 'rain'], 55: ['Heavy drizzle', 'rain'], 56: ['Freezing drizzle', 'rain'], 57: ['Freezing drizzle', 'rain'],
    61: ['Light rain', 'rain'], 63: ['Rain', 'rain'], 65: ['Heavy rain', 'rain'], 66: ['Freezing rain', 'rain'], 67: ['Freezing rain', 'rain'],
    71: ['Light snow', 'snow'], 73: ['Snow', 'snow'], 75: ['Heavy snow', 'snow'], 77: ['Snow grains', 'snow'],
    80: ['Light showers', 'rain'], 81: ['Showers', 'rain'], 82: ['Heavy showers', 'rain'], 85: ['Snow showers', 'snow'], 86: ['Snow showers', 'snow'],
    95: ['Thunderstorm', 'storm'], 96: ['Thunderstorm and hail', 'storm'], 99: ['Thunderstorm and hail', 'storm']
  };
  function wxOf(c) { return WX[c] || ['Mixed weather', 'cloud']; }
  function num(v) { return typeof v === 'number' && isFinite(v) ? Math.round(v) : null; }
  function deg(v) { var n = num(v); return n == null ? '--' : n + '°'; }
  var WKEY = 'hb.welcome.weather.' + slug;
  function dayName(iso, i) {
    if (i === 0) return 'Today'; if (i === 1) return 'Tomorrow';
    var p = iso.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString('en-GB', { weekday: 'short' });
  }
  function renderWx(data, stale) {
    var el = $('#wx'); var dl = data.daily; if (!dl || !dl.time || !dl.time.length) throw new Error('shape');
    var cur = data.current || {}; var c0 = wxOf(cur.weather_code != null ? cur.weather_code : dl.weather_code[0]);
    var now = num(cur.temperature_2m);
    var html = '<div class="wx-now">' + '<span style="color:var(--link)">' + ico(c0[1], 44) + '</span><div><div class="big">' + (now == null ? deg(dl.temperature_2m_max[0]) : now + '<small>°C</small>') + '</div><div class="t">' + esc(c0[0]) + '</div><div class="d">' + (now == null ? 'High today' : 'Right now') + ' in ' + esc(place()) + '</div></div></div><ul class="wx-list">';
    for (var i = 0; i < dl.time.length && i < 5; i++) {
      var w = wxOf(dl.weather_code[i]); var rn = num(dl.precipitation_probability_max && dl.precipitation_probability_max[i]);
      html += '<li><span class="dy">' + esc(dayName(dl.time[i], i)) + '</span><span style="color:var(--link)">' + ico(w[1], 24) + '</span><span class="ds">' + esc(w[0]) + '</span><span class="tm">' + deg(dl.temperature_2m_max[i]) + ' / ' + deg(dl.temperature_2m_min[i]) + '<span class="rn">' + (rn == null ? 'rain --' : 'rain ' + rn + '%') + '</span></span></li>';
    }
    html += '</ul><p class="wx-foot">' + (stale ? 'Offline. Showing the forecast saved on ' + esc(stale) + '. ' : '') + 'Forecast from Open-Meteo. High / low in degrees C, with the chance of rain.</p>';
    el.innerHTML = html;
  }
  function wxFail() {
    var el = $('#wx');
    el.innerHTML = '<div class="wx-msg"><p><b>The forecast is not available right now.</b></p><p class="muted">It needs an internet connection. Everything else in this guide still works. Try again when you are back online.</p><div><button class="btn btn-sm" type="button" data-wx-retry>Try again</button></div></div>';
  }
  function loadWx() {
    var el = $('#wx');
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + geo.lat + '&longitude=' + geo.lon + '&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Europe%2FLondon&forecast_days=5';
    var ctl = ('AbortController' in window) ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 9000);
    fetch(url, ctl ? { signal: ctl.signal } : {}).then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); }).then(function (j) {
      clearTimeout(timer);
      renderWx(j, null);
      try { localStorage.setItem(WKEY, JSON.stringify({ at: new Date().toISOString(), data: j })); } catch (e) { /* storage unavailable */ }
    }).catch(function () {
      clearTimeout(timer);
      var saved = null;
      try { saved = JSON.parse(localStorage.getItem(WKEY) || 'null'); } catch (e) { saved = null; }
      if (saved && saved.data) {
        try { renderWx(saved.data, new Date(saved.at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })); return; } catch (e) { /* fall through */ }
      }
      wxFail();
    });
    el.setAttribute('aria-busy', 'true');
  }

  /* ---------- sheet ---------- */
  var lastFocus = null;
  function openSheet(html) {
    lastFocus = document.activeElement;
    $('#sheet-body').innerHTML = html;
    $('#sheet-root').hidden = false; document.body.classList.add('locked');
    var s = $('#sheet'); s.scrollTop = 0;
    var f = $('input:not([type=hidden]),select,textarea', s) || $('.sheet-x', s);
    if (f) f.focus({ preventScroll: true });
  }
  function closeSheet() {
    $('#sheet-root').hidden = true; document.body.classList.remove('locked'); $('#sheet-body').innerHTML = '';
    if (lastFocus && lastFocus.focus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }
  function xbtn() { return '<button class="sheet-x" type="button" data-close aria-label="Close">' + ico('x', 22) + '</button>'; }
  function restaurant(id) { var all = D.EAT.takeaway.concat(D.EAT.sitdown); for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i]; return null; }

  function localToday() { var n = new Date(); return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0'); }
  function bookingForm(r) {
    var opts = ''; for (var i = 1; i <= 12; i++) opts += '<option value="' + i + '"' + (i === 2 ? ' selected' : '') + '>' + i + (i === 1 ? ' person' : ' people') + '</option>';
    return xbtn() + '<h2 id="sheet-title">Book a table at ' + esc(r.name) + '</h2><p class="sh-sub">' + esc(r.cuisine) + ' · ' + esc(r.street) + ', Bexhill</p>' +
      '<p class="demo-note" style="margin-bottom:16px">' + ico('info', 18) + '<span>Demo only: nothing is sent to the restaurant.</span></p>' +
      '<form class="form" id="book-form" novalidate data-rid="' + esc(r.id) + '"><div class="fgrid">' +
      '<label class="fld">Date<input type="date" name="date" min="' + localToday() + '" required aria-describedby="b-date"><span class="err" id="b-date" role="alert"></span></label>' +
      '<label class="fld">Time<input type="time" name="time" required aria-describedby="b-time"><span class="err" id="b-time" role="alert"></span></label></div>' +
      '<label class="fld">Party size<select name="size">' + opts + '</select></label>' +
      '<label class="fld">Name<input type="text" name="name" autocomplete="name" required aria-describedby="b-name"><span class="err" id="b-name" role="alert"></span></label>' +
      '<label class="fld">Phone<input type="tel" name="phone" autocomplete="tel" inputmode="tel" required aria-describedby="b-phone"><span class="err" id="b-phone" role="alert"></span></label>' +
      '<button class="btn btn-door btn-block" type="submit">Request this table</button></form>';
  }
  function bookingDone(r, v) {
    var when = new Date(v.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    return xbtn() + '<div class="done-h"><span class="tick">' + ico('check', 24) + '</span><h2 id="sheet-title">Table request summary</h2></div>' +
      '<p class="demo-note" style="margin:16px 0">' + ico('info', 18) + '<span><b>Demo only.</b> Nothing has been sent to ' + esc(r.name) + '. In a live version this would go to the restaurant.</span></p>' +
      '<dl class="sum" id="book-sum"><div><dt>Restaurant</dt><dd>' + esc(r.name) + '</dd></div><div><dt>Date</dt><dd>' + esc(when) + '</dd></div><div><dt>Time</dt><dd>' + esc(v.time) + '</dd></div><div><dt>Party</dt><dd>' + esc(v.size) + (v.size === '1' ? ' person' : ' people') + '</dd></div><div><dt>Name</dt><dd>' + esc(v.name) + '</dd></div><div><dt>Phone</dt><dd>' + esc(v.phone) + '</dd></div></dl>' +
      '<div style="display:grid;gap:10px;margin-top:18px"><button class="btn btn-ink btn-block" type="button" data-close>Done</button><a class="btn btn-block" href="' + esc(D.directions(r)) + '" target="_blank" rel="noopener">Directions<span class="sr"> (opens in a new tab)</span></a></div>';
  }
  function orderStub(r) {
    return xbtn() + '<h2 id="sheet-title">Order takeaway from ' + esc(r.name) + '</h2><p class="sh-sub">' + esc(r.cuisine) + ' · ' + esc(r.street) + ', Bexhill</p>' +
      '<div class="card pad" style="display:grid;gap:12px"><p>The restaurant\'s ordering link goes here.</p><p>' + todo('ordering link') + '</p></div>' +
      '<p class="demo-note" style="margin-top:16px">' + ico('info', 18) + '<span>Demo only: no menu or prices are shown and nothing can be ordered.</span></p>' +
      '<div style="margin-top:18px"><button class="btn btn-ink btn-block" type="button" data-close>Close</button></div>';
  }

  /* ---------- events ---------- */
  function setErr(form, name, id, msg) {
    var f = form.elements[name]; var e = $('#' + id); if (e) e.textContent = msg || '';
    if (f) { if (msg) f.setAttribute('aria-invalid', 'true'); else f.removeAttribute('aria-invalid'); }
    return !msg;
  }
  function copyText(t, what, btn) {
    function ok() { toast(what + ' copied'); if (btn) { btn.classList.add('done'); var a = $('.act', btn); if (a) a.textContent = 'Copied'; setTimeout(function () { btn.classList.remove('done'); if (a) a.textContent = 'Copy'; }, 1600); } }
    function fallback() {
      try { var ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); var done = document.execCommand('copy'); ta.remove(); if (done) ok(); else toast('Press and hold to copy: ' + t); } catch (e) { toast('Press and hold to copy: ' + t); }
    }
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(t).then(ok, fallback); return; } } catch (e) { /* use fallback */ }
    fallback();
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    var c = t.closest('[data-copy]'); if (c) { copyText(c.getAttribute('data-copy'), c.getAttribute('data-what') || 'Text', c); return; }
    var rv = t.closest('[data-reveal]'); if (rv) { var box = $('#ks-code'); var show = box.hidden; box.hidden = !show; rv.setAttribute('aria-expanded', String(show)); rv.textContent = show ? 'Hide key safe code' : 'Show key safe code'; return; }
    if (t.closest('[data-wx-retry]')) { $('#wx').innerHTML = '<div class="wx-msg" aria-busy="true"><div class="skel" style="width:40%"></div><div class="skel"></div></div>'; loadWx(); return; }
    var b = t.closest('[data-book]'); if (b) { var r = restaurant(b.getAttribute('data-book')); if (r) openSheet(bookingForm(r)); return; }
    var o = t.closest('[data-order]'); if (o) { var r2 = restaurant(o.getAttribute('data-order')); if (r2) openSheet(orderStub(r2)); return; }
    if (t.closest('[data-close]')) { closeSheet(); return; }
    var rm = t.closest('[data-photo-rm]'); if (rm) { photoClear(); return; }
    var again = t.closest('[data-report-again]'); if (again) { $('#report-card').innerHTML = reportForm(); return; }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !$('#sheet-root').hidden) { closeSheet(); return; }
    if (e.key === 'Tab' && !$('#sheet-root').hidden) {
      var f = $$('button:not([disabled]),input,select,textarea,a[href]', $('#sheet')).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return; var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (f.id === 'book-form') {
      e.preventDefault();
      var r = restaurant(f.getAttribute('data-rid')); var v = { date: f.date.value, time: f.time.value, size: f.size.value, name: f.name.value.trim(), phone: f.phone.value.trim() };
      var ok = true;
      ok = setErr(f, 'date', 'b-date', !v.date ? 'Choose a date.' : v.date < localToday() ? 'Choose today or a later date.' : '') && ok;
      ok = setErr(f, 'time', 'b-time', !v.time ? 'Choose a time.' : '') && ok;
      ok = setErr(f, 'name', 'b-name', !v.name ? 'Add a name for the booking.' : '') && ok;
      ok = setErr(f, 'phone', 'b-phone', v.phone.replace(/\D/g, '').length < 7 ? 'Add a phone number the restaurant could call.' : '') && ok;
      if (!ok) { var bad = $('[aria-invalid="true"]', f); if (bad) bad.focus(); return; }
      $('#sheet-body').innerHTML = bookingDone(r, v); $('#sheet').scrollTop = 0; $('#sheet').focus();
    } else if (f.id === 'report-form') {
      e.preventDefault();
      var ok2 = true;
      ok2 = setErr(f, 'cat', 'e-cat', !f.cat.value ? 'Choose what it is about.' : '') && ok2;
      ok2 = setErr(f, 'msg', 'e-msg', !f.msg.value.trim() ? 'Tell us a little about the problem.' : '') && ok2;
      if (!ok2) { var bad2 = $('[aria-invalid="true"]', f); if (bad2) bad2.focus(); return; }
      var hasPhoto = !!photoUrl; var cat = f.cat.value; var who = f.who.value.trim();
      $('#report-card').innerHTML = '<div class="done-h"><span class="tick">' + ico('check', 24) + '</span><h3 style="font-family:var(--serif);font-weight:500;font-size:24px" tabindex="-1" id="rep-done">Report ready</h3></div>' +
        '<p class="demo-note" style="margin:14px 0">' + ico('info', 18) + '<span><b>Demo only.</b> Nothing has been sent. A live version would reach your host and HandyBros.</span></p>' +
        '<dl class="sum"><div><dt>About</dt><dd>' + esc(cat) + '</dd></div><div><dt>Details</dt><dd>' + esc(f.msg.value.trim()) + '</dd></div><div><dt>Photo</dt><dd>' + (hasPhoto ? 'Attached' : 'None') + '</dd></div>' + (who ? '<div><dt>Name</dt><dd>' + esc(who) + '</dd></div>' : '') + '</dl>' +
        '<div style="margin-top:16px"><button class="btn btn-sm" type="button" data-report-again>Report another problem</button></div>';
      photoClear(true); var h = $('#rep-done'); if (h) h.focus();
    }
  });
  document.addEventListener('input', function (e) {
    var t = e.target; if (t.getAttribute && t.getAttribute('aria-invalid') === 'true' && String(t.value).trim()) { t.removeAttribute('aria-invalid'); var m = t.getAttribute('aria-describedby'); if (m && $('#' + m)) $('#' + m).textContent = ''; }
  });

  var photoUrl = null;
  function photoClear(quiet) {
    if (photoUrl) { try { URL.revokeObjectURL(photoUrl); } catch (e) { /* ignore */ } photoUrl = null; }
    var p = $('#photo-prev'); if (p) p.innerHTML = ''; var i = $('#photo-in'); if (i) i.value = '';
  }
  document.addEventListener('change', function (e) {
    if (e.target.id !== 'photo-in') return;
    var f = e.target.files && e.target.files[0]; if (!f || !/^image\//.test(f.type)) { photoClear(); return; }
    if (photoUrl) { try { URL.revokeObjectURL(photoUrl); } catch (er) { /* ignore */ } }
    photoUrl = URL.createObjectURL(f);
    $('#photo-prev').innerHTML = '<div class="thumb"><img src="' + photoUrl + '" alt="Your photo, not yet sent"><button type="button" data-photo-rm aria-label="Remove photo">' + ico('x', 16) + '</button></div>';
  });

  /* active chip while scrolling */
  function watchSections() {
    if (!('IntersectionObserver' in window)) return;
    var links = $$('#chips a'); var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute('aria-current'); });
        var a = map[en.target.id]; if (a) { a.setAttribute('aria-current', 'true'); var bar = $('#chips'); var l = a.offsetLeft - 16; if (bar.scrollTo) bar.scrollTo({ left: l, behavior: 'smooth' }); }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  build();
  if (loaded.source === 'link') { var fe = $('#foot-edit'); if (fe) fe.textContent = 'Your host keeps this guide up to date. You are viewing the details they shared in this link.'; }
  loadWx();
  watchSections();
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    try { navigator.serviceWorker.register('sw.js').catch(function () { /* offline cache is optional */ }); } catch (e) { /* ignore */ }
  }
})();
