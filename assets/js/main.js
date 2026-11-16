/* Lavielle Créations — interactions de la page */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const DATA = window.SITE || { services: [], i18n: {} };
  const root = document.documentElement.dataset.root || '';

  /* Barre de navigation */
  const nav = $('.nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  const links = $('.nav-links');
  const burger = $('.burger');
  burger.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });
  links.addEventListener('click', (e) => { if (e.target.closest('a')) { links.classList.remove('open'); burger.setAttribute('aria-expanded', false); } });

  /* Vidéo d'accueil : relance la lecture si le navigateur l'a bloquée */
  const hv = $('.hero-media video');
  if (hv) {
    hv.muted = true;
    const go = () => { const pr = hv.play(); if (pr && pr.catch) pr.catch(() => {}); };
    go();
    document.addEventListener('visibilitychange', () => { if (!document.hidden) go(); });
  }

  /* Carrousel */
  const track = $('.car-track');
  const cards = $$('.card', track);
  const tabs = $$('.tab');
  const prev = $('[data-car="prev"]'), next = $('[data-car="next"]');
  const step = () => (cards[0] ? cards[0].getBoundingClientRect().width + 20 : 400);
  prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
  next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
  let wanted = null; /* onglet cliqué : reste actif même si le carrousel bute en fin de course */
  const sync = () => {
    const end = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    const i = Math.min(cards.length - 1, Math.round(track.scrollLeft / step()));
    const cur = wanted !== null ? wanted : i;
    tabs.forEach((t, k) => t.classList.toggle('on', k === cur));
    const on = tabs[cur];
    const bar = on && on.parentElement;
    if (bar && bar.scrollWidth > bar.clientWidth + 2) bar.scrollTo({ left: on.offsetLeft - 20, behavior: 'smooth' });
    track.parentElement.classList.toggle('end', end);
    prev.disabled = track.scrollLeft < 4;
    next.disabled = end;
  };
  track.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
  sync();
  let wantedTimer;
  tabs.forEach((t, k) => t.addEventListener('click', () => {
    wanted = k; clearTimeout(wantedTimer);
    wantedTimer = setTimeout(() => { wanted = null; }, 900);
    track.scrollTo({ left: k * step(), behavior: 'smooth' });
    sync();
  }));
  track.addEventListener('pointerdown', () => { wanted = null; });

  /* Fenêtre vidéo */
  const modal = $('.modal');
  const player = $('.player', modal);
  const thumbs = $('.thumbs', modal);
  const mTitle = $('#modal-title'), mSub = $('#modal-sub');
  let lastFocus = null;
  const embed = (v) => {
    const start = v.start ? '&start=' + v.start : '';
    player.classList.toggle('v', !!v.vertical);
    player.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + v.id + '?autoplay=1&rel=0&playsinline=1' + start +
      '" title="' + v.title.replace(/"/g, '&quot;') + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>';
    mSub.textContent = v.title;
  };
  const openModal = (title, videos, index) => {
    lastFocus = document.activeElement;
    mTitle.textContent = title;
    thumbs.innerHTML = '';
    if (videos.length > 1) {
      videos.forEach((v, k) => {
        const b = document.createElement('button');
        b.className = 'thumb' + (k === index ? ' on' : '');
        b.type = 'button';
        b.innerHTML = '<div class="thumb-img"><img src="' + root + 'assets/img/yt/' + v.id + '.webp" alt="" loading="lazy"><span class="play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span></div><span>' + v.title + '</span>';
        b.addEventListener('click', () => { $$('.thumb', thumbs).forEach((x) => x.classList.remove('on')); b.classList.add('on'); embed(v); });
        thumbs.appendChild(b);
      });
    }
    thumbs.style.display = videos.length > 1 ? '' : 'none';
    embed(videos[index]);
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    $('.close', modal).focus();
  };
  const closeModal = () => {
    modal.classList.remove('open');
    player.innerHTML = '';
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  };
  cards.forEach((c, k) => c.addEventListener('click', () => {
    const s = DATA.services[k];
    openModal(s.name, s.videos, 0);
  }));
  $$('[data-showreel]').forEach((b) => b.addEventListener('click', () => openModal('Showreel', [DATA.showreel], 0)));
  modal.addEventListener('click', (e) => { if (e.target === modal || e.target.closest('.close') || e.target.closest('[data-close]')) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });

  /* Photos en plein écran */
  const lb = $('.lb');
  const shots = $$('.gallery button');
  let cur = 0;
  const show = (k) => {
    cur = (k + shots.length) % shots.length;
    const b = shots[cur];
    $('img', lb).src = b.dataset.full;
    $('img', lb).alt = b.dataset.cap;
    $('p', lb).textContent = b.dataset.cap;
  };
  shots.forEach((b, k) => b.addEventListener('click', () => { lastFocus = b; show(k); lb.classList.add('open'); document.body.style.overflow = 'hidden'; }));
  const closeLb = () => { lb.classList.remove('open'); document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); };
  lb.addEventListener('click', (e) => {
    if (e.target.closest('.p')) show(cur - 1);
    else if (e.target.closest('.n')) show(cur + 1);
    else if (e.target.tagName !== 'IMG') closeLb();
  });
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') show(cur - 1);
    if (e.key === 'ArrowRight') show(cur + 1);
  });

  /* Apparition au défilement */
  const rv = $$('.rv');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    rv.forEach((el) => io.observe(el));
  } else rv.forEach((el) => el.classList.add('in'));

  /* Formulaire de contact (Web3Forms) */
  const form = $('#contact-form');
  const msg = $('.form-msg', form);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('button[type=submit]', form);
    const label = btn.textContent;
    btn.disabled = true; btn.textContent = DATA.i18n.sending;
    msg.className = 'form-msg';
    try {
      const body = JSON.stringify(Object.fromEntries(new FormData(form)));
      const r = await fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body });
      const j = await r.json();
      if (!j.success) throw new Error(j.message || 'error');
      form.reset();
      msg.textContent = DATA.i18n.sent; msg.className = 'form-msg ok';
    } catch (err) {
      msg.textContent = DATA.i18n.error; msg.className = 'form-msg err';
    }
    btn.disabled = false; btn.textContent = label;
  });

  $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
})();
