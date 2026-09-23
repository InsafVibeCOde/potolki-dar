/* ==========================================================================
   Калькулятор стоимости натяжного потолка
   Ставки — из прайса «ДаР». Считает в браузере, никуда ничего не отправляет.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.querySelector('[data-calc]');
  if (!root) return;

  /* ---------- прайс ----------
     Цены, отмеченные «оценка», заказчик не давал — их нужно уточнить
     и заменить здесь же. Остальное из прайса один в один.
     ------------------------------------------------------------------ */
  var PRICE = {
    canvas: {                 // ₽ за м², потолок под ключ
      matt:   750,            // бюджетный вариант из прайса
      gloss:  850,            // оценка
      satin:  900,            // оценка
      fabric: 2000            // ткань Descor — оценка
    },
    profile: {                // ₽ за погонный метр периметра
      standard:      0,
      shadowPlastic: 350,
      shadowAlu:    1000      // «от 1000»
    },
    corner: {                 // запил угла 45°, ₽ за угол
      shadowPlastic: 350,
      shadowAlu:     600
    },
    vent: 1000,               // установка вентиляционной решётки, ₽/шт
    spot:   450,              // точечный светильник с разводкой, ₽/шт
    lamp:   500,              // установка люстры без сборки, ₽/шт
    lightLine: 3500,          // световая линия, ₽/пог.м («от»)
    track: {                  // трековое освещение, ₽/пог.м
      none:      0,
      surface:  700,
      hidden:  3500,
      magnetic: 4000
    },
    cornice: {                // скрытый карниз, ₽/пог.м
      none:    0,
      plastic: 1800,          // ПК-14 пластиковый
      alu:     2800,          // ПК-14 алюминиевый
      am1:     2500           // АМ-1 однорядный алюминиевый
    }
  };

  /* ---------- элементы ---------- */
  var areaRange    = root.querySelector('[data-area]');
  var areaOut      = root.querySelector('[data-area-out]');
  var cornersField = root.querySelector('[data-corners]');
  var cornersRange = root.querySelector('[data-corners-range]');
  var cornersOut   = root.querySelector('[data-corners-out]');
  var spotRange    = root.querySelector('[data-spots]');
  var spotOut      = root.querySelector('[data-spots-out]');
  var lampRange    = root.querySelector('[data-lamps]');
  var lampOut      = root.querySelector('[data-lamps-out]');
  var ventRange    = root.querySelector('[data-vent]');
  var ventOut      = root.querySelector('[data-vent-out]');
  var lineRange    = root.querySelector('[data-line]');
  var lineOut      = root.querySelector('[data-line-out]');
  var trackWrap    = root.querySelector('[data-track-len]');
  var trackRange   = root.querySelector('[data-track]');
  var trackOut     = root.querySelector('[data-track-out]');
  var cornWrap     = root.querySelector('[data-cornice-len]');
  var cornRange    = root.querySelector('[data-cornice]');
  var cornOut      = root.querySelector('[data-cornice-out]');

  var sumOut   = document.querySelector('[data-calc-sum]');
  var linesOut = document.querySelector('[data-calc-lines]');
  var perM2Out = document.querySelector('[data-calc-perm2]');

  var rub = new Intl.NumberFormat('ru-RU');
  var message = '';                  // текст сметы для копирования

  function money(n) { return rub.format(Math.round(n / 100) * 100) + ' ₽'; }

  /* периметр комнаты, близкой к квадрату, с запасом на ниши */
  function perimeter(area) {
    return Math.round(4 * Math.sqrt(area) * 1.1);
  }

  function checked(name) {
    var el = root.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : null;
  }

  var TRACK_NAME = {
    surface:  'Трек накладной',
    hidden:   'Трек скрытого монтажа',
    magnetic: 'Магнитный трек'
  };

  var CORNICE_NAME = {
    plastic: 'Скрытый карниз ПК-14, пластик',
    alu:     'Скрытый карниз ПК-14, алюминий',
    am1:     'Скрытый карниз АМ-1 однорядный'
  };

  var PROFILE_NAME = {
    shadowPlastic: 'Теневой профиль, пластик',
    shadowAlu:     'Теневой профиль, алюминий'
  };

  function calc() {
    var area  = +areaRange.value;
    var spots = +spotRange.value;
    var lamps = +lampRange.value;
    var vents = +ventRange.value;
    var line  = +lineRange.value;

    var canvasType  = checked('canvas')  || 'matt';
    var profileType = checked('profile') || 'standard';
    var trackType   = checked('track')   || 'none';
    var corniceType = checked('cornice') || 'none';

    /* поля длины и углов показываем только когда они нужны */
    var showCorners = profileType !== 'standard';
    cornersField.hidden = !showCorners;
    trackWrap.hidden = trackType === 'none';
    cornWrap.hidden = corniceType === 'none';

    var corners = showCorners ? +cornersRange.value : 0;
    var track   = trackType === 'none' ? 0 : +trackRange.value;
    var corn    = corniceType === 'none' ? 0 : +cornRange.value;

    var P = perimeter(area);
    var rows = [];
    var total = 0;

    var canvasSum = area * PRICE.canvas[canvasType];
    rows.push(['Потолок под ключ, ' + area + ' м²', canvasSum]);
    total += canvasSum;

    if (PRICE.profile[profileType]) {
      var profSum = P * PRICE.profile[profileType];
      rows.push([PROFILE_NAME[profileType] + ', ' + P + ' пог.м', profSum]);
      total += profSum;

      if (corners) {
        var cornerSum = corners * PRICE.corner[profileType];
        rows.push(['Запил углов 45°, ' + corners + ' шт', cornerSum]);
        total += cornerSum;
      }
    }

    if (spots) {
      var s = spots * PRICE.spot;
      rows.push(['Точечные светильники, ' + spots + ' шт', s]);
      total += s;
    }

    if (lamps) {
      var lm = lamps * PRICE.lamp;
      rows.push(['Установка люстр, ' + lamps + ' шт', lm]);
      total += lm;
    }

    if (vents) {
      var v = vents * PRICE.vent;
      rows.push(['Вентиляционные решётки, ' + vents + ' шт', v]);
      total += v;
    }

    if (line) {
      var l = line * PRICE.lightLine;
      rows.push(['Световые линии, ' + line + ' пог.м', l]);
      total += l;
    }

    if (track) {
      var t = track * PRICE.track[trackType];
      rows.push([TRACK_NAME[trackType] + ', ' + track + ' пог.м', t]);
      total += t;
    }

    if (corn) {
      var c = corn * PRICE.cornice[corniceType];
      rows.push([CORNICE_NAME[corniceType] + ', ' + corn + ' пог.м', c]);
      total += c;
    }

    /* ---------- вывод ---------- */
    sumOut.textContent = 'от ' + money(total);
    if (perM2Out) perM2Out.textContent = money(total / area) + ' / м²';

    linesOut.innerHTML = rows.map(function (r) {
      return '<li><span>' + r[0] + '</span><span>' + money(r[1]) + '</span></li>';
    }).join('');

    message = 'Здравствуйте! Посчитал на сайте:\n\n' +
              rows.map(function (r) { return '— ' + r[0] + ': ' + money(r[1]); }).join('\n') +
              '\n\nИтого ориентировочно: ' + sumOut.textContent +
              '\n\nПодскажите точную стоимость?';
  }

  /* ---------- живые подписи под слайдерами ---------- */
  function bind(range, out, suffix) {
    if (!range) return;
    function sync() { out.textContent = range.value + ' ' + suffix; calc(); }
    range.addEventListener('input', sync);
    sync();
  }

  bind(areaRange,    areaOut,    'м²');
  bind(cornersRange, cornersOut, 'шт');
  bind(spotRange,    spotOut,    'шт');
  bind(lampRange,    lampOut,    'шт');
  bind(ventRange,    ventOut,    'шт');
  bind(lineRange,    lineOut,    'пог.м');
  bind(trackRange,   trackOut,   'пог.м');
  bind(cornRange,    cornOut,    'пог.м');

  root.addEventListener('change', calc);
  calc();

  /* ------------------------------------------------------------------
     «Скопировать расчёт и написать»

     Смета уходит в буфер обмена, следом открывается MAX — человек
     вставляет текст сам. Заявку мы никуда не отправляем: пока он не
     нажмёт «отправить» в мессенджере, данных у нас нет.
     ------------------------------------------------------------------ */
  var MAX_URL = 'https://max.ru/potolki-dar';

  var copyBtn = document.querySelector('[data-calc-copy]');
  var copiedNote = document.querySelector('[data-calc-copied]');

  /* старый способ — работает на http и там, где Clipboard API запрещён */
  function copyLegacy(text) {
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);   // iOS без этого не копирует
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      ok ? resolve() : reject(new Error('execCommand failed'));
    });
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () {
        return copyLegacy(text);
      });
    }
    return copyLegacy(text);
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      copyToClipboard(message)
        .then(function () {
          if (copiedNote) {
            copiedNote.classList.add('is-visible');
            setTimeout(function () { copiedNote.classList.remove('is-visible'); }, 6000);
          }
        })
        .catch(function () {
          if (copiedNote) {
            copiedNote.textContent = 'Скопировать не вышло — напишите площадь и что нужно из света';
            copiedNote.classList.add('is-visible');
          }
        })
        .then(function () {
          if (window.DaR) window.DaR.reachGoal('calc_copy');
          window.open(MAX_URL, '_blank', 'noopener');
        });
    });
  }
})();
