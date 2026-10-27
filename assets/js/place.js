(function(){
  'use strict';
  const S = window.Spadchyna;
  const FIELD_LABELS = {
    be: {
      'Шыфр':'Шыфр', 'Катэгорыя каштоўнасці':'Катэгорыя каштоўнасці', 'Глава':'Глава',
      'Тып каштоўнасці':'Тып каштоўнасці', 'Падтып каштоўнасці':'Падтып каштоўнасці',
      'Месца знаходжання':'Месца знаходжання', 'Датаванне':'Датаванне'
    },
    ru: {
      'Шыфр':'Шифр', 'Катэгорыя каштоўнасці':'Категория ценности', 'Глава':'Глава',
      'Тып каштоўнасці':'Тип ценности', 'Падтып каштоўнасці':'Подтип ценности',
      'Месца знаходжання':'Место нахождения', 'Датаванне':'Датировка'
    },
    en: {
      'Шыфр':'Reference code', 'Катэгорыя каштоўнасці':'Value category', 'Глава':'Chapter',
      'Тып каштоўнасці':'Value type', 'Падтып каштоўнасці':'Value subtype',
      'Месца знаходжання':'Location', 'Датаванне':'Dating'
    }
  }[S.LANG];
  function fnvBucket(value){
    let h = 2166136261;
    const bytes = new TextEncoder().encode(String(value));
    for (const b of bytes){ h ^= b; h = Math.imul(h, 16777619) >>> 0; }
    return String(h % 64).padStart(2,'0');
  }
  function hasCoords(p){
    return p.lat != null && p.lon != null && Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lon));
  }
  function routeAttrs(p){
    const region = S.regionName(p.r);
    const url = 'place.html?u=' + encodeURIComponent(p.u);
    return 'data-route-add data-u="' + S.escapeHTML(p.u) + '" data-title="' + S.escapeHTML(p.t) + '" data-lat="' + p.lat + '" data-lon="' + p.lon + '" data-region="' + S.escapeHTML(region) + '" data-image="' + S.escapeHTML(p.p || '') + '" data-url="' + S.escapeHTML(url) + '" data-cur=""' + (hasCoords(p) ? '' : ' disabled title="' + S.escapeHTML(S.t('coordsUnknown')) + '"');
  }
  function detailsTable(fields){
    const entries = Object.entries(fields || {});
    if (!entries.length) return '';
    return '<table class="detail-table"><tbody>' + entries.map(([k,v]) =>
      '<tr><th>' + S.escapeHTML(FIELD_LABELS[k] || k) + '</th><td>' + S.escapeHTML(v) + '</td></tr>'
    ).join('') + '</tbody></table>';
  }
  function relatedCard(p){
    const href = S.placeUrl(p);
    return '<article class="related-card">' +
      '<a href="' + href + '"><img src="' + S.imageUrl(p) + '" alt="' + S.escapeHTML(p.t) + '" loading="lazy" data-fallback></a>' +
      '<h3><a href="' + href + '">' + S.escapeHTML(p.t) + '</a></h3>' +
      '<p>' + S.escapeHTML(S.regionName(p.r)) + '</p>' +
    '</article>';
  }
  function render(p, details, all){
    const fixed = S.fixCoords(p.lat, p.lon);
    if (fixed){ p.lat = fixed.lat; p.lon = fixed.lon; }
    else { p.lat = null; p.lon = null; }
    const title = p.t || S.t('unnamed');
    document.title = title + ' — Спадчына';
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', S.t('placeMeta', {title}));
    const region = S.regionName(p.r);
    const kind = S.groupLabel(p.g);
    const hero = p.i ? S.assetUrl(p.i) : S.imageUrl(p);
    const official = p.d || ('https://heritage.gov.by/be/catalog/' + p.u);
    const paras = (details && details.paras) || [];
    const fields = (details && details.fields) || {};
    const translationBlock = (S.LANG !== 'be' && paras.length)
      ? '<div class="aside-block"><h2>' + S.t('translation') + '</h2><div class="aside-actions">' +
          '<button class="btn btn--ghost btn--small" type="button" data-translate="place-prose">' + S.t('translate') + '</button>' +
          '<p class="translate-status" data-translate-status hidden></p>' +
        '</div><p class="aside-source">' + S.t('translationNote') + '</p></div>'
      : '';
    const related = all.filter(x => x.u !== p.u && x.r === p.r && x.g === p.g && x.lat && x.lon && !x.cur).slice(0,3);
    const main = document.getElementById('place-content');
    if (!main) return;
    main.innerHTML =
      '<section class="place-hero"><div class="container"><div class="place-hero__grid">' +
        '<div class="place-hero__copy">' +
          '<a class="place-hero__back" href="' + S.url('places.html') + '">' + S.t('placeBack') + '</a>' +
          '<div class="kicker">' + S.escapeHTML(kind) + ' · ' + S.escapeHTML(region) + '</div>' +
          '<h1>' + S.escapeHTML(title) + '</h1>' +
          '<p class="place-hero__sub">' + S.escapeHTML(kind) + '</p>' +
          '<div class="place-hero__meta"><span>' + S.escapeHTML(p.a || S.t('addressUnknown')) + '</span>' + (p.code ? '<span>' + S.t('code') + ': ' + S.escapeHTML(p.code) + '</span>' : '') + (p.c ? '<span>' + S.escapeHTML(p.c) + '</span>' : '') + '</div>' +
        '</div>' +
        '<figure class="place-hero__media">' +
          '<img src="' + hero + '" alt="' + S.escapeHTML(title) + '" data-fallback>' +
          '<figcaption><span><a href="' + official + '" target="_blank" rel="noopener">' + S.t('imageCredit') + '</a></span><span>' + S.escapeHTML(p.code || '') + '</span></figcaption>' +
        '</figure>' +
      '</div></div></section>' +
      '<div class="container"><div class="article-layout">' +
        '<aside class="article-aside"><div class="article-aside__inner">' +
          '<div class="aside-block"><h2>' + S.t('brief') + '</h2><dl class="facts">' +
            '<div><dt>' + S.t('region') + '</dt><dd>' + S.escapeHTML(region) + '</dd></div>' +
            '<div><dt>' + S.t('type') + '</dt><dd>' + S.escapeHTML(kind) + '</dd></div>' +
            '<div><dt>' + S.t('category') + '</dt><dd>' + S.escapeHTML(p.c || S.t('stateList')) + '</dd></div>' +
            '<div><dt>' + S.t('code') + '</dt><dd>' + S.escapeHTML(p.code || '—') + '</dd></div>' +
          '</dl></div>' +
          '<div class="aside-block"><h2>' + S.t('actions') + '</h2><div class="aside-actions">' +
            '<button class="btn btn--primary" type="button" ' + routeAttrs(p) + '><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>' + S.t('addRoute') + '</button>' +
            '<button class="btn btn--ghost" type="button" data-speak>' + S.t('listen') + '</button>' +
            (hasCoords(p) ? '<a class="btn btn--ghost" href="' + S.url('map.html?u=' + encodeURIComponent(p.u)) + '">' + S.t('onMap') + '</a>' : '') +
            '<a class="btn btn--ghost" href="' + official + '" target="_blank" rel="noopener">' + S.t('officialPage') + '</a>' +
          '</div></div>' +
          translationBlock +
          '<div class="aside-block"><h2>' + S.t('sourceTitle') + '</h2><p class="aside-source">' + S.t('officialSourceNote') + ' <a href="' + official + '" target="_blank" rel="noopener">' + S.t('officialCard') + '</a>.</p></div>' +
        '</div></aside>' +
        '<article class="prose" id="place-prose">' +
          '<p class="article-lead">' + S.escapeHTML(S.t('placeLead', {title, kind: kind.toLowerCase(), region: region.toLowerCase()})) + '</p>' +
          (paras.length ? paras.map(x => '<p data-origin="' + S.escapeHTML(x) + '">' + S.escapeHTML(x) + '</p>').join('') : '<div class="place-note"><strong>' + S.t('descriptionPending') + '</strong> ' + S.t('descriptionPendingText') + ' <a href="' + official + '" target="_blank" rel="noopener">' + S.t('officialCard') + '</a>.</div>') +
          (detailsTable(fields)) +
          '<div class="article-sources"><h2>' + S.t('officialData') + '</h2><ul><li><a href="' + official + '" target="_blank" rel="noopener">' + S.t('officialCard') + '</a></li>' + (p.code ? '<li>' + S.t('code') + ': ' + S.escapeHTML(p.code) + '</li>' : '') + '<li>' + S.t('nameAddress') + '</li></ul></div>' +
        '</article>' +
      '</div></div>' +
      (related.length ? '<section class="related"><div class="container"><h2>' + S.t('related') + '</h2><div class="related-grid">' + related.map(relatedCard).join('') + '</div></div></section>' : '');
    S.bindImages(main);
  }
  async function init(){
    const params = new URLSearchParams(location.search);
    const u = params.get('u');
    if (!u){
      const main = document.getElementById('place-content');
      if (main) main.innerHTML = '<div class="container text-page"><h1>' + S.t('objectNotChosen') + '</h1><p>' + S.t('backToCatalog') + '.</p></div>';
      return;
    }
    try {
      const curated = await S.fetchJSON('assets/data/curated.json');
      const byCatalog = new Map(curated.filter(x => x.catalog).map(x => [x.catalog, x.slug]));
      if (byCatalog.has(u)){ location.replace(S.url('place/' + byCatalog.get(u) + '.html')); return; }
      if (u.startsWith('curated:')){ location.replace(S.url('place/' + u.slice(8) + '.html')); return; }
      const all = await S.fetchJSON('assets/data/catalog.json');
      const p = all.find(x => x.u === u);
      if (!p) throw new Error('Object not found');
      if (p.cur){ location.replace(S.url('place/' + p.cur + '.html')); return; }
      let details = null;
      try {
        const bucket = await S.fetchJSON('assets/data/details/' + fnvBucket(u) + '.json');
        details = bucket[u] || null;
      } catch (e) { console.warn('details bucket unavailable', e); }
      render(p, details, all);
    } catch (e) {
      console.error(e);
      const main = document.getElementById('place-content');
      if (main) main.innerHTML = '<div class="container text-page"><h1>' + S.t('objectNotFound') + '</h1><p>' + S.t('linkOutdated') + '</p></div>';
    }
  }
  document.addEventListener('DOMContentLoaded', init);
})();
