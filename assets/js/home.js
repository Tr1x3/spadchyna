(function(){
  'use strict';
  const S = window.Spadchyna;
  const FEATURED = ['khatyn','brest','trostenets','krasny-bereg','mir','ola'];
  const CLASSES = ['story-card--wide','story-card--small','story-card--small','','',''];
  let map, cluster, points = [], markers = new Map(), eraIndex = {}, curatedBySlug = new Map(), i18n = {};
  let cafesLayer = null, walkLayer = null, walks = [], cafes = [];
  let era = 'all', duration = 'all', walkSlug = '', cafesOn = false;

  function storyCard(story, index, cls){
    const href = S.url('place/' + story.slug + '.html');
    const img = S.assetUrl(story.card || story.images[0].src);
    const num = String(index + 1).padStart(2,'0');
    return '<article class="story-card ' + (cls || '') + '">' +
      '<a class="story-card__media" href="' + href + '">' +
        '<span class="story-card__index">' + num + '</span>' +
        '<img src="' + img + '" alt="' + S.escapeHTML(S.curatedText(story,'title',i18n)) + '" loading="lazy" data-fallback>' +
      '</a>' +
      '<div class="story-card__body">' +
        '<div class="story-card__meta"><span>' + S.escapeHTML(S.regionName(story.regionKey)) + '</span><span>' + S.escapeHTML(S.typeLabel(story.type)) + '</span></div>' +
        '<h3 class="story-card__title"><a href="' + href + '">' + S.escapeHTML(S.curatedText(story,'title',i18n)) + '</a></h3>' +
        '<p class="story-card__sub">' + S.escapeHTML(S.curatedText(story,'subtitle',i18n)) + '</p>' +
        '<div class="story-card__foot"><span>' + S.escapeHTML(S.curatedText(story,'era',i18n)) + '</span><a href="' + href + '">' + S.t('read') + '</a></div>' +
      '</div>' +
    '</article>';
  }

  function storyFor(p){
    return p.cur ? curatedBySlug.get(p.cur) : null;
  }
  function pointTitle(p){
    const story = storyFor(p);
    return story ? S.curatedText(story,'title',i18n) : (p.t || S.t('unnamed'));
  }
  function passesEra(p){
    if (era === 'all') return true;
    return S.eraBucketOf(p, eraIndex, storyFor(p)) === era;
  }
  function durationOf(route){
    const n = Number(route.duration_min) || 0;
    if (n <= 60) return 'h1';
    if (n <= 120) return 'h2';
    return 'long';
  }
  function visibleWalks(){
    if (duration === 'all') return walks;
    return walks.filter(r => durationOf(r) === duration);
  }
  function chip(id, value, label, pressed){
    return '<button type="button" class="walk-filter__btn' + (pressed ? ' is-active' : '') + '" data-' + id + '="' + value + '" aria-pressed="' + pressed + '">' + label + '</button>';
  }
  function renderBar(){
    const bar = document.getElementById('home-map-bar');
    if (!bar) return;
    const eras = [['all', S.t('eraAll')], ['former', S.t('eraFormer')], ['soviet', S.t('eraSoviet')], ['modern', S.t('eraModern')]];
    const durs = [['all', S.t('filterAll')], ['h1', S.t('filterTo1h')], ['h2', S.t('filter1to2')], ['long', S.t('filterLonger')]];
    const options = ['<option value="">' + S.escapeHTML(S.t('walkNone')) + '</option>'].concat(visibleWalks().map(r =>
      '<option value="' + S.escapeHTML(r.slug) + '"' + (r.slug === walkSlug ? ' selected' : '') + '>' + S.escapeHTML(S.dataText(r,'title')) + '</option>'
    ));
    bar.innerHTML =
      '<div class="era-switch" aria-label="' + S.escapeHTML(S.t('eraAll')) + '">' + eras.map(([v, label]) => chip('era', v, label, era === v)).join('') + '</div>' +
      '<div class="era-switch">' + durs.map(([v, label]) => chip('duration', v, label, duration === v)).join('') + '</div>' +
      '<select id="home-walk" aria-label="' + S.escapeHTML(S.t('walk')) + '">' + options.join('') + '</select>' +
      '<label class="check-inline"><input type="checkbox" id="home-cafes"' + (cafesOn ? ' checked' : '') + '> ' + S.escapeHTML(S.t('cafes')) + '</label>';
    bar.querySelectorAll('[data-era]').forEach(btn => btn.addEventListener('click', () => { era = btn.dataset.era; renderBar(); renderPoints(); }));
    bar.querySelectorAll('[data-duration]').forEach(btn => btn.addEventListener('click', () => {
      duration = btn.dataset.duration;
      if (walkSlug && !visibleWalks().some(r => r.slug === walkSlug)) walkSlug = '';
      renderBar();
      drawWalk();
    }));
    const select = document.getElementById('home-walk');
    if (select) select.addEventListener('change', () => { walkSlug = select.value; drawWalk(); });
    const cafesBox = document.getElementById('home-cafes');
    if (cafesBox) cafesBox.addEventListener('change', () => {
      cafesOn = cafesBox.checked;
      if (!map || !cafesLayer) return;
      if (cafesOn) cafesLayer.addTo(map);
      else map.removeLayer(cafesLayer);
    });
  }
  function popupFor(p){
    const story = storyFor(p);
    const title = pointTitle(p);
    const region = S.regionName(story ? story.regionKey : p.r);
    const kind = story ? S.typeLabel(story.type) : S.groupLabel(p.g);
    const bucket = S.eraBucketOf(p, eraIndex, story);
    const eraText = S.eraLabel(bucket);
    const meta = kind + ' · ' + region + (eraText ? ' · ' + eraText : '');
    const text = story ? S.curatedText(story,'subtitle',i18n) : (p.k || '');
    const href = S.placeUrl(p);
    const listen = title + '. ' + meta + (text ? '. ' + text : '');
    return S.pointPopup({
      image: S.imageUrl(p),
      title, meta, text, href,
      listenText: listen,
      speakFrom: story ? '' : 'be',
      route: {u:p.u, title, lat:p.lat, lon:p.lon, region, image:p.p || '', url: story ? ('place/' + story.slug + '.html') : ('place.html?u=' + encodeURIComponent(p.u)), cur:p.cur || ''}
    });
  }
  function renderPoints(){
    if (!cluster) return;
    const list = points.filter(passesEra);
    cluster.clearLayers();
    cluster.addLayers(list.map(p => markers.get(p.u)).filter(Boolean));
    const note = document.getElementById('home-map-note');
    if (note && !walkSlug) note.textContent = '';
  }
  function lineOf(route){
    const geom = route.geometry;
    if (route.geometry_source === 'osrm-foot' && geom && geom.type === 'LineString' && geom.coordinates && geom.coordinates.length > 1){
      return {latlngs: geom.coordinates.map(c => [c[1], c[0]]), foot: true};
    }
    return {latlngs: (route.points || []).map(p => [Number(p.lat), Number(p.lon)]), foot: false};
  }
  function drawWalk(){
    const note = document.getElementById('home-map-note');
    if (!map) return;
    if (!walkLayer) walkLayer = L.layerGroup().addTo(map);
    walkLayer.clearLayers();
    const route = walks.find(r => r.slug === walkSlug);
    if (!route){ if (note) note.textContent = ''; return; }
    const line = lineOf(route);
    if (line.latlngs.length > 1){
      L.polyline(line.latlngs, {color:'#b33a2b', weight:4, opacity:0.9}).addTo(walkLayer);
    }
    (route.points || []).forEach((p, i) => {
      const icon = L.divIcon({className:'route-number', html:'<span>' + (i + 1) + '</span>', iconSize:[28,28], iconAnchor:[14,14]});
      const marker = L.marker([Number(p.lat), Number(p.lon)], {icon, title:S.dataText(p,'title')}).addTo(walkLayer);
      const title = S.dataText(p,'title');
      const text = S.dataText(p,'text');
      marker.bindPopup(S.pointPopup({
        title, text,
        meta: S.t('routePoint', {n:i + 1}),
        href: S.url(p.url || ('place.html?u=' + encodeURIComponent(p.u))),
        listenText: title + '. ' + text,
        route: {u:p.u, title, lat:p.lat, lon:p.lon, region:S.dataText(route,'city'), image:route.image || '', url:p.url || '', cur:p.cur || ''}
      }), {maxWidth:320, minWidth:260});
    });
    if (note) note.textContent = line.foot ? S.t('routeFootNote') : S.t('routeOrderNote');
    if (line.latlngs.length > 1) map.fitBounds(L.latLngBounds(line.latlngs), {padding:[28,28], maxZoom:15});
  }
  function cafePopup(c){
    const name = S.dataText(c,'name');
    const city = S.dataText(c,'city');
    const address = S.dataText(c,'address');
    const note = S.dataText(c,'note');
    return S.pointPopup({
      title: name,
      meta: city,
      text: address + (note ? ' — ' + note : ''),
      listenText: name + '. ' + city + ', ' + address + '. ' + note
    });
  }
  async function initMap(){
    const el = document.getElementById('home-map');
    if (!el || !window.L) return;
    const base = await S.initBaseMap(el, {osm:true, tiles:'carto', fit:false, preferCanvas:true});
    map = base.map;
    try {
      const borderGeo = await S.fetchJSON('assets/data/belarus.json');
      points = points.filter(p => S.insideCountry(p.lat, p.lon, borderGeo));
      document.querySelectorAll('[data-stat="coords"]').forEach(el => { el.textContent = S.formatNumber(points.length); });
      const border = await S.addCountryOutline(map, borderGeo);
      if (border.getBounds().isValid()) map.fitBounds(border.getBounds(), {padding:[12,12]});
    } catch (e) {
      map.fitBounds([[51.15,23.0],[56.3,32.9]], {padding:[12,12]});
    }
    S.initMapTools(map, {onFit: () => map.fitBounds([[51.15,23.0],[56.3,32.9]], {padding:[12,12]})});
    cluster = L.markerClusterGroup({
      showCoverageOnHover:false, maxClusterRadius:48, chunkedLoading:true,
      disableClusteringAtZoom:11, spiderfyOnMaxZoom:true, removeOutsideVisibleBounds:true,
      iconCreateFunction: c => {
        const n = c.getChildCount();
        const size = n < 10 ? 34 : n < 100 ? 40 : n < 1000 ? 46 : 52;
        return L.divIcon({html:'<span>' + n + '</span>', className:'cluster-icon', iconSize:[size,size]});
      }
    }).addTo(map);
    cafesLayer = L.layerGroup();
    walkLayer = L.layerGroup().addTo(map);
    points.forEach(p => {
      const theme = S.themeOf(p);
      const size = theme === 'curated' ? 16 : 12;
      const icon = L.divIcon({className:'map-marker-wrap', html:'<span class="map-dot map-dot--' + theme + '"></span>', iconSize:[size,size], iconAnchor:[size/2,size/2]});
      const marker = L.marker([p.lat, p.lon], {icon, title:pointTitle(p)});
      marker.bindPopup(popupFor(p), {maxWidth:320, minWidth:260, autoPanPadding:[24,24]});
      marker.on('popupopen', ev => { S.bindImages(ev.popup.getElement()); S.applyPageLanguage(ev.popup.getElement()); });
      markers.set(p.u, marker);
    });
    cafes.forEach(c => {
      const icon = L.divIcon({className:'map-marker-wrap', html:'<span class="map-dot map-dot--cafe"></span>', iconSize:[14,14], iconAnchor:[7,7]});
      const marker = L.marker([c.lat, c.lon], {icon, title:S.dataText(c,'name')});
      marker.bindPopup(cafePopup(c), {maxWidth:320, minWidth:240});
      cafesLayer.addLayer(marker);
    });
    renderBar();
    renderPoints();
  }

  async function init(){
    const grid = document.getElementById('home-stories');
    try {
      const jobs = [
        S.fetchJSON('assets/data/stats.json'),
        S.fetchJSON('assets/data/curated.json'),
        S.fetchJSON('assets/data/curated_i18n.json'),
        S.fetchJSON('assets/data/era_index.json').catch(() => ({}))
      ];
      if (document.getElementById('home-map')){
        jobs.push(
          S.fetchJSON('assets/data/map_points.json'),
          S.fetchJSON('assets/data/walks.json').catch(() => ({routes:[]})),
          S.fetchJSON('assets/data/cafes.json').catch(() => ({places:[]}))
        );
      }
      const loaded = await Promise.all(jobs);
      const stats = loaded[0], curated = loaded[1];
      i18n = loaded[2] || {};
      eraIndex = loaded[3] || {};
      curatedBySlug = new Map(curated.map(x => [x.slug, x]));
      const values = {
        total: S.formatNumber(stats.total),
        coords: S.formatNumber(stats.withCoords),
        curated: S.formatNumber(stats.curated || curated.length),
        regions: String(Object.keys(stats.regions || {}).length)
      };
      Object.entries(values).forEach(([key, value]) => {
        document.querySelectorAll('[data-stat="' + key + '"]').forEach(el => { el.textContent = value; });
      });
      const bySlug = curatedBySlug;
      const items = FEATURED.map(slug => bySlug.get(slug)).filter(Boolean);
      if (grid) grid.innerHTML = items.map((story, i) => storyCard(story, i, CLASSES[i])).join('');
      S.bindImages(document);
      S.initReveal(grid);
      if (document.getElementById('home-map')){
        points = S.locatePoints(S.unpack(loaded[4] || {fields:[], rows:[]}));
        document.querySelectorAll('[data-stat="coords"]').forEach(el => { el.textContent = S.formatNumber(points.length); });
        walks = (loaded[5] && loaded[5].routes) || [];
        cafes = (loaded[6] && loaded[6].places) || [];
        await initMap();
      }
    } catch (e) {
      console.error(e);
      if (grid) grid.innerHTML = '<p class="muted">' + S.escapeHTML(S.t('storiesLoadFail')) + ' <a class="link-arrow" href="' + S.url('stories.html') + '">' + S.t('allStories') + '</a>.</p>';
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
