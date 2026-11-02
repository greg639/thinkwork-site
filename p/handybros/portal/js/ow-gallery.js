/* Owner: staging gallery, newest photo of each room after every clean or inspection */
(function () {
  const S = () => HB.S; const F = HB.field;
  HB.ui.gal = { pid: 'all' };
  const img = (x) => (x.indexOf('blob:') === 0 || x.indexOf('data:') === 0 ? x : HB.photo(x));

  function propBlock(p) {
    const rows = F.latest(p.id); const pins = rows.filter((r) => r.photo && r.photo.state === 'pinned').length;
    const st = HB.propState(p.id);
    return '<section class="gal-prop"><div class="sec-head"><div><h2>' + HB.esc(p.short) + '</h2><p class="muted" style="font-size:13.5px">' + HB.esc(p.town + ' ' + p.pc) + ' · latest set, ' + HB.esc(st.label.toLowerCase()) + '</p></div>' + (pins ? '<span class="pst pin">' + HB.icon('pinned', 12) + pins + ' pinned</span>' : '') + '</div>' +
      '<div class="gal-grid">' + rows.map((r) => {
        const ph = r.photo;
        if (!ph) return '<div class="gal-card none"><div class="gal-img">' + HB.icon('camera', 26) + '</div><div class="gal-b"><b>' + HB.esc(r.room) + '</b><span class="muted">No photo yet</span></div></div>';
        const inc = ph.incidentId && F.inc(ph.incidentId);
        return '<button class="gal-card' + (ph.state === 'pinned' ? ' pinned' : '') + '" data-act="gal-open" data-id="' + ph.id + '" aria-label="Open the ' + HB.esc(r.room) + ' photo, ' + HB.fmt(ph.d, 'short') + '"><span class="gal-img"><img src="' + img(ph.src) + '" alt="' + HB.esc(r.room) + ', ' + HB.fmt(ph.d, 'short') + (ph.sample ? ', sample picture' : '') + '" loading="lazy">' + (ph.state === 'pinned' ? '<span class="gal-pin">' + HB.icon('pinned', 13) + 'Pinned' + (inc && inc.sent ? ' · ' + HB.esc(inc.id) : '') + '</span>' : '') + '</span><span class="gal-b"><b>' + HB.esc(r.room) + '</b><span class="mono">' + HB.fmt(ph.d, 'day') + ' · ' + ph.t + '</span></span></button>';
      }).join('') + '</div></section>';
  }
  HB.view('ow.gallery', {
    title: () => 'Photo gallery',
    render() {
      const props = HB.ownerProps(S().ownerId); const f = HB.ui.gal.pid; const show = props.filter((p) => f === 'all' || p.id === f);
      const pinnedAll = F.st().photos.filter((p) => p.state === 'pinned' && props.some((x) => x.id === p.pid));
      return HB.pageHead('Photo gallery', 'How each room looked when we left.', 'One photo of every room, taken at the end of each clean or inspection, with the date. This is your staging record: the home as it was handed to the next guest.') +
        '<div class="seg" style="margin-bottom:26px" role="group" aria-label="Property"><button data-act="gal-f" data-p="all" aria-pressed="' + (f === 'all') + '">All</button>' + props.map((p) => '<button data-act="gal-f" data-p="' + p.id + '" aria-pressed="' + (f === p.id) + '">' + HB.esc(p.short) + '</button>').join('') + '</div>' +
        '<div class="stack-l">' + show.map(propBlock).join('') + '</div>' +
        '<aside class="note-banner" style="margin-top:30px">' + HB.icon('store', 20) + '<div><b>Why only one photo per room?</b> At each visit the new photo replaces the last one so storage stays small. If anything is reported, the before and after photos are pinned to the incident and kept permanently. ' + (pinnedAll.length ? 'You currently have ' + pinnedAll.length + ' pinned ' + (pinnedAll.length === 1 ? 'photo' : 'photos') + ', flagged above.' : 'You have no pinned photos at the moment.') + ' <a href="#/ow/incidents" style="text-decoration:underline">See incidents</a></div></aside>';
    }
  });
  HB.act('gal-f', (el) => { HB.ui.gal.pid = el.dataset.p; HB.emit(); });
  HB.act('gal-open', (el) => {
    const p = F.photo(el.dataset.id); const inc = p.incidentId && F.inc(p.incidentId);
    HB.modal({ title: p.room + ', ' + HB.prop(p.pid).short, sub: HB.fmt(p.d, 'long') + ' at ' + p.t + (p.sample ? ' · sample picture' : ''), wide: true, hideFooter: true,
      body: '<img class="gal-big" src="' + img(p.src) + '" alt="' + HB.esc(p.room) + ' at ' + HB.esc(HB.prop(p.pid).short) + '"><div class="row wrap" style="gap:10px;margin-top:14px">' + F.badge(p) + '<span class="muted mono">' + F.mb(p.kb) + ' MB</span>' + (inc && inc.sent ? '<a class="btn btn-ghost btn-sm" href="#/ow/incidents/' + inc.id + '" data-close>Open incident ' + HB.esc(inc.id) + '</a>' : '') + '</div>' });
  });
})();
