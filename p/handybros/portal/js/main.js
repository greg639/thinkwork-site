/* Boot */
(function () {
  if (!location.hash) history.replaceState(null, '', '#/op/today');
  HB.renderShell();
  const m = HB.match();
  if (m.key !== 'runner') HB.go_last[HB.role()] = m.path;
  HB.$('#main').innerHTML = HB.skeleton();
  document.body.classList.toggle('runner-full', m.key === 'runner');
  if (m.key === 'runner') HB.runnerRender();
  setTimeout(() => { HB.renderView(true); document.documentElement.dataset.ready = '1'; }, 480);
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    HB.acts['nav-close']();
    const d = HB.$('#drawer');
    if (d.classList.contains('open') && !HB.$('#modal-root').children.length) HB.acts['drawer-close']();
  });
  window.addEventListener('resize', () => { if (innerWidth > 960) HB.$('#app').classList.remove('nav-open'); });
})();
