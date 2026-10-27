(function(){
  'use strict';
  const S = window.Spadchyna;
  let route = null;
  let map = null;
  let layer = null;

  function pointTitle(p){ return S.dataText(p,'title'); }
  function pointText(p){ return S.dataText(p,'text'); }
  function distance(km){
    return new Intl.NumberFormat(S.LOCALE, {maximumFractionDigits:1}).format(km) + (S.LANG === 'en' ? ' km' : ' км');
  }
  function routeItem(p){
    return {
      u:p.u, title:pointTitle(p), lat:p.lat, lon:p.lon,
      region:S.dataText(route,'city'), image:p.image || route.image,
      url:p.url, cur:p.cur || ''
    };
  }
  function yandexWalkingUrl(){
    const coords = route.points.map(p => encodeURIComponent(p.lat + ',' + p.lon)).join('~');
    return 'https://yandex.by/maps/?rtext=' + coords + '&rtt=pd';
  }
  function addAll(){
    if (!route) return;
    let added = 0, exists = 0, full = 0;
    route.points.forEach(p => {
      const result = S.addRoute(routeItem(p));
      if (result.status === 'added') added++;
      else if (result.status === 'exists') exists++;
      else if (result.status === 'full') full++;
    });
    if (added) S.toast(S.t('addedCount', {n:added}), S.url('routes.html'), S.t('routeOpen'));
    else if (full) S.toast(S.t('full', {n:S.MAX_ROUTE}), S.url('routes.html'), S.t('routeOpen'));
    else if (exists) S.toast(S.t('exists'), S.url('routes.html'), S.t('routeOpen'));
  }
  function fitRoute(){
    if (!map || !route) return;
    const latlngs = route.points.map(p => [Number(p.lat), Number(p.lon)]);
    if (latlngs.length === 1) map.setView(latlngs[0], 15);
    else map.fitBounds(L.latLngBounds(latlngs), {padding:[42,42], maxZoom:16});
  }
  function popup(p, index){
    const href = S.url(p.url || ('place.html?u=' + encodeURIComponent(p.u)));
    return '<div class="map-popup__body">' +
      '<div class="map-popup__meta">' + S.t('routePoint', {n:index + 1}) + '</div>' +
      '<h3>' + S.escapeHTML(pointTitle(p)) + '</h3>' +
      '<p>' + S.escapeHTML(pointText(p)) + '</p>' +
      '<a class="map-popup__link" href="' + href + '">' + S.t('openCard') + '</a>' +
    '</div>';
  }
  function drawMap(){
    if (!map || !route) return;
    if (!layer) layer = L.layerGroup().addTo(map);
    layer.clearLayers();
    const geom = route.geometry;
    const foot = route.geometry_source === 'osrm-foot' && geom && geom.type === 'LineString' && geom.coordinates && geom.coordinates.length > 1;
    const latlngs = foot ? geom.coordinates.map(c => [c[1], c[0]]) : route.points.map(p => [Number(p.lat), Number(p.lon)]);
    if (latlngs.length > 1){
      L.polyline(latlngs, {
        color:'#b33a2b', weight:4, opacity:.9, className:'walk-route-line'
      }).addTo(layer);
    }
    route.points.forEach((p, i) => {
      const icon = L.divIcon({
        className:'route-number',
        html:'<span>' + (i + 1) + '</span>',
        iconSize:[30,30], iconAnchor:[15,15]
      });
      const marker = L.marker([Number(p.lat), Number(p.lon)], {icon, title:pointTitle(p)}).addTo(layer);
      marker.bindPopup(popup(p, i), {maxWidth:320, minWidth:280});
    });
    fitRoute();
  }
  async function ensureMap(){
    if (map) return;
    const el = document.getElementById('walk-map');
    if (!el) return;
    try {
      const base = await S.initBaseMap(el, {fit:false, preferCanvas:false, osm:true, tiles:'clear', maxZoom:18});
      map = base.map;
      S.initMapTools(map, {onFit:fitRoute});
      drawMap();
    } catch (e) {
      console.error(e);
      el.innerHTML = '<p class="muted" style="padding:20px">' + S.escapeHTML(S.t('mapLoadFail')) + '</p>';
    }
  }
  function stopHtml(p, i){
    const href = S.url(p.url || ('place.html?u=' + encodeURIComponent(p.u)));
    const attrs = 'data-route-add data-u="' + S.escapeHTML(p.u) + '" data-title="' + S.escapeHTML(pointTitle(p)) + '" data-lat="' + p.lat + '" data-lon="' + p.lon + '" data-region="' + S.escapeHTML(S.dataText(route,'city')) + '" data-image="' + S.escapeHTML(p.image || route.image) + '" data-url="' + S.escapeHTML(p.url) + '" data-cur="' + S.escapeHTML(p.cur || '') + '"';
    return '<li class="walk-stop" id="stop-' + (i + 1) + '">' +
      '<div class="walk-stop__num">' + String(i + 1).padStart(2, '0') + '</div>' +
      '<div class="walk-stop__body">' +
        '<div class="walk-stop__meta"><span>' + S.t('stop') + ' ' + (i + 1) + '</span> · <a href="' + S.escapeHTML(p.source) + '" target="_blank" rel="noopener">' + S.t('source') + '</a></div>' +
        '<h3>' + S.escapeHTML(pointTitle(p)) + '</h3>' +
        '<p>' + S.escapeHTML(pointText(p)) + '</p>' +
        '<div class="walk-stop__actions">' +
          '<button class="btn btn--ghost btn--small" type="button" ' + attrs + '><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg><span>' + S.t('addRoute') + '</span></button>' +
          '<button class="btn btn--ghost btn--small" type="button" data-speak>' + S.t('listen') + '</button>' +
          '<a class="link-arrow" href="' + href + '">' + S.t('openCard') + '</a>' +
        '</div>' +
      '</div>' +
    '</li>';
  }
  function render(){
    const main = document.getElementById('walk-content');
    if (!main || !route) return;
    const title = S.dataText(route,'title');
    const city = S.dataText(route,'city');
    const district = S.dataText(route,'district');
    const duration = S.dataText(route,'duration');
    const summary = S.dataText(route,'summary');
    main.innerHTML =
      '<section class="walk-hero"><div class="container"><div class="walk-hero__grid">' +
        '<div class="walk-hero__copy">' +
          '<a class="walk-back" href="' + S.url('walks.html') + '">← ' + S.t('allWalks') + '</a>' +
          '<div class="kicker">' + S.t('walk') + ' · ' + S.escapeHTML(city) + ' · ' + S.escapeHTML(district) + '</div>' +
          '<h1>' + S.escapeHTML(title) + '</h1>' +
          '<p class="walk-hero__lead">' + S.escapeHTML(summary) + '</p>' +
          '<p class="walk-hero__route"><span>' + S.t('start') + '</span><strong>' + S.escapeHTML(S.dataText(route,'start')) + '</strong><span class="walk-hero__route-arrow">→</span><span>' + S.t('finish') + '</span><strong>' + S.escapeHTML(S.dataText(route,'finish')) + '</strong></p>' +
          '<div class="walk-hero__actions">' +
            '<button class="btn btn--primary" type="button" data-walk-add-all>' + S.t('addWholeWalk') + '</button>' +
            '<a class="btn btn--ghost" href="' + yandexWalkingUrl() + '" target="_blank" rel="noopener">' + S.t('routeInYandex') + '</a>' +
          '</div>' +
          '<div class="walk-hero__meta">' +
            '<span><strong>' + S.escapeHTML(duration) + '</strong> <span>' + S.t('onRoute') + '</span></span>' +
            '<span><strong>' + S.escapeHTML(distance(route.distance_km)) + '</strong> <span>' + S.t('onFoot') + '</span></span>' +
            '<span><strong>' + route.points.length + '</strong> <span>' + S.stopsWord(route.points.length) + '</span></span>' +
            '<span><strong>' + S.escapeHTML(S.dataText(route,'level')) + '</strong> <span>' + S.t('difficulty') + '</span></span>' +
          '</div>' +
        '</div>' +
        '<figure class="walk-hero__media"><img src="' + S.assetUrl(route.image) + '" alt="' + S.escapeHTML(title) + '" data-fallback><figcaption><span>' + S.escapeHTML(city) + ' · ' + S.escapeHTML(district) + '</span><span>' + S.escapeHTML(duration) + '</span></figcaption></figure>' +
      '</div></div></section>' +
      '<section class="walk-body"><div class="container"><div class="walk-layout">' +
        '<div class="walk-map-wrap">' +
          '<div id="walk-map" role="application" aria-label="' + S.escapeHTML(S.t('walkMap')) + '"></div>' +
          '<p class="home-map-note">' + S.escapeHTML(route.geometry_source === 'osrm-foot' ? S.t('routeFootNote') : S.t('routeOrderNote')) + '</p>' +
          '<div class="map-tools" aria-label="' + S.escapeHTML(S.t('wholeRoute')) + '">' +
            '<button type="button" data-map-tool="fit">' + S.t('wholeRoute') + '</button>' +
            '<button type="button" data-map-tool="locate">' + S.t('myLocation') + '</button>' +
            '<button type="button" data-map-tool="zoom-in" aria-label="' + S.escapeHTML(S.t('zoomIn')) + '">+</button>' +
            '<button type="button" data-map-tool="zoom-out" aria-label="' + S.escapeHTML(S.t('zoomOut')) + '">−</button>' +
          '</div>' +
        '</div>' +
        '<aside class="walk-side">' +
          '<div class="walk-side__head"><h2>' + S.t('stopsTitle') + '</h2><span>' + route.points.length + '</span></div>' +
          '<ol class="walk-stops">' + route.points.map(stopHtml).join('') + '</ol>' +
          '<div class="walk-food">' +
            '<div class="kicker">' + S.t('afterWalk') + '</div>' +
            '<h2>' + S.escapeHTML(S.dataText(route.food,'title')) + '</h2>' +
            '<p>' + S.escapeHTML(S.dataText(route.food,'text')) + '</p>' +
            '<a class="btn btn--ghost" href="' + S.escapeHTML(route.food.url) + '" target="_blank" rel="noopener">' + S.t('findInYandex') + '</a>' +
          '</div>' +
          '<p class="walk-source-note">' + S.t('officialDescriptions') + '</p>' +
        '</aside>' +
      '</div></div></section>' +
      '<section class="section section--tight"><div class="container"><div class="walk-bottom"><p>' + S.t('wantRoute') + '</p><a class="link-arrow" href="' + S.url('walks.html') + '">' + S.t('allWalks') + ' <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></div></div></section>';
    S.bindImages(main);
    S.initReveal(main);
    document.title = title + ' — Спадчына';
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', summary + ' ' + S.t('walkMetaSuffix'));
    const addAllBtn = main.querySelector('[data-walk-add-all]');
    if (addAllBtn) addAllBtn.addEventListener('click', addAll);
    ensureMap();
  }
  async function init(){
    const main = document.getElementById('walk-content');
    if (!main) return;
    const slug = new URLSearchParams(location.search).get('slug');
    if (!slug){
      main.innerHTML = '<div class="container text-page"><h1>' + S.t('walkNotChosen') + '</h1><p>' + S.t('backToWalks') + '.</p></div>';
      return;
    }
    try {
      const data = await S.fetchJSON('assets/data/walks.json');
      route = data.routes.find(r => r.slug === slug);
      if (!route) throw new Error('Walk not found');
      render();
    } catch (e) {
      console.error(e);
      main.innerHTML = '<div class="container text-page"><h1>' + S.t('walkNotFound') + '</h1><p>' + S.t('openWalkList') + '</p></div>';
    }
  }
  document.addEventListener('DOMContentLoaded', init);
})();
