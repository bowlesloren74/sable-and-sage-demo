/* Sable & Sage demo: page behaviour and scroll motion.
   Everything here is progressive: without GSAP or with reduced motion the page is fully usable. */
(function () {
  window.__ss = true;
  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Header state ---------- */
  var hdr = $('#hdr');
  function onScroll() { hdr.classList.toggle('solid', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var mnav = $('#mnav'), burger = $('.burger'), closeBtn = $('.mnav .close');
  function setMenu(open) {
    mnav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
    (open ? closeBtn : burger).focus({ preventScroll: true });
  }
  burger.addEventListener('click', function () { setMenu(true); });
  closeBtn.addEventListener('click', function () { setMenu(false); });
  $$('#mnav a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && mnav.classList.contains('open')) setMenu(false); });

  /* ---------- Menu tabs ---------- */
  var tabs = $$('.tab');
  function select(t, focus) {
    tabs.forEach(function (x) {
      var on = x === t, panel = document.getElementById(x.getAttribute('aria-controls'));
      x.setAttribute('aria-selected', on);
      x.tabIndex = on ? 0 : -1;
      panel.hidden = !on;
      $$('.grp', panel).forEach(function (g) { g.classList.remove('in'); });
      if (on) requestAnimationFrame(function () { $$('.grp', panel).forEach(function (g) { g.classList.add('in'); }); });
    });
    if (focus) t.focus();
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t); });
    t.addEventListener('keydown', function (e) {
      var n = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (n) { e.preventDefault(); select(tabs[(i + n + tabs.length) % tabs.length], true); }
    });
  });
  $$('[data-tab]').forEach(function (a) { a.addEventListener('click', function () { select(document.getElementById(a.dataset.tab)); }); });

  /* ---------- Reservation form (demo only) ---------- */
  var d = $('#r-date'), now = new Date();
  function iso(x) { return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); }
  d.min = iso(now);
  var f = $('#rform');
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!d.value) { d.focus(); d.style.borderBottomColor = '#D98A6A'; return; }
    var dt = new Date(d.value + 'T12:00:00');
    var err = $('#r-err');
    if (dt.getDay() === 1 || dt.getDay() === 2) { err.textContent = 'We’re closed Mondays and Tuesdays. Please choose another date.'; d.focus(); return; }
    err.textContent = '';
    var day = dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    var g = $('#r-size').value, tm = $('#r-time').value;
    $('#okmsg').textContent = 'Your request for ' + g + (g === '1' ? ' guest' : ' guests') + ' on ' + day + ' at ' + tm + ' has been received. We’ll email you to confirm.';
    f.classList.add('done');
  });

  /* ---------- Motion (GSAP + ScrollTrigger) ---------- */
  var canAnimate = root.classList.contains('motion') && window.gsap && window.ScrollTrigger;
  if (!canAnimate) {
    root.classList.remove('anim');
    usePlainLogo();
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  var mm = gsap.matchMedia();
  var DESK = '(min-width: 1001px)', MOB = '(max-width: 1000px)';

  function usePlainLogo() {
    if (root.classList.contains('logo-fx')) { root.classList.remove('logo-fx'); root.classList.add('logo-plain'); }
  }

  /* Hero: headline lines rise, supporting copy fades in */
  var heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  heroTl
    .fromTo('.hero h1 .ln>span', { y: 0, yPercent: 105 }, { yPercent: 0, duration: 1.4, stagger: 0.14 }, 0.35)
    .to('.hero .h-in', { opacity: 1, y: 0, duration: 1.1, stagger: 0.1 }, 0.6)
    .fromTo('.hero .media img', { scale: 1.08 }, { scale: 1, duration: 2.6, ease: 'power2.out' }, 0);

  /* Hero: slow zoom + drift as you scroll away (gentler on phones) */
  mm.add({ d: DESK, m: MOB }, function (ctx) {
    gsap.to('.hero .media', {
      scale: ctx.conditions.d ? 1.14 : 1.06, yPercent: ctx.conditions.d ? 10 : 4, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
  });

  /* Logo experiment: S&S draws itself in, then flies into the header as you scroll */
  if (root.classList.contains('logo-fx')) {
    var fly = $('#fly'), hm = $('#hmono'), slot = $('#hslot'), hero = $('.hero');
    var fills = $$('#fly .f'), strokes = $$('#fly .s');
    var prog = 0, base = 88, start = { x: 0, y: 0 }, small = window.matchMedia(MOB);
    /* The mark holds its place while x leads and y trails, so it curves out to the left edge before rising
       into the header, rather than crossing the nav links or the wordmark. Phones get a shorter flight. */
    var ex = function (t) { return 1 - Math.pow(1 - t, 2.6); };
    var ey = function (t) { return Math.pow(t, 1.8); };
    function place() {
      var b = slot.getBoundingClientRect();
      var bs = Math.min(b.width, b.height), bx = b.left + (b.width - bs) / 2, by = b.top + (b.height - bs) / 2;
      var sx = ex(prog), sy = ey(prog);
      gsap.set(fly, { x: start.x + (bx - start.x) * sx, y: start.y + (by - start.y) * sy, scale: 1 - (1 - bs / base) * sx });
    }
    function size() {
      var a = hm.getBoundingClientRect();
      base = a.width || 88;
      start = { x: a.left, y: a.top + window.scrollY }; // where the mark sits with the page at the top
      fly.style.width = fly.style.height = base + 'px';
      place();
    }
    size();
    gsap.set(fills, { opacity: 0 });
    strokes.forEach(function (p) { var l = p.getTotalLength(); gsap.set(p, { strokeDasharray: l, strokeDashoffset: l, opacity: 1 }); });
    fly.style.visibility = 'visible';
    gsap.timeline({ delay: 0.15 })
      .to(strokes, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut', stagger: 0.12 })
      .to(fills, { opacity: 1, duration: 0.9, ease: 'power1.out' }, '-=0.5')
      .to(strokes, { opacity: 0, duration: 0.8 }, '-=0.5');
    ScrollTrigger.create({
      trigger: hero, start: 'top top', end: function () { return '+=' + hero.offsetHeight * (small.matches ? 0.3 : 0.55); },
      onUpdate: function (self) { prog = self.progress; place(); },
      onRefresh: function (self) { prog = self.progress; size(); }
    });
    window.addEventListener('scroll', place, { passive: true });
  } else {
    gsap.from('.hmono', { opacity: 0, scale: 0.92, duration: 1.4, ease: 'power2.out', delay: 0.15 });
  }

  /* Intro: the quote lights up word by word as it scrolls into view */
  var bq = $('.intro blockquote');
  (function wrapWords(node) {
    [].slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (w) {
          if (!w) return;
          if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
          var s = document.createElement('span'); s.className = 'w'; s.textContent = w; frag.appendChild(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) wrapWords(n);
    });
  })(bq);
  gsap.fromTo('.intro .w', { opacity: 0.14 }, {
    opacity: 1, stagger: 0.06, ease: 'none',
    scrollTrigger: { trigger: bq, start: 'top 82%', end: 'bottom 45%', scrub: true }
  });

  /* Facts count up once */
  $$('[data-count]').forEach(function (el) {
    var n = +el.dataset.count, pre = el.dataset.prefix || '', o = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter: function () { gsap.to(o, { v: n, duration: 1.6, ease: 'power2.out', onUpdate: function () { el.textContent = pre + Math.round(o.v); } }); }
    });
  });

  /* Generic reveals */
  ScrollTrigger.batch('.rv', {
    start: 'top 88%', once: true,
    onEnter: function (els) { gsap.to(els, { opacity: 1, y: 0, duration: 1.15, ease: 'power3.out', stagger: 0.12 }); }
  });
  $$('.rv-img').forEach(function (el) {
    gsap.to(el, { clipPath: 'inset(0 0 0% 0)', duration: 1.5, ease: 'power4.inOut', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
  });

  /* Desktop-only: floating line art, menu photo parallax, chef story, gallery drift */
  mm.add(DESK, function () {
    $$('.art[data-drift]').forEach(function (el) {
      gsap.to(el, { y: +el.dataset.drift, ease: 'none', scrollTrigger: { trigger: el.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    $$('.art.float').forEach(function (el) {
      gsap.fromTo(el, { x: +el.dataset.from, rotation: +el.dataset.rot, opacity: 0 }, {
        x: 0, rotation: 0, opacity: 0.5, ease: 'none',
        scrollTrigger: { trigger: '#menu', start: 'top bottom', end: 'top 25%', scrub: 1 }
      });
      gsap.to(el, { y: -90, ease: 'none', scrollTrigger: { trigger: '#menu', start: 'top 25%', end: 'bottom top', scrub: true } });
    });
    gsap.fromTo('.menu .par', { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: '#menu', start: 'top bottom', end: 'bottom top', scrub: true } });

    var no = $('#stepno');
    $$('.story .step').forEach(function (s, i) {
      ScrollTrigger.create({
        trigger: s, start: 'top 62%', end: 'bottom 38%',
        onToggle: function (self) { s.classList.toggle('on', self.isActive); if (self.isActive) no.textContent = '0' + (i + 1); }
      });
    });
    gsap.to('.story .pic img', { scale: 1, ease: 'none', scrollTrigger: { trigger: '.story', start: 'top center', end: 'bottom bottom', scrub: true } });

    var strip = $('#strip');
    gsap.fromTo(strip, { x: function () { return window.innerWidth * 0.08; } }, {
      x: function () { return -Math.max(0, strip.scrollWidth - window.innerWidth); }, ease: 'none',
      scrollTrigger: { trigger: '#gallery', start: 'top bottom', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true }
    });
    return function () { $$('.story .step').forEach(function (s) { s.classList.remove('on'); }); };
  });

  /* Events banner slow zoom */
  gsap.to('.banner .zoom', { scale: 1, ease: 'none', scrollTrigger: { trigger: '.banner', start: 'top bottom', end: 'bottom 40%', scrub: true } });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
