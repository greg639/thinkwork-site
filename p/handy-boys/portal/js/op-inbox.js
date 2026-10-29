/* Operator: Inbox, supplies and laundry */
(function () {
  const S = () => HB.S;
  HB.ui.inbox = { sel: 't1' };
  const LSTAT = ['Dirty', 'At laundry', 'Clean', 'On bed'];
  const low = (s) => s.qty <= Math.ceil(s.par * .35);
  const msgAgo = (ts) => HB.ago(Math.max(0, Math.round((Date.now() - ts) / 60000)));
  HB.msgAgo = msgAgo;

  HB.thread = (t, mine) => '<div class="conv" role="log" aria-label="Conversation">' + t.msgs.map((m) => '<div class="bub ' + (m.from === mine ? 'me' : 'them') + '"><p>' + HB.esc(m.text) + '</p><span class="mono">' + (m.from === 'hb' ? 'Handy Boys' : HB.esc(HB.owner(t.ownerId).name.split(' ')[0])) + ' · ' + msgAgo(m.at) + '</span></div>').join('') + '</div>';

  function messages() {
    const sel = S().threads.find((t) => t.id === HB.ui.inbox.sel) || S().threads[0];
    const list = S().threads.slice().sort((a, b) => b.msgs[b.msgs.length - 1].at - a.msgs[a.msgs.length - 1].at);
    return '<div class="split"><ul class="tlist" aria-label="Conversations">' + list.map((t) => { const l = t.msgs[t.msgs.length - 1]; return '<li><button class="trow' + (t.id === sel.id ? ' on' : '') + '" data-act="thread-sel" data-id="' + t.id + '">' + (t.unreadOp ? '<i class="ud" aria-label="Unread"></i>' : '') + '<span class="avatar sm">' + HB.esc(HB.initials(HB.owner(t.ownerId).name)) + '</span><span class="tr-b"><b>' + HB.esc(t.subject) + '</b><span class="muted">' + HB.esc(l.text.slice(0, 70)) + (l.text.length > 70 ? '…' : '') + '</span></span><span class="mono muted">' + msgAgo(l.at).replace(' ago', '') + '</span></button></li>'; }).join('') + '</ul>' +
      '<section class="pane"><header><div><h2>' + HB.esc(sel.subject) + '</h2><p class="muted">' + HB.esc(HB.owner(sel.ownerId).name) + ' · ' + HB.esc(HB.prop(sel.pid).short) + '</p></div>' + (sel.via === 'email' ? HB.chip('Email thread', 'info', 'mail') : HB.chip('Portal', 'muted')) + '</header>' + HB.thread(sel, 'hb') +
      '<form class="composer" data-submit="thread-send" data-id="' + sel.id + '"><label class="sr" for="rep">Reply</label><textarea id="rep" name="t" rows="2" placeholder="Reply to ' + HB.esc(HB.owner(sel.ownerId).name.split(' ')[0]) + '"></textarea><button class="btn btn-primary" type="submit">' + HB.icon('send', 18) + 'Send</button></form>' + (sel.via === 'email' ? '<p class="footnote" style="padding:0 20px 16px">Replies go to the thread here and to ' + HB.esc(HB.owner(sel.ownerId).email) + ' by email.</p>' : '') + '</section></div>';
  }
  function supplies() {
    const L = S().supplies.filter(low);
    return '<div class="row wrap" style="justify-content:space-between;margin-bottom:18px"><p class="muted" style="max-width:56ch">Top up when a property drops under a third of its par level. Costs are logged against the next invoice.</p>' + (L.length ? '<button class="btn btn-primary" data-act="sup-all">' + HB.icon('box', 18) + 'Restock all ' + L.length + ' low items</button>' : '') + '</div>' +
      (L.length ? '<div class="note-banner" style="margin-bottom:18px">' + HB.icon('alert', 20) + '<div><b>' + HB.plural(L.length, 'item is', 'items are') + ' low:</b> ' + L.map((s) => HB.esc(s.item + ' at ' + HB.prop(s.pid).short)).join(', ') + '.</div></div>' : '<div class="note-banner ok" style="margin-bottom:18px">' + HB.icon('check', 20) + '<div>Everything is stocked above its par level.</div></div>') +
      '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Property</th><th>Item</th><th>Stock</th><th>Level</th><th></th></tr></thead><tbody>' + S().supplies.slice().sort((a, b) => (low(b) - low(a)) || a.pid.localeCompare(b.pid)).map((s) => '<tr><td>' + HB.esc(HB.prop(s.pid).short) + '</td><td><b>' + HB.esc(s.item) + '</b></td><td class="mono">' + s.qty + ' / ' + s.par + ' ' + HB.esc(s.unit) + '</td><td style="min-width:120px"><div class="bar ' + (low(s) ? 'bad' : s.qty < s.par * .6 ? 'warn' : 'ok') + '"><i style="width:' + Math.min(100, s.qty / s.par * 100) + '%"></i></div></td><td class="r">' + (low(s) ? HB.chip('Low', 'bad') + ' ' : '') + '<button class="btn btn-ghost btn-xs" data-act="sup-restock" data-id="' + s.id + '">Restock</button></td></tr>').join('') + '</tbody></table></div>';
  }
  function laundry() {
    return '<p class="muted" style="margin-bottom:18px;max-width:56ch">Follow each linen set from the bed to the laundry and back. One tap moves it along.</p><div class="stack-l">' + S().props.map((p) => { const L = S().laundry.filter((l) => l.pid === p.id); return '<section class="sheet"><div class="room-h"><h3>' + HB.esc(p.short) + '</h3><span class="muted">' + HB.plural(L.length, 'set') + '</span></div><ul class="hair">' + L.map((l) => '<li class="lrow"><span class="lset">' + HB.icon('laundry', 18) + HB.esc(l.set) + '</span><ol class="ltrack" aria-label="Status">' + LSTAT.map((s, i) => '<li class="' + (i < LSTAT.indexOf(l.status) ? 'past' : i === LSTAT.indexOf(l.status) ? 'now' : '') + '">' + s + '</li>').join('') + '</ol><button class="btn btn-ghost btn-xs" data-act="lau-adv" data-id="' + l.id + '">' + (l.status === 'On bed' ? 'Strip to dirty' : 'Advance') + '</button></li>').join('') + '</ul></section>'; }).join('') + '</div>';
  }
  HB.view('op.inbox', {
    title: () => 'Inbox',
    render(pr) {
      const tab = pr.tab || 'messages'; const unread = S().threads.filter((t) => t.unreadOp).length; const nl = S().supplies.filter(low).length;
      const tabs = [['messages', 'Messages', unread], ['supplies', 'Supplies', nl], ['laundry', 'Laundry', 0]];
      return HB.pageHead('Inbox', 'Owners, supplies and linen.', 'Portal messages and email threads side by side, with low-stock alerts and laundry tracking that the turnovers feed.') +
        '<nav class="tabs" aria-label="Inbox sections">' + tabs.map((t) => '<a href="#/op/inbox/' + t[0] + '"' + (tab === t[0] ? ' aria-current="page"' : '') + '>' + t[1] + (t[2] ? '<span class="count">' + t[2] + '</span>' : '') + '</a>').join('') + '</nav>' + (tab === 'supplies' ? supplies() : tab === 'laundry' ? laundry() : messages());
    }
  });
  HB.act('thread-sel', (el) => { HB.ui.inbox.sel = el.dataset.id; HB.update((s) => { s.threads.find((t) => t.id === el.dataset.id).unreadOp = false; }); });
  HB.act('thread-send', (el) => {
    const f = HB.formData(el); if (!f.t.trim()) { HB.toast('Write a reply first', { icon: 'alert' }); return; }
    HB.update((s) => { const t = s.threads.find((x) => x.id === el.dataset.id); t.msgs.push({ from: 'hb', text: f.t.trim(), at: Date.now() }); t.unreadOw = true; });
    HB.$('textarea', el).value = ''; HB.toast('Reply sent', { icon: 'send' });
  });
  HB.act('sup-restock', (el) => { const s = S().supplies.find((x) => x.id === el.dataset.id); HB.update(() => { s.qty = s.par; }); HB.toast(s.item + ' restocked at ' + HB.prop(s.pid).short, { icon: 'box' }); });
  HB.act('sup-all', () => { HB.update((st) => { st.supplies.filter(low).forEach((s) => { s.qty = s.par; }); }); HB.toast('All low items restocked', { icon: 'box' }); });
  HB.act('lau-adv', (el) => { const l = S().laundry.find((x) => x.id === el.dataset.id); HB.update(() => { l.status = LSTAT[(LSTAT.indexOf(l.status) + 1) % 4]; }); });
})();
