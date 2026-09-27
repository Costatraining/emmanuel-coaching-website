/* Emmanuel Costa — trainwithcosta.com
   Lightweight, dependency-free interactions. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var saveData = navigator.connection && navigator.connection.saveData;

  /* ---------- Hero entrance (waits briefly for fonts to avoid a jump) ---------- */
  function ready() { root.classList.add('is-ready'); }
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 900); })]).then(function () {
      requestAnimationFrame(ready);
    });
  } else {
    ready();
  }

  /* ---------- Footer year ---------- */
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Nav: scrolled state ---------- */
  var nav = document.querySelector('[data-nav]');
  function onScroll() { nav.classList.toggle('is-scrolled', window.scrollY > 8); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector('[data-menu-toggle]');
  var menu = document.querySelector('[data-menu]');
  var menuLabel = document.querySelector('[data-menu-label]');

  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    menuLabel.textContent = open ? 'Close menu' : 'Open menu';
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('is-locked', open);
    if (open) {
      menu.removeAttribute('inert');
      var first = menu.querySelector('a');
      if (first) setTimeout(function () { first.focus(); }, 60);
    } else {
      menu.setAttribute('inert', '');
    }
  }
  toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });
  window.matchMedia('(min-width: 1080px)').addEventListener('change', function (mq) { if (mq.matches) setMenu(false); });

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('[data-reveal], [data-steps]');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Active nav link ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__links a'));
  if ('IntersectionObserver' in window) {
    var sectionIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          if (a.getAttribute('href') === '#' + entry.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['about', 'coaching', 'process', 'apply', 'faq'].forEach(function (id) {
      var s = document.getElementById(id);
      if (s) sectionIO.observe(s);
    });
  }

  /* ---------- Subtle hero image drift (desktop, motion allowed) ---------- */
  var parallax = document.querySelector('[data-parallax]');
  if (parallax && !reduceMotion.matches && window.matchMedia('(min-width: 1024px) and (pointer: fine)').matches) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = Math.min(window.scrollY, window.innerHeight);
        parallax.style.transform = 'translate3d(0,' + (y * 0.06).toFixed(1) + 'px,0)';
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- Video loops: load when near, play while visible ----------
     Autoplay is blocked in some browsers and settings, so every attempt is
     retried on load, on the next scroll or tap, and through a Play button. */
  var videos = Array.prototype.slice.call(document.querySelectorAll('video[data-src]'));
  if (videos.length) {
    var wantsAutoplay = !reduceMotion.matches && !saveData;

    function loadVideo(v) {
      if (!v.getAttribute('src')) {
        v.muted = true;                 // Safari checks the property, not just the attribute
        v.setAttribute('src', v.dataset.src);
        v.load();
      }
    }

    function tryPlay(v) {
      loadVideo(v);
      var p = v.play();
      if (p && p.then) {
        p.then(function () {
          v.closest('.film').classList.remove('film--blocked');
        }).catch(function () {
          // Autoplay refused: browser setting, low power mode, or a background tab
          v.closest('.film').classList.add('film--blocked');
        });
      }
    }

    // A Play button for anyone whose browser or settings stop autoplay
    videos.forEach(function (v) {
      var film = v.closest('.film');
      if (!film || film.querySelector('.film__play')) return;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'film__play';
      btn.innerHTML = '<span class="sr-only">Play video</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg>';
      btn.addEventListener('click', function () {
        videos.forEach(tryPlay);
        film.classList.remove('film--blocked');
      });
      film.appendChild(btn);
      if (!wantsAutoplay) film.classList.add('film--blocked');
      v.addEventListener('loadeddata', function () {
        if (wantsAutoplay && v.paused) tryPlay(v);
      });
    });

    if (wantsAutoplay && 'IntersectionObserver' in window) {
      var videoIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var v = entry.target;
          if (entry.isIntersecting) {
            tryPlay(v);
          } else if (v.getAttribute('src')) {
            v.pause();
          }
        });
      }, { rootMargin: '600px 0px', threshold: 0.01 });
      videos.forEach(function (v) { videoIO.observe(v); });

      // Browsers that need a gesture: the visitor's first scroll or tap counts
      var retried = false;
      function retryOnGesture() {
        if (retried) return;
        retried = true;
        videos.forEach(function (v) {
          var r = v.getBoundingClientRect();
          if (r.top < window.innerHeight + 600 && r.bottom > -600) tryPlay(v);
        });
      }
      ['scroll', 'pointerdown', 'touchstart', 'keydown'].forEach(function (evt) {
        window.addEventListener(evt, retryOnGesture, { once: true, passive: true });
      });

      // Some browsers pause background tabs; pick the loops back up on return
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState !== 'visible') return;
        videos.forEach(function (v) {
          var r = v.getBoundingClientRect();
          if (v.paused && r.top < window.innerHeight && r.bottom > 0) tryPlay(v);
        });
      });
    } else if (!wantsAutoplay) {
      // Reduced motion or data saver: posters stay until the visitor asks to play
      videos.forEach(function (v) { v.setAttribute('preload', 'none'); });
    }
  }

  /* ---------- "Apply" buttons preselect the service ---------- */
  var serviceSelect = document.getElementById('f-service');
  function selectService(label) {
    if (!serviceSelect || !label) return;
    for (var i = 0; i < serviceSelect.options.length; i++) {
      if (serviceSelect.options[i].text === label) { serviceSelect.selectedIndex = i; clearError(serviceSelect); break; }
    }
  }
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-service]');
    if (trigger) selectService(trigger.getAttribute('data-service'));
  });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.acc__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      btn.closest('.acc').classList.toggle('is-open', !open);
    });
  });

  /* ---------- Application form ---------- */
  var form = document.querySelector('[data-form]');
  if (!form) return;

  var summary = form.querySelector('[data-form-summary]');
  var submitBtn = form.querySelector('[data-submit]');
  var submitLabel = form.querySelector('[data-submit-label]');
  var success = document.querySelector('[data-success]');
  var successTitle = document.querySelector('[data-success-title]');
  var successText = document.querySelector('[data-success-text]');

  var groups = {
    goals: 'Please select at least one goal.',
    level: 'Please select your current fitness level.',
    days: 'Please select how many days per week you can train.',
    where: 'Please select where you plan to train.'
  };

  function errorEl(el) { return document.getElementById(el.id + '-err'); }

  function showError(el, msg) {
    var err = errorEl(el);
    el.setAttribute('aria-invalid', 'true');
    if (err) {
      err.textContent = msg;
      err.hidden = false;
      var ids = (el.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
      if (ids.indexOf(err.id) === -1) ids.push(err.id);
      el.setAttribute('aria-describedby', ids.join(' '));
    }
  }
  function clearError(el) {
    var err = errorEl(el);
    el.removeAttribute('aria-invalid');
    if (err) err.hidden = true;
  }

  function fieldMessage(el) {
    var v = el.validity;
    if (el.type === 'checkbox') return 'Please confirm to continue.';
    if (v.valueMissing) {
      if (el.tagName === 'SELECT') return 'Please choose a coaching service.';
      return 'This field is required.';
    }
    if (v.typeMismatch && el.type === 'email') return 'Please enter a valid email address.';
    if (v.rangeUnderflow || v.rangeOverflow || v.badInput) return 'Please enter a valid age.';
    return '';
  }

  function validateField(el) {
    if (el.checkValidity() && !(el.type === 'tel' && el.value.replace(/\D/g, '').length < 7 && el.value)) {
      clearError(el);
      return true;
    }
    showError(el, el.type === 'tel' && el.value ? 'Please enter a valid phone number.' : fieldMessage(el));
    return false;
  }

  function validateGroup(name) {
    var fs = form.querySelector('[data-group="' + name + '"]');
    var ok = !!fs.querySelector('input:checked');
    var err = document.getElementById(name + '-err');
    fs.classList.toggle('is-invalid', !ok);
    err.hidden = ok;
    if (!ok) err.textContent = groups[name];
    return ok;
  }

  var requiredFields = Array.prototype.slice.call(form.querySelectorAll('[required]'));

  requiredFields.forEach(function (el) {
    el.addEventListener('blur', function () { if (el.value || el.getAttribute('aria-invalid')) validateField(el); });
    el.addEventListener('input', function () { if (el.getAttribute('aria-invalid')) validateField(el); });
    el.addEventListener('change', function () { if (el.getAttribute('aria-invalid')) validateField(el); });
  });
  Object.keys(groups).forEach(function (name) {
    form.querySelector('[data-group="' + name + '"]').addEventListener('change', function (e) {
      if (e.currentTarget.classList.contains('is-invalid')) validateGroup(name);
    });
  });

  function setLoading(on) {
    submitBtn.classList.toggle('is-loading', on);
    submitBtn.setAttribute('aria-busy', String(on));
    submitLabel.textContent = on ? 'Sending…' : 'Submit Application';
  }

  function showSummary(html) {
    summary.innerHTML = html;
    summary.hidden = false;
    summary.focus();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    summary.hidden = true;

    var firstInvalid = null;
    requiredFields.forEach(function (el) {
      if (!validateField(el) && !firstInvalid) firstInvalid = el;
    });
    Object.keys(groups).forEach(function (name) {
      if (!validateGroup(name) && !firstInvalid) firstInvalid = form.querySelector('[data-group="' + name + '"] input');
    });

    if (firstInvalid) {
      firstInvalid.focus({ preventScroll: true });
      firstInvalid.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'center' });
      return;
    }

    // Collect data; join multi-select goals into one readable line.
    var data = {};
    new FormData(form).forEach(function (value, key) {
      if (key === 'botcheck') return;
      data[key] = data[key] ? data[key] + ', ' + value : value;
    });
    if (form.querySelector('[name="botcheck"]').checked) return;
    data.name = data['Full name'];
    data.replyto = data.email;

    setLoading(true);

    fetch(form.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (res) { return res.json().then(function (json) { return { ok: res.ok, json: json }; }); })
      .then(function (r) {
        if (!r.ok || !r.json.success) throw new Error(r.json && r.json.message);
        var first = String(data['Full name'] || '').trim().split(/\s+/)[0];
        if (first) successText.textContent = 'Thank you, ' + first + '. Emmanuel will personally review your application and contact you to discuss your goals and the right coaching option.';
        form.hidden = true;
        success.hidden = false;
        success.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'center' });
        successTitle.focus({ preventScroll: true });
      })
      .catch(function () {
        setLoading(false);
        showSummary('Something went wrong and your application was not sent. Please try again, or email Emmanuel directly at <a href="mailto:costaifbbpro@gmail.com">costaifbbpro@gmail.com</a>.');
      });
  });
})();
