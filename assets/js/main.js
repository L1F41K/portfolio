/* ============================================================
   antoweb — портфолио · интерактив
   Без зависимостей. Всё лениво и с учётом prefers-reduced-motion.
   ============================================================ */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Год в футере ---------- */
  const yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Прогресс скролла ---------- */
  const progress = document.querySelector('[data-progress]');
  const nav = document.querySelector('[data-nav]');
  let ticking = false;

  function onScroll() {
    const st = window.scrollY;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (h > 0 ? (st / h) * 100 : 0) + '%';
    if (nav) nav.toggleAttribute('data-scrolled', st > 20);
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---------- Мобильное меню ---------- */
  const burger = document.querySelector('[data-burger]');
  const menu = document.querySelector('[data-menu]');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      const open = nav.toggleAttribute('data-open');
      burger.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    menu.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        nav.removeAttribute('data-open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  /* ---------- Появление секций (reveal) ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  revealEls.forEach((el) => {
    const d = el.getAttribute('data-reveal-delay');
    if (d) el.style.setProperty('--d', d);
  });
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('in'));
  } else {
    const revealIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach((el) => revealIO.observe(el));
  }

  /* ---------- Счётчики в статистике ---------- */
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !reduceMotion) {
    const countIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-count'), 10);
        const suffix = (el.textContent.match(/[^\d]+$/) || [''])[0];
        let cur = 0;
        const step = Math.max(1, Math.round(target / 40));
        const tick = () => {
          cur = Math.min(target, cur + step);
          el.textContent = cur + suffix;
          if (cur < target) requestAnimationFrame(tick);
        };
        tick();
        countIO.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => countIO.observe(el));
  }

  /* ---------- Ленивая загрузка iframe проектов ---------- */
  const viewports = document.querySelectorAll('[data-viewport]');

  const BASE_WIDTH = 1440; // логическая (десктопная) ширина сайта внутри iframe

  function fitFrame(vp) {
    const frame = vp.querySelector('.browser__frame');
    if (!frame) return;
    const w = vp.clientWidth;
    const h = vp.clientHeight;
    if (!w) return;
    // ширину холста можно переопределить на конкретном проекте: data-base="1600"
    const base = parseInt(frame.dataset.base, 10) || BASE_WIDTH;
    const scale = w / base;
    frame.style.setProperty('--fw', base + 'px');
    frame.style.setProperty('--fh', (h / scale) + 'px');
    frame.style.setProperty('--fs', scale);
  }

  function loadFrame(vp) {
    const frame = vp.querySelector('.browser__frame');
    if (frame && frame.dataset.src && !frame.src) {
      fitFrame(vp);
      frame.addEventListener('load', () => {
        fitFrame(vp);
        frame.classList.add('is-fitted');
      }, { once: true });
      frame.src = frame.dataset.src;
    }
  }

  if ('IntersectionObserver' in window) {
    const frameIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadFrame(entry.target);
          frameIO.unobserve(entry.target);
        }
      });
    }, { rootMargin: '200px 0px' });
    viewports.forEach((vp) => { if (vp.querySelector('.browser__frame')) frameIO.observe(vp); });
  } else {
    viewports.forEach(loadFrame);
  }

  // Пересчёт масштаба при ресайзе
  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => viewports.forEach(fitFrame), 150);
  }, { passive: true });

  /* ---------- «Живой просмотр» — включение интерактива ---------- */
  document.querySelectorAll('[data-activate]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const vp = btn.closest('[data-viewport]');
      loadFrame(vp);
      vp.setAttribute('data-live', '');
    });
  });

  /* ---------- Магнитные кнопки (только на устройствах с мышью) ---------- */
  if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      const strength = 18;
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width - 0.5) * strength;
        const y = ((e.clientY - r.top) / r.height - 0.5) * strength;
        el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- Наклон карточек + прожектор под курсором ---------- */
  if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    // Карточки «о себе» и шаги процесса: 3D-наклон + световое пятно.
    document.querySelectorAll('[data-tilt]').forEach((el) => {
      let rect = null, raf = 0, cx = 0, cy = 0;
      const apply = () => {
        raf = 0;
        const px = cx / rect.width, py = cy / rect.height;
        el.style.setProperty('--mx', (px * 100) + '%');
        el.style.setProperty('--my', (py * 100) + '%');
        const ry = (px - 0.5) * 9;       // поворот вокруг Y
        const rx = (0.5 - py) * 9;       // поворот вокруг X
        el.style.transform =
          'perspective(760px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' +
          ry.toFixed(2) + 'deg) translateY(-6px)';
      };
      el.addEventListener('pointerenter', () => { rect = el.getBoundingClientRect(); });
      el.addEventListener('pointermove', (e) => {
        if (!rect) rect = el.getBoundingClientRect();
        cx = e.clientX - rect.left; cy = e.clientY - rect.top;
        if (!raf) raf = requestAnimationFrame(apply);
      });
      el.addEventListener('pointerleave', () => {
        rect = null;
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        el.style.transform = '';
      });
    });

    // Мокапы браузера: только световое пятно, без наклона (iframe не трогаем).
    document.querySelectorAll('[data-spot]').forEach((el) => {
      let rect = null, raf = 0, cx = 0, cy = 0;
      const apply = () => {
        raf = 0;
        el.style.setProperty('--mx', (cx / rect.width * 100) + '%');
        el.style.setProperty('--my', (cy / rect.height * 100) + '%');
      };
      el.addEventListener('pointerenter', () => { rect = el.getBoundingClientRect(); });
      el.addEventListener('pointermove', (e) => {
        if (!rect) rect = el.getBoundingClientRect();
        cx = e.clientX - rect.left; cy = e.clientY - rect.top;
        if (!raf) raf = requestAnimationFrame(apply);
      });
      el.addEventListener('pointerleave', () => { rect = null; });
    });
  }

  /* ---------- Плейсхолдеры контактов (Telegram / GitHub) ---------- */
  document.querySelectorAll('[data-edit]').forEach((a) => {
    a.addEventListener('click', (e) => {
      if (a.getAttribute('href') === '#') {
        e.preventDefault();
        alert('Здесь будет ссылка на ' + a.dataset.edit + '. Пришли мне её — вставлю.');
      }
    });
  });
})();
