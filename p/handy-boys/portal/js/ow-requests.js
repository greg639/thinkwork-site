/* Owner: Request something, My requests, Quotes */
(function () {
  const S = () => HB.S;
  const me = () => HB.curOwner();
  HB.ui.rf = { pid: null, urgency: 'This week', slot: 'AM', photos: [], kind: 'maintenance' };

  HB.reqImg = (r, cls) => r.photos && r.photos.length ? '<img class="' + (cls || '') + '" src="' + HB.src(r.photos[0]) + '" alt="" loading="lazy">' : '<span class="noimg ' + (cls || '') + '">' + HB.icon('camera', 22) + '</span>';

  function myList() {
    const list = HB.myReqs();
    if (!list.length) return HB.empty('camera', 'No requests yet', 'When you send one, you can follow it here from received to done.');
    return '<div class="stack">' + list.map((r) => '<article class="myreq"><div class="mr-img">' + HB.reqImg(r) + '</div><div class="mr-b"><div class="row wrap" style="justify-content:space-between;gap:8px"><h3>' + HB.esc(r.title) + '</h3>' + HB.urgencyChip(r.urgency) + '</div><p class="muted">' + HB.esc(HB.prop(r.pid).short) + ' · sent ' + HB.ago2(r.at) + ' · wanted ' + HB.fmt(r.day, 'day') + ' ' + r.slot + '</p>' + HB.stepsHTML(r) + (r.status === 'Quoted' ? '<div class="row wrap" style="margin-top:12px"><span class="mono">' + HB.money(HB.quoteTotal(r)) + '</span><a class="btn btn-primary btn-sm" href="#/ow/quotes">Review quote</a></div>' : r.status === 'Scheduled' ? '<p class="mr-n">' + HB.icon('calendar', 16) + 'Booked for ' + HB.fmt(r.day, 'long') + '</p>' : '') + '</div></article>').join('') + '</div>';
  }

  HB.view('ow.request', {
    title: () => 'Request something',
    render() {
      const f = HB.ui.rf; const props = HB.ownerProps(S().ownerId); if (!f.pid || !props.find((p) => p.id === f.pid)) f.pid = props[0].id;
      return HB.pageHead('Request something', 'Send a photo, get a price.', 'Tell us what needs doing and add a picture or two. We will send a fixed quote you can approve with one tap.') +
        '<div class="cols"><form class="sheet pad stack-l" data-submit="req-submit" novalidate>' +
        '<fieldset class="fs"><legend>Which property?</legend><div class="seg" role="radiogroup">' + props.map((p) => '<label><input type="radio" name="pid" value="' + p.id + '" data-change="req-pid"' + (f.pid === p.id ? ' checked' : '') + '>' + HB.esc(p.short) + '</label>').join('') + '</div></fieldset>' +
        '<fieldset class="fs"><legend>Type of job</legend><div class="seg" role="radiogroup">' + [['maintenance', 'Repair or handyman'], ['decorating', 'Decorating'], ['eot', 'End of tenancy / void']].map((k) => '<label><input type="radio" name="kind" value="' + k[0] + '" data-change="req-kind"' + (f.kind === k[0] ? ' checked' : '') + '>' + k[1] + '</label>').join('') + '</div></fieldset>' +
        '<label class="fld">What needs doing?<input type="text" name="title" required placeholder="e.g. Bathroom extractor fan is noisy" autocomplete="off"></label>' +
        '<label class="fld">A little detail <small>optional</small><textarea name="desc" rows="3" placeholder="When did it start? Anything we should know about access?"></textarea></label>' +
        '<div><div class="fld" style="margin-bottom:8px"><span>Photos</span></div><label class="drop" data-drop="req-drop" for="req-file">' + HB.icon('upload', 28) + '<span><b>Drop photos here</b> or tap to choose</span><small>JPG or PNG, as many as help</small></label><input id="req-file" type="file" accept="image/*" multiple hidden data-change="req-files">' + (f.photos.length ? '<div class="thumbs" style="margin-top:14px">' + f.photos.map((p, i) => '<div class="t"><img src="' + p.src + '" alt="Attached photo ' + (i + 1) + '"><button type="button" class="rm" data-act="req-rm" data-i="' + i + '" aria-label="Remove photo ' + (i + 1) + '">' + HB.icon('x', 16) + '</button></div>').join('') + '</div>' : '') + '</div>' +
        '<fieldset class="fs"><legend>How urgent?</legend><div class="seg" role="radiogroup">' + ['Whenever', 'This week', 'Urgent'].map((u) => '<label><input type="radio" name="urgency" value="' + u + '" data-change="req-urg"' + (f.urgency === u ? ' checked' : '') + '>' + u + '</label>').join('') + '</div></fieldset>' +
        '<div class="form-grid"><label class="fld">Preferred day<input type="date" name="day" min="' + HB.TODAY + '" value="' + HB.d(3) + '"></label><fieldset class="fs"><legend>Time of day</legend><div class="seg" role="radiogroup">' + [['AM', 'Morning'], ['PM', 'Afternoon']].map((s) => '<label><input type="radio" name="slot" value="' + s[0] + '" data-change="req-slot"' + (f.slot === s[0] ? ' checked' : '') + '>' + s[1] + '</label>').join('') + '</div></fieldset></div>' +
        '<div class="row wrap"><button class="btn btn-primary" type="submit">' + HB.icon('send', 18) + 'Send request</button><span class="muted">We reply with a quote, usually within a working day.</span></div></form>' +
        '<aside><div class="sec-head"><h2>My requests</h2><span class="mono muted">' + HB.myReqs().length + '</span></div>' + myList() + '</aside></div>';
    }
  });
  HB.act('req-pid', (el) => { HB.ui.rf.pid = el.value; });
  HB.act('req-kind', (el) => { HB.ui.rf.kind = el.value; });
  HB.act('req-urg', (el) => { HB.ui.rf.urgency = el.value; });
  HB.act('req-slot', (el) => { HB.ui.rf.slot = el.value; });
  const addFiles = (files) => { const im = HB.images(files); if (!im.length) { HB.toast('Only image files can be attached', { icon: 'alert' }); return; } HB.ui.rf.photos = HB.ui.rf.photos.concat(im); HB.emit(); HB.toast(HB.plural(im.length, 'photo') + ' added', { icon: 'camera' }); };
  HB.act('req-files', (el) => { addFiles(el.files); el.value = ''; });
  HB.act('req-drop', (el, e, files) => addFiles(files));
  HB.act('req-rm', (el) => { HB.ui.rf.photos.splice(Number(el.dataset.i), 1); HB.emit(); });
  HB.act('req-submit', (el) => {
    const f = HB.formData(el); const u = HB.ui.rf;
    if (f.title.trim().length < 3) { HB.toast('Tell us what needs doing', { icon: 'alert' }); HB.$('[name=title]', el).focus(); return; }
    const r = { id: 'r' + (S().requests.length + 1), ownerId: S().ownerId, pid: u.pid, who: me().name, title: f.title.trim(), desc: f.desc.trim() || 'No extra detail given.', urgency: u.urgency, day: f.day || HB.d(3), slot: u.slot, photos: u.photos.map((p) => p.src), status: 'New', at: Date.now(), kind: u.kind, quote: null };
    HB.update((s) => { s.requests.unshift(r); }); u.photos = []; el.reset(); u.urgency = 'This week'; u.slot = 'AM'; u.kind = 'maintenance';
    HB.toast('Request sent. It is in the Handy Boys inbox now.', { icon: 'send' });
  });

  HB.view('ow.quotes', {
    title: () => 'Quotes',
    render() {
      const o = me(); const list = HB.myReqs().filter((r) => r.quote && r.quote.sentAt); const pend = list.filter((r) => r.status === 'Quoted'); const rest = list.filter((r) => r.status !== 'Quoted');
      return HB.pageHead('Quotes', 'Review, then one tap.', 'Every quote is a fixed price with the lines shown. Approve it and it goes straight into the Handy Boys diary.') +
        '<section class="sheet pad limit"><div><b>Your spending limit</b><p class="muted">Anything over this waits for your yes. Smaller jobs go ahead after 24 hours unless you decline.</p></div><div class="stepper" role="group" aria-label="Approval limit"><button data-act="limit" data-d="-10" aria-label="Lower the limit">' + HB.icon('minus', 16) + '</button><output class="num" style="min-width:76px">' + HB.money(o.limit) + '</output><button data-act="limit" data-d="10" aria-label="Raise the limit">' + HB.icon('plus', 16) + '</button></div></section>' +
        '<section class="section"><div class="sec-head"><h2>Awaiting your approval</h2><span class="mono muted">' + pend.length + '</span></div>' + (pend.length ? '<div class="stack">' + pend.map((r) => HB.approveCard(r, true)).join('') + '</div>' : '<div class="sheet">' + HB.empty('check', 'No quotes waiting', 'When Handy Boys send you a price, it lands here and in your messages.', '<a class="btn btn-ghost" href="#/ow/request">Request something</a>') + '</div>') + '</section>' +
        (rest.length ? '<section class="section"><div class="sec-head"><h2>Decided</h2></div><div class="stack">' + rest.map((r) => '<details class="sheet dq"><summary><div><b>' + HB.esc(r.title) + '</b><span class="muted">' + HB.esc(HB.prop(r.pid).short) + (r.quote.approvedAt ? ' · approved ' + HB.ago2(r.quote.approvedAt) : '') + '</span></div><div class="row" style="gap:12px">' + HB.chip(r.status, r.status === 'Declined' ? 'bad' : r.status === 'Done' || r.status === 'Approved' ? 'ok' : 'muted') + '<b class="mono">' + HB.money(HB.quoteTotal(r)) + '</b>' + HB.icon('chev-d', 16) + '</div></summary><ul class="ap-l" style="padding:0 20px 18px">' + r.quote.lines.map((l) => '<li><span>' + HB.esc(l.desc) + '</span><span class="mono">' + HB.money(HB.lineTotal(l)) + '</span></li>').join('') + '</ul></details>').join('') + '</div></section>' : '');
    }
  });
  HB.act('limit', (el) => { HB.update(() => { const o = me(); o.limit = Math.max(0, Math.min(500, o.limit + Number(el.dataset.d))); }); });
})();
