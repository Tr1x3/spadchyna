(function(){
  'use strict';
  const S = window.Spadchyna;
  const PAGE = 48;
  let all = [];
  let curatedBySlug = new Map();
  let i18n = {};
  let state = {q:'', region:'all', group:'all', curated:false, sort:'title', limit:PAGE};

  function normalize(value){ return String(value || '').toLowerCase().replace(/ё/g,'е').trim(); }
  function storyOf(p){ return p.cur ? curatedBySlug.get(p.cur) : null; }
  function titleOf(p){ const story = storyOf(p); return story ? S.curatedText(story,'title',i18n) : (p.t || S.t('unnamed')); }
  function regionOf(p){ const story = storyOf(p); return S.regionName(story ? story.regionKey : p.r); }
  function typeOf(p){ const story = storyOf(p); return story ? S.typeLabel(story.type) : S.groupLabel(p.g); }
  function card(p){
    const href = S.placeUrl(p);
    const img = S.imageUrl(p);
    const title = titleOf(p);
    const region = regionOf(p);
    const type = typeOf(p);
    const hasCoords = p.lat != null && p.lon != null && Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lon));
    const url = p.cur ? 'place/' + p.cur + '.html' : 'place.html?u=' + encodeURIComponent(p.u);
    const routeData = 'data-route-add data-u="' + S.escapeHTML(p.u) + '" data-title="' + S.escapeHTML(title) + '" data-lat="' + p.lat + '" data-lon="' + p.lon + '" data-region="' + S.escapeHTML(region) + '" data-image="' + S.escapeHTML(p.p || '') + '" data-url="' + S.escapeHTML(url) + '" data-cur="' + S.escapeHTML(p.cur || '') + '"' + (hasCoords ? '' : ' disabled title="' + S.escapeHTML(S.t('coordsUnknown')) + '"');
    return '<article class="place-card">' +
      '<a class="place-card__media" href="' + href + '">' +
        (p.cur ? '<span class="place-card__badge">' + S.t('story') + '</span>' : '') +
        '<img src="' + img + '" alt="' + S.escapeHTML(title) + '" loading="lazy" data-fallback>' +
      '</a>' +
      '<div class="place-card__body">' +
        '<div class="place-card__meta"><span>' + S.escapeHTML(region) + '</span><span>' + S.escapeHTML(p.cur ? S.t('story') : S.groupLabel(p.g)) + '</span></div>' +
        '<h3><a href="' + href + '">' + (p.cur || S.LANG === 'be' ? S.escapeHTML(title) : '<span data-origin="' + S.escapeHTML(title) + '">' + S.escapeHTML(title) + '</span>') + '</a></h3>' +
        '<p class="place-card__address"' + (S.LANG !== 'be' && p.a ? ' data-origin="' + S.escapeHTML(p.a) + '"' : '') + '>' + S.escapeHTML(p.a || S.t('addressUnknown')) + '</p>' +
        '<div class="place-card__foot"><span>' + S.escapeHTML(type) + '</span>' +
          '<button class="icon-btn icon-btn--labeled" type="button" ' + routeData + ' aria-label="' + S.escapeHTML(S.t('addRoute')) + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg><span>' + S.t('addRoute') + '</span></button>' +
        '</div>' +
      '</div>' +
    '</article>';
  }
  function filtered(){
    const q = normalize(state.q);
    let list = all.filter(p => {
      if (state.curated && !p.cur) return false;
      if (state.region !== 'all' && p.r !== state.region) return false;
      if (state.group !== 'all' && p.g !== state.group) return false;
      if (q){
        const story = storyOf(p);
        const hay = normalize([titleOf(p), p.t, p.a, p.k, p.c, regionOf(p), typeOf(p), story ? S.curatedText(story,'subtitle',i18n) : ''].join(' '));
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const cmp = (a,b) => String(a).localeCompare(String(b), S.LOCALE);
    if (state.sort === 'title') list.sort((a,b) => cmp(titleOf(a), titleOf(b)));
    if (state.sort === 'region') list.sort((a,b) => cmp(regionOf(a), regionOf(b)) || cmp(titleOf(a), titleOf(b)));
    if (state.sort === 'type') list.sort((a,b) => cmp(typeOf(a), typeOf(b)) || cmp(titleOf(a), titleOf(b)));
    return list;
  }
  function syncUrl(){
    const params = new URLSearchParams();
    if (state.q) params.set('q', state.q);
    if (state.region !== 'all') params.set('region', state.region);
    if (state.group !== 'all') params.set('group', state.group);
    if (state.curated) params.set('curated','1');
    if (state.sort !== 'title') params.set('sort', state.sort);
    const query = params.toString();
    history.replaceState(null,'', location.pathname + (query ? '?' + query : ''));
  }
  function render(){
    const list = filtered();
    const grid = document.getElementById('place-grid');
    const count = document.getElementById('place-count');
    const more = document.getElementById('load-more');
    const empty = document.getElementById('empty-state');
    if (grid) grid.innerHTML = list.slice(0, state.limit).map(card).join('');
    if (count) count.textContent = S.formatNumber(list.length);
    if (more) more.hidden = list.length <= state.limit;
    if (empty) empty.hidden = list.length !== 0;
    S.bindImages(document);
    if (grid) S.applyPageLanguage(grid);
    S.initReveal(grid);
    syncUrl();
  }
  function fillSelects(){
    const region = document.getElementById('filter-region');
    const group = document.getElementById('filter-group');
    if (region){
      region.innerHTML = '<option value="all">' + S.t('allRegions') + '</option>' + Object.entries(S.REGIONS).map(([k,v]) => '<option value="' + k + '">' + S.escapeHTML(v) + '</option>').join('');
      region.value = state.region;
    }
    if (group){
      group.innerHTML = '<option value="all">' + S.t('allTypes') + '</option>' + Object.entries(S.GROUPS).map(([k,v]) => '<option value="' + k + '">' + S.escapeHTML(v) + '</option>').join('');
      group.value = state.group;
    }
  }
  function readUrl(){
    const p = new URLSearchParams(location.search);
    state.q = p.get('q') || '';
    state.region = p.get('region') || 'all';
    state.group = p.get('group') || 'all';
    state.curated = p.get('curated') === '1';
    state.sort = p.get('sort') || 'title';
    state.limit = PAGE;
  }
  function bind(){
    const search = document.getElementById('filter-q');
    const region = document.getElementById('filter-region');
    const group = document.getElementById('filter-group');
    const curated = document.getElementById('filter-curated');
    const sort = document.getElementById('filter-sort');
    const reset = document.getElementById('filter-reset');
    const more = document.getElementById('load-more');
    if (search){
      search.value = state.q;
      search.addEventListener('input', S.debounce(() => { state.q = search.value; state.limit = PAGE; render(); }, 220));
    }
    if (region) region.addEventListener('change', () => { state.region = region.value; state.limit = PAGE; render(); });
    if (group) group.addEventListener('change', () => { state.group = group.value; state.limit = PAGE; render(); });
    if (curated) { curated.checked = state.curated; curated.addEventListener('change', () => { state.curated = curated.checked; state.limit = PAGE; render(); }); }
    if (sort){ sort.value = state.sort; sort.addEventListener('change', () => { state.sort = sort.value; state.limit = PAGE; render(); }); }
    if (reset) reset.addEventListener('click', () => {
      state = {q:'', region:'all', group:'all', curated:false, sort:'title', limit:PAGE};
      if (search) search.value = ''; if (curated) curated.checked = false; fillSelects(); if (sort) sort.value = 'title';
      render();
    });
    if (more) more.addEventListener('click', () => { state.limit += PAGE; render(); });
  }
  async function init(){
    try {
      const [index, curated, tr] = await Promise.all([
        S.fetchJSON('assets/data/catalog_index.json'),
        S.fetchJSON('assets/data/curated.json'),
        S.fetchJSON('assets/data/curated_i18n.json')
      ]);
      all = S.unpack(index);
      curatedBySlug = new Map(curated.map(x => [x.slug, x]));
      i18n = tr;
      readUrl(); fillSelects(); bind(); render();
    } catch (e) {
      console.error(e);
      const grid = document.getElementById('place-grid');
      if (grid) grid.innerHTML = '<p class="muted">' + S.escapeHTML(S.t('catalogLoadFail')) + '</p>';
    }
  }
  document.addEventListener('DOMContentLoaded', init);
})();
