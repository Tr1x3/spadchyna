(function(){
  'use strict';
  const rawBase = document.body ? (document.body.dataset.base || './') : './';
  const rawAssets = document.body ? (document.body.dataset.assets || rawBase) : rawBase;
  const BASE = rawBase.endsWith('/') ? rawBase : rawBase + '/';
  const ASSETS = rawAssets.endsWith('/') ? rawAssets : rawAssets + '/';
  const STORAGE_KEY = 'spadchyna_route_v1';
  const MAX_ROUTE = 12;
  const SUPPORTED = ['be','ru','en'];
  const htmlLang = String(document.documentElement.lang || '').toLowerCase().slice(0, 2);
  const pathLang = /\/be(\/|$)/.test(location.pathname) ? 'be' : /\/en(\/|$)/.test(location.pathname) ? 'en' : '';
  const LANG = SUPPORTED.includes(htmlLang) ? htmlLang : (SUPPORTED.includes(pathLang) ? pathLang : 'ru');
  const LOCALE = {be:'be-BY', ru:'ru-RU', en:'en-GB'}[LANG];
  const REGIONS = {
    be:{BrestRegion:'Брэсцкая вобласць',VitebskRegion:'Віцебская вобласць',GomelRegion:'Гомельская вобласць',GrodnoRegion:'Гродзенская вобласць',MinskRegion:'Мінская вобласць',MogilevRegion:'Магілёўская вобласць',Minsk:'г. Мінск'},
    ru:{BrestRegion:'Брестская область',VitebskRegion:'Витебская область',GomelRegion:'Гомельская область',GrodnoRegion:'Гродненская область',MinskRegion:'Минская область',MogilevRegion:'Могилёвская область',Minsk:'г. Минск'},
    en:{BrestRegion:'Brest Region',VitebskRegion:'Vitebsk Region',GomelRegion:'Gomel Region',GrodnoRegion:'Grodno Region',MinskRegion:'Minsk Region',MogilevRegion:'Mogilev Region',Minsk:'Minsk City'}
  }[LANG];
  const GROUPS = {
    be:{architecture:'Архітэктура',archaeology:'Археалогія',history:'Гісторыя',urban:'Горадабудаўніцтва',art:'Мастацтва',reserve:'Запаведнае месца',other:'Іншае',curated:'Гісторыі праекта'},
    ru:{architecture:'Архитектура',archaeology:'Археология',history:'История',urban:'Градостроительство',art:'Искусство',reserve:'Заповедное место',other:'Другое',curated:'Истории проекта'},
    en:{architecture:'Architecture',archaeology:'Archaeology',history:'History',urban:'Urban planning',art:'Art',reserve:'Protected area',other:'Other',curated:'Project stories'}
  }[LANG];
  const THEMES = {
    be:{architecture:'Архітэктура',archaeology:'Археалогія',history:'Гісторыя',urban:'Горадабудаўніцтва',art:'Мастацтва',reserve:'Запаведнае',other:'Іншае',curated:'Гісторыі праекта'},
    ru:{architecture:'Архитектура',archaeology:'Археология',history:'История',urban:'Градостроительство',art:'Искусство',reserve:'Заповедное',other:'Другое',curated:'Истории проекта'},
    en:{architecture:'Architecture',archaeology:'Archaeology',history:'History',urban:'Urban planning',art:'Art',reserve:'Protected area',other:'Other',curated:'Project stories'}
  }[LANG];
  const TYPES = {
    be:{'Мемориал':'Мемарыял','Крепость':'Крэпасць','Замок':'Замак','Дворец':'Палац','Собор':'Сабор','Церковь':'Царква','Башня':'Вежа'},
    ru:{'Мемориал':'Мемориал','Крепость':'Крепость','Замок':'Замок','Дворец':'Дворец','Собор':'Собор','Церковь':'Церковь','Башня':'Башня'},
    en:{'Мемориал':'Memorial','Крепость':'Fortress','Замок':'Castle','Дворец':'Palace','Собор':'Cathedral','Церковь':'Church','Башня':'Tower'}
  }[LANG];
  const UI = {
    be:{
      open:'Адкрыць', read:'Чытаць', addRoute:'У маршрут', added:'Дададзена ў маршрут', addedCount:'Дададзена кропак: {n}', exists:'Ужо ў маршруце', full:'У маршруце не больш за {n} кропак', addError:'Не ўдалося дадаць кропку', noCoords:'У кропкі няма каардынат', unnamed:'Без назвы',
      loadError:'Не ўдалося загрузіць {url} ({status})', routeOpen:'Адкрыць',
      geolocationUnsupported:'Геалакацыя не падтрымліваецца браўзэрам', geolocationSearch:'Вызначаем месцазнаходжанне…', geolocationHere:'Вы тут', geolocationDone:'Кропка на карце — ваша месцазнаходжанне', geolocationFail:'Не ўдалося вызначыць месцазнаходжанне', fullscreenFail:'Поўнаэкранны рэжым недаступны',
      allBelarus:'Уся Беларусь', allTypes:'Усе тыпы', allRegions:'Усе вобласці', allStories:'Усе гісторыі', onlyStories:'Толькі гісторыі', resetFilters:'Скінуць фільтры', reset:'Скінуць',
      projectStory:'Гісторыя праекта', officialObject:'Афіцыйны аб’ект Дзяржаўнага спісу', stateList:'Дзяржаўны спіс', openCard:'Адкрыць картку', story:'Гісторыя', addressUnknown:'Адрас удакладняецца', coordsUnknown:'Каардынаты ўдакладняюцца',
      mapOn:'На карце', noStoriesInFilter:'У гэтай выбарцы няма гісторый праекта. Скіньце фільтр або адкрыйце каталог.', catalogCount:'У афіцыйным каталозе: <strong>{n}</strong> аб’ектаў. <a href="{href}">Адкрыць каталог</a>',
      storyProjectShort:'гісторыя праекта', nothingFound:'Нічога не знойдзена. Паспрабуйце назву месца або вобласць.', routePoint:'Кропка {n}', routeOpenCard:'Адкрыць картку',
      stop:'Прыпынак', source:'крыніца', addWholeWalk:'Дадаць усю прагулку', routeInYandex:'Маршрут у Яндекс Картах', onRoute:'на маршруце', onFoot:'пешшу', stops:'прыпынкі', difficulty:'складанасць', wholeRoute:'Увесь маршрут', myLocation:'Маё месца', zoomIn:'Наблізіць', zoomOut:'Аддаліць', mapLoadFail:'Не ўдалося загрузіць карту. Усе кропкі пералічаны ніжэй.', allWalks:'Усе прагулкі', walk:'Прагулка', start:'Старт: ', finish:'Фініш: ', openWalk:'Прайсці', afterWalk:'Пасля прагулкі', findInYandex:'Знайсці ў Яндекс Картах', officialDescriptions:'Афіцыйныя апісанні прыводзяцца на мове крыніцы (пераважна беларуская мова). Беларуская, руская і англійская версіі — адаптаваны пераклад па даных Дзяржаўнага спісу; спасылкі вядуць на зыходныя карткі.', wantRoute:'Хочаце прайсці некалькі месцаў запар? Дадайце прыпынкі ў асабісты маршрут — ён захаваецца ў браўзеры.',
      walkNotFound:'Прагулка не знойдзена', walkNotChosen:'Прагулка не абраная', backToWalks:'Вярніцеся да спісу прагулак', openWalkList:'Адкрыйце спіс прагулак і абярыце маршрут.',
      filterAll:'Усе прагулкі', filter1h:'1 гадзіна', filter15h:'1,5 гадзіны', filter2h:'2 гадзіны', walksLoadFail:'Не ўдалося загрузіць прагулкі. Абнавіце старонку або адкрыйце спіс прагулак.', walkStops:'прыпынкаў', stopsTitle:'Прыпынкі', walkMap:'Карта прагулкі', walkMetaSuffix:'Афіцыйныя крыніцы, карта і прыпынкі.',
      searchRoutePlaceholder:'Пачніце ўводзіць назву…', addPlace:'Дадаць месца', routeEmptyStrong:'Маршрут пакуль пусты.', routeEmptyText:'Знайдзіце месца ў пошуку вышэй або дадайце яго з карткі аб’екта.', points:'Кропак', straightDistance:'Адлегласць па прамой', routeSummaryNote:'Гэта арыенціровачная адлегласць паміж кропкамі, а не дарожны маршрут. Знешнія сэрвісы пабудуюць аўтамабільны маршрут самастойна.', clear:'Ачысціць', moveUp:'Вышэй', moveDown:'Ніжэй', remove:'Выдаліць', routeLoadFail:'Не ўдалося загрузіць кропкі для маршрута', routeHelp:'Маршрут захоўваецца толькі ў гэтым браўзеры (localStorage). Стрэлкі мяняюць парадак кропак, × выдаляе кропку. Знешнія карты могуць абмяжоўваць колькасць прамежкавых кропак; пры неабходнасці разбіце маршрут на часткі.',
      officialCatalog:'Афіцыйны каталог', placeBack:'← Афіцыйны каталог', objectNotChosen:'Аб’ект не абраны', backToCatalog:'Вярніцеся ў каталог або адкрыйце карту', objectNotFound:'Аб’ект не знойдзены', linkOutdated:'Магчыма, спасылка састарэла. Адкрыйце афіцыйны каталог і абярыце аб’ект зноў.', brief:'Каротка', region:'Вобласць', type:'Тып', category:'Катэгорыя', code:'Шыфр', actions:'Дзеянні', onMap:'На карце', officialPage:'Афіцыйная старонка', sourceTitle:'Крыніца', officialData:'Афіцыйныя даныя', translation:'Пераклад', toRussian:'На рускую', toEnglish:'English', translationNote:'Аўтаматычны пераклад з беларускай у гэтай картцы. Афіцыйны тэкст застаецца на мове крыніцы.', listen:'Слухаць', listenFail:'Агучванне недаступнае ў гэтым браўзеры', translate:'Перакласці', translating:'Перакладаю…', showOriginal:'Паказаць арыгінал', translateFail:'Не ўдалося перакласці. Тэкст пакінуты на беларускай.', eraAll:'Усе', eraFormer:'Ранейшыя эпохі', eraSoviet:'Савецкі перыяд', eraModern:'Сучаснасць', more:'Падрабязней', cafes:'Кавярні', filterTo1h:'Да 1 гадзіны', filter1to2:'1–2 гадзіны', filterLonger:'Даўжэй', routeFootNote:'Пешаходная лінія пабудавана сэрвісам OSRM.', routeOrderNote:'Лінія злучае прыпынкі па парадку. Гэта не інструментальная здымка маршруту.', walkNone:'Прагулка не выбрана', imageCredit:'Выява: heritage.gov.by', related:'Яшчэ побач', placeLead:'{title} — аб’ект {kind} у {region}. Картка сабрана па даных афіцыйнага каталога heritage.gov.by.', descriptionPending:'Апісанне рыхтуецца.', descriptionPendingText:'У афіцыйным каталозе ў гэтага аб’екта пакуль няма тэкставага апісання, даступнага для аўтаматычнай загрузкі. Ніжэй прыведзены правераныя палі карткі; поўны тэкст — на афіцыйнай старонцы.', officialCard:'Картка аб’екта на heritage.gov.by', nameAddress:'Назва і адрас: Дзяржаўны спіс гісторыка-культурных каштоўнасцей.', officialSourceNote:'Апісанне і выява — Дзяржаўны спіс гісторыка-культурных каштоўнасцей Рэспублікі Беларусь. Тэкст апісання прыведзены на мове арыгінала.', selectPlace:'Аб’ект не абраны', selectPlaceText:'Вярніцеся ў каталог або адкрыйце карту.', storiesLoadFail:'Не ўдалося загрузіць гісторыі. Абнавіце старонку.', catalogLoadFail:'Не ўдалося загрузіць каталог. Абнавіце старонку.', placeMeta:'Афіцыйная картка аб’екта Дзяржаўнага спісу гісторыка-культурных каштоўнасцей Беларусі: {title}.'
    },
    ru:{
      open:'Открыть', read:'Читать', addRoute:'В маршрут', added:'Добавлено в маршрут', addedCount:'Добавлено точек: {n}', exists:'Уже в маршруте', full:'В маршруте не больше {n} точек', addError:'Не удалось добавить точку', noCoords:'У точки нет координат', unnamed:'Без названия',
      loadError:'Не удалось загрузить {url} ({status})', routeOpen:'Открыть',
      geolocationUnsupported:'Геолокация не поддерживается браузером', geolocationSearch:'Определяем местоположение…', geolocationHere:'Вы здесь', geolocationDone:'Точка на карте — ваше местоположение', geolocationFail:'Не удалось определить местоположение', fullscreenFail:'Полноэкранный режим недоступен',
      allBelarus:'Вся Беларусь', allTypes:'Все типы', allRegions:'Все области', allStories:'Все истории', onlyStories:'Только истории', resetFilters:'Сбросить фильтры', reset:'Сбросить',
      projectStory:'История проекта', officialObject:'Официальный объект Государственного списка', stateList:'Государственный список', openCard:'Открыть карточку', story:'История', addressUnknown:'Адрес уточняется', coordsUnknown:'Координаты уточняются',
      mapOn:'На карте', noStoriesInFilter:'В этой выборке нет историй проекта. Сбросьте фильтр или откройте каталог.', catalogCount:'В официальном каталоге: <strong>{n}</strong> объектов. <a href="{href}">Открыть каталог</a>',
      storyProjectShort:'история проекта', nothingFound:'Ничего не найдено. Попробуйте название места или область.', routePoint:'Точка {n}', routeOpenCard:'Открыть карточку',
      stop:'Остановка', source:'источник', addWholeWalk:'Добавить всю прогулку', routeInYandex:'Маршрут в Яндекс Картах', onRoute:'на маршруте', onFoot:'пешком', stops:'остановки', difficulty:'сложность', wholeRoute:'Весь маршрут', myLocation:'Моё место', zoomIn:'Приблизить', zoomOut:'Отдалить', mapLoadFail:'Не удалось загрузить карту. Все точки перечислены ниже.', allWalks:'Все прогулки', walk:'Прогулка', start:'Старт: ', finish:'Финиш: ', openWalk:'Пройти', afterWalk:'После прогулки', findInYandex:'Найти в Яндекс Картах', officialDescriptions:'Официальные описания приводятся на языке источника (преимущественно беларуская мова). Русская и английская версии — адаптированный перевод по данным Государственного списка; ссылки ведут на исходные карточки.', wantRoute:'Хотите пройти несколько мест подряд? Добавьте остановки в личный маршрут — он сохранится в браузере.',
      walkNotFound:'Прогулка не найдена', walkNotChosen:'Прогулка не выбрана', backToWalks:'Вернитесь к списку прогулок', openWalkList:'Откройте список прогулок и выберите маршрут.',
      filterAll:'Все прогулки', filter1h:'1 час', filter15h:'1,5 часа', filter2h:'2 часа', walksLoadFail:'Не удалось загрузить прогулки. Обновите страницу или откройте список прогулок.', walkStops:'остановок', stopsTitle:'Остановки', walkMap:'Карта прогулки', walkMetaSuffix:'Официальные источники, карта и остановки.',
      searchRoutePlaceholder:'Начните вводить название…', addPlace:'Добавить место', routeEmptyStrong:'Маршрут пока пуст.', routeEmptyText:'Найдите место в поиске выше или добавьте его из карточки объекта.', points:'Точек', straightDistance:'Расстояние по прямой', routeSummaryNote:'Это ориентировочное расстояние между точками, а не дорожный маршрут. Внешние сервисы построят автомобильный маршрут самостоятельно.', clear:'Очистить', moveUp:'Выше', moveDown:'Ниже', remove:'Удалить', routeLoadFail:'Не удалось загрузить точки для маршрута', routeHelp:'Маршрут хранится только в этом браузере (localStorage). Стрелки меняют порядок точек, × удаляет точку. Внешние карты могут ограничивать число промежуточных точек; при необходимости разбейте маршрут на части.',
      officialCatalog:'Официальный каталог', placeBack:'← Официальный каталог', objectNotChosen:'Объект не выбран', backToCatalog:'Вернитесь в каталог или откройте карту', objectNotFound:'Объект не найден', linkOutdated:'Возможно, ссылка устарела. Откройте официальный каталог и выберите объект заново.', brief:'Коротко', region:'Область', type:'Тип', category:'Категория', code:'Шифр', actions:'Действия', onMap:'На карте', officialPage:'Официальная страница', sourceTitle:'Источник', officialData:'Официальные данные', translation:'Перевод', toRussian:'На русский', toEnglish:'English', translationNote:'Автоматический перевод с белорусского прямо в карточке. Официальный текст остаётся на языке источника.', listen:'Слушать', listenFail:'Озвучивание недоступно в этом браузере', translate:'Перевести', translating:'Перевожу…', showOriginal:'Показать оригинал', translateFail:'Не удалось перевести. Текст оставлен на белорусском.', eraAll:'Все', eraFormer:'Прежние эпохи', eraSoviet:'Советский период', eraModern:'Современность', more:'Подробнее', cafes:'Кафе', filterTo1h:'До 1 часа', filter1to2:'1–2 часа', filterLonger:'Дольше', routeFootNote:'Пешеходная линия построена сервисом OSRM.', routeOrderNote:'Линия соединяет остановки по порядку. Это не инструментальная съёмка маршрута.', walkNone:'Прогулка не выбрана', imageCredit:'Изображение: heritage.gov.by', related:'Ещё рядом', placeLead:'{title} — объект {kind} в {region}. Карточка собрана по данным официального каталога heritage.gov.by.', descriptionPending:'Описание готовится.', descriptionPendingText:'В официальном каталоге у этого объекта пока нет текстового описания, доступного для автоматической загрузки. Ниже приведены проверенные поля карточки; полный текст — на официальной странице.', officialCard:'Карточка объекта на heritage.gov.by', nameAddress:'Название и адрес: Государственный список историко-культурных ценностей.', officialSourceNote:'Описание и изображение — Государственный список историко-культурных ценностей Республики Беларусь. Текст описания приведён на языке оригинала.', selectPlace:'Объект не выбран', selectPlaceText:'Вернитесь в каталог или откройте карту.', storiesLoadFail:'Не удалось загрузить истории. Обновите страницу.', catalogLoadFail:'Не удалось загрузить каталог. Обновите страницу.', placeMeta:'Официальная карточка объекта Государственного списка историко-культурных ценностей Беларуси: {title}.'
    },
    en:{
      open:'Open', read:'Read', addRoute:'Add to route', added:'Added to the route', addedCount:'Stops added: {n}', exists:'Already in the route', full:'The route can hold up to {n} stops', addError:'Could not add the stop', noCoords:'This place has no coordinates', unnamed:'Untitled',
      loadError:'Could not load {url} ({status})', routeOpen:'Open',
      geolocationUnsupported:'Geolocation is not supported by this browser', geolocationSearch:'Finding your location…', geolocationHere:'You are here', geolocationDone:'The marker shows your location', geolocationFail:'Could not determine your location', fullscreenFail:'Full screen is unavailable',
      allBelarus:'All Belarus', allTypes:'All types', allRegions:'All regions', allStories:'All stories', onlyStories:'Stories only', resetFilters:'Reset filters', reset:'Reset',
      projectStory:'Project story', officialObject:'Official object from the State List', stateList:'State List', openCard:'Open card', story:'Story', addressUnknown:'Address being verified', coordsUnknown:'Coordinates being verified',
      mapOn:'On the map', noStoriesInFilter:'No project stories in this selection. Reset the filter or open the catalogue.', catalogCount:'In the official catalogue: <strong>{n}</strong> objects. <a href="{href}">Open the catalogue</a>',
      storyProjectShort:'project story', nothingFound:'Nothing found. Try a place name or region.', routePoint:'Stop {n}', routeOpenCard:'Open card',
      stop:'Stop', source:'source', addWholeWalk:'Add the whole walk', routeInYandex:'Route in Yandex Maps', onRoute:'on the route', onFoot:'on foot', stops:'stops', difficulty:'difficulty', wholeRoute:'Whole route', myLocation:'My location', zoomIn:'Zoom in', zoomOut:'Zoom out', mapLoadFail:'The map could not be loaded. All stops are listed below.', allWalks:'All walks', walk:'Walk', start:'Start: ', finish:'Finish: ', openWalk:'Take the walk', afterWalk:'After the walk', findInYandex:'Find in Yandex Maps', officialDescriptions:'Official descriptions are given in the language of the source (mostly Belarusian). The Belarusian, Russian and English versions are adapted translations based on the State List; links lead to the original records.', wantRoute:'Want to visit several places in a row? Add the stops to your personal route — it is saved in your browser.',
      walkNotFound:'Walk not found', walkNotChosen:'No walk selected', backToWalks:'Return to the list of walks', openWalkList:'Open the list of walks and choose a route.',
      filterAll:'All walks', filter1h:'1 hour', filter15h:'1.5 hours', filter2h:'2 hours', walksLoadFail:'Could not load the walks. Refresh the page or open the list of walks.', walkStops:'stops', stopsTitle:'Stops', walkMap:'Walk map', walkMetaSuffix:'Official sources, map and stops.',
      searchRoutePlaceholder:'Start typing a name…', addPlace:'Add a place', routeEmptyStrong:'Your route is empty.', routeEmptyText:'Find a place in the search above or add it from an object card.', points:'Stops', straightDistance:'Straight-line distance', routeSummaryNote:'This is an approximate distance between stops, not a road route. External services will build a driving route separately.', clear:'Clear', moveUp:'Move up', moveDown:'Move down', remove:'Remove', routeLoadFail:'Could not load places for the route', routeHelp:'The route is stored only in this browser (localStorage). Arrows change the order, × removes a stop. External maps may limit the number of waypoints; split the route if needed.',
      officialCatalog:'Official catalogue', placeBack:'← Official catalogue', objectNotChosen:'No object selected', backToCatalog:'Return to the catalogue or open the map', objectNotFound:'Object not found', linkOutdated:'The link may be outdated. Open the official catalogue and choose the object again.', brief:'At a glance', region:'Region', type:'Type', category:'Category', code:'Reference code', actions:'Actions', onMap:'On the map', officialPage:'Official page', sourceTitle:'Source', officialData:'Official data', translation:'Translation', toRussian:'Russian', toEnglish:'English', translationNote:'An automatic translation from Belarusian appears in this card. The official text stays in the source language.', listen:'Listen', listenFail:'Speech is not available in this browser', translate:'Translate', translating:'Translating…', showOriginal:'Show original', translateFail:'Translation failed. The Belarusian text is unchanged.', eraAll:'All', eraFormer:'Earlier eras', eraSoviet:'Soviet period', eraModern:'Since 1991', more:'Details', cafes:'Cafés', filterTo1h:'Up to 1 hour', filter1to2:'1–2 hours', filterLonger:'Longer', routeFootNote:'The walking line comes from the OSRM service.', routeOrderNote:'The line joins the stops in order. It is not a surveyed route.', walkNone:'No walk selected', imageCredit:'Image: heritage.gov.by', related:'Nearby', placeLead:'{title} is a {kind} in {region}. The card is based on the official heritage.gov.by catalogue.', descriptionPending:'Description in preparation.', descriptionPendingText:'The official catalogue does not yet provide a text description for this object. Verified card fields are shown below; the full text is on the official page.', officialCard:'Object record on heritage.gov.by', nameAddress:'Name and address: State List of Historical and Cultural Values.', officialSourceNote:'Description and image: State List of Historical and Cultural Values of the Republic of Belarus. The description is given in the original language.', selectPlace:'No object selected', selectPlaceText:'Return to the catalogue or open the map.', storiesLoadFail:'Could not load the stories. Refresh the page.', catalogLoadFail:'Could not load the catalogue. Refresh the page.', placeMeta:'Official record from the State List of Historical and Cultural Values of Belarus: {title}.'
    }
  }[LANG];
  const cache = new Map();

  function t(key, vars){
    let value = UI[key] == null ? key : UI[key];
    if (vars) Object.keys(vars).forEach(k => { value = value.replace(new RegExp('\\{' + k + '\\}', 'g'), String(vars[k])); });
    return value;
  }
  function url(path){
    if (!path) return BASE;
    if (/^(https?:|data:|mailto:|tel:|#)/.test(path)) return path;
    return BASE + String(path).replace(/^\.?\//,'');
  }
  function assetUrl(path){
    if (!path) return ASSETS;
    if (/^(https?:|data:|mailto:|tel:|#)/.test(path)) return path;
    return ASSETS + String(path).replace(/^\.?\//,'');
  }
  function escapeHTML(value){
    return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function formatNumber(value){
    return new Intl.NumberFormat(LOCALE).format(Number(value) || 0);
  }
  function stopsWord(n){
    const value = Math.abs(Number(n) || 0);
    if (LANG === 'en') return value === 1 ? 'stop' : 'stops';
    if (LANG === 'be'){
      const last = value % 10, lastTwo = value % 100;
      if (last === 1 && lastTwo !== 11) return 'прыпынак';
      if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return 'прыпынкі';
      return 'прыпынкаў';
    }
    const last = value % 10, lastTwo = value % 100;
    if (last === 1 && lastTwo !== 11) return 'остановка';
    if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return 'остановки';
    return 'остановок';
  }
  function dataText(obj, field){
    if (!obj) return '';
    if (LANG === 'be') return obj[field + '_be'] || obj[field] || obj[field + '_en'] || '';
    if (LANG === 'en') return obj[field + '_en'] || obj[field] || '';
    return obj[field] || obj[field + '_en'] || '';
  }
  function curatedText(story, field, i18n){
    const tr = i18n && i18n[story.slug] && i18n[story.slug][LANG];
    if (tr && tr[field] !== undefined) return tr[field];
    if (LANG === 'en') return story[field + '_en'] || story[field] || '';
    if (LANG === 'be') return story[field + '_be'] || story[field] || '';
    return story[field] || '';
  }
  function curatedCaption(story, index, i18n){
    const tr = i18n && i18n[story.slug] && i18n[story.slug][LANG];
    if (tr && Array.isArray(tr.captions) && tr.captions[index] != null) return tr.captions[index];
    return (story.images[index] && story.images[index].caption) || '';
  }
  function fetchJSON(path){
    const key = assetUrl(path);
    if (!cache.has(key)){
      cache.set(key, fetch(key).then(r => {
        if (!r.ok) throw new Error(t('loadError', {url:key, status:r.status}));
        return r.json();
      }));
    }
    return cache.get(key);
  }
  function unpack(data){
    if (!data || !Array.isArray(data.fields) || !Array.isArray(data.rows)) return [];
    return data.rows.map(row => {
      const obj = {};
      data.fields.forEach((field, i) => { obj[field] = row[i]; });
      return obj;
    });
  }
  function parseAxis(value){
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    const sign = n < 0 ? -1 : 1;
    const a = Math.abs(n);
    if (a >= 10000){
      const deg = Math.floor(a / 10000);
      const min = Math.floor((a - deg * 10000) / 100);
      const sec = a - deg * 10000 - min * 100;
      if (min >= 60 || sec >= 60) return null;
      return sign * (deg + min / 60 + sec / 3600);
    }
    if (a >= 1000){
      const deg = Math.floor(a / 100);
      const min = a - deg * 100;
      if (min >= 60) return null;
      return sign * (deg + min / 60);
    }
    return n;
  }
  function inBelarus(lat, lon){
    return lat >= 51.15 && lat <= 56.25 && lon >= 23.1 && lon <= 32.85;
  }
  function fixCoords(lat, lon){
    const la = parseAxis(lat);
    const lo = parseAxis(lon);
    if (la == null || lo == null) return null;
    if (inBelarus(la, lo)) return {lat: la, lon: lo};
    if (inBelarus(lo, la)) return {lat: lo, lon: la};
    return null;
  }
  function locatePoints(list){
    const out = [];
    (list || []).forEach(p => {
      const c = fixCoords(p.lat, p.lon);
      if (!c) return;
      p.lat = c.lat;
      p.lon = c.lon;
      out.push(p);
    });
    return out;
  }
  function countryRings(geo){
    if (!geo) return [];
    if (geo._rings) return geo._rings;
    const rings = [];
    const walk = (node) => {
      if (!node) return;
      if (node.type === 'Polygon') rings.push(node.coordinates[0]);
      else if (node.type === 'MultiPolygon') node.coordinates.forEach(poly => rings.push(poly[0]));
      else if (node.type === 'Feature') walk(node.geometry);
      else if (node.type === 'FeatureCollection') (node.features || []).forEach(feature => walk(feature));
      else if (node.geometry) walk(node.geometry);
    };
    walk(geo);
    geo._rings = rings;
    return rings;
  }
  function pointInRing(lon, lat, ring){
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++){
      const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
      if (((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / ((yj - yi) || 1e-12) + xi)) inside = !inside;
    }
    return inside;
  }
  function insideCountry(lat, lon, geo){
    const rings = countryRings(geo);
    if (!rings.length) return inBelarus(lat, lon);
    const hit = (la, lo) => rings.some(ring => pointInRing(lo, la, ring));
    if (hit(lat, lon)) return true;
    const pad = 0.045;
    return hit(lat + pad, lon) || hit(lat - pad, lon) || hit(lat, lon + pad) || hit(lat, lon - pad);
  }
  function debounce(fn, delay){
    let timer;
    return function(...args){
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }
  function regionName(key){ return REGIONS[key] || key || (LANG === 'be' ? 'Беларусь' : LANG === 'en' ? 'Belarus' : 'Беларусь'); }
  function groupLabel(key){ return GROUPS[key] || GROUPS.other; }
  function themeOf(p){
    if (!p) return 'other';
    if (p.cur || String(p.u || '').startsWith('curated:')) return 'curated';
    return THEMES[p.g] ? p.g : 'other';
  }
  function themeLabel(key){ return THEMES[key] || THEMES.other; }
  function typeLabel(type){ return TYPES[type] || type || ''; }
  function isCurated(p){ return !!(p && (p.cur || String(p.u || '').startsWith('curated:'))); }
  function curatedSlug(p){
    if (!p) return '';
    if (p.cur) return p.cur;
    const u = String(p.u || '');
    return u.startsWith('curated:') ? u.slice(8) : '';
  }
  function placeUrl(p){
    const slug = curatedSlug(p);
    if (slug) return url('place/' + slug + '.html');
    return url('place.html?u=' + encodeURIComponent(p.u || ''));
  }
  function imageUrl(p, fallback){
    if (!p) return assetUrl(fallback || 'assets/img/placeholder.svg');
    const src = p.p || p.i || p.image || p.card;
    return src ? assetUrl(src) : assetUrl(fallback || 'assets/img/placeholder.svg');
  }
  function bindImage(img){
    if (!img || img.dataset.fallbackBound) return;
    img.dataset.fallbackBound = '1';
    img.addEventListener('error', function(){
      if (img.dataset.fallbackApplied) return;
      img.dataset.fallbackApplied = '1';
      img.src = assetUrl('assets/img/placeholder.svg');
      img.classList.add('is-placeholder');
    });
  }
  function bindImages(root){
    (root || document).querySelectorAll('img[data-fallback]').forEach(bindImage);
  }

  function routeItems(){
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(value) ? value.filter(x => x && x.u && Number.isFinite(Number(x.lat)) && Number.isFinite(Number(x.lon))) : [];
    } catch (e) { return []; }
  }
  function saveRoute(items){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch (e) {}
    document.dispatchEvent(new CustomEvent('spadchyna:route', {detail:{items}}));
    updateRouteCount();
  }
  function routeCount(){ return routeItems().length; }
  function addRoute(item){
    if (!item || !item.u) return {status:'error', message:t('addError')};
    if (!Number.isFinite(Number(item.lat)) || !Number.isFinite(Number(item.lon))) return {status:'error', message:t('noCoords')};
    const items = routeItems();
    if (items.some(x => x.u === item.u)) return {status:'exists', message:t('exists')};
    if (items.length >= MAX_ROUTE) return {status:'full', message:t('full', {n:MAX_ROUTE})};
    items.push({
      u:String(item.u), title:String(item.title || t('unnamed')),
      lat:Number(item.lat), lon:Number(item.lon),
      region:String(item.region || ''), image:String(item.image || ''),
      url:String(item.url || ''), cur:String(item.cur || '')
    });
    saveRoute(items);
    return {status:'added', message:t('added')};
  }
  function removeRoute(u){ saveRoute(routeItems().filter(x => x.u !== u)); }
  function moveRoute(u, delta){
    const items = routeItems();
    const index = items.findIndex(x => x.u === u);
    const next = index + delta;
    if (index < 0 || next < 0 || next >= items.length) return;
    const [item] = items.splice(index, 1);
    items.splice(next, 0, item);
    saveRoute(items);
  }
  function clearRoute(){ saveRoute([]); }
  function updateRouteCount(){
    const n = routeCount();
    document.querySelectorAll('[data-route-count]').forEach(el => { el.textContent = String(n); });
  }
  function haversine(a, b){
    const R = 6371.0088;
    const rad = d => d * Math.PI / 180;
    const dLat = rad(b.lat - a.lat);
    const dLon = rad(b.lon - a.lon);
    const lat1 = rad(a.lat), lat2 = rad(b.lat);
    const h = Math.sin(dLat/2)**2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon/2)**2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  function routeDistance(items){
    let total = 0;
    for (let i = 1; i < items.length; i++) total += haversine(items[i-1], items[i]);
    return total;
  }
  function formatDistance(km){
    if (km < 1) return Math.round(km * 1000) + (LANG === 'en' ? ' m' : ' м');
    return new Intl.NumberFormat(LOCALE, {maximumFractionDigits:0}).format(km) + (LANG === 'en' ? ' km' : ' км');
  }
  function routeLinks(items){
    if (!items.length) return null;
    const coords = items.map(x => x.lat + ',' + x.lon);
    const google = items.length === 1
      ? 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(coords[0])
      : 'https://www.google.com/maps/dir/?api=1&origin=' + encodeURIComponent(coords[0]) + '&destination=' + encodeURIComponent(coords[coords.length-1]) + '&waypoints=' + encodeURIComponent(coords.slice(1,-1).join('|'));
    const yandex = 'https://yandex.by/maps/?rtext=' + coords.map(c => encodeURIComponent(c)).join('~') + '&rtt=auto';
    const osm = 'https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=' + coords.map(c => encodeURIComponent(c)).join('%3B');
    return {google, yandex, osm};
  }

  function initMapTools(map, options){
    const opts = options || {};
    if (!map) return;
    let locateMarker = null;
    document.querySelectorAll('[data-map-tool]').forEach(btn => {
      if (btn.dataset.mapToolBound) return;
      btn.dataset.mapToolBound = '1';
      btn.addEventListener('click', () => {
        const tool = btn.dataset.mapTool;
        if (tool === 'zoom-in'){ map.zoomIn(); return; }
        if (tool === 'zoom-out'){ map.zoomOut(); return; }
        if (tool === 'fit'){
          if (typeof opts.onFit === 'function') opts.onFit();
          else map.fitBounds([[51.15,23.0],[56.3,32.9]], {padding:[18,18]});
          return;
        }
        if (tool === 'locate'){
          if (!navigator.geolocation){ toast(t('geolocationUnsupported')); return; }
          toast(t('geolocationSearch'));
          navigator.geolocation.getCurrentPosition(pos => {
            const lat = pos.coords.latitude, lon = pos.coords.longitude;
            if (locateMarker) map.removeLayer(locateMarker);
            locateMarker = L.circleMarker([lat, lon], {
              radius:8, color:'#faf7f0', weight:3, fillColor:'#b33a2b', fillOpacity:1
            }).addTo(map).bindPopup(t('geolocationHere')).openPopup();
            map.setView([lat, lon], 14, {animate:true});
            toast(t('geolocationDone'));
          }, () => toast(t('geolocationFail')), {enableHighAccuracy:true, timeout:9000, maximumAge:60000});
          return;
        }
        if (tool === 'fullscreen'){
          const el = opts.fullscreenEl || map.getContainer().closest('.map-canvas-wrap, .route-map-wrap, .walk-map-wrap') || map.getContainer();
          if (!document.fullscreenElement){
            if (el.requestFullscreen) el.requestFullscreen().catch(() => toast(t('fullscreenFail')));
            else toast(t('fullscreenFail'));
          } else if (document.exitFullscreen){
            document.exitFullscreen();
          }
        }
      });
    });
  }

  function initReveal(root){
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const scope = root || document;
    const nodes = scope.querySelectorAll('.reveal, .story-card, .walk-card, .section-head, .stat, .trust-item, .route-step, .map-teaser__copy');
    if (!nodes.length) return;
    nodes.forEach(node => node.classList.add('reveal'));
    if (!('IntersectionObserver' in window)){
      nodes.forEach(node => node.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, {rootMargin:'0px 0px -8% 0px', threshold:.06});
    nodes.forEach(node => io.observe(node));
  }

  function toast(message, linkHref, linkLabel){
    let node = document.querySelector('.toast');
    if (!node){
      node = document.createElement('div');
      node.className = 'toast';
      node.setAttribute('role', 'status');
      node.setAttribute('aria-live', 'polite');
      document.body.appendChild(node);
    }
    node.textContent = message;
    if (linkHref && linkLabel){
      const a = document.createElement('a');
      a.href = linkHref; a.textContent = linkLabel;
      node.appendChild(a);
    }
    node.classList.add('is-visible');
    clearTimeout(node._timer);
    node._timer = setTimeout(() => node.classList.remove('is-visible'), 4200);
  }

  function initHeader(){
    const toggle = document.querySelector('[data-menu-toggle]');
    const menu = document.querySelector('[data-menu]');
    if (toggle && menu){
      toggle.addEventListener('click', () => {
        const open = menu.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(open));
        document.body.classList.toggle('menu-open', open);
      });
      menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        menu.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
      }));
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && menu.classList.contains('is-open')){
          menu.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
          document.body.classList.remove('menu-open');
          toggle.focus();
        }
      });
    }
    const page = document.body.dataset.page;
    if (page){
      document.querySelectorAll('[data-nav]').forEach(a => {
        if (a.dataset.nav === page) a.classList.add('is-active');
      });
    }
    if (location.search){
      document.querySelectorAll('[data-lang-link]').forEach(a => {
        try {
          const u = new URL(a.getAttribute('href'), location.href);
          u.search = location.search;
          a.href = u.href;
        } catch (e) {}
      });
    }
    updateRouteCount();
    document.querySelectorAll('[data-year]').forEach(el => { el.textContent = String(new Date().getFullYear()); });
  }

  function initRouteButtons(){
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-route-add]');
      if (!btn) return;
      e.preventDefault();
      const result = addRoute({
        u: btn.dataset.u, title: btn.dataset.title, lat: btn.dataset.lat, lon: btn.dataset.lon,
        region: btn.dataset.region, image: btn.dataset.image, url: btn.dataset.url, cur: btn.dataset.cur
      });
      if (result.status === 'added'){
        toast(result.message, url('routes.html'), t('routeOpen'));
      } else {
        toast(result.message, result.status === 'full' ? url('routes.html') : null, result.status === 'full' ? t('routeOpen') : null);
      }
    });
  }

  function addGraticule(map){
    const lines = [];
    for (let lat = 51; lat <= 56; lat += 1){
      lines.push(L.polyline([[lat, 22.5],[lat, 33.2]], {color:'#cfc5b2', weight:0.7, opacity:0.55, dashArray:'2 5', interactive:false}));
    }
    for (let lon = 23; lon <= 32; lon += 1){
      lines.push(L.polyline([[51.0, lon],[56.4, lon]], {color:'#cfc5b2', weight:0.7, opacity:0.55, dashArray:'2 5', interactive:false}));
    }
    lines.forEach(line => line.addTo(map));
  }

  function addRegionLabels(map){
    const positions = {
      BrestRegion:[52.45,24.9], VitebskRegion:[55.55,30.15],
      GomelRegion:[52.35,29.9], GrodnoRegion:[53.55,24.9],
      MinskRegion:[53.45,28.35], MogilevRegion:[53.45,30.65]
    };
    const layer=L.layerGroup();
    Object.entries(positions).forEach(([key, latlng]) => {
      layer.addLayer(L.marker(latlng, {
        interactive:false, keyboard:false, pane:'labels',
        icon:L.divIcon({className:'region-label', html:'<span>' + escapeHTML(regionName(key).toUpperCase()) + '</span>', iconSize:[0,0], iconAnchor:[0,0]})
      }));
    });
    toggleLabelsAtZoom(map, layer);
  }

  function addCityLabels(map){
    const cities = LANG === 'be'
      ? [['Мінск',53.902,27.561],['Брэст',52.097,23.687],['Віцебск',55.190,30.205],['Гомель',52.434,30.976],['Гродна',53.688,23.825],['Магілёў',53.900,30.332]]
      : LANG === 'en'
      ? [['Minsk',53.902,27.561],['Brest',52.097,23.687],['Vitebsk',55.190,30.205],['Gomel',52.434,30.976],['Grodno',53.688,23.825],['Mogilev',53.900,30.332]]
      : [['Минск',53.902,27.561],['Брест',52.097,23.687],['Витебск',55.190,30.205],['Гомель',52.434,30.976],['Гродно',53.688,23.825],['Могилёв',53.900,30.332]];
    const layer=L.layerGroup();
    cities.forEach(([name, lat, lon]) => {
      layer.addLayer(L.marker([lat,lon], {
        interactive:false, keyboard:false, pane:'labels',
        icon:L.divIcon({className:'city-label', html:'<span><i></i>' + escapeHTML(name) + '</span>', iconSize:[0,0], iconAnchor:[0,0]})
      }));
    });
    toggleLabelsAtZoom(map, layer);
  }

  function toggleLabelsAtZoom(map, layer){
    const sync=()=>{
      if (map.getZoom() >= 8){
        if (!map.hasLayer(layer)) layer.addTo(map);
      } else if (map.hasLayer(layer)){
        map.removeLayer(layer);
      }
    };
    map.on('zoomend', sync);
    sync();
  }

  function loadScript(src){
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[src="' + src + '"]');
      if (existing){
        if (existing.dataset.loaded === '1') resolve();
        else existing.addEventListener('load', () => resolve(), {once:true});
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => { script.dataset.loaded = '1'; resolve(); };
      script.onerror = () => reject(new Error(src));
      document.head.appendChild(script);
    });
  }
  function canUseWebGL(){
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    } catch (e) {
      return false;
    }
  }
  async function ensureVectorBasemap(){
    if (!canUseWebGL()) return false;
    if (!document.querySelector('link[data-maplibre]')){
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';
      link.dataset.maplibre = '1';
      document.head.appendChild(link);
    }
    await loadScript('https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js');
    await loadScript('https://unpkg.com/@maplibre/maplibre-gl-leaflet@0.0.22/leaflet-maplibre-gl.js');
    return !!(window.maplibregl && L.maplibreGL);
  }
  function osmTiles(map){
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
    }).addTo(map);
  }
  async function addClearBasemap(map){
    try {
      if (await ensureVectorBasemap()){
        L.maplibreGL({
          style: 'https://tiles.openfreemap.org/styles/liberty',
          attributionControl: false
        }).addTo(map);
        map.attributionControl.addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> &copy; <a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a>');
        return;
      }
    } catch (e) {
      console.warn(e);
    }
    osmTiles(map);
  }
  async function addCountryOutline(map, geo){
    const data = geo || await fetchJSON('assets/data/belarus.json');
    geo = data;
    return L.geoJSON(geo, {
      interactive: false,
      style: {color:'#1d2420', weight:2, opacity:0.88, fill:false, lineJoin:'round', lineCap:'round'}
    }).addTo(map);
  }
  async function initBaseMap(el, options){
    const opts = options || {};
    const osm = opts.osm === true;
    const map = L.map(el, {
      zoomControl:false, attributionControl:true, minZoom:5, maxZoom:opts.maxZoom || (osm ? 18 : 14),
      maxBounds:[[50.4,22.0],[57.0,33.6]], maxBoundsViscosity:0.7,
      preferCanvas: opts.preferCanvas !== false
    });
    map.attributionControl.setPrefix(false);
    L.control.scale({imperial:false, position:'bottomleft'}).addTo(map);
    let regionsLayer = null;
    if (osm){
      await addClearBasemap(map);
    } else {
      map.attributionControl.addAttribution((LANG === 'be' ? 'Межы' : LANG === 'en' ? 'Borders' : 'Границы') + ': <a href="https://www.geoboundaries.org/" target="_blank" rel="noopener">geoBoundaries</a> · ' + (LANG === 'be' ? 'Даныя' : LANG === 'en' ? 'Data' : 'Данные') + ': <a href="https://heritage.gov.by/" target="_blank" rel="noopener">heritage.gov.by</a>');
      map.createPane('regions');
      map.getPane('regions').style.zIndex = 200;
      map.createPane('labels');
      map.getPane('labels').style.zIndex = 650;
      addGraticule(map);
      try {
        const geo = await fetchJSON('assets/data/geo/regions.geojson');
        regionsLayer = L.geoJSON(geo, {
          pane:'regions',
          style:{color:'#9c927f', weight:1.2, fillColor:'#e7dfcf', fillOpacity:1},
          onEachFeature:(feature, layer) => {
            layer.bindTooltip(feature.properties.name_ru || feature.properties.shapeName, {className:'region-tooltip', sticky:true});
            layer.on('mouseover', () => layer.setStyle({fillColor:'#ded4c0'}));
            layer.on('mouseout', () => layer.setStyle({fillColor:'#e7dfcf'}));
          }
        }).addTo(map);
        addRegionLabels(map);
        addCityLabels(map);
      } catch (e) {
        console.warn(e);
      }
    }
    if (opts.fit !== false){
      map.fitBounds([[51.15,23.0],[56.3,32.9]], {padding:[14,14]});
    } else {
      map.setView([53.6,27.8], osm ? 13 : 7);
    }
    return {map, regionsLayer};
  }

  function eraBucketOf(p, eraIndex, story){
    if (story && story.eraBucket) return story.eraBucket;
    if (p && p.eraBucket) return p.eraBucket;
    if (eraIndex && p && eraIndex[p.u]) return eraIndex[p.u];
    return '';
  }
  function eraLabel(bucket){
    if (bucket === 'former') return t('eraFormer');
    if (bucket === 'soviet') return t('eraSoviet');
    if (bucket === 'modern') return t('eraModern');
    return '';
  }
  function textHash(value){
    let h = 5381;
    const s = String(value || '');
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }
  function splitChunks(text, size){
    const chunks = [];
    let rest = String(text || '');
    while (rest.length > size){
      let cut = rest.lastIndexOf(' ', size);
      if (cut < size * 0.5) cut = size;
      chunks.push(rest.slice(0, cut));
      rest = rest.slice(cut).trim();
    }
    if (rest) chunks.push(rest);
    return chunks;
  }
  async function translateBe(text, tl){
    const source = String(text || '').trim();
    if (!source) return '';
    const target = tl === 'en' ? 'en' : 'ru';
    const key = 'sp_tr_' + target + '_' + textHash(source);
    try {
      const hit = sessionStorage.getItem(key);
      if (hit) return hit;
    } catch (e) {}
    const parts = [];
    for (const chunk of splitChunks(source, 400)){
      const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=be&tl=' + target + '&dt=t&q=' + encodeURIComponent(chunk);
      const res = await fetch(url);
      if (!res.ok) throw new Error('translate');
      const data = await res.json();
      if (!Array.isArray(data) || !Array.isArray(data[0])) throw new Error('translate');
      parts.push(data[0].map(row => (Array.isArray(row) && row[0]) ? row[0] : '').join(''));
    }
    const value = parts.join('');
    try { sessionStorage.setItem(key, value); } catch (e) {}
    return value;
  }
  let speakToken = 0;
  let speakBtn = null;
  function stopSpeak(btn){
    speakToken++;
    if (window.speechSynthesis) speechSynthesis.cancel();
    if (btn) btn.classList.remove('is-speaking');
    if (speakBtn) speakBtn.classList.remove('is-speaking');
    speakBtn = null;
  }
  function pickVoice(){
    const voices = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    if (LANG === 'en') return voices.find(v => /^en/i.test(v.lang || '')) || null;
    if (LANG === 'be') return voices.find(v => /^be/i.test(v.lang || '')) || voices.find(v => /^ru/i.test(v.lang || '')) || null;
    return voices.find(v => /^ru/i.test(v.lang || '')) || null;
  }
  async function speakText(btn, text){
    if (!window.speechSynthesis){ toast(t('listenFail')); return; }
    const u = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    if (voice){ u.voice = voice; u.lang = voice.lang; }
    else u.lang = LANG === 'en' ? 'en-US' : 'ru-RU';
    u.onend = u.onerror = () => { if (speakBtn === btn){ btn.classList.remove('is-speaking'); speakBtn = null; } };
    speakBtn = btn;
    btn.classList.add('is-speaking');
    speechSynthesis.speak(u);
  }
  async function gatherSpeakText(btn){
    const preset = btn.getAttribute('data-speak-text');
    if (preset) return preset;
    const stop = btn.closest('.walk-stop');
    if (stop){
      const h = stop.querySelector('h3');
      const p = stop.querySelector('p');
      return ((h && h.textContent) || '') + '. ' + ((p && p.textContent) || '');
    }
    const h1 = document.querySelector('.place-hero h1');
    const nodes = [...document.querySelectorAll('#place-prose [data-origin]')];
    let body = '';
    if (nodes.length && LANG !== 'be'){
      const parts = [];
      for (const n of nodes){
        parts.push(n.dataset.translatedText || await translateBe(n.dataset.origin, LANG === 'en' ? 'en' : 'ru'));
      }
      body = parts.join(' ');
    } else {
      const prose = document.querySelector('main .prose');
      body = prose ? prose.innerText : '';
    }
    return ((h1 && h1.textContent) || '') + '. ' + body;
  }
  function initSpeak(){
    if (window.speechSynthesis) speechSynthesis.getVoices();
    document.addEventListener('click', async e => {
      const btn = e.target.closest('[data-speak]');
      if (!btn) return;
      e.preventDefault();
      if (speakBtn === btn){ stopSpeak(btn); return; }
      stopSpeak(null);
      const token = ++speakToken;
      btn.classList.add('is-speaking');
      speakBtn = btn;
      try {
        let text = await gatherSpeakText(btn);
        if (token !== speakToken) return;
        if (btn.getAttribute('data-speak-from') === 'be' && LANG !== 'be' && text){
          text = await translateBe(text, LANG === 'en' ? 'en' : 'ru');
        }
        if (token !== speakToken) return;
        await speakText(btn, text);
      } catch (err) {
        btn.classList.remove('is-speaking');
        if (speakBtn === btn) speakBtn = null;
        toast(t('translateFail'));
      }
    });
  }
  function initTranslate(){
    document.addEventListener('click', async e => {
      const btn = e.target.closest('[data-translate]');
      if (!btn || LANG === 'be') return;
      e.preventDefault();
      const root = document.getElementById(btn.getAttribute('data-translate')) || btn.closest('[data-translate-root]');
      if (!root) return;
      const nodes = [...root.querySelectorAll('[data-origin]')];
      if (!nodes.length) return;
      const status = (btn.parentElement && btn.parentElement.querySelector('[data-translate-status]')) || root.querySelector('[data-translate-status]');
      if (btn.dataset.translated === '1'){
        nodes.forEach(n => { n.textContent = n.dataset.origin; });
        btn.dataset.translated = '0';
        btn.textContent = t('translate');
        if (status) status.hidden = true;
        return;
      }
      btn.disabled = true;
      if (status){ status.hidden = false; status.textContent = t('translating'); }
      try {
        const tl = LANG === 'en' ? 'en' : 'ru';
        for (const n of nodes){
          const value = await translateBe(n.dataset.origin, tl);
          n.dataset.translatedText = value;
          n.textContent = value;
        }
        btn.dataset.translated = '1';
        btn.textContent = t('showOriginal');
        if (status) status.hidden = true;
      } catch (err) {
        if (status){ status.hidden = false; status.textContent = t('translateFail'); }
      } finally {
        btn.disabled = false;
      }
    });
  }
  function initStaticSpeak(){
    const h1 = document.querySelector('.place-hero h1');
    const prose = document.querySelector('main .prose');
    if (!h1 || !prose || document.querySelector('[data-speak]')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn--ghost btn--small';
    btn.setAttribute('data-speak', '');
    btn.textContent = t('listen');
    const actions = document.querySelector('.aside-actions') || h1.parentElement;
    if (actions) actions.appendChild(btn);
  }
  function pointPopup(o){
    const route = o.route || null;
    const routeBtn = route ? '<button class="btn btn--ghost btn--small" type="button" data-route-add data-u="' + escapeHTML(route.u) + '" data-title="' + escapeHTML(route.title || o.title || '') + '" data-lat="' + route.lat + '" data-lon="' + route.lon + '" data-region="' + escapeHTML(route.region || '') + '" data-image="' + escapeHTML(route.image || '') + '" data-url="' + escapeHTML(route.url || '') + '" data-cur="' + escapeHTML(route.cur || '') + '">' + t('addRoute') + '</button>' : '';
    const from = o.speakFrom ? ' data-speak-from="' + escapeHTML(o.speakFrom) + '"' : '';
    return '<div class="map-popup">' +
      (o.image ? '<img class="map-popup__image" src="' + o.image + '" alt="" loading="lazy" data-fallback>' : '') +
      '<div class="map-popup__body">' +
        (o.meta ? '<div class="map-popup__meta">' + escapeHTML(o.meta) + '</div>' : '') +
        '<h3>' + escapeHTML(o.title || '') + '</h3>' +
        (o.text ? '<p>' + escapeHTML(o.text) + '</p>' : '') +
        '<div class="map-popup__actions">' +
          (o.href ? '<a class="map-popup__link" href="' + o.href + '">' + t('more') + '</a>' : '') +
          '<button class="btn btn--ghost btn--small" type="button" data-speak' + from + ' data-speak-text="' + escapeHTML(o.listenText || o.title || '') + '">' + t('listen') + '</button>' +
          routeBtn +
        '</div></div></div>';
  }

  document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    initRouteButtons();
    initSpeak();
    initTranslate();
    initStaticSpeak();
    bindImages(document);
    initReveal();
  });
  document.addEventListener('spadchyna:route', updateRouteCount);

  window.Spadchyna = {
    BASE, ASSETS, LANG, LOCALE, REGIONS, GROUPS, THEMES, STORAGE_KEY, MAX_ROUTE,
    url, assetUrl, t, escapeHTML, formatNumber, stopsWord, dataText, curatedText, curatedCaption,
    fetchJSON, unpack, fixCoords, locatePoints, insideCountry, debounce, regionName, groupLabel, themeOf, themeLabel, typeLabel,
    isCurated, curatedSlug, placeUrl, imageUrl, bindImage, bindImages,
    routeItems, addRoute, removeRoute, moveRoute, clearRoute, routeCount, routeDistance, formatDistance, routeLinks,
    toast, initBaseMap, initMapTools, initReveal, haversine,
    eraBucketOf, eraLabel, translateBe, pointPopup, addCountryOutline
  };
})();
