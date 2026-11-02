/* Welcome book data: property defaults, section definitions, and the saved-edits loader.
   The same file is read by the guest page and by the owner editor in the portal. */
(function () {
  var STAY = (window.StayData = {});

  STAY.BASE = 'https://thinkwork.info/p/handybros/stay/';
  STAY.COORDS = { Bexhill: { lat: 50.8426, lon: 0.4687 }, Eastbourne: { lat: 50.7684, lon: 0.2904 } };
  STAY.KEY_PREFIX = 'hb.welcome.';

  /* Fields the owner fills in. path = key inside the saved object. */
  STAY.FIELDS = [
    { path: 'welcome', label: 'Welcome message', type: 'textarea', help: 'A few warm lines in your own voice.' },
    { path: 'wifi.ssid', label: 'Wifi network name', type: 'text' },
    { path: 'wifi.pass', label: 'Wifi password', type: 'text' },
    { path: 'times.checkin', label: 'Check-in from', type: 'time' },
    { path: 'times.checkout', label: 'Check-out by', type: 'time' },
    { path: 'arrival', label: 'Arrival instructions', type: 'textarea', help: 'How guests get in, which door, what to expect.' },
    { path: 'keysafe.where', label: 'Key safe: where it is', type: 'text' },
    { path: 'keysafe.code', label: 'Key safe: code (demo only)', type: 'text', help: 'Demo only. In real use, send the code on the day, not on a printed card.' },
    { path: 'bins', label: 'Bins and recycling days', type: 'textarea' },
    { path: 'parking', label: 'Parking', type: 'textarea' },
    { path: 'rules', label: 'House rules', type: 'textarea', help: 'One rule per line.' },
    { path: 'heating', label: 'Heating and hot water', type: 'textarea' },
    { path: 'appliances', label: 'Appliances', type: 'textarea', help: 'Washing machine, cooker, TV and so on.' },
    { path: 'host.name', label: 'Host name', type: 'text' },
    { path: 'host.phone', label: 'Host phone', type: 'tel' },
    { path: 'handy.phone', label: 'HandyBros call-out phone', type: 'tel', help: 'For lock-outs and repairs.' },
    { path: 'taxis', label: 'Taxis', type: 'textarea', help: 'Firm name and number, one per line.' },
    { path: 'shops', label: 'Your own tips for shops', type: 'textarea', help: 'Optional. The search links stay either way.' },
    { path: 'things', label: 'Your own tips for things to do', type: 'textarea', help: 'Optional. The search links stay either way.' }
  ];

  /* The twelve sections the completeness meter counts. */
  STAY.SECTIONS = [
    { id: 'welcome', label: 'Welcome message', paths: ['welcome'] },
    { id: 'wifi', label: 'Wifi', paths: ['wifi.ssid', 'wifi.pass'], all: true },
    { id: 'times', label: 'Check-in and check-out', paths: ['times.checkin', 'times.checkout'], all: true },
    { id: 'arrival', label: 'Arrival and key safe', paths: ['arrival', 'keysafe.where'] },
    { id: 'bins', label: 'Bins and recycling', paths: ['bins'] },
    { id: 'parking', label: 'Parking', paths: ['parking'] },
    { id: 'rules', label: 'House rules', paths: ['rules'] },
    { id: 'heating', label: 'Heating and appliances', paths: ['heating', 'appliances'] },
    { id: 'contacts', label: 'Who to call', paths: ['host.phone', 'handy.phone'] },
    { id: 'taxis', label: 'Taxis', paths: ['taxis'] },
    { id: 'shops', label: 'Nearby shops', paths: ['shops'] },
    { id: 'things', label: 'Things to do', paths: ['things'] }
  ];

  var P = {
    'yellow-door': {
      pid: 'p4', slug: 'yellow-door', town: 'Bexhill', name: 'The Yellow Door', address: '17 Samphire Street, Bexhill TN40', img: 'yellow-door-stay.jpg',
      welcome: 'Welcome to the Yellow Door. We hope you have a restful stay by the sea. Everything you need for the house is on this page, and the rest is a tap away if you need a hand.',
      wifi: { ssid: 'YellowDoor17', pass: 'brass-letterbox-9' },
      times: { checkin: '18:00', checkout: '10:00' },
      arrival: 'The yellow front door can stick, so give it a gentle shoulder. The back door to the yard is bolted from the inside and stays that way.',
      keysafe: { where: 'Black box inside the porch, on the left wall', code: '7716' },
      bins: 'General waste goes out on Friday. Recycling goes out on alternate Mondays.',
      parking: 'Permit zone. Two guest permits are in the hall drawer.',
      rules: 'No smoking inside the house\nNo parties or events\nPlease keep noise down late in the evening\nPlease leave the bins where you found them',
      heating: 'Heating and hot water come from the combi boiler. The thermostat is in the hall.',
      appliances: 'Cooker and washing machine are in the kitchen.',
      host: { name: '', phone: '' }, handy: { phone: '' },
      taxis: '', shops: '', things: ''
    },
    'marine-court': {
      pid: 'p1', slug: 'marine-court', town: 'Eastbourne', name: 'Flat 3, Marine Court', address: 'Saltmarsh Parade, Eastbourne BN21', img: 'bedroom-hero.jpg',
      wifi: { ssid: 'MarineCourt-3', pass: 'seagull-blue-48' }, times: { checkin: '15:00', checkout: '10:00' },
      arrival: 'Street door buzzer 3, then lift to the 2nd floor. Flat door is a Yale plus a deadlock (turn twice).', keysafe: { where: 'Grey box on the railings, left of the street door', code: '4271' },
      bins: 'Tuesday general, alternate Fridays recycling. Bins live in the courtyard store.', parking: 'Permit zone. Visitor permit in the kitchen drawer.'
    },
    'gullwing-row': {
      pid: 'p2', slug: 'gullwing-row', town: 'Eastbourne', name: '2 Gullwing Row', address: 'Gullwing Row, Eastbourne BN22', img: 'seafront-terraces.jpg',
      wifi: { ssid: 'GullwingRow', pass: 'tide-table-2026' }, times: { checkin: '16:00', checkout: '10:00' },
      arrival: 'Side gate latch is stiff, lift while pushing. Front door is a multi-point lock: lift the handle, then turn.', keysafe: { where: 'Black box behind the bike rack by the side gate', code: '5530' },
      bins: 'Thursday general, Monday recycling.', parking: 'Two spaces on the drive. Guests may use both.'
    },
    'tidewater-terrace': {
      pid: 'p3', slug: 'tidewater-terrace', town: 'Eastbourne', name: 'Top Flat, 9 Tidewater Terrace', address: 'Tidewater Terrace, Eastbourne BN21', img: 'flats-dusk.jpg',
      wifi: { ssid: 'Tidewater-Top', pass: 'lantern-hill-33' }, times: { checkin: '17:00', checkout: '11:00' },
      arrival: 'Shared front door, flat is up two flights. Top flat door has a Yale and a chain.', keysafe: { where: 'Keysafe on the porch wall, under the number plate', code: '1908' },
      bins: 'Wednesday. Shared bins at the side of the building.', parking: 'On street, free after 6pm.'
    },
    'kestrel-house': {
      pid: 'p5', slug: 'kestrel-house', town: 'Bexhill', name: 'Flat 1, Kestrel House', address: 'Brinebank Road, Bexhill TN39', img: 'key-safe-dusk.jpg',
      wifi: { ssid: 'Kestrel1', pass: 'harbour-light-70' }, times: { checkin: '15:00', checkout: '10:00' },
      arrival: 'Ground floor, own front door, no buzzer.', keysafe: { where: 'Wall-mounted safe right of the door, protected by a rubber cover', code: '3365' },
      bins: 'Monday general, Thursday recycling. Wheelie bins by the gate.', parking: 'Free road parking.'
    },
    'the-cabin': {
      pid: 'p6', slug: 'the-cabin', town: 'Bexhill', name: 'The Cabin, 4 Lanternfish Lane', address: 'Lanternfish Lane, Bexhill TN40', img: 'linen-detail.jpg',
      wifi: { ssid: 'TheCabin4', pass: 'pinecone-sleep-12' }, times: { checkin: '16:00', checkout: '10:30' },
      arrival: 'Down a gravel path. Cabin door has a thumb latch plus a cylinder lock.', keysafe: { where: 'Keysafe on the shed wall, round the side of the cabin', code: '2204' },
      bins: 'Tuesday general. Compost caddy by the back step.', parking: 'One space at the top of the lane.'
    }
  };

  /* Fill every field so the shape is always complete. */
  var EMPTY = { town: 'Bexhill', welcome: '', wifi: { ssid: '', pass: '' }, times: { checkin: '', checkout: '' }, arrival: '', keysafe: { where: '', code: '' }, bins: '', parking: '', rules: '', heating: '', appliances: '', host: { name: '', phone: '' }, handy: { phone: '' }, taxis: '', shops: '', things: '' };
  function merge(a, b) {
    var o = {}, k;
    for (k in a) o[k] = (a[k] && typeof a[k] === 'object') ? merge(a[k], {}) : a[k];
    for (k in b || {}) {
      if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k])) o[k] = merge(o[k] && typeof o[k] === 'object' ? o[k] : {}, b[k]);
      else if (b[k] !== undefined && b[k] !== null) o[k] = b[k];
    }
    return o;
  }
  STAY.merge = merge;
  STAY.slugs = Object.keys(P);
  STAY.slugForPid = function (pid) { for (var s in P) if (P[s].pid === pid) return s; return null; };
  STAY.defaults = function (slug) { var d = P[slug] || P['yellow-door']; return merge(merge(EMPTY, { slug: d.slug, name: d.name }), d); };
  STAY.has = function (slug) { return !!P[slug]; };

  /* Saved edits. Every storage access is guarded; the page works without it. */
  STAY.readSaved = function (slug) {
    try { var raw = localStorage.getItem(STAY.KEY_PREFIX + slug); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  };
  STAY.write = function (slug, obj) {
    try { localStorage.setItem(STAY.KEY_PREFIX + slug, JSON.stringify(obj)); return true; } catch (e) { return false; }
  };
  STAY.clear = function (slug) { try { localStorage.removeItem(STAY.KEY_PREFIX + slug); return true; } catch (e) { return false; } };
  STAY.load = function (slug) {
    var base = STAY.defaults(slug), saved = STAY.readSaved(slug);
    return saved && typeof saved === 'object' ? merge(base, saved) : base;
  };

  /* Shared links. The edited guide travels inside the link, in the d= parameter, as
     "v1." plus base64url of compact JSON. Only fields that differ from the sample are sent.
     Anything read from a link is checked field by field before it is used. */
  var SHARE_MAX = 6000, FIELD_MAX = 1500;
  STAY.SHARE_MAX = SHARE_MAX;
  function b64u(str) {
    var bytes = new TextEncoder().encode(str), bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function unb64u(txt) {
    var s = txt.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var bin = atob(s), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  }
  function cleanField(path, v) {
    if (typeof v !== 'string') return null;
    v = v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').replace(/\r\n?/g, '\n');
    if (v.length > FIELD_MAX) v = v.slice(0, FIELD_MAX);
    if (path.indexOf('times.') === 0) return /^([01]\d|2[0-3]):[0-5]\d$/.test(v) || v === '' ? v : null;
    if (/\.phone$/.test(path)) return /^[\d+()\s-]{0,24}$/.test(v) ? v : null;
    return v;
  }
  STAY.cleanShared = function (raw) {
    var out = {}, n = 0;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    STAY.FIELDS.forEach(function (f) {
      if (!Object.prototype.hasOwnProperty.call(raw, f.path)) return;
      var v = cleanField(f.path, raw[f.path]);
      if (v !== null) { STAY.set(out, f.path, v); n++; }
    });
    return n ? out : null;
  };
  /* The link text for a guide: '' when it matches the sample exactly. */
  STAY.encodeShare = function (slug, obj) {
    var base = STAY.defaults(slug), diff = {}, n = 0;
    STAY.FIELDS.forEach(function (f) {
      var v = STAY.get(obj, f.path), b = STAY.get(base, f.path);
      v = v == null ? '' : String(v);
      if (v !== String(b == null ? '' : b)) { diff[f.path] = v; n++; }
    });
    return n ? 'v1.' + b64u(JSON.stringify(diff)) : '';
  };
  /* Returns the cleaned partial object, or null for anything that is not a good link. */
  STAY.decodeShare = function (txt) {
    try {
      if (typeof txt !== 'string' || txt.length < 4 || txt.length > 20000 || txt.indexOf('v1.') !== 0) return null;
      var body = txt.slice(3);
      if (!/^[A-Za-z0-9_-]+$/.test(body)) return null;
      return STAY.cleanShared(JSON.parse(unb64u(body)));
    } catch (e) { return null; }
  };
  /* Link first, then this browser's saved edits, then the sample. */
  STAY.loadFor = function (slug, search) {
    var token = null;
    try { token = new URLSearchParams(search || '').get('d'); } catch (e) { token = null; }
    if (token) {
      var shared = STAY.decodeShare(token);
      if (shared) return { data: merge(STAY.defaults(slug), shared), source: 'link' };
    }
    var saved = STAY.readSaved(slug);
    return { data: STAY.load(slug), source: saved && typeof saved === 'object' ? 'saved' : 'sample' };
  };

  STAY.get = function (obj, path) {
    var v = obj, p = path.split('.');
    for (var i = 0; i < p.length; i++) { if (v == null) return ''; v = v[p[i]]; }
    return v == null ? '' : v;
  };
  STAY.set = function (obj, path, val) {
    var p = path.split('.'), v = obj;
    for (var i = 0; i < p.length - 1; i++) { if (!v[p[i]] || typeof v[p[i]] !== 'object') v[p[i]] = {}; v = v[p[i]]; }
    v[p[p.length - 1]] = val;
  };
  STAY.filled = function (obj, sec) {
    var vals = sec.paths.map(function (p) { return String(STAY.get(obj, p)).trim() !== ''; });
    return sec.all ? vals.every(Boolean) : vals.some(Boolean);
  };
  STAY.completeness = function (obj) {
    var rows = STAY.SECTIONS.map(function (s) { return { id: s.id, label: s.label, ok: STAY.filled(obj, s) }; });
    return { n: rows.filter(function (r) { return r.ok; }).length, total: rows.length, rows: rows };
  };
  STAY.url = function (slug) { return STAY.BASE + '?p=' + slug; };

  /* Eat and drink: exactly these, in this order. */
  STAY.EAT = {
    takeaway: [
      { id: 'shiplu', name: 'Shiplu Tandoori', cuisine: 'Indian', street: 'London Road' },
      { id: 'golden-harvest', name: 'The Golden Harvest', cuisine: 'Chinese', street: 'Western Road' },
      { id: 'anatolia', name: 'Anatolia Grill', cuisine: 'Turkish', street: 'London Road' }
    ],
    sitdown: [
      { id: 'shiplu', name: 'Shiplu Tandoori', cuisine: 'Indian', street: 'London Road' },
      { id: 'reids', name: 'Reids Fish & Chips', cuisine: 'Fish and chips', street: 'Western Road' },
      { id: 'relais', name: 'Relais Cooden Beach', cuisine: '', street: 'Cooden Drive' },
      { id: 'piceno', name: 'Trattoria Piceno', cuisine: 'Italian', street: 'Sackville Road' }
    ]
  };
  STAY.mapsUrl = function (q) { return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q); };
  STAY.directions = function (r) { return STAY.mapsUrl(r.name + ' ' + r.street + ' Bexhill'); };
})();
