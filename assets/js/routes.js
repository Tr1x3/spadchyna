(function(){
  'use strict';
  const S = window.Spadchyna;
  let map, points = [], curated = [], i18n = {}, curatedBySlug = new Map(), routeLayer, allRouteLayer;
  let results = [];

  function canonicalUrl(p){
    const slug = S.curatedSlug(p);
    return slug ? 'place/' + slug + '.html' : 'place.html?u=' + encodeURIComponent(p.u);
  }
  function pointTitle(p){
    const slug = S.curatedSlug(p);
    const story = slug ? curatedBySlug.get(slug) : null;
    return story ? S.curatedText(story,'title',i18n) : (p.t || '');
  }
  function pointRegion(p){
    const slug = S.curatedSlug(p);
    const story = slug ? curatedBySlug.get(slug) : null;
    return S.regionName(story ? story.regionKey : p.r);
  }
  function itemFromPoint(p){
    return {
      u:p.u, title:pointTitle(p), lat:p.lat, lon:p.lon,
      region:pointRegion(p), image:p.p || '', url:canonicalUrl(p), cur:p.cur || ''
    };
  }
  function renderMap(items){
    if (!map) return;
    if (routeLayer) map.removeLayer(routeLayer);
    routeLayer = L.layerGroup().addTo(map);
    if (!items.length){ map.fitBounds([[51.15,23.0],[56.3,32.9]], {padding:[16,16]}); return; }
    const latlngs = items.map(x => [Number(x.lat), Number(x.lon)]);
    if (latlngs.length > 1){
      L.polyline(latlngs, {color:'#b33a2b', weight:2.5, opacity:0.85, dashArray:'7 5'}).addTo(routeLayer);
    }
    items.forEach((item, i) => {
      const icon = L.divIcon({
        className:'route-number',
        html:'<span>' + (i + 1) + '</span>',
        iconSize:[28,28], iconAnchor:[14,14]
      });
      const m = L.marker([Number(item.lat), Number(item.lon)], {icon, title:item.title}).addTo(routeLayer);
      const href = S.url(item.url || ('place.html?u=' + encodeURIComponent(item.u)));
      m.bindPopup('<div class="map-popup__body"><div class="map-popup__meta">' + S.t('routePoint', {n:i + 1}) + '</div><h3>' + S.escapeHTML(item.title) + '</h3><p>' + S.escapeHTML(item.region || '') + '</p><a class="map-popup__link" href="' + href + '">' + S.t('routeOpenCard') + '</a></div>');
    });
    if (latlngs.length === 1) map.setView(latlngs[0], 9);
    else map.fitBounds(L.latLngBounds(latlngs), {padding:[40,40], maxZoom:10});
  }
  function renderList(items){
    const list = document.getElementById('route-list');
    const empty = document.getElementById('route-empty');
    const summary = document.getElementById('route-summary');
    const links = document.getElementById('route-links');
    if (!list) return;
    if (empty) empty.hidden = items.length !== 0;
    if (summary) summary.hidden = items.length === 0;
    if (links) links.hidden = items.length === 0;
    if (!items.length){
      list.innerHTML = '';
      return;
    }
    list.innerHTML = items.map((item, i) => {
      const href = S.url(item.url || ('place.html?u=' + encodeURIComponent(item.u)));
      return '<div class="route-item">' +
        '<div class="route-item__num">' + (i + 1) + '</div>' +
        '<div><h3><a href="' + href + '">' + S.escapeHTML(item.title) + '</a></h3><p>' + S.escapeHTML(item.region || '') + '</p></div>' +
        '<div class="route-item__actions">' +
          '<button type="button" data-move="-1" data-u="' + S.escapeHTML(item.u) + '" aria-label="' + S.t('moveUp') + '" title="' + S.t('moveUp') + '"' + (i === 0 ? ' disabled' : '') + '><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg></button>' +
          '<button type="button" data-move="1" data-u="' + S.escapeHTML(item.u) + '" aria-label="' + S.t('moveDown') + '" title="' + S.t('moveDown') + '"' + (i === items.length - 1 ? ' disabled' : '') + '><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>' +
          '<button type="button" data-remove="' + S.escapeHTML(item.u) + '" aria-label="' + S.t('remove') + '" title="' + S.t('remove') + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>' +
        '</div>' +
      '</div>';
    }).join('');
    const distance = S.routeDistance(items);
    const distanceEl = document.getElementById('route-distance');
    const countEl = document.getElementById('route-points');
    if (distanceEl) distanceEl.textContent = items.length > 1 ? S.formatDistance(distance) : '—';
    if (countEl) countEl.textContent = String(items.length);
    const routeLinks = S.routeLinks(items);
    if (links && routeLinks){
      const google = document.getElementById('route-google');
      const yandex = document.getElementById('route-yandex');
      const osm = document.getElementById('route-osm');
      if (google) google.href = routeLinks.google;
      if (yandex) yandex.href = routeLinks.yandex;
      if (osm) osm.href = routeLinks.osm;
    }
  }
  function render(){
    const items = S.routeItems();
    renderList(items);
    renderMap(items);
    renderSearch(document.getElementById('route-search-input') ? document.getElementById('route-search-input').value : '');
  }
  function renderSearch(query){
    const box = document.getElementById('route-results');
    if (!box) return;
    const q = String(query || '').trim().toLowerCase().replace(/ё/g,'е');
    if (!q){ box.classList.remove('is-open'); box.innerHTML = ''; return; }
    const chosen = new Set(S.routeItems().map(x => x.u));
    results = points.filter(p => !chosen.has(p.u) && [pointTitle(p), pointRegion(p), S.groupLabel(p.g)].join(' ').toLowerCase().replace(/ё/g,'е').includes(q)).slice(0,10);
    box.innerHTML = results.length ? results.map(p => {
      const slug = S.curatedSlug(p);
      return '<button class="route-result" type="button" data-add-u="' + S.escapeHTML(p.u) + '">' +
        '<span><strong>' + S.escapeHTML(pointTitle(p)) + '</strong><span>' + S.escapeHTML(pointRegion(p)) + (slug ? ' · ' + S.t('storyProjectShort') : '') + '</span></span>' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>' +
      '</button>';
    }).join('') : '<div class="route-empty" style="padding:14px">' + S.escapeHTML(S.t('nothingFound')) + '</div>';
    box.classList.add('is-open');
  }
  function bind(){
    const input = document.getElementById('route-search-input');
    const box = document.getElementById('route-results');
    const clear = document.getElementById('route-clear');
    if (input) input.addEventListener('input', S.debounce(() => renderSearch(input.value), 180));
    if (box) box.addEventListener('click', e => {
      const btn = e.target.closest('[data-add-u]');
      if (!btn) return;
      const p = points.find(x => x.u === btn.dataset.addU);
      if (!p) return;
      const result = S.addRoute(itemFromPoint(p));
      if (result.status === 'added') S.toast(result.message, S.url('routes.html'), S.t('routeOpen'));
      else S.toast(result.message);
      input.value = ''; box.classList.remove('is-open');
      render();
    });
    document.addEventListener('click', e => {
      if (box && input && !box.contains(e.target) && e.target !== input) box.classList.remove('is-open');
    });
    const list = document.getElementById('route-list');
    if (list) list.addEventListener('click', e => {
      const move = e.target.closest('[data-move]');
      const remove = e.target.closest('[data-remove]');
      if (move){ S.moveRoute(move.dataset.u, Number(move.dataset.move)); render(); }
      if (remove){ S.removeRoute(remove.dataset.u); render(); }
    });
    if (clear) clear.addEventListener('click', () => { S.clearRoute(); render(); });
    document.addEventListener('spadchyna:route', render);
  }
  async function init(){
    const el = document.getElementById('route-map');
    if (!el) return;
    const base = await S.initBaseMap(el, {fit:false});
    map = base.map;
    S.initMapTools(map, {onFit: () => {
      const items = S.routeItems();
      if (items.length === 1) map.setView([Number(items[0].lat), Number(items[0].lon)], 12);
      else if (items.length > 1) map.fitBounds(L.latLngBounds(items.map(x => [Number(x.lat), Number(x.lon)])), {padding:[40,40], maxZoom:11});
      else map.fitBounds([[51.15,23.0],[56.3,32.9]], {padding:[18,18]});
    }});
    allRouteLayer = L.layerGroup().addTo(map);
    routeLayer = L.layerGroup().addTo(map);
    try {
      const [data, cur, tr, border] = await Promise.all([
        S.fetchJSON('assets/data/map_points.json'),
        S.fetchJSON('assets/data/curated.json'),
        S.fetchJSON('assets/data/curated_i18n.json'),
        S.fetchJSON('assets/data/belarus.json').catch(() => null)
      ]);
      points = S.locatePoints(S.unpack(data)).filter(p => S.insideCountry(p.lat, p.lon, border));
      curated = cur;
      i18n = tr;
      curatedBySlug = new Map(curated.map(x => [x.slug, x]));
      points.forEach(p => {
        if (p.lat == null || p.lon == null) return;
        L.circleMarker([Number(p.lat), Number(p.lon)], {
          radius:1.6, stroke:false, fillColor:'#8f8676', fillOpacity:.38, interactive:false
        }).addTo(allRouteLayer);
      });
      bind();
      render();
    } catch (e) {
      console.error(e);
      S.toast(S.t('routeLoadFail'));
    }
  }
  document.addEventListener('DOMContentLoaded', init);
})();
