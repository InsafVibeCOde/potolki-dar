/* ==========================================================================
   Натяжные потолки «ДаР» — общая логика
   Меню, FAQ, фильтры портфолио, лайтбокс, цели Метрики, reveal
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
     4. Лайтбокс
     ================================================================== */
  var lightbox = $('.lightbox');

  if (lightbox) {
    var lbImg = $('.lightbox img', lightbox);
    var lbCap = $('.lightbox__cap', lightbox);
    var visible = [];
    var index = 0;
    var lastFocused = null;

    function render() {
      var node = visible[index];
      if (!node) return;
      var img = $('img', node);
      lbImg.src = img.getAttribute('src');
      lbImg.alt = img.getAttribute('alt') || '';
      lbCap.innerHTML = '<b>' + $('.work__title', node).textContent + '</b>' +
                        $('.work__meta', node).textContent;
    }

    function open(node) {
      visible = works.filter(function (w) { return !w.hidden; });
      index = visible.indexOf(node);
      if (index < 0) index = 0;
      lastFocused = document.activeElement;
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
      index = (index + dir + visible.length) % visible.length;
      render();
    }

    works.forEach(function (w) {
      w.addEventListener('click', function () { open(w); });
    });

    $('.lightbox__close', lightbox).addEventListener('click', close);
    $('.lightbox__nav--prev', lightbox).addEventListener('click', function () { step(-1); });
    $('.lightbox__nav--next', lightbox).addEventListener('click', function () { step(1); });
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) close();
    });

    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
  }

  /* ==================================================================
     5. Слайдер «до / после»
     ------------------------------------------------------------------
     Управление — обычный input[type=range] поверх картинок: он же даёт
     перетаскивание мышью и пальцем, и работает с клавиатуры без кода.
     ================================================================== */
  $$('[data-ba]').forEach(function (ba) {
    var range = $('.ba__range', ba);
    if (!range) return;

    function apply() {
      ba.style.setProperty('--pos', range.value + '%');
    }

    range.addEventListener('input', apply);
    apply();
  });

  /* ==================================================================
     6. Цели Яндекс.Метрики
     ------------------------------------------------------------------
     Заявок нет, поэтому конверсия считается по обращениям: клик по
     телефону и переходы в мессенджеры. Цели с такими же названиями
     нужно создать в интерфейсе Метрики.
     ================================================================== */
  $$('a[href^="tel:"]').forEach(function (a) {
    a.addEventListener('click', function () { reachGoal('phone_click'); });
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
     7. Появление секций при скролле
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
     8. Заглушки вместо ненайденных фото
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
