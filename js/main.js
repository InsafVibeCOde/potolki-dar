/* ==========================================================================
   Натяжные потолки «ДаР» — общая логика
   Меню, FAQ, фильтры портфолио, лайтбокс (фото и сертификаты), отзывы, цели Метрики, reveal
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Сайт не собирает персональные данные: форм заявки нет, обращения
     идут напрямую в мессенджеры и по телефону. Здесь остаются только
     цели Яндекс.Метрики — клики по телефону и по кнопкам мессенджеров.
     ------------------------------------------------------------------ */
  var METRIKA_ID = null;            // ID Яндекс.Метрики, когда подключим

  /* ---------- утилиты ---------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function reachGoal(name) {
    if (METRIKA_ID && window['ym']) window['ym'](METRIKA_ID, 'reachGoal', name);
  }

  function lockScroll(on) {
    document.body.classList.toggle('is-locked', on);
  }

  /* ==================================================================
     1. Мобильное меню
     ================================================================== */
  var burger = $('.burger');
  var mobileMenu = $('.mobile-menu');

  if (burger && mobileMenu) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      mobileMenu.classList.toggle('is-open', !open);
      lockScroll(!open);
    });

    mobileMenu.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        burger.setAttribute('aria-expanded', 'false');
        mobileMenu.classList.remove('is-open');
        lockScroll(false);
      }
    });
  }

  /* ==================================================================
     2. FAQ-аккордеон
     ================================================================== */
  $$('.faq__q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq__item');
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      item.classList.toggle('is-open', !open);
    });
  });

  /* ==================================================================
     3. Фильтры портфолио
     ================================================================== */
  var filters = $$('.filter');
  var works = $$('.work');

  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var tag = btn.dataset.filter;
      filters.forEach(function (f) { f.setAttribute('aria-pressed', String(f === btn)); });
      works.forEach(function (w) {
        var match = tag === 'all' || (w.dataset.tags || '').split(' ').indexOf(tag) !== -1;
        w.hidden = !match;
      });
    });
  });

  /* ==================================================================
     4. Лайтбокс — фото работ и сертификаты
     ------------------------------------------------------------------
     Один просмотрщик на оба блока. Кадр — { src, alt, title, meta, doc },
     листается внутри своего набора.
     ================================================================== */
  var lightbox = $('.lightbox');
  var docs = $$('.doc');

  if (lightbox) {
    var lbImg = $('.lightbox img', lightbox);
    var lbCap = $('.lightbox__cap', lightbox);
    var lbPrev = $('.lightbox__nav--prev', lightbox);
    var lbNext = $('.lightbox__nav--next', lightbox);
    var items = [];
    var index = 0;
    var lastFocused = null;

    var LABELS = {
      work: ['Просмотр фото объекта', 'Предыдущее фото', 'Следующее фото'],
      doc:  ['Просмотр документа', 'Предыдущая страница', 'Следующая страница']
    };

    function render() {
      var it = items[index];
      if (!it) return;
      lbImg.src = it.src;
      lbImg.alt = it.alt;

      // подпись собираем узлами, а не строкой HTML
      lbCap.textContent = '';
      var title = document.createElement('b');
      title.textContent = it.title;
      lbCap.appendChild(title);
      lbCap.appendChild(document.createTextNode(it.meta));
      if (it.doc) {
        // мелкий текст сертификата удобнее читать в отдельной вкладке с зумом
        var link = document.createElement('a');
        link.className = 'lightbox__open';
        link.href = it.src;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = 'Открыть в полном размере';
        lbCap.appendChild(link);
      }

      // соседние кадры грузим заранее, чтобы листание шло без задержки
      [1, -1].forEach(function (d) {
        var next = items[(index + d + items.length) % items.length];
        if (next && next !== it) new Image().src = next.src;
      });
    }

    function open(list, start, kind) {
      items = list;
      index = Math.max(0, start);
      lastFocused = document.activeElement;
      lightbox.setAttribute('aria-label', LABELS[kind][0]);
      lbPrev.setAttribute('aria-label', LABELS[kind][1]);
      lbNext.setAttribute('aria-label', LABELS[kind][2]);
      lightbox.classList.toggle('lightbox--doc', kind === 'doc');
      lightbox.classList.toggle('lightbox--single', items.length < 2);
      render();
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      lockScroll(true);
      $('.lightbox__close', lightbox).focus();
    }

    function close() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      lockScroll(false);
      if (lastFocused) lastFocused.focus();
    }

    function step(dir) {
      if (items.length < 2) return;
      index = (index + dir + items.length) % items.length;
      render();
    }

    /* фото работ: только видимые после фильтра; в карточке — кадр 3:4, в просмотре — крупная версия */
    works.forEach(function (w) {
      w.addEventListener('click', function () {
        var visible = works.filter(function (node) { return !node.hidden; });
        var list = visible.map(function (node) {
          var img = $('img', node);
          return {
            src: img.getAttribute('data-full') || img.getAttribute('src'),
            alt: img.getAttribute('alt') || '',
            title: $('.work__title', node).textContent,
            meta: $('.work__meta', node).textContent
          };
        });
        open(list, visible.indexOf(w), 'work');
      });
    });

    /* сертификаты: все страницы всех документов подряд, у многостраничного — номер страницы */
    var docItems = [];
    var docStart = [];                  // с какого кадра начинается каждый документ

    docs.forEach(function (d) {
      var pages = d.getAttribute('data-pages').trim().split(/\s+/);
      var alt = $('img', d).getAttribute('alt') || '';
      var many = pages.length > 1;
      docStart.push(docItems.length);
      pages.forEach(function (src, i) {
        docItems.push({
          src: src,
          alt: alt + (many ? ', страница ' + (i + 1) : ''),
          title: d.getAttribute('data-title'),
          meta: d.getAttribute('data-meta') + (many ? ' Страница ' + (i + 1) + ' из ' + pages.length + '.' : ''),
          doc: true
        });
      });
    });

    docs.forEach(function (d, i) {
      d.addEventListener('click', function () { open(docItems, docStart[i], 'doc'); });
    });

    $('.lightbox__close', lightbox).addEventListener('click', close);
    lbPrev.addEventListener('click', function () { step(-1); });
    lbNext.addEventListener('click', function () { step(1); });
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) close();
    });

    // на телефоне листаем пальцем; двумя пальцами — это зум, его не трогаем
    var touchX = null;
    var touchY = 0;
    lightbox.addEventListener('touchstart', function (e) {
      touchX = e.touches.length === 1 ? e.touches[0].clientX : null;
      touchY = e.touches.length === 1 ? e.touches[0].clientY : 0;
    }, { passive: true });
    lightbox.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      var dy = e.changedTouches[0].clientY - touchY;
      var zoomed = window.visualViewport && window.visualViewport.scale > 1.01;
      touchX = null;
      if (!zoomed && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
    });

    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
  }

  /* ==================================================================
     4b. Отзывы — лента листается свайпом, стрелками и с клавиатуры
     ------------------------------------------------------------------
     Без автопрокрутки: длинный текст в движении не прочитать.
     ================================================================== */
  var track = $('[data-reviews]');

  if (track) {
    var revPrev = $('[data-rev-prev]');
    var revNext = $('[data-rev-next]');
    var revThumb = $('[data-rev-progress]');
    var smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // шаг — одна карточка вместе с промежутком
    function cardStep() {
      var card = track.firstElementChild;
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return card ? card.getBoundingClientRect().width + gap : track.clientWidth;
    }

    function updateReviews() {
      var x = track.scrollLeft;
      var max = track.scrollWidth - track.clientWidth;
      if (revPrev) revPrev.disabled = x <= 2;
      if (revNext) revNext.disabled = x >= max - 2;
      if (revThumb) {
        revThumb.style.width = (track.clientWidth / track.scrollWidth * 100) + '%';
        revThumb.style.transform = 'translateX(' + (x / track.clientWidth * 100) + '%)';
      }
    }

    function slide(dir) {
      track.scrollBy({ left: dir * cardStep(), behavior: smooth ? 'smooth' : 'auto' });
    }

    if (revPrev) revPrev.addEventListener('click', function () { slide(-1); });
    if (revNext) revNext.addEventListener('click', function () { slide(1); });
    track.addEventListener('scroll', updateReviews, { passive: true });
    window.addEventListener('resize', updateReviews);
    updateReviews();
  }

  /* ==================================================================
     5. Цели Яндекс.Метрики
     ------------------------------------------------------------------
     Заявок нет, поэтому конверсия считается по обращениям: клик по
     телефону и переходы в мессенджеры. Цели с такими же названиями
     нужно создать в интерфейсе Метрики.
     ================================================================== */
  $$('a[href^="tel:"]').forEach(function (a) {
    a.addEventListener('click', function () { reachGoal('phone_click'); });
  });

  /* кнопки «Записаться на замер» ведут к блоку связи — считаем нажатия.
     Только кнопки: пункт меню «Контакты» ведёт туда же, но это не запись. */
  $$('a.btn[href="#svyaz"]').forEach(function (a) {
    a.addEventListener('click', function () { reachGoal('zamer_cta'); });
  });

  var MESSENGERS = { 'max.ru': 'max_click', 'vk.ru': 'vk_click' };

  $$('a[href^="http"]').forEach(function (a) {
    for (var host in MESSENGERS) {
      if (a.href.indexOf(host) !== -1) {
        (function (goal) {
          a.addEventListener('click', function () { reachGoal(goal); });
        })(MESSENGERS[host]);
        break;
      }
    }
  });

  /* калькулятору нужен доступ к целям — смета копируется там */
  window.DaR = { reachGoal: reachGoal };

  /* ==================================================================
     6. Появление секций при скролле
     ================================================================== */
  var reveals = $$('.reveal');

  if (reveals.length && 'IntersectionObserver' in window &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
      /* положительный нижний отступ: блок «проявляется» ещё до того,
         как попал в экран — при быстрой прокрутке не видно пустых мест */
    }, { rootMargin: '200px 0px 300px 0px', threshold: 0 });

    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ==================================================================
     7. Заглушки вместо ненайденных фото
     ------------------------------------------------------------------
     Пока реальные фото не залиты в img/, битая картинка подменяется
     аккуратной SVG-заглушкой с подписью из data-ph.
     Когда фото появятся — этот блок просто перестанет срабатывать.
     ================================================================== */
  function placeholder(text, w, h) {
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#3C332C"/><stop offset="1" stop-color="#2B2521"/>' +
      '</linearGradient></defs>' +
      '<rect width="' + w + '" height="' + h + '" fill="url(#g)"/>' +
      '<rect x="14" y="14" width="' + (w - 28) + '" height="' + (h - 28) + '" fill="none" ' +
      'stroke="#C8A063" stroke-opacity=".3" stroke-width="1.5" rx="8"/>' +
      '<path d="M' + (w / 2 - 34) + ' ' + (h / 2 - 16) + 'h68" stroke="#C8A063" stroke-opacity=".75" stroke-width="3" stroke-linecap="round"/>' +
      '<text x="50%" y="' + (h / 2 + 18) + '" text-anchor="middle" fill="#F0D9A8" fill-opacity=".85" ' +
      'font-family="Onest, sans-serif" font-size="' + Math.max(13, Math.round(w / 28)) + '" font-weight="600">' +
      text.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</text>' +
      '<text x="50%" y="' + (h / 2 + 42) + '" text-anchor="middle" fill="#FAF8F5" fill-opacity=".4" ' +
      'font-family="Onest, sans-serif" font-size="' + Math.max(11, Math.round(w / 40)) + '">фото с объекта</text>' +
      '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function applyPlaceholder(img) {
    img.removeAttribute('data-full');       // крупной версии тоже нет — в просмотре будет заглушка
    img.src = placeholder(img.dataset.ph, +img.getAttribute('width') || 600, +img.getAttribute('height') || 450);
  }

  $$('img[data-ph]').forEach(function (img) {
    img.addEventListener('error', function handle() {
      img.removeEventListener('error', handle);
      applyPlaceholder(img);
    });
    // картинка могла не загрузиться ещё до того, как скрипт с defer отработал
    if (img.complete && img.naturalWidth === 0) applyPlaceholder(img);
  });

  /* год в футере */
  var year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
