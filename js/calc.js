/* ==========================================================================
   Калькулятор стоимости натяжного потолка
   Ставки откалиброваны по реальным сданным объектам «ДаР».
   Итог показывается вилкой — точная цена только после замера.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.querySelector('[data-calc]');
  if (!root) return;

  /* ---------- прайс ---------- */
  var PRICE = {
    canvas: {              // ₽ за м² с работой и материалом
      matt:   750,
      gloss:  800,
      satin:  850,
      fabric: 1550         // ткань Descor
    },
    profile: {             // ₽ за погонный метр периметра
      standard: 0,
      shadow:   750,       // теневой EuroKraab
      floating: 1000       // парящий с подсветкой
    },
    spot:       550,       // точечный светильник, ₽/шт
    lightLine: 4200,       // световая линия, ₽/пог.м
    track:     4800,       // трековая система, ₽/пог.м
    cornice:    950,       // скрытый карниз ПК-13/14, ₽/пог.м
    corniceLight: 650,     // надбавка за подсветку карниза, ₽/пог.м
    insert:     180,       // чёрная вставка по периметру, ₽/пог.м
    minOrder: 9000         // минимум по полотну — выезд + работа на малой площади
  };

  var SPREAD_LOW = 0.92;   // вилка итога
  var SPREAD_HIGH = 1.12;

  /* ---------- элементы ---------- */
  var areaRange   = root.querySelector('[data-area]');
  var areaOut     = root.querySelector('[data-area-out]');
  var spotRange   = root.querySelector('[data-spots]');
  var spotOut     = root.querySelector('[data-spots-out]');
  var lineRange   = root.querySelector('[data-line]');
  var lineOut     = root.querySelector('[data-line-out]');
  var trackRange  = root.querySelector('[data-track]');
  var trackOut    = root.querySelector('[data-track-out]');
  var cornRange   = root.querySelector('[data-cornice]');
  var cornOut     = root.querySelector('[data-cornice-out]');

  var sumOut   = document.querySelector('[data-calc-sum]');
  var linesOut = document.querySelector('[data-calc-lines]');
  var perM2Out = document.querySelector('[data-calc-perm2]');

  var rub = new Intl.NumberFormat('ru-RU');
  var message = '';                 // текст сметы для копирования

  function money(n) { return rub.format(Math.round(n / 100) * 100) + ' ₽'; }

  /* периметр прямоугольной комнаты, близкой к квадрату, + запас на ниши */
  function perimeter(area) {
    return Math.round(4 * Math.sqrt(area) * 1.1);
  }

  function checked(name) {
    var el = root.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : null;
  }

  function calc() {
    var area   = +areaRange.value;
    var spots  = +spotRange.value;
    var line   = +lineRange.value;
    var track  = +trackRange.value;
    var corn   = +cornRange.value;

    var canvasType  = checked('canvas')  || 'matt';
    var profileType = checked('profile') || 'standard';
    var corniceLit  = root.querySelector('[name="cornice-light"]').checked;
    var insert      = root.querySelector('[name="insert"]').checked;

    var P = perimeter(area);
    var rows = [];

    var canvasSum = Math.max(area * PRICE.canvas[canvasType], PRICE.minOrder);
    rows.push(['Полотно и монтаж, ' + area + ' м²', canvasSum]);

    if (PRICE.profile[profileType]) {
      var profSum = P * PRICE.profile[profileType];
      rows.push([
        (profileType === 'shadow' ? 'Теневой профиль EuroKraab' : 'Парящая конструкция') + ', ' + P + ' пог.м',
        profSum
      ]);
      canvasSum += profSum;
    }

    var total = canvasSum;

    if (spots) { var s = spots * PRICE.spot; rows.push(['Точечные светильники, ' + spots + ' шт', s]); total += s; }
    if (line)  { var l = line * PRICE.lightLine; rows.push(['Световые линии, ' + line + ' пог.м', l]); total += l; }
    if (track) { var t = track * PRICE.track; rows.push(['Трековая система, ' + track + ' пог.м', t]); total += t; }
    if (corn) {
      var c = corn * (PRICE.cornice + (corniceLit ? PRICE.corniceLight : 0));
      rows.push(['Скрытый карниз' + (corniceLit ? ' с подсветкой' : '') + ', ' + corn + ' пог.м', c]);
      total += c;
    }
    if (insert) { var i = P * PRICE.insert; rows.push(['Чёрная вставка по периметру, ' + P + ' пог.м', i]); total += i; }

    /* вывод */
    sumOut.textContent = money(total * SPREAD_LOW) + ' — ' + money(total * SPREAD_HIGH);

    if (perM2Out) perM2Out.textContent = money(total / area) + ' / м²';

    linesOut.innerHTML = rows.map(function (r) {
      return '<li><span>' + r[0] + '</span><span>' + money(r[1]) + '</span></li>';
    }).join('');

    /* текст сметы держим наготове — его копирует кнопка под результатом */
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

  bind(areaRange,  areaOut,  'м²');
  bind(spotRange,  spotOut,  'шт');
  bind(lineRange,  lineOut,  'пог.м');
  bind(trackRange, trackOut, 'пог.м');
  bind(cornRange,  cornOut,  'пог.м');

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
      // если браузер откажет в доступе к буферу — пробуем старый способ
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
