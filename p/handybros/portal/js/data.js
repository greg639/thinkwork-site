/* Sample data. Everything here is invented for the prototype. */
(function () {
  const d = HB.d;
  const NOW = Date.now();
  const min = (m) => NOW - m * 60000;

  /* ---------- owners ---------- */
  const owners = [
    { id: 'o1', name: 'Priya Nair', email: 'priya.nair@example.test', phone: '07700 900101', since: '2025-03-12', limit: 100, props: ['p1', 'p2'] },
    { id: 'o2', name: 'Tom & Elise Hartley', email: 'hartleys@example.test', phone: '07700 900102', since: '2025-06-02', limit: 150, props: ['p3', 'p4'] },
    { id: 'o3', name: 'Marcus Oyelaran', email: 'marcus.o@example.test', phone: '07700 900103', since: '2026-01-19', limit: 80, props: ['p5', 'p6'] }
  ];

  /* ---------- properties ---------- */
  const props = [
    { id: 'p1', ownerId: 'o1', name: 'Flat 3, Marine Court', short: 'Marine Court', street: 'Saltmarsh Parade', town: 'Eastbourne', pc: 'BN21', beds: 2, sleeps: 4, platforms: ['Airbnb', 'Booking.com'], img: 'bedroom-hero.jpg', time: '12:45', dur: 2.25, who: 'Alex', checkin: '15:00', checkout: '10:00',
      ical: { status: 'synced', last: '4 min ago', n: 3 }, keysafe: { code: '4271', where: 'Grey box on the railings, left of the street door', changed: d(-12) },
      access: 'Street door buzzer 3, then lift to the 2nd floor. Flat door is a Yale plus a deadlock (turn twice).', wifi: { ssid: 'MarineCourt-3', pass: 'seagull-blue-48' },
      bin: 'Tuesday general, alternate Fridays recycling. Bins live in the courtyard store.', parking: 'Permit zone. Visitor permit in the kitchen drawer.', notes: 'Hot tap in the kitchen drips slightly. Balcony door sticks in damp weather, lift and push.',
      trend: [91, 93, 92, 95, 94, 96], regNo: '', assets: [['Combi boiler', '6 yrs', 'Warranty to Apr 2027'], ['Fridge freezer', '3 yrs', 'Warranty to Feb 2028'], ['Washer dryer', '4 yrs', 'Warranty ended']] },
    { id: 'p2', ownerId: 'o1', name: '2 Gullwing Row', short: 'Gullwing Row', street: 'Gullwing Row', town: 'Eastbourne', pc: 'BN22', beds: 3, sleeps: 6, platforms: ['Airbnb', 'Vrbo'], img: 'seafront-terraces.jpg', time: '10:15', dur: 2.5, who: 'Alex', checkin: '16:00', checkout: '10:00',
      ical: { status: 'synced', last: '11 min ago', n: 4 }, keysafe: { code: '5530', where: 'Black box behind the bike rack by the side gate', changed: d(-30) },
      access: 'Side gate latch is stiff, lift while pushing. Front door is a multi-point lock: lift the handle, then turn.', wifi: { ssid: 'GullwingRow', pass: 'tide-table-2026' },
      bin: 'Thursday general, Monday recycling.', parking: 'Two spaces on the drive. Guests may use both.', notes: 'Back garden gate latch loose (job booked). Dishwasher needs a salt top-up every other stay.',
      trend: [95, 94, 96, 97, 95, 97], regNo: '', assets: [['System boiler', '9 yrs', 'Out of warranty'], ['Dishwasher', '2 yrs', 'Warranty to Aug 2027'], ['Washing machine', '5 yrs', 'Out of warranty']] },
    { id: 'p3', ownerId: 'o2', name: 'Top Flat, 9 Tidewater Terrace', short: 'Tidewater Terrace', street: 'Tidewater Terrace', town: 'Eastbourne', pc: 'BN21', beds: 1, sleeps: 2, platforms: ['Airbnb'], img: 'flats-dusk.jpg', time: '12:45', dur: 1.5, who: 'Sam', checkin: '17:00', checkout: '11:00',
      ical: { status: 'stale', last: '2 days ago', n: 0 }, keysafe: { code: '1908', where: 'Keysafe on the porch wall, under the number plate', changed: d(-60) },
      access: 'Shared front door, flat is up two flights. Top flat door has a Yale and a chain.', wifi: { ssid: 'Tidewater-Top', pass: 'lantern-hill-33' },
      bin: 'Wednesday. Shared bins at the side of the building.', parking: 'On street, free after 6pm.', notes: 'Hallway smoke alarm chirps on low battery. Bedroom blind cord frays.',
      trend: [88, 90, 89, 91, 90, 92], regNo: '', assets: [['Electric heaters', '7 yrs', 'Out of warranty'], ['Fridge', '5 yrs', 'Out of warranty'], ['Washer dryer', '2 yrs', 'Warranty to Jan 2028']] },
    { id: 'p4', ownerId: 'o2', name: 'The Yellow Door, 17 Samphire Street', short: 'The Yellow Door', street: 'Samphire Street', town: 'Bexhill', pc: 'TN40', beds: 2, sleeps: 4, platforms: ['Airbnb', 'Booking.com', 'Vrbo'], img: 'yellow-door.jpg', time: '15:45', dur: 2, who: 'Alex', checkin: '18:00', checkout: '10:00',
      ical: { status: 'synced', last: '7 min ago', n: 3 }, keysafe: { code: '7716', where: 'Black box inside the porch, left wall', changed: d(-8) },
      access: 'Yellow front door sticks, shoulder it gently. Back door to the yard is bolted from inside.', wifi: { ssid: 'YellowDoor17', pass: 'brass-letterbox-9' },
      bin: 'Friday general, alternate Mondays recycling.', parking: 'Permit zone. Two guest permits in the hall drawer.', notes: 'Hallway walls scuffed (repaint booked). Gas safety record out of date.',
      trend: [93, 92, 94, 93, 95, 94], regNo: '', assets: [['Combi boiler', '11 yrs', 'Out of warranty'], ['Cooker', '8 yrs', 'Out of warranty'], ['Washing machine', '3 yrs', 'Warranty to May 2027']] },
    { id: 'p5', ownerId: 'o3', name: 'Flat 1, Kestrel House', short: 'Kestrel House', street: 'Brinebank Road', town: 'Bexhill', pc: 'TN39', beds: 1, sleeps: 2, platforms: ['Booking.com'], img: 'key-safe-dusk.jpg', time: '11:00', dur: 1.5, who: 'Sam', checkin: '15:00', checkout: '10:00',
      ical: { status: 'synced', last: '2 min ago', n: 3 }, keysafe: { code: '3365', where: 'Wall-mounted safe right of the door, protected by a rubber cover', changed: d(-3) },
      access: 'Ground floor, own front door, no buzzer.', wifi: { ssid: 'Kestrel1', pass: 'harbour-light-70' },
      bin: 'Monday general, Thursday recycling. Wheelie bins by the gate.', parking: 'Free road parking.', notes: 'Key safe cover is stiff, guests sometimes think it is stuck.',
      trend: [90, 91, 93, 92, 94, 93], regNo: '', assets: [['Combi boiler', '4 yrs', 'Warranty to Mar 2028'], ['Fridge freezer', '4 yrs', 'Warranty to Mar 2027'], ['Microwave', '3 yrs', 'Out of warranty']] },
    { id: 'p6', ownerId: 'o3', name: 'The Cabin, 4 Lanternfish Lane', short: 'The Cabin', street: 'Lanternfish Lane', town: 'Bexhill', pc: 'TN40', beds: 2, sleeps: 4, platforms: ['Airbnb', 'Vrbo'], img: 'linen-detail.jpg', time: '13:30', dur: 2, who: 'Sam', checkin: '16:00', checkout: '10:30',
      ical: { status: 'synced', last: '15 min ago', n: 4 }, keysafe: { code: '2204', where: 'Keysafe on the shed wall, round the side of the cabin', changed: d(-21) },
      access: 'Down a gravel path. Cabin door has a thumb latch plus a cylinder lock.', wifi: { ssid: 'TheCabin4', pass: 'pinecone-sleep-12' },
      bin: 'Tuesday general. Compost caddy by the back step.', parking: 'One space at the top of the lane.', notes: 'Wood burner is decorative only. Spare keys held by owner.',
      trend: [92, 94, 93, 95, 96, 95], regNo: '', assets: [['Electric boiler', '5 yrs', 'Warranty to Jun 2027'], ['Dishwasher', '5 yrs', 'Out of warranty'], ['Hot tub pump', '1 yr', 'Warranty to Oct 2027']] }
  ];

  /* ---------- stays (iCal) and turnover events ---------- */
  const hand = { p1: [[-4, 0], [0, 3], [5, 8], [9, 12], [15, 17]], p2: [[-3, 0], [1, 4], [6, 9], [10, 13]], p3: [[-2, 0], [0, 2], [3, 5], [8, 10]], p4: [[-5, 0], [0, 2], [4, 8], [12, 15]], p5: [[-1, 2], [2, 5], [8, 11]], p6: [[-3, -1], [1, 4], [4, 6], [8, 10], [14, 17]] };
  const guests = ['A. Walker', 'S. Moreau', 'R. Patel', 'J. Lindqvist', 'M. Okafor', 'T. Brandt', 'L. Ferreira', 'C. Hughes', 'D. Nakamura', 'E. Rossi', 'K. Adeyemi', 'P. Novak'];
  const stays = []; let gi = 0;
  props.forEach((p, pi) => {
    let seed = 7 + pi * 13; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const list = hand[p.id].map((r) => [r[0], r[1]]);
    let first = list[0][0];
    while (first > -34) { const end = first - Math.floor(rnd() * 3); const len = 2 + Math.floor(rnd() * 4); list.unshift([end - len, end]); first = end - len; }
    let lastEnd = list[list.length - 1][1];
    while (lastEnd < 46) { const st = lastEnd + Math.floor(rnd() * 3) + (rnd() > .7 ? 1 : 0); const len = 2 + Math.floor(rnd() * 4); list.push([st, st + len]); lastEnd = st + len; }
    list.forEach((r, i) => { stays.push({ id: 'st-' + p.id + '-' + i, pid: p.id, start: d(r[0]), end: d(r[1]), platform: p.platforms[(i + pi) % p.platforms.length], guest: guests[gi++ % guests.length], nights: r[1] - r[0] }); });
  });
  const events = [];
  stays.forEach((s, i) => {
    const nxt = stays[i + 1]; if (!nxt || nxt.pid !== s.pid) return;
    const p = props.find((x) => x.id === s.pid);
    events.push({ id: 'tv-' + s.pid + '-' + s.end, type: 'turnover', pid: s.pid, date: s.end, start: p.time, dur: p.dur, who: p.who, title: 'Turnover', auto: true, sameDay: nxt.start === s.end });
  });
  const ev = (id, type, date, start, dur, title, pid, who, extra) => events.push(Object.assign({ id, type, date, start, dur, title, pid: pid || null, who: who || 'Alex', auto: false }, extra || {}));
  ev('e-v1', 'eot', d(12), '09:00', 5, 'End of tenancy clean and check', 'p6', 'Sam');
  ev('e-q0', 'quote', d(0), '09:00', 1, 'Quote visit: bathroom blind', 'p3', 'Alex');
  ev('e-q1', 'quote', d(0), '17:45', 0.75, 'Quote visit: fence panel (public request)', null, 'Alex', { req: 'r7' });
  ev('e-m1', 'maintenance', d(2), '10:00', 1.25, 'Gate latch (booked job)', 'p2', 'Sam', { req: 'r5' });
  ev('e-m2', 'maintenance', d(1), '08:30', 1, 'Engineer visit: boiler service', 'p5', 'Sam');
  ev('e-d1', 'decorating', d(6), '09:00', 8, 'Hallway repaint, day 1', 'p4', 'Alex', { req: 'r2' });
  ev('e-d2', 'decorating', d(7), '09:00', 6, 'Hallway repaint, day 2', 'p4', 'Alex', { req: 'r2' });
  ev('e-p1', 'personal', d(2), '15:00', 1, 'Dentist', null, 'Alex');
  ev('e-p2', 'personal', d(5), '08:00', 10, 'Day off', null, 'Sam');
  ev('e-q2', 'quote', d(3), '11:30', 1, 'Quote visit: lounge repaint', null, 'Alex');
  ev('e-m3', 'maintenance', d(-3), '09:30', 1.5, 'Door re-hang', 'p6', 'Sam');
  ev('e-m4', 'maintenance', d(10), '14:00', 2, 'Extractor fan swap', 'p1', 'Sam');
  ev('e-d3', 'decorating', d(-9), '09:00', 7, 'Bedroom repaint', null, 'Alex');
  ev('e-p3', 'personal', d(12), '09:00', 4, 'Van MOT', null, 'Alex');
  ev('e-q3', 'quote', d(-6), '16:00', 1, 'Quote visit: kitchen units', null, 'Alex');

  /* ---------- inventory and checklist templates ---------- */
  const ITEMS = {
    'Kitchen': [['Dinner plates', 6], ['Side plates', 6], ['Mugs', 6], ['Wine glasses', 6], ['Cutlery sets', 6], ['Saucepans', 3], ['Kettle', 1], ['Toaster', 1], ['Coffee machine', 1]],
    'Living room': [['Sofa cushions', 4], ['Throws', 2], ['TV remote', 1], ['Board games', 3]],
    'Bedroom': [['Pillows', 4], ['Duvet', 1], ['Bed linen sets', 2], ['Bedside lamps', 2]],
    'Bathroom': [['Bath towels', 4], ['Hand towels', 4], ['Bath mat', 1], ['Hairdryer', 1]],
    'Hallway': [['Umbrellas', 2], ['Fire blanket', 1], ['Spare light bulbs', 4]]
  };
  const OVR = {
    p1: { 'Kitchen|Mugs': { qty: 5, last: 6 }, 'Bathroom|Hairdryer': { cond: 'worn', lastCond: 'good' }, 'Living room|Throws': { qty: 1, last: 2 }, 'Bedroom 1|Pillows': { cond: 'worn', lastCond: 'worn' } },
    p2: { 'Kitchen|Wine glasses': { qty: 5, last: 6 }, 'Bedroom 2|Bedside lamps': { cond: 'damaged', lastCond: 'good', note: 'Shade cracked' } },
    p3: { 'Kitchen|Dinner plates': { qty: 3, last: 3 }, 'Living room|TV remote': { qty: 0, last: 1 } },
    p4: { 'Hallway|Umbrellas': { qty: 1, last: 2 }, 'Bathroom|Bath mat': { cond: 'worn', lastCond: 'good' } },
    p5: {}, p6: { 'Kitchen|Saucepans': { qty: 2, last: 3 } }
  };
  const rooms = (beds) => ['Kitchen', 'Living room'].concat(Array.from({ length: beds }, (_, i) => 'Bedroom ' + (i + 1)), ['Bathroom', 'Hallway']);
  const inventory = {};
  props.forEach((p) => {
    let n = 0; inventory[p.id] = rooms(p.beds).map((room) => {
      const key = room.indexOf('Bedroom') === 0 ? 'Bedroom' : room;
      return { room, items: ITEMS[key].map((it) => {
        const scale = ['Kitchen'].includes(key) && /plates|Mugs|glasses|Cutlery/.test(it[0]) ? Math.max(2, Math.round(it[1] * p.sleeps / 6)) : it[1];
        const o = (OVR[p.id] || {})[room + '|' + it[0]] || {};
        const base = { id: p.id + '-i' + (++n), name: it[0], qty: scale, last: scale, cond: 'good', lastCond: 'good', note: '', photo: it[0] === 'Coffee machine' ? 'inventory-kitchen.jpg' : /linen/.test(it[0]) ? 'linen-detail.jpg' : null };
        return Object.assign(base, o, { lastCond: o.lastCond || o.cond || 'good' });
      }) };
    });
  });
  const TASKS = {
    'Arrival': ['Photograph the property as found', 'Open windows and check for damage', 'Note any guest left-behind items'],
    'Kitchen': ['Empty bins and replace liners', 'Clear fridge, wipe shelves', 'Wipe worktops, hob and sink', 'Clean microwave and oven front', 'Run and empty dishwasher', 'Restock tea, coffee pods and washing-up liquid'],
    'Living room': ['Hoover and mop floor', 'Dust surfaces and shelves', 'Plump cushions, fold throws', 'Check TV remote and batteries'],
    'Bedroom': ['Strip bed and bag used linen', 'Make bed with fresh linen set', 'Check under bed and in wardrobe', 'Set out towels and spare pillow'],
    'Bathroom': ['Disinfect toilet, sink and shower', 'Descale taps and shower screen', 'Fresh towels and bath mat', 'Restock toiletries and loo roll'],
    'Safety and finish': ['Test smoke and CO alarms', 'Check key safe and reset code if due', 'Final walk-through and after photo', 'Lock up and check windows']
  };
  const checklist = {};
  props.forEach((p) => {
    const names = ['Arrival', 'Kitchen', 'Living room'].concat(Array.from({ length: p.beds }, (_, i) => 'Bedroom ' + (i + 1)), ['Bathroom', 'Safety and finish']);
    checklist[p.id] = names.map((nm, ri) => ({ id: p.id + '-r' + ri, name: nm, tasks: TASKS[nm.indexOf('Bedroom') === 0 ? 'Bedroom' : nm].map((t, ti) => ({ id: p.id + '-r' + ri + 't' + ti, text: t })) }));
  });
  const todos = {
    p1: [{ id: 'td1', text: 'Leave the balcony door key on the hook', freq: 'every' }, { id: 'td2', text: 'Refill the salt grinder and pepper mill', freq: 'every' }, { id: 'td3', text: 'Tighten the kitchen hot tap and check for drips', freq: 'once' }],
    p2: [{ id: 'td4', text: 'Top up dishwasher salt if the light is on', freq: 'every' }, { id: 'td5', text: 'Sweep the side gate path', freq: 'every' }],
    p3: [{ id: 'td6', text: 'Wind the blind cord back round the cleat', freq: 'every' }, { id: 'td7', text: 'Replace hallway smoke alarm battery', freq: 'once' }],
    p4: [{ id: 'td8', text: 'Put the welcome pack and map on the hall shelf', freq: 'every' }, { id: 'td9', text: 'Check the yard door bolt is across', freq: 'every' }],
    p5: [{ id: 'td10', text: 'Test the key safe code before leaving', freq: 'every' }],
    p6: [{ id: 'td11', text: 'Empty the compost caddy and rinse', freq: 'every' }, { id: 'td12', text: 'Check hot tub cover is latched', freq: 'every' }]
  };

  /* ---------- live runs (today) ---------- */
  const doneUpTo = (pid, n) => { const m = {}; let c = 0; checklist[pid].forEach((r) => r.tasks.forEach((t) => { if (c++ < n) m[t.id] = min(95 - c * 2); })); return m; };
  const allTasks = (pid) => checklist[pid].reduce((a, r) => a + r.tasks.length, 0);
  const run = {
    p2: { started: min(255), finished: min(118), done: doneUpTo('p2', 999), photos: [{ src: 'bedroom-hero.jpg', room: 'Bedroom 1', ts: min(125), sample: true }, { src: 'linen-detail.jpg', room: 'Bedroom 2', ts: min(131), sample: true }], issues: [], counts: {}, todoDone: { td4: true, td5: true } },
    p1: { started: min(92), finished: null, done: doneUpTo('p1', 12), photos: [{ src: 'inventory-kitchen.jpg', room: 'Kitchen', ts: min(61), sample: true }, { src: 'linen-detail.jpg', room: 'Bedroom 1', ts: min(25), sample: true }], issues: [], counts: {}, todoDone: { td1: true } },
    p3: { started: min(95), finished: null, done: doneUpTo('p3', allTasks('p3') - 3), photos: [{ src: 'smoke-alarm-test.jpg', room: 'Hallway', ts: min(30), sample: true }], issues: [{ id: 'is1', room: 'Hallway', note: 'Smoke alarm head fails the button test and chirps. Needs replacing before tonight\'s arrival.', sev: 'Urgent', src: 'smoke-alarm-test.jpg', ts: min(30), sample: true, taskId: 'tk1' }], counts: {}, todoDone: {} },
    p4: { started: null, finished: null, done: {}, photos: [], issues: [], counts: {}, todoDone: {} }
  };
  ['p5', 'p6'].forEach((id) => { run[id] = { started: null, finished: null, done: {}, photos: [], issues: [], counts: {}, todoDone: {} }; });
  const turn = { p2: { status: 'Guest-ready', at: '12:22' }, p1: { status: 'In progress' }, p3: { status: 'Issue' }, p4: { status: 'Checked out' } };

  /* ---------- requests and quotes ---------- */
  const L = (desc, kind, qty, rate) => ({ id: HB.uid('ln'), desc, kind, qty, rate });
  const requests = [
    { id: 'r1', ownerId: 'o1', pid: 'p1', who: 'Priya Nair', title: 'Kitchen hot tap is dripping', desc: 'Hot tap drips overnight even when turned off hard. A guest mentioned it in their review. Under the sink is dry so I think it is the cartridge.', urgency: 'This week', day: d(2), slot: 'AM', photos: ['tap-repair.jpg'], status: 'New', at: min(130), kind: 'maintenance', quote: null },
    { id: 'r2', ownerId: 'o2', pid: 'p4', who: 'Tom & Elise Hartley', title: 'Repaint the hallway after scuffs', desc: 'Suitcases have marked the walls along the hallway. Same sage green as before if you can match it.', urgency: 'Whenever', day: d(6), slot: 'AM', photos: ['painter-sage.jpg'], status: 'Scheduled', at: min(60 * 24 * 6), kind: 'decorating', quote: { lines: [L('Emulsion and sundries (supply)', 'materials', 1, 85), L('Decorator, per day', 'labour', 2, 160)], note: 'Two coats, walls and woodwork touched up. Furniture protected.', sentAt: min(60 * 24 * 5), approvedAt: min(60 * 24 * 4) }, eventIds: ['e-d1', 'e-d2'] },
    { id: 'r3', ownerId: 'o2', pid: 'p3', who: 'Tom & Elise Hartley', title: 'Replace the hallway smoke alarm', desc: 'Raised by Sam during today\'s turnover: the hallway alarm head fails the button test and chirps. Needs replacing before tonight\'s guest.', urgency: 'Urgent', day: d(0), slot: 'PM', photos: ['smoke-alarm-test.jpg'], status: 'Quoted', at: min(28), kind: 'maintenance', quote: { lines: [L('Interlinked smoke alarm head (supply)', 'materials', 1, 34), L('Fit and test (labour)', 'labour', 1, 45), L('Call-out and alarm test record', 'labour', 1, 17)], note: 'Can fit this afternoon before the 17:00 check-in.', sentAt: min(14), approvedAt: null } },
    { id: 'r4', ownerId: 'o1', pid: 'p2', who: 'Priya Nair', title: 'Re-seal the shower screen', desc: 'Sealant along the base of the shower screen has gone black and is lifting. Would like it stripped and redone before the weekend guests.', urgency: 'This week', day: d(3), slot: 'AM', photos: ['toolkit-flatlay.jpg'], status: 'Quoted', at: min(60 * 26), kind: 'maintenance', quote: { lines: [L('Sanitary sealant and cleaner (supply)', 'materials', 1, 22), L('Strip, clean and re-seal, per hour', 'labour', 2, 55), L('Floor protection and disposal', 'materials', 1, 13)], note: 'Sealant needs 24 hours before use, so the bathroom is out of action until the day after.', sentAt: min(60 * 22), approvedAt: null } },
    { id: 'r5', ownerId: 'o1', pid: 'p2', who: 'Priya Nair', title: 'Back garden gate latch loose', desc: 'The latch on the garden gate has come away from the post.', urgency: 'Whenever', day: d(2), slot: 'AM', photos: ['yellow-door.jpg'], status: 'Scheduled', at: min(60 * 24 * 4), kind: 'maintenance', quote: { lines: [L('Gate latch and fixings (supply)', 'materials', 1, 14), L('Fit and adjust (labour)', 'labour', 1, 46)], note: '', sentAt: min(60 * 24 * 3), approvedAt: min(60 * 24 * 3 - 90) }, eventIds: ['e-m1'] },
    { id: 'r6', ownerId: 'o3', pid: 'p6', who: 'Marcus Oyelaran', title: 'Re-hang the bathroom door', desc: 'Door catches on the frame and will not latch.', urgency: 'Whenever', day: d(-3), slot: 'AM', photos: ['toolkit-flatlay.jpg'], status: 'Done', at: min(60 * 24 * 9), kind: 'maintenance', quote: { lines: [L('Hinges and screws (supply)', 'materials', 1, 18), L('Re-hang and plane (labour)', 'labour', 1, 52)], note: '', sentAt: min(60 * 24 * 8), approvedAt: min(60 * 24 * 7) }, eventIds: ['e-m3'] },
    { id: 'r7', ownerId: null, pid: null, who: 'Sample customer, Bexhill TN39', title: 'Wobbly fence panel in back garden', desc: 'One panel has come loose from the posts after the wind. Sent by photo from the quote page.', urgency: 'This week', day: d(0), slot: 'PM', photos: ['toolkit-flatlay.jpg'], status: 'New', at: min(60 * 5), kind: 'maintenance', quote: null, public: true },
    { id: 'r8', ownerId: null, pid: null, who: 'Sample customer, Eastbourne BN22', title: 'Paint a small bedroom', desc: 'Ceiling and walls, white and a soft grey. Furniture can be moved.', urgency: 'Whenever', day: d(9), slot: 'AM', photos: ['painter-sage.jpg'], status: 'Quoted', at: min(60 * 24 * 2), kind: 'decorating', quote: { lines: [L('Paint and sundries (supply)', 'materials', 1, 90), L('Decorator, per day', 'labour', 2, 165)], note: '', sentAt: min(60 * 24), approvedAt: null }, public: true },
    { id: 'r10', ownerId: 'o3', pid: 'p6', who: 'Marcus Oyelaran', title: 'End of tenancy clean and void check, The Cabin', desc: 'Long-stay guest leaves on the 16th. I would like a full end-of-stay clean, a void check and a reinstatement look before the blocked dates.', urgency: 'Whenever', day: d(12), slot: 'AM', photos: [], status: 'New', at: min(60 * 4), kind: 'eot', quote: null },
    { id: 'r9', ownerId: 'o3', pid: 'p5', who: 'Marcus Oyelaran', title: 'Dishwasher door seal is perished', desc: 'Water seeps from the door after a cycle. The rubber seal looks torn at the bottom corner.', urgency: 'This week', day: d(4), slot: 'PM', photos: ['inventory-kitchen.jpg'], status: 'Approved', at: min(60 * 24 * 3), kind: 'maintenance', quote: { lines: [L('Door seal (supply)', 'materials', 1, 28), L('Fit seal and test cycle (labour)', 'labour', 1, 47)], note: '', sentAt: min(60 * 24 * 2), approvedAt: min(60 * 5) } }
  ];

  /* ---------- compliance ---------- */
  const TYPES = {
    gas: { name: 'Gas safety record', icon: 'flame', cycle: 'Every 12 months', months: 12, basis: 'Legal duty', note: 'Generally treated as a legal duty for rented and holiday accommodation. Confirm for your letting type.' },
    eicr: { name: 'Electrical installation condition report (EICR)', icon: 'bolt', cycle: 'Typically every 5 years', months: 60, basis: 'Good practice', note: 'Legal for standard tenancies. For holiday lets it is usually treated as good practice or an insurer requirement. Confirm.' },
    pat: { name: 'PAT testing', icon: 'plug', cycle: 'Annual (commonly advised)', months: 12, basis: 'Good practice', note: 'No fixed legal interval. Annual is common advice for lets with supplied appliances.' },
    alarms: { name: 'Smoke and CO alarm test', icon: 'bell', cycle: 'Each changeover or visit', months: 1, basis: 'Fire-service advice', note: 'Fire services expect working detection in holiday lets. Test at each changeover.' },
    fire: { name: 'Fire risk assessment', icon: 'shield', cycle: 'Review regularly and after changes', months: 12, basis: 'Legal duty', note: 'The Fire Safety Order is generally understood to apply where guests pay to stay. Confirm with the fire service.' },
    legionella: { name: 'Legionella risk assessment', icon: 'droplet', cycle: 'Review periodically and on change', months: 24, basis: 'Legal duty', note: 'A duty to assess exists for landlords. No test certificate is required. Flush unused outlets regularly.' },
    boiler: { name: 'Boiler service', icon: 'wrench', cycle: 'Annual', months: 12, basis: 'Good practice', note: 'Separate from the gas safety check. Driven by the manufacturer warranty and insurer.' },
    epc: { name: 'Energy performance certificate (EPC)', icon: 'file', cycle: 'Valid 10 years', months: 120, basis: 'Legal duty', note: 'Minimum rating applies to rented property. Scope for holiday lets varies, so confirm.' },
    register: { name: 'England short-let registration number', icon: 'file', cycle: 'Register expected by March 2027', months: 12, basis: 'Legal duty', confirm: true, note: 'England is expected to bring in a mandatory short-let register by March 2027. The conditions are not confirmed yet, so check the details when they are published.' },
    ext: { name: 'Fire extinguisher and blanket check', icon: 'extinguisher', cycle: 'Annual check', months: 12, basis: 'Fire-service advice', note: 'Fire-service advice for self-catering. Check interval to be confirmed.' }
  };
  const C = (id, pid, type, last, due, resp, doc) => ({ id, pid, type, last, due, resp, doc: doc || null, booked: null, reminded: null });
  const compliance = [
    C('c1', 'p1', 'gas', d(-318), d(47), 'Owner', { name: 'Gas safety record 2025.pdf', added: d(-318), size: '212 KB' }),
    C('c2', 'p1', 'eicr', d(-540), d(1286), 'Owner', { name: 'EICR 2025.pdf', added: d(-540), size: '1.4 MB' }),
    C('c3', 'p1', 'pat', d(-409), d(-44), 'HandyBros', { name: 'PAT record 2025.pdf', added: d(-409), size: '98 KB' }),
    C('c4', 'p1', 'alarms', d(-7), d(7), 'HandyBros'),
    C('c5', 'p1', 'epc', d(-900), d(2750), 'Owner', { name: 'EPC (rating C).pdf', added: d(-900), size: '320 KB' }),
    C('c6', 'p2', 'gas', d(-200), d(165), 'Owner', { name: 'Gas safety record 2026.pdf', added: d(-200), size: '205 KB' }),
    C('c7', 'p2', 'fire', d(-120), d(245), 'Owner', { name: 'Fire risk assessment.pdf', added: d(-120), size: '880 KB' }),
    C('c8', 'p2', 'boiler', d(-200), d(165), 'HandyBros', { name: 'Boiler service 2026.pdf', added: d(-200), size: '140 KB' }),
    C('c9', 'p2', 'alarms', d(-3), d(11), 'HandyBros'),
    C('c10', 'p3', 'pat', d(-300), d(65), 'HandyBros', { name: 'PAT record 2026.pdf', added: d(-300), size: '90 KB' }),
    C('c11', 'p3', 'legionella', d(-678), d(52), 'Owner', { name: 'Legionella assessment.pdf', added: d(-678), size: '410 KB' }),
    C('c12', 'p3', 'eicr', d(-700), d(1100), 'Owner', { name: 'EICR 2024.pdf', added: d(-700), size: '1.1 MB' }),
    C('c13', 'p3', 'alarms', d(-2), d(0), 'HandyBros'),
    C('c14', 'p4', 'gas', d(-382), d(-17), 'Owner', { name: 'Gas safety record 2025.pdf', added: d(-382), size: '198 KB' }),
    C('c15', 'p4', 'ext', d(-250), d(115), 'HandyBros', { name: 'Extinguisher check.pdf', added: d(-250), size: '64 KB' }),
    C('c16', 'p4', 'boiler', d(-382), d(-17), 'Owner'),
    C('c17', 'p5', 'boiler', d(-351), d(14), 'HandyBros', { name: 'Boiler service 2025.pdf', added: d(-351), size: '131 KB' }),
    C('c18', 'p5', 'gas', d(-351), d(14), 'Owner', { name: 'Gas safety record 2025.pdf', added: d(-351), size: '210 KB' }),
    C('c19', 'p5', 'fire', d(-90), d(275), 'Owner', { name: 'Fire risk assessment.pdf', added: d(-90), size: '760 KB' }),
    C('c20', 'p6', 'ext', d(-385), d(-20), 'HandyBros', { name: 'Extinguisher check.pdf', added: d(-385), size: '60 KB' }),
    C('c21', 'p6', 'eicr', d(-1200), d(626), 'Owner', { name: 'EICR 2023.pdf', added: d(-1200), size: '1.2 MB' }),
    C('c22', 'p6', 'legionella', d(-100), d(630), 'Owner', { name: 'Legionella assessment.pdf', added: d(-100), size: '380 KB' }),
    C('c23', 'p6', 'alarms', d(-4), d(10), 'HandyBros'),
    C('c24', 'p1', 'register', null, '2027-03-31', 'Owner'),
    C('c25', 'p2', 'register', null, '2027-03-31', 'Owner'),
    C('c26', 'p3', 'register', null, '2027-03-31', 'Owner'),
    C('c27', 'p4', 'register', null, '2027-03-31', 'Owner'),
    C('c28', 'p5', 'register', null, '2027-03-31', 'Owner'),
    C('c29', 'p6', 'register', null, '2027-03-31', 'Owner')
  ];

  /* ---------- keys ---------- */
  const keysets = [];
  props.forEach((p, i) => {
    keysets.push({ id: 'k-' + p.id + 'a', pid: p.id, label: 'Set A, guest set', copies: 1, where: 'Key safe', holder: 'In key safe at property', moved: d(-1) });
    keysets.push({ id: 'k-' + p.id + 'b', pid: p.id, label: 'Set B, spare', copies: 2, where: i === 5 ? 'With owner' : i % 3 === 0 ? 'Van' : 'Office', holder: i === 5 ? 'Marcus Oyelaran' : i % 3 === 0 ? 'Alex' : 'Office lockbox', moved: d(-6 - i) });
  });
  keysets.find((k) => k.id === 'k-p4b').where = 'With cleaner'; keysets.find((k) => k.id === 'k-p4b').holder = 'Sam';
  keysets.find((k) => k.id === 'k-p5b').where = 'Van'; keysets.find((k) => k.id === 'k-p5b').holder = 'Sam';
  const keylog = [
    { date: d(0), time: '12:41', keyId: 'k-p1b', action: 'out', by: 'Alex', note: 'Turnover, balcony door key' },
    { date: d(0), time: '09:58', keyId: 'k-p3b', action: 'in', by: 'Sam', note: 'Returned to office lockbox' },
    { date: d(-1), time: '17:20', keyId: 'k-p4b', action: 'out', by: 'Sam', note: 'Pre-arrival check' },
    { date: d(-1), time: '16:02', keyId: 'k-p2a', action: 'in', by: 'Alex', note: 'Back in key safe after turnover' },
    { date: d(-3), time: '11:15', keyId: 'k-p6b', action: 'in', by: 'Marcus Oyelaran', note: 'Owner handed spare back' },
    { date: d(-6), time: '08:50', keyId: 'k-p5b', action: 'out', by: 'Sam', note: 'Key safe code change' }
  ];

  /* ---------- messages, supplies, laundry ---------- */
  const threads = [
    { id: 't1', ownerId: 'o1', pid: 'p1', subject: 'Hot tap in the kitchen', via: 'portal', unreadOp: true, unreadOw: false, msgs: [{ from: 'ow', text: 'Hi both, the hot tap at Marine Court is dripping again. I have sent a photo through the request form. Could one of you take a look before Saturday\'s guests?', at: min(125) }] },
    { id: 't2', ownerId: 'o2', pid: 'p3', subject: 'Smoke alarm at Tidewater Terrace', via: 'portal', unreadOp: false, unreadOw: true, msgs: [{ from: 'hb', text: 'Sam found the hallway alarm failing the button test during today\'s turnover. I have sent you a quote to replace it this afternoon, ahead of tonight\'s check-in.', at: min(15) }] },
    { id: 't3', ownerId: 'o3', pid: 'p6', subject: 'Deep clean around my blocked dates', via: 'portal', unreadOp: true, unreadOw: false, msgs: [{ from: 'ow', text: 'I am blocking 16 to 20 November at The Cabin. Can you do a deep clean and check the hot tub cover while it is empty?', at: min(60 * 3) }, { from: 'hb', text: 'Yes, I can fit that in on the 17th. I will add it to the calendar.', at: min(60 * 2.5) }, { from: 'ow', text: 'Perfect, thank you.', at: min(60 * 2.4) }] },
    { id: 't4', ownerId: 'o3', pid: 'p5', subject: 'Re: Booking.com guest question, Kestrel House', via: 'email', unreadOp: false, unreadOw: false, msgs: [{ from: 'ow', text: 'Forwarded from my email: the guest asks how the key safe works. Can you send them the instructions?', at: min(60 * 22) }, { from: 'hb', text: 'Sent. The cover is stiff, so I have asked them to press firmly and slide it up.', at: min(60 * 21) }] },
    { id: 't5', ownerId: 'o1', pid: 'p2', subject: 'Welcome pack for Vrbo guests', via: 'email', unreadOp: false, unreadOw: false, msgs: [{ from: 'ow', text: 'Could the welcome pack for Gullwing Row include the local bus times as well?', at: min(60 * 52) }, { from: 'hb', text: 'Done, added to the standard pack from the next stay.', at: min(60 * 50) }] }
  ];
  const supplies = [
    { id: 's1', pid: 'p1', item: 'Coffee pods', qty: 4, par: 24, unit: 'pods' }, { id: 's2', pid: 'p1', item: 'Toilet roll', qty: 14, par: 24, unit: 'rolls' }, { id: 's3', pid: 'p1', item: 'Shower gel', qty: 3, par: 8, unit: 'bottles' },
    { id: 's4', pid: 'p2', item: 'Coffee pods', qty: 18, par: 30, unit: 'pods' }, { id: 's5', pid: 'p2', item: 'Dishwasher tablets', qty: 22, par: 40, unit: 'tabs' }, { id: 's6', pid: 'p3', item: 'Toilet roll', qty: 6, par: 12, unit: 'rolls' },
    { id: 's7', pid: 'p3', item: 'Tea bags', qty: 25, par: 80, unit: 'bags' }, { id: 's8', pid: 'p4', item: 'Bin liners', qty: 9, par: 20, unit: 'bags' }, { id: 's9', pid: 'p4', item: 'Hand soap', qty: 2, par: 6, unit: 'bottles' },
    { id: 's10', pid: 'p5', item: 'Coffee pods', qty: 12, par: 16, unit: 'pods' }, { id: 's11', pid: 'p6', item: 'Firelighters', qty: 1, par: 10, unit: 'packs' }, { id: 's12', pid: 'p6', item: 'Toilet roll', qty: 16, par: 24, unit: 'rolls' }
  ];
  const laundry = [
    { id: 'l1', pid: 'p1', set: 'Bed linen set A (double)', status: 'On bed' }, { id: 'l2', pid: 'p1', set: 'Bed linen set B (double)', status: 'At laundry' }, { id: 'l3', pid: 'p1', set: 'Towel bundle (4)', status: 'Dirty' },
    { id: 'l4', pid: 'p2', set: 'Bed linen sets A to C', status: 'On bed' }, { id: 'l5', pid: 'p2', set: 'Spare sets (3)', status: 'Clean' }, { id: 'l6', pid: 'p3', set: 'Bed linen set A (king)', status: 'Dirty' },
    { id: 'l7', pid: 'p3', set: 'Bed linen set B (king)', status: 'Clean' }, { id: 'l8', pid: 'p4', set: 'Bed linen sets A, B', status: 'Dirty' }, { id: 'l9', pid: 'p5', set: 'Bed linen set A', status: 'On bed' }, { id: 'l10', pid: 'p6', set: 'Bed linen sets A, B', status: 'At laundry' }
  ];

  /* ---------- billing ---------- */
  const rates = {
    changeover: { studio: 60, 1: 70, 2: 80, 3: 105, 4: 135, 5: 160 },
    linen: 15, oven: 30, sameDay: 20,
    eot: { 1: 190, 2: 260, 3: 340 },
    hourly: 29.99, callout: 50, half: 110, full: 200, upMin: 25, upMax: 50,
    general: { monthly: 0, callout: 54.99, hourly: 34.99, changeover: 64.99 },
    club: { monthly: 29.99, callout: 29.99, hourly: 29.99, changeover: 59.99, lockout: 29.99, term: 6 }
  };
  const plans = {
    o1: { tier: 'club', enrolled: ['p1', 'p2'], start: '2026-07-01', status: 'active', usage: { lockouts: 1, hours: 1.5, checks: 1 } },
    o2: { tier: 'club', enrolled: ['p3', 'p4'], start: '2026-06-02', status: 'active', usage: { lockouts: 0, hours: 2, checks: 2 } },
    o3: { tier: 'general', enrolled: [], start: null, status: 'active', usage: { lockouts: 0, hours: 0, checks: 1 } }
  };
  const invoices = []; let inv = 1030;
  const extras = { o1: { 3: [['Gate and fence repairs', 120]], 5: [['Extractor fan swap', 85]], 6: [['Turnover supplies top-up', 64]] }, o2: { 2: [['Hallway touch-up paint', 140]], 4: [['Blind cord and fixings', 38]], 6: [['Alarm head and fitting', 96]] }, o3: { 4: [['Door re-hang', 70]], 6: [['Key safe replacement', 52]] } };
  owners.forEach((o) => {
    for (let k = 0; k < 6; k++) {
      const date = '2026-' + String(5 + k).padStart(2, '0') + '-01'; const last = k === 5;
      if (plans[o.id].tier === 'club' && date >= plans[o.id].start.slice(0, 7) + '-01') invoices.push({ id: 'INV-' + (++inv), ownerId: o.id, date, desc: 'Priority Club, ' + HB.plural(plans[o.id].enrolled.length, 'property', 'properties') + ', ' + HB.fmt(date, 'month'), amount: Math.round(plans[o.id].enrolled.length * rates.club.monthly * 100) / 100, status: last && o.id === 'o1' ? 'Due' : k === 4 && o.id === 'o2' ? 'Overdue' : 'Paid', month: k, kind: 'retainer' });
      (extras[o.id][k] || []).forEach((x) => { const dd = '2026-' + String(5 + k).padStart(2, '0') + '-18'; invoices.push({ id: 'INV-' + (++inv), ownerId: o.id, date: dd, desc: x[0], amount: x[1], status: k === 6 ? 'Due' : 'Paid', month: k, kind: 'job' }); });
    }
  });

  /* ---------- history and reports ---------- */
  const H = (o, type, title, detail, rep) => ({ date: d(o), type, title, detail, rep: rep || null });
  const history = {
    p1: [H(-4, 'turnover', 'Turnover complete', 'Guest-ready at 12:10, score 96. One mug missing.', 'rp-p1-a'), H(-12, 'key', 'Key safe code changed', 'New code set after a long stay.'), H(-18, 'inspection', 'Monthly condition check', 'No issues. Balcony door seal noted for next visit.'), H(-23, 'maintenance', 'Hot tap tightened', 'Held for two weeks, now dripping again.'), H(-40, 'compliance', 'PAT record uploaded', 'Valid until 18 Sep 2026.')],
    p2: [H(0, 'turnover', 'Turnover complete', 'Guest-ready at 12:22, score 97.', 'rp-p2-t'), H(-6, 'turnover', 'Turnover complete', 'Guest-ready at 12:40, score 95.', 'rp-p2-a'), H(-14, 'maintenance', 'Dishwasher salt topped up', 'Logged as a recurring to-do.'), H(-30, 'key', 'Key safe code changed', 'Rotated at the end of the summer season.')],
    p3: [H(0, 'issue', 'Smoke alarm failed button test', 'Raised during today\'s turnover. Quote sent to you.'), H(-2, 'turnover', 'Turnover complete', 'Guest-ready at 14:05, score 92.', 'rp-p3-a'), H(-9, 'inspection', 'Condition check', 'Blind cord fraying, to be monitored.'), H(-60, 'key', 'Key safe code changed', 'Set at onboarding.')],
    p4: [H(-5, 'turnover', 'Turnover complete', 'Guest-ready at 15:30, score 94.', 'rp-p4-a'), H(-8, 'key', 'Key safe code changed', 'Changed after a lost-key report.'), H(-6, 'request', 'Hallway repaint approved', 'Booked for 4 and 5 November.'), H(-30, 'compliance', 'Gas safety record expired', 'Reminders sent at 60 and 30 days.')],
    p5: [H(-1, 'turnover', 'Turnover complete', 'Guest-ready at 11:50, score 93.', 'rp-p5-a'), H(-3, 'key', 'Key safe cover replaced', 'Old cover cracked.'), H(-14, 'inspection', 'Condition check', 'No issues.')],
    p6: [H(-3, 'maintenance', 'Bathroom door re-hung', 'Closes and latches cleanly.'), H(-1, 'turnover', 'Turnover complete', 'Guest-ready at 15:20, score 95.', 'rp-p6-a'), H(-21, 'key', 'Key safe code changed', 'Rotated.'), H(-45, 'compliance', 'Legionella assessment uploaded', 'Reviewed and valid.')]
  };
  const repRooms = (pid, issues) => checklist[pid].map((r) => ({ room: r.name, done: r.tasks.length, total: r.tasks.length }));
  const mkRep = (id, pid, off, time, score, issues, diffs) => { const p = props.find((x) => x.id === pid); return { id, pid, date: d(off), time, by: p.who, mins: 80 + Math.round(p.dur * 20), score, sent: true, rooms: repRooms(pid), issues: issues || [], diffs: diffs || [], before: p.img, after: p.img, evidence: [] }; };
  const reports = [
    Object.assign(mkRep('rp-p2-t', 'p2', 0, '12:22', 97), { evidence: ['linen-detail.jpg'] }),
    mkRep('rp-p1-a', 'p1', -4, '12:10', 96, [], [{ room: 'Kitchen', item: 'Mugs', last: 6, now: 5 }]),
    mkRep('rp-p2-a', 'p2', -6, '12:40', 95, [{ title: 'Wine glass chipped', note: 'One glass chipped at the rim and removed. Replacement bought from supplies.', sev: 'Minor', src: 'inventory-kitchen.jpg' }], [{ room: 'Kitchen', item: 'Wine glasses', last: 6, now: 5 }]),
    mkRep('rp-p3-a', 'p3', -2, '14:05', 92, [{ title: 'Blind cord frayed', note: 'Cord is fraying at the cleat. Noted for the next condition check.', sev: 'Minor', src: 'toolkit-flatlay.jpg' }]),
    mkRep('rp-p4-a', 'p4', -5, '15:30', 94, [], [{ room: 'Hallway', item: 'Umbrellas', last: 2, now: 1 }]),
    mkRep('rp-p5-a', 'p5', -1, '11:50', 93),
    mkRep('rp-p6-a', 'p6', -1, '15:20', 95, [], [{ room: 'Kitchen', item: 'Saucepans', last: 3, now: 2 }]),
    mkRep('rp-p1-b', 'p1', -9, '12:30', 94), mkRep('rp-p4-b', 'p4', -11, '15:50', 95), mkRep('rp-p6-b', 'p6', -8, '15:10', 96)
  ];
  reports.forEach((r) => { if (r.id === 'rp-p2-t') r.sent = false; });

  /* ---------- everything together ---------- */
  HB.S = {
    ownerId: 'o1', owners, props, stays, events, inventory, checklist, todos, run, turn, requests, compliance, TYPES, keysets, keylog,
    threads, supplies, laundry, plans, invoices, history, reports,
    docs: [], tasks: [{ id: 'tk1', pid: 'p3', title: 'Replace hallway smoke alarm head', room: 'Hallway', sev: 'Urgent', status: 'open', source: 'runner', at: min(30), req: 'r3' }],
    templates: [{ id: 'tpl1', name: 'Seafront flat, 1-2 bed', items: [{ text: 'Check balcony door and leave key on hook', freq: 'every' }, { text: 'Wipe salt spray from windows and sills', freq: 'every' }, { text: 'Refill diffuser or air freshener', freq: 'every' }] }, { id: 'tpl2', name: 'Family house, 3 bed', items: [{ text: 'Check stair gate and garden gate latch', freq: 'every' }, { text: 'Count kids\' cutlery and cups', freq: 'every' }, { text: 'Sweep path and empty outside bin', freq: 'every' }] }],
    lockout: { status: 'incoming', pid: 'p5', received: '14:18', channel: 'Booking.com message', guest: 'Guest at Flat 1, Kestrel House', note: 'Key safe cover will not slide, guest outside with luggage and a child. Phone battery at 12 percent.', steps: [false, false, false, false, false, false] },
    approvals: {}, notifs: [],
    rates, settings: { theme: 'guest', mode: 'auto', sidebar: 'auto', reminder: { d60: true, d30: true, d7: true, email: true, sms: true }, rules: { lockout: true, issue: true, report: true, quote: true, lowstock: true, ical: false }, stripe: true, gcal: true, mail: true },
    reminderLog: [], messages: []
  };
})();
