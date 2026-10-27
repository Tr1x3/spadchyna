(function(){
  'use strict';
  const S = window.Spadchyna;
  let map, cluster, points = [], curated = [], i18n = {}, eraIndex = {}, curatedBySlug = new Map(), markers = new Map(), curatedMarkers = new Map();
  let state = {q:'', region:'all', group:'all', era:'all'};

  function storyFor(p){
    const slug = S.curatedSlug(p);
    return slug ? curatedBySlug.get(slug) : null;
  }
  function pointTitle(p){
    const story = storyFor(p);
    return story ? S.curatedText(story,'title',i18n) : (p.t || '');
  }
  function pointRegion(p){
    const story = storyFor(p);
    return S.regionName(story ? story.regionKey : p.r);
  }
  function pointKind(p){
    const story = storyFor(p);
    if (story) return S.t('projectStory');
    return S.groupLabel(p.g);
  }
  function popupHtml(p){
    const story = storyFor(p);
    const href = S.placeUrl(p);
    const kind = pointKind(p);
    const region = pointRegion(p);
    const title = pointTitle(p);
    const bucket = S.eraBucketOf(p, eraIndex, story);
    const eraText = S.eraLabel(bucket);
    const description = story ? S.curatedText(story,'subtitle',i18n) : (p.k || S.t('officialObject'));
    return S.pointPopup({
      image: S.imageUrl(p),
      title,
      meta: kind + ' · ' + region + (eraText ? ' · ' + eraText : ''),
      text: description,
      href,
      listenText: title + '. ' + kind + '. ' + region + '. ' + description,
      speakFrom: story ? '' : 'be',
      route: {
        u: p.u, title, lat: p.lat, lon: p.lon, region,
        image: p.p || '', url: story ? ('place/' + story.slug + '.html') : ('place.html?u=' + encodeURIComponent(p.u)),
        cur: p.cur || ''
      }
    });
  }
  function markerFor(p){
    const theme = S.themeOf(p);
    const size = theme === 'curated' ? 18 : 13;
    const icon = L.divIcon({
      className:'map-marker-wrap',
      html:'<span class="map-dot map-dot--' + theme + '"></span>',
      iconSize:[size,size], iconAnchor:[size/2,size/2]
    });
    const marker = L.marker([p.lat,p.lon], {icon, title:pointTitle(p), riseOnHover:true});
    marker.bindPopup(popupHtml(p), {maxWidth:310, minWidth:280, closeButton:true, autoPanPadding:[30,30]});
    marker.on('popupopen', e => { S.bindImages(e.popup.getElement()); });
    marker._point = p;
    return marker;
  }
  function matches(p){
    if (state.region !== 'all' && p.r !== state.region) return false;
    if (state.group !== 'all' && p.g !== state.group) return false;
    if (state.era !== 'all' && S.eraBucketOf(p, eraIndex, storyFor(p)) !== state.era) return false;
    if (state.q){
      const q = state.q.toLowerCase().replace(/ё/g,'е');
      const hay = [pointTitle(p), pointRegion(p), pointKind(p), p.k, S.groupLabel(p.g)].join(' ').toLowerCase().replace(/ё/g,'е');
      if (!hay.includes(q)) return false;
    }
    return true;
  }
  function listItem(story){
    const href = S.placeUrl({u:'curated:' + story.slug, cur:story.slug});
    const img = S.assetUrl(story.card || story.images[0].src);
    const title = S.curatedText(story,'title',i18n);
    return '<article class="map-story">' +
      '<a href="' + href + '"><img class="map-story__media" src="' + img + '" alt="" loading="lazy" data-fallback></a>' +
      '<div><div class="map-story__meta">' + S.escapeHTML(S.regionName(story.regionKey)) + ' · ' + S.escapeHTML(S.typeLabel(story.type)) + '</div>' +
      '<h3><a href="' + href + '">' + S.escapeHTML(title) + '</a></h3></div>' +
      '<button class="map-story__focus" type="button" data-focus="' + S.escapeHTML(story.slug) + '" aria-label="' + S.escapeHTML(S.t('mapOn')) + '" title="' + S.escapeHTML(S.t('mapOn')) + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg><span>' + S.t('mapOn') + '</span></button>' +
    '</article>';
  }
  function renderPanel(filteredPoints){
    const stories = document.getElementById('map-stories');
    const count = document.getElementById('map-count');
    const catLink = document.getElementById('map-catalog-link');
    if (count) count.textContent = S.formatNumber(filteredPoints.length);
    if (stories){
      const visibleStories = (state.group === 'all' || state.group === 'curated')
        ? curated.filter(x => (state.region === 'all' || x.regionKey === state.region) && (!state.q || [S.curatedText(x,'title',i18n),S.curatedText(x,'subtitle',i18n),S.regionName(x.regionKey),S.typeLabel(x.type)].join(' ').toLowerCase().includes(state.q.toLowerCase())))
        : [];
      stories.innerHTML = visibleStories.map(listItem).join('') || '<p class="muted" style="font-size:12px;line-height:1.6">' + S.escapeHTML(S.t('noStoriesInFilter')) + '</p>';
      S.bindImages(stories);
      stories.querySelectorAll('[data-focus]').forEach(btn => btn.addEventListener('click', () => focusCurated(btn.dataset.focus)));
    }
    if (catLink){
      const params = new URLSearchParams();
      if (state.q) params.set('q', state.q);
      if (state.region !== 'all') params.set('region', state.region);
      if (state.group !== 'all') params.set('group', state.group);
      const qs = params.toString();
      catLink.innerHTML = S.t('catalogCount', {
        n: S.formatNumber(filteredPoints.filter(p => !S.isCurated(p)).length),
        href: S.url('places.html' + (qs ? '?' + qs : ''))
      });
    }
  }
  function render(){
    if (!cluster) return;
    const list = points.filter(matches);
    cluster.clearLayers();
    cluster.addLayers(list.map(p => markers.get(p.u)).filter(Boolean));
    renderPanel(list);
  }
  function focusCurated(slug){
    const marker = curatedMarkers.get(slug);
    if (!marker) return;
    cluster.zoomToShowLayer(marker, () => { marker.openPopup(); });
  }
  function focusU(u){
    const marker = markers.get(u);
    if (!marker) return;
    cluster.zoomToShowLayer(marker, () => { marker.openPopup(); });
  }
  function fillSelects(){
    const region = document.getElementById('map-region');
    const group = document.getElementById('map-group');
    if (region){
      region.innerHTML = '<option value="all">' + S.t('allBelarus') + '</option>' + Object.entries(S.REGIONS).map(([k,v]) => '<option value="' + k + '">' + S.escapeHTML(v) + '</option>').join('');
      region.value = state.region;
    }
    if (group){
      group.innerHTML = '<option value="all">' + S.t('allTypes') + '</option>' + Object.entries(S.GROUPS).map(([k,v]) => '<option value="' + k + '">' + S.escapeHTML(v) + '</option>').join('');
      group.value = state.group;
    }
    const era = document.getElementById('map-era');
    if (era){
      const options = [['all', S.t('eraAll')], ['former', S.t('eraFormer')], ['soviet', S.t('eraSoviet')], ['modern', S.t('eraModern')]];
      era.innerHTML = options.map(([k,v]) => '<option value="' + k + '">' + S.escapeHTML(v) + '</option>').join('');
      era.value = state.era;
    }
  }
  function bind(){
    const search = document.getElementById('map-q');
    const region = document.getElementById('map-region');
    const group = document.getElementById('map-group');
    const era = document.getElementById('map-era');
    const reset = document.getElementById('map-reset');
    if (search) search.addEventListener('input', S.debounce(() => { state.q = search.value; render(); }, 240));
    if (region) region.addEventListener('change', () => { state.region = region.value; render(); });
    if (group) group.addEventListener('change', () => { state.group = group.value; render(); });
    if (era) era.addEventListener('change', () => { state.era = era.value; render(); });
    if (reset) reset.addEventListener('click', () => {
      state = {q:'', region:'all', group:'all', era:'all'};
      if (search) search.value = ''; fillSelects(); render();
    });
    const p = new URLSearchParams(location.search);
    if (p.get('region')) state.region = p.get('region');
    if (p.get('group')) state.group = p.get('group');
    if (p.get('q')) { state.q = p.get('q'); if (search) search.value = state.q; }
    fillSelects();
  }
  async function init(){
    const el = document.getElementById('map');
    if (!el) return;
    const base = await S.initBaseMap(el, {osm:true, tiles:'carto'});
    map = base.map;
    S.initMapTools(map, {onFit: () => map.fitBounds([[51.15,23.0],[56.3,32.9]], {padding:[18,18]})});
    cluster = L.markerClusterGroup({
      showCoverageOnHover:false, maxClusterRadius:54, chunkedLoading:true,
      disableClusteringAtZoom:11, spiderfyOnMaxZoom:true, removeOutsideVisibleBounds:true,
      iconCreateFunction: c => {
        const n = c.getChildCount();
        const size = n < 10 ? 34 : n < 100 ? 40 : n < 1000 ? 46 : 52;
        return L.divIcon({html:'<span>' + n + '</span>', className:'cluster-icon', iconSize:[size,size]});
      }
    }).addTo(map);
    try {
      const [data, cur, tr, era, border] = await Promise.all([
        S.fetchJSON('assets/data/map_points.json'),
        S.fetchJSON('assets/data/curated.json'),
        S.fetchJSON('assets/data/curated_i18n.json'),
        S.fetchJSON('assets/data/era_index.json').catch(() => ({})),
        S.fetchJSON('assets/data/belarus.json').catch(() => null)
      ]);
      points = S.locatePoints(S.unpack(data)).filter(p => S.insideCountry(p.lat, p.lon, border));
      if (border) S.addCountryOutline(map, border).catch(() => {});
      curated = cur;
      i18n = tr;
      eraIndex = era || {};
      curatedBySlug = new Map(curated.map(x => [x.slug, x]));
      points.forEach(p => {
        const marker = markerFor(p);
        markers.set(p.u, marker);
        if (p.cur) curatedMarkers.set(p.cur, marker);
      });
      bind();
      render();
      const p = new URLSearchParams(location.search);
      if (p.get('curated')) focusCurated(p.get('curated'));
      if (p.get('u')) focusU(p.get('u'));
    } catch (e) {
      console.error(e);
      const count = document.getElementById('map-count');
      if (count) count.textContent = '—';
    }
  }
  document.addEventListener('DOMContentLoaded', init);
})();
