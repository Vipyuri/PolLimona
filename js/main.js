/* ============================================================
   Пол-лимона — интерактив сайта
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Год в подвале ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Шапка: тень при скролле ---------- */
  const header = document.getElementById('header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Мобильное меню ---------- */
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');

  function closeNav() {
    nav.classList.remove('is-open');
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Открыть меню');
  }

  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  });

  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) closeNav();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) closeNav();
  });

  /* ---------- Табы меню ---------- */
  const tabs = Array.from(document.querySelectorAll('.menu__tab'));
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', String(active));
        const panel = document.getElementById(t.dataset.panel);
        if (panel) panel.hidden = !active;
      });
    });
  });

  /* ---------- Появление блоков при скролле ---------- */
  const revealEls = Array.from(document.querySelectorAll(
    '.hero__content, .hero__visual, .section__head, .about__text, .card, ' +
    '.menu__tabs, .menu__panel, .dogs__content, .dogs__paw, .gallery__item, ' +
    '.reviews__rating, .review, .visit__card, .visit__map, .cta__box'
  ));

  // небольшая «лесенка» для карточек в одном ряду
  revealEls.forEach((el) => {
    const siblings = el.parentElement ? Array.from(el.parentElement.children).filter((c) => revealEls.includes(c)) : [];
    const idx = siblings.indexOf(el);
    if (idx > 0) el.style.setProperty('--reveal-delay', (Math.min(idx, 4) * 0.08) + 's');
  });

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -36px 0px' });

    revealEls.forEach((el) => { el.classList.add('reveal'); io.observe(el); });
  }

  /* ---------- Лайтбокс для галереи ---------- */
  const lightbox = document.getElementById('lightbox');
  const lbImg = lightbox.querySelector('img');
  const lbCap = lightbox.querySelector('figcaption');
  const lbClose = lightbox.querySelector('.lightbox__close');
  const lbPrev = lightbox.querySelector('.lightbox__nav--prev');
  const lbNext = lightbox.querySelector('.lightbox__nav--next');

  const slides = Array.from(document.querySelectorAll('.gallery__item img')).map((img) => {
    const fig = img.closest('figure');
    const caption = fig && fig.querySelector('figcaption');
    return { src: img.currentSrc || img.src, alt: img.alt, cap: caption ? caption.textContent : '' };
  });

  let current = 0;
  let lastFocused = null;
  let touchStartX = 0;
  let touchStartY = 0;

  function render() {
    const slide = slides[current];
    if (!slide) return;
    lbImg.src = slide.src;
    lbImg.alt = slide.alt;
    lbCap.textContent = slide.cap;
  }

  function openLightbox(index) {
    current = index;
    render();
    lastFocused = document.activeElement;
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    lbClose.focus();
  }

  function closeLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }

  function step(delta) {
    current = (current + delta + slides.length) % slides.length;
    render();
  }

  document.querySelectorAll('.gallery__item img').forEach((img, i) => {
    img.closest('.gallery__item').addEventListener('click', (e) => {
      e.preventDefault();
      openLightbox(i);
    });
  });

  lbClose.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', () => step(-1));
  lbNext.addEventListener('click', () => step(1));

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (lightbox.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });

  // листание свайпом: горизонтальное движение длиннее 48 px
  lightbox.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  lightbox.addEventListener('touchend', (e) => {
    const touch = e.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
  }, { passive: true });

  /* ---------- Панель «Позвонить / Маршрут» на телефоне ---------- */
  const callbar = document.querySelector('.callbar');
  const hero = document.querySelector('.hero');
  const visit = document.getElementById('visit');

  if (callbar && hero && visit) {
    let queued = false;

    // панель видна после первого экрана и прячется в блоке контактов
    const updateCallbar = () => {
      queued = false;
      const vh = window.innerHeight;
      const pastHero = hero.getBoundingClientRect().bottom < vh * 0.55;
      const beforeContacts = visit.getBoundingClientRect().top > vh * 0.8;
      callbar.classList.toggle('is-visible', pastHero && beforeContacts);
    };

    const queueCallbarUpdate = () => {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(updateCallbar);
    };

    window.addEventListener('scroll', queueCallbarUpdate, { passive: true });
    window.addEventListener('resize', queueCallbarUpdate);
    window.addEventListener('load', queueCallbarUpdate);
    queueCallbarUpdate();
  }
})();
