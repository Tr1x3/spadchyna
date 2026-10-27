(function(){
  'use strict';
  const S = window.Spadchyna;
  const PAGE = 24;
  let all = [], curated = [], i18n = {}, snippets = {}, eraIndex = {};
  let state = {q:'', region:'all', group:'all', era:'all', limit:PAGE};

  function storyOf(p){ return p.cur ? curated.find(x => x.slug === p.cur) : null; }
  function titleOf(p){
    const story = storyOf(p);
    return story ? S.curatedText(story,'title',i18n) : (p.t || S.t('unnamed'));
  }
  function normalize(value){ return String(value || '').toLowerCase().replace(/ё/g,'е').trim(); }
  function eraOf(p){ return S.eraBucketOf(p, eraIndex, storyOf(p)); }
  function blurb(p){
    const story = storyOf(p);
    if (story){
      const text = S.curatedText(story,'subtitle',i18n);
      return text ? {text, own:true} : null;
    }
    const text = snippets[p.u];
    return text ? {text, own:false} : null;
  }
  function essayCard(story, index){
    const href = S.url('place/' + story.slug + '.html');
    const img = S.assetUrl(story.card || (story.images && story.images[0] && story.images[0].src) || '');
    const title = S.curatedText(story,'title',i18n);
    return '<article class="story-card">' +
      '<a class="story-card__media" href="' + href + '"><span class="story-card__index">' + String(index + 1).padStart(2,'0') + '</span><img src="' + img + '" alt="' + S.escapeHTML(title) + '" loading="lazy" data-fallback></a>' +
      '<div class="story-card__body"><div class="story-card__meta"><span>' + S.escapeHTML(S.regionName(story.regionKey)) + '</span><span>' + S.escapeHTML(S.typeLabel(story.type)) + '</span></div>' +
      '<h3 class="story-card__title"><a href="' + href + '">' + S.escapeHTML(title) + '</a></h3>' +
      '<p class="story-card__sub">' + S.escapeHTML(S.curatedText(story,'subtitle',i18n)) + '</p>' +
      '<div class="story-card__foot"><span>' + S.escapeHTML(S.curatedText(story,'era',i18n)) + '</span><a href="' + href + '">' + S.t('read') + '</a></div></div></article>';
  }
  function card(p){
    const href = S.url('place.html?u=' + encodeURIComponent(p.u));
    const title = titleOf(p);
    const region = S.regionName(p.r);
    const kind = S.groupLabel(p.g);
    const bucket = eraOf(p);
    const about = blurb(p);
    const foreign = !storyOf(p) && S.LANG !== 'be';
    const textHtml = about
      ? (about.own
          ? '<p class="catalog-card__text">' + S.escapeHTML(about.text) + '</p>'
          : '<p class="catalog-card__text" data-origin="' + S.escapeHTML(about.text) + '">' + S.escapeHTML(about.text) + '</p>')
      : '';
    const translate = foreign && (foreign || (about && !about.own))
      ? '<button class="btn btn--ghost btn--small" type="button" data-translate="card-' + S.escapeHTML(p.u) + '">' + S.t('translate') + '</button><p class="translate-status" data-translate-status hidden></p>'
      : '';
    return '<article class="place-card" id="card-' + S.escapeHTML(p.u) + '" data-translate-root>' +
      '<a class="place-card__media" href="' + href + '"><img src="' + S.imageUrl(p) + '" alt="' + S.escapeHTML(title) + '" loading="lazy" data-fallback></a>' +
      '<div class="place-card__body">' +
        '<div class="place-card__meta"><span>' + S.escapeHTML(region) + '</span><span>' + S.escapeHTML(kind) + (bucket ? ' · ' + S.escapeHTML(S.eraLabel(bucket)) : '') + '</span></div>' +
        '<h3><a href="' + href + '">' + (storyOf(p) || S.LANG === 'be' ? S.escapeHTML(title) : '<span data-origin="' + S.escapeHTML(title) + '">' + S.escapeHTML(title) + '</span>') + '</a></h3>' +
        textHtml +
        '<div class="place-card__foot"><span>' + S.escapeHTML(p.a || '') + '</span>' + translate + '</div>' +
      '</div></article>';
  }
  function filtered(){
    const q = normalize(state.q);
    return all.filter(p => {
      if (state.region !== 'all' && p.r !== state.region) return false;
      if (state.group !== 'all' && p.g !== state.group) return false;
      if (state.era !== 'all' && eraOf(p) !== state.era) return false;
      if (q){
        const about = blurb(p);
        const hay = normalize([titleOf(p), p.t, p.a, p.k, S.regionName(p.r), S.groupLabel(p.g), about ? about.text : ''].join(' '));
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }
  function renderEssays(){
    const grid = document.getElementById('essay-grid');
    if (!grid) return;
    const list = curated.filter(story => {
      if (state.region !== 'all' && story.regionKey !== state.region) return false;
      if (state.era !== 'all' && story.eraBucket !== state.era) return false;
      return true;
    });
    grid.innerHTML = list.length ? list.map(essayCard).join('') : '';
    S.bindImages(grid);
  }
  function render(){
    const list = filtered();
    const grid = document.getElementById('stories-grid');
    const count = document.getElementById('stories-count');
    const more = document.getElementById('stories-more');
    if (grid) grid.innerHTML = list.slice(0, state.limit).map(card).join('') || '<p class="muted">' + S.escapeHTML(S.t('nothingFound')) + '</p>';
    if (count) count.textContent = S.formatNumber(list.length);
    if (more) more.hidden = list.length <= state.limit;
    S.bindImages(grid || document);
    renderEssays();
  }
  function renderFilters(){
    const bar = document.getElementById('stories-filters');
    if (!bar) return;
    const eras = [['all', S.t('eraAll')], ['former', S.t('eraFormer')], ['soviet', S.t('eraSoviet')], ['modern', S.t('eraModern')]];
    bar.innerHTML =
      '<input id="stories-q" type="search" value="' + S.escapeHTML(state.q) + '" placeholder="' + S.escapeHTML(S.t('searchRoutePlaceholder')) + '" aria-label="' + S.escapeHTML(S.t('searchRoutePlaceholder')) + '">' +
      '<select id="stories-region" aria-label="' + S.escapeHTML(S.t('region')) + '"><option value="all">' + S.t('allRegions') + '</option>' + Object.entries(S.REGIONS).map(([k,v]) => '<option value="' + k + '"' + (state.region === k ? ' selected' : '') + '>' + S.escapeHTML(v) + '</option>').join('') + '</select>' +
      '<select id="stories-group" aria-label="' + S.escapeHTML(S.t('type')) + '"><option value="all">' + S.t('allTypes') + '</option>' + Object.entries(S.GROUPS).map(([k,v]) => '<option value="' + k + '"' + (state.group === k ? ' selected' : '') + '>' + S.escapeHTML(v) + '</option>').join('') + '</select>' +
      '<div class="era-switch">' + eras.map(([v, label]) => '<button type="button" class="walk-filter__btn' + (state.era === v ? ' is-active' : '') + '" data-era="' + v + '">' + label + '</button>').join('') + '</div>';
    const q = document.getElementById('stories-q');
    const region = document.getElementById('stories-region');
    const group = document.getElementById('stories-group');
    if (q) q.addEventListener('input', S.debounce(() => { state.q = q.value; state.limit = PAGE; render(); }, 220));
    if (region) region.addEventListener('change', () => { state.region = region.value; state.limit = PAGE; render(); });
    if (group) group.addEventListener('change', () => { state.group = group.value; state.limit = PAGE; render(); });
    bar.querySelectorAll('[data-era]').forEach(btn => btn.addEventListener('click', () => { state.era = btn.dataset.era; state.limit = PAGE; renderFilters(); render(); }));
  }
  async function init(){
    const grid = document.getElementById('stories-grid');
    if (!grid && !document.getElementById('essay-grid')) return;
    try {
      const [index, cur, tr, snip, era, stats] = await Promise.all([
        S.fetchJSON('assets/data/catalog_index.json'),
        S.fetchJSON('assets/data/curated.json'),
        S.fetchJSON('assets/data/curated_i18n.json'),
        S.fetchJSON('assets/data/snippets.json').catch(() => ({})),
        S.fetchJSON('assets/data/era_index.json').catch(() => ({})),
        S.fetchJSON('assets/data/stats.json').catch(() => ({}))
      ]);
      all = S.unpack(index);
      curated = cur;
      i18n = tr || {};
      snippets = snip || {};
      eraIndex = era || {};
      if (stats.total) document.querySelectorAll('[data-stat="total"]').forEach(el => { el.textContent = S.formatNumber(stats.total); });
      const more = document.getElementById('stories-more');
      if (more) more.addEventListener('click', () => { state.limit += PAGE; render(); });
      renderFilters();
      render();
    } catch (e) {
      console.error(e);
      if (grid) grid.innerHTML = '<p class="muted">' + S.escapeHTML(S.t('catalogLoadFail')) + '</p>';
    }
  }
  document.addEventListener('DOMContentLoaded', init);
})();
