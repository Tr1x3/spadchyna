(function(){
  'use strict';
  const S = window.Spadchyna;
  let data = null;
  let active = 'all';

  function distance(km){
    return new Intl.NumberFormat(S.LOCALE, {maximumFractionDigits:1}).format(km) + (S.LANG === 'en' ? ' km' : ' км');
  }

  function card(route){
    const href = S.url('walk.html?slug=' + encodeURIComponent(route.slug));
    const title = S.dataText(route,'title');
    const city = S.dataText(route,'city');
    const district = S.dataText(route,'district');
    return '<article class="walk-card" data-duration="' + route.duration_min + '">' +
      '<a class="walk-card__media" href="' + href + '" aria-label="' + S.escapeHTML(title) + '">' +
        '<img src="' + S.assetUrl(route.image) + '" alt="' + S.escapeHTML(title) + '" loading="lazy" data-fallback>' +
        '<span class="walk-card__time">' + S.escapeHTML(S.dataText(route,'duration')) + '</span>' +
      '</a>' +
      '<div class="walk-card__body">' +
        '<div class="walk-card__meta"><span>' + S.escapeHTML(city) + ' · ' + S.escapeHTML(district) + '</span><span>' + distance(route.distance_km) + '</span></div>' +
        '<h3><a href="' + href + '">' + S.escapeHTML(title) + '</a></h3>' +
        '<p>' + S.escapeHTML(S.dataText(route,'summary')) + '</p>' +
        '<div class="walk-card__foot"><span>' + route.points.length + ' ' + S.stopsWord(route.points.length) + ' · ' + S.escapeHTML(S.dataText(route,'level')) + '</span><a href="' + href + '">' + S.t('openWalk') + '</a></div>' +
      '</div>' +
    '</article>';
  }

  function renderCards(container, routes){
    if (!container) return;
    container.innerHTML = routes.map(card).join('');
    S.bindImages(container);
    S.initReveal(container);
  }

  function renderFilters(){
    const box = document.getElementById('walks-filter');
    if (!box || !data) return;
    const bucket = r => (Number(r.duration_min) <= 60 ? 'h1' : Number(r.duration_min) <= 120 ? 'h2' : 'long');
    const counts = {
      all: data.routes.length,
      h1: data.routes.filter(r => bucket(r) === 'h1').length,
      h2: data.routes.filter(r => bucket(r) === 'h2').length,
      long: data.routes.filter(r => bucket(r) === 'long').length
    };
    const items = [
      ['all', S.t('filterAll')],
      ['h1', S.t('filterTo1h')],
      ['h2', S.t('filter1to2')],
      ['long', S.t('filterLonger')]
    ];
    box.innerHTML = items.map(([key, label]) =>
      '<button type="button" class="walk-filter__btn' + (active === key ? ' is-active' : '') + '" data-walk-filter="' + key + '" aria-pressed="' + (active === key) + '">' +
        label + ' <span>' + counts[key] + '</span>' +
      '</button>'
    ).join('');
    box.querySelectorAll('[data-walk-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        active = btn.dataset.walkFilter;
        renderFilters();
        renderGrid();
      });
    });
  }

  function renderGrid(){
    const grid = document.getElementById('walks-grid');
    if (!grid || !data) return;
    const bucket = r => (Number(r.duration_min) <= 60 ? 'h1' : Number(r.duration_min) <= 120 ? 'h2' : 'long');
    const list = active === 'all' ? data.routes : data.routes.filter(r => bucket(r) === active);
    renderCards(grid, list);
    const count = document.getElementById('walks-count');
    if (count) count.textContent = String(list.length);
  }

  async function init(){
    const home = document.getElementById('home-walks');
    const grid = document.getElementById('walks-grid');
    if (!home && !grid) return;
    try {
      data = await S.fetchJSON('assets/data/walks.json');
      if (home) renderCards(home, data.routes.slice(0, 3));
      if (grid){
        renderFilters();
        renderGrid();
      }
      document.querySelectorAll('[data-walks-count]').forEach(el => { el.textContent = String(data.routes.length); });
    } catch (e) {
      console.error(e);
      const message = '<p class="muted">' + S.escapeHTML(S.t('walksLoadFail')) + ' <a href="' + S.url('walks.html') + '">' + S.t('allWalks') + '</a>.</p>';
      if (home) home.innerHTML = message;
      if (grid) grid.innerHTML = message;
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
