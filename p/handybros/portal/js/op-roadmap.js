/* Operator: phased roadmap. No prices. */
(function () {
  const CSS_ID = 'stay-admin-css';
  if (!document.getElementById(CSS_ID)) { const l = document.createElement('link'); l.id = CSS_ID; l.rel = 'stylesheet'; l.href = 'css/stay-admin.css'; document.head.appendChild(l); }

  const IN = 'Included in prototype', LATER = 'Later';
  const PHASES = [
    { n: 1, name: 'First build', goal: 'Run a turnover end to end and show the owner everything that happened.', state: IN, feats: [
      { i: 'quote', t: 'Quotes with a deposit', d: 'Walk the property, build the quote, take a deposit to confirm the booking.', to: '/op/walkthrough' },
      { i: 'list', t: 'Custom checklists', d: 'A checklist per property, with how often each task happens and whether it is included or an extra.', to: '/op/checklists' },
      { i: 'clock', t: 'Crew check-in and check-out', d: 'The crew log in and out of every visit from their phone.', to: '/runner' },
      { i: 'camera', t: 'Photos', d: 'Room-by-room photos taken as the work is ticked off.', to: '/op/reports' },
      { i: 'alert', t: 'Incident reports', d: 'Each incident saved as a PDF. Smart retention keeps the photos that matter and clears the rest.', to: '/op/incidents' },
      { i: 'eye', t: 'Staging gallery', d: 'The finished property, shown to the owner in their portal.', to: '/ow/gallery' },
      { i: 'user', t: 'Owner portal', d: 'Checklists, notes, photos, reports and invoices in one place for the owner.', to: '/ow/overview' },
      { i: 'wifi', t: 'Basic digital concierge', d: 'A QR welcome guide for guests, filled in by the owner. The report-a-problem form is a demo for now.', to: '/ow/welcome' }
    ] },
    { n: 2, name: 'Smarter properties', goal: 'The system notices what is wearing out or running low, and turns it into work.', state: LATER, feats: [
      { i: 'plug', t: 'Smart asset tracker', d: 'Kettle, toaster, TV and the rest, tracked per property. When one fails: an auto-quote at cost plus margin, or a fix-me-now one-off job.' },
      { i: 'box', t: 'Consumables stock bars', d: 'Stock shown as bars per property, with restock at cost plus margin when a bar runs low.' },
      { i: 'gauge', t: 'Maintenance predictor', d: 'Predicts what will need attention and generates the off-season jobs for you.' },
      { i: 'plus', t: 'Add-ons', d: 'Linen, window cleaning and jet-washing, offered on any visit.' },
      { i: 'share', t: 'Referral scheme', d: 'A simple way for owners to recommend you to other hosts.', todo: 'reward to be decided' }
    ] },
    { n: 3, name: 'Guest to invoice', goal: 'Close the loop from the guest\'s phone through to the job and the invoice.', state: LATER, feats: [
      { i: 'phone', t: 'Concierge upgrade', d: 'Guests report a problem with a photo, and it reaches the owner and the crew.' },
      { i: 'bolt', t: 'Stock requests and auto-dispatch', d: 'Requests inside the owner\'s spend limit are dispatched without waiting for approval.' },
      { i: 'star', t: 'Feedback scores', d: 'Guests score the stay. Scores roll up per property and per visit.' },
      { i: 'card', t: 'Full guest-to-invoice flow', d: 'One thread from the guest\'s report to the job, the crew visit and the invoice.' }
    ] },
    { n: 4, name: 'Local network', goal: 'Let the guide and the portal connect to the rest of the town.', state: LATER, feats: [
      { i: 'pin', t: 'Local-partner bookings', d: 'Restaurants and local services bookable from the guide, with commission shared with owners. The Eat and drink section of the demo guide is a preview.' },
      { i: 'link', t: 'Deeper integrations', d: 'Connections to the calendars, accounts and messaging you already use, scoped when the time comes.' }
    ] }
  ];

  function feat(f, st) {
    const inn = st === IN;
    return '<article class="rm-f ' + (inn ? 'in' : 'later') + '"><span class="ic-b">' + HB.icon(f.i, 22) + '</span><div><h3>' + HB.esc(f.t) + '</h3><p>' + HB.esc(f.d) + (f.todo ? ' <span class="todo">[' + HB.esc(f.todo) + ']</span>' : '') + '</p></div>' +
      '<div class="foot">' + HB.chip(inn ? IN : LATER, inn ? 'ok' : 'muted') + (f.to ? '<a href="#' + f.to + '">Open it' + HB.icon('chev-r', 14) + '</a>' : '') + '</div></article>';
  }

  HB.view('op.roadmap', {
    title: () => 'Roadmap',
    render() {
      const sum = '<nav class="rm-sum" aria-label="Phases">' + PHASES.map((p) => '<a href="#/op/roadmap" data-act="rm-jump" data-to="rm-p' + p.n + '"' + (p.n === 1 ? ' class="now"' : '') + '><span class="n">Phase ' + p.n + '</span><b>' + HB.esc(p.name) + '</b><span class="c">' + HB.plural(p.feats.length, 'feature') + ' · ' + (p.state === IN ? 'in this prototype' : 'later') + '</span></a>').join('') + '</nav>';
      const ph = PHASES.map((p) => '<section class="rm-phase ' + (p.n === 1 ? 'now' : '') + '" id="rm-p' + p.n + '" aria-labelledby="rm-h' + p.n + '"><div class="rm-id"><span class="no" aria-hidden="true">0' + p.n + '</span><div><div class="eyebrow">Phase ' + p.n + '</div><h2 id="rm-h' + p.n + '" style="margin-top:8px">' + HB.esc(p.name) + '</h2></div><div>' + HB.chip(p.state === IN ? 'In this prototype' : 'Later', p.state === IN ? 'ok' : 'muted') + '<p style="margin-top:10px">' + HB.esc(p.goal) + '</p></div></div><div class="rm-feats">' + p.feats.map((f) => feat(f, p.state)).join('') + '</div></section>').join('');
      return HB.pageHead('Roadmap', 'What is built, and what comes next.', 'Four phases. Phase 1 is what you are clicking through now. The order is a proposal for you to confirm, and nothing on this page carries a price.', '<span class="todo">[owner to confirm phase order]</span>') + sum + ph;
    }
  });
  HB.act('rm-jump', (el) => { const t = document.getElementById(el.dataset.to); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
})();
